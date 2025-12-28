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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

const SignIn = () => {
  const navigate = useNavigate();
  const { signIn, isLoading, authError } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setError(""); // Clear error on input change
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.email || !formData.password) {
        throw new Error("Please enter email and password");
      }
      setError("");
      await signIn(formData);
      navigate("/");
    } catch (err) {
      console.error(err);
      const message = err?.data?.message || err.message || "Invalid email or password";
      setError(message);
    }
  };

  return (
    <section className="min-h-[calc(100vh-3rem)] bg-slate-50 px-4 py-6 dark:bg-slate-950 sm:py-8 flex items-center">
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              Welcome back
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">
              Sign in to MediScan
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Access your dashboard and continue your care journey.
            </p>
          </div>

          {(error || authError) && (
            <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-200">
              {error || authError}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Email address
              </label>
              <Input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                onInvalid={(e) => e.target.setCustomValidity("Please enter a valid email address")}
                onInput={(e) => e.target.setCustomValidity("")}
                className="h-12 rounded-xl px-4 text-base"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  onInvalid={(e) => e.target.setCustomValidity("Password is required")}
                  onInput={(e) => e.target.setCustomValidity("")}
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

            <div className="flex flex-col gap-3 text-sm text-slate-600 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                Remember me
              </label>
              <Dialog>
                <DialogTrigger asChild>
                  <button type="button" className="text-teal-600 transition hover:text-teal-700 hover:underline dark:text-teal-300 dark:hover:text-teal-200">
                    Forgot password?
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Reset your password</DialogTitle>
                    <DialogDescription>
                      Enter your email and we will send a reset link.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <label htmlFor="resetEmail" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Email address
                    </label>
                    <Input id="resetEmail" type="email" placeholder="you@example.com" />
                  </div>
                  <DialogFooter className="pt-2">
                    <Button type="button">Send reset link</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 text-base text-white hover:from-teal-700 hover:to-cyan-600"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default SignIn;
