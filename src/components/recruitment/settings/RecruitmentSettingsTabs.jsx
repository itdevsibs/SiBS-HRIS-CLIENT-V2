import React from "react";
import { RECRUITMENT_TABS } from "./recruitmentSettingsConstants";

function RecruitmentSettingsTabs({
  activeTab = "Overview",
  onTabChange,
}) {
  return (
    <nav
      aria-label="Recruitment Settings Navigation Tabs"
      className="sibs-card overflow-hidden rounded-2xl border border-sibs-border bg-white p-1.5 shadow-xs font-jakarta"
    >
      <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 px-0.5">
        {RECRUITMENT_TABS.map((tab) => {
          const isActive =
            activeTab === tab.key ||
            (tab.key === "Application Screening Questionnaires" &&
              activeTab === "Application Questions Form");
          const Icon = tab.icon;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange?.(tab)}
              className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-bold transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-sibs-navy text-white shadow-xs"
                  : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-sibs-navy"
              }`}
            >
              <Icon
                size={14}
                strokeWidth={2.4}
                className={isActive ? "text-sibs-orange" : "text-slate-400"}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default React.memo(RecruitmentSettingsTabs);
