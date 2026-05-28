import React from 'react';
import AdminUserManagementView from '../components/admin/AdminUserManagementView';

const AdminPatientsPage = () => (
    <AdminUserManagementView
        userRole="patient"
        title="Patient management"
        description="Browse patient accounts separately so the admin can review patient records without doctor verification noise."
    />
);

export default AdminPatientsPage;
