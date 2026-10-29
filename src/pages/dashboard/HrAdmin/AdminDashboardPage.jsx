import React, {
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
  MapPin,
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
  getHrDashboardActivities,
  getHrDashboardDetail,
  getHrDashboardFeed,
  getHrDashboardOverview,
} from "../../../lib/axios/getHrDashboard";

import AdminDashboardWelcome from "../../../components/Dashboard/HRAdminDashboard/AdminDashboardWelcome";
import AdminDashboardStats from "../../../components/Dashboard/HRAdminDashboard/AdminDashboardStats";
import AdminDashboardActivity from "../../../components/Dashboard/HRAdminDashboard/AdminDashboardActivity";
import AdminDashboardActivityModal from "../../../components/Dashboard/HRAdminDashboard/AdminDashboardActivityModal";
import AdminDashboardNotifications from "../../../components/Dashboard/HRAdminDashboard/AdminDashboardNotifications";
import AdminDashboardQuickActions from "../../../components/Dashboard/HRAdminDashboard/AdminDashboardQuickActions";
import AdminDashboardWorkforceKpi from "../../../components/Dashboard/HRAdminDashboard/AdminDashboardWorkforceKpi";
import AdminDashboardToast from "../../../components/Dashboard/HRAdminDashboard/AdminDashboardToast";
import { resolveActivityNavigationTarget } from "../../../lib/utils/Dashboards/AdminDashboard/activityNavigation.js";
import StatutoryCoveragePanel from "../../../components/Dashboard/shared/StatutoryCoveragePanel";
import { DashboardModalManager } from "../../../components/modals/dashboard/AdminDashboardModals";
import {
  EMPTY_OVERVIEW,
  normalizeDashboardOverview,
} from "../../../lib/utils/Dashboards/AdminDashboard/adminDashboardHelpers";
import { buildScopedDashboardNotifications } from "../../../lib/utils/Dashboards/AdminDashboard/dashboardNotifications";

