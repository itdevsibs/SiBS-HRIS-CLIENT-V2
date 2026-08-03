import React from "react";

export default function StatusFilterTabs({
  tabs = [],
  activeValue = "All",
  counts = {},
  onChange,
  countKeys = ["For Approval"],
}) {
  if (!Array.isArray(tabs) || tabs.length === 0) return null;

  return (
    <div className="flex overflow-x-auto border-b border-[#E6ECF2] bg-[#F8FAFC] px-3 pt-3 no-scrollbar sm:px-4">
      {tabs.map((tab) => {
        const active = activeValue === tab.value;
        const showCount = countKeys.includes(tab.value);

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange?.(tab.value)}
            className={`inline-flex h-10 shrink-0 items-center gap-2 border-b-2 px-4 text-[10px] font-extrabold uppercase tracking-normal transition ${
              active
                ? "rounded-t-xl border-[#FF5C28] bg-white text-[#042C51]"
                : "border-transparent text-[#667085] hover:text-[#042C51]"
            }`}
          >
            {tab.label}
            {showCount ? (
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-[9px] font-extrabold tabular-nums",
                  active ? "bg-red-600 text-white" : "bg-red-100 text-red-700",
                ].join(" ")}
              >
                {Number(counts?.[tab.value] || 0)}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
