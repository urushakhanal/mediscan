import React from "react";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const FinalCTA = () => {
  const handleStart = () => {
    document.getElementById("symptom-checker")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.section
      className="py-24 px-6 md:px-12 bg-gradient-to-r from-teal-600 to-cyan-500 text-white text-center dark:from-teal-700 dark:to-cyan-600"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      viewport={{ once: true }}
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Take Control of Your Health Journey
        </h2>
        <p className="text-lg md:text-xl text-white/90 dark:text-white/80 mb-10">
          Join thousands of users who trust MediScan for fast, AI-powered diagnosis and expert medical support.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={handleStart}
            className="inline-flex items-center justify-center gap-2 bg-white text-teal-600 px-8 py-4 rounded-xl font-semibold hover:text-teal-700 hover:shadow-xl transition-all duration-300"
          >
            Get Started for Free
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => alert("Demo video coming soon!")}
            className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-xl hover:bg-white/10 transition-all duration-300"
          >
            Watch Demo
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>

        <p className="mt-6 text-white/70 text-sm dark:text-white/60">
          No credit card required • Free basic plan • Cancel anytime
        </p>
      </div>
    </motion.section>
  );
};

export default FinalCTA;