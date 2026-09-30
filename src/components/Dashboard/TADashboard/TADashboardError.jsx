import { AlertCircle, RefreshCw } from "lucide-react";

export default function TADashboardError({ message, onRetry }) {
  return (
    <div className="sibs-card w-full max-w-md px-7 py-8 text-center">
      <div className="sibs-tone-red-icon mx-auto flex h-12 w-12 items-center justify-center rounded-xl">
        <AlertCircle className="h-6 w-6" />
      </div>

      <h2 className="mt-4 text-lg font-extrabold text-sibs-navy">
        Unable to load TA Dashboard
      </h2>

      <p className="mt-2 text-sm font-medium leading-6 text-sibs-muted">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="sibs-btn-primary mt-5 !h-10 !px-5"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
    </div>
  );
}
