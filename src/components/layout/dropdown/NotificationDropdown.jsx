import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  X,
} from "lucide-react";

import { useSidebarNotifications } from "../../../services/context/SidebarNotificationContext";

const CATEGORY_TABS = [
  { id: "all", label: "All" },
  { id: "approvals", label: "Approvals" },
  { id: "system", label: "System" },
];

function getNotificationVisualMeta(notif = {}) {
  const title = (notif.title || "").toLowerCase();
  const category = (notif.category || "").toLowerCase();
  const type = (notif.type || "").toLowerCase();

  // 1. Approvals / Action items / Requests
  if (category === "approvals" || type === "action" || title.includes("approval") || title.includes("request")) {
    return {
      icon: Clock,
      wrapper: "bg-amber-50 text-amber-600 border border-amber-200/70",
    };
  }

  // 2. Warning / Danger / Alerts
  if (type === "warning" || title.includes("warning") || title.includes("alert")) {
    return {
      icon: AlertTriangle,
      wrapper: "bg-rose-50 text-rose-600 border border-rose-200/70",
    };
  }

  // 3. User Access / Role / Security / Permissions
  if (title.includes("access") || title.includes("role") || title.includes("user")) {
    return {
      icon: ShieldCheck,
      wrapper: "bg-indigo-50 text-indigo-600 border border-indigo-200/70",
    };
  }

  // 4. Schedules / Shifts / Rosters / Attendance
  if (title.includes("schedule") || title.includes("shift") || title.includes("attendance")) {
    return {
      icon: Calendar,
      wrapper: "bg-teal-50 text-teal-700 border border-teal-200/70",
    };
  }

  // 5. Default / Completed Tasks / Lifecycle Updates
  return {
    icon: CheckCircle2,
    wrapper: "bg-blue-50 text-blue-600 border border-blue-200/70",
  };
}

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const {
    notificationsList = [],
    fullNotificationsList = notificationsList,
    unreadCount = 0,
    fullUnreadCount = unreadCount,
    auditHistoryLoading = false,
    auditHistoryHasMore = false,
    loadAuditNotificationHistory,
    loadMoreAuditNotificationHistory,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useSidebarNotifications() || {};

  const [open, setOpen] = useState(false);
  const [notifMounted, setNotifMounted] = useState(false);
  const [notifActive, setNotifActive] = useState(false);

  useEffect(() => {
    let timer;
    let frame;
    if (open) {
      setNotifMounted(true);
      frame = requestAnimationFrame(() => setNotifActive(true));
    } else {
      setNotifActive(false);
      timer = setTimeout(() => setNotifMounted(false), 200);
    }
    return () => {
      if (frame) cancelAnimationFrame(frame);
      if (timer) clearTimeout(timer);
    };
  }, [open]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [expanded, setExpanded] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
    left: undefined,
    width: "auto",
    isMobile: false,
  });

  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const notificationListRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!buttonRef.current || typeof window === "undefined") return;
    const rect = buttonRef.current.getBoundingClientRect();
    const isMobile = window.innerWidth < 640;
    const top = rect.bottom + 8;

    if (isMobile) {
      setDropdownPosition({
        top,
        left: 12,
        right: 12,
        width: "auto",
        isMobile: true,
      });
    } else {
      const preferredWidth = 400;
      const viewportPadding = 16;
      let right = window.innerWidth - rect.right;
      if (window.innerWidth - right < preferredWidth + viewportPadding) {
        right = Math.max(viewportPadding, window.innerWidth - preferredWidth - viewportPadding);
      }
      right = Math.max(viewportPadding, right);

      setDropdownPosition({
        top,
        right,
        left: undefined,
        width: `${preferredWidth}px`,
        isMobile: false,
      });
    }
  }, []);

  const toggleDropdown = () => {
    if (!open) {
      calculatePosition();
      setExpanded(false);
    }
    setOpen((prev) => !prev);
  };

  useLayoutEffect(() => {
    if (!open) return undefined;
    calculatePosition();

    function handleResizeOrScroll() {
      calculatePosition();
    }

    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);

    return () => {
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
    };
  }, [open, calculatePosition]);

  // Close on outside click or escape
  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  const displayedNotifications = expanded
    ? fullNotificationsList
    : notificationsList;
  const displayedUnreadCount = expanded ? fullUnreadCount : unreadCount;

  // Filter notifications by category tab
  const filteredNotifications = useMemo(() => {
    if (activeCategory === "all") return displayedNotifications;
    return displayedNotifications.filter((n) => n.category === activeCategory);
  }, [displayedNotifications, activeCategory]);

  const handleExpandedToggle = useCallback(() => {
    if (expanded) {
      setExpanded(false);
      return;
    }

    setExpanded(true);
    loadAuditNotificationHistory?.({ reset: true });
  }, [expanded, loadAuditNotificationHistory]);

  const handleNotificationListScroll = useCallback(
    (event) => {
      if (!expanded || auditHistoryLoading || !auditHistoryHasMore) return;

      const element = event.currentTarget;
      const distanceFromBottom =
        element.scrollHeight - element.scrollTop - element.clientHeight;

      if (distanceFromBottom <= 80) {
        loadMoreAuditNotificationHistory?.();
      }
    },
    [
      expanded,
      auditHistoryLoading,
      auditHistoryHasMore,
      loadMoreAuditNotificationHistory,
    ],
  );

  useEffect(() => {
    if (!expanded || auditHistoryLoading || !auditHistoryHasMore) return;

    const element = notificationListRef.current;
    if (!element) return;

    if (element.scrollHeight <= element.clientHeight + 24) {
      loadMoreAuditNotificationHistory?.();
    }
  }, [
    expanded,
    auditHistoryLoading,
    auditHistoryHasMore,
    filteredNotifications.length,
    loadMoreAuditNotificationHistory,
  ]);

  const handleTabKeyDown = (event, currentTabId) => {
    const currentIndex = CATEGORY_TABS.findIndex((t) => t.id === currentTabId);
    if (currentIndex === -1) return;

    let nextIndex = null;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      nextIndex = (currentIndex + 1) % CATEGORY_TABS.length;
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      nextIndex = (currentIndex - 1 + CATEGORY_TABS.length) % CATEGORY_TABS.length;
    }

    if (nextIndex !== null) {
      setActiveCategory(CATEGORY_TABS[nextIndex].id);
      const tabButtons = dropdownRef.current?.querySelectorAll('[role="tab"]');
      tabButtons?.[nextIndex]?.focus();
    }
  };

  const handleActionClick = (notification) => {
    markAsRead?.(notification.id);
    setOpen(false);

    if (notification.actionPath) {
      navigate(notification.actionPath, {
        state: notification.actionState || null,
      });
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Notifications"
        className={`relative flex h-8.5 w-8.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-150 outline-none cursor-pointer ${
          open
            ? "border-sibs-orange/40 bg-sibs-cream text-sibs-orange shadow-sm ring-2 ring-sibs-orange/15"
            : "border-transparent bg-transparent text-sibs-text-muted hover:border-sibs-orange/30 hover:bg-sibs-cream-subtle hover:text-sibs-orange hover:shadow-xs"
        }`}
      >
        <Bell className="h-4 w-4 2xl:h-[18px] 2xl:w-[18px]" strokeWidth={1.8} />

        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sibs-orange opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sibs-orange ring-2 ring-white" />
          </span>
        ) : null}
      </button>

      {notifMounted &&
        createPortal(
          <>
            {/* Mobile Backdrop Click-Catcher (Zero-blur, transparent scrim keeping header crisp) */}
            <div
              className="fixed inset-0 z-[99998] bg-black/[0.04] sm:hidden"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            <div
              ref={dropdownRef}
              role="dialog"
              aria-label="Notifications"
              style={{
                position: "fixed",
                top: `${dropdownPosition.top}px`,
                ...(dropdownPosition.isMobile
                  ? { left: "12px", right: "12px", width: "auto" }
                  : {
                      right: `${dropdownPosition.right}px`,
                      left: "auto",
                      width: `${dropdownPosition.width || "400px"}`,
                    }),
                zIndex: 99999,
              }}
              className={`sibs-animated-dropdown ${notifActive ? "open" : "closed"}`}
            >
              <div className="sibs-animated-dropdown-inner">
                <div className="sibs-animated-dropdown-box max-w-[calc(100vw-24px)] rounded-2xl border border-sibs-border bg-white shadow-xl overflow-hidden font-jakarta"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-sibs-border bg-sibs-canvas px-4 py-2.5 sm:py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="font-heading text-base font-bold text-sibs-navy tracking-tight truncate">
                    Notifications
                  </h3>
                  {displayedUnreadCount > 0 ? (
                    <span className="shrink-0 rounded-full bg-sibs-cream px-2 py-0.5 sibs-text-micro font-extrabold text-sibs-orange border border-sibs-orange/20">
                      {displayedUnreadCount} new
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {displayedUnreadCount > 0 ? (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="shrink-0 rounded-lg bg-orange-50/90 hover:bg-orange-100 active:bg-orange-200/70 px-2.5 py-1 text-[11px] font-extrabold text-sibs-orange transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sibs-orange/30 cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  ) : null}

                  {/* Explicit Close Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      buttonRef.current?.focus();
                    }}
                    aria-label="Close notifications"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-sibs-navy active:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sibs-orange/30 cursor-pointer"
                  >
                    <X size={15} strokeWidth={2.4} />
                  </button>
                </div>
              </div>

              {/* Category Tabs */}
              <div role="tablist" aria-label="Notification categories" className="flex border-b border-sibs-border bg-white px-2.5 sm:px-3 pt-1.5 gap-1 overflow-x-auto sibs-no-scrollbar">
                {CATEGORY_TABS.map((tab) => {
                  const active = activeCategory === tab.id;
                  const count =
                    tab.id === "all"
                      ? displayedNotifications.length
                      : displayedNotifications.filter((n) => n.category === tab.id).length;

                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={active}
                      tabIndex={active ? 0 : -1}
                      type="button"
                      onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
                      onClick={() => setActiveCategory(tab.id)}
                      className={`flex min-h-[36px] sm:min-h-[32px] items-center gap-1.5 border-b-2 px-2.5 sm:px-3 py-1.5 sibs-text-micro font-extrabold transition-all whitespace-nowrap ${
                        active
                          ? "border-sibs-orange text-sibs-orange"
                          : "border-transparent text-sibs-text-muted hover:text-sibs-navy"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] tabular-nums font-bold ${
                          active
                            ? "bg-orange-100 text-sibs-orange"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Notifications List */}
              <div
                ref={notificationListRef}
                onScroll={handleNotificationListScroll}
                className="max-h-[calc(100dvh-200px)] sm:max-h-[380px] min-h-[140px] overflow-y-auto divide-y divide-sibs-border/60 sibs-scrollbar"
              >
              {filteredNotifications.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <CheckCheck className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                  <p className="sibs-text-xs font-extrabold text-sibs-navy">
                    All caught up!
                  </p>
                  <p className="mt-0.5 sibs-text-micro text-sibs-text-muted">
                    No notifications in this category
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const visualMeta = getNotificationVisualMeta(notif);
                  const Icon = visualMeta.icon;
                  const isWholeCardAction = Boolean(notif.actionPath);

                  function handleNotificationCardClick() {
                    if (isWholeCardAction) {
                      handleActionClick(notif);
                      return;
                    }

                    markAsRead?.(notif.id);
                  }

                  function handleNotificationCardKeyDown(event) {
                    if (!isWholeCardAction) return;

                    if (event.key !== "Enter" && event.key !== " ") {
                      return;
                    }

                    event.preventDefault();
                    handleActionClick(notif);
                  }

                  return (
                    <article
                      key={notif.id}
                      role={isWholeCardAction ? "button" : undefined}
                      tabIndex={isWholeCardAction ? 0 : undefined}
                      aria-label={
                        isWholeCardAction
                          ? `${notif.title || "Notification"} - open related page`
                          : undefined
                      }
                      onClick={handleNotificationCardClick}
                      onKeyDown={handleNotificationCardKeyDown}
                      className={`group relative flex items-start gap-2.5 p-3 transition-colors hover:bg-sibs-cream-light cursor-pointer ${
                        notif.isRead ? "bg-white opacity-85" : "bg-sibs-canvas/60"
                      } ${
                        isWholeCardAction
                          ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sibs-orange/30"
                          : ""
                      }`}
                    >
                      {/* Semantic Icon */}
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mt-0.5 shadow-xs ${visualMeta.wrapper}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      {/* Content & Top Utility Zone */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-1.5">
                          {/* Title + Unread Dot */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h4
                              className={`text-[12px] 2xl:text-xs font-extrabold truncate ${
                                notif.isRead ? "text-sibs-text-secondary" : "text-sibs-navy"
                              }`}
                            >
                              {notif.title}
                            </h4>
                            {!notif.isRead && (
                              <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full bg-sibs-orange"
                                aria-label="Unread"
                              />
                            )}
                          </div>

                          {/* Utility actions: Time + Dismiss */}
                          <div className="flex shrink-0 items-center gap-1.5">
                            <span className="text-[10px] 2xl:text-[11px] text-sibs-text-muted font-semibold whitespace-nowrap">
                              {notif.time}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification?.(notif.id);
                              }}
                              title="Dismiss"
                              aria-label={`Dismiss ${notif.title || "notification"}`}
                              className="flex h-5.5 w-5.5 items-center justify-center rounded text-slate-400 opacity-60 hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 active:bg-rose-100 transition-all focus:opacity-100 focus-visible:ring-1 focus-visible:ring-rose-400"
                            >
                              <X size={12} strokeWidth={2.2} />
                            </button>
                          </div>
                        </div>

                        {/* Message body */}
                        <p className="mt-0.5 text-[11px] 2xl:text-[12px] leading-relaxed text-sibs-text-secondary font-medium line-clamp-2 sm:line-clamp-3">
                          {notif.message}
                        </p>

                        {/* Optional dedicated CTA button (only if not whole card action) */}
                        {!isWholeCardAction && notif.actionLabel ? (
                          <div className="mt-1.5 flex items-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActionClick(notif);
                              }}
                              className="inline-flex items-center gap-1 rounded bg-orange-50 px-2 py-0.5 text-[10px] font-extrabold text-sibs-orange transition hover:bg-sibs-orange hover:text-white"
                            >
                              <span>{notif.actionLabel}</span>
                              <ExternalLink size={10} />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                })
              )}

              {expanded && auditHistoryLoading ? (
                <div className="px-4 py-3 text-center sibs-text-micro font-bold text-sibs-text-muted">
                  Loading more notifications...
                </div>
              ) : null}

              {expanded && !auditHistoryLoading && !auditHistoryHasMore && filteredNotifications.length > 0 ? (
                <div className="px-4 py-3 text-center sibs-text-micro font-semibold text-sibs-text-muted">
                  All notifications loaded
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="border-t border-sibs-border bg-sibs-canvas px-4 py-2.5 flex items-center justify-between">
              <span className="sibs-text-micro font-semibold text-sibs-text-muted">
                Auto-syncs with live HRIS feed
              </span>
              <button
                type="button"
                onClick={handleExpandedToggle}
                aria-expanded={expanded}
                className="sibs-text-micro font-extrabold text-sibs-navy hover:text-sibs-orange transition-colors"
              >
                {expanded ? "Show Less" : "See All"}
              </button>
            </div>
          </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
