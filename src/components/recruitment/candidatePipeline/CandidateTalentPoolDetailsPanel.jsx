import React, { useEffect, useMemo, useState } from "react";

import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Contact,
  FileText,
  Globe2,
  GraduationCap,
  HeartHandshake,
  Languages,
  Mail,
  MapPin,
  Paperclip,
  Phone,
  School,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Volume2,
} from "lucide-react";



import api from "../../../lib/axios/api-template";

import {

  asDisplayValue,

  findTalentPoolProfile,

  getRoleTitle,

} from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";

import { getCurrentAge } from "../../../lib/utils/talentPool/talentPoolTabs";



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



  /*

   * The Talent Pool details endpoint accepts talent_pool_applications.id only.

   * Never fall back to candidate_pipeline.id or another application-ID

   * namespace here. Numeric IDs can collide and show another applicant's

   * submitted profile inside the open Candidate Pipeline record.

   */

  return (

    candidate?.sourceTalentPoolId ||

    candidate?.source_talent_pool_id ||

    metadata?.sourceTalentPoolId ||

    metadata?.source_talent_pool_id ||

    metadata?.talentPoolApplicationId ||

    ""

  );

}



function isSameTalentPoolApplicant(profile = {}, candidate = {}) {

  const profileCandidateId = cleanText(

    profile?.candidateId || profile?.candidate_id,

  ).toLowerCase();

  const candidateId = cleanText(

    candidate?.candidateId || candidate?.candidate_id,

  ).toLowerCase();



  if (profileCandidateId && candidateId) {

    return profileCandidateId === candidateId;

  }



  const profileEmail = cleanText(

    profile?.email || profile?.candidateEmail || profile?.candidate_email,

  ).toLowerCase();

  const candidateEmail = cleanText(

    candidate?.email || candidate?.candidateEmail || candidate?.candidate_email,

  ).toLowerCase();



  if (profileEmail && candidateEmail) {

    return profileEmail === candidateEmail;

  }



  /* No comparable identity is available, so do not reject a valid response. */

  return true;

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

    month: "long",

    day: "numeric",

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




function getSubmittedDisplayValue(value) {
  if (value === true || value === 1 || value === "1") return "Yes";
  if (value === false || value === 0 || value === "0") return "No";
  const text = cleanText(value);
  return !text || text === "—" || text === "-" ? "N/A" : text;
}

function getSubmittedCandidateName(data = {}) {
  return [data.firstName, data.middleName, data.lastName, data.suffix].map(cleanText).filter(Boolean).join(" ") || "Candidate";
}

function getSubmittedInitials(data = {}) {
  return `${cleanText(data.firstName).charAt(0)}${cleanText(data.lastName).charAt(0)}`.trim().toUpperCase() || "C";
}

function SubmittedDetailField({ label, value, icon: Icon, className = "" }) {
  const displayValue = getSubmittedDisplayValue(value);
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-sibs-border bg-sibs-surface text-sibs-navy shadow-[0_2px_6px_rgba(4,44,81,0.04)]">
            <Icon size={16} />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.02em] text-sibs-muted 2xl:text-[9.5px]">{label}</p>
          <p title={displayValue} className="mt-1 break-words text-[11px] font-extrabold leading-5 text-sibs-navy 2xl:text-xs">{displayValue}</p>
        </div>
      </div>
    </div>
  );
}

function SubmittedDetailsSection({ title, children }) {
  return (
    <section className="pt-1">
      <div className="mb-3 border-b border-sibs-border pb-2.5">
        <h4 className="text-[10px] font-extrabold uppercase tracking-[0.02em] text-sibs-navy 2xl:text-[10.5px]">{title}</h4>
      </div>
      {children}
    </section>
  );
}

