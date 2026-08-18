import React from "react";
import {
  ClipboardCheck,
  FileCheck2,
  Mail,
  MailCheck,
  Plus,
  Route,
  SlidersHorizontal,
  UserCheck,
} from "lucide-react";
import SettingsHeaderCapsules from "./SettingsHeaderCapsules";

const CAPSULES_BY_TAB = {
  "Pipeline Settings": [
    { label: "Recruitment Workflow", icon: Route },
    { label: "Pipeline Settings", icon: SlidersHorizontal },
  ],
  "Assessment Settings": [
    { label: "Evaluation Tools", icon: ClipboardCheck },
    { label: "Assessment Settings", icon: FileCheck2 },
  ],
  "Email Templates": [
    { label: "Candidate Communications", icon: MailCheck },
    { label: "Email Templates", icon: Mail },
  ],
};

export default function PlaceholderSettingsPanel({ activeTab }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white p-8 text-center shadow-sm">
      <SettingsHeaderCapsules
        items={CAPSULES_BY_TAB[activeTab] || []}
        className="mb-5 justify-center"
      />

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
        {activeTab === "Pipeline Settings" && <SlidersHorizontal size={24} />}
        {activeTab === "Assessment Settings" && <ClipboardCheck size={24} />}
        {activeTab === "Email Templates" && <Mail size={24} />}
        {activeTab === "Approval Rules" && <UserCheck size={24} />}
      </div>

      <h3 className="mt-4 text-lg font-extrabold text-[#101828]">
        {activeTab}
      </h3>
      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-sibs-tertiary-5">
        This section is ready for setup. You can add configuration tables,
        forms, and rules here while keeping the same page structure and theme.
      </p>

      <button
        type="button"
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95"
      >
        <Plus size={18} />
        Add Setting
      </button>
    </div>
  );
}
