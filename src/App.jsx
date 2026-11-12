import { useLocation } from "react-router-dom";

import { isStandalonePublicRoute, normalizePath } from "./config/publicRoutes";
import { UserProvider } from "./services/context/UserContext";
import { readCachedAuthSession } from "./services/auth/auth-session-cache";
import AppShell from "./AppShell";
import Router from "./router";
import AppErrorBoundary from "./components/ui/AppErrorBoundary";
import "./index.css";

export default function App() {
  const location = useLocation();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";

  const isLoginRoute = normalizePath(location.pathname) === "/login";
  const hasActiveSession = Boolean(readCachedAuthSession()?.user);

  /*
   * Candidate standalone experiences and unauthenticated login bypass AppShell so
   * authenticated providers (like OffersProvider), admin overlays, and sidebar logic
   * are never mounted when unauthenticated.
   * When an authenticated session is active, mount AppShell so normal dashboard
   * and session redirection work cleanly.
   */
  const shouldBypassShell =
    (isLoginRoute && !hasActiveSession) ||
    (!isLoginRoute && isStandalonePublicRoute(location.pathname, hostname));

  if (shouldBypassShell) {
    return (
      <AppErrorBoundary resetKey={location.pathname}>
        <UserProvider>
          <Router />
        </UserProvider>
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary resetKey={location.pathname}>
      <AppShell>
        <Router />
      </AppShell>
    </AppErrorBoundary>
  );
}
