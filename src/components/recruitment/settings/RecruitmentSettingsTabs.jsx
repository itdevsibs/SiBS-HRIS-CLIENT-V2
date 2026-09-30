import React from "react";
import {
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  ListChecks,
  Mail,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

const tabIconMap = {
  "Update Headcounts": ClipboardList,
  "Final Interview Form": ClipboardCheck,
  "Application Screening Questionnaires": ListChecks,
  "Pipeline Settings": SlidersHorizontal,
  "Assessment Settings": FileCheck2,
  "Email Templates": Mail,
  "Holiday Calendar": CalendarDays,
  "Approval Rules": ShieldCheck,
};

export default function RecruitmentSettingsTabs({
  activeTab,
  onTabChange,
  tabs = [],
}) {
  return (
    <section className="sibs-card overflow-hidden p-1.5 shadow-2xs">
      <div className="flex min-w-0 gap-1 overflow-x-auto p-0.5 sibs-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          const TabIcon = tabIconMap[tab] || ClipboardList;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`inline-flex h-9 2xl:h-9.5 shrink-0 items-center justify-center gap-2 rounded-xl border px-3.5 text-xs 2xl:text-[12.5px] font-extrabold leading-none transition-all duration-150 cursor-pointer ${
                isActive
                  ? "border-sibs-border bg-sibs-surface text-sibs-navy shadow-xs"
                  : "border-transparent bg-transparent text-sibs-muted hover:border-sibs-border-subtle hover:bg-sibs-surface/60 hover:text-sibs-navy"
              }`}
            >
              <TabIcon
                size={15}
                strokeWidth={2.4}
                className={isActive ? "text-sibs-orange" : "text-sibs-muted/70"}
              />
              {tab}
            </button>
          );
        })}
      </div>
    </section>
  );
}
