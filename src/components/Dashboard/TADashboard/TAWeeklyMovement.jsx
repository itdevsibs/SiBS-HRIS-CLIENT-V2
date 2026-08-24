import { TrendingUp } from "lucide-react";

import {
  formatNumber,
  safePercentage,
} from "../../../lib/utils/Dashboards/TADashboard/taDashboardHelpers.js";

const stageTone = {
  Sourced: "border-blue-200 bg-blue-50 text-blue-700",
  Screened: "border-cyan-200 bg-cyan-50 text-cyan-700",
  Interviewed: "border-amber-200 bg-amber-50 text-amber-700",
  Offered: "border-orange-200 bg-orange-50 text-orange-700",
  Accepted: "border-indigo-200 bg-indigo-50 text-indigo-700",
  Hired: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export default function TAWeeklyMovement({ funnel = {}, delay = 0 }) {
  const stages = [
    ["Sourced", Number(funnel.sourced || 0)],
    ["Screened", Number(funnel.screened || 0)],
    ["Interviewed", Number(funnel.interviewed || 0)],
    ["Offered", Number(funnel.offered || 0)],
    ["Accepted", Number(funnel.accepted || 0)],
    ["Hired", Number(funnel.hired || 0)],
  ];

  const transitionDrops = stages.slice(0, -1).map(([label, count], index) => {
    const [nextLabel, nextCount] = stages[index + 1];

    return {
      from: label,
      to: nextLabel,
      loss: Math.max(Number(count) - Number(nextCount), 0),
    };
  });

  const largestDrop = transitionDrops.reduce(
    (largest, current) => (current.loss > largest.loss ? current : largest),
    { from: "Sourced", to: "Screened", loss: 0 },
  );
  const conversion = safePercentage(funnel.hired, funnel.sourced);

  return (
    <section
      className="sibs-page-card-in sibs-card font-jakarta flex h-full flex-col justify-between p-4 sm:p-5 2xl:p-6"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div>
        <h2 className="font-heading text-sm 2xl:text-base font-bold tracking-tight text-[#042C51]">
          Weekly Movement Pipeline
        </h2>
        <p className="mt-0.5 sibs-text-xs font-semibold text-[#667085]">
          Candidate progression from sourcing through hire
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
              <span className="text-[9px] 2xl:text-[10px] font-extrabold uppercase tracking-normal">
                {label}
              </span>
              <span className="font-heading mt-1.5 2xl:mt-2 text-base 2xl:text-xl font-bold tabular-nums">
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
          <strong className="text-[#042C51]">{conversion}%</strong>. The
          largest volume drop is between{" "}
          <strong className="text-[#042C51]">{largestDrop.from}</strong> and{" "}
          <strong className="text-[#042C51]">{largestDrop.to}</strong>, with{" "}
          {largestDrop.loss} candidates not progressing to the next stage.
        </p>
      </div>
    </section>
  );
}
