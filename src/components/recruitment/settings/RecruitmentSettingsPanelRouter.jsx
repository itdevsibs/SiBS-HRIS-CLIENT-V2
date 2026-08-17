import React from "react";

import ApplicationQuestionsFormSettings from "./ApplicationQuestionsFormSettings";
import ApprovalRulesSettings from "./ApprovalRulesSettings";
import FormBuilderCard from "./FormBuilderCard";
import PlaceholderSettingsPanel from "./PlaceholderSettingsPanel";
import RecruitmentHolidayCalendar from "./RecruitmentHolidayCalendar";

export default function RecruitmentSettingsPanelRouter({
  activeTab,
  FinalInterviewDropdownDesignFix,
  UpdateHeadcountsPanel,
}) {
  if (activeTab === "Update Headcounts") {
    return <UpdateHeadcountsPanel />;
  }

  if (activeTab === "Final Interview Form") {
    return (
      <div data-final-interview-panel="true" className="space-y-5 ">
        <FinalInterviewDropdownDesignFix />

        <FormBuilderCard />
      </div>
    );
  }

  if (
    activeTab === "Application Screening Questionnaires" ||
    activeTab === "Application Questions Form"
  ) {
    return <ApplicationQuestionsFormSettings />;
  }

  if (activeTab === "Holiday Calendar") {
    return <RecruitmentHolidayCalendar />;
  }

  if (activeTab === "Approval Rules") {
    return (
      <div className="bg-white p-5">
        <ApprovalRulesSettings />
      </div>
    );
  }

  return <PlaceholderSettingsPanel activeTab={activeTab} />;
}
