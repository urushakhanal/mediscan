import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const initialState = {
    name: '',
    email: '',
    password: '',
    phone: '',
    nmcNumber: '',
};

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
        };

        if (role === 'patient') {
            payload.phone = formData.phone.trim();
        }

        if (role === 'doctor') {
            payload.nmcNumber = formData.nmcNumber.trim();
        }

        return payload;
    }, [formData, role]);

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

        if (role === 'patient' && !submitPayload.phone) {
            setError('Phone number is required for patient registration.');
            return;
        }

        if (role === 'doctor' && !submitPayload.nmcNumber) {
            setError('NMC number is required for doctor registration.');
            return;
        }

        try {
            setLoading(true);
            await signUp(submitPayload);
            navigate('/health');
        } catch (err) {
            const firstError = err.data?.errors?.[0];
            const message = firstError || err.message || 'Unable to create account.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-16">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-100/60 via-cyan-100/40 to-white dark:from-slate-900 dark:via-slate-950 dark:to-black" />
            <div className="relative w-full max-w-xl rounded-2xl border border-white/40 bg-white/85 p-8 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-slate-900/85">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700 dark:text-emerald-300">MediScan</p>
                <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Create account</h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Register as a patient or doctor and start using the platform.</p>

                {error && (
                    <div className="mt-5 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
                        {error}
                    </div>
                )}

                <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Register as
                        </label>
                        <select
                            id="role"
                            value={role}
                            onChange={(event) => setRole(event.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                            <option value="patient">Patient</option>
                            <option value="doctor">Doctor</option>
                        </select>
                    </div>

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

                    {role === 'patient' && (
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
                    )}

                    {role === 'doctor' && (
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
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-500 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <UserPlus size={18} />
                        {loading ? 'Creating account...' : 'Create account'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
                    Already have an account?{' '}
                    <Link to="/signin" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
                        Sign in
                    </Link>
                </p>
            </div>
        </section>
    );
};

export default SignUp;
