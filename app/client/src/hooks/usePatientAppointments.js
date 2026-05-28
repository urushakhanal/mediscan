import { useCallback, useEffect, useMemo, useState } from 'react';
import { getPatientAppointments } from '../lib/auth';

export const usePatientAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadAppointments = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getPatientAppointments();
            setAppointments(data.appointments || []);
        } catch (requestError) {
            setError(requestError.message || 'Unable to load appointments.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAppointments();
    }, [loadAppointments]);

    const pendingCount = useMemo(
        () => appointments.filter((appointment) => appointment.status === 'pending').length,
        [appointments]
    );

    const confirmedCount = useMemo(
        () => appointments.filter((appointment) => appointment.status === 'confirmed').length,
        [appointments]
    );

    const newSummariesCount = useMemo(
        () => appointments.filter((appointment) => appointment.status === 'completed' && !appointment.patientSummaryViewedAt).length,
        [appointments]
    );

    return {
        appointments,
        loading,
        error,
        pendingCount,
        confirmedCount,
        newSummariesCount,
        loadAppointments,
    };
};

export default usePatientAppointments;
