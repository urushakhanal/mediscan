export const formatSpecialization = (value) =>
    value
        ? value
            .split('-')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ')
        : 'General Practice';

export const getTodayDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const formatReadableDate = (value) => {
    if (!value) {
        return 'Not scheduled';
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, (month || 1) - 1, day || 1);
    return Number.isNaN(date.getTime())
        ? value
        : new Intl.DateTimeFormat(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(date);
};

const formatTime12Hour = (timeValue) => {
    const [hoursText, minutesText] = String(timeValue || '').split(':');
    const hours = Number(hoursText);
    const minutes = Number(minutesText);

    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
        return timeValue;
    }

    const suffix = hours >= 12 ? 'PM' : 'AM';
    const normalizedHours = hours % 12 || 12;
    return `${normalizedHours}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

export const formatSlot = (value) => {
    const [start, end] = String(value || '').split('-');

    if (!start || !end) {
        return String(value || '');
    }

    return `${formatTime12Hour(start)} - ${formatTime12Hour(end)}`;
};

export const getStatusClasses = (status) => {
    switch (status) {
    case 'confirmed':
        return 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200';
    case 'completed':
        return 'border border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-200';
    case 'rejected':
        return 'border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200';
    default:
        return 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200';
    }
};

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export const resolveUploadUrl = (value) => {
    const url = String(value || '').trim();

    if (!url) {
        return '';
    }

    if (/^https?:\/\//i.test(url)) {
        return url;
    }

    if (url.startsWith('/')) {
        return `${API_BASE_URL}${url}`;
    }

    return `${API_BASE_URL}/${url.replace(/^\/+/, '')}`;
};
