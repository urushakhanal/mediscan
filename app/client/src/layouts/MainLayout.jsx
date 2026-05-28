import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/homepage/Navbar';
import Footer from '../components/homepage/Footer';

const MainLayout = ({ children }) => {
    const location = useLocation();
    const path = location.pathname;
    const isDashboardPage =
        path === '/admin' ||
        path.startsWith('/admin/') ||
        path === '/doctor' ||
        path.startsWith('/doctor/') ||
        path === '/patient' ||
        path.startsWith('/patient/');
    const isAuthPage =
        path === '/signin' ||
        path === '/signup' ||
        path === '/init-superadmin';
    const isHomePage = path === '/';

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-50 transition-colors">
            {!isDashboardPage && <Navbar />}
            <main className={`flex-1 ${isDashboardPage || isHomePage ? '' : 'pt-20'}`}>{children}</main>
            {!isAuthPage && !isDashboardPage && <Footer />}
        </div>
    );
};

export default MainLayout;
