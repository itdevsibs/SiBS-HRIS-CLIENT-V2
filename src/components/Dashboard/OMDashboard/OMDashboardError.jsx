import { AlertCircle, RefreshCw } from "lucide-react";

export default function OMDashboardError({ message, onRetry }) {
  return (
    <div className="sibs-dashboard-shell">
      <main className="sibs-dashboard-main flex min-h-screen items-center justify-center">
        <div className="sibs-card w-full max-w-md px-7 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-extrabold text-[#042C51]">
            Unable to load OM Dashboard
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-[#667085]">
            {message}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#042C51] px-5 text-sm font-extrabold text-white transition hover:bg-[#083E70]"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </main>
    </div>
  );
}
