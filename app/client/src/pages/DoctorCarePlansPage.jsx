import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, FileStack, HeartHandshake, Users2 } from 'lucide-react';
import DashboardPageIntro from '../components/dashboard/DashboardPageIntro';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import { getDoctorCarePlanBookings, getDoctorCarePlans } from '../lib/auth';
import { formatCarePlanDuration, getCarePlanIcon } from '../lib/carePlans';

const DoctorCarePlansPage = () => {
    const [carePlans, setCarePlans] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    const pendingBookingsCount = useMemo(
        () => bookings.filter((booking) => booking.status === 'pending').length,
        [bookings]
    );

    const completedBookingsCount = useMemo(
        () => bookings.filter((booking) => booking.status === 'completed').length,
        [bookings]
    );

    return (
        <div className="space-y-6">
            <DashboardPageIntro
                eyebrow="Doctor Workspace"
                title="Assigned care plans"
                description="Review only the care plans assigned to you and keep a quick eye on request volume without mixing in the full booking queue here."
            />

            {error && (
                <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                    {error}
                </div>
            )}

            <section className="grid gap-4 xl:grid-cols-4">
                <DashboardStatCard label="Assigned plans" value={loading ? '--' : carePlans.length} helper="Active plans" icon={HeartHandshake} />
                <DashboardStatCard label="Plan requests" value={loading ? '--' : bookings.length} tone="amber" helper="All submissions" icon={ClipboardCheck} />
                <DashboardStatCard label="Pending requests" value={loading ? '--' : pendingBookingsCount} tone="cyan" helper="Needs review" icon={Users2} />
                <DashboardStatCard label="Completed plans" value={loading ? '--' : completedBookingsCount} tone="emerald" helper="Finished journeys" icon={FileStack} />
            </section>

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {!loading && carePlans.length === 0 && (
                    <article className="rounded-[1.85rem] border border-dashed border-slate-300 bg-white/80 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                        No care plans are assigned to you yet.
                    </article>
                )}
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
        </div>
    );
};

export default DoctorCarePlansPage;
