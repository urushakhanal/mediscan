import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/homepage/Navbar';
import Footer from '../components/homepage/Footer';

const MainLayout = ({ children }) => {
    const location = useLocation();
    const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-50 transition-colors">
            <Navbar />
            <main className={isAuthPage ? 'pt-12' : 'pt-16'}>{children}</main>
            {!isAuthPage && <Footer />}
        </div>
    );
};

export default MainLayout;
