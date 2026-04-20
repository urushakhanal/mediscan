import React, { useMemo, useState } from 'react';
import { CalendarDays, Clock3, FileText, FileUp } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import DashboardPageIntro from '../components/dashboard/DashboardPageIntro';
import usePatientAppointments from '../hooks/usePatientAppointments';
import { markPatientAppointmentSummaryViewed, uploadPatientAppointmentDocument } from '../lib/auth';
import {
    formatReadableDate,
    formatSlot,
    formatSpecialization,
    getStatusClasses,
    resolveUploadUrl,
} from '../lib/appointments';
import { formatUserDisplayName } from '../lib/utils';

const hasSummaryData = (appointment) =>
    Boolean(
        appointment?.consultationNotes?.trim() ||
            appointment?.diagnosis?.trim() ||
            appointment?.prescription?.trim() ||
            appointment?.doctorAdvice?.trim() ||
            appointment?.recommendedTests?.trim() ||
            appointment?.visitOutcome?.trim() ||
            appointment?.scanRequestNote?.trim() ||
            appointment?.followUpRequired ||
            (appointment?.medicalDocuments || []).length > 0
    );

const hasUploadedReports = (appointment) => (appointment?.medicalDocuments || []).length > 0;

const getUploadStatusLabel = (appointment) => {
    if (hasUploadedReports(appointment)) {
        return 'Uploaded';
    }

    if (appointment?.scanRequestNote?.trim()) {
        return 'Upload pending';
    }

    return 'No request';
};

const getUploadStatusClasses = (appointment) => {
    if (hasUploadedReports(appointment)) {
        return 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200';
    }

    if (appointment?.scanRequestNote?.trim()) {
        return 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200';
    }

    return 'border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
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

const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Unable to read the selected file.'));
        reader.readAsDataURL(file);
    });

