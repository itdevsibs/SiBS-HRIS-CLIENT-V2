import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  Briefcase,
  Clock,
  Target,
  TrendingDown,
  UsersRound,
} from "lucide-react";

import Header from "../../../components/layout/Header";
import useClientPagination from "../../../hooks/useClientPagination";
import {
  RecruiterLoadPanel,
  RequirementProgressPanel,
  RoleHiringStatusPanel,
  TADashboardToast,
  TAMetricCard,
  TAWelcomeCard,
  WeeklyMovementPanel,
} from "./TADashboardComponents";
import { RoleKpiDetailsModal } from "../../../components/modals/dashboard/TADashboardModals";

const HIRING_PLAN_ROUTE = "/recruitment/workforce-hiring-overview";
const PAGE_SHELL_CLASS = "sibs-dashboard-shell";
const MAIN_SHELL_CLASS = "sibs-dashboard-main";

// Retained from the original TA dashboard data source.
const TA_ROLE_SOURCE = [
  {
    id: 1,
    roleAccount: "CSR - SIBS Operations",
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
];

// Retained from the original TA dashboard recruiter-load data source.
const TA_RECRUITER_SOURCE = [
  {
    recruiter: "Maria Reyes",
    activeRoles: 2,
    sourced: 98,
    interviewed: 26,
    hired: 13,
    loadStatus: "High",
  },
  {
    recruiter: "John Dela Cruz",
    activeRoles: 1,
    sourced: 28,
    interviewed: 7,
    hired: 2,
    loadStatus: "Medium",
  },
  {
    recruiter: "Kim Domingo",
    activeRoles: 1,
    sourced: 35,
    interviewed: 10,
    hired: 3,
    loadStatus: "Normal",
  },
  {
    recruiter: "Paul Garcia",
    activeRoles: 1,
    sourced: 20,
    interviewed: 6,
    hired: 2,
    loadStatus: "Normal",
  },
];

function normalizeRole(role) {
  return {
    id: role.id,
    role: role.roleTitle,
    roleTitle: role.roleTitle,
    roleAccount: role.roleAccount,
    account: role.account,
    department: role.account,
    req: role.approvedRequirement,
    filled: role.currentFilled,
    open: role.openSlots,
    dueDate: role.dueDate,
    status: role.status,
    taOwner: role.taOwner,
    riskFlag: role.riskFlag,
    aging: role.agingDays,
    dropOffs: role.dropOffs,
    actionItem: role.actionItem,
    movement: {
      sourced: role.sourced,
      screened: role.screened,
      interviewed: role.interviewed,
      offered: role.offered,
      accepted: role.accepted,
      hired: role.hired,
    },
  };
}

function normalizeRecruiter(recruiter) {
  return {
    name: recruiter.recruiter,
    activeRoles: recruiter.activeRoles,
    hiredCount: recruiter.hired,
    loadStatus: recruiter.loadStatus,
    output: {
      sourced: recruiter.sourced,
      interviewed: recruiter.interviewed,
      hired: recruiter.hired,
    },
  };
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

export default function TADashboardPage() {
  const navigate = useNavigate();
  const [rolesData] = useState(() => TA_ROLE_SOURCE.map(normalizeRole));
  const [recruiters] = useState(() =>
    TA_RECRUITER_SOURCE.map(normalizeRecruiter),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRole, setSelectedRole] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;

    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const summaryMetrics = useMemo(() => {
    const totalOpenRoles = rolesData.filter(
      (role) => Number(role.open || 0) > 0,
    ).length;
    const totalReq = rolesData.reduce(
      (sum, role) => sum + Number(role.req || 0),
      0,
    );
    const totalFilled = rolesData.reduce(
      (sum, role) => sum + Number(role.filled || 0),
      0,
    );
    const atRisk = rolesData.filter((role) => role.status === "At Risk").length;
    const delayed = rolesData.filter((role) => role.status === "Delayed").length;
    const dropOffs = rolesData.reduce(
      (sum, role) => sum + Number(role.dropOffs || 0),
      0,
    );
    const agingRoles = rolesData.filter(
      (role) => Number(role.aging || 0) >= 15,
    ).length;

    const funnel = rolesData.reduce(
      (totals, role) => ({
        sourced: totals.sourced + Number(role.movement?.sourced || 0),
        screened: totals.screened + Number(role.movement?.screened || 0),
        interviewed:
          totals.interviewed + Number(role.movement?.interviewed || 0),
        offered: totals.offered + Number(role.movement?.offered || 0),
        accepted: totals.accepted + Number(role.movement?.accepted || 0),
        hired: totals.hired + Number(role.movement?.hired || 0),
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
      totalReq > 0 ? Math.round((totalFilled / totalReq) * 100) : 0;

    return {
      totalOpenRoles,
      totalReq,
      totalFilled,
      filledPercentage,
      atRisk,
      delayed,
      dropOffs,
      recruiterLoad: recruiters.length,
      agingRoles,
      funnel,
    };
  }, [recruiters.length, rolesData]);

  const filteredRoles = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return rolesData.filter((role) => {
      const matchesSearch =
        !query ||
        role.role.toLowerCase().includes(query) ||
        role.roleAccount.toLowerCase().includes(query) ||
        role.account.toLowerCase().includes(query) ||
        role.taOwner.toLowerCase().includes(query) ||
        role.status.toLowerCase().includes(query) ||
        role.riskFlag.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "All" || role.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rolesData, searchTerm, statusFilter]);

  const paginatedRoles = useClientPagination(filteredRoles, 6);

  const metricCards = [
    {
      id: "total-open",
      label: "Total Open Roles",
      value: formatNumber(summaryMetrics.totalOpenRoles),
      description: "Roles with remaining open slots",
      icon: Briefcase,
      tone: "navy",
    },
    {
      id: "requirement-filled",
      label: "Requirement vs Filled",
      value: `${formatNumber(summaryMetrics.totalFilled)} / ${formatNumber(
        summaryMetrics.totalReq,
      )}`,
      description: `${summaryMetrics.filledPercentage}% filled`,
      icon: Target,
      tone: "navy",
    },
    {
      id: "at-risk",
      label: "At-Risk Roles",
      value: formatNumber(summaryMetrics.atRisk),
      description: "Roles that may miss due date",
      icon: AlertCircle,
      tone: "amber",
    },
    {
      id: "delayed",
      label: "Delayed Roles",
      value: formatNumber(summaryMetrics.delayed),
      description: "Roles already behind plan",
      icon: Clock,
      tone: "rose",
    },
    {
      id: "weekly-movement",
      label: "Weekly Movement",
      value: `+${formatNumber(summaryMetrics.funnel.hired)}`,
      description: "Total hired this week",
      icon: Activity,
      tone: "indigo",
    },
    {
      id: "drop-offs",
      label: "Drop-Offs",
      value: formatNumber(summaryMetrics.dropOffs),
      description: "Candidate exits across stages",
      icon: TrendingDown,
      tone: "orange",
    },
    {
      id: "recruiter-load",
      label: "Recruiter Load",
      value: formatNumber(summaryMetrics.recruiterLoad),
      description: "Active TA owners",
      icon: UsersRound,
      tone: "navy",
    },
    {
      id: "aging-roles",
      label: "Aging Roles",
      value: formatNumber(summaryMetrics.agingRoles),
      description: "Roles aging 15+ days",
      icon: Clock,
      tone: "slate",
    },
  ];

  return (
    <div className={PAGE_SHELL_CLASS}>
      <Header />

      <main className={MAIN_SHELL_CLASS}>
        <div className="mx-auto w-full max-w-[1700px] space-y-5 sm:space-y-6">
          <TAWelcomeCard
            onOpenHiringPlan={() => navigate(HIRING_PLAN_ROUTE)}
          />

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
            {metricCards.map((item, index) => (
              <TAMetricCard
                key={item.id}
                item={item}
                delay={80 + index * 55}
              />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <RequirementProgressPanel roles={rolesData} delay={210} />
            <WeeklyMovementPanel funnel={summaryMetrics.funnel} delay={260} />
          </section>

          <section className="grid grid-cols-1 items-stretch gap-5 2xl:grid-cols-12">
            <div className="flex 2xl:col-span-8">
              <RoleHiringStatusPanel
                roles={paginatedRoles.items}
                totalRoles={rolesData.length}
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                onSearchChange={setSearchTerm}
                onStatusChange={setStatusFilter}
                onViewRole={setSelectedRole}
                delay={310}
                pagination={paginatedRoles.pagination}
              />
            </div>

            <aside className="flex 2xl:col-span-4">
              <RecruiterLoadPanel recruiters={recruiters} delay={360} />
            </aside>
          </section>
        </div>
      </main>

      <RoleKpiDetailsModal
        open={Boolean(selectedRole)}
        role={selectedRole}
        onClose={() => setSelectedRole(null)}
        onToast={setToast}
      />

      <TADashboardToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
