import { useLocation } from "react-router-dom";

import AppShell from "./AppShell";
import Router from "./router";
import "./index.css";

function isStandalonePublicRoute(pathname = "") {
  return (
    pathname === "/public/interview-date" ||
    pathname.startsWith("/public/interview-date/") ||
    pathname === "/public/offer-response" ||
    pathname.startsWith("/public/offer-response/") ||
    pathname === "/public/nho-schedule-response" ||
    pathname.startsWith("/public/nho-schedule-response/")
  );
}

export default function App() {
  const location = useLocation();

  /*
   * Candidate interview scheduling is a standalone public experience.
   * It bypasses AppShell so authenticated providers, user-session checks,
   * admin login overlays, and sidebar logic are never mounted for candidates.
   */
  if (isStandalonePublicRoute(location.pathname)) {
    return <Router />;
  }

  return (
    <AppShell>
      <Router />
    </AppShell>
  );
}
