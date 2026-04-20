import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { createDoctorFollowUpAppointment, getDoctorAvailability, getDoctorPatientRecord } from '../lib/auth';
import { formatReadableDate, formatSlot, getStatusClasses, getTomorrowDateString, resolveUploadUrl } from '../lib/appointments';
import { formatUserDisplayName } from '../lib/utils';

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

const DoctorPatientRecordPage = () => {
    const { patientId } = useParams();
    const [patient, setPatient] = useState(null);
    const [record, setRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [followUpOpen, setFollowUpOpen] = useState(false);
    const [followUpDate, setFollowUpDate] = useState(getTomorrowDateString());
    const [followUpAvailability, setFollowUpAvailability] = useState(null);
    const [followUpLoading, setFollowUpLoading] = useState(false);
    const [followUpSlot, setFollowUpSlot] = useState('');
    const [followUpSubmitting, setFollowUpSubmitting] = useState(false);
    const [followUpError, setFollowUpError] = useState('');
    const [followUpSourceLabel, setFollowUpSourceLabel] = useState('');

    const loadRecord = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getDoctorPatientRecord(patientId);
            setPatient(data.patient || null);
            setRecord(data.record || null);
        } catch (requestError) {
            setError(requestError.message || 'Unable to load patient record.');
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        loadRecord();
    }, [loadRecord]);

    useEffect(() => {
        const loadAvailability = async () => {
            if (!followUpOpen || !record?.latestAppointment?.doctor?._id || !followUpDate) {
                return;
            }

            try {
                setFollowUpLoading(true);
                setFollowUpError('');
                setFollowUpSlot('');
                const data = await getDoctorAvailability(record.latestAppointment.doctor._id, followUpDate);
                setFollowUpAvailability(data.availability || null);
                const firstAvailableSlot = data?.availability?.availableSlots?.[0];
                if (firstAvailableSlot) {
                    setFollowUpSlot(firstAvailableSlot);
                }
            } catch (requestError) {
                setFollowUpAvailability(null);
                setFollowUpError(requestError.message || 'Unable to load follow-up availability.');
            } finally {
                setFollowUpLoading(false);
            }
        };

        loadAvailability();
    }, [followUpDate, followUpOpen, record?.latestAppointment?.doctor?._id]);

    const latestFollowUp = record?.latestFollowUpAppointment;

    const stats = useMemo(() => ({
        total: record?.totalAppointments || 0,
        completed: record?.completedAppointments || 0,
        active: record?.pendingAppointments || 0,
    }), [record]);

    const recordSummary = useMemo(() => ({
        latestVisitDate: record?.latestAppointment?.date || null,
        latestVisitStatus: record?.latestAppointment?.status || 'pending',
        latestVisitSummary: record?.latestCompletedAppointment?.consultationNotes
            || record?.latestAppointment?.consultationNotes
            || 'No consultation notes recorded yet.',
        latestFollowUpText: latestFollowUp?.followUpRequired
            ? `Required${latestFollowUp?.followUpDate ? ` on ${formatReadableDate(latestFollowUp.followUpDate)}` : ''}`
            : 'No follow-up recorded',
    }), [latestFollowUp, record]);

    const handleOpenFollowUp = (seedDate = getTomorrowDateString(), sourceLabel = 'Record book') => {
        setFollowUpDate(seedDate || getTomorrowDateString());
        setFollowUpSlot('');
        setFollowUpAvailability(null);
        setFollowUpError('');
        setFollowUpSourceLabel(sourceLabel);
        setFollowUpOpen(true);
    };

    const handleCreateFollowUp = async () => {
        if (!followUpDate || !followUpSlot) {
            setFollowUpError('Please choose both a date and a slot.');
            return;
        }

        try {
            setFollowUpSubmitting(true);
            setFollowUpError('');
            await createDoctorFollowUpAppointment(patientId, {
                date: followUpDate,
                slot: followUpSlot,
            });
            setFollowUpOpen(false);
            setFollowUpSourceLabel('');
            await loadRecord();
        } catch (requestError) {
            setFollowUpError(requestError.message || 'Unable to schedule follow-up.');
        } finally {
            setFollowUpSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <DashboardPageIntro
                eyebrow="Doctor Workspace"
                title={loading ? 'Loading patient record' : formatUserDisplayName(patient)}
                description="This record book keeps the patient’s consultations in one timeline so the next visit can continue from the last note."
                actions={(
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => handleOpenFollowUp(getTomorrowDateString(), 'Record book')}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                            <CalendarClock size={16} />
                            Schedule follow-up
                        </button>
                        <Link
                            to="/doctor/patients"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                        >
                            <ArrowLeft size={16} />
                            Back to patients
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
                <DashboardStatCard label="Visits" value={loading ? '--' : stats.total} helper="All encounters" icon={BookOpenText} />
                <DashboardStatCard label="Completed" value={loading ? '--' : stats.completed} tone="emerald" helper="Closed visits" icon={FileText} />
                <DashboardStatCard label="Active" value={loading ? '--' : stats.active} tone="amber" helper="Pending follow-up" icon={Clock3} />
                <DashboardStatCard label="Last seen" value={loading ? '--' : record?.latestAppointment ? formatReadableDate(record.latestAppointment.date) : '--'} tone="cyan" helper="Most recent visit" icon={CalendarClock} />
            </section>

            <section className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Record summary</p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Latest patient context</h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleOpenFollowUp(recordSummary.latestVisitDate || getTomorrowDateString(), 'Latest visit')}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                    >
                        <CalendarClock size={16} />
                        Resume follow-up
                    </button>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Latest note</p>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                            {recordSummary.latestVisitSummary}
                        </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Latest status</p>
                            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{recordSummary.latestVisitStatus}</p>
                        </div>
                        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Follow-up</p>
                            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{recordSummary.latestFollowUpText}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
                <article className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-200">
                            <UserRound size={18} />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Patient</p>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{formatUserDisplayName(patient)}</h2>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Next session context</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                                {latestFollowUp?.consultationNotes || 'No consultation notes recorded yet.'}
                            </p>
                        </div>
                        <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Latest diagnosis</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                                {latestFollowUp?.diagnosis || 'Not recorded'}
                            </p>
                        </div>
                        <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Follow-up</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                                {latestFollowUp?.followUpRequired
                                    ? `Required${latestFollowUp?.followUpDate ? ` on ${formatReadableDate(latestFollowUp.followUpDate)}` : ''}`
                                    : 'No follow-up recorded'}
                            </p>
                        </div>
                    </div>
                </article>

                <section className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                            <Stethoscope size={18} />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Timeline</p>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Consultation history</h2>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        {!loading && (!record?.appointments || record.appointments.length === 0) && (
                            <div className="rounded-[1.4rem] border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                No visits have been recorded for this patient yet.
                            </div>
                        )}

                        {record?.appointments?.map((appointment) => (
                            <article key={appointment._id} className="rounded-[1.4rem] border border-slate-200 border-l-4 border-l-cyan-500 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white">
                                            {formatReadableDate(appointment.date)} • {formatSlot(appointment.slot)}
                                        </p>
                                        <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusClasses(appointment.status)}`}>
                                            {appointment.status}
                                        </span>
                                    </div>
                                    <Link
                                        to={`/doctor/appointments/${appointment._id}`}
                                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                                    >
                                        Open visit
                                    </Link>
                                </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Consultation notes</p>
                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                                            {appointment.consultationNotes || 'Not recorded'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Prescription</p>
                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                                            {appointment.prescription || 'Not recorded'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Advice</p>
                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                                            {appointment.doctorAdvice || 'Not recorded'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Follow-up</p>
                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                                            {appointment.followUpRequired
                                                ? `Required${appointment.followUpDate ? ` on ${formatReadableDate(appointment.followUpDate)}` : ''}`
                                                : 'Not required'}
                                        </p>
                                    </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Recorded</p>
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                                        {formatDateTime(appointment.completedAt || appointment.updatedAt)}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 rounded-[1.4rem] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center gap-2">
                                    <FileText size={15} className="text-emerald-700 dark:text-emerald-300" />
                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Uploaded reports</p>
                                </div>
                                <div className="mt-3 space-y-3">
                                    {appointment?.medicalDocuments?.length ? appointment.medicalDocuments.map((document) => (
                                        <article
                                            key={`${document.fileName}-${document.uploadedAt}`}
                                            className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40"
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
                                        <p className="text-sm text-slate-500 dark:text-slate-400">No uploaded reports for this visit yet.</p>
                                    )}
                                </div>
                            </div>
                                {(appointment.status === 'completed' || appointment.followUpRequired) && (
                                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenFollowUp(
                                                appointment.followUpDate || appointment.date || getTomorrowDateString(),
                                                appointment.followUpRequired ? 'Scheduled follow-up' : 'Visit history'
                                            )}
                                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                        >
                                            <CalendarClock size={14} />
                                            {appointment.followUpRequired ? 'Resume follow-up' : 'Schedule follow-up'}
                                        </button>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            Continue this record from the same patient file.
                                        </span>
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                </section>
            </section>

            <Dialog
                open={followUpOpen}
                onOpenChange={(open) => {
                    setFollowUpOpen(open);
                    if (!open) {
                        setFollowUpSourceLabel('');
                    }
                }}
            >
                <DialogContent className="max-w-3xl rounded-[1.8rem] border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-950">
                    <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">
                                Schedule follow-up visit
                            </DialogTitle>
                            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                                Create the next appointment for this patient using the same doctor record book.
                            </DialogDescription>
                            {followUpSourceLabel && (
                                <p className="text-xs uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
                                    {followUpSourceLabel}
                                </p>
                            )}
                        </DialogHeader>
                    </div>

                    <div className="space-y-5 px-6 py-6">
                        {followUpError && (
                            <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                                {followUpError}
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Follow-up date</label>
                                <input
                                    type="date"
                                    value={followUpDate}
                                    onChange={(event) => setFollowUpDate(event.target.value)}
                                    className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-400"
                                />
                            </div>
                            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Context</p>
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                                    The new visit stays linked to this patient record and opens the same history for the next consultation.
                                </p>
                            </div>
                        </div>

                        <div>
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Available slots</p>
                                {followUpLoading && <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Loading slots...</p>}
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                {(followUpAvailability?.availableSlots || []).map((slot) => (
                                    <button
                                        key={slot}
                                        type="button"
                                        onClick={() => setFollowUpSlot(slot)}
                                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                                            followUpSlot === slot
                                                ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                                                : 'border-slate-300 bg-white text-slate-700 hover:border-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-white'
                                        }`}
                                    >
                                        {formatSlot(slot)}
                                    </button>
                                ))}

                                {!followUpLoading && (followUpAvailability?.availableSlots || []).length === 0 && (
                                    <div className="rounded-[1.2rem] border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                        No slots are available for this date.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <Button type="button" variant="outline" onClick={() => setFollowUpOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="button" disabled={followUpSubmitting || !followUpDate || !followUpSlot} onClick={handleCreateFollowUp}>
                                {followUpSubmitting ? 'Scheduling...' : 'Create follow-up'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DoctorPatientRecordPage;
