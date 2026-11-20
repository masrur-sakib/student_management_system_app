// app/api/assessments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { title, module, deadline, programmeId } = await req.json();
    if (!title || !module || !deadline) {
      return NextResponse.json(
        { error: 'Assessment title, module, and deadline are required' },
        { status: 400 },
      );
    }

    const parsedDeadline = new Date(deadline);
    if (Number.isNaN(parsedDeadline.getTime())) {
      return NextResponse.json(
        { error: 'Invalid deadline date' },
        { status: 400 },
      );
    }

    const assessment = await prisma.assessment.create({
      data: {
        title: String(title).trim(),
        module: String(module).trim(),
        deadline: parsedDeadline,
        programmeId: programmeId || null,
      },
    });

    return NextResponse.json({ assessment }, { status: 201 });
  } catch (err) {
    console.error('POST /api/assessments error:', err);
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 },
    );
  }
}
