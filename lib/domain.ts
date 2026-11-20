export type Classification = 'Distinction' | 'Merit' | 'Pass' | 'Fail';

export function classifyScore(score: number): Classification {
  if (score >= 70) return 'Distinction';
  if (score >= 60) return 'Merit';
  if (score >= 40) return 'Pass';
  return 'Fail';
}

export function formatStudentCode(
  seq: number,
  year = new Date().getFullYear(),
): string {
  return `SMS-${year}-${String(seq).padStart(4, '0')}`;
}

export function calculateFeeSummary(
  tuitionFee: number,
  feeDueDate: Date | string,
  totalPaid: number,
  now = new Date(),
) {
  const safeFee = Number(tuitionFee) || 0;
  const safePaid = Number(totalPaid) || 0;
  const balance = Math.max(0, Number((safeFee - safePaid).toFixed(2)));
  const isOverdue =
    balance > 0 && now.getTime() > new Date(feeDueDate).getTime();

  return {
    tuitionFee: safeFee,
    totalPaid: safePaid,
    balance,
    isOverdue,
  };
}
