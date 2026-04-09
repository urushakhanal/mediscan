import React, { useMemo, useState } from 'react';
import {
    ArrowLeft,
    ArrowRight,
    BadgeAlert,
    Bed,
    Bone,
    Brain,
    CircleOff,
    Droplets,
    Ear,
    Eye,
    HeartPulse,
    Headset,
    MoonStar,
    ScanFace,
    PersonStanding,
    Pill,
    ShieldPlus,
    ShieldAlert,
    Siren,
    Sparkles,
    Thermometer,
    ScanHeart,
    Shell,
    Waves,
    Wind,
    Footprints,
} from 'lucide-react';

export const symptomOptions = [
    { label: 'Headache', icon: ShieldPlus },
    { label: 'Fever', icon: Thermometer },
    { label: 'Cough', icon: Wind },
    { label: 'Fatigue', icon: Bed },
    { label: 'Weakness', icon: PersonStanding },
    { label: 'Dizziness', icon: Sparkles },
    { label: 'Chest Pain', icon: ScanHeart },
    { label: 'Shortness of Breath', icon: HeartPulse },
    { label: 'Stomach Pain', icon: Shell },
    { label: 'Nausea', icon: CircleOff },
    { label: 'Back Pain', icon: Waves },
    { label: 'Joint Pain', icon: Bone },
    { label: 'Hip Pain', icon: PersonStanding },
    { label: 'Body Aches', icon: Pill },
    { label: 'Sore Throat', icon: BadgeAlert },
    { label: 'Runny Nose', icon: Droplets },
    { label: 'Ear Pain', icon: Ear },
    { label: 'Difficulty In Hearing', icon: Headset },
    { label: 'Poor Eyesight', icon: Eye },
    { label: 'Skin Rash', icon: ScanFace },
    { label: 'Palpitations', icon: Siren },
    { label: 'Anxiety', icon: Brain },
    { label: 'Insomnia', icon: MoonStar },
    { label: 'Swelling', icon: ShieldAlert },
    { label: 'Leg Pain', icon: Footprints },
];

const SymptomLibrary = ({
    title = 'Identify and treat your symptoms instantly',
    description = 'Choose the symptoms you are experiencing right now.',
    selectedSymptoms = [],
    onToggleSymptom,
    compact = false,
}) => {
    const pageSize = compact ? 10 : symptomOptions.length;
    const [pageIndex, setPageIndex] = useState(0);
    const totalPages = Math.max(1, Math.ceil(symptomOptions.length / pageSize));

    const visibleSymptoms = useMemo(() => {
        if (!compact) return symptomOptions;
        const start = pageIndex * pageSize;
        return symptomOptions.slice(start, start + pageSize);
    }, [compact, pageIndex, pageSize]);

    const paginate = (direction) => {
        if (!compact) return;
        setPageIndex((current) => (current + direction + totalPages) % totalPages);
    };

    return (
        <section className={compact ? '' : 'rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8'}>
            {!compact && (
                <div className="max-w-3xl">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
                        {title}
                    </h2>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 md:text-base">
                        {description}
                    </p>
                </div>
            )}

            <div className={compact ? 'relative flex items-center gap-2 px-8' : 'mt-10 flex items-center gap-4 lg:gap-8'}>
                <button
                    type="button"
                    onClick={() => paginate(-1)}
                    className={[
                        'items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.45)] transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white',
                        compact
                            ? 'absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 md:inline-flex'
                            : 'hidden h-12 w-12 md:inline-flex',
                    ].join(' ')}
                    aria-label="Scroll symptoms left"
                >
                    <ArrowLeft size={compact ? 16 : 18} />
                </button>

                <div
                    className={[
                        'grid flex-1 pb-2',
                        compact
                            ? 'grid-cols-5 gap-x-4 gap-y-4'
                            : 'grid-cols-5 gap-x-8 gap-y-8 md:grid-cols-5',
                    ].join(' ')}
                >
                    {visibleSymptoms.map((symptom) => {
                        const Icon = symptom.icon;
                        const selected = selectedSymptoms.includes(symptom.label);

                        return (
                            <button
                                key={symptom.label}
                                type="button"
                                onClick={() => onToggleSymptom?.(symptom.label)}
                                    className="group text-center"
                                >
                                <div
                                    className={[
                                        'mx-auto flex items-center justify-center border p-4 transition duration-300',
                                        compact ? 'h-20 w-20 rounded-[1.1rem] p-3' : 'h-28 w-28 rounded-[1.6rem]',
                                        selected
                                            ? 'border-cyan-300 bg-cyan-100 shadow-[0_18px_45px_-25px_rgba(6,182,212,0.45)] dark:border-cyan-700/70 dark:bg-cyan-950/30'
                                            : 'border-cyan-100 bg-cyan-50/55 group-hover:-translate-y-1 group-hover:border-cyan-200 group-hover:shadow-[0_18px_45px_-25px_rgba(6,182,212,0.35)] dark:border-cyan-950/40 dark:bg-cyan-950/10',
                                    ].join(' ')}
                                >
                                    <div
                                        className={[
                                            'flex h-full w-full items-center justify-center rounded-[1.2rem] transition',
                                            selected
                                                ? 'bg-white text-cyan-700 dark:bg-slate-900 dark:text-cyan-300'
                                                : 'bg-slate-100 text-cyan-600 group-hover:bg-white dark:bg-slate-900 dark:text-cyan-300 dark:group-hover:bg-slate-800',
                                        ].join(' ')}
                                    >
                                        <Icon size={compact ? 24 : 34} strokeWidth={1.8} />
                                    </div>
                                </div>
                                <p className={compact ? 'mt-3 text-xs font-semibold text-slate-700 dark:text-slate-200' : 'mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200'}>
                                    {symptom.label}
                                </p>
                            </button>
                        );
                    })}
                </div>

                <button
                    type="button"
                    onClick={() => paginate(1)}
                    className={[
                        'items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.45)] transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white',
                        compact
                            ? 'absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 md:inline-flex'
                            : 'hidden h-12 w-12 md:inline-flex',
                    ].join(' ')}
                    aria-label="Scroll symptoms right"
                >
                    <ArrowRight size={compact ? 16 : 18} />
                </button>
            </div>
        </section>
    );
};

export default SymptomLibrary;
