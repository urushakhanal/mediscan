import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { completeGoogleDoctorProfile } from '../lib/auth';
import { useAuth } from '../context/AuthContext';

const specializationOptions = [
    { value: 'general-medicine', label: 'General Medicine' },
    { value: 'cardiology', label: 'Cardiology' },
    { value: 'dermatology', label: 'Dermatology' },
    { value: 'neurology', label: 'Neurology' },
    { value: 'pediatrics', label: 'Pediatrics' },
    { value: 'orthopedics', label: 'Orthopedics' },
    { value: 'gynecology', label: 'Gynecology' },
    { value: 'obstetrics', label: 'Obstetrics' },
    { value: 'psychiatry', label: 'Psychiatry' },
    { value: 'oncology', label: 'Oncology' },
    { value: 'radiology', label: 'Radiology' },
    { value: 'anesthesiology', label: 'Anesthesiology' },
    { value: 'ophthalmology', label: 'Ophthalmology' },
    { value: 'ent', label: 'ENT' },
    { value: 'urology', label: 'Urology' },
    { value: 'nephrology', label: 'Nephrology' },
    { value: 'endocrinology', label: 'Endocrinology' },
    { value: 'gastroenterology', label: 'Gastroenterology' },
    { value: 'pulmonology', label: 'Pulmonology' },
    { value: 'hematology', label: 'Hematology' },
    { value: 'rheumatology', label: 'Rheumatology' },
    { value: 'infectious-disease', label: 'Infectious Disease' },
    { value: 'plastic-surgery', label: 'Plastic Surgery' },
    { value: 'neurosurgery', label: 'Neurosurgery' },
    { value: 'general-surgery', label: 'General Surgery' },
    { value: 'vascular-surgery', label: 'Vascular Surgery' },
    { value: 'emergency-medicine', label: 'Emergency Medicine' },
    { value: 'family-medicine', label: 'Family Medicine' },
    { value: 'internal-medicine', label: 'Internal Medicine' },
    { value: 'pathology', label: 'Pathology' },
    { value: 'rehabilitation-medicine', label: 'Rehabilitation Medicine' },
];

const qualificationOptions = [
    { value: 'mbbs', label: 'MBBS' },
    { value: 'bds', label: 'BDS' },
    { value: 'md', label: 'MD' },
    { value: 'ms', label: 'MS' },
    { value: 'dm', label: 'DM' },
    { value: 'mch', label: 'MCh' },
    { value: 'dnb', label: 'DNB' },
    { value: 'fcps', label: 'FCPS' },
    { value: 'phd', label: 'PhD' },
    { value: 'mph', label: 'MPH' },
    { value: 'bsc-nursing', label: 'BSc Nursing' },
    { value: 'msc-nursing', label: 'MSc Nursing' },
];

const GoogleDoctorOnboardingPage = () => {
    const navigate = useNavigate();
    const { user, isLoading, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        nmcNumber: '',
        experienceYears: '',
        specialization: '',
        qualification: '',
        currentlyWorkingAt: '',
    });

    useEffect(() => {
        if (user) {
            setFormData((current) => ({
                ...current,
                name: user.name || current.name,
                phone: user.phone || current.phone,
            }));
        }
    }, [user]);

    useEffect(() => {
        if (!isLoading && user && user.role === 'doctor') {
            navigate('/doctor/overview', { replace: true });
        }
    }, [isLoading, navigate, user]);

    const canSubmit = useMemo(
        () => Boolean(
            formData.name.trim() &&
            formData.phone.trim() &&
            formData.nmcNumber.trim() &&
            formData.specialization &&
            Number.isFinite(Number(formData.experienceYears)) &&
            formData.qualification &&
            formData.currentlyWorkingAt.trim()
        ),
        [formData]
    );

    const handleChange = (event) => {
        const { id, value } = event.target;
        setError('');
        setFormData((current) => ({ ...current, [id]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        try {
            setLoading(true);
            const data = await completeGoogleDoctorProfile({
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                nmcNumber: formData.nmcNumber.trim(),
                experienceYears: Number(formData.experienceYears),
                specialization: formData.specialization,
                qualification: formData.qualification,
                currentlyWorkingAt: formData.currentlyWorkingAt.trim(),
            });

            await refreshUser();

            if (data?.user?.role === 'doctor') {
                navigate('/doctor/overview', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        } catch (requestError) {
            setError(requestError.message || 'Unable to complete your doctor profile.');
        } finally {
            setLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center px-4">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading your account...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/signin" replace />;
    }

    return (
        <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden px-4 py-8 sm:py-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_26%),linear-gradient(180deg,rgba(248,250,252,0.95),rgba(236,253,245,0.85))] dark:bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.12),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.96))]" />

            <div className="relative mx-auto max-w-3xl">
                <div className="overflow-hidden rounded-[2rem] border border-white/50 bg-white/88 shadow-[0_32px_100px_-58px_rgba(16,185,129,0.42)] backdrop-blur dark:border-white/10 dark:bg-slate-900/88">
                    <div className="border-b border-slate-200/80 px-6 py-6 sm:px-8 dark:border-slate-800">
                        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-700 dark:text-cyan-300">
                            MediScan Google Doctor Setup
                        </p>
                        <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Complete your doctor profile</h1>
                        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                            We have your Google account. Finish your professional details so we can activate your doctor workspace.
                        </p>
                    </div>

                    <div className="px-6 py-6 sm:px-8 sm:py-7">
                        {error && (
                            <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
                                {error}
                            </div>
                        )}

                        <form className="mt-5 space-y-6" onSubmit={handleSubmit}>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        Full name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        Phone number
                                    </label>
                                    <input
                                        type="text"
                                        id="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label htmlFor="nmcNumber" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        NMC number
                                    </label>
                                    <input
                                        type="text"
                                        id="nmcNumber"
                                        value={formData.nmcNumber}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="experienceYears" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        Experience years
                                    </label>
                                    <input
                                        type="number"
                                        id="experienceYears"
                                        min="0"
                                        max="80"
                                        value={formData.experienceYears}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label htmlFor="specialization" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        Specialization
                                    </label>
                                    <select
                                        id="specialization"
                                        value={formData.specialization}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    >
                                        <option value="">Select specialization</option>
                                        {specializationOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="qualification" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        Qualification
                                    </label>
                                    <select
                                        id="qualification"
                                        value={formData.qualification}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    >
                                        <option value="">Select qualification</option>
                                        {qualificationOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="currentlyWorkingAt" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    Currently working at
                                </label>
                                <input
                                    type="text"
                                    id="currentlyWorkingAt"
                                    value={formData.currentlyWorkingAt}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>

                            <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
                                <p className="font-semibold text-slate-900 dark:text-white">Google account</p>
                                <p className="mt-1">{user.email}</p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !canSubmit}
                                className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-500 px-4 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-500 hover:to-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? 'Saving profile...' : 'Complete doctor profile'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default GoogleDoctorOnboardingPage;
