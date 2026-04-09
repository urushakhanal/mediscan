import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Clock3, ListChecks, XCircle } from 'lucide-react';
import DashboardPageIntro from '../components/dashboard/DashboardPageIntro';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import { getAdminCarePlanBookings } from '../lib/auth';
import { formatSpecialization } from '../lib/appointments';
import { getCarePlanBookingStatusClasses } from '../lib/carePlans';

const AdminCarePlanRequestsPage = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadBookings = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await getAdminCarePlanBookings();
                setBookings(data.bookings || []);
            } catch (requestError) {
                setError(requestError.message || 'Unable to load care plan requests.');
            } finally {
                setLoading(false);
            }
        };

        loadBookings();
    }, []);

    const stats = useMemo(() => ({
        total: bookings.length,
        pending: bookings.filter((booking) => booking.status === 'pending').length,
        confirmed: bookings.filter((booking) => booking.status === 'confirmed').length,
        cancelled: bookings.filter((booking) => booking.status === 'cancelled').length,
    }), [bookings]);

    return (
        <div className="space-y-6">
            <DashboardPageIntro
                eyebrow="Care Plan Requests"
                title="Patient care plan requests"
                description="Review submitted care plan requests and keep track of their current status in one place."
            />

            {error && (
                <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                    {error}
                </div>
            )}

            <section className="grid gap-4 xl:grid-cols-4">
                <DashboardStatCard label="Total requests" value={loading ? '--' : stats.total} helper="All submissions" icon={ListChecks} />
                <DashboardStatCard label="Pending" value={loading ? '--' : stats.pending} tone="amber" helper="Awaiting action" icon={Clock3} />
                <DashboardStatCard label="Confirmed" value={loading ? '--' : stats.confirmed} tone="cyan" helper="Doctor approved" icon={ClipboardCheck} />
                <DashboardStatCard label="Cancelled" value={loading ? '--' : stats.cancelled} tone="rose" helper="Closed requests" icon={XCircle} />
            </section>

            <section className="overflow-hidden rounded-[1.9rem] border border-slate-200 bg-white shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Patient</th>
                                <th className="px-6 py-3 font-medium">Care plan</th>
                                <th className="px-6 py-3 font-medium">Assigned doctor</th>
                                <th className="px-6 py-3 font-medium">Preferred slot</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {!loading && bookings.length === 0 && (
                                <tr>
                                    <td className="px-6 py-10 text-center text-slate-500 dark:text-slate-400" colSpan={5}>
                                        No care plan requests yet.
                                    </td>
                                </tr>
                            )}
                            {bookings.map((booking) => (
                                <tr key={booking._id} className="text-slate-700 dark:text-slate-200">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-slate-900 dark:text-white">{booking.patient?.name || 'Unknown patient'}</p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{booking.patient?.email || '-'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-900 dark:text-white">{booking.carePlan?.name || '-'}</p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatSpecialization(booking.carePlan?.specialty)}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-900 dark:text-white">{booking.doctor?.name || '-'}</p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{booking.doctor?.email || '-'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p>{booking.preferredDate || '-'}</p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{booking.preferredTime || '-'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getCarePlanBookingStatusClasses(booking.status)}`}>
                                            {booking.status}
                                        </span>
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

export default AdminCarePlanRequestsPage;
