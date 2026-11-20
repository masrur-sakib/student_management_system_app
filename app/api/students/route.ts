// app/api/students/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatStudentCode } from '@/lib/domain';
import { EnrolmentStatus } from '../../../generated/prisma/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, dateOfBirth, programmeId, academicYear, status } =
      body;

    if (!fullName || !email || !dateOfBirth || !programmeId || !academicYear) {
      return NextResponse.json(
        {
          error:
            'Full name, email, date of birth, programme, and academic year are required',
        },
        { status: 400 },
      );
    }

    const programme = await prisma.programme.findUnique({
      where: { id: programmeId },
    });
    if (!programme) {
      return NextResponse.json(
        { error: 'Selected programme not found' },
        { status: 404 },
      );
    }

    const validStatus: EnrolmentStatus = Object.values(
      EnrolmentStatus,
    ).includes(status)
      ? status
      : EnrolmentStatus.ENROLLED;

    const student = await prisma.$transaction(async (tx) => {
      const tempCode = `TEMP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const created = await tx.student.create({
        data: {
          studentCode: tempCode,
          fullName: String(fullName).trim(),
          email: String(email).trim().toLowerCase(),
          dateOfBirth: new Date(dateOfBirth),
          academicYear: String(academicYear).trim(),
          status: validStatus,
          programmeId,
        },
      });

      const finalCode = formatStudentCode(created.seqNumber);
      return tx.student.update({
        where: { id: created.id },
        data: { studentCode: finalCode },
        include: { programme: true },
      });
    });

    return NextResponse.json({ student }, { status: 201 });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2002') {
      return NextResponse.json(
        { error: 'A student with this email already exists' },
        { status: 409 },
      );
    }
    console.error('POST /api/students error:', err);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 },
    );
  }
}
