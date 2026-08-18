import {
  AVAILABLE_POSITIONS_STORAGE_KEY,
  leadUploadTemplateColumns,
  leadUploadTemplateRows,
} from "./talentPoolConstants";
import { readLocalStorage } from "./talentPoolStorage";

export function inputClass(extra = "") {
  return `h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

export function textareaClass(extra = "") {
  return `w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

export function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export function generateCandidateId(nextNumber) {
  return `CAND-${String(nextNumber).padStart(3, "0")}`;
}

export function generateApplicationId() {
  return `APP-${Date.now()}`;
}

export function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;

  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

export function buildFullName(candidate) {
  return [
    candidate.firstName,
    candidate.middleName,
    candidate.lastName,
    candidate.suffix || candidate.extension,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function titleCaseName(value) {
  return String(value || "")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function toDisplayPersonName(value, fallback = "Current User") {
  const raw = String(value || "").trim();

  if (!raw) return fallback;
  if (raw.includes("@")) return titleCaseName(raw.split("@")[0]);
  if (raw === "TA Manual Entry") return fallback;

  return raw;
}

export function getLoggedInUserName(user) {
  const candidateName =
    user?.name ||
    user?.fullName ||
    user?.employeeName ||
    user?.displayName ||
    user?.gy_emp_fullname ||
    user?.username ||
    user?.email ||
    "Current User";

  return toDisplayPersonName(candidateName, "Current User");
}

export function getEncodedByName(candidate, fallback = "Current User") {
  const rawName =
    candidate?.createdBy || candidate?.addedBy || candidate?.submittedBy || "";

  if (
    candidate?.entryType === "Public Application" &&
    (!rawName || rawName === "Candidate")
  ) {
    return "Candidate";
  }

  if (
    rawName === "Candidate" &&
    candidate?.entryType !== "Public Application"
  ) {
    return fallback;
  }

  return toDisplayPersonName(rawName, fallback);
}

export function normalizeTags(roleCapability, skillsLanguage) {
  const tags = [
    roleCapability,
    ...String(skillsLanguage || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  ];

  return [...new Set(tags.filter(Boolean))];
}

export function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ") || "—";
  return value || "—";
}

export function formatCurrency(value) {
  if (!value) return "—";

  const numberValue = Number(String(value).replace(/,/g, ""));

  if (Number.isNaN(numberValue)) return value;

  return numberValue.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  });
}

export function getStatusClass(status) {
  switch (status) {
    case "Initial Screening":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "Online Assessment":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";

    case "Interview Scheduled":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";

    case "Interviewed":
      return "border-violet-200 bg-violet-50 text-violet-700";

    case "Offered":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "Accepted":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "For NHO":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "Drop-off":
      return "border-red-200 bg-red-50 text-red-700";

    case "Silver Pool":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "Recyclable":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "Do Not Reprocess":
      return "border-red-200 bg-red-50 text-red-700";

    case "Hired / Active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "Withdrawn":
      return "border-gray-200 bg-gray-50 text-gray-600";

    case "Failed":
      return "border-red-200 bg-red-50 text-red-700";

    case "New Applicant":
      return "border-purple-200 bg-purple-50 text-purple-700";

    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

export function normalizeWorkExperienceRecord(experience = {}) {
  const industry =
    experience.industry ||
    experience.industryRelevantExperience ||
    experience.relevantExperience ||
    "";

  return {
    ...experience,
    industry,
    industryRelevantExperience:
      experience.industryRelevantExperience || industry,
    lengthOfWorkExperience: experience.lengthOfWorkExperience || "",
    years: experience.years || "",
    role: experience.role || "",
    company: experience.company || "",
    monthlyCompensation: experience.monthlyCompensation || "",
    reasonForLeaving: experience.reasonForLeaving || "",
    hasOtherExperience: experience.hasOtherExperience || "No",
  };
}

export function normalizeCandidateRecord(candidate) {
  const openPosition = candidate.openPosition || candidate.roleCapability || "";

  const source =
    candidate.source ||
    (Array.isArray(candidate.hearAboutUs) && candidate.hearAboutUs.length
      ? candidate.hearAboutUs.join(", ")
      : "Public Application");

  const phoneNumber1 =
    candidate.phoneNumber1 ||
    candidate.phone1 ||
    candidate.contactNumber ||
    candidate.phone ||
    "";

  const phoneNumber2 = candidate.phoneNumber2 || candidate.phone2 || "";

  const educationalAttainment =
    candidate.educationalAttainment ||
    candidate.highestEducationalAttainment ||
    "";

  const affiliations = Array.isArray(candidate.affiliations)
    ? candidate.affiliations
    : Array.isArray(candidate.affiliationsAndCertifications)
      ? candidate.affiliationsAndCertifications
      : candidate.affiliations
        ? [candidate.affiliations]
        : [];

  const workExperiences = Array.isArray(candidate.workExperiences)
    ? candidate.workExperiences.map(normalizeWorkExperienceRecord)
    : [];

  return {
    ...candidate,
    suffix: candidate.suffix || candidate.extension || "",
    extension: candidate.extension || candidate.suffix || "",
    name: candidate.name || buildFullName(candidate),
    openPosition,
    roleCapability: candidate.roleCapability || openPosition,
    hearAboutUs: Array.isArray(candidate.hearAboutUs)
      ? candidate.hearAboutUs
      : candidate.hearAboutUs
        ? [candidate.hearAboutUs]
        : source
          ? [source]
          : [],
    contactNumber: phoneNumber1,
    phoneNumber1,
    phoneNumber2,
    phone1: candidate.phone1 || phoneNumber1,
    phone2: candidate.phone2 || phoneNumber2,
    workExperience: candidate.workExperience || "",
    workExperiences,
    educationalAttainment,
    highestEducationalAttainment:
      candidate.highestEducationalAttainment || educationalAttainment,
    affiliations,
    affiliationsAndCertifications: Array.isArray(
      candidate.affiliationsAndCertifications,
    )
      ? candidate.affiliationsAndCertifications
      : affiliations,
    references: Array.isArray(candidate.references)
      ? candidate.references
      : [
          { name: candidate.references || "", phone: "" },
          { name: "", phone: "" },
          { name: "", phone: "" },
        ],
    applyingLocation: candidate.applyingLocation || "",
    referredBy: candidate.referredBy || "",
    employeeId: candidate.employeeId || "",
    nickname: candidate.nickname || "",
    audioFileName: candidate.audioFileName || "",
    audioFileUrl:
      candidate.audioFileUrl ||
      candidate.audioFileDataUrl ||
      candidate.audioDataUrl ||
      "",
    audioFileType: candidate.audioFileType || candidate.audioMimeType || "",
    attachmentFileName: candidate.attachmentFileName || "",
    attachmentFileUrl:
      candidate.attachmentFileUrl ||
      candidate.attachmentFileDataUrl ||
      candidate.attachmentDataUrl ||
      "",
    attachmentFileType:
      candidate.attachmentFileType || candidate.attachmentMimeType || "",
    source,
    availability: candidate.availability || "Available",
    accountFit: candidate.accountFit || "Not assigned yet",
    entryType:
      candidate.entryType ||
      (candidate.isPublicSubmission ? "Public Application" : "TA Manual Entry"),
    createdBy: toDisplayPersonName(
      candidate.createdBy ||
        candidate.addedBy ||
        candidate.submittedBy ||
        (candidate.isPublicSubmission ? "Candidate" : "Current User"),
      candidate.isPublicSubmission ? "Candidate" : "Current User",
    ),
    createdBySibsId: candidate.createdBySibsId || candidate.addedBySibsId || "",
    createdAt:
      candidate.createdAt ||
      candidate.submittedAt ||
      candidate.lastActivity ||
      getTodayDate(),
    lastActivity:
      candidate.lastActivity || candidate.submittedAt || getTodayDate(),
    tags:
      candidate.tags || normalizeTags(openPosition, candidate.skillsLanguage),
  };
}

export function getCandidateUniqueKey(candidate) {
  return String(
    candidate?.candidateId ||
      `${candidate?.email || ""}-${candidate?.submittedAt || candidate?.createdAt || ""}` ||
      candidate?.id ||
      "",
  ).trim();
}

export function importPublicSubmission(submission, index = 0) {
  return normalizeCandidateRecord({
    ...submission,
    id: submission.id || Date.now() + index,
    candidateId: submission.candidateId || generateCandidateId(index + 1),
    status: submission.status || "New Applicant",
    source: submission.source || "Public Application",
    entryType: "Public Application",
    createdBy: "Candidate",
    createdBySibsId: submission.createdBySibsId || "",
    createdAt: submission.createdAt || submission.submittedAt || getTodayDate(),
    lastActivity:
      submission.lastActivity || submission.submittedAt || getTodayDate(),
    isPublicSubmission: true,
    accountFit: submission.accountFit || "Not assigned yet",
    applicationHistory:
      Array.isArray(submission.applicationHistory) &&
      submission.applicationHistory.length > 0
        ? submission.applicationHistory
        : [
            {
              role: submission.openPosition || submission.roleCapability,
              account: submission.accountFit || "Unassigned",
              outcome: "Public Application Submitted",
              date: submission.submittedAt || getTodayDate(),
            },
          ],
    remarks: submission.remarks || "Submitted from public applicant form.",
  });
}

export function mergeCandidateLists(
  primaryCandidates = [],
  publicSubmissions = [],
) {
  const existingKeys = new Set();

  const normalizedPrimary = primaryCandidates.map((candidate) => {
    const normalized = normalizeCandidateRecord(candidate);
    const key = getCandidateUniqueKey(normalized);

    if (key) existingKeys.add(key);

    return normalized;
  });

  const importedPublic = publicSubmissions
    .map(importPublicSubmission)
    .filter((candidate) => {
      const key = getCandidateUniqueKey(candidate);

      if (!key || existingKeys.has(key)) return false;

      existingKeys.add(key);
      return true;
    });

  return [...importedPublic, ...normalizedPrimary];
}

export function getActiveOpenPositionOptions() {
  if (typeof window === "undefined") return [];

  try {
    const positions = readLocalStorage(AVAILABLE_POSITIONS_STORAGE_KEY, []);

    if (!Array.isArray(positions)) return [];

    return positions
      .filter((position) => position?.status === "Active")
      .map((position) => position?.positionTitle)
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function candidateToForm(
  candidate,
  emptyCandidateForm,
  emptyExperience,
) {
  const normalized = normalizeCandidateRecord(candidate || {});
  const references = Array.isArray(normalized.references)
    ? [...normalized.references]
    : [];

  while (references.length < 3) {
    references.push({ name: "", phone: "" });
  }

  return {
    ...emptyCandidateForm,
    ...normalized,
    hearAboutUs: Array.isArray(normalized.hearAboutUs)
      ? normalized.hearAboutUs
      : [],
    suffix: normalized.suffix || normalized.extension || "",
    workExperiences:
      Array.isArray(normalized.workExperiences) &&
      normalized.workExperiences.length > 0
        ? normalized.workExperiences
        : [{ ...emptyExperience }],
    affiliations: Array.isArray(normalized.affiliations)
      ? normalized.affiliations
      : [],
    references: references.slice(0, 3).map((item) => ({
      name: item?.name || "",
      phone: item?.phone || "",
    })),
    accountFit: normalized.accountFit || "Not assigned yet",
    consent: Boolean(normalized.consent ?? true),
  };
}

export function getPrimaryExperienceSummary(candidate) {
  if (candidate.workExperience === "No work Experience") {
    return "No work Experience";
  }

  const experiences = Array.isArray(candidate.workExperiences)
    ? candidate.workExperiences.filter(Boolean)
    : [];

  if (!experiences.length) return candidate.workExperience || "—";

  return experiences
    .map((experience, index) => {
      const parts = [
        experience.industry,
        experience.role,
        experience.company,
        experience.years ? `${experience.years} year(s)` : "",
        experience.monthlyCompensation
          ? `₱${experience.monthlyCompensation}`
          : "",
      ].filter(Boolean);

      return `${index + 1}. ${parts.join(" • ")}`;
    })
    .join("\n");
}

export function getReadinessSummary(candidate) {
  return [
    `Vaccinated: ${candidate.fullyVaccinated || "—"}`,
    `On-site: ${candidate.comfortableOnSite || "—"}`,
    `Graveyard: ${candidate.willingGraveyard || "—"}`,
    `Employment: ${candidate.employmentInterest || "—"}`,
    `Remote: ${candidate.remoteWorkAccess || "—"}`,
    `Drug Test: ${candidate.willingDrugTest || "—"}`,
    `Background Check: ${candidate.willingBackgroundCheck || "—"}`,
  ].join("\n");
}

export function formatReferences(references) {
  if (!Array.isArray(references)) return references || "—";

  return (
    references
      .filter((reference) => reference?.name || reference?.phone)
      .map(
        (reference, index) =>
          `${index + 1}. ${reference?.name || "—"}${
            reference?.phone ? ` / ${reference.phone}` : ""
          }`,
      )
      .join("\n") || "—"
  );
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read selected file."));

    reader.readAsDataURL(file);
  });
}

export function isPreviewableAttachment(type = "", name = "") {
  const mime = String(type || "").toLowerCase();
  const fileName = String(name || "").toLowerCase();

  return (
    mime.startsWith("image/") ||
    mime === "application/pdf" ||
    fileName.endsWith(".pdf") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".png") ||
    fileName.endsWith(".gif")
  );
}

export function openDataUrlInNewTab(dataUrl, fileName = "uploaded-file") {
  if (!dataUrl) return;

  const opened = window.open();

  if (!opened) return;

  opened.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${fileName}</title>
        <style>
          body { margin: 0; font-family: Arial, sans-serif; background: #f8fafc; color: #102a43; }
          header { padding: 14px 18px; background: #fff; border-bottom: 1px solid #e6ecf2; font-weight: 700; }
          iframe, img { display: block; width: 100%; height: calc(100vh - 52px); border: 0; object-fit: contain; }
          audio { display: block; width: calc(100% - 40px); margin: 40px auto; }
        </style>
      </head>
      <body>
        <header>${fileName}</header>
        <iframe src="${dataUrl}"></iframe>
      </body>
    </html>
  `);

  opened.document.close();
}

export function normalizeUploadHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function getUploadValue(row, aliases, fallback = "") {
  const normalizedMap = Object.entries(row || {}).reduce(
    (acc, [key, value]) => {
      acc[normalizeUploadHeader(key)] = value;
      return acc;
    },
    {},
  );

  for (const alias of aliases) {
    const key = normalizeUploadHeader(alias);

    if (normalizedMap[key] !== undefined && normalizedMap[key] !== null) {
      return String(normalizedMap[key]).trim();
    }
  }

  return fallback;
}

export function splitUploadList(value) {
  return String(value || "")
    .split(/[|;]+|,(?=\s*[^)]*(?:$|,))/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildLeadUploadCsvTemplate() {
  const escapeCell = (value) => {
    const text = String(value ?? "");
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };

  const header = leadUploadTemplateColumns.map(escapeCell).join(",");
  const body = leadUploadTemplateRows
    .map((row) =>
      leadUploadTemplateColumns
        .map((column) => escapeCell(row[column]))
        .join(","),
    )
    .join("\n");

  return `${header}\n${body}`;
}

export function parseCsvLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);

  return values.map((value) => value.trim());
}

export function parseLeadUploadCsvText(text) {
  const cleanedText = String(text || "").replace(/^\uFEFF/, "");
  const lines = cleanedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);

    return headers.reduce((row, header, index) => {
      row[header] = values[index] || "";
      return row;
    }, {});
  });
}

export function parseUploadedLeadRow(row, nextId, index) {
  const firstName = getUploadValue(row, [
    "firstName",
    "First Name",
    "first_name",
  ]);

  const middleName = getUploadValue(row, [
    "middleName",
    "Middle Name",
    "middle_name",
  ]);

  const lastName = getUploadValue(row, ["lastName", "Last Name", "last_name"]);

  const suffix = getUploadValue(row, ["suffix", "extension"]);
  const fullName = getUploadValue(row, ["name", "fullName", "Full Name"]);

  const openPosition = getUploadValue(row, [
    "openPosition",
    "Open Position",
    "position",
    "role",
  ]);

  const hearAboutUsRaw = getUploadValue(row, [
    "hearAboutUs",
    "How did you first hear about us",
    "source",
    "applicationSource",
  ]);

  const hearAboutUs = splitUploadList(hearAboutUsRaw);
  const source = hearAboutUs[0] || "CSV Upload";
  const status = getUploadValue(
    row,
    ["status", "talentPoolStatus"],
    "New Applicant",
  );
  const dateOfBirth = getUploadValue(row, [
    "dateOfBirth",
    "Date of Birth",
    "birthdate",
  ]);
  const phoneNumber1 = getUploadValue(row, [
    "phoneNumber1",
    "phone",
    "contactNumber",
    "Contact Number",
  ]);

  const candidateId = getUploadValue(
    row,
    ["candidateId", "Candidate ID"],
    generateCandidateId(nextId + index),
  );

  return normalizeCandidateRecord({
    id: nextId + index,
    candidateId,
    hearAboutUs,
    openPosition,
    nickname: getUploadValue(row, ["nickname", "Nick Name"]),
    applyingLocation: getUploadValue(row, [
      "applyingLocation",
      "location",
      "site",
      "Applying Location",
    ]),
    referredBy: getUploadValue(row, ["referredBy", "Referred By"], "N/A"),
    employeeId: getUploadValue(row, ["employeeId", "Employee ID"], "N/A"),
    firstName,
    middleName,
    lastName,
    suffix,
    extension: suffix,
    name:
      fullName ||
      [firstName, middleName, lastName, suffix].filter(Boolean).join(" "),
    dateOfBirth,
    ageAsOfApplication: calculateAge(dateOfBirth),
    physicalAddress: getUploadValue(row, [
      "physicalAddress",
      "address",
      "Physical Address",
    ]),
    email: getUploadValue(row, ["email", "Email Address"]),
    workExperience: getUploadValue(
      row,
      ["workExperience", "Work Experience"],
      "",
    ),
    workExperiences: [],
    phoneNumber1,
    phoneNumber2: getUploadValue(row, [
      "phoneNumber2",
      "alternatePhone",
      "Phone 2",
    ]),
    contactNumber: phoneNumber1,
    roleCapability: openPosition,
    skillsLanguage: getUploadValue(row, [
      "skillsLanguage",
      "skills",
      "Skills / Language",
    ]),
    educationalAttainment: getUploadValue(row, [
      "educationalAttainment",
      "education",
      "Educational Attainment",
    ]),
    affiliations: splitUploadList(
      getUploadValue(row, ["affiliations", "certifications"]),
    ),
    trainingAttended: getUploadValue(row, ["trainingAttended", "training"]),
    fullyVaccinated: getUploadValue(row, ["fullyVaccinated", "vaccinated"]),
    comfortableOnSite: getUploadValue(row, ["comfortableOnSite", "onSite"]),
    willingGraveyard: getUploadValue(row, ["willingGraveyard", "graveyard"]),
    employmentInterest: getUploadValue(row, [
      "employmentInterest",
      "employment",
    ]),
    remoteWorkAccess: getUploadValue(row, ["remoteWorkAccess", "remote"]),
    willingDrugTest: getUploadValue(row, ["willingDrugTest", "drugTest"]),
    willingBackgroundCheck: getUploadValue(row, [
      "willingBackgroundCheck",
      "backgroundCheck",
    ]),
    references: [
      {
        name: getUploadValue(row, ["reference1Name", "Reference 1 Name"]),
        phone: getUploadValue(row, ["reference1Phone", "Reference 1 Phone"]),
      },
      {
        name: getUploadValue(row, ["reference2Name", "Reference 2 Name"]),
        phone: getUploadValue(row, ["reference2Phone", "Reference 2 Phone"]),
      },
      {
        name: getUploadValue(row, ["reference3Name", "Reference 3 Name"]),
        phone: getUploadValue(row, ["reference3Phone", "Reference 3 Phone"]),
      },
    ],
    consent: true,
    status,
    source,
    availability: getUploadValue(
      row,
      ["availability", "Availability"],
      "Available",
    ),
    accountFit: "Not assigned yet",
    lastActivity: getTodayDate(),
    tags: normalizeTags(
      openPosition,
      getUploadValue(row, ["skillsLanguage", "skills"]),
    ),
    isPublicSubmission: false,
    applicationHistory: [
      {
        role: openPosition,
        account: "Not assigned yet",
        outcome: "Imported from CSV",
        date: getTodayDate(),
      },
    ],
    remarks: getUploadValue(
      row,
      ["remarks", "notes", "Remarks"],
      "Imported lead.",
    ),
  });
}

export function mapPipelineStageToTalentPoolStatus(application) {
  if (!application) return "Silver Pool";

  return (
    application.currentStage ||
    application.stage ||
    application.pipelineStage ||
    "Silver Pool"
  );
}

export function pipelineApplicationToTalentPoolCandidate(
  application,
  index = 0,
) {
  const snapshot = application?.candidateSnapshot || {};

  const currentPipelineStage =
    application.currentStage ||
    application.stage ||
    application.pipelineStage ||
    "";

  const candidateId =
    snapshot.candidateId || application.candidateId || `PIPE-${index + 1}`;

  const name =
    snapshot.name ||
    application.candidateName ||
    application.name ||
    "Unnamed Candidate";

  const email =
    snapshot.email || application.candidateEmail || application.email || "";

  const phoneNumber1 =
    snapshot.phoneNumber1 ||
    snapshot.contactNumber ||
    application.contactNumber ||
    "";

  const openPosition =
    snapshot.openPosition ||
    snapshot.roleCapability ||
    application.roleTitle ||
    "Not assigned yet";

  const applicationHistory = Array.isArray(application.timeline)
    ? application.timeline.map((item) => ({
        role:
          application.roleTitle ||
          snapshot.openPosition ||
          openPosition ||
          "Not assigned yet",
        account: application.account || "Not assigned yet",
        outcome:
          item.reason ||
          item.remarks ||
          item.stage ||
          currentPipelineStage ||
          "Pipeline activity",
        date: application.updatedAt || application.dateMoved || getTodayDate(),
      }))
    : [];

  return normalizeCandidateRecord({
    ...snapshot,

    id: snapshot.id || application.candidateMasterId || application.id,
    candidateId,
    name,
    candidateName: name,

    firstName: snapshot.firstName || "",
    middleName: snapshot.middleName || "",
    lastName: snapshot.lastName || "",

    email,
    phoneNumber1,
    contactNumber: phoneNumber1,

    openPosition,
    roleCapability: openPosition,

    applyingLocation: snapshot.applyingLocation || "",
    source: snapshot.source || application.source || "Candidate Pipeline",

    status:
      currentPipelineStage ||
      snapshot.status ||
      mapPipelineStageToTalentPoolStatus(application),

    availability: snapshot.availability || "Available",

    skillsLanguage: snapshot.skillsLanguage || "",
    educationalAttainment: snapshot.educationalAttainment || "",
    affiliations: snapshot.affiliations || [],

    pipelineStatus: application.applicationStatus || "Active",
    currentApplicationId: application.applicationId,
    currentCandidateApplicationId: application.candidateApplicationId,
    currentHiringRequirementId: application.hiringRequirementId || "",

    currentPipelineStage,
    currentApplicationStatus: application.applicationStatus || "",

    currentAppliedRole: application.roleTitle || "Not assigned yet",
    currentAppliedAccount: application.account || "Not assigned yet",
    currentTaOwner: application.taOwner || application.owner || "",

    currentPrfStatus: application.prfStatus || "",
    currentAssessmentStatus: application.assessmentStatus || "",
    currentAssessmentResult: application.assessmentResult || "",
    currentInterviewStatus: application.interviewStatus || "",
    currentOfferStatus: application.offerApprovalStatus || "",
    currentOfferDecision: application.offerDecision || "",

    lastPipelineUpdate: application.updatedAt || application.dateMoved,
    lastActivity:
      application.updatedAt || application.dateMoved || getTodayDate(),

    isFromPipeline: true,
    pipelineApplication: application,

    applicationHistory:
      applicationHistory.length > 0
        ? applicationHistory
        : [
            {
              role: application.roleTitle || openPosition || "Not assigned yet",
              account: application.account || "Not assigned yet",
              outcome: `Pipeline Stage: ${currentPipelineStage || "—"}`,
              date:
                application.updatedAt ||
                application.dateMoved ||
                getTodayDate(),
            },
          ],

    remarks:
      snapshot.remarks ||
      application.reasonForMovement ||
      application.dropOffRemarks ||
      "",
  });
}

export function mergePipelineCandidatesIntoTalentPool(
  talentPoolCandidates = [],
  pipelineApplications = [],
) {
  const candidateMap = new Map();

  talentPoolCandidates.forEach((candidate) => {
    const normalized = normalizeCandidateRecord(candidate);
    const key =
      normalized.candidateId ||
      normalized.email ||
      `${normalized.name}-${normalized.phoneNumber1}`;

    if (key) candidateMap.set(key, normalized);
  });

  pipelineApplications.forEach((application, index) => {
    const pipelineCandidate = pipelineApplicationToTalentPoolCandidate(
      application,
      index,
    );

    const key =
      pipelineCandidate.candidateId ||
      pipelineCandidate.email ||
      `${pipelineCandidate.name}-${pipelineCandidate.phoneNumber1}`;

    if (!key) return;

    const existingCandidate = candidateMap.get(key);

    if (!existingCandidate) {
      candidateMap.set(key, pipelineCandidate);
      return;
    }

    candidateMap.set(
      key,
      normalizeCandidateRecord({
        ...existingCandidate,
        ...pipelineCandidate,

        id: existingCandidate.id || pipelineCandidate.id,
        candidateId: existingCandidate.candidateId || pipelineCandidate.candidateId,
        name: existingCandidate.name || pipelineCandidate.name,

        status:
          pipelineCandidate.currentPipelineStage ||
          pipelineCandidate.status ||
          existingCandidate.status,

        pipelineStatus: pipelineCandidate.pipelineStatus,
        currentApplicationId: pipelineCandidate.currentApplicationId,
        currentCandidateApplicationId:
          pipelineCandidate.currentCandidateApplicationId,
        currentHiringRequirementId:
          pipelineCandidate.currentHiringRequirementId,
        currentPipelineStage: pipelineCandidate.currentPipelineStage,
        currentApplicationStatus: pipelineCandidate.currentApplicationStatus,
        currentAppliedRole: pipelineCandidate.currentAppliedRole,
        currentAppliedAccount: pipelineCandidate.currentAppliedAccount,
        currentTaOwner: pipelineCandidate.currentTaOwner,
        currentPrfStatus: pipelineCandidate.currentPrfStatus,
        currentAssessmentStatus: pipelineCandidate.currentAssessmentStatus,
        currentAssessmentResult: pipelineCandidate.currentAssessmentResult,
        currentInterviewStatus: pipelineCandidate.currentInterviewStatus,
        currentOfferStatus: pipelineCandidate.currentOfferStatus,
        currentOfferDecision: pipelineCandidate.currentOfferDecision,
        lastPipelineUpdate: pipelineCandidate.lastPipelineUpdate,
        lastActivity:
          pipelineCandidate.lastPipelineUpdate ||
          pipelineCandidate.lastActivity ||
          existingCandidate.lastActivity,
        isFromPipeline: true,
        pipelineApplication: pipelineCandidate.pipelineApplication,

        applicationHistory: [
          ...(existingCandidate.applicationHistory || []),
          ...(pipelineCandidate.applicationHistory || []),
        ],
      }),
    );
  });

  return Array.from(candidateMap.values());
}