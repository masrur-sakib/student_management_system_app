import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { studentId, amount, paidAt, referenceNo } = await req.json();
    const numericAmount = Number(amount);

    if (
      !studentId ||
      !referenceNo ||
      Number.isNaN(numericAmount) ||
      numericAmount <= 0
    ) {
      return NextResponse.json(
        {
          error: 'Student, positive amount, and reference number are required',
        },
        { status: 400 },
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const payment = await prisma.payment.create({
      data: {
        studentId,
        amount: numericAmount,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        referenceNo: String(referenceNo).trim(),
      },
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2002') {
      return NextResponse.json(
        { error: 'Payment reference number already exists' },
        { status: 409 },
      );
    }
    console.error('POST /api/payments error:', err);
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 },
    );
  }
}
