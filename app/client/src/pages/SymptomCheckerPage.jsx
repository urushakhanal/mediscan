import React from 'react';
import SymptomChecker from '../components/symptomchecker';

const SymptomCheckerPage = () => {
    return (
        <section className="bg-gradient-to-br from-teal-50 to-white px-4 py-10 dark:from-gray-900 dark:to-gray-950 sm:py-12">
            <div className="mx-auto w-full max-w-6xl">
                <div className="grid gap-8 lg:grid-cols-[0.95fr,1.2fr]">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                            Smart Symptom Checker
                        </div>
                        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 sm:text-4xl">
                            Get clarity in minutes
                        </h1>
                        <p className="text-base text-slate-600 dark:text-slate-400">
                            Answer a few guided questions and receive a structured summary, care tips, and next-step advice.
                        </p>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">How it works</p>
                                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                    3 steps
                                </span>
                            </div>
                            <div className="mt-4 space-y-3">
                                {[
                                    { title: "Select symptoms", detail: "Pick what you feel today." },
                                    { title: "Add details", detail: "Duration, severity, relief." },
                                    { title: "Review summary", detail: "Actionable guidance." },
                                ].map((step, index) => (
                                    <div
                                        key={step.title}
                                        className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="text-slate-900 dark:text-slate-100 font-medium">{step.title}</p>
                                            <p className="mt-1 text-xs">{step.detail}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {["Fast", "Private", "Evidence-based"].map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
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
