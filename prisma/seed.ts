import 'dotenv/config';
import { PrismaClient, EnrolmentStatus } from '../generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const pastDue = new Date();
  pastDue.setDate(pastDue.getDate() - 14);

  const futureDue = new Date();
  futureDue.setDate(futureDue.getDate() + 30);

  const csProg = await prisma.programme.upsert({
    where: { code: 'MSC-IT' },
    update: {},
    create: {
      code: 'MSC-IT',
      name: 'MSc Information Technology',
      tuitionFee: 6000,
      feeDueDate: pastDue,
    },
  });

  const busProg = await prisma.programme.upsert({
    where: { code: 'BA-MGT' },
    update: {},
    create: {
      code: 'BA-MGT',
      name: 'BA Business Management',
      tuitionFee: 4500,
      feeDueDate: futureDue,
    },
  });

  const studentsData = [
    {
      studentCode: 'SMS-2026-0001',
      fullName: 'Amina Rahman',
      email: 'amina.rahman@example.edu',
      dateOfBirth: new Date('2001-04-12'),
      academicYear: '2026',
      status: EnrolmentStatus.ENROLLED,
      programmeId: csProg.id,
    },
    {
      studentCode: 'SMS-2026-0002',
      fullName: "Liam O'Connor",
      email: 'liam.oconnor@example.edu',
      dateOfBirth: new Date('2000-09-23'),
      academicYear: '2026',
      status: EnrolmentStatus.ENROLLED,
      programmeId: csProg.id,
    },
    {
      studentCode: 'SMS-2026-0003',
      fullName: 'Priya Nair',
      email: 'priya.nair@example.edu',
      dateOfBirth: new Date('2002-01-18'),
      academicYear: '2026',
      status: EnrolmentStatus.DEFERRED,
      programmeId: busProg.id,
    },
    {
      studentCode: 'SMS-2026-0004',
      fullName: 'Mateo Silva',
      email: 'mateo.silva@example.edu',
      dateOfBirth: new Date('1999-11-05'),
      academicYear: '2026',
      status: EnrolmentStatus.COMPLETED,
      programmeId: csProg.id,
    },
    {
      studentCode: 'SMS-2026-0005',
      fullName: 'Hannah Lindqvist',
      email: 'hannah.lindqvist@example.edu',
      dateOfBirth: new Date('2001-07-30'),
      academicYear: '2026',
      status: EnrolmentStatus.ENROLLED,
      programmeId: busProg.id,
    },
  ];

  const createdStudents = [];
  for (const s of studentsData) {
    const student = await prisma.student.upsert({
      where: { email: s.email },
      update: {},
      create: s,
    });
    createdStudents.push(student);
  }

  await prisma.payment.upsert({
    where: { referenceNo: 'PAY-2026-1001' },
    update: {},
    create: {
      studentId: createdStudents[0].id,
      amount: 2500,
      paidAt: new Date('2026-09-10'),
      referenceNo: 'PAY-2026-1001',
    },
  });

  await prisma.payment.upsert({
    where: { referenceNo: 'PAY-2026-1002' },
    update: {},
    create: {
      studentId: createdStudents[1].id,
      amount: 6000,
      paidAt: new Date('2026-09-12'),
      referenceNo: 'PAY-2026-1002',
    },
  });

  await prisma.payment.upsert({
    where: { referenceNo: 'PAY-2026-1003' },
    update: {},
    create: {
      studentId: createdStudents[3].id,
      amount: 6000,
      paidAt: new Date('2026-08-15'),
      referenceNo: 'PAY-2026-1003',
    },
  });

  const pastDeadline = new Date();
  pastDeadline.setDate(pastDeadline.getDate() - 2);

  const openDeadline = new Date();
  openDeadline.setDate(openDeadline.getDate() + 10);

  const a1 = await prisma.assessment.create({
    data: {
      title: 'Distributed Systems Architecture Report',
      module: 'CS702 - Cloud & Distributed Systems',
      deadline: pastDeadline,
      programmeId: csProg.id,
    },
  });

  const a2 = await prisma.assessment.create({
    data: {
      title: 'Organizational Strategy Case Study',
      module: 'BUS401 - Strategic Management',
      deadline: openDeadline,
      programmeId: busProg.id,
    },
  });

  await prisma.grade.upsert({
    where: {
      assessmentId_studentId: {
        assessmentId: a1.id,
        studentId: createdStudents[0].id,
      },
    },
    update: {},
    create: {
      assessmentId: a1.id,
      studentId: createdStudents[0].id,
      score: 76,
      isPublished: true,
    },
  });

  await prisma.grade.upsert({
    where: {
      assessmentId_studentId: {
        assessmentId: a1.id,
        studentId: createdStudents[1].id,
      },
    },
    update: {},
    create: {
      assessmentId: a1.id,
      studentId: createdStudents[1].id,
      score: 54,
      isPublished: false,
    },
  });

  await prisma.grade.upsert({
    where: {
      assessmentId_studentId: {
        assessmentId: a2.id,
        studentId: createdStudents[4].id,
      },
    },
    update: {},
    create: {
      assessmentId: a2.id,
      studentId: createdStudents[4].id,
      score: 65,
      isPublished: true,
    },
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
