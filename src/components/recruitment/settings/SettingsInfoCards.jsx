import React from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  FileText,
  SlidersHorizontal,
  UserCheck,
} from "lucide-react";
import SettingsMetric from "./SettingsMetric";
import { useRecruitmentSettings } from "../../../services/context/RecruitmentSettingsContext";

export default function SettingsInfoCards() {
  const {
    fields,
    enabledFields,
    requiredFields,
    passingScore,
    pipelineStages,
    activeFormsCount,
    availablePositions,
  } = useRecruitmentSettings();

  return (
    <section className="sibs-card p-4 sm:p-5 font-jakarta">
      <h2 className="font-heading text-base font-bold text-sibs-navy">
        Recruitment Configuration Summary
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SettingsMetric
          label="Position Forms"
          value={activeFormsCount}
          description={`${availablePositions.length} available positions`}
          icon={FileText}
        />

        <SettingsMetric
          label="Interview Fields"
          value={fields.length}
          description={`${enabledFields} enabled for selected role`}
          icon={ClipboardCheck}
        />

        <SettingsMetric
          label="Required Fields"
          value={requiredFields}
          description="Must be answered"
          icon={CheckCircle2}
          valueClassName="text-emerald-600"
        />

        <SettingsMetric
          label="Pipeline Stages"
          value={pipelineStages.length}
          description="Configured flow"
          icon={SlidersHorizontal}
        />

        <SettingsMetric
          label="Passing Score"
          value={`${passingScore}%`}
          description="Selected role form"
          icon={UserCheck}
          valueClassName="text-blue-600"
        />
      </div>
    </section>
  );
}
