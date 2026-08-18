import { RefreshCcw, ShieldCheck } from "lucide-react";

export default function WeeklyReportsRule({ onGenerate }) {
  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sibs-primary-1 shadow-sm">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-sibs-primary-1">Report Generation Rule</h3>
            <p className="mt-1 max-w-5xl text-xs font-semibold leading-5 text-sibs-primary-1/75">
              Weekly reports aggregate Hiring Needs, Weekly Hiring Plan, Candidate Pipeline, Offers, Onboarding, Action Items, Talent Pool, and missing-data explanations into one management-ready digest.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onGenerate}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#FF5C28] px-4 text-xs font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#e85020] hover:shadow-md active:scale-[0.98]"
        >
          <RefreshCcw size={15} />
          Generate Current Week
        </button>
      </div>
    </section>
  );
}
