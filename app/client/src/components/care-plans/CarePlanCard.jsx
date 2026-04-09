import React from 'react';
import { ArrowRight, CheckCircle2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatSpecialization } from '../../lib/appointments';
import { formatUserDisplayName } from '../../lib/utils';
import { formatCarePlanDuration, formatCarePlanPrice, getCarePlanIcon } from '../../lib/carePlans';

const CarePlanCard = ({ carePlan }) => {
    const Icon = getCarePlanIcon(carePlan.iconKey);

    return (
        <article className="group rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] transition hover:-translate-y-1 hover:shadow-[0_26px_60px_-36px_rgba(14,116,144,0.32)] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[1.3rem] bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-200">
                    <Icon size={22} />
                </div>
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-200">
                    {formatSpecialization(carePlan.specialty)}
                </span>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{carePlan.name}</h3>
            <p className="mt-2.5 text-sm leading-6 text-slate-600 dark:text-slate-300">{carePlan.summary}</p>

            <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 dark:border-slate-700 dark:text-slate-200">
                    {formatCarePlanDuration(carePlan.durationWeeks)}
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                    {formatCarePlanPrice(carePlan.price)}
                </span>
            </div>

            <div className="mt-4 space-y-1.5">
                {carePlan.includes?.slice(0, 3).map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-300" />
                        <span>{item}</span>
                    </div>
                ))}
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        <Users size={14} />
                        {carePlan.assignedDoctors?.length || 0} doctors
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">
                        {carePlan.assignedDoctors?.[0] ? formatUserDisplayName(carePlan.assignedDoctors[0]) : 'Assigned soon'}
                    </p>
                </div>

                <Link
                    to={`/care-plans/${carePlan._id}`}
                    className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                >
                    Details
                    <ArrowRight size={15} />
                </Link>
            </div>
        </article>
    );
};

export default CarePlanCard;
