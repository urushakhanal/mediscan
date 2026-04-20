const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const request = async (path, { method = 'GET' } = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
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

export const getMyNotifications = (limit = 20) =>
    request(`/api/notifications/me?limit=${encodeURIComponent(limit)}`);

export const getUnreadNotificationCount = () => request('/api/notifications/me/unread-count');

export const markNotificationAsRead = (id) => request(`/api/notifications/me/${id}/read`, { method: 'PATCH' });

export const markAllNotificationsAsRead = () => request('/api/notifications/me/read-all', { method: 'PATCH' });
