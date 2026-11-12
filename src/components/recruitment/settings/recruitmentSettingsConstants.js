import {
  LayoutGrid,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  ListChecks,
  ShieldCheck,
} from "lucide-react";

export const RECRUITMENT_TABS = [
  {
    key: "Overview",
    label: "Overview",
    icon: LayoutGrid,
    subpanel: "",
  },
  {
    key: "Update Headcounts",
    label: "Headcount Targets",
    icon: ClipboardList,
    subpanel: "headcounts",
  },
  {
    key: "Application Screening Questionnaires",
    label: "Screening Forms",
    icon: ListChecks,
    subpanel: "screening-forms",
  },
  {
    key: "Final Interview Form",
    label: "Interview Forms",
    icon: ClipboardCheck,
    subpanel: "interview-forms",
  },
  {
    key: "Orientation Deck & Knowledge Check",
    label: "Orientation Deck & Quiz",
    icon: GraduationCap,
    subpanel: "orientation",
  },
  {
    key: "Approval Rules",
    label: "Approval Rules",
    icon: ShieldCheck,
    subpanel: "approval-rules",
  },
  {
    key: "Holiday Calendar",
    label: "Holiday Calendar",
    icon: CalendarDays,
    subpanel: "holidays",
  },
];
