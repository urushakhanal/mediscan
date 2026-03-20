import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { registerSuperadmin } from '../lib/auth';

const InitSuperadmin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        setupKey: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showSetupKey, setShowSetupKey] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        setError('');
        const { id, value } = event.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (!formData.name.trim() || !formData.email.trim() || !formData.password || !formData.setupKey) {
            setError('All fields are required.');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        try {
            setLoading(true);
            await registerSuperadmin({
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                setupKey: formData.setupKey,
            });
            navigate('/');
        } catch (requestError) {
            const firstError = requestError.data?.errors?.[0];
            const message = firstError || requestError.message || 'Unable to initialize superadmin.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-16">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.22),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.22),transparent_28%)]" />
            <div className="relative w-full max-w-xl rounded-3xl border border-white/40 bg-white/85 p-8 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-slate-900/85">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700 dark:text-emerald-300">Bootstrap Access</p>
                <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Initialize superadmin</h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Create the first privileged account using the server setup key.
                </p>

                {error && (
                    <div className="mt-5 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
                        {error}
                    </div>
                )}

                <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Full name
                        </label>
                        <input
                            id="name"
                            type="text"
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
                            id="email"
                            type="email"
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
                                id="password"
                                type={showPassword ? 'text' : 'password'}
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

                    <div>
                        <label htmlFor="setupKey" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Setup key
                        </label>
                        <div className="relative">
                            <input
                                id="setupKey"
                                type={showSetupKey ? 'text' : 'password'}
                                value={formData.setupKey}
                                onChange={handleChange}
                                required
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-11 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={() => setShowSetupKey((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
                                aria-label="Toggle setup key visibility"
                            >
                                {showSetupKey ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-500 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <ShieldCheck size={18} />
                        {loading ? 'Creating superadmin...' : 'Create superadmin'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
                    Already initialized?{' '}
                    <Link to="/signin" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
                        Sign in
                    </Link>
                </p>
            </div>
        </section>
    );
};

export default InitSuperadmin;
