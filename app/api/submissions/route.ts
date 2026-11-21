import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB (safely under Vercel's 4.5 MB body limit)

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const studentId = searchParams.get('studentId')?.trim();
    const assessmentId = searchParams.get('assessmentId')?.trim();

    const submissions = await prisma.submission.findMany({
      where: {
        ...(studentId ? { studentId } : {}),
        ...(assessmentId ? { assessmentId } : {}),
      },
      include: {
        student: true,
        assessment: true,
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('GET /api/submissions failed:', error);
    return NextResponse.json(
      { error: 'Failed to load submissions' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const studentId = String(formData.get('studentId') || '').trim();
    const assessmentId = String(formData.get('assessmentId') || '').trim();
    const fileEntry = formData.get('file');

    if (!studentId || !assessmentId) {
      return NextResponse.json(
        { error: 'Student ID and Assessment ID are required.' },
        { status: 400 },
      );
    }

    if (!(fileEntry instanceof File) || fileEntry.size === 0) {
      return NextResponse.json(
        { error: 'Please select a non-empty file to upload.' },
        { status: 400 },
      );
    }

    if (fileEntry.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size must be 4 MB or smaller.' },
        { status: 413 },
      );
    }

    const [student, assessment] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId } }),
      prisma.assessment.findUnique({ where: { id: assessmentId } }),
    ]);

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found.' },
        { status: 404 },
      );
    }

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found.' },
        { status: 404 },
      );
    }

    // Enforce one submission per student per assessment
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        studentId,
        assessmentId,
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'You have already submitted work for this assessment.' },
        { status: 409 },
      );
    }

    const now = new Date();
    const deadline = assessment.deadline ? new Date(assessment.deadline) : null;
    const isLate = deadline ? now > deadline : false;

    const safeName = sanitizeFileName(fileEntry.name);
    const blobPath = `submissions/${assessmentId}/${studentId}/${Date.now()}-${safeName}`;

    // Upload directly to Vercel Blob (uses BLOB_READ_WRITE_TOKEN automatically)
    const blob = await put(blobPath, fileEntry, {
      access: 'private',
      contentType: fileEntry.type || 'application/octet-stream',
    });

    const submission = await prisma.submission.create({
      data: {
        studentId,
        assessmentId,
        filePath: blob.url,
        fileName: fileEntry.name,
        mimeType: fileEntry.type || 'application/octet-stream',
        isLate,
        submittedAt: now,
      },
      include: {
        student: true,
        assessment: true,
      },
    });

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    console.error('POST /api/submissions failed:', error);
    return NextResponse.json(
      { error: 'Failed to upload submission file.' },
      { status: 500 },
    );
  }
}
