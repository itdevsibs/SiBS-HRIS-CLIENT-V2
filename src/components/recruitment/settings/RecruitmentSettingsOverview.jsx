import React from "react";
import {
  ArrowUpRight,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  ListChecks,
  Mail,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

import { useRecruitmentSettings } from "../../../services/context/RecruitmentSettingsContext";

const SETTINGS_GROUPS = [
  {
    key: "workforce-planning",
    title: "Workforce Planning",
    description: "Maintain the staffing targets used by recruitment.",
    items: [
      {
        key: "Update Headcounts",
        title: "Headcount Targets",
        description:
          "Review and update weekly required headcount by account.",
        icon: ClipboardList,
        available: true,
      },
    ],
  },
  {
    key: "forms-evaluation",
    title: "Forms & Evaluation",
    description: "Configure the forms used to screen and evaluate candidates.",
    items: [
      {
        key: "Application Screening Questionnaires",
        title: "Application Screening Forms",
        description:
          "Manage position-based intake questions and candidate screening requirements.",
        icon: ListChecks,
        available: true,
      },
      {
        key: "Final Interview Form",
        title: "Final Interview Forms",
        description:
          "Manage interview criteria, scoring fields, and passing thresholds.",
        icon: ClipboardCheck,
        available: true,
        metaKey: "finalInterview",
      },
      {
        key: "Assessment Settings",
        title: "Assessment Rules",
        description:
          "Assessment configuration is planned but is not available yet.",
        icon: FileCheck2,
        available: false,
      },
    ],
  },
  {
    key: "workflow-automation",
    title: "Workflow & Automation",
    description: "Control recruitment timing, workflow behavior, and exclusions.",
    items: [
      {
        key: "Pipeline Settings",
        title: "Pipeline & SLAs",
        description:
          "Pipeline configuration is planned but is not available yet.",
        icon: SlidersHorizontal,
        available: false,
      },
      {
        key: "Holiday Calendar",
        title: "Holiday Calendar",
        description:
          "Manage dates excluded from interview follow-up working-day calculations.",
        icon: CalendarDays,
        available: true,
      },
    ],
  },
  {
    key: "communications",
    title: "Communications",
    description: "Manage recruitment messages sent to candidates.",
    items: [
      {
        key: "Email Templates",
        title: "Email Templates",
        description:
          "Template management is planned but is not available yet.",
        icon: Mail,
        available: false,
      },
    ],
  },
  {
    key: "governance",
    title: "Governance",
    description: "Control who can approve recruitment requests.",
    items: [
      {
        key: "Approval Rules",
        title: "Approval Rules",
        description:
          "Manage approver assignments for recruitment approval modules.",
        icon: ShieldCheck,
        available: true,
      },
    ],
  },
];

function SettingCard({ item, metaText, onSelectSetting }) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      disabled={!item.available}
      onClick={() => {
        if (item.available) {
          onSelectSetting?.(item.key);
        }
      }}
      className={`group flex min-h-[138px] w-full flex-col rounded-2xl border p-4 text-left transition 2xl:p-5 ${
        item.available
          ? "cursor-pointer border-sibs-border bg-white hover:-translate-y-0.5 hover:border-sibs-orange/40 hover:shadow-md"
          : "cursor-default border-sibs-border bg-sibs-surface opacity-75"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
            item.available
              ? "border-blue-100 bg-blue-50 text-sibs-navy"
              : "border-sibs-border bg-white text-sibs-faint"
          }`}
        >
          <Icon size={19} strokeWidth={2.2} />
        </span>

        {item.available ? (
          <ArrowUpRight
            size={17}
            className="shrink-0 text-sibs-faint transition group-hover:text-sibs-orange"
          />
        ) : (
          <span className="sibs-badge-neutral">Coming Soon</span>
        )}
      </div>

      <div className="mt-4 min-w-0">
        <h3 className="font-heading text-base font-bold text-sibs-navy">
          {item.title}
        </h3>

        <p className="mt-1 sibs-text-xs font-semibold leading-relaxed text-sibs-muted">
          {item.description}
        </p>
      </div>

      <div className="mt-auto pt-3">
        <span
          className={`sibs-text-micro font-extrabold uppercase tracking-wide ${
            item.available ? "text-sibs-orange" : "text-sibs-faint"
          }`}
        >
          {item.available ? metaText || "Manage setting" : "Not configured"}
        </span>
      </div>
    </button>
  );
}

export default function RecruitmentSettingsOverview({ onSelectSetting }) {
  const recruitmentSettings = useRecruitmentSettings();

  const finalInterviewCount = Number(
    recruitmentSettings?.activeFormsCount || 0,
  );

  return (
    <div className="space-y-4 2xl:space-y-5">
      {SETTINGS_GROUPS.map((group) => (
        <section
          key={group.key}
          className="sibs-card p-4 sm:p-5 2xl:p-6 sibs-page-card-in"
        >
          <div className="mb-4">
            <h2 className="sibs-section-title">{group.title}</h2>
            <p className="sibs-section-subtitle">{group.description}</p>
          </div>

          <div
            className={`grid grid-cols-1 gap-3 ${
              group.items.length === 1
                ? "lg:grid-cols-2 xl:grid-cols-3"
                : "md:grid-cols-2 xl:grid-cols-3"
            }`}
          >
            {group.items.map((item) => {
              const metaText =
                item.metaKey === "finalInterview"
                  ? `${finalInterviewCount} active ${
                      finalInterviewCount === 1 ? "form" : "forms"
                    }`
                  : "";

              return (
                <SettingCard
                  key={item.key}
                  item={item}
                  metaText={metaText}
                  onSelectSetting={onSelectSetting}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
