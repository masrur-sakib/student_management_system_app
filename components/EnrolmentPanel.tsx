'use client';

import React, { useState } from 'react';
import { EnrolmentStatusType, ProgrammeDTO, StudentDTO } from '@/lib/types';

interface Props {
  programmes: ProgrammeDTO[];
  students: StudentDTO[];
  loading: boolean;
  q: string;
  programmeFilter: string;
  statusFilter: string;
  onSearchChange: (val: string) => void;
  onProgrammeFilterChange: (val: string) => void;
  onStatusFilterChange: (val: string) => void;
  onRefresh: () => Promise<void>;
  onNotify: (type: 'ok' | 'err', text: string) => void;
}

export function EnrolmentPanel({
  programmes,
  students,
  loading,
  q,
  programmeFilter,
  statusFilter,
  onSearchChange,
  onProgrammeFilterChange,
  onStatusFilterChange,
  onRefresh,
  onNotify,
}: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('2001-05-15');
  const [academicYear, setAcademicYear] = useState('2026');
  const [programmeId, setProgrammeId] = useState('');
  const [status, setStatus] = useState<EnrolmentStatusType>('ENROLLED');
  const [submitting, setSubmitting] = useState(false);

  const selectedProgId = programmeId || programmes[0]?.id || '';

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          dateOfBirth,
          academicYear,
          programmeId: selectedProgId,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        return onNotify('err', data.error || 'Failed to enrol student');

      setFullName('');
      setEmail('');
      onNotify(
        'ok',
        `Enrolled ${data.student.fullName} (${data.student.studentCode})`,
      );
      await onRefresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusUpdate(
    studentId: string,
    nextStatus: EnrolmentStatusType,
  ) {
    const res = await fetch(`/api/students/${studentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    const data = await res.json();
    if (!res.ok)
      return onNotify('err', data.error || 'Failed to update status');
    onNotify('ok', 'Enrolment status updated');
    await onRefresh();
  }

  return (
    <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
      <h2 className='text-lg font-semibold text-slate-900'>
        Student Enrolment
      </h2>
      <p className='mt-1 text-sm text-slate-500'>
        Create student records with auto-generated Student IDs, filter records,
        and manage statuses.
      </p>

      <form onSubmit={handleCreate} className='mt-4 grid gap-3 md:grid-cols-6'>
        <input
          required
          placeholder='Full name'
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className='rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2'
        />
        <input
          required
          type='email'
          placeholder='Email address'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2'
        />
        <input
          required
          type='date'
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className='rounded-lg border border-slate-300 px-3 py-2 text-sm'
        />
        <input
          required
          placeholder='Academic year (e.g. 2026)'
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
          className='rounded-lg border border-slate-300 px-3 py-2 text-sm'
        />
        <select
          value={selectedProgId}
          onChange={(e) => setProgrammeId(e.target.value)}
          className='rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2'
        >
          {programmes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.code}) — £{p.tuitionFee.toFixed(0)}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as EnrolmentStatusType)}
          className='rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2'
        >
          <option value='ENROLLED'>Enrolled</option>
          <option value='DEFERRED'>Deferred</option>
          <option value='WITHDRAWN'>Withdrawn</option>
          <option value='COMPLETED'>Completed</option>
        </select>
        <button
          type='submit'
          disabled={submitting}
          className='rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 md:col-span-2'
        >
          {submitting ? 'Enrolling...' : 'Enrol Student'}
        </button>
      </form>

      {/* Light-colored divider separating the form from filter & student list */}
      <hr className='my-6 border-slate-200' />

      <div className='flex flex-wrap gap-3'>
        <input
          placeholder='Search by name, ID (SMS-2026-...), or email...'
          value={q}
          onChange={(e) => onSearchChange(e.target.value)}
          className='min-w-[240px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm'
        />
        <select
          value={programmeFilter}
          onChange={(e) => onProgrammeFilterChange(e.target.value)}
          className='rounded-lg border border-slate-300 px-3 py-2 text-sm'
        >
          <option value=''>All Programmes</option>
          {programmes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className='rounded-lg border border-slate-300 px-3 py-2 text-sm'
        >
          <option value=''>All Statuses</option>
          <option value='ENROLLED'>Enrolled</option>
          <option value='DEFERRED'>Deferred</option>
          <option value='WITHDRAWN'>Withdrawn</option>
          <option value='COMPLETED'>Completed</option>
        </select>
      </div>

      <div className='mt-4 overflow-x-auto'>
        <table className='w-full border-collapse text-left text-sm'>
          <thead>
            <tr className='border-b border-slate-200 text-xs uppercase text-slate-500'>
              <th className='py-3 pr-4'>Student ID</th>
              <th className='py-3 pr-4'>Student</th>
              <th className='py-3 pr-4'>Programme</th>
              <th className='py-3 pr-4'>Status</th>
              <th className='py-3 pr-4'>Fee Balance</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100'>
            {loading ? (
              <tr>
                <td colSpan={5} className='py-6 text-center text-slate-400'>
                  Loading students...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={5} className='py-6 text-center text-slate-400'>
                  No students match your current filter.
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} className='hover:bg-slate-50/70'>
                  <td className='py-3 pr-4 font-mono text-xs font-semibold text-slate-800'>
                    {s.studentCode}
                  </td>
                  <td className='py-3 pr-4'>
                    <div className='font-medium text-slate-900'>
                      {s.fullName}
                    </div>
                    <div className='text-xs text-slate-500'>{s.email}</div>
                  </td>
                  <td className='py-3 pr-4'>
                    <div>{s.programme.name}</div>
                    <div className='text-xs text-slate-500'>
                      Year {s.academicYear}
                    </div>
                  </td>
                  <td className='py-3 pr-4'>
                    <select
                      value={s.status}
                      onChange={(e) =>
                        handleStatusUpdate(
                          s.id,
                          e.target.value as EnrolmentStatusType,
                        )
                      }
                      className='rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium'
                    >
                      <option value='ENROLLED'>Enrolled</option>
                      <option value='DEFERRED'>Deferred</option>
                      <option value='WITHDRAWN'>Withdrawn</option>
                      <option value='COMPLETED'>Completed</option>
                    </select>
                  </td>
                  <td className='py-3 pr-4'>
                    <div className='text-xs text-slate-600'>
                      Fee: £{s.fee.tuitionFee.toFixed(2)} • Paid: £
                      {s.fee.totalPaid.toFixed(2)}
                    </div>
                    <div className='mt-0.5 flex items-center gap-2'>
                      <span className='font-semibold text-slate-900'>
                        Balance: £{s.fee.balance.toFixed(2)}
                      </span>
                      {s.fee.isOverdue && (
                        <span className='rounded bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700'>
                          OVERDUE
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
