/* eslint-disable react-refresh/only-export-components */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Briefcase,
  Clock,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import Header from "../../../components/layout/Header";
import useClientPagination from "../../../hooks/useClientPagination";
import {
  OMDashboardToast,
  OMMetricCard,
  OMWelcomeCard,
  RecruiterLoadPanel,
  RequirementProgressPanel,
  RoleHiringStatusPanel,
  WeeklyMovementPanel,
} from "./OMDashboardComponents";
import { OperationsHiringDetailsModal } from "../../../components/modals/dashboard/OMDashboardModals";

const HIRING_PLAN_ROUTE = "/recruitment/workforce-hiring-overview";

const PAGE_SHELL_CLASS =
  "sibs-dashboard-shell";
const MAIN_SHELL_CLASS =
  "sibs-dashboard-main";

const MOCK_CURRENT_USER = {
  id: 1,
  name: "Maria Reyes",
  role: "Operation Manager",
  department: "SIBS Operations",
  accounts: ["SIBS Operations", "Coast Dental", "US Visa"],
};

const DASHBOARD_ROLES = [
  {
    id: 1,
    roleAccount: "CSR - SIBS Operations",
    department: "SIBS Operations",
    account: "SIBS Operations",
    roleTitle: "Customer Service Representative",
    approvedRequirement: 20,
    currentFilled: 12,
    openSlots: 8,
    dueDate: "2026-05-15",
    status: "At Risk",
    taOwner: "Maria Reyes",
    riskFlag: "High",
    agingDays: 18,
    sourced: 80,
    screened: 46,
    interviewed: 22,
    offered: 10,
    accepted: 7,
    hired: 12,
    dropOffs: 15,
    actionItem: "Increase sourcing and speed up interview scheduling.",
  },
  {
    id: 2,
    roleAccount: "QA - SIBS Operations",
    department: "SIBS Operations",
    account: "SIBS Operations",
    roleTitle: "QA Specialist",
    approvedRequirement: 5,
    currentFilled: 2,
    openSlots: 3,
    dueDate: "2026-05-10",
    status: "Delayed",
    taOwner: "John Dela Cruz",
    riskFlag: "High",
    agingDays: 24,
    sourced: 28,
    screened: 16,
    interviewed: 7,
    offered: 3,
    accepted: 2,
    hired: 2,
    dropOffs: 6,
    actionItem: "Review QA sourcing pool and add backup candidates.",
  },
  {
    id: 3,
    roleAccount: "RCM Analyst - SIBS RCM",
    department: "SIBS RCM",
    account: "SIBS RCM",
    roleTitle: "RCM Analyst",
    approvedRequirement: 5,
    currentFilled: 3,
    openSlots: 2,
    dueDate: "2026-05-20",
    status: "On Track",
    taOwner: "Kim Domingo",
    riskFlag: "None",
    agingDays: 10,
    sourced: 35,
    screened: 20,
    interviewed: 10,
    offered: 5,
    accepted: 3,
    hired: 3,
    dropOffs: 4,
    actionItem: "Maintain current pipeline movement.",
  },
  {
    id: 4,
    roleAccount: "System Developer - SIBS IT",
    department: "SIBS IT",
    account: "SIBS IT",
    roleTitle: "System Developer",
    approvedRequirement: 3,
    currentFilled: 1,
    openSlots: 2,
    dueDate: "2026-04-30",
    status: "Delayed",
    taOwner: "Maria Reyes",
    riskFlag: "Medium",
    agingDays: 31,
    sourced: 18,
    screened: 9,
    interviewed: 4,
    offered: 1,
    accepted: 1,
    hired: 1,
    dropOffs: 5,
    actionItem: "Reopen sourcing and review compensation range.",
  },
  {
    id: 5,
    roleAccount: "HR Assistant - SIBS HR",
    department: "SIBS HR",
    account: "SIBS HR",
    roleTitle: "HR Assistant",
    approvedRequirement: 2,
    currentFilled: 2,
    openSlots: 0,
    dueDate: "2026-05-18",
    status: "On Track",
    taOwner: "Paul Garcia",
    riskFlag: "None",
    agingDays: 7,
    sourced: 20,
    screened: 12,
    interviewed: 6,
    offered: 2,
    accepted: 2,
    hired: 2,
    dropOffs: 2,
    actionItem: "No immediate risk.",
  },
  {
    id: 6,
    roleAccount: "Dental Support Specialist - Coast Dental",
    department: "SIBS Operations",
    account: "Coast Dental",
    roleTitle: "Dental Support Specialist",
    approvedRequirement: 10,
    currentFilled: 6,
    openSlots: 4,
    dueDate: "2026-05-25",
    status: "At Risk",
    taOwner: "Maria Reyes",
    riskFlag: "Medium",
    agingDays: 16,
    sourced: 44,
    screened: 20,
    interviewed: 12,
    offered: 6,
    accepted: 4,
    hired: 6,
    dropOffs: 7,
    actionItem: "Add more sourced candidates for Coast Dental pipeline.",
  },
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

export function getManagerAccessibleRoles(roles, user) {
  return roles.filter((role) => {
    const sameDepartment = role.department === user.department;
    const assignedAccount = user.accounts?.includes(role.account);

    return sameDepartment || assignedAccount;
  });
}

export default function OMDashboardPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);

  const currentUser = MOCK_CURRENT_USER;

  useEffect(() => {
    if (!toast) return undefined;

    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const managerRoles = useMemo(
    () => getManagerAccessibleRoles(DASHBOARD_ROLES, currentUser),
    [currentUser],
  );

  const filteredRoles = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return managerRoles;

    return managerRoles.filter((role) => {
      return [
        role.roleAccount,
        role.department,
        role.account,
        role.roleTitle,
        role.taOwner,
        role.status,
      ].some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [managerRoles, searchTerm]);

  const paginatedRoles = useClientPagination(filteredRoles, 6);

  const summaryMetrics = useMemo(() => {
    const totalOpenRoles = managerRoles.filter(
      (role) => Number(role.openSlots || 0) > 0,
    ).length;
    const totalApproved = managerRoles.reduce(
      (sum, role) => sum + Number(role.approvedRequirement || 0),
      0,
    );
    const totalFilled = managerRoles.reduce(
      (sum, role) => sum + Number(role.currentFilled || 0),
      0,
    );
    const atRisk = managerRoles.filter(
      (role) => role.status === "At Risk",
    ).length;
    const delayed = managerRoles.filter(
      (role) => role.status === "Delayed",
    ).length;
    const totalDropOffs = managerRoles.reduce(
      (sum, role) => sum + Number(role.dropOffs || 0),
      0,
    );
    const agingRoles = managerRoles.filter(
      (role) => Number(role.agingDays || 0) >= 15,
    ).length;

    const movement = managerRoles.reduce(
      (totals, role) => ({
        sourced: totals.sourced + Number(role.sourced || 0),
        screened: totals.screened + Number(role.screened || 0),
        interviewed: totals.interviewed + Number(role.interviewed || 0),
        offered: totals.offered + Number(role.offered || 0),
        accepted: totals.accepted + Number(role.accepted || 0),
        hired: totals.hired + Number(role.hired || 0),
      }),
      {
        sourced: 0,
        screened: 0,
        interviewed: 0,
        offered: 0,
        accepted: 0,
        hired: 0,
      },
    );

    const filledPercentage =
      totalApproved > 0
        ? Math.round((totalFilled / totalApproved) * 100)
        : 0;

    return {
      totalOpenRoles,
      totalApproved,
      totalFilled,
      filledPercentage,
      atRisk,
      delayed,
      totalDropOffs,
      agingRoles,
      movement,
    };
  }, [managerRoles]);

  const recruiterLoads = useMemo(() => {
    const grouped = {};

    managerRoles.forEach((role) => {
      if (!grouped[role.taOwner]) {
        grouped[role.taOwner] = {
          recruiter: role.taOwner,
          activeRoles: 0,
          sourced: 0,
          interviewed: 0,
          hired: 0,
        };
      }

      grouped[role.taOwner].activeRoles += 1;
      grouped[role.taOwner].sourced += Number(role.sourced || 0);
      grouped[role.taOwner].interviewed += Number(role.interviewed || 0);
      grouped[role.taOwner].hired += Number(role.hired || 0);
    });

    return Object.values(grouped).map((item) => {
      let loadStatus = "Normal";

      if (item.activeRoles >= 3 || item.sourced >= 90) {
        loadStatus = "High";
      } else if (item.activeRoles === 2 || item.sourced >= 40) {
        loadStatus = "Medium";
      }

      return {
        ...item,
        loadStatus,
      };
    });
  }, [managerRoles]);


  const metricCards = [
    {
      id: "total-open",
      label: "Total Open Roles",
      value: formatNumber(summaryMetrics.totalOpenRoles),
      description: "Accessible roles needing staff",
      icon: Briefcase,
      tone: "navy",
    },
    {
      id: "requirement-filled",
      label: "Requirement vs Filled",
      value: `${formatNumber(summaryMetrics.totalFilled)} / ${formatNumber(
        summaryMetrics.totalApproved,
      )}`,
      description: `${summaryMetrics.filledPercentage}% filled`,
      icon: Target,
      tone: "navy",
    },
    {
      id: "at-risk",
      label: "At-Risk Roles",
      value: formatNumber(summaryMetrics.atRisk),
      description: "Require intervention",
      icon: AlertCircle,
      tone: "amber",
    },
    {
      id: "delayed",
      label: "Delayed Roles",
      value: formatNumber(summaryMetrics.delayed),
      description: "Due dates missed",
      icon: Clock,
      tone: "rose",
    },
    {
      id: "weekly-movement",
      label: "Weekly Movement",
      value: `+${formatNumber(summaryMetrics.movement.hired)}`,
      description: "Hired this cycle",
      icon: TrendingUp,
      tone: "indigo",
    },
    {
      id: "drop-offs",
      label: "Drop-Offs",
      value: formatNumber(summaryMetrics.totalDropOffs),
      description: "Candidate attrition",
      icon: TrendingDown,
      tone: "orange",
    },
    {
      id: "aging-roles",
      label: "Aging Roles",
      value: formatNumber(summaryMetrics.agingRoles),
      description: "15 days or older",
      icon: Clock,
      tone: "slate",
    },
  ];

  return (
    <div className={PAGE_SHELL_CLASS}>
      <div className="shrink-0">
        <Header />
      </div>

      <main className={MAIN_SHELL_CLASS}>
        <div className="mx-auto w-full max-w-[1700px] space-y-5 sm:space-y-6">
          <OMWelcomeCard
            currentUser={currentUser}
            onOpenHiringPlan={() => navigate(HIRING_PLAN_ROUTE)}
          />

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
            {metricCards.map((item, index) => (
              <OMMetricCard
                key={item.id}
                item={item}
                delay={80 + index * 55}
              />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <RequirementProgressPanel roles={managerRoles} delay={210} />
            <WeeklyMovementPanel movement={summaryMetrics.movement} delay={260} />
          </section>

          <section className="grid grid-cols-1 gap-5 2xl:grid-cols-12">
            <div className="2xl:col-span-8">
              <RoleHiringStatusPanel
                roles={paginatedRoles.items}
                totalRoles={managerRoles.length}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onViewRole={setSelectedRole}
                currentUser={currentUser}
                delay={310}
                pagination={paginatedRoles.pagination}
              />
            </div>

            <aside className="2xl:col-span-4">
              <RecruiterLoadPanel recruiters={recruiterLoads} delay={360} />
            </aside>
          </section>
        </div>
      </main>

      <OperationsHiringDetailsModal
        open={Boolean(selectedRole)}
        role={selectedRole}
        onClose={() => setSelectedRole(null)}
        onToast={setToast}
      />

      <OMDashboardToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
