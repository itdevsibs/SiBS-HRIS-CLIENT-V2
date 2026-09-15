/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";

import api, {
  AUTH_LOGOUT_START_EVENT,
  handleLogout,
} from "../../lib/axios/api-template";
import { createBirthdayLoginEvent } from "../../lib/utils/birthdayCelebration.js";


import {
  clearCachedAuthSession,
  normalizeExpiry,
  readCachedAuthSession,
  readStoredExpiry,
  shouldEndSessionAfterUserFetchError,
  writeCachedUser,
  writeStoredExpiry,
} from "../auth/auth-session-cache";

const UserContext = createContext(null);

const USER_REQUEST_TIMEOUT = 15_000;
const SESSION_REFRESH_TIMEOUT = 15_000;
const ACTIVITY_THROTTLE_MS = 1_000;

/*
 * The backend JWT ENV values are the authoritative HRIS session lifetime.
 *
 * - JWT_EXPIRES_IN controls employee-token lifetime.
 * - JWT_ADMIN_EXPIRES_IN controls admin-token lifetime.
 * - meaningful user activity renews the token through /api/users/refresh.
 * - no meaningful activity means no refresh; the token expires and HRIS logs out.
 * - mouse movement by itself is intentionally ignored.
 */
const SERVER_TOKEN_EXPIRY_SESSION_KEY = "serverTokenExpiresAt";
const SERVER_TOKEN_EXPIRY_LOCAL_KEY = "server_token_expires_at";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/online-assessment",
  "/apply",

  "/job-description",
  "/public/job-description",

  "/public/talent-pool/apply",
  "/public/interview-date",
  "/public/offer-response",
  "/public/candidate-experience",
  "/public/candidate-experience-survey",
  "/recruitment/candidate-experience/survey",
  "/recruitment/talent-pool/apply",
];

const ACTIVITY_EVENTS = [
  "pointerdown",
  "click",
  "keydown",
  "input",
  "change",
  "scroll",
  "wheel",
  "touchstart",
];

function isPublicPath(pathname = "") {
  return PUBLIC_PATHS.some((path) => {
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(`${path}/`);
  });
}

function isCanceledRequest(error) {
  return (
    error?.code === "ERR_CANCELED" ||
    error?.name === "CanceledError" ||
    error?.name === "AbortError"
  );
}

function getSessionStorage() {
  return typeof sessionStorage === "undefined" ? null : sessionStorage;
}

function getLocalStorage() {
  return typeof localStorage === "undefined" ? null : localStorage;
}

function readStoredServerTokenExpiry() {
  const sessionExpiry = normalizeExpiry(
    getSessionStorage()?.getItem(SERVER_TOKEN_EXPIRY_SESSION_KEY),
  );

  const sharedExpiry = normalizeExpiry(
    getLocalStorage()?.getItem(SERVER_TOKEN_EXPIRY_LOCAL_KEY),
  );

  const expiresAt = Math.max(sessionExpiry, sharedExpiry);

  if (!expiresAt) return 0;

  getSessionStorage()?.setItem(
    SERVER_TOKEN_EXPIRY_SESSION_KEY,
    String(expiresAt),
  );
  getLocalStorage()?.setItem(
    SERVER_TOKEN_EXPIRY_LOCAL_KEY,
    String(expiresAt),
  );

  return expiresAt;
}

function writeStoredServerTokenExpiry(value) {
  const expiresAt = normalizeExpiry(value);

  if (!expiresAt) return 0;

  getSessionStorage()?.setItem(
    SERVER_TOKEN_EXPIRY_SESSION_KEY,
    String(expiresAt),
  );
  getLocalStorage()?.setItem(
    SERVER_TOKEN_EXPIRY_LOCAL_KEY,
    String(expiresAt),
  );

  return expiresAt;
}

