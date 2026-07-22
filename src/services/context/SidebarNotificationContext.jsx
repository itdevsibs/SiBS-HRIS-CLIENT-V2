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

function readLastSeen(storageKey) {
  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : {};

    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeLastSeen(storageKey, nextLastSeen) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(nextLastSeen));
  } catch {
    // Local notification read-state is a convenience layer; failed storage
    // should not block navigation or sidebar rendering.
  }
}

export function SidebarNotificationProvider({ children }) {
  const { user } = useUser() || {};
  const userNotificationId = useMemo(() => getUserNotificationId(user), [user]);
  const storageKey = useMemo(
    () => getSidebarNotificationStorageKey(userNotificationId),
    [userNotificationId],
  );

  const [lastSeen, setLastSeen] = useState({});
  const [liveNotifications, setLiveNotifications] = useState({});

  useEffect(() => {
    setLastSeen(readLastSeen(storageKey));
  }, [storageKey]);

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
        writeLastSeen(storageKey, next);

        return next;
      });
    },
    [storageKey],
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
    }),
    [markNotificationSeen, notifications, setSidebarNotification],
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
