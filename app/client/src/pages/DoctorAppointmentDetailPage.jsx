import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    BookOpenText,
    CalendarClock,
    Clock3,
    FileText,
    Stethoscope,
    UserRound,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import DashboardPageIntro from '../components/dashboard/DashboardPageIntro';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
    cancelAppointment,
    getDoctorAppointmentById,
    rescheduleAppointment,
    updateAppointmentStatus,
    updateDoctorAppointmentConsultation,
} from '../lib/auth';
import { formatReadableDate, formatSlot, getStatusClasses, getTomorrowDateString, resolveUploadUrl } from '../lib/appointments';
import { formatUserDisplayName } from '../lib/utils';

const getInitialFormState = () => ({
    consultationNotes: '',
    diagnosis: '',
    prescription: '',
    doctorAdvice: '',
    recommendedTests: '',
    visitOutcome: '',
    scanRequestNote: '',
    followUpRequired: false,
    followUpDate: '',
});

const getFormStateFromAppointment = (nextAppointment) => ({
    consultationNotes: nextAppointment?.consultationNotes || '',
    diagnosis: nextAppointment?.diagnosis || '',
    prescription: nextAppointment?.prescription || '',
    doctorAdvice: nextAppointment?.doctorAdvice || '',
    recommendedTests: nextAppointment?.recommendedTests || '',
    visitOutcome: nextAppointment?.visitOutcome || '',
    scanRequestNote: nextAppointment?.scanRequestNote || '',
    followUpRequired: Boolean(nextAppointment?.followUpRequired),
    followUpDate: nextAppointment?.followUpDate || '',
});

const formatDateTime = (value) => {
    if (!value) {
        return 'Not recorded';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Not recorded';
    }

    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
};

const formatDocumentTimestamp = (value) => {
    if (!value) {
        return 'Recently uploaded';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Recently uploaded';
    }

    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
};

const hasConsultationNotesData = (nextAppointment) =>
    Boolean(
        nextAppointment?.consultationNotes?.trim() ||
            nextAppointment?.diagnosis?.trim() ||
            nextAppointment?.prescription?.trim() ||
            nextAppointment?.doctorAdvice?.trim() ||
            nextAppointment?.recommendedTests?.trim() ||
            nextAppointment?.visitOutcome?.trim() ||
            nextAppointment?.scanRequestNote?.trim() ||
            nextAppointment?.followUpRequired
    );

