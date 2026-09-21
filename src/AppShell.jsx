import { useCallback, useState } from "react";
import { useLocation } from "react-router-dom";

import Providers from "@/services/providers";
import ConditionalSidebar from "@/components/layout/ConditionalSidebar";
import AdminLoginModal from "@/components/modals/AdminLoginModal";
import SiBSAIAssistant from "@/components/ai/SiBSAIAssistant";
import SiBSChat from "@/components/chat/SiBSChat";
import SiBSAssistantLauncher from "@/components/assistant/SiBSAssistantLauncher";
import { isPublicPath } from "@/config/publicRoutes";

export default function AppShell({ children }) {
  const location = useLocation();
  const hideSidebar = isPublicPath(location.pathname);

  const [aiOpen, setAiOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const handleOpenAi = useCallback(() => {
    setChatOpen(false);
    setAiOpen(true);
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
        <div className="flex min-h-screen bg-sibs-tertiary-10">
          <ConditionalSidebar />

          <main className="min-w-0 flex-1">{children}</main>
        </div>
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
        onOpenChat={handleOpenChat}
        onToggleChat={handleToggleChat}
        isAiOpen={aiOpen}
        isChatOpen={chatOpen}
      />
      <AdminLoginModal />
    </Providers>
  );
}