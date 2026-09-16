import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import { getAuthToken, isAdminRole, setAuthToken, setRefreshToken, setAdminRole, setUserRole, showSuccessToastMessage } from "../../utils/constant";
import TurnstileWidget from "../../components/turnstileWidget";
import Button from "../../components/button";
import { AdminInput } from "./adminShell";

const AdminLogin = () => {
  document.title = "Admin | RapidStylers";
  const navigate = useNavigate();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  // Cloudflare Turnstile token (empty when no site key is configured). Reset
  // after a failure because a token can only be redeemed once.
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);

  if (getAuthToken() && isAdminRole()) {
    return <Navigate to="/admin/categories" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await APIService.adminSignIn({ emailAddress, password, captchaToken });
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
      setCaptchaReset((n) => n + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-black/10 bg-white p-8">
        <p className="text-[11px] uppercase tracking-[0.25em] text-gray-400">RapidStylers</p>
        <h1 className="mt-2 text-[clamp(1.5rem,2.5vw,2rem)] font-normal leading-[1.1] tracking-[-0.02em] text-gray-900">Admin Sign In</h1>
        {/* This said "Manage service categories", which was true when categories were
            the only thing here. It now sits above a nav of six sections, so it says
            what the area is rather than naming one page inside it. */}
        <p className="text-sm text-gray-500 mt-1">Sign in to moderate the marketplace</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email address</label>
            <AdminInput
              type="email"
              required
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="admin@rapidstylers.ca"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <AdminInput
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <TurnstileWidget onVerify={setCaptchaToken} resetSignal={captchaReset} />
          {/* The shared button, so the admin sign-in keeps the shape every other
              action in the product has instead of its own radius and hover. */}
          <Button
            type="submit"
            variant="primary"
            text={loading ? "Signing in…" : "Sign In"}
            disabled={loading}
            className="w-full"
          />
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
