'use client';

import React, { useState } from 'react';
import { classifyScore } from '@/lib/domain';
import { AssessmentDTO, StudentDTO } from '@/lib/types';

interface Props {
  student: StudentDTO;
  assessments: AssessmentDTO[];
  onRefresh: () => Promise<void>;
  onNotify: (type: 'ok' | 'err', text: string) => void;
}

export function StudentWorkspace({
  student,
  assessments,
  onRefresh,
  onNotify,
}: Props) {
  const [assessmentId, setAssessmentId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const selectedAssessmentId = assessmentId || assessments[0]?.id || '';
  const publishedGrades = student.grades.filter((g) => g.isPublished);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !selectedAssessmentId) {
      return onNotify(
        'err',
        'Please select an assessment and a PDF or DOCX file',
      );
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('studentId', student.id);
      fd.append('assessmentId', selectedAssessmentId);
      fd.append('file', file);

      const res = await fetch('/api/submissions', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) return onNotify('err', data.error || 'Upload failed');

      setFile(null);
      onNotify(
        'ok',
        data.submission.isLate
          ? 'Submitted (flagged as LATE past deadline)'
          : 'Submission uploaded on time',
      );
      await onRefresh();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className='grid gap-6 lg:grid-cols-2'>
      <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
        <h2 className='text-lg font-semibold text-slate-900'>
          Assessment Submission
        </h2>
        <p className='mt-1 text-sm text-slate-500'>
          Upload a PDF or DOCX file. You can resubmit before the deadline; late
          submissions are flagged.
        </p>

        <form onSubmit={handleSubmit} className='mt-4 space-y-4'>
          <select
            value={selectedAssessmentId}
            onChange={(e) => setAssessmentId(e.target.value)}
            className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm'
          >
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title} — Due {new Date(a.deadline).toLocaleString()}
              </option>
            ))}
          </select>

          <input
            type='file'
            accept='.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className='block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200'
          />

          <button
            type='submit'
            disabled={uploading}
            className='rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50'
          >
            {uploading ? 'Uploading...' : 'Submit File'}
          </button>
        </form>

        <div className='mt-6 space-y-2 border-t border-slate-100 pt-4'>
          <h3 className='text-sm font-semibold text-slate-700'>
            Submitted Work
          </h3>
          {student.submissions.length === 0 ? (
            <p className='text-xs text-slate-400'>No submissions yet.</p>
          ) : (
            student.submissions.map((sub) => (
              <div
                key={sub.id}
                className='flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs'
              >
                <span>
                  <strong>{sub.assessmentTitle}</strong> ({sub.fileName})
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
              </div>
            ))
          )}
        </div>
      </section>

      <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
        <h2 className='text-lg font-semibold text-slate-900'>
          Published Marksheet
        </h2>
        <p className='mt-1 text-sm text-slate-500'>
          Withheld results remain hidden until published by Registry or teaching
          staff.
        </p>

        <div className='mt-4 space-y-3'>
          {publishedGrades.length === 0 ? (
            <div className='rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500'>
              No published results available for your account yet.
            </div>
          ) : (
            publishedGrades.map((g) => (
              <div
                key={g.id}
                className='flex items-center justify-between rounded-lg border border-slate-200 p-4'
              >
                <div>
                  <div className='font-semibold text-slate-900'>
                    {g.assessmentTitle}
                  </div>
                  <div className='text-xs text-slate-500'>
                    {g.assessmentModule}
                  </div>
                </div>
                <div className='text-right'>
                  <div className='text-lg font-bold text-slate-900'>
                    {g.score} / 100
                  </div>
                  <div className='text-xs font-semibold text-indigo-700'>
                    {classifyScore(g.score)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
