import React from 'react';
import { CalendarClock, ClipboardCheck, HeartHandshake, LayoutDashboard, ShieldPlus, Stethoscope } from 'lucide-react';
import RoleDashboardLayout from '../dashboard/RoleDashboardLayout';

const navigationItems = [
    { label: 'Overview', to: '/doctor/overview', icon: LayoutDashboard },
    { label: 'Appointments', to: '/doctor/appointments', icon: CalendarClock },
    { label: 'Care Plans', to: '/doctor/care-plans', icon: HeartHandshake },
    { label: 'Plan Requests', to: '/doctor/care-plan-requests', icon: ClipboardCheck },
    { label: 'Schedule', to: '/doctor/schedule', icon: ShieldPlus },
];

const DoctorLayout = () => (
    <RoleDashboardLayout
        roleLabel="Doctor"
        title="MediScan Practice"
        icon={Stethoscope}
        navigationItems={navigationItems}
    />
);

export default DoctorLayout;
