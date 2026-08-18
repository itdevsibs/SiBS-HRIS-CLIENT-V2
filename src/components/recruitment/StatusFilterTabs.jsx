import React from "react";
import { motion } from "framer-motion";

export default function StatusFilterTabs({
  tabs = [],
  activeValue = "All",
  counts = {},
  onChange,
  countKeys = ["For Approval"],
}) {
  if (!Array.isArray(tabs) || tabs.length === 0) return null;

  return (
    <div className="flex overflow-x-auto border-b border-[#E6ECF2] bg-[#F8FAFC] px-3 pt-2.5 sibs-scrollbar sm:px-4">
      {tabs.map((tab) => {
        const active = activeValue === tab.value;
        const showCount = countKeys.includes(tab.value);

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange?.(tab.value)}
            className={`relative inline-flex h-8.5 2xl:h-9 shrink-0 items-center gap-2 px-3.5 2xl:px-4 sibs-text-micro font-extrabold uppercase tracking-normal transition-colors ${
              active
                ? "rounded-t-xl bg-white text-[#042C51]"
                : "text-[#667085] hover:text-[#042C51]"
            }`}
          >
            {tab.label}
            {showCount ? (
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-[9px] font-extrabold tabular-nums transition-colors",
                  active ? "bg-red-600 text-white" : "bg-red-100 text-red-700",
                ].join(" ")}
              >
                {Number(counts?.[tab.value] || 0)}
              </span>
            ) : null}

            {active ? (
              <motion.div
                layoutId="statusFilterActiveTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5C28]"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
