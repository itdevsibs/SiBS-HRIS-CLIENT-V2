import Providers from "@/services/providers";
import ConditionalSidebar from "@/components/layout/ConditionalSidebar";
import AdminLoginModal from "@/components/modals/AdminLoginModal";

export default function AppShell({ children }) {
  return (
    <Providers>
      <div className="min-h-screen flex bg-sibs-tertiary-10">
        <ConditionalSidebar />

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <AdminLoginModal />
    </Providers>
  );
}
