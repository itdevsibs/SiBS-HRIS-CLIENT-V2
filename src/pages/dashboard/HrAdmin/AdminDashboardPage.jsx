import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  CreditCard,
  FileText,
  Info,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

import Header from "../../../components/layout/Header";
import { useUser } from "../../../services/context/UserContext";
import { useAdmin } from "../../../services/context/AdminContext";
import { useSidebarNotifications } from "../../../services/context/SidebarNotificationContext";

import {
  DashboardLoadingSkeleton,
  DashboardMetricCard,
  DashboardToast,
  DashboardWelcome,
  NotificationsPanel,
  QuickActionsPanel,
  RecentActivityPanel,
  WorkforceKpiCard,
} from "./AdminDashboardComponents";
import { DashboardModalManager } from "../../../components/modals/dashboard/AdminDashboardModals";

const EXISTING_ADMIN_ROUTES = {
  employees: "/employee",
  departments: "/departments",
  attendance: "/attendance",
  reports: "/reports",
  leaves: "/leaves",
  approvals: "/approval-request",
  hiringOverview: "/recruitment/workforce-hiring-overview",
};

const dashboardTitleMap = {
  hr: "Human Resource Dashboard",
  ta: "Talent Acquisition Dashboard",
  hr_admin: "HR Admin Dashboard",
  hradmin: "HR Admin Dashboard",
  super_admin: "Super Admin Dashboard",
  superadmin: "Super Admin Dashboard",
  executive: "Executive Dashboard",
  manager: "Management Dashboard",
  finance: "Finance Dashboard",
  admin: "Admin Dashboard",
};

const pageShellClass =
  "sibs-dashboard-shell";
const mainShellClass =
  "sibs-dashboard-main-wide";

// Frontend-only demonstration data. It resets when the page refreshes.
const INITIAL_EMPLOYEES = [
  {
    id: "EMP-6496",
    name: "CANITAN, CRISTER ALBERCA",
    department: "Telecom & Tech",
    role: "Software Engineer",
    status: "Present",
    email: "crister.canitan@thesiblings.com",
    shift: "08:00 AM - 05:00 PM",
  },
  {
    id: "EMP-6099",
    name: "LABUS, ROLAND JAMES DIAGBEL",
    department: "Management",
    role: "WFM Lead Director",
    status: "Present",
    email: "roland.labus@thesiblings.com",
    shift: "09:00 AM - 06:00 PM",
  },
  {
    id: "EMP-1024",
    name: "BATACAN, ALENA MENDOZA",
    department: "Core HR",
    role: "Operations Director",
    status: "Present",
    email: "alena.batacan@thesiblingssolutions.com",
    shift: "08:00 AM - 05:00 PM",
  },
  {
    id: "EMP-4112",
    name: "DELOS REYES, SHIELA MAE",
    department: "Talent Acquisition",
    role: "Senior Recruiter",
    status: "On Leave",
    email: "shiela.delosreyes@thesiblings.com",
    shift: "09:00 AM - 06:00 PM",
  },
  {
    id: "EMP-2354",
    name: "SARMIENTO, MARK GREGORY",
    department: "Financial Services",
    role: "Customer Solutions Representative",
    status: "Off Duty",
    email: "mark.sarmiento@thesiblings.com",
    shift: "10:00 PM - 07:00 AM",
  },
  {
    id: "EMP-3889",
    name: "VALENCIA, JESSICA MAE",
    department: "Healthcare & Insurance",
    role: "Insurance Claims Analyst",
    status: "Present",
    email: "jessica.valencia@thesiblings.com",
    shift: "08:00 AM - 05:00 PM",
  },
  {
    id: "EMP-1502",
    name: "TORRES, RENZ CHRISTOPHER",
    department: "Retail & E-Commerce",
    role: "Support Specialist",
    status: "Late",
    email: "renz.torres@thesiblings.com",
    shift: "09:00 AM - 06:00 PM",
  },
  {
    id: "EMP-5001",
    name: "RAMIREZ, PATRICIA ANN",
    department: "WFM & Compliance",
    role: "Compliance Officer",
    status: "Present",
    email: "patricia.ramirez@thesiblings.com",
    shift: "08:00 AM - 05:00 PM",
  },
];

