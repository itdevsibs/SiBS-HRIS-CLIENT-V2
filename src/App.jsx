import { useLocation } from "react-router-dom";

import { isStandalonePublicRoute } from "./config/publicRoutes";
import AppShell from "./AppShell";
import Router from "./router";
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
    return <Router />;
  }

  return (
    <AppShell>
      <Router />
    </AppShell>
  );
}
