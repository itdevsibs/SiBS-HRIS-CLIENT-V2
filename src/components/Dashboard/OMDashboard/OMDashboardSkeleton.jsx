import { LoaderCircle } from "lucide-react";

export default function OMDashboardSkeleton() {
  return (
    <div className="sibs-dashboard-shell">
      <main className="sibs-dashboard-main flex min-h-screen items-center justify-center">
        <div
          className="sibs-card flex w-full max-w-sm flex-col items-center justify-center px-6 py-10 text-center"
          role="status"
          aria-live="polite"
          aria-label="Loading OM dashboard"
        >
          <div className="relative flex h-16 w-16 items-center justify-center">
            <span
              className="absolute inset-0 animate-ping rounded-full border-2 border-[#FF5C28]/20"
              aria-hidden="true"
            />
            <span
              className="absolute inset-1 rounded-full border border-[#FF5C28]/30"
              aria-hidden="true"
            />
            <LoaderCircle
              className="relative h-9 w-9 animate-spin text-[#FF5C28]"
              aria-hidden="true"
            />
          </div>

          <h1 className="mt-6 text-xl font-extrabold tracking-tight text-[#042C51]">
            Loading OM Dashboard
          </h1>
          <p className="mt-2 text-sm font-medium leading-6 text-[#667085]">
            Loading your assigned departments, accounts, and hiring movement...
          </p>
        </div>
      </main>
    </div>
  );
}
