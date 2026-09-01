import { TrendingUp } from "lucide-react";

import {
  formatNumber,
  safePercentage,
} from "../../../lib/utils/Dashboards/OMDashboard/omDashboardHelpers.js";

const stageTone = {
  Sourced: "border-blue-200 bg-blue-50 text-blue-700",
  Screened: "border-cyan-200 bg-cyan-50 text-cyan-700",
  Interviewed: "border-amber-200 bg-amber-50 text-amber-700",
  Offered: "border-orange-200 bg-orange-50 text-orange-700",
  Accepted: "border-indigo-200 bg-indigo-50 text-indigo-700",
  Hired: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export default function OMWeeklyMovement({ movement = {}, delay = 0 }) {
  const stages = [
    ["Sourced", Number(movement.sourced || 0)],
    ["Screened", Number(movement.screened || 0)],
    ["Interviewed", Number(movement.interviewed || 0)],
    ["Offered", Number(movement.offered || 0)],
    ["Accepted", Number(movement.accepted || 0)],
    ["Hired", Number(movement.hired || 0)],
  ];

  const conversion = safePercentage(movement.hired, movement.sourced);

  return (
    <section
      className="sibs-page-card-in sibs-card font-jakarta flex h-full flex-col justify-between p-4 sm:p-5 2xl:p-6"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div>
        <h2 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
          Weekly Movement Pipeline
        </h2>
        <p className="mt-0.5 sibs-text-xs font-semibold text-[#667085]">
          Candidate progression for the manager&apos;s accessible hiring scope
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-3 xl:grid-cols-6">
          {stages.map(([label, value], index) => (
            <div
              key={label}
              className={`flex min-h-[68px] 2xl:min-h-[76px] flex-col justify-between rounded-xl border p-2 2xl:p-2.5 ${stageTone[label] || "border-slate-200 bg-slate-50 text-slate-700"}`}
              style={{
                animationDelay: `${delay + 40 + index * 30}ms`,
                animationFillMode: "both",
              }}
            >
              <span className="sibs-text-micro font-extrabold uppercase tracking-normal">
                {label}
              </span>
              <span className="mt-1.5 2xl:mt-2 font-heading text-base 2xl:text-xl font-bold tabular-nums">
                {formatNumber(value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 2xl:p-3.5">
        <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[#042C51]" />
        <p className="sibs-text-xs font-semibold leading-relaxed text-[#667085]">
          Conversion from Sourced to Hired is{" "}
          <strong className="text-[#042C51]">{conversion}%</strong>. Roles
          marked At Risk or Delayed require additional sourcing buffers before
          the next hiring call.
        </p>
      </div>
    </section>
  );
}
