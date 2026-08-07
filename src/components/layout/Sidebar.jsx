import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion as framerMotion } from "framer-motion";
import {
  Activity,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleUser,
  ClipboardCheck,
  ClipboardList,
  Clock,
  DollarSign,
  FileClock,
  FileCog,
  FileText,
  Gift,
  LayoutDashboard,
  MapPin,
  Menu,
  PieChart,
  Table2,
  UserCog,
  Users,
  X,
} from "lucide-react";

import { useUser } from "../../services/context/UserContext";
import { useSidebarNotifications } from "../../services/context/SidebarNotificationContext";
import { getApprovalRequestsByModule } from "../../lib/axios/getApprovalRequest";
import { getJobDescriptions } from "../../lib/axios/getJobDescription";
import { getJobDescriptionApprovalUsers } from "../../lib/axios/getJobDescriptionApprovalSettings";
import { getHiringNeedsApprovalUsers } from "../../lib/axios/getHiringNeedsApprovalSettings";
import { getAvailablePositionApprovalUsers } from "../../lib/axios/getAvailablePositionApprovalSettings";
import { buildSidebarBadgeText } from "../../lib/utils/sidebarNotifications";
import { DASHBOARD_ACCESS, getDefaultDashboardPath } from "../../config/accessControl";

const APPROVAL_MODULES = [
  "Attrition",
  "Job Description",
  "Hiring Needs",
  "Available Positions",
];

const APPROVAL_NOTIFICATION_TYPES_BY_MODULE = {
  Attrition: ["Resignation", "Attrition"],
  "Job Description": ["Job Description"],
  "Hiring Needs": ["Hiring Needs"],
  "Available Positions": ["Available Position"],
};

const sidebarBadgeToneClass = {
  info: "bg-[#063560] text-slate-200",
  action: "bg-sibs-primary-2 text-white",
  urgent: "bg-red-500 text-white",
  warning: "bg-amber-500 text-white",
};

const APPROVAL_MODULE_ACCESS = {
  Attrition: [1, 2, 3, 4, 5, 6, 7],
};

const APPROVAL_SETTINGS_API_BY_MODULE = {
  "Job Description": getJobDescriptionApprovalUsers,
  "Hiring Needs": getHiringNeedsApprovalUsers,
  "Available Positions": getAvailablePositionApprovalUsers,
};

const MotionDiv = framerMotion.div;
const MotionSpan = framerMotion.span;

function normalizeSibsId(value = "") {
  return String(value ?? "")
    .trim()
    .replace(/^SIBS[-_ ]?/i, "");
}

