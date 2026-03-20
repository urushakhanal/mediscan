import React, { useEffect, useState } from 'react';
import { ArrowLeft, Mail, Phone, ShieldCheck, Stethoscope } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getVerifiedDoctorById } from '../lib/auth';

const formatSpecialization = (value) =>
    value
        ? value
            .split('-')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ')
        : 'General Practice';

const DoctorDetailPage = () => {
    const { id } = useParams();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadDoctor = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await getVerifiedDoctorById(id);
                setDoctor(data.doctor);
            } catch (requestError) {
                setError(requestError.message || 'Unable to load doctor profile.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadDoctor();
        }
    }, [id]);

    if (loading) {
        return (
            <section className="px-4 py-10 sm:py-12">
                <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="h-5 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="mt-6 h-10 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="mt-4 h-5 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="mt-8 grid gap-4 md:grid-cols-2">
                        <div className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                        <div className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                    </div>
                </div>
            </section>
        );
    }

    if (error || !doctor) {
        return (
            <section className="px-4 py-10 sm:py-12">
                <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-200 bg-white p-8 text-center shadow-sm dark:border-rose-900/60 dark:bg-slate-900">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Doctor profile unavailable</h1>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{error || 'Doctor not found.'}</p>
                    <Link
                        to="/doctors"
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                        <ArrowLeft size={16} />
                        Back to doctors
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <section className="relative overflow-hidden px-4 py-10 sm:py-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_28%),radial-gradient(circle_at_right,rgba(6,182,212,0.12),transparent_24%)]" />
            <div className="relative mx-auto max-w-4xl space-y-6">
                <Link
                    to="/doctors"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                >
                    <ArrowLeft size={16} />
                    Back to doctors
                </Link>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                                <Stethoscope size={26} />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-300">Verified Doctor</p>
                                <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{doctor.name}</h1>
                                <p className="mt-2 text-base font-medium text-cyan-700 dark:text-cyan-300">
                                    {formatSpecialization(doctor.specialization)}
                                </p>
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                            <ShieldCheck size={16} />
                            Approved by superadmin
                        </div>
                    </div>
                </section>

                <section className="grid gap-5 md:grid-cols-2">
                    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Contact</p>
                        <div className="mt-4 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 text-cyan-700 dark:text-cyan-300">
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                                    <p className="font-medium text-slate-900 dark:text-white">{doctor.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 text-cyan-700 dark:text-cyan-300">
                                    <Phone size={18} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Phone</p>
                                    <p className="font-medium text-slate-900 dark:text-white">{doctor.phone || 'Phone not available'}</p>
                                </div>
                            </div>
                        </div>
                    </article>

                    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Professional Details</p>
                        <div className="mt-4 space-y-4">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Specialization</p>
                                <p className="font-medium text-slate-900 dark:text-white">{formatSpecialization(doctor.specialization)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">NMC Number</p>
                                <p className="font-medium text-slate-900 dark:text-white">{doctor.nmcNumber}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                                <p className="font-medium text-emerald-700 dark:text-emerald-300">Verified and publicly listed</p>
                            </div>
                        </div>
                    </article>
                </section>
            </div>
        </section>
    );
};

export default DoctorDetailPage;
