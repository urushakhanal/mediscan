const DOCTOR_SPECIALIZATIONS = [
    'general-medicine',
    'cardiology',
    'dermatology',
    'neurology',
    'pediatrics',
    'orthopedics',
    'gynecology',
    'obstetrics',
    'psychiatry',
    'oncology',
    'radiology',
    'anesthesiology',
    'ophthalmology',
    'ent',
    'urology',
    'nephrology',
    'endocrinology',
    'gastroenterology',
    'pulmonology',
    'hematology',
    'rheumatology',
    'infectious-disease',
    'plastic-surgery',
    'neurosurgery',
    'general-surgery',
    'vascular-surgery',
    'emergency-medicine',
    'family-medicine',
    'internal-medicine',
    'pathology',
    'rehabilitation-medicine',
];

const DOCTOR_QUALIFICATIONS = [
    'mbbs',
    'bds',
    'md',
    'ms',
    'dm',
    'mch',
    'dnb',
    'fcps',
    'phd',
    'mph',
    'bsc-nursing',
    'msc-nursing',
];

const DEFAULT_DOCTOR_TIME_SLOTS = [
    '10:00-10:30',
    '10:30-11:00',
    '11:00-11:30',
    '11:30-12:00',
    '14:00-14:30',
    '14:30-15:00',
    '15:00-15:30',
    '15:30-16:00',
];

const DEFAULT_MAX_APPOINTMENTS_PER_DAY = 8;

module.exports = {
    DOCTOR_SPECIALIZATIONS,
    DOCTOR_QUALIFICATIONS,
    DEFAULT_DOCTOR_TIME_SLOTS,
    DEFAULT_MAX_APPOINTMENTS_PER_DAY,
};