function normalizeRole(value = "") {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getAdminAccess(user = {}) {
  return Number(
    user?.adminAccess ??
      user?.admin_access ??
      user?.access ??
      user?.gy_user_access ??
      user?.gyUserAccess ??
      0,
  );
}

function getCurrentUserSibsId(user = {}) {
  return normalizeSibsId(
    user?.sibsId ||
      user?.sibs_id ||
      user?.employeeSibsId ||
      user?.employee_sibs_id ||
      user?.gy_emp_code ||
      user?.gy_user_code ||
      user?.userCode ||
      user?.user_code ||
      user?.employeeCode ||
      user?.employee_code ||
      user?.username ||
      "",
  );
}

function getApprovalSettingsRows(responseData) {
  const rows =
    responseData?.data?.users ||
    responseData?.data?.rows ||
    responseData?.data ||
    responseData?.users ||
    responseData?.rows ||
    responseData ||
    [];

  return Array.isArray(rows) ? rows : [];
}

function getApprovalSettingsSibsId(row = {}) {
  return normalizeSibsId(
    row?.sibsId ||
      row?.sibs_id ||
      row?.employeeSibsId ||
      row?.employee_sibs_id ||
      row?.gy_emp_code ||
      row?.gy_user_code ||
      row?.userCode ||
      row?.user_code ||
      row?.username ||
      "",
  );
}

async function canCountApprovalModuleForUser(moduleName, user) {
  if (!user) return false;

  if (moduleName === "Attrition") {
    const allowedUsers = APPROVAL_MODULE_ACCESS.Attrition || [];
    return allowedUsers.includes(getAdminAccess(user));
  }

  const getApprovalUsers = APPROVAL_SETTINGS_API_BY_MODULE[moduleName];

  if (!getApprovalUsers) return false;

  const currentUserSibsId = getCurrentUserSibsId(user);

  if (!currentUserSibsId) return false;

  try {
    const result = await getApprovalUsers();
    const rows = getApprovalSettingsRows(result);

    return rows.some((row) => {
      return (
        getApprovalSettingsSibsId(row).toLowerCase() ===
        currentUserSibsId.toLowerCase()
      );
    });
  } catch (error) {
    console.error(`Sidebar ${moduleName} approval access error:`, error);
    return false;
  }
}

function getApprovalApiModuleName(moduleName = "") {
  return moduleName === "Available Positions"
    ? "Available Position"
    : moduleName;
}

function normalizeApprovalNotificationStatus(value) {
  const cleanValue = String(value || "")
    .trim()
    .toLowerCase();

  if (cleanValue === "approved") return "Approved";
  if (cleanValue === "for review") return "For Review";
  if (cleanValue === "rejected") return "Rejected";
  if (cleanValue === "declined") return "Rejected";
  if (cleanValue === "retained") return "Rejected";
  if (cleanValue === "pending") return "Pending";

  return "Pending";
}

function normalizeJobDescriptionStatus(value) {
  const cleanValue = String(value || "").trim();

  if (cleanValue === "New JD") return "New Job Description";
  if (cleanValue === "Archived JD") return "Archived";

  return cleanValue || "New Job Description";
}

function getJobDescriptionStatus(item = {}) {
  const raw = item.raw || {};

  return normalizeJobDescriptionStatus(
    item.jdStatus ||
      item.jd_status ||
      raw.jdStatus ||
      raw.jd_status ||
      item.status ||
      raw.status,
  );
}

function getApprovalNotificationStatus(item = {}) {
  const raw = item.raw || {};

  return normalizeApprovalNotificationStatus(
    item.status ||
      item.recruitmentSettingsStatus ||
      item.recruitment_settings_status ||
      item.updateHeadcountStatus ||
      item.update_headcount_status ||
      raw.status ||
      raw.recruitmentSettingsStatus ||
      raw.recruitment_settings_status ||
      raw.updateHeadcountStatus ||
      raw.update_headcount_status ||
      "",
  );
}

function getApprovalNotificationKey(moduleName, item = {}) {
  return [
    moduleName,
    item.source || item.module || "approval",
    item.rawId || item.raw_id || item.id || "",
    item.type || item.requestType || item.request_type || "",
  ].join("::");
}

function countApprovalNotificationData(moduleName, data = []) {
  const uniqueItems = new Map();

  data.forEach((item) => {
    const key = getApprovalNotificationKey(moduleName, item);

    if (!uniqueItems.has(key)) {
      uniqueItems.set(key, item);
    }
  });

  return Array.from(uniqueItems.values()).filter((item) => {
    const status = getApprovalNotificationStatus(item);

    return status === "Pending" || status === "For Review";
  }).length;
}

async function getApprovalNotificationCountByModule(moduleName) {
  if (moduleName === "Job Description") {
    const result = await getJobDescriptions({
      page: 1,
      limit: 500,
      search: "",
      status: "",
    });

    if (!result?.success || !Array.isArray(result.data)) {
      return 0;
    }

    return result.data.filter(
      (item) => getJobDescriptionStatus(item) === "For Approval",
    ).length;
  }

  const types = APPROVAL_NOTIFICATION_TYPES_BY_MODULE[moduleName] || [""];

  const results = await Promise.allSettled(
    types.map((type) =>
      getApprovalRequestsByModule(getApprovalApiModuleName(moduleName), {
        page: 1,
        limit: 500,
        search: "",
        status: "",
        type,
      }),
    ),
  );

  const fulfilledResults = results
    .filter((item) => item.status === "fulfilled")
    .map((item) => item.value)
    .filter((result) => result?.success);

  const mergedData = fulfilledResults.flatMap((result) =>
    Array.isArray(result?.data) ? result.data : [],
  );

  if (mergedData.length > 0) {
    return countApprovalNotificationData(moduleName, mergedData);
  }

  return fulfilledResults.reduce((sum, result) => {
    const counts = result?.counts || {};

    return sum + Number(counts.pending || 0) + Number(counts.forReview || 0);
  }, 0);
}

function SibsLogo({ collapsed = false, isMobile = false }) {
  const showText = !collapsed || isMobile;

  return (
    <MotionDiv
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      whileHover={{ scale: 1.025 }}
      className={[
        "flex min-w-0 select-none items-center",
        showText ? "gap-3" : "justify-center",
      ].join(" ")}
    >
      <MotionDiv
        whileHover={{ rotate: -3, scale: 1.05 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-sibs-primary-2 shadow-[0_10px_24px_rgba(255,92,40,0.22)]"
      >
        <MotionDiv
          className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-sibs-primary-1"
          animate={{
            backgroundColor: ["#FFFFFF", "#FFB29A", "#FFFFFF"],
            boxShadow: [
              "0 0 0px rgba(255,255,255,0)",
              "0 0 14px rgba(255,255,255,0.45)",
              "0 0 0px rgba(255,255,255,0)",
            ],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <MotionSpan
          className="relative text-[20px] font-semibold leading-none tracking-[-0.04em] text-white"
          animate={{
            textShadow: [
              "0 0 0px rgba(255,255,255,0)",
              "0 0 10px rgba(255,255,255,0.38)",
              "0 0 0px rgba(255,255,255,0)",
            ],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          S
        </MotionSpan>
      </MotionDiv>

      {showText && (
        <div className="min-w-0 leading-none">
          <div className="flex min-w-0 items-baseline whitespace-nowrap">
            <span className="text-[22px] font-semibold tracking-[-0.035em] text-white">
              SiBS&nbsp;
            </span>
            <span className="text-[22px] font-semibold tracking-[-0.035em] text-sibs-primary-2">
              HRIS
            </span>
          </div>

          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-300/80">
            Human Resource System
          </p>
        </div>
      )}
    </MotionDiv>
  );
}

export default function Sidebar() {
  const { user, loading } = useUser();
  const sidebarNotifications = useSidebarNotifications();
  const getNotification = sidebarNotifications?.getNotification;
  const setSidebarNotification = sidebarNotifications?.setSidebarNotification;

  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();

  const ADMIN_ROLES = useMemo(
    () => [
      "admin",
      "ta",
      "hr",
      "hr_admin",
      "hradmin",
      "finance",
      "manager",
      "executive",
      "super_admin",
      "superadmin",
      "super_administrator",
    ],
    [],
  );

  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [
    approvalRequestNotificationCount,
    setApprovalRequestNotificationCount,
  ] = useState(0);

  const loadApprovalRequestNotifications = useCallback(async () => {
    try {
      const moduleAccessResults = await Promise.all(
        APPROVAL_MODULES.map(async (moduleName) => {
          const canCount = await canCountApprovalModuleForUser(moduleName, user);

          return {
            moduleName,
            canCount,
          };
        }),
      );

      const accessibleApprovalModules = moduleAccessResults
        .filter((item) => item.canCount)
        .map((item) => item.moduleName);

      if (accessibleApprovalModules.length === 0) {
        setApprovalRequestNotificationCount(0);
        setSidebarNotification?.("jobDescriptionApprovals", null);
        setSidebarNotification?.("hiringNeedsApprovals", null);
        setSidebarNotification?.("availablePositionApprovals", null);
        setSidebarNotification?.("approvalRequests", null);
        return;
      }

      const moduleCounts = await Promise.all(
        accessibleApprovalModules.map((moduleName) =>
          getApprovalNotificationCountByModule(moduleName),
        ),
      );

      const moduleCountByName = accessibleApprovalModules.reduce(
        (countsByName, moduleName, index) => ({
          ...countsByName,
          [moduleName]: Number(moduleCounts[index] || 0),
        }),
        {},
      );
      const jobDescriptionPending = Number(
        moduleCountByName["Job Description"] || 0,
      );
      const hiringNeedsPending = Number(moduleCountByName["Hiring Needs"] || 0);
      const availablePositionsPending = Number(
        moduleCountByName["Available Positions"] || 0,
      );
      const centralApprovalPending = ["Attrition", "Job Description"].reduce(
        (sum, moduleName) => sum + Number(moduleCountByName[moduleName] || 0),
        0,
      );

      setApprovalRequestNotificationCount(centralApprovalPending);
      setSidebarNotification?.(
        "jobDescriptionApprovals",
        jobDescriptionPending > 0
          ? {
              name: "Job Description",
              count: jobDescriptionPending,
              tone: "urgent",
              title: `${jobDescriptionPending > 99 ? "99+" : jobDescriptionPending} job descriptions for approval`,
            }
          : null,
      );
      setSidebarNotification?.(
        "hiringNeedsApprovals",
        hiringNeedsPending > 0
          ? {
              name: "Hiring Needs Intake",
              count: hiringNeedsPending,
              tone: "urgent",
              title: `${hiringNeedsPending > 99 ? "99+" : hiringNeedsPending} hiring needs for approval`,
            }
          : null,
      );
      setSidebarNotification?.(
        "availablePositionApprovals",
        availablePositionsPending > 0
          ? {
              name: "Available Positions",
              count: availablePositionsPending,
              tone: "urgent",
              title: `${availablePositionsPending > 99 ? "99+" : availablePositionsPending} available positions for approval`,
            }
          : null,
      );
      setSidebarNotification?.(
        "approvalRequests",
        centralApprovalPending > 0
          ? {
              name: "Approval Requests",
              count: centralApprovalPending,
              label: "PENDING",
              tone: "urgent",
              title: `${centralApprovalPending > 99 ? "99+" : centralApprovalPending} pending approval requests`,
            }
          : null,
      );
    } catch (error) {
      console.error("Sidebar approval request notification error:", error);
      setApprovalRequestNotificationCount(0);
      setSidebarNotification?.("jobDescriptionApprovals", null);
      setSidebarNotification?.("hiringNeedsApprovals", null);
      setSidebarNotification?.("availablePositionApprovals", null);
      setSidebarNotification?.("approvalRequests", null);
    }
  }, [setSidebarNotification, user]);

  useEffect(() => {
    const mountedTimer = window.setTimeout(() => {
      setMounted(true);
    }, 0);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.clearTimeout(mountedTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [mounted, user, loading, navigate]);

  useEffect(() => {
    if (!mounted || loading || !user) return;

    if (normalizeRole(user.role) === "employee") {
      const allowed = [
        "/dashboard/employee",
        "/attendance",
        "/leaves",
        "/profile",
        "/profile/user",
        "/schedule",
        "/resignation",
      ];

      const ok = allowed.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`),
      );

      if (!ok) {
        navigate("/dashboard/employee", { replace: true });
      }

      return;
    }

    if (
      ADMIN_ROLES.includes(normalizeRole(user.role)) &&
      pathname.startsWith("/dashboard/employee")
    ) {
      navigate(getDefaultDashboardPath(user), { replace: true });
    }
  }, [mounted, user, loading, pathname, navigate, ADMIN_ROLES]);

  useEffect(() => {
    if (isMobile) {
      const closeTimer = window.setTimeout(() => {
        setMobileOpen(false);
      }, 0);

      return () => {
        window.clearTimeout(closeTimer);
      };
    }

    return undefined;
  }, [pathname, isMobile]);

  useEffect(() => {
    if (!mounted) return;

    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen, mounted]);

  useEffect(() => {
    if (!mounted || loading || !user) return;

    if (!ADMIN_ROLES.includes(normalizeRole(user.role))) {
      const resetTimer = window.setTimeout(() => {
        setApprovalRequestNotificationCount(0);
        setSidebarNotification?.("jobDescriptionApprovals", null);
        setSidebarNotification?.("hiringNeedsApprovals", null);
        setSidebarNotification?.("availablePositionApprovals", null);
        setSidebarNotification?.("approvalRequests", null);
      }, 0);

      return () => {
        window.clearTimeout(resetTimer);
      };
    }

    const initialLoadTimer = window.setTimeout(() => {
      loadApprovalRequestNotifications();
    }, 0);

    const interval = window.setInterval(() => {
      loadApprovalRequestNotifications();
    }, 30000);

    return () => {
      window.clearTimeout(initialLoadTimer);
      window.clearInterval(interval);
    };
  }, [
    mounted,
    loading,
    user,
    pathname,
    ADMIN_ROLES,
    loadApprovalRequestNotifications,
    setSidebarNotification,
  ]);

  const employeeCoreMenu = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard/employee",
    },
    {
      name: "My Profile",
      icon: CircleUser,
      path: "/profile/user",
    },
    {
      name: "My Attendance",
      icon: Clock,
      path: "/attendance",
    },
    {
      name: "My Schedule",
      icon: CalendarDays,
      path: "/schedule",
    },
    {
      name: "My Leaves",
      icon: Calendar,
      path: "/leaves",
      notificationKey: "leaves",
    },
  ];

  const adminCoreMenu = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard/super-admin",
      allowedUsers: DASHBOARD_ACCESS.SUPER_ADMIN,
    },
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard/admin",
      allowedUsers: DASHBOARD_ACCESS.HR,
      notificationKey: "hrDashboard",
    },
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/recruitment/ta-dashboard",
      allowedUsers: DASHBOARD_ACCESS.TA,
    },
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/recruitment/om-dashboard",
      allowedUsers: DASHBOARD_ACCESS.OM,
    },
    {
      name: "Employee Directory",
      icon: Users,
      path: "/employee",
      allowedUsers: [1, 2, 3, 4, 5, 6, 7],
    },
    {
      name: "Time & Attendance",
      icon: Clock,
      path: "/attendance",
      allowedUsers: [1, 2, 3, 4, 5, 6, 7],
    },
    {
      name: "Leaves",
      icon: Calendar,
      path: "/leaves",
      allowedUsers: [1, 2, 3, 4, 5, 6, 7],
      notificationKey: "leaves",
    },
    {
      name: "Resignation Management",
      icon: FileText,
      path: "/resignation",
      allowedUsers: [1, 2, 3, 4, 5, 6, 7],
    },
  ];

  const recruitmentMenu = [
    {
      name: "Workforce & Hiring Overview",
      icon: CalendarDays,
      path: "/recruitment/workforce-hiring-overview",
      allowedUsers: [3, 5, 6, 7],
      notificationKey: "workforceHiringOverview",
    },
    {
      name: "Workforce & Hiring Plan",
      icon: CalendarDays,
      path: "/recruitment/workforce-hiring-plan",
      allowedUsers: [3, 5, 6, 7],
    },
    {
      name: "Job Description",
      icon: ClipboardList,
      path: "/recruitment/job-description",
      allowedUsers: [1, 2, 3, 6, 7],
      notificationKey: "jobDescriptionApprovals",
    },
    {
      name: "Hiring Needs Intake",
      icon: FileText,
      path: "/recruitment/hiring-needs",
      allowedUsers: [1, 2, 3, 5, 6, 7],
      notificationKey: "hiringNeedsApprovals",
    },
    {
      name: "Available Positions",
      icon: BriefcaseBusiness,
      path: "/recruitment/available-positions",
      allowedUsers: [1, 2, 3, 7],
      notificationKey: "availablePositionApprovals",
    },
    {
      name: "Sourcing Analytics",
      icon: BarChart3,
      path: "/recruitment/sourcing-analytics",
      allowedUsers: [1, 2, 3, 6, 7],
    },
    {
      name: "Talent Pool",
      icon: Users,
      path: "/recruitment/talent-pool",
      allowedUsers: [1, 2, 3, 6, 7],
    },
    {
      name: "Candidate Pipeline",
      icon: Table2,
      path: "/recruitment/candidate-pipeline",
      allowedUsers: [1, 2, 3, 6, 7],
    },
    {
      name: "Offers",
      icon: Gift,
      path: "/recruitment/offers",
      allowedUsers: [1, 2, 3, 6, 7],
    },
    {
      name: "Onboarding",
      icon: ClipboardList,
      path: "/recruitment/onboarding",
      allowedUsers: [1, 2, 3, 6, 7],
    },
    {
      name: "Action Items",
      icon: Activity,
      path: "/recruitment/action-items",
      allowedUsers: [1, 2, 3, 6, 7],
    },
    {
      name: "Weekly Reports",
      icon: FileClock,
      path: "/recruitment/weekly-reports",
      allowedUsers: [1, 2, 3, 5, 6, 7],
    },
    {
      name: "Candidate Experience",
      icon: BookOpen,
      path: "/recruitment/candidate-experience",
      allowedUsers: [1, 2, 3, 6, 7],
    },
  ];

  const settingsMenu = [
    {
      name: "Recruitment Settings",
      icon: FileCog,
      path: "/settings/recruitment-settings",
      allowedUsers: [1, 2, 3, 6, 7],
    },
    {
      name: "Account Settings",
      icon: UserCog,
      path: "/settings/account-settings",
      allowedUsers: [7],
    },
  ];

  const communicationMenu = [
    // {
    //   name: "Approval Requests",
    //   icon: ClipboardCheck,
    //   path: "/approval-request",
    //   allowedUsers: [3, 4, 5, 6, 7],
    //   notificationKey: "approvalRequests",
    //   notificationCount: approvalRequestNotificationCount,
    // },
    {
      name: "Email Logs",
      icon: FileClock,
      path: "/email-logs",
      allowedUsers: [1, 2, 3, 4, 5, 6, 7],
    },
  ];

  const analyticsMenu = [
    {
      name: "Reports",
      icon: BarChart3,
      path: "/reports",
      allowedUsers: [1, 2, 3, 4, 5, 6, 7],
    },
    {
      name: "Analytics",
      icon: PieChart,
      path: "/analytics",
      allowedUsers: [1, 2, 3, 4, 5, 6, 7],
    },
    {
      name: "Costs",
      icon: DollarSign,
      path: "/costs",
      allowedUsers: [4, 5, 6, 7],
    },
    {
      name: "Payroll",
      icon: DollarSign,
      path: "/payroll",
      allowedUsers: [4, 5, 6, 7],
    },
  ];

  const administrationMenu = [
    {
      name: "Departments",
      icon: Building2,
      path: "/departments",
      allowedUsers: [5, 6, 7],
    },
    {
      name: "Office Locations",
      icon: MapPin,
      path: "/locations",
      allowedUsers: [5, 6, 7],
    },
  ];

  const isAdminSide = ADMIN_ROLES.includes(normalizeRole(user?.role));
  const coreMenu = isAdminSide ? adminCoreMenu : employeeCoreMenu;
  const coreSectionTitle = isAdminSide ? "CORE HR" : "EMPLOYEE ACCESS";
  const coreSectionShort = isAdminSide ? "HR" : "EMP";

  const getVisibleItems = (items) =>
    items.filter((item) =>
      item.allowedUsers ? item.allowedUsers.includes(getAdminAccess(user)) : true,
    );

  const handleLinkClick = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const renderMenu = (items) =>
    getVisibleItems(items).map((item, index) => {
      const Icon = item.icon;

      const isActive =
        pathname === item.path || pathname.startsWith(`${item.path}/`);

      const sidebarNotification =
        item.notificationKey && typeof getNotification === "function"
          ? getNotification(item.notificationKey)
          : null;
      const notificationCount = Number(item.notificationCount || 0);
      const hasNotification = notificationCount > 0;
      const staticBadge = String(item.badge || "").trim();
      const badgeText =
        staticBadge ||
        buildSidebarBadgeText(sidebarNotification) ||
        (hasNotification
          ? notificationCount > 99
            ? "99+"
            : String(notificationCount)
          : "");
      const badgeTone = sidebarNotification?.tone || "info";
      const badgeClass = isActive
        ? "bg-white text-sibs-primary-2"
        : staticBadge
          ? sidebarBadgeToneClass.info
          : sidebarBadgeToneClass[badgeTone] || sidebarBadgeToneClass.info;
      const badgeTitle = sidebarNotification?.title || badgeText;

      return (
        <Link
          key={`${item.name}-${index}`}
          to={item.path}
          draggable={false}
          onDragStart={(event) => event.preventDefault()}
          onClick={handleLinkClick}
          title={!isMobile && collapsed ? badgeTitle || item.name : badgeTitle}
          aria-label={badgeTitle ? `${item.name}, ${badgeTitle}` : item.name}
          className={[
            "group relative flex min-w-0 select-none items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-semibold leading-4 transition-all duration-150",
            isActive
              ? "bg-sibs-primary-2 text-white font-bold shadow-md shadow-sibs-primary-2/15 cursor-default hover:bg-sibs-primary-2 hover:text-white"
              : "text-slate-300 hover:bg-[#063560] hover:text-white",
            !isMobile && collapsed ? "justify-center px-2" : "",
          ].join(" ")}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="relative shrink-0">
              <Icon
                size={16}
                strokeWidth={1.9}
                draggable={false}
                className={[
                  "pointer-events-none shrink-0 transition",
                  isActive
                    ? "text-white"
                    : "text-slate-400 group-hover:text-white",
                ].join(" ")}
              />

              {badgeText && collapsed && !isMobile && (
                <span
                  className={`absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded px-1 text-[7px] font-extrabold uppercase leading-none ring-2 ring-sibs-primary-1 ${badgeClass}`}
                >
                  {badgeText.length > 2 ? "•" : badgeText}
                </span>
              )}
            </div>

            {(!collapsed || isMobile) && (
              <span
                draggable={false}
                className="pointer-events-none min-w-0 flex-1 whitespace-normal break-words"
              >
                {item.name}
              </span>
            )}
          </div>

          {badgeText && (!collapsed || isMobile) && (
            <span
              className={`ml-auto inline-flex h-5 shrink-0 items-center justify-center rounded px-2 text-[10px] font-bold uppercase leading-none tracking-wide ${badgeClass}`}
            >
              {badgeText}
            </span>
          )}
        </Link>
      );
    });

  const showMenu = mounted && !loading && !!user;

  return (
    <>
      {isMobile && mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar backdrop"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-[75] bg-black/40 lg:hidden"
        />
      )}

      {isMobile && !mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="fixed left-4 top-[19px] z-[85] flex h-9 w-9 items-center justify-center rounded-xl border border-[#083A69] bg-sibs-primary-1 shadow-[0_6px_16px_rgba(0,48,142,0.24)] lg:hidden max-[360px]:h-8 max-[360px]:w-8 max-[360px]:rounded-lg"
          aria-label="Open sidebar"
        >
          <Menu size={18} className="text-white max-[360px]:h-4 max-[360px]:w-4" />
        </button>
      )}

      <aside
        draggable={false}
        onDragStart={(event) => event.preventDefault()}
        className={[
          "fixed left-0 top-0 z-[80] flex h-dvh shrink-0 select-none flex-col border-r border-[#083A69] bg-sibs-primary-1 font-jakarta text-white shadow-xl transition-all duration-300",
          !isMobile && collapsed ? "w-20" : "w-[260px]",
          isMobile
            ? mobileOpen
              ? "translate-x-0 shadow-2xl"
              : "-translate-x-full"
            : "translate-x-0",
          "lg:sticky lg:translate-x-0",
        ].join(" ")}
      >
        <div
          className={[
            "relative flex min-h-[86px] shrink-0 items-center gap-2 border-b border-[#083A69] px-5 py-5",
            !isMobile && collapsed ? "justify-center" : "justify-between",
          ].join(" ")}
        >
          <SibsLogo collapsed={!isMobile && collapsed} isMobile={isMobile} />

          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-300 transition hover:bg-[#063560] hover:text-white active:scale-[0.98]"
              type="button"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}

          {!isMobile && !collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-300 transition hover:bg-[#063560] hover:text-white active:scale-[0.98]"
              type="button"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <ChevronLeft size={18} strokeWidth={2.1} />
            </button>
          )}

          {!isMobile && collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="absolute -right-3 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[#0A477F] bg-[#063560] text-white shadow-[0_6px_18px_rgba(0,0,0,0.28)] transition-all duration-150 hover:border-sibs-primary-2 hover:bg-sibs-primary-2 active:scale-95"
              type="button"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <ChevronRight size={15} strokeWidth={2.4} />
            </button>
          )}
        </div>

        {!showMenu ? (
          <div className="space-y-3 px-4 pt-4">
            <div className="h-8 animate-pulse rounded-lg bg-[#063560]" />
            <div className="h-8 animate-pulse rounded-lg bg-[#063560]" />
            <div className="h-8 animate-pulse rounded-lg bg-[#063560]" />
            <div className="h-8 animate-pulse rounded-lg bg-[#063560]" />
          </div>
        ) : (
          <div className="no-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-3 pb-5 pt-4">
            <Section
              title={coreSectionTitle}
              short={coreSectionShort}
              collapsed={!isMobile && collapsed}
            >
              {renderMenu(coreMenu)}
            </Section>

            {isAdminSide && (
              <>
                {getVisibleItems(recruitmentMenu).length > 0 && (
                  <Section
                    title="RECRUITMENT"
                    short="REC"
                    collapsed={!isMobile && collapsed}
                  >
                    {renderMenu(recruitmentMenu)}
                  </Section>
                )}

                {getVisibleItems(communicationMenu).length > 0 && (
                  <Section
                    title="COMMUNICATIONS"
                    short="COM"
                    collapsed={!isMobile && collapsed}
                  >
                    {renderMenu(communicationMenu)}
                  </Section>
                )}

                {getVisibleItems(analyticsMenu).length > 0 && (
                  <Section
                    title="ANALYTICS"
                    short="ANA"
                    collapsed={!isMobile && collapsed}
                  >
                    {renderMenu(analyticsMenu)}
                  </Section>
                )}

                {getVisibleItems(administrationMenu).length > 0 && (
                  <Section
                    title="ADMINISTRATION"
                    short="ADM"
                    collapsed={!isMobile && collapsed}
                  >
                    {renderMenu(administrationMenu)}
                  </Section>
                )}

                {getVisibleItems(settingsMenu).length > 0 && (
                  <Section
                    title="SETTINGS"
                    short="SET"
                    collapsed={!isMobile && collapsed}
                  >
                    {renderMenu(settingsMenu)}
                  </Section>
                )}
              </>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

function Section({ title, short, collapsed, children }) {
  return (
    <section className="select-none">
      <p
        className={[
          "mb-2 px-3 text-[10px] font-black uppercase leading-none tracking-widest text-slate-400",
          collapsed ? "px-0 text-center text-[9px]" : "",
        ].join(" ")}
      >
        {collapsed ? short : title}
      </p>

      <nav className="space-y-0.5">{children}</nav>
    </section>
  );
}
