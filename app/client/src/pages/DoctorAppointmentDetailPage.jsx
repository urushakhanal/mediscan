import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    BookOpenText,
    CalendarClock,
    Clock3,
    FileText,
    UserRound,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import DashboardPageIntro from '../components/dashboard/DashboardPageIntro';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
    cancelAppointment,
    getDoctorActiveMedicineAvailabilityLocations,
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

const createPrescriptionLine = () => ({
    medicine: '',
    strength: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    availabilityLocationIds: [],
});

const getInitialPrescriptionDraft = () => [createPrescriptionLine()];

const buildPrescriptionText = (items) => {
    const lines = items
        .map((item, index) => {
            const medicine = String(item?.medicine || '').trim();
            const strength = String(item?.strength || '').trim();
            const dosage = String(item?.dosage || '').trim();
            const frequency = String(item?.frequency || '').trim();
            const duration = String(item?.duration || '').trim();
            const instructions = String(item?.instructions || '').trim();

            if (!medicine && !strength && !dosage && !frequency && !duration && !instructions) {
                return null;
            }

            const headerParts = [medicine, strength].filter(Boolean).join(' ');
            const bodyParts = [dosage, frequency, duration].filter(Boolean).join(' | ');

            return [
                `${index + 1}. ${headerParts || 'Medicine'}`,
                bodyParts ? `   ${bodyParts}` : null,
                instructions ? `   Instructions: ${instructions}` : null,
            ].filter(Boolean).join('\n');
        })
        .filter(Boolean);

    return lines.join('\n\n');
};

const parsePrescriptionText = (value) =>
    String(value || '')
        .split(/\n\s*\n/)
        .map((block) => block.trim())
        .filter(Boolean)
        .map((block) => {
            const [headerLine = '', ...rest] = block.split('\n');
            const header = headerLine.replace(/^\d+\.\s*/, '').trim();
            const instructionsLine = rest.find((line) => line.toLowerCase().includes('instructions:')) || '';
            const summaryLine = rest.find((line) => line.trim() && !line.toLowerCase().includes('instructions:')) || '';

            const [medicine = '', strength = ''] = header.split(/\s{2,}|\s(?=\d)/).map((part) => part.trim()).filter(Boolean);
            const instructionText = instructionsLine.replace(/^\s*instructions:\s*/i, '').trim();
            const [dosage = '', frequency = '', duration = ''] = summaryLine
                .split('|')
                .map((part) => part.trim());

            return {
                medicine: medicine || header,
                strength,
                dosage,
                frequency,
                duration,
                instructions: instructionText,
                availabilityLocationIds: [],
            };
        });

