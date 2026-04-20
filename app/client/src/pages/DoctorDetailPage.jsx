import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, CalendarDays, Clock3, Mail, Phone, ShieldCheck, Stethoscope } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createAppointment, getDoctorAvailability, getVerifiedDoctorById } from '../lib/auth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
    formatReadableDate,
    formatSlot,
    formatSpecialization,
    getTomorrowDateString,
} from '../lib/appointments';
import { formatExperienceYears, formatQualification, formatUserDisplayName } from '../lib/utils';

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
    const [selectedSlot, setSelectedSlot] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingStep, setBookingStep] = useState(1);
    const [bookingDetails, setBookingDetails] = useState({
        previousMedicalCondition: '',
        symptoms: '',
    });

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
            loadAvailability();
        }
    }, [bookingOpen, bookingDate, id]);

    const canBook = user?.role === 'patient';
    const isAuthenticated = Boolean(user);
    const configuredSlots = useMemo(() => availability?.configuredSlots || [], [availability]);
    const bookedSlots = useMemo(() => availability?.bookedSlots || [], [availability]);

    const getSlotState = (slot) => {
        if (bookedSlots.includes(slot)) {
            return 'booked';
        }

        if (availability?.dailyLimitReached) {
            return 'unavailable';
        }

        return 'available';
    };

    const handleBookAppointment = async (event) => {
        event.preventDefault();

        if (!bookingDate || !selectedSlot) {
            toast.error('Please select both a date and a time slot.');
            return;
        }

        try {
            setBookingLoading(true);
            await createAppointment({
                doctorId: id,
                date: bookingDate,
                slot: selectedSlot,
                previousMedicalCondition: bookingDetails.previousMedicalCondition,
                symptoms: bookingDetails.symptoms,
            });
            toast.success('Appointment request submitted with pending status.');
            setBookingDetails({
                previousMedicalCondition: '',
                symptoms: '',
            });
            setBookingOpen(false);
        } catch (requestError) {
            toast.error(requestError.message || 'Unable to create appointment.');
        } finally {
            setBookingLoading(false);
        }
    };

    const goToNotesStep = () => {
        if (!bookingDate || !selectedSlot) {
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
                                    <div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                                        <p className="font-medium text-slate-900 dark:text-white">{doctor.email}</p>
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
                                                    onChange={(event) => setBookingDate(event.target.value)}
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
                                                        Only available slots can be selected. Booked slots stay disabled.
                                                    </p>
                                                </div>

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

                                                    {!availabilityLoading &&
                                                        configuredSlots.map((slot) => {
                                                            const slotState = getSlotState(slot);
                                                            const isDisabled = slotState !== 'available';

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
                                                                        {slotState}
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
                                        disabled={!selectedSlot}
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
                                            disabled={bookingLoading || !selectedSlot}
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
