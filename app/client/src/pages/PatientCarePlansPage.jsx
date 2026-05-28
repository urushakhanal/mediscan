import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, ExternalLink, HeartPulse, Layers3, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardPageIntro from '../components/dashboard/DashboardPageIntro';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import { getPatientCarePlanBookings } from '../lib/auth';
import { formatReadableDate, formatSpecialization } from '../lib/appointments';
import { formatUserDisplayName } from '../lib/utils';
import { getCarePlanBookingStatusClasses } from '../lib/carePlans';

const PatientCarePlansPage = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const bookingsData = await getPatientCarePlanBookings();
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

    const activeDoctorsCount = useMemo(
        () => new Set(bookings.map((booking) => booking.doctor?._id).filter(Boolean)).size,
        [bookings]
    );

    return (
        <div className="space-y-6">
            <DashboardPageIntro
                eyebrow="Patient Workspace"
                title="My care plans"
                description="Track the care plans you have already requested and see whether the assigned doctor has approved, declined, or completed them."
                actions={(
                    <Link to="/care-plans" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                        Browse care plans
                        <ExternalLink size={15} />
                    </Link>
                )}
            />

            {error && (
                <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                    {error}
                </div>
            )}

            <section className="grid gap-4 xl:grid-cols-4">
                <DashboardStatCard label="My requested plans" value={loading ? '--' : bookings.length} helper="All submissions" icon={HeartPulse} />
                <DashboardStatCard label="My requests" value={loading ? '--' : bookings.length} tone="amber" helper="All submissions" icon={ClipboardList} />
                <DashboardStatCard label="Doctors involved" value={loading ? '--' : activeDoctorsCount} tone="cyan" helper="Across requests" icon={Sparkles} />
                <DashboardStatCard label="Pending plans" value={loading ? '--' : bookings.filter((booking) => booking.status === 'pending').length} tone="emerald" helper="Awaiting review" icon={Layers3} />
            </section>

            <section className="rounded-[1.9rem] border border-slate-200 bg-white shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                    <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">My requests</p>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Care plan bookings</h2>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Plan</th>
                                <th className="px-6 py-3 font-medium">Doctor</th>
                                <th className="px-6 py-3 font-medium">Specialty</th>
                                <th className="px-6 py-3 font-medium">Preferred date</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {!loading && bookings.length === 0 && (
                                <tr>
                                    <td className="px-6 py-10 text-center text-slate-500 dark:text-slate-400" colSpan={5}>
                                        No care plan requests yet. Browse plans first, then your requested plans will appear here with their statuses.
                                    </td>
                                </tr>
                            )}
                            {bookings.map((booking) => (
                                <tr key={booking._id} className="text-slate-700 dark:text-slate-200">
                                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{booking.carePlan?.name}</td>
                                    <td className="px-6 py-4">{formatUserDisplayName(booking.doctor)}</td>
                                    <td className="px-6 py-4">{formatSpecialization(booking.carePlan?.specialty)}</td>
                                    <td className="px-6 py-4">{formatReadableDate(booking.preferredDate)}</td>
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

export default PatientCarePlansPage;
