import { RefreshCw } from "lucide-react";

export default function EmployeeDirectoryHeader({
  onRefresh,
  isManualRefreshing = false,
}) {
  return (
    <section className="sibs-page-header-in sibs-card relative overflow-hidden p-4 font-jakarta 2xl:p-6">
      <span className="sibs-top-accent" aria-hidden="true" />

      <div className="mt-0.5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-navy">
              <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-sibs-orange" />
              Core HR View
            </span>
          </div>

          <h1 className="font-heading break-words text-xl 2xl:text-3xl font-bold tracking-tight text-sibs-navy">
            Employee Directory
          </h1>

          <p className="sibs-text-sm font-semibold leading-relaxed text-sibs-muted">
            Manage employee records and CHWCP compliance information.
          </p>
        </div>

        {typeof onRefresh === "function" ? (
          <div className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isManualRefreshing}
              title="Refresh Employee Directory"
              className="inline-flex h-8.5 2xl:h-10 w-8.5 2xl:w-10 shrink-0 items-center justify-center rounded-lg border border-sibs-border-subtle bg-white text-sibs-navy shadow-xs outline-none transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                  isManualRefreshing ? "animate-spin text-sibs-orange" : ""
                }`}
              />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
