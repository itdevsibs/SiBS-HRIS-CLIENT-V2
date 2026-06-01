import { useLocation } from "react-router-dom";

import Providers from "@/services/providers";
import ConditionalSidebar from "@/components/layout/ConditionalSidebar";
import AdminLoginModal from "@/components/modals/AdminLoginModal";

const PUBLIC_ROUTES_WITHOUT_SIDEBAR = [
  "/",
  "/login",
  "/recruitment/talent-pool/apply",
];

function shouldHideSidebar(pathname) {
  return PUBLIC_ROUTES_WITHOUT_SIDEBAR.some((path) => {
    if (path === "/") return pathname === "/";

    return pathname === path || pathname.startsWith(`${path}/`);
  });
}

export default function AppShell({ children }) {
  const location = useLocation();
  const hideSidebar = shouldHideSidebar(location.pathname);

  return (
    <Providers>
      {hideSidebar ? (
        <div className="min-h-screen w-full bg-sibs-tertiary-10">
          <main className="min-h-screen w-full">{children}</main>
        </div>
      ) : (
        <div className="flex min-h-screen bg-sibs-tertiary-10">
          <ConditionalSidebar />

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      )}

      <AdminLoginModal />
    </Providers>
  );
}