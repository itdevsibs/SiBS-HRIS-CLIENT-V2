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
  SESSION_DURATION_MS,
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
const SERVER_REFRESH_RETRY_MAX_MS = 1_000;

/*
 * The inactivity deadline and the JWT/cookie deadline are different values.
 *
 * - accessTokenExpiresAt/token_expires_at: last user activity + idle duration
 * - serverTokenExpiresAt/server_token_expires_at: actual JWT expiration
 *
 * Keeping these values separate is required for sliding inactivity sessions.
 */
const SERVER_TOKEN_EXPIRY_SESSION_KEY = "serverTokenExpiresAt";
const SERVER_TOKEN_EXPIRY_LOCAL_KEY = "server_token_expires_at";
const SESSION_IDLE_DURATION_SESSION_KEY = "sessionIdleDurationMs";
const SESSION_IDLE_DURATION_LOCAL_KEY = "session_idle_duration_ms";

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
  "pointermove",
  "keydown",
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

  if (!sessionExpiry) return 0;

  return sessionExpiry;
}

function writeStoredServerTokenExpiry(value) {
  const expiresAt = normalizeExpiry(value);

  if (!expiresAt) return 0;

  getSessionStorage()?.setItem(
    SERVER_TOKEN_EXPIRY_SESSION_KEY,
    String(expiresAt),
  );

  getLocalStorage()?.removeItem(SERVER_TOKEN_EXPIRY_LOCAL_KEY);

  return expiresAt;
}

function clearStoredServerTokenExpiry() {
  getSessionStorage()?.removeItem(SERVER_TOKEN_EXPIRY_SESSION_KEY);

  getLocalStorage()?.removeItem(SERVER_TOKEN_EXPIRY_LOCAL_KEY);
}

function readStoredIdleDuration() {
  const duration = SESSION_DURATION_MS;

  getSessionStorage()?.setItem(
    SESSION_IDLE_DURATION_SESSION_KEY,
    String(duration),
  );

  getLocalStorage()?.removeItem(SESSION_IDLE_DURATION_LOCAL_KEY);

  return duration;
}

function writeStoredIdleDuration() {
  const duration = SESSION_DURATION_MS;

  getSessionStorage()?.setItem(
    SESSION_IDLE_DURATION_SESSION_KEY,
    String(duration),
  );

  getLocalStorage()?.removeItem(SESSION_IDLE_DURATION_LOCAL_KEY);

  return duration;
}

function clearStoredIdleDuration() {
  getSessionStorage()?.removeItem(SESSION_IDLE_DURATION_SESSION_KEY);

  getLocalStorage()?.removeItem(SESSION_IDLE_DURATION_LOCAL_KEY);
}

