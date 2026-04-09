import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock3, Stethoscope } from 'lucide-react';
import { getPatientAppointments } from '../lib/auth';
import {
    formatReadableDate,
    formatSlot,
    formatSpecialization,
    getStatusClasses,
} from '../lib/appointments';
import { formatUserDisplayName } from '../lib/utils';

const PatientDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadAppointments = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await getPatientAppointments();
                setAppointments(data.appointments || []);
            } catch (requestError) {
                setError(requestError.message || 'Unable to load appointments.');
            } finally {
                setLoading(false);
            }
        };

        loadAppointments();
    }, []);

    const pendingCount = appointments.filter((appointment) => appointment.status === 'pending').length;
    const confirmedCount = appointments.filter((appointment) => appointment.status === 'confirmed').length;

    return (
        <section className="px-4 py-10 sm:py-12">
            <div className="mx-auto max-w-6xl space-y-6">
                <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Patient dashboard</p>
                    <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Your appointments</h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                        Review pending requests and confirmed visits in one place.
                    </p>
                </header>

                {error && (
                    <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                        {error}
                    </div>
                )}

                <section className="grid gap-4 md:grid-cols-3">
                    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total appointments</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{loading ? '--' : appointments.length}</p>
                    </article>
                    <article className="rounded-[1.5rem] border border-amber-200 bg-white p-5 shadow-sm dark:border-amber-900/50 dark:bg-slate-900">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Pending</p>
                        <p className="mt-2 text-3xl font-bold text-amber-700 dark:text-amber-300">{loading ? '--' : pendingCount}</p>
                    </article>
                    <article className="rounded-[1.5rem] border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-900/50 dark:bg-slate-900">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Confirmed</p>
                        <p className="mt-2 text-3xl font-bold text-emerald-700 dark:text-emerald-300">{loading ? '--' : confirmedCount}</p>
                    </article>
                </section>

                <section className="space-y-4">
                    {loading &&
                        Array.from({ length: 3 }).map((_, index) => (
                            <div
                                key={`appointment-skeleton-${index}`}
                                className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                            >
                                <div className="h-5 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                                <div className="mt-4 h-4 w-60 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                                <div className="mt-2 h-4 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                            </div>
                        ))}

                    {!loading && appointments.length === 0 && (
                        <div className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">No appointments yet</h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                Visit a doctor profile to request your first booking.
                            </p>
                        </div>
                    )}

                    {!loading &&
                        appointments.map((appointment) => (
                            <article
                                key={appointment._id}
                                className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                            >
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                                                <Stethoscope size={18} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{formatUserDisplayName(appointment.doctor)}</h2>
                                                <p className="text-sm text-cyan-700 dark:text-cyan-300">
                                                    {formatSpecialization(appointment.doctor?.specialization)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
                                            <span className="inline-flex items-center gap-2">
                                                <CalendarDays size={16} />
                                                {formatReadableDate(appointment.date)}
                                            </span>
                                            <span className="inline-flex items-center gap-2">
                                                <Clock3 size={16} />
                                                {formatSlot(appointment.slot)}
                                            </span>
                                        </div>
                                    </div>

                                    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusClasses(appointment.status)}`}>
                                        {appointment.status}
                                    </span>
                                </div>
                            </article>
                        ))}
                </section>
            </div>
        </section>
    );
};

export default PatientDashboard;
