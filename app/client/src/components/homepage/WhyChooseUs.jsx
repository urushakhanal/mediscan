import React from "react";
import { ShieldCheck, UserCheck, Brain, CalendarCheck } from "lucide-react";

const features = [
  {
    icon: <ShieldCheck className="w-8 h-8 text-teal-600" />,
    title: "Secure & Private",
    description: "All your medical information is encrypted and confidential."
  },
  {
    icon: <UserCheck className="w-8 h-8 text-cyan-600" />,
    title: "Verified Doctors",
    description: "Every doctor is manually verified by our expert admin team."
  },
  {
    icon: <Brain className="w-8 h-8 text-emerald-600" />,
    title: "Smart Symptom Check",
    description: "AI-powered checker gives you quick insights before visiting."
  },
  {
    icon: <CalendarCheck className="w-8 h-8 text-indigo-600" />,
    title: "Easy Appointments",
    description: "Book, reschedule or cancel your appointments with one click."
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-16 px-4 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
          Why Choose <span className="text-primary">MediScan</span>
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Trusted by users across Nepal for seamless health care access.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800 shadow-md hover:shadow-xl transition-all"
          >
            <div className="mb-4">{feature.icon}</div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {feature.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhyChooseUs;
