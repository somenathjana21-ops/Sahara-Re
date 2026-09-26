"use client";

import React from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-7 h-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          We encountered an unexpected issue. Your data is safe. If you are in
          crisis, please call{" "}
          <a href="tel:14566" className="font-semibold text-primary underline">
            14566
          </a>{" "}
          (24/7 toll-free) immediately.
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-emerald-800 transition-colors shadow-sm"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
