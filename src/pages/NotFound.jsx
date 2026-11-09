import React from "react";
import { useNavigate } from "react-router-dom";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { useUser } from "../services/context/UserContext";
import { getDefaultDashboardPath } from "../config/accessControl";

/**
 * Harmonized SiBS HRIS 404 Page Not Found view.
 */
export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useUser();

  const destinationPath = user ? getDefaultDashboardPath(user) : "/login";

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(destinationPath, { replace: true });
    }
  };

  const handleReturnHome = () => {
    navigate(destinationPath, { replace: true });
  };

  return (
    <main
      role="alert"
      aria-live="polite"
      className="flex min-h-screen w-full items-center justify-center bg-sibs-canvas p-4 font-jakarta sm:p-6"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-sibs-border bg-white p-6 shadow-2xl sm:p-8 text-center">
        <span className="sibs-top-accent" aria-hidden="true" />

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-sibs-border-subtle bg-sibs-surface text-sibs-muted shadow-xs">
          <FileQuestion size={28} />
        </div>

        <span className="inline-block rounded-full border border-sibs-border bg-sibs-surface px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-sibs-muted">
          404 — Not Found
        </span>

        <h1 className="mt-3 text-xl font-bold tracking-tight text-sibs-navy sm:text-2xl">
          Page Not Found
        </h1>

        <p className="mt-2 text-xs font-semibold leading-relaxed text-sibs-muted sm:text-sm">
          The page you are looking for doesn&apos;t exist or has been moved to another location.
        </p>

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
            onClick={handleReturnHome}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sibs-orange px-5 text-xs font-bold text-white shadow-xs transition hover:bg-sibs-button-hover active:scale-[0.98]"
          >
            <Home size={15} />
            {user ? "Return to Dashboard" : "Go to Sign In"}
          </button>
        </div>
      </div>
    </main>
  );
}
