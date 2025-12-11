import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const SignIn = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setError(""); // Clear error on input change
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      if (!formData.email || !formData.password) {
        throw new Error("Please enter email and password");
      }
      setError("");
      setMessage("Signed in (demo only — no backend connected).");
    } catch (err) {
      console.error(err);
      setMessage("");
      setError(err.message || "Invalid email or password");
    }
  };

  return (
    <section className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-teal-50 to-white px-4 py-16 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-xl w-full">
          <div className="bg-white dark:bg-gray-900 shadow-lg rounded-xl p-8 w-full">
            <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-8">
              Sign In to MediScan
            </h2>

            {error && (
              <div className="mb-4 text-red-600 bg-red-100 border border-red-300 rounded p-3 text-sm">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-gray-700 dark:text-gray-200 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  onInvalid={(e) => e.target.setCustomValidity("Please enter a valid email address")}
                  onInput={(e) => e.target.setCustomValidity("")}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-gray-700 dark:text-gray-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    onInvalid={(e) => e.target.setCustomValidity("Password is required")}
                    onInput={(e) => e.target.setCustomValidity("")}
                    className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 dark:text-gray-300"
                    aria-label="Toggle Password Visibility"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  Remember me
                </label>
                <button type="button" className="text-teal-600 hover:underline">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600 text-white font-semibold py-3 rounded-lg transition-all"
              >
                Sign In
              </button>

              {message && (
                <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
              )}

            </form>
          </div>
        </div>
      </section>
  );
};

export default SignIn;
