import React from "react";
import { motion as Motion } from "framer-motion";

const UNLINKED_JD_TABS = [
  "Unlinked From Job Descriptions",
  "Unlinked from JD",
];

const ALERT_TAB_KEYS = [
  ...UNLINKED_JD_TABS,
  "For Approval",
  "approval",
  "Drop Off List",
  "Drop-offs",
  "exceptions",
];

export default function StatusFilterTabs({
  tabs = [],
  activeValue,
  activeTab,
  counts = {},
  onChange,
  onTabChange,
  countKeys,
  showAllCounts = false,
  layoutId = "statusFilterActiveTabIndicator",
  className = "",
}) {
  if (!Array.isArray(tabs) || tabs.length === 0) {
    return null;
  }

  const resolvedActive = activeValue !== undefined ? activeValue : activeTab;
  const handleSelect = onChange || onTabChange;

  return (
    <div
      role="tablist"
      className={`flex overflow-x-auto border-b border-sibs-border bg-sibs-surface px-3 pt-2.5 sibs-no-scrollbar sm:px-4 font-jakarta ${className}`}
    >
      {tabs.map((tab) => {
        const tabKey = tab?.value ?? tab?.key ?? tab?.id ?? tab?.label ?? tab;
        const tabLabel = tab?.label ?? tab?.name ?? tab?.title ?? String(tabKey);
        const TabIcon = tab?.icon;
        const active = resolvedActive === tabKey;

        const hasExplicitCount = tab?.count !== undefined && tab?.count !== null;
        const showCount =
          tab?.showCount ??
          (showAllCounts
            ? true
            : hasExplicitCount
              ? true
              : countKeys
                ? countKeys.includes(tabKey)
                : ALERT_TAB_KEYS.includes(tabKey));

        const rawCount = hasExplicitCount ? tab.count : counts?.[tabKey];
        const count = Number(rawCount || 0);

        const isAlert =
          tab?.tone === "danger" ||
          tab?.tone === "alert" ||
          ALERT_TAB_KEYS.includes(tabKey);

        return (
          <button
            key={tabKey}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => handleSelect?.(tabKey)}
            className={`relative inline-flex h-8.5 2xl:h-9 shrink-0 items-center gap-1.5 2xl:gap-2 px-3.5 2xl:px-4 sibs-text-micro font-extrabold uppercase tracking-wide transition-colors ${
              active
                ? "rounded-t-xl bg-white text-sibs-navy"
                : "text-sibs-muted hover:text-sibs-navy"
            }`}
          >
            {TabIcon ? (
              <TabIcon
                size={13.5}
                className={`shrink-0 transition-colors ${
                  active
                    ? isAlert && (tabKey === "Drop Off List" || tabKey === "Drop-offs")
                      ? "text-rose-600"
                      : "text-sibs-orange"
                    : "text-sibs-faint"
                }`}
              />
            ) : null}

            <span className="truncate">{tabLabel}</span>

            {showCount ? (
              <span
                className={[
                  "inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] font-extrabold tabular-nums transition-all",
                  isAlert
                    ? active
                      ? "bg-rose-600 text-white shadow-[0_0_0_3px_rgba(225,29,72,0.12)]"
                      : "bg-rose-100 text-rose-700"
                    : active
                      ? "bg-sibs-navy text-white"
                      : "bg-slate-200 text-slate-600",
                ].join(" ")}
              >
                {count}
              </span>
            ) : null}

            {active ? (
              <Motion.div
                layoutId={layoutId}
                className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                  isAlert && (tabKey === "Drop Off List" || tabKey === "Drop-offs")
                    ? "bg-rose-600"
                    : "bg-sibs-orange"
                }`}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
