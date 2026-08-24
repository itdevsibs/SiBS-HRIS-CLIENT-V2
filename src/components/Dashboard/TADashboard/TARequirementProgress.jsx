import { Target } from "lucide-react";
import { safePercentage } from "../../../lib/utils/Dashboards/TADashboard/taDashboardHelpers.js";

export default function TARequirementProgress({ roles = [], delay = 0 }) {
  const totalReq = roles.reduce((sum, r) => sum + (Number(r.req) || 0), 0);
  const totalFilled = roles.reduce((sum, r) => sum + (Number(r.filled) || 0), 0);
  const overallPercentage = safePercentage(totalFilled, totalReq);

  return (
    <section
      className="sibs-page-card-in sibs-card font-jakarta flex h-full flex-col rounded-2xl border border-sibs-border bg-white p-4 shadow-sm 2xl:p-6"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div>
        <h3 className="font-heading text-sm 2xl:text-base font-bold tracking-tight text-sibs-navy">
          Approved Requirement vs Filled Progress
        </h3>
        <p className="mt-1 text-xs font-semibold text-[#667085]">
          Current filled positions compared with approved requirements
        </p>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2.5 rounded-xl border border-sibs-border-panel bg-sibs-surface p-3 max-h-[380px] overflow-y-auto sibs-scrollbar">
        {roles.length === 0 ? (
          <div className="sibs-empty-panel rounded-xl border border-dashed border-sibs-subtle-border bg-white px-5 py-10 text-center text-xs font-bold text-[#667085]">
            No hiring requirements are available.
          </div>
        ) : (
          roles.map((role) => {
            const percentage = safePercentage(role.filled, role.req);
            const progressClass =
              role.status === "Delayed"
                ? "bg-rose-500"
                : role.status === "At Risk"
                  ? "bg-amber-400"
                  : "bg-sibs-orange";

            const dotClass =
              role.status === "Delayed"
                ? "bg-rose-500"
                : role.status === "At Risk"
                  ? "bg-amber-400"
                  : "bg-sibs-orange";

            return (
              <article
                key={role.id || role.roleAccount}
                className="rounded-lg border border-sibs-border-panel bg-white px-3.5 py-3 shadow-2xs transition hover:border-sibs-orange/40 hover:shadow-xs"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-1.5 truncate text-xs font-extrabold text-sibs-navy">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
                    <span className="truncate">{role.roleTitle}</span>
                    <span className="truncate font-semibold text-[#98A2B3]">
                      ({role.department || role.account})
                    </span>
                  </span>

                  <span className="shrink-0 text-xs font-extrabold text-[#344054]">
                    <b className="text-[#042C51]">{role.filled}</b>
                    <span className="mx-1 text-[#98A2B3]">/</span>
                    <b className="text-[#667085]">{role.req}</b>
                    <span className="ml-1.5 rounded-md border border-[#E6ECF2] bg-[#F8FAFC] px-1.5 py-0.5 sibs-text-micro font-extrabold tabular-nums text-[#FF5C28]">
                      {percentage}%
                    </span>
                  </span>
                </div>

                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full border border-slate-200/70 bg-slate-100">
                  <span
                    className={`block h-full rounded-full transition-all duration-500 ${progressClass}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/70 px-3.5 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-sibs-navy">
            <Target className="h-3.5 w-3.5 text-sibs-orange" />
          </span>
          <div>
            <p className="sibs-text-micro font-extrabold uppercase tracking-wider text-blue-900">
              Overall Fulfillment
            </p>
            <p className="sibs-text-xs font-black text-sibs-navy">
              Approved Requirements
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="font-heading block text-base 2xl:text-lg font-bold leading-none tabular-nums text-sibs-navy">
            {totalFilled} / {totalReq}
          </span>
          <span className="mt-1 block sibs-text-micro font-bold text-sibs-orange">
            {overallPercentage}% fulfilled
          </span>
        </div>
      </div>
    </section>
  );
}
