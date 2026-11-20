// app/api/students/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EnrolmentStatus } from '../../../../generated/prisma/client';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { status } = await req.json();

    if (!Object.values(EnrolmentStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid enrolment status' },
        { status: 400 },
      );
    }

    const student = await prisma.student.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ student });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2025') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    console.error('PATCH /api/students/[id] error:', err);
    return NextResponse.json(
      { error: 'Failed to update enrolment status' },
      { status: 500 },
    );
  }
}
