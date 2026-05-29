const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const buildHeaders = (token) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
};

const request = async (path, { method = 'GET', body, token } = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: buildHeaders(token),
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const message = data?.message || `Request failed with status ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
};

export const register = (payload) => request('/api/auth/register', { method: 'POST', body: payload });

export const registerSuperadmin = (payload) =>
    request('/api/auth/register-superadmin', { method: 'POST', body: payload });

export const login = (payload) => request('/api/auth/login', { method: 'POST', body: payload });

export const logout = () => request('/api/auth/logout', { method: 'POST' });

export const me = (token) => request('/api/auth/me', { token });

export const changePassword = (payload) =>
    request('/api/auth/change-password', { method: 'POST', body: payload });

export const startGoogleSignIn = (role = 'patient') => {
    const normalizedRole = role === 'doctor' ? 'doctor' : 'patient';
    return `${API_BASE_URL}/api/auth/google?role=${encodeURIComponent(normalizedRole)}`;
};

export const completeGoogleDoctorProfile = (payload) =>
    request('/api/auth/google/doctor-profile', { method: 'PATCH', body: payload });

export const getVerifiedDoctors = () => request('/api/users/doctors');
export const getVerifiedDoctorById = (id) => request(`/api/users/doctors/${id}`);
export const getDoctorAvailability = (doctorId, date) =>
    request(`/api/appointments/doctor/${doctorId}/availability?date=${encodeURIComponent(date)}`);
export const createAppointment = (payload) => request('/api/appointments', { method: 'POST', body: payload });
export const initiateKhaltiAppointmentPayment = (payload) =>
    request('/api/appointments/payments/khalti/initiate', { method: 'POST', body: payload });
export const verifyKhaltiAppointmentPayment = (sessionId, payload) =>
    request(`/api/appointments/payments/khalti/${sessionId}/verify`, { method: 'POST', body: payload });
export const getPatientAppointments = () => request('/api/appointments/patient/me');
export const markPatientAppointmentSummaryViewed = (id) =>
    request(`/api/appointments/patient/me/${id}/summary-viewed`, { method: 'PATCH' });
export const getDoctorAppointments = () => request('/api/appointments/doctor/me');
export const getDoctorPatients = () => request('/api/appointments/doctor/me/patients');
export const getDoctorAppointmentById = (id) => request(`/api/appointments/doctor/me/${id}`);
export const getDoctorPatientRecord = (patientId) =>
    request(`/api/appointments/doctor/me/patients/${patientId}/record`);
export const createDoctorFollowUpAppointment = (patientId, payload) =>
    request(`/api/appointments/doctor/me/patients/${patientId}/follow-up`, { method: 'POST', body: payload });
export const updateAppointmentStatus = (id, payload) =>
    request(`/api/appointments/${id}/status`, { method: 'PATCH', body: payload });
export const rescheduleAppointment = (id, payload) =>
    request(`/api/appointments/${id}/reschedule`, { method: 'PATCH', body: payload });
export const cancelAppointment = (id, payload) =>
    request(`/api/appointments/${id}/cancel`, { method: 'PATCH', body: payload });
export const updateDoctorAppointmentConsultation = (id, payload) =>
    request(`/api/appointments/doctor/me/${id}/consultation`, { method: 'PATCH', body: payload });
export const uploadDoctorAppointmentDocument = (id, payload) =>
    request(`/api/appointments/doctor/me/${id}/documents`, { method: 'POST', body: payload });
export const uploadPatientAppointmentDocument = (id, payload) =>
    request(`/api/appointments/patient/me/${id}/documents`, { method: 'POST', body: payload });
export const getDoctorAvailabilitySettings = () => request('/api/appointments/doctor-settings/me');
export const updateDoctorAvailabilitySettings = (payload) =>
    request('/api/appointments/doctor-settings/me', { method: 'PUT', body: payload });
export const getDoctorActiveMedicineAvailabilityLocations = () =>
    request('/api/medicine-availability/doctor/active');
export const getCarePlans = () => request('/api/care-plans');
export const getCarePlanById = (id) => request(`/api/care-plans/${id}`);
export const createCarePlanBooking = (id, payload) =>
    request(`/api/care-plans/${id}/book`, { method: 'POST', body: payload });
export const initiateKhaltiCarePlanBookingPayment = (id, payload) =>
    request(`/api/care-plans/${id}/payments/khalti/initiate`, { method: 'POST', body: payload });
export const verifyKhaltiCarePlanBookingPayment = (sessionId, payload) =>
    request(`/api/care-plans/payments/khalti/${sessionId}/verify`, { method: 'POST', body: payload });
export const getPatientCarePlanBookings = () => request('/api/care-plans/bookings/patient/me');
export const getDoctorCarePlanBookings = () => request('/api/care-plans/bookings/doctor/me');
export const getAdminCarePlanBookings = () => request('/api/care-plans/bookings/admin/all');
export const updateDoctorCarePlanBookingStatus = (id, payload) =>
    request(`/api/care-plans/bookings/doctor/${id}/status`, { method: 'PATCH', body: payload });
export const getDoctorCarePlans = () => request('/api/care-plans/doctor/me');
export const getAdminCarePlans = () => request('/api/care-plans/admin/all');
export const createAdminCarePlan = (payload) => request('/api/care-plans/admin', { method: 'POST', body: payload });
export const updateAdminCarePlan = (id, payload) => request(`/api/care-plans/admin/${id}`, { method: 'PUT', body: payload });
export const updateAdminCarePlanStatus = (id, payload) =>
    request(`/api/care-plans/admin/${id}/status`, { method: 'PATCH', body: payload });
export const deleteAdminCarePlan = (id) => request(`/api/care-plans/admin/${id}`, { method: 'DELETE' });

export const getUsers = () => request('/api/users');
export const getUserById = (id) => request(`/api/users/${id}`);
export const updateUserById = (id, payload) => request(`/api/users/${id}`, { method: 'PUT', body: payload });
export const verifyDoctorById = (id, payload) =>
    request(`/api/users/${id}/verify-doctor`, { method: 'PATCH', body: payload });
export const blockUserById = (id) => request(`/api/users/${id}/block`, { method: 'PATCH' });
export const activateUserById = (id) => request(`/api/users/${id}/activate`, { method: 'PATCH' });
export const deleteUserById = (id) => request(`/api/users/${id}`, { method: 'DELETE' });
export const getAdminMedicineAvailabilityLocations = () =>
    request('/api/medicine-availability/admin');
export const createAdminMedicineAvailabilityLocation = (payload) =>
    request('/api/medicine-availability/admin', { method: 'POST', body: payload });
export const updateAdminMedicineAvailabilityLocation = (id, payload) =>
    request(`/api/medicine-availability/admin/${id}`, { method: 'PUT', body: payload });
export const updateAdminMedicineAvailabilityLocationStatus = (id, payload) =>
    request(`/api/medicine-availability/admin/${id}/status`, { method: 'PATCH', body: payload });