const getPrescriptionDraftFromAppointment = (nextAppointment) => {
    if (Array.isArray(nextAppointment?.prescriptionItems) && nextAppointment.prescriptionItems.length > 0) {
        return nextAppointment.prescriptionItems.map((item) => ({
            medicine: item?.medicine || '',
            strength: item?.strength || '',
            dosage: item?.dosage || '',
            frequency: item?.frequency || '',
            duration: item?.duration || '',
            instructions: item?.instructions || '',
            availabilityLocationIds: Array.isArray(item?.availabilityLocationIds)
                ? item.availabilityLocationIds.map((entry) => (
                    typeof entry === 'string' ? entry : String(entry?._id || '')
                )).filter(Boolean)
                : [],
        }));
    }

    if (nextAppointment?.prescription?.trim()) {
        return parsePrescriptionText(nextAppointment.prescription);
    }

    return getInitialPrescriptionDraft();
};

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
    const [prescriptionDraft, setPrescriptionDraft] = useState(getInitialPrescriptionDraft());
    const [availabilityLocations, setAvailabilityLocations] = useState([]);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleSlot, setRescheduleSlot] = useState('');
    const [rescheduleReason, setRescheduleReason] = useState('');
    const [rescheduleSaving, setRescheduleSaving] = useState(false);
    const [rescheduleError, setRescheduleError] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const [cancelSaving, setCancelSaving] = useState(false);
    const [cancelError, setCancelError] = useState('');
    const [activeTab, setActiveTab] = useState('request');

    const syncAppointment = useCallback((nextAppointment) => {
        setAppointment(nextAppointment);
        setScanRequestNote(nextAppointment?.scanRequestNote || '');
        setPrescriptionDraft(getPrescriptionDraftFromAppointment(nextAppointment));
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

    useEffect(() => {
        const loadLocations = async () => {
            try {
                const data = await getDoctorActiveMedicineAvailabilityLocations();
                setAvailabilityLocations(data.locations || []);
            } catch {
                setAvailabilityLocations([]);
            }
        };

        loadLocations();
    }, []);

    const isConsultationLocked = useMemo(
        () => !appointment || ['completed', 'rejected', 'cancelled'].includes(appointment.status) || !isConsultationEditing,
        [appointment, isConsultationEditing]
    );

    const canManageWorkflow = Boolean(appointment && !['completed', 'rejected', 'cancelled'].includes(appointment.status));
    const workflowTabs = [
        { id: 'request', label: 'Request' },
        { id: 'consultation', label: 'Consultation' },
        { id: 'reports', label: 'Reports' },
    ];

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

    const handlePrescriptionDraftChange = (index, field, value) => {
        setPrescriptionDraft((current) =>
            current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
        );
    };

    const handleAddPrescriptionLine = () => {
        setPrescriptionDraft((current) => [...current, createPrescriptionLine()]);
    };

    const handleRemovePrescriptionLine = (index) => {
        setPrescriptionDraft((current) => {
            if (current.length === 1) {
                return [createPrescriptionLine()];
            }

            return current.filter((_, itemIndex) => itemIndex !== index);
        });
    };

    const handleApplyPrescriptionTemplate = () => {
        const nextPrescription = buildPrescriptionText(prescriptionDraft);
        if (!nextPrescription) {
            toast.error('Add at least one prescription item before generating text.');
            return;
        }

        setForm((current) => ({
            ...current,
            prescription: nextPrescription,
        }));
        toast.success('Prescription template applied.');
    };

    const handleConsultationSave = async (nextStatus = '') => {
        try {
            setSaving(true);
            const generatedPrescription = buildPrescriptionText(prescriptionDraft);
            const data = await updateDoctorAppointmentConsultation(id, {
                ...form,
                prescription: form.prescription.trim() || generatedPrescription,
                prescriptionItems: prescriptionDraft.map((item) => ({
                    medicine: item.medicine,
                    strength: item.strength,
                    dosage: item.dosage,
                    frequency: item.frequency,
                    duration: item.duration,
                    instructions: item.instructions,
                    availabilityLocationIds: Array.isArray(item.availabilityLocationIds) ? item.availabilityLocationIds : [],
                })),
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
        setPrescriptionDraft(getPrescriptionDraftFromAppointment(appointment));
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
        <div className="relative space-y-6 overflow-hidden">
            <div className="pointer-events-none absolute -top-20 right-[-6rem] h-56 w-56 rounded-full bg-cyan-200/25 blur-3xl dark:bg-cyan-400/10" />
            <div className="pointer-events-none absolute top-48 left-[-5rem] h-72 w-72 rounded-full bg-rose-200/20 blur-3xl dark:bg-rose-400/10" />
            <DashboardPageIntro
                eyebrow="Doctor Workspace"
                title={loading ? 'Loading appointment' : formatUserDisplayName(appointment?.patient)}
                description="Review the booking details, document the consultation, and close the visit from one focused workspace."
                actions={(
                    <div className="flex flex-wrap gap-3">
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

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
                <section className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                    <div className="grid gap-4 border-b border-slate-100 pb-5 dark:border-slate-800 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Workflow</p>
                            <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Process one section at a time</h2>
                            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                                Switch between the request, consultation, and reports panels so the appointment stays readable while you work.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
                                    {appointment?.patient?.name || 'Patient'}
                                </span>
                                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
                                    {formatReadableDate(appointment?.date)}
                                </span>
                                <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusClasses(appointment?.status)}`}>
                                    {appointment?.status || 'pending'}
                                </span>
                            </div>
                        </div>

                        <div className="w-full max-w-full overflow-x-auto rounded-[1.6rem] border border-slate-200 bg-slate-50 p-1 shadow-sm dark:border-slate-800 dark:bg-slate-950/40 lg:w-auto lg:self-start">
                            <div className="flex min-w-max flex-nowrap gap-1">
                                {workflowTabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`whitespace-nowrap rounded-[1.2rem] px-4 py-2.5 text-sm font-semibold transition ${
                                            activeTab === tab.id
                                                ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-sm dark:from-white dark:to-slate-100 dark:text-slate-900'
                                                : 'text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        {activeTab === 'request' && (
                            <div className="space-y-5">
                                {canManageWorkflow ? (
                                    <>
                                        <div className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
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
                                        </div>

                                        {(appointment?.rescheduleRequestedDate || appointment?.cancellationRequestedReason) && (
                                            <div className="grid gap-4 md:grid-cols-2">
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

                                        <div className="grid gap-5 xl:grid-cols-2">
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
                                    </>
                                ) : (
                                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
                                        This appointment is already resolved, so the request controls are locked.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'consultation' && (
                            <div className="space-y-5">
                                {appointment?.status === 'pending' && (
                                    <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                                        Confirm this appointment first to unlock consultation fields.
                                    </div>
                                )}

                                <div className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/40">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Visit details</p>
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{consultationStateLabel}</p>
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

                                {appointment?.status === 'completed' ? (
                                    <div className="grid gap-4 md:grid-cols-2">
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
                                ) : (
                                    <div className="grid gap-4">
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

                                        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Prescription builder</p>
                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                        Add one medicine per row, then generate the final prescription text.
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    disabled={isConsultationLocked}
                                                    onClick={handleApplyPrescriptionTemplate}
                                                >
                                                    Generate text
                                                </Button>
                                            </div>

                                            <div className="mt-4 space-y-3">
                                                {prescriptionDraft.map((item, index) => (
                                                    <div key={`prescription-line-${index}`} className="rounded-[1.35rem] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                                                Medicine {index + 1}
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemovePrescriptionLine(index)}
                                                                disabled={isConsultationLocked}
                                                                className="text-xs font-semibold text-rose-600 transition hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-rose-300 dark:hover:text-rose-200"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                            <Input
                                                                value={item.medicine}
                                                                onChange={(event) => handlePrescriptionDraftChange(index, 'medicine', event.target.value)}
                                                                disabled={isConsultationLocked}
                                                                placeholder="Medicine name"
                                                                className="h-11 rounded-2xl border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
                                                            />
                                                            <Input
                                                                value={item.strength}
                                                                onChange={(event) => handlePrescriptionDraftChange(index, 'strength', event.target.value)}
                                                                disabled={isConsultationLocked}
                                                                placeholder="Strength, e.g. 500 mg"
                                                                className="h-11 rounded-2xl border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
                                                            />
                                                            <Input
                                                                value={item.dosage}
                                                                onChange={(event) => handlePrescriptionDraftChange(index, 'dosage', event.target.value)}
                                                                disabled={isConsultationLocked}
                                                                placeholder="Dosage, e.g. 1 tablet"
                                                                className="h-11 rounded-2xl border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
                                                            />
                                                            <Input
                                                                value={item.frequency}
                                                                onChange={(event) => handlePrescriptionDraftChange(index, 'frequency', event.target.value)}
                                                                disabled={isConsultationLocked}
                                                                placeholder="Frequency, e.g. Twice daily"
                                                                className="h-11 rounded-2xl border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
                                                            />
                                                            <Input
                                                                value={item.duration}
                                                                onChange={(event) => handlePrescriptionDraftChange(index, 'duration', event.target.value)}
                                                                disabled={isConsultationLocked}
                                                                placeholder="Duration, e.g. 5 days"
                                                                className="h-11 rounded-2xl border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
                                                            />
                                                            <Input
                                                                value={item.instructions}
                                                                onChange={(event) => handlePrescriptionDraftChange(index, 'instructions', event.target.value)}
                                                                disabled={isConsultationLocked}
                                                                placeholder="Special instructions"
                                                                className="h-11 rounded-2xl border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
                                                            />
                                                            <div className="md:col-span-2">
                                                                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                                                    Available at
                                                                </label>
                                                                <select
                                                                    value=""
                                                                    onChange={(event) => {
                                                                        const nextId = event.target.value;
                                                                        if (!nextId) {
                                                                            return;
                                                                        }

                                                                        const currentIds = Array.isArray(item.availabilityLocationIds)
                                                                            ? item.availabilityLocationIds
                                                                            : [];
                                                                        if (currentIds.includes(nextId)) {
                                                                            return;
                                                                        }

                                                                        handlePrescriptionDraftChange(index, 'availabilityLocationIds', [...currentIds, nextId]);
                                                                    }}
                                                                    disabled={isConsultationLocked}
                                                                    className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:disabled:bg-slate-900"
                                                                >
                                                                    <option value="">Select location</option>
                                                                    {availabilityLocations.map((location) => (
                                                                        <option key={location._id} value={location._id}>
                                                                            {location.name} - {location.address}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <div className="mt-2 flex flex-wrap gap-2">
                                                                    {(item.availabilityLocationIds || []).map((locationId) => {
                                                                        const location = availabilityLocations.find((entry) => entry._id === locationId);
                                                                        return (
                                                                            <span
                                                                                key={`${index}-${locationId}`}
                                                                                className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 dark:border-cyan-900/50 dark:bg-cyan-950/30 dark:text-cyan-200"
                                                                            >
                                                                                {location ? location.name : 'Selected location'}
                                                                                <button
                                                                                    type="button"
                                                                                    disabled={isConsultationLocked}
                                                                                    onClick={() => {
                                                                                        const nextIds = (item.availabilityLocationIds || []).filter((id) => id !== locationId);
                                                                                        handlePrescriptionDraftChange(index, 'availabilityLocationIds', nextIds);
                                                                                    }}
                                                                                    className="text-cyan-700 transition hover:text-cyan-900 disabled:cursor-not-allowed disabled:opacity-60 dark:text-cyan-200 dark:hover:text-white"
                                                                                >
                                                                                    x
                                                                                </button>
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                                                    Pick one location at a time from dropdown.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-3">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    disabled={isConsultationLocked}
                                                    onClick={handleAddPrescriptionLine}
                                                >
                                                    Add medicine
                                                </Button>
                                            </div>

                                            <div className="mt-4">
                                                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Final prescription text</label>
                                                <textarea
                                                    value={form.prescription}
                                                    onChange={(event) => handleFormChange('prescription', event.target.value)}
                                                    disabled={isConsultationLocked}
                                                    rows={7}
                                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:disabled:bg-slate-900"
                                                    placeholder="The generated prescription text will appear here"
                                                />
                                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                                    This is the version that will be saved and shown to the patient.
                                                </p>
                                            </div>
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
                                )}

                                {appointment?.status === 'confirmed' && !isConsultationEditing && hasConsultationNotesData(appointment) && (
                                    <div className="rounded-[1.9rem] border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Saved consultation</p>
                                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                                            <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Consultation notes</p>
                                                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{appointment.consultationNotes || 'Not recorded'}</p>
                                            </div>
                                            <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Diagnosis</p>
                                                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{appointment.diagnosis || 'Not recorded'}</p>
                                            </div>
                                            <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Prescription</p>
                                                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{appointment.prescription || 'Not recorded'}</p>
                                            </div>
                                            <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Doctor advice</p>
                                                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{appointment.doctorAdvice || 'Not recorded'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'reports' && (
                            <div className="space-y-5">
                                {appointment?.status !== 'rejected' && appointment?.status !== 'cancelled' ? (
                                    <div className="grid gap-4 lg:grid-cols-[0.95fr,1.05fr]">
                                        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/40">
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
                                                        className="rounded-[1.15rem] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60"
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

                                        <div className="space-y-4">
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

                                            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Request note</p>
                                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                                    Ask the patient to upload a scan or lab report.
                                                </p>
                                                <textarea
                                                    value={scanRequestNote}
                                                    onChange={(event) => setScanRequestNote(event.target.value)}
                                                    rows={5}
                                                    placeholder="Ask the patient to upload a scan or lab report"
                                                    className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400"
                                                />
                                                {scanRequestError && (
                                                    <div className="mt-3 rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                                                        {scanRequestError}
                                                    </div>
                                                )}
                                                <div className="mt-4 flex flex-wrap gap-3">
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
                                    </div>
                                ) : (
                                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
                                        Report requests are unavailable for resolved appointments.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                <aside className="space-y-6 xl:sticky xl:top-6 self-start">
                    <section className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Patient snapshot</p>
                        <div className="mt-4 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-200">
                                <UserRound size={20} />
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-slate-900 dark:text-white">{appointment?.patient?.name || 'Patient'}</p>
                                <p className="truncate text-sm text-slate-500 dark:text-slate-400">{appointment?.patient?.email || 'No email'}</p>
                            </div>
                        </div>
                        {appointment?.patient?._id && (
                            <Link
                                to={`/doctor/patients/${appointment.patient._id}/record`}
                                className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:bg-white hover:text-slate-900 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:border-white dark:hover:bg-slate-900 dark:hover:text-white"
                            >
                                <BookOpenText size={16} />
                                Open record book
                            </Link>
                        )}
                    </section>

                    <section className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Appointment details</p>
                        <div className="mt-4 space-y-4">
                            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Date</p>
                                <p className="mt-2 font-semibold text-slate-900 dark:text-white">{formatReadableDate(appointment?.date)}</p>
                            </div>
                            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Slot</p>
                                <p className="mt-2 font-semibold text-slate-900 dark:text-white">{formatSlot(appointment?.slot)}</p>
                            </div>
                            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Status</p>
                                <p className="mt-2">
                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusClasses(appointment?.status)}`}>
                                        {appointment?.status || 'pending'}
                                    </span>
                                </p>
                            </div>
                            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Last update</p>
                                <p className="mt-2 font-semibold text-slate-900 dark:text-white">{formatDateTime(appointment?.completedAt || appointment?.updatedAt)}</p>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Quick context</p>
                        <div className="mt-4 space-y-4">
                            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Symptoms</p>
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                                    {appointment?.symptoms || 'Not provided'}
                                </p>
                            </div>
                            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Previous condition</p>
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                                    {appointment?.previousMedicalCondition || 'Not provided'}
                                </p>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
};

export default DoctorAppointmentDetailPage;
