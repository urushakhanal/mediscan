import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const FinalCTA = () => {
  return (
    <motion.section
      className="relative overflow-hidden px-6 py-20 md:px-12"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      viewport={{ once: true }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-44 w-44 rounded-full bg-primary/8 blur-3xl dark:bg-primary/10" />
        <div className="absolute bottom-0 right-1/4 h-52 w-52 rounded-full bg-secondary/8 blur-3xl dark:bg-secondary/10" />
      </div>

      <div className="relative mx-auto max-w-4xl rounded-[2rem] border border-white/60 bg-white/75 px-8 py-12 text-center shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/65 dark:shadow-black/20">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
          Closing Note
        </p>
        <h2 className="mt-4 bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
          Calm, connected care starts with clear next steps.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600 dark:text-gray-300 md:text-lg">
          Explore symptoms, find the right specialists, and move forward with confidence using one simple care experience.
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            to="/symptom-checker"
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/80 px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10 dark:border-primary/30 dark:bg-slate-950/40 dark:text-primary dark:hover:bg-primary/10"
          >
            Symptom Checker
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.section>
  );
};

export default FinalCTA;
