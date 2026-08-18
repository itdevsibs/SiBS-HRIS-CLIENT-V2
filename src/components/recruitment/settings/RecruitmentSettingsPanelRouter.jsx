import React from "react";

import ApplicationQuestionsFormSettings from "./ApplicationQuestionsFormSettings";
import ApprovalRulesSettings from "./ApprovalRulesSettings";
import FormBuilderCard from "./FormBuilderCard";
import PlaceholderSettingsPanel from "./PlaceholderSettingsPanel";
import RecruitmentHolidayCalendar from "./RecruitmentHolidayCalendar";

export default function RecruitmentSettingsPanelRouter({
  activeTab,
  FinalInterviewDropdownDesignFix: finalInterviewDropdownDesignFix,
  UpdateHeadcountsPanel: updateHeadcountsPanel,
}) {
  if (activeTab === "Update Headcounts") {
    return React.createElement(updateHeadcountsPanel);
  }

  if (activeTab === "Final Interview Form") {
    return (
      <div data-final-interview-panel="true" className="space-y-5 ">
        {React.createElement(finalInterviewDropdownDesignFix)}

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
      <div className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
        <ApprovalRulesSettings />
      </div>
    );
  }

  return <PlaceholderSettingsPanel activeTab={activeTab} />;
}
