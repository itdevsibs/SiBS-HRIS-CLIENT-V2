import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  CreditCard,
  FileText,
  Info,
  LoaderCircle,
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
  getHrDashboardDetail,
  getHrDashboardFeed,
  getHrDashboardOverview,
} from "../../../lib/axios/getHrDashboard";

import {
  DashboardMetricCard,
  DashboardToast,
  DashboardWelcome,
  NotificationsPanel,
  QuickActionsPanel,
  RecentActivityPanel,
  WorkforceKpiCard,
} from "./AdminDashboardComponents";
import { DashboardModalManager } from "../../../components/modals/dashboard/AdminDashboardModals";
import {
  EMPTY_OVERVIEW,
  normalizeDashboardOverview,
} from "./adminDashboardData";

const EXISTING_ADMIN_ROUTES = {
  employees: "/employee",
  departments: "/employee",
  attendance: "/attendance",
  reports: "/recruitment/weekly-reports",
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

const notificationIconMap = {
  leave: ShieldAlert,
  hiring: AlertTriangle,
  document: FileText,
  calendar: Calendar,
  employee: UserCheck,
  info: Info,
};

const pageShellClass = "sibs-dashboard-shell";
const mainShellClass = "sibs-dashboard-main-wide";
const AUTO_REFRESH_INTERVAL_MS = 60_000;

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

function formatPercent(value) {
  const number = Number(value || 0);
  return `${Number.isFinite(number) ? number.toFixed(1) : "0.0"}%`;
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}


function HRDashboardLoadingState() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#e8eef5] px-6 py-10">
      <div
        className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-[#dfe7ef] bg-white px-8 py-10 text-center shadow-sm"
        role="status"
        aria-live="polite"
        aria-label="Loading HR dashboard"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
          <LoaderCircle
            className="h-8 w-8 animate-spin text-[#ff5c28]"
            aria-hidden="true"
          />
        </div>

        <h2 className="mt-5 text-lg font-extrabold text-[#042c51]">
          Loading HR Dashboard
        </h2>

        <p className="mt-2 max-w-[300px] text-sm font-medium leading-6 text-[#667085]">
          Loading current workforce information and dashboard metrics...
        </p>
      </div>
    </div>
  );
}

