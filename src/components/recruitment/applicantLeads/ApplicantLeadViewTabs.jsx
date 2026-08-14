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
    <div className="border-b border-[#E6ECF2] bg-[#F8FAFC] px-4 pt-3">
      <div className="flex min-w-0 items-center gap-2 overflow-x-auto sibs-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = leadView === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setLeadView(tab.id)}
              className={`relative inline-flex h-10 shrink-0 items-center gap-2 rounded-t-xl px-4 text-[11px] font-extrabold uppercase transition ${
                active
                  ? "bg-white text-[#042C51]"
                  : "text-[#5D7290] hover:bg-white/70 hover:text-[#042C51]"
              }`}
            >
              <Icon size={14} className={active ? "text-[#FF5C28]" : ""} />
              <span>{tab.label}</span>
              {tab.count !== null ? (
                <span
                  className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] ${
                    active
                      ? "bg-[#E9F0FC] text-[#042C51]"
                      : "bg-[#E6EEF7] text-[#5D7290]"
                  }`}
                >
                  {tab.count}
                </span>
              ) : null}
              {active ? (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#FF5C28]" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
