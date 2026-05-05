import { usePathname } from "@/lib/router";
import Sidebar from "./Sidebar";

export default function ConditionalSidebar() {
  const pathname = usePathname() || "";

  // Hide the sidebar on these exact routes or prefixes
  const hideOn = ["/login"];

  for (const p of hideOn) {
    if (pathname === p || pathname.startsWith(p + "/")) return null;
  }

  return <Sidebar />;
}
