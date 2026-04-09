import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Ban, Eye, ShieldAlert, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { activateUserById, blockUserById, deleteUserById, getUsers, verifyDoctorById } from '../../lib/auth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import { formatExperienceYears, formatUserDisplayName } from '../../lib/utils';
import { formatSpecialization } from '../../lib/appointments';

const AdminUserManagementView = ({ userRole, title, description }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [verifyTarget, setVerifyTarget] = useState(null);
    const [statusTarget, setStatusTarget] = useState(null);
    const [detailTarget, setDetailTarget] = useState(null);

    const visibleUsers = useMemo(
        () => users.filter((user) => user.role === userRole),
        [users, userRole]
    );

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getUsers();
            setUsers(data.users || []);
        } catch (requestError) {
            setError(requestError.message || 'Unable to load users.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleDelete = async () => {
        if (!deleteTarget?._id) return;
        try {
            setDeleteLoading(true);
            await deleteUserById(deleteTarget._id);
            setDeleteTarget(null);
            await loadUsers();
        } catch (requestError) {
            setError(requestError.message || 'Unable to delete user.');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleVerifyDoctor = async () => {
        if (!verifyTarget?._id) return;

        try {
            setVerifyLoading(true);
            await verifyDoctorById(verifyTarget._id, { isVerified: !verifyTarget.isVerified });
            setVerifyTarget(null);
            await loadUsers();
        } catch (requestError) {
            setError(requestError.message || 'Unable to update verification status.');
        } finally {
            setVerifyLoading(false);
        }
    };

    const handleToggleUserStatus = async () => {
        if (!statusTarget?._id) return;

        try {
            setStatusLoading(true);

            if (statusTarget.isActive === false) {
                await activateUserById(statusTarget._id);
                toast.success('User activated successfully.');
            } else {
                await blockUserById(statusTarget._id);
                toast.success('User blocked successfully.');
            }

            setStatusTarget(null);
            await loadUsers();
        } catch (requestError) {
            setError(requestError.message || 'Unable to update user status.');
        } finally {
            setStatusLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">
                    {userRole === 'doctor' ? 'Doctors' : 'Patients'}
                </p>
                <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{title}</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{description}</p>
            </section>

            {error && (
                <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                    {error}
                </div>
            )}

            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {loading ? `Loading ${userRole}s...` : `${visibleUsers.length} ${userRole}${visibleUsers.length === 1 ? '' : 's'} found`}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Name</th>
                                <th className="px-6 py-3 font-medium">Email</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                {userRole === 'doctor' && <th className="px-6 py-3 font-medium">Verified</th>}
                                {userRole === 'doctor' && <th className="px-6 py-3 font-medium">Specialization</th>}
                                <th className="px-6 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {visibleUsers.map((user) => (
                                <tr key={user._id} className="text-slate-700 dark:text-slate-200">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{formatUserDisplayName(user)}</td>
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={[
                                                'rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em]',
                                                user.isActive !== false
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
                                            ].join(' ')}
                                        >
                                            {user.isActive !== false ? 'Active' : 'Blocked'}
                                        </span>
                                    </td>
                                    {userRole === 'doctor' && (
                                        <td className="px-6 py-4">
                                            <span
                                                className={[
                                                    'rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em]',
                                                    user.isVerified
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
                                                ].join(' ')}
                                            >
                                                {user.isVerified ? 'Verified' : 'Pending'}
                                            </span>
                                        </td>
                                    )}
                                    {userRole === 'doctor' && <td className="px-6 py-4">{formatSpecialization(user.specialization)}</td>}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {userRole === 'doctor' && (
                                                <button
                                                    onClick={() => setDetailTarget(user)}
                                                    disabled={deleteLoading || verifyLoading || statusLoading}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                                    title="View doctor details"
                                                    aria-label={`View details for ${formatUserDisplayName(user)}`}
                                                >
                                                    <Eye size={15} />
                                                </button>
                                            )}
                                            {userRole === 'doctor' && (
                                                <button
                                                    onClick={() => setVerifyTarget(user)}
                                                    disabled={verifyLoading || statusLoading}
                                                    className={[
                                                        'inline-flex h-9 w-9 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-60',
                                                        user.isVerified
                                                            ? 'border-amber-200 text-amber-700 hover:border-amber-500 hover:bg-amber-50 dark:border-amber-900/60 dark:text-amber-300 dark:hover:bg-amber-950/30'
                                                            : 'border-emerald-200 text-emerald-700 hover:border-emerald-500 hover:bg-emerald-50 dark:border-emerald-900/60 dark:text-emerald-300 dark:hover:bg-emerald-950/30',
                                                    ].join(' ')}
                                                    title={user.isVerified ? 'Change to unverified' : 'Verify doctor'}
                                                    aria-label={user.isVerified ? `Mark ${formatUserDisplayName(user)} as unverified` : `Verify ${formatUserDisplayName(user)}`}
                                                >
                                                    {user.isVerified ? <ShieldAlert size={15} /> : <BadgeCheck size={15} />}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setStatusTarget(user)}
                                                disabled={deleteLoading || verifyLoading || statusLoading}
                                                className={[
                                                    'inline-flex h-9 w-9 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-60',
                                                    user.isActive !== false
                                                        ? 'border-rose-200 text-rose-600 hover:border-rose-500 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/30'
                                                        : 'border-emerald-200 text-emerald-700 hover:border-emerald-500 hover:bg-emerald-50 dark:border-emerald-900/60 dark:text-emerald-300 dark:hover:bg-emerald-950/30',
                                                ].join(' ')}
                                                title={user.isActive !== false ? 'Block user' : 'Activate user'}
                                                aria-label={user.isActive !== false ? `Block ${formatUserDisplayName(user)}` : `Activate ${formatUserDisplayName(user)}`}
                                            >
                                                {user.isActive !== false ? <Ban size={15} /> : <Ban size={15} />}
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(user)}
                                                disabled={deleteLoading || verifyLoading || statusLoading}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 text-rose-600 transition hover:border-rose-500 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/30 disabled:cursor-not-allowed disabled:opacity-60"
                                                title="Delete user"
                                                aria-label={`Delete ${formatUserDisplayName(user)}`}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && visibleUsers.length === 0 && (
                                <tr>
                                    <td className="px-6 py-6 text-slate-500 dark:text-slate-400" colSpan={userRole === 'doctor' ? 6 : 4}>
                                        No {userRole}s found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <DeleteConfirmationDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => (!open ? setDeleteTarget(null) : null)}
                onConfirm={handleDelete}
                loading={deleteLoading}
                title={deleteTarget ? `Delete ${deleteTarget.name}?` : 'Delete user?'}
                description="This user will be permanently removed from the system. This action cannot be undone."
            />

            <Dialog open={Boolean(verifyTarget)} onOpenChange={(open) => (!open ? setVerifyTarget(null) : null)}>
                <DialogContent className="max-w-md rounded-[1.75rem] border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-900">
                    <div className="p-6">
                        <DialogHeader>
                            <p className="text-xs uppercase tracking-[0.28em] text-emerald-600 dark:text-emerald-300">Doctor Verification</p>
                            <DialogTitle className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                                {verifyTarget
                                    ? verifyTarget.isVerified
                                        ? `Remove verification for ${formatUserDisplayName(verifyTarget)}?`
                                        : `Verify ${formatUserDisplayName(verifyTarget)}?`
                                    : 'Update verification?'}
                            </DialogTitle>
                            <DialogDescription>
                                {verifyTarget?.isVerified
                                    ? 'This will remove doctor verification for this account.'
                                    : 'This will mark the doctor as verified and approved by the superadmin.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <button type="button" onClick={handleVerifyDoctor} disabled={verifyLoading} className="inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                                {verifyLoading ? 'Updating...' : verifyTarget?.isVerified ? 'Remove verification' : 'Verify doctor'}
                            </button>
                            <button type="button" onClick={() => setVerifyTarget(null)} disabled={verifyLoading} className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white">
                                Cancel
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(detailTarget)} onOpenChange={(open) => (!open ? setDetailTarget(null) : null)}>
                <DialogContent className="max-w-2xl rounded-[1.75rem] border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-900">
                    {detailTarget && (
                        <div className="p-6">
                            <DialogHeader>
                                <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Doctor Details</p>
                                <DialogTitle className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                                    {formatUserDisplayName(detailTarget)}
                                </DialogTitle>
                                <DialogDescription>
                                    Review the doctor profile before taking verification or account actions.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-800/80">
                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Email</p>
                                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{detailTarget.email}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-800/80">
                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Phone</p>
                                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{detailTarget.phone || '-'}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-800/80">
                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Specialization</p>
                                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{formatSpecialization(detailTarget.specialization)}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-800/80">
                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Experience</p>
                                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{formatExperienceYears(detailTarget.experienceYears)}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-800/80">
                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Qualification</p>
                                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{detailTarget.qualification || '-'}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-800/80">
                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Currently Working At</p>
                                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{detailTarget.currentlyWorkingAt || '-'}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-800/80">
                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">NMC Number</p>
                                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{detailTarget.nmcNumber || '-'}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-800/80">
                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Verification</p>
                                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{detailTarget.isVerified ? 'Verified' : 'Pending'}</p>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() => setDetailTarget(null)}
                                    className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(statusTarget)} onOpenChange={(open) => (!open ? setStatusTarget(null) : null)}>
                <DialogContent className="max-w-md rounded-[1.75rem] border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-900">
                    <div className="p-6">
                        <DialogHeader>
                            <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Account Status</p>
                            <DialogTitle className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                                {statusTarget
                                    ? statusTarget.isActive === false
                                        ? `Activate ${formatUserDisplayName(statusTarget)}?`
                                        : `Block ${formatUserDisplayName(statusTarget)}?`
                                    : 'Update user status?'}
                            </DialogTitle>
                            <DialogDescription>
                                {statusTarget?.isActive === false
                                    ? 'This account will be able to sign in and use the system again.'
                                    : 'This account will no longer be able to sign in until it is activated again.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <button type="button" onClick={handleToggleUserStatus} disabled={statusLoading} className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                                {statusLoading ? 'Updating...' : statusTarget?.isActive === false ? 'Activate user' : 'Block user'}
                            </button>
                            <button type="button" onClick={() => setStatusTarget(null)} disabled={statusLoading} className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white">
                                Cancel
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminUserManagementView;
