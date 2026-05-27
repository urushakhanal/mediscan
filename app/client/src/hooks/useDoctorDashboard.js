import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    getDoctorAppointments,
    getDoctorAvailabilitySettings,
    updateAppointmentStatus,
    updateDoctorAvailabilitySettings,
} from '../lib/auth';

const getInitialSettings = () => ({
    maxAppointmentsPerDay: 1,
    availableTimeSlots: [],
    blockedDates: [],
    weeklyBreaks: [],
    emergencySlots: [],
});

const getInitialSettingsForm = () => ({
    slotCount: '0',
    availableTimeSlots: [],
    blockedDates: [],
    weeklyBreaks: [],
    emergencySlots: [],
});

export const useDoctorDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [scheduleSettings, setScheduleSettings] = useState(getInitialSettings());
    const [settingsForm, setSettingsForm] = useState(getInitialSettingsForm());
    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [updatingAppointmentId, setUpdatingAppointmentId] = useState('');
    const [error, setError] = useState('');

    const loadDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const [appointmentsData, settingsData] = await Promise.all([
                getDoctorAppointments(),
                getDoctorAvailabilitySettings(),
            ]);

            const nextSettings = {
                maxAppointmentsPerDay: settingsData.settings?.maxAppointmentsPerDay || 1,
                availableTimeSlots: settingsData.settings?.availableTimeSlots || [],
                blockedDates: settingsData.settings?.blockedDates || [],
                weeklyBreaks: settingsData.settings?.weeklyBreaks || [],
                emergencySlots: settingsData.settings?.emergencySlots || [],
            };

            setAppointments(appointmentsData.appointments || []);
            setScheduleSettings(nextSettings);
            setSettingsForm({
                slotCount: String(nextSettings.availableTimeSlots.length),
                availableTimeSlots: nextSettings.availableTimeSlots,
                blockedDates: nextSettings.blockedDates,
                weeklyBreaks: nextSettings.weeklyBreaks,
                emergencySlots: nextSettings.emergencySlots,
            });
        } catch (requestError) {
            setError(requestError.message || 'Unable to load doctor dashboard.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const pendingAppointments = useMemo(
        () => appointments.filter((appointment) => appointment.status === 'pending'),
        [appointments]
    );

    const confirmedAppointments = useMemo(
        () => appointments.filter((appointment) => appointment.status === 'confirmed'),
        [appointments]
    );

    const completedAppointments = useMemo(
        () => appointments.filter((appointment) => appointment.status === 'completed'),
        [appointments]
    );

    const activeAppointments = useMemo(
        () => appointments.filter((appointment) => !['completed', 'rejected', 'cancelled'].includes(appointment.status)),
        [appointments]
    );

    const saveScheduleSettings = async (payload) => {
        setSavingSettings(true);
        try {
            await updateDoctorAvailabilitySettings(payload);
            await loadDashboard();
        } finally {
            setSavingSettings(false);
        }
    };

    const changeAppointmentStatus = async (appointmentId, status) => {
        setUpdatingAppointmentId(appointmentId);
        try {
            await updateAppointmentStatus(appointmentId, { status });
            await loadDashboard();
        } finally {
            setUpdatingAppointmentId('');
        }
    };

    return {
        appointments,
        scheduleSettings,
        settingsForm,
        setSettingsForm,
        loading,
        savingSettings,
        updatingAppointmentId,
        error,
        setError,
        loadDashboard,
        pendingAppointments,
        confirmedAppointments,
        completedAppointments,
        activeAppointments,
        saveScheduleSettings,
        changeAppointmentStatus,
    };
};

export default useDoctorDashboard;
