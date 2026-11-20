'use client';

import { StudentDTO } from '@/lib/types';

export function OverdueBanner({ students }: { students: StudentDTO[] }) {
  const overdue = students.filter((s) => s.fee.isOverdue);
  if (overdue.length === 0) return null;

  return (
    <div className='rounded-xl border border-amber-300 bg-amber-50 p-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div>
          <h2 className='text-sm font-semibold text-amber-950'>
            Overdue Fee Alert ({overdue.length}{' '}
            {overdue.length === 1 ? 'student' : 'students'})
          </h2>
          <p className='mt-0.5 text-xs text-amber-800'>
            {overdue
              .map(
                (s) =>
                  `${s.fullName} (${s.studentCode}) — £${s.fee.balance.toFixed(2)} overdue`,
              )
              .join(' • ')}
          </p>
        </div>
        <span className='rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-950'>
          Overdue Balance
        </span>
      </div>
    </div>
  );
}
