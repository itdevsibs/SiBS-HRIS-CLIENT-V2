import { ArrowRight, RefreshCw, UserPlus, Users } from "lucide-react";

export default function SuperAdminDashboardHeader({
  displayName,
  onAddUser,
  onOpenEmployees,
  onRefresh,
  isManualRefreshing = false,
}) {
  return (
    <section
      className="sibs-page-header-in sibs-page-card-in sibs-card font-jakarta relative overflow-hidden p-4 2xl:p-6"
      style={{ animationDelay: "0ms", animationFillMode: "both" }}
    >
      <span className="sibs-top-accent" aria-hidden="true" />

      <div className="mt-0.5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 lg:pr-4 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-wide text-[#042C51]">
              <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-[#FF5C28]" />
              Super Admin Operations View
            </span>
          </div>

          <h1 className="font-heading break-words text-xl 2xl:text-3xl font-bold tracking-tight text-[#042C51]">
            Whole-System HRIS Operations &amp; Governance
          </h1>

          <p className="sibs-text-sm font-semibold leading-relaxed text-[#667085]">
            Welcome back,{" "}
            <span className="font-extrabold text-[#042C51]">{displayName}</span>.
            You have whole-system administrative permissions across all HRIS modules.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 2xl:gap-2.5 lg:flex-nowrap">
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isManualRefreshing}
              title="Refresh Dashboard Data"
              className="inline-flex h-8.5 2xl:h-10 w-8.5 2xl:w-10 shrink-0 items-center justify-center rounded-lg border border-[#D6E0EA] bg-white text-[#042C51] shadow-xs outline-none transition hover:border-[#FF5C28]/40 hover:bg-[#FFF4ED] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                  isManualRefreshing ? "animate-spin text-[#FF5C28]" : ""
                }`}
              />
            </button>
          ) : null}

          <button
            type="button"
            onClick={onAddUser}
            className="inline-flex h-8.5 2xl:h-10 shrink-0 items-center justify-center gap-1.5 2xl:gap-2 whitespace-nowrap rounded-lg border border-[#E6ECF2] bg-white px-2.5 2xl:px-3.5 sibs-text-micro 2xl:sibs-text-xs font-extrabold text-[#042C51] shadow-xs transition hover:border-[#FF5C28]/40 hover:bg-[#FFEDD2] hover:text-[#042C51]"
          >
            <UserPlus className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-[#FF5C28]" />
            Add Admin / User
          </button>

          <button
            type="button"
            onClick={onOpenEmployees}
            className="inline-flex h-8.5 2xl:h-10 shrink-0 items-center justify-center gap-1.5 2xl:gap-2 whitespace-nowrap rounded-lg bg-[#FF5C28] px-2.5 2xl:px-3.5 sibs-text-micro 2xl:sibs-text-xs font-extrabold text-white shadow-xs transition hover:bg-[#EB3800] active:bg-[#FF8450]"
          >
            <Users className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-white" />
            Launch Employee Directory
            <ArrowRight className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}


