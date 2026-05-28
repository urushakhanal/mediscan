import React, { useMemo } from 'react';
import { CalendarDays, CheckCircle2, Clock3, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardPageIntro from '../components/dashboard/DashboardPageIntro';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import usePatientAppointments from '../hooks/usePatientAppointments';
import { formatReadableDate, formatSlot, formatSpecialization } from '../lib/appointments';
import { formatUserDisplayName } from '../lib/utils';

const PatientDashboard = () => {
    const { appointments, loading, error, pendingCount, confirmedCount, newSummariesCount } = usePatientAppointments();

    const nextAppointments = useMemo(
        () => [...appointments].sort((a, b) => `${a.date}-${a.slot}`.localeCompare(`${b.date}-${b.slot}`)).slice(0, 5),
        [appointments]
    );

    return (
        <div className="space-y-6">
            <DashboardPageIntro
                eyebrow="Patient Workspace"
                title="Care overview"
                description="Stay on top of upcoming visits, revisit recently consulted doctors, and keep your booking history within reach."
                actions={(
                    <Link to="/patient/appointments" className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white">
                        View appointments
                    </Link>
                )}
            />

            {error && (
                <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                    {error}
                </div>
            )}

            <section className="grid gap-4 xl:grid-cols-4">
                <DashboardStatCard label="Total appointments" value={loading ? '--' : appointments.length} helper="All bookings" icon={CalendarDays} />
                <DashboardStatCard label="Pending requests" value={loading ? '--' : pendingCount} tone="amber" helper="Awaiting response" icon={Clock3} />
                <DashboardStatCard label="Confirmed visits" value={loading ? '--' : confirmedCount} tone="emerald" helper="Scheduled" icon={CheckCircle2} />
                <DashboardStatCard label="New summaries" value={loading ? '--' : newSummariesCount} tone="cyan" helper="Ready to view" icon={Search} />
            </section>

            <section className="rounded-[1.9rem] border border-slate-200 bg-white shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                    <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Upcoming</p>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Next appointments</h2>
                    </div>
                    <Link to="/patient/appointments" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-600 dark:text-cyan-300">
                        Full history
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Doctor</th>
                                <th className="px-6 py-3 font-medium">Specialty</th>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {nextAppointments.length === 0 && !loading && (
                                <tr>
                                    <td className="px-6 py-10 text-center text-slate-500 dark:text-slate-400" colSpan={4}>No appointments yet.</td>
                                </tr>
                            )}
                            {nextAppointments.map((appointment) => (
                                <tr key={appointment._id} className="text-slate-700 dark:text-slate-200">
                                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{formatUserDisplayName(appointment.doctor)}</td>
                                    <td className="px-6 py-4">{formatSpecialization(appointment.doctor?.specialization)}</td>
                                    <td className="px-6 py-4">{formatReadableDate(appointment.date)}</td>
                                    <td className="px-6 py-4">{formatSlot(appointment.slot)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default PatientDashboard;
