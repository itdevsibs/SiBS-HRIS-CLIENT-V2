import React from "react";
import {
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  ListChecks,
  Mail,
  ShieldCheck,
  SlidersHorizontal,
  ChevronRight,
  Clock,
} from "lucide-react";

import { useRecruitmentSettings } from "../../../services/context/RecruitmentSettingsContext";

const ACTIVE_SETTINGS = [
  {
    key: "Update Headcounts",
    category: "Workforce Planning",
    title: "Headcount Targets",
    description: "Review and update weekly required headcount quotas, actual hires, and buffers by account.",
    icon: ClipboardList,
    badge: "Active",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    iconClass: "bg-blue-50 text-blue-600",
    actionLabel: "Configure Targets",
  },
  {
    key: "Application Screening Questionnaires",
    category: "Forms & Evaluation",
    title: "Application Screening Forms",
    description: "Manage position-based intake questions and candidate screening requirements.",
    icon: ListChecks,
    badge: "Active",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    iconClass: "bg-blue-50 text-blue-600",
    actionLabel: "Edit Screening Forms",
  },
  {
    key: "Final Interview Form",
    category: "Forms & Evaluation",
    title: "Final Interview Forms",
    description: "Manage interview criteria, scoring rubrics, and passing thresholds by position.",
    icon: ClipboardCheck,
    metaKey: "finalInterview",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    iconClass: "bg-blue-50 text-blue-600",
    actionLabel: "Edit Interview Rubrics",
  },
  {
    key: "Orientation Deck & Knowledge Check",
    category: "Forms & Evaluation",
    title: "Orientation Deck & Quiz PPT",
    description: "Upload PPTX/PDF decks, edit slides in real-time, configure quiz checkpoints, and preview candidate portals.",
    icon: GraduationCap,
    badge: "Configured",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    iconClass: "bg-purple-50 text-purple-600",
    actionLabel: "Manage Orientation Deck",
  },
  {
    key: "Approval Rules",
    category: "Governance & Policy",
    title: "Approval Rules",
    description: "Configure multi-tier approver sequences across Job Requisitions, Stage Movements, Offers, and Accounts.",
    icon: ShieldCheck,
    badge: "6 Modules",
    badgeClass: "bg-orange-50 text-sibs-orange border-orange-200",
    iconClass: "bg-orange-50 text-sibs-orange",
    actionLabel: "Configure Approval Rules",
  },
  {
    key: "Holiday Calendar",
    category: "Governance & Policy",
    title: "Holiday Calendar",
    description: "Manage regular, special, and local non-working dates impacting interview SLA calculations.",
    icon: CalendarDays,
    badge: "Active",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    iconClass: "bg-amber-50 text-amber-600",
    actionLabel: "View Holiday Calendar",
  },
];

const ROADMAP_SETTINGS = [
  {
    key: "Assessment Settings",
    title: "Assessment Rules",
    description: "Online assessment scoring thresholds, proctoring rules, and candidate test workflows.",
    icon: FileCheck2,
  },
  {
    key: "Pipeline Settings",
    title: "Pipeline & SLAs",
    description: "Stage progression automations, SLA turnaround rules, and automated movement policies.",
    icon: SlidersHorizontal,
  },
  {
    key: "Email Templates",
    title: "Email Templates",
    description: "Customized notification and invitation email templates with dynamic token interpolation.",
    icon: Mail,
  },
];

export default function RecruitmentSettingsOverview({ onSelectSetting }) {
  const recruitmentSettings = useRecruitmentSettings();
  const finalInterviewCount = Number(recruitmentSettings?.activeFormsCount || 0);

  return (
    <div className="space-y-6 font-jakarta">
      {/* Active Operational Modules Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {ACTIVE_SETTINGS.map((item) => {
          const Icon = item.icon;
          const badgeText =
            item.metaKey === "finalInterview"
              ? `${finalInterviewCount} ${finalInterviewCount === 1 ? "Active Form" : "Active Forms"}`
              : item.badge;

          return (
            <div
              key={item.key}
              onClick={() => onSelectSetting?.(item.key)}
              className="group relative flex flex-col justify-between rounded-2xl border border-sibs-border bg-white p-5 shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-sibs-orange/40 hover:shadow-md cursor-pointer"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.iconClass}`}
                  >
                    <Icon size={20} strokeWidth={2.2} />
                  </div>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-tight ${item.badgeClass}`}
                  >
                    {badgeText}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {item.category}
                  </p>
                  <h3 className="mt-0.5 font-heading text-base font-bold text-sibs-navy group-hover:text-sibs-orange transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-sibs-navy group-hover:text-sibs-orange">
                <span>{item.actionLabel}</span>
                <ChevronRight
                  size={15}
                  className="transition-transform group-hover:translate-x-1"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Planned Roadmap Modules (Subtle, Compact Section) */}
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} className="text-slate-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Planned Modules & Features (Roadmap)
          </h4>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {ROADMAP_SETTINGS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="flex items-start gap-3 rounded-xl border border-slate-200/60 bg-white/80 p-3.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs font-bold text-slate-700 truncate">
                      {item.title}
                    </h5>
                    <span className="shrink-0 rounded-sm bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold text-slate-400">
                      Coming Soon
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
