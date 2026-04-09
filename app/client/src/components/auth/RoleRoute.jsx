import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotFoundAccess from './NotFoundAccess';

const RoleRoute = ({ allowedRoles, children }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Checking access...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/signin" replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        return <NotFoundAccess />;
    }

    return children;
};

export default RoleRoute;
