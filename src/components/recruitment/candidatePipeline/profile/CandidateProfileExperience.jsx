import React from "react";
import { CandidateProfileField, CandidateProfilePanel } from "./CandidateProfileField";

export default function CandidateProfileExperience({ data }) {
  const experiences = Array.isArray(data.workExperiences) ? data.workExperiences : [];

  return (
    <CandidateProfilePanel
      title="Work Experience"
      badge={experiences.length > 0 ? `${experiences.length} Experiences` : null}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <CandidateProfileField
            label="Work Experience"
            value={data.workExperience || (experiences.length > 0 ? "Yes" : "None")}
          />
          <CandidateProfileField
            label="Total Experience Length"
            value={data.experienceLength}
          />
        </div>

        {experiences.length > 0 ? (
          <div className="space-y-3 pt-1">
            {experiences.map((exp, index) => {
              const company = exp.company || exp.companyName || "—";
              const role = exp.role || exp.position || exp.roleTitle || "—";
              const industry = exp.industry || exp.industryRelevantExperience || "—";
              const length = exp.lengthOfWorkExperience || exp.length || exp.years || "—";
              const compensation = exp.monthlyCompensationFormatted || exp.monthlyCompensation || "—";
              const reason = exp.reasonForLeaving || "—";

              return (
                <div
                  key={`work-exp-${index}`}
                  className="rounded-xl border border-[#E6ECF2] bg-white p-3.5"
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#042C51]">
                    Experience {index + 1}
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                    <CandidateProfileField label="Role / Position" value={role} highlight />
                    <CandidateProfileField label="Company" value={company} />
                    <CandidateProfileField label="Industry" value={industry} />
                    <CandidateProfileField label="Length / Duration" value={length} />
                    <CandidateProfileField label="Monthly Compensation" value={compensation} />
                    <CandidateProfileField
                      label="Reason for Leaving"
                      value={reason}
                      className="sm:col-span-2 lg:col-span-3"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#D7DEE8] bg-white px-4 py-4 text-xs font-semibold text-[#667085]">
            No detailed work experience was submitted.
          </div>
        )}
      </div>
    </CandidateProfilePanel>
  );
}
