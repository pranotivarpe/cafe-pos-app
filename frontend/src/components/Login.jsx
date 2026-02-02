import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LogIn, ShoppingCart, Mail, Lock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  // Prefill only when explicitly enabled (dev + opt-in)
  const isDevPrefill =
    process.env.NODE_ENV === "development" &&
    process.env.REACT_APP_PREFILL_DEMO === "true";

  const initialForm = {
    email: isDevPrefill ? process.env.REACT_APP_DEMO_EMAIL || "" : "",
    password: isDevPrefill ? process.env.REACT_APP_DEMO_PASSWORD || "" : "",
  };

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  // Show demo panel only when explicitly enabled
  const showDemoPanel = process.env.REACT_APP_SHOW_DEMO === "true";
  const demoEmail = process.env.REACT_APP_DEMO_EMAIL || "";
  const demoPassword = process.env.REACT_APP_DEMO_PASSWORD || "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-6">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <ShoppingCart className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cafe POS Pro
          </h1>
          <p className="text-sm text-gray-500">Restaurant Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Enter E-mail"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-400 focus:outline-none text-sm transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="Enter Password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-400 focus:outline-none text-sm transition-colors"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo Credentials (only when explicitly enabled) */}
        {showDemoPanel && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-900 mb-2">
              Demo Credentials:
            </p>
            <div className="text-xs text-blue-700 space-y-1">
              <p>
                <span className="font-medium">Email:</span>{" "}
                {demoEmail || "<set REACT_APP_DEMO_EMAIL>"}
              </p>
              <p>
                <span className="font-medium">Password:</span>{" "}
                {demoPassword ? "••••••••" : "<set REACT_APP_DEMO_PASSWORD>"}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-8">
          © 2026 Cafe POS Pro. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
