import React from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Search,
  CheckCircle,
  Lock,
  Globe,
  ChevronRight,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const Button = ({ children, className, variant = 'default', ...props }) => {
  const base = 'px-6 py-3 rounded-full font-semibold text-sm transition-all flex items-center gap-2';
  const variants = {
    default:
      'bg-gradient-to-r from-teal-600 to-cyan-500 text-white hover:from-teal-700 hover:to-cyan-600',
    outline:
      'border-2 border-teal-600 text-teal-600 hover:bg-teal-50 dark:border-cyan-500 dark:text-cyan-300 dark:hover:bg-gray-800',
    ghost:
      'bg-transparent text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700',
  };
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] px-6 pt-[3.75rem] md:px-12 md:pt-[4.25rem] lg:px-24 bg-gradient-to-br from-teal-50 to-white dark:from-gray-900 dark:to-gray-950 text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-12">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-2xl"
      >
        <motion.div
          variants={fadeInUp}
          className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 bg-teal-50 border border-teal-200 text-teal-700 text-sm font-medium rounded-full dark:bg-gray-800 dark:border-gray-600 dark:text-teal-300"
        >
          <Brain className="h-4 w-4" />
          AI-Powered Healthcare
        </motion.div>

        <motion.h1
          variants={fadeInUp}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-800 dark:text-white leading-tight mb-4"
        >
          MediScan
          <br />
          <span className="bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent">
            Your AI Health Companion
          </span>
        </motion.h1>

        <motion.p
          variants={fadeInUp}
          className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8"
        >
          Use our smart symptom checker and real-time system health tools for fast, reliable insights.
        </motion.p>

        <motion.div
          variants={fadeInUp}
          className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10"
        >
          <Button
            variant="outline"
            onClick={() => navigate('/doctors')}
            className="flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-full border border-cyan-500 text-cyan-500 hover:bg-cyan-500/10 dark:border-cyan-400 dark:text-cyan-300 dark:hover:bg-cyan-500/10"
          >
            <Search className="h-5 w-5" />
         Smart Symptom Checker
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-gray-600 dark:text-gray-300"
        >
          {['AI-Powered Diagnosis', 'HIPAA Compliant', '24/7 Accessible'].map(
            (item, index) => {
              const Icon = [Brain, Lock, Globe][index];
              return (
                <div key={index} className="flex items-center gap-2">
                  <div className="bg-teal-100 dark:bg-gray-800 p-1 rounded-full">
                    <Icon className="h-4 w-4 text-teal-600 dark:text-teal-300" />
                  </div>
                  <span className="text-sm font-medium">{item}</span>
                </div>
              );
            }
          )}
        </motion.div>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="relative max-w-md w-full"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-teal-600 to-cyan-400 rounded-2xl blur opacity-30"></div>
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="bg-gradient-to-r from-teal-600 to-cyan-500 h-14 flex items-center px-5 text-white">
            <span className="font-bold text-lg">Smart Symptom Checker</span>
            <span className="ml-2 text-xs font-normal opacity-80">Step-based flow</span>
          </div>
          <div className="p-4">
            <div className="mb-3">
              <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                <span>Step 2 of 5</span>
                <span>40%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-teal-600 to-cyan-500" />
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/60">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                <Activity className="h-4 w-4 text-teal-600 dark:text-teal-300" />
                Selected symptoms
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {['Headache', 'Fatigue'].map((symptom) => (
                  <span
                    key={symptom}
                    className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-700 dark:bg-teal-900/40 dark:text-teal-200"
                  >
                    {symptom}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-100 px-3 py-2 dark:border-gray-700">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                  Duration
                </p>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">
                  4-7 days
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 px-3 py-2 dark:border-gray-700">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Severity
                </div>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">
                  Moderate (5/10)
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-teal-50 p-3 dark:bg-teal-900/30">
              <p className="mb-1.5 text-sm font-medium text-teal-800 dark:text-teal-300">
                Next step in your checker
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  Confirm how long symptoms have lasted
                </div>
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  Review and continue
                </div>
              </div>
            </div>

            <Button className="w-full mt-4" onClick={() => navigate('/symptom-checker')}>
              Open Symptom Checker
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