const EXISTING_ADMIN_ROUTES = {
  employees: "/employee",
  departments: "/departments",
  locations: "/locations",
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
  const { markNotificationSeen, notificationsList } = useSidebarNotifications() || {};

  const [activeModal, setActiveModal] = useState(null);
  const [activityHistoryOpen, setActivityHistoryOpen] = useState(false);
  const [activityHistory, setActivityHistory] = useState({
    items: [], loading: false, error: "",
  });
  const activityHistoryRequestIdRef = useRef(0);
  const activityHistoryCacheRef = useRef(null);
  const [feedSourcesPending, setFeedSourcesPending] = useState(false);

  const [toast, setToast] = useState(null);
  const [overview, setOverview] = useState(EMPTY_OVERVIEW);
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
      setFeedSourcesPending(Boolean(payload?.dataStatus?.upstreamSyncing));
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

  const loadActivityHistory = useCallback(async ({ forceRefresh = false } = {}) => {
    const requestId = ++activityHistoryRequestIdRef.current;
    setActivityHistory((previous) => ({ ...previous, loading: true, error: "" }));
    try {
      const payload = await getHrDashboardActivities({ limit: 50, forceRefresh });
      if (activityHistoryRequestIdRef.current !== requestId) return;
      const items = Array.isArray(payload?.activities) ? payload.activities : [];
      activityHistoryCacheRef.current = { items, loadedAt: Date.now() };
      setActivityHistory({
        items, loading: false, error: "",
        syncing: payload?.leaveActivityStatus === "loading",
      });
    } catch (error) {
      if (activityHistoryRequestIdRef.current !== requestId) return;
      setActivityHistory((previous) => ({
        ...previous,
        loading: false,
        error: getErrorMessage(error, "Unable to load recent activity."),
      }));
    }
  }, []);

  const openActivityHistory = useCallback(() => {
    setActivityHistoryOpen(true);
    const cached = activityHistoryCacheRef.current;
    if (cached && Date.now() - cached.loadedAt < 45_000) {
      setActivityHistory({ items: cached.items, loading: false, error: "", syncing: false });
      return;
    }
    setActivityHistory({
      items: cached?.items?.length ? cached.items : (overview.recentActivities || []),
      loading: false,
      error: "",
      syncing: true,
    });
    void loadActivityHistory();
  }, [overview.recentActivities, loadActivityHistory]);

  const closeActivityHistory = useCallback(() => {
    // Disregard any late response after closing the activity panel.
    activityHistoryRequestIdRef.current += 1;
    setActivityHistoryOpen(false);
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
      return;
    }

    if (userRole === "super_admin" || userRole === "superadmin") {
      navigate("/dashboard/super-admin", { replace: true });
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

  // Feed and overview are independent; the feed must never wait for a slow
  // attendance/overview response before starting its own fast data reads.
  useEffect(() => {
    if (loading || !user || !isAdminSide) return undefined;
    const timer = window.setTimeout(() => { void refreshFeed(); }, 150);
    return () => window.clearTimeout(timer);
  }, [loading, user, isAdminSide, refreshFeed]);

  // Optional Kronos enrichment continues in the background. Only recheck
  // while a verified upstream response is still in-flight.
  useEffect(() => {
    if (!feedSourcesPending || loading || !user || !isAdminSide) return undefined;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshFeed();
    }, 5_000);
    return () => window.clearInterval(interval);
  }, [feedSourcesPending, loading, user, isAdminSide, refreshFeed]);

  useEffect(() => {
    if (!activityHistoryOpen || !activityHistory.syncing) return undefined;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadActivityHistory();
      }
    }, 5_000);
    return () => window.clearInterval(interval);
  }, [activityHistoryOpen, activityHistory.syncing, loadActivityHistory]);

  useEffect(() => {
    if (loading || !user || !isAdminSide) return undefined;

    const refreshVisibleDashboard = async () => {
      if (document.visibilityState !== "visible") return;

      void refreshOverview();
      void refreshFeed();
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
    `${user?.lastName || ""}${user?.lastName ? ", " : ""}${user?.firstName || ""}${user?.middleName ? ` ${user.middleName}` : ""
      }`.trim() || "User"
  ).toUpperCase();

  const dashboardTitle = dashboardTitleMap[userRole] || "Admin Dashboard";

  const notifications = useMemo(
    () => buildScopedDashboardNotifications({
      dashboardNotifications: overview.notifications,
      sidebarNotifications: notificationsList,
      icons: notificationIconMap,
    }),
    [overview.notifications, notificationsList],
  );

  // The overview arrives asynchronously; do not display its initial zero values
  // as verified counts until the first overview response has completed.
  const metricsReady = Boolean(overview.generatedAt);
  const displayMetric = (number) => metricsReady ? formatNumber(number) : "—";

  const metricCards = [
    {
      id: "employees",
      label: "Employees",
      value: displayMetric(overview.metrics.employees),
      description: "Active employee records",
      icon: Users,
      tone: "orange",
    },
    {
      id: "departments",
      label: "Departments",
      value: displayMetric(overview.metrics.departments),
      description: "Departments with active staff",
      icon: Building2,
      tone: "navy",
    },
    {
      id: "attendance",
      label: "Attendance",
      value: displayMetric(overview.metrics.attendancePresent),
      description: "Present today",
      icon: UserCheck,
      tone: "green",
      badge: metricsReady ? formatPercent(overview.metrics.attendanceRate) : undefined,
    },
    {
      id: "interviews",
      label: "Interviews Today",
      value: displayMetric(overview.metrics.interviewsToday),
      description: "Scheduled candidate interviews",
      icon: Calendar,
      tone: "indigo",
    },
    {
      id: "payroll",
      label: "Payroll",
      value: displayMetric(overview.metrics.payrollEligible),
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
      title: "Departments",
      description: "Manage departments, accounts, and Lines of Business",
      icon: Building2,
      path: EXISTING_ADMIN_ROUTES.departments,
    },
    {
      id: "office-locations",
      title: "Office Locations",
      description: "View active employees by office location",
      icon: MapPin,
      path: EXISTING_ADMIN_ROUTES.locations,
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
      const pathname = notification.path || EXISTING_ADMIN_ROUTES.approvals;
      navigate(pathname, notification.actionState
        ? { state: notification.actionState }
        : undefined);
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

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-5 sm:space-y-6">
          <AdminDashboardWelcome
            title={dashboardTitle}
            fullName={fullName}
            badge={userRole === "super_admin" ? "Super Admin View" : "HR Admin View"}
            onOpenEmployees={() => navigate(EXISTING_ADMIN_ROUTES.employees)}
            onRefresh={() => refreshOverview({ manual: true, forceRefresh: true })}
            isManualRefreshing={overviewRefreshing}
          />

          {overviewError ? (
            <section
              role="alert"
              className="sibs-page-card-in rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 sibs-text-xs font-semibold text-amber-900 shadow-xs"
            >
              <span className="font-extrabold text-amber-950">Dashboard data warning:</span>{" "}
              {overviewError}. The last successful values remain visible.
            </section>
          ) : null}

          <AdminDashboardStats
            metrics={metricCards}
            onMetricClick={handleMetricClick}
          />

          <StatutoryCoveragePanel />

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-8">
              <AdminDashboardActivity
                activities={overview.recentActivities}
                loading={feedRefreshing || feedSourcesPending}
                onSync={() => {
                  refreshOverview({ manual: true, forceRefresh: true });
                  refreshFeed({ forceRefresh: true });
                }}
                isSyncing={overviewRefreshing || feedRefreshing}
                delay={120}
                onViewAll={openActivityHistory}
              />

              <AdminDashboardNotifications
                notifications={notifications}
                onAction={handleNotificationAction}
                delay={180}
                onViewAll={() => navigate(EXISTING_ADMIN_ROUTES.approvals)}
              />
            </div>

            <aside className="space-y-5 lg:col-span-4">
              <AdminDashboardQuickActions
                actions={quickActions}
                onAction={handleQuickAction}
                delay={240}
              />
              <AdminDashboardWorkforceKpi
                utilization={overview.workforceKpi.utilization}
                absenteeismBuffer={overview.workforceKpi.absenteeismBuffer}
                delay={300}
              />
            </aside>
          </section>
        </div>
      </main>

      {activityHistoryOpen && (
        <AdminDashboardActivityModal
          activities={activityHistory.items}
          loading={activityHistory.loading}
          isSyncing={activityHistory.syncing}
          error={activityHistory.error}
          onRefresh={() => loadActivityHistory({ forceRefresh: true })}
          onClose={closeActivityHistory}
          onNavigate={(entry) => {
            // The bell keeps the last verified all-dates pending total. Reuse
            // that snapshot in the Leaves KPI rather than showing "15" from
            // the first page when the user opens a pending leave activity.
            const sidebarCount = notificationsList?.find(
              (notification) => notification.id === "notif-leaves-pending",
            )?.actionState?.pendingCount;
            const pendingCount = sidebarCount ?? null;
            const target = resolveActivityNavigationTarget(entry, { pendingCount });
            if (!target) return;
            closeActivityHistory();
            navigate(target.pathname, target.state ? { state: target.state } : undefined);
          }}
        />
      )}

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

      <AdminDashboardToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
