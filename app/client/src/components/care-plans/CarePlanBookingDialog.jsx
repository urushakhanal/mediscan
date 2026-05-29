import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarDays, CheckCircle2, Clock3, Stethoscope, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { useAuth } from '../../context/AuthContext';
import { createCarePlanBooking, initiateKhaltiCarePlanBookingPayment } from '../../lib/auth';
import { formatReadableDate, formatSpecialization, getTodayDateString } from '../../lib/appointments';
import { formatUserDisplayName } from '../../lib/utils';
import { formatCarePlanDuration, formatCarePlanPrice, getCarePlanIcon } from '../../lib/carePlans';

const defaultBookingState = {
    doctorId: '',
    preferredDate: '',
    preferredTime: '',
    notes: '',
};

const CarePlanBookingDialog = ({ carePlan, open, onOpenChange, onBooked }) => {
    const { user } = useAuth();
    const [bookingState, setBookingState] = useState(defaultBookingState);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (carePlan && open) {
            setBookingState({
                doctorId: carePlan.assignedDoctors?.[0]?._id || '',
                preferredDate: getTodayDateString(),
                preferredTime: '10:00 AM',
                notes: '',
            });
        }
    }, [carePlan, open]);

    const canBook = user?.role === 'patient';
    const Icon = useMemo(() => (carePlan ? getCarePlanIcon(carePlan.iconKey) : Stethoscope), [carePlan]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!carePlan?._id) {
            return;
        }

        try {
            setLoading(true);
            const planPrice = Number(carePlan?.price) || 0;
            if (planPrice > 0) {
                const data = await initiateKhaltiCarePlanBookingPayment(carePlan._id, bookingState);
                const redirectUrl = data?.paymentSession?.redirectUrl;
                if (!redirectUrl) {
                    throw new Error('Khalti payment URL was not returned by the server.');
                }
                window.location.href = redirectUrl;
                return;
            }
            await createCarePlanBooking(carePlan._id, bookingState);
            toast.success('Care plan request submitted successfully.');
            onBooked?.();
            onOpenChange(false);
        } catch (error) {
            toast.error(error.message || 'Unable to submit care plan request.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto rounded-[1.75rem] border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-900">
                {carePlan && (
                    <div className="p-6">
                        <DialogHeader>
                            <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-200">
                                    <Icon size={24} />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Care Plan</p>
                                    <DialogTitle className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                                        {carePlan.name}
                                    </DialogTitle>
                                    <DialogDescription className="mt-2 max-w-2xl text-sm leading-7">
                                        {carePlan.description}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
                            <section className="space-y-4">
                                <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                                    <div className="flex flex-wrap gap-2">
                                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                                            {formatCarePlanPrice(carePlan.price)}
                                        </span>
                                        <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 dark:border-slate-700 dark:text-slate-200">
                                            {formatCarePlanDuration(carePlan.durationWeeks)}
                                        </span>
                                        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-200">
                                            {formatSpecialization(carePlan.specialty)}
                                        </span>
                                    </div>

                                    {carePlan.whoItsFor && (
                                        <div className="mt-4">
                                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Who it is for</p>
                                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{carePlan.whoItsFor}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/40">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">What is included</p>
                                    <div className="mt-4 space-y-3">
                                        {carePlan.includes?.map((item) => (
                                            <div key={item} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-300" />
                                                <span>{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/40">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Assigned doctors</p>
                                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                            <Users size={13} />
                                            {carePlan.assignedDoctors?.length || 0} available
                                        </span>
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        {carePlan.assignedDoctors?.map((doctor) => (
                                            <div key={doctor._id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3 dark:bg-slate-900">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-200">
                                                    <Stethoscope size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatUserDisplayName(doctor)}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatSpecialization(doctor.specialization)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-[1.55rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/40">
                                <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Request plan</p>
                                {canBook ? (
                                    <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                                        <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4 dark:bg-slate-900">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                                Doctor assignment
                                            </p>
                                            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                                Your request will be matched with one of the assigned doctors listed here based on availability.
                                            </p>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label htmlFor="care-plan-date" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                                    Preferred date
                                                </label>
                                                <div className="relative">
                                                    <CalendarDays size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        id="care-plan-date"
                                                        type="date"
                                                        min={getTodayDateString()}
                                                        value={bookingState.preferredDate}
                                                        onChange={(event) => setBookingState((prev) => ({ ...prev, preferredDate: event.target.value }))}
                                                        className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label htmlFor="care-plan-time" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                                    Preferred time
                                                </label>
                                                <div className="relative">
                                                    <Clock3 size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        id="care-plan-time"
                                                        type="text"
                                                        value={bookingState.preferredTime}
                                                        onChange={(event) => setBookingState((prev) => ({ ...prev, preferredTime: event.target.value }))}
                                                        placeholder="10:00 AM"
                                                        className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="care-plan-notes" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                                Notes for the care team
                                            </label>
                                            <textarea
                                                id="care-plan-notes"
                                                rows="5"
                                                value={bookingState.notes}
                                                onChange={(event) => setBookingState((prev) => ({ ...prev, notes: event.target.value }))}
                                                placeholder={`Share your current concerns before ${formatReadableDate(bookingState.preferredDate)}.`}
                                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            />
                                        </div>

                                        <div className="flex flex-wrap gap-3 pt-2">
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                            >
                                                {loading ? 'Processing...' : ((Number(carePlan?.price) || 0) > 0 ? 'Pay with Khalti' : 'Request care plan')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onOpenChange(false)}
                                                disabled={loading}
                                                className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900">
                                        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                                            {user
                                                ? 'Patient accounts can request care plans. Switch to a patient account to continue.'
                                                : 'Sign in with a patient account to request this plan and choose the doctor you want to follow up with.'}
                                        </p>
                                        {!user && (
                                            <Link
                                                to="/signin"
                                                className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                            >
                                                Sign in to continue
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default CarePlanBookingDialog;
