import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useLocation } from "react-router-dom";
import api, {
  AUTH_LOGOUT_START_EVENT,
  handleLogout,
} from "../../lib/axios/api-template";

const UserContext = createContext(null);

/*
 * The previous 3-second gap created repeated refresh calls during clicks,
 * focus, scrolling and page visibility changes. One minute is frequent
 * enough for session extension without flooding the authentication routes.
 */
const REFRESH_GAP = 60_000;
const USER_REQUEST_TIMEOUT = 10_000;
const REFRESH_REQUEST_TIMEOUT = 8_000;

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
  const pathname = location.pathname;
  const publicRoute = isPublicPath(pathname);

  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(true);
  const userRef = useRef(null);
  const logoutTimerRef = useRef(null);
  const fetchControllerRef = useRef(null);
  const refreshInProgressRef = useRef(false);
  const lastRefreshRef = useRef(0);
  const authEpochRef = useRef(0);

  const replaceUser = useCallback((nextUser) => {
    userRef.current = nextUser;

    if (mountedRef.current) {
      setUserState(nextUser);
    }
  }, []);

  const clearStoredSession = useCallback(() => {
    sessionStorage.removeItem("accessTokenExpiresAt");
  }, []);

  const clearLogoutTimer = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const invalidateAuthRequests = useCallback(() => {
    authEpochRef.current += 1;
    refreshInProgressRef.current = false;

    fetchControllerRef.current?.abort();
    fetchControllerRef.current = null;
  }, []);

  const clearLocalAuthState = useCallback(() => {
    invalidateAuthRequests();
    clearLogoutTimer();
    clearStoredSession();
    replaceUser(null);

    if (mountedRef.current) {
      setLoading(false);
    }
  }, [
    clearLogoutTimer,
    clearStoredSession,
    invalidateAuthRequests,
    replaceUser,
  ]);

  const forceLogout = useCallback(() => {
    clearLocalAuthState();
    void handleLogout(true);
  }, [clearLocalAuthState]);

  const startLogoutTimer = useCallback(() => {
    clearLogoutTimer();

    if (isPublicPath(window.location.pathname)) return;

    const expiresAtRaw = sessionStorage.getItem("accessTokenExpiresAt");
    if (!expiresAtRaw) return;

    const expiresAt = Number(expiresAtRaw);
    if (!expiresAt || Number.isNaN(expiresAt)) return;

    const remaining = expiresAt - Date.now();

    if (remaining <= 0) {
      forceLogout();
      return;
    }

    logoutTimerRef.current = setTimeout(() => {
      forceLogout();
    }, remaining);
  }, [clearLogoutTimer, forceLogout]);

  const fetchUser = useCallback(async () => {
    if (isPublicPath(window.location.pathname)) {
      clearLocalAuthState();
      return null;
    }

    fetchControllerRef.current?.abort();

    const controller = new AbortController();
    const requestEpoch = authEpochRef.current;

    fetchControllerRef.current = controller;

    if (!userRef.current && mountedRef.current) {
      setLoading(true);
    }

    try {
      const res = await api.get("/api/users/me", {
        withCredentials: true,
        signal: controller.signal,
        timeout: USER_REQUEST_TIMEOUT,
        skipAuthRedirect: true,
      });

      if (
        controller.signal.aborted ||
        requestEpoch !== authEpochRef.current ||
        !mountedRef.current
      ) {
        return null;
      }

      if (!res.data?.success || !res.data?.user) {
        replaceUser(null);
        return null;
      }

      replaceUser(res.data.user);
      startLogoutTimer();
      return res.data.user;
    } catch (error) {
      if (
        isCanceledRequest(error) ||
        requestEpoch !== authEpochRef.current ||
        !mountedRef.current
      ) {
        return null;
      }

      if (error.response?.status === 401 || error.response?.status === 403) {
        clearLocalAuthState();
        return null;
      }

      console.error("User fetch error:", error);
      return null;
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
  }, [clearLocalAuthState, replaceUser, startLogoutTimer]);

  const refreshSession = useCallback(async () => {
    const now = Date.now();

    if (isPublicPath(window.location.pathname)) return false;
    if (!userRef.current) return false;
    if (refreshInProgressRef.current) return false;
    if (now - lastRefreshRef.current < REFRESH_GAP) return false;

    const requestEpoch = authEpochRef.current;

    try {
      refreshInProgressRef.current = true;
      lastRefreshRef.current = now;

      const res = await api.post(
        "/api/users/refresh",
        {},
        {
          withCredentials: true,
          timeout: REFRESH_REQUEST_TIMEOUT,
          skipAuthRedirect: true,
        },
      );

      if (
        requestEpoch !== authEpochRef.current ||
        !mountedRef.current
      ) {
        return false;
      }

      if (res.data?.expiresAt) {
        sessionStorage.setItem(
          "accessTokenExpiresAt",
          String(res.data.expiresAt),
        );
      }

      startLogoutTimer();
      return true;
    } catch (error) {
      if (
        requestEpoch !== authEpochRef.current ||
        !mountedRef.current
      ) {
        return false;
      }

      if (error?.response?.status === 401 || error?.response?.status === 403) {
        clearLocalAuthState();
      } else if (!isCanceledRequest(error)) {
        console.error("Session refresh error:", error);
      }

      return false;
    } finally {
      refreshInProgressRef.current = false;
    }
  }, [clearLocalAuthState, startLogoutTimer]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearLogoutTimer();
      fetchControllerRef.current?.abort();
      fetchControllerRef.current = null;
    };
  }, [clearLogoutTimer]);

  /*
   * handleLogout can be called from UserDropdown or the Axios interceptor.
   * This event immediately stops old /me requests before the server logout
   * request completes, so they cannot overwrite a later login.
   */
  useEffect(() => {
    const handleLogoutStart = () => {
      clearLocalAuthState();
    };

    window.addEventListener(AUTH_LOGOUT_START_EVENT, handleLogoutStart);

    return () => {
      window.removeEventListener(AUTH_LOGOUT_START_EVENT, handleLogoutStart);
    };
  }, [clearLocalAuthState]);

  useEffect(() => {
    if (publicRoute) {
      clearLocalAuthState();
      return;
    }

    /*
     * LoginPage already supplies the authenticated user through setUser.
     * Do not immediately duplicate that work with /me and /refresh calls.
     */
    if (userRef.current) {
      setLoading(false);
      startLogoutTimer();
      return;
    }

    void fetchUser();

    return () => {
      fetchControllerRef.current?.abort();
    };
  }, [pathname, publicRoute, clearLocalAuthState, fetchUser, startLogoutTimer]);

  useEffect(() => {
    if (publicRoute || !user) return;

    const handleActivity = () => {
      void refreshSession();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshSession();
        startLogoutTimer();
      }
    };

    const handleFocus = () => {
      void refreshSession();
      startLogoutTimer();
    };

    window.addEventListener("click", handleActivity, { passive: true });
    window.addEventListener("scroll", handleActivity, { passive: true });
    window.addEventListener("wheel", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("wheel", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user, publicRoute, refreshSession, startLogoutTimer]);

  const updateUser = useCallback(
    (newUser) => {
      invalidateAuthRequests();
      replaceUser(newUser || null);
      setLoading(false);

      if (newUser) {
        startLogoutTimer();
      } else {
        clearLogoutTimer();
      }
    }, [
      clearLogoutTimer,
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
        refreshSession,
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
