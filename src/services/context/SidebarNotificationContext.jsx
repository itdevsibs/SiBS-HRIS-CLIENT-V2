/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useUser } from "./UserContext";
import { getLeavesSummary } from "../../lib/axios/getLeaves";
import { getAuditNotifications } from "../../lib/axios/getAuditNotifications";
import {
  canUseAuditNotifications,
  formatAuditNotificationTime,
  normalizeAuditNotificationsResponse,
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
    case "onboarding":
      return "Review Onboarding";
    case "hiring-needs":
      return "View Requisition";
    case "attendance":
      return "View Attendance";
    case "leaves":
      return "Review Leaves";
    case "job-description":
      return "View Job Description";
    case "employees":
    case "employee-profile":
      return "View Employee";
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
  const [auditNotifications, setAuditNotifications] = useState([]);

  useEffect(() => {
    setLastSeen(readStorage(sidebarStorageKey));
    setReadNotifIds(readStorage(readNotifsStorageKey));
    setDismissedNotifIds(readStorage(dismissedNotifsStorageKey));
  }, [sidebarStorageKey, readNotifsStorageKey, dismissedNotifsStorageKey]);


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

        const normalized = normalizeAuditNotificationsResponse(payload);
        const mapped = normalized.map((item) => {
          const isApproval =
            ["approval-request", "hiring-needs", "job-description", "leaves"].includes(item.module) ||
            ["APPROVE", "SUBMIT", "PENDING", "STATUS_CHANGE"].includes(item.action);

          return {
            id: item.id || `audit-${item.auditLogId}`,
            category: isApproval ? "approvals" : "system",
            type:
              item.tone === "danger" || item.tone === "warning"
                ? "warning"
                : item.tone === "action"
                  ? "action"
                  : "info",
            title: item.title,
            message: item.message,
            time: formatAuditNotificationTime(item.occurredAt),
            timestamp: item.occurredAt ? new Date(item.occurredAt).getTime() : Date.now(),
            actionLabel: getActionLabelByModule(item.module),
            actionPath: item.targetPath || "/approval-request",
          };
        });

        if (!cancelled) {
          setAuditNotifications(mapped);
        }
      } catch (err) {
        console.warn("[SidebarNotificationContext] live audit notifications failed:", err?.message);
        if (!cancelled) setAuditNotifications([]);
      }
    }

    refreshAuditNotifications();

    const interval = window.setInterval(refreshAuditNotifications, 60_000);
    const handleFocus = () => refreshAuditNotifications();
    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user]);

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
      setReadNotifIds((previous) => {
        const next = { ...previous, [id]: true };
        writeStorage(readNotifsStorageKey, next);
        return next;
      });
    },
    [readNotifsStorageKey],
  );

  // Mark all system notifications as read
  const markAllAsRead = useCallback(() => {
    const all = [
      ...(leavePendingNotification ? [leavePendingNotification] : []),
      ...auditNotifications,
      ...DEFAULT_SYSTEM_NOTIFICATIONS,
      ...dynamicNotifications,
    ];
    const next = {};
    all.forEach((item) => {
      if (item.id) next[item.id] = true;
    });
    setReadNotifIds(next);
    writeStorage(readNotifsStorageKey, next);
  }, [dynamicNotifications, leavePendingNotification, auditNotifications, readNotifsStorageKey]);

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
      ...auditNotifications,
      ...DEFAULT_SYSTEM_NOTIFICATIONS,
    ];
    return combined
      .filter((n) => !dismissedNotifIds[n.id])
      .map((n) => ({
        ...n,
        isRead: Boolean(readNotifIds[n.id]),
      }));
  }, [dynamicNotifications, leavePendingNotification, auditNotifications, dismissedNotifIds, readNotifIds]);

  // Total unread count
  const unreadCount = useMemo(
    () => notificationsList.filter((n) => !n.isRead).length,
    [notificationsList],
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
      unreadCount,
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
      unreadCount,
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
