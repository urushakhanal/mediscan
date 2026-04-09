import React from "react";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  ArrowUpRight,
} from "lucide-react";
import { motion } from "framer-motion";

const socialLinks = [
  { icon: Facebook, label: "Facebook", href: "#" },
  { icon: Twitter, label: "Twitter", href: "#" },
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
];

const quickLinks = [
  { label: "Home", id: "top" },
  { label: "How It Works", id: "how-it-works" },
  { label: "Testimonials", id: "testimonials" },
  { label: "Contact", id: "contact" },
];

const resourceLinks = [
  { label: "Find Doctors", href: "/doctors" },
  { label: "Symptom Checker", href: "/symptom-checker" },
  { label: "Care Plans", href: "/care-plans" },
  { label: "Create Account", href: "/signup" },
];

const Footer = () => {
  const scrollToSection = (id) => {
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.footer
      id="contact"
      className="relative overflow-hidden bg-gradient-to-b from-slate-100 via-white to-slate-100 px-6 py-12 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-white md:px-10 lg:px-12"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      viewport={{ once: true }}
    >
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-8 grid gap-5 md:grid-cols-[1.3fr_0.9fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
              MediScan
            </p>
            <h2 className="mt-4 max-w-md text-3xl font-bold tracking-tight text-teal-600 dark:text-teal-400 md:text-4xl">
              Simple digital care with a calmer, more connected experience.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-gray-600 dark:text-slate-300 md:text-base">
              Check symptoms, explore specialists, and take the next step with confidence through one streamlined healthcare platform.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:bg-primary/15 dark:hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-700 dark:text-slate-200">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2.5">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  >
                    <ChevronRight className="h-4 w-4 text-primary" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-700 dark:text-slate-200">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <span>123 Health Street, Kathmandu, Nepal</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-primary" />
                <span>+977-9800000000</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-primary" />
                <span>contact@mediscan.com</span>
              </li>
            </ul>

            <div className="mt-5 rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                Start Here
              </p>
              <div className="mt-3 space-y-2">
                {resourceLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-white hover:text-slate-900 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-white"
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight className="h-4 w-4 text-primary" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4 text-sm text-slate-500 dark:text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} MediScan. All rights reserved.</p>
          <div className="flex flex-wrap gap-5">
            <a href="#" className="transition hover:text-slate-900 dark:hover:text-white">
              Privacy Policy
            </a>
            <a href="#" className="transition hover:text-slate-900 dark:hover:text-white">
              Terms of Service
            </a>
            <a href="#" className="transition hover:text-slate-900 dark:hover:text-white">
              Support
            </a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
