// app/api/submissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const assessmentId = String(formData.get('assessmentId') || '');
    const studentId = String(formData.get('studentId') || '');
    const file = formData.get('file') as File | null;

    if (!assessmentId || !studentId || !file) {
      return NextResponse.json(
        { error: 'Assessment, student, and a PDF or DOCX file are required' },
        { status: 400 },
      );
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_MIMES.has(file.type) && ext !== '.pdf' && ext !== '.docx') {
      return NextResponse.json(
        {
          error:
            'Unsupported file format. Only PDF and DOCX files are allowed.',
        },
        { status: 400 },
      );
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    });
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 },
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const now = new Date();
    const isLate = now.getTime() > new Date(assessment.deadline).getTime();

    const uploadDir =
      process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const safeFileName = `${studentId}_${assessmentId}_${Date.now()}${ext || '.pdf'}`;
    const fullPath = path.join(uploadDir, safeFileName);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(fullPath, bytes);

    const submission = await prisma.submission.upsert({
      where: { assessmentId_studentId: { assessmentId, studentId } },
      update: {
        fileName: file.name,
        filePath: fullPath,
        mimeType: file.type || 'application/octet-stream',
        submittedAt: now,
        isLate,
      },
      create: {
        assessmentId,
        studentId,
        fileName: file.name,
        filePath: fullPath,
        mimeType: file.type || 'application/octet-stream',
        submittedAt: now,
        isLate,
      },
    });

    return NextResponse.json(
      {
        submission: {
          id: submission.id,
          assessmentId: submission.assessmentId,
          studentId: submission.studentId,
          fileName: submission.fileName,
          submittedAt: submission.submittedAt.toISOString(),
          isLate: submission.isLate,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('POST /api/submissions error:', err);
    return NextResponse.json(
      { error: 'Failed to upload submission' },
      { status: 500 },
    );
  }
}
