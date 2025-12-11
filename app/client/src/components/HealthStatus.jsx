import React, { useState, useEffect } from 'react';

function HealthStatus() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [healthData, setHealthData] = useState(null);
    const [lastChecked, setLastChecked] = useState(null);

    const fetchHealthStatus = async () => {
        setLoading(true);
        setError(null);

        try {
            // Get API base URL from environment variable
            const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
            const url = `${apiBaseUrl}/api/health`;

            // Fetch health data
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Update state
            setHealthData(data);
            setLastChecked(new Date());
            setError(null);
        } catch (err) {
            console.error('Error fetching health status:', err);
            setError(err.message);
            setHealthData(null);
        } finally {
            setLoading(false);
        }
    };

    // Fetch health data on component mount
    useEffect(() => {
        fetchHealthStatus();

        const interval = setInterval(fetchHealthStatus, 30000);

        return () => clearInterval(interval);
    }, []);

    if (loading && !healthData) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="h-12 w-12 rounded-full border-4 border-white/20 border-t-cyan-400 animate-spin" />
                <p className="text-slate-200">Checking system health...</p>
            </div>
        );
    }

    if (error && !healthData) {
        return (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-center">
                <div className="text-4xl">❌</div>
                <h3 className="mt-2 text-xl font-semibold text-white">Unable to Connect</h3>
                <p className="mt-2 text-rose-100">{error}</p>
                <button
                    onClick={fetchHealthStatus}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose-400 px-4 py-2 font-semibold text-rose-950 shadow-lg shadow-rose-400/40 transition hover:shadow-rose-300/60"
                >
                    🔄 Retry
                </button>
                <p className="mt-3 text-sm text-rose-100/80">
                    Make sure the backend server is running at{' '}
                    <code className="rounded bg-white/20 px-2 py-1 text-xs text-white">
                        {process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}
                    </code>
                </p>
            </div>
        );
    }

    if (healthData) {
        const isHealthy = healthData.success && healthData.database.connected;
        const shellColor = isHealthy ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-amber-500/40 bg-amber-500/5';
        const dbBadge = healthData.database.connected ? 'bg-emerald-500/20 text-emerald-100' : 'bg-rose-500/20 text-rose-100';

        return (
            <div className={`rounded-3xl border p-6 sm:p-7 shadow-lg shadow-cyan-500/10 ${shellColor}`}>
                <div className="flex items-start gap-3">
                    <div className="text-3xl">{isHealthy ? '✅' : '⚠️'}</div>
                    <div>
                        <h3 className="text-2xl font-semibold text-white">
                            {isHealthy ? 'System Healthy' : 'System Issues'}
                        </h3>
                        <p className="text-slate-200">
                            {isHealthy ? 'All systems look good.' : 'Some services report issues.'}
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                        <div className="flex items-center gap-2 text-slate-200">
                            <span>📦</span>
                            <h4 className="text-lg font-semibold">Application</h4>
                        </div>
                        <div className="mt-3 space-y-2 text-sm text-slate-200">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-400">Name</span>
                                <span className="font-semibold text-white">{healthData.app.name}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-400">Version</span>
                                <span className="font-semibold text-white">{healthData.app.version}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-400">Environment</span>
                                <span className="rounded-full bg-cyan-500/20 px-2.5 py-1 text-xs font-semibold text-cyan-100">
                                    {healthData.app.env}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                        <div className="flex items-center gap-2 text-slate-200">
                            <span>🗄️</span>
                            <h4 className="text-lg font-semibold">Database</h4>
                        </div>
                        <div className="mt-3 space-y-2 text-sm text-slate-200">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-400">Status</span>
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${dbBadge}`}>
                                    {healthData.database.connected ? '🟢 Connected' : '🔴 Disconnected'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-400">State</span>
                                <span className="font-semibold text-white">{healthData.database.state}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-200">
                        <span className="font-semibold text-white">Last checked:</span>{' '}
                        {lastChecked ? lastChecked.toLocaleTimeString() : 'N/A'}
                    </p>
                    <button
                        onClick={fetchHealthStatus}
                        className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={loading}
                    >
                        {loading ? '⏳ Checking...' : '🔄 Refresh'}
                    </button>
                </div>
            </div>
        );
    }

    return null;
}

export default HealthStatus;
