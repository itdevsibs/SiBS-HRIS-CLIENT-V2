import React from "react";
import {
  Building2,
  FileText,
  Mail,
  RefreshCw,
  Settings,
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
    tone: "sky",
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
  sky: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  orange: "border-[#FF5C28]/40 bg-[#FF5C28]/10 text-[#FFB092]",
  blue: "border-blue-300/30 bg-blue-300/10 text-blue-200",
  violet: "border-violet-300/40 bg-violet-300/10 text-violet-200",
  emerald: "border-emerald-300/40 bg-emerald-300/10 text-emerald-200",
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
    <section className="relative overflow-hidden rounded-[18px] bg-[#062F53] px-5 py-6 text-white shadow-[0_18px_40px_rgba(4,44,81,0.20)] sm:px-7">
      <div className="pointer-events-none absolute -right-12 bottom-[-105px] h-72 w-72 rounded-full border-[28px] border-white/10" />
      <div className="pointer-events-none absolute -right-2 bottom-10 h-28 w-28 rounded-full border-[18px] border-white/10" />

      <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#FF5C28] px-3 py-1 text-[10px] font-extrabold uppercase tracking-normal text-white">
              Recruitment Setup & Governance
            </span>
            <span className="text-xs font-bold text-slate-300">
              • SiBS Solutions Portal
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <Settings className="h-7 w-7 shrink-0 text-[#FF5C28]" />
            <h1 className="text-2xl font-extrabold leading-tight tracking-normal sm:text-3xl">
              Recruitment Settings
            </h1>
          </div>

          <p className="mt-3 max-w-5xl text-sm font-medium leading-6 text-slate-200">
            Configure recruitment forms, final interview scoring rubrics,
            pipeline SLAs, assessment thresholds, automated email templates,
            working holiday exclusions, and approval consensus matrices.
          </p>
        </div>

        <button
          type="button"
          onClick={onSyncConfigurations}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-white/15"
        >
          <RefreshCw size={16} className="text-[#FF5C28]" />
          Sync Configurations
        </button>
      </div>

      <div className="relative z-10 mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {heroCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.key}
              className={`min-h-[118px] rounded-xl border p-4 ${toneClasses[card.tone]}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[10px] font-extrabold uppercase leading-4 tracking-normal">
                  {card.label}
                </p>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current/30 bg-white/10">
                  <Icon size={17} />
                </span>
              </div>

              <div className="mt-5 flex items-end gap-1.5">
                <span className="text-2xl font-extrabold leading-none text-white">
                  {metrics[card.valueKey]}
                </span>
                <span className="pb-0.5 text-xs font-extrabold text-slate-200">
                  {card.unit}
                </span>
              </div>

              <p className="mt-2 text-[10px] font-bold uppercase leading-4 tracking-normal text-slate-300">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
