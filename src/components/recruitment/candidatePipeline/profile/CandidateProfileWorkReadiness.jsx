import React from "react";
import { CandidateProfileField, CandidateProfilePanel } from "./CandidateProfileField";

function booleanDisplay(value) {
  if (value === true || value === 1 || value === "1" || String(value).toLowerCase() === "yes" || String(value).toLowerCase() === "true") {
    return "Yes";
  }
  if (value === false || value === 0 || value === "0" || String(value).toLowerCase() === "no" || String(value).toLowerCase() === "false") {
    return "No";
  }
  return value || "—";
}

export default function CandidateProfileWorkReadiness({ data }) {
  return (
    <CandidateProfilePanel title="Application Source & Work Readiness">
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <CandidateProfileField label="How Heard About Us" value={data.heardFrom} />
        <CandidateProfileField label="Referred By" value={data.referredBy} />
        <CandidateProfileField label="Referrer Employee ID" value={data.employeeId} />
        <CandidateProfileField label="Open Position" value={data.openPosition} />
        <CandidateProfileField label="Applying Location" value={data.applyingLocation} />
        <CandidateProfileField label="Employment Interest" value={data.employmentInterest} />
        <CandidateProfileField label="Fully Vaccinated" value={booleanDisplay(data.fullyVaccinated)} />
        <CandidateProfileField label="Comfortable On-Site" value={booleanDisplay(data.comfortableOnSite)} />
        <CandidateProfileField label="Willing Graveyard" value={booleanDisplay(data.willingGraveyard)} />
        <CandidateProfileField label="Remote Work Access" value={data.remoteWorkAccess} />
        <CandidateProfileField label="Willing Drug Test" value={booleanDisplay(data.willingDrugTest)} />
        <CandidateProfileField label="Background Check Consent" value={booleanDisplay(data.willingBackgroundCheck)} />
      </div>
    </CandidateProfilePanel>
  );
}
