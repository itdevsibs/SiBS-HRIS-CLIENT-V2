import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import Providers from "@/services/providers";
import ConditionalSidebar from "@/components/layout/ConditionalSidebar";
import Header from "@/components/layout/Header";
import OfflineStatusBanner from "@/components/ui/OfflineStatusBanner";
import SiBSAssistantLauncher from "@/components/assistant/SiBSAssistantLauncher";
import { isPublicPath } from "@/config/publicRoutes";
import { PersistentHeaderProvider } from "@/services/context/PersistentHeaderContext";
import { useHeader } from "@/services/context/HeaderContext";

const AdminLoginModal = lazy(() => import("@/components/modals/AdminLoginModal"));
const SiBSAIAssistant = lazy(() => import("@/components/ai/SiBSAIAssistant"));
const SiBSChat = lazy(() => import("@/components/chat/SiBSChat"));

function LazyAdminLoginModal() {
  const { adminLogin } = useHeader() || {};
  if (!adminLogin) return null;
  return (
    <Suspense fallback={null}>
      <AdminLoginModal />
    </Suspense>
  );
}

function LazyChatSurface({ enabled, isOpen, onOpenChange }) {
  const [hasMounted, setHasMounted] = useState(Boolean(isOpen));
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setHasMounted(true);
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  if (!enabled || (!hasMounted && !isOpen)) return null;

  return (
    <Suspense fallback={null}>
      <SiBSChat
        enabled={enabled}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        hideTrigger={true}
      />
    </Suspense>
  );
}

function LazyAiAssistantSurface({ enabled, isOpen, onOpenChange }) {
  const [hasMounted, setHasMounted] = useState(Boolean(isOpen));
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setHasMounted(true);
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  if (!enabled || (!hasMounted && !isOpen)) return null;

  return (
    <Suspense fallback={null}>
      <SiBSAIAssistant
        enabled={enabled}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        hideTrigger={true}
      />
    </Suspense>
  );
}

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
  const pageSurfaceRef = useRef(null);
  const lastPathnameRef = useRef(location.pathname);

  // Lock only the current route's page content while Chat is expanded.
  // Keep the persistent header and sidebar interactive for navigation.
  useEffect(() => {
    const surface = pageSurfaceRef.current;
    if (!surface) return undefined;

    const previousInert = surface.inert;
    surface.inert = chatOpen;
    return () => {
      surface.inert = previousInert;
    };
  }, [chatOpen, hideSidebar, isFinalInterviewForm]);

  // A navigation from the header, sidebar, or browser Back/Forward should
  // minimize Chat without discarding the selected conversation or draft.
  useEffect(() => {
    if (lastPathnameRef.current === location.pathname) return undefined;
    lastPathnameRef.current = location.pathname;
    const timer = setTimeout(() => {
      setChatOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    if (!chatOpen || hideSidebar || isFinalInterviewForm) return undefined;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = oldOverflow;
    };
  }, [chatOpen, hideSidebar, isFinalInterviewForm]);

  // Pages can select a conversation through ChatContext and then request
  // the existing chat surface without creating another message renderer.
  useEffect(() => {
    const openSelectedChat = () => {
      setAiOpen(false);
      setChatOpen(true);
    };
    window.addEventListener("sibs:chat:open-selected", openSelectedChat);
    return () => window.removeEventListener("sibs:chat:open-selected", openSelectedChat);
  }, []);

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
      <OfflineStatusBanner />
      {isFinalInterviewForm ? (
        <main className="h-dvh min-h-0 w-full overflow-y-auto overflow-x-hidden bg-sibs-canvas">
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

              <div ref={pageSurfaceRef} className="contents" aria-hidden={chatOpen ? "true" : undefined}>
                {children}
              </div>

              {chatOpen ? (
                // Block clicks on route content only. The header (z-80) and
                // sidebar remain above this layer and fully interactive.
                <div
                  aria-hidden="true"
                  data-sibs-chat-page-lock="true"
                  className="pointer-events-auto absolute inset-0 z-[30] cursor-default bg-slate-950/15 backdrop-blur-[1px]"
                />
              ) : null}
            </main>
          </div>
        </PersistentHeaderProvider>
      )}

      <LazyChatSurface
        enabled={!hideSidebar && !isFinalInterviewForm}
        isOpen={chatOpen}
        onOpenChange={handleChatOpenChange}
      />
      <LazyAiAssistantSurface
        enabled={!hideSidebar && !isFinalInterviewForm}
        isOpen={aiOpen}
        onOpenChange={handleAiOpenChange}
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
      <LazyAdminLoginModal />
    </Providers>
  );
}
