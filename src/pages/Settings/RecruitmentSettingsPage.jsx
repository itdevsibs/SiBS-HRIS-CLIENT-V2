import React from "react";
import { ArrowLeft } from "lucide-react";

import RecruitmentSettingsHero from "../../components/recruitment/settings/RecruitmentSettingsHero";
import RecruitmentSettingsOverview from "../../components/recruitment/settings/RecruitmentSettingsOverview";
import RecruitmentSettingsPanelRouter from "../../components/recruitment/settings/RecruitmentSettingsPanelRouter";
import UpdateHeadcountsPanel from "../../components/recruitment/settings/headcounts/UpdateHeadcountsPanel";
import Header from "../../components/layout/Header";
import { useRecruitmentSettingsPage } from "../../hooks/recruitmentSettings/useRecruitmentSettingsPage";

const SETTING_META = {
  "Update Headcounts": {
    title: "Headcount Targets",
    description:
      "Review and update weekly required headcount by account and recruitment week.",
  },
  "Final Interview Form": {
    title: "Final Interview Forms",
    description:
      "Manage position-based interview forms, scoring criteria, and passing thresholds.",
  },
  "Application Screening Questionnaires": {
    title: "Application Screening Forms",
    description:
      "Manage position-based application intake questions and candidate screening requirements.",
  },
  "Pipeline Settings": {
    title: "Pipeline & SLAs",
    description:
      "Configure recruitment workflow stages, automation rules, and service-level targets.",
  },
  "Assessment Settings": {
    title: "Assessment Rules",
    description:
      "Configure candidate assessment requirements and evaluation rules.",
  },
  "Email Templates": {
    title: "Email Templates",
    description:
      "Manage candidate communication templates used by recruitment workflows.",
  },
  "Holiday Calendar": {
    title: "Holiday Calendar",
    description:
      "Manage dates excluded from interview follow-up working-day calculations.",
  },
  "Approval Rules": {
    title: "Approval Rules",
    description:
      "Manage the users who can approve recruitment requests by module.",
  },
};

function RecruitmentSettingsDetailHeader({ activeTab, onBack }) {
  const meta = SETTING_META[activeTab] || {
    title: activeTab || "Recruitment Setting",
    description: "Manage this recruitment configuration.",
  };

  return (
    <section className="sibs-card overflow-hidden p-4 sm:p-5 2xl:p-6 sibs-page-header-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="sibs-kicker">Settings / Recruitment</p>

          <h1 className="mt-1 font-heading text-xl font-bold tracking-tight text-sibs-navy 2xl:text-2xl">
            {meta.title}
          </h1>

          <p className="mt-1 max-w-4xl sibs-text-xs font-semibold leading-relaxed text-sibs-muted">
            {meta.description}
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="sibs-btn-secondary shrink-0"
        >
          <ArrowLeft size={15} />
          Recruitment Settings
        </button>
      </div>
    </section>
  );
}

export default function RecruitmentSettingsPage() {
  const {
    activeTab,
    handleBackToOverview,
    handleOpenSetting,
    mainRef,
  } = useRecruitmentSettingsPage();

  const isOverview = activeTab === "Overview";

  return (
    <div className="sibs-dashboard-shell font-jakarta flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0">
        <Header />
      </div>

      <main
        ref={mainRef}
        data-recruitment-settings-main="true"
        className="sibs-dashboard-main-wide"
      >
        <div className="mx-auto w-full max-w-[1700px] space-y-4 2xl:space-y-5">
          {isOverview ? (
            <>
              <RecruitmentSettingsHero />

              <RecruitmentSettingsOverview
                onSelectSetting={handleOpenSetting}
              />
            </>
          ) : (
            <>
              <RecruitmentSettingsDetailHeader
                activeTab={activeTab}
                onBack={handleBackToOverview}
              />

              <section className="sibs-page-card-in">
                <RecruitmentSettingsPanelRouter
                  activeTab={activeTab}
                  UpdateHeadcountsPanel={UpdateHeadcountsPanel}
                />
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
