import React from 'react';

const DashboardStatCard = ({ label, value, tone = 'slate', icon: Icon, helper }) => {
    const toneClasses = {
        slate: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
        amber: 'border-amber-200 dark:border-amber-900/50 bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300',
        emerald: 'border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300',
        cyan: 'border-cyan-200 dark:border-cyan-900/50 bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-300',
    };

    return (
        <article className={`rounded-[1.6rem] border p-5 shadow-sm ${toneClasses[tone]}`}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="mt-2 text-3xl font-bold">{value}</p>
                    {helper && <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{helper}</p>}
                </div>
                {Icon && (
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <Icon size={18} />
                    </div>
                )}
            </div>
        </article>
    );
};

export default DashboardStatCard;
