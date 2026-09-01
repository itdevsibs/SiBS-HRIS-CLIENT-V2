import React from "react";
import { motion as Motion } from "framer-motion";

const UNLINKED_JD_TABS = [
  "Unlinked From Job Descriptions",
  "Unlinked from JD",
];

export default function StatusFilterTabs({
  tabs = [],
  activeValue = "All",
  counts = {},
  onChange,
  countKeys = ["For Approval", ...UNLINKED_JD_TABS],
}) {
  if (!Array.isArray(tabs) || tabs.length === 0) {
    return null;
  }

  return (
    <div className="flex overflow-x-auto border-b border-sibs-border bg-sibs-surface px-3 pt-2.5 sibs-scrollbar sm:px-4">
      {tabs.map((tab) => {
        const active = activeValue === tab.value;
        const showCount = countKeys.includes(tab.value);
        const isUnlinkedJd = UNLINKED_JD_TABS.includes(tab.value);
        const count = Number(counts?.[tab.value] || 0);

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange?.(tab.value)}
            className={`relative inline-flex h-8.5 2xl:h-9 shrink-0 items-center gap-2 px-3.5 2xl:px-4 sibs-text-micro font-extrabold uppercase tracking-normal transition-colors ${
              active
                ? "rounded-t-xl bg-white text-sibs-navy"
                : "text-sibs-muted hover:text-sibs-navy"
            }`}
          >
            {tab.label}

            {showCount ? (
              <span
                className={[
                  "inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] font-extrabold tabular-nums transition-all",

                  isUnlinkedJd
                    ? active
                      ? "bg-[#FF3B1F] text-white shadow-[0_0_0_3px_rgba(255,59,31,0.12)]"
                      : "bg-[#FFE1D8] text-[#D92D20]"
                    : active
                      ? "bg-red-600 text-white"
                      : "bg-red-100 text-red-700",
                ].join(" ")}
              >
                {count}
              </span>
            ) : null}

            {active ? (
              <Motion.div
                layoutId="statusFilterActiveTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-sibs-orange"
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
