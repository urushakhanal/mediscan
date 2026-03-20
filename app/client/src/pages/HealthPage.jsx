import React from 'react';
import HealthStatus from '../components/HealthStatus';

const HealthPage = () => {
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
    const apiDocsUrl = `${apiBaseUrl}/api/docs`;

    return (
        <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_48%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_30%)] dark:bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_46%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_28%)]" />
            <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pb-10">
                <header className="rounded-[2rem] border border-slate-200/80 bg-white/90 px-6 py-7 shadow-[0_24px_80px_-48px_rgba(14,165,233,0.45)] backdrop-blur sm:px-8 dark:border-slate-800 dark:bg-slate-900/85">
                    <p className="text-[0.68rem] uppercase tracking-[0.32em] text-cyan-700 dark:text-cyan-300">MediScan</p>
                    <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl dark:text-white">System health</h1>
                            <p className="max-w-2xl text-sm text-slate-600 sm:text-base dark:text-slate-300">
                                A minimal live view of API and database availability, with quick access to docs.
                            </p>
                        </div>
                        <div className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300">
                            Refreshes every 30 seconds
                        </div>
                    </div>
                </header>

                <div className="flex flex-col gap-3 rounded-[1.75rem] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.35)] sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-800 dark:bg-slate-900">
                    <div>
                        <p className="text-[0.7rem] uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Swagger / API docs</p>
                        <p className="break-all text-sm text-slate-700 dark:text-slate-200">{apiDocsUrl}</p>
                    </div>
                    <a
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                        href={apiDocsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Open Swagger
                    </a>
                </div>

                <section
                    id="status"
                    className="rounded-[2rem] border border-slate-200/80 bg-white p-4 shadow-[0_30px_90px_-60px_rgba(14,165,233,0.35)] sm:p-6 dark:border-slate-800 dark:bg-slate-900"
                >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-[0.7rem] uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Live health</p>
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Service pulse</h2>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Checks API and database connectivity.</p>
                    </div>
                    <div className="mt-4">
                        <HealthStatus />
                    </div>
                </section>
            </div>
        </div>
    );
};

export default HealthPage;
