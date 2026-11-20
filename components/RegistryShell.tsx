'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { OverviewResponse, Role } from '@/lib/types';
import { OverdueBanner } from './OverdueBanner';
import { EnrolmentPanel } from './EnrolmentPanel';
import { PaymentsPanel } from './PaymentsPanel';
import { AssessmentsPanel } from './AssessmentsPanel';
import { MarksheetPanel } from './MarksheetPanel';
import { StudentWorkspace } from './StudentWorkspace';

export type SectionMode =
  | 'all'
  | 'enrolment'
  | 'fees'
  | 'assessments'
  | 'marksheet';

export function RegistryShell({ section = 'all' }: { section?: SectionMode }) {
  const [role, setRole] = useState<Role>('STAFF');
  const [activeStudentId, setActiveStudentId] = useState('');
  const [data, setData] = useState<OverviewResponse>({
    programmes: [],
    students: [],
    assessments: [],
  });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [programmeFilter, setProgrammeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [banner, setBanner] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  const refreshOverview = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (programmeFilter) params.set('programmeId', programmeFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/overview?${params.toString()}`, {
        cache: 'no-store',
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to load data');

      setData({
        programmes: payload.programmes || [],
        students: payload.students || [],
        assessments: payload.assessments || [],
      });

      if (payload.students?.length) {
        setActiveStudentId((prev) => prev || payload.students[0].id);
      }
    } catch (err) {
      setBanner({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : 'Unexpected error loading registry',
      });
    } finally {
      setLoading(false);
    }
  }, [q, programmeFilter, statusFilter]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (programmeFilter) params.set('programmeId', programmeFilter);
        if (statusFilter) params.set('status', statusFilter);

        const res = await fetch(`/api/overview?${params.toString()}`, {
          cache: 'no-store',
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || 'Failed to load data');
        if (cancelled) return;

        setData({
          programmes: payload.programmes || [],
          students: payload.students || [],
          assessments: payload.assessments || [],
        });

        if (payload.students?.length) {
          setActiveStudentId((prev) => prev || payload.students[0].id);
        }
      } catch (err) {
        if (cancelled) return;
        setBanner({
          type: 'err',
          text:
            err instanceof Error
              ? err.message
              : 'Unexpected error loading registry',
        });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [q, programmeFilter, statusFilter]);

  function notify(type: 'ok' | 'err', text: string) {
    setBanner({ type, text });
  }

  const currentStudent =
    data.students.find((s) => s.id === activeStudentId) || data.students[0];

  const navItems: { href: string; label: string; mode: SectionMode }[] = [
    { href: '/', label: 'Overview', mode: 'all' },
    { href: '/enrolment', label: 'Enrolment', mode: 'enrolment' },
    { href: '/fees', label: 'Fees & Payments', mode: 'fees' },
    { href: '/assessments', label: 'Assessments', mode: 'assessments' },
    { href: '/marksheet', label: 'Marksheet', mode: 'marksheet' },
  ];

  return (
    <div className='min-h-screen bg-slate-50 text-slate-900'>
      <header className='border-b border-slate-200 bg-white'>
        <div className='mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4'>
          <div>
            <h1 className='text-xl font-bold tracking-tight text-slate-900'>
              SMS Registry Module
            </h1>
            <p className='text-xs text-slate-500'>
              Next.js App Router • PostgreSQL (Neon) • Prisma 7
            </p>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            {role === 'STUDENT' && data.students.length > 0 && (
              <select
                value={currentStudent?.id || ''}
                onChange={(e) => setActiveStudentId(e.target.value)}
                className='rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium'
              >
                {data.students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.studentCode} — {s.fullName}
                  </option>
                ))}
              </select>
            )}

            <div className='inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1'>
              <button
                onClick={() => setRole('STAFF')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  role === 'STAFF'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Staff View
              </button>
              <button
                onClick={() => setRole('STUDENT')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  role === 'STUDENT'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Student View
              </button>
            </div>
          </div>
        </div>

        {role === 'STAFF' && (
          <nav className='border-t border-slate-100 bg-slate-50/70'>
            <div className='mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 py-2'>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    section === item.mode
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className='mx-auto max-w-7xl space-y-6 px-6 py-6'>
        {banner && (
          <div
            className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
              banner.type === 'ok'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            <span>{banner.text}</span>
            <button
              onClick={() => setBanner(null)}
              className='font-semibold underline'
            >
              Dismiss
            </button>
          </div>
        )}

        <OverdueBanner students={data.students} />

        {role === 'STUDENT' ? (
          currentStudent ? (
            <StudentWorkspace
              student={currentStudent}
              assessments={data.assessments}
              onRefresh={refreshOverview}
              onNotify={notify}
            />
          ) : (
            <div className='rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500'>
              No student records available.
            </div>
          )
        ) : (
          <div className='space-y-8'>
            {(section === 'all' || section === 'enrolment') && (
              <EnrolmentPanel
                programmes={data.programmes}
                students={data.students}
                loading={loading}
                q={q}
                programmeFilter={programmeFilter}
                statusFilter={statusFilter}
                onSearchChange={setQ}
                onProgrammeFilterChange={setProgrammeFilter}
                onStatusFilterChange={setStatusFilter}
                onRefresh={refreshOverview}
                onNotify={notify}
              />
            )}

            {(section === 'all' || section === 'fees') && (
              <PaymentsPanel
                students={data.students}
                onRefresh={refreshOverview}
                onNotify={notify}
              />
            )}

            <div
              className={
                section === 'all' ? 'grid gap-8 lg:grid-cols-2' : 'space-y-8'
              }
            >
              {(section === 'all' || section === 'assessments') && (
                <AssessmentsPanel
                  assessments={data.assessments}
                  onRefresh={refreshOverview}
                  onNotify={notify}
                />
              )}

              {(section === 'all' || section === 'marksheet') && (
                <MarksheetPanel
                  students={data.students}
                  assessments={data.assessments}
                  onRefresh={refreshOverview}
                  onNotify={notify}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
