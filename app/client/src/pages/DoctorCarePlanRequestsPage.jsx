import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, ClipboardCheck, Clock3, FileStack } from 'lucide-react';
import DashboardPageIntro from '../components/dashboard/DashboardPageIntro';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import { getDoctorCarePlanBookings, updateDoctorCarePlanBookingStatus } from '../lib/auth';
import { formatReadableDate } from '../lib/appointments';
import { getCarePlanBookingStatusClasses } from '../lib/carePlans';
import { formatUserDisplayName } from '../lib/utils';

const DoctorCarePlanRequestsPage = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState('');
    const [statusDrafts, setStatusDrafts] = useState({});

    const loadBookings = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getDoctorCarePlanBookings();
            const nextBookings = data.bookings || [];
            setBookings(nextBookings);
            setStatusDrafts(
                nextBookings.reduce((acc, booking) => {
                    acc[booking._id] = booking.status;
                    return acc;
                }, {})
            );
        } catch (requestError) {
            setError(requestError.message || 'Unable to load care plan requests.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBookings();
    }, [loadBookings]);

    const handleStatusChange = async (bookingId, status) => {
        try {
            setActionLoadingId(bookingId);
            await updateDoctorCarePlanBookingStatus(bookingId, { status });
            toast.success('Care plan request status updated.');
            await loadBookings();
        } catch (requestError) {
            setError(requestError.message || 'Unable to update care plan request.');
            toast.error(requestError.message || 'Unable to update care plan request.');
        } finally {
            setActionLoadingId('');
        }
    };

    const stats = useMemo(() => ({
        total: bookings.length,
        pending: bookings.filter((booking) => booking.status === 'pending').length,
        confirmed: bookings.filter((booking) => booking.status === 'confirmed').length,
        completed: bookings.filter((booking) => booking.status === 'completed').length,
    }), [bookings]);

    return (
        <div className="space-y-6">
            <DashboardPageIntro
                eyebrow="Doctor Workspace"
                title="Care plan requests"
                description="Review patient requests that came through the care plans assigned to you and update their status from one simple queue."
            />

            {error && (
                <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                    {error}
                </div>
            )}

            <section className="grid gap-4 xl:grid-cols-4">
                <DashboardStatCard label="Total requests" value={loading ? '--' : stats.total} helper="All submissions" icon={ClipboardCheck} />
                <DashboardStatCard label="Pending" value={loading ? '--' : stats.pending} tone="amber" helper="Needs review" icon={Clock3} />
                <DashboardStatCard label="Confirmed" value={loading ? '--' : stats.confirmed} tone="cyan" helper="Approved visits" icon={CheckCircle2} />
                <DashboardStatCard label="Completed" value={loading ? '--' : stats.completed} tone="emerald" helper="Finished care" icon={FileStack} />
            </section>

            <section className="rounded-[1.9rem] border border-slate-200 bg-white shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Patient</th>
                                <th className="px-6 py-3 font-medium">Plan</th>
                                <th className="px-6 py-3 font-medium">Preferred date</th>
                                <th className="px-6 py-3 font-medium">Preferred time</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Update</th>
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
                                        <div className="flex flex-wrap items-center gap-2">
                                            <select
                                                value={statusDrafts[booking._id] || booking.status}
                                                onChange={(event) => setStatusDrafts((prev) => ({
                                                    ...prev,
                                                    [booking._id]: event.target.value,
                                                }))}
                                                disabled={actionLoadingId === booking._id}
                                                className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="confirmed">Confirmed</option>
                                                <option value="completed">Completed</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => handleStatusChange(booking._id, statusDrafts[booking._id] || booking.status)}
                                                disabled={actionLoadingId === booking._id || (statusDrafts[booking._id] || booking.status) === booking.status}
                                                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                            >
                                                <CheckCircle2 size={14} />
                                                Update
                                            </button>
                                        </div>
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

export default DoctorCarePlanRequestsPage;
