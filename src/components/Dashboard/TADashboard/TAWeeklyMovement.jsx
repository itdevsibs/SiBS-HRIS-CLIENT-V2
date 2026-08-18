import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  FileSearch,
  Handshake,
  Rocket,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

import {
  formatNumber,
  safePercentage,
} from "../../../lib/utils/Dashboards/TADashboard/taDashboardHelpers.js";

const STAGE_CONFIG = [
  { key: "Sourced", label: "Sourced", icon: Users, tone: "border-blue-100 bg-[#E9F0FC] text-[#042C51]" },
  { key: "Screened", label: "Screened", icon: FileSearch, tone: "border-cyan-100 bg-cyan-50 text-cyan-700" },
  { key: "Interviewed", label: "Interviewed", icon: UserCheck, tone: "border-amber-100 bg-amber-50 text-amber-700" },
  { key: "Offered", label: "Offered", icon: Handshake, tone: "border-orange-100 bg-orange-50 text-orange-700" },
  { key: "Accepted", label: "Accepted", icon: FileCheck2, tone: "border-indigo-100 bg-indigo-50 text-indigo-700" },
  { key: "Hired", label: "Hired", icon: Rocket, tone: "border-emerald-100 bg-emerald-50 text-emerald-700" },
];

export default function TAWeeklyMovement({ funnel = {}, delay = 0 }) {
  const stages = [
    { key: "Sourced", count: Number(funnel.sourced || 0) },
    { key: "Screened", count: Number(funnel.screened || 0) },
    { key: "Interviewed", count: Number(funnel.interviewed || 0) },
    { key: "Offered", count: Number(funnel.offered || 0) },
    { key: "Accepted", count: Number(funnel.accepted || 0) },
    { key: "Hired", count: Number(funnel.hired || 0) },
  ];

  const totalSourced = stages[0].count || 1;

  const transitionDrops = stages.slice(0, -1).map((current, index) => {
    const next = stages[index + 1];
    return {
      from: current.key,
      to: next.key,
      loss: Math.max(current.count - next.count, 0),
    };
  });

  const largestDrop = transitionDrops.reduce(
    (largest, current) => (current.loss > largest.loss ? current : largest),
    { from: "Sourced", to: "Screened", loss: 0 },
  );

  const conversion = safePercentage(funnel.hired, funnel.sourced);

  return (
    <section
      className="sibs-page-card-in sibs-card font-jakarta overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-3.5 shadow-sm 2xl:p-5"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex flex-col gap-3 2xl:gap-4 2xl:flex-row 2xl:items-center">
        <div className="grid min-w-0 flex-1 grid-cols-1 items-center gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1fr_16px_1fr_16px_1fr_16px_1fr_16px_1fr_16px_1fr] 2xl:grid-cols-[1fr_20px_1fr_20px_1fr_20px_1fr_20px_1fr_20px_1fr]">
          {stages.map((stage, index) => {
            const config = STAGE_CONFIG[index] || STAGE_CONFIG[0];
            const StageIcon = config.icon;
            const percentage = ((stage.count / totalSourced) * 100).toFixed(1);

            return (
              <div className="contents" key={stage.key}>
                <article
                  className={`flex min-h-[64px] 2xl:min-h-[76px] items-center gap-2.5 2xl:gap-3 rounded-xl border px-2.5 py-2 2xl:px-3 2xl:py-2.5 ${config.tone}`}
                >
                  <span className="flex h-7.5 w-7.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full bg-white/80 shadow-xs">
                    <StageIcon
                      className="h-3.5 w-3.5 2xl:h-4.5 2xl:w-4.5"
                      strokeWidth={2.2}
                    />
                  </span>

                  <div className="min-w-0">
                    <p className="truncate sibs-text-micro font-extrabold uppercase tracking-wider opacity-75">
                      {config.label}
                    </p>
                    <div className="mt-0.5 2xl:mt-1 flex items-baseline gap-1.5 2xl:gap-2">
                      <span className="text-base 2xl:text-xl font-extrabold leading-none tabular-nums">
                        {formatNumber(stage.count)}
                      </span>
                      <span className="rounded bg-white/80 px-1 py-0.5 2xl:px-1.5 sibs-text-micro font-extrabold tabular-nums">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                </article>

                {index < stages.length - 1 ? (
                  <ArrowRight className="mx-auto hidden h-3.5 w-3.5 text-slate-300 xl:block" />
                ) : null}
              </div>
            );
          })}
        </div>

        <aside className="grid shrink-0 grid-cols-2 gap-3 border-t border-[#E6ECF2] pt-3 2xl:w-[260px] 2xl:border-l 2xl:border-t-0 2xl:pl-5 2xl:pt-0">
          <div>
            <p className="sibs-text-micro font-extrabold uppercase tracking-wider text-[#667085]">
              Top Drop-off
            </p>
            <span
              title={`${largestDrop.from} → ${largestDrop.to} (-${largestDrop.loss})`}
              className="mt-0.5 2xl:mt-1 block truncate text-sm 2xl:text-base font-extrabold text-[#042C51]"
            >
              {largestDrop.from} → {largestDrop.to}
            </span>
          </div>

          <div className="text-right">
            <p className="sibs-text-micro font-extrabold uppercase tracking-wider text-[#667085]">
              Hiring Rate
            </p>
            <span className="mt-0.5 2xl:mt-1 block text-lg 2xl:text-xl font-extrabold text-[#FF5C28]">
              {conversion}%
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
}
