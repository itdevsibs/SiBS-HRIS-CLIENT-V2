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

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/online-assessment",
  "/apply",
  "/public/talent-pool/apply",
  "/recruitment/talent-pool/apply",
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

export function UserProvider({ children }) {
  const location = useLocation();
  const publicRoute = isPublicPath(location.pathname);

  const initialSessionRef = useRef(undefined);

  if (initialSessionRef.current === undefined) {
    initialSessionRef.current = publicRoute
      ? null
      : readCachedAuthSession();
  }

  const initialSession = initialSessionRef.current;

  const [user, setUserState] = useState(initialSession?.user || null);
  const [loading, setLoading] = useState(!initialSession?.user);

  const mountedRef = useRef(true);
  const userRef = useRef(initialSession?.user || null);
  const logoutTimerRef = useRef(null);
  const fetchControllerRef = useRef(null);
  const authEpochRef = useRef(0);
  const logoutInProgressRef = useRef(false);

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

  const invalidateAuthRequests = useCallback(() => {
    authEpochRef.current += 1;

    fetchControllerRef.current?.abort();
    fetchControllerRef.current = null;
  }, []);

  const clearLocalAuthState = useCallback(() => {
    invalidateAuthRequests();
    clearLogoutTimer();
    clearCachedAuthSession();
    replaceUser(null, { cache: false });

    if (mountedRef.current) {
      setLoading(false);
    }
  }, [clearLogoutTimer, invalidateAuthRequests, replaceUser]);

  const createFixedExpiry = useCallback(
    (serverExpiresAt = null, { reset = false } = {}) => {
      const currentExpiry = readStoredExpiry();

      if (!reset && currentExpiry > Date.now()) {
        return currentExpiry;
      }

      const maximumExpiry = Date.now() + SESSION_DURATION_MS;
      const normalizedServerExpiry = normalizeExpiry(serverExpiresAt);

      const expiresAt =
        normalizedServerExpiry > Date.now()
          ? Math.min(normalizedServerExpiry, maximumExpiry)
          : maximumExpiry;

      return writeStoredExpiry(expiresAt);
    },
    [],
  );

  const forceLogout = useCallback(async () => {
    if (logoutInProgressRef.current) return;

    logoutInProgressRef.current = true;
    clearLocalAuthState();

    if (isPublicPath(window.location.pathname)) {
      logoutInProgressRef.current = false;
      return;
    }

    try {
      await handleLogout(true);
    } finally {
      logoutInProgressRef.current = false;
    }
  }, [clearLocalAuthState]);

  const startLogoutTimer = useCallback(() => {
    clearLogoutTimer();

    if (isPublicPath(window.location.pathname)) return false;

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

    logoutTimerRef.current = window.setTimeout(() => {
      void forceLogout();
    }, remaining);

    return true;
  }, [clearLogoutTimer, forceLogout]);

  const validateFixedExpiry = useCallback(() => {
    if (isPublicPath(window.location.pathname)) return true;

    const expiresAt = readStoredExpiry();

    if (!expiresAt || expiresAt <= Date.now()) {
      void forceLogout();
      return false;
    }

    startLogoutTimer();
    return true;
  }, [forceLogout, startLogoutTimer]);

  const fetchUser = useCallback(
    async ({ background = false } = {}) => {
      if (isPublicPath(window.location.pathname)) {
        clearLogoutTimer();
        replaceUser(null);
        setLoading(false);
        return null;
      }

      if (!validateFixedExpiry()) {
        return null;
      }

      const cachedUser = userRef.current || readCachedAuthSession()?.user;

      if (cachedUser && !userRef.current) {
        replaceUser(cachedUser);
      }

      invalidateAuthRequests();

      const requestEpoch = authEpochRef.current;
      const controller = new AbortController();
      fetchControllerRef.current = controller;

      // A reload with a valid cached user must render immediately.
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

        if (
          requestEpoch !== authEpochRef.current ||
          !mountedRef.current
        ) {
          return null;
        }

        if (response.data?.success && response.data?.user) {
          replaceUser(response.data.user);
          startLogoutTimer();
          return response.data.user;
        }

        // A malformed or temporarily incomplete response is not proof that
        // the fixed session expired. Keep the cached user until a real 401/403.
        console.warn("Current-user response did not contain a user.", response.data);
        return cachedUser || null;
      } catch (error) {
        if (
          requestEpoch !== authEpochRef.current ||
          !mountedRef.current ||
          isCanceledRequest(error)
        ) {
          return cachedUser || null;
        }

        if (shouldEndSessionAfterUserFetchError(error)) {
          await forceLogout();
          return null;
        }

        // Timeout, network failure, 404, or 5xx must not turn a valid
        // one-hour client session into an automatic logout on page refresh.
        console.warn(
          "Current-user validation was unavailable; keeping cached session:",
          error?.response?.data || error?.message,
        );

        return cachedUser || null;
      } finally {
        if (fetchControllerRef.current === controller) {
          fetchControllerRef.current = null;
        }

        if (
          requestEpoch === authEpochRef.current &&
          mountedRef.current
        ) {
          setLoading(false);
        }
      }
    },
    [
      clearLogoutTimer,
      forceLogout,
      invalidateAuthRequests,
      replaceUser,
      startLogoutTimer,
      validateFixedExpiry,
    ],
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearLogoutTimer();
      fetchControllerRef.current?.abort();
      fetchControllerRef.current = null;
    };
  }, [clearLogoutTimer]);

  useEffect(() => {
    const handleLogoutStart = () => {
      clearLocalAuthState();
    };

    window.addEventListener(AUTH_LOGOUT_START_EVENT, handleLogoutStart);

    return () => {
      window.removeEventListener(
        AUTH_LOGOUT_START_EVENT,
        handleLogoutStart,
      );
    };
  }, [clearLocalAuthState]);

  useEffect(() => {
    if (publicRoute) {
      clearLocalAuthState();
      return undefined;
    }

    const cachedSession = readCachedAuthSession();

    if (cachedSession?.user) {
      replaceUser(cachedSession.user);
      setLoading(false);
      startLogoutTimer();

      // Validate silently. Slow /me queries no longer block page rendering.
      void fetchUser({ background: true });
    } else {
      void fetchUser({ background: false });
    }

    return () => {
      fetchControllerRef.current?.abort();
    };
  }, [
    publicRoute,
    clearLocalAuthState,
    fetchUser,
    replaceUser,
    startLogoutTimer,
  ]);

  useEffect(() => {
    if (user) {
      writeCachedUser(user);
    }
  }, [user]);

  useEffect(() => {
    if (publicRoute || !user) return undefined;

    const handleFocus = () => {
      validateFixedExpiry();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        validateFixedExpiry();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    startLogoutTimer();

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [publicRoute, user, startLogoutTimer, validateFixedExpiry]);

  const updateUser = useCallback(
    (newUser, serverExpiresAt = null) => {
      invalidateAuthRequests();

      if (!newUser) {
        clearLocalAuthState();
        return;
      }

      // Supplying an expiry means this is a new login and starts a new hour.
      createFixedExpiry(serverExpiresAt, {
        reset: serverExpiresAt !== null && serverExpiresAt !== undefined,
      });

      replaceUser(newUser);
      setLoading(false);
      startLogoutTimer();
    },
    [
      clearLocalAuthState,
      createFixedExpiry,
      invalidateAuthRequests,
      replaceUser,
      startLogoutTimer,
    ],
  );

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        setUser: updateUser,
        refetchUser: fetchUser,
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
