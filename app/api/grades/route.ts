// app/api/grades/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { assessmentId, studentId, score, isPublished } = await req.json();
    const numericScore = Number(score);

    if (
      !assessmentId ||
      !studentId ||
      Number.isNaN(numericScore) ||
      numericScore < 0 ||
      numericScore > 100
    ) {
      return NextResponse.json(
        {
          error:
            'Assessment, student, and a numeric score between 0 and 100 are required',
        },
        { status: 400 },
      );
    }

    const grade = await prisma.grade.upsert({
      where: { assessmentId_studentId: { assessmentId, studentId } },
      update: {
        score: numericScore,
        isPublished: Boolean(isPublished),
      },
      create: {
        assessmentId,
        studentId,
        score: numericScore,
        isPublished: Boolean(isPublished),
      },
    });

    return NextResponse.json({ grade });
  } catch (err) {
    console.error('POST /api/grades error:', err);
    return NextResponse.json(
      { error: 'Failed to save grade' },
      { status: 500 },
    );
  }
}
