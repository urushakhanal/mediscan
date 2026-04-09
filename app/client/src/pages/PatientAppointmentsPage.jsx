import React, { useMemo } from 'react';
import { CalendarDays, Clock3 } from 'lucide-react';
import DashboardPageIntro from '../components/dashboard/DashboardPageIntro';
import usePatientAppointments from '../hooks/usePatientAppointments';
import {
    formatReadableDate,
    formatSlot,
    formatSpecialization,
    getStatusClasses,
} from '../lib/appointments';
import { formatUserDisplayName } from '../lib/utils';

const PatientAppointmentsPage = () => {
    const { appointments, loading, error } = usePatientAppointments();

    const sortedAppointments = useMemo(
        () => [...appointments].sort((a, b) => `${b.date}-${b.slot}`.localeCompare(`${a.date}-${a.slot}`)),
        [appointments]
    );

    return (
        <div className="space-y-6">
            <DashboardPageIntro
                eyebrow="Patient Workspace"
                title="Appointment history"
                description="Track pending requests, upcoming consultations, and your recent visit history in one timeline-oriented view."
            />

            {error && (
                <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                    {error}
                </div>
            )}

            <section className="rounded-[1.9rem] border border-slate-200 bg-white shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">All appointments</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Doctor</th>
                                <th className="px-6 py-3 font-medium">Specialty</th>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Time</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading && Array.from({ length: 4 }).map((_, index) => (
                                <tr key={`patient-appointments-skeleton-${index}`}>
                                    <td className="px-6 py-4"><div className="h-4 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /></td>
                                </tr>
                            ))}

                            {!loading && sortedAppointments.length === 0 && (
                                <tr>
                                    <td className="px-6 py-10 text-center text-slate-500 dark:text-slate-400" colSpan={5}>No appointments yet.</td>
                                </tr>
                            )}

                            {!loading && sortedAppointments.map((appointment) => (
                                <tr key={appointment._id} className="text-slate-700 dark:text-slate-200">
                                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{formatUserDisplayName(appointment.doctor)}</td>
                                    <td className="px-6 py-4">{formatSpecialization(appointment.doctor?.specialization)}</td>
                                    <td className="px-6 py-4"><span className="inline-flex items-center gap-2"><CalendarDays size={15} />{formatReadableDate(appointment.date)}</span></td>
                                    <td className="px-6 py-4"><span className="inline-flex items-center gap-2"><Clock3 size={15} />{formatSlot(appointment.slot)}</span></td>
                                    <td className="px-6 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusClasses(appointment.status)}`}>{appointment.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default PatientAppointmentsPage;
