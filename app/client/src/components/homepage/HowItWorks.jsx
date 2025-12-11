import React from "react";
import { motion } from "framer-motion";
import { Brain, Stethoscope, Search } from "lucide-react";

// Motion animation configs
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.2, duration: 0.6 },
  }),
};

const steps = [
  {
    step: "1",
    title: "Enter Symptoms",
    description:
      "Describe your symptoms or upload a skin image. Our dynamic form makes it quick and easy.",
    icon: <Brain className="h-8 w-8 text-white" />,
    bg: "from-teal-500 to-cyan-500",
  },
  {
    step: "2",
    title: "Get AI Diagnosis",
    description:
      "Our AI model analyzes your data and suggests possible conditions along with urgency level.",
    icon: <Stethoscope className="h-8 w-8 text-white" />,
    bg: "from-cyan-500 to-blue-500",
  },
  {
    step: "3",
    title: "Book a Doctor",
    description:
      "Find and book qualified specialists near you based on the AI’s recommendation.",
    icon: <Search className="h-8 w-8 text-white" />,
    bg: "from-blue-500 to-indigo-500",
  },
];

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="py-24 px-6 md:px-12 bg-gradient-to-b from-white to-teal-50 dark:from-gray-950 dark:to-gray-900"
    >
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
          <span className="bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent">
            How It Works
          </span>
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-16">
          Just three simple steps to access fast, accurate, and smart healthcare.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-md hover:shadow-xl transition-all duration-300 rounded-xl p-8 text-center group"
            >
              <div
                className={`p-4 rounded-full bg-gradient-to-r ${step.bg} shadow-lg inline-flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105`}
              >
                {step.icon}
              </div>
              <span className="text-sm font-bold text-teal-600 dark:text-teal-400 mb-2 block uppercase tracking-wide">
                Step {step.step}
              </span>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                {step.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
