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
});

const getInitialSettingsForm = () => ({
    maxAppointmentsPerDay: '1',
    slotCount: '0',
    availableTimeSlots: [],
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
            };

            setAppointments(appointmentsData.appointments || []);
            setScheduleSettings(nextSettings);
            setSettingsForm({
                maxAppointmentsPerDay: String(nextSettings.maxAppointmentsPerDay),
                slotCount: String(nextSettings.availableTimeSlots.length),
                availableTimeSlots: nextSettings.availableTimeSlots,
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
        saveScheduleSettings,
        changeAppointmentStatus,
    };
};

export default useDoctorDashboard;
