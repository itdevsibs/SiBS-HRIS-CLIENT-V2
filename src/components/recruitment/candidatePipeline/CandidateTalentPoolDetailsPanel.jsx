import React, { useEffect, useMemo, useState } from "react";
import DetailRow from "../../layout/common/DetailRow";
import ProfileDetailCard from "./ProfileDetailCard";

import api from "../../../lib/axios/api-template";

import {
  asDisplayValue,
  findTalentPoolProfile,
  getRoleTitle,
} from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";

function cleanText(value) {
  return String(value ?? "").trim();
}

function isEmptyValue(value) {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return cleanText(value) === "";
}

function safeJsonParse(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value === "object") return value;

  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function safeArray(value) {
  if (Array.isArray(value)) return value.filter((item) => !isEmptyValue(item));

  if (typeof value === "string") {
    const parsed = safeJsonParse(value, null);

    if (Array.isArray(parsed)) {
      return parsed.filter((item) => !isEmptyValue(item));
    }

    return value
      .split(",")
      .map((item) => cleanText(item))
      .filter(Boolean);
  }

  return [];
}

function safeFindTalentPoolProfile(candidate) {
  try {
    return findTalentPoolProfile(candidate) || {};
  } catch {
    return {};
  }
}

function getMetadata(candidate = {}) {
  return candidate?.metadata || candidate?.metadataJson || {};
}

function getSourceTalentPoolId(candidate = {}) {
  const metadata = getMetadata(candidate);

  return (
    candidate?.sourceTalentPoolId ||
    candidate?.source_talent_pool_id ||
    metadata?.sourceTalentPoolId ||
    metadata?.source_talent_pool_id ||
    metadata?.talentPoolApplicationId ||
    metadata?.applicationId ||
    candidate?.candidateApplicationId ||
    candidate?.applicationId ||
    ""
  );
}

function buildDataSources(candidate = {}, baseProfile = {}, remoteProfile = {}) {
  const metadata = getMetadata(candidate);

  return [
    remoteProfile,
    remoteProfile?.data,
    remoteProfile?.application,
    remoteProfile?.candidate,

    baseProfile,
    baseProfile?.data,
    baseProfile?.application,
    baseProfile?.candidate,

    candidate?.talentPoolProfile,
    candidate?.talentPoolApplication,
    candidate?.candidateSnapshot,

    metadata?.talentPoolApplication,
    metadata?.talentPoolProfile,
    metadata?.talentPool,
    metadata?.sourceCandidate,
    metadata?.application,
    metadata?.candidate,
    metadata,

    candidate,
  ].filter(Boolean);
}

function pickFromSources(sources = [], keys = []) {
  for (const key of keys) {
    for (const source of sources) {
      const value = source?.[key];

      if (!isEmptyValue(value)) {
        return value;
      }
    }
  }

  return "";
}

function pickArrayFromSources(sources = [], keys = []) {
  for (const key of keys) {
    const value = pickFromSources(sources, [key]);
    const arrayValue = safeArray(value);

    if (arrayValue.length) return arrayValue;
  }

  return [];
}

function displayArray(value) {
  const arrayValue = safeArray(value);

  if (!arrayValue.length) {
    return asDisplayValue(value);
  }

  return arrayValue
    .map((item) => {
      if (typeof item === "object") {
        return (
          item.label ||
          item.value ||
          item.name ||
          item.title ||
          Object.values(item).filter(Boolean).join(" / ")
        );
      }

      return item;
    })
    .map(cleanText)
    .filter(Boolean)
    .join(", ");
}

function formatDateValue(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return cleanText(value) || "—";
  }

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatMoneyValue(value) {
  if (isEmptyValue(value)) return "—";

  const number = Number(String(value).replace(/,/g, ""));

  if (!Number.isFinite(number)) {
    return cleanText(value) || "—";
  }

  return number.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  });
}

function splitFullName(fullName = "") {
  const parts = cleanText(fullName).split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return {
      firstName: "",
      middleName: "",
      lastName: "",
    };
  }

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      middleName: "",
      lastName: "",
    };
  }

  return {
    firstName: parts[0],
    middleName: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
    lastName: parts[parts.length - 1],
  };
}

