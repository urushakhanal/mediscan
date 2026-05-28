import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpenText, CalendarClock, Clock3, FileUp, Users2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardPageIntro from '../components/dashboard/DashboardPageIntro';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import { getDoctorPatients } from '../lib/auth';
import { formatReadableDate, formatSlot, getStatusClasses } from '../lib/appointments';
import { formatUserDisplayName } from '../lib/utils';

const DoctorPatientsPage = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadPatients = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getDoctorPatients();
            setPatients(data.patients || []);
        } catch (requestError) {
            setError(requestError.message || 'Unable to load patient records.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPatients();
    }, [loadPatients]);

    const stats = useMemo(() => ({
        total: patients.length,
        completed: patients.reduce((count, entry) => count + (entry.completedAppointments || 0), 0),
        active: patients.filter((entry) => (entry.pendingAppointments || 0) > 0).length,
    }), [patients]);

    const hasUploadedReports = (entry) =>
        Boolean((entry?.appointments || []).some((appointment) => (appointment?.medicalDocuments || []).length > 0));

    return (
        <div className="space-y-6">
            <DashboardPageIntro
                eyebrow="Doctor Workspace"
                title="Patient record book"
                description="Follow each patient across visits and reopen the same record during follow-up so the next session starts with full context."
            />

            {error && (
                <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                    {error}
                </div>
            )}

            <section className="grid gap-4 xl:grid-cols-4">
                <DashboardStatCard label="Patients" value={loading ? '--' : stats.total} helper="Unique patients" icon={Users2} />
                <DashboardStatCard label="Completed visits" value={loading ? '--' : stats.completed} tone="cyan" helper="Recorded entries" icon={BookOpenText} />
                <DashboardStatCard label="Active cases" value={loading ? '--' : stats.active} tone="amber" helper="Pending follow-up" icon={Clock3} />
                <DashboardStatCard label="Latest activity" value={loading ? '--' : patients.length > 0 ? formatReadableDate(patients[0].latestAppointment?.date) : '--'} tone="emerald" helper="Most recent visit" icon={CalendarClock} />
            </section>

            <section className="rounded-[1.9rem] border border-slate-200 bg-white shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Patients under your care</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Patient</th>
                                <th className="px-6 py-3 font-medium">Visits</th>
                                <th className="px-6 py-3 font-medium">Last visit</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Record</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading && Array.from({ length: 4 }).map((_, index) => (
                                <tr key={`doctor-patients-skeleton-${index}`}>
                                    <td className="px-6 py-4"><div className="h-4 w-44 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /></td>
                                    <td className="px-6 py-4"><div className="h-9 w-28 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" /></td>
                                </tr>
                            ))}

                            {!loading && patients.length === 0 && (
                                <tr>
                                    <td className="px-6 py-10 text-center text-slate-500 dark:text-slate-400" colSpan={5}>
                                        No patient records yet.
                                    </td>
                                </tr>
                            )}

                            {!loading && patients.map((entry) => (
                                <tr key={entry.patient?._id} className="text-slate-700 dark:text-slate-200">
                                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                                        <div className="space-y-2">
                                            <p>{formatUserDisplayName(entry.patient)}</p>
                                            {hasUploadedReports(entry) && (
                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                                                    <FileUp size={12} />
                                                    Reports uploaded
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {entry.completedAppointments || 0} completed, {entry.pendingAppointments || 0} active
                                    </td>
                                    <td className="px-6 py-4">
                                        {entry.latestAppointment ? `${formatReadableDate(entry.latestAppointment.date)} • ${formatSlot(entry.latestAppointment.slot)}` : 'No visits yet'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusClasses(entry.latestAppointment?.status)}`}>
                                            {entry.latestAppointment?.status || 'new'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            to={`/doctor/patients/${entry.patient?._id}/record`}
                                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                                        >
                                            <BookOpenText size={14} />
                                            Open record
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default DoctorPatientsPage;
