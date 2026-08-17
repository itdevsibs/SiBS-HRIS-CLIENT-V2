import React, { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import api from "../../../lib/axios/api-template";
import {
  asDisplayValue,
  findTalentPoolProfile,
  getRoleTitle,
} from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";

import CandidateProfileHero from "./profile/CandidateProfileHero";
import CandidateProfilePersonalInfo from "./profile/CandidateProfilePersonalInfo";
import CandidateProfileWorkReadiness from "./profile/CandidateProfileWorkReadiness";
import CandidateProfileEducation from "./profile/CandidateProfileEducation";
import CandidateProfileExperience from "./profile/CandidateProfileExperience";
import CandidateProfileSkills from "./profile/CandidateProfileSkills";
import CandidateProfileFamily from "./profile/CandidateProfileFamily";
import CandidateProfileAttachments from "./profile/CandidateProfileAttachments";

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
      "experiences",
    ]) || [];

  if (workExperiences.length > 0) {
    return workExperiences.map((exp) => ({
      ...exp,
      monthlyCompensationFormatted: formatMoneyValue(
        exp.monthlyCompensation || exp.monthly_compensation || exp.compensation,
      ),
    }));
  }

  const otherExperiences = pickArrayFromSources(sources, [
    "otherExperiences",
    "other_experiences_json",
    "otherExperiencesJson",
  ]);

  if (otherExperiences.length > 0) {
    return otherExperiences.map((exp) => ({
      ...exp,
      monthlyCompensationFormatted: formatMoneyValue(
        exp.monthlyCompensation || exp.monthly_compensation || exp.compensation,
      ),
    }));
  }

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
        "experienceYears",
        "experience_years",
        "experienceLength",
        "experience_length",
      ]) || "",
    years:
      pickFromSources(sources, [
        "experienceYears",
        "experience_years",
        "years",
      ]) || "",
    role:
      pickFromSources(sources, [
        "experienceRole",
        "experience_role",
        "previousRole",
        "previous_role",
        "lastPosition",
        "last_position",
      ]) || "",
    company:
      pickFromSources(sources, [
        "experienceCompany",
        "experience_company",
        "previousCompany",
        "previous_company",
        "lastEmployer",
        "last_employer",
      ]) || "",
    monthlyCompensation:
      pickFromSources(sources, [
        "monthlyCompensation",
        "monthly_compensation",
        "lastSalary",
        "last_salary",
        "expectedSalary",
      ]) || "",
    monthlyCompensationFormatted: formatMoneyValue(
      pickFromSources(sources, [
        "monthlyCompensation",
        "monthly_compensation",
        "lastSalary",
        "last_salary",
        "expectedSalary",
      ]),
    ),
    reasonForLeaving:
      pickFromSources(sources, [
        "reasonForLeaving",
        "reason_for_leaving",
      ]) || "",
  };

  const hasExpValue = Object.values(primaryExperience).some(
    (value) => !isEmptyValue(value),
  );

  return hasExpValue ? [primaryExperience] : [];
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
      relationship: pickFromSources(sources, [
        "reference1Relationship",
        "referenceRelationship1",
      ]),
      company: pickFromSources(sources, [
        "reference1Company",
        "referenceCompany1",
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
      relationship: pickFromSources(sources, [
        "reference2Relationship",
        "referenceRelationship2",
      ]),
      company: pickFromSources(sources, [
        "reference2Company",
        "referenceCompany2",
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
      relationship: pickFromSources(sources, [
        "reference3Relationship",
        "referenceRelationship3",
      ]),
      company: pickFromSources(sources, [
        "reference3Company",
        "referenceCompany3",
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
      pickFromSources(sources, ["firstName", "first_name", "candidateFirstName"]) ||
      splitName.firstName;

    const lastName =
      pickFromSources(sources, ["lastName", "last_name", "candidateLastName"]) ||
      splitName.lastName;

    const middleName =
      pickFromSources(sources, ["middleName", "middle_name", "candidateMiddleName"]) ||
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

    const dateOfBirth = pickFromSources(sources, [
      "dateOfBirth",
      "date_of_birth",
      "birthDate",
      "birth_date",
    ]);

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
      candidateId:
        pickFromSources(sources, [
          "candidateId",
          "candidate_id",
          "candidateApplicationId",
          "applicationId",
        ]) || candidate?.candidateId || candidate?.id || "",
      stage:
        pickFromSources(sources, [
          "currentStage",
          "currentPipelineStage",
          "stage",
          "pipelineStage",
        ]) || candidate?.stage || candidate?.currentStage || "",
      submissionDate: formatDateValue(
        pickFromSources(sources, [
          "createdAt",
          "created_at",
          "applicationDate",
          "dateApplied",
        ]),
      ),

      firstName,
      lastName,
      middleName,
      suffix: pickFromSources(sources, ["suffix", "extension"]),
      dateOfBirth,
      dateOfBirthFormatted: formatDateValue(dateOfBirth),
      age: pickFromSources(sources, [
        "ageAsOfApplication",
        "age_as_of_application",
        "age",
      ]),
      gender: pickFromSources(sources, ["gender", "sex"]),
      civilStatus: pickFromSources(sources, ["civilStatus", "civil_status", "maritalStatus"]),
      nationality: pickFromSources(sources, ["nationality", "citizenship"]) || "Filipino",
      religion: pickFromSources(sources, ["religion"]),

      email: pickFromSources(sources, ["email", "candidateEmail"]),
      phone1: pickFromSources(sources, [
        "phone1",
        "phoneNumber1",
        "contactNumber",
        "contact_number",
        "phone",
      ]),
      phone2: pickFromSources(sources, ["phone2", "phoneNumber2"]),
      landline: pickFromSources(sources, ["landline", "telephone", "landlineNumber"]),
      physicalAddress: pickFromSources(sources, [
        "physicalAddress",
        "physical_address",
        "address",
        "presentAddress",
      ]),
      permanentAddress: pickFromSources(sources, [
        "permanentAddress",
        "permanent_address",
      ]),

      workExperience: pickFromSources(sources, [
        "workExperience",
        "work_experience",
        "hasWorkExperience",
      ]),
      experienceLength: pickFromSources(sources, [
        "experienceYears",
        "experience_years",
        "lengthOfWorkExperience",
        "length_of_work_experience",
        "experienceLength",
        "experience_length",
      ]),
      workExperiences: buildWorkExperiences(sources),

      educationalAttainment: pickFromSources(sources, [
        "educationalAttainment",
        "highestEducationalAttainment",
        "highest_educational_attainment",
        "education",
      ]),
      schoolName: pickFromSources(sources, [
        "schoolName",
        "school_name",
        "institution",
        "school",
        "college",
        "university",
      ]),
      courseDegree: pickFromSources(sources, [
        "courseDegree",
        "course_degree",
        "degree",
        "course",
        "program",
        "fieldOfStudy",
      ]),
      yearGraduated: pickFromSources(sources, [
        "yearGraduated",
        "year_graduated",
        "graduationYear",
        "graduation_year",
        "inclusiveYears",
      ]),
      academicHonors: pickFromSources(sources, [
        "academicHonors",
        "academic_honors",
        "honors",
        "awards",
      ]),

      skills: displayArray(
        pickFromSources(sources, [
          "skills",
          "skills_json",
          "skillsJson",
          "technicalSkills",
          "coreCompetencies",
        ]),
      ),
      languages: displayArray(
        pickFromSources(sources, [
          "languages",
          "languages_json",
          "languagesSpoken",
          "skillsLanguage",
          "skills_language",
        ]),
      ),
      affiliations: displayArray(
        pickFromSources(sources, [
          "affiliations",
          "certifications",
          "affiliationsAndCertifications",
          "affiliations_certifications_json",
        ]),
      ),
      trainingAttended: displayArray(
        pickFromSources(sources, [
          "trainingAttended",
          "training_attended",
          "trainings",
          "seminars",
        ]),
      ),

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

      fatherName: pickFromSources(sources, ["fatherName", "father_name", "father"]),
      motherName: pickFromSources(sources, ["motherName", "mother_name", "motherMaidenName"]),
      spouseName: pickFromSources(sources, ["spouseName", "spouse_name", "spouse"]),
      emergencyContactName: pickFromSources(sources, [
        "emergencyContactName",
        "emergency_contact_name",
        "emergencyName",
        "contactPerson",
      ]),
      emergencyContactRelationship: pickFromSources(sources, [
        "emergencyContactRelationship",
        "emergency_contact_relationship",
        "emergencyRelationship",
      ]),
      emergencyContactPhone: pickFromSources(sources, [
        "emergencyContactPhone",
        "emergency_contact_phone",
        "emergencyPhone",
        "emergencyNumber",
      ]),

      references: buildReferences(sources),

      audioFileName: pickFromSources(sources, [
        "audioFileName",
        "audio_file_name",
        "audioUploadName",
      ]),
      audioUrl: pickFromSources(sources, ["audioUrl", "audio_url", "audioFilePath"]),
      attachmentFileName: pickFromSources(sources, [
        "attachmentFileName",
        "attachment_file_name",
        "supportingFileName",
        "resumeFileName",
        "fileUploadName",
      ]),
      attachmentUrl: pickFromSources(sources, [
        "attachmentUrl",
        "attachment_url",
        "resumeUrl",
        "fileUrl",
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

      <div className="space-y-4">
        {/* 1. Profile Hero Summary */}
        <CandidateProfileHero data={data} />

        {/* 2. Personal & Contact Information */}
        <CandidateProfilePersonalInfo data={data} />

        {/* 3. Application Source & Work Readiness Disclosures */}
        <CandidateProfileWorkReadiness data={data} />

        {/* 4. Educational Background */}
        <CandidateProfileEducation data={data} />

        {/* 5. Work Experience & Employment Chronology */}
        <CandidateProfileExperience data={data} />

        {/* 6. Skills, Languages & Certifications */}
        <CandidateProfileSkills data={data} />

        {/* 7. Family Background & Emergency Contacts */}
        <CandidateProfileFamily data={data} />

        {/* 8. References, Audio Sample & Document Attachments */}
        <CandidateProfileAttachments data={data} />
      </div>
    </section>
  );
};

export default CandidateTalentPoolDetailsPanel;