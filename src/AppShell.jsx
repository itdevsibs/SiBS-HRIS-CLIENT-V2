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
      {hideSidebar ? (
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
        enabled={!hideSidebar}
        isOpen={chatOpen}
        onOpenChange={handleChatOpenChange}
        hideTrigger={true}
      />
      <SiBSAIAssistant
        enabled={!hideSidebar}
        isOpen={aiOpen}
        onOpenChange={handleAiOpenChange}
        hideTrigger={true}
      />
      <SiBSAssistantLauncher
        enabled={!hideSidebar}
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