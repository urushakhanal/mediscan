import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import { verifyKhaltiCarePlanBookingPayment } from '../lib/auth';
import { formatCurrencyNpr, formatReadableDate } from '../lib/appointments';
import { formatUserDisplayName } from '../lib/utils';

const getSearchParam = (search, key) => new URLSearchParams(search).get(key) || '';

const CarePlanPaymentReturnPage = ({ mode = 'success' }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(mode === 'success');
    const [error, setError] = useState('');
    const [booking, setBooking] = useState(null);
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
                const data = await verifyKhaltiCarePlanBookingPayment(sessionId, { pidx });
                setBooking(data.booking || null);
                setPayment(data.payment || null);
            } catch (requestError) {
                setError(requestError.message || 'Unable to verify the Khalti payment.');
            } finally {
                setLoading(false);
            }
        };

        verifyPayment();
    }, [location.search, mode]);

    useEffect(() => {
        if (loading || error || !booking) {
            return undefined;
        }

        const redirectTimer = window.setTimeout(() => {
            navigate('/patient/care-plans', { replace: true });
        }, 2500);

        return () => window.clearTimeout(redirectTimer);
    }, [booking, error, loading, navigate]);

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
                                ? 'Care plan booked successfully'
                                : 'Payment was not completed'}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                        {loading
                            ? 'Please wait while we confirm the Khalti payment and finalize your care plan request.'
                            : error
                                ? error
                                : mode === 'success'
                                    ? 'Your Khalti payment was verified and your care plan request is now submitted. You will be redirected shortly.'
                                    : 'Khalti sent you back without a completed payment, so the care plan request was not created.'}
                    </p>
                </div>

                {!loading && booking && (
                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-[1.35rem] bg-slate-50 p-4 dark:bg-slate-800/70">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Doctor</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{formatUserDisplayName(booking.doctor)}</p>
                        </div>
                        <div className="rounded-[1.35rem] bg-slate-50 p-4 dark:bg-slate-800/70">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Amount paid</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{formatCurrencyNpr(payment?.amount)}</p>
                        </div>
                        <div className="rounded-[1.35rem] bg-slate-50 p-4 dark:bg-slate-800/70">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Preferred date</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{formatReadableDate(booking.preferredDate)}</p>
                        </div>
                        <div className="rounded-[1.35rem] bg-slate-50 p-4 dark:bg-slate-800/70">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Preferred time</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{booking.preferredTime || 'Not set'}</p>
                        </div>
                    </div>
                )}

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Link
                        to="/patient/care-plans"
                        className="inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                        View my care plans
                    </Link>
                    <Link
                        to="/care-plans"
                        className="inline-flex rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                    >
                        Browse plans
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default CarePlanPaymentReturnPage;
