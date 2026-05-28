import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { startGoogleSignIn } from '../lib/auth';

const SignIn = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const googleError = params.get('google_error');
        if (googleError) {
            setError(googleError);
        }
    }, [location.search]);

    const handleChange = (event) => {
        setError('');
        const { id, value } = event.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (!formData.email || !formData.password) {
            setError('Email and password are required.');
            return;
        }

        try {
            setLoading(true);
            await signIn(formData);
            navigate('/');
        } catch (err) {
            const firstError = err.data?.errors?.[0];
            const message = firstError || err.message || 'Unable to sign in.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        window.location.href = startGoogleSignIn();
    };

    return (
        <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-16">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-100/60 via-emerald-100/40 to-white dark:from-slate-900 dark:via-slate-950 dark:to-black" />
            <div className="relative w-full max-w-lg rounded-2xl border border-white/40 bg-white/80 p-8 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-slate-900/85">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">MediScan</p>
                <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Welcome back</h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Sign in to access your healthcare workspace.</p>

                {error && (
                    <div className="mt-5 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
                        {error}
                    </div>
                )}

                <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            required
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                                placeholder="Enter your password"
                                required
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-11 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-500 px-4 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-500 hover:to-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <LogIn size={18} />
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <div className="my-6 flex items-center gap-4">
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">or</span>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                </div>

                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-slate-500 dark:hover:bg-slate-700"
                >
                    Continue with Google
                </button>

                <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
                    New to MediScan?{' '}
                    <Link to="/signup" className="font-semibold text-cyan-700 hover:underline dark:text-cyan-300">
                        Create an account
                    </Link>
                </p>
            </div>
        </section>
    );
};

export default SignIn;
