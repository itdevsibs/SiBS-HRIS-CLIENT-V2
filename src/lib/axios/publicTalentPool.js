// src/lib/axios/publicTalentPool.js
import axios from "axios";
import { normalizePhoneNumberForSubmit } from "../utils/talentPool/phoneNumber";
import { serializeTrainingEntries } from "../utils/talentPool/trainingEntries";

/* =========================================
   PUBLIC TALENT POOL API
   - No JWT
   - No cookies
   - No api-template
   - Safe for incognito / public applicants
========================================= */

function getPublicApiBaseURL() {
  const rawBaseURL =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5001";

  return String(rawBaseURL)
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");
}

const publicApi = axios.create({
  baseURL: getPublicApiBaseURL(),
  withCredentials: false,
});

/* =========================================
   HELPERS
========================================= */

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function isFileLike(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.name === "string" &&
    typeof value.size === "number"
  );
}

function appendValue(formData, key, value) {
  if (value === undefined || value === null) return;

  if (isFileLike(value)) {
    formData.append(key, value, value.name || key);
    return;
  }

  formData.append(key, String(value));
}

function appendJson(formData, key, value) {
  formData.append(key, JSON.stringify(normalizeArray(value)));
}

function appendJsonValue(formData, key, value, fallback = {}) {
  const finalValue = value === undefined || value === null ? fallback : value;
  formData.append(key, JSON.stringify(finalValue));
}

function getPrimaryExperience(form = {}) {
  const workExperiences = normalizeArray(form.workExperiences).filter(Boolean);
  const primaryExperience = workExperiences[0] || {};

  return {
    workExperiences,
    primaryExperience,
  };
}

function appendPublicApplicationFormData(formData, form = {}) {
  const { workExperiences, primaryExperience } = getPrimaryExperience(form);

  appendJson(formData, "hearAboutUs", form.hearAboutUs);

  appendValue(formData, "candidateId", form.candidateId);
  appendValue(formData, "positionId", form.positionId);
  appendValue(formData, "openPosition", form.openPosition);
  appendJson(formData, "applicationFormAnswers", form.applicationFormAnswers);
  appendValue(formData, "nickname", form.nickname);
  appendValue(formData, "applyingLocation", form.applyingLocation);
  appendValue(formData, "referralCode", form.referralCode);
  appendValue(formData, "referral_code", form.referralCode);
  appendValue(formData, "referredBy", form.referredBy);
  appendValue(formData, "employeeId", form.employeeId);

  appendValue(formData, "firstName", form.firstName);
  appendValue(formData, "lastName", form.lastName);
  appendValue(formData, "middleName", form.middleName);
  appendValue(formData, "suffix", form.suffix);
  appendValue(formData, "dateOfBirth", form.dateOfBirth);
  appendValue(formData, "email", form.email);
  appendValue(formData, "physicalAddress", form.physicalAddress);

  appendValue(formData, "workExperience", form.workExperience);

  appendValue(
    formData,
    "phone1",
    normalizePhoneNumberForSubmit(form.phone1 || form.phoneNumber1),
  );
  appendValue(
    formData,
    "phone2",
    normalizePhoneNumberForSubmit(form.phone2 || form.phoneNumber2),
  );
  appendValue(
    formData,
    "phoneNumber1",
    normalizePhoneNumberForSubmit(form.phoneNumber1 || form.phone1),
  );
  appendValue(
    formData,
    "phoneNumber2",
    normalizePhoneNumberForSubmit(form.phoneNumber2 || form.phone2),
  );

  appendValue(
    formData,
    "industryRelevantExperience",
    form.industryRelevantExperience ||
      primaryExperience.industryRelevantExperience ||
      primaryExperience.industry,
  );

  appendValue(
    formData,
    "lengthOfWorkExperience",
    form.lengthOfWorkExperience || primaryExperience.lengthOfWorkExperience,
  );

  appendValue(formData, "years", form.years || primaryExperience.years);
  appendValue(formData, "role", form.role || primaryExperience.role);
  appendValue(formData, "company", form.company || primaryExperience.company);

  appendValue(
    formData,
    "monthlyCompensation",
    form.monthlyCompensation || primaryExperience.monthlyCompensation,
  );

  appendValue(
    formData,
    "reasonForLeaving",
    form.reasonForLeaving || primaryExperience.reasonForLeaving,
  );

  appendValue(formData, "hasOtherExperience", form.hasOtherExperience);

  appendJson(formData, "workExperiences", workExperiences);

  appendJson(
    formData,
    "otherExperiences",
    normalizeArray(form.otherExperiences).length
      ? normalizeArray(form.otherExperiences)
      : workExperiences.length > 1
        ? workExperiences.slice(1)
        : [],
  );

  appendValue(
    formData,
    "highestEducationalAttainment",
    form.highestEducationalAttainment || form.educationalAttainment,
  );

  appendValue(
    formData,
    "educationalAttainment",
    form.educationalAttainment || form.highestEducationalAttainment,
  );


  appendJsonValue(formData, "educationDetails", form.educationDetails || {});

  appendJson(
    formData,
    "affiliationsAndCertifications",
    form.affiliationsAndCertifications || form.affiliations,
  );

  appendJson(
    formData,
    "affiliations",
    form.affiliations || form.affiliationsAndCertifications,
  );

  appendValue(
    formData,
    "trainingAttended",
    serializeTrainingEntries(form.trainingAttended),
  );

  appendValue(formData, "fullyVaccinated", form.fullyVaccinated);
  appendValue(formData, "comfortableOnSite", form.comfortableOnSite);
  appendValue(formData, "willingGraveyard", form.willingGraveyard);
  appendValue(formData, "employmentInterest", form.employmentInterest);
  appendValue(formData, "remoteWorkAccess", form.remoteWorkAccess);
  appendValue(formData, "willingDrugTest", form.willingDrugTest);
  appendValue(formData, "willingBackgroundCheck", form.willingBackgroundCheck);

  const references = normalizeArray(form.references).length
    ? normalizeArray(form.references).map((reference) => ({
        ...reference,
        phone: normalizePhoneNumberForSubmit(reference?.phone),
      }))
    : [
        {
          name: form.reference1Name,
          phone: normalizePhoneNumberForSubmit(form.reference1Phone),
        },
        {
          name: form.reference2Name,
          phone: normalizePhoneNumberForSubmit(form.reference2Phone),
        },
        {
          name: form.reference3Name,
          phone: normalizePhoneNumberForSubmit(form.reference3Phone),
        },
      ];

  appendValue(
    formData,
    "reference1Name",
    form.reference1Name || references[0]?.name,
  );
  appendValue(
    formData,
    "reference1Phone",
    normalizePhoneNumberForSubmit(form.reference1Phone || references[0]?.phone),
  );
  appendValue(
    formData,
    "reference2Name",
    form.reference2Name || references[1]?.name,
  );
  appendValue(
    formData,
    "reference2Phone",
    normalizePhoneNumberForSubmit(form.reference2Phone || references[1]?.phone),
  );
  appendValue(
    formData,
    "reference3Name",
    form.reference3Name || references[2]?.name,
  );
  appendValue(
    formData,
    "reference3Phone",
    normalizePhoneNumberForSubmit(form.reference3Phone || references[2]?.phone),
  );

  appendJson(formData, "references", references);

  appendValue(formData, "skillsLanguage", form.skillsLanguage);
  appendValue(formData, "status", form.status);
  appendValue(formData, "availability", form.availability);
  appendValue(formData, "remarks", form.remarks);
  appendValue(formData, "consent", String(Boolean(form.consent)));

  if (form.audioFile) {
    formData.append(
      "audioFile",
      form.audioFile,
      form.audioFile.name || "audio-file",
    );
  }

  if (form.attachmentFile) {
    formData.append(
      "attachmentFile",
      form.attachmentFile,
      form.attachmentFile.name || "attachment-file",
    );
  }
}

