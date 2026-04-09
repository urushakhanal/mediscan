import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarClock, CheckCircle2, Clock3, FileText, PencilLine, Plus, Settings, Trash2, UserRound } from 'lucide-react';
import {
    getDoctorAppointments,
    getDoctorAvailabilitySettings,
    updateAppointmentStatus,
    updateDoctorAvailabilitySettings,
} from '../lib/auth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
    formatReadableDate,
    formatSlot,
    getStatusClasses,
} from '../lib/appointments';

const DoctorDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [scheduleSettings, setScheduleSettings] = useState({
        maxAppointmentsPerDay: 1,
        availableTimeSlots: [],
    });
    const [settingsForm, setSettingsForm] = useState({
        maxAppointmentsPerDay: '8',
        slotCount: '0',
        availableTimeSlots: [],
    });
    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [updatingAppointmentId, setUpdatingAppointmentId] = useState('');
    const [error, setError] = useState('');
    const [selectedNotesAppointment, setSelectedNotesAppointment] = useState(null);
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [scheduleEditMode, setScheduleEditMode] = useState(false);
    const [slotDraft, setSlotDraft] = useState({ start: '', end: '' });
    const [editingSlotIndex, setEditingSlotIndex] = useState(-1);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError('');

            const [appointmentsData, settingsData] = await Promise.all([
                getDoctorAppointments(),
                getDoctorAvailabilitySettings(),
            ]);

            setAppointments(appointmentsData.appointments || []);
            setScheduleSettings({
                maxAppointmentsPerDay: settingsData.settings?.maxAppointmentsPerDay || 1,
                availableTimeSlots: settingsData.settings?.availableTimeSlots || [],
            });
            setSettingsForm({
                maxAppointmentsPerDay: String(settingsData.settings?.maxAppointmentsPerDay || 1),
                slotCount: String((settingsData.settings?.availableTimeSlots || []).length),
                availableTimeSlots: settingsData.settings?.availableTimeSlots || [],
            });
        } catch (requestError) {
            setError(requestError.message || 'Unable to load doctor dashboard.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const pendingAppointments = appointments.filter((appointment) => appointment.status === 'pending');
    const confirmedAppointments = appointments.filter((appointment) => appointment.status === 'confirmed');

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
        if (!normalizedSlot) {
            return;
        }

        const existingIndex = settingsForm.availableTimeSlots.findIndex((slot, index) => (
            slot === normalizedSlot && index !== editingSlotIndex
        ));

        if (existingIndex !== -1) {
            toast.error('That slot has already been added.');
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
                slotCount: prev.slotCount || String(nextSlots.length),
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
        setSettingsForm((prev) => {
            const nextSlots = prev.availableTimeSlots.filter((_, slotIndex) => slotIndex !== index);
            return {
                ...prev,
                slotCount: String(Math.max(Number(prev.slotCount) || 0, nextSlots.length)),
                availableTimeSlots: nextSlots,
            };
        });

        if (editingSlotIndex === index) {
            setEditingSlotIndex(-1);
            setSlotDraft({ start: '', end: '' });
        }
    };

    const handleSaveSettings = async (event) => {
        event.preventDefault();

        const availableTimeSlots = settingsForm.availableTimeSlots;
        const slotCount = Number(settingsForm.slotCount);

        if (!settingsForm.maxAppointmentsPerDay || availableTimeSlots.length === 0) {
            toast.error('Please set a daily limit and add at least one time slot.');
            return;
        }

        if (!Number.isInteger(slotCount) || slotCount < 1) {
            toast.error('Please enter a valid number of slots.');
            return;
        }

        if (availableTimeSlots.length !== slotCount) {
            toast.error(`Please add exactly ${slotCount} slot${slotCount === 1 ? '' : 's'} before saving.`);
            return;
        }

        if (Number(settingsForm.maxAppointmentsPerDay) > availableTimeSlots.length) {
            toast.error('Daily booking limit cannot be greater than the number of configured slots.');
            return;
        }

        try {
            setSavingSettings(true);
            await updateDoctorAvailabilitySettings({
                maxAppointmentsPerDay: Number(settingsForm.maxAppointmentsPerDay),
                availableTimeSlots,
            });
            toast.success('Availability settings updated.');
            setScheduleEditMode(false);
            await loadDashboard();
        } catch (requestError) {
            toast.error(requestError.message || 'Unable to update availability settings.');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleAppointmentAction = async (appointmentId, status) => {
        try {
            setUpdatingAppointmentId(appointmentId);
            await updateAppointmentStatus(appointmentId, { status });
            toast.success(status === 'confirmed' ? 'Appointment confirmed.' : 'Appointment rejected.');
            await loadDashboard();
        } catch (requestError) {
            toast.error(requestError.message || 'Unable to update appointment.');
        } finally {
            setUpdatingAppointmentId('');
        }
    };

    const hasNotes = (appointment) =>
        Boolean(appointment.previousMedicalCondition?.trim() || appointment.symptoms?.trim());

    const openScheduleModal = () => {
        setScheduleEditMode(false);
        setScheduleModalOpen(true);
    };

    const startEditingSchedule = () => {
        setSettingsForm({
            maxAppointmentsPerDay: String(scheduleSettings.maxAppointmentsPerDay || 1),
            slotCount: String((scheduleSettings.availableTimeSlots || []).length),
            availableTimeSlots: scheduleSettings.availableTimeSlots || [],
        });
        setSlotDraft({ start: '', end: '' });
        setEditingSlotIndex(-1);
        setScheduleEditMode(true);
    };

    return (
        <section className="px-4 py-10 sm:py-12">
            <div className="mx-auto max-w-6xl space-y-6">
                <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs uppercase tracking-[0.28em] text-emerald-700 dark:text-emerald-300">Doctor dashboard</p>
                    <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Appointments and availability</h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                        Manage incoming requests, confirm bookings, and control your daily schedule.
                    </p>
                </header>

                {error && (
                    <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                        {error}
                    </div>
                )}

                <section className="grid gap-4 md:grid-cols-3">
                    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total bookings</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{loading ? '--' : appointments.length}</p>
                    </article>
                    <article className="rounded-[1.5rem] border border-amber-200 bg-white p-5 shadow-sm dark:border-amber-900/50 dark:bg-slate-900">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Pending requests</p>
                        <p className="mt-2 text-3xl font-bold text-amber-700 dark:text-amber-300">{loading ? '--' : pendingAppointments.length}</p>
                    </article>
                    <article className="rounded-[1.5rem] border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-900/50 dark:bg-slate-900">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Confirmed visits</p>
                        <p className="mt-2 text-3xl font-bold text-emerald-700 dark:text-emerald-300">{loading ? '--' : confirmedAppointments.length}</p>
                    </article>
                </section>

                <section className="space-y-6">
                    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-200">
                                    <Settings size={18} />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Availability</p>
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Schedule configuration</h2>
                                    <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                                        Set your daily booking capacity and the appointment windows patients can request.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={openScheduleModal}
                                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                            >
                                <Settings size={16} />
                                Configure schedule
                            </button>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Appointments per day</p>
                                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                                    {loading ? '--' : scheduleSettings.maxAppointmentsPerDay}
                                </p>
                            </div>

                            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Current time slots</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {!loading && scheduleSettings.availableTimeSlots.length > 0 ? (
                                        scheduleSettings.availableTimeSlots.map((slot) => (
                                            <span
                                                key={slot}
                                                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 dark:border-slate-700 dark:text-slate-200"
                                            >
                                                {formatSlot(slot)}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {loading ? 'Loading schedule...' : 'No time slots configured yet.'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </article>

                    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                                <CalendarClock size={18} />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Requests</p>
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Appointment queue</h2>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            {loading &&
                                Array.from({ length: 3 }).map((_, index) => (
                                    <div
                                        key={`doctor-appointment-skeleton-${index}`}
                                        className="rounded-[1.5rem] border border-slate-200 p-5 dark:border-slate-800"
                                    >
                                        <div className="h-5 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                                        <div className="mt-3 h-4 w-56 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                                        <div className="mt-2 h-4 w-44 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                                    </div>
                                ))}

                            {!loading && appointments.length === 0 && (
                                <div className="rounded-[1.5rem] border border-slate-200 px-5 py-10 text-center dark:border-slate-800">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No appointments yet</h3>
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                        New booking requests will appear here.
                                    </p>
                                </div>
                            )}

                            {!loading &&
                                appointments.map((appointment) => (
                                    <div
                                        key={appointment._id}
                                        className="rounded-[1.5rem] border border-slate-200 p-5 dark:border-slate-800"
                                    >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                        {appointment.patient?.name}
                                                    </h3>
                                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusClasses(appointment.status)}`}>
                                                        {appointment.status}
                                                    </span>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
                                                    <span className="inline-flex items-center gap-2">
                                                        <UserRound size={16} />
                                                        {appointment.patient?.email}
                                                    </span>
                                                    <span className="inline-flex items-center gap-2">
                                                        <CalendarClock size={16} />
                                                        {formatReadableDate(appointment.date)}
                                                    </span>
                                                    <span className="inline-flex items-center gap-2">
                                                        <Clock3 size={16} />
                                                        {formatSlot(appointment.slot)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-3">
                                                {hasNotes(appointment) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedNotesAppointment(appointment)}
                                                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                                                    >
                                                        <FileText size={16} />
                                                        View notes
                                                    </button>
                                                )}

                                                {appointment.status === 'pending' && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            disabled={updatingAppointmentId === appointment._id}
                                                            onClick={() => handleAppointmentAction(appointment._id, 'confirmed')}
                                                            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                            Approve
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={updatingAppointmentId === appointment._id}
                                                            onClick={() => handleAppointmentAction(appointment._id, 'rejected')}
                                                            className="inline-flex rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-500 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800 dark:text-rose-300"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </article>
                </section>
            </div>

            <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
                <DialogContent className="max-h-[82vh] max-w-3xl overflow-hidden rounded-[1.75rem] border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex max-h-[82vh] flex-col">
                        <DialogHeader>
                            <div className="border-b border-slate-200 px-6 pb-5 pt-6 dark:border-slate-800">
                                <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Schedule settings</p>
                                <DialogTitle className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                                    {scheduleEditMode ? 'Edit schedule' : 'Configured schedule'}
                                </DialogTitle>
                                <DialogDescription>
                                    {scheduleEditMode
                                        ? 'Adjust your booking capacity and appointment windows.'
                                        : 'Review the schedule patients currently see when booking.'}
                                </DialogDescription>
                            </div>
                        </DialogHeader>

                        {scheduleEditMode ? (
                            <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSaveSettings}>
                                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                                    <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                        <label htmlFor="maxAppointmentsPerDay" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Daily booking limit
                                        </label>
                                        <input
                                            id="maxAppointmentsPerDay"
                                            type="number"
                                            min="1"
                                            value={settingsForm.maxAppointmentsPerDay}
                                            onChange={handleSettingsChange}
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                            Number of appointments you want to accept per day.
                                        </p>
                                    </div>

                                    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                        <label htmlFor="slotCount" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Number of time slots
                                        </label>
                                        <input
                                            id="slotCount"
                                            type="number"
                                            min="1"
                                            value={settingsForm.slotCount}
                                            onChange={handleSettingsChange}
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                            Add slots one by one until this count is complete.
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Time slot builder</p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                Added {settingsForm.availableTimeSlots.length} of {settingsForm.slotCount || 0} slots
                                            </p>
                                        </div>
                                        <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 dark:border-slate-700 dark:text-slate-200">
                                            {editingSlotIndex >= 0 ? 'Editing slot' : 'Add new slot'}
                                        </span>
                                    </div>

                                    <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                                        <div>
                                            <label htmlFor="start" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                                Start time
                                            </label>
                                            <input
                                                id="start"
                                                type="time"
                                                value={slotDraft.start}
                                                onChange={handleSlotDraftChange}
                                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="end" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                                End time
                                            </label>
                                            <input
                                                id="end"
                                                type="time"
                                                value={slotDraft.end}
                                                onChange={handleSlotDraftChange}
                                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                type="button"
                                                onClick={handleAddOrUpdateSlot}
                                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                            >
                                                <Plus size={16} />
                                                {editingSlotIndex >= 0 ? 'Update' : 'Add'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-4 rounded-[1rem] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                                        <div className="max-h-64 overflow-y-auto p-3">
                                            <div className="space-y-2.5">
                                        {settingsForm.availableTimeSlots.length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                                No slots added yet.
                                            </div>
                                        ) : (
                                            settingsForm.availableTimeSlots.map((slot, index) => (
                                                <div
                                                    key={`${slot}-${index}`}
                                                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                    <div>
                                                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                                                            Slot {index + 1}
                                                        </p>
                                                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                                                            {formatSlot(slot)}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditSlot(index)}
                                                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                                                        >
                                                            <PencilLine size={14} />
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveSlot(index)}
                                                            className="inline-flex items-center gap-2 rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-500 hover:text-rose-800 dark:border-rose-800 dark:text-rose-300"
                                                        >
                                                            <Trash2 size={14} />
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                            </div>
                                        </div>
                                    </div>
                                    </div>
                                </div>
                                </div>

                                <div className="border-t border-slate-200 px-6 py-4 dark:border-slate-800">
                                    <div className="flex flex-wrap gap-3">
                                    <button
                                        type="submit"
                                        disabled={savingSettings}
                                        className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                    >
                                        {savingSettings ? 'Saving...' : 'Save schedule'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setScheduleEditMode(false)}
                                        disabled={savingSettings}
                                        className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div className="overflow-y-auto px-6 py-5">
                                <div className="space-y-4">
                                    <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Maximum appointments per day</p>
                                        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                                            {scheduleSettings.maxAppointmentsPerDay}
                                        </p>
                                    </div>

                                    <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Available time slots</p>
                                        <div className="mt-3 flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1">
                                            {scheduleSettings.availableTimeSlots.map((slot) => (
                                                <span
                                                    key={slot}
                                                    className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 dark:border-slate-700 dark:text-slate-200"
                                                >
                                                    {formatSlot(slot)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={startEditingSchedule}
                                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                        >
                                            <PencilLine size={16} />
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(selectedNotesAppointment)} onOpenChange={() => setSelectedNotesAppointment(null)}>
                <DialogContent className="rounded-[1.75rem] border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-900">
                    <div className="p-6">
                        <DialogHeader>
                            <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Patient notes</p>
                            <DialogTitle className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                                {selectedNotesAppointment?.patient?.name}
                            </DialogTitle>
                            <DialogDescription>
                                Optional notes shared at booking time.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-6 space-y-4">
                            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Previous medical condition</p>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                                    {selectedNotesAppointment?.previousMedicalCondition || 'Not provided'}
                                </p>
                            </div>

                            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Symptoms</p>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                                    {selectedNotesAppointment?.symptoms || 'Not provided'}
                                </p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    );
};

export default DoctorDashboard;
