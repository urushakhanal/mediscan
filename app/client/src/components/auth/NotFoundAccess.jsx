import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundAccess = () => {
    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-16">
            <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">404</p>
                <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Page not found</h1>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    The page you tried to access is not available for this account.
                </p>
                <Link
                    to="/"
                    className="mt-6 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                    Go home
                </Link>
            </div>
        </div>
    );
};

export default NotFoundAccess;
