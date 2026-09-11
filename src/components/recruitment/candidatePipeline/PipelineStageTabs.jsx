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
import StatusFilterTabs from "../StatusFilterTabs";

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
    <StatusFilterTabs
      tabs={stageTabs}
      activeValue={activeTab}
      counts={counts}
      onChange={onChange}
      showAllCounts
      layoutId="pipelineStageTabIndicator"
    />
  );
}
