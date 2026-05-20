import React from "react";
import DetailRow from "../../layout/common/DetailRow";
import ProfileDetailCard from "./ProfileDetailCard";

import {
  asDisplayValue,
  findTalentPoolProfile,
  getRoleTitle,
} from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";

const CandidateTalentPoolDetailsPanel = ({ candidate }) => {
  const profile = findTalentPoolProfile(candidate);
  const workExperiences = Array.isArray(profile.workExperiences)
    ? profile.workExperiences
    : Array.isArray(profile.otherExperiences)
      ? profile.otherExperiences
      : [];

  const references = Array.isArray(profile.references)
    ? profile.references
    : [
        profile.reference1 || profile.referenceName1
          ? {
              name: profile.reference1 || profile.referenceName1,
              phone: profile.reference1Phone || profile.referencePhone1,
            }
          : null,
        profile.reference2 || profile.referenceName2
          ? {
              name: profile.reference2 || profile.referenceName2,
              phone: profile.reference2Phone || profile.referencePhone2,
            }
          : null,
        profile.reference3 || profile.referenceName3
          ? {
              name: profile.reference3 || profile.referenceName3,
              phone: profile.reference3Phone || profile.referencePhone3,
            }
          : null,
      ].filter(Boolean);

  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-1">
        <h3 className="text-sm font-extrabold text-sibs-primary-1">
          Talent Pool Submitted Details
        </h3>
        <p className="text-xs font-semibold leading-5 text-sibs-primary-1/75">
          This shows the details captured from the Talent Pool / Public Form for
          TA review.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ProfileDetailCard title="Application Source">
          <DetailRow
            label="How Heard About Us"
            value={asDisplayValue(
              profile.heardFrom ||
                profile.howHeard ||
                profile.howDidYouHearAboutUs ||
                profile.sources,
            )}
          />
          <DetailRow
            label="Open Position"
            value={
              profile.openPosition ||
              profile.appliedPosition ||
              profile.roleCapability ||
              getRoleTitle(profile.roleAccount)
            }
          />
          <DetailRow label="Nickname" value={profile.nickname} />
          <DetailRow
            label="Applying Location"
            value={
              profile.applicationLocation ||
              profile.locationApplyingFor ||
              profile.site ||
              profile.location
            }
          />
          <DetailRow
            label="Referred By"
            value={
              profile.referredBy ||
              profile.whoReferredYou ||
              profile.referrer ||
              profile.source
            }
          />
          <DetailRow
            label="Employee ID"
            value={profile.employeeId || profile.referrerEmployeeId}
          />
        </ProfileDetailCard>

        <ProfileDetailCard title="Personal Information">
          <DetailRow label="First Name" value={profile.firstName} />
          <DetailRow label="Last Name" value={profile.lastName} />
          <DetailRow label="Middle Name" value={profile.middleName} />
          <DetailRow
            label="Suffix"
            value={profile.suffix || profile.extension}
          />
          <DetailRow label="Date of Birth" value={profile.dateOfBirth} />
          <DetailRow label="Email" value={profile.email} />
          <DetailRow
            label="Phone 1"
            value={
              profile.phone1 || profile.phoneNumber1 || profile.contactNumber
            }
          />
          <DetailRow
            label="Phone 2"
            value={profile.phone2 || profile.phoneNumber2}
          />
          <DetailRow label="Physical Address" value={profile.physicalAddress} />
        </ProfileDetailCard>

        <ProfileDetailCard title="Work Experience">
          <DetailRow
            label="Work Experience"
            value={profile.workExperience || profile.hasWorkExperience}
          />
          {workExperiences.length > 0 ? (
            <div className="space-y-3 pt-2">
              {workExperiences.map((experience, index) => (
                <div
                  key={`experience-${index}`}
                  className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3"
                >
                  <p className="mb-2 text-xs font-extrabold text-sibs-primary-1">
                    Experience {index + 1}
                  </p>
                  <DetailRow
                    label="Industry"
                    value={
                      experience.industry ||
                      experience.relevantExperience ||
                      experience.industryExperience
                    }
                  />
                  <DetailRow
                    label="Length"
                    value={
                      experience.lengthOfWorkExperience ||
                      experience.length ||
                      experience.experienceLength
                    }
                  />
                  <DetailRow label="Years" value={experience.years} />
                  <DetailRow label="Role" value={experience.role} />
                  <DetailRow label="Company" value={experience.company} />
                  <DetailRow
                    label="Monthly Compensation"
                    value={experience.monthlyCompensation}
                  />
                  <DetailRow
                    label="Reason for Leaving"
                    value={experience.reasonForLeaving}
                  />
                </div>
              ))}
            </div>
          ) : (
            <>
              <DetailRow
                label="Industry"
                value={profile.industry || profile.industryExperience}
              />
              <DetailRow
                label="Length"
                value={
                  profile.lengthOfWorkExperience || profile.experienceLength
                }
              />
              <DetailRow label="Years" value={profile.years} />
              <DetailRow
                label="Role"
                value={profile.experienceRole || profile.role}
              />
              <DetailRow label="Company" value={profile.company} />
              <DetailRow
                label="Monthly Compensation"
                value={profile.monthlyCompensation}
              />
              <DetailRow
                label="Reason for Leaving"
                value={profile.reasonForLeaving}
              />
            </>
          )}
        </ProfileDetailCard>

        <ProfileDetailCard title="Education and Certifications">
          <DetailRow
            label="Highest Educational Attainment"
            value={
              profile.educationalAttainment ||
              profile.highestEducationalAttainment
            }
          />
          <DetailRow
            label="Affiliations / Certifications"
            value={asDisplayValue(
              profile.affiliations || profile.certifications,
            )}
          />
          <DetailRow
            label="Training Attended"
            value={profile.trainingAttended}
          />
        </ProfileDetailCard>

        <ProfileDetailCard title="Work Readiness">
          <DetailRow label="Fully Vaccinated" value={profile.fullyVaccinated} />
          <DetailRow
            label="Comfortable On Site"
            value={profile.comfortableOnSite}
          />
          <DetailRow
            label="Willing Graveyard"
            value={profile.willingGraveyard}
          />
          <DetailRow
            label="Employment Interest"
            value={profile.employmentInterest}
          />
          <DetailRow
            label="Remote Work Access"
            value={profile.remoteWorkAccess}
          />
          <DetailRow
            label="Willing Drug Test"
            value={profile.willingDrugTest}
          />
          <DetailRow
            label="Background Check Consent"
            value={profile.willingBackgroundCheck}
          />
        </ProfileDetailCard>

        <ProfileDetailCard title="References and Uploads">
          {references.length > 0 ? (
            references.map((reference, index) => (
              <DetailRow
                key={`reference-${index}`}
                label={`Reference ${index + 1}`}
                value={`${reference.name || "—"}${reference.phone ? ` / ${reference.phone}` : ""}`}
              />
            ))
          ) : (
            <DetailRow label="References" value={profile.references} />
          )}
          <DetailRow
            label="Audio File"
            value={
              profile.audioFileName ||
              profile.audioFile?.name ||
              profile.audioUploadName
            }
          />
          <DetailRow
            label="Attachment"
            value={
              profile.attachmentFileName ||
              profile.supportingFileName ||
              profile.resumeFileName ||
              profile.fileUploadName
            }
          />
          <DetailRow
            label="Terms Accepted"
            value={profile.consent || profile.termsAccepted ? "Yes" : "—"}
          />
        </ProfileDetailCard>
      </div>
    </div>
  );
};

export default CandidateTalentPoolDetailsPanel;
