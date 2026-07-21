import api from "./api-template";

/* =========================================
   TALENT POOL API
========================================= */

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

function isFileLike(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.name === "string" &&
    typeof value.size === "number" &&
    typeof value.type === "string"
  );
}

function appendValue(formData, key, value) {
  if (value === undefined || value === null) return;

  if (isFileLike(value)) {
    formData.append(key, value, value.name);
    return;
  }

  formData.append(key, value);
}

function appendJson(formData, key, value) {
  formData.append(key, JSON.stringify(value || []));
}

function getApiBaseURL() {
  const envBase =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    api?.defaults?.baseURL ||
    "";

  return String(envBase).replace(/\/api\/?$/, "").replace(/\/$/, "");
}

function getPrimaryExperience(form = {}) {
  const workExperiences = normalizeArray(form.workExperiences).filter(Boolean);
  const primaryExperience = workExperiences[0] || {};

  return {
    workExperiences,
    primaryExperience,
  };
}

function appendCandidateFormData(formData, form = {}) {
  const { workExperiences, primaryExperience } = getPrimaryExperience(form);

  appendJson(formData, "hearAboutUs", normalizeArray(form.hearAboutUs));

  appendValue(formData, "candidateId", form.candidateId);
  appendValue(formData, "openPosition", form.openPosition);
  appendValue(formData, "nickname", form.nickname);
  appendValue(formData, "applyingLocation", form.applyingLocation);
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

  appendValue(formData, "phone1", form.phone1 || form.phoneNumber1);
  appendValue(formData, "phone2", form.phone2 || form.phoneNumber2);
  appendValue(formData, "phoneNumber1", form.phoneNumber1 || form.phone1);
  appendValue(formData, "phoneNumber2", form.phoneNumber2 || form.phone2);

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

  appendJson(
    formData,
    "educationDetails",
    form.educationDetails || form.education_details || {},
  );

  appendJson(
    formData,
    "affiliationsAndCertifications",
    normalizeArray(form.affiliationsAndCertifications || form.affiliations),
  );

  appendJson(
    formData,
    "affiliations",
    normalizeArray(form.affiliations || form.affiliationsAndCertifications),
  );

  appendValue(formData, "trainingAttended", form.trainingAttended);

  appendValue(formData, "fullyVaccinated", form.fullyVaccinated);
  appendValue(formData, "comfortableOnSite", form.comfortableOnSite);
  appendValue(formData, "willingGraveyard", form.willingGraveyard);
  appendValue(formData, "employmentInterest", form.employmentInterest);
  appendValue(formData, "remoteWorkAccess", form.remoteWorkAccess);
  appendValue(formData, "willingDrugTest", form.willingDrugTest);
  appendValue(formData, "willingBackgroundCheck", form.willingBackgroundCheck);

  const references = normalizeArray(form.references).length
    ? normalizeArray(form.references)
    : [
        {
          name: form.reference1Name,
          phone: form.reference1Phone,
        },
        {
          name: form.reference2Name,
          phone: form.reference2Phone,
        },
        {
          name: form.reference3Name,
          phone: form.reference3Phone,
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
    form.reference1Phone || references[0]?.phone,
  );
  appendValue(
    formData,
    "reference2Name",
    form.reference2Name || references[1]?.name,
  );
  appendValue(
    formData,
    "reference2Phone",
    form.reference2Phone || references[1]?.phone,
  );
  appendValue(
    formData,
    "reference3Name",
    form.reference3Name || references[2]?.name,
  );
  appendValue(
    formData,
    "reference3Phone",
    form.reference3Phone || references[2]?.phone,
  );

  appendJson(formData, "references", references);

  appendValue(formData, "skillsLanguage", form.skillsLanguage);
  appendValue(formData, "status", form.status);
  appendValue(formData, "availability", form.availability);
  appendValue(formData, "remarks", form.remarks);
  appendValue(formData, "consent", String(Boolean(form.consent)));

  if (form.audioFile) {
    formData.append("audioFile", form.audioFile, form.audioFile.name || "audio-file");
  }

  if (form.attachmentFile) {
    formData.append(
      "attachmentFile",
      form.attachmentFile,
      form.attachmentFile.name || "attachment-file",
    );
  }
}

function debugTalentPoolFormData(formData) {
  if (!import.meta.env.DEV) return;

  console.group("Talent Pool FormData");

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
   FORM OPTIONS
========================================= */

export async function getTalentPoolFormOptions() {
  try {
    const res = await api.get("/api/talent-pool/options", {
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios getTalentPoolFormOptions API error:",
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
   OPEN POSITIONS
========================================= */

export async function getTalentPoolOpenPositions() {
  try {
    const res = await api.get("/api/available-position/active", {
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios getTalentPoolOpenPositions API error:",
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

/* =========================================
   APPLICATIONS
========================================= */

export async function getTalentPoolApplications({
  page = 1,
  limit = 500,
  search = "",
  status = "All",
} = {}) {
  try {
    const res = await api.get("/api/talent-pool/applications", {
      params: {
        page,
        limit,
        search,
        status,
        _t: Date.now(),
      },
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios getTalentPoolApplications API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
      counts: {
        total: 0,
      },
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load talent pool applications.",
    };
  }
}

export async function getTalentPoolApplicationById(id) {
  try {
    const res = await api.get(`/api/talent-pool/applications/${id}`, {
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios getTalentPoolApplicationById API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: null,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load talent pool application.",
    };
  }
}

/* =========================================
   PUBLIC APPLICATION
========================================= */

export async function submitPublicTalentPoolApplication(form) {
  try {
    const formData = new FormData();
    appendCandidateFormData(formData, form);
    debugTalentPoolFormData(formData);

    const res = await api.post(
      "/api/talent-pool/public-applications",
      formData,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios submitPublicTalentPoolApplication API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: null,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to submit talent pool application.",
    };
  }
}

/* =========================================
   MANUAL CANDIDATE
========================================= */

export async function createTalentPoolCandidate(form) {
  try {
    const formData = new FormData();
    appendCandidateFormData(formData, form);
    debugTalentPoolFormData(formData);

    const res = await api.post(
      "/api/talent-pool/applications/manual",
      formData,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios createTalentPoolCandidate API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: null,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to save candidate.",
    };
  }
}

export async function updateTalentPoolCandidate(id, form) {
  try {
    const formData = new FormData();
    appendCandidateFormData(formData, form);
    debugTalentPoolFormData(formData);

    const res = await api.put(`/api/talent-pool/applications/${id}`, formData, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios updateTalentPoolCandidate API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: null,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to update candidate.",
    };
  }
}

/* =========================================
   STATUS
========================================= */

export async function updateTalentPoolApplicationStatus(id, payload) {
  try {
    const res = await api.patch(
      `/api/talent-pool/applications/${id}/status`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios updateTalentPoolApplicationStatus API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: null,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to update talent pool application status.",
    };
  }
}

/* =========================================
   CSV IMPORT
========================================= */

export async function importTalentPoolCsvLeads(file) {
  try {
    const formData = new FormData();
    formData.append("file", file, file.name || "talent-pool-leads.csv");
    debugTalentPoolFormData(formData);

    const res = await api.post(
      "/api/talent-pool/applications/import-csv",
      formData,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios importTalentPoolCsvLeads API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: null,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to import CSV leads.",
    };
  }
}

/* =========================================
   MARK AS DROP OFF
========================================= */

export async function markTalentPoolCandidateAsDropOff(id, payload) {
  try {
    const res = await api.patch(
      `/api/talent-pool/applications/${id}/drop-off`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios markTalentPoolCandidateAsDropOff API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: null,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to mark candidate as Drop Off.",
    };
  }
}

/* =========================================
   MOVE TO PIPELINE
========================================= */

export async function moveTalentPoolCandidateToPipeline(id, payload) {
  try {
    const res = await api.post(
      `/api/talent-pool/applications/${id}/move-to-pipeline`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios moveTalentPoolCandidateToPipeline API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: null,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to move candidate to pipeline.",
    };
  }
}

/* =========================================
   FILE URL HELPER
========================================= */

export function getTalentPoolFileUrl(applicationId, type = "attachment") {
  const base = getApiBaseURL();

  return `${base}/api/talent-pool/file/${applicationId}/${type}`;
}

export default {
  getTalentPoolFormOptions,
  getTalentPoolOpenPositions,
  getTalentPoolApplications,
  getTalentPoolApplicationById,
  submitPublicTalentPoolApplication,
  createTalentPoolCandidate,
  updateTalentPoolCandidate,
  updateTalentPoolApplicationStatus,
  importTalentPoolCsvLeads,
  markTalentPoolCandidateAsDropOff,
  moveTalentPoolCandidateToPipeline,
  getTalentPoolFileUrl,
};