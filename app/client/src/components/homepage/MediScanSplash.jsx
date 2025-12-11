import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Stethoscope, Brain, Zap } from "lucide-react";

export default function MediScanSplash({ duration = 4000, onComplete }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, duration);

    return () => clearTimeout(exitTimer);
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        {/* Background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/20 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: 0,
              }}
              animate={{
                y: [null, -100],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <motion.div
          className="relative flex flex-col items-center justify-center gap-8 text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {/* Logo */}
          <motion.div
            className="relative"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
          >
            <motion.div
              className="relative p-6 rounded-full bg-gradient-to-r from-primary to-secondary"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(13, 148, 136, 0.3)",
                  "0 0 40px rgba(13, 148, 136, 0.6)",
                  "0 0 20px rgba(13, 148, 136, 0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Stethoscope className="w-12 h-12 text-white" />
            </motion.div>

            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/30"
              animate={{ scale: [1, 1.5, 2], opacity: [1, 0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-secondary/30"
              animate={{ scale: [1, 1.8, 2.5], opacity: [1, 0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
          </motion.div>

          {/* Brand Name */}
          <motion.div className="space-y-4">
            <motion.h1
              className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary-light via-primary to-secondary bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              MediScan
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl text-slate-300 font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.8 }}
            >
              Your AI Doctor
            </motion.p>
          </motion.div>

          {/* Features */}
          <motion.div
            className="flex gap-6 mt-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.6 }}
          >
            {[Brain, Activity, Zap].map((Icon, i) => (
              <motion.div
                key={i}
                className="p-3 rounded-lg bg-slate-800/50 border border-primary/20"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 2 + i * 0.2, duration: 0.5, type: "spring" }}
                whileHover={{ scale: 1.1 }}
              >
                <Icon className="w-6 h-6 text-primary" />
              </motion.div>
            ))}
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            className="w-64 h-1 bg-slate-700 rounded-full overflow-hidden mt-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.5, duration: 0.5 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 2.5, duration: 1.5, ease: "easeInOut" }}
            />
          </motion.div>

          {/* Loading Text */}
          <motion.p
            className="text-sm text-slate-400 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ delay: 3, duration: 1, repeat: Infinity }}
          >
            Initializing AI Systems...
          </motion.p>
        </motion.div>

        {/* Corners */}
        <motion.div
          className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-primary/30"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        />
        <motion.div
          className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-secondary/30"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
