import React from "react";
import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { motion as Motion } from "framer-motion";

export const PIPELINE_STAGE_TABS = {
  ALL: "All",
  INITIAL_SCREENING: "Initial Screening",
  ONLINE_ASSESSMENT: "Online Assessment",
  ASSESSMENT_FIT: "Assessment Fit",
  INTERVIEW_SCHEDULED: "Interview Scheduled",
  INTERVIEWED: "Interviewed",
  OFFERED: "Offered",
  ACCEPTED: "Accepted",
  FOR_NHO: "For NHO",
  DROP_OFF: "Drop Off List",
};

const stageTabs = [
  { key: PIPELINE_STAGE_TABS.ALL, label: "All", icon: UsersRound },
  {
    key: PIPELINE_STAGE_TABS.INITIAL_SCREENING,
    label: "Initial Screening",
    icon: UserCheck,
  },
  {
    key: PIPELINE_STAGE_TABS.ONLINE_ASSESSMENT,
    label: "Online Assessment",
    icon: ClipboardCheck,
  },
  {
    key: PIPELINE_STAGE_TABS.ASSESSMENT_FIT,
    label: "Assessment Fit",
    icon: CheckCircle2,
  },
  {
    key: PIPELINE_STAGE_TABS.INTERVIEW_SCHEDULED,
    label: "Interview Scheduled",
    icon: CalendarDays,
  },
  {
    key: PIPELINE_STAGE_TABS.INTERVIEWED,
    label: "Interviewed",
    icon: ShieldCheck,
  },
  {
    key: PIPELINE_STAGE_TABS.OFFERED,
    label: "Offered",
    icon: BriefcaseBusiness,
  },
  {
    key: PIPELINE_STAGE_TABS.ACCEPTED,
    label: "Accepted",
    icon: UserCheck,
  },
  {
    key: PIPELINE_STAGE_TABS.FOR_NHO,
    label: "For NHO",
    icon: GraduationCap,
  },
  {
    key: PIPELINE_STAGE_TABS.DROP_OFF,
    label: "Drop Off List",
    icon: AlertTriangle,
  },
];

export default function PipelineStageTabs({
  activeTab = PIPELINE_STAGE_TABS.ALL,
  onChange,
  counts = {},
}) {
  return (
    <div className="mb-0 overflow-hidden rounded-t-xl border border-b-0 border-[#E6ECF2] bg-white">
      <div
        className="flex overflow-x-auto border-b border-[#E6ECF2] bg-[#F8FAFC] px-3 pt-2.5 sibs-no-scrollbar sm:px-4"
        role="tablist"
        aria-label="Candidate pipeline stages"
      >
        {stageTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          const count = counts[tab.key] ?? 0;

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange?.(tab.key)}
              className={`relative inline-flex h-8.5 2xl:h-9 shrink-0 items-center gap-2 px-3.5 2xl:px-4 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${
                active
                  ? "rounded-t-xl bg-white text-[#042C51]"
                  : "text-[#667085] hover:text-[#042C51]"
              }`}
            >
              <Icon
                size={14}
                className={`shrink-0 ${
                  active
                    ? tab.key === PIPELINE_STAGE_TABS.DROP_OFF
                      ? "text-red-500"
                      : "text-[#FF5C28]"
                    : "text-[#98A2B3]"
                }`}
              />
              <span className="truncate">{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold tabular-nums transition-colors ${
                  active
                    ? tab.key === PIPELINE_STAGE_TABS.DROP_OFF
                      ? "bg-red-600 text-white"
                      : "bg-[#042C51] text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {count}
              </span>
              {active ? (
                <Motion.div
                  layoutId="pipelineStageTabIndicator"
                  className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                    tab.key === PIPELINE_STAGE_TABS.DROP_OFF
                      ? "bg-red-500"
                      : "bg-[#FF5C28]"
                  }`}
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
