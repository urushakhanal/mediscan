const User = require('../../../database/models/user.model');
const Appointment = require('../../../database/models/appointment.model');
const config = require('../../../config/env');

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const GOOGLE_CALENDAR_EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

const sanitizeUser = (user) => {
    const obj = user.toObject ? user.toObject() : user;
    delete obj.password;
    delete obj.__v;
    return obj;
};

const normalizeText = (value) => String(value || '').trim();

const buildAuthUrl = (state) => {
    if (!config.google.enabled) {
        const error = new Error('Google OAuth is not configured.');
        error.statusCode = 503;
        throw error;
    }

    const params = new URLSearchParams({
        client_id: config.google.clientId,
        redirect_uri: config.google.calendarCallbackUrl,
        response_type: 'code',
        scope: GOOGLE_CALENDAR_SCOPE,
        state,
        prompt: 'consent',
        access_type: 'offline',
        include_granted_scopes: 'true',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

const exchangeCodeForTokens = async (code) => {
    const body = new URLSearchParams({
        code,
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: config.google.calendarCallbackUrl,
        grant_type: 'authorization_code',
    });

    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(data.error_description || data.error || 'Unable to exchange Google authorization code.');
        error.statusCode = 400;
        throw error;
    }

    return data;
};

const refreshAccessToken = async (refreshToken) => {
    const body = new URLSearchParams({
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
    });

    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(data.error_description || data.error || 'Unable to refresh Google access token.');
        error.statusCode = 400;
        throw error;
    }

    return data;
};

const fetchGoogleProfile = async (accessToken) => {
    const response = await fetch(GOOGLE_USERINFO_URL, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(data.error_description || data.error || 'Unable to load Google profile.');
        error.statusCode = 400;
        throw error;
    }

    return data;
};

const parseDateTime = (dateValue, slotValue) => {
    const [hoursText, minutesText] = String(slotValue || '').split(':');
    const [yearText, monthText, dayText] = String(dateValue || '').split('-');

    if (!hoursText || !minutesText || !yearText || !monthText || !dayText) {
        return '';
    }

    return `${yearText}-${monthText}-${dayText}T${hoursText}:${minutesText}:00`;
};

const buildAppointmentEventPayload = (appointment) => {
    const doctorName = appointment?.doctor?.name || 'Doctor';
    const patientName = appointment?.patient?.name || 'Patient';
    const patientEmail = appointment?.patient?.email || '';
    const descriptionLines = [
        `Patient: ${patientName}`,
        patientEmail ? `Patient email: ${patientEmail}` : '',
        appointment?.symptoms ? `Symptoms: ${appointment.symptoms}` : '',
        appointment?.previousMedicalCondition ? `Previous medical condition: ${appointment.previousMedicalCondition}` : '',
        appointment?.status ? `Status: ${appointment.status}` : '',
    ].filter(Boolean);
    const [startText, endText] = String(appointment?.slot || '').split('-');

    return {
        summary: `Appointment with ${patientName}`,
        location: doctorName,
        description: descriptionLines.join('\n'),
        start: {
            dateTime: parseDateTime(appointment.date, startText),
            timeZone: config.appTimeZone,
        },
        end: {
            dateTime: parseDateTime(appointment.date, endText),
            timeZone: config.appTimeZone,
        },
    };
};

const googleApiRequest = async (url, { method = 'GET', accessToken, body } = {}) => {
    const response = await fetch(url, {
        method,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(data.error?.message || data.error_description || data.error || 'Google Calendar request failed.');
        error.statusCode = response.status;
        error.googleError = data.error || null;
        throw error;
    }

    return data;
};

const getDoctorWithCalendarSecrets = async (doctorId) =>
    User.findById(doctorId).select('+googleCalendarRefreshToken +googleCalendarAccessToken');

const storeCalendarTokens = async (doctor, tokenData, profile) => {
    if (tokenData.refresh_token) {
        doctor.googleCalendarRefreshToken = tokenData.refresh_token;
    }

    if (tokenData.access_token) {
        doctor.googleCalendarAccessToken = tokenData.access_token;
        doctor.googleCalendarTokenExpiresAt = tokenData.expires_in
            ? new Date(Date.now() + (Number(tokenData.expires_in) * 1000))
            : new Date(Date.now() + 50 * 60 * 1000);
    }

    doctor.googleCalendarConnected = true;
    doctor.googleCalendarEmail = profile?.email || doctor.googleCalendarEmail || '';
    doctor.googleCalendarConnectedAt = doctor.googleCalendarConnectedAt || new Date();
    doctor.googleCalendarLastSyncedAt = new Date();
    await doctor.save();
    return doctor;
};

const connectDoctorGoogleCalendar = async ({ doctorId, code }) => {
    if (!config.google.enabled) {
        const error = new Error('Google OAuth is not configured.');
        error.statusCode = 503;
        throw error;
    }

    const doctor = await getDoctorWithCalendarSecrets(doctorId);
    if (!doctor) {
        const error = new Error('Doctor not found.');
        error.statusCode = 404;
        throw error;
    }

    const tokenData = await exchangeCodeForTokens(code);
    if (!tokenData.access_token) {
        const error = new Error('Google did not return an access token.');
        error.statusCode = 400;
        throw error;
    }

    const profile = await fetchGoogleProfile(tokenData.access_token);
    if (!profile.email) {
        const error = new Error('Google account did not return an email address.');
        error.statusCode = 400;
        throw error;
    }

    if (profile.email_verified === false || profile.email_verified === 'false') {
        const error = new Error('Google account email must be verified.');
        error.statusCode = 400;
        throw error;
    }

    if (!tokenData.refresh_token && !doctor.googleCalendarRefreshToken) {
        const error = new Error('Google Calendar access requires consent to issue a refresh token. Please reconnect and allow access.');
        error.statusCode = 400;
        throw error;
    }

    await storeCalendarTokens(doctor, tokenData, profile);
    return sanitizeUser(doctor);
};

const disconnectDoctorGoogleCalendar = async (doctorId) => {
    const doctor = await getDoctorWithCalendarSecrets(doctorId);
    if (!doctor) {
        const error = new Error('Doctor not found.');
        error.statusCode = 404;
        throw error;
    }

    const refreshToken = normalizeText(doctor.googleCalendarRefreshToken);
    if (refreshToken) {
        try {
            const revokeUrl = `${GOOGLE_REVOKE_URL}?token=${encodeURIComponent(refreshToken)}`;
            await fetch(revokeUrl, { method: 'POST' });
        } catch (error) {
            console.error('Failed to revoke Google Calendar token:', error.message);
        }
    }

    doctor.googleCalendarConnected = false;
    doctor.googleCalendarEmail = '';
    doctor.googleCalendarRefreshToken = '';
    doctor.googleCalendarAccessToken = '';
    doctor.googleCalendarTokenExpiresAt = null;
    doctor.googleCalendarLastSyncedAt = null;
    await doctor.save();

    return sanitizeUser(doctor);
};

const getValidAccessToken = async (doctor) => {
    const hasFreshAccessToken =
        normalizeText(doctor.googleCalendarAccessToken) &&
        doctor.googleCalendarTokenExpiresAt &&
        doctor.googleCalendarTokenExpiresAt.getTime() > Date.now() + 60 * 1000;

    if (hasFreshAccessToken) {
        return doctor.googleCalendarAccessToken;
    }

    const refreshToken = normalizeText(doctor.googleCalendarRefreshToken);
    if (!refreshToken) {
        const error = new Error('Google Calendar is not connected.');
        error.statusCode = 400;
        throw error;
    }

    const tokenData = await refreshAccessToken(refreshToken);
    if (!tokenData.access_token) {
        const error = new Error('Google Calendar did not return an access token.');
        error.statusCode = 400;
        throw error;
    }

    doctor.googleCalendarAccessToken = tokenData.access_token;
    doctor.googleCalendarTokenExpiresAt = tokenData.expires_in
        ? new Date(Date.now() + (Number(tokenData.expires_in) * 1000))
        : new Date(Date.now() + 50 * 60 * 1000);
    doctor.googleCalendarLastSyncedAt = new Date();
    if (tokenData.refresh_token) {
        doctor.googleCalendarRefreshToken = tokenData.refresh_token;
    }
    await doctor.save();

    return doctor.googleCalendarAccessToken;
};

const createGoogleCalendarEvent = async (accessToken, appointment) => {
    const payload = buildAppointmentEventPayload(appointment);
    return googleApiRequest(GOOGLE_CALENDAR_EVENTS_URL, {
        method: 'POST',
        accessToken,
        body: payload,
    });
};

const updateGoogleCalendarEvent = async (accessToken, eventId, appointment) => {
    const payload = buildAppointmentEventPayload(appointment);
    return googleApiRequest(`${GOOGLE_CALENDAR_EVENTS_URL}/${encodeURIComponent(eventId)}`, {
        method: 'PATCH',
        accessToken,
        body: payload,
    });
};

const deleteGoogleCalendarEvent = async (accessToken, eventId) => {
    await googleApiRequest(`${GOOGLE_CALENDAR_EVENTS_URL}/${encodeURIComponent(eventId)}`, {
        method: 'DELETE',
        accessToken,
    });
};

const syncAppointmentCalendar = async (appointment) => {
    try {
        const appointmentId = appointment?._id?.toString ? appointment._id.toString() : String(appointment?._id || '');
        if (!appointmentId) {
            return { synced: false };
        }

        const populatedAppointment = await Appointment.findById(appointmentId)
            .populate('doctor', 'name email googleCalendarConnected googleCalendarEmail googleCalendarConnectedAt googleCalendarLastSyncedAt googleCalendarTokenExpiresAt')
            .populate('patient', 'name email role');

        if (!populatedAppointment?.doctor || !populatedAppointment.doctor.googleCalendarConnected) {
            return { synced: false };
        }

        const doctor = await getDoctorWithCalendarSecrets(populatedAppointment.doctor._id);
        if (!doctor?.googleCalendarConnected) {
            return { synced: false };
        }

        if (['pending', 'rejected'].includes(populatedAppointment.status)) {
            return { synced: false };
        }

        if (populatedAppointment.status === 'cancelled') {
            if (populatedAppointment.googleCalendarEventId) {
                try {
                    const accessToken = await getValidAccessToken(doctor);
                    await deleteGoogleCalendarEvent(accessToken, populatedAppointment.googleCalendarEventId);
                } catch (error) {
                    if (error.statusCode !== 404) {
                        console.error('Failed to delete Google Calendar event:', error.message);
                    }
                }
            }

            populatedAppointment.googleCalendarEventId = '';
            populatedAppointment.googleCalendarEventHtmlLink = '';
            populatedAppointment.googleCalendarSyncedAt = new Date();
            populatedAppointment.googleCalendarSyncStatus = 'cancelled';
            populatedAppointment.googleCalendarSyncError = '';
            await populatedAppointment.save();
            return { synced: true, action: 'deleted' };
        }

        const accessToken = await getValidAccessToken(doctor);
        const eventId = normalizeText(populatedAppointment.googleCalendarEventId);

        let googleEvent = null;
        try {
            if (eventId) {
                googleEvent = await updateGoogleCalendarEvent(accessToken, eventId, populatedAppointment);
            } else {
                googleEvent = await createGoogleCalendarEvent(accessToken, populatedAppointment);
            }
        } catch (error) {
            if (error.statusCode === 404 && eventId) {
                googleEvent = await createGoogleCalendarEvent(accessToken, populatedAppointment);
            } else {
                throw error;
            }
        }

        populatedAppointment.googleCalendarEventId = googleEvent.id || populatedAppointment.googleCalendarEventId || '';
        populatedAppointment.googleCalendarEventHtmlLink = googleEvent.htmlLink || '';
        populatedAppointment.googleCalendarSyncedAt = new Date();
        populatedAppointment.googleCalendarSyncStatus = 'synced';
        populatedAppointment.googleCalendarSyncError = '';
        await populatedAppointment.save();
        return { synced: true, action: eventId ? 'updated' : 'created' };
    } catch (error) {
        const appointmentId = appointment?._id?.toString ? appointment._id.toString() : String(appointment?._id || '');
        if (appointmentId) {
            try {
                await Appointment.findByIdAndUpdate(
                    appointmentId,
                    {
                        googleCalendarSyncStatus: 'error',
                        googleCalendarSyncError: error.message.slice(0, 1000),
                    },
                    { new: true }
                );
            } catch (updateError) {
                console.error('Failed to store Google Calendar sync error:', updateError.message);
            }
        }

        console.error('Google Calendar sync failed:', error.message);
        return { synced: false, error: error.message };
    }
};

const syncDoctorUpcomingAppointments = async (doctorId) => {
    const appointments = await Appointment.find({
        doctor: doctorId,
        status: 'confirmed',
    }).sort({ date: 1, slot: 1, createdAt: 1 });

    for (const appointment of appointments) {
        await syncAppointmentCalendar(appointment);
    }

    const doctor = await getDoctorWithCalendarSecrets(doctorId);
    if (doctor) {
        doctor.googleCalendarLastSyncedAt = new Date();
        await doctor.save();
    }

    return { syncedCount: appointments.length };
};

module.exports = {
    buildAuthUrl,
    connectDoctorGoogleCalendar,
    disconnectDoctorGoogleCalendar,
    syncAppointmentCalendar,
    syncDoctorUpcomingAppointments,
};