function SubmittedFileLink({ href = "", icon: Icon, label, fileName }) {
  const name = getSubmittedDisplayValue(fileName);
  const content = (
    <>
      <Icon size={15} className={`shrink-0 ${href ? "text-sibs-orange" : "text-sibs-muted"}`} />
      <div className="min-w-0">
        <p className="text-[9px] font-extrabold uppercase text-sibs-muted">{label}</p>
        <p className={`mt-0.5 truncate text-[11px] font-extrabold ${href ? "text-sibs-navy" : "text-sibs-muted"}`}>{name}</p>
      </div>
    </>
  );
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 rounded-[10px] border border-sibs-border bg-white px-3 py-2.5 transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light">{content}</a>
  ) : (
    <div className="flex min-w-0 items-center gap-2 rounded-[10px] border border-sibs-border bg-sibs-surface px-3 py-2.5">{content}</div>
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



        const loadedProfile =

          response?.data?.data || response?.data?.application || {};



        if (!isSameTalentPoolApplicant(loadedProfile, candidate)) {

          console.warn(

            "Ignoring Talent Pool profile because it belongs to a different candidate.",

            {

              requestedTalentPoolId: talentPoolId,

              candidateId:

                candidate?.candidateId || candidate?.candidate_id || "",

            },

          );

          setRemoteProfile({});

          return;

        }



        setRemoteProfile(loadedProfile);

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

  }, [candidate]);



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

      age:

        (dateOfBirth && getCurrentAge(dateOfBirth) !== null

          ? String(getCurrentAge(dateOfBirth))

          : null) ||

        pickFromSources(sources, [

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



  const candidateName = getSubmittedCandidateName(data);
  const candidateInitials = getSubmittedInitials(data);
  const sourceLabel = cleanText(data.referredBy) || cleanText(data.heardFrom) || "Talent Pool";
  const statusLabel = cleanText(data.stage) || "Submitted";
  const workExperiences = Array.isArray(data.workExperiences) ? data.workExperiences : [];
  const references = Array.isArray(data.references) ? data.references : [];

  return (
    <section className="relative overflow-hidden rounded-[10px] border border-sibs-border bg-white p-4 shadow-[0_10px_28px_rgba(4,44,81,0.05)] sm:p-5 2xl:p-6">
      <div className="mb-4 flex items-start gap-2.5 border-b border-sibs-border pb-3.5">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-sibs-border bg-sibs-surface text-sibs-navy"><Sparkles size={15} /></span>
        <div className="min-w-0 flex-1">
          <h3 className="sibs-text-sm font-extrabold text-sibs-navy">Talent Pool Submitted Details</h3>
          <p className="mt-0.5 sibs-text-xs font-semibold leading-5 text-sibs-muted">Complete submitted profile from the Talent Pool / Public Form.</p>
          {isLoadingProfile ? <p className="mt-1 text-[10px] font-bold text-sibs-muted">Loading full Talent Pool profile...</p> : null}
        </div>
      </div>

      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[10px] border border-sibs-border bg-white shadow-[0_4px_12px_rgba(4,44,81,0.06)]">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-sibs-navy via-sibs-navy to-sibs-orange" />
          <div className="flex flex-col gap-4 px-5 pb-4 pt-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] bg-sibs-navy text-sm font-extrabold text-white shadow-sm">
                {candidateInitials}<span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="break-words text-sm font-extrabold uppercase text-sibs-navy 2xl:text-base">{candidateName}</h4>
                  <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[9px] font-extrabold uppercase text-emerald-700">{statusLabel}</span>
                  <span className="max-w-full truncate rounded-full bg-sibs-surface px-2.5 py-0.5 text-[9px] font-extrabold text-sibs-navy">{getSubmittedDisplayValue(data.candidateId)}</span>
                  {cleanText(data.nickname) ? <span className="rounded-full bg-sibs-surface px-2.5 py-0.5 text-[9px] font-extrabold uppercase text-sibs-muted">&quot;{cleanText(data.nickname)}&quot;</span> : null}
                </div>
                <p className="mt-1 text-xs font-extrabold uppercase text-sibs-orange">{getSubmittedDisplayValue(data.openPosition)}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-semibold text-sibs-muted 2xl:text-[10.5px]">
                  <span className="inline-flex min-w-0 items-center gap-1.5"><Mail size={12} className="shrink-0 text-sibs-muted" /><span className="max-w-[260px] truncate">{getSubmittedDisplayValue(data.email)}</span></span>
                  <span className="inline-flex items-center gap-1.5"><CalendarDays size={12} className="shrink-0 text-sibs-muted" />Applied: {getSubmittedDisplayValue(data.submissionDate)}</span>
                  <span className="inline-flex items-center gap-1.5"><BriefcaseBusiness size={12} className="shrink-0 text-sibs-muted" />Fit: {getSubmittedDisplayValue(data.openPosition)}</span>
                  <span className="inline-flex items-center gap-1.5"><MapPin size={12} className="shrink-0 text-sibs-muted" />{getSubmittedDisplayValue(data.applyingLocation)}</span>
                </div>
              </div>
            </div>
            <span className="w-fit shrink-0 rounded-full border border-sibs-orange/30 bg-sibs-cream-light px-3 py-1 text-[9px] font-extrabold uppercase text-sibs-orange">Source: {getSubmittedDisplayValue(sourceLabel)}</span>
          </div>
        </section>

        <SubmittedDetailsSection title="Personal & Contact Information">
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
            <SubmittedDetailField label="First Name" value={data.firstName} icon={User} /><SubmittedDetailField label="Middle Name" value={data.middleName} icon={User} /><SubmittedDetailField label="Last Name" value={data.lastName} icon={User} /><SubmittedDetailField label="Suffix" value={data.suffix} icon={BadgeCheck} />
            <SubmittedDetailField label="Nickname" value={data.nickname} icon={User} /><SubmittedDetailField label="Date of Birth" value={data.dateOfBirthFormatted} icon={CalendarDays} /><SubmittedDetailField label="Age" value={data.age} icon={BadgeCheck} /><SubmittedDetailField label="Gender / Sex" value={data.gender} icon={Users} />
            <SubmittedDetailField label="Civil Status" value={data.civilStatus} icon={HeartHandshake} /><SubmittedDetailField label="Nationality" value={data.nationality} icon={Globe2} /><SubmittedDetailField label="Religion" value={data.religion} icon={ShieldCheck} /><SubmittedDetailField label="Email Address" value={data.email} icon={Mail} />
            <SubmittedDetailField label="Primary Phone" value={data.phone1} icon={Phone} /><SubmittedDetailField label="Secondary Phone" value={data.phone2} icon={Phone} /><SubmittedDetailField label="Landline" value={data.landline} icon={Phone} />
            <SubmittedDetailField label="Present / Physical Address" value={data.physicalAddress} icon={MapPin} className="xl:col-span-2" /><SubmittedDetailField label="Permanent Address" value={data.permanentAddress} icon={MapPin} className="xl:col-span-2" />
          </div>
        </SubmittedDetailsSection>

        <SubmittedDetailsSection title="Application Source & Work Readiness">
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
            <SubmittedDetailField label="How Heard About Us" value={data.heardFrom} icon={Sparkles} /><SubmittedDetailField label="Referred By" value={data.referredBy} icon={Contact} /><SubmittedDetailField label="Candidate ID" value={data.candidateId} icon={BadgeCheck} /><SubmittedDetailField label="Open Position" value={data.openPosition} icon={BriefcaseBusiness} />
            <SubmittedDetailField label="Applying Location" value={data.applyingLocation} icon={MapPin} /><SubmittedDetailField label="Employment Interest" value={data.employmentInterest} icon={BriefcaseBusiness} /><SubmittedDetailField label="Fully Vaccinated" value={data.fullyVaccinated} icon={ShieldCheck} /><SubmittedDetailField label="Comfortable On-site" value={data.comfortableOnSite} icon={BadgeCheck} />
            <SubmittedDetailField label="Willing Graveyard" value={data.willingGraveyard} icon={CalendarDays} /><SubmittedDetailField label="Remote Work Access" value={data.remoteWorkAccess} icon={Globe2} /><SubmittedDetailField label="Willing Drug Test" value={data.willingDrugTest} icon={ShieldCheck} /><SubmittedDetailField label="Willing Background Check" value={data.willingBackgroundCheck} icon={ShieldCheck} />
          </div>
        </SubmittedDetailsSection>

        <SubmittedDetailsSection title="Educational Background">
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
            <SubmittedDetailField label="Educational Attainment" value={data.educationalAttainment} icon={GraduationCap} /><SubmittedDetailField label="School / University" value={data.schoolName} icon={School} /><SubmittedDetailField label="Course / Degree" value={data.courseDegree} icon={GraduationCap} /><SubmittedDetailField label="Year Graduated" value={data.yearGraduated} icon={CalendarDays} />
            <SubmittedDetailField label="Academic Honors / Awards" value={data.academicHonors} icon={BadgeCheck} className="sm:col-span-2 xl:col-span-4" />
          </div>
        </SubmittedDetailsSection>

        <SubmittedDetailsSection title="Work Experience & Employment History">
          {workExperiences.length ? <div className="space-y-4">{workExperiences.map((experience, index) => (
            <div key={`${experience.company || experience.role || "experience"}-${index}`} className="rounded-[10px] border border-sibs-border bg-sibs-surface p-4">
              <p className="mb-3 text-[9px] font-extrabold uppercase text-sibs-orange">Experience {index + 1}</p>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
                <SubmittedDetailField label="Industry" value={experience.industry} icon={BriefcaseBusiness} /><SubmittedDetailField label="Length of Experience" value={experience.lengthOfWorkExperience || experience.years} icon={CalendarDays} /><SubmittedDetailField label="Role / Position" value={experience.role} icon={BriefcaseBusiness} /><SubmittedDetailField label="Company" value={experience.company} icon={School} /><SubmittedDetailField label="Monthly Compensation" value={experience.monthlyCompensationFormatted || experience.monthlyCompensation} icon={BadgeCheck} /><SubmittedDetailField label="Reason for Leaving" value={experience.reasonForLeaving} icon={FileText} className="xl:col-span-3" />
              </div>
            </div>
          ))}</div> : <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-4"><SubmittedDetailField label="Has Work Experience" value={data.workExperience} icon={BriefcaseBusiness} /><SubmittedDetailField label="Experience Length" value={data.experienceLength} icon={CalendarDays} /></div>}
        </SubmittedDetailsSection>

        <SubmittedDetailsSection title="Skills, Languages & Certifications">
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
            <SubmittedDetailField label="Skills" value={data.skills} icon={BadgeCheck} className="xl:col-span-2" /><SubmittedDetailField label="Languages" value={data.languages} icon={Languages} className="xl:col-span-2" /><SubmittedDetailField label="Affiliations / Certifications" value={data.affiliations} icon={BadgeCheck} className="xl:col-span-2" /><SubmittedDetailField label="Training / Seminars Attended" value={data.trainingAttended} icon={FileText} className="xl:col-span-2" />
          </div>
        </SubmittedDetailsSection>

        <SubmittedDetailsSection title="Family & Emergency Contact">
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
            <SubmittedDetailField label="Father Name" value={data.fatherName} icon={User} /><SubmittedDetailField label="Mother Name" value={data.motherName} icon={User} /><SubmittedDetailField label="Spouse Name" value={data.spouseName} icon={HeartHandshake} /><SubmittedDetailField label="Emergency Contact" value={data.emergencyContactName} icon={Contact} /><SubmittedDetailField label="Emergency Relationship" value={data.emergencyContactRelationship} icon={Users} /><SubmittedDetailField label="Emergency Phone" value={data.emergencyContactPhone} icon={Phone} />
          </div>
        </SubmittedDetailsSection>

        <SubmittedDetailsSection title="References & Submitted Files">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0,1,2].map((index) => { const reference = references[index] || {}; const value = [reference.name, reference.relationship, reference.company, reference.phone].map(cleanText).filter(Boolean).join(" · "); return <SubmittedDetailField key={`reference-${index + 1}`} label={`Reference ${index + 1}`} value={value} icon={Contact} />; })}
              <SubmittedDetailField label="Consent Accepted" value={data.consentAccepted} icon={ShieldCheck} />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1"><SubmittedFileLink href={data.audioUrl} icon={Volume2} label="Audio Sample" fileName={data.audioFileName} /><SubmittedFileLink href={data.attachmentUrl} icon={Paperclip} label="Attachment / Resume" fileName={data.attachmentFileName} /></div>
          </div>
        </SubmittedDetailsSection>

        <div className="flex items-center gap-2 rounded-[10px] border border-sibs-border bg-sibs-surface px-3 py-2.5 text-[10px] font-semibold leading-5 text-sibs-muted"><FileText size={14} className="shrink-0 text-sibs-navy" />This section is read-only and reflects the profile submitted through Talent Pool / Public Form.</div>
      </div>
    </section>
  );
};



export default CandidateTalentPoolDetailsPanel;