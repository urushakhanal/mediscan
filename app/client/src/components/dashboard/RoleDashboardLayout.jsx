import React from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

const RoleDashboardLayout = ({ roleLabel, title, icon: Icon, navigationItems }) => {
    const location = useLocation();
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = pathSegments.map((segment, index) => {
        const to = `/${pathSegments.slice(0, index + 1).join('/')}`;
        const label = segment
            .split('-')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');

        return { to, label };
    });

    return (
        <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#eff7f8_100%)] text-slate-900 dark:bg-[linear-gradient(180deg,#020617_0%,#0f172a_100%)] dark:text-slate-50">
            <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="flex flex-col border-b border-slate-200 bg-white/92 px-5 py-6 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r dark:border-slate-800 dark:bg-slate-950/80">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-400 text-white shadow-lg shadow-cyan-500/20">
                            <Icon size={20} />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">{roleLabel}</p>
                            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h1>
                        </div>
                    </div>

                    <nav className="mt-8 space-y-2">
                        {navigationItems.map((item) => {
                            const ItemIcon = item.icon;
                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) => [
                                        'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                                        isActive
                                            ? 'bg-gradient-to-r from-teal-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white',
                                    ].join(' ')}
                                >
                                    <ItemIcon size={18} />
                                    <span>{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </nav>

                    <div className="mt-auto pt-8 lg:pb-2">
                        <Link
                            to="/"
                            className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-white dark:hover:text-white"
                        >
                            Back to site
                        </Link>
                    </div>
                </aside>

                <main className="px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
                    <nav
                        aria-label="Breadcrumb"
                        className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400"
                    >
                        {breadcrumbs.map((crumb, index) => {
                            const isLast = index === breadcrumbs.length - 1;
                            return (
                                <React.Fragment key={crumb.to}>
                                    {index > 0 && <span>/</span>}
                                    {isLast ? (
                                        <span className="font-medium text-slate-900 dark:text-white">{crumb.label}</span>
                                    ) : (
                                        <Link className="transition hover:text-teal-600 dark:hover:text-cyan-300" to={crumb.to}>
                                            {crumb.label}
                                        </Link>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </nav>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default RoleDashboardLayout;
