import React from "react";
import { Archive, BarChart3, ClipboardList } from "lucide-react";

import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";

export default function ApplicantLeadViewTabs() {
  const { leadView, setLeadView, activeLeadCount, archivedLeadCount } =
    useApplicantLeadsPage();

  const tabs = [
    {
      id: "active",
      label: "Active Leads",
      count: activeLeadCount,
      icon: ClipboardList,
    },
    {
      id: "archive",
      label: "Moved to Talent Pool Archive",
      count: archivedLeadCount,
      icon: Archive,
    },
    {
      id: "channels",
      label: "Channel Sources",
      count: null,
      icon: BarChart3,
    },
  ];

  return (
    <div className="overflow-hidden rounded-t-xl border border-b-0 border-[#E6ECF2] bg-white">
      <div className="flex overflow-x-auto border-b border-[#E6ECF2] bg-[#F8FAFC] px-3 pt-3 sibs-scrollbar sm:px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = leadView === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setLeadView(tab.id)}
              className={`relative inline-flex h-8.5 2xl:h-9.5 shrink-0 items-center gap-1.5 2xl:gap-2 px-3.5 2xl:px-4 text-[10px] 2xl:text-[11px] font-extrabold uppercase tracking-wide transition-colors font-jakarta ${
                active
                  ? "rounded-t-xl bg-white text-[#042C51]"
                  : "text-[#667085] hover:text-[#042C51]"
              }`}
            >
              <Icon
                size={14}
                className={`shrink-0 ${active ? "text-[#FF5C28]" : "text-[#98A2B3]"}`}
              />
              <span className="truncate">{tab.label}</span>

              {tab.count !== null && Number(tab.count) > 0 ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold tabular-nums transition-colors ${
                    active
                      ? "bg-[#042C51] text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              ) : null}

              {active ? (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5C28]" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
