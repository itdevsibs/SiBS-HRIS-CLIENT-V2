import React from "react";

import RecruitmentSettingsHero from "../../components/recruitment/settings/RecruitmentSettingsHero";
import RecruitmentSettingsPanelRouter from "../../components/recruitment/settings/RecruitmentSettingsPanelRouter";
import RecruitmentSettingsTabs from "../../components/recruitment/settings/RecruitmentSettingsTabs";
import UpdateHeadcountsPanel from "../../components/recruitment/settings/headcounts/UpdateHeadcountsPanel";
import StatusModal from "../../components/modals/StatusModal";
import Header from "../../components/layout/Header";
import { useRecruitmentSettingsPage } from "../../hooks/recruitmentSettings/useRecruitmentSettingsPage";
function FinalInterviewDropdownDesignFix() {
  return (
    <style>
      {`
        [data-final-interview-panel="true"] select {
          height: 40px !important;
          width: 100% !important;
          appearance: none !important;
          -webkit-appearance: none !important;
          border-radius: 10px !important;
          border: 1px solid #D0D5DD !important;
          background-color: #FFFFFF !important;
          color: #344054 !important;
          font-size: 12px !important;
          font-weight: 800 !important;
          padding: 0 40px 0 12px !important;
          outline: none !important;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06) !important;
          transition: border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease !important;
          background-image:
            linear-gradient(45deg, transparent 50%, #0D4676 50%),
            linear-gradient(135deg, #0D4676 50%, transparent 50%) !important;
          background-position:
            calc(100% - 21px) calc(50% - 2px),
            calc(100% - 15px) calc(50% - 2px) !important;
          background-size:
            6px 6px,
            6px 6px !important;
          background-repeat: no-repeat !important;
        }

        [data-final-interview-panel="true"] select:hover {
          border-color: rgba(13, 70, 118, 0.3) !important;
          background-color: #F8FAFC !important;
        }

        [data-final-interview-panel="true"] select:focus,
        [data-final-interview-panel="true"] select:focus-visible {
          border-color: #0D4676 !important;
          color: #0D4676 !important;
          box-shadow: 0 0 0 4px rgba(13, 70, 118, 0.10) !important;
        }

        [data-final-interview-panel="true"] label {
          color: #101828;
          font-weight: 800;
        }
      `}
    </style>
  );
}


export default function RecruitmentSettingsPage() {
  const {
    activeTab,
    closePageStatusModal,
    handleSyncConfigurations,
    mainRef,
    pageStatusModal,
    setActiveTab,
    settingsTabs,
  } = useRecruitmentSettingsPage();

  return (
    <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main
        ref={mainRef}
        data-recruitment-settings-main="true"
        className="sibs-dashboard-main-wide"
      >
        <div className="mx-auto w-full max-w-[1700px] space-y-5">
          <RecruitmentSettingsHero
            onSyncConfigurations={handleSyncConfigurations}
          />

          <RecruitmentSettingsTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={settingsTabs}
          />

          <section
            className="sibs-profile-tab-panel"
            style={{ animationDelay: "120ms" }}
          >
            <RecruitmentSettingsPanelRouter
              activeTab={activeTab}
              FinalInterviewDropdownDesignFix={FinalInterviewDropdownDesignFix}
              UpdateHeadcountsPanel={UpdateHeadcountsPanel}
            />
          </section>
        </div>
      </main>

      <StatusModal
        open={pageStatusModal.open}
        type={pageStatusModal.type}
        title={pageStatusModal.title}
        message={pageStatusModal.message}
        variant="center"
        onClose={closePageStatusModal}
        lockScroll
      />
    </div>
  );
}