const INITIAL_DEPARTMENTS = [
  {
    id: "DEP-001",
    name: "Telecom & Tech Support",
    head: "Crister Alberca Canitan",
    headcount: 1450,
    budget: "$2.4M",
    location: "Building 3, Floor 4",
  },
  {
    id: "DEP-002",
    name: "Financial Services Group",
    head: "Mark Gregory Sarmiento",
    headcount: 1120,
    budget: "$1.8M",
    location: "Building 2, Floor 2",
  },
  {
    id: "DEP-003",
    name: "Healthcare & Insurance",
    head: "Jessica Mae Valencia",
    headcount: 950,
    budget: "$1.5M",
    location: "Building 1, Floor 3",
  },
  {
    id: "DEP-004",
    name: "Retail & E-Commerce",
    head: "Renz Christopher Torres",
    headcount: 780,
    budget: "$1.1M",
    location: "Building 3, Floor 2",
  },
  {
    id: "DEP-005",
    name: "Talent Acquisition",
    head: "Shiela Mae Delos Reyes",
    headcount: 45,
    budget: "$450K",
    location: "Building 1, Floor 1",
  },
  {
    id: "DEP-006",
    name: "Workforce & Compliance",
    head: "Patricia Ann Ramirez",
    headcount: 35,
    budget: "$320K",
    location: "Building 2, Floor 5",
  },
  {
    id: "DEP-007",
    name: "Core Administration",
    head: "Alena Mendoza Batacan",
    headcount: 24,
    budget: "$500K",
    location: "Building 1, Floor 5",
  },
];

const INITIAL_ACTIVITIES = [
  {
    id: "ACT-001",
    time: "10 mins ago",
    type: "leave",
    user: "CRISTER ALBERCA CANITAN",
    action: "filed a Vacation Leave request",
    details: "Request for Jul 22 - Jul 24 (3 days). Paid leave.",
  },
  {
    id: "ACT-002",
    time: "45 mins ago",
    type: "employee",
    user: "ALENA MENDOZA BATACAN",
    action: "onboarded 5 new employees",
    details: "Assigned to telecom and support accounts.",
  },
  {
    id: "ACT-003",
    time: "2 hours ago",
    type: "attendance",
    user: "ROLAND JAMES LABUS",
    action: "completed biometric sync",
    details: "Frontend WFM scenario reached 98.4% data consistency.",
  },
  {
    id: "ACT-004",
    time: "4 hours ago",
    type: "hiring",
    user: "Sourcing Preview",
    action: "matched 18 candidates",
    details: "Recommended candidates for open support engineer roles.",
  },
  {
    id: "ACT-005",
    time: "1 day ago",
    type: "department",
    user: "Admin Preview",
    action: "created department",
    details: "Strategic Client Operations department initialized in frontend state.",
  },
];

const INITIAL_NOTIFICATIONS = [
  {
    id: "NOT-001",
    type: "action",
    icon: ShieldAlert,
    title: "Pending Leave Requests",
    message: "4 new leave submissions require HR review and schedule alignment.",
    time: "Just now",
    actionLabel: "Open Leaves",
  },
  {
    id: "NOT-002",
    type: "warning",
    icon: AlertTriangle,
    title: "Attendance Sync Anomaly",
    message: "A frontend biometric mismatch scenario is flagged for the Verizon Tech account.",
    time: "2 hours ago",
    actionLabel: "Re-sync Preview",
  },
  {
    id: "NOT-003",
    type: "info",
    icon: Info,
    title: "Hiring Milestone Completed",
    message: "95% of the frontend target headcount for the Telecom & Tech cluster has been met.",
    time: "4 hours ago",
    actionLabel: "View Hiring",
  },
];

