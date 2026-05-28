import React from 'react';

const DashboardPageIntro = ({ eyebrow, title, description, actions = null }) => (
    <header className="rounded-[1.9rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
                {eyebrow && (
                    <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">{eyebrow}</p>
                )}
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
                {description && (
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
                )}
            </div>
            {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
        </div>
    </header>
);

export default DashboardPageIntro;
