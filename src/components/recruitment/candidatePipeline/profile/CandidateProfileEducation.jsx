import React from "react";
import { CandidateProfileField, CandidateProfilePanel } from "./CandidateProfileField";

export default function CandidateProfileEducation({ data }) {
  return (
    <CandidateProfilePanel title="Education & Academic Credentials">
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        <CandidateProfileField
          label="Highest Educational Attainment"
          value={data.educationalAttainment}
        />
        <CandidateProfileField
          label="School / Institution Name"
          value={data.schoolName}
        />
        <CandidateProfileField
          label="Degree / Course"
          value={data.courseDegree}
        />
        <CandidateProfileField
          label="Year Graduated / Inclusive Period"
          value={data.yearGraduated}
        />
        <CandidateProfileField
          label="Academic Honors / Awards"
          value={data.academicHonors}
        />
      </div>
    </CandidateProfilePanel>
  );
}