const INITIAL_INTERVIEWS = [
  {
    id: "INT-101",
    candidate: "Michael Jordan",
    time: "09:30 AM",
    position: "Telecom Support Engineer",
    interviewer: "Shiela Delos Reyes",
    status: "Scheduled",
  },
  {
    id: "INT-102",
    candidate: "Serena Williams",
    time: "11:00 AM",
    position: "WFM Planner",
    interviewer: "Roland James Labus",
    status: "In Progress",
  },
  {
    id: "INT-103",
    candidate: "Lionel Messi",
    time: "01:30 PM",
    position: "Finance Solutions Expert",
    interviewer: "Alena Batacan",
    status: "Scheduled",
  },
  {
    id: "INT-104",
    candidate: "LeBron James",
    time: "03:00 PM",
    position: "Retail Account Supervisor",
    interviewer: "Renz Christopher Torres",
    status: "Completed",
  },
  {
    id: "INT-105",
    candidate: "Taylor Swift",
    time: "04:30 PM",
    position: "Talent Branding Lead",
    interviewer: "Shiela Delos Reyes",
    status: "Scheduled",
  },
];

const INITIAL_ATTENDANCE = {
  present: 4242,
  onLeave: 215,
  late: 68,
  absent: 95,
  lastSync: "Today, 05:45 AM",
  shifts: [
    { label: "Morning Shift Present", value: 2350 },
    { label: "Afternoon Shift Present", value: 1100 },
    { label: "Night / Graveyard Shift Present", value: 792 },
    { label: "Standby Coverage Reserves", value: 120 },
  ],
};

const PAYROLL_PREVIEW = {
  total: "$14,250,450.00",
  status: "Funded & Cleared",
  nextRun: "July 31, 2026",
  clusters: [
    { name: "Telecom & Tech Cluster", staff: 1450, amount: "$4,850,000" },
    { name: "Financial Services Cluster", staff: 1120, amount: "$3,950,000" },
    { name: "Healthcare & Insurance Cluster", staff: 950, amount: "$3,120,000" },
    { name: "Retail & E-Commerce Cluster", staff: 780, amount: "$2,330,450" },
  ],
};

const REPORT_PREVIEW = {
  distribution: [
    { label: "Telecom & Tech Support", value: 31.3 },
    { label: "Financial Services Group", value: 24.2 },
    { label: "Healthcare & Insurance", value: 20.5 },
    { label: "Retail & E-Commerce", value: 16.8 },
  ],
  conversion: [
    { label: "Accepted Job Offers", value: "420 Candidates" },
    { label: "NHO Conversion Rate", value: "94.0%", tone: "text-[#FF5C28]" },
    { label: "FST Graduation Yield", value: "83.3%" },
    { label: "Graveyard Attrition Factor", value: "Low (3.2%)", tone: "text-rose-600" },
  ],
  forecast:
    "The frontend forecasting scenario indicates stable headcount buffers throughout Q3 2026. Weekly hiring plans should focus on telecom support roles to offset seasonal demand.",
};

