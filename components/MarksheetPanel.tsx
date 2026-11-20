// components/MarksheetPanel.tsx
'use client';

import React, { useState } from 'react';
import { classifyScore } from '@/lib/domain';
import { AssessmentDTO, GradeDTO, StudentDTO } from '@/lib/types';

interface Props {
  students: StudentDTO[];
  assessments: AssessmentDTO[];
  onRefresh: () => Promise<void>;
  onNotify: (type: 'ok' | 'err', text: string) => void;
}

export function MarksheetPanel({
  students,
  assessments,
  onRefresh,
  onNotify,
}: Props) {
  const [studentId, setStudentId] = useState('');
  const [assessmentId, setAssessmentId] = useState('');
  const [score, setScore] = useState('65');
  const [isPublished, setIsPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedStudentId = studentId || students[0]?.id || '';
  const selectedAssessmentId = assessmentId || assessments[0]?.id || '';

  async function handleSaveGrade(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          assessmentId: selectedAssessmentId,
          score: Number(score),
          isPublished,
        }),
      });
      const data = await res.json();
      if (!res.ok) return onNotify('err', data.error || 'Failed to save grade');
      onNotify(
        'ok',
        `Grade saved (${data.grade.isPublished ? 'Published' : 'Withheld'})`,
      );
      await onRefresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTogglePublish(g: GradeDTO) {
    const res = await fetch('/api/grades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: g.studentId,
        assessmentId: g.assessmentId,
        score: g.score,
        isPublished: !g.isPublished,
      }),
    });
    const data = await res.json();
    if (!res.ok)
      return onNotify('err', data.error || 'Failed to update publish state');
    onNotify(
      'ok',
      !g.isPublished ? 'Result published to student' : 'Result withheld',
    );
    await onRefresh();
  }

  const allGrades = assessments.flatMap((a) =>
    a.grades.map((g) => ({ ...g, assessmentTitle: a.title })),
  );

  return (
    <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
      <h2 className='text-lg font-semibold text-slate-900'>
        Marksheet & Results
      </h2>
      <p className='mt-1 text-sm text-slate-500'>
        Enter numeric marks (0–100), auto-classify results, and publish or
        withhold per student.
      </p>

      <form onSubmit={handleSaveGrade} className='mt-4 space-y-3'>
        <div className='grid gap-3 sm:grid-cols-2'>
          <select
            value={selectedStudentId}
            onChange={(e) => setStudentId(e.target.value)}
            className='rounded-lg border border-slate-300 px-3 py-2 text-sm'
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.studentCode})
              </option>
            ))}
          </select>
          <select
            value={selectedAssessmentId}
            onChange={(e) => setAssessmentId(e.target.value)}
            className='rounded-lg border border-slate-300 px-3 py-2 text-sm'
          >
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </div>

        <div className='flex flex-wrap items-center gap-4'>
          <input
            required
            type='number'
            min={0}
            max={100}
            step='0.5'
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className='w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm'
          />
          <label className='flex items-center gap-2 text-sm text-slate-700'>
            <input
              type='checkbox'
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            Publish result
          </label>
          <button
            type='submit'
            disabled={submitting}
            className='ml-auto rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50'
          >
            {submitting ? 'Saving...' : 'Save Grade'}
          </button>
        </div>
      </form>

      <div className='mt-6 space-y-2 border-t border-slate-100 pt-4'>
        {allGrades.length === 0 ? (
          <p className='text-xs text-slate-400'>No grades recorded yet.</p>
        ) : (
          allGrades.map((g) => (
            <div
              key={g.id}
              className='flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm'
            >
              <div>
                <div className='font-medium text-slate-900'>
                  {g.studentName} — {g.score}/100 ({classifyScore(g.score)})
                </div>
                <div className='text-xs text-slate-500'>
                  {g.assessmentTitle}
                </div>
              </div>
              <button
                onClick={() => handleTogglePublish(g)}
                className={`rounded-md px-3 py-1 text-xs font-semibold ${
                  g.isPublished
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {g.isPublished ? 'Published (Withhold)' : 'Withheld (Publish)'}
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
