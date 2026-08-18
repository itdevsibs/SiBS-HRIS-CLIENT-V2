import React from "react";
import { CandidateProfileField, CandidateProfilePanel } from "./CandidateProfileField";

export default function CandidateProfileSkills({ data }) {
  return (
    <CandidateProfilePanel title="Skills, Languages & Certifications">
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        <CandidateProfileField
          label="Primary Skills"
          value={data.skills}
        />
        <CandidateProfileField
          label="Languages Spoken"
          value={data.languages}
        />
        <CandidateProfileField
          label="Training Attended"
          value={data.trainingAttended}
        />
        <CandidateProfileField
          label="Affiliations / Certifications"
          value={data.affiliations}
        />
      </div>
    </CandidateProfilePanel>
  );
}