function normalizeRole(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function makeFrontendId(prefix) {
  return `${prefix}-${String(Date.now()).slice(-6)}`;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useUser();
  const { ADMIN_ROLES } = useAdmin();
  const { markNotificationSeen } = useSidebarNotifications() || {};

  const [activeModal, setActiveModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [employeeCount, setEmployeeCount] = useState(4620);
  const [departmentCount, setDepartmentCount] = useState(12);
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [interviews, setInterviews] = useState(INITIAL_INTERVIEWS);
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);

  const userRole = normalizeRole(user?.role);
  const adminRolesKey = Array.isArray(ADMIN_ROLES)
    ? ADMIN_ROLES.map(normalizeRole).join("|")
    : "";

  const isAdminSide = useMemo(() => {
    const adminRoles = adminRolesKey
      .split("|")
      .map(normalizeRole)
      .filter(Boolean);

    return adminRoles.includes(userRole);
  }, [adminRolesKey, userRole]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
      return;
    }

    if (!isAdminSide) {
      const targetPath =
        userRole === "employee" ? "/dashboard/employee" : "/login";

      if (location.pathname !== targetPath) {
        navigate(targetPath, { replace: true });
      }
    }
  }, [loading, user, isAdminSide, userRole, location.pathname, navigate]);

  useEffect(() => {
    if (loading || !user || !isAdminSide) return;

    markNotificationSeen?.("hrDashboard");
  }, [loading, user, isAdminSide, markNotificationSeen]);

  useEffect(() => {
    if (!toast) return undefined;

    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const fullName = (
    `${user?.lastName || ""}${user?.lastName ? ", " : ""}${user?.firstName || ""}${
      user?.middleName ? ` ${user.middleName}` : ""
    }`.trim() || "User"
  ).toUpperCase();

  const dashboardTitle = dashboardTitleMap[userRole] || "Admin Dashboard";

  const metricCards = [
    {
      id: "employees",
      label: "Employees",
      value: formatNumber(employeeCount),
      description: "Total employees active",
      icon: Users,
      tone: "orange",
    },
    {
      id: "departments",
      label: "Departments",
      value: formatNumber(departmentCount),
      description: "Active departments",
      icon: Building2,
      tone: "navy",
    },
    {
      id: "attendance",
      label: "Attendance",
      value: formatNumber(attendance.present),
      description: "Today records present",
      icon: UserCheck,
      tone: "green",
      badge: "91.8%",
    },
    {
      id: "interviews",
      label: "Interviews Today",
      value: "34",
      description: "Scheduled interviews",
      icon: Calendar,
      tone: "indigo",
    },
    {
      id: "payroll",
      label: "Payroll",
      value: formatNumber(employeeCount),
      description: "Payroll records total",
      icon: CreditCard,
      tone: "amber",
    },
  ];

  const quickActions = [
    {
      id: "add-employee",
      title: "Add Employee",
      description: "Create a temporary employee profile",
      icon: UserPlus,
    },
    {
      id: "create-department",
      title: "Create Department",
      description: "Create a temporary department",
      icon: Building2,
    },
    {
      id: "attendance-route",
      title: "Attendance Dashboard",
      description: "Open the existing attendance module",
      icon: Clock,
      path: EXISTING_ADMIN_ROUTES.attendance,
    },
    {
      id: "reports",
      title: "View Reports",
      description: "Open frontend analytics and insights",
      icon: FileText,
    },
  ];

  const showToast = (nextToast) => {
    setToast(
      typeof nextToast === "string"
        ? { title: "Dashboard Update", message: nextToast }
        : nextToast,
    );
  };

  const addActivity = (activity) => {
    setActivities((previous) => [
      {
        id: makeFrontendId("ACT"),
        time: "Just now",
        ...activity,
      },
      ...previous,
    ]);
  };

  const handleMetricClick = (metric) => {
    setActiveModal(metric.id);
  };

  const handleQuickAction = (action) => {
    if (action.path) {
      navigate(action.path);
      return;
    }

    setActiveModal(action.id);
  };

  const handleCreateEmployee = (form) => {
    const employee = {
      id: makeFrontendId("EMP"),
      name: form.name.trim().toUpperCase(),
      department: form.department,
      role: form.role.trim(),
      status: form.status,
      email: form.email.trim().toLowerCase(),
      shift: form.shift,
    };

    setEmployees((previous) => [employee, ...previous]);
    setEmployeeCount((previous) => previous + 1);

    if (form.status === "Present") {
      setAttendance((previous) => ({
        ...previous,
        present: previous.present + 1,
      }));
    }

    addActivity({
      type: "employee",
      user: fullName,
      action: `created frontend employee ${employee.name}`,
      details: `Assigned as ${employee.role} in ${employee.department}.`,
    });
    showToast({
      title: "Frontend Employee Added",
      message: `${employee.name} was added to temporary dashboard state.`,
    });
  };

  const handleCreateDepartment = (form) => {
    const department = {
      id: makeFrontendId("DEP"),
      name: form.name.trim(),
      head: form.head.trim(),
      budget: form.budget.trim().startsWith("$")
        ? form.budget.trim()
        : `$${form.budget.trim()}`,
      location: form.location.trim(),
      headcount: Number(form.headcount || 0),
    };

    setDepartments((previous) => [...previous, department]);
    setDepartmentCount((previous) => previous + 1);
    addActivity({
      type: "department",
      user: fullName,
      action: `created frontend department ${department.name}`,
      details: `Led by ${department.head}; preview budget ${department.budget}.`,
    });
    showToast({
      title: "Frontend Department Added",
      message: `${department.name} was added to temporary dashboard state.`,
    });
  };

  const handleCompleteInterview = (interviewId) => {
    setInterviews((previous) =>
      previous.map((interview) =>
        interview.id === interviewId
          ? { ...interview, status: "Completed" }
          : interview,
      ),
    );
  };

  const handleDismissNotification = (notificationId) => {
    setNotifications((previous) =>
      previous.filter((notification) => notification.id !== notificationId),
    );
    showToast({
      title: "Notification Dismissed",
      message: "The notification was removed from frontend state.",
    });
  };

  const handleNotificationAction = (notification) => {
    if (notification.id === "NOT-001") {
      navigate(EXISTING_ADMIN_ROUTES.leaves);
      return;
    }

    if (notification.id === "NOT-002") {
      setAttendance((previous) => ({
        ...previous,
        present: previous.present + 3,
        lastSync: "Just now",
      }));
      setNotifications((previous) =>
        previous.filter((item) => item.id !== notification.id),
      );
      addActivity({
        type: "system",
        user: "Biometric Preview",
        action: "completed a frontend attendance re-sync",
        details: "Three temporary attendance records were reconciled.",
      });
      showToast({
        title: "Attendance Preview Re-synced",
        message: "The attendance scenario was updated in frontend state.",
      });
      return;
    }

    navigate(EXISTING_ADMIN_ROUTES.hiringOverview);
  };

  const handleSyncActivity = () => {
    addActivity({
      type: "system",
      user: "Dashboard Preview",
      action: "refreshed local activity cards",
      details: "No backend request was made.",
    });
    showToast({
      title: "Activity Refreshed",
      message: "Frontend activity cards were refreshed.",
    });
  };

  if (loading || !user || !isAdminSide) {
    return (
      <div className={pageShellClass}>
        <div className="shrink-0">
          <Header />
        </div>
        <main className={mainShellClass}>
          <DashboardLoadingSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className={pageShellClass}>
      <div className="shrink-0">
        <Header />
      </div>

      <main className={mainShellClass}>
        <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">
          <DashboardWelcome
            title={dashboardTitle}
            fullName={fullName}
            onOpenEmployees={() => navigate(EXISTING_ADMIN_ROUTES.employees)}
          />

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {metricCards.map((metric, index) => (
              <DashboardMetricCard
                key={metric.id}
                item={metric}
                onClick={() => handleMetricClick(metric)}
                delay={80 + index * 55}
              />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-8">
              <RecentActivityPanel
                activities={activities}
                onSync={handleSyncActivity}
                delay={210}
                onViewAll={() =>
                  showToast({
                    title: "Activity Preview",
                    message: "All available frontend activity is already displayed.",
                  })
                }
              />

              <NotificationsPanel
                notifications={notifications}
                onDismiss={handleDismissNotification}
                onAction={handleNotificationAction}
                delay={260}
                onViewAll={() => navigate(EXISTING_ADMIN_ROUTES.approvals)}
              />
            </div>

            <aside className="space-y-5 lg:col-span-4">
              <QuickActionsPanel
                actions={quickActions}
                onAction={handleQuickAction}
                delay={310}
              />
              <WorkforceKpiCard
                utilization={95.4}
                absenteeismBuffer={-4.7}
                delay={360}
              />
            </aside>
          </section>
        </div>
      </main>

      <DashboardModalManager
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        employees={employees}
        departments={departments}
        attendance={attendance}
        interviews={interviews}
        payroll={PAYROLL_PREVIEW}
        reports={REPORT_PREVIEW}
        onCreateEmployee={handleCreateEmployee}
        onCreateDepartment={handleCreateDepartment}
        onCompleteInterview={handleCompleteInterview}
        onToast={showToast}
      />

      <DashboardToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
