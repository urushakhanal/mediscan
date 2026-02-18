import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

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
      navigate("/signin");
    } catch (err) {
      console.error(err);
      const message = err?.data?.message || err.message || "Registration failed";
      setError(message);
    }
  };

  return (
      <section className="min-h-[calc(100vh-3rem)] bg-slate-50 px-4 py-6 dark:bg-slate-950 sm:py-8 flex items-center">
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Get started
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">
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

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Register as
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-teal-400 dark:focus:ring-teal-900/40"
                    >
                      <option value="patient">Patient</option>
                      <option value="doctor">Doctor</option>
                    </select>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button type="button" className="text-sm text-teal-600 transition hover:text-teal-700 hover:underline dark:text-teal-300 dark:hover:text-teal-200">
                          Why we ask
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Why we need details</DialogTitle>
                          <DialogDescription>
                            Patients provide a phone number for follow-ups, and doctors provide an NMC number for verification.
                          </DialogDescription>
                        </DialogHeader>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Full name
                  </label>
                  <Input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                    className="h-12 rounded-xl px-4 text-base"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Email address
                  </label>
                  <Input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="h-12 rounded-xl px-4 text-base"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                      className="h-12 rounded-xl px-4 pr-12 text-base"
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
                  <div className="md:col-span-2">
                    <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Phone number
                    </label>
                    <Input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="+15551234567"
                      className="h-12 rounded-xl px-4 text-base"
                    />
                  </div>
                )}

                {role === "doctor" && (
                  <div className="md:col-span-2">
                    <label htmlFor="nmcNumber" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      NMC number
                    </label>
                    <Input
                      type="text"
                      id="nmcNumber"
                      value={formData.nmcNumber}
                      onChange={handleChange}
                      required
                      placeholder="e.g. NMC-123456"
                      className="h-12 rounded-xl px-4 text-base"
                    />
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 text-base text-white hover:from-teal-700 hover:to-cyan-600"
              >
                {isLoading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
          </div>
        </div>
      </section>
  );
};

export default SignUp;
