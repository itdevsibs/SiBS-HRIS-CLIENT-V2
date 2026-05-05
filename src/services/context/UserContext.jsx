import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { usePathname } from "@/lib/router";
import api, { handleLogout } from "../../lib/axios/api-template";

const UserContext = createContext(null);
const REFRESH_GAP = 3000; // testing only

export function UserProvider({ children }) {
  const pathname = usePathname();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logoutTimerRef = useRef(null);
  const refreshInProgressRef = useRef(false);
  const lastRefreshRef = useRef(0);

  const clearStoredSession = useCallback(() => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("accessTokenExpiresAt");
  }, []);

  const clearLogoutTimer = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const forceLogout = useCallback(() => {
    clearLogoutTimer();
    clearStoredSession();
    setUser(null);
    handleLogout();
  }, [clearLogoutTimer, clearStoredSession]);

  const startLogoutTimer = useCallback(() => {
    if (typeof window === "undefined") return;

    clearLogoutTimer();

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
    try {
      const res = await api.get("/api/users/me", {
        withCredentials: true,
      });

      if (!res.data?.success || !res.data?.user) {
        setUser(null);
        return null;
      }

      setUser(res.data.user);
      startLogoutTimer();
      return res.data.user;
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        clearStoredSession();
        setUser(null);
        return null;
      }

      console.error("User fetch error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [startLogoutTimer, clearStoredSession]);

  const refreshSession = useCallback(async () => {
    const now = Date.now();

    if (pathname === "/login") return false;
    if (!user) return false;
    if (refreshInProgressRef.current) return false;
    if (now - lastRefreshRef.current < REFRESH_GAP) return false;

    try {
      refreshInProgressRef.current = true;
      lastRefreshRef.current = now;

      const res = await api.post(
        "/api/users/refresh",
        {},
        {
          withCredentials: true,
        }
      );

      if (res.data?.expiresAt) {
        sessionStorage.setItem(
          "accessTokenExpiresAt",
          String(res.data.expiresAt)
        );
      }

      startLogoutTimer();
      return true;
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        clearStoredSession();
        setUser(null);
      }

      // console.error(
      //   "Session refresh failed:",
      //   error?.response?.data || error.message
      // );
      return false;
    } finally {
      refreshInProgressRef.current = false;
    }
  }, [pathname, user, startLogoutTimer, clearStoredSession]);

  useEffect(() => {
    if (pathname === "/login") {
      setLoading(false);
      clearLogoutTimer();
      clearStoredSession();
      return;
    }

    fetchUser();
    startLogoutTimer();

    return () => {
      clearLogoutTimer();
    };
  }, [pathname, fetchUser, startLogoutTimer, clearLogoutTimer, clearStoredSession]);

  useEffect(() => {
  if (!user || pathname === "/login") return;

  const handleActivity = () => {
    refreshSession();
  };

  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      fetchUser();
      refreshSession();
      startLogoutTimer();
    }
  };

  const handleFocus = () => {
    fetchUser();
    refreshSession();
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
}, [user, pathname, fetchUser, refreshSession, startLogoutTimer]);

  useEffect(() => {
    if (pathname === "/login" || !user) return;

    refreshSession();
    startLogoutTimer();
  }, [pathname, user, refreshSession, startLogoutTimer]);

  const updateUser = useCallback((newUser) => {
    setUser(newUser);
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        setUser: updateUser,
        refetchUser: fetchUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}