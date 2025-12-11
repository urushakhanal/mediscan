import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const SignUp = () => {
  const [role, setRole] = useState("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    specialization: "",
    licenseNumber: "",
  });

  const handleChange = (e) => {
    setError("");
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, role };
      if (!payload.name || !payload.email || !payload.password) {
        throw new Error("Please fill in name, email, and password");
      }
      if (payload.role === "doctor" && !payload.licenseNumber) {
        throw new Error("License number is required for doctors");
      }
      setError("");
      setMessage("Signed up (demo only — no backend connected).");
    } catch (err) {
      console.error(err);
      setError(err.message || "Registration failed");
      setMessage("");
    }
  };

  return (
      <section className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-teal-50 to-white px-4 py-16 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-xl w-full">
          <div className="bg-white dark:bg-gray-900 shadow-lg rounded-xl p-8 w-full">
            <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-8">
              Create Your MediScan Account
            </h2>

            {error && (
              <div className="mb-4 text-red-600 bg-red-100 border border-red-300 rounded p-3 text-sm">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="role" className="block text-gray-700 dark:text-gray-200 mb-2">
                  Register As
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>

              <div>
                <label htmlFor="name" className="block text-gray-700 dark:text-gray-200 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your Name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-gray-700 dark:text-gray-200 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
                    required
                    placeholder="••••••••"
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

              {role === "doctor" && (
                <>
                  <div>
                    <label htmlFor="specialization" className="block text-gray-700 dark:text-gray-200 mb-2">
                      Specialization
                    </label>
                    <input
                      type="text"
                      id="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      placeholder="e.g. Dermatologist"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="licenseNumber" className="block text-gray-700 dark:text-gray-200 mb-2">
                      License Number
                    </label>
                    <input
                      type="text"
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      placeholder="e.g. NMC123456"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600 text-white font-semibold py-3 rounded-lg transition-all"
              >
                Sign Up
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

export default SignUp;