function getServerRefreshLeadMs(remainingMs) {
  const remaining = Math.max(0, Number(remainingMs) || 0);

  /*
   * Short test tokens, such as 10s, refresh at roughly 60% of their life.
   * A 10-second token therefore refreshes after about 6 seconds.
   */
  if (remaining <= 30_000) {
    return Math.min(
      Math.max(3_000, Math.floor(remaining * 0.4)),
      Math.max(0, remaining - 500),
    );
  }

  /*
   * Normal one-hour tokens refresh five minutes before expiration.
   */
  return Math.min(
    5 * 60 * 1_000,
    Math.max(30_000, Math.floor(remaining * 0.1)),
  );
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
  const idleDurationRef = useRef(readStoredIdleDuration());

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
    clearStoredIdleDuration();

    idleDurationRef.current = SESSION_DURATION_MS;
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

    const expiresAt = readStoredExpiry();

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
        const latestExpiresAt = readStoredExpiry();
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

    const expiresAt = readStoredExpiry();

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

      if (!validateInactivityExpiry()) {
        return false;
      }

      const expiresAt =
        normalizeExpiry(expiresAtValue) || readStoredServerTokenExpiry();

      if (!expiresAt) {
        return false;
      }

      writeStoredServerTokenExpiry(expiresAt);

      const remaining = expiresAt - Date.now();

      if (remaining <= 0) {
        void forceLogout();
        return false;
      }

      const refreshLead = getServerRefreshLeadMs(remaining);
      const delay = Math.max(0, remaining - refreshLead);

      serverRefreshTimerRef.current = window.setTimeout(() => {
        serverRefreshTimerRef.current = null;

        void refreshSessionRef.current?.({
          reason: "server-token-expiring",
        });
      }, delay);

      return true;
    },
    [clearServerRefreshTimer, forceLogout, validateInactivityExpiry],
  );

  const scheduleServerRefreshRetry = useCallback(() => {
    clearServerRefreshTimer();

    const expiresAt = readStoredServerTokenExpiry();
    const remaining = expiresAt - Date.now();

    if (remaining <= 0) {
      void forceLogout();
      return false;
    }

    const retryDelay = Math.min(
      SERVER_REFRESH_RETRY_MAX_MS,
      Math.max(250, Math.floor(remaining / 2)),
    );

    serverRefreshTimerRef.current = window.setTimeout(() => {
      serverRefreshTimerRef.current = null;

      void refreshSessionRef.current?.({
        reason: "server-refresh-retry",
      });
    }, retryDelay);

    return true;
  }, [clearServerRefreshTimer, forceLogout]);

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
              response.data?.message || "Unable to refresh the session.",
            );
          }

          const expiresAt = normalizeExpiry(response.data?.expiresAt);

          if (!expiresAt || expiresAt <= Date.now()) {
            throw new Error(
              "The refreshed session did not return a valid expiration.",
            );
          }

          writeStoredServerTokenExpiry(expiresAt);
          scheduleServerRefresh(expiresAt);

          /*
           * Do not change the inactivity deadline here. Only real user
           * activity restarts the inactivity countdown.
           */
          startLogoutTimer();

          return true;
        } catch (error) {
          if (isCanceledRequest(error)) {
            return false;
          }

          if (shouldEndSessionAfterUserFetchError(error)) {
            await forceLogout();
            return false;
          }

          console.warn(
            "Session refresh was unavailable:",
            error?.response?.data || error?.message,
          );

          scheduleServerRefreshRetry();
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
      forceLogout,
      scheduleServerRefresh,
      scheduleServerRefreshRetry,
      startLogoutTimer,
      validateInactivityExpiry,
    ],
  );

  refreshSessionRef.current = refreshServerSession;

  const ensureServerTokenReady = useCallback(async () => {
    const expiresAt = readStoredServerTokenExpiry();

    /*
     * Older cached sessions may not yet have this separate value. The /me
     * response will populate it without blocking the cached user display.
     */
    if (!expiresAt) {
      return true;
    }

    const remaining = expiresAt - Date.now();

    if (remaining <= 0) {
      await forceLogout();
      return false;
    }

    const refreshLead = getServerRefreshLeadMs(remaining);

    if (remaining <= refreshLead + 500) {
      return refreshServerSession({
        reason: "before-user-validation",
      });
    }

    scheduleServerRefresh(expiresAt);
    return true;
  }, [forceLogout, refreshServerSession, scheduleServerRefresh]);

  const extendSessionFromActivity = useCallback(
    (activityAt = Date.now()) => {
      if (
        isPublicPath(window.location.pathname) ||
        !userRef.current ||
        logoutInProgressRef.current
      ) {
        return false;
      }

      const currentExpiry = readStoredExpiry();

      /* Activity cannot revive an already expired session. */
      if (!currentExpiry || currentExpiry <= activityAt) {
        void forceLogout();
        return false;
      }

      const newExpiry = activityAt + idleDurationRef.current;

      writeStoredExpiry(newExpiry);
      startLogoutTimer();

      /*
       * The JWT refresh timer is independent from activity events. Continuous
       * pointer movement therefore cannot postpone token refresh forever.
       */
      const serverExpiresAt = readStoredServerTokenExpiry();

      if (serverExpiresAt) {
        const remaining = serverExpiresAt - activityAt;
        const refreshLead = getServerRefreshLeadMs(remaining);

        if (remaining <= refreshLead + 500) {
          void refreshServerSession({
            reason: "user-activity-near-token-expiry",
          });
        } else {
          scheduleServerRefresh(serverExpiresAt);
        }
      }

      return true;
    },
    [
      forceLogout,
      refreshServerSession,
      scheduleServerRefresh,
      startLogoutTimer,
    ],
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

    idleDurationRef.current = readStoredIdleDuration();

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
   * A trusted user action restarts the inactivity countdown. Page refresh by
   * itself does not restart it.
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

    function handleVisibilityChange(event) {
      if (document.visibilityState === "visible") {
        handleUserActivity(event);
      }
    }

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivity, { passive: true });
    });

    window.addEventListener("focus", handleUserActivity);

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

      window.removeEventListener("focus", handleUserActivity);

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    extendSessionFromActivity,
    publicRoute,
    scheduleServerRefresh,
    startLogoutTimer,
    user,
  ]);

  const updateUser = useCallback(
    (newUser, serverExpiresAt = null) => {
      abortUserFetch();
      abortServerRefresh();
      clearServerRefreshTimer();

      if (!newUser) {
        clearLocalAuthState();
        return;
      }

      const now = Date.now();
      const normalizedServerExpiry = normalizeExpiry(serverExpiresAt);

      /*
       * The inactivity window is always one hour. The JWT may be much shorter
       * during testing (for example 10 seconds), but it is refreshed
       * independently and must never shorten the user's inactivity session.
       */
      idleDurationRef.current = writeStoredIdleDuration(SESSION_DURATION_MS);

      writeStoredExpiry(now + SESSION_DURATION_MS);

      if (normalizedServerExpiry > now) {
        writeStoredServerTokenExpiry(normalizedServerExpiry);
      } else {
        clearStoredServerTokenExpiry();
      }

      lastHandledActivityRef.current = now;
      justLoggedInRef.current = true;

      replaceUser(newUser);
      setLoading(false);
      startLogoutTimer();

      if (normalizedServerExpiry > now) {
        scheduleServerRefresh(normalizedServerExpiry);
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
