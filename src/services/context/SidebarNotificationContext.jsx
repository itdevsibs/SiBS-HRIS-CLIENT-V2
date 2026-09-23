/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useUser } from "./UserContext";
import { getLeavesSummary } from "../../lib/axios/getLeaves";
import { getCandidatePipelineCandidates } from "../../lib/axios/getCandidatePipeline";
import { getHiringNeeds } from "../../lib/axios/getHiringNeeds";
import {
  getAuditNotifications,
  markAuditNotificationRead,
} from "../../lib/axios/getAuditNotifications";
import {
  buildCandidatePipelineNotifications,
  buildHiringNeedsNotifications,
  sortNotificationsByNewest,
} from "../../lib/utils/notificationFeed";
import {
  buildAuditNotificationActionState,
  canUseAuditNotifications,
  formatAuditNotificationExactTime,
  formatAuditNotificationTime,
  normalizeAuditNotificationsResponse,
  shouldUseExactAuditNotificationTime,
} from "../../lib/utils/notifications/auditNotificationHelpers";
import {
  createSidebarNotificationState,
  getSidebarNotification,
  getSidebarNotificationStorageKey,
  markSidebarNotificationSeen,
} from "../../lib/utils/sidebarNotifications";

const SidebarNotificationContext = createContext(null);

const SEEDED_SIDEBAR_NOTIFICATIONS = [
  {
    key: "hrDashboard",
    name: "HR Dashboard",
    count: 4,
    label: "NEW",
    tone: "info",
    title: "4 new HR dashboard activities",
    updatedAt: "2026-07-21T12:10:00.000+08:00",
  },
  {
    key: "leaves",
    name: "Leaves",
    count: 4,
    label: "NEW",
    tone: "info",
    title: "4 new leave updates",
    updatedAt: "2026-07-21T12:10:00.000+08:00",
  },
  {
    key: "workforceHiringOverview",
    name: "Workforce & Hiring Overview",
    label: "RAMPS",
    tone: "info",
    title: "Hiring ramp planning signal",
  },
];

export const DEFAULT_SYSTEM_NOTIFICATIONS = [];

function getActionLabelByModule(module = "") {
  switch (module) {
    case "candidate-pipeline":
      return "Open Pipeline";
    case "talent-pool":
      return "View Talent Pool";
    case "onboarding":
      return "Review Onboarding";
    case "hiring-needs":
      return "View Requisition";
    case "attendance":
      return "View Attendance";
    case "leaves":
      return "Review Leaves";
    case "resignation":
    case "resignation-management":
      return "Review Resignation";
    case "approval-request":
    case "approval-requests":
      return "Review Approvals";
    case "job-description":
      return "View Job Description";
    case "employees":
    case "employee-profile":
      return "View Employee";
    case "users":
    case "account-settings":
    case "assigned-accounts":
      return "Manage Access";
    default:
      return "View Details";
  }
}

function getUserNotificationId(user) {
  return (
    user?.sibs_id ||
    user?.sibsId ||
    user?.employee_id ||
    user?.employeeId ||
    user?.user_id ||
    user?.userId ||
    user?.id ||
    user?.username ||
    user?.email ||
    "anonymous"
  );
}

function readStorage(storageKey) {
  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorage(storageKey, data) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    // Graceful fallback
  }
}

