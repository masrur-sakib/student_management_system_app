// components/AssessmentsPanel.tsx
'use client';

import React, { useState } from 'react';
import { AssessmentDTO } from '@/lib/types';

interface Props {
  assessments: AssessmentDTO[];
  onRefresh: () => Promise<void>;
  onNotify: (type: 'ok' | 'err', text: string) => void;
}

export function AssessmentsPanel({ assessments, onRefresh, onNotify }: Props) {
  const [title, setTitle] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, module: moduleName, deadline }),
      });
      const data = await res.json();
      if (!res.ok)
        return onNotify('err', data.error || 'Failed to create assessment');

      setTitle('');
      setModuleName('');
      setDeadline('');
      onNotify('ok', `Created assessment "${data.assessment.title}"`);
      await onRefresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
      <h2 className='text-lg font-semibold text-slate-900'>
        Assessments & Submissions
      </h2>
      <p className='mt-1 text-sm text-slate-500'>
        Create assessments with deadlines and review student PDF/DOCX
        submissions.
      </p>

      <form onSubmit={handleCreate} className='mt-4 space-y-3'>
        <input
          required
          placeholder='Assessment title'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm'
        />
        <div className='grid gap-3 sm:grid-cols-2'>
          <input
            required
            placeholder='Module (e.g. CS702 - Cloud Systems)'
            value={moduleName}
            onChange={(e) => setModuleName(e.target.value)}
            className='rounded-lg border border-slate-300 px-3 py-2 text-sm'
          />
          <input
            required
            type='datetime-local'
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className='rounded-lg border border-slate-300 px-3 py-2 text-sm'
          />
        </div>
        <button
          type='submit'
          disabled={submitting}
          className='rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50'
        >
          {submitting ? 'Creating...' : 'Create Assessment'}
        </button>
      </form>

      <div className='mt-6 space-y-3 border-t border-slate-100 pt-4'>
        {assessments.map((a) => (
          <div key={a.id} className='rounded-lg border border-slate-200 p-3'>
            <div className='flex items-start justify-between gap-2'>
              <div>
                <div className='font-medium text-slate-900'>{a.title}</div>
                <div className='text-xs text-slate-500'>
                  {a.module} • Deadline: {new Date(a.deadline).toLocaleString()}
                </div>
              </div>
              <span className='rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700'>
                {a.submissions.length}{' '}
                {a.submissions.length === 1 ? 'submission' : 'submissions'}
              </span>
            </div>

            {a.submissions.length > 0 && (
              <ul className='mt-2 space-y-1 text-xs'>
                {a.submissions.map((sub) => (
                  <li
                    key={sub.id}
                    className='flex items-center justify-between rounded bg-slate-50 px-2.5 py-1.5'
                  >
                    <span>
                      <strong>{sub.studentName}</strong> ({sub.studentCode}) —{' '}
                      {sub.fileName}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 font-semibold ${
                        sub.isLate
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {sub.isLate ? 'LATE' : 'ON TIME'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
