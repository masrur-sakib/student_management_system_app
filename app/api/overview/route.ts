import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateFeeSummary } from '@/lib/domain';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const programmeId = (searchParams.get('programmeId') || '').trim();
    const status = (searchParams.get('status') || '').trim();

    const [rawProgrammes, rawStudents, rawAssessments] = await Promise.all([
      prisma.programme.findMany({ orderBy: { name: 'asc' } }),
      prisma.student.findMany({
        include: {
          programme: true,
          payments: { orderBy: { paidAt: 'desc' } },
          grades: {
            include: { assessment: true },
            orderBy: { updatedAt: 'desc' },
          },
          submissions: {
            include: { assessment: true },
            orderBy: { submittedAt: 'desc' },
          },
        },
        orderBy: { seqNumber: 'asc' },
      }),
      prisma.assessment.findMany({
        include: {
          programme: true,
          submissions: {
            include: { student: true },
            orderBy: { submittedAt: 'desc' },
          },
          grades: {
            include: { student: true },
            orderBy: { updatedAt: 'desc' },
          },
        },
        orderBy: { deadline: 'asc' },
      }),
    ]);

    const programmes = rawProgrammes.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      tuitionFee: Number(p.tuitionFee),
      feeDueDate: p.feeDueDate.toISOString(),
    }));

    const students = rawStudents
      .map((s) => {
        const totalPaid = s.payments.reduce(
          (sum, pay) => sum + Number(pay.amount),
          0,
        );
        const tuitionFee = Number(s.programme.tuitionFee);
        const fee = calculateFeeSummary(
          tuitionFee,
          s.programme.feeDueDate,
          totalPaid,
        );

        return {
          id: s.id,
          studentCode: s.studentCode,
          fullName: s.fullName,
          email: s.email,
          dateOfBirth: s.dateOfBirth.toISOString(),
          academicYear: s.academicYear,
          status: s.status,
          programmeId: s.programmeId,
          programme: {
            id: s.programme.id,
            code: s.programme.code,
            name: s.programme.name,
            tuitionFee,
            feeDueDate: s.programme.feeDueDate.toISOString(),
          },
          fee,
          payments: s.payments.map((pay) => ({
            id: pay.id,
            studentId: pay.studentId,
            amount: Number(pay.amount),
            paidAt: pay.paidAt.toISOString(),
            referenceNo: pay.referenceNo,
          })),
          submissions: s.submissions.map((sub) => ({
            id: sub.id,
            assessmentId: sub.assessmentId,
            studentId: sub.studentId,
            fileName: sub.fileName,
            mimeType: sub.mimeType,
            submittedAt: sub.submittedAt.toISOString(),
            isLate: sub.isLate,
            assessmentTitle: sub.assessment.title,
            assessmentModule: sub.assessment.module,
            deadline: sub.assessment.deadline.toISOString(),
          })),
          grades: s.grades.map((g) => ({
            id: g.id,
            assessmentId: g.assessmentId,
            studentId: g.studentId,
            score: g.score,
            isPublished: g.isPublished,
            assessmentTitle: g.assessment.title,
            assessmentModule: g.assessment.module,
          })),
        };
      })
      .filter((s) => {
        if (programmeId && s.programmeId !== programmeId) return false;
        if (status && s.status !== status) return false;
        if (q) {
          const hitName = s.fullName.toLowerCase().includes(q);
          const hitCode = s.studentCode.toLowerCase().includes(q);
          const hitEmail = s.email.toLowerCase().includes(q);
          if (!hitName && !hitCode && !hitEmail) return false;
        }
        return true;
      });

    const assessments = rawAssessments.map((a) => ({
      id: a.id,
      title: a.title,
      module: a.module,
      deadline: a.deadline.toISOString(),
      programmeId: a.programmeId,
      programmeName: a.programme ? a.programme.name : null,
      submissions: a.submissions.map((sub) => ({
        id: sub.id,
        assessmentId: sub.assessmentId,
        studentId: sub.studentId,
        fileName: sub.fileName,
        mimeType: sub.mimeType,
        submittedAt: sub.submittedAt.toISOString(),
        isLate: sub.isLate,
        studentName: sub.student.fullName,
        studentCode: sub.student.studentCode,
      })),
      grades: a.grades.map((g) => ({
        id: g.id,
        assessmentId: g.assessmentId,
        studentId: g.studentId,
        score: g.score,
        isPublished: g.isPublished,
        studentName: g.student.fullName,
        studentCode: g.student.studentCode,
      })),
    }));

    return NextResponse.json({ programmes, students, assessments });
  } catch (err) {
    console.error('GET /api/overview error:', err);
    return NextResponse.json(
      { error: 'Failed to load registry data' },
      { status: 500 },
    );
  }
}
