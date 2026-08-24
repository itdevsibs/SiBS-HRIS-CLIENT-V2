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

const DEFAULT_SYSTEM_NOTIFICATIONS = [
  {
    id: "notif-leaves-pending",
    category: "approvals",
    type: "action",
    title: "Pending Leave Requests",
    message: "580 leave requests require administrative review and signoff.",
    time: "10 mins ago",
    timestamp: Date.now() - 10 * 60 * 1000,
    actionLabel: "Review Leaves",
    actionPath: "/leaves",
  },
  {
    id: "notif-interview-response",
    category: "system",
    type: "info",
    title: "Candidate Interview Confirmed",
    message: "POOCHII YENA LABUS responded and confirmed their Full Stack Developer interview.",
    time: "25 mins ago",
    timestamp: Date.now() - 25 * 60 * 1000,
    actionLabel: "Open Pipeline",
    actionPath: "/recruitment/candidate-pipeline",
  },
  {
    id: "notif-onboarding-reqs",
    category: "system",
    type: "warning",
    title: "Incomplete Onboarding Requirements",
    message: "TOTODILE CROCONAW FERALIGATR has 2 missing onboarding requirements for Software Management.",
    time: "1 hour ago",
    timestamp: Date.now() - 60 * 60 * 1000,
    actionLabel: "Review Profile",
    actionPath: "/recruitment/onboarding",
  },
  {
    id: "notif-requisition-approved",
    category: "approvals",
    type: "action",
    title: "New Requisition Submitted",
    message: "A new requisition request for Full Stack Developer was submitted for review.",
    time: "3 hours ago",
    timestamp: Date.now() - 3 * 60 * 60 * 1000,
    actionLabel: "View Requisition",
    actionPath: "/recruitment/hiring-needs",
  },
  {
    id: "notif-attendance-sync",
    category: "system",
    type: "info",
    title: "Biometric Attendance Synced",
    message: "Daily biometric attendance synchronized successfully with 14 exceptions flagged.",
    time: "5 hours ago",
    timestamp: Date.now() - 5 * 60 * 60 * 1000,
    actionLabel: "View Attendance",
    actionPath: "/attendance",
  },
];

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

  useEffect(() => {
    setLastSeen(readStorage(sidebarStorageKey));
    setReadNotifIds(readStorage(readNotifsStorageKey));
    setDismissedNotifIds(readStorage(dismissedNotifsStorageKey));
  }, [sidebarStorageKey, readNotifsStorageKey, dismissedNotifsStorageKey]);

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
    const all = [...DEFAULT_SYSTEM_NOTIFICATIONS, ...dynamicNotifications];
    const next = {};
    all.forEach((item) => {
      if (item.id) next[item.id] = true;
    });
    setReadNotifIds(next);
    writeStorage(readNotifsStorageKey, next);
  }, [dynamicNotifications, readNotifsStorageKey]);

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
    const combined = [...dynamicNotifications, ...DEFAULT_SYSTEM_NOTIFICATIONS];
    return combined
      .filter((n) => !dismissedNotifIds[n.id])
      .map((n) => ({
        ...n,
        isRead: Boolean(readNotifIds[n.id]),
      }));
  }, [dynamicNotifications, dismissedNotifIds, readNotifIds]);

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
