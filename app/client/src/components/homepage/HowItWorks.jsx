import React from "react";
import { motion } from "framer-motion";
import { Brain, Stethoscope, Search } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Describe your symptoms",
    description: "Type your symptoms or upload a skin image. We tailor the prompts to keep it quick.",
    icon: Brain,
    accent: "from-primary to-cyan-400",
    chip: "1-2 mins",
  },
  {
    step: "02",
    title: "AI insight + urgency",
    description: "MediScan ranks likely conditions and surfaces urgency so you know what to do next.",
    icon: Stethoscope,
    accent: "from-cyan-400 to-secondary",
    chip: "Real-time",
  },
  {
    step: "03",
    title: "Book the right doctor",
    description: "Match with verified doctors, pick a slot, and share your pre-check results instantly.",
    icon: Search,
    accent: "from-secondary to-primary",
    chip: "In a few taps",
  },
];

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="py-20 px-6 md:px-12 bg-gradient-to-b from-white to-teal-50 dark:from-slate-950 dark:to-slate-900"
    >
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">How it works</p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Fast, guided care in 3 steps
            </span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            A streamlined flow to move from symptoms to a booked appointment.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          className="relative grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10 rounded-3xl" />
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.step}
                variants={item}
                className="relative overflow-hidden rounded-2xl border border-white/30 dark:border-white/10 bg-white/90 dark:bg-slate-900/70 shadow-xl shadow-cyan-500/10 backdrop-blur"
              >
                <div className="absolute inset-0 opacity-60 bg-gradient-to-br from-white/30 via-transparent to-slate-900/10 dark:from-white/5" />
                <div className="relative flex flex-col gap-4 p-6">
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${step.accent} text-white shadow-lg shadow-primary/25`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-semibold text-primary uppercase tracking-[0.18em]">
                      {step.step}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-primary/80">
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      {step.chip}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
