import React, { useMemo } from 'react';
import { CalendarClock, CheckCircle2, Clock3, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardPageIntro from '../components/dashboard/DashboardPageIntro';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import useDoctorDashboard from '../hooks/useDoctorDashboard';
import { formatReadableDate, formatSlot } from '../lib/appointments';

const DoctorDashboard = () => {
    const {
        appointments,
        scheduleSettings,
        loading,
        error,
        pendingAppointments,
        confirmedAppointments,
    } = useDoctorDashboard();

    const nextAppointments = useMemo(
        () => [...appointments].sort((a, b) => `${a.date}-${a.slot}`.localeCompare(`${b.date}-${b.slot}`)).slice(0, 5),
        [appointments]
    );

    return (
        <div className="space-y-6">
            <DashboardPageIntro
                eyebrow="Doctor Workspace"
                title="Practice overview"
                description="Track your day at a glance, monitor pending requests, and keep your patient-facing schedule aligned with the capacity you want to offer."
                actions={(
                    <>
                        <Link to="/doctor/appointments" className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white">
                            View appointments
                        </Link>
                        <Link to="/doctor/schedule" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                            Configure schedule
                        </Link>
                    </>
                )}
            />

            {error && (
                <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                    {error}
                </div>
            )}

            <section className="grid gap-4 xl:grid-cols-4">
                <DashboardStatCard label="Total bookings" value={loading ? '--' : appointments.length} helper="All time" icon={CalendarClock} />
                <DashboardStatCard label="Pending requests" value={loading ? '--' : pendingAppointments.length} tone="amber" helper="Needs review" icon={Clock3} />
                <DashboardStatCard label="Confirmed visits" value={loading ? '--' : confirmedAppointments.length} tone="emerald" helper="Approved" icon={CheckCircle2} />
                <DashboardStatCard label="Daily capacity" value={loading ? '--' : scheduleSettings.maxAppointmentsPerDay} tone="cyan" helper="Current limit" icon={Settings} />
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
                <section className="rounded-[1.9rem] border border-slate-200 bg-white shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Upcoming</p>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Next appointments</h2>
                        </div>
                        <Link to="/doctor/appointments" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-600 dark:text-cyan-300">
                            Open queue
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Patient</th>
                                    <th className="px-6 py-3 font-medium">Date</th>
                                    <th className="px-6 py-3 font-medium">Slot</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
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
                                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{appointment.patient?.name}</td>
                                        <td className="px-6 py-4">{formatReadableDate(appointment.date)}</td>
                                        <td className="px-6 py-4">{formatSlot(appointment.slot)}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{appointment.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Current schedule</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Visible booking slots</h2>
                    <div className="mt-5 flex flex-wrap gap-2">
                        {scheduleSettings.availableTimeSlots.length > 0 ? (
                            scheduleSettings.availableTimeSlots.map((slot) => (
                                <span key={slot} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 dark:border-slate-700 dark:text-slate-200">
                                    {formatSlot(slot)}
                                </span>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400">No slots configured yet.</p>
                        )}
                    </div>
                    <Link to="/doctor/schedule" className="mt-6 inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white">
                        Manage schedule
                    </Link>
                </section>
            </div>
        </div>
    );
};

export default DoctorDashboard;
