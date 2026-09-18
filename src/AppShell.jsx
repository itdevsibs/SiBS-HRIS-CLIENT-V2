import { useLocation } from "react-router-dom";

import Providers from "@/services/providers";
import ConditionalSidebar from "@/components/layout/ConditionalSidebar";
import AdminLoginModal from "@/components/modals/AdminLoginModal";
import SiBSAIAssistant from "@/components/ai/SiBSAIAssistant";
import { isPublicPath } from "@/config/publicRoutes";

export default function AppShell({ children }) {
  const location = useLocation();
  const hideSidebar = isPublicPath(location.pathname);

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

      <SiBSChat enabled={!hideSidebar} />
      <SiBSAIAssistant enabled={!hideSidebar} />
      <AdminLoginModal />
    </Providers>
  );
}