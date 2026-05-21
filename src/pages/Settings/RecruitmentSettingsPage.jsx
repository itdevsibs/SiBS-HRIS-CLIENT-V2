import React from "react";
import {
  ClipboardCheck,
  Copy,
  Eye,
  FileCheck2,
  Mail,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";


import FormBuilderCard from "../../components/recruitment/settings/FormBuilderCard";
import FormLaunchRulesCard from "../../components/recruitment/settings/FormLaunchRulesCard";
import PlaceholderSettingsPanel from "../../components/recruitment/settings/PlaceholderSettingsPanel";
import RelatedRecruitmentSettingsCard from "../../components/recruitment/settings/RelatedRecruitmentSettingsCard";
import SettingsInfoCards from "../../components/recruitment/settings/SettingsInfoCards";

import { useRecruitmentSettings } from "../../services/context/RecruitmentSettingsContext";

const tabIconMap = {
  "Final Interview Form": ClipboardCheck,
  "Pipeline Settings": SlidersHorizontal,
  "Assessment Settings": FileCheck2,
  "Email Templates": Mail,
  "Approval Rules": ShieldCheck,
};

export default function RecruitmentSettingsPage() {
  const {
    activeTab,
    setActiveTab,
    recruitmentTabs,
    saveStatus,
    handleResetFields,
    handleSaveSettings,
  } = useRecruitmentSettings();

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6">
        <div className="mx-auto max-w-[1600px] space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <Settings size={14} />
                Recruitment Setup
              </div>

              <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
                Recruitment Settings
              </h1>

              <p className="mt-1 max-w-5xl text-sm font-medium leading-6 text-sibs-tertiary-5">
                Configure recruitment forms, final interview scoring, pipeline
                stages, email templates, approvals, and candidate workflow
                rules.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleResetFields}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-md"
              >
                <RotateCcw size={18} />
                Reset
              </button>

              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-md"
              >
                <Eye size={18} />
                Preview Form
              </button>

              <button
                type="button"
                onClick={handleSaveSettings}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95"
              >
                <Save size={18} />
                {saveStatus === "Saved" ? "Saved" : "Save Settings"}
              </button>
            </div>
          </div>

          <SettingsInfoCards />

          <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
            <div className="border-b border-[#E6ECF2] bg-white px-4 sm:px-5">
              <div className="flex flex-col gap-3 pt-4">
                <div>
                  <h2 className="text-base font-extrabold text-[#101828]">
                    Settings Modules
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                    Manage recruitment workflows and form setup from one place.
                  </p>
                </div>

                <div className="flex min-w-0 gap-8 overflow-x-auto">
                  {recruitmentTabs.map((tab) => {
                    const isActive = activeTab === tab;
                    const TabIcon = tabIconMap[tab] || Settings;

                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`relative inline-flex h-12 shrink-0 items-center justify-center gap-2 border-b-2 px-1 text-sm font-extrabold transition ${
                          isActive
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-[#344054] hover:border-[#D0D5DD] hover:text-sibs-primary-1"
                        }`}
                      >
                        <TabIcon
                          size={16}
                          strokeWidth={2.4}
                          className={
                            isActive ? "text-blue-600" : "text-sibs-tertiary-5"
                          }
                        />
                        {tab}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {activeTab === "Final Interview Form" ? (
              <div className="space-y-5 bg-[#F5F7FA] p-4">
                <FormBuilderCard />

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <FormLaunchRulesCard />
                  <RelatedRecruitmentSettingsCard />
                </div>
              </div>
            ) : (
              <PlaceholderSettingsPanel activeTab={activeTab} />
            )}
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#101828]">
                  Interview Form Link
                </h3>
                <Copy size={18} className="text-sibs-tertiary-5" />
              </div>

              <p className="mt-2 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                Used by the Start Interview button in Candidate Pipeline.
              </p>

              <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-xs font-bold text-sibs-primary-1">
                /recruitment/final-interview-form
              </div>
            </div>

            <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
              <h3 className="text-base font-extrabold text-[#101828]">
                Required URL Parameters
              </h3>

              <div className="mt-4 space-y-2">
                <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#344054]">
                  candidateId
                </div>
                <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#344054]">
                  candidateApplicationId
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
              <h3 className="text-base font-extrabold text-[#101828]">
                Recommended Next Setup
              </h3>

              <div className="mt-4 space-y-2">
                <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-sibs-primary-1">
                  Create final interview save logic.
                </p>
                <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-sibs-primary-1">
                  Connect interview result to Candidate Pipeline.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
