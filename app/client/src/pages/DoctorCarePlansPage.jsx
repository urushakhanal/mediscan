import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, ClipboardCheck, FileStack, HeartHandshake, Users2, XCircle } from 'lucide-react';
import DashboardPageIntro from '../components/dashboard/DashboardPageIntro';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import { getDoctorCarePlanBookings, getDoctorCarePlans, updateDoctorCarePlanBookingStatus } from '../lib/auth';
import { formatReadableDate } from '../lib/appointments';
import { formatUserDisplayName } from '../lib/utils';
import { formatCarePlanDuration, getCarePlanBookingStatusClasses, getCarePlanIcon } from '../lib/carePlans';

const DoctorCarePlansPage = () => {
    const [carePlans, setCarePlans] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState('');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const [carePlansData, bookingsData] = await Promise.all([
                getDoctorCarePlans(),
                getDoctorCarePlanBookings(),
            ]);
            setCarePlans(carePlansData.carePlans || []);
            setBookings(bookingsData.bookings || []);
        } catch (requestError) {
            setError(requestError.message || 'Unable to load care plans.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleStatusChange = async (bookingId, status) => {
        try {
            setActionLoadingId(bookingId);
            await updateDoctorCarePlanBookingStatus(bookingId, { status });
            toast.success(status === 'confirmed' ? 'Care plan request approved.' : 'Care plan request declined.');
            await loadData();
        } catch (requestError) {
            setError(requestError.message || 'Unable to update care plan request.');
            toast.error(requestError.message || 'Unable to update care plan request.');
        } finally {
            setActionLoadingId('');
        }
    };

    return (
        <div className="space-y-6">
            <DashboardPageIntro
                eyebrow="Doctor Workspace"
                title="Assigned care plans"
                description="Review the care plans you are attached to and keep track of new patient requests coming through those plans."
            />

            {error && (
                <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                    {error}
                </div>
            )}

            <section className="grid gap-4 xl:grid-cols-4">
                <DashboardStatCard label="Assigned plans" value={loading ? '--' : carePlans.length} helper="Active plans" icon={HeartHandshake} />
                <DashboardStatCard label="Plan requests" value={loading ? '--' : bookings.length} tone="amber" helper="All submissions" icon={ClipboardCheck} />
                <DashboardStatCard label="Pending requests" value={loading ? '--' : bookings.filter((booking) => booking.status === 'pending').length} tone="cyan" helper="Needs review" icon={Users2} />
                <DashboardStatCard label="Completed plans" value={loading ? '--' : bookings.filter((booking) => booking.status === 'completed').length} tone="emerald" helper="Finished journeys" icon={FileStack} />
            </section>

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {!loading && carePlans.map((carePlan) => {
                    const Icon = getCarePlanIcon(carePlan.iconKey);

                    return (
                        <article key={carePlan._id} className="rounded-[1.85rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-200">
                                <Icon size={22} />
                            </div>
                            <h2 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">{carePlan.name}</h2>
                            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{carePlan.summary}</p>
                            <div className="mt-5 flex flex-wrap gap-2">
                                <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 dark:border-slate-700 dark:text-slate-200">
                                    {formatCarePlanDuration(carePlan.durationWeeks)}
                                </span>
                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                                    {bookings.filter((booking) => booking.carePlan?._id === carePlan._id).length} requests
                                </span>
                            </div>
                        </article>
                    );
                })}
            </section>

            <section className="rounded-[1.9rem] border border-slate-200 bg-white shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                    <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Requests</p>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Incoming care plan bookings</h2>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Patient</th>
                                <th className="px-6 py-3 font-medium">Plan</th>
                                <th className="px-6 py-3 font-medium">Preferred date</th>
                                <th className="px-6 py-3 font-medium">Preferred time</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {!loading && bookings.length === 0 && (
                                <tr>
                                    <td className="px-6 py-10 text-center text-slate-500 dark:text-slate-400" colSpan={6}>
                                        No care plan requests yet.
                                    </td>
                                </tr>
                            )}
                            {bookings.map((booking) => (
                                <tr key={booking._id} className="text-slate-700 dark:text-slate-200">
                                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{formatUserDisplayName(booking.patient)}</td>
                                    <td className="px-6 py-4">{booking.carePlan?.name}</td>
                                    <td className="px-6 py-4">{formatReadableDate(booking.preferredDate)}</td>
                                    <td className="px-6 py-4">{booking.preferredTime}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getCarePlanBookingStatusClasses(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {booking.status === 'pending' ? (
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleStatusChange(booking._id, 'confirmed')}
                                                    disabled={actionLoadingId === booking._id}
                                                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <CheckCircle2 size={14} />
                                                    Approve
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleStatusChange(booking._id, 'cancelled')}
                                                    disabled={actionLoadingId === booking._id}
                                                    className="inline-flex items-center gap-2 rounded-full border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-500 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800 dark:text-rose-300"
                                                >
                                                    <XCircle size={14} />
                                                    Decline
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 dark:text-slate-500">No actions</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default DoctorCarePlansPage;
