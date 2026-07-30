import { useLocation } from "react-router-dom";

import AppShell from "./AppShell";
import Router from "./router";
import "./index.css";

function isStandalonePublicInterviewRoute(pathname = "") {
  return (
    pathname === "/public/interview-date" ||
    pathname.startsWith("/public/interview-date/")
  );
}

export default function App() {
  const location = useLocation();

  /*
   * Candidate interview scheduling is a standalone public experience.
   * It bypasses AppShell so authenticated providers, user-session checks,
   * admin login overlays, and sidebar logic are never mounted for candidates.
   */
  if (isStandalonePublicInterviewRoute(location.pathname)) {
    return <Router />;
  }

  return (
    <AppShell>
      <Router />
    </AppShell>
  );
}
