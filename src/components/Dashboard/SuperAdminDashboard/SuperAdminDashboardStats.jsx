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
    tone: "sibs-tone-navy-icon",
  },
  {
    key: "admins",
    label: "Active Admin Users",
    note: "7 Access Tiers",
    description: "TA, HR, Finance & Execs",
    icon: ShieldCheck,
    tone: "sibs-tone-green-icon",
  },
  {
    key: "approvals",
    label: "Pending Approvals",
    value: "18",
    note: "Cross-Module",
    description: "Leaves, Offers & Reqs",
    icon: Clock,
    tone: "sibs-tone-amber-icon",
  },
  {
    key: "attendance",
    label: "Attendance Flags",
    value: "14",
    note: "Needs Review",
    description: "Biometric timecard check",
    icon: AlertTriangle,
    tone: "sibs-tone-orange-icon",
  },
  {
    key: "leaves",
    label: "Leaves & Resignations",
    value: "18",
    note: "14 Leave • 4 Resig",
    description: "Active clearance pipelines",
    icon: UserX,
    tone: "sibs-tone-red-icon",
  },
  {
    key: "recruitment",
    label: "Recruitment Funnel",
    value: "142",
    note: "8 Offers Pending",
    description: "18 Open Requisitions",
    icon: Briefcase,
    tone: "sibs-tone-indigo-icon",
  },
];

export default function SuperAdminDashboardStats({ adminCount }) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6">
      {METRICS.map((metric, index) => (
        <article
          key={metric.key}
          className="sibs-metric-card flex flex-col justify-between"
          style={{ animationDelay: `${55 + index * 55}ms` }}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="min-w-0 line-clamp-2 text-[10px] font-extrabold uppercase tracking-tight text-[#667085]">
              {metric.label}
            </span>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${metric.tone}`}
            >
              {createElement(metric.icon, { size: 16, strokeWidth: 2 })}
            </span>
          </div>

          <div className="mt-3 flex items-end justify-between gap-2">
            <strong className="text-2xl sm:text-3xl font-extrabold leading-none tabular-nums tracking-tight text-[#042C51]">
              {metric.key === "admins" ? adminCount : metric.value}
            </strong>
            <span className="shrink-0 text-right text-[10px] font-extrabold text-[#FF5C28]">
              {metric.note}
            </span>
          </div>

          <p className="mt-2 truncate text-xs font-semibold leading-relaxed text-[#667085]">
            {metric.description}
          </p>
        </article>
      ))}
    </section>
  );
}
