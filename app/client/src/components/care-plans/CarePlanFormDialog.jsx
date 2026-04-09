import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { CARE_PLAN_ICON_OPTIONS } from '../../lib/carePlans';
import { formatSpecialization } from '../../lib/appointments';

const SPECIALTY_OPTIONS = [
    'general-medicine',
    'cardiology',
    'dermatology',
    'neurology',
    'pediatrics',
    'orthopedics',
    'gynecology',
    'psychiatry',
    'endocrinology',
    'gastroenterology',
    'pulmonology',
];

const emptyForm = {
    name: '',
    summary: '',
    description: '',
    specialty: 'general-medicine',
    durationWeeks: '4',
    price: '',
    whoItsFor: '',
    iconKey: 'heart',
    includesText: '',
    doctorIds: [],
};

const CarePlanFormDialog = ({
    open,
    onOpenChange,
    onSubmit,
    loading,
    initialPlan,
    doctors,
}) => {
    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        if (!open) {
            return;
        }

        if (initialPlan) {
            setForm({
                name: initialPlan.name || '',
                summary: initialPlan.summary || '',
                description: initialPlan.description || '',
                specialty: initialPlan.specialty || 'general-medicine',
                durationWeeks: String(initialPlan.durationWeeks || 4),
                price: String(initialPlan.price || ''),
                whoItsFor: initialPlan.whoItsFor || '',
                iconKey: initialPlan.iconKey || 'heart',
                includesText: (initialPlan.includes || []).join('\n'),
                doctorIds: (initialPlan.assignedDoctors || []).map((doctor) => doctor._id),
            });
            return;
        }

        setForm(emptyForm);
    }, [initialPlan, open]);

    const specialtyDoctors = useMemo(
        () => doctors.filter((doctor) => doctor.specialization === form.specialty),
        [doctors, form.specialty]
    );

    useEffect(() => {
        setForm((prev) => ({
            ...prev,
            doctorIds: prev.doctorIds.filter((doctorId) => specialtyDoctors.some((doctor) => doctor._id === doctorId)),
        }));
    }, [specialtyDoctors]);

    const handleDoctorToggle = (doctorId) => {
        setForm((prev) => ({
            ...prev,
            doctorIds: prev.doctorIds.includes(doctorId)
                ? prev.doctorIds.filter((id) => id !== doctorId)
                : [...prev.doctorIds, doctorId],
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        onSubmit({
            name: form.name,
            summary: form.summary,
            description: form.description,
            specialty: form.specialty,
            durationWeeks: Number(form.durationWeeks),
            price: Number(form.price),
            whoItsFor: form.whoItsFor,
            iconKey: form.iconKey,
            includes: form.includesText
                .split('\n')
                .map((item) => item.trim())
                .filter(Boolean),
            doctorIds: form.doctorIds,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto rounded-[1.75rem] border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-900">
                <div className="p-6">
                    <DialogHeader>
                        <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Care Plans</p>
                        <DialogTitle className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                            {initialPlan ? 'Edit care plan' : 'Create care plan'}
                        </DialogTitle>
                        <DialogDescription>
                            Keep it simple: a clear outcome, a few inclusions, and the doctors who will deliver it.
                        </DialogDescription>
                    </DialogHeader>

                    <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label htmlFor="care-plan-name" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Plan name</label>
                                <input
                                    id="care-plan-name"
                                    value={form.name}
                                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label htmlFor="care-plan-price" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Price (Rs.)</label>
                                <input
                                    id="care-plan-price"
                                    type="number"
                                    min="0"
                                    value={form.price}
                                    onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="care-plan-summary" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Short summary</label>
                            <input
                                id="care-plan-summary"
                                value={form.summary}
                                onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                        </div>

                        <div>
                            <label htmlFor="care-plan-description" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
                            <textarea
                                id="care-plan-description"
                                rows="4"
                                value={form.description}
                                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <label htmlFor="care-plan-specialty" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Specialty</label>
                                <select
                                    id="care-plan-specialty"
                                    value={form.specialty}
                                    onChange={(event) => setForm((prev) => ({ ...prev, specialty: event.target.value }))}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                >
                                    {SPECIALTY_OPTIONS.map((specialty) => (
                                        <option key={specialty} value={specialty}>{formatSpecialization(specialty)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="care-plan-duration" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Duration (weeks)</label>
                                <input
                                    id="care-plan-duration"
                                    type="number"
                                    min="1"
                                    max="52"
                                    value={form.durationWeeks}
                                    onChange={(event) => setForm((prev) => ({ ...prev, durationWeeks: event.target.value }))}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label htmlFor="care-plan-icon" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Icon</label>
                                <select
                                    id="care-plan-icon"
                                    value={form.iconKey}
                                    onChange={(event) => setForm((prev) => ({ ...prev, iconKey: event.target.value }))}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                >
                                    {CARE_PLAN_ICON_OPTIONS.map((item) => (
                                        <option key={item.value} value={item.value}>{item.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="care-plan-who" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Who it is for</label>
                            <input
                                id="care-plan-who"
                                value={form.whoItsFor}
                                onChange={(event) => setForm((prev) => ({ ...prev, whoItsFor: event.target.value }))}
                                placeholder="Patients needing structured follow-up for ongoing symptoms"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                        </div>

                        <div>
                            <label htmlFor="care-plan-includes" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">What is included</label>
                            <textarea
                                id="care-plan-includes"
                                rows="4"
                                value={form.includesText}
                                onChange={(event) => setForm((prev) => ({ ...prev, includesText: event.target.value }))}
                                placeholder={'Initial consultation\nFollow-up review\nReport interpretation'}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Assign doctors</label>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {specialtyDoctors.length} doctors in this specialty
                                </span>
                            </div>
                            <div className="grid max-h-56 gap-3 overflow-y-auto rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-950/40">
                                {specialtyDoctors.length === 0 && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">No verified active doctors are available for this specialty yet.</p>
                                )}
                                {specialtyDoctors.map((doctor) => (
                                    <label key={doctor._id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900">
                                        <input
                                            type="checkbox"
                                            checked={form.doctorIds.includes(doctor._id)}
                                            onChange={() => handleDoctorToggle(doctor._id)}
                                            className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                                        />
                                        <span>
                                            <span className="block font-semibold text-slate-900 dark:text-white">{doctor.name}</span>
                                            <span className="block text-xs text-slate-500 dark:text-slate-400">{formatSpecialization(doctor.specialization)}</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                            >
                                {loading ? 'Saving...' : initialPlan ? 'Save changes' : 'Create plan'}
                            </button>
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                                className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CarePlanFormDialog;
