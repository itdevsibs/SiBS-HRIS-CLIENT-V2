import { createElement } from "react";
import {
  CheckSquare,
  Lock,
  PieChart,
  Settings,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";

import { SUPER_ADMIN_ROUTES } from "../../../lib/utils/Dashboards/SuperAdminDashboard/superAdminDashboardHelpers.js";

const ACTIONS = [
  {
    id: "view-employee",
    icon: UsersRound,
    title: "View Employee",
    description: "Open employee directory",
    path: SUPER_ADMIN_ROUTES.employees,
  },
  {
    id: "manage-access",
    icon: Lock,
    title: "View Access",
    description: "View role permissions",
    tab: "access_roles",
  },
  {
    id: "approvals",
    icon: CheckSquare,
    title: "Open Approvals",
    description: "18 pending requests",
    path: SUPER_ADMIN_ROUTES.approvals,
  },
  {
    id: "recruitment",
    icon: Settings,
    title: "Recruitment Setup",
    description: "Job reqs & available roles",
    path: SUPER_ADMIN_ROUTES.jobDescriptions,
  },
  {
    id: "reports",
    icon: PieChart,
    title: "View Reports",
    description: "Cross-module analytics",
    path: SUPER_ADMIN_ROUTES.reports,
  },
];

export default function SuperAdminQuickActions({
  onNavigate,
  onTabChange,
}) {
  function handleAction(item) {
    if (item.tab) {
      onTabChange(item.tab);
      return;
    }

    onNavigate(item.path);
  }

  return (
    <section
      className="sibs-page-card-in sibs-card font-jakarta p-3.5 2xl:p-4"
      style={{ animationDelay: "120ms", animationFillMode: "both" }}
    >
      <div className="flex items-center justify-between border-b border-sibs-border pb-2 2xl:pb-2.5">
        <div className="min-w-0 space-y-0.5">
          <h2 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight flex items-center gap-1.5 2xl:gap-2">
            <SlidersHorizontal size={14} className="text-sibs-orange" />
            Quick Actions
          </h2>
          <p className="sibs-text-micro font-semibold text-sibs-muted">
            Instant shortcuts for common governance and admin tasks
          </p>
        </div>
        <span className="hidden sibs-text-micro font-bold text-sibs-faint sm:block">
          Direct Governance Links
        </span>
      </div>

      <div className="mt-2.5 2xl:mt-3 grid grid-cols-2 gap-2 2xl:gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
        {ACTIONS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleAction(item)}
            className="group sibs-page-card-in flex flex-col justify-between min-h-[84px] 2xl:min-h-[92px] rounded-xl border border-sibs-border bg-slate-50/80 p-2 2xl:p-2.5 text-left transition-all hover:border-sibs-orange/50 hover:bg-sibs-cream-subtle"
            style={{
              animationDelay: `${160 + index * 40}ms`,
              animationFillMode: "both",
            }}
          >
            <span className="flex h-7 w-7 2xl:h-8 2xl:w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-sibs-orange transition-colors group-hover:bg-sibs-orange group-hover:text-white">
              {createElement(item.icon, {
                className: "h-3.5 w-3.5 2xl:h-4 2xl:w-4",
              })}
            </span>

            <span className="mt-1.5 min-w-0 flex-1">
              <span className="block sibs-text-xs font-extrabold text-sibs-navy transition group-hover:text-sibs-orange">
                {item.title}
              </span>
              <span className="mt-0.5 block sibs-text-micro text-sibs-muted line-clamp-1 truncate">
                {item.description}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}


