import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function ConditionalSidebar() {
  const location = useLocation();
  const pathname = location.pathname || "";

  // Hide the sidebar on these exact routes or prefixes
  const hideOn = ["/login", "/recruitment/final-interview-form"];

  for (const p of hideOn) {
    if (pathname === p || pathname.startsWith(p + "/")) return null;
  }

  return <Sidebar />;
}
