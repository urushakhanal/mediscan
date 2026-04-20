import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Stethoscope, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createCarePlanBooking, getCarePlanById } from '../lib/auth';
import { formatReadableDate, formatSpecialization, getTodayDateString } from '../lib/appointments';
import { formatUserDisplayName } from '../lib/utils';
import { formatCarePlanDuration, formatCarePlanPrice, getCarePlanIcon } from '../lib/carePlans';

const defaultBookingState = {
  doctorId: '',
  preferredDate: '',
  preferredTime: '',
  notes: '',
};

const CarePlanDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [carePlan, setCarePlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingState, setBookingState] = useState(defaultBookingState);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  useEffect(() => {
    const loadCarePlan = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getCarePlanById(id);
        const nextCarePlan = data.carePlan;
        setCarePlan(nextCarePlan);
        setBookingState({
          doctorId: nextCarePlan?.assignedDoctors?.[0]?._id || '',
          preferredDate: getTodayDateString(),
          preferredTime: '10:00 AM',
          notes: '',
        });
        setBookingSubmitted(false);
      } catch (requestError) {
        setError(requestError.message || 'Unable to load care plan.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadCarePlan();
    }
  }, [id]);

  const canBook = user?.role === 'patient';
  const isAuthenticated = Boolean(user);
  const Icon = useMemo(
    () => (carePlan ? getCarePlanIcon(carePlan.iconKey) : Stethoscope),
    [carePlan]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!carePlan?._id) {
      return;
    }

    try {
      setBookingLoading(true);
      await createCarePlanBooking(carePlan._id, bookingState);
      setBookingSubmitted(true);
      toast.success('Care plan request submitted successfully.');
    } catch (requestError) {
      toast.error(requestError.message || 'Unable to submit care plan request.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="px-4 py-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-white p-8 shadow-sm dark:bg-slate-900">
          <div className="h-5 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-6 h-10 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </section>
    );
  }

  if (error || !carePlan) {
    return (
      <section className="px-4 py-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 text-center shadow-sm dark:bg-slate-900">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Care plan unavailable</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{error || 'Care plan not found.'}</p>
          <Link
            to="/care-plans"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            <ArrowLeft size={16} />
            Back to care plans
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden px-4 py-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.11),transparent_26%),radial-gradient(circle_at_right,rgba(16,185,129,0.10),transparent_24%)]" />
      <div className="relative mx-auto max-w-6xl space-y-6">
        <Link
          to="/care-plans"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to care plans
        </Link>

        <section className="rounded-[2rem] bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:bg-slate-900">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-200">
                <Icon size={24} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Care plan</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {carePlan.name}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {carePlan.description}
                </p>
              </div>
            </div>

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
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
          <section className="space-y-4">
            {carePlan.whoItsFor && (
              <div className="rounded-[1.4rem] bg-white p-5 shadow-sm dark:bg-slate-900">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Who it is for</p>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{carePlan.whoItsFor}</p>
              </div>
            )}

            <div className="rounded-[1.4rem] bg-white p-5 shadow-sm dark:bg-slate-900">
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

            <div className="rounded-[1.4rem] bg-white p-5 shadow-sm dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Assigned doctors</p>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Users size={13} />
                  {carePlan.assignedDoctors?.length || 0} available
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {carePlan.assignedDoctors?.map((doctor) => (
                  <div key={doctor._id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3 dark:bg-slate-950">
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

            <section className="rounded-[1.55rem] bg-white p-5 shadow-sm dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Request plan</p>
            {canBook ? (
              bookingSubmitted ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Request submitted</p>
                    <p className="mt-2 text-sm leading-7 text-emerald-700 dark:text-emerald-300">
                      Your care plan request has been sent successfully. You can track its status from your patient care plans page.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      to="/patient/care-plans"
                      className="inline-flex rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
                    >
                      View my care plans
                    </Link>
                    <button
                      type="button"
                      onClick={() => setBookingSubmitted(false)}
                      className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                    >
                      Submit another request
                    </button>
                  </div>
                </div>
              ) : (
                <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
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
                      disabled={bookingLoading}
                      className="inline-flex rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {bookingLoading ? 'Submitting...' : 'Request care plan'}
                    </button>
                  </div>
                </form>
              )
            ) : (
              <div className="mt-4 rounded-[1.25rem] bg-slate-50 p-5 dark:bg-slate-950">
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {user
                    ? 'Patient accounts can request care plans. Switch to a patient account to continue.'
                    : 'Sign in with a patient account to request this plan and continue with doctor matching.'}
                </p>
                {!isAuthenticated && (
                  <Link
                    to="/signin"
                    className="mt-4 inline-flex rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
                  >
                    Sign in to continue
                  </Link>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
};

export default CarePlanDetailPage;
