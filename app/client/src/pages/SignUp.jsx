import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { startGoogleSignIn } from '../lib/auth';

const initialState = {
    name: '',
    email: '',
    password: '',
    phone: '',
    nmcNumber: '',
    experienceYears: '',
    specialization: '',
    qualification: '',
    currentlyWorkingAt: '',
};

const roleOptions = [
    { value: 'patient', label: 'Patient' },
    { value: 'doctor', label: 'Doctor' },
];

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

const SignUp = () => {
    const navigate = useNavigate();
    const { signUp } = useAuth();
    const [role, setRole] = useState('patient');
    const [formData, setFormData] = useState(initialState);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submitPayload = useMemo(() => {
        const payload = {
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
            role,
            phone: formData.phone.trim(),
        };

        if (role === 'doctor') {
            payload.nmcNumber = formData.nmcNumber.trim();
            payload.experienceYears = Number(formData.experienceYears);
            payload.specialization = formData.specialization;
            payload.qualification = formData.qualification;
            payload.currentlyWorkingAt = formData.currentlyWorkingAt.trim();
        }

        return payload;
    }, [formData, role]);

    const handleRoleChange = (nextRole) => {
        setError('');
        setRole(nextRole);
        setFormData((prev) => ({
            ...prev,
            nmcNumber: nextRole === 'doctor' ? prev.nmcNumber : '',
            experienceYears: nextRole === 'doctor' ? prev.experienceYears : '',
            specialization: nextRole === 'doctor' ? prev.specialization : '',
            qualification: nextRole === 'doctor' ? prev.qualification : '',
            currentlyWorkingAt: nextRole === 'doctor' ? prev.currentlyWorkingAt : '',
        }));
    };

    const handleGoogleSignIn = () => {
        window.location.href = startGoogleSignIn(role);
    };

    const handleChange = (event) => {
        setError('');
        const { id, value } = event.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (!submitPayload.name || !submitPayload.email || !submitPayload.password) {
            setError('Name, email and password are required.');
            return;
        }

        if (submitPayload.password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        if (!submitPayload.phone) {
            setError(`Phone number is required for ${role} registration.`);
            return;
        }

        if (role === 'doctor' && !submitPayload.nmcNumber) {
            setError('NMC number is required for doctor registration.');
            return;
        }

        if (role === 'doctor' && !submitPayload.specialization) {
            setError('Specialization is required for doctor registration.');
            return;
        }

        if (role === 'doctor' && !Number.isFinite(submitPayload.experienceYears)) {
            setError('Experience year is required for doctor registration.');
            return;
        }

        if (role === 'doctor' && !submitPayload.qualification) {
            setError('Qualification is required for doctor registration.');
            return;
        }

        if (role === 'doctor' && !submitPayload.currentlyWorkingAt) {
            setError('Currently working at is required for doctor registration.');
            return;
        }

        try {
            setLoading(true);
            await signUp(submitPayload);
            navigate('/');
        } catch (err) {
            const firstError = err.data?.errors?.[0];
            const message = firstError || err.message || 'Unable to create account.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden px-4 py-8 sm:py-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.15),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.16),transparent_26%),linear-gradient(180deg,rgba(248,250,252,0.95),rgba(236,253,245,0.85))] dark:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.16),transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.96))]" />

            <div className="relative mx-auto max-w-3xl">
                <div className="overflow-hidden rounded-[2rem] border border-white/50 bg-white/88 shadow-[0_32px_100px_-58px_rgba(16,185,129,0.42)] backdrop-blur dark:border-white/10 dark:bg-slate-900/88">
                    <div className="border-b border-slate-200/80 px-6 py-6 sm:px-8 dark:border-slate-800">
                        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700 dark:text-emerald-300">
                            MediScan Registration
                        </p>
                        <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Create your account</h1>
                        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                            Complete your details below. Doctor registration includes professional information and stays pending until superadmin verification.
                        </p>
                    </div>

                    <div className="px-6 py-6 sm:px-8 sm:py-7">
                        {error && (
                            <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
                                {error}
                            </div>
                        )}

                        <form className="mt-5 space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    I am registering as
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {roleOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => handleRoleChange(option.value)}
                                            className={[
                                                'rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                                                role === option.value
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm dark:border-emerald-400 dark:bg-emerald-950/30 dark:text-emerald-100'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white',
                                            ].join(' ')}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-white/70 px-4 py-4 dark:border-slate-700 dark:bg-slate-950/30">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Prefer Google sign-in?</p>
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                            Use your Google account and we will finish the rest of the setup after sign-in.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleGoogleSignIn}
                                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-slate-500 dark:hover:bg-slate-700"
                                    >
                                        Continue with Google
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
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
                                            required
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Phone number
                                        </label>
                                        <input
                                            type="text"
                                            id="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                id="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                                minLength={8}
                                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-11 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
                                                aria-label="Toggle password visibility"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {role === 'doctor' && (
                                <div className="rounded-[1.75rem] border border-cyan-100 bg-cyan-50/70 p-5 dark:border-cyan-900/40 dark:bg-cyan-950/20">
                                    <div className="mb-4">
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Doctor details</h2>
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                            Provide your professional registration details for review.
                                        </p>
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
                                                required
                                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="experienceYears" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                                Experienced year
                                            </label>
                                            <input
                                                type="number"
                                                id="experienceYears"
                                                min="0"
                                                max="80"
                                                value={formData.experienceYears}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="specialization" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                                Specialization
                                            </label>
                                            <select
                                                id="specialization"
                                                value={formData.specialization}
                                                onChange={handleChange}
                                                required
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
                                                required
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

                                    <div className="mt-4">
                                        <label htmlFor="currentlyWorkingAt" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Currently working at
                                        </label>
                                        <input
                                            type="text"
                                            id="currentlyWorkingAt"
                                            value={formData.currentlyWorkingAt}
                                            onChange={handleChange}
                                            required
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-4 border-t border-slate-200 pt-5 dark:border-slate-800">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-500 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <UserPlus size={18} />
                                    {loading ? 'Creating account...' : 'Create account'}
                                </button>

                                <p className="text-center text-sm text-slate-600 dark:text-slate-300">
                                    Already have an account?{' '}
                                    <Link to="/signin" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
                                        Sign in
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SignUp;
