import React from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Camera,
  Search,
  CheckCircle,
  Lock,
  Globe,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";



// Utility: className combiner
const cn = (...classes) => classes.filter(Boolean).join(" ");

// 🔘 Inline Button Component
const Button = ({ children, className, variant = "default", ...props }) => {
  const base = "px-6 py-3 rounded-full font-semibold text-sm transition-all flex items-center gap-2";
  const variants = {
    default:
      "bg-gradient-to-r from-teal-600 to-cyan-500 text-white hover:from-teal-700 hover:to-cyan-600",
    outline:
      "border-2 border-teal-600 text-teal-600 hover:bg-teal-50 dark:border-cyan-500 dark:text-cyan-300 dark:hover:bg-gray-800",
    ghost:
      "bg-transparent text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700",
  };
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
};

// Motion presets
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
    <section className="relative min-h-[90vh] pt-16 px-6 md:px-12 lg:px-24 bg-gradient-to-br from-teal-50 to-white dark:from-gray-900 dark:to-gray-950 text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-12">
      {/* Left Side */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-2xl"
      >
        <motion.div
          variants={fadeInUp}
          className="inline-block mb-5 px-4 py-1.5 bg-teal-50 border border-teal-200 text-teal-700 text-sm font-medium rounded-full dark:bg-gray-800 dark:border-gray-600 dark:text-teal-300"
        >
          ⛑️ AI-Powered Healthcare
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
          Use our smart symptom checker or HealthScan Analyzer  to get fast, reliable insights. No queues. No confusion.
        </motion.p>

        <motion.div
          variants={fadeInUp}
          className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10"
        >
          <Button onClick={() => navigate("/symptom-checker")}>
  <Brain className="h-5 w-5" />
  Smart Symptom Checker
  <ChevronRight className="h-4 w-4" />
</Button>

          <Button variant="outline" onClick={() => navigate("/healthscan")}>
  <Camera className="h-5 w-5" />
  HealthScan Analyzer
  <ChevronRight className="h-4 w-4" />
</Button>

         <Button
  variant="outline"
  onClick={() => navigate("/doctors")}
  className="flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-full border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
>
  <Search className="h-5 w-5" />
  Find Doctor
  <ChevronRight className="h-4 w-4" />
</Button>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-gray-600 dark:text-gray-300"
        >
          {["AI-Powered Diagnosis", "HIPAA Compliant", "24/7 Accessible"].map(
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

      {/* Right Side Card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="relative max-w-md w-full"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-teal-600 to-cyan-400 rounded-2xl blur opacity-30"></div>
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="bg-gradient-to-r from-teal-600 to-cyan-500 h-16 flex items-center px-6 text-white">
            <span className="font-bold text-lg">Symptom Analysis</span>
            <span className="ml-2 text-xs font-normal opacity-80">Powered by AI</span>
          </div>
          <div className="p-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded mb-4 text-sm text-gray-800 dark:text-gray-100">
              I’ve been experiencing headaches and fatigue for the past week.
            </div>
            <div className="bg-teal-50 dark:bg-teal-900 p-4 rounded-lg">
              <p className="text-teal-800 dark:text-teal-300 font-medium mb-2">
                Based on your symptoms, you may be experiencing:
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  Migraine (68% match)
                </li>
                <li className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  Dehydration (54% match)
                </li>
                <li className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  Stress (49% match)
                </li>
              </ul>
            </div>
            <Button className="w-full mt-6">Find Specialists Near You</Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
