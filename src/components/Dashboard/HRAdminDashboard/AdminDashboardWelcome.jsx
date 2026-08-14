import { ArrowRight, Users } from "lucide-react";

export default function AdminDashboardWelcome({
  title,
  fullName,
  onOpenEmployees,
}) {
  return (
    <section className="sibs-page-header-in sibs-page-card-in sibs-card relative overflow-hidden p-4 2xl:p-6">
      <span className="sibs-top-accent" aria-hidden="true" />

      <div className="mt-0.5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-wide text-[#042C51]">
              <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-[#FF5C28]" />
              HR Admin View
            </span>
          </div>

          <h1 className="break-words text-lg 2xl:text-2xl font-extrabold tracking-tight text-[#042C51]">
            {title}
          </h1>

          <p className="sibs-text-sm font-semibold leading-relaxed text-[#667085]">
            Welcome back,{" "}
            <span className="font-extrabold text-[#042C51]">{fullName}</span>.
            You have administrative permissions.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenEmployees}
          className="inline-flex h-8.5 2xl:h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-3 2xl:px-3.5 sibs-text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
        >
          <Users className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
          Launch Employee Directory
          <ArrowRight className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" />
        </button>
      </div>
    </section>
  );
}
