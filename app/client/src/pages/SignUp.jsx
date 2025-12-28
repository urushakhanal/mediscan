import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const SignUp = () => {
  const navigate = useNavigate();
  const { signUp, isLoading, authError } = useAuth();
  const [role, setRole] = useState("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    nmcNumber: "",
  });

  const handleChange = (e) => {
    setError("");
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role,
        phone: role === "patient" ? formData.phone : undefined,
        nmcNumber: role === "doctor" ? formData.nmcNumber : undefined,
      };
      if (!payload.name || !payload.email || !payload.password) {
        throw new Error("Please fill in name, email, and password");
      }
      if (payload.role === "patient" && !payload.phone) {
        throw new Error("Phone number is required for patients");
      }
      if (payload.role === "doctor" && !payload.nmcNumber) {
        throw new Error("NMC number is required for doctors");
      }
      setError("");
      await signUp(payload);
      navigate("/");
    } catch (err) {
      console.error(err);
      const message = err?.data?.message || err.message || "Registration failed";
      setError(message);
    }
  };

  return (
      <section className="bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:py-12">
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div className="mb-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Get started
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100 sm:text-4xl">
                Create your MediScan account
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Join in minutes and manage your health records securely.
              </p>
            </div>

            {(error || authError) && (
              <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-200">
                {error || authError}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Register as
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-teal-400 dark:focus:ring-teal-900/40"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>

              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Full name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-teal-400 dark:focus:ring-teal-900/40"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-teal-400 dark:focus:ring-teal-900/40"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-900 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-teal-400 dark:focus:ring-teal-900/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-300"
                    aria-label="Toggle Password Visibility"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {role === "patient" && (
                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+15551234567"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-teal-400 dark:focus:ring-teal-900/40"
                  />
                </div>
              )}

              {role === "doctor" && (
                <>
                  <div>
                    <label htmlFor="nmcNumber" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      NMC number
                    </label>
                    <input
                      type="text"
                      id="nmcNumber"
                      value={formData.nmcNumber}
                      onChange={handleChange}
                      required
                      placeholder="e.g. NMC-123456"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-teal-400 dark:focus:ring-teal-900/40"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-teal-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Creating account..." : "Sign Up"}
              </button>
            </form>
          </div>
        </div>
      </section>
  );
};

export default SignUp;
