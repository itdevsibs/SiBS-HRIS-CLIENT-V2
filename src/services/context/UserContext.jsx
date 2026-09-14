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
const ACTIVITY_THROTTLE_MS = 1_000;

/*
 * The server JWT/cookie expiration is the hard HRIS session deadline.
 * Client activity may validate the deadline, but it must never extend it.
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

      const expiresAt =
        normalizeExpiry(expiresAtValue) ||
        readStoredServerTokenExpiry() ||
        readStoredExpiry();

      if (!expiresAt) {
        return false;
      }

      writeStoredServerTokenExpiry(expiresAt);

      if (expiresAt <= Date.now()) {
        void forceLogout();
        return false;
      }

      // No background refresh: startLogoutTimer owns the hard JWT deadline.
      return true;
    },
    [clearServerRefreshTimer, forceLogout],
  );

  const refreshServerSession = useCallback(async () => {
    /*
     * JWT expiration is a hard session deadline. Do not mint a replacement
     * token in the background; the configured server JWT lifetime must be
     * allowed to expire and return the user to /login.
     */
    const expiresAt =
      readStoredServerTokenExpiry() || readStoredExpiry();

    if (!expiresAt || expiresAt <= Date.now()) {
      await forceLogout();
      return false;
    }

    return false;
  }, [forceLogout]);

  refreshSessionRef.current = refreshServerSession;

  const ensureServerTokenReady = useCallback(async () => {
    const expiresAt =
      readStoredServerTokenExpiry() || readStoredExpiry();

    if (!expiresAt || expiresAt <= Date.now()) {
      await forceLogout();
      return false;
    }

    return true;
  }, [forceLogout]);

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

      // User activity must never move the JWT deadline forward.
      if (!currentExpiry || currentExpiry <= activityAt) {
        void forceLogout();
        return false;
      }

      startLogoutTimer();
      return true;
    },
    [forceLogout, startLogoutTimer],
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
            writeStoredExpiry(expiresAt);
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
   * User activity only checks the hard JWT deadline; it never extends it.
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
      const currentExpiry = readStoredExpiry();
      const effectiveExpiry =
        normalizedServerExpiry > now
          ? normalizedServerExpiry
          : currentExpiry > now
            ? currentExpiry
            : 0;

      /*
       * The server JWT expiration is the authoritative session deadline.
       * Updating the user object must not create a new one-hour client session.
       */
      idleDurationRef.current = writeStoredIdleDuration(SESSION_DURATION_MS);

      if (!effectiveExpiry) {
        clearLocalAuthState();
        return;
      }

      writeStoredExpiry(effectiveExpiry);
      writeStoredServerTokenExpiry(effectiveExpiry);

      lastHandledActivityRef.current = now;
      justLoggedInRef.current = true;

      replaceUser(newUser);
      setLoading(false);
      startLogoutTimer();

      scheduleServerRefresh(effectiveExpiry);
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
