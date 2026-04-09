import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarClock, CheckCircle2, Clock3, FileText, UserRound } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import DashboardPageIntro from '../components/dashboard/DashboardPageIntro';
import useDoctorDashboard from '../hooks/useDoctorDashboard';
import { formatReadableDate, formatSlot, getStatusClasses } from '../lib/appointments';

const DoctorAppointmentsPage = () => {
    const {
        appointments,
        loading,
        updatingAppointmentId,
        error,
        setError,
        changeAppointmentStatus,
    } = useDoctorDashboard();
    const [selectedNotesAppointment, setSelectedNotesAppointment] = useState(null);

    const sortedAppointments = useMemo(
        () => [...appointments].sort((a, b) => `${a.date}-${a.slot}`.localeCompare(`${b.date}-${b.slot}`)),
        [appointments]
    );

    const handleAppointmentAction = async (appointmentId, status) => {
        try {
            await changeAppointmentStatus(appointmentId, status);
            toast.success(status === 'confirmed' ? 'Appointment confirmed.' : 'Appointment rejected.');
        } catch (requestError) {
            setError(requestError.message || 'Unable to update appointment.');
            toast.error(requestError.message || 'Unable to update appointment.');
        }
    };

    const hasNotes = (appointment) =>
        Boolean(appointment.previousMedicalCondition?.trim() || appointment.symptoms?.trim());

    return (
        <div className="space-y-6">
            <DashboardPageIntro
                eyebrow="Doctor Workspace"
                title="Appointment queue"
                description="Review each booking request, open patient notes, and confirm or reject visits from a single operational view."
            />

            {error && (
                <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                    {error}
                </div>
            )}

            <section className="rounded-[1.9rem] border border-slate-200 bg-white shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                        <CalendarClock size={18} />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Appointments</p>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">All booking requests</h2>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Patient</th>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Time</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Notes</th>
                                <th className="px-6 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading && Array.from({ length: 4 }).map((_, index) => (
                                <tr key={`doctor-appt-skeleton-${index}`}>
                                    <td className="px-6 py-4"><div className="h-4 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /></td>
                                    <td className="px-6 py-4"><div className="h-9 w-32 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" /></td>
                                </tr>
                            ))}

                            {!loading && sortedAppointments.length === 0 && (
                                <tr>
                                    <td className="px-6 py-10 text-center text-slate-500 dark:text-slate-400" colSpan={6}>No appointments yet.</td>
                                </tr>
                            )}

                            {!loading && sortedAppointments.map((appointment) => (
                                <tr key={appointment._id} className="text-slate-700 dark:text-slate-200">
                                    <td className="px-6 py-4">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                <UserRound size={16} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">{appointment.patient?.name || 'Patient'}</p>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{appointment.patient?.email || 'No email'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{formatReadableDate(appointment.date)}</td>
                                    <td className="px-6 py-4"><span className="inline-flex items-center gap-2"><Clock3 size={15} />{formatSlot(appointment.slot)}</span></td>
                                    <td className="px-6 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusClasses(appointment.status)}`}>{appointment.status}</span></td>
                                    <td className="px-6 py-4">
                                        {hasNotes(appointment) ? (
                                            <button type="button" onClick={() => setSelectedNotesAppointment(appointment)} className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white">
                                                <FileText size={14} />
                                                View notes
                                            </button>
                                        ) : <span className="text-xs text-slate-400 dark:text-slate-500">No notes</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        {appointment.status === 'pending' ? (
                                            <div className="flex flex-wrap gap-2">
                                                <button type="button" disabled={updatingAppointmentId === appointment._id} onClick={() => handleAppointmentAction(appointment._id, 'confirmed')} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60">
                                                    <CheckCircle2 size={14} />
                                                    Approve
                                                </button>
                                                <button type="button" disabled={updatingAppointmentId === appointment._id} onClick={() => handleAppointmentAction(appointment._id, 'rejected')} className="inline-flex rounded-full border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-500 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800 dark:text-rose-300">
                                                    Reject
                                                </button>
                                            </div>
                                        ) : <span className="text-xs text-slate-400 dark:text-slate-500">No actions</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <Dialog open={Boolean(selectedNotesAppointment)} onOpenChange={() => setSelectedNotesAppointment(null)}>
                <DialogContent className="rounded-[1.75rem] border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-900">
                    <div className="p-6">
                        <DialogHeader>
                            <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Patient notes</p>
                            <DialogTitle className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{selectedNotesAppointment?.patient?.name}</DialogTitle>
                            <DialogDescription>Optional notes shared at booking time.</DialogDescription>
                        </DialogHeader>
                        <div className="mt-6 space-y-4">
                            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Previous medical condition</p>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{selectedNotesAppointment?.previousMedicalCondition || 'Not provided'}</p>
                            </div>
                            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Symptoms</p>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{selectedNotesAppointment?.symptoms || 'Not provided'}</p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DoctorAppointmentsPage;
