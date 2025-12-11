import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const testimonials = [
  {
    quote:
      "MediScan has changed how we approach initial consultations. Patients are better informed and confident.",
    author: "Dr. Sarah Johnson",
    role: "Chief Medical Officer",
    rating: 5,
  },
  {
    quote:
      "I have chronic health issues. MediScan saves me unnecessary trips to the hospital. It’s a must-have.",
    author: "Michael Chen",
    role: "Patient",
    rating: 3,
  },
  {
    quote:
      "The AI caught my skin condition early. I booked a dermatologist within minutes. Life-saving tech.",
    author: "Emma Rodriguez",
    role: "Patient",
    rating: 5,
  },
];

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const testimonial = testimonials[activeIndex];

  return (
    <section
      className="py-24 px-6 md:px-12 bg-gradient-to-b from-white to-teal-50 dark:from-gray-950 dark:to-gray-900"
      id="testimonials"
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent">
          What People Are Saying
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-12">
          Trusted by professionals and patients across the globe.
        </p>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl relative transition-all">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-xl text-gray-700 dark:text-gray-200 italic mb-6">
                “{testimonial.quote}”
              </p>
              <div className="text-teal-600 dark:text-teal-400 font-semibold text-lg">
                {testimonial.author}
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-sm">{testimonial.role}</div>
              <div className="flex justify-center mt-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex justify-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                className={`h-3 w-3 rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? "bg-gradient-to-r from-teal-600 to-cyan-500 w-6"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
                onClick={() => setActiveIndex(i)}
                aria-label={`Go to testimonial ${i + 1}`}
              ></button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
