export type Role = 'STAFF' | 'STUDENT';

export type EnrolmentStatusType =
  | 'ENROLLED'
  | 'DEFERRED'
  | 'WITHDRAWN'
  | 'COMPLETED';

export interface ProgrammeDTO {
  id: string;
  code: string;
  name: string;
  tuitionFee: number;
  feeDueDate: string;
}

export interface PaymentDTO {
  id: string;
  studentId: string;
  amount: number;
  paidAt: string;
  referenceNo: string;
}

export interface SubmissionDTO {
  id: string;
  assessmentId: string;
  studentId: string;
  fileName: string;
  mimeType: string;
  submittedAt: string;
  isLate: boolean;
  studentName?: string;
  studentCode?: string;
  assessmentTitle?: string;
  assessmentModule?: string;
  deadline?: string;
}

export interface GradeDTO {
  id: string;
  assessmentId: string;
  studentId: string;
  score: number;
  isPublished: boolean;
  studentName?: string;
  studentCode?: string;
  assessmentTitle?: string;
  assessmentModule?: string;
}

export interface StudentDTO {
  id: string;
  studentCode: string;
  fullName: string;
  email: string;
  dateOfBirth: string;
  academicYear: string;
  status: EnrolmentStatusType;
  programmeId: string;
  programme: ProgrammeDTO;
  fee: {
    tuitionFee: number;
    totalPaid: number;
    balance: number;
    isOverdue: boolean;
  };
  payments: PaymentDTO[];
  submissions: SubmissionDTO[];
  grades: GradeDTO[];
}

export interface AssessmentDTO {
  id: string;
  title: string;
  module: string;
  deadline: string;
  programmeId: string | null;
  programmeName: string | null;
  submissions: SubmissionDTO[];
  grades: GradeDTO[];
}

export interface OverviewResponse {
  programmes: ProgrammeDTO[];
  students: StudentDTO[];
  assessments: AssessmentDTO[];
}
