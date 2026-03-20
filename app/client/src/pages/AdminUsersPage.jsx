import React, { useEffect, useState } from 'react';
import { BadgeCheck, Pencil, ShieldAlert, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { deleteUserById, getUserById, getUsers, updateUserById, verifyDoctorById } from '../lib/auth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import DeleteConfirmationDialog from '../components/admin/DeleteConfirmationDialog';

const initialForm = {
    name: '',
    email: '',
    role: 'patient',
    phone: '',
    nmcNumber: '',
    specialization: '',
    isVerified: false,
};

const specializationOptions = [
    { value: 'general-medicine', label: 'General Medicine' },
    { value: 'cardiology', label: 'Cardiology' },
    { value: 'dermatology', label: 'Dermatology' },
    { value: 'neurology', label: 'Neurology' },
    { value: 'pediatrics', label: 'Pediatrics' },
];

const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Patients', value: 'patient' },
    { label: 'Doctors', value: 'doctor' },
];

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [formData, setFormData] = useState(initialForm);
    const [panelLoading, setPanelLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [panelError, setPanelError] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [verifyTarget, setVerifyTarget] = useState(null);

    const filteredUsers =
        roleFilter === 'all' ? users : users.filter((user) => user.role === roleFilter);

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

    const closePanel = () => {
        setSelectedUserId('');
        setFormData(initialForm);
        setPanelError('');
    };

    const openUserPanel = async (userId) => {
        try {
            setPanelLoading(true);
            setPanelError('');
            setSelectedUserId(userId);
            const data = await getUserById(userId);
            const user = data.user;

            setFormData({
                name: user.name || '',
                email: user.email || '',
                role: user.role || 'patient',
                phone: user.phone || '',
                nmcNumber: user.nmcNumber || '',
                specialization: user.specialization || '',
                isVerified: Boolean(user.isVerified),
            });
        } catch (requestError) {
            setPanelError(requestError.message || 'Unable to load user details.');
        } finally {
            setPanelLoading(false);
        }
    };

    const handleChange = (event) => {
        const { id, value, type, checked } = event.target;
        setPanelError('');
        setFormData((prev) => {
            const next = { ...prev, [id]: type === 'checkbox' ? checked : value };

            if (id === 'role' && value !== 'doctor') {
                next.nmcNumber = '';
                next.specialization = '';
            }

            return next;
        });
    };

    const handleSave = async (event) => {
        event.preventDefault();
        if (!selectedUserId) return;

        try {
            setSaveLoading(true);
            setPanelError('');
            const payload = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                role: formData.role,
                phone: ['patient', 'doctor'].includes(formData.role) ? formData.phone.trim() : '',
                nmcNumber: formData.role === 'doctor' ? formData.nmcNumber.trim() : '',
                specialization: formData.role === 'doctor' ? formData.specialization : '',
            };

            await updateUserById(selectedUserId, payload);
            await loadUsers();
            closePanel();
            toast.success('User updated successfully.');
        } catch (requestError) {
            const firstError = requestError.data?.errors?.[0];
            setPanelError(firstError || requestError.message || 'Unable to update user.');
        } finally {
            setSaveLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget?._id) return;
        try {
            setDeleteLoading(true);
            setPanelError('');
            await deleteUserById(deleteTarget._id);
            if (selectedUserId === deleteTarget._id) {
                closePanel();
            }
            setDeleteTarget(null);
            await loadUsers();
        } catch (requestError) {
            setPanelError(requestError.message || 'Unable to delete user.');
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

            if (selectedUserId === verifyTarget._id) {
                await openUserPanel(verifyTarget._id);
            }
        } catch (requestError) {
            setPanelError(requestError.message || 'Unable to update verification status.');
        } finally {
            setVerifyLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-6">
                <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Users</p>
                    <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">User management</h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                        Review registered accounts, monitor assigned roles, and manage core user records from one place.
                    </p>
                </section>

                {error && (
                    <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                        {error}
                    </div>
                )}

                <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-4 md:flex-row md:items-center md:justify-between dark:border-slate-800">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {loading ? 'Loading users...' : `${filteredUsers.length} user${filteredUsers.length === 1 ? '' : 's'} found`}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {filterOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setRoleFilter(option.value)}
                                    className={[
                                        'rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition',
                                        roleFilter === option.value
                                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
                                    ].join(' ')}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Name</th>
                                    <th className="px-6 py-3 font-medium">Email</th>
                                    <th className="px-6 py-3 font-medium">Role</th>
                                    <th className="px-6 py-3 font-medium">Verified</th>
                                    <th className="px-6 py-3 font-medium">Specialization</th>
                                    <th className="px-6 py-3 font-medium">Phone</th>
                                    <th className="px-6 py-3 font-medium">NMC</th>
                                    <th className="px-6 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredUsers.map((user) => (
                                    <tr key={user._id} className="text-slate-700 dark:text-slate-200">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{user.name}</td>
                                        <td className="px-6 py-4">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.role === 'doctor' ? (
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
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="px-6 py-4">{user.specialization || '-'}</td>
                                        <td className="px-6 py-4">{user.phone || '-'}</td>
                                        <td className="px-6 py-4">{user.nmcNumber || '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openUserPanel(user._id)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                                                    title="Edit user"
                                                    aria-label={`Edit ${user.name}`}
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                {user.role === 'doctor' && (
                                                    <button
                                                        onClick={() => setVerifyTarget(user)}
                                                        disabled={verifyLoading}
                                                        className={[
                                                            'inline-flex h-9 w-9 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-60',
                                                            user.isVerified
                                                                ? 'border-amber-200 text-amber-700 hover:border-amber-500 hover:bg-amber-50 dark:border-amber-900/60 dark:text-amber-300 dark:hover:bg-amber-950/30'
                                                                : 'border-emerald-200 text-emerald-700 hover:border-emerald-500 hover:bg-emerald-50 dark:border-emerald-900/60 dark:text-emerald-300 dark:hover:bg-emerald-950/30',
                                                        ].join(' ')}
                                                        title={user.isVerified ? 'Change to unverified' : 'Verify doctor'}
                                                        aria-label={user.isVerified ? `Mark ${user.name} as unverified` : `Verify ${user.name}`}
                                                    >
                                                        {user.isVerified ? <ShieldAlert size={15} /> : <BadgeCheck size={15} />}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setDeleteTarget(user)}
                                                    disabled={deleteLoading || verifyLoading}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 text-rose-600 transition hover:border-rose-500 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/30 disabled:cursor-not-allowed disabled:opacity-60"
                                                    title="Delete user"
                                                    aria-label={`Delete ${user.name}`}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && filteredUsers.length === 0 && (
                                    <tr>
                                        <td className="px-6 py-6 text-slate-500 dark:text-slate-400" colSpan="8">
                                            No users found for this filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <Dialog open={Boolean(selectedUserId)} onOpenChange={(open) => (!open ? closePanel() : null)}>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-[2rem] border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-900">
                    <div className="p-6 sm:p-7">
                        <DialogHeader>
                            <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">User details</p>
                            <DialogTitle className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Edit user</DialogTitle>
                            <DialogDescription>Update account details and change the assigned role.</DialogDescription>
                        </DialogHeader>

                        <form className="mt-5 space-y-4" onSubmit={handleSave}>
                            {panelLoading ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400">Loading user details...</p>
                            ) : (
                                <>
                                    {panelError && (
                                        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                                            {panelError}
                                        </div>
                                    )}

                                    <div>
                                        <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Name
                                        </label>
                                        <input
                                            id="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Role
                                        </label>
                                        <select
                                            id="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value="patient">Patient</option>
                                            <option value="doctor">Doctor</option>
                                            <option value="superadmin">Superadmin</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Phone
                                        </label>
                                        <input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            disabled={!['patient', 'doctor'].includes(formData.role)}
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-900"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="nmcNumber" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                            NMC number
                                        </label>
                                        <input
                                            id="nmcNumber"
                                            value={formData.nmcNumber}
                                            onChange={handleChange}
                                            disabled={formData.role !== 'doctor'}
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-900"
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
                                            disabled={formData.role !== 'doctor'}
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-900"
                                        >
                                            <option value="">Select specialization</option>
                                            {specializationOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-wrap gap-3 pt-2">
                                        <button
                                            type="submit"
                                            disabled={saveLoading || deleteLoading || verifyLoading}
                                            className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                        >
                                            {saveLoading ? 'Saving...' : 'Save changes'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={closePanel}
                                            disabled={saveLoading || deleteLoading || verifyLoading}
                                            className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

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
                            <p className="text-xs uppercase tracking-[0.28em] text-emerald-600 dark:text-emerald-300">
                                Doctor Verification
                            </p>
                            <DialogTitle className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                                {verifyTarget
                                    ? verifyTarget.isVerified
                                        ? `Mark ${verifyTarget.name} as unverified?`
                                        : `Verify ${verifyTarget.name}?`
                                    : 'Update verification?'}
                            </DialogTitle>
                            <DialogDescription>
                                {verifyTarget?.isVerified
                                    ? 'This will remove doctor verification for this account.'
                                    : 'This will mark the doctor as verified and approved by the superadmin.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={handleVerifyDoctor}
                                disabled={verifyLoading}
                                className="inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {verifyLoading
                                    ? 'Updating...'
                                    : verifyTarget?.isVerified
                                        ? 'Mark unverified'
                                        : 'Verify doctor'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setVerifyTarget(null)}
                                disabled={verifyLoading}
                                className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminUsersPage;
