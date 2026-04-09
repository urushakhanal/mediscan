import React from 'react';
import AdminUserManagementView from '../components/admin/AdminUserManagementView';

const AdminDoctorsPage = () => (
    <AdminUserManagementView
        userRole="doctor"
        title="Doctor management"
        description="Review doctor registrations, inspect professional details, and verify accounts from one focused workspace."
    />
);

export default AdminDoctorsPage;
