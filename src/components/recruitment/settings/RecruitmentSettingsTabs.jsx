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
    <section className="overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm">
      <div className="flex min-w-0 gap-1.5 overflow-x-auto p-1.5 sibs-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          const TabIcon = tabIconMap[tab] || ClipboardList;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[10px] border px-3 text-xs font-extrabold leading-none transition ${
                isActive
                  ? "border-[#BFD8F1] bg-[#EFF6FF] text-sibs-primary-1 shadow-sm"
                  : "border-transparent bg-white text-[#344054] hover:border-[#D9E2EC] hover:bg-[#F8FAFC] hover:text-sibs-primary-1"
              }`}
            >
              <TabIcon
                size={15}
                strokeWidth={2.4}
                className={isActive ? "text-[#FF5C28]" : "text-[#98A2B3]"}
              />
              {tab}
            </button>
          );
        })}
      </div>
    </section>
  );
}
