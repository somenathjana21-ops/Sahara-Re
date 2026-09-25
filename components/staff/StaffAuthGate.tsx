"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Lock, KeyRound, UserCheck, AlertCircle, LogOut } from "lucide-react";

interface StaffAuthGateProps {
  children: React.ReactNode;
}

export default function StaffAuthGate({ children }: StaffAuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState("");
  const [staffHandle, setStaffHandle] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if session exists in browser storage
    const token = sessionStorage.getItem("sahara_staff_token") || localStorage.getItem("sahara_staff_token");
    const handle = sessionStorage.getItem("sahara_staff_handle") || localStorage.getItem("sahara_staff_handle");
    if (token) {
      setIsAuthenticated(true);
      if (handle) setStaffHandle(handle);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/staff/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passcode: passcode.trim(),
          staffHandle: staffHandle.trim() || "counsellor_duty",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Authentication failed");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("sahara_staff_token", data.sessionToken);
      sessionStorage.setItem("sahara_staff_handle", data.staffHandle);
      localStorage.setItem("sahara_staff_token", data.sessionToken);
      localStorage.setItem("sahara_staff_handle", data.staffHandle);

      setStaffHandle(data.staffHandle);
      setIsAuthenticated(true);
    } catch {
      setErrorMsg("Failed to communicate with authentication service");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("sahara_staff_token");
    sessionStorage.removeItem("sahara_staff_handle");
    localStorage.removeItem("sahara_staff_token");
    localStorage.removeItem("sahara_staff_handle");
    setIsAuthenticated(false);
    setPasscode("");
  };

  const fillDemoCredentials = () => {
    setPasscode("sahara2026");
    if (!staffHandle) {
      setStaffHandle("Dr. Ananya Sharma");
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center justify-center mb-5 mx-auto">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Counsellor Portal Access
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Restricted triage environment for accredited mental health caseworkers and legal aid monitors. Access is strictly audited.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Staff Handle / Identifier
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={staffHandle}
                  onChange={(e) => setStaffHandle(e.target.value)}
                  placeholder="e.g. Dr. Ananya Sharma or duty_counsellor"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Staff Passcode
                </label>
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  Quick Demo: sahara2026
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter staff security passcode"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-emerald-800 text-white font-semibold text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? "Verifying Access..." : "Unlock Triage Dashboard"}</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Audit Protocol: v1.1.0</span>
            <span>Zero PII Guaranteed</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Session Security Banner */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">Audited Staff Session:</span>
            <span className="font-semibold text-white bg-slate-800 px-2 py-0.5 rounded text-[11px]">
              {staffHandle || "counsellor_duty"}
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline text-[11px]">
              Actions logged to immutable audit trail
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition text-xs font-medium cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