function buildWorkExperiences(sources = []) {
  const workExperiences =
    pickArrayFromSources(sources, [
      "workExperiences",
      "work_experiences_json",
      "workExperiencesJson",
    ]) ||
    [];

  if (workExperiences.length > 0) return workExperiences;

  const otherExperiences = pickArrayFromSources(sources, [
    "otherExperiences",
    "other_experiences_json",
    "otherExperiencesJson",
  ]);

  if (otherExperiences.length > 0) return otherExperiences;

  const primaryExperience = {
    industry:
      pickFromSources(sources, [
        "industry",
        "industryRelevantExperience",
        "industry_relevant_experience",
        "industryExperience",
        "relevantExperience",
        "skillsLanguage",
        "skills_language",
      ]) || "",
    lengthOfWorkExperience:
      pickFromSources(sources, [
        "lengthOfWorkExperience",
        "length_of_work_experience",
        "experienceLength",
        "length",
      ]) || "",
    years: pickFromSources(sources, ["years"]) || "",
    role:
      pickFromSources(sources, [
        "experienceRole",
        "previousRole",
        "role",
      ]) || "",
    company: pickFromSources(sources, ["company"]) || "",
    monthlyCompensation:
      pickFromSources(sources, [
        "monthlyCompensation",
        "monthly_compensation",
      ]) || "",
    reasonForLeaving:
      pickFromSources(sources, [
        "reasonForLeaving",
        "reason_for_leaving",
      ]) || "",
  };

  const hasValue = Object.values(primaryExperience).some(
    (value) => !isEmptyValue(value),
  );

  return hasValue ? [primaryExperience] : [];
}

function buildReferences(sources = []) {
  const references = pickArrayFromSources(sources, [
    "references",
    "references_json",
    "referencesJson",
  ]);

  if (references.length > 0) return references;

  return [
    {
      name: pickFromSources(sources, [
        "reference1",
        "referenceName1",
        "reference1Name",
        "reference1_name",
      ]),
      phone: pickFromSources(sources, [
        "reference1Phone",
        "referencePhone1",
        "reference1_phone",
      ]),
    },
    {
      name: pickFromSources(sources, [
        "reference2",
        "referenceName2",
        "reference2Name",
        "reference2_name",
      ]),
      phone: pickFromSources(sources, [
        "reference2Phone",
        "referencePhone2",
        "reference2_phone",
      ]),
    },
    {
      name: pickFromSources(sources, [
        "reference3",
        "referenceName3",
        "reference3Name",
        "reference3_name",
      ]),
      phone: pickFromSources(sources, [
        "reference3Phone",
        "referencePhone3",
        "reference3_phone",
      ]),
    },
  ].filter((reference) => reference.name || reference.phone);
}

