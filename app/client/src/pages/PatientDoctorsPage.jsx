import React, { useMemo } from 'react';
import { ArrowRight, Search, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardPageIntro from '../components/dashboard/DashboardPageIntro';
import usePatientAppointments from '../hooks/usePatientAppointments';
import { formatSpecialization } from '../lib/appointments';
import { formatUserDisplayName } from '../lib/utils';

const PatientDoctorsPage = () => {
    const { appointments } = usePatientAppointments();

    const recentDoctors = useMemo(() => {
        const seen = new Set();
        return appointments
            .map((appointment) => appointment.doctor)
            .filter((doctor) => doctor?._id && !seen.has(doctor._id) && seen.add(doctor._id))
            .slice(0, 6);
    }, [appointments]);

    return (
        <div className="space-y-6">
            <DashboardPageIntro
                eyebrow="Patient Workspace"
                title="Doctor directory"
                description="Quickly return to doctors you have seen before, or head into the full directory to discover the right specialist."
                actions={(
                    <Link to="/doctors" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                        Browse all doctors
                        <ArrowRight size={16} />
                    </Link>
                )}
            />

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <article className="rounded-[1.9rem] border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-6 shadow-sm dark:border-cyan-900/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-200">
                        <Search size={20} />
                    </div>
                    <h2 className="mt-5 text-2xl font-semibold text-slate-900 dark:text-white">Find a specialist</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        Explore the full doctor directory, compare specialties, and request the next appointment that fits your care plan.
                    </p>
                    <Link to="/doctors" className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white">
                        Open directory
                        <ArrowRight size={15} />
                    </Link>
                </article>

                {recentDoctors.map((doctor) => (
                    <article key={doctor._id} className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                            <Stethoscope size={20} />
                        </div>
                        <h3 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">{formatUserDisplayName(doctor)}</h3>
                        <p className="mt-2 text-sm text-cyan-700 dark:text-cyan-300">{formatSpecialization(doctor.specialization)}</p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{doctor.email}</p>
                        <Link to={`/doctors/${doctor._id}`} className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white">
                            View profile
                            <ArrowRight size={15} />
                        </Link>
                    </article>
                ))}
            </section>
        </div>
    );
};

export default PatientDoctorsPage;