const PatientAppointmentsPage = () => {
    const { appointments, loading, error, loadAppointments, newSummariesCount } = usePatientAppointments();
    const [selectedSummaryAppointment, setSelectedSummaryAppointment] = useState(null);
    const [scanTitle, setScanTitle] = useState('');
    const [scanReviewNote, setScanReviewNote] = useState('');
    const [scanFile, setScanFile] = useState(null);
    const [scanUploading, setScanUploading] = useState(false);
    const [scanError, setScanError] = useState('');
    const [scanInputKey, setScanInputKey] = useState(0);

    const sortedAppointments = useMemo(
        () => [...appointments].sort((a, b) => `${b.date}-${b.slot}`.localeCompare(`${a.date}-${a.slot}`)),
        [appointments]
    );

    const summaryCounts = useMemo(
        () => ({
            completed: appointments.filter((appointment) => appointment.status === 'completed').length,
            inProgress: appointments.filter((appointment) => hasSummaryData(appointment) && appointment.status !== 'completed').length,
        }),
        [appointments]
    );

    const handleOpenSummary = async (appointment) => {
        setSelectedSummaryAppointment(appointment);
        setScanError('');
        setScanTitle('');
        setScanReviewNote('');
        setScanFile(null);
        setScanInputKey((current) => current + 1);

        if (appointment?.patientSummaryViewedAt || appointment?.status !== 'completed') {
            return;
        }

        try {
            await markPatientAppointmentSummaryViewed(appointment._id);
            await loadAppointments();
            setSelectedSummaryAppointment((current) => (
                current?._id === appointment._id
                    ? { ...current, patientSummaryViewedAt: new Date().toISOString() }
                    : current
            ));
        } catch (requestError) {
            console.error(requestError);
        }
    };

    const handlePatientUpload = async () => {
        try {
            if (!selectedSummaryAppointment?._id) {
                return;
            }

            if (!scanTitle.trim()) {
                setScanError('Please add a title for the scan.');
                return;
            }

            if (!scanFile) {
                setScanError('Please select a PDF or image file.');
                return;
            }

            setScanUploading(true);
            setScanError('');
            const fileData = await readFileAsDataUrl(scanFile);
            const data = await uploadPatientAppointmentDocument(selectedSummaryAppointment._id, {
                title: scanTitle,
                reviewNote: scanReviewNote,
                fileName: scanFile.name,
                mimeType: scanFile.type,
                fileData,
            });

            setSelectedSummaryAppointment(data.appointment || null);
            await loadAppointments();
            setScanTitle('');
            setScanReviewNote('');
            setScanFile(null);
            setScanInputKey((current) => current + 1);
        } catch (requestError) {
            const message = requestError.message || 'Unable to upload scan.';
            setScanError(message);
        } finally {
            setScanUploading(false);
        }
    };

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

                <div className="flex flex-wrap gap-3 border-b border-slate-100 px-6 py-4 text-sm dark:border-slate-800">
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <span className="h-2 w-2 rounded-full bg-cyan-500" />
                        New summaries {newSummariesCount}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Completed {summaryCounts.completed}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        In progress {summaryCounts.inProgress}
                    </span>
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
                                <th className="px-6 py-3 font-medium">Reports</th>
                                <th className="px-6 py-3 font-medium">Summary</th>
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
                                    <td className="px-6 py-4"><div className="h-9 w-28 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" /></td>
                                    <td className="px-6 py-4"><div className="h-9 w-28 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" /></td>
                                </tr>
                            ))}

                            {!loading && sortedAppointments.length === 0 && (
                                <tr>
                                    <td className="px-6 py-10 text-center text-slate-500 dark:text-slate-400" colSpan={7}>No appointments yet.</td>
                                </tr>
                            )}

                            {!loading && sortedAppointments.map((appointment) => (
                                <tr
                                    key={appointment._id}
                                    className={`text-slate-700 dark:text-slate-200 ${
                                        hasSummaryData(appointment)
                                            ? 'bg-cyan-50/20 dark:bg-cyan-950/10'
                                            : ''
                                    }`}
                                >
                                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{formatUserDisplayName(appointment.doctor)}</td>
                                    <td className="px-6 py-4">{formatSpecialization(appointment.doctor?.specialization)}</td>
                                    <td className="px-6 py-4"><span className="inline-flex items-center gap-2"><CalendarDays size={15} />{formatReadableDate(appointment.date)}</span></td>
                                    <td className="px-6 py-4"><span className="inline-flex items-center gap-2"><Clock3 size={15} />{formatSlot(appointment.slot)}</span></td>
                                    <td className="px-6 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusClasses(appointment.status)}`}>{appointment.status}</span></td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getUploadStatusClasses(appointment)}`}>
                                            {getUploadStatusLabel(appointment)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {hasSummaryData(appointment) && (
                                            <button
                                                type="button"
                                                onClick={() => handleOpenSummary(appointment)}
                                                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                                            >
                                                <FileText size={14} />
                                                {appointment.status === 'completed'
                                                    ? (appointment.patientSummaryViewedAt ? 'View summary' : 'New summary')
                                                    : 'View notes'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <Dialog open={Boolean(selectedSummaryAppointment)} onOpenChange={() => setSelectedSummaryAppointment(null)}>
                <DialogContent className="max-w-4xl overflow-hidden rounded-[1.9rem] border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-900">
                    <div className="border-b border-slate-100 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 px-6 py-6 dark:border-slate-800 dark:from-cyan-950/30 dark:via-slate-900 dark:to-emerald-950/20">
                        <DialogHeader>
                            <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Visit summary</p>
                            <DialogTitle className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                                {formatUserDisplayName(selectedSummaryAppointment?.doctor)}
                            </DialogTitle>
                            <DialogDescription className="max-w-2xl">
                                {selectedSummaryAppointment?.status === 'completed'
                                    ? "Completed consultation notes and the doctor's advice for this visit."
                                    : 'Notes saved so far by the doctor for this visit.'}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="px-6 py-6">
                        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusClasses(selectedSummaryAppointment?.status)}`}>
                                    {selectedSummaryAppointment?.status || 'pending'}
                                </span>
                                {selectedSummaryAppointment?.status === 'completed' && (
                                    <span className="inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-200">
                                        {selectedSummaryAppointment?.patientSummaryViewedAt ? 'Viewed' : 'New summary'}
                                    </span>
                                )}
                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-3">
                                <div className="rounded-[1.1rem] bg-white p-4 dark:bg-slate-900">
                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Date</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{formatReadableDate(selectedSummaryAppointment?.date)}</p>
                                </div>
                                <div className="rounded-[1.1rem] bg-white p-4 dark:bg-slate-900">
                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Time</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{formatSlot(selectedSummaryAppointment?.slot)}</p>
                                </div>
                                <div className="rounded-[1.1rem] bg-white p-4 dark:bg-slate-900">
                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Doctor</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{formatUserDisplayName(selectedSummaryAppointment?.doctor)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.25)] dark:border-slate-800 dark:bg-slate-950/40">
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Consultation notes</p>
                                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                                    {selectedSummaryAppointment?.consultationNotes || 'Not recorded'}
                                </p>
                            </div>
                            <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.25)] dark:border-slate-800 dark:bg-slate-950/40">
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Diagnosis</p>
                                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                                    {selectedSummaryAppointment?.diagnosis || 'Not recorded'}
                                </p>
                            </div>
                            <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.25)] dark:border-slate-800 dark:bg-slate-950/40">
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Prescription</p>
                                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                                    {selectedSummaryAppointment?.prescription || 'Not recorded'}
                                </p>
                            </div>
                            <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.25)] dark:border-slate-800 dark:bg-slate-950/40">
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Doctor advice</p>
                                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                                    {selectedSummaryAppointment?.doctorAdvice || 'Not recorded'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Follow-up</p>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                                {selectedSummaryAppointment?.followUpRequired
                                    ? `Required${selectedSummaryAppointment?.followUpDate ? ` on ${formatReadableDate(selectedSummaryAppointment.followUpDate)}` : ''}`
                                    : 'Not required'}
                            </p>
                        </div>

                        <div className="mt-4 rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                            <div className="flex flex-wrap items-center gap-2">
                                <FileUp size={16} className="text-cyan-700 dark:text-cyan-300" />
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Scan request</p>
                            </div>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                                {selectedSummaryAppointment?.scanRequestNote || 'No scan request has been added yet.'}
                            </p>
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                <div className="rounded-[1.15rem] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Requested on</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                                        {selectedSummaryAppointment?.scanRequestedAt
                                            ? formatDocumentTimestamp(selectedSummaryAppointment.scanRequestedAt)
                                            : 'Not requested yet'}
                                    </p>
                                </div>
                                <div className="rounded-[1.15rem] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Status</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                                        {getUploadStatusLabel(selectedSummaryAppointment)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr,1.05fr]">
                            <div className="space-y-3">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Scan title</label>
                                    <Input
                                        value={scanTitle}
                                        onChange={(event) => setScanTitle(event.target.value)}
                                        placeholder="Example: Chest X-ray"
                                        className="h-11 rounded-2xl border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">File</label>
                                    <input
                                        key={scanInputKey}
                                        type="file"
                                        accept=".pdf,image/*"
                                        onChange={(event) => setScanFile(event.target.files?.[0] || null)}
                                        className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:file:bg-white dark:file:text-slate-900"
                                    />
                                    {scanFile && (
                                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Selected: {scanFile.name}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Optional note</label>
                                    <textarea
                                        value={scanReviewNote}
                                        onChange={(event) => setScanReviewNote(event.target.value)}
                                        rows={3}
                                        placeholder="Add any short note for the doctor"
                                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Button type="button" disabled={scanUploading} onClick={handlePatientUpload}>
                                        {scanUploading ? 'Uploading...' : 'Upload scan'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setScanTitle('');
                                            setScanReviewNote('');
                                            setScanFile(null);
                                            setScanInputKey((current) => current + 1);
                                            setScanError('');
                                        }}
                                    >
                                        Clear
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Uploaded scans</p>
                                {scanError && (
                                    <div className="mt-4 rounded-[1.1rem] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                                        {scanError}
                                    </div>
                                )}
                                <div className="mt-4 space-y-3">
                                    {selectedSummaryAppointment?.medicalDocuments?.length ? selectedSummaryAppointment.medicalDocuments.map((document) => (
                                        <article key={`${document.fileName}-${document.uploadedAt}`} className="rounded-[1.15rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{document.title || document.fileName}</p>
                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                        {formatDocumentTimestamp(document.uploadedAt)} • {document.uploadedByRole || 'patient'}
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
                                        <p className="text-sm text-slate-500 dark:text-slate-400">No scans uploaded yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PatientAppointmentsPage;