const CandidateTalentPoolDetailsPanel = ({ candidate }) => {
  const baseProfile = useMemo(() => safeFindTalentPoolProfile(candidate), [
    candidate,
  ]);

  const [remoteProfile, setRemoteProfile] = useState({});
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadTalentPoolApplication() {
      const talentPoolId = getSourceTalentPoolId(candidate);

      if (!talentPoolId) {
        setRemoteProfile({});
        return;
      }

      setIsLoadingProfile(true);

      try {
        const response = await api.get(`/api/talent-pool/applications/${talentPoolId}`, {
          withCredentials: true,
        });

        if (!active) return;

        setRemoteProfile(response?.data?.data || response?.data?.application || {});
      } catch (error) {
        if (!active) return;

        console.error(
          "Load candidate talent pool profile error:",
          error?.response?.data || error?.message,
        );

        setRemoteProfile({});
      } finally {
        if (active) {
          setIsLoadingProfile(false);
        }
      }
    }

    loadTalentPoolApplication();

    return () => {
      active = false;
    };
  }, [
    candidate?.id,
    candidate?.candidateId,
    candidate?.candidateApplicationId,
    candidate?.applicationId,
    candidate?.sourceTalentPoolId,
  ]);

  const data = useMemo(() => {
    const sources = buildDataSources(candidate, baseProfile, remoteProfile);

    const fullName =
      pickFromSources(sources, [
        "fullName",
        "full_name",
        "name",
        "candidateName",
      ]) || "";

    const splitName = splitFullName(fullName);

    const firstName =
      pickFromSources(sources, ["firstName", "first_name"]) ||
      splitName.firstName;

    const lastName =
      pickFromSources(sources, ["lastName", "last_name"]) ||
      splitName.lastName;

    const middleName =
      pickFromSources(sources, ["middleName", "middle_name"]) ||
      splitName.middleName;

    const openPosition =
      pickFromSources(sources, [
        "openPosition",
        "open_position",
        "appliedPosition",
        "roleCapability",
        "role_capability",
        "roleTitle",
        "currentAppliedRole",
      ]) ||
      getRoleTitle(pickFromSources(sources, ["roleAccount"])) ||
      "—";

    return {
      heardFrom: displayArray(
        pickFromSources(sources, [
          "hearAboutUs",
          "hear_about_us",
          "heardFrom",
          "howHeard",
          "howDidYouHearAboutUs",
          "sources",
          "source",
        ]),
      ),
      openPosition,
      nickname: pickFromSources(sources, ["nickname"]),
      applyingLocation: pickFromSources(sources, [
        "applyingLocation",
        "applying_location",
        "applicationLocation",
        "locationApplyingFor",
        "site",
        "location",
      ]),
      referredBy:
        pickFromSources(sources, [
          "referredBy",
          "referred_by",
          "whoReferredYou",
          "referrer",
          "createdBy",
        ]) || "Talent Pool",
      employeeId: pickFromSources(sources, [
        "employeeId",
        "referrerEmployeeId",
        "referrer_employee_id",
      ]),

      firstName,
      lastName,
      middleName,
      suffix: pickFromSources(sources, ["suffix", "extension"]),
      dateOfBirth: pickFromSources(sources, [
        "dateOfBirth",
        "date_of_birth",
      ]),
      age: pickFromSources(sources, [
        "ageAsOfApplication",
        "age_as_of_application",
        "age",
      ]),
      email: pickFromSources(sources, ["email", "candidateEmail"]),
      phone1: pickFromSources(sources, [
        "phone1",
        "phoneNumber1",
        "contactNumber",
        "contact_number",
        "phone",
      ]),
      phone2: pickFromSources(sources, ["phone2", "phoneNumber2"]),
      physicalAddress: pickFromSources(sources, [
        "physicalAddress",
        "physical_address",
        "address",
      ]),

      workExperience: pickFromSources(sources, [
        "workExperience",
        "work_experience",
        "hasWorkExperience",
      ]),
      workExperiences: buildWorkExperiences(sources),

      educationalAttainment: pickFromSources(sources, [
        "educationalAttainment",
        "highestEducationalAttainment",
        "highest_educational_attainment",
      ]),
      affiliations: displayArray(
        pickFromSources(sources, [
          "affiliations",
          "certifications",
          "affiliationsAndCertifications",
          "affiliations_certifications_json",
        ]),
      ),
      trainingAttended: pickFromSources(sources, [
        "trainingAttended",
        "training_attended",
      ]),

      fullyVaccinated: pickFromSources(sources, [
        "fullyVaccinated",
        "fully_vaccinated",
      ]),
      comfortableOnSite: pickFromSources(sources, [
        "comfortableOnSite",
        "comfortable_on_site",
      ]),
      willingGraveyard: pickFromSources(sources, [
        "willingGraveyard",
        "willing_graveyard",
      ]),
      employmentInterest: pickFromSources(sources, [
        "employmentInterest",
        "employment_interest",
      ]),
      remoteWorkAccess: pickFromSources(sources, [
        "remoteWorkAccess",
        "remote_work_access",
      ]),
      willingDrugTest: pickFromSources(sources, [
        "willingDrugTest",
        "willing_drug_test",
      ]),
      willingBackgroundCheck: pickFromSources(sources, [
        "willingBackgroundCheck",
        "willing_background_check",
      ]),

      references: buildReferences(sources),

      audioFileName: pickFromSources(sources, [
        "audioFileName",
        "audio_file_name",
        "audioUploadName",
      ]),
      attachmentFileName: pickFromSources(sources, [
        "attachmentFileName",
        "attachment_file_name",
        "supportingFileName",
        "resumeFileName",
        "fileUploadName",
      ]),
      consentAccepted: pickFromSources(sources, [
        "consentAccepted",
        "consent_accepted",
        "consent",
        "termsAccepted",
      ]),
    };
  }, [candidate, baseProfile, remoteProfile]);

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

        {isLoadingProfile && (
          <p className="text-xs font-bold text-sibs-tertiary-5">
            Loading full Talent Pool profile...
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ProfileDetailCard title="Application Source">
          <DetailRow label="How Heard About Us" value={data.heardFrom} />
          <DetailRow label="Open Position" value={data.openPosition} />
          <DetailRow label="Nickname" value={data.nickname} />
          <DetailRow label="Applying Location" value={data.applyingLocation} />
          <DetailRow label="Referred By" value={data.referredBy} />
          <DetailRow label="Employee ID" value={data.employeeId} />
        </ProfileDetailCard>

        <ProfileDetailCard title="Personal Information">
          <DetailRow label="First Name" value={data.firstName} />
          <DetailRow label="Last Name" value={data.lastName} />
          <DetailRow label="Middle Name" value={data.middleName} />
          <DetailRow label="Suffix" value={data.suffix} />
          <DetailRow label="Date of Birth" value={formatDateValue(data.dateOfBirth)} />
          <DetailRow label="Age" value={data.age} />
          <DetailRow label="Email" value={data.email} />
          <DetailRow label="Phone 1" value={data.phone1} />
          <DetailRow label="Phone 2" value={data.phone2} />
          <DetailRow label="Physical Address" value={data.physicalAddress} />
        </ProfileDetailCard>

        <ProfileDetailCard title="Work Experience">
          <DetailRow label="Work Experience" value={data.workExperience} />

          {data.workExperiences.length > 0 ? (
            <div className="space-y-3 pt-2">
              {data.workExperiences.map((experience, index) => (
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
                      experience.industryRelevantExperience ||
                      experience.relevantExperience ||
                      experience.industryExperience
                    }
                  />
                  <DetailRow
                    label="Length"
                    value={
                      experience.lengthOfWorkExperience ||
                      experience.length_of_work_experience ||
                      experience.length ||
                      experience.experienceLength
                    }
                  />
                  <DetailRow label="Years" value={experience.years} />
                  <DetailRow label="Role" value={experience.role} />
                  <DetailRow label="Company" value={experience.company} />
                  <DetailRow
                    label="Monthly Compensation"
                    value={formatMoneyValue(
                      experience.monthlyCompensation ||
                        experience.monthly_compensation,
                    )}
                  />
                  <DetailRow
                    label="Reason for Leaving"
                    value={
                      experience.reasonForLeaving ||
                      experience.reason_for_leaving
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <DetailRow label="Detailed Experience" value="—" />
          )}
        </ProfileDetailCard>

        <ProfileDetailCard title="Education and Certifications">
          <DetailRow
            label="Highest Educational Attainment"
            value={data.educationalAttainment}
          />
          <DetailRow
            label="Affiliations / Certifications"
            value={data.affiliations}
          />
          <DetailRow label="Training Attended" value={data.trainingAttended} />
        </ProfileDetailCard>

        <ProfileDetailCard title="Work Readiness">
          <DetailRow label="Fully Vaccinated" value={data.fullyVaccinated} />
          <DetailRow label="Comfortable On Site" value={data.comfortableOnSite} />
          <DetailRow label="Willing Graveyard" value={data.willingGraveyard} />
          <DetailRow label="Employment Interest" value={data.employmentInterest} />
          <DetailRow label="Remote Work Access" value={data.remoteWorkAccess} />
          <DetailRow label="Willing Drug Test" value={data.willingDrugTest} />
          <DetailRow
            label="Background Check Consent"
            value={data.willingBackgroundCheck}
          />
        </ProfileDetailCard>

        <ProfileDetailCard title="References and Uploads">
          {data.references.length > 0 ? (
            data.references.map((reference, index) => (
              <DetailRow
                key={`reference-${index}`}
                label={`Reference ${index + 1}`}
                value={`${reference.name || "—"}${
                  reference.phone ? ` / ${reference.phone}` : ""
                }`}
              />
            ))
          ) : (
            <DetailRow label="References" value="—" />
          )}

          <DetailRow label="Audio File" value={data.audioFileName} />
          <DetailRow label="Attachment" value={data.attachmentFileName} />
          <DetailRow
            label="Terms Accepted"
            value={
              data.consentAccepted === true ||
              data.consentAccepted === 1 ||
              data.consentAccepted === "1" ||
              data.consentAccepted === "true"
                ? "Yes"
                : "—"
            }
          />
        </ProfileDetailCard>
      </div>
    </div>
  );
};

export default CandidateTalentPoolDetailsPanel;