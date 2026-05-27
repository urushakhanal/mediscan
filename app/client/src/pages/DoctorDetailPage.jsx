import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, Mail, Phone, ShieldCheck, Stethoscope } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createAppointment, getDoctorAvailability, getVerifiedDoctorById, getVerifiedDoctors } from '../lib/auth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
    formatReadableDate,
    formatSlot,
    formatSpecialization,
    getTomorrowDateString,
} from '../lib/appointments';
import { formatExperienceYears, formatQualification, formatUserDisplayName } from '../lib/utils';

const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Unable to read the selected file.'));
        reader.readAsDataURL(file);
    });

const BLOCK_TYPE_LABELS = {
    leave: 'Leave',
    holiday: 'Holiday',
};

const timeToMinutes = (value) => {
    const [hours = '0', minutes = '0'] = String(value || '').split(':');
    const parsedHours = Number(hours);
    const parsedMinutes = Number(minutes);

    if (Number.isNaN(parsedHours) || Number.isNaN(parsedMinutes)) {
        return 0;
    }

    return parsedHours * 60 + parsedMinutes;
};

const slotToRange = (slot) => {
    const [startTime = '', endTime = ''] = String(slot || '').split('-');

    return {
        startTime,
        endTime,
        start: timeToMinutes(startTime),
        end: timeToMinutes(endTime),
    };
};

const slotOverlapsRange = (slot, range) => {
    if (!range?.startTime || !range?.endTime) {
        return false;
    }

    const slotRange = slotToRange(slot);
    return slotRange.start < timeToMinutes(range.endTime) && slotRange.end > timeToMinutes(range.startTime);
};

const formatBlockLabel = (entry) => {
    const customLabel = String(entry?.label || '').trim();
    if (customLabel) {
        return customLabel;
    }

    return BLOCK_TYPE_LABELS[entry?.type] || 'Blocked day';
};

const DoctorDetailPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [bookingOpen, setBookingOpen] = useState(false);
    const [bookingDate, setBookingDate] = useState(getTomorrowDateString());
    const [availability, setAvailability] = useState(null);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [availabilityError, setAvailabilityError] = useState('');
    const [alternativeDoctors, setAlternativeDoctors] = useState([]);
    const [alternativeDoctorsLoading, setAlternativeDoctorsLoading] = useState(false);
    const [alternativeDoctorsError, setAlternativeDoctorsError] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingStep, setBookingStep] = useState(1);
    const [bookingDetails, setBookingDetails] = useState({
        previousMedicalCondition: '',
        symptoms: '',
    });
    const [reportTitle, setReportTitle] = useState('');
    const [reportReviewNote, setReportReviewNote] = useState('');
    const [reportFile, setReportFile] = useState(null);
    const [reportInputKey, setReportInputKey] = useState(0);

    const canBook = user?.role === 'patient';
    const isAuthenticated = Boolean(user);
    const configuredSlots = useMemo(() => availability?.configuredSlots || [], [availability]);
    const bookedSlots = useMemo(() => availability?.bookedSlots || [], [availability]);
    const availableSlots = useMemo(() => availability?.availableSlots || [], [availability]);
    const weeklyBreaks = useMemo(() => availability?.weeklyBreaks || [], [availability]);
    const emergencySlots = useMemo(() => availability?.emergencySlots || [], [availability]);
    const blockedDateInfo = availability?.blockedDate || null;
    const blockedDateLabel = formatBlockLabel(blockedDateInfo);
    const hasBlockedDay = Boolean(blockedDateInfo);
    const shouldSuggestAlternatives = hasBlockedDay || (availability && availableSlots.length === 0);

    useEffect(() => {
        const loadDoctor = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await getVerifiedDoctorById(id);
                setDoctor(data.doctor);
            } catch (requestError) {
                setError(requestError.message || 'Unable to load doctor profile.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadDoctor();
        }
    }, [id]);

    useEffect(() => {
        const loadAvailability = async () => {
            if (!id || !bookingDate) {
                return;
            }

            try {
                setAvailabilityLoading(true);
                setAvailabilityError('');
                const data = await getDoctorAvailability(id, bookingDate);
                setAvailability(data.availability);
            } catch (requestError) {
                setAvailability(null);
                setAvailabilityError(requestError.message || 'Unable to load available time slots.');
            } finally {
                setAvailabilityLoading(false);
            }
        };

        if (bookingOpen) {
            setBookingStep(1);
            setSelectedSlot('');
            setBookingDetails({
                previousMedicalCondition: '',
                symptoms: '',
            });
            setReportTitle('');
            setReportReviewNote('');
            setReportFile(null);
            setReportInputKey((current) => current + 1);
            loadAvailability();
        }
    }, [bookingOpen, bookingDate, id]);

    useEffect(() => {
        const loadAlternatives = async () => {
            if (!bookingOpen || !doctor?.specialization || !bookingDate || !shouldSuggestAlternatives) {
                setAlternativeDoctors([]);
                setAlternativeDoctorsError('');
                return;
            }

            try {
                setAlternativeDoctorsLoading(true);
                setAlternativeDoctorsError('');

                const doctorListData = await getVerifiedDoctors();
                const sameSpecialtyDoctors = (doctorListData.doctors || [])
                    .filter((candidate) => candidate._id !== id)
                    .filter((candidate) => candidate.specialization === doctor.specialization)
                    .filter((candidate) => candidate.isActive !== false);

                const candidateResults = await Promise.all(
                    sameSpecialtyDoctors.map(async (candidate) => {
                        try {
                            const candidateData = await getDoctorAvailability(candidate._id, bookingDate);
                            const candidateAvailability = candidateData?.availability || null;
                            const candidateSlots = candidateAvailability?.availableSlots || [];

                            return {
                                ...candidate,
                                hasAvailability: candidateSlots.length > 0,
                                openSlotCount: candidateSlots.length,
                            };
                        } catch {
                            return {
                                ...candidate,
                                hasAvailability: false,
                                openSlotCount: 0,
                            };
                        }
                    })
                );

                const sortedCandidates = candidateResults
                    .sort((left, right) => Number(right.hasAvailability) - Number(left.hasAvailability) || left.name.localeCompare(right.name))
                    .slice(0, 4);

                setAlternativeDoctors(sortedCandidates);
            } catch (requestError) {
                setAlternativeDoctors([]);
                setAlternativeDoctorsError(requestError.message || 'Unable to load other doctors with the same specialty.');
            } finally {
                setAlternativeDoctorsLoading(false);
            }
        };

        loadAlternatives();
    }, [bookingOpen, bookingDate, doctor, id, shouldSuggestAlternatives]);

    const getSlotState = (slot) => {
        if (availableSlots.includes(slot)) {
            const emergencySlot = emergencySlots.find((entry) => `${entry.startTime}-${entry.endTime}` === slot);
            return {
                key: emergencySlot ? 'emergency' : 'available',
                label: emergencySlot ? 'Emergency opening' : 'Available',
            };
        }

        if (bookedSlots.includes(slot)) {
            return {
                key: 'booked',
                label: 'Booked',
            };
        }

        if (hasBlockedDay) {
            return {
                key: 'blocked',
                label: blockedDateLabel,
            };
        }

        const breakRule = weeklyBreaks.find((entry) => slotOverlapsRange(slot, entry));
        if (breakRule) {
            return {
                key: 'break',
                label: breakRule.label?.trim() || 'Break',
            };
        }

        if (availability?.dailyLimitReached) {
            return {
                key: 'full',
                label: 'Fully booked',
            };
        }

        return {
            key: 'unavailable',
            label: 'Unavailable',
        };
    };

    const handleBookAppointment = async (event) => {
        event.preventDefault();

        if (!bookingDate || !selectedSlot) {
            toast.error('Please select both a date and a time slot.');
            return;
        }

        try {
            setBookingLoading(true);
            if (reportFile && !reportTitle.trim()) {
                toast.error('Please add a title for the report.');
                return;
            }

            const reportFileData = reportFile ? await readFileAsDataUrl(reportFile) : '';

            await createAppointment({
                doctorId: id,
                date: bookingDate,
                slot: selectedSlot,
                previousMedicalCondition: bookingDetails.previousMedicalCondition,
                symptoms: bookingDetails.symptoms,
                reportTitle: reportFile ? reportTitle.trim() : '',
                reportFileName: reportFile?.name || '',
                reportFileData,
                reportReviewNote: reportFile ? reportReviewNote : '',
            });
            toast.success('Appointment request submitted with pending status.');
            setBookingDetails({
                previousMedicalCondition: '',
                symptoms: '',
            });
            setReportTitle('');
            setReportReviewNote('');
            setReportFile(null);
            setReportInputKey((current) => current + 1);
            setBookingOpen(false);
        } catch (requestError) {
            toast.error(requestError.message || 'Unable to create appointment.');
        } finally {
            setBookingLoading(false);
        }
    };

    const goToNotesStep = () => {
        if (!bookingDate || !selectedSlot || !availableSlots.includes(selectedSlot)) {
            toast.error('Please select both a date and a time slot.');
            return;
        }

        setBookingStep(2);
    };

    if (loading) {
        return (
            <section className="px-4 py-10 sm:py-12">
                <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="h-5 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="mt-6 h-10 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="mt-4 h-5 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="mt-8 grid gap-4 md:grid-cols-2">
                        <div className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                        <div className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                    </div>
                </div>
            </section>
        );
    }

    if (error || !doctor) {
        return (
            <section className="px-4 py-10 sm:py-12">
                <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-200 bg-white p-8 text-center shadow-sm dark:border-rose-900/60 dark:bg-slate-900">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Doctor profile unavailable</h1>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{error || 'Doctor not found.'}</p>
                    <Link
                        to="/doctors"
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                        <ArrowLeft size={16} />
                        Back to doctors
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <section className="relative overflow-hidden px-4 py-10 sm:py-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_28%),radial-gradient(circle_at_right,rgba(6,182,212,0.12),transparent_24%)]" />
            <div className="relative mx-auto max-w-4xl space-y-6">
                <Link
                    to="/doctors"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                >
                    <ArrowLeft size={16} />
                    Back to doctors
                </Link>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                                    <Stethoscope size={26} />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-300">Verified Doctor</p>
                                    <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{formatUserDisplayName(doctor)}</h1>
                                    <p className="mt-2 text-base font-medium text-cyan-700 dark:text-cyan-300">
                                        {formatSpecialization(doctor.specialization)}
                                    </p>
                                </div>
                            </div>

                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                                <ShieldCheck size={16} />
                                Approved 
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 text-cyan-700 dark:text-cyan-300">
                                        <Mail size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                                        <p className="truncate text-[13px] font-medium leading-5 text-slate-900 dark:text-white">
                                            {doctor.email}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 text-cyan-700 dark:text-cyan-300">
                                        <Phone size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Phone</p>
                                        <p className="font-medium text-slate-900 dark:text-white">{doctor.phone || 'Phone not available'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Experience</p>
                                <p className="mt-1 font-medium text-slate-900 dark:text-white">{formatExperienceYears(doctor.experienceYears)}</p>
                            </div>

                            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Qualification</p>
                                <p className="mt-1 font-medium text-slate-900 dark:text-white">{formatQualification(doctor.qualification)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        {canBook ? (
                            <button
                                type="button"
                                onClick={() => setBookingOpen(true)}
                                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-500 hover:to-emerald-400"
                            >
                                <CalendarDays size={16} />
                                Book appointment
                            </button>
                        ) : isAuthenticated ? (
                            <div className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
                                Patient accounts can book appointments.
                            </div>
                        ) : (
                            <Link
                                to="/signin"
                                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-500 hover:to-emerald-400"
                            >
                                Book now
                            </Link>
                        )}
                    </div>
                </section>

                <section>
                    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Professional Details</p>
                        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Specialization</p>
                                <p className="font-medium text-slate-900 dark:text-white">{formatSpecialization(doctor.specialization)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Experience</p>
                                <p className="font-medium text-slate-900 dark:text-white">{formatExperienceYears(doctor.experienceYears)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Qualification</p>
                                <p className="font-medium text-slate-900 dark:text-white">{formatQualification(doctor.qualification)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Currently working at</p>
                                <p className="font-medium text-slate-900 dark:text-white">{doctor.currentlyWorkingAt || 'Not provided'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">NMC Number</p>
                                <p className="font-medium text-slate-900 dark:text-white">{doctor.nmcNumber}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                                <p className="font-medium text-emerald-700 dark:text-emerald-300">Verified and publicly listed</p>
                            </div>
                        </div>
                    </article>
                </section>
            </div>

            <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
            <DialogContent className="max-h-[90vh] max-w-xl overflow-hidden rounded-[1.5rem] border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex max-h-[90vh] flex-col">
                    <DialogHeader>
                            <div className="border-b border-slate-200 px-5 pb-4 pt-5 dark:border-slate-800">
                                <p className="text-[11px] uppercase tracking-[0.26em] text-cyan-700 dark:text-cyan-300">Appointment request</p>
                                <DialogTitle className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                                    Book with {formatUserDisplayName(doctor)}
                                </DialogTitle>
                                <DialogDescription className="text-sm leading-6">
                                    Choose a future date and one of the currently available time slots.
                                </DialogDescription>
                            </div>
                        </DialogHeader>

                        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleBookAppointment}>
                            <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-800">
                                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                    <span className={bookingStep === 1 ? 'text-cyan-700 dark:text-cyan-300' : ''}>Step 1: Schedule</span>
                                    <span>/</span>
                                    <span className={bookingStep === 2 ? 'text-cyan-700 dark:text-cyan-300' : ''}>Step 2: Notes</span>
                                </div>
                            </div>

                            <div className="min-h-[280px] flex-1 overflow-y-auto px-5 py-4">
                                <div className="space-y-4">
                                    {bookingStep === 1 && (
                                        <>
                                            <div>
                                                <label htmlFor="appointment-date" className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-200">
                                                    Appointment date
                                                </label>
                                                    <input
                                                        id="appointment-date"
                                                        type="date"
                                                        min={getTomorrowDateString()}
                                                        value={bookingDate}
                                                        onChange={(event) => {
                                                            setBookingDate(event.target.value);
                                                            setSelectedSlot('');
                                                        }}
                                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                        required
                                                    />
                                                </div>

                                                <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                            Choose a slot for {formatReadableDate(bookingDate)}
                                                        </p>
                                                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                                            Available windows can be selected, while booked or blocked windows stay disabled.
                                                        </p>
                                                    </div>

                                                    {(hasBlockedDay || weeklyBreaks.length > 0 || emergencySlots.length > 0) && (
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {hasBlockedDay && (
                                                                <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                                                                    {blockedDateLabel}
                                                                </span>
                                                            )}
                                                            {weeklyBreaks.length > 0 && (
                                                                <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-200">
                                                                    Breaks on this day
                                                                </span>
                                                            )}
                                                            {emergencySlots.length > 0 && (
                                                                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                                                                    Emergency openings
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {hasBlockedDay && (
                                                        <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                                                            <p className="font-semibold">
                                                                Dr. {formatUserDisplayName(doctor)} is on {blockedDateLabel.toLowerCase()} on {formatReadableDate(bookingDate)}.
                                                            </p>
                                                            <p className="mt-1 text-xs leading-5 text-rose-700/90 dark:text-rose-200/80">
                                                                {blockedDateInfo?.notes || 'This day is closed for bookings, so please choose another date.'}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {!hasBlockedDay && weeklyBreaks.length > 0 && (
                                                        <div className="mt-3 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-4 text-sm text-cyan-900 dark:border-cyan-900/60 dark:bg-cyan-950/25 dark:text-cyan-100">
                                                            <p className="font-semibold">Some time slots are blocked for routine breaks.</p>
                                                            <p className="mt-1 text-xs leading-5 text-cyan-800/90 dark:text-cyan-100/80">
                                                                These are usually lunch or admin breaks, so only the open windows can be selected.
                                                            </p>
                                                        </div>
                                                    )}

                                                    {shouldSuggestAlternatives && (
                                                        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                                <div>
                                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                        Other {formatSpecialization(doctor.specialization)} doctors
                                                                    </p>
                                                                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                                                        {hasBlockedDay
                                                                            ? `${formatUserDisplayName(doctor)} is unavailable on this date.`
                                                                            : `This doctor has no open slots on ${formatReadableDate(bookingDate)}.`}
                                                                    </p>
                                                                </div>
                                                                <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                                                                    Same specialty
                                                                </div>
                                                            </div>

                                                            {alternativeDoctorsLoading ? (
                                                                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                                                    {Array.from({ length: 2 }).map((_, index) => (
                                                                        <div
                                                                            key={`alt-doctor-skeleton-${index}`}
                                                                            className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
                                                                        />
                                                                    ))}
                                                                </div>
                                                            ) : alternativeDoctorsError ? (
                                                                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                                                                    {alternativeDoctorsError}
                                                                </div>
                                                            ) : alternativeDoctors.length === 0 ? (
                                                                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 px-3.5 py-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                                                    No other verified doctors with the same specialty are available right now.
                                                                </div>
                                                            ) : (
                                                                <div className="mt-4 grid gap-3">
                                                                    {alternativeDoctors.map((candidate) => (
                                                                        <div
                                                                            key={candidate._id}
                                                                            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-between"
                                                                        >
                                                                            <div className="min-w-0">
                                                                                <p className="font-semibold text-slate-900 dark:text-white">
                                                                                    {formatUserDisplayName(candidate)}
                                                                                </p>
                                                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                                                    {candidate.currentlyWorkingAt || 'Clinic details not shared'}
                                                                                </p>
                                                                                <div className="mt-2 flex flex-wrap gap-2">
                                                                                    <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-200">
                                                                                        {formatSpecialization(candidate.specialization)}
                                                                                    </span>
                                                                                    <span className={[
                                                                                        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold',
                                                                                        candidate.hasAvailability
                                                                                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200'
                                                                                            : 'border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                                                                                    ].join(' ')}>
                                                                                        {candidate.hasAvailability
                                                                                            ? `${candidate.openSlotCount} open slot${candidate.openSlotCount === 1 ? '' : 's'} on this date`
                                                                                            : 'No slots on this date'}
                                                                                    </span>
                                                                                </div>
                                                                            </div>

                                                                            <Link
                                                                                to={`/doctors/${candidate._id}`}
                                                                                onClick={() => setBookingOpen(false)}
                                                                                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                                                            >
                                                                                View profile
                                                                                <ArrowRight size={14} />
                                                                            </Link>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {availabilityError && (
                                                        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                                                            {availabilityError}
                                                        </div>
                                                    )}

                                                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                                                    {availabilityLoading &&
                                                        Array.from({ length: 4 }).map((_, index) => (
                                                            <div key={`slot-skeleton-${index}`} className="h-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                                                        ))}

                                                    {!availabilityLoading && configuredSlots.length === 0 && !availabilityError && (
                                                        <div className="col-span-full rounded-xl border border-dashed border-slate-300 px-3.5 py-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                                            No appointment slots are available on this date.
                                                        </div>
                                                    )}

                                                    {!availabilityLoading && configuredSlots.length > 0 && hasBlockedDay && availableSlots.length === 0 && (
                                                        <div className="col-span-full rounded-xl border border-dashed border-rose-300 bg-rose-50/70 px-3.5 py-4 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-200">
                                                            This date is not bookable because the doctor marked it as {blockedDateLabel.toLowerCase()}.
                                                        </div>
                                                    )}

                                                    {!availabilityLoading &&
                                                        configuredSlots.map((slot) => {
                                                            const slotState = getSlotState(slot);
                                                            const isDisabled = slotState.key !== 'available' && slotState.key !== 'emergency';

                                                            return (
                                                                <button
                                                                    key={slot}
                                                                    type="button"
                                                                    disabled={isDisabled}
                                                                    onClick={() => setSelectedSlot(slot)}
                                                                    className={[
                                                                        'inline-flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed',
                                                                        selectedSlot === slot
                                                                            ? 'border-cyan-600 bg-cyan-50 text-cyan-700 dark:border-cyan-400 dark:bg-cyan-950/30 dark:text-cyan-200'
                                                                            : slotState.key === 'booked'
                                                                                ? 'border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500'
                                                                                : slotState.key === 'break'
                                                                                    ? 'border-cyan-100 bg-cyan-50 text-cyan-700 dark:border-cyan-900/40 dark:bg-cyan-950/20 dark:text-cyan-100'
                                                                                    : slotState.key === 'blocked'
                                                                                        ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-200'
                                                                                        : isDisabled
                                                                                            ? 'border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500'
                                                                                : 'border-slate-300 text-slate-700 hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white',
                                                                    ].join(' ')}
                                                                >
                                                                    <span className="inline-flex min-w-0 items-center gap-2">
                                                                        <Clock3 size={16} />
                                                                        <span className="whitespace-nowrap">{formatSlot(slot)}</span>
                                                                    </span>
                                                                    <span className="shrink-0 whitespace-nowrap text-[11px] uppercase tracking-[0.16em]">
                                                                        {slotState.label}
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {bookingStep === 2 && (
                                        <>
                                            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Selected appointment</p>
                                                <div className="mt-2.5 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
                                                    <span className="inline-flex items-center gap-2">
                                                        <CalendarDays size={16} />
                                                        {formatReadableDate(bookingDate)}
                                                    </span>
                                                    <span className="inline-flex items-center gap-2">
                                                        <Clock3 size={16} />
                                                        {formatSlot(selectedSlot)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <label htmlFor="previousMedicalCondition" className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-200">
                                                    Previous medical condition
                                                </label>
                                                <textarea
                                                    id="previousMedicalCondition"
                                                    rows="3"
                                                    value={bookingDetails.previousMedicalCondition}
                                                    onChange={(event) => setBookingDetails((prev) => ({
                                                        ...prev,
                                                        previousMedicalCondition: event.target.value,
                                                    }))}
                                                    placeholder="Optional"
                                                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="symptoms" className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-200">
                                                    Symptoms if any
                                                </label>
                                                <textarea
                                                    id="symptoms"
                                                    rows="3"
                                                    value={bookingDetails.symptoms}
                                                    onChange={(event) => setBookingDetails((prev) => ({
                                                        ...prev,
                                                        symptoms: event.target.value,
                                                    }))}
                                                    placeholder="Optional"
                                                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                />
                                            </div>

                                            <div className="rounded-[1.25rem] border border-dashed border-cyan-200 bg-cyan-50/50 p-4 dark:border-cyan-900/40 dark:bg-cyan-950/20">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Attach a report</p>
                                                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                                        Optional. Upload a PDF or image now so the doctor can review it with your booking.
                                                    </p>
                                                </div>

                                                <div className="mt-4 space-y-4">
                                                    <div>
                                                        <label htmlFor="reportTitle" className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-200">
                                                            Report title
                                                        </label>
                                                        <input
                                                            id="reportTitle"
                                                            type="text"
                                                            value={reportTitle}
                                                            onChange={(event) => setReportTitle(event.target.value)}
                                                            placeholder="Example: Blood test report"
                                                            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-200">
                                                            Report file
                                                        </label>
                                                        <input
                                                            key={reportInputKey}
                                                            type="file"
                                                            accept=".pdf,image/*"
                                                            onChange={(event) => setReportFile(event.target.files?.[0] || null)}
                                                            className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:file:bg-white dark:file:text-slate-900"
                                                        />
                                                        {reportFile && (
                                                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                                                Selected: {reportFile.name}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label htmlFor="reportReviewNote" className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-200">
                                                            Note for doctor
                                                        </label>
                                                        <textarea
                                                            id="reportReviewNote"
                                                            rows="3"
                                                            value={reportReviewNote}
                                                            onChange={(event) => setReportReviewNote(event.target.value)}
                                                            placeholder="Optional note about this report"
                                                            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-slate-200 px-5 py-3.5 shadow-[0_-8px_20px_-14px_rgba(15,23,42,0.22)] dark:border-slate-800">
                                <div className="flex flex-wrap items-center gap-3">
                                {bookingStep === 1 ? (
                                    <button
                                        type="button"
                                        onClick={goToNotesStep}
                                        disabled={!selectedSlot || !availableSlots.includes(selectedSlot)}
                                        className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                    >
                                        Continue
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setBookingStep(1)}
                                            disabled={bookingLoading}
                                            className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={bookingLoading || !selectedSlot || !availableSlots.includes(selectedSlot)}
                                            className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                        >
                                            {bookingLoading ? 'Submitting...' : 'Confirm booking request'}
                                        </button>
                                    </>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setBookingOpen(false)}
                                    disabled={bookingLoading}
                                    className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    );
};

export default DoctorDetailPage;
