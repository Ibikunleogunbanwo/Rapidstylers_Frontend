import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import { getAuthToken, setAuthToken, showSuccessToastMessage } from "../../utils/constant";

const AdminLogin = () => {
  document.title = "Admin | RapidStylers";
  const navigate = useNavigate();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (getAuthToken()) {
    return <Navigate to="/admin/categories" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await APIService.adminSignIn({ emailAddress, password });
      const token = res.data?.token;
      if (token) {
        setAuthToken(token);
        showSuccessToastMessage("Welcome, admin");
        navigate("/admin/categories");
      }
    } catch (error) {
      // Error toasts are handled in APIService
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <p className="text-2xl font-bold text-gray-900">Admin Sign In</p>
        <p className="text-sm text-gray-500 mt-1">Manage service categories</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              required
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="admin@rapidstylers.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand rounded-md text-sm text-white font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
