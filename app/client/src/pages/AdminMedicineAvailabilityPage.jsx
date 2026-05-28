import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
    createAdminMedicineAvailabilityLocation,
    getAdminMedicineAvailabilityLocations,
    updateAdminMedicineAvailabilityLocation,
    updateAdminMedicineAvailabilityLocationStatus,
} from '../lib/auth';

const initialForm = {
    name: '',
    address: '',
    phone: '',
};

const AdminMedicineAvailabilityPage = () => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState('');

    const sortedLocations = useMemo(
        () => [...locations].sort((left, right) => Number(right.isActive) - Number(left.isActive) || left.name.localeCompare(right.name)),
        [locations]
    );

    const loadLocations = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getAdminMedicineAvailabilityLocations();
            setLocations(data.locations || []);
        } catch (requestError) {
            setError(requestError.message || 'Unable to load location directory.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLocations();
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            if (editingId) {
                await updateAdminMedicineAvailabilityLocation(editingId, form);
                toast.success('Location updated.');
            } else {
                await createAdminMedicineAvailabilityLocation(form);
                toast.success('Location added.');
            }

            setForm(initialForm);
            setEditingId('');
            await loadLocations();
        } catch (requestError) {
            setError(requestError.message || 'Unable to save location.');
            toast.error(requestError.message || 'Unable to save location.');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (location) => {
        setEditingId(location._id);
        setForm({
            name: location.name || '',
            address: location.address || '',
            phone: location.phone || '',
        });
    };

    const handleToggleStatus = async (location) => {
        try {
            await updateAdminMedicineAvailabilityLocationStatus(location._id, { isActive: !location.isActive });
            toast.success(location.isActive ? 'Location deactivated.' : 'Location activated.');
            await loadLocations();
        } catch (requestError) {
            setError(requestError.message || 'Unable to update status.');
            toast.error(requestError.message || 'Unable to update status.');
        }
    };

    return (
        <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Medicine Availability</p>
                <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Pharmacy and hospital directory</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                    Maintain locations doctors can attach to prescription medicines.
                </p>
            </section>

            {error && (
                <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                    {error}
                </div>
            )}

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{editingId ? 'Edit location' : 'Add location'}</h3>
                <form className="mt-4 grid gap-4 md:grid-cols-3" onSubmit={handleSubmit}>
                    <input
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Location name"
                        className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                    <input
                        value={form.address}
                        onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                        placeholder="Address"
                        className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                    <input
                        value={form.phone}
                        onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                        placeholder="Phone"
                        className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                    <div className="md:col-span-3 flex flex-wrap gap-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                            {saving ? 'Saving...' : editingId ? 'Update location' : 'Add location'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingId('');
                                    setForm(initialForm);
                                }}
                                className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                            >
                                Cancel edit
                            </button>
                        )}
                    </div>
                </form>
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{loading ? 'Loading locations...' : `${sortedLocations.length} locations found`}</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Name</th>
                                <th className="px-6 py-3 font-medium">Address</th>
                                <th className="px-6 py-3 font-medium">Phone</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {!loading && sortedLocations.length === 0 && (
                                <tr>
                                    <td className="px-6 py-8 text-slate-500 dark:text-slate-400" colSpan={5}>No locations added yet.</td>
                                </tr>
                            )}
                            {sortedLocations.map((location) => (
                                <tr key={location._id} className="text-slate-700 dark:text-slate-200">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{location.name}</td>
                                    <td className="px-6 py-4">{location.address}</td>
                                    <td className="px-6 py-4">{location.phone}</td>
                                    <td className="px-6 py-4">
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${location.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                                            {location.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(location)}
                                                className="inline-flex rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleStatus(location)}
                                                className="inline-flex rounded-full border border-cyan-300 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:border-cyan-500 hover:text-cyan-800 dark:border-cyan-800 dark:text-cyan-300"
                                            >
                                                {location.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default AdminMedicineAvailabilityPage;
