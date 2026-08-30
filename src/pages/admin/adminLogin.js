import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import { getAuthToken, isAdminRole, setAuthToken, setRefreshToken, setAdminRole, setUserRole, showSuccessToastMessage } from "../../utils/constant";

const AdminLogin = () => {
  document.title = "Admin | RapidStylers";
  const navigate = useNavigate();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (getAuthToken() && isAdminRole()) {
    return <Navigate to="/admin/categories" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await APIService.adminSignIn({ emailAddress, password });
      const token = res.data?.token;
      const refreshToken = res.data?.refreshToken;
      if (token) {
        setAuthToken(token);
        if (refreshToken) {
          setRefreshToken(refreshToken);
        }
        setAdminRole();
        setUserRole("ADMIN");
        showSuccessToastMessage("Welcome, admin");
        navigate("/admin/categories");
      }
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || "Sign in failed";
      setErrorMsg(msg);
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
              placeholder="admin@rapidstylers.ca"
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
          {errorMsg && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              <span>{errorMsg}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
