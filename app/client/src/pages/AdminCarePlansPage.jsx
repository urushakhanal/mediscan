import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { BadgePlus, Ban, ClipboardList, Pencil, Trash2 } from 'lucide-react';
import DashboardPageIntro from '../components/dashboard/DashboardPageIntro';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import CarePlanFormDialog from '../components/care-plans/CarePlanFormDialog';
import DeleteConfirmationDialog from '../components/admin/DeleteConfirmationDialog';
import {
    createAdminCarePlan,
    deleteAdminCarePlan,
    getAdminCarePlans,
    getUsers,
    updateAdminCarePlan,
    updateAdminCarePlanStatus,
} from '../lib/auth';
import { formatSpecialization } from '../lib/appointments';
import { formatCarePlanDuration, formatCarePlanPrice } from '../lib/carePlans';

const AdminCarePlansPage = () => {
    const [carePlans, setCarePlans] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [statusLoadingId, setStatusLoadingId] = useState('');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const [carePlanData, usersData] = await Promise.all([
                getAdminCarePlans(),
                getUsers(),
            ]);
            setCarePlans(carePlanData.carePlans || []);
            setDoctors((usersData.users || []).filter((user) => user.role === 'doctor' && user.isVerified && user.isActive !== false));
        } catch (requestError) {
            setError(requestError.message || 'Unable to load care plans.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const activePlansCount = useMemo(
        () => carePlans.filter((carePlan) => carePlan.isActive).length,
        [carePlans]
    );

    const assignedDoctorsCount = useMemo(
        () => new Set(carePlans.flatMap((carePlan) => (carePlan.assignedDoctors || []).map((doctor) => doctor._id))).size,
        [carePlans]
    );

    const handleSave = async (payload) => {
        try {
            setSaving(true);
            if (editingPlan?._id) {
                await updateAdminCarePlan(editingPlan._id, payload);
                toast.success('Care plan updated successfully.');
            } else {
                await createAdminCarePlan(payload);
                toast.success('Care plan created successfully.');
            }
            setFormOpen(false);
            setEditingPlan(null);
            await loadData();
        } catch (requestError) {
            setError(requestError.message || 'Unable to save care plan.');
            toast.error(requestError.message || 'Unable to save care plan.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget?._id) {
            return;
        }

        try {
            setDeleteLoading(true);
            await deleteAdminCarePlan(deleteTarget._id);
            toast.success('Care plan deleted successfully.');
            setDeleteTarget(null);
            await loadData();
        } catch (requestError) {
            setError(requestError.message || 'Unable to delete care plan.');
            toast.error(requestError.message || 'Unable to delete care plan.');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleStatusToggle = async (carePlan) => {
        try {
            setStatusLoadingId(carePlan._id);
            await updateAdminCarePlanStatus(carePlan._id, { isActive: !carePlan.isActive });
            toast.success(carePlan.isActive ? 'Care plan deactivated.' : 'Care plan activated.');
            await loadData();
        } catch (requestError) {
            setError(requestError.message || 'Unable to update care plan status.');
            toast.error(requestError.message || 'Unable to update care plan status.');
        } finally {
            setStatusLoadingId('');
        }
    };

    return (
        <div className="space-y-6">
            <DashboardPageIntro
                eyebrow="Care Plans"
                title="Care plan management"
                description="Create clear, doctor-led plans that patients can browse and request without introducing a heavy package system."
                actions={(
                    <button
                        type="button"
                        onClick={() => {
                            setEditingPlan(null);
                            setFormOpen(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                        <BadgePlus size={16} />
                        Add care plan
                    </button>
                )}
            />

            {error && (
                <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                    {error}
                </div>
            )}

            <section className="grid gap-4 xl:grid-cols-4">
                <DashboardStatCard label="Total plans" value={loading ? '--' : carePlans.length} helper="All care plans" icon={ClipboardList} />
                <DashboardStatCard label="Live plans" value={loading ? '--' : activePlansCount} tone="emerald" helper="Publicly visible" icon={BadgePlus} />
                <DashboardStatCard label="Assigned doctors" value={loading ? '--' : assignedDoctorsCount} tone="cyan" helper="Across plans" icon={Pencil} />
                <DashboardStatCard label="Drafted / paused" value={loading ? '--' : carePlans.length - activePlansCount} tone="amber" helper="Inactive plans" icon={Ban} />
            </section>

            <section className="overflow-hidden rounded-[1.9rem] border border-slate-200 bg-white shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Plan</th>
                                <th className="px-6 py-3 font-medium">Specialty</th>
                                <th className="px-6 py-3 font-medium">Duration</th>
                                <th className="px-6 py-3 font-medium">Price</th>
                                <th className="px-6 py-3 font-medium">Doctors</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {!loading && carePlans.length === 0 && (
                                <tr>
                                    <td className="px-6 py-10 text-center text-slate-500 dark:text-slate-400" colSpan={7}>
                                        No care plans created yet.
                                    </td>
                                </tr>
                            )}
                            {carePlans.map((carePlan) => (
                                <tr key={carePlan._id} className="text-slate-700 dark:text-slate-200">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-slate-900 dark:text-white">{carePlan.name}</p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{carePlan.summary}</p>
                                    </td>
                                    <td className="px-6 py-4">{formatSpecialization(carePlan.specialty)}</td>
                                    <td className="px-6 py-4">{formatCarePlanDuration(carePlan.durationWeeks)}</td>
                                    <td className="px-6 py-4">{formatCarePlanPrice(carePlan.price)}</td>
                                    <td className="px-6 py-4">{carePlan.assignedDoctors?.length || 0}</td>
                                    <td className="px-6 py-4">
                                        <span className={[
                                            'inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]',
                                            carePlan.isActive
                                                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200'
                                                : 'border border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
                                        ].join(' ')}>
                                            {carePlan.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingPlan(carePlan);
                                                    setFormOpen(true);
                                                }}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                                                aria-label={`Edit ${carePlan.name}`}
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleStatusToggle(carePlan)}
                                                disabled={statusLoadingId === carePlan._id}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-200 text-amber-700 transition hover:border-amber-500 hover:bg-amber-50 dark:border-amber-900/60 dark:text-amber-300 dark:hover:bg-amber-950/30 disabled:cursor-not-allowed disabled:opacity-60"
                                                aria-label={carePlan.isActive ? `Deactivate ${carePlan.name}` : `Activate ${carePlan.name}`}
                                            >
                                                <Ban size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteTarget(carePlan)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 text-rose-600 transition hover:border-rose-500 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/30"
                                                aria-label={`Delete ${carePlan.name}`}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <CarePlanFormDialog
                open={formOpen}
                onOpenChange={(open) => {
                    setFormOpen(open);
                    if (!open) {
                        setEditingPlan(null);
                    }
                }}
                onSubmit={handleSave}
                loading={saving}
                initialPlan={editingPlan}
                doctors={doctors}
            />

            <DeleteConfirmationDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                onConfirm={handleDelete}
                loading={deleteLoading}
                title={deleteTarget ? `Delete ${deleteTarget.name}?` : 'Delete care plan?'}
                description="This care plan will be permanently removed if it has no bookings. If it already has requests, deactivate it instead."
            />
        </div>
    );
};

export default AdminCarePlansPage;
