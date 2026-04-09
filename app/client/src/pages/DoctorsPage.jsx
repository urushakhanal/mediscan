import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Search, ShieldCheck, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getVerifiedDoctors } from '../lib/auth';
import { formatSpecialization } from '../lib/appointments';
import { formatUserDisplayName } from '../lib/utils';

const DoctorsPage = () => {
    const [doctors, setDoctors] = useState([]);
    const [search, setSearch] = useState('');
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

    const filteredDoctors = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return doctors;

        return doctors.filter((doctor) =>
            [doctor.name, doctor.specialization, doctor.email]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(keyword))
        );
    }, [doctors, search]);

    return (
        <section className="relative px-4 py-8 sm:py-10">
            <div className="mx-auto max-w-5xl space-y-5">
                <header className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-emerald-700 dark:text-emerald-300">Doctor Directory</p>
                            <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">Find doctors</h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                                Search by doctor name, specialization, or email.
                            </p>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                            <ShieldCheck size={14} />
                            Approved doctors
                        </div>
                    </div>

                    <div className="flex justify-start">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                        >
                            <ArrowLeft size={16} />
                            Back to site
                        </Link>
                    </div>

                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search doctors"
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-950/40 dark:text-white dark:focus:bg-slate-900"
                        />
                    </div>
                </header>

                {error && (
                    <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-between px-1 text-sm text-slate-500 dark:text-slate-400">
                    <p>{loading ? 'Loading doctors...' : `${filteredDoctors.length} doctor${filteredDoctors.length === 1 ? '' : 's'} found`}</p>
                </div>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {loading &&
                        Array.from({ length: 6 }).map((_, index) => (
                            <div
                                key={`doctor-skeleton-${index}`}
                                className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                            >
                                <div className="h-11 w-11 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                                <div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                                <div className="mt-5 h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                                <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                                <div className="mt-6 h-10 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                            </div>
                        ))}

                    {!loading &&
                        filteredDoctors.map((doctor) => (
                            <article
                                key={doctor._id}
                                className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-900/50"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                                        <Stethoscope size={18} />
                                    </div>
                                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                                        Verified
                                    </span>
                                </div>

                                <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">{formatUserDisplayName(doctor)}</h2>
                                <p className="mt-1 text-sm font-medium text-cyan-700 dark:text-cyan-300">
                                    {formatSpecialization(doctor.specialization)}
                                </p>
                                <div className="mt-4 space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
                                    <p className="truncate">{doctor.email}</p>
                                    <p>{doctor.phone || 'Phone not shared'}</p>
                                </div>

                                <Link
                                    to={`/doctors/${doctor._id}`}
                                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                                >
                                    View profile
                                    <ArrowRight size={16} />
                                </Link>
                            </article>
                        ))}
                </section>

                {!loading && filteredDoctors.length === 0 && (
                    <section className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">No doctors found</h2>
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
