import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  X,
} from "lucide-react";

import { useSidebarNotifications } from "../../../services/context/SidebarNotificationContext";

const CATEGORY_TABS = [
  { id: "all", label: "All" },
  { id: "approvals", label: "Approvals" },
  { id: "system", label: "System" },
];

function getCategoryIcon(type, category) {
  if (category === "approvals" || type === "action") {
    return {
      icon: Clock,
      wrapper: "bg-orange-50 text-sibs-orange border border-orange-200/60",
    };
  }
  if (type === "warning") {
    return {
      icon: AlertTriangle,
      wrapper: "bg-amber-50 text-amber-600 border border-amber-200/60",
    };
  }
  return {
    icon: CheckCircle2,
    wrapper: "bg-blue-50 text-blue-600 border border-blue-200/60",
  };
}

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const {
    notificationsList = [],
    unreadCount = 0,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useSidebarNotifications() || {};

  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const right = window.innerWidth - rect.right;
    const top = rect.bottom + 8;

    setDropdownPosition({ top, right });
  }, []);

  const toggleDropdown = () => {
    if (!open) {
      calculatePosition();
    }
    setOpen((prev) => !prev);
  };

  // Close on outside click or escape
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
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

    function handleResizeOrScroll() {
      calculatePosition();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
    };
  }, [open, calculatePosition]);

  // Filter notifications by category tab
  const filteredNotifications = useMemo(() => {
    if (activeCategory === "all") return notificationsList;
    return notificationsList.filter((n) => n.category === activeCategory);
  }, [notificationsList, activeCategory]);

  const handleActionClick = (notification) => {
    markAsRead?.(notification.id);
    setOpen(false);
    if (notification.actionPath) {
      navigate(notification.actionPath);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Notifications"
        className={`relative flex h-8.5 w-8.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-150 outline-none cursor-pointer ${
          open
            ? "border-sibs-orange/40 bg-sibs-cream text-sibs-orange shadow-sm ring-2 ring-sibs-orange/15"
            : "border-transparent bg-transparent text-[#667085] hover:border-sibs-orange/30 hover:bg-sibs-cream-subtle hover:text-sibs-orange hover:shadow-xs"
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

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
              zIndex: 99999,
            }}
            className="sibs-animated-dropdown-box w-[360px] sm:w-[400px] max-w-[calc(100vw-24px)] rounded-2xl border border-sibs-border bg-white shadow-xl overflow-hidden font-jakarta"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-sibs-border bg-[#F8FAFC] px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base font-bold text-sibs-navy tracking-tight">
                  Notifications
                </h3>
                {unreadCount > 0 ? (
                  <span className="rounded-full bg-sibs-cream px-2 py-0.5 sibs-text-micro font-extrabold text-sibs-orange border border-sibs-orange/20">
                    {unreadCount} new
                  </span>
                ) : null}
              </div>

              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="sibs-text-micro font-bold text-sibs-orange hover:text-sibs-navy hover:underline transition-colors"
                >
                  Mark all as read
                </button>
              ) : null}
            </div>

            {/* Category Tabs */}
            <div className="flex border-b border-sibs-border bg-white px-3 pt-2 gap-1">
              {CATEGORY_TABS.map((tab) => {
                const active = activeCategory === tab.id;
                const count =
                  tab.id === "all"
                    ? notificationsList.length
                    : notificationsList.filter((n) => n.category === tab.id).length;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCategory(tab.id)}
                    className={`flex items-center gap-1.5 border-b-2 px-3 py-1.5 sibs-text-micro font-extrabold transition-all ${
                      active
                        ? "border-sibs-orange text-sibs-orange"
                        : "border-transparent text-[#667085] hover:text-sibs-navy"
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
            <div className="max-h-[380px] overflow-y-auto divide-y divide-[#F1F5F9] sibs-scrollbar">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <CheckCheck className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                  <p className="sibs-text-xs font-extrabold text-sibs-navy">
                    All caught up!
                  </p>
                  <p className="mt-0.5 sibs-text-micro text-[#667085]">
                    No notifications in this category
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const categoryMeta = getCategoryIcon(notif.type, notif.category);
                  const Icon = categoryMeta.icon;

                  return (
                    <article
                      key={notif.id}
                      onClick={() => markAsRead?.(notif.id)}
                      className={`group relative flex items-start gap-3 p-3.5 transition-colors hover:bg-[#FFF8F5] cursor-pointer ${
                        notif.isRead ? "bg-white opacity-85" : "bg-[#F4F7FA]/60"
                      }`}
                    >
                      {/* Icon */}
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5 ${categoryMeta.wrapper}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4
                            className={`sibs-text-xs font-extrabold truncate ${
                              notif.isRead ? "text-sibs-text-secondary" : "text-sibs-navy"
                            }`}
                          >
                            {notif.title}
                          </h4>
                          <span className="shrink-0 sibs-text-micro text-sibs-text-muted font-semibold">
                            {notif.time}
                          </span>
                        </div>

                        <p className="mt-0.5 sibs-text-micro leading-relaxed text-sibs-text-secondary font-medium line-clamp-3">
                          {notif.message}
                        </p>

                        {/* Action CTA */}
                        {notif.actionLabel ? (
                          <div className="mt-2 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActionClick(notif);
                              }}
                              className="inline-flex items-center gap-1 rounded bg-orange-50 px-2 py-0.5 sibs-text-micro font-extrabold text-sibs-orange transition hover:bg-sibs-orange hover:text-white"
                            >
                              <span>{notif.actionLabel}</span>
                              <ExternalLink size={10} />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification?.(notif.id);
                              }}
                              title="Dismiss"
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : null}
                      </div>

                      {/* Unread indicator dot */}
                      {!notif.isRead ? (
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sibs-orange" />
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-sibs-border bg-[#F8FAFC] px-4 py-2.5 flex items-center justify-between">
              <span className="sibs-text-micro font-semibold text-sibs-text-muted">
                Auto-syncs with live HRIS feed
              </span>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/approval-request");
                }}
                className="sibs-text-micro font-extrabold text-sibs-navy hover:text-sibs-orange transition-colors"
              >
                View Approvals Queue →
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
