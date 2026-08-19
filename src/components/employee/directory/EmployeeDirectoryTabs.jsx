import { motion as Motion } from "framer-motion";
import { UserRoundCheck } from "lucide-react";

export default function EmployeeDirectoryTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="mb-0 overflow-hidden rounded-t-xl border border-b-0 border-[#E6ECF2] bg-white">
      <div className="flex overflow-x-auto border-b border-[#E6ECF2] bg-[#F8FAFC] px-3 pt-2.5 sibs-scrollbar sm:px-4">
        {tabs.map((tab) => {
          const TabIcon = tab.icon || UserRoundCheck;
          const isActive = activeTab === tab.label;

          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => onTabChange?.(tab.label)}
              className={`relative inline-flex h-8.5 2xl:h-9 shrink-0 items-center gap-2 px-3.5 2xl:px-4 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${
                isActive
                  ? "rounded-t-xl bg-white text-[#042C51]"
                  : "text-[#667085] hover:text-[#042C51]"
              }`}
            >
              <TabIcon
                size={14}
                className={`shrink-0 ${isActive ? "text-[#FF5C28]" : "text-[#98A2B3]"}`}
              />
              <span className="truncate">{tab.label}</span>

              {Number(tab.count || 0) > 0 ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold tabular-nums transition-colors ${
                    isActive
                      ? "bg-[#042C51] text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              ) : null}

              {isActive ? (
                <Motion.div
                  layoutId="employeeDirectoryTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5C28]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
