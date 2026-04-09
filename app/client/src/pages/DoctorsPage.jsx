import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  Phone,
  Search,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getVerifiedDoctors } from '../lib/auth';
import { formatSpecialization } from '../lib/appointments';
import { formatUserDisplayName } from '../lib/utils';

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getVerifiedDoctors();
        setDoctors(data.doctors || []);
      } catch (requestError) {
        setError(requestError.message || 'Unable to load verified doctors.');
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, []);

  const specializationOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        doctors
          .map((doctor) => doctor.specialization)
          .filter(Boolean)
      )
    );

    return values.sort((a, b) =>
      formatSpecialization(a).localeCompare(formatSpecialization(b))
    );
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const matchesKeyword =
        !keyword ||
        [doctor.name, doctor.specialization, doctor.email]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(keyword));

      const matchesSpecialty =
        specialtyFilter === 'all' || doctor.specialization === specialtyFilter;

      return matchesKeyword && matchesSpecialty;
    });
  }, [doctors, search, specialtyFilter]);

  return (
    <section className="relative overflow-hidden px-4 pt-2 pb-8 sm:pb-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl dark:bg-cyan-500/10" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-500/10" />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-6">
        <header className="px-1 py-2">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Doctor Directory
                </p>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  Find the right specialist for your next step.
                </h1>
                <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-600 dark:text-slate-300 sm:text-sm">
                  Browse verified doctors, narrow by specialty, and open a full profile before you book.
                </p>
              </div>

            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(230px,0.9fr)]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by doctor name, specialty, or email"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
                />
              </label>

              <label className="block">
                <span className="sr-only">Filter by specialty</span>
                <select
                  value={specialtyFilter}
                  onChange={(event) => setSpecialtyFilter(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
                >
                  <option value="all">All specialties</option>
                  {specializationOptions.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {formatSpecialization(specialty)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

          </div>
        </header>

        {error && (
          <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
            {error}
          </div>
        )}

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {loading &&
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`doctor-skeleton-${index}`}
                className="overflow-hidden rounded-[1.75rem] bg-white p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.22)] dark:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                  <div className="h-7 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="mt-5 h-6 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                <div className="mt-6 space-y-3">
                  <div className="h-11 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
                  <div className="h-11 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
                </div>
                <div className="mt-6 h-11 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}

          {!loading &&
            filteredDoctors.map((doctor) => (
              <article
                key={doctor._id}
                className="group overflow-hidden rounded-[1.6rem] bg-white shadow-[0_20px_55px_-38px_rgba(14,165,233,0.32)] transition duration-300 hover:-translate-y-1 dark:bg-slate-900"
              >
                <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100 to-emerald-100 text-cyan-700 dark:from-cyan-950/50 dark:to-emerald-950/50 dark:text-cyan-300">
                        <Stethoscope size={18} />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {formatUserDisplayName(doctor)}
                        </h2>
                        <p className="mt-1 text-sm font-medium text-cyan-700 dark:text-cyan-300">
                          {formatSpecialization(doctor.specialization)}
                        </p>
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-300" />
                  </div>

                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-2.5 dark:bg-slate-800/80">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <p className="min-w-0 truncate text-sm text-slate-600 dark:text-slate-300">
                        {doctor.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-2.5 dark:bg-slate-800/80">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {doctor.phone || 'Phone not shared'}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/doctors/${doctor._id}`}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                  >
                    View profile
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
        </section>

        {!loading && filteredDoctors.length === 0 && (
          <section className="rounded-[1.75rem] bg-white px-6 py-12 text-center shadow-[0_18px_45px_-35px_rgba(15,23,42,0.22)] dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              <Search className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
              No doctors found
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Try another doctor name, specialty, or email keyword.
            </p>
          </section>
        )}
      </div>
    </section>
  );
};

export default DoctorsPage;
