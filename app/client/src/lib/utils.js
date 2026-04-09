import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));

export const formatUserDisplayName = (userOrName, role) => {
    const user = typeof userOrName === 'object' && userOrName !== null ? userOrName : null;
    const rawName = user ? user.name : userOrName;
    const resolvedRole = user ? user.role : role;
    const name = typeof rawName === 'string' ? rawName.trim() : '';

    if (!name) {
        return 'User';
    }

    if (resolvedRole === 'doctor' && !/^dr\.\s/i.test(name)) {
        return `Dr. ${name}`;
    }

    return name;
};

export const formatExperienceYears = (value) => {
    const years = Number(value);

    if (!Number.isFinite(years) || years < 0) {
        return '-';
    }

    return `${years} year${years === 1 ? '' : 's'}`;
};

export const formatQualification = (value) => {
    const qualificationMap = {
        mbbs: 'MBBS',
        bds: 'BDS',
        md: 'MD',
        ms: 'MS',
        dm: 'DM',
        mch: 'MCh',
        dnb: 'DNB',
        fcps: 'FCPS',
        phd: 'PhD',
        mph: 'MPH',
        'bsc-nursing': 'BSc Nursing',
        'msc-nursing': 'MSc Nursing',
    };

    return qualificationMap[value] || value || '-';
};
