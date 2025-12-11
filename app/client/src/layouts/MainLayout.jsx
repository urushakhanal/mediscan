import React from 'react';
import Navbar from '../components/homepage/Navbar';
import Footer from '../components/homepage/Footer';

const MainLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-50 transition-colors">
            <Navbar />
            <main className="pt-16">{children}</main>
            <Footer />
        </div>
    );
};

export default MainLayout;
