import { TrendingUp } from "lucide-react";

import {
  formatNumber,
  safePercentage,
} from "../../../../lib/utils/OMDashboard/omDashboardHelpers.js";

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
      className="sibs-page-card-in sibs-card p-5 sm:p-6"
      style={{ animationDelay: `${delay}ms` }}
    >
      <h2 className="sibs-section-title">Weekly Movement Pipeline</h2>
      <p className="sibs-section-subtitle">
        Candidate progression for the manager&apos;s accessible hiring scope
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2 text-center sm:grid-cols-3 xl:grid-cols-6">
        {stages.map(([label, value]) => (
          <div
            key={label}
            className={`flex min-h-[74px] flex-col justify-between rounded-xl border p-2.5 ${stageTone[label]}`}
          >
            <span className="text-[9px] font-extrabold uppercase tracking-normal">
              {label}
            </span>
            <span className="mt-2 text-lg font-extrabold tabular-nums">
              {formatNumber(value)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
        <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[#042C51]" />
        <p className="text-xs font-semibold leading-6 text-[#667085]">
          Conversion from Sourced to Hired is{" "}
          <strong className="text-[#042C51]">{conversion}%</strong>. Roles
          marked At Risk or Delayed require additional sourcing buffers before
          the next hiring call.
        </p>
      </div>
    </section>
  );
}
