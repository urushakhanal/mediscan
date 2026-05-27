import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import { verifyKhaltiAppointmentPayment } from '../lib/auth';
import { formatCurrencyNpr, formatReadableDate, formatSlot } from '../lib/appointments';
import { formatUserDisplayName } from '../lib/utils';

const getSearchParam = (search, key) => new URLSearchParams(search).get(key) || '';
const AppointmentPaymentReturnPage = ({ mode = 'success', provider = 'khalti' }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(mode === 'success');
    const [error, setError] = useState('');
    const [appointment, setAppointment] = useState(null);
    const [payment, setPayment] = useState(null);

    useEffect(() => {
        if (mode !== 'success') {
            return;
        }

        const sessionId = getSearchParam(location.search, 'session');
        const pidx = getSearchParam(location.search, 'pidx');

        if (!sessionId || !pidx) {
            setError('Missing payment confirmation details from Khalti.');
            setLoading(false);
            return;
        }

        const verifyPayment = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await verifyKhaltiAppointmentPayment(sessionId, { pidx });
                setAppointment(data.appointment || null);
                setPayment(data.payment || null);
            } catch (requestError) {
                setError(requestError.message || 'Unable to verify the Khalti payment.');
            } finally {
                setLoading(false);
            }
        };

        verifyPayment();
    }, [location.search, mode, provider]);

    useEffect(() => {
        if (loading || error || !appointment) {
            return undefined;
        }

        const redirectTimer = window.setTimeout(() => {
            navigate('/patient/appointments', { replace: true });
        }, 2500);

        return () => window.clearTimeout(redirectTimer);
    }, [appointment, error, loading, navigate]);

    return (
        <section className="px-4 py-12 sm:py-16">
            <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col items-center text-center">
                    {mode === 'success' && !error ? (
                        <CheckCircle2 className="h-14 w-14 text-emerald-600 dark:text-emerald-300" />
                    ) : (
                        <CircleAlert className="h-14 w-14 text-rose-600 dark:text-rose-300" />
                    )}

                    <p className="mt-5 text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Khalti payment</p>
                    <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                        {loading
                            ? 'Verifying your payment'
                            : mode === 'success' && !error
                                ? 'Appointment booked successfully'
                                : 'Payment was not completed'}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                        {loading
                            ? 'Please wait while we confirm the Khalti payment and finalize your booking.'
                            : error
                                ? error
                                : mode === 'success'
                                    ? 'Your Khalti payment was verified and the doctor appointment is now in the system. You will be redirected to your appointments shortly.'
                                    : 'Khalti sent you back without a completed payment, so the appointment was not created.'}
                    </p>
                </div>

                {!loading && appointment && (
                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-[1.35rem] bg-slate-50 p-4 dark:bg-slate-800/70">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Doctor</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{formatUserDisplayName(appointment.doctor)}</p>
                        </div>
                        <div className="rounded-[1.35rem] bg-slate-50 p-4 dark:bg-slate-800/70">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Amount paid</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{formatCurrencyNpr(payment?.amount)}</p>
                        </div>
                        <div className="rounded-[1.35rem] bg-slate-50 p-4 dark:bg-slate-800/70">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Date</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{formatReadableDate(appointment.date)}</p>
                        </div>
                        <div className="rounded-[1.35rem] bg-slate-50 p-4 dark:bg-slate-800/70">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Time</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{formatSlot(appointment.slot)}</p>
                        </div>
                    </div>
                )}

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Link
                        to="/patient/appointments"
                        className="inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                        View my appointments
                    </Link>
                    <Link
                        to="/doctors"
                        className="inline-flex rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                    >
                        Browse doctors
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default AppointmentPaymentReturnPage;
