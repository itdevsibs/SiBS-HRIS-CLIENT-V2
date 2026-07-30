import { createElement } from "react";
import {
  CheckSquare,
  Lock,
  PieChart,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserPlus,
} from "lucide-react";

import { SUPER_ADMIN_ROUTES } from "../../../lib/utils/Dashboards/SuperAdminDashboard/superAdminDashboardHelpers.js";

const ACTIONS = [
  {
    id: "add-employee",
    icon: UserPlus,
    title: "Add Employee",
    description: "New hire profile entry",
    path: SUPER_ADMIN_ROUTES.employees,
  },
  {
    id: "add-admin",
    icon: ShieldCheck,
    title: "Add Admin / User",
    description: "Set 7 access tiers",
    action: "add-user",
  },
  {
    id: "manage-access",
    icon: Lock,
    title: "Manage Access",
    description: "Review role permissions",
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
  onAddUser,
  onTabChange,
}) {
  function handleAction(item) {
    if (item.action === "add-user") {
      onAddUser();
      return;
    }

    if (item.tab) {
      onTabChange(item.tab);
      return;
    }

    onNavigate(item.path);
  }

  return (
    <section className="sibs-page-card-in sibs-card p-4">
      <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
        <h2 className="sibs-section-title flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-[#FF5C28]" />
          Super Admin Operations Quick Actions
        </h2>
        <span className="hidden text-[10px] font-bold text-[#98A2B3] sm:block">
          Direct Governance Links
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        {ACTIONS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleAction(item)}
            className="sibs-page-card-in group flex min-h-[102px] flex-col items-start justify-between rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 text-left transition hover:-translate-y-0.5 hover:border-[#FF5C28]/40 hover:bg-[#FFF7F3] hover:shadow-sm"
            style={{ animationDelay: `${440 + index * 55}ms` }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#042C51] text-white transition group-hover:bg-[#FF5C28]">
              {createElement(item.icon, { size: 15 })}
            </span>
            <span className="mt-3">
              <span className="block text-xs font-extrabold text-[#042C51]">
                {item.title}
              </span>
              <span className="mt-1 block text-[10px] font-semibold leading-4 text-[#98A2B3]">
                {item.description}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
