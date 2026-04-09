import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import CarePlanCard from '../components/care-plans/CarePlanCard';
import { getCarePlans } from '../lib/auth';

const CarePlansPage = () => {
    const [carePlans, setCarePlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadCarePlans = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await getCarePlans();
                setCarePlans(data.carePlans || []);
            } catch (requestError) {
                setError(requestError.message || 'Unable to load care plans.');
            } finally {
                setLoading(false);
            }
        };

        loadCarePlans();
    }, []);

    return (
        <section className="relative overflow-hidden px-4 pt-2 pb-10 sm:pb-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.11),transparent_26%),radial-gradient(circle_at_right,rgba(16,185,129,0.10),transparent_24%)]" />
            <div className="relative mx-auto max-w-7xl space-y-8">
                <header className="px-1 py-2">
                    <div className="flex flex-col gap-4">
                        <div>
                            <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
                                <Sparkles className="h-3.5 w-3.5" />
                                Care Plans
                            </p>
                            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Doctor-led care plans for structured support</h1>
                            <p className="mt-2 max-w-3xl text-[13px] leading-6 text-slate-600 dark:text-slate-300 sm:text-sm">
                                Explore guided plans built around follow-up care, specialist support, and clearer next steps with the right doctor.
                            </p>
                        </div>
                    </div>
                </header>

                {error && (
                    <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                        {error}
                    </div>
                )}

                <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {loading && Array.from({ length: 6 }).map((_, index) => (
                        <div key={`care-plan-skeleton-${index}`} className="h-[340px] animate-pulse rounded-[1.9rem] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
                    ))}
                    {!loading && carePlans.map((carePlan) => (
                        <CarePlanCard key={carePlan._id} carePlan={carePlan} />
                    ))}
                    {!loading && carePlans.length === 0 && (
                        <div className="col-span-full rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                            No care plans are live yet.
                        </div>
                    )}
                </section>
            </div>
        </section>
    );
};

export default CarePlansPage;
