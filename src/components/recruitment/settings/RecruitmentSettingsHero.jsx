import React from "react";
import {
  Building2,
  FileText,
  Mail,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

import { useRecruitmentSettings } from "../../../services/context/RecruitmentSettingsContext";

const heroCards = [
  {
    key: "headcounts",
    label: "Account Headcounts",
    valueKey: "accountHeadcounts",
    unit: "Accounts",
    description: "Required headcount",
    icon: Building2,
    tone: "navy",
  },
  {
    key: "rubrics",
    label: "Position Rubrics",
    valueKey: "positionRubrics",
    unit: "Positions",
    description: "Scoring rubrics configured",
    icon: FileText,
    tone: "orange",
  },
  {
    key: "pipeline",
    label: "Pipeline & SLAs",
    valueKey: "pipelineStages",
    unit: "Stages",
    description: "Auto-rejection & SLAs active",
    icon: SlidersHorizontal,
    tone: "blue",
  },
  {
    key: "templates",
    label: "Email Templates",
    valueKey: "emailTemplates",
    unit: "Templates",
    description: "Automated candidate comms",
    icon: Mail,
    tone: "violet",
  },
  {
    key: "governance",
    label: "Governance & Rules",
    valueKey: "governanceRules",
    unit: "Holidays",
    description: "Approval modules active",
    icon: ShieldCheck,
    tone: "emerald",
  },
];

const toneClasses = {
  navy: {
    label: "text-[#164E7A]",
    value: "text-sibs-navy",
    icon: "border-blue-100 bg-blue-50 text-[#164E7A]",
  },
  orange: {
    label: "text-[#D34F1F]",
    value: "text-sibs-orange",
    icon: "border-orange-100 bg-orange-50 text-sibs-orange",
  },
  blue: {
    label: "text-blue-700",
    value: "text-sibs-tertiary-3",
    icon: "border-blue-100 bg-blue-50 text-blue-700",
  },
  violet: {
    label: "text-violet-700",
    value: "text-violet-600",
    icon: "border-violet-100 bg-violet-50 text-violet-600",
  },
  emerald: {
    label: "text-emerald-700",
    value: "text-emerald-600",
    icon: "border-emerald-100 bg-emerald-50 text-emerald-600",
  },
};

function getHeroMetrics(settings) {
  const availablePositions = Array.isArray(settings.availablePositions)
    ? settings.availablePositions
    : [];
  const forms = Array.isArray(settings.forms) ? settings.forms : [];
  const pipelineStages = Array.isArray(settings.pipelineStages)
    ? settings.pipelineStages
    : [];

  return {
    accountHeadcounts: Math.max(availablePositions.length, 0),
    positionRubrics: settings.activeFormsCount || forms.length || 0,
    pipelineStages: pipelineStages.length,
    emailTemplates: 4,
    governanceRules: 6,
  };
}

export default function RecruitmentSettingsHero({ onSyncConfigurations }) {
  const recruitmentSettings = useRecruitmentSettings();
  const metrics = getHeroMetrics(recruitmentSettings);

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-2xl border border-sibs-border bg-white px-5 py-5 shadow-sm sm:px-6">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#07365F] via-sibs-orange to-[#07365F]" />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-normal text-[#164E7A]">
                <span className="h-1.5 w-1.5 rounded-full bg-sibs-orange" />
                RECRUITMENT SETTINGS VIEW
              </span>

              <span className="inline-flex rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-normal text-sibs-orange">
                MODULE: SETTINGS
              </span>
            </div>

            <h1 className="font-heading mt-2 break-words text-xl 2xl:text-3xl font-bold tracking-tight text-sibs-navy">
              Recruitment Settings
            </h1>

            <p className="mt-1 max-w-5xl sibs-text-sm font-semibold leading-relaxed text-sibs-muted">
              Configure recruitment forms, scoring rubrics, pipeline SLAs,
              assessment thresholds, email templates, holidays, and approval
              rules.
            </p>
          </div>

          <button
            type="button"
            onClick={onSyncConfigurations}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[10px] border border-sibs-border-subtle bg-sibs-surface px-4 text-xs font-extrabold text-sibs-navy shadow-sm transition hover:border-[#BFD8F1] hover:bg-white active:scale-[0.98]"
          >
            <RefreshCw size={15} className="text-sibs-orange" />
            Sync Configurations
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {heroCards.map((card) => {
          const Icon = card.icon;
          const tone = toneClasses[card.tone] || toneClasses.navy;

          return (
            <article
              key={card.key}
              className="min-h-[112px] rounded-2xl border border-sibs-border bg-white px-4 py-4 shadow-sm"
            >
              <div className="flex h-full items-center justify-between gap-4">
                <div className="min-w-0">
                  <p
                    className={`truncate text-[10px] font-extrabold uppercase tracking-normal ${tone.label}`}
                  >
                    {card.label}
                  </p>

                  <div className="mt-3 flex items-end gap-1.5">
                    <span
                      className={`text-2xl font-extrabold leading-none ${tone.value}`}
                    >
                      {metrics[card.valueKey]}
                    </span>
                    <span className="pb-0.5 text-[10px] font-extrabold text-sibs-muted">
                      {card.unit}
                    </span>
                  </div>

                  <p className="mt-2 truncate text-[10px] font-semibold text-sibs-muted">
                    {card.description}
                  </p>
                </div>

                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${tone.icon}`}
                >
                  <Icon size={16} strokeWidth={2.2} />
                </span>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
