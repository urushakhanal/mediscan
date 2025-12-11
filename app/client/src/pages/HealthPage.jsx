import React from 'react';
import HealthStatus from '../components/HealthStatus';

const HealthPage = () => {
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
    const apiDocsUrl = `${apiBaseUrl}/api/docs`;

    return (
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pb-10">
            <header className="space-y-2 text-center sm:text-left">
                <p className="text-[0.68rem] uppercase tracking-[0.32em] text-cyan-200">MediScan</p>
                <h1 className="text-3xl font-bold sm:text-4xl">Health & Database Status</h1>
                <p className="text-slate-300">Live service pulse with API docs handy.</p>
            </header>

            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-lg shadow-cyan-500/10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                    <p className="text-[0.7rem] uppercase tracking-[0.28em] text-slate-400">Swagger / API docs</p>
                    <p className="break-all text-sm text-slate-200">{apiDocsUrl}</p>
                </div>
                <a
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-400/30"
                    href={apiDocsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Open Swagger
                </a>
            </div>

            <section
                id="status"
                className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-cyan-500/10 sm:p-6"
            >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-[0.7rem] uppercase tracking-[0.28em] text-cyan-200">Live Health</p>
                        <h2 className="text-2xl font-semibold text-white">Service Pulse</h2>
                    </div>
                    <p className="text-sm text-slate-300">Auto-refreshes every 30 seconds.</p>
                </div>
                <div className="mt-4">
                    <HealthStatus />
                </div>
            </section>
        </div>
    );
};

export default HealthPage;
