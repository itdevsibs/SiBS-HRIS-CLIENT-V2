import { LoaderCircle } from "lucide-react";

export default function TADashboardSkeleton() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#E8EEF5] px-6">
      <div
        className="sibs-card flex w-full max-w-sm flex-col items-center px-8 py-10 text-center"
        role="status"
        aria-live="polite"
        aria-label="Loading TA dashboard"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
          <LoaderCircle
            className="h-8 w-8 animate-spin text-[#FF5C28]"
            aria-hidden="true"
          />
        </div>

        <h2 className="mt-5 text-lg font-extrabold text-[#042C51]">
          Loading TA Dashboard
        </h2>

        <p className="mt-2 text-sm font-medium leading-5 text-[#667085]">
          Loading current hiring requirements and candidate movement...
        </p>
      </div>
    </div>
  );
}
