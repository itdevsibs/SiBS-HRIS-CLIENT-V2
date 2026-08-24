import { ArrowRight, FileText, Mail } from "lucide-react";

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function WeeklyReportSnapshot({ report, onViewReport }) {
  const requirement = toNumber(report?.totalRequirement);
  const filled = toNumber(report?.totalFilled);
  const dropOffs = toNumber(report?.dropOffs);
  const fulfillment = requirement > 0
    ? Math.max(0, Math.min(100, Math.round((filled / requirement) * 100)))
    : 0;

  return (
    <section
      className="sibs-page-card-in relative overflow-hidden rounded-xl 2xl:rounded-2xl border border-[#083A69] bg-[#042C51] text-white shadow-md font-jakarta"
      style={{ animationDelay: "120ms", animationFillMode: "both" }}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#FF5C28]/15 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 border-b border-white/10 px-4 py-3 sm:px-5 2xl:px-6 2xl:py-3.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#FF5C28] px-2.5 py-1 sibs-text-micro font-extrabold uppercase tracking-wide text-white shadow-sm">
              Active Week Snapshot
            </span>
            <span className="sibs-text-xs font-extrabold text-blue-100">
              {report?.weekLabel || "No current report"}
            </span>
          </div>

          <span className="sibs-text-micro font-semibold text-blue-200">
            Report ID: <strong className="font-extrabold text-white">{report?.reportId || "—"}</strong>
          </span>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-3.5 p-3.5 sm:gap-4 sm:p-4 2xl:gap-5 2xl:p-5 xl:grid-cols-[1.05fr_1.25fr_0.9fr]">
        <div className="rounded-xl border border-white/10 bg-white/10 p-3.5 backdrop-blur-sm">
          <div className="grid grid-cols-3 divide-x divide-white/10">
            <div className="px-2 text-center">
              <p className="sibs-text-micro font-extrabold uppercase tracking-wide text-blue-200">
                Target Requirement
              </p>
              <p className="mt-1 text-2xl 2xl:text-3xl font-extrabold tabular-nums text-white">
                {requirement}
              </p>
            </div>

            <div className="px-2 text-center">
              <p className="sibs-text-micro font-extrabold uppercase tracking-wide text-emerald-300">
                Total Filled
              </p>
              <p className="mt-1 text-2xl 2xl:text-3xl font-extrabold tabular-nums text-emerald-300">
                {filled}
              </p>
            </div>

            <div className="px-2 text-center">
              <p className="sibs-text-micro font-extrabold uppercase tracking-wide text-rose-300">
                Total Drop-offs
              </p>
              <p className="mt-1 text-2xl 2xl:text-3xl font-extrabold tabular-nums text-rose-300">
                {dropOffs}
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-white/10 pt-3">
            <div className="mb-1.5 flex items-center justify-between sibs-text-micro font-bold text-blue-100">
              <span>Headcount Fulfillment</span>
              <span className="text-white">{fulfillment}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#FF5C28] transition-[width] duration-700 ease-out"
                style={{ width: `${fulfillment}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/10 p-3.5 backdrop-blur-sm">
          <p className="flex items-center gap-1.5 sibs-text-micro font-extrabold uppercase tracking-wide text-blue-200">
            <FileText size={13} className="text-[#FF5C28]" />
            Current Week Narrative Summary
          </p>

          <p className="mt-2 line-clamp-5 sibs-text-xs font-medium leading-5 text-slate-100">
            {report?.summary || "No weekly report data is currently available."}
          </p>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/10 p-3.5 backdrop-blur-sm">
          <div>
            <p className="flex items-center gap-1.5 sibs-text-micro font-extrabold uppercase tracking-wide text-[#FF8C66]">
              <Mail size={13} />
              Management Email Digest
            </p>

            <p className="mt-2 sibs-text-xs font-medium leading-5 text-blue-100">
              Review the current report and its formatted executive email digest before distribution.
            </p>
          </div>

          <button
            type="button"
            onClick={() => report && onViewReport?.(report)}
            disabled={!report}
            className="mt-3 inline-flex h-8.5 2xl:h-10 w-fit items-center gap-2 rounded-lg bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white transition hover:bg-[#E94F1F] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            View Current Report
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </section>
  );
}
