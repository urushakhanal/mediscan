import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { PencilLine, Plus, Settings, Trash2 } from 'lucide-react';
import DashboardPageIntro from '../components/dashboard/DashboardPageIntro';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import useDoctorDashboard from '../hooks/useDoctorDashboard';
import { formatSlot } from '../lib/appointments';

const DoctorSchedulePage = () => {
    const {
        scheduleSettings,
        settingsForm,
        setSettingsForm,
        savingSettings,
        error,
        setError,
        saveScheduleSettings,
    } = useDoctorDashboard();
    const [slotDraft, setSlotDraft] = useState({ start: '', end: '' });
    const [editingSlotIndex, setEditingSlotIndex] = useState(-1);

    const handleSettingsChange = (event) => {
        const { id, value } = event.target;
        setSettingsForm((prev) => ({ ...prev, [id]: value }));
    };

    const handleSlotDraftChange = (event) => {
        const { id, value } = event.target;
        setSlotDraft((prev) => ({ ...prev, [id]: value }));
    };

    const normalizeDraftSlot = () => {
        if (!slotDraft.start || !slotDraft.end) {
            toast.error('Please choose both a start time and an end time.');
            return null;
        }
        if (slotDraft.start >= slotDraft.end) {
            toast.error('End time must be later than the start time.');
            return null;
        }
        return `${slotDraft.start}-${slotDraft.end}`;
    };

    const handleAddOrUpdateSlot = () => {
        const normalizedSlot = normalizeDraftSlot();
        if (!normalizedSlot) return;

        const declaredSlotCount = Number(settingsForm.slotCount);
        const existingIndex = settingsForm.availableTimeSlots.findIndex((slot, index) => (
            slot === normalizedSlot && index !== editingSlotIndex
        ));

        if (existingIndex !== -1) {
            toast.error('That slot has already been added.');
            return;
        }

        if (
            editingSlotIndex < 0 &&
            Number.isInteger(declaredSlotCount) &&
            declaredSlotCount > 0 &&
            settingsForm.availableTimeSlots.length >= declaredSlotCount
        ) {
            toast.error(`Only ${declaredSlotCount} slot${declaredSlotCount === 1 ? '' : 's'} can be added.`);
            return;
        }

        setSettingsForm((prev) => {
            const nextSlots = [...prev.availableTimeSlots];
            if (editingSlotIndex >= 0) {
                nextSlots[editingSlotIndex] = normalizedSlot;
            } else {
                nextSlots.push(normalizedSlot);
            }

            return {
                ...prev,
                availableTimeSlots: nextSlots.sort(),
            };
        });

        setSlotDraft({ start: '', end: '' });
        setEditingSlotIndex(-1);
    };

    const handleEditSlot = (index) => {
        const slot = settingsForm.availableTimeSlots[index];
        const [start, end] = String(slot || '').split('-');
        setSlotDraft({ start: start || '', end: end || '' });
        setEditingSlotIndex(index);
    };

    const handleRemoveSlot = (index) => {
        setSettingsForm((prev) => ({
            ...prev,
            availableTimeSlots: prev.availableTimeSlots.filter((_, slotIndex) => slotIndex !== index),
        }));

        if (editingSlotIndex === index) {
            setEditingSlotIndex(-1);
            setSlotDraft({ start: '', end: '' });
        }
    };

    const handleSaveSettings = async (event) => {
        event.preventDefault();

        const availableTimeSlots = settingsForm.availableTimeSlots;
        const slotCount = Number(settingsForm.slotCount);

        if (!Number.isInteger(slotCount) || slotCount < 1) {
            toast.error('Please enter a valid number of slots.');
            return;
        }
        if (availableTimeSlots.length !== slotCount) {
            toast.error(`Please add exactly ${slotCount} slot${slotCount === 1 ? '' : 's'} before saving.`);
            return;
        }

        try {
            await saveScheduleSettings({
                availableTimeSlots,
            });
            toast.success('Availability settings updated.');
            setError('');
        } catch (requestError) {
            setError(requestError.message || 'Unable to update availability settings.');
            toast.error(requestError.message || 'Unable to update availability settings.');
        }
    };

    return (
        <div className="space-y-6">
            <DashboardPageIntro
                eyebrow="Doctor Workspace"
                title="Schedule and availability"
                description="Configure the time slots patients can book. Your daily capacity now follows the number of slots you save."
            />

            {error && (
                <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                    {error}
                </div>
            )}

            <section className="grid gap-4 xl:grid-cols-2">
                <DashboardStatCard label="Daily capacity" value={scheduleSettings.availableTimeSlots.length} helper="Derived from slots" icon={Settings} />
                <DashboardStatCard label="Configured slots" value={scheduleSettings.availableTimeSlots.length} tone="cyan" helper="Visible times" icon={Plus} />
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
                <section className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300">Overview</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Current availability</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        Patients only see the slots you save here. Each saved slot counts as one available booking for the day.
                    </p>

                    <div className="mt-5 space-y-3">
                        <div className="rounded-[1.3rem] bg-slate-50 px-4 py-4 dark:bg-slate-800/80">
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Daily capacity</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{scheduleSettings.availableTimeSlots.length}</p>
                        </div>
                        <div className="rounded-[1.3rem] bg-slate-50 px-4 py-4 dark:bg-slate-800/80">
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Saved time slots</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {scheduleSettings.availableTimeSlots.length > 0 ? (
                                    scheduleSettings.availableTimeSlots.map((slot) => (
                                        <span key={slot} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 dark:border-slate-700 dark:text-slate-200">
                                            {formatSlot(slot)}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">No saved slots yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <form className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900" onSubmit={handleSaveSettings}>
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-200">
                            <Settings size={18} />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Configuration</p>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Booking setup</h2>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="rounded-[1.25rem] bg-slate-50/80 p-4 dark:bg-slate-950/40 md:col-span-2">
                            <label htmlFor="slotCount" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Number of slots</label>
                            <input id="slotCount" type="number" min="1" value={settingsForm.slotCount} onChange={handleSettingsChange} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                        </div>
                    </div>

                    <div className="mt-6 rounded-[1.35rem] bg-slate-50/80 p-4 dark:bg-slate-950/40">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Time slot builder</p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Added {settingsForm.availableTimeSlots.length} of {settingsForm.slotCount || 0} slots</p>
                            </div>
                            <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 dark:border-slate-700 dark:text-slate-200">
                                {editingSlotIndex >= 0 ? 'Editing slot' : 'Add new slot'}
                            </span>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                            <div>
                                <label htmlFor="start" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Start time</label>
                                <input id="start" type="time" value={slotDraft.start} onChange={handleSlotDraftChange} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                            </div>
                            <div>
                                <label htmlFor="end" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">End time</label>
                                <input id="end" type="time" value={slotDraft.end} onChange={handleSlotDraftChange} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                            </div>
                            <div className="flex items-end">
                                <button type="button" onClick={handleAddOrUpdateSlot} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                                    <Plus size={16} />
                                    {editingSlotIndex >= 0 ? 'Update' : 'Add'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 rounded-[1.35rem] bg-slate-50/80 p-4 dark:bg-slate-950/40">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Draft slots</p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Review, edit, or remove time windows before saving.</p>
                            </div>
                        </div>

                        <div className="mt-4 space-y-2.5">
                            {settingsForm.availableTimeSlots.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">No slots added yet.</div>
                            ) : (
                                settingsForm.availableTimeSlots.map((slot, index) => (
                                    <div key={`${slot}-${index}`} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Slot {index + 1}</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{formatSlot(slot)}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button type="button" onClick={() => handleEditSlot(index)} className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white">
                                                <PencilLine size={14} />
                                                Edit
                                            </button>
                                            <button type="button" onClick={() => handleRemoveSlot(index)} className="inline-flex items-center gap-2 rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-500 hover:text-rose-800 dark:border-rose-800 dark:text-rose-300">
                                                <Trash2 size={14} />
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                        <button type="submit" disabled={savingSettings} className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                            {savingSettings ? 'Saving...' : 'Save schedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DoctorSchedulePage;
