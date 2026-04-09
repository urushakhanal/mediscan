import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowUpRight, Shield, Stethoscope, UserCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getUsers } from '../lib/auth';
import { formatExperienceYears, formatUserDisplayName } from '../lib/utils';
import { formatSpecialization } from '../lib/appointments';

const emptySummary = {
  total: 0,
  patients: 0,
  doctors: 0,
  superadmins: 0,
};

const AdminDashboard = () => {
  const [summary, setSummary] = useState(emptySummary);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentDoctors, setRecentDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getUsers();
        const users = data.users || [];

                setSummary({
                    total: users.length,
                    patients: users.filter((user) => user.role === 'patient').length,
                    doctors: users.filter((user) => user.role === 'doctor').length,
                    superadmins: users.filter((user) => user.role === 'superadmin').length,
                });
                setRecentUsers([...users].slice(-5).reverse());
                setRecentDoctors([...users].filter((user) => user.role === 'doctor').slice(-5).reverse());
      } catch (requestError) {
        setError(requestError.message || 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const doctorVerificationSummary = useMemo(
    () => ({
      verified: recentDoctors.filter((doctor) => doctor.isVerified).length,
      pending: recentDoctors.filter((doctor) => !doctor.isVerified).length,
    }),
    [recentDoctors]
  );

  const statCards = [
    {
      label: 'Platform users',
      value: loading ? '--' : summary.total,
      helper: 'Across all roles',
      icon: Users,
      accent: 'from-violet-500 to-indigo-400',
      iconTone: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200',
    },
    {
      label: 'Patient accounts',
      value: loading ? '--' : summary.patients,
      helper: 'Active patient records',
      icon: Activity,
      accent: 'from-cyan-500 to-sky-400',
      iconTone: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200',
    },
    {
      label: 'Doctors',
      value: loading ? '--' : summary.doctors,
      helper: 'Registered specialists',
      icon: Stethoscope,
      accent: 'from-emerald-500 to-teal-400',
      iconTone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
    },
    {
      label: 'Superadmins',
      value: loading ? '--' : summary.superadmins,
      helper: 'Console access',
      icon: Shield,
      accent: 'from-amber-500 to-orange-400',
      iconTone: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="px-1 py-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300">
          Superadmin Workspace
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Platform overview
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          Monitor account growth, keep track of doctor onboarding, and jump into the areas that need review.
        </p>
      </section>

      {error && (
        <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className="overflow-hidden rounded-[1.7rem] bg-white shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:bg-slate-900"
            >
              <div className={`h-1.5 bg-gradient-to-r ${card.accent}`} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                      {card.helper}
                    </p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.iconTone}`}>
                    <Icon size={18} />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="rounded-[1.8rem] bg-white p-5 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:bg-slate-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-300">
              Verification snapshot
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
              Doctor onboarding
            </h2>
          </div>

          <Link
            to="/admin/doctors"
            className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            Open doctor review
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:max-w-md">
          <div className="rounded-2xl bg-emerald-50 px-4 py-4 dark:bg-emerald-950/20">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">Verified</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {loading ? '--' : doctorVerificationSummary.verified}
            </p>
          </div>
          <div className="rounded-2xl bg-amber-50 px-4 py-4 dark:bg-amber-950/20">
            <p className="text-sm text-amber-700 dark:text-amber-300">Pending</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {loading ? '--' : doctorVerificationSummary.pending}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[1.8rem] bg-white shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:bg-slate-900">
          <div className="flex items-center justify-between px-6 py-5">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Latest accounts</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Recent users</h2>
            </div>
            <Link
              to="/admin/patients"
              className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 transition hover:text-cyan-600 dark:text-cyan-300"
            >
              Review users
              <ArrowUpRight size={15} />
            </Link>
          </div>

          <div className="space-y-3 px-6 pb-6">
            {!loading && recentUsers.length === 0 && (
              <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                No users found.
              </div>
            )}

            {recentUsers.map((user) => (
              <article
                key={user._id}
                className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-800/80"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">
                    {formatUserDisplayName(user)}
                  </p>
                  <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  {user.role}
                </span>
              </article>
            ))}
          </div>
        </section>

        <article className="rounded-[1.8rem] bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:bg-slate-900">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Doctor queue</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                Latest doctor registrations
              </h2>
            </div>
            <Link
              to="/admin/doctors"
              className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-600 dark:text-cyan-300"
            >
              Manage
            </Link>
          </div>

          <div className="mt-4 space-y-2.5">
            {!loading && recentDoctors.length === 0 && (
              <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                No doctors found.
              </div>
            )}

            {recentDoctors.map((doctor) => (
              <article
                key={doctor._id}
                className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/80"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 dark:text-white">
                      {formatUserDisplayName(doctor)}
                    </p>
                    <p className="mt-1 text-sm text-cyan-700 dark:text-cyan-300">
                      {formatSpecialization(doctor.specialization)}
                    </p>
                  </div>
                  <span
                    className={[
                      'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]',
                      doctor.isVerified
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
                    ].join(' ')}
                  >
                    {doctor.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>

                <div className="mt-2.5 grid gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <p>{formatExperienceYears(doctor.experienceYears)}</p>
                  <p>{doctor.currentlyWorkingAt || 'Workplace not provided'}</p>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
};

export default AdminDashboard;
