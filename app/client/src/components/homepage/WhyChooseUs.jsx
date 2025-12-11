import React from "react";
import { ShieldCheck, UserCheck, Brain, CalendarCheck } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Secure & private by default",
    description: "Your records stay encrypted with strict role-based access.",
    badge: "Security",
  },
  {
    icon: UserCheck,
    title: "Verified medical network",
    description: "Doctors are manually vetted and NMC-verified for trust.",
    badge: "Trust",
  },
  {
    icon: Brain,
    title: "AI that explains itself",
    description: "Symptom checks include confidence and next-step guidance.",
    badge: "Clarity",
  },
  {
    icon: CalendarCheck,
    title: "Frictionless bookings",
    description: "Pick a specialist, slot, and share pre-check data instantly.",
    badge: "Speed",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-teal-50 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Why choose us</p>
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Built for confident, fast care
            </span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            MediScan blends trusted clinicians, transparent AI, and simple scheduling.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-white/30 dark:border-white/10 bg-white/90 dark:bg-slate-900/70 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-all backdrop-blur"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/5 via-transparent to-secondary/15" />
                <div className="relative p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-md shadow-primary/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
