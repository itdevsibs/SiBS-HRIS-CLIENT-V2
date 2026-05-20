import React from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  XCircle,
} from "lucide-react";

function SummaryCard({
  title,
  value,
  icon,
  valueClassName = "text-sibs-primary-1",
}) {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
            {title}
          </p>

          <p className={`mt-3 text-3xl font-extrabold ${valueClassName}`}>
            {value}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function PRSummaryTable({ stats }) {
  return (
    <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-bold text-[#101828]">
        Personnel Requisition Summary
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Total PRF"
          value={stats?.total || 0}
          icon={<FileText size={22} />}
        />

        <SummaryCard
          title="Total Headcount"
          value={stats?.totalHeadcount || 0}
          icon={<CalendarDays size={22} />}
        />

        <SummaryCard
          title="For Approval"
          value={stats?.forApproval || 0}
          valueClassName="text-amber-500"
          icon={<Clock size={22} />}
        />

        <SummaryCard
          title="Approved"
          value={stats?.approved || 0}
          valueClassName="text-emerald-600"
          icon={<CheckCircle2 size={22} />}
        />

        <SummaryCard
          title="Not Approved"
          value={stats?.notApproved || 0}
          valueClassName="text-red-600"
          icon={<XCircle size={22} />}
        />
      </div>
    </section>
  );
}