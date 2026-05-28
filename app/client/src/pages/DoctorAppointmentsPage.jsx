import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarClock, CheckCircle2, Clock3, FileText, FileUp, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import DashboardPageIntro from '../components/dashboard/DashboardPageIntro';
import useDoctorDashboard from '../hooks/useDoctorDashboard';
import { cancelAppointment, rescheduleAppointment } from '../lib/auth';
import { formatReadableDate, formatSlot, getStatusClasses, getTomorrowDateString } from '../lib/appointments';

const DoctorAppointmentsPage = () => {
    const {
        appointments,
        loading,
        updatingAppointmentId,
        error,
        setError,
        changeAppointmentStatus,
        loadDashboard,
    } = useDoctorDashboard();
    const [selectedNotesAppointment, setSelectedNotesAppointment] = useState(null);
    const [selectedManageAppointment, setSelectedManageAppointment] = useState(null);
    const [manageMode, setManageMode] = useState('reschedule');
    const [manageDate, setManageDate] = useState('');
    const [manageSlot, setManageSlot] = useState('');
    const [manageReason, setManageReason] = useState('');
    const [manageLoading, setManageLoading] = useState(false);
    const [manageError, setManageError] = useState('');
    const [manageInputKey, setManageInputKey] = useState(0);

    const sortedAppointments = useMemo(
        () => [...appointments].sort((a, b) => `${a.date}-${a.slot}`.localeCompare(`${b.date}-${b.slot}`)),
        [appointments]
    );

    const appointmentCounts = useMemo(
        () => ({
            pending: sortedAppointments.filter((appointment) => appointment.status === 'pending').length,
            confirmed: sortedAppointments.filter((appointment) => appointment.status === 'confirmed').length,
            completed: sortedAppointments.filter((appointment) => appointment.status === 'completed').length,
        }),
        [sortedAppointments]
    );

    const hasNotes = (appointment) =>
        Boolean(appointment.previousMedicalCondition?.trim() || appointment.symptoms?.trim());

    const hasUploadedReports = (appointment) => (appointment?.medicalDocuments || []).length > 0;
    const canManageAppointment = (appointment) => ['pending', 'confirmed'].includes(appointment?.status);

    const openManageDialog = (appointment, mode = 'reschedule') => {
        setSelectedManageAppointment(appointment);
        setManageMode(mode);
        setManageError('');
        setManageReason('');
        setManageDate(appointment?.date || '');
        setManageSlot(appointment?.slot || '');
        setManageInputKey((current) => current + 1);
    };

    const closeManageDialog = () => {
        setSelectedManageAppointment(null);
        setManageMode('reschedule');
        setManageDate('');
        setManageSlot('');
        setManageReason('');
        setManageError('');
    };

    const handleAppointmentAction = async (appointmentId, status) => {
        try {
            await changeAppointmentStatus(appointmentId, status);
            toast.success(status === 'confirmed' ? 'Appointment confirmed.' : 'Appointment rejected.');
        } catch (requestError) {
            setError(requestError.message || 'Unable to update appointment.');
            toast.error(requestError.message || 'Unable to update appointment.');
        }
    };

    const handleManageSubmit = async () => {
        if (!selectedManageAppointment?._id) {
            return;
        }

        try {
            setManageLoading(true);
            setManageError('');

            if (manageMode === 'reschedule') {
                if (!manageDate || !manageSlot) {
                    setManageError('Please select both a new date and slot.');
                    return;
                }

                const data = await rescheduleAppointment(selectedManageAppointment._id, {
                    date: manageDate,
                    slot: manageSlot,
                    reason: manageReason,
                });

                toast.success(
                    data.appointment?.rescheduleRequestedDate
                        ? 'Reschedule request submitted.'
                        : 'Appointment rescheduled successfully.'
                );
                setSelectedManageAppointment(data.appointment || null);
            } else {
                if (!manageReason.trim()) {
                    setManageError('Please add a cancellation reason.');
                    return;
                }

                const data = await cancelAppointment(selectedManageAppointment._id, {
                    reason: manageReason,
                });

                toast.success(
                    data.appointment?.status === 'cancelled'
                        ? 'Appointment cancelled successfully.'
                        : 'Cancellation request submitted.'
                );
                setSelectedManageAppointment(data.appointment || null);
            }

            await loadDashboard();
            closeManageDialog();
        } catch (requestError) {
            const message = requestError.message || 'Unable to update appointment.';
            setManageError(message);
            toast.error(message);
        } finally {
            setManageLoading(false);
        }
    };

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

                <div className="flex flex-wrap gap-3 border-b border-slate-100 px-6 py-4 text-sm dark:border-slate-800">
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        Pending {appointmentCounts.pending}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <span className="h-2 w-2 rounded-full bg-cyan-500" />
                        Confirmed {appointmentCounts.confirmed}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Completed {appointmentCounts.completed}
                    </span>
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
                                <tr
                                    key={appointment._id}
                                    className={`text-slate-700 dark:text-slate-200 ${
                                        appointment.status === 'pending'
                                            ? 'bg-amber-50/30 dark:bg-amber-950/10'
                                            : appointment.status === 'confirmed'
                                                ? 'bg-cyan-50/20 dark:bg-cyan-950/10'
                                                : appointment.status === 'completed'
                                                    ? 'bg-emerald-50/20 dark:bg-emerald-950/10'
                                                    : ''
                                    }`}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                <UserRound size={16} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">{appointment.patient?.name || 'Patient'}</p>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{appointment.patient?.email || 'No email'}</p>
                                                {hasUploadedReports(appointment) && (
                                                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                                                        <FileUp size={12} />
                                                        Reports uploaded
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{formatReadableDate(appointment.date)}</td>
                                    <td className="px-6 py-4"><span className="inline-flex items-center gap-2"><Clock3 size={15} />{formatSlot(appointment.slot)}</span></td>
                                    <td className="px-6 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusClasses(appointment.status)}`}>{appointment.status}</span></td>
                                    <td className="px-6 py-4">
                                        {hasNotes(appointment) ? (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedNotesAppointment(appointment)}
                                                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                                            >
                                                <FileText size={14} />
                                                View notes
                                            </button>
                                        ) : (
                                            <span className="text-xs text-slate-400 dark:text-slate-500">No notes yet</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {appointment.status === 'pending' ? (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Link
                                                    to={`/doctor/appointments/${appointment._id}`}
                                                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                                                >
                                                    Open
                                                </Link>
                                                <button
                                                    type="button"
                                                    disabled={updatingAppointmentId === appointment._id}
                                                    onClick={() => handleAppointmentAction(appointment._id, 'confirmed')}
                                                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <CheckCircle2 size={14} />
                                                    Approve
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={updatingAppointmentId === appointment._id}
                                                    onClick={() => handleAppointmentAction(appointment._id, 'rejected')}
                                                    className="inline-flex rounded-full border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-500 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800 dark:text-rose-300"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        ) : canManageAppointment(appointment) ? (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Link
                                                    to={`/doctor/appointments/${appointment._id}`}
                                                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                                                >
                                                    Open
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => openManageDialog(appointment, 'reschedule')}
                                                    className="inline-flex items-center gap-2 rounded-full border border-cyan-300 px-4 py-2 text-xs font-semibold text-cyan-700 transition hover:border-cyan-500 hover:text-cyan-800 dark:border-cyan-800 dark:text-cyan-300"
                                                >
                                                    Reschedule
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openManageDialog(appointment, 'cancel')}
                                                    className="inline-flex items-center gap-2 rounded-full border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-500 hover:text-rose-800 dark:border-rose-800 dark:text-rose-300"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Link
                                                    to={`/doctor/appointments/${appointment._id}`}
                                                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                                                >
                                                    Open
                                                </Link>
                                                <span className="text-xs text-slate-400 dark:text-slate-500">Review only</span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <Dialog open={Boolean(selectedManageAppointment)} onOpenChange={closeManageDialog}>
                <DialogContent className="max-h-[86vh] max-w-2xl overflow-hidden rounded-[1.75rem] border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex max-h-[86vh] flex-col">
                        <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-800">
                            <DialogHeader>
                                <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">
                                    {manageMode === 'reschedule' ? 'Reschedule session' : 'Cancel session'}
                                </p>
                                <DialogTitle className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                                    {selectedManageAppointment?.patient?.name || 'Appointment'} on {formatReadableDate(selectedManageAppointment?.date)}
                                </DialogTitle>
                                <DialogDescription className="text-sm leading-6">
                                    {manageMode === 'reschedule'
                                        ? 'Change the session time and notify the patient immediately.'
                                        : 'Cancel the session and add a reason for the patient.'}
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-5">
                            {manageError && (
                                <div className="rounded-[1.15rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                                    {manageError}
                                </div>
                            )}

                            {manageMode === 'reschedule' ? (
                                <div className="mt-4 space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">New date</label>
                                            <Input
                                                key={`manage-date-${manageInputKey}`}
                                                type="date"
                                                min={getTomorrowDateString()}
                                                value={manageDate}
                                                onChange={(event) => setManageDate(event.target.value)}
                                                className="h-11 rounded-2xl border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">New slot</label>
                                            <Input
                                                key={`manage-slot-${manageInputKey}`}
                                                type="text"
                                                value={manageSlot}
                                                onChange={(event) => setManageSlot(event.target.value)}
                                                placeholder="10:00-10:30"
                                                className="h-11 rounded-2xl border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Reason</label>
                                        <textarea
                                            value={manageReason}
                                            onChange={(event) => setManageReason(event.target.value)}
                                            rows={4}
                                            placeholder="Optional note for the patient"
                                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 space-y-4">
                                    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Cancellation reason</p>
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            Add a short explanation so the patient knows why the session is being cancelled.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Reason</label>
                                        <textarea
                                            value={manageReason}
                                            onChange={(event) => setManageReason(event.target.value)}
                                            rows={5}
                                            placeholder="Please tell the patient why you need to cancel."
                                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="mt-5 flex flex-wrap gap-3">
                                <Button type="button" disabled={manageLoading} onClick={handleManageSubmit}>
                                    {manageLoading ? 'Saving...' : manageMode === 'reschedule' ? 'Save reschedule' : 'Cancel session'}
                                </Button>
                                <Button type="button" variant="outline" disabled={manageLoading} onClick={closeManageDialog}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
