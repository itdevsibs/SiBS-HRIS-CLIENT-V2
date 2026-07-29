import { createElement } from "react";
import {
  AlertTriangle,
  Briefcase,
  Clock,
  ShieldCheck,
  Users,
  UserX,
} from "lucide-react";

const METRICS = [
  {
    key: "employees",
    label: "Total Employees",
    value: "2,840",
    note: "+12% MoM",
    description: "Across 18 Active Depts",
    icon: Users,
    tone: "bg-blue-50 text-[#042C51]",
  },
  {
    key: "admins",
    label: "Active Admin Users",
    note: "7 Access Tiers",
    description: "TA, HR, Finance & Execs",
    icon: ShieldCheck,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    key: "approvals",
    label: "Pending Approvals",
    value: "18",
    note: "Cross-Module",
    description: "Leaves, Offers & Reqs",
    icon: Clock,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    key: "attendance",
    label: "Attendance Flags",
    value: "14",
    note: "Needs Review",
    description: "Biometric timecard check",
    icon: AlertTriangle,
    tone: "bg-orange-50 text-[#FF5C28]",
  },
  {
    key: "leaves",
    label: "Leaves & Resignations",
    value: "18",
    note: "14 Leave • 4 Resig",
    description: "Active clearance pipelines",
    icon: UserX,
    tone: "bg-red-50 text-red-600",
  },
  {
    key: "recruitment",
    label: "Recruitment Funnel",
    value: "142",
    note: "8 Offers Pending",
    description: "18 Open Requisitions",
    icon: Briefcase,
    tone: "bg-indigo-50 text-indigo-700",
  },
];

export default function SuperAdminDashboardStats({ adminCount }) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {METRICS.map((metric, index) => (
        <article
          key={metric.key}
          className="sibs-metric-card"
          style={{ animationDelay: `${55 + index * 55}ms` }}
        >
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
              {metric.label}
            </span>
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${metric.tone}`}
            >
              {createElement(metric.icon, { size: 17, strokeWidth: 2 })}
            </span>
          </div>

          <div className="mt-3 flex items-end justify-between gap-3">
            <strong className="text-3xl font-extrabold leading-none tabular-nums tracking-tight text-[#042C51]">
              {metric.key === "admins" ? adminCount : metric.value}
            </strong>
            <span className="text-right text-[10px] font-extrabold text-[#FF5C28]">
              {metric.note}
            </span>
          </div>

          <p className="mt-2 text-xs font-semibold leading-relaxed text-[#667085]">
            {metric.description}
          </p>
        </article>
      ))}
    </section>
  );
}
