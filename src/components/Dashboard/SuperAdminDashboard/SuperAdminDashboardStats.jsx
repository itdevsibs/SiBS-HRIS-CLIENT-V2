import { createElement } from "react";
import {
  AlertTriangle,
  Briefcase,
  ChevronRight,
  Clock,
  ShieldCheck,
  Users,
  UserX,
} from "lucide-react";

function getToneClasses(tone = "navy") {
  const safeTone = tone || "navy";
  return {
    label: `sibs-tone-${safeTone}-label`,
    icon: `sibs-tone-${safeTone}-icon`,
    badge: `sibs-tone-${safeTone}-icon`,
  };
}

const METRICS = [
  {
    key: "employees",
    label: "Employees",
    value: "2,840",
    badge: "+12% MoM",
    description: "Across 18 active depts",
    icon: Users,
    tone: "orange",
  },
  {
    key: "admins",
    label: "Admin Users",
    badge: "7 Access Tiers",
    description: "TA, HR, Finance & Execs",
    icon: ShieldCheck,
    tone: "navy",
  },
  {
    key: "attendance",
    label: "Attendance Flags",
    value: "14",
    badge: "Needs Review",
    description: "Biometric timecard check",
    icon: AlertTriangle,
    tone: "green",
  },
  {
    key: "approvals",
    label: "Pending Approvals",
    value: "18",
    badge: "Cross-Module",
    description: "Leaves, offers & reqs",
    icon: Clock,
    tone: "amber",
  },
  {
    key: "leaves",
    label: "Leaves & Resignations",
    value: "18",
    badge: "14 Leave • 4 Resig",
    description: "Active clearance pipelines",
    icon: UserX,
    tone: "red",
  },
  {
    key: "recruitment",
    label: "Recruitment Funnel",
    value: "142",
    badge: "8 Offers Pending",
    description: "18 open requisitions",
    icon: Briefcase,
    tone: "indigo",
  },
];

function SuperAdminMetricCard({ item, value, onClick, delay = 0 }) {
  const tone = getToneClasses(item?.tone);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group sibs-metric-card font-jakarta relative flex h-[104px] 2xl:h-[116px] min-h-[96px] 2xl:min-h-[112px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5 text-left active:translate-y-0"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex h-full items-start justify-between gap-2.5 2xl:gap-3">
        <div className="min-w-0 flex-1 self-stretch">
          <p
            className={`m-0 truncate sibs-text-micro font-extrabold uppercase ${tone.label}`}
          >
            {item?.label}
          </p>

          <div className="mt-1.5 2xl:mt-2 flex flex-wrap items-baseline gap-1.5 2xl:gap-2">
            <span className="text-2xl 2xl:text-3xl font-extrabold leading-none tabular-nums tracking-tight text-[#042C51]">
              {value}
            </span>

            {item?.badge ? (
              <span
                className={`rounded px-1.5 py-0.5 sibs-text-micro font-extrabold ${tone.badge}`}
              >
                {item.badge}
              </span>
            ) : null}
          </div>

          <p className="mt-1 line-clamp-1 truncate sibs-text-micro font-bold leading-4 text-[#667085]">
            {item?.description}
          </p>
        </div>

        <span
          className={`flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full ${tone.icon}`}
        >
          {item?.icon
            ? createElement(item.icon, {
                className: "h-4 w-4 2xl:h-4.5 2xl:w-4.5",
                strokeWidth: 2,
              })
            : null}
        </span>
      </div>

      <ChevronRight className="absolute bottom-2.5 right-2.5 h-3.5 w-3.5 2xl:h-4 2xl:w-4 translate-x-1 text-[#FF5C28] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
    </button>
  );
}

export default function SuperAdminDashboardStats({ adminCount, onMetricClick }) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {METRICS.map((metric, index) => {
        const val = metric.key === "admins" ? String(adminCount) : metric.value;
        return (
          <SuperAdminMetricCard
            key={metric.key}
            item={metric}
            value={val}
            onClick={() => onMetricClick?.(metric)}
            delay={80 + index * 55}
          />
        );
      })}
    </section>
  );
}


