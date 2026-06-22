import React from "react";
import {
  MousePointerClick,
  Target,
  TrendingUp,
  UserCheck,
  UsersRound,
} from "lucide-react";

function formatCurrency(value) {
  const amount = Number(value || 0);

  return amount.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  valueClassName = "text-sibs-primary-1",
  delay = 0,
}) {
  return (
    <div
      className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
            {title}
          </p>

          <p
            className={`mt-3 truncate text-3xl font-extrabold ${valueClassName}`}
          >
            {value}
          </p>

          {description && (
            <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default function SourcingSummaryCards({ totals }) {
  return (
    <section className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-bold text-[#101828]">
        Sourcing Performance Summary
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Tracked Sources"
          value={totals?.totalSources || 0}
          icon={MousePointerClick}
          description={`${totals?.activeSources || 0} with applicants`}
          delay={0}
        />

        <StatCard
          title="Public Applicants"
          value={totals?.totalVolume || 0}
          icon={UsersRound}
          description="From public form"
          delay={60}
        />

        <StatCard
          title="Hired From Sources"
          value={totals?.totalHired || 0}
          valueClassName="text-emerald-600"
          icon={UserCheck}
          description="Based on candidate status"
          delay={120}
        />

        <StatCard
          title="Total Source Cost"
          value={formatCurrency(totals?.totalSourceCost)}
          valueClassName="text-blue-600"
          icon={TrendingUp}
          description={`${totals?.totalCostEntries || 0} cost entries`}
          delay={180}
        />

        <StatCard
          title="Overall Cost / Hire"
          value={formatCurrency(totals?.overallCostPerHire)}
          icon={Target}
          description="Total cost / hired"
          delay={240}
        />
      </div>
    </section>
  );
}