function mapAuditNotifications(payload = {}) {
  const normalized = normalizeAuditNotificationsResponse(payload);
  const authoritativeEpochMs = Number(payload?.serverEpochMs);
  const authoritativeNow = Number.isFinite(authoritativeEpochMs)
    ? new Date(authoritativeEpochMs)
    : undefined;

  return normalized.map((item) => {
    const isApproval =
      ["approval-request", "hiring-needs", "job-description", "leaves"].includes(
        item.module,
      ) ||
      [
        "APPROVE",
        "SUBMIT",
        "PENDING",
        "STATUS_CHANGE",
        "RESIGN_REVIEW",
      ].includes(item.action);
    const actionState = buildAuditNotificationActionState(item);

    return {
      id: item.id || `audit-${item.auditLogId}`,
      auditLogId: item.auditLogId,
      isRead: item.isRead,
      category: isApproval ? "approvals" : "system",
      type:
        item.tone === "danger" || item.tone === "warning"
          ? "warning"
          : item.tone === "action"
            ? "action"
            : "info",
      title: item.title,
      message: item.message,
      time: authoritativeNow
        ? shouldUseExactAuditNotificationTime(item)
          ? formatAuditNotificationExactTime(item.occurredAt)
          : formatAuditNotificationTime(item.occurredAt, authoritativeNow)
        : "Recently",
      timestamp: item.occurredAt ? new Date(item.occurredAt).getTime() : 0,
      actionLabel: getActionLabelByModule(item.module),
      actionPath: item.targetPath || "/approval-request",
      ...(actionState ? { actionState } : {}),
    };
  });
}

function mergeNotificationsById(existing = [], incoming = []) {
  const merged = new Map();

  [...existing, ...incoming].forEach((item) => {
    if (!item?.id) return;
    merged.set(item.id, item);
  });

  return sortNotificationsByNewest(Array.from(merged.values()));
}

