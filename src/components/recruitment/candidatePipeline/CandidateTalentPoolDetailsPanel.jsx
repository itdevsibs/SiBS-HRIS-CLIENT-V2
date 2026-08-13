import React, { useEffect, useMemo, useState } from "react";

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


function CompactField({ label, value, className = "" }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
        {label}
      </p>
      <p className="mt-0.5 break-words text-xs font-extrabold leading-5 text-[#344054]">
        {isEmptyValue(value) ? "—" : String(value)}
      </p>
    </div>
  );
}

function CompactDetailGroup({ title, items = [], children = null }) {
  return (
    <section className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <h4 className="text-[10px] font-extrabold uppercase tracking-wide text-[#042C51]">
        {title}
      </h4>
      {items.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {items.map(([label, value]) => (
            <CompactField key={label} label={label} value={value} />
          ))}
        </div>
      )}
      {children}
    </section>
  );
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
    <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-[0_8px_22px_rgba(4,44,81,0.04)] sm:p-5">
      <div className="mb-4 border-b border-[#EEF2F6] pb-3">
        <h3 className="sibs-text-sm font-extrabold text-sibs-primary-1">
          Talent Pool Submitted Details
        </h3>
        <p className="mt-1 sibs-text-xs font-semibold leading-5 text-[#667085]">
          Complete submitted profile from the Talent Pool / Public Form.
        </p>
        {isLoadingProfile && (
          <p className="mt-2 text-[10px] font-bold text-[#667085]">
            Loading full Talent Pool profile...
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CompactDetailGroup
          title="Application Source"
          items={[
            ["How Heard About Us", data.heardFrom],
            ["Open Position", data.openPosition],
            ["Nickname", data.nickname],
            ["Applying Location", data.applyingLocation],
            ["Referred By", data.referredBy],
            ["Employee ID", data.employeeId],
          ]}
        />

        <CompactDetailGroup
          title="Personal Information"
          items={[
            ["First Name", data.firstName],
            ["Last Name", data.lastName],
            ["Middle Name", data.middleName],
            ["Suffix", data.suffix],
            ["Date of Birth", formatDateValue(data.dateOfBirth)],
            ["Age", data.age],
            ["Email", data.email],
            ["Phone 1", data.phone1],
            ["Phone 2", data.phone2],
            ["Physical Address", data.physicalAddress],
          ]}
        />

        <CompactDetailGroup title="Work Experience">
          <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            <CompactField label="Work Experience" value={data.workExperience} />
          </div>

          {data.workExperiences.length > 0 ? (
            <div className="mt-4 space-y-3">
              {data.workExperiences.map((experience, index) => (
                <div
                  key={`experience-${index}`}
                  className="rounded-xl border border-[#E6ECF2] bg-white p-3"
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#042C51]">
                    Experience {index + 1}
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                    <CompactField
                      label="Industry"
                      value={
                        experience.industry ||
                        experience.industryRelevantExperience ||
                        experience.relevantExperience ||
                        experience.industryExperience
                      }
                    />
                    <CompactField
                      label="Length"
                      value={
                        experience.lengthOfWorkExperience ||
                        experience.length_of_work_experience ||
                        experience.length ||
                        experience.experienceLength
                      }
                    />
                    <CompactField label="Years" value={experience.years} />
                    <CompactField label="Role" value={experience.role} />
                    <CompactField label="Company" value={experience.company} />
                    <CompactField
                      label="Monthly Compensation"
                      value={formatMoneyValue(
                        experience.monthlyCompensation ||
                          experience.monthly_compensation,
                      )}
                    />
                    <CompactField
                      label="Reason for Leaving"
                      value={
                        experience.reasonForLeaving ||
                        experience.reason_for_leaving
                      }
                      className="sm:col-span-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-[#D7DEE8] bg-white px-3 py-3 text-xs font-semibold text-[#667085]">
              No detailed work experience was submitted.
            </div>
          )}
        </CompactDetailGroup>

        <CompactDetailGroup
          title="Education and Certifications"
          items={[
            ["Highest Educational Attainment", data.educationalAttainment],
            ["Affiliations / Certifications", data.affiliations],
            ["Training Attended", data.trainingAttended],
          ]}
        />

        <CompactDetailGroup
          title="Work Readiness"
          items={[
            ["Fully Vaccinated", data.fullyVaccinated],
            ["Comfortable On Site", data.comfortableOnSite],
            ["Willing Graveyard", data.willingGraveyard],
            ["Employment Interest", data.employmentInterest],
            ["Remote Work Access", data.remoteWorkAccess],
            ["Willing Drug Test", data.willingDrugTest],
            ["Background Check Consent", data.willingBackgroundCheck],
          ]}
        />

        <CompactDetailGroup
          title="References and Uploads"
          items={[
            ...(data.references.length > 0
              ? data.references.map((reference, index) => [
                  `Reference ${index + 1}`,
                  `${reference.name || "—"}${
                    reference.phone ? ` / ${reference.phone}` : ""
                  }`,
                ])
              : [["References", "—"]]),
            ["Audio File", data.audioFileName],
            ["Attachment", data.attachmentFileName],
            [
              "Terms Accepted",
              data.consentAccepted === true ||
              data.consentAccepted === 1 ||
              data.consentAccepted === "1" ||
              data.consentAccepted === "true"
                ? "Yes"
                : "—",
            ],
          ]}
        />
      </div>
    </section>
  );
};

export default CandidateTalentPoolDetailsPanel;