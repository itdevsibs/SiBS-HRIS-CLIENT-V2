import { createElement } from "react";
import { Activity, Building2, CheckCircle2, Layers3, XCircle } from "lucide-react";

const METRICS = [
  { key: "totalDepartments", label: "Total Departments", description: "Kronos organization units", icon: Building2, tone: "text-blue-600 bg-blue-50" },
  { key: "totalAccounts", label: "Total Accounts", description: "Linked operating accounts", icon: Layers3, tone: "text-violet-600 bg-violet-50" },
  { key: "activeAccounts", label: "Active Accounts", description: "Available in Kronos", icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
  { key: "inactiveAccounts", label: "Inactive Accounts", description: "Disabled or archived", icon: XCircle, tone: "text-amber-600 bg-amber-50" },
  { key: "activeRate", label: "Active Rate", description: "Account availability", icon: Activity, tone: "text-sibs-orange bg-orange-50", suffix: "%" },
];

export default function DepartmentSummaryCards({ summary }) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
      {METRICS.map(({ key, label, description, icon, tone, suffix = "" }, index) => (
        <article
          key={key}
          className="sibs-metric-card"
          style={{ animationDelay: `${index * 45}ms`, animationFillMode: "both" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="sibs-kpi-kicker">{label}</p>
              <p className="mt-4 sibs-kpi-value text-sibs-navy">
                {Number(summary[key] || 0).toLocaleString("en-PH")}{suffix}
              </p>
              <p className="mt-3 sibs-kpi-desc">{description}</p>
            </div>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}>
              {createElement(icon, { className: "h-4 w-4" })}
            </span>
          </div>
        </article>
      ))}
    </section>
  );
}