function debugPublicTalentPoolFormData(formData) {
  if (!import.meta.env.DEV) return;

  console.group("Public Talent Pool FormData");

  for (const [key, value] of formData.entries()) {
    if (isFileLike(value)) {
      console.log(key, {
        name: value.name,
        type: value.type,
        size: value.size,
      });
    } else {
      console.log(key, value);
    }
  }

  console.groupEnd();
}

/* =========================================
   PUBLIC FORM OPTIONS
========================================= */

export async function getTalentPoolFormOptions() {
  try {
    const res = await publicApi.get("/api/talent-pool/options");

    return res.data;
  } catch (err) {
    console.error(
      "Public getTalentPoolFormOptions API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: {
        hearAboutUs: [],
        locations: [],
        workExperience: [],
        lengthOfExperience: [],
        educationalAttainment: [],
        affiliationCertification: [],
        yesNo: [],
        employmentInterest: [],
        audioQuestions: [],
        statuses: [],
      },
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load talent pool form options.",
    };
  }
}

/* =========================================
   PUBLIC OPEN POSITIONS
========================================= */

export async function getTalentPoolOpenPositions() {
  try {
    const res = await publicApi.get("/api/talent-pool/open-positions");

    return res.data;
  } catch (err) {
    console.error(
      "Public getTalentPoolOpenPositions API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: [],
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load talent pool open positions.",
    };
  }
}

export async function getTalentPoolApplicationForm(positionId) {
  const cleanPositionId = String(positionId || "").trim();

  if (!cleanPositionId) {
    return {
      success: true,
      data: { form: null, questions: [] },
      message: "No position selected.",
    };
  }

  try {
    const res = await publicApi.get(
      `/api/talent-pool/application-form/${encodeURIComponent(positionId)}`,
    );

    return res.data;
  } catch (err) {
    console.error(
      "Public getTalentPoolApplicationForm API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: { form: null, questions: [] },
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load the application form questions.",
    };
  }
}

export async function getTalentPoolReferralPrefill(referralCode) {
  try {
    const cleanReferralCode = String(referralCode || "").trim();

    if (!cleanReferralCode) {
      return {
        success: false,
        data: null,
        message: "Referral code is required.",
      };
    }

    const res = await publicApi.get(
      `/api/talent-pool/referrals/${encodeURIComponent(cleanReferralCode)}`,
    );

    return res.data;
  } catch (err) {
    console.error(
      "Public getTalentPoolReferralPrefill API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: null,
      status: err?.response?.status || null,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load referral information.",
    };
  }
}

/* =========================================
   PUBLIC APPLICATION SUBMIT
========================================= */

export async function submitPublicTalentPoolApplication(form) {
  try {
    const formData = new FormData();

    appendPublicApplicationFormData(formData, form);
    debugPublicTalentPoolFormData(formData);

    const res = await publicApi.post(
      "/api/talent-pool/public-applications",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Public submitPublicTalentPoolApplication API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: null,
      status: err?.response?.status || null,
      code: err?.response?.data?.code || null,
      field: err?.response?.data?.field || null,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to submit talent pool application.",
    };
  }
}

export default publicApi;
