import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Info,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { getAuditNotifications } from "../../lib/axios/getAuditNotifications";
import {
  canUseAuditNotifications,
  formatAuditNotificationTime,
  normalizeAuditNotificationsResponse,
} from "../../lib/utils/notifications/auditNotificationHelpers";
import { useSidebarNotifications } from "../../services/context/SidebarNotificationContext";

const AUTO_REFRESH_INTERVAL_MS = 60_000;

const HEADER_NOTIFICATION_MODULES = {
  hrDashboard: { name: "HR Dashboard", path: "/dashboard/admin" },
  leaves: { name: "Leaves", path: "/leaves" },
  workforceHiringOverview: {
    name: "Workforce & Hiring Overview",
    path: "/recruitment/workforce-hiring-overview",
  },
  jobDescriptionApprovals: {
    name: "Job Description",
    path: "/approval-request",
  },
  hiringNeedsApprovals: {
    name: "Hiring Needs Intake",
    path: "/recruitment/hiring-needs",
  },
  availablePositionApprovals: {
    name: "Available Positions",
    path: "/recruitment/available-positions",
  },
  approvalRequests: { name: "Approval Requests", path: "/approval-request" },
};

function formatSidebarNotificationTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function SidebarNotificationItem({ notification, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className="flex w-full items-start gap-3 border-b border-[#EEF2F6] px-4 py-3.5 text-left transition last:border-b-0 hover:bg-[#F8FAFC]"
    >
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          notification.tone === "urgent"
            ? "bg-red-50 text-red-600"
            : notification.tone === "warning"
              ? "bg-amber-50 text-amber-600"
              : "bg-[#EEF4FA] text-sibs-primary-1"
        }`}
      >
        <Bell className="h-4 w-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="truncate text-xs font-extrabold text-[#101828]">
            {notification.name || notification.key}
          </span>

          {notification.count > 0 ? (
            <span className="shrink-0 rounded-full bg-[#FFF0E9] px-2 py-0.5 text-[9px] font-extrabold text-[#FF5C28]">
              {notification.count > 99 ? "99+" : notification.count}
            </span>
          ) : notification.label ? (
            <span className="shrink-0 rounded-full bg-[#EEF4FA] px-2 py-0.5 text-[9px] font-extrabold text-sibs-primary-1">
              {notification.label}
            </span>
          ) : null}
        </span>

        <span className="mt-1 block text-[10px] font-semibold leading-4 text-[#667085]">
          {notification.title || "New activity requires your attention."}
        </span>

        {notification.updatedAt ? (
          <span className="mt-1.5 block text-[9px] font-bold text-[#98A2B3]">
            {formatSidebarNotificationTime(notification.updatedAt)}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function AuditNotificationItem({ notification, onOpen }) {
  const clickable = Boolean(notification.targetPath);

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      disabled={!clickable}
      className={`flex w-full items-start gap-3 border-b border-[#EEF2F6] px-4 py-3.5 text-left transition last:border-b-0 ${
        clickable ? "hover:bg-[#F8FAFC]" : "cursor-default bg-white"
      }`}
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
        {notification.tone === "info" ? (
          <Info className="h-4 w-4" strokeWidth={1.9} />
        ) : (
          <CheckCircle2 className="h-4 w-4" strokeWidth={1.9} />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] font-extrabold text-[#101828]">
          {notification.title}
        </span>

        <span className="mt-1 block text-[10px] font-medium leading-4 text-[#667085]">
          {notification.message}
        </span>

        {notification.targetSibsId ? (
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wide text-[#667085]">
            <span className="text-[#98A2B3]">Employee SIBS ID</span>
            <span aria-hidden="true">•</span>
            <span className="text-sibs-primary-2">
              {notification.targetSibsId}
            </span>
            {notification.targetEmployeeName ? (
              <>
                <span aria-hidden="true">•</span>
                <span className="text-[#344054]">
                  {notification.targetEmployeeName}
                </span>
              </>
            ) : null}
          </span>
        ) : null}

        <span className="mt-1.5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-wide text-[#98A2B3]">
          <span>{notification.module || "HRIS"}</span>
          <span aria-hidden="true">•</span>
          <span>{formatAuditNotificationTime(notification.occurredAt)}</span>
        </span>
      </span>
    </button>
  );
}

export default function AuditNotificationBell({ user }) {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const loadingRef = useRef(false);
  const sidebarNotifications = useSidebarNotifications();
  const notificationMap = sidebarNotifications?.notifications || {};
  const markNotificationSeen = sidebarNotifications?.markNotificationSeen;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [auditNotifications, setAuditNotifications] = useState([]);

  const eligibleForAudit = useMemo(
    () => canUseAuditNotifications(user),
    [user],
  );

  const hrNotifications = useMemo(
    () =>
      Object.entries(notificationMap)
        .map(([key, notification]) => ({
          key,
          ...notification,
          ...(HEADER_NOTIFICATION_MODULES[key] || {}),
        }))
        .sort((left, right) => {
          const leftTime = new Date(left.updatedAt || 0).getTime() || 0;
          const rightTime = new Date(right.updatedAt || 0).getTime() || 0;
          return rightTime - leftTime;
        }),
    [notificationMap],
  );

  const loadAuditNotifications = useCallback(
    async ({ silent = false } = {}) => {
      if (!eligibleForAudit || loadingRef.current) return false;

      loadingRef.current = true;

      if (!silent) {
        setLoading(true);
      }

      try {
        const payload = await getAuditNotifications({ limit: 20 });
        const normalized = normalizeAuditNotificationsResponse(payload).filter(
          (notification) => notification.status === "SUCCESS",
        );

        setAuditNotifications(normalized);
        setError("");
        return true;
      } catch (loadError) {
        console.warn(
          "[Audit Notifications] Unable to load notifications:",
          loadError,
        );
        setError("Unable to load system activity.");
        return false;
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [eligibleForAudit],
  );

  useEffect(() => {
    if (!eligibleForAudit) {
      setAuditNotifications([]);
      setError("");
      return undefined;
    }

    void loadAuditNotifications();
    return undefined;
  }, [eligibleForAudit, loadAuditNotifications]);

  useEffect(() => {
    if (!eligibleForAudit) return undefined;

    const refreshVisibleNotifications = () => {
      if (document.visibilityState !== "visible") return;
      void loadAuditNotifications({ silent: true });
    };

    const interval = window.setInterval(
      refreshVisibleNotifications,
      AUTO_REFRESH_INTERVAL_MS,
    );

    document.addEventListener("visibilitychange", refreshVisibleNotifications);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener(
        "visibilitychange",
        refreshVisibleNotifications,
      );
    };
  }, [eligibleForAudit, loadAuditNotifications]);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutsideClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const notificationCount = hrNotifications.length + auditNotifications.length;
  const badgeLabel = notificationCount > 99 ? "99+" : String(notificationCount);

  function handleBellClick() {
    setOpen((previous) => {
      const nextOpen = !previous;

      if (nextOpen && eligibleForAudit) {
        void loadAuditNotifications({ silent: auditNotifications.length > 0 });
      }

      return nextOpen;
    });
  }

  function handleOpenHrNotification(notification) {
    if (notification.updatedAt) {
      markNotificationSeen?.(notification.key);
    }

    setOpen(false);

    if (notification.path) {
      navigate(notification.path);
    }
  }

  function handleOpenAuditNotification(notification) {
    if (!notification?.targetPath) return;

    setOpen(false);
    navigate(notification.targetPath);
  }

  function handleMarkAllRead() {
    hrNotifications.forEach((notification) => {
      if (notification.updatedAt) {
        markNotificationSeen?.(notification.key);
      }
    });
  }

  const hasHrNotifications = hrNotifications.length > 0;
  const hasAuditNotifications = auditNotifications.length > 0;
  const hasAnyNotification = hasHrNotifications || hasAuditNotifications;

  return (
    <div ref={rootRef} className="relative z-[10020]">
      <button
        type="button"
        onClick={handleBellClick}
        className={`relative flex h-8.5 w-8.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-lg transition ${
          open
            ? "bg-[#EEF4FA] text-sibs-primary-1"
            : "text-[#667085] hover:bg-[#F1F5F9] hover:text-sibs-primary-1"
        }`}
        aria-label={
          notificationCount
            ? `Notifications, ${notificationCount} recent`
            : "Notifications"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell
          className="h-4 w-4 2xl:h-[18px] 2xl:w-[18px]"
          strokeWidth={1.8}
        />

        {notificationCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-h-[17px] min-w-[17px] items-center justify-center rounded-full bg-sibs-primary-2 px-1 text-[8px] font-black leading-none text-white ring-2 ring-white">
            {badgeLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <section
          role="dialog"
          aria-label="Notifications"
          className="fixed left-3 right-3 top-[68px] z-[10030] overflow-hidden rounded-2xl border border-[#D7E0E9] bg-white shadow-[0_18px_50px_rgba(4,44,81,0.2)] sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+10px)] sm:w-[380px]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[#E6ECF2] px-4 py-3.5">
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-[#042C51]">
                Notifications
              </h3>
              <p className="mt-0.5 text-[10px] font-semibold text-[#667085]">
                {notificationCount
                  ? `${notificationCount} recent notification${
                      notificationCount === 1 ? "" : "s"
                    }`
                  : "You are all caught up"}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {hasHrNotifications ? (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[10px] font-extrabold text-sibs-primary-1 transition hover:bg-[#EEF4FA]"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark read
                </button>
              ) : null}

              {eligibleForAudit ? (
                <button
                  type="button"
                  onClick={() => void loadAuditNotifications()}
                  disabled={loading}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4E7EC] text-[#667085] transition hover:bg-[#F8FAFC] hover:text-sibs-primary-1 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Refresh system activity"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                </button>
              ) : null}
            </div>
          </div>

          <div className="max-h-[440px] overflow-y-auto sibs-scrollbar">
            {hasHrNotifications ? (
              <section>
                <div className="border-b border-[#EEF2F6] bg-[#F8FAFC] px-4 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-[#98A2B3]">
                  HRIS Notifications
                </div>

                {hrNotifications.map((notification) => (
                  <SidebarNotificationItem
                    key={`hr-${notification.key}`}
                    notification={notification}
                    onOpen={handleOpenHrNotification}
                  />
                ))}
              </section>
            ) : null}

            {eligibleForAudit ? (
              <section>
                <div className="border-b border-[#EEF2F6] bg-[#F8FAFC] px-4 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-[#98A2B3]">
                  Successful System Activity
                </div>

                {loading && auditNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-5 py-7 text-center">
                    <Loader2 className="h-5 w-5 animate-spin text-sibs-primary-2" />
                    <p className="mt-2 text-[10px] font-bold text-[#667085]">
                      Loading system activity...
                    </p>
                  </div>
                ) : error && auditNotifications.length === 0 ? (
                  <div className="px-5 py-6 text-center">
                    <p className="text-xs font-extrabold text-[#344054]">
                      System activity unavailable
                    </p>
                    <p className="mt-1 text-[10px] leading-4 text-[#667085]">
                      {error}
                    </p>
                  </div>
                ) : hasAuditNotifications ? (
                  auditNotifications.map((notification) => (
                    <AuditNotificationItem
                      key={`audit-${notification.id || notification.auditLogId}`}
                      notification={notification}
                      onOpen={handleOpenAuditNotification}
                    />
                  ))
                ) : (
                  <div className="px-5 py-6 text-center">
                    <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500" />
                    <p className="mt-2 text-xs font-extrabold text-[#344054]">
                      No successful system activity
                    </p>
                    <p className="mt-1 text-[10px] leading-4 text-[#667085]">
                      New successful audit activity will appear here automatically.
                    </p>
                  </div>
                )}
              </section>
            ) : null}

            {!hasAnyNotification && !eligibleForAudit ? (
              <div className="px-6 py-10 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F5F9] text-[#98A2B3]">
                  <Bell className="h-5 w-5" />
                </span>
                <p className="mt-3 text-xs font-extrabold text-[#344054]">
                  No new notifications
                </p>
                <p className="mt-1 text-[10px] font-semibold text-[#98A2B3]">
                  New HRIS activity will appear here.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
