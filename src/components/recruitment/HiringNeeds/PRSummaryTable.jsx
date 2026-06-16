import React from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  XCircle,
} from "lucide-react";

/**
 * Standardized StatCard inspired by the Talent Pool pattern.
 */
function StatCard({
  title,
  value,
  icon: Icon,
  description,
  valueClassName = "text-sibs-primary-1",
  delay = 0,
}) {
  return (
    <div className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
            {title}
          </p>

          <p className={`mt-3 truncate text-3xl font-extrabold ${valueClassName}`}>
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

export default function PRSummaryTable({ stats }) {
  return (
    <section className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-bold text-[#101828]">
        Personnel Requisition Summary
      </h2>

      {/* Grid updated to 5 columns for XL screens */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Total PRF"
          value={stats?.total || 0}
          icon={FileText}
          description="Total Requests"
          delay={0}
        />

        <StatCard
          title="Headcount"
          value={stats?.totalHeadcount || 0}
          icon={CalendarDays}
          description="Total Personnel"
          delay={60}
        />

        <StatCard
          title="For Approval"
          value={stats?.forApproval || 0}
          valueClassName="text-amber-500"
          icon={Clock}
          description="Pending Review"
          delay={120}
        />

        <StatCard
          title="Approved"
          icon={CheckCircle2}
          value={stats?.approved || 0}
          valueClassName="text-emerald-600"
          description="Ready for Hiring"
          delay={180}
        />

        <StatCard
          title="Not Approved"
          icon={XCircle}
          value={stats?.notApproved || 0}
          valueClassName="text-red-600"
          description="Rejected/Closed"
          delay={240}
        />
      </div>
    </section>
  );
}