import React from 'react';
import SymptomChecker from '../components/symptomchecker';

const SymptomCheckerPage = () => {
    return (
        <section className="bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.12),_transparent_38%),linear-gradient(180deg,#f6fffe_0%,#f8fcff_100%)] px-4 py-12 dark:bg-[linear-gradient(180deg,#0f172a_0%,#020617_100%)] sm:py-16">
            <div className="mx-auto w-full max-w-7xl">
                <div className="grid items-start gap-10 lg:grid-cols-[0.9fr,1.1fr] lg:gap-10">
                    <div className="space-y-7 pt-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                            Smart Symptom Checker
                        </div>
                        <h1 className="max-w-xl text-4xl font-bold tracking-tight text-slate-950 dark:text-slate-100 sm:text-5xl">
                            Get clarity in minutes
                        </h1>
                        <p className="max-w-xl text-lg leading-9 text-slate-600 dark:text-slate-400">
                            Answer a few guided questions and receive a structured summary, care tips, and next-step advice.
                        </p>

                        <div className="rounded-[1.9rem] border border-slate-200 bg-white px-6 py-7 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">How it works</p>
                                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                                    3 steps
                                </span>
                            </div>
                            <div className="mt-5 space-y-4">
                                {[
                                    { title: "Select symptoms", detail: "Pick what you feel today." },
                                    { title: "Add details", detail: "Duration, severity, relief." },
                                    { title: "Review summary", detail: "Actionable guidance." },
                                ].map((step, index) => (
                                    <div
                                        key={step.title}
                                        className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 px-5 py-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="text-base font-medium text-slate-900 dark:text-slate-100">{step.title}</p>
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{step.detail}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {["Fast", "Private", "Evidence-based"].map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <SymptomChecker embedded />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SymptomCheckerPage;
