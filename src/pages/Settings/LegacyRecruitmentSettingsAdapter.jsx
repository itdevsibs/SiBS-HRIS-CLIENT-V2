import React from "react";
import { Navigate, useSearchParams } from "react-router-dom";

const PANEL_ROUTE_MAP = {
  "Update Headcounts": "/settings/recruitment/headcounts",
  "Application Screening Questionnaires": "/settings/recruitment/screening-forms",
  "Application Questions Form": "/settings/recruitment/screening-forms",
  "Final Interview Form": "/settings/recruitment/interview-forms",
  "Orientation Deck & Knowledge Check": "/settings/recruitment/orientation",
  "Approval Rules": "/settings/recruitment/approval-rules",
  "Holiday Calendar": "/settings/recruitment/holidays",
};

export default function LegacyRecruitmentSettingsAdapter() {
  const [searchParams] = useSearchParams();
  const panel = searchParams.get("panel");

  if (panel && PANEL_ROUTE_MAP[panel]) {
    return <Navigate to={PANEL_ROUTE_MAP[panel]} replace />;
  }

  return <Navigate to="/settings/recruitment" replace />;
}
