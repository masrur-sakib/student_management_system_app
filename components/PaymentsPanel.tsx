'use client';

import React, { useEffect, useState } from 'react';
import { StudentDTO } from '@/lib/types';

interface Props {
  students: StudentDTO[];
  onRefresh: () => Promise<void>;
  onNotify: (type: 'ok' | 'err', text: string) => void;
}

export function PaymentsPanel({ students, onRefresh, onNotify }: Props) {
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [paidAt, setPaidAt] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const id = queueMicrotask(() => {
      setPaidAt((prev) => prev || new Date().toISOString().slice(0, 10));
    });
    void id;
  }, []);

  const selectedStudentId = studentId || students[0]?.id || '';

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const effectiveDate = paidAt || new Date().toISOString().slice(0, 10);
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          amount,
          paidAt: effectiveDate,
          referenceNo,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        return onNotify('err', data.error || 'Failed to record payment');

      setAmount('');
      setReferenceNo('');
      onNotify('ok', `Recorded payment (${data.payment.referenceNo})`);
      await onRefresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
      <h2 className='text-lg font-semibold text-slate-900'>Fees & Payments</h2>
      <p className='mt-1 text-sm text-slate-500'>
        Record payments with a unique reference number to update outstanding
        balances in real time.
      </p>

      <form onSubmit={handlePayment} className='mt-4 grid gap-3 md:grid-cols-5'>
        <select
          value={selectedStudentId}
          onChange={(e) => setStudentId(e.target.value)}
          className='rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2'
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.studentCode} — {s.fullName} (Due: £{s.fee.balance.toFixed(2)})
            </option>
          ))}
        </select>
        <input
          required
          type='number'
          step='0.01'
          min='0.01'
          placeholder='Amount (£)'
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className='rounded-lg border border-slate-300 px-3 py-2 text-sm'
        />
        <input
          required
          type='date'
          value={paidAt}
          onChange={(e) => setPaidAt(e.target.value)}
          className='rounded-lg border border-slate-300 px-3 py-2 text-sm'
        />
        <div className='flex gap-2'>
          <input
            required
            placeholder='Ref # (e.g. PAY-2026-2001)'
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
            className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm'
          />
          <button
            type='submit'
            disabled={submitting}
            className='shrink-0 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50'
          >
            {submitting ? '...' : 'Record'}
          </button>
        </div>
      </form>
    </section>
  );
}