function mergeDashboardFeed(previous, payload = {}) {
  const nextReports =
    payload?.reports && typeof payload.reports === "object"
      ? payload.reports
      : {};

  return {
    ...previous,
    recentActivities: Array.isArray(payload?.recentActivities)
      ? payload.recentActivities
      : previous.recentActivities,
    notifications: Array.isArray(payload?.notifications)
      ? payload.notifications
      : previous.notifications,
    notificationCounts:
      payload?.notificationCounts &&
      typeof payload.notificationCounts === "object"
        ? payload.notificationCounts
        : previous.notificationCounts,
    reports: {
      ...(previous.reports || {}),
      ...nextReports,
      distribution: previous.reports?.distribution || [],
    },
  };
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useUser();
  const { ADMIN_ROLES } = useAdmin();
  const { markNotificationSeen } = useSidebarNotifications() || {};

  const [activeModal, setActiveModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [overview, setOverview] = useState(EMPTY_OVERVIEW);
  const [initialLoadFinished, setInitialLoadFinished] = useState(false);
  const initialLoadFinishedRef = useRef(false);
  const [overviewRefreshing, setOverviewRefreshing] = useState(false);
  const [feedRefreshing, setFeedRefreshing] = useState(false);
  const [overviewError, setOverviewError] = useState("");
  const [detailState, setDetailState] = useState({
    data: null,
    loading: false,
    error: "",
  });

  const overviewRequestIdRef = useRef(0);
  const feedRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);
  const overviewLoadingRef = useRef(false);
  const feedLoadingRef = useRef(false);
  const detailQueryRef = useRef({ page: 1, limit: 15, search: "" });

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

  const showToast = useCallback((nextToast) => {
    setToast(
      typeof nextToast === "string"
        ? { title: "Dashboard Update", message: nextToast }
        : nextToast,
    );
  }, []);

  const refreshOverview = useCallback(
    async ({ manual = false, forceRefresh = false } = {}) => {
      if (overviewLoadingRef.current) return false;

      overviewLoadingRef.current = true;
      const requestId = ++overviewRequestIdRef.current;
      setOverviewRefreshing(true);

      try {
        const payload = await getHrDashboardOverview({ forceRefresh });

        if (requestId !== overviewRequestIdRef.current) return false;

        setOverview((previous) => {
          const nextOverview = normalizeDashboardOverview(payload);

          return {
            ...nextOverview,
            recentActivities: previous.recentActivities || [],
            notifications: previous.notifications || [],
            notificationCounts: previous.notificationCounts || {},
            reports: {
              ...(nextOverview.reports || {}),
              conversion: previous.reports?.conversion || [],
            },
          };
        });
        setOverviewError("");

        if (manual) {
          showToast({
            title: "Dashboard Refreshed",
            message: "The latest HRIS records were loaded successfully.",
          });
        }

        return true;
      } catch (error) {
        if (requestId !== overviewRequestIdRef.current) return false;

        const message = getErrorMessage(
          error,
          "Unable to load the HR dashboard.",
        );
        setOverviewError(message);

        if (manual || initialLoadFinishedRef.current) {
          showToast({
            title: "Refresh Failed",
            message: "The last successful dashboard data remains visible.",
          });
        }

        return false;
      } finally {
        if (requestId === overviewRequestIdRef.current) {
          setOverviewRefreshing(false);
          initialLoadFinishedRef.current = true;
          setInitialLoadFinished(true);
        }
        overviewLoadingRef.current = false;
      }
    },
    [showToast],
  );

  const refreshFeed = useCallback(async ({ forceRefresh = false } = {}) => {
    if (feedLoadingRef.current) return false;

    feedLoadingRef.current = true;
    const requestId = ++feedRequestIdRef.current;
    setFeedRefreshing(true);

    try {
      const payload = await getHrDashboardFeed({ forceRefresh });

      if (requestId !== feedRequestIdRef.current) return false;

      setOverview((previous) => mergeDashboardFeed(previous, payload));
      return true;
    } catch (error) {
      if (requestId !== feedRequestIdRef.current) return false;

      console.warn(
        "[HR Dashboard] Activity and notification feed failed:",
        getErrorMessage(error, "Unable to load dashboard feed."),
      );
      return false;
    } finally {
      if (requestId === feedRequestIdRef.current) {
        setFeedRefreshing(false);
      }
      feedLoadingRef.current = false;
    }
  }, []);

  const loadDetail = useCallback(async (modalId, nextQuery = {}) => {
    const query = {
      ...detailQueryRef.current,
      ...nextQuery,
    };
    detailQueryRef.current = query;

    const requestId = ++detailRequestIdRef.current;
    setDetailState((previous) => ({
      ...previous,
      loading: true,
      error: "",
    }));

    try {
      const payload = await getHrDashboardDetail(modalId, query);

      if (requestId !== detailRequestIdRef.current) return;

      setDetailState({
        data: payload,
        loading: false,
        error: "",
      });
    } catch (error) {
      if (requestId !== detailRequestIdRef.current) return;

      setDetailState((previous) => ({
        ...previous,
        loading: false,
        error: getErrorMessage(
          error,
          "Unable to load dashboard detail records.",
        ),
      }));
    }
  }, []);

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
    if (loading || !user || !isAdminSide) return;

    refreshOverview();
  }, [loading, user, isAdminSide, refreshOverview]);

  useEffect(() => {
    if (loading || !user || !isAdminSide || !initialLoadFinished) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      refreshFeed();
    }, 150);

    return () => window.clearTimeout(timer);
  }, [
    loading,
    user,
    isAdminSide,
    initialLoadFinished,
    refreshFeed,
  ]);

  useEffect(() => {
    if (loading || !user || !isAdminSide) return undefined;

    const refreshVisibleDashboard = async () => {
      if (document.visibilityState !== "visible") return;

      const overviewLoaded = await refreshOverview();

      if (overviewLoaded) {
        refreshFeed();
      }
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        refreshVisibleDashboard();
      }
    };

    const interval = window.setInterval(
      refreshVisibleDashboard,
      AUTO_REFRESH_INTERVAL_MS,
    );

    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loading, user, isAdminSide, refreshOverview, refreshFeed]);

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

  const notifications = useMemo(
    () =>
      overview.notifications.map((notification) => ({
        ...notification,
        icon:
          notificationIconMap[notification.icon] ||
          notificationIconMap.info,
      })),
    [overview.notifications],
  );

  const metricCards = [
    {
      id: "employees",
      label: "Employees",
      value: formatNumber(overview.metrics.employees),
      description: "Active employee records",
      icon: Users,
      tone: "orange",
    },
    {
      id: "departments",
      label: "Departments",
      value: formatNumber(overview.metrics.departments),
      description: "Departments with active staff",
      icon: Building2,
      tone: "navy",
    },
    {
      id: "attendance",
      label: "Attendance",
      value: formatNumber(overview.metrics.attendancePresent),
      description: "Present today",
      icon: UserCheck,
      tone: "green",
      badge: formatPercent(overview.metrics.attendanceRate),
    },
    {
      id: "interviews",
      label: "Interviews Today",
      value: formatNumber(overview.metrics.interviewsToday),
      description: "Scheduled candidate interviews",
      icon: Calendar,
      tone: "indigo",
    },
    {
      id: "payroll",
      label: "Payroll",
      value: formatNumber(overview.metrics.payrollEligible),
      description: "Payroll-eligible employees",
      icon: CreditCard,
      tone: "amber",
    },
  ];

  const quickActions = [
    {
      id: "add-employee",
      title: "Employee Directory",
      description: "Open active employee records",
      icon: UserPlus,
      path: EXISTING_ADMIN_ROUTES.employees,
    },
    {
      id: "create-department",
      title: "Department Records",
      description: "View departments through employee records",
      icon: Building2,
      path: EXISTING_ADMIN_ROUTES.departments,
    },
    {
      id: "attendance-route",
      title: "Attendance Dashboard",
      description: "Open the full attendance module",
      icon: Clock,
      path: EXISTING_ADMIN_ROUTES.attendance,
    },
    {
      id: "reports",
      title: "View Reports",
      description: "Open HR and recruitment reports",
      icon: FileText,
      path: EXISTING_ADMIN_ROUTES.reports,
    },
  ];

  const handleMetricClick = useCallback(
    (metric) => {
      detailQueryRef.current = { page: 1, limit: 15, search: "" };
      setActiveModal(metric.id);
      setDetailState({ data: null, loading: true, error: "" });
      loadDetail(metric.id, detailQueryRef.current);
    },
    [loadDetail],
  );

  const handleQuickAction = useCallback(
    (action) => {
      if (action.path) navigate(action.path);
    },
    [navigate],
  );

  const handleNotificationAction = useCallback(
    (notification) => {
      navigate(notification.path || EXISTING_ADMIN_ROUTES.approvals);
    },
    [navigate],
  );

  const handleDetailSearch = useCallback(
    (search) => {
      if (!activeModal || activeModal === "attendance") return;

      const cleanSearch = String(search || "").trim();
      if (
        cleanSearch === detailQueryRef.current.search &&
        detailQueryRef.current.page === 1 &&
        detailState.data
      ) {
        return;
      }

      loadDetail(activeModal, {
        page: 1,
        search: cleanSearch,
      });
    },
    [activeModal, detailState.data, loadDetail],
  );

  const handleDetailPageChange = useCallback(
    (page) => {
      if (!activeModal || activeModal === "attendance") return;
      loadDetail(activeModal, { page });
    },
    [activeModal, loadDetail],
  );

  const handleCloseModal = useCallback(() => {
    detailRequestIdRef.current += 1;
    setActiveModal(null);
    setDetailState({ data: null, loading: false, error: "" });
  }, []);

  if (loading || !user || !isAdminSide || !initialLoadFinished) {
    return <HRDashboardLoadingState />;
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

          {overviewError ? (
            <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
              <span className="font-extrabold">Dashboard data warning:</span>{" "}
              {overviewError}. The last successful values remain visible.
            </section>
          ) : null}

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
                activities={overview.recentActivities}
                onSync={() => {
                  refreshOverview({ manual: true, forceRefresh: true });
                  refreshFeed({ forceRefresh: true });
                }}
                isSyncing={overviewRefreshing || feedRefreshing}
                delay={210}
                onViewAll={() => navigate(EXISTING_ADMIN_ROUTES.approvals)}
              />

              <NotificationsPanel
                notifications={notifications}
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
                utilization={overview.workforceKpi.utilization}
                absenteeismBuffer={overview.workforceKpi.absenteeismBuffer}
                delay={360}
              />
            </aside>
          </section>
        </div>
      </main>

      <DashboardModalManager
        activeModal={activeModal}
        onClose={handleCloseModal}
        detail={detailState.data}
        loading={detailState.loading}
        error={detailState.error}
        onSearch={handleDetailSearch}
        onPageChange={handleDetailPageChange}
        generatedAt={overview.generatedAt}
      />

      <DashboardToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
