import React from "react";
import { BarChart3, ShieldCheck } from "lucide-react";
import { useOnboarding } from "../../../services/context/OnboardingContext";

function clampPercentage(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function OutcomeBar({ label, value, count, toneClass, delay = 0 }) {
  const percentage = clampPercentage(value);

  return (
    <div
      className="sibs-page-card-in space-y-1.5"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${toneClass}`} />
          <span className="truncate sibs-text-xs font-extrabold text-[#344054]">
            {label}
          </span>
        </div>

        <span className="shrink-0 text-[10px] font-extrabold tabular-nums text-[#667085] 2xl:text-xs">
          {percentage}% ({Number(count || 0).toLocaleString("en-US")})
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full border border-[#E6ECF2] bg-[#F2F4F7] p-0.5">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${toneClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function OnboardingOutcomeOverview() {
  const { stats = {} } = useOnboarding();

  const rows = [
    {
      label: "True Hires",
      value: stats.trueHiresPct,
      count: stats.trueHires,
      toneClass: "bg-emerald-500",
    },
    {
      label: "Pending Start",
      value: stats.pendingStartPct,
      count: stats.pending,
      toneClass: "bg-amber-500",
    },
    {
      label: "No Show",
      value: stats.noShowPct,
      count: stats.noShow,
      toneClass: "bg-rose-500",
    },
    {
      label: "Pre-start Withdrawal",
      value: stats.withdrawalPct,
      count: stats.withdrawals,
      toneClass: "bg-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 font-jakarta">
      <section
        className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm lg:col-span-7 transition-all duration-200 hover:shadow-md flex flex-col justify-between"
        style={{ animationDelay: "120ms", animationFillMode: "both" }}
      >
        <div>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#E6ECF2]/60 pb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="shrink-0 text-[#FF5C28]" />
                <h2 className="sibs-text-sm font-extrabold uppercase tracking-wide text-[#042C51]">
                  Onboarding Outcome Distribution
                </h2>
              </div>
              <p className="mt-1 sibs-text-xs font-semibold text-[#667085]">
                Current accepted-offer outcomes across active onboarding records.
              </p>
            </div>

            <span className="inline-flex w-fit shrink-0 rounded-full border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 py-1 sibs-text-micro font-extrabold text-[#475467]">
              Total Records: {Number(stats.total || 0).toLocaleString("en-US")}
            </span>
          </div>

          <div className="space-y-3.5">
            {rows.map((row, index) => (
              <OutcomeBar key={row.label} {...row} delay={160 + index * 45} />
            ))}
          </div>
        </div>
      </section>

      <aside
        className="sibs-page-card-in relative overflow-hidden rounded-2xl border border-[#083A69] bg-[#042C51] p-5 text-white shadow-sm lg:col-span-5 flex flex-col justify-between"
        style={{ animationDelay: "180ms", animationFillMode: "both" }}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#FF5C28]/15 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[#FF5C28]">
            <ShieldCheck size={17} />
            <h3 className="sibs-text-micro font-extrabold uppercase tracking-wider">
              Onboarding Governance Rule
            </h3>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/10 p-4">
            <p className="sibs-text-micro font-extrabold uppercase tracking-wider text-[#94A9C1]">
              Target Rule Flow
            </p>
            <p className="mt-1 text-sm 2xl:text-base font-extrabold text-white">
              Accepted Offer → Onboarding → Final Start Outcome
            </p>

            <p className="mt-3.5 sibs-text-micro font-extrabold uppercase tracking-wider text-[#94A9C1]">
              Conversion Policy
            </p>
            <p className="mt-1 sibs-text-xs font-semibold leading-5 text-[#FFB9A2]">
              Accepted Offer creates onboarding. Only a candidate marked as
              <span className="font-extrabold text-emerald-300"> Show </span>
              becomes a True Hire.
            </p>
          </div>

          <p className="mt-4 sibs-text-xs font-semibold leading-5 text-[#BECBDA]">
            No Show and Pre-start Withdrawal do not count as filled placements or True Hires.
          </p>
        </div>
      </aside>
    </div>
  );
}
