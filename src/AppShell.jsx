import { useCallback, useState } from "react";
import { useLocation } from "react-router-dom";

import Providers from "@/services/providers";
import ConditionalSidebar from "@/components/layout/ConditionalSidebar";
import Header from "@/components/layout/Header";
import AdminLoginModal from "@/components/modals/AdminLoginModal";
import SiBSAIAssistant from "@/components/ai/SiBSAIAssistant";
import SiBSChat from "@/components/chat/SiBSChat";
import SiBSAssistantLauncher from "@/components/assistant/SiBSAssistantLauncher";
import { isPublicPath } from "@/config/publicRoutes";
import { PersistentHeaderProvider } from "@/services/context/PersistentHeaderContext";

export default function AppShell({ children }) {
  const location = useLocation();
  const hideSidebar = isPublicPath(location.pathname);
  // The Job Evaluation / Final Interview form is an authenticated, full-page
  // workspace. Do not mount the normal HRIS header/sidebar over this route.
  const isFinalInterviewForm =
    location.pathname === "/recruitment/final-interview-form" ||
    location.pathname.startsWith("/recruitment/final-interview-form/");

  const [aiOpen, setAiOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const handleOpenAi = useCallback(() => {
    setChatOpen(false);
    setAiOpen(true);
  }, []);

  const handleToggleAi = useCallback(() => {
    setChatOpen(false);
    setAiOpen((prev) => !prev);
  }, []);

  const handleOpenChat = useCallback(() => {
    setAiOpen(false);
    setChatOpen(true);
  }, []);

  const handleToggleChat = useCallback(() => {
    setAiOpen(false);
    setChatOpen((prev) => !prev);
  }, []);

  const handleChatOpenChange = useCallback((isOpen) => {
    setChatOpen(isOpen);
    if (isOpen) {
      setAiOpen(false);
    }
  }, []);

  const handleAiOpenChange = useCallback((isOpen) => {
    setAiOpen(isOpen);
    if (isOpen) {
      setChatOpen(false);
    }
  }, []);

  return (
    <Providers>
      {isFinalInterviewForm ? (
        <main className="h-dvh min-h-0 w-full overflow-y-auto overflow-x-hidden bg-[#E9EEF5]">
          {children}
        </main>
      ) : hideSidebar ? (
        <div className="min-h-screen w-full bg-sibs-tertiary-10">
          <main className="min-h-screen w-full">{children}</main>
        </div>
      ) : (
        <PersistentHeaderProvider>
          <div className="flex h-dvh min-h-0 bg-sibs-tertiary-10">
            <ConditionalSidebar />

            <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
              {/*
               * Keep the authenticated Header mounted outside the route tree.
               * Page-level <Header /> instances render only a matching spacer,
               * so navigating between routes refreshes page content only.
               */}
              <div className="pointer-events-auto absolute inset-x-0 top-0 z-[80]">
                <Header persistent />
              </div>

              {children}
            </main>
          </div>
        </PersistentHeaderProvider>
      )}

      <SiBSChat
        enabled={!hideSidebar && !isFinalInterviewForm}
        isOpen={chatOpen}
        onOpenChange={handleChatOpenChange}
        hideTrigger={true}
      />
      <SiBSAIAssistant
        enabled={!hideSidebar && !isFinalInterviewForm}
        isOpen={aiOpen}
        onOpenChange={handleAiOpenChange}
        hideTrigger={true}
      />
      <SiBSAssistantLauncher
        enabled={!hideSidebar && !isFinalInterviewForm}
        onOpenAi={handleOpenAi}
        onToggleAi={handleToggleAi}
        onOpenChat={handleOpenChat}
        onToggleChat={handleToggleChat}
        isAiOpen={aiOpen}
        isChatOpen={chatOpen}
      />
      <AdminLoginModal />
    </Providers>
  );
}