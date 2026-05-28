import {
    Activity,
    Brain,
    HeartPulse,
    ShieldPlus,
    Sparkles,
    Stethoscope,
} from 'lucide-react';

export const CARE_PLAN_ICON_OPTIONS = [
    { value: 'heart', label: 'Heart', icon: HeartPulse },
    { value: 'doctor', label: 'Doctor', icon: Stethoscope },
    { value: 'wellness', label: 'Wellness', icon: Sparkles },
    { value: 'brain', label: 'Brain', icon: Brain },
    { value: 'shield', label: 'Shield', icon: ShieldPlus },
    { value: 'activity', label: 'Activity', icon: Activity },
];

export const getCarePlanIcon = (iconKey) =>
    CARE_PLAN_ICON_OPTIONS.find((item) => item.value === iconKey)?.icon || HeartPulse;

export const formatCarePlanPrice = (value) => {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return 'Rs. 0';
    }

    return `Rs. ${new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 0,
    }).format(amount)}`;
};

export const formatCarePlanDuration = (weeks) => {
    const totalWeeks = Number(weeks);

    if (!Number.isFinite(totalWeeks) || totalWeeks < 1) {
        return 'Flexible duration';
    }

    return `${totalWeeks} week${totalWeeks === 1 ? '' : 's'}`;
};

export const getCarePlanBookingStatusClasses = (status) => {
    switch (status) {
    case 'confirmed':
        return 'border border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-200';
    case 'completed':
        return 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200';
    case 'cancelled':
        return 'border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200';
    default:
        return 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200';
    }
};
