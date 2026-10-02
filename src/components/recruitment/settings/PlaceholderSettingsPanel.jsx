import React from "react";
import {
  ClipboardCheck,
  FileCheck2,
  Mail,
  SlidersHorizontal,
} from "lucide-react";

const PLACEHOLDER_META = {
  "Pipeline Settings": {
    title: "Pipeline & SLAs",
    description:
      "Pipeline workflow and SLA configuration is not available in this settings screen yet.",
    icon: SlidersHorizontal,
  },
  "Assessment Settings": {
    title: "Assessment Rules",
    description:
      "Assessment configuration is not available in this settings screen yet.",
    icon: FileCheck2,
  },
  "Email Templates": {
    title: "Email Templates",
    description:
      "Email template management is not available in this settings screen yet.",
    icon: Mail,
  },
};

export default function PlaceholderSettingsPanel({ activeTab }) {
  const meta = PLACEHOLDER_META[activeTab] || {
    title: activeTab || "Recruitment Setting",
    description: "This recruitment setting is not available yet.",
    icon: ClipboardCheck,
  };

  const Icon = meta.icon;

  return (
    <div className="sibs-card overflow-hidden p-8 text-center shadow-xs sm:p-10">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-sibs-border bg-sibs-surface text-sibs-navy">
        <Icon size={21} />
      </div>

      <h3 className="mt-4 font-heading text-lg font-bold tracking-tight text-sibs-navy">
        {meta.title}
      </h3>

      <p className="mx-auto mt-2 max-w-xl sibs-text-xs font-semibold leading-relaxed text-sibs-muted">
        {meta.description}
      </p>

      <span className="sibs-badge-neutral mt-4">Coming Soon</span>
    </div>
  );
}