function clearStoredServerTokenExpiry() {
  getSessionStorage()?.removeItem(SERVER_TOKEN_EXPIRY_SESSION_KEY);

  getLocalStorage()?.removeItem(SERVER_TOKEN_EXPIRY_LOCAL_KEY);
}

export function UserProvider({ children }) {
  const location = useLocation();
  const publicRoute = isPublicPath(location.pathname);

  const initialSessionRef = useRef(undefined);

  if (initialSessionRef.current === undefined) {
    initialSessionRef.current = publicRoute ? null : readCachedAuthSession();
  }

  const initialSession = initialSessionRef.current;

  const [user, setUserState] = useState(initialSession?.user || null);
  const [postLoginCelebrationEvent, setPostLoginCelebrationEvent] = useState(null);

  const [loading, setLoading] = useState(!initialSession?.user);

  const mountedRef = useRef(true);
  const userRef = useRef(initialSession?.user || null);
  const birthdayLoginSequenceRef = useRef(0);

  const logoutTimerRef = useRef(null);
  const serverRefreshTimerRef = useRef(null);

  const fetchControllerRef = useRef(null);
  const refreshControllerRef = useRef(null);

  const fetchEpochRef = useRef(0);
  const logoutInProgressRef = useRef(false);
  const refreshPromiseRef = useRef(null);
  const refreshSessionRef = useRef(null);
  const justLoggedInRef = useRef(false);

  const lastHandledActivityRef = useRef(0);
  const lastServerRefreshRequestRef = useRef(0);

  const replaceUser = useCallback((nextUser, { cache = true } = {}) => {
    userRef.current = nextUser;

    if (cache) {
      writeCachedUser(nextUser);
    }

    if (mountedRef.current) {
      setUserState(nextUser);
    }
  }, []);

  const clearLogoutTimer = useCallback(() => {
    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const clearServerRefreshTimer = useCallback(() => {
    if (serverRefreshTimerRef.current) {
      window.clearTimeout(serverRefreshTimerRef.current);

      serverRefreshTimerRef.current = null;
    }
  }, []);

  const abortUserFetch = useCallback(() => {
    fetchEpochRef.current += 1;
    fetchControllerRef.current?.abort();
    fetchControllerRef.current = null;
  }, []);

  const abortServerRefresh = useCallback(() => {
    refreshControllerRef.current?.abort();
    refreshControllerRef.current = null;
    refreshPromiseRef.current = null;
  }, []);

  const suspendAuthForPublicRoute = useCallback(() => {
    /*
     * Public pages must NEVER destroy the existing HRIS login.
     *
     * A public JD is intentionally opened in another browser tab.
     * That tab may not have the same sessionStorage values as the
     * authenticated HRIS tab, while authentication cookies are shared.
     *
     * Stop only this tab's auth work:
     * - pending /me request
     * - pending refresh request
     * - inactivity logout timer
     * - server token refresh timer
     *
     * Do NOT:
     * - clear cached auth state
     * - clear expiry storage
     * - replace the logged-in user with null
     * - call the backend logout endpoint
     */
    abortUserFetch();
    abortServerRefresh();
    clearLogoutTimer();
    clearServerRefreshTimer();

    if (mountedRef.current) {
      setLoading(false);
    }
  }, [
    abortServerRefresh,
    abortUserFetch,
    clearLogoutTimer,
    clearServerRefreshTimer,
  ]);

  const clearLocalAuthState = useCallback(() => {
    abortUserFetch();
    abortServerRefresh();
    clearLogoutTimer();
    clearServerRefreshTimer();

    clearCachedAuthSession();
    clearStoredServerTokenExpiry();
    justLoggedInRef.current = false;
    setPostLoginCelebrationEvent(null);
    replaceUser(null, { cache: false });

    if (mountedRef.current) {
      setLoading(false);
    }
  }, [
    abortServerRefresh,
    abortUserFetch,
    clearLogoutTimer,
    clearServerRefreshTimer,
    replaceUser,
  ]);

  const forceLogout = useCallback(async () => {
    /*
     * A public page must never invalidate the authenticated HRIS session.
     *
     * This guard MUST happen before clearLocalAuthState() because an
     * inactivity timer created on a private route can fire immediately
     * after navigating to a public route.
     */
    if (isPublicPath(window.location.pathname)) {
      return;
    }

    if (logoutInProgressRef.current) return;

    logoutInProgressRef.current = true;
    clearLocalAuthState();

    try {
      await handleLogout(true);
    } finally {
      logoutInProgressRef.current = false;
    }
  }, [clearLocalAuthState]);

  const startLogoutTimer = useCallback(() => {
    clearLogoutTimer();

    if (isPublicPath(window.location.pathname)) {
      return false;
    }

    const expiresAt = readStoredServerTokenExpiry() || readStoredExpiry();

    if (!expiresAt) {
      void forceLogout();
      return false;
    }

    const remaining = expiresAt - Date.now();

    if (remaining <= 0) {
      void forceLogout();
      return false;
    }

    const scheduleExpiryCheck = (delay) => {
      logoutTimerRef.current = window.setTimeout(() => {
        logoutTimerRef.current = null;

        /*
         * Another HRIS tab may have extended the shared inactivity deadline.
         * Re-read it before logging out so an older timer in this tab cannot
         * invalidate the shared authentication cookies for every open tab.
         */
        const latestExpiresAt =
          readStoredServerTokenExpiry() || readStoredExpiry();
        const latestRemaining = latestExpiresAt - Date.now();

        if (latestRemaining > 0) {
          scheduleExpiryCheck(latestRemaining);
          return;
        }

        void forceLogout();
      }, delay);
    };

    scheduleExpiryCheck(remaining);

    return true;
  }, [clearLogoutTimer, forceLogout]);

  const validateInactivityExpiry = useCallback(() => {
    if (isPublicPath(window.location.pathname)) {
      return true;
    }

    const expiresAt =
      readStoredServerTokenExpiry() || readStoredExpiry();

    if (!expiresAt || expiresAt <= Date.now()) {
      void forceLogout();
      return false;
    }

    startLogoutTimer();
    return true;
  }, [forceLogout, startLogoutTimer]);

  const scheduleServerRefresh = useCallback(
    (expiresAtValue = null) => {
      clearServerRefreshTimer();

      if (
        isPublicPath(window.location.pathname) ||
        !userRef.current ||
        logoutInProgressRef.current
      ) {
        return false;
      }

      const expiresAt =
        normalizeExpiry(expiresAtValue) ||
        readStoredServerTokenExpiry() ||
        readStoredExpiry();

      if (!expiresAt) {
        return false;
      }

      writeStoredServerTokenExpiry(expiresAt);
      writeStoredExpiry(expiresAt);

      if (expiresAt <= Date.now()) {
        void forceLogout();
        return false;
      }

      startLogoutTimer();
      return true;
    },
    [
      clearServerRefreshTimer,
      forceLogout,
      startLogoutTimer,
    ],
  );

  const refreshServerSession = useCallback(
    async ({ reason = "activity" } = {}) => {
      if (
        isPublicPath(window.location.pathname) ||
        !userRef.current ||
        logoutInProgressRef.current
      ) {
        return false;
      }

      if (!validateInactivityExpiry()) {
        return false;
      }

      if (refreshPromiseRef.current) {
        return refreshPromiseRef.current;
      }

      const controller = new AbortController();
      refreshControllerRef.current = controller;

      const refreshPromise = (async () => {
        try {
          const response = await api.post(
            "/api/users/refresh",
            { reason },
            {
              withCredentials: true,
              timeout: SESSION_REFRESH_TIMEOUT,
              signal: controller.signal,
              skipAuthRedirect: true,
            },
          );

          if (response.data?.success === false) {
            throw new Error(
              response.data?.message ||
                "Unable to refresh the session.",
            );
          }

          const expiresAt = normalizeExpiry(
            response.data?.expiresAt,
          );

          if (!expiresAt || expiresAt <= Date.now()) {
            throw new Error(
              "The refreshed session did not return a valid expiration.",
            );
          }

          lastServerRefreshRequestRef.current = Date.now();
          writeStoredServerTokenExpiry(expiresAt);
          writeStoredExpiry(expiresAt);
          scheduleServerRefresh(expiresAt);

          return true;
        } catch (error) {
          if (isCanceledRequest(error)) {
            return false;
          }

          if (shouldEndSessionAfterUserFetchError(error)) {
            await forceLogout();
            return false;
          }

          lastServerRefreshRequestRef.current = 0;

          console.warn(
            "Session refresh was unavailable:",
            error?.response?.data || error?.message,
          );

          const serverExpiresAt =
            readStoredServerTokenExpiry() || readStoredExpiry();

          if (!serverExpiresAt || serverExpiresAt <= Date.now()) {
            await forceLogout();
          } else {
            startLogoutTimer();
          }

          return false;
        } finally {
          if (refreshControllerRef.current === controller) {
            refreshControllerRef.current = null;
          }
        }
      })();

      refreshPromiseRef.current = refreshPromise;

      try {
        return await refreshPromise;
      } finally {
        if (refreshPromiseRef.current === refreshPromise) {
          refreshPromiseRef.current = null;
        }
      }
    },
    [
      clearServerRefreshTimer,
      forceLogout,
      scheduleServerRefresh,
      startLogoutTimer,
      validateInactivityExpiry,
    ],
  );

  refreshSessionRef.current = refreshServerSession;

  const ensureServerTokenReady = useCallback(async () => {
    const expiresAt =
      readStoredServerTokenExpiry() || readStoredExpiry();

    if (!expiresAt) {
      return true;
    }

    if (expiresAt <= Date.now()) {
      await forceLogout();
      return false;
    }

    scheduleServerRefresh(expiresAt);
    return true;
  }, [forceLogout, scheduleServerRefresh]);

  const extendSessionFromActivity = useCallback(
    (activityAt = Date.now()) => {
      if (
        isPublicPath(window.location.pathname) ||
        !userRef.current ||
        logoutInProgressRef.current
      ) {
        return false;
      }

      const serverExpiresAt =
        readStoredServerTokenExpiry() || readStoredExpiry();

      if (!serverExpiresAt || serverExpiresAt <= activityAt) {
        void forceLogout();
        return false;
      }

      lastServerRefreshRequestRef.current = activityAt;

      void refreshSessionRef.current?.({
        reason: "user-activity",
      });

      return true;
    },
    [forceLogout],
  );

  const fetchUser = useCallback(
    async ({ background = false } = {}) => {
      if (isPublicPath(window.location.pathname)) {
        /*
         * Public pages do not participate in authenticated HRIS validation.
         * Preserve the existing login for any already-open HRIS tab.
         */
        clearLogoutTimer();
        clearServerRefreshTimer();

        if (mountedRef.current) {
          setLoading(false);
        }

        return null;
      }

      if (!validateInactivityExpiry()) {
        return null;
      }

      const cachedUser = userRef.current || readCachedAuthSession()?.user;

      if (cachedUser && !userRef.current) {
        replaceUser(cachedUser);
      }

      const serverReady = await ensureServerTokenReady();

      if (!serverReady) {
        return null;
      }

      abortUserFetch();

      const requestEpoch = fetchEpochRef.current;
      const controller = new AbortController();
      fetchControllerRef.current = controller;

      if (mountedRef.current) {
        setLoading(!cachedUser && !background);
      }

      try {
        const response = await api.get("/api/users/me", {
          withCredentials: true,
          timeout: USER_REQUEST_TIMEOUT,
          signal: controller.signal,
          skipAuthRedirect: true,
        });

        if (requestEpoch !== fetchEpochRef.current || !mountedRef.current) {
          return null;
        }

        if (response.data?.success && response.data?.user) {
          replaceUser(response.data.user);

          const expiresAt = normalizeExpiry(response.data?.expiresAt);

          if (expiresAt > Date.now()) {
            writeStoredServerTokenExpiry(expiresAt);
            writeStoredExpiry(expiresAt);
            scheduleServerRefresh(expiresAt);
          }

          startLogoutTimer();
          return response.data.user;
        }

        console.warn(
          "Current-user response did not contain a user.",
          response.data,
        );

        return cachedUser || null;
      } catch (error) {
        if (
          requestEpoch !== fetchEpochRef.current ||
          !mountedRef.current ||
          isCanceledRequest(error)
        ) {
          return cachedUser || null;
        }

        if (shouldEndSessionAfterUserFetchError(error)) {
          await forceLogout();
          return null;
        }

        console.warn(
          "Current-user validation was unavailable; keeping cached session:",
          error?.response?.data || error?.message,
        );

        return cachedUser || null;
      } finally {
        if (fetchControllerRef.current === controller) {
          fetchControllerRef.current = null;
        }

        if (requestEpoch === fetchEpochRef.current && mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [
      abortUserFetch,
      clearLogoutTimer,
      clearServerRefreshTimer,
      ensureServerTokenReady,
      forceLogout,
      replaceUser,
      scheduleServerRefresh,
      startLogoutTimer,
      validateInactivityExpiry,
    ],
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      clearLogoutTimer();
      clearServerRefreshTimer();
      abortUserFetch();
      abortServerRefresh();
    };
  }, [
    abortServerRefresh,
    abortUserFetch,
    clearLogoutTimer,
    clearServerRefreshTimer,
  ]);

  useEffect(() => {
    const handleLogoutStart = () => {
      /*
       * Ignore shared Axios logout events while this tab is on a public
       * route. A public JD/API failure must not clear the HRIS session
       * that is active in another tab.
       */
      if (isPublicPath(window.location.pathname)) {
        return;
      }

      clearLocalAuthState();
    };

    window.addEventListener(AUTH_LOGOUT_START_EVENT, handleLogoutStart);

    return () => {
      window.removeEventListener(AUTH_LOGOUT_START_EVENT, handleLogoutStart);
    };
  }, [clearLocalAuthState]);

  useEffect(() => {
    if (publicRoute) {
      suspendAuthForPublicRoute();
      return undefined;
    }

    if (justLoggedInRef.current && userRef.current) {
      justLoggedInRef.current = false;
      setLoading(false);
      startLogoutTimer();

      const serverExpiresAt = readStoredServerTokenExpiry();

      if (serverExpiresAt > Date.now()) {
        scheduleServerRefresh(serverExpiresAt);
      }

      return undefined;
    }

    const cachedSession = readCachedAuthSession();

    if (cachedSession?.user) {
      replaceUser(cachedSession.user);
      setLoading(false);
      startLogoutTimer();

      const serverExpiresAt = readStoredServerTokenExpiry();

      if (serverExpiresAt > Date.now()) {
        scheduleServerRefresh(serverExpiresAt);
      }

      /* Cached users render immediately; validation runs silently. */
      void fetchUser({ background: true });
    } else {
      void fetchUser({ background: false });
    }

    return () => {
      abortUserFetch();
    };
  }, [
    abortUserFetch,
    fetchUser,
    publicRoute,
    replaceUser,
    scheduleServerRefresh,
    startLogoutTimer,
    suspendAuthForPublicRoute,
  ]);

  useEffect(() => {
    if (user) {
      writeCachedUser(user);
    }
  }, [user]);

  /*
   * Only meaningful interaction extends the session. Mouse movement alone is
   * deliberately excluded. Focus/visibility only validate the session.
   */
  useEffect(() => {
    if (publicRoute || !user) {
      return undefined;
    }

    function handleUserActivity(event) {
      if (event && event.isTrusted === false) {
        return;
      }

      const now = Date.now();

      if (now - lastHandledActivityRef.current < ACTIVITY_THROTTLE_MS) {
        return;
      }

      lastHandledActivityRef.current = now;
      extendSessionFromActivity(now);
    }

    function validateVisibleSession() {
      if (!validateInactivityExpiry()) {
        return;
      }

      void ensureServerTokenReady();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        validateVisibleSession();
      }
    }

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivity, { passive: true });
    });

    window.addEventListener("focus", validateVisibleSession);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    startLogoutTimer();

    const serverExpiresAt = readStoredServerTokenExpiry();

    if (serverExpiresAt > Date.now()) {
      scheduleServerRefresh(serverExpiresAt);
    }

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserActivity);
      });

      window.removeEventListener("focus", validateVisibleSession);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    ensureServerTokenReady,
    extendSessionFromActivity,
    publicRoute,
    scheduleServerRefresh,
    startLogoutTimer,
    user,
    validateInactivityExpiry,
  ]);

  /*
   * React Router navigation is also meaningful activity. This catches sidebar
   * and page navigation even when the originating click is handled elsewhere.
   */
  useEffect(() => {
    if (publicRoute || !user) return;

    const now = Date.now();
    lastHandledActivityRef.current = now;
    extendSessionFromActivity(now);
  }, [
    extendSessionFromActivity,
    location.pathname,
    location.search,
    publicRoute,
    user,
  ]);

  const updateUser = useCallback(
    (newUser, serverExpiresAt = null, expiresInMs = null) => {
      abortUserFetch();
      abortServerRefresh();
      clearServerRefreshTimer();

      if (!newUser) {
        clearLocalAuthState();
        return;
      }

      const now = Date.now();
      const normalizedServerExpiry = normalizeExpiry(serverExpiresAt);
      const expiresIn = Number(expiresInMs);
      const calculatedServerExpiry =
        normalizedServerExpiry > now
          ? normalizedServerExpiry
          : Number.isFinite(expiresIn) && expiresIn > 0
            ? now + expiresIn
            : readStoredServerTokenExpiry();

      if (calculatedServerExpiry > now) {
        writeStoredExpiry(calculatedServerExpiry);
        writeStoredServerTokenExpiry(calculatedServerExpiry);
      } else {
        clearStoredServerTokenExpiry();
      }

      lastHandledActivityRef.current = now;
      lastServerRefreshRequestRef.current = now;
      justLoggedInRef.current = true;

      replaceUser(newUser);
      setLoading(false);
      startLogoutTimer();

      if (calculatedServerExpiry > now) {
        scheduleServerRefresh(calculatedServerExpiry);
      }
    },
    [
      abortServerRefresh,
      abortUserFetch,
      clearLocalAuthState,
      clearServerRefreshTimer,
      replaceUser,
      scheduleServerRefresh,
      startLogoutTimer,
    ],
  );

  const completeInteractiveLogin = useCallback(
    (newUser, serverExpiresAt = null, expiresInMs = null) => {
      updateUser(newUser, serverExpiresAt, expiresInMs);
      birthdayLoginSequenceRef.current += 1;
      setPostLoginCelebrationEvent(
        createBirthdayLoginEvent({
          sequence: birthdayLoginSequenceRef.current,
          user: newUser,
        }),
      );
    },
    [updateUser],
  );

  const consumePostLoginCelebrationEvent = useCallback((eventId) => {
    setPostLoginCelebrationEvent((current) =>
      current?.id === eventId ? null : current,
    );
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        setUser: updateUser,
        completeInteractiveLogin,
        postLoginCelebrationEvent,
        consumePostLoginCelebrationEvent,
        refetchUser: fetchUser,
        refreshSession: refreshServerSession,
        logout: forceLogout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
