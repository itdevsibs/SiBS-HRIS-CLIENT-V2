import React, { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import RecruitmentSettingsHero from "../../components/recruitment/settings/RecruitmentSettingsHero";
import RecruitmentSettingsOverview from "../../components/recruitment/settings/RecruitmentSettingsOverview";
import RecruitmentSettingsPanelRouter from "../../components/recruitment/settings/RecruitmentSettingsPanelRouter";
import RecruitmentSettingsTabs from "../../components/recruitment/settings/RecruitmentSettingsTabs";
import { RECRUITMENT_TABS } from "../../components/recruitment/settings/recruitmentSettingsConstants";
import UpdateHeadcountsPanel from "../../components/recruitment/settings/headcounts/UpdateHeadcountsPanel";
import Header from "../../components/layout/Header";
import { useRecruitmentSettingsPage } from "../../hooks/recruitmentSettings/useRecruitmentSettingsPage";
import { useRecruitmentSettings } from "../../services/context/RecruitmentSettingsContext";

const SUBPANEL_MAP = {
  headcounts: "Update Headcounts",
  "screening-forms": "Application Screening Questionnaires",
  "interview-forms": "Final Interview Form",
  orientation: "Orientation Deck & Knowledge Check",
  "approval-rules": "Approval Rules",
  holidays: "Holiday Calendar",
};

const REVERSE_SUBPANEL_MAP = {
  "Update Headcounts": "/settings/recruitment/headcounts",
  "Application Screening Questionnaires": "/settings/recruitment/screening-forms",
  "Final Interview Form": "/settings/recruitment/interview-forms",
  "Orientation Deck & Knowledge Check": "/settings/recruitment/orientation",
  "Approval Rules": "/settings/recruitment/approval-rules",
  "Holiday Calendar": "/settings/recruitment/holidays",
};

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
  "Orientation Deck & Knowledge Check": {
    title: "Orientation Deck & Knowledge Check PPT",
    description:
      "Upload PPTX/PDF orientation decks, edit slides in real-time, configure staged quiz checkpoints, and preview the applicant portal.",
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

export default function RecruitmentSettingsPage({ subpanel: propSubpanel }) {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { mainRef, scrollToTop } = useRecruitmentSettingsPage();
  const { setActiveTab: setContextActiveTab } = useRecruitmentSettings();

  const splat = (params["*"] || params.subpanel || "").replace(/^\/+|\/+$/g, "");
  const currentSubpanel = propSubpanel || splat;
  const panelParam = searchParams.get("panel");

  // Synchronous derivation of activeTab prevents multi-tick render flashing
  const activeTab = useMemo(() => {
    if (panelParam && SETTING_META[panelParam]) {
      return panelParam;
    }
    if (currentSubpanel && SUBPANEL_MAP[currentSubpanel]) {
      return SUBPANEL_MAP[currentSubpanel];
    }
    return "Overview";
  }, [panelParam, currentSubpanel]);

  // Keep Context in sync with the synchronous tab state
  useEffect(() => {
    setContextActiveTab?.(activeTab);
  }, [activeTab, setContextActiveTab]);

  // Ensure scroll position resets to top on activeTab change
  useEffect(() => {
    scrollToTop();
  }, [activeTab, scrollToTop]);

  const handleTabChange = useCallback(
    (tab) => {
      if (tab.key === "Overview") {
        navigate("/settings/recruitment");
        scrollToTop();
      } else if (tab.subpanel) {
        navigate(`/settings/recruitment/${tab.subpanel}`);
        scrollToTop();
      }
    },
    [navigate, scrollToTop],
  );

  const handleSelectSetting = useCallback(
    (key) => {
      const matchedTab = RECRUITMENT_TABS.find((t) => t.key === key);
      if (matchedTab) {
        handleTabChange(matchedTab);
      } else if (REVERSE_SUBPANEL_MAP[key]) {
        navigate(REVERSE_SUBPANEL_MAP[key]);
        scrollToTop();
      }
    },
    [handleTabChange, navigate, scrollToTop],
  );

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
        <div className="mx-auto flex min-h-full w-full max-w-[1700px] flex-col gap-4 sm:gap-5">
          {/* Header Hero displayed at top of Overview */}
          {isOverview && <RecruitmentSettingsHero />}

          {/* Persistent Horizontal Module Tabs */}
          <RecruitmentSettingsTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {isOverview ? (
            <RecruitmentSettingsOverview
              onSelectSetting={handleSelectSetting}
            />
          ) : (
            <section className="transition-all duration-150">
              <RecruitmentSettingsPanelRouter
                activeTab={activeTab}
                UpdateHeadcountsPanel={UpdateHeadcountsPanel}
              />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
