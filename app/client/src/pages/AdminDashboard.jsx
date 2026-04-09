import React, { useEffect, useState } from 'react';
import { Activity, Shield, UserCheck, Users } from 'lucide-react';
import { getUsers } from '../lib/auth';
import { formatExperienceYears, formatUserDisplayName } from '../lib/utils';
import { formatSpecialization } from '../lib/appointments';

const cardConfig = [
    {
        key: 'total',
        label: 'Total users',
        icon: Users,
        accent: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900',
    },
    {
        key: 'patients',
        label: 'Patients',
        icon: Activity,
        accent: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200',
    },
    {
        key: 'doctors',
        label: 'Doctors',
        icon: UserCheck,
        accent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
    },
    {
        key: 'superadmins',
        label: 'Superadmins',
        icon: Shield,
        accent: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
    },
];

const emptySummary = {
    total: 0,
    patients: 0,
    doctors: 0,
    superadmins: 0,
};

const AdminDashboard = () => {
    const [summary, setSummary] = useState(emptySummary);
    const [recentUsers, setRecentUsers] = useState([]);
    const [recentDoctors, setRecentDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadUsers = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await getUsers();
                const users = data.users || [];

                setSummary({
                    total: users.length,
                    patients: users.filter((user) => user.role === 'patient').length,
                    doctors: users.filter((user) => user.role === 'doctor').length,
                    superadmins: users.filter((user) => user.role === 'superadmin').length,
                });
                setRecentUsers(users.slice(0, 5));
                setRecentDoctors(users.filter((user) => user.role === 'doctor').slice(0, 5));
            } catch (requestError) {
                setError(requestError.message || 'Unable to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };

        loadUsers();
    }, []);

    return (
        <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Overview</p>
                <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Admin dashboard</h2>
            </section>

            {error && (
                <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                    {error}
                </div>
            )}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {cardConfig.map((card) => {
                    const Icon = card.icon;
                    return (
                        <article
                            key={card.key}
                            className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.accent}`}>
                                <Icon size={18} />
                            </div>
                            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                            <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                                {loading ? '--' : summary[card.key]}
                            </p>
                        </article>
                    );
                })}
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Recent users</p>
                        <h3 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Latest accounts</h3>
                    </div>
                </div>

                <div className="mt-5 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="pb-3 pr-4 font-medium">Name</th>
                                <th className="pb-3 pr-4 font-medium">Email</th>
                                <th className="pb-3 pr-4 font-medium">Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentUsers.map((user) => (
                                <tr key={user._id}>
                                    <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">{formatUserDisplayName(user)}</td>
                                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{user.email}</td>
                                    <td className="py-3 pr-4">
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                            {user.role}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {!loading && recentUsers.length === 0 && (
                                <tr>
                                    <td className="py-4 text-slate-500 dark:text-slate-400" colSpan="3">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-300">Doctor review</p>
                        <h3 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Latest doctor registrations</h3>
                    </div>
                </div>

                <div className="mt-5 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="pb-3 pr-4 font-medium">Name</th>
                                <th className="pb-3 pr-4 font-medium">Specialization</th>
                                <th className="pb-3 pr-4 font-medium">Experience</th>
                                <th className="pb-3 pr-4 font-medium">Qualification</th>
                                <th className="pb-3 pr-4 font-medium">Currently Working At</th>
                                <th className="pb-3 pr-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentDoctors.map((doctor) => (
                                <tr key={doctor._id}>
                                    <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">{formatUserDisplayName(doctor)}</td>
                                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{formatSpecialization(doctor.specialization)}</td>
                                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{formatExperienceYears(doctor.experienceYears)}</td>
                                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{doctor.qualification || '-'}</td>
                                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{doctor.currentlyWorkingAt || '-'}</td>
                                    <td className="py-3 pr-4">
                                        <span
                                            className={[
                                                'rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em]',
                                                doctor.isVerified
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
                                            ].join(' ')}
                                        >
                                            {doctor.isVerified ? 'Verified' : 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {!loading && recentDoctors.length === 0 && (
                                <tr>
                                    <td className="py-4 text-slate-500 dark:text-slate-400" colSpan="6">
                                        No doctors found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default AdminDashboard;
