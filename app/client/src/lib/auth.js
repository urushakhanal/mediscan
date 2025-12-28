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
