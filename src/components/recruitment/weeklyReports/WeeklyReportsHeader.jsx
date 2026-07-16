import { ClipboardList, FileClock, RefreshCcw } from "lucide-react";

export default function WeeklyReportsHeader({ onRefresh, onGenerate }) {
  return (
    <div className="sibs-page-header-in flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="min-w-0">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
          <ClipboardList size={14} />
          Recruitment Setup
        </div>

        <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
          Weekly Reports
        </h1>

        <p className="mt-1 max-w-5xl text-sm font-medium text-sibs-tertiary-5">
          Generate weekly hiring reports from Hiring Needs, Weekly Hiring Plan,
          Candidate Pipeline, Offers, Onboarding, Action Items, Talent Pool, and
          Public Talent Pool data.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-md active:scale-[0.98]"
        >
          <RefreshCcw size={17} />
          Refresh Data
        </button>

        <button
          type="button"
          onClick={onGenerate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
        >
          <FileClock size={18} />
          Generate Current Week
        </button>
      </div>
    </div>
  );
}
