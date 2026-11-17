import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";
import { useUser } from "../services/context/UserContext";
import { getDefaultDashboardPath } from "../config/accessControl";

/**
 * Branded 403 Forbidden Access Page for SiBS HRIS.
 * Provides clear explanation of restricted access with role-aware return options.
 */
export default function ForbiddenPage({ attemptedPath = "" }) {
  const navigate = useNavigate();
  const { user } = useUser();

  const dashboardPath = user ? getDefaultDashboardPath(user) : "/login";
  const userRole = user?.role ? String(user.role).replace(/_/g, " ").toUpperCase() : "AUTHENTICATED USER";

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(dashboardPath, { replace: true });
    }
  };

  const handleReturnDashboard = () => {
    navigate(dashboardPath, { replace: true });
  };

  return (
    <main
      role="alert"
      aria-live="polite"
      className="flex min-h-screen w-full items-center justify-center bg-sibs-canvas p-4 font-jakarta sm:p-6"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-sibs-border bg-white p-6 shadow-2xl sm:p-8 text-center">
        <span className="sibs-top-accent" aria-hidden="true" />

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 shadow-xs">
          <ShieldAlert size={28} />
        </div>

        <span className="inline-block rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-rose-700">
          403 — Access Denied
        </span>

        <h1 className="mt-3 font-heading text-xl font-bold tracking-tight text-sibs-navy sm:text-2xl">
          Access Restricted
        </h1>

        <p className="mt-2 text-xs font-semibold leading-relaxed text-sibs-muted sm:text-sm">
          You do not have the required role or authorization to access{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-sibs-navy">
            {attemptedPath || "this page"}
          </code>
          .
        </p>

        {user && (
          <div className="mt-3 text-[11px] font-semibold text-sibs-muted">
            Signed in as:{" "}
            <span className="font-extrabold text-sibs-navy">
              {user.name || user.sibs_id || user.email || "Employee"} ({userRole})
            </span>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center sm:gap-3">
          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-sibs-border bg-white px-4 text-xs font-bold text-sibs-navy transition hover:bg-sibs-surface hover:border-sibs-orange/40 active:scale-[0.98]"
          >
            <ArrowLeft size={15} />
            Go Back
          </button>
          <button
            type="button"
            onClick={handleReturnDashboard}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sibs-orange px-5 text-xs font-bold text-white shadow-xs transition hover:bg-sibs-button-hover active:scale-[0.98]"
          >
            <Home size={15} />
            Return to Dashboard
          </button>
        </div>
      </div>
    </main>
  );
}
