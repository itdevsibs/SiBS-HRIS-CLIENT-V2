import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, MessageCircleMore, Sparkles, X } from "lucide-react";

import { useUser } from "@/services/context/UserContext";
import { useChat } from "@/services/context/ChatContext";

export default function SiBSAssistantLauncher({
  enabled = true,
  onOpenAi,
  onOpenChat,
  onToggleChat,
  isAiOpen = false,
  isChatOpen = false,
}) {
  const { user, loading: userLoading } = useUser() || {};
  const chat = useChat();

  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const firstItemRef = useRef(null);

  const totalUnread = Number(chat?.totalUnread || 0);
  const isChatAllowed = chat?.chatAllowed === true;

  const isVisible = enabled && !userLoading && Boolean(user);

  // Close menu when an assistant drawer transitions to open
  const prevAiOpenRef = useRef(isAiOpen);
  const prevChatOpenRef = useRef(isChatOpen);

  useEffect(() => {
    if (
      (!prevAiOpenRef.current && isAiOpen) ||
      (!prevChatOpenRef.current && isChatOpen)
    ) {
      setMenuOpen(false);
    }
    prevAiOpenRef.current = isAiOpen;
    prevChatOpenRef.current = isChatOpen;
  }, [isAiOpen, isChatOpen]);

  // Click outside listener to close menu
  useEffect(() => {
    if (!menuOpen) return undefined;

    function handlePointerDown(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [menuOpen]);

  // Keyboard navigation & Escape key listener
  useEffect(() => {
    if (!menuOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  // Focus management when menu opens
  useEffect(() => {
    if (menuOpen) {
      window.requestAnimationFrame(() => {
        firstItemRef.current?.focus?.();
      });
    }
  }, [menuOpen]);

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const handleSelectAi = useCallback(() => {
    setMenuOpen(false);
    onOpenAi?.();
  }, [onOpenAi]);

  const handleSelectChat = useCallback(() => {
    if (!isChatAllowed) return;
    setMenuOpen(false);
    if (isChatOpen) {
      onToggleChat ? onToggleChat() : onOpenChat?.();
    } else {
      onOpenChat?.();
    }
  }, [isChatAllowed, isChatOpen, onToggleChat, onOpenChat]);

  if (!isVisible) return null;

  return (
    <aside
      ref={containerRef}
      aria-label="SiBS Assistant Navigation"
      className="fixed z-[100] font-jakarta right-4 sm:right-6"
      style={{
        bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* Floating Menu Popover */}
      {menuOpen ? (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="sibs-assistant-trigger"
          className="absolute bottom-[calc(100%+0.75rem)] right-0 w-[calc(100vw-2rem)] max-w-xs sm:max-w-sm rounded-2xl border border-sibs-border bg-white p-2.5 shadow-2xl transition-all duration-200 ease-out"
        >
          {/* Menu Header */}
          <div className="flex items-center justify-between border-b border-sibs-border px-2.5 pb-2 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-sibs-orange text-white">
                <Sparkles size={12} />
              </span>
              <span className="font-heading text-xs font-bold uppercase tracking-wider text-sibs-navy">
                SiBS Assistant
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close assistant menu"
              className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-sibs-muted transition hover:bg-sibs-surface hover:text-sibs-navy focus:outline-none focus:ring-2 focus:ring-sibs-orange/30"
            >
              <X size={14} />
            </button>
          </div>

          {/* Menu Options */}
          <div className="mt-2 space-y-1.5">
            {/* Option 1: Ask SiBS AI */}
            <button
              ref={firstItemRef}
              role="menuitem"
              type="button"
              onClick={handleSelectAi}
              className="group flex min-h-[52px] w-full items-center gap-3 rounded-xl border border-transparent p-2.5 text-left transition hover:border-sibs-border hover:bg-sibs-surface focus:border-sibs-orange focus:bg-sibs-surface focus:outline-none"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sibs-orange text-white shadow-xs transition group-hover:scale-105">
                <Sparkles size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-sm font-bold text-sibs-navy group-hover:text-sibs-orange">
                  Ask SiBS AI
                </p>
                <p className="text-[11px] font-semibold text-sibs-muted">
                  HRIS questions & insights
                </p>
              </div>
              <ChevronRight
                size={16}
                className="shrink-0 text-sibs-faint transition group-hover:translate-x-0.5 group-hover:text-sibs-orange"
              />
            </button>

            {/* Option 2: SiBS Chat */}
            <button
              role="menuitem"
              type="button"
              onClick={handleSelectChat}
              disabled={!isChatAllowed}
              className={`group flex min-h-[52px] w-full items-center gap-3 rounded-xl border border-transparent p-2.5 text-left transition ${
                isChatAllowed
                  ? "hover:border-sibs-border hover:bg-sibs-surface focus:border-sibs-orange focus:bg-sibs-surface focus:outline-none"
                  : "cursor-not-allowed opacity-50"
              }`}
            >
              <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sibs-navy text-white shadow-xs transition group-hover:scale-105">
                <MessageCircleMore size={18} />
                {totalUnread > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[8px] font-black text-white">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                ) : null}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-heading text-sm font-bold text-sibs-navy group-hover:text-sibs-orange">
                    SiBS Chat
                  </p>
                  {totalUnread > 0 ? (
                    <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-extrabold text-red-600">
                      {totalUnread > 99 ? "99+" : totalUnread} new
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] font-semibold text-sibs-muted">
                  {totalUnread > 0
                    ? `${totalUnread} unread message${totalUnread === 1 ? "" : "s"}`
                    : "Messages & support summary"}
                </p>
              </div>
              <ChevronRight
                size={16}
                className="shrink-0 text-sibs-faint transition group-hover:translate-x-0.5 group-hover:text-sibs-orange"
              />
            </button>
          </div>
        </div>
      ) : null}

      {/* Launcher Trigger Button */}
      <button
        ref={triggerRef}
        id="sibs-assistant-trigger"
        type="button"
        onClick={toggleMenu}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={
          totalUnread > 0
            ? `SiBS Assistant, ${totalUnread} unread message${totalUnread === 1 ? "" : "s"}`
            : "SiBS Assistant"
        }
        className="inline-flex select-none items-center gap-2 rounded-2xl border border-white/10 bg-sibs-navy px-2.5 py-2 sm:px-3 sm:py-2.5 font-jakarta text-[13px] font-bold tracking-tight text-white shadow-xl transition-all duration-200 hover:bg-sibs-tertiary-2 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-sibs-orange/25 active:scale-[0.98]"
      >
        <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-xl bg-sibs-orange text-white shadow-xs">
          <Sparkles size={15} />
          {totalUnread > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full border border-sibs-navy bg-red-600 px-0.5 text-[8px] font-black text-white">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          ) : null}
        </span>
        <span className="hidden sm:inline pr-0.5">SiBS Assistant</span>
      </button>
    </aside>
  );
}