export function SidebarNotificationProvider({ children }) {
  const { user } = useUser() || {};
  const userNotificationId = useMemo(() => getUserNotificationId(user), [user]);
  
  const sidebarStorageKey = useMemo(
    () => getSidebarNotificationStorageKey(userNotificationId),
    [userNotificationId],
  );
  const readNotifsStorageKey = useMemo(
    () => `sibs.notifications.read.${userNotificationId}`,
    [userNotificationId],
  );
  const dismissedNotifsStorageKey = useMemo(
    () => `sibs.notifications.dismissed.${userNotificationId}`,
    [userNotificationId],
  );

  const [lastSeen, setLastSeen] = useState({});
  const [liveNotifications, setLiveNotifications] = useState({});
  const [readNotifIds, setReadNotifIds] = useState({});
  const [dismissedNotifIds, setDismissedNotifIds] = useState({});
  const [dynamicNotifications, setDynamicNotifications] = useState([]);
  const [leavePendingNotification, setLeavePendingNotification] = useState(null);
  const [operationalNotifications, setOperationalNotifications] = useState([]);
  const [auditNotifications, setAuditNotifications] = useState([]);
  const [auditHistoryNotifications, setAuditHistoryNotifications] = useState([]);
  const [auditHistoryCursor, setAuditHistoryCursor] = useState(null);
  const [auditHistoryHasMore, setAuditHistoryHasMore] = useState(false);
  const [auditHistoryLoaded, setAuditHistoryLoaded] = useState(false);
  const [auditHistoryLoading, setAuditHistoryLoading] = useState(false);
  const auditHistoryLoadingRef = useRef(false);

  useEffect(() => {
    setLastSeen(readStorage(sidebarStorageKey));
    setReadNotifIds(readStorage(readNotifsStorageKey));
    setDismissedNotifIds(readStorage(dismissedNotifsStorageKey));
  }, [sidebarStorageKey, readNotifsStorageKey, dismissedNotifsStorageKey]);

  useEffect(() => {
    auditHistoryLoadingRef.current = false;
    setAuditHistoryNotifications([]);
    setAuditHistoryCursor(null);
    setAuditHistoryHasMore(false);
    setAuditHistoryLoaded(false);
    setAuditHistoryLoading(false);
  }, [userNotificationId]);


  useEffect(() => {
    let cancelled = false;

    async function refreshPendingLeaveNotification() {
      if (!user) {
        if (!cancelled) setLeavePendingNotification(null);
        return;
      }

      const result = await getLeavesSummary();

      if (cancelled) return;

      if (!result?.success || !result?.data) {
        setLeavePendingNotification(null);
        return;
      }

      const pendingLeaves = Number(result.data.pendingLeaves || 0);

      if (!Number.isFinite(pendingLeaves) || pendingLeaves <= 0) {
        setLeavePendingNotification(null);
        return;
      }

      const canReview = result?.access?.canReview !== false;
      const requestLabel = pendingLeaves === 1 ? "leave request" : "leave requests";

      setLeavePendingNotification({
        id: "notif-leaves-pending",
        category: canReview ? "approvals" : "system",
        type: "action",
        title: "Pending Leave Requests",
        message: canReview
          ? `${pendingLeaves.toLocaleString("en-PH")} ${requestLabel} require administrative review and signoff.`
          : `${pendingLeaves.toLocaleString("en-PH")} ${requestLabel} currently pending.`,
        time: "Current",
        timestamp: Date.now(),
        actionLabel: "",
        actionPath: "/leaves",
        actionState: {
          leaveStatus: "Pending",
          source: "pending-leave-notification",
        },
        clickableCard: true,
      });
    }

    refreshPendingLeaveNotification();

    const interval = window.setInterval(
      refreshPendingLeaveNotification,
      60_000,
    );

    const handleWindowFocus = () => {
      refreshPendingLeaveNotification();
    };

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [user, userNotificationId]);

  useEffect(() => {
    let cancelled = false;

    async function refreshOperationalNotifications() {
      if (!user) {
        if (!cancelled) {
          setOperationalNotifications([]);
        }
        return;
      }

      const [pipelineResult, hiringNeedsResult] =
        await Promise.allSettled([
          getCandidatePipelineCandidates({
            page: 1,
            limit: 500,
          }),
          getHiringNeeds(),
        ]);

      if (cancelled) return;

      const pipelinePayload =
        pipelineResult.status === "fulfilled"
          ? pipelineResult.value
          : null;

      const hiringNeedsPayload =
        hiringNeedsResult.status === "fulfilled"
          ? hiringNeedsResult.value
          : null;

      setOperationalNotifications(
        sortNotificationsByNewest([
          ...buildCandidatePipelineNotifications(
            pipelinePayload || {},
          ),
          ...buildHiringNeedsNotifications(
            hiringNeedsPayload || {},
          ),
        ]),
      );
    }

    refreshOperationalNotifications();

    const interval = window.setInterval(
      refreshOperationalNotifications,
      60_000,
    );

    const refreshEvents = [
      "ta-pipeline-candidates-updated",
      "ta-talent-pool-updated",
      "ta-hiring-needs-updated",
    ];

    const handleRefresh = () => {
      refreshOperationalNotifications();
    };

    refreshEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleRefresh);
    });

    window.addEventListener("focus", handleRefresh);

    return () => {
      cancelled = true;
      window.clearInterval(interval);

      refreshEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleRefresh);
      });

      window.removeEventListener("focus", handleRefresh);
    };
  }, [user, userNotificationId]);

  useEffect(() => {
    let cancelled = false;

    async function refreshAuditNotifications() {
      if (!user) {
        if (!cancelled) setAuditNotifications([]);
        return;
      }

      if (!canUseAuditNotifications(user)) {
        if (!cancelled) setAuditNotifications([]);
        return;
      }

      try {
        const payload = await getAuditNotifications({ limit: 20 });

        if (cancelled) return;

        const mapped = mapAuditNotifications(payload);

        if (!cancelled) {
          setAuditNotifications(mapped);
        }
      } catch (error) {
        console.warn(
          "[SidebarNotificationContext] live audit notifications failed:",
          error?.message,
        );

        if (!cancelled) {
          setAuditNotifications([]);
        }
      }
    }

    refreshAuditNotifications();

    const interval = window.setInterval(
      refreshAuditNotifications,
      60_000,
    );

    const handleRefresh = () => {
      refreshAuditNotifications();
    };

    window.addEventListener("focus", handleRefresh);
    window.addEventListener(
      "sibs-audit-notifications-refresh",
      handleRefresh,
    );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener(
        "sibs-audit-notifications-refresh",
        handleRefresh,
      );
    };
  }, [user]);

  const loadAuditNotificationHistory = useCallback(
    async ({ reset = false } = {}) => {
      if (!user || !canUseAuditNotifications(user)) return;
      if (auditHistoryLoadingRef.current) return;
      if (!reset && auditHistoryLoaded && !auditHistoryHasMore) return;

      const beforeId = reset ? null : auditHistoryCursor;
      if (!reset && !beforeId) return;

      auditHistoryLoadingRef.current = true;
      setAuditHistoryLoading(true);

      try {
        const payload = await getAuditNotifications({
          limit: 50,
          beforeId,
          history: true,
        });
        const mapped = mapAuditNotifications(payload);

        setAuditHistoryNotifications((previous) =>
          reset ? mapped : mergeNotificationsById(previous, mapped),
        );
        setAuditHistoryCursor(payload?.nextCursor ?? null);
        setAuditHistoryHasMore(Boolean(payload?.hasMore));
        setAuditHistoryLoaded(true);
      } catch (error) {
        console.warn(
          "[SidebarNotificationContext] audit notification history failed:",
          error?.message,
        );

        if (reset) {
          setAuditHistoryNotifications([]);
          setAuditHistoryCursor(null);
          setAuditHistoryHasMore(false);
          setAuditHistoryLoaded(false);
        }
      } finally {
        auditHistoryLoadingRef.current = false;
        setAuditHistoryLoading(false);
      }
    },
    [
      user,
      auditHistoryCursor,
      auditHistoryHasMore,
      auditHistoryLoaded,
    ],
  );

  const loadMoreAuditNotificationHistory = useCallback(() => {
    return loadAuditNotificationHistory({ reset: false });
  }, [loadAuditNotificationHistory]);

  const setSidebarNotification = useCallback((key, notification) => {
    if (!key) return;

    setLiveNotifications((previous) => {
      const next = { ...previous };
      const count = Number(notification?.count || 0);
      const label = String(notification?.label || "").trim();
      const previousNotification = previous[key];
      const previousCount = Number(previousNotification?.count || 0);
      const previousLabel = String(previousNotification?.label || "").trim();
      const canReuseTimestamp =
        previousNotification &&
        previousCount === count &&
        previousLabel.toUpperCase() === label.toUpperCase();

      if (!count && !label) {
        delete next[key];
        return next;
      }

      next[key] = {
        key,
        ...notification,
        updatedAt:
          notification?.updatedAt ||
          (canReuseTimestamp
            ? previousNotification.updatedAt
            : new Date().toISOString()),
      };

      return next;
    });
  }, []);

  const markNotificationSeen = useCallback(
    (key, seenAt) => {
      setLastSeen((previous) => {
        const next = markSidebarNotificationSeen(previous, key, seenAt);
        writeStorage(sidebarStorageKey, next);

        return next;
      });
    },
    [sidebarStorageKey],
  );

  // Mark single system notification as read
  const markAsRead = useCallback(
    (id) => {
      if (!id) return;
      const auditItem = [
        ...auditNotifications,
        ...auditHistoryNotifications,
      ].find((item) => item.id === id);
      if (auditItem?.auditLogId) {
        void markAuditNotificationRead(auditItem.auditLogId).catch(() => {});
      }
      setReadNotifIds((previous) => {
        const next = { ...previous, [id]: true };
        writeStorage(readNotifsStorageKey, next);
        return next;
      });
    },
    [auditHistoryNotifications, auditNotifications, readNotifsStorageKey],
  );

  // Mark all system notifications as read
  const markAllAsRead = useCallback(() => {
    const all = [
      ...(leavePendingNotification ? [leavePendingNotification] : []),
      ...operationalNotifications,
      ...auditNotifications,
      ...auditHistoryNotifications,
      ...DEFAULT_SYSTEM_NOTIFICATIONS,
      ...dynamicNotifications,
    ];
    const next = {};
    all.forEach((item) => {
      if (item.id) next[item.id] = true;
    });
    setReadNotifIds(next);
    writeStorage(readNotifsStorageKey, next);
  }, [
    dynamicNotifications,
    leavePendingNotification,
    operationalNotifications,
    auditNotifications,
    auditHistoryNotifications,
    readNotifsStorageKey,
  ]);

  // Dismiss a system notification
  const dismissNotification = useCallback(
    (id) => {
      if (!id) return;
      setDismissedNotifIds((previous) => {
        const next = { ...previous, [id]: true };
        writeStorage(dismissedNotifsStorageKey, next);
        return next;
      });
    },
    [dismissedNotifsStorageKey],
  );

  // Add a dynamic notification
  const addNotification = useCallback((notification) => {
    if (!notification?.id) return;
    setDynamicNotifications((prev) => [notification, ...prev]);
  }, []);

  // Compute merged system notifications list
  const notificationsList = useMemo(() => {
    const combined = sortNotificationsByNewest([
      ...dynamicNotifications,
      ...(leavePendingNotification ? [leavePendingNotification] : []),
      ...operationalNotifications,
      ...auditNotifications,
      ...DEFAULT_SYSTEM_NOTIFICATIONS,
    ]);
    return combined
      .filter((n) => !dismissedNotifIds[n.id])
      .map((n) => ({
        ...n,
        isRead: Boolean(n.isRead || readNotifIds[n.id]),
      }));
  }, [
    dynamicNotifications,
    leavePendingNotification,
    operationalNotifications,
    auditNotifications,
    dismissedNotifIds,
    readNotifIds,
  ]);

  const fullNotificationsList = useMemo(() => {
    const auditSource = auditHistoryLoaded
      ? auditHistoryNotifications
      : auditNotifications;
    const combined = sortNotificationsByNewest([
      ...dynamicNotifications,
      ...(leavePendingNotification ? [leavePendingNotification] : []),
      ...operationalNotifications,
      ...auditSource,
      ...DEFAULT_SYSTEM_NOTIFICATIONS,
    ]);

    return combined
      .filter((n) => !dismissedNotifIds[n.id])
      .map((n) => ({
        ...n,
        isRead: Boolean(n.isRead || readNotifIds[n.id]),
      }));
  }, [
    dynamicNotifications,
    leavePendingNotification,
    operationalNotifications,
    auditNotifications,
    auditHistoryNotifications,
    auditHistoryLoaded,
    dismissedNotifIds,
    readNotifIds,
  ]);

  // Total unread count
  const unreadCount = useMemo(
    () => notificationsList.filter((n) => !n.isRead).length,
    [notificationsList],
  );

  const fullUnreadCount = useMemo(
    () => fullNotificationsList.filter((n) => !n.isRead).length,
    [fullNotificationsList],
  );

  const notifications = useMemo(
    () =>
      createSidebarNotificationState({
        definitions: [
          ...SEEDED_SIDEBAR_NOTIFICATIONS,
          ...Object.values(liveNotifications),
        ],
        lastSeen,
      }),
    [lastSeen, liveNotifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      getNotification: (key) => getSidebarNotification(notifications, key),
      markNotificationSeen,
      setSidebarNotification,
      // System Notification System
      notificationsList,
      fullNotificationsList,
      unreadCount,
      fullUnreadCount,
      auditHistoryLoading,
      auditHistoryHasMore,
      loadAuditNotificationHistory,
      loadMoreAuditNotificationHistory,
      markAsRead,
      markAllAsRead,
      dismissNotification,
      addNotification,
    }),
    [
      markNotificationSeen,
      notifications,
      setSidebarNotification,
      notificationsList,
      fullNotificationsList,
      unreadCount,
      fullUnreadCount,
      auditHistoryLoading,
      auditHistoryHasMore,
      loadAuditNotificationHistory,
      loadMoreAuditNotificationHistory,
      markAsRead,
      markAllAsRead,
      dismissNotification,
      addNotification,
    ],
  );

  return (
    <SidebarNotificationContext.Provider value={value}>
      {children}
    </SidebarNotificationContext.Provider>
  );
}

export function useSidebarNotifications() {
  return useContext(SidebarNotificationContext);
}
