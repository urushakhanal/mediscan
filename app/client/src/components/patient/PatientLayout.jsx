import React from 'react';
import { CalendarDays, HeartHandshake, LayoutDashboard, Search, UserRound } from 'lucide-react';
import RoleDashboardLayout from '../dashboard/RoleDashboardLayout';

const navigationItems = [
    { label: 'Overview', to: '/patient/overview', icon: LayoutDashboard },
    { label: 'Appointments', to: '/patient/appointments', icon: CalendarDays },
    { label: 'Care Plans', to: '/patient/care-plans', icon: HeartHandshake },
    { label: 'Doctors', to: '/patient/doctors', icon: Search },
];

const PatientLayout = () => (
    <RoleDashboardLayout
        roleLabel="Patient"
        title="MediScan Care"
        icon={UserRound}
        navigationItems={navigationItems}
    />
);

export default PatientLayout;
