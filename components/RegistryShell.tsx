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
      {/* Tier 1: Global Top Header */}
      <header className='sticky top-0 z-20 border-b border-slate-200 bg-white shadow-xs'>
        <div className='mx-auto grid max-w-7xl grid-cols-1 items-center gap-4 px-6 py-4 md:grid-cols-3'>
          {/* Left: Logo/Title */}
          <div className='justify-self-start'>
            <h1 className='text-xl font-bold tracking-tight text-slate-900'>
              SMS Registry Module
            </h1>
            <p className='text-xs text-slate-500'>
              Next.js App Router • PostgreSQL (Neon) • Prisma 7
            </p>
          </div>

          {/* Center: Staff / Student Toggle */}
          <div className='justify-self-center'>
            <div className='inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1'>
              <button
                type='button'
                onClick={() => setRole('STAFF')}
                className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition ${
                  role === 'STAFF'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Staff View
              </button>
              <button
                type='button'
                onClick={() => setRole('STUDENT')}
                className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition ${
                  role === 'STUDENT'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Student View
              </button>
            </div>
          </div>

          {/* Far Right: Active Student Dropdown (in Student View) */}
          <div className='flex items-center justify-end md:justify-self-end'>
            {role === 'STUDENT' && data.students.length > 0 && (
              <div className='flex items-center gap-2'>
                <label
                  htmlFor='active-student-select'
                  className='text-xs font-medium text-slate-500'
                >
                  Viewing as:
                </label>
                <select
                  id='active-student-select'
                  value={currentStudent?.id || ''}
                  onChange={(e) => setActiveStudentId(e.target.value)}
                  className='rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900'
                >
                  {data.students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.studentCode} — {s.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tier 2: Distinct Staff Module Navigation Bar */}
      {role === 'STAFF' && (
        <nav
          aria-label='Registry sections'
          className='border-b border-slate-200 bg-slate-100/90'
        >
          <div className='mx-auto flex max-w-7xl flex-wrap items-center gap-2.5 px-6 py-2.5'>
            {navItems.map((item) => {
              const isActive = section === item.mode;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`inline-flex items-center rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

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
