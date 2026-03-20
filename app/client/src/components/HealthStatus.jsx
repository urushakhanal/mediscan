import React, { useEffect, useState } from 'react';

function HealthStatus() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [healthData, setHealthData] = useState(null);
    const [lastChecked, setLastChecked] = useState(null);

    const fetchHealthStatus = async () => {
        setLoading(true);
        setError(null);

        try {
            const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
            const response = await fetch(`${apiBaseUrl}/api/health`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setHealthData(data);
            setLastChecked(new Date());
        } catch (requestError) {
            console.error('Error fetching health status:', requestError);
            setError(requestError.message);
            setHealthData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealthStatus();

        const interval = setInterval(fetchHealthStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !healthData) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-500 dark:border-slate-700 dark:border-t-cyan-400" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Checking system health...</p>
            </div>
        );
    }

    if (error && !healthData) {
        return (
            <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/60 dark:bg-rose-950/30">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-lg font-semibold text-rose-700 shadow-sm dark:bg-slate-900 dark:text-rose-200">
                    ERR
                </div>
                <h3 className="mt-4 text-xl font-semibold text-rose-900 dark:text-rose-100">Unable to connect</h3>
                <p className="mt-2 text-sm text-rose-700 dark:text-rose-200">{error}</p>
                <button
                    onClick={fetchHealthStatus}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 font-semibold text-white transition hover:bg-rose-700"
                >
                    Retry
                </button>
                <p className="mt-3 text-sm text-rose-700/80 dark:text-rose-200/80">
                    Make sure the backend server is running at{' '}
                    <code className="rounded bg-white px-2 py-1 text-xs text-rose-900 dark:bg-slate-900 dark:text-rose-100">
                        {process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}
                    </code>
                </p>
            </div>
        );
    }

    if (!healthData) {
        return null;
    }

    const isHealthy = healthData.success && healthData.database.connected;
    const shellColor = isHealthy
        ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/20'
        : 'border-amber-200 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/20';
    const dbBadge = healthData.database.connected
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200';
    const systemBadge = isHealthy ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950';

    return (
        <div className={`rounded-[1.75rem] border p-6 sm:p-7 ${shellColor}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-semibold ${systemBadge}`}>
                        {isHealthy ? 'OK' : '!'}
                    </div>
                    <div>
                        <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                            {isHealthy ? 'System Healthy' : 'System Issues'}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300">
                            {isHealthy ? 'All core services are responding normally.' : 'One or more services need attention.'}
                        </p>
                    </div>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Last checked</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                        {lastChecked ? lastChecked.toLocaleTimeString() : 'N/A'}
                    </p>
                </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-100 text-sm font-semibold text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300">
                            A
                        </span>
                        <h4 className="text-lg font-semibold">Application</h4>
                    </div>
                    <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500 dark:text-slate-400">Name</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{healthData.app.name}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500 dark:text-slate-400">Version</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{healthData.app.version}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500 dark:text-slate-400">Environment</span>
                            <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200">
                                {healthData.app.env}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                            D
                        </span>
                        <h4 className="text-lg font-semibold">Database</h4>
                    </div>
                    <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500 dark:text-slate-400">Status</span>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${dbBadge}`}>
                                {healthData.database.connected ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-500 dark:text-slate-400">State</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{healthData.database.state}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 rounded-[1.25rem] border border-white/70 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    Health status is fetched from the API endpoint and updates automatically in the background.
                </p>
                <button
                    onClick={fetchHealthStatus}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    disabled={loading}
                >
                    {loading ? 'Checking...' : 'Refresh'}
                </button>
            </div>
        </div>
    );
}

export default HealthStatus;
