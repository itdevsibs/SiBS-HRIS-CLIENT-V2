import { useLocation } from "react-router-dom";

import { isStandalonePublicRoute } from "./config/publicRoutes";
import AppShell from "./AppShell";
import Router from "./router";
import AppErrorBoundary from "./components/ui/AppErrorBoundary";
import "./index.css";

export default function App() {
  const location = useLocation();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";

  /*
   * Candidate standalone experiences bypass AppShell so authenticated providers,
   * user-session checks, admin login overlays, and sidebar logic are never mounted for candidates.
   */
  if (isStandalonePublicRoute(location.pathname, hostname)) {
    return (
      <AppErrorBoundary resetKey={location.pathname}>
        <Router />
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