const DoctorAppointmentDetailPage = () => {
    const { id } = useParams();
    const [appointment, setAppointment] = useState(null);
    const [form, setForm] = useState(getInitialFormState());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusLoading, setStatusLoading] = useState('');
    const [error, setError] = useState('');
    const [isConsultationEditing, setIsConsultationEditing] = useState(false);
    const [scanRequestNote, setScanRequestNote] = useState('');
    const [scanRequestSaving, setScanRequestSaving] = useState(false);
    const [scanRequestError, setScanRequestError] = useState('');
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleSlot, setRescheduleSlot] = useState('');
    const [rescheduleReason, setRescheduleReason] = useState('');
    const [rescheduleSaving, setRescheduleSaving] = useState(false);
    const [rescheduleError, setRescheduleError] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const [cancelSaving, setCancelSaving] = useState(false);
    const [cancelError, setCancelError] = useState('');

    const syncAppointment = useCallback((nextAppointment) => {
        setAppointment(nextAppointment);
        setScanRequestNote(nextAppointment?.scanRequestNote || '');
        setRescheduleDate(nextAppointment?.rescheduleRequestedDate || nextAppointment?.date || '');
        setRescheduleSlot(nextAppointment?.rescheduleRequestedSlot || nextAppointment?.slot || '');
        setRescheduleReason('');
        setCancelReason(nextAppointment?.cancellationRequestedReason || '');
        setRescheduleError('');
        setCancelError('');
        if (['completed', 'cancelled', 'rejected'].includes(nextAppointment?.status)) {
            setForm(getInitialFormState());
            setIsConsultationEditing(false);
            return;
        }

        if (hasConsultationNotesData(nextAppointment)) {
            setForm(getInitialFormState());
            setIsConsultationEditing(false);
            return;
        }

        setForm(getFormStateFromAppointment(nextAppointment));
        setIsConsultationEditing(nextAppointment?.status === 'confirmed');
    }, []);

    const loadAppointment = useCallback(async ({ silent = false } = {}) => {
        try {
            if (!silent) {
                setLoading(true);
            }
            setError('');
            const data = await getDoctorAppointmentById(id);
            syncAppointment(data.appointment || null);
        } catch (requestError) {
            setError(requestError.message || 'Unable to load appointment.');
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, [id, syncAppointment]);

    useEffect(() => {
        loadAppointment();
    }, [loadAppointment]);

    const isConsultationLocked = useMemo(
        () => !appointment || ['completed', 'rejected', 'cancelled'].includes(appointment.status) || !isConsultationEditing,
        [appointment, isConsultationEditing]
    );

    const consultationStateLabel = useMemo(() => {
        if (!appointment) {
            return 'Loading';
        }

        if (appointment.status === 'completed') {
            return 'Completed';
        }

        if (appointment.status === 'pending') {
            return 'Awaiting confirmation';
        }

        if (appointment.status === 'cancelled') {
            return 'Cancelled';
        }

        if (isConsultationEditing) {
            return 'Editing notes';
        }

        if (hasConsultationNotesData(appointment)) {
            return 'Saved and locked';
        }

        return 'Ready to write';
    }, [appointment, isConsultationEditing]);

    const handleStatusChange = async (status) => {
        try {
            setStatusLoading(status);
            await updateAppointmentStatus(id, { status });
            toast.success(status === 'confirmed' ? 'Appointment confirmed.' : 'Appointment rejected.');
            await loadAppointment();
        } catch (requestError) {
            setError(requestError.message || 'Unable to update appointment.');
            toast.error(requestError.message || 'Unable to update appointment.');
        } finally {
            setStatusLoading('');
        }
    };

    const handleDoctorReschedule = async () => {
        try {
            if (!rescheduleDate || !rescheduleSlot) {
                setRescheduleError('Please select both a new date and time slot.');
                return;
            }

            setRescheduleSaving(true);
            setRescheduleError('');
            const data = await rescheduleAppointment(id, {
                date: rescheduleDate,
                slot: rescheduleSlot,
                reason: rescheduleReason,
            });

            setAppointment(data.appointment || null);
            toast.success(
                data.appointment?.rescheduleRequestedDate
                    ? 'Patient reschedule request approved.'
                    : 'Appointment rescheduled successfully.'
            );
            await loadAppointment();
        } catch (requestError) {
            const message = requestError.message || 'Unable to reschedule appointment.';
            setRescheduleError(message);
            toast.error(message);
        } finally {
            setRescheduleSaving(false);
        }
    };

    const handleDoctorCancel = async () => {
        try {
            const cancellationReason = cancelReason.trim() || appointment?.cancellationRequestedReason || '';
            if (!cancellationReason) {
                setCancelError('Please add a cancellation reason.');
                return;
            }

            setCancelSaving(true);
            setCancelError('');
            const data = await cancelAppointment(id, {
                reason: cancellationReason,
            });

            setAppointment(data.appointment || null);
            toast.success(
                data.appointment?.status === 'cancelled'
                    ? 'Appointment cancelled successfully.'
                    : 'Cancellation request approved.'
            );
            await loadAppointment();
        } catch (requestError) {
            const message = requestError.message || 'Unable to cancel appointment.';
            setCancelError(message);
            toast.error(message);
        } finally {
            setCancelSaving(false);
        }
    };

    const handleFormChange = (field, value) => {
        setForm((current) => ({
            ...current,
            ...(field === 'followUpRequired' && value === false ? { followUpDate: '' } : {}),
            [field]: value,
        }));
    };

    const handleConsultationSave = async (nextStatus = '') => {
        try {
            setSaving(true);
            const data = await updateDoctorAppointmentConsultation(id, {
                ...form,
                scanRequestNote,
                status: nextStatus,
            });
            toast.success(nextStatus === 'completed' ? 'Appointment completed.' : 'Consultation saved.');
            if (nextStatus === 'completed') {
                setAppointment(data.appointment || null);
                setForm(getInitialFormState());
                setIsConsultationEditing(false);
            } else {
                syncAppointment(data.appointment || null);
            }
        } catch (requestError) {
            setError(requestError.message || 'Unable to save consultation.');
            toast.error(requestError.message || 'Unable to save consultation.');
        } finally {
            setSaving(false);
        }
    };

    const handleStartEditing = () => {
        if (!appointment || appointment.status !== 'confirmed') {
            return;
        }

        setForm(getFormStateFromAppointment(appointment));
        setIsConsultationEditing(true);
    };

    const handleScanRequestSave = async () => {
        try {
            if (!scanRequestNote.trim()) {
                setScanRequestError('Please add a note for the requested scan.');
                return;
            }

            setScanRequestSaving(true);
            setScanRequestError('');
            const data = await updateDoctorAppointmentConsultation(id, {
                ...form,
                scanRequestNote,
                status: '',
            });

            setAppointment(data.appointment || null);
            toast.success('Scan request saved.');
        } catch (requestError) {
            const message = requestError.message || 'Unable to save scan request.';
            setScanRequestError(message);
            toast.error(message);
        } finally {
            setScanRequestSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <DashboardPageIntro
                eyebrow="Doctor Workspace"
                title={loading ? 'Loading appointment' : formatUserDisplayName(appointment?.patient)}
                description="Review the booking details, document the consultation, and close the visit from one focused workspace."
                actions={(
                    <div className="flex flex-wrap gap-3">
                        {appointment?.patient?._id && (
                            <Link
                                to={`/doctor/patients/${appointment.patient._id}/record`}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                            >
                                <BookOpenText size={16} />
                                Open record book
                            </Link>
                        )}
                        <Link
                            to="/doctor/appointments"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                        >
                            <ArrowLeft size={16} />
                            Back to queue
                        </Link>
                    </div>
                )}
            />

            {error && (
                <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                    {error}
                </div>
            )}

            <section className="grid gap-4 xl:grid-cols-4">
                <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Patient</p>
                    <div className="mt-3 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-200">
                            <UserRound size={18} />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white">{appointment?.patient?.name || 'Patient'}</p>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                {appointment?.patient?.email || 'No email'}
                            </p>
                        </div>
                    </div>
                </article>

                <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Schedule</p>
                    <div className="mt-3 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                            <CalendarClock size={18} />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{formatReadableDate(appointment?.date)}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{formatSlot(appointment?.slot)}</p>
                        </div>
                    </div>
                </article>

                <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Status</p>
                    <div className="mt-3 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
                            <Clock3 size={18} />
                        </div>
                        <div>
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusClasses(appointment?.status)}`}>
                                {appointment?.status || 'pending'}
                            </span>
                        </div>
                    </div>
                </article>

                <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Recorded</p>
                    <div className="mt-3 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <FileText size={18} />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{formatDateTime(appointment?.completedAt || appointment?.updatedAt)}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Last update</p>
                        </div>
                    </div>
                </article>
            </section>

            {appointment?.status !== 'completed' && appointment?.status !== 'rejected' && appointment?.status !== 'cancelled' && (
                <section className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-200">
                            <CalendarClock size={18} />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Schedule actions</p>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Reschedule or cancel session</h2>
                        </div>
                    </div>

                    {(appointment?.rescheduleRequestedDate || appointment?.cancellationRequestedReason) && (
                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            {appointment?.rescheduleRequestedDate && (
                                <div className="rounded-[1.4rem] border border-cyan-200 bg-cyan-50/70 p-5 dark:border-cyan-900/60 dark:bg-cyan-950/20">
                                    <p className="text-xs uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Reschedule request</p>
                                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                                        {formatReadableDate(appointment.rescheduleRequestedDate)} at {formatSlot(appointment.rescheduleRequestedSlot)}
                                    </p>
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                                        {appointment.rescheduleRequestedReason || 'No reason added.'}
                                    </p>
                                    <Button type="button" className="mt-4" disabled={rescheduleSaving} onClick={handleDoctorReschedule}>
                                        {rescheduleSaving ? 'Approving...' : 'Approve requested reschedule'}
                                    </Button>
                                </div>
                            )}

                            {appointment?.cancellationRequestedReason && (
                                <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50/70 p-5 dark:border-rose-900/60 dark:bg-rose-950/20">
                                    <p className="text-xs uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">Cancellation request</p>
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                                        {appointment.cancellationRequestedReason}
                                    </p>
                                    <Button type="button" className="mt-4" disabled={cancelSaving} onClick={handleDoctorCancel}>
                                        {cancelSaving ? 'Approving...' : 'Approve cancellation'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-5 grid gap-5 xl:grid-cols-2">
                        <div className="rounded-[1.45rem] border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Reschedule session</p>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">New date</label>
                                    <Input
                                        type="date"
                                        min={getTomorrowDateString()}
                                        value={rescheduleDate}
                                        onChange={(event) => setRescheduleDate(event.target.value)}
                                        className="h-11 rounded-2xl border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">New slot</label>
                                    <Input
                                        type="text"
                                        value={rescheduleSlot}
                                        onChange={(event) => setRescheduleSlot(event.target.value)}
                                        placeholder="10:00-10:30"
                                        className="h-11 rounded-2xl border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
                                    />
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Reason</label>
                                <textarea
                                    value={rescheduleReason}
                                    onChange={(event) => setRescheduleReason(event.target.value)}
                                    rows={4}
                                    placeholder="Optional note for the patient"
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400"
                                />
                            </div>
                            {rescheduleError && (
                                <div className="mt-3 rounded-[1.1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                                    {rescheduleError}
                                </div>
                            )}
                            <div className="mt-4 flex flex-wrap gap-3">
                                <Button type="button" disabled={rescheduleSaving} onClick={handleDoctorReschedule}>
                                    {rescheduleSaving ? 'Saving...' : 'Save reschedule'}
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-[1.45rem] border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Cancel session</p>
                            <div className="mt-4">
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Reason</label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(event) => setCancelReason(event.target.value)}
                                    rows={5}
                                    placeholder="Tell the patient why this appointment is being cancelled"
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400"
                                />
                            </div>
                            {cancelError && (
                                <div className="mt-3 rounded-[1.1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                                    {cancelError}
                                </div>
                            )}
                            <div className="mt-4 flex flex-wrap gap-3">
                                <Button type="button" variant="outline" disabled={cancelSaving} onClick={handleDoctorCancel}>
                                    {cancelSaving ? 'Saving...' : 'Cancel session'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <div className="grid gap-6 xl:grid-cols-[1fr,0.9fr]">
                <section className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Consultation</p>
                            <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Visit details</h2>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{consultationStateLabel}</p>
                        </div>
                        {appointment?.status === 'pending' && (
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={statusLoading === 'rejected'}
                                    onClick={() => handleStatusChange('rejected')}
                                >
                                    {statusLoading === 'rejected' ? 'Rejecting...' : 'Reject'}
                                </Button>
                                <Button
                                    type="button"
                                    disabled={statusLoading === 'confirmed'}
                                    onClick={() => handleStatusChange('confirmed')}
                                >
                                    {statusLoading === 'confirmed' ? 'Confirming...' : 'Confirm'}
                                </Button>
                            </div>
                        )}
                        {appointment?.status === 'confirmed' && !isConsultationEditing && (
                            <div className="flex flex-col items-end gap-2">
                                <Button type="button" variant="outline" onClick={handleStartEditing}>
                                    Edit notes
                                </Button>
                                {hasConsultationNotesData(appointment) && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Saved notes are locked until you reopen editing.</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-6 grid gap-5">
                        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Symptoms shared during booking</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                                {appointment?.symptoms || 'Not provided'}
                            </p>
                        </div>

                        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Previous medical condition</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                                {appointment?.previousMedicalCondition || 'Not provided'}
                            </p>
                        </div>

                        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/40">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Uploaded reports</p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Reports attached while booking appear here.
                                    </p>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-200">
                                    <FileText size={18} />
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                {appointment?.medicalDocuments?.length ? appointment.medicalDocuments.map((document) => (
                                    <article
                                        key={`${document.fileName}-${document.uploadedAt}`}
                                        className="rounded-[1.15rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">
                                                    {document.title || document.fileName || 'Uploaded report'}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    {formatDocumentTimestamp(document.uploadedAt)} - {document.uploadedByRole || 'patient'}
                                                </p>
                                            </div>
                                            {document.fileUrl && (
                                                <a
                                                    href={resolveUploadUrl(document.fileUrl)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                                                >
                                                    Open file
                                                </a>
                                            )}
                                        </div>
                                        {document.reviewNote && (
                                            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                                                {document.reviewNote}
                                            </p>
                                        )}
                                    </article>
                                )) : (
                                    <div className="rounded-[1.15rem] border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                        No uploaded reports yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                            <Stethoscope size={18} />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Action</p>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Consultation notes</h2>
                        </div>
                    </div>

                    {appointment?.status === 'pending' && (
                        <div className="mt-5 rounded-[1.4rem] border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                            Confirm this appointment first to unlock consultation fields.
                        </div>
                    )}

                    <div className="mt-5 space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Consultation notes</label>
                            <textarea
                                value={form.consultationNotes}
                                onChange={(event) => handleFormChange('consultationNotes', event.target.value)}
                                disabled={isConsultationLocked}
                                rows={4}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:disabled:bg-slate-900"
                                placeholder="Summarize the consultation here"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Diagnosis</label>
                                <Input
                                    value={form.diagnosis}
                                    onChange={(event) => handleFormChange('diagnosis', event.target.value)}
                                    disabled={isConsultationLocked}
                                    placeholder="Enter diagnosis"
                                    className="h-11 rounded-2xl border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Follow-up date</label>
                                <Input
                                    type="date"
                                    value={form.followUpDate}
                                    onChange={(event) => handleFormChange('followUpDate', event.target.value)}
                                    disabled={isConsultationLocked || !form.followUpRequired}
                                    required={form.followUpRequired}
                                    className="h-11 rounded-2xl border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Prescription</label>
                            <textarea
                                value={form.prescription}
                                onChange={(event) => handleFormChange('prescription', event.target.value)}
                                disabled={isConsultationLocked}
                                rows={4}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:disabled:bg-slate-900"
                                placeholder="List medicine, dosage, and instructions"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Recommended tests</label>
                                <textarea
                                    value={form.recommendedTests}
                                    onChange={(event) => handleFormChange('recommendedTests', event.target.value)}
                                    disabled={isConsultationLocked}
                                    rows={3}
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:disabled:bg-slate-900"
                                    placeholder="Lab work or imaging"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Doctor advice</label>
                                <textarea
                                    value={form.doctorAdvice}
                                    onChange={(event) => handleFormChange('doctorAdvice', event.target.value)}
                                    disabled={isConsultationLocked}
                                    rows={3}
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:disabled:bg-slate-900"
                                    placeholder="Lifestyle or care instructions"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Visit outcome</label>
                            <textarea
                                value={form.visitOutcome}
                                onChange={(event) => handleFormChange('visitOutcome', event.target.value)}
                                disabled={isConsultationLocked}
                                rows={3}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:disabled:bg-slate-900"
                                placeholder="Short summary of the visit outcome"
                            />
                        </div>

                        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                            <input
                                type="checkbox"
                                checked={form.followUpRequired}
                                onChange={(event) => handleFormChange('followUpRequired', event.target.checked)}
                                disabled={isConsultationLocked}
                                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 disabled:cursor-not-allowed"
                            />
                            Follow-up required
                        </label>

                        {appointment?.status === 'confirmed' && isConsultationEditing && (
                            <div className="flex flex-wrap gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={saving || isConsultationLocked}
                                    onClick={() => handleConsultationSave('')}
                                >
                                    {saving ? 'Saving...' : 'Save changes'}
                                </Button>
                                <Button
                                    type="button"
                                    disabled={saving || isConsultationLocked}
                                    onClick={() => handleConsultationSave('completed')}
                                >
                                    {saving ? 'Completing...' : 'Mark completed'}
                                </Button>
                            </div>
                        )}
        {appointment?.status === 'confirmed' && !isConsultationEditing && hasConsultationNotesData(appointment) && (
                            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
                                Saved consultation details are shown below for quick review. Click Edit notes when you want to continue this visit.
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {appointment?.status === 'confirmed' && !isConsultationEditing && hasConsultationNotesData(appointment) && (
                <section className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Saved consultation</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Latest saved notes</h2>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Consultation notes</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{appointment.consultationNotes || 'Not recorded'}</p>
                        </div>
                        <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Diagnosis</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{appointment.diagnosis || 'Not recorded'}</p>
                        </div>
                        <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Prescription</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{appointment.prescription || 'Not recorded'}</p>
                        </div>
                        <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Doctor advice</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{appointment.doctorAdvice || 'Not recorded'}</p>
                        </div>
                    </div>
                </section>
            )}

            {appointment?.status === 'completed' && (
                <section className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Final record</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Completed consultation</h2>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Consultation notes</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{appointment.consultationNotes || 'Not recorded'}</p>
                        </div>
                        <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Diagnosis</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{appointment.diagnosis || 'Not recorded'}</p>
                        </div>
                        <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Prescription</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{appointment.prescription || 'Not recorded'}</p>
                        </div>
                        <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Follow-up</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                                {appointment.followUpRequired ? `Required${appointment.followUpDate ? ` on ${formatReadableDate(appointment.followUpDate)}` : ''}` : 'Not required'}
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {appointment?.status !== 'rejected' && appointment?.status !== 'cancelled' && (
                <section className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-200">
                            <FileText size={18} />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Reports</p>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Request scans from patient</h2>
                        </div>
                    </div>

                    {scanRequestError && (
                        <div className="mt-5 rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                            {scanRequestError}
                        </div>
                    )}

                    <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr,1.05fr]">
                        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Current request</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                                {appointment?.scanRequestNote || 'No scan request has been added yet.'}
                            </p>
                            {appointment?.scanRequestedAt && (
                                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                    Requested on {formatDateTime(appointment.scanRequestedAt)}
                                </p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Request note</label>
                                <textarea
                                    value={scanRequestNote}
                                    onChange={(event) => setScanRequestNote(event.target.value)}
                                    rows={4}
                                    placeholder="Ask the patient to upload a scan or lab report"
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400"
                                />
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Button type="button" disabled={scanRequestSaving} onClick={handleScanRequestSave}>
                                    {scanRequestSaving ? 'Saving...' : 'Save request'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setScanRequestNote('')}
                                >
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {appointment?.status !== 'completed' && appointment?.status !== 'rejected' && appointment?.status !== 'cancelled' && hasConsultationNotesData({
                consultationNotes: form.consultationNotes,
                diagnosis: form.diagnosis,
                prescription: form.prescription,
                doctorAdvice: form.doctorAdvice,
                recommendedTests: form.recommendedTests,
                visitOutcome: form.visitOutcome,
                followUpRequired: form.followUpRequired,
                scanRequestNote,
            }) && (
                <section className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Saved draft</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Current notes</h2>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Consultation notes</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{form.consultationNotes || 'Not recorded'}</p>
                        </div>
                        <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Diagnosis</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{form.diagnosis || 'Not recorded'}</p>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default DoctorAppointmentDetailPage;
