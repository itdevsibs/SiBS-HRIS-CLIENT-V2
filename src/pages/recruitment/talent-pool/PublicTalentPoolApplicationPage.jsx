
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  Send,
  UserPlus,
  CheckCircle2,
  RotateCcw,
  BriefcaseBusiness,
  GraduationCap,
  ShieldCheck,
  Mic,
  UploadCloud,
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Search,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  CircleCheckBig,
  TriangleAlert,
} from "lucide-react";
import StatusModal from "@/components/modals/StatusModal";
import RichTextViewer from "@/components/modals/jobDescription/RichTextViewer";
import {
  checkTalentPoolApplicantNameAvailability,
  getTalentPoolApplicationForm,
  getTalentPoolFormOptions,
  getTalentPoolOpenPositions,
  getTalentPoolReferralPrefill,
  submitPublicTalentPoolApplication,
} from "@/lib/axios/publicTalentPool";
import {
  canRemoveTrainingEntryRow,
  ensureTrainingEntryRows,
  normalizeTrainingEntries,
} from "@/lib/utils/talentPool/trainingEntries";
import {
  normalizePhoneNumberForSubmit,
  normalizePhoneNumberInput,
} from "@/lib/utils/talentPool/phoneNumber";
import { resolveCalendarSelectionChange } from "@/lib/utils/talentPool/calendarDateSelection";
import {
  buildApplicationFormAnswersPayload,
  createQuestionAnswerState,
  normalizeApplicationFormQuestions,
  validateApplicationQuestionAnswers,
} from "@/lib/utils/talentPool/publicApplicationQuestions";

const acceptedAudioTypes =
  ".mp3,.wav,.wave,.m4a,.aac,.ogg,.oga,.webm,.mp4,.mpeg,.mpga,.flac,.amr,.3gp,.opus,.aif,.aiff,.caf,.wma,audio/*,video/mp4,video/3gpp";

const acceptedDocumentTypes =
  ".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif";

const acceptedAudioExtensions = [
  ".mp3",
  ".wav",
  ".wave",
  ".m4a",
  ".aac",
  ".ogg",
  ".oga",
  ".webm",
  ".mp4",
  ".mpeg",
  ".mpga",
  ".flac",
  ".amr",
  ".3gp",
  ".opus",
  ".aif",
  ".aiff",
  ".caf",
  ".wma",
];

const acceptedDocumentExtensions = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
];

const OUTBOUND_SOURCE = "Outbound";
const EXTERNAL_REFERRAL_LISTINGS_SOURCE = "External Referral Listings";

const defaultFormOptions = {
  hearAboutUs: [EXTERNAL_REFERRAL_LISTINGS_SOURCE, OUTBOUND_SOURCE],
  locations: [],
  workExperience: [],
  lengthOfExperience: [],
  educationalAttainment: [],
  affiliationCertification: [],
  yesNo: [],
  employmentInterest: [],
  audioQuestions: [],
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function createEmptyExperience() {
  return {
    id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    industryRelevantExperience: "",
    lengthOfWorkExperience: "",
    years: "",
    role: "",
    company: "",
    monthlyCompensation: "",
    reasonForLeaving: "",
  };
}

/* EDUCATION RULES START */
const EDUCATION_SECTION_KEYS = [
  "elementary",
  "highSchool",
  "seniorHighSchool",
  "college",
  "vocational",
  "lawSchool",
  "masters",
  "doctorate",
];

function createEmptyEducationSchool() {
  return {
    schoolName: "",
    address: "",
    course: "",
    schoolYearGraduated: "",
  };
}

function createEmptyEducationDetails() {
  return {
    attendedSeniorHighSchool: false,
    elementary: createEmptyEducationSchool(),
    highSchool: createEmptyEducationSchool(),
    seniorHighSchool: createEmptyEducationSchool(),
    college: createEmptyEducationSchool(),
    vocational: createEmptyEducationSchool(),
    lawSchool: createEmptyEducationSchool(),
    masters: createEmptyEducationSchool(),
    doctorate: createEmptyEducationSchool(),
  };
}

const EDUCATION_ATTAINMENT_CONFIG = {
  highSchoolGraduate: {
    key: "highSchoolGraduate",
    label: "High School Graduate",
    seniorHighMode: "hidden",
    sections: [
      {
        key: "elementary",
        title: "Elementary School",
        schoolNameLabel: "Elementary School Name",
        requireYear: true,
      },
      {
        key: "highSchool",
        title: "High School",
        schoolNameLabel: "High School Name",
        requireYear: true,
      },
    ],
  },
  seniorHighSchoolGraduate: {
    key: "seniorHighSchoolGraduate",
    label: "Senior High School Graduate",
    seniorHighMode: "required",
    sections: [
      {
        key: "elementary",
        title: "Elementary School",
        schoolNameLabel: "Elementary School Name",
        requireYear: true,
      },
      {
        key: "highSchool",
        title: "High School",
        schoolNameLabel: "High School Name",
        requireYear: true,
      },
      {
        key: "seniorHighSchool",
        title: "Senior High School",
        schoolNameLabel: "Senior High School Name",
        requireYear: true,
      },
    ],
  },
  collegeLevel: {
    key: "collegeLevel",
    label: "College Level",
    seniorHighMode: "optional",
    sections: [
      {
        key: "elementary",
        title: "Elementary School",
        schoolNameLabel: "Elementary School Name",
        requireYear: true,
      },
      {
        key: "highSchool",
        title: "High School",
        schoolNameLabel: "High School Name",
        requireYear: true,
      },
      {
        key: "college",
        title: "Current College",
        schoolNameLabel: "Current College Name",
        courseLabel: "Current Course",
        requireCourse: true,
        requireYear: false,
      },
    ],
  },
  collegeGraduate: {
    key: "collegeGraduate",
    label: "College Graduate",
    seniorHighMode: "optional",
    sections: [
      {
        key: "elementary",
        title: "Elementary School",
        schoolNameLabel: "Elementary School Name",
        requireYear: true,
      },
      {
        key: "highSchool",
        title: "High School",
        schoolNameLabel: "High School Name",
        requireYear: true,
      },
      {
        key: "college",
        title: "College",
        schoolNameLabel: "College School Name",
        courseLabel: "College Course",
        requireCourse: true,
        requireYear: true,
      },
    ],
  },
  vocational: {
    key: "vocational",
    label: "Vocational / Technical",
    seniorHighMode: "optional",
    sections: [
      {
        key: "elementary",
        title: "Elementary School",
        schoolNameLabel: "Elementary School Name",
        requireYear: true,
      },
      {
        key: "highSchool",
        title: "High School",
        schoolNameLabel: "High School Name",
        requireYear: true,
      },
      {
        key: "vocational",
        title: "Technical and Vocational School",
        schoolNameLabel: "Technical and Vocational School Name",
        courseLabel: "Technical or Vocational Course",
        requireCourse: true,
        requireYear: true,
      },
    ],
  },
  graduateSchoolLevel: {
    key: "graduateSchoolLevel",
    label: "Graduate School Level",
    seniorHighMode: "optional",
    sections: [
      {
        key: "elementary",
        title: "Elementary School",
        schoolNameLabel: "Elementary School Name",
        requireYear: true,
      },
      {
        key: "highSchool",
        title: "High School",
        schoolNameLabel: "High School Name",
        requireYear: true,
      },
      {
        key: "college",
        title: "College",
        schoolNameLabel: "College School Name",
        courseLabel: "College Course",
        requireCourse: true,
        requireYear: true,
      },
      {
        key: "lawSchool",
        title: "Law School",
        schoolNameLabel: "Law School Name",
        requireYear: true,
      },
    ],
  },
  mastersDegreeGraduate: {
    key: "mastersDegreeGraduate",
    label: "Master's Degree Graduate",
    seniorHighMode: "optional",
    sections: [
      {
        key: "elementary",
        title: "Elementary School",
        schoolNameLabel: "Elementary School Name",
        requireYear: true,
      },
      {
        key: "highSchool",
        title: "High School",
        schoolNameLabel: "High School Name",
        requireYear: true,
      },
      {
        key: "college",
        title: "College",
        schoolNameLabel: "College School Name",
        courseLabel: "College Course",
        requireCourse: true,
        requireYear: true,
      },
      {
        key: "masters",
        title: "Master's Degree",
        schoolNameLabel: "Master's Degree School Name",
        courseLabel: "Master's Degree Course",
        requireCourse: true,
        requireYear: true,
      },
    ],
  },
  doctorateDegreeGraduate: {
    key: "doctorateDegreeGraduate",
    label: "Doctorate Degree Graduate",
    seniorHighMode: "optional",
    sections: [
      {
        key: "elementary",
        title: "Elementary School",
        schoolNameLabel: "Elementary School Name",
        requireYear: true,
      },
      {
        key: "highSchool",
        title: "High School",
        schoolNameLabel: "High School Name",
        requireYear: true,
      },
      {
        key: "college",
        title: "College",
        schoolNameLabel: "College School Name",
        courseLabel: "College Course",
        requireCourse: true,
        requireYear: true,
      },
      {
        key: "doctorate",
        title: "Doctorate Degree",
        schoolNameLabel: "Doctorate School Name",
        courseLabel: "Doctorate Course",
        requireCourse: true,
        requireYear: true,
      },
    ],
  },
};

function normalizeEducationAttainmentKey(value) {
  const compactValue = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "");

  const aliases = {
    highschoolgraduate: "highSchoolGraduate",
    seniorhighschoolgraduate: "seniorHighSchoolGraduate",
    collegelevel: "collegeLevel",
    collegegraduate: "collegeGraduate",
    vocational: "vocational",
    vocationaltechnical: "vocational",
    vocationalgraduate: "vocational",
    technicalvocational: "vocational",
    technicalandvocational: "vocational",
    graduateschoollevel: "graduateSchoolLevel",
    lawschoollevel: "graduateSchoolLevel",
    mastersdegreegraduate: "mastersDegreeGraduate",
    masterdegreegraduate: "mastersDegreeGraduate",
    mastersgraduate: "mastersDegreeGraduate",
    doctoratedegreegraduate: "doctorateDegreeGraduate",
    doctoratedegree: "doctorateDegreeGraduate",
    doctorategraduate: "doctorateDegreeGraduate",
    doctoraldegreegraduate: "doctorateDegreeGraduate",
  };

  if (EDUCATION_ATTAINMENT_CONFIG[value]) return value;

  return aliases[compactValue] || "";
}

function getEducationAttainmentConfig(value) {
  const key = normalizeEducationAttainmentKey(value);
  return EDUCATION_ATTAINMENT_CONFIG[key] || null;
}

function normalizeSchoolYearInputValue(value) {
  return String(value ?? "")
    .replace(/[–—]/g, "-")
    .replace(/[^0-9 -]/g, "")
    .replace(/ {2,}/g, " ")
    .slice(0, 13);
}

function normalizeSchoolYearValue(value) {
  const cleaned = normalizeSchoolYearInputValue(value)
    .replace(/\s+/g, "")
    .slice(0, 9);

  if (!cleaned.includes("-") && cleaned.length > 4) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`;
  }

  return cleaned;
}

function isValidSchoolYearRange(value) {
  const cleaned = normalizeSchoolYearValue(value);

  if (!/^\d{4}-\d{4}$/.test(cleaned)) return false;

  const [startYear, endYear] = cleaned.split("-").map(Number);

  return (
    Number.isInteger(startYear) &&
    Number.isInteger(endYear) &&
    startYear >= 1900 &&
    endYear >= startYear &&
    endYear <= 2200
  );
}

function buildSchoolYearOptions() {
  const currentYear = new Date().getFullYear();
  const options = [];

  for (let endYear = currentYear; endYear >= 1901; endYear -= 1) {
    const startYear = endYear - 1;
    const value = `${startYear}-${endYear}`;

    options.push({
      id: value,
      value,
      label: value,
    });
  }

  return options;
}

function getEducationSchoolDraft(section = {}) {
  return {
    schoolName: String(section?.schoolName ?? ""),
    address: String(section?.address ?? ""),
    course: String(section?.course ?? ""),
    schoolYearGraduated: normalizeSchoolYearInputValue(
      section?.schoolYearGraduated,
    ),
  };
}

function normalizeEducationSchool(section = {}) {
  const draft = getEducationSchoolDraft(section);

  return {
    schoolName: draft.schoolName.trim().toUpperCase(),
    address: draft.address.trim().toUpperCase(),
    course: draft.course.trim().toUpperCase(),
    schoolYearGraduated: normalizeSchoolYearValue(draft.schoolYearGraduated),
  };
}

function getEducationDetailsDraft(details = {}) {
  const draft = createEmptyEducationDetails();

  draft.attendedSeniorHighSchool = Boolean(details?.attendedSeniorHighSchool);

  EDUCATION_SECTION_KEYS.forEach((sectionKey) => {
    draft[sectionKey] = getEducationSchoolDraft(details?.[sectionKey]);
  });

  return draft;
}

function normalizeEducationDetails(details = {}) {
  const normalized = createEmptyEducationDetails();

  normalized.attendedSeniorHighSchool = Boolean(
    details?.attendedSeniorHighSchool,
  );

  EDUCATION_SECTION_KEYS.forEach((sectionKey) => {
    normalized[sectionKey] = normalizeEducationSchool(details?.[sectionKey]);
  });

  return normalized;
}

function prepareEducationDetailsForAttainment(details, attainment) {
  const config = getEducationAttainmentConfig(attainment);
  const current = getEducationDetailsDraft(details);
  const next = createEmptyEducationDetails();

  if (!config) return next;

  const allowedSectionKeys = new Set(
    config.sections.map((section) => section.key),
  );

  if (
    config.seniorHighMode === "required" ||
    (config.seniorHighMode === "optional" && current.attendedSeniorHighSchool)
  ) {
    allowedSectionKeys.add("seniorHighSchool");
  }

  allowedSectionKeys.forEach((sectionKey) => {
    next[sectionKey] = getEducationSchoolDraft(current[sectionKey]);
  });

  next.attendedSeniorHighSchool =
    config.seniorHighMode === "required"
      ? true
      : config.seniorHighMode === "optional"
        ? current.attendedSeniorHighSchool
        : false;

  return next;
}

function getEducationSectionsForValidation(attainment, details) {
  const config = getEducationAttainmentConfig(attainment);

  if (!config) return [];

  const sections = [...config.sections];
  const normalizedDetails = normalizeEducationDetails(details);

  if (
    config.seniorHighMode === "optional" &&
    normalizedDetails.attendedSeniorHighSchool
  ) {
    sections.splice(2, 0, {
      key: "seniorHighSchool",
      title: "Senior High School",
      schoolNameLabel: "Senior High School Name",
      requireYear: true,
    });
  }

  return sections;
}

function validateEducationDetails(attainment, details) {
  const config = getEducationAttainmentConfig(attainment);

  if (!config) {
    return "Please select a supported highest educational attainment.";
  }

  const normalizedDetails = normalizeEducationDetails(details);
  const sections = getEducationSectionsForValidation(
    attainment,
    normalizedDetails,
  );

  for (const section of sections) {
    const values =
      normalizedDetails[section.key] || createEmptyEducationSchool();

    if (!values.schoolName) {
      return `${section.title} name is required.`;
    }

    if (!values.address) {
      return `${section.title} address is required.`;
    }

    if (section.requireCourse && !values.course) {
      return `${section.title} course or program is required.`;
    }

    if (section.requireYear !== false) {
      if (!values.schoolYearGraduated) {
        return `${section.title} school year graduated is required.`;
      }

      if (!isValidSchoolYearRange(values.schoolYearGraduated)) {
        return `${section.title} school year graduated must use YYYY-YYYY format and the ending year cannot be earlier than the starting year.`;
      }
    }
  }

  return "";
}
/* EDUCATION RULES END */

function getReferralCodeFromCurrentUrl() {
  if (typeof window === "undefined") return "";

  return String(new URLSearchParams(window.location.search).get("ref") || "")
    .trim()
    .toUpperCase();
}

function createEmptyPublicForm(referralCode = "") {
  return {
    hearAboutUs: [],
    jobDescriptionId: "",
    selectedAvailablePositionId: "",
    positionId: "",
    openPosition: "",
    nickname: "",
    applyingLocation: "",
    referralCode,
    referredBy: "",
    employeeId: "",

    firstName: "",
    lastName: "",
    middleName: "",
    suffix: "",
    dateOfBirth: "",
    email: "",
    physicalAddress: "",
    workExperience: "",
    phone1: "",
    phone2: "",

    industryRelevantExperience: "",
    lengthOfWorkExperience: "",
    years: "",
    role: "",
    company: "",
    monthlyCompensation: "",
    reasonForLeaving: "",
    hasOtherExperience: "",
    otherExperiences: [],

    highestEducationalAttainment: "",
    educationDetails: createEmptyEducationDetails(),
    affiliationsAndCertifications: [],
    trainingAttended: [""],

    fullyVaccinated: "",
    comfortableOnSite: "",
    willingGraveyard: "",
    employmentInterest: "",
    remoteWorkAccess: "",
    willingDrugTest: "",
    willingBackgroundCheck: "",

    reference1Name: "",
    reference1Phone: "",
    reference2Name: "",
    reference2Phone: "",
    reference3Name: "",
    reference3Phone: "",

    audioFile: null,
    attachmentFile: null,
    consent: false,
  };
}

function getFileExtension(file) {
  const name = String(file?.name || "");
  const dotIndex = name.lastIndexOf(".");

  if (dotIndex === -1) return "";

  return name.slice(dotIndex).toLowerCase();
}

function isAcceptedAudioFile(file) {
  if (!file) return false;

  const extension = getFileExtension(file);
  const mimeType = String(file.type || "").toLowerCase();

  const hasAudioExtension = acceptedAudioExtensions.includes(extension);
  const hasAudioMime = mimeType.startsWith("audio/");
  const hasPhoneRecordingMime =
    (mimeType === "video/mp4" && [".mp4", ".m4a"].includes(extension)) ||
    (mimeType === "video/3gpp" && extension === ".3gp") ||
    (mimeType === "application/octet-stream" && hasAudioExtension);

  return hasAudioExtension || hasAudioMime || hasPhoneRecordingMime;
}

function isAcceptedDocumentFile(file) {
  if (!file) return false;

  const extension = getFileExtension(file);

  return acceptedDocumentExtensions.includes(extension);
}

function formatFileSize(file) {
  if (!file?.size) return "";

  const sizeInMb = file.size / (1024 * 1024);

  if (sizeInMb >= 1) {
    return `${sizeInMb.toFixed(2)} MB`;
  }

  return `${Math.max(file.size / 1024, 1).toFixed(0)} KB`;
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;

  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) return null;

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

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeReferencePhoneInput(value, previousValue = "") {
  const digitsOnly = String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 11);

  if (!digitsOnly || digitsOnly === "0" || digitsOnly.startsWith("09")) {
    return digitsOnly;
  }

  return String(previousValue ?? "");
}

function isValidReferencePhoneNumber(value = "") {
  return /^09\d{9}$/.test(cleanText(value));
}

function buildApplicantNameCheckKey({
  firstName = "",
  middleName = "",
  lastName = "",
} = {}) {
  return [firstName, middleName, lastName]
    .map((value) => cleanText(value).toUpperCase().replace(/\s+/g, " "))
    .join("|");
}

function hasCompleteApplicantNameForDuplicateCheck({
  firstName = "",
  middleName = "",
  lastName = "",
} = {}) {
  return Boolean(
    cleanText(firstName) && cleanText(middleName) && cleanText(lastName),
  );
}

const uppercasePublicTextFields = new Set([
  "nickname",
  "referredBy",
  "employeeId",
  "firstName",
  "lastName",
  "middleName",
  "suffix",
  "physicalAddress",
  "industryRelevantExperience",
  "years",
  "role",
  "company",
  "monthlyCompensation",
  "reasonForLeaving",
  "reference1Name",
  "reference2Name",
  "reference3Name",
]);

const uppercaseExperienceFields = new Set([
  "industryRelevantExperience",
  "years",
  "role",
  "company",
  "monthlyCompensation",
  "reasonForLeaving",
]);

function toUpperInputValue(value) {
  return String(value ?? "").toUpperCase();
}

function normalizePublicFormFieldValue(field, value) {
  if (typeof value !== "string") return value;

  if (!uppercasePublicTextFields.has(field)) return value;

  return toUpperInputValue(value);
}

function normalizePublicFormFields(fields = {}) {
  return Object.entries(fields).reduce((normalizedFields, [field, value]) => {
    normalizedFields[field] = normalizePublicFormFieldValue(field, value);
    return normalizedFields;
  }, {});
}

function normalizeExperienceFieldValue(field, value) {
  if (typeof value !== "string") return value;

  if (!uppercaseExperienceFields.has(field)) return value;

  return toUpperInputValue(value);
}

function normalizeExperienceValues(experience = {}) {
  return Object.entries(experience).reduce(
    (normalizedExperience, [field, value]) => {
      normalizedExperience[field] = normalizeExperienceFieldValue(field, value);
      return normalizedExperience;
    },
    {},
  );
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function toDateInputValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(
    date.getDate(),
  )}`;
}

function parseDateInputValue(value) {
  if (!value) return null;

  const parts = String(value).split("-");

  if (parts.length !== 3) return null;

  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);

  const date = new Date(year, month, day);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function isSameDate(firstDate, secondDate) {
  if (!firstDate || !secondDate) return false;

  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function formatDateDisplay(value) {
  const date = parseDateInputValue(value);

  if (!date) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildCalendarDays(displayDate) {
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDay = firstDayOfMonth.getDay();

  const calendarStart = new Date(year, month, 1 - startDay);
  const days = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);

    days.push({
      date,
      dateValue: toDateInputValue(date),
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
    });
  }

  return days;
}

function inputClass(extra = "", options = {}) {
  const shouldUppercase = options.uppercase !== false;

  return `h-9 2xl:h-11 w-full rounded-[10px] border border-[#D7DEE8] bg-[#F8FAFC] px-2.5 2xl:px-3 text-xs font-semibold ${
    shouldUppercase ? "uppercase" : "normal-case"
  } text-[#042C51] outline-none transition placeholder:normal-case placeholder:text-[#667085] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:border-[#D7DEE8] disabled:bg-[#F2F4F7] disabled:text-[#667085] ${extra}`;
}

function textareaClass(extra = "") {
  return `w-full resize-none rounded-[10px] border border-[#D7DEE8] bg-[#F8FAFC] px-2.5 py-2 2xl:px-3 2xl:py-2.5 text-xs font-semibold uppercase text-[#042C51] outline-none transition placeholder:normal-case placeholder:text-[#667085] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:border-[#D7DEE8] disabled:bg-[#F2F4F7] disabled:text-[#667085] ${extra}`;
}

function AutoResizeTextarea({
  value,
  onChange,
  minHeight = 36,
  className = "",
  ...props
}) {
  const textareaRef = useRef(null);

  const resizeTextarea = useCallback(
    (textarea) => {
      if (!textarea) return;

      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(textarea.scrollHeight, minHeight)}px`;
    },
    [minHeight],
  );

  useEffect(() => {
    resizeTextarea(textareaRef.current);
  }, [value, minHeight, resizeTextarea]);

  return (
    <textarea
      {...props}
      ref={textareaRef}
      value={value}
      rows={1}
      onChange={(event) => {
        onChange?.(event);
        resizeTextarea(event.currentTarget);
      }}
      onInput={(event) => resizeTextarea(event.currentTarget)}
      className={`${className} overflow-hidden`}
    />
  );
}

function getOptionValue(option) {
  if (typeof option === "string") return option;
  return option?.value || "";
}

function getOptionLabel(option) {
  if (typeof option === "string") return option;
  return option?.label || option?.value || "";
}

function normalizeReferralSourceText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function isEmployeeReferralProgramOption(option) {
  const employeeReferralKey = "employeereferralprogram";

  return [getOptionValue(option), getOptionLabel(option)]
    .map(normalizeReferralSourceText)
    .includes(employeeReferralKey);
}

function isEmployeeReferralProgramSelected(selectedValues, options) {
  const selectedValueSet = new Set(
    toArray(selectedValues).map((value) => String(value)),
  );

  return toArray(options).some((option) => {
    const optionValue = getOptionValue(option);

    return (
      selectedValueSet.has(String(optionValue)) &&
      isEmployeeReferralProgramOption(option)
    );
  });
}

function normalizeEducationalAttainmentOptionText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

const EXCLUDED_EDUCATIONAL_ATTAINMENTS = new Set(
  [
    "Master's Degree Holder",
    "Doctorate Degree Holder",
    "Vocational / Technical Graduate",
  ].map(normalizeEducationalAttainmentOptionText),
);

function isExcludedEducationalAttainmentOption(option) {
  return [getOptionValue(option), getOptionLabel(option)]
    .map(normalizeEducationalAttainmentOptionText)
    .some((optionText) => EXCLUDED_EDUCATIONAL_ATTAINMENTS.has(optionText));
}

function normalizeEducationalAttainmentOption(option) {
  const optionValue = getOptionValue(option);
  const optionLabel = getOptionLabel(option);
  const normalizedTexts = [optionValue, optionLabel].map(
    normalizeEducationalAttainmentOptionText,
  );

  if (!normalizedTexts.includes("vocational")) {
    return option;
  }

  return {
    ...(option && typeof option === "object" ? option : {}),
    id:
      option && typeof option === "object"
        ? option.id || optionValue || optionLabel
        : optionValue || optionLabel,
    value: optionValue || optionLabel || "Vocational",
    label: "Vocational / Technical",
  };
}

function normalizeDropdownOptions(options = []) {
  return toArray(options)
    .map((option) => {
      const optionValue = getOptionValue(option);
      const optionLabel = getOptionLabel(option);

      if (!cleanText(optionValue) && !cleanText(optionLabel)) return null;

      return {
        ...(option && typeof option === "object" ? option : {}),
        id: option?.id || optionValue || optionLabel,
        value: optionValue || optionLabel,
        label: optionLabel || optionValue,
      };
    })
    .filter(Boolean);
}

function hasMatchingOptionValue(options, value) {
  const normalizedValue = String(value || "");

  if (!normalizedValue) return false;

  return normalizeDropdownOptions(options).some(
    (option) => String(option.value) === normalizedValue,
  );
}

function hasMatchingMultiOptionValue(options, values) {
  return toArray(values).some((value) =>
    hasMatchingOptionValue(options, value),
  );
}

function ensureOption(options = [], optionValue) {
  const normalizedTarget = cleanText(optionValue).toLowerCase();
  const hasOption = toArray(options).some((option) => {
    const value = cleanText(getOptionValue(option)).toLowerCase();
    const label = cleanText(getOptionLabel(option)).toLowerCase();
    return value === normalizedTarget || label === normalizedTarget;
  });

  return hasOption ? options : [...toArray(options), optionValue];
}

function sortHearAboutUsOptions(options = []) {
  return [...toArray(options)].sort((firstOption, secondOption) => {
    const firstLabel = cleanText(getOptionLabel(firstOption)).toLowerCase();
    const secondLabel = cleanText(getOptionLabel(secondOption)).toLowerCase();
    const firstIsOthers = firstLabel === "others";
    const secondIsOthers = secondLabel === "others";

    if (firstIsOthers === secondIsOthers) return 0;
    return firstIsOthers ? 1 : -1;
  });
}

function normalizeOptionsPayload(payload) {
  const data = payload && typeof payload === "object" ? payload : {};

  return {
    hearAboutUs: sortHearAboutUsOptions(
      ensureOption(
        ensureOption(
          Array.isArray(data.hearAboutUs) ? data.hearAboutUs : [],
          EXTERNAL_REFERRAL_LISTINGS_SOURCE,
        ),
        OUTBOUND_SOURCE,
      ),
    ),
    locations: Array.isArray(data.locations) ? data.locations : [],
    workExperience: Array.isArray(data.workExperience)
      ? data.workExperience
      : [],
    lengthOfExperience: Array.isArray(data.lengthOfExperience)
      ? data.lengthOfExperience
      : [],
    educationalAttainment: Array.isArray(data.educationalAttainment)
      ? data.educationalAttainment
          .filter((option) => !isExcludedEducationalAttainmentOption(option))
          .map(normalizeEducationalAttainmentOption)
      : [],
    affiliationCertification: Array.isArray(data.affiliationCertification)
      ? data.affiliationCertification
      : [],
    yesNo: Array.isArray(data.yesNo) ? data.yesNo : [],
    employmentInterest: Array.isArray(data.employmentInterest)
      ? data.employmentInterest
      : [],
    audioQuestions: Array.isArray(data.audioQuestions)
      ? data.audioQuestions
      : [],
  };
}

function getPositionKey(position = {}) {
  return String(
    position.id ||
      position.openPositionDbId ||
      position.open_position_db_id ||
      position.positionId ||
      position.position_id ||
      "",
  );
}

function normalizeAvailablePosition(position = {}) {
  return {
    ...position,
    id:
      position.id ||
      position.openPositionDbId ||
      position.open_position_db_id ||
      position.positionId ||
      position.position_id ||
      position.positionTitle ||
      position.position_title ||
      "",
    openPositionDbId:
      position.openPositionDbId ||
      position.open_position_db_id ||
      position.id ||
      "",
    positionId: cleanText(position.positionId || position.position_id),
    positionTitle: cleanText(
      position.positionTitle ||
        position.position_title ||
        position.title ||
        position.name,
    ),
    jdId:
      position.jdId ||
      position.jd_id ||
      position.jobDescriptionId ||
      position.job_description_id ||
      "",
    jdCode: cleanText(position.jdCode || position.jd_code),
    documentTitle: cleanText(
      position.documentTitle || position.document_title,
    ),
    departmentId: position.departmentId || position.department_id || "",
    department: cleanText(
      position.department ||
        position.departmentName ||
        position.department_name,
    ),
    accountId: position.accountId || position.account_id || "",
    accountName: cleanText(
      position.accountName || position.account_name || position.account,
    ),
    accountGhlName: cleanText(
      position.accountGhlName || position.account_ghl_name,
    ),
    locationSite: cleanText(
      position.locationSite || position.location_site || position.location,
    ),
    status: cleanText(position.status),
    approvalStatus: cleanText(
      position.approvalStatus || position.approval_status,
    ),
  };
}

function isApprovedActivePosition(position = {}) {
  const normalizedPosition = normalizeAvailablePosition(position);
  const status = normalizedPosition.status.toLowerCase();
  const approvalStatus = normalizedPosition.approvalStatus.toLowerCase();

  return status === "active" && approvalStatus === "approved";
}

function getApplicationQuestionTextOptions(question = {}) {
  const rawOptions = question?.options;

  if (Array.isArray(rawOptions) && rawOptions.length) {
    return rawOptions;
  }

  if (rawOptions && typeof rawOptions === "object") {
    return Object.entries(rawOptions).map(([value, label]) => ({
      value,
      label: cleanText(label) || cleanText(value),
    }));
  }

  const questionType = cleanText(question?.questionType).toLowerCase();

  if (questionType.includes("yes") && questionType.includes("no")) {
    return ["Yes", "No"];
  }

  return [];
}

function sortAvailablePositions(positions = []) {
  return [...toArray(positions)].sort((firstPosition, secondPosition) => {
    const firstLabel = [
      firstPosition.positionTitle,
      firstPosition.accountName || firstPosition.accountGhlName,
      firstPosition.locationSite,
      firstPosition.positionId,
    ]
      .filter(Boolean)
      .join(" ");

    const secondLabel = [
      secondPosition.positionTitle,
      secondPosition.accountName || secondPosition.accountGhlName,
      secondPosition.locationSite,
      secondPosition.positionId,
    ]
      .filter(Boolean)
      .join(" ");

    return firstLabel.localeCompare(secondLabel, undefined, {
      sensitivity: "base",
    });
  });
}

function getAvailablePositionDisplayLabel(position = {}) {
  const normalizedPosition = normalizeAvailablePosition(position);
  const accountName =
    normalizedPosition.accountName || normalizedPosition.accountGhlName;

  return accountName
    ? `${normalizedPosition.positionTitle} — ${accountName}`
    : normalizedPosition.positionTitle;
}

function FieldLabel({ children }) {
  return (
    <label className="mb-1.5 block text-xs font-extrabold text-[#042C51]">
      <span>{children}</span>
    </label>
  );
}

function RequiredMark() {
  return <span className="text-[#E5484D]">*</span>;
}

function SiBSBrandLogo({ className = "h-6 sm:h-7 w-auto" }) {
  return (
    <svg
      viewBox="0 0 408 135"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="SiBS"
    >
      {/* S */}
      <path
        d="M58.9314 133.756C19.108 133.756 0.17858 115.363 0 91.6115H12.5006C13.9292 113.934 31.6086 123.934 59.2885 123.934C89.2899 123.934 103.933 114.291 103.933 96.4331C103.933 74.4678 86.0755 72.3248 58.217 69.6461C21.4296 65.896 4.82166 58.0385 4.82166 35.8946C4.82166 12.322 27.3227 0 58.3956 0C92.3258 0 112.684 15.1793 113.934 37.6804H101.076C100.183 20.3581 82.6825 9.8219 58.7528 9.8219C31.2515 9.8219 18.0366 19.108 18.0366 35.0017C18.0366 51.7882 32.323 55.3598 62.5029 58.7528C88.397 61.4315 117.327 63.2173 117.327 95.7188C117.327 119.291 96.9689 133.756 58.9314 133.756Z"
        fill="#042C51"
      />
      {/* i dot & stem */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M130.912 1.78577V22.1439H142.519V1.78577H130.912Z"
        fill="#042C51"
      />
      <path
        d="M130.912 131.97V39.2875H142.519V131.97H130.912Z"
        fill="#042C51"
      />
      {/* B */}
      <path
        d="M165.943 131.97V1.78577H238.267C263.804 1.78577 278.984 11.7862 278.984 34.1087C278.984 49.1094 270.412 61.0743 253.982 64.4673V65.5388C272.019 67.8603 282.912 79.468 282.912 96.7903C282.912 119.113 267.376 131.97 237.732 131.97H165.943ZM238.625 11.4291H177.907V60.8957H238.089C257.554 60.8957 265.769 51.7881 265.769 39.2875V32.3229C265.769 18.0365 255.59 11.4291 238.625 11.4291ZM238.625 70.1819H177.907V122.327H237.732C258.983 122.327 269.34 113.398 269.34 98.576V92.3258C269.34 78.2179 257.911 70.1819 238.625 70.1819Z"
        fill="#042C51"
      />
      {/* S */}
      <path
        d="M349.242 133.756C309.419 133.756 290.489 115.363 290.311 91.6115H302.811C304.24 113.934 321.92 123.934 349.599 123.934C379.601 123.934 394.244 114.291 394.244 96.4331C394.244 74.4678 376.386 72.3248 348.528 69.6461C311.74 65.896 295.133 58.0385 295.133 35.8946C295.133 12.322 317.634 0 348.706 0C382.637 0 402.995 15.1793 404.245 37.6804H391.387C390.494 20.3581 372.993 9.8219 349.064 9.8219C321.562 9.8219 308.347 19.108 308.347 35.0017C308.347 51.7882 322.634 55.3598 352.814 58.7528C378.708 61.4315 407.638 63.2173 407.638 95.7188C407.638 119.291 387.28 133.756 349.242 133.756Z"
        fill="#042C51"
      />
    </svg>
  );
}

function PublicWebsiteNavbar({ completionPercentage }) {
  return (
    <header className="sticky top-0 z-[500] border-b border-[#DCE6F1] bg-white text-[#042C51]">
      <div className="mx-auto flex min-h-16 w-full max-w-[1120px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <a
            href="https://sibscontactcenter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center rounded-md outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#042C51] focus-visible:ring-offset-2"
            title="SiBS Contact Center"
          >
            <SiBSBrandLogo className="h-6 w-auto sm:h-7" />
          </a>

          <div className="min-w-0 border-l border-slate-200 pl-3">
            <p className="font-heading text-sm font-bold leading-none text-[#042C51] sm:text-base">
              Careers
            </p>
            <p className="mt-1 hidden truncate text-xs font-semibold text-[#667085] sm:block">
              Candidate application
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <a
            href="https://sibscontactcenter.com/#faq"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden min-h-11 items-center rounded-md px-2 text-xs font-bold text-[#344054] transition-colors hover:text-[#FF5C28] focus-visible:ring-2 focus-visible:ring-[#042C51] focus-visible:ring-offset-2 sm:inline-flex"
          >
            Help &amp; FAQ
          </a>
          <span className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md border border-[#F2D6CC] bg-[#FFF7F3] px-2.5 text-[10px] font-extrabold text-[#042C51] sm:px-3 sm:text-xs">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full bg-[#FF5C28]"
            />
            <span className="sm:hidden">In progress</span>
            <span className="hidden sm:inline">Application in progress</span>
          </span>
        </div>
      </div>

      <div
        className="h-0.5 bg-[#EDF1F6]"
        role="progressbar"
        aria-label="Form completion"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={completionPercentage}
      >
        <div
          className="h-full w-full origin-left bg-[#FF5C28] transition-transform duration-500 ease-out"
          style={{ transform: `scaleX(${completionPercentage / 100})` }}
        />
      </div>
    </header>
  );
}

function ApplicationPageTabs({
  visible,
  currentPage,
  isPageOneComplete,
  isLoadingPageTwo,
  onPageOneClick,
  onPageTwoClick,
}) {
  if (!visible) return null;

  const pageOneActive = currentPage === 1;
  const pageTwoActive = currentPage === 2;

  const tabClass = (active) =>
    `flex min-h-[38px] 2xl:min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-3 py-2 2xl:px-4 2xl:py-3 text-left text-xs font-extrabold transition 2xl:text-sm ${
      active
        ? "bg-[#042C51] text-white shadow-[0_8px_20px_rgba(4,44,81,0.18)]"
        : "bg-white text-[#344054] hover:bg-[#F8FAFC]"
    }`;

  const numberClass = (active) =>
    `inline-flex h-5 w-5 2xl:h-6 2xl:w-6 shrink-0 items-center justify-center rounded-full text-[10px] 2xl:text-[11px] font-black ${
      active
        ? "bg-[#FF5C28] text-white"
        : "bg-[#E9EEF5] text-[#667085]"
    }`;

  return (
    <nav
      data-testid="public-application-page-tabs"
      aria-label="Public Talent Pool application pages"
      className="grid grid-cols-1 gap-2 rounded-2xl border border-[#DCE6F1] bg-white p-1.5 shadow-[0_8px_24px_rgba(4,44,81,0.06)] sm:grid-cols-2 2xl:p-2"
    >
      <button
        type="button"
        onClick={onPageOneClick}
        aria-current={pageOneActive ? "step" : undefined}
        className={tabClass(pageOneActive)}
      >
        <span className={numberClass(pageOneActive)}>1</span>
        <span className="min-w-0 truncate">Page 1: Master Candidate Profile</span>
        {isPageOneComplete ? (
          <CircleCheckBig
            size={15}
            className={pageOneActive ? "text-emerald-300" : "text-emerald-500"}
          />
        ) : null}
      </button>

      <button
        type="button"
        onClick={onPageTwoClick}
        disabled={isLoadingPageTwo}
        aria-current={pageTwoActive ? "step" : undefined}
        className={`${tabClass(pageTwoActive)} disabled:cursor-wait disabled:opacity-60`}
      >
        <span className={numberClass(pageTwoActive)}>2</span>
        <span className="min-w-0 truncate">Page 2: Position Screening Questions</span>
        <span
          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide 2xl:px-2 2xl:py-1 ${
            pageTwoActive
              ? "bg-[#FF5C28]/20 text-[#FF8B66]"
              : "bg-[#FFF0EB] text-[#E6531B]"
          }`}
        >
          JD FORM
        </span>
      </button>
    </nav>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  step,
  totalSteps = 9,
  children,
}) {
  return (
    <section
      data-testid="public-application-section-card"
      className="sibs-page-card-in relative overflow-visible rounded-2xl border border-[#E6ECF2] bg-white shadow-[0_8px_24px_rgba(4,44,81,0.05)]"
    >
      <div className="flex flex-col gap-2.5 border-b border-[#F1F5F9] px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5 sm:py-3.5 2xl:gap-3 2xl:px-6 2xl:py-4">
        <div className="flex min-w-0 items-start gap-2.5 2xl:gap-3">
          {Icon && (
            <div className="flex h-8 w-8 2xl:h-10 2xl:w-10 shrink-0 items-center justify-center rounded-lg 2xl:rounded-xl bg-[#FFF0EB] text-[#FF5C28]">
              <Icon size={16} className="2xl:h-[18px] 2xl:w-[18px]" />
            </div>
          )}

          <div className="min-w-0">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51] 2xl:text-sm">
              {title}
            </h3>
            {description && (
              <p className="mt-0.5 text-[11px] font-semibold leading-4 text-[#667085] sm:text-xs 2xl:mt-1 2xl:leading-5">
                {description}
              </p>
            )}
          </div>
        </div>

        {step ? (
          <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-[#DCE6F1] bg-[#F8FAFC] px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#667085] 2xl:px-3 2xl:py-1 2xl:text-[10px]">
            Step {step} of {totalSteps}
          </span>
        ) : null}
      </div>

      <div className="p-4 sm:p-5 2xl:p-6">{children}</div>
    </section>
  );
}

function EmptyOptionNotice({ message = "No options configured in database." }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
      {message}
    </div>
  );
}

function HiringNeedsDropdown({
  value,
  onChange,
  options,
  placeholder = "Select option",
  required = true,
  disabled = false,
  zIndex = "z-[90]",
  renderOptionAction = null,
}) {
  const dropdownRef = useRef(null);
  const dropdownPanelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const normalizedOptions = normalizeDropdownOptions(options);
  const selectedOption = normalizedOptions.find(
    (option) => String(option.value) === String(value || ""),
  );

  const displayText = selectedOption?.label || placeholder;

  useEffect(() => {
    function handleClickOutside(event) {
      if (!dropdownRef.current) return;

      if (
        !dropdownRef.current.contains(event.target) &&
        !dropdownPanelRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!open || !dropdownRef.current) return;

    function updatePanelPosition() {
      const rect = dropdownRef.current.getBoundingClientRect();
      const gutter = 12;
      const panelWidth = rect.width;
      const maxLeft = window.innerWidth - panelWidth - gutter;

      setPanelPosition({
        top: rect.bottom + 8,
        left: Math.max(gutter, Math.min(rect.left, maxLeft)),
        width: panelWidth,
      });
    }

    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open]);

  function handleSelect(nextValue) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div
      ref={dropdownRef}
      className={`relative min-w-0 ${open ? zIndex : "z-[1]"}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-9 2xl:h-10 w-full min-w-0 items-center justify-between gap-2.5 2xl:gap-3 rounded-[10px] border bg-[#F8FAFC] px-2.5 2xl:px-3 text-left text-xs font-semibold outline-none transition ${
          open
            ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10"
            : "border-[#D7DEE8] hover:border-[#FF5C28]/40 hover:bg-white"
        } ${
          disabled
            ? "cursor-not-allowed bg-[#F8FAFC] text-[#98A2B3] opacity-70"
            : "text-[#042C51]"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selectedOption ? "text-[#042C51]" : "text-[#98A2B3]"
          }`}
        >
          {displayText}
        </span>

        <ChevronDown
          size={16}
          className={`shrink-0 text-[#FF5C28] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {required && (
        <input
          tabIndex={-1}
          value={selectedOption?.value || ""}
          onChange={() => {}}
          required
          className="pointer-events-none absolute bottom-0 left-0 h-px w-px opacity-0"
        />
      )}

      {open && !disabled
        ? createPortal(
            <div
              ref={dropdownPanelRef}
              className="sibs-profile-dropdown-panel fixed z-[100000] overflow-hidden rounded-[10px] border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]"
              style={{
                left: `${panelPosition.left}px`,
                top: `${panelPosition.top}px`,
                width: `${panelPosition.width}px`,
              }}
            >
              <div className="max-h-72 overflow-y-auto">
                {normalizedOptions.length > 0 ? (
                  normalizedOptions.map((option) => {
                    const active = String(option.value) === String(value || "");

                    return (
                      <div
                        key={option.id || option.value}
                        className={`flex w-full min-w-0 items-stretch border-b border-[#EEF2F6] last:border-b-0 ${
                          active ? "bg-[#FFF0EB]" : "bg-white"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelect(option.value)}
                          className={`min-w-0 flex-1 px-3 py-2.5 text-left text-xs font-semibold transition ${
                            active
                              ? "text-[#FF5C28]"
                              : "text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                          }`}
                        >
                          <span className="block min-w-0 truncate">
                            {option.label}
                          </span>
                        </button>

                        {typeof renderOptionAction === "function" ? (
                          <div className="flex shrink-0 items-center border-l border-[#EEF2F6] px-1.5">
                            {renderOptionAction(option)}
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <div className="px-3 py-2.5 text-xs font-semibold text-[#98A2B3]">
                    No options found.
                  </div>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function PositionJobDescriptionDropdown({
  value,
  onChange,
  positions = [],
  placeholder = "Select open position",
  disabled = false,
  onOpenJobDescription,
  openingKeys = [],
}) {
  const dropdownRef = useRef(null);
  const dropdownPanelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const cleanPositions = toArray(positions).filter((position) =>
    cleanText(position?.positionTitle || position?.position_title),
  );

  const selectedPosition = cleanPositions.find(
    (position) => String(getPositionKey(position)) === String(value || ""),
  );

  const displayText = selectedPosition
    ? getAvailablePositionDisplayLabel(selectedPosition)
    : placeholder;

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        !dropdownRef.current?.contains(event.target) &&
        !dropdownPanelRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!open || !dropdownRef.current) return;

    function updatePanelPosition() {
      const rect = dropdownRef.current.getBoundingClientRect();
      const gutter = 12;
      const panelWidth = rect.width;
      const maxLeft = window.innerWidth - panelWidth - gutter;

      setPanelPosition({
        top: rect.bottom + 8,
        left: Math.max(gutter, Math.min(rect.left, maxLeft)),
        width: panelWidth,
      });
    }

    updatePanelPosition();

    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open]);

  function handleSelect(position) {
    const positionKey = getPositionKey(position);

    if (!positionKey) return;

    onChange(positionKey, position);
    setOpen(false);
  }

  return (
    <div
      ref={dropdownRef}
      className={`relative min-w-0 ${open ? "z-[200]" : "z-[1]"}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-9 2xl:h-10 w-full min-w-0 items-center justify-between gap-2.5 2xl:gap-3 rounded-[10px] border bg-[#F8FAFC] px-2.5 2xl:px-3 text-left text-xs font-semibold outline-none transition ${
          open
            ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10"
            : "border-[#D7DEE8] hover:border-[#FF5C28]/40 hover:bg-white"
        } ${
          disabled
            ? "cursor-not-allowed bg-[#F8FAFC] text-[#98A2B3] opacity-70"
            : "text-[#042C51]"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selectedPosition ? "text-[#042C51]" : "text-[#98A2B3]"
          }`}
        >
          {displayText}
        </span>

        <ChevronDown
          size={16}
          className={`shrink-0 text-[#FF5C28] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <input
        tabIndex={-1}
        value={selectedPosition ? getPositionKey(selectedPosition) : ""}
        onChange={() => {}}
        required
        className="pointer-events-none absolute bottom-0 left-0 h-px w-px opacity-0"
      />

      {open && !disabled
        ? createPortal(
            <div
              ref={dropdownPanelRef}
              className="sibs-profile-dropdown-panel fixed z-[100000] overflow-hidden rounded-[10px] border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]"
              style={{
                left: `${panelPosition.left}px`,
                top: `${panelPosition.top}px`,
                width: `${panelPosition.width}px`,
              }}
            >
              <div className="max-h-72 overflow-y-auto">
                {cleanPositions.length > 0 ? (
                  cleanPositions.map((position) => {
                    const positionTitle = cleanText(
                      position?.positionTitle || position?.position_title,
                    );

                    const positionKey =
                      getPositionKey(position) || positionTitle;

                    const active =
                      String(positionKey) === String(value || "");

                    const isOpening = openingKeys.includes(positionKey);

                    return (
                      <div
                        key={positionKey}
                        className={`flex w-full min-w-0 items-center border-b border-[#EEF2F6] last:border-b-0 ${
                          active ? "bg-[#FFF0EB]" : "bg-white"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelect(position)}
                          className={`min-w-0 flex-1 px-3 py-3 text-left text-xs font-semibold transition ${
                            active
                              ? "text-[#FF5C28]"
                              : "text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                          }`}
                        >
                          <span className="block min-w-0 truncate">
                            {getAvailablePositionDisplayLabel(position)}
                          </span>
                        </button>

                        <div className="flex shrink-0 items-center px-2">
                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              onOpenJobDescription?.(position);
                            }}
                            disabled={isOpening}
                            title={`Open ${positionTitle} job description`}
                            aria-label={`Open ${positionTitle} job description`}
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-transparent text-[#7A8CA1] transition hover:border-[#E6ECF2] hover:bg-[#F8FAFC] hover:text-[#E84A17] focus:outline-none focus:ring-2 focus:ring-[#FF5C28]/10 disabled:cursor-wait disabled:border-transparent disabled:bg-transparent disabled:text-[#B6C0CC]"
                          >
                            {isOpening ? (
                              <Loader2
                                size={15}
                                strokeWidth={2.2}
                                className="animate-spin"
                              />
                            ) : (
                              <ExternalLink size={15} strokeWidth={2.2} />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-3 py-3 text-xs font-semibold text-[#98A2B3]">
                    No matching open positions found.
                  </div>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function CalendarHeaderDropdown({
  value,
  options = [],
  onChange,
  className = "",
  menuClassName = "",
}) {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value),
  );
  const displayText = selectedOption?.label || "Select";

  useEffect(() => {
    function handleClickOutside(event) {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSelect(nextValue) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div ref={dropdownRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-8 w-full min-w-0 items-center justify-between gap-1.5 rounded-lg border bg-[#F8FAFC] px-2.5 text-left text-xs font-semibold outline-none transition ${
          open
            ? "border-[#FF5C28] bg-white ring-2 ring-[#FF5C28]/10"
            : "border-[#D7DEE8] hover:border-[#FF5C28]/40 hover:bg-white"
        } text-[#042C51]`}
      >
        <span className="min-w-0 flex-1 truncate">{displayText}</span>

        <ChevronDown
          size={13}
          className={`shrink-0 text-[#FF5C28] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className={`sibs-profile-dropdown-panel absolute left-0 top-[calc(100%+6px)] z-[100000] overflow-hidden rounded-xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)] ${menuClassName}`}
        >
          <div className="max-h-60 overflow-y-auto">
            {options.map((option) => {
              const active = String(option.value) === String(value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`block w-full px-3 py-2 text-left text-xs font-semibold transition ${
                    active
                      ? "bg-[#FFF0EB] text-[#FF5C28] font-bold"
                      : "bg-white text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                  }`}
                >
                  <span className="block min-w-0 truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  hasError = false,
  required = false,
}) {
  const calendarRef = useRef(null);
  const calendarPanelRef = useRef(null);
  const selectedDate = parseDateInputValue(value);
  const today = new Date();

  const currentYear = today.getFullYear();
  const minimumYear = currentYear - 80;
  const maximumYear = currentYear;

  const monthOptions = monthNames.map((month, index) => ({
    value: index,
    label: month,
  }));

  const yearOptions = [];

  for (let year = maximumYear; year >= minimumYear; year -= 1) {
    yearOptions.push({
      value: year,
      label: String(year),
    });
  }

  const [open, setOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState({
    top: 0,
    left: 0,
    width: 330,
  });
  const [displayDate, setDisplayDate] = useState(
    selectedDate || new Date(currentYear - 18, today.getMonth(), 1),
  );

  const calendarDays = useMemo(
    () => buildCalendarDays(displayDate),
    [displayDate],
  );

  const displayText = value ? formatDateDisplay(value) : placeholder;

  useEffect(() => {
    function handleClickOutside(event) {
      if (!calendarRef.current) return;

      if (
        !calendarRef.current.contains(event.target) &&
        !calendarPanelRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function updateCalendarPanelPosition() {
    if (!calendarRef.current) return;

    const rect = calendarRef.current.getBoundingClientRect();
    const panelWidth = 330;
    const gutter = 12;
    const maxLeft = window.innerWidth - panelWidth - gutter;

    setPanelPosition({
      top: rect.bottom + 8,
      left: Math.max(gutter, Math.min(rect.left, maxLeft)),
      width: panelWidth,
    });
  }

  useEffect(() => {
    if (!open || !calendarRef.current) return;

    updateCalendarPanelPosition();
    window.addEventListener("resize", updateCalendarPanelPosition);
    window.addEventListener("scroll", updateCalendarPanelPosition, true);

    return () => {
      window.removeEventListener("resize", updateCalendarPanelPosition);
      window.removeEventListener("scroll", updateCalendarPanelPosition, true);
    };
  }, [open]);

  function goPreviousMonth() {
    setDisplayDate(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() - 1, 1),
    );
  }

  function goNextMonth() {
    setDisplayDate(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() + 1, 1),
    );
  }

  function handleMonthChange(monthIndex) {
    const nextDate = resolveCalendarSelectionChange({
      selectedDate,
      displayDate,
      nextMonth: Number(monthIndex),
    });

    setDisplayDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));

    if (selectedDate) {
      onChange(toDateInputValue(nextDate));
    }
  }

  function handleYearChange(year) {
    const nextDate = resolveCalendarSelectionChange({
      selectedDate,
      displayDate,
      nextYear: Number(year),
    });

    setDisplayDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));

    if (selectedDate) {
      onChange(toDateInputValue(nextDate));
    }
  }

  function handleSelectDate(date) {
    onChange(toDateInputValue(date));
    setOpen(false);
  }

  function handleClear() {
    onChange("");
    setOpen(false);
  }

  function handleToday() {
    onChange(toDateInputValue(today));
    setDisplayDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setOpen(false);
  }

  function handleToggleOpen() {
    if (open) {
      setOpen(false);
      return;
    }

    if (selectedDate) {
      setDisplayDate(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
      );
    }

    updateCalendarPanelPosition();
    setOpen(true);
  }

  return (
    <div ref={calendarRef} className="relative z-[220] min-w-0">
      {required ? (
        <input
          tabIndex={-1}
          value={value || ""}
          onChange={() => {}}
          required
          disabled={disabled}
          aria-label="Date of Birth"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        />
      ) : null}

      <button
        type="button"
        disabled={disabled}
        onClick={handleToggleOpen}
        className={`flex h-9 2xl:h-11 w-full min-w-0 items-center justify-between gap-2.5 2xl:gap-3 rounded-[10px] border bg-[#F8FAFC] px-2.5 2xl:px-3 text-left text-xs font-semibold outline-none transition ${
          open
            ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10"
            : hasError
              ? "border-red-300 hover:border-red-500"
              : "border-[#D7DEE8] hover:border-[#FF5C28]/40 hover:bg-white"
        } ${
          disabled
            ? "cursor-not-allowed bg-gray-50 text-gray-400 opacity-70"
            : "text-[#042C51]"
        }`}
      >
        <span className="inline-flex min-w-0 flex-1 items-center gap-2 truncate">
          <CalendarDays
            size={15}
            className="shrink-0 text-[#042C51] 2xl:h-4 2xl:w-4"
          />

          <span
            className={`min-w-0 truncate ${
              value ? "text-[#042C51]" : "text-[#667085]"
            }`}
          >
            {displayText}
          </span>
        </span>

        <ChevronDown
          size={15}
          className={`shrink-0 text-[#FF5C28] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled
        ? createPortal(
            <div
              ref={calendarPanelRef}
              className="sibs-profile-dropdown-panel fixed z-[100000] overflow-visible rounded-2xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]"
              style={{
                left: `${panelPosition.left}px`,
                top: `${panelPosition.top}px`,
                width: `${panelPosition.width}px`,
              }}
            >
              <div className="flex items-center justify-between border-b border-[#E6ECF2] px-3.5 py-2.5">
                <button
                  type="button"
                  onClick={goPreviousMonth}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#042C51] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="grid min-w-0 flex-1 grid-cols-[1fr_90px] gap-2 px-2">
                  <CalendarHeaderDropdown
                    value={displayDate.getMonth()}
                    options={monthOptions}
                    onChange={handleMonthChange}
                    className="z-[100002]"
                    menuClassName="w-[160px]"
                  />

                  <CalendarHeaderDropdown
                    value={displayDate.getFullYear()}
                    options={yearOptions}
                    onChange={handleYearChange}
                    className="z-[100001]"
                    menuClassName="w-[110px]"
                  />
                </div>

                <button
                  type="button"
                  onClick={goNextMonth}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#042C51] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="px-3.5 py-3">
                <div className="grid grid-cols-7 gap-1">
                  {weekdayLabels.map((dayLabel) => (
                    <div
                      key={dayLabel}
                      className="flex h-7 items-center justify-center text-[10px] 2xl:text-[11px] font-extrabold uppercase text-[#667085]"
                    >
                      {dayLabel}
                    </div>
                  ))}

                  {calendarDays.map((day) => {
                    const active =
                      selectedDate && isSameDate(day.date, selectedDate);
                    const currentDay = isSameDate(day.date, today);

                    return (
                      <button
                        key={day.dateValue}
                        type="button"
                        onClick={() => handleSelectDate(day.date)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold transition ${
                          active
                            ? "bg-[#FF5C28] text-white shadow-sm ring-2 ring-[#FF5C28]/20"
                            : currentDay
                              ? "border border-[#FF5C28] bg-[#FFF0EB] text-[#FF5C28]"
                              : day.isCurrentMonth
                                ? "text-[#042C51] hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
                                : "text-[#98A2B3] hover:bg-[#F8FAFC]"
                        }`}
                      >
                        {day.dayNumber}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#E6ECF2] px-4 py-2.5">
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-lg px-2.5 py-1 text-xs font-extrabold text-[#667085] transition hover:bg-red-50 hover:text-[#E74C3C]"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={handleToday}
                  className="rounded-lg border border-[#FFD6C7] bg-[#FFF0EB] px-3 py-1 text-xs font-extrabold text-[#FF5C28] transition hover:bg-[#FF5C28] hover:text-white"
                >
                  Today
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function SchoolYearSearchableDropdown({
  value,
  onChange,
  required = true,
  placeholder = "Search and select school year",
  zIndex = "z-[180]",
}) {
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const schoolYearOptions = useMemo(() => buildSchoolYearOptions(), []);
  const normalizedValue = normalizeSchoolYearValue(value);

  const selectedOption =
    schoolYearOptions.find(
      (option) => String(option.value) === String(normalizedValue),
    ) ||
    (isValidSchoolYearRange(normalizedValue)
      ? {
          id: normalizedValue,
          value: normalizedValue,
          label: normalizedValue,
        }
      : null);

  const normalizedSearchTerm = searchTerm
    .trim()
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, "");

  const matchingOptions = schoolYearOptions.filter((option) => {
    if (!normalizedSearchTerm) return true;

    return option.label
      .toLowerCase()
      .replace(/\s+/g, "")
      .includes(normalizedSearchTerm);
  });

  const selectedMatchesSearch =
    selectedOption &&
    (!normalizedSearchTerm ||
      selectedOption.label
        .toLowerCase()
        .replace(/\s+/g, "")
        .includes(normalizedSearchTerm));

  const visibleOptions = selectedMatchesSearch
    ? [
        selectedOption,
        ...matchingOptions.filter(
          (option) => option.value !== selectedOption.value,
        ),
      ]
    : matchingOptions;

  useEffect(() => {
    function handleClickOutside(event) {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(event.target)) {
        setOpen(false);
        setSearchTerm("");
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
        setSearchTerm("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function openSearch() {
    setSearchTerm("");
    setOpen(true);

    window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  }

  function closeSearch() {
    setOpen(false);
    setSearchTerm("");
  }

  function handleToggle() {
    if (open) {
      closeSearch();
      return;
    }

    openSearch();
  }

  function handleSelect(nextValue) {
    onChange(nextValue);
    closeSearch();
  }

  function handleInputFocus() {
    if (!open) {
      openSearch();
    }
  }

  function handleInputChange(event) {
    if (!open) {
      setOpen(true);
    }

    setSearchTerm(event.target.value);
  }

  function handleInputKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();

      if (visibleOptions.length > 0) {
        handleSelect(visibleOptions[0].value);
      }

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
    }
  }

  const inputValue = open ? searchTerm : selectedOption?.label || "";

  return (
    <div
      ref={dropdownRef}
      className={`relative min-w-0 ${open ? zIndex : "z-[1]"}`}
    >
      <div
        className={`flex h-9 2xl:h-11 w-full min-w-0 items-center gap-2.5 2xl:gap-3 rounded-[10px] border bg-[#F8FAFC] px-2.5 2xl:px-3 text-xs font-semibold outline-none transition ${
          open
            ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10"
            : "border-[#D7DEE8] hover:border-[#FF5C28]/40 hover:bg-white"
        }`}
      >
        <Search size={15} className="shrink-0 text-[#042C51] 2xl:h-4 2xl:w-4" />

        <input
          ref={searchInputRef}
          type="text"
          autoComplete="off"
          value={inputValue}
          onFocus={handleInputFocus}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder={open ? "Search school year" : placeholder}
          aria-expanded={open}
          aria-haspopup="listbox"
          className={`h-full min-w-0 flex-1 border-0 bg-transparent text-xs font-semibold outline-none placeholder:normal-case placeholder:text-[#667085] ${
            selectedOption && !open ? "text-[#042C51]" : "text-[#344054]"
          }`}
        />

        <button
          type="button"
          onClick={handleToggle}
          aria-label={
            open ? "Close school year options" : "Open school year options"
          }
          className="flex h-7 w-7 2xl:h-8 2xl:w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
        >
          <ChevronDown
            size={15}
            className={`text-[#FF5C28] transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {required && (
        <input
          tabIndex={-1}
          value={normalizedValue}
          onChange={() => {}}
          required
          className="pointer-events-none absolute bottom-0 left-0 h-px w-px opacity-0"
        />
      )}

      {open && (
        <div className="sibs-profile-dropdown-panel absolute left-0 right-0 top-[calc(100%+8px)] z-[99999] overflow-hidden rounded-[10px] border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="max-h-64 overflow-y-auto" role="listbox">
            {visibleOptions.length > 0 ? (
              visibleOptions.map((option) => {
                const active = option.value === normalizedValue;

                return (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => handleSelect(option.value)}
                    className={`block w-full px-3 py-2.5 text-left text-xs font-semibold transition ${
                      active
                        ? "bg-[#FFF0EB] text-[#FF5C28]"
                        : "bg-white text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-4 text-sm font-semibold text-gray-400">
                No school year found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EducationSchoolFields({ section, value, onChange }) {
  const school = getEducationSchoolDraft(value);

  function updateField(field, nextValue) {
    const normalizedValue =
      field === "schoolYearGraduated"
        ? normalizeSchoolYearInputValue(nextValue)
        : String(nextValue ?? "");

    onChange({
      ...school,
      [field]: normalizedValue,
    });
  }

  return (
    <div className="rounded-xl border border-[#DCE6F1] bg-white p-3.5 sm:p-4 2xl:p-5 shadow-[0_2px_8px_rgba(4,44,81,0.03)] font-jakarta">
      <div className="flex flex-col">
        <h4 className="text-xs sm:text-sm font-extrabold text-[#042C51]">
          {section.title}
        </h4>
        <p className="mt-0.5 text-[11px] sm:text-xs font-semibold leading-4 text-[#667085] 2xl:leading-5">
          Complete all required information for this school level.
        </p>
      </div>

      <div className="mt-3.5 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
        <div>
          <FieldLabel>
            {section.schoolNameLabel || `${section.title} Name`}{" "}
            <RequiredMark />
          </FieldLabel>
          <input
            required
            value={school.schoolName}
            onChange={(event) => updateField("schoolName", event.target.value)}
            placeholder={`Enter ${String(
              section.schoolNameLabel || `${section.title} name`,
            ).toLowerCase()}`}
            className={inputClass()}
          />
        </div>

        <div>
          <FieldLabel>
            {section.title} Address <RequiredMark />
          </FieldLabel>
          <input
            required
            value={school.address}
            onChange={(event) => updateField("address", event.target.value)}
            placeholder="Complete school address"
            className={inputClass()}
          />
        </div>

        {section.requireCourse && (
          <div>
            <FieldLabel>
              {section.courseLabel || "Course or Program"} <RequiredMark />
            </FieldLabel>
            <input
              required
              value={school.course}
              onChange={(event) => updateField("course", event.target.value)}
              placeholder={`Enter ${String(
                section.courseLabel || "course or program",
              ).toLowerCase()}`}
              className={inputClass()}
            />
          </div>
        )}

        {section.requireYear !== false && (
          <div>
            <FieldLabel>
              School Year Graduated <RequiredMark />
            </FieldLabel>
            <SchoolYearSearchableDropdown
              required
              value={school.schoolYearGraduated}
              onChange={(nextValue) =>
                updateField("schoolYearGraduated", nextValue)
              }
              placeholder="Search and select school year"
            />
            <p className="mt-1.5 text-[11px] sm:text-xs font-semibold leading-4 text-[#667085]">
              Search using either the starting or ending year.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function EducationDetailsFields({ attainment, details, onChange }) {
  const config = getEducationAttainmentConfig(attainment);
  const educationDetails = getEducationDetailsDraft(details);

  if (!config) return null;

  function updateSection(sectionKey, nextSection) {
    onChange({
      ...educationDetails,
      [sectionKey]: getEducationSchoolDraft(nextSection),
    });
  }

  function handleSeniorHighAttendanceChange(checked) {
    onChange({
      ...educationDetails,
      attendedSeniorHighSchool: checked,
      seniorHighSchool: checked
        ? educationDetails.seniorHighSchool
        : createEmptyEducationSchool(),
    });
  }

  const seniorHighSection = {
    key: "seniorHighSchool",
    title: "Senior High School",
    schoolNameLabel: "Senior High School Name",
    requireYear: true,
  };

  return (
    <div className="space-y-3.5 rounded-2xl border border-[#DCE6F1] bg-[#F8FAFC] p-3.5 sm:p-4.5 2xl:p-5 font-jakarta">
      <div>
        <p className="text-[10px] 2xl:text-[11px] font-extrabold uppercase tracking-wide text-[#E6531B]">
          Required Education Details
        </p>
        <p className="mt-0.5 text-[11px] sm:text-xs font-semibold leading-4 text-[#667085] 2xl:leading-5">
          The school fields below are based on the selected highest educational
          attainment. Every displayed school name and address is required.
        </p>
      </div>

      <div className="space-y-3.5">
        {config.sections.map((section) => (
          <React.Fragment key={section.key}>
            <EducationSchoolFields
              section={section}
              value={educationDetails[section.key]}
              onChange={(nextSection) =>
                updateSection(section.key, nextSection)
              }
            />

            {config.seniorHighMode === "optional" &&
              section.key === "highSchool" && (
                <>
                  <label className="group flex cursor-pointer items-start gap-2.5 rounded-xl border border-[#DCE6F1] bg-white p-3 sm:p-3.5 transition hover:border-[#FF5C28]/40 hover:bg-[#FFF9F6]">
                    <input
                      type="checkbox"
                      checked={educationDetails.attendedSeniorHighSchool}
                      onChange={(event) =>
                        handleSeniorHighAttendanceChange(event.target.checked)
                      }
                      className="mt-0.5 h-3.5 w-3.5 2xl:h-4 2xl:w-4 shrink-0 cursor-pointer rounded border-[#98A2B3] accent-[#FF5C28]"
                    />
                    <span>
                      <span className="block text-xs sm:text-sm font-extrabold text-[#042C51] transition group-hover:text-[#FF5C28]">
                        I attended Senior High School
                      </span>
                      <span className="mt-0.5 block text-[11px] sm:text-xs font-semibold leading-4 text-[#667085]">
                        Check this box to add the required Senior High School
                        name, address, and school year graduated.
                      </span>
                    </span>
                  </label>

                  {educationDetails.attendedSeniorHighSchool && (
                    <EducationSchoolFields
                      section={seniorHighSection}
                      value={educationDetails.seniorHighSchool}
                      onChange={(nextSection) =>
                        updateSection("seniorHighSchool", nextSection)
                      }
                    />
                  )}
                </>
              )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function MultiSelectCheckboxGroup({
  options,
  values,
  onChange,
  disabled = false,
  required = false,
}) {
  function toggleValue(optionValue) {
    if (disabled) return;

    if (values.includes(optionValue)) {
      onChange(values.filter((item) => item !== optionValue));
      return;
    }

    onChange([...values, optionValue]);
  }

  if (!options.length) {
    return <EmptyOptionNotice />;
  }

  return (
    <div className="grid grid-cols-1 gap-1.5 rounded-[12px] border border-[#DCE6F1] bg-[#F8FAFC] p-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:gap-2 2xl:p-3">
      {options.map((option) => {
        const optionValue = getOptionValue(option);
        const optionLabel = getOptionLabel(option);
        const checked = values.includes(optionValue);

        return (
          <label
            key={option?.id || optionValue}
            className={`group flex items-start gap-2 rounded-[10px] border px-2.5 py-1.5 text-xs transition 2xl:gap-2.5 2xl:px-3 2xl:py-2.5 ${
              disabled
                ? checked
                  ? "cursor-not-allowed border-emerald-200 bg-emerald-50 font-extrabold text-emerald-800 shadow-sm"
                  : "cursor-not-allowed border-[#E6ECF2] bg-[#F8FAFC] font-bold text-[#98A2B3] opacity-70"
                : checked
                  ? "cursor-pointer border-[#FF5C28] bg-[#FFF0EB] font-extrabold text-[#042C51] shadow-sm"
                  : "cursor-pointer border-[#DCE6F1] bg-white font-bold text-[#344054] hover:border-[#FF5C28]/40 hover:bg-[#FFF9F6] hover:text-[#FF5C28]"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={() => toggleValue(optionValue)}
              className={`mt-0.5 h-3.5 w-3.5 2xl:h-4 2xl:w-4 shrink-0 rounded border-[#98A2B3] ${
                disabled
                  ? "cursor-not-allowed accent-emerald-600"
                  : "cursor-pointer accent-[#FF5C28]"
              }`}
            />
            <span className="leading-tight 2xl:leading-5">{optionLabel}</span>
          </label>
        );
      })}
    </div>
  );
}

function ChoiceCardGroup({
  value,
  onChange,
  options,
  required = true,
  columns = "grid-cols-2",
}) {
  const normalizedOptions = normalizeDropdownOptions(options);

  if (!normalizedOptions.length) {
    return <EmptyOptionNotice />;
  }

  return (
    <div className={`relative grid gap-1.5 2xl:gap-2 ${columns}`}>
      {normalizedOptions.map((option) => {
        const active = String(option.value) === String(value || "");

        return (
          <button
            key={option.id || option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`min-h-9 2xl:min-h-10 rounded-[10px] border px-2.5 py-1.5 2xl:px-3 2xl:py-2 text-xs font-extrabold transition ${
              active
                ? "border-[#FF5C28] bg-[#FFF0EB] text-[#FF5C28] shadow-sm"
                : "border-[#DCE6F1] bg-[#F8FAFC] text-[#344054] hover:border-[#FF5C28]/40 hover:bg-[#FFF9F6] hover:text-[#FF5C28]"
            }`}
            aria-pressed={active}
          >
            {option.label}
          </button>
        );
      })}

      {required ? (
        <input
          tabIndex={-1}
          value={value || ""}
          onChange={() => {}}
          required
          className="pointer-events-none absolute h-px w-px opacity-0"
        />
      ) : null}
    </div>
  );
}

function RadioCardGroup({
  name,
  value,
  onChange,
  options,
  required = true,
  className = "",
  optionClassName = "min-w-[54px]",
}) {
  const normalizedOptions = normalizeDropdownOptions(options);

  if (!normalizedOptions.length) {
    return <EmptyOptionNotice />;
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 sm:justify-end ${className}`}
      role="radiogroup"
      aria-required={required}
    >
      {normalizedOptions.map((option) => {
        const optionValue = String(option.value);
        const active = optionValue === String(value || "");

        return (
          <label
            key={option.id || option.value}
            className={`group inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-full border px-4 text-xs font-semibold transition ${optionClassName} ${
              active
                ? "border-[#FF5C28] bg-[#FFF0EB] text-[#FF5C28] shadow-sm"
                : "border-[#DCE6F1] bg-white text-[#52637A] hover:border-[#FF5C28]/40 hover:bg-[#FFF9F6] hover:text-[#FF5C28]"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={optionValue}
              checked={active}
              required={required}
              onChange={() => onChange(option.value)}
              className="h-3.5 w-3.5 shrink-0 cursor-pointer border-[#98A2B3] accent-[#FF5C28]"
            />

            <span className="whitespace-nowrap">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function WorkReadinessQuestion({
  question,
  name,
  value,
  options,
  onChange,
  required = true,
  className = "",
  radioClassName = "",
  optionClassName,
}) {
  return (
    <div
      className={`grid grid-cols-1 gap-3 rounded-xl border border-[#DCE6F1] bg-white px-4 py-3 transition hover:border-[#C9D7E6] hover:bg-[#FCFDFE] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${className}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#D3DEEA]"
        />

        <div className="min-w-0 text-xs font-extrabold leading-5 text-[#042C51]">
          {question} {required ? <RequiredMark /> : null}
        </div>
      </div>

      <RadioCardGroup
        name={name}
        value={value}
        options={options}
        required={required}
        onChange={onChange}
        className={`sm:justify-end ${radioClassName}`}
        optionClassName={optionClassName}
      />
    </div>
  );
}

function DatabaseSelect({
  value,
  onChange,
  options,
  placeholder = "Select option",
  required = true,
  disabled = false,
  zIndex = "z-[90]",
  renderOptionAction = null,
}) {
  return (
    <HiringNeedsDropdown
      required={required}
      value={value}
      disabled={disabled}
      options={options}
      placeholder={placeholder}
      zIndex={zIndex}
      onChange={onChange}
      renderOptionAction={renderOptionAction}
    />
  );
}

function YesNoSelect({ value, onChange, options, required = true }) {
  return (
    <ChoiceCardGroup
      required={required}
      value={value}
      onChange={onChange}
      options={options}
    />
  );
}

function ExperienceFields({
  experience,
  onChange,
  lengthOptions,
  title = "Industry or Relevant Experience",
  showRemove = false,
  onRemove,
}) {
  return (
    <div className="sibs-page-card-in rounded-[12px] border border-[#DCE6F1] bg-[#F8FAFC] p-4 shadow-2xs transition-all duration-200 hover:border-[#C9D7E6] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="text-sm font-extrabold text-[#042C51]">{title}</h4>

        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-9 items-center justify-center rounded-[10px] border border-red-100 bg-white px-4 text-xs font-bold text-red-600 transition hover:bg-red-50"
          >
            Remove
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <FieldLabel>Industry or Relevant Experience</FieldLabel>
          <input
            value={experience.industryRelevantExperience}
            onChange={(e) =>
              onChange({
                ...experience,
                industryRelevantExperience: e.target.value,
              })
            }
            placeholder="Example: BPO, Healthcare, RCM, Finance"
            className={inputClass()}
          />
        </div>

        <div>
          <FieldLabel>
            Length of work experience <RequiredMark />
          </FieldLabel>
          <DatabaseSelect
            required
            value={experience.lengthOfWorkExperience}
            options={lengthOptions}
            placeholder="Select length"
            onChange={(value) =>
              onChange({
                ...experience,
                lengthOfWorkExperience: value,
              })
            }
            zIndex="z-[150]"
          />
        </div>

        <div>
          <FieldLabel>
            Years <RequiredMark />
          </FieldLabel>
          <input
            required
            type="number"
            min="0"
            step="0.1"
            value={experience.years}
            onChange={(e) =>
              onChange({
                ...experience,
                years: e.target.value,
              })
            }
            placeholder="Example: 2"
            className={inputClass()}
          />
        </div>

        <div>
          <FieldLabel>
            Role <RequiredMark />
          </FieldLabel>
          <input
            required
            value={experience.role}
            onChange={(e) =>
              onChange({
                ...experience,
                role: e.target.value,
              })
            }
            placeholder="Previous role"
            className={inputClass()}
          />
        </div>

        <div>
          <FieldLabel>
            Company <RequiredMark />
          </FieldLabel>
          <input
            required
            value={experience.company}
            onChange={(e) =>
              onChange({
                ...experience,
                company: e.target.value,
              })
            }
            placeholder="Previous company"
            className={inputClass()}
          />
        </div>

        <div>
          <FieldLabel>
            Monthly Compensation <RequiredMark />
          </FieldLabel>
          <input
            required
            type="number"
            min="0"
            value={experience.monthlyCompensation}
            onChange={(e) =>
              onChange({
                ...experience,
                monthlyCompensation: e.target.value,
              })
            }
            placeholder="Example: 20000"
            className={inputClass()}
          />
        </div>

        <div>
          <FieldLabel>
            Reason for leaving <RequiredMark />
          </FieldLabel>
          <input
            required
            value={experience.reasonForLeaving}
            onChange={(e) =>
              onChange({
                ...experience,
                reasonForLeaving: e.target.value,
              })
            }
            placeholder="Reason for leaving"
            className={inputClass()}
          />
        </div>
      </div>
    </div>
  );
}

export default function PublicTalentPoolApplicationPage() {
  const audioFileRef = useRef(null);
  const attachmentFileRef = useRef(null);
  const audioInputRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const fileSectionRef = useRef(null);
  const educationSectionRef = useRef(null);
  const questionsSectionRef = useRef(null);
  const consentRef = useRef(null);
  const initialReferralCodeRef = useRef(getReferralCodeFromCurrentUrl());
  const referralPrefillValuesRef = useRef(null);
  const applicantNameCheckRequestRef = useRef(0);

  const [form, setForm] = useState(() =>
    createEmptyPublicForm(initialReferralCodeRef.current),
  );
  const [hasReferralCode, setHasReferralCode] = useState(() =>
    initialReferralCodeRef.current ? "Yes" : "",
  );
  const [submittedRecord, setSubmittedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPageOneComplete, setIsPageOneComplete] = useState(false);
  const [applicationForm, setApplicationForm] = useState(null);
  const [applicationQuestions, setApplicationQuestions] = useState([]);
  const [applicationQuestionAnswers, setApplicationQuestionAnswers] =
    useState({});
  const [isLoadingApplicationQuestions, setIsLoadingApplicationQuestions] =
    useState(false);
  const [applicationQuestionsError, setApplicationQuestionsError] =
    useState("");
  const [activePositionOptions, setActivePositionOptions] = useState([]);
  const [formOptions, setFormOptions] = useState(defaultFormOptions);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingReferralPrefill, setIsLoadingReferralPrefill] =
    useState(false);
  const [referralLookupStatus, setReferralLookupStatus] = useState("");
  const [referralLookupMessage, setReferralLookupMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [highlightAudio, setHighlightAudio] = useState(false);
  const [highlightAttachment, setHighlightAttachment] = useState(false);
  const [highlightConsent, setHighlightConsent] = useState(false);
  const [applicantNameCheck, setApplicantNameCheck] = useState({
    status: "idle",
    key: "",
    duplicate: false,
    source: null,
  });

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const selectedAudioFile = audioFileRef.current || form.audioFile;
  const selectedAttachmentFile =
    attachmentFileRef.current || form.attachmentFile;
  const isReferralCodeFromEmail = Boolean(initialReferralCodeRef.current);
  const currentApplicantNameCheckKey = buildApplicantNameCheckKey({
    firstName: form.firstName,
    middleName: form.middleName,
    lastName: form.lastName,
  });
  const isApplicantNameVerifiedAvailable =
    applicantNameCheck.status === "available" &&
    applicantNameCheck.key === currentApplicantNameCheckKey;
  const isApplicantNameGateLocked = !isApplicantNameVerifiedAvailable;
  const hasDuplicateApplicantName =
    applicantNameCheck.status === "duplicate" &&
    applicantNameCheck.key === currentApplicantNameCheckKey;

  useEffect(() => {
    const styleId = "public-talent-pool-hide-sidebar-style";

    document.body.classList.add("public-talent-pool-form-page");
    document.documentElement.classList.add("public-talent-pool-form-page");

    let style = document.getElementById(styleId);

    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }

    style.innerHTML = `
        body.public-talent-pool-form-page aside,
        body.public-talent-pool-form-page .sidebar,
        body.public-talent-pool-form-page [data-sidebar],
        body.public-talent-pool-form-page nav.sidebar,
        body.public-talent-pool-form-page .app-sidebar,
        body.public-talent-pool-form-page .main-sidebar {
          display: none !important;
          width: 0 !important;
          min-width: 0 !important;
          max-width: 0 !important;
        }

        body.public-talent-pool-form-page .main-content,
        body.public-talent-pool-form-page .content-wrapper,
        body.public-talent-pool-form-page .page-content,
        body.public-talent-pool-form-page #root > div {
          width: 100% !important;
          max-width: 100% !important;
          margin-left: 0 !important;
          padding-left: 0 !important;
        }

        body.public-talent-pool-form-page {
          overflow-x: hidden !important;
        }

        body.public-talent-pool-form-page button:not(:disabled),
        body.public-talent-pool-form-page a[href],
        body.public-talent-pool-form-page [role="button"]:not([aria-disabled="true"]),
        body.public-talent-pool-form-page input[type="checkbox"]:not(:disabled),
        body.public-talent-pool-form-page input[type="radio"]:not(:disabled),
        body.public-talent-pool-form-page input[type="file"]:not(:disabled),
        body.public-talent-pool-form-page select:not(:disabled),
        body.public-talent-pool-form-page label:has(input[type="checkbox"]:not(:disabled)),
        body.public-talent-pool-form-page label:has(input[type="radio"]:not(:disabled)),
        body.public-talent-pool-form-page label:has(input[type="file"]:not(:disabled)) {
          cursor: pointer !important;
        }

        body.public-talent-pool-form-page button:disabled,
        body.public-talent-pool-form-page [aria-disabled="true"],
        body.public-talent-pool-form-page input:disabled,
        body.public-talent-pool-form-page select:disabled {
          cursor: not-allowed !important;
        }

      `;

    return () => {
      document.body.classList.remove("public-talent-pool-form-page");
      document.documentElement.classList.remove("public-talent-pool-form-page");
    };
  }, []);

  useEffect(() => {
    const referralCode = cleanText(form.referralCode).toUpperCase();
    const referralCodeReachedLimit = referralCode.length === 10;

    if (hasReferralCode !== "Yes") {
      setReferralLookupStatus("");
      setReferralLookupMessage("");
      setIsLoadingReferralPrefill(false);
      return undefined;
    }

    if (!referralCode) {
      setReferralLookupStatus("");
      setReferralLookupMessage("");
      setIsLoadingReferralPrefill(false);
      return undefined;
    }

    if (!referralCodeReachedLimit) {
      setReferralLookupStatus("");
      setReferralLookupMessage("");
      setIsLoadingReferralPrefill(false);
      return undefined;
    }

    let isCurrent = true;
    const lookupDelay = isReferralCodeFromEmail ? 0 : 500;

    setReferralLookupStatus("checking");
    setReferralLookupMessage("Checking referral code...");
    setIsLoadingReferralPrefill(true);

    const lookupTimer = window.setTimeout(async () => {
      const response = await getTalentPoolReferralPrefill(referralCode);

      if (!isCurrent) return;

      if (response?.success && response.data) {
        const prefill = response.data;
        const matchedPrefillValues = {
          firstName: cleanText(prefill.firstName),
          middleName: cleanText(prefill.middleName),
          lastName: cleanText(prefill.lastName),
          suffix: cleanText(prefill.suffix),
          email: cleanText(prefill.email),
          phone1: cleanText(prefill.phone1),
          applyingLocation: cleanText(prefill.applyingLocation),
          hearAboutUs: [EXTERNAL_REFERRAL_LISTINGS_SOURCE],
        };

        referralPrefillValuesRef.current = matchedPrefillValues;

        setForm((previous) => ({
          ...previous,
          referralCode: prefill.referralCode || previous.referralCode,
          firstName: matchedPrefillValues.firstName || previous.firstName,
          middleName: matchedPrefillValues.middleName || previous.middleName,
          lastName: matchedPrefillValues.lastName || previous.lastName,
          suffix: matchedPrefillValues.suffix || previous.suffix,
          email: matchedPrefillValues.email || previous.email,
          phone1: matchedPrefillValues.phone1 || previous.phone1,
          applyingLocation:
            matchedPrefillValues.applyingLocation || previous.applyingLocation,
          hearAboutUs: matchedPrefillValues.hearAboutUs,
          referredBy: "",
          employeeId: "",
        }));
        setReferralLookupStatus("matched");
        setReferralLookupMessage("Referral code matched.");
      } else {
        setReferralLookupStatus("missing");
        setReferralLookupMessage(
          response?.status === 404
            ? "No matching referral code."
            : response?.message ||
                "We could not verify this referral code right now.",
        );
      }

      setIsLoadingReferralPrefill(false);
    }, lookupDelay);

    return () => {
      isCurrent = false;
      window.clearTimeout(lookupTimer);
    };
  }, [form.referralCode, hasReferralCode, isReferralCodeFromEmail]);

  useEffect(() => {
    const namePayload = {
      firstName: form.firstName,
      middleName: form.middleName,
      lastName: form.lastName,
    };
    const nameKey = buildApplicantNameCheckKey(namePayload);
    const requestId = applicantNameCheckRequestRef.current + 1;
    applicantNameCheckRequestRef.current = requestId;

    if (!hasCompleteApplicantNameForDuplicateCheck(namePayload)) {
      setApplicantNameCheck({
        status: "idle",
        key: nameKey,
        duplicate: false,
        source: null,
      });
      return undefined;
    }

    setApplicantNameCheck({
      status: "checking",
      key: nameKey,
      duplicate: false,
      source: null,
    });

    const lookupTimer = window.setTimeout(async () => {
      const response = await checkTalentPoolApplicantNameAvailability(
        namePayload,
      );

      if (applicantNameCheckRequestRef.current !== requestId) return;

      if (!response?.success) {
        setApplicantNameCheck({
          status: "error",
          key: nameKey,
          duplicate: false,
          source: null,
        });
        return;
      }

      const duplicate = Boolean(response?.data?.duplicate);
      const source = response?.data?.source || null;

      setApplicantNameCheck({
        status: duplicate ? "duplicate" : "available",
        key: nameKey,
        duplicate,
        source,
      });

    }, 450);

    return () => {
      window.clearTimeout(lookupTimer);
    };
  }, [form.firstName, form.middleName, form.lastName]);

  useEffect(() => {
    let isMounted = true;

    async function loadDatabaseData() {
      setIsLoadingData(true);
      setLoadError("");

      try {
        const [optionsResponse, openPositionsResponse] = await Promise.all([
          getTalentPoolFormOptions(),
          getTalentPoolOpenPositions(),
        ]);

        if (!isMounted) return;

        if (!optionsResponse?.success) {
          throw new Error(
            optionsResponse?.message || "Failed to load form options.",
          );
        }

        if (!openPositionsResponse?.success) {
          throw new Error(
            openPositionsResponse?.message ||
              "Failed to load active available positions.",
          );
        }

        setFormOptions(normalizeOptionsPayload(optionsResponse?.data));

        const approvedActivePositions = Array.isArray(
          openPositionsResponse?.data,
        )
          ? sortAvailablePositions(
              openPositionsResponse.data
                .map(normalizeAvailablePosition)
                .filter(
                  (position) =>
                    position.positionTitle &&
                    isApprovedActivePosition(position),
                ),
            )
          : [];

        setActivePositionOptions(approvedActivePositions);
      } catch (error) {
        console.error("Load public talent pool form data error:", error);

        if (!isMounted) return;

        const errorMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to load form data from database.";

        setLoadError(errorMessage);
        setFormOptions(defaultFormOptions);
        setActivePositionOptions([]);

        showStatusModal({
          type: "error",
          title: "Unable to load form",
          message: errorMessage,
        });
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    }

    loadDatabaseData();

    return () => {
      isMounted = false;
    };
  }, []);

  const age = calculateAge(form.dateOfBirth);

  const hasRelevantExperience =
    form.workExperience ===
    "Has work Experience (at least 6 months relevant work experience)";

  const isReferralCodeMatched = referralLookupStatus === "matched";
  const shouldShowApplicationFields =
    hasReferralCode === "No" ||
    (hasReferralCode === "Yes" && isReferralCodeMatched);
  const shouldRenderApplicationFields = shouldShowApplicationFields;

  const hasEmployeeReferralProgram = useMemo(
    () =>
      isEmployeeReferralProgramSelected(
        form.hearAboutUs,
        formOptions.hearAboutUs,
      ),
    [form.hearAboutUs, formOptions.hearAboutUs],
  );

  const completionPercentage = useMemo(() => {
    if (!shouldShowApplicationFields) return 0;

    const educationComplete =
      Boolean(form.highestEducationalAttainment) &&
      !validateEducationDetails(
        form.highestEducationalAttainment,
        form.educationDetails,
      );

    const checks = [
      Boolean(form.openPosition),
      Boolean(form.applyingLocation),
      Boolean(form.firstName.trim()),
      Boolean(form.lastName.trim()),
      Boolean(form.dateOfBirth),
      Boolean(form.email.trim()),
      Boolean(form.physicalAddress.trim()),
      Boolean(form.workExperience),
      Boolean(form.highestEducationalAttainment),
      educationComplete,
      Boolean(
        form.reference1Name.trim() &&
          isValidReferencePhoneNumber(form.reference1Phone),
      ),
      Boolean(
        form.reference2Name.trim() &&
          isValidReferencePhoneNumber(form.reference2Phone),
      ),
      Boolean(
        form.reference3Name.trim() &&
          isValidReferencePhoneNumber(form.reference3Phone),
      ),
      Boolean(selectedAudioFile),
      Boolean(selectedAttachmentFile),
      Boolean(form.consent),
    ];

    if (hasEmployeeReferralProgram) {
      checks.push(Boolean(form.referredBy.trim() && form.employeeId.trim()));
    }

    if (hasRelevantExperience) {
      checks.push(
        Boolean(
          form.lengthOfWorkExperience &&
          form.years.trim() &&
          form.role.trim() &&
          form.company.trim() &&
          form.monthlyCompensation.trim() &&
          form.reasonForLeaving.trim(),
        ),
      );

      if (form.hasOtherExperience === "Yes") {
        checks.push(
          Boolean(
            form.otherExperiences.length &&
            form.otherExperiences.every(
              (experience) =>
                experience.lengthOfWorkExperience &&
                experience.years.trim() &&
                experience.role.trim() &&
                experience.company.trim() &&
                experience.monthlyCompensation.trim() &&
                experience.reasonForLeaving.trim(),
            ),
          ),
        );
      }
    }

    const completed = checks.filter(Boolean).length;

    return Math.min(
      100,
      Math.max(0, Math.round((completed / checks.length) * 100)),
    );
  }, [
    form,
    hasEmployeeReferralProgram,
    hasRelevantExperience,
    selectedAttachmentFile,
    selectedAudioFile,
    shouldShowApplicationFields,
  ]);

  const canSubmit = useMemo(() => {
    if (!isApplicantNameVerifiedAvailable) return false;
    if (!shouldShowApplicationFields) return false;
    if (isLoadingData) return false;
    if (isSubmitting) return false;
    if (loadError) return false;
    return true;
  }, [
    isApplicantNameVerifiedAvailable,
    isLoadingData,
    isSubmitting,
    loadError,
    shouldShowApplicationFields,
  ]);

  function showStatusModal({ type = "success", title = "", message = "" }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });
  }

  async function ensureApplicantNameAvailable() {
    const namePayload = {
      firstName: form.firstName,
      middleName: form.middleName,
      lastName: form.lastName,
    };

    if (!hasCompleteApplicantNameForDuplicateCheck(namePayload)) {
      return true;
    }

    const nameKey = buildApplicantNameCheckKey(namePayload);

    if (
      applicantNameCheck.key === nameKey &&
      applicantNameCheck.status === "available"
    ) {
      return true;
    }

    if (
      applicantNameCheck.key === nameKey &&
      applicantNameCheck.status === "duplicate"
    ) {
      return false;
    }

    setApplicantNameCheck({
      status: "checking",
      key: nameKey,
      duplicate: false,
      source: null,
    });

    const response = await checkTalentPoolApplicantNameAvailability(
      namePayload,
    );

    if (!response?.success) {
      setApplicantNameCheck({
        status: "error",
        key: nameKey,
        duplicate: false,
        source: null,
      });

      showStatusModal({
        type: "error",
        title: "Unable to Verify Applicant",
        message:
          response?.message ||
          "The applicant name could not be verified. Please try again before continuing.",
      });
      return false;
    }

    const duplicate = Boolean(response?.data?.duplicate);
    const source = response?.data?.source || null;

    setApplicantNameCheck({
      status: duplicate ? "duplicate" : "available",
      key: nameKey,
      duplicate,
      source,
    });

    if (duplicate) {
      return false;
    }

    return true;
  }

  function handleOpenPositionJobDescription(position) {
    const positionTitle = cleanText(
      position?.positionTitle || position?.position_title || position?.label,
    );

    const jdId =
      position?.jdId ||
      position?.jd_id ||
      position?.jobDescriptionId ||
      position?.job_description_id ||
      "";

    if (!positionTitle || !jdId) {
      showStatusModal({
        type: "error",
        title: "Job description unavailable",
        message:
          "This position is not linked to an approved public job description.",
      });
      return;
    }

    const jobDescriptionUrl = `/job-description/${encodeURIComponent(jdId)}`;

    window.open(jobDescriptionUrl, "_blank", "noopener,noreferrer");
  }

  function closeStatusModal() {
    setStatusModal((previous) => ({
      ...previous,
      open: false,
    }));
  }

  function scrollToRef(targetRef) {
    window.setTimeout(() => {
      targetRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  }

  function updateFormField(field, value) {
    setForm((previous) => ({
      ...previous,
      // Keep the exact editing value in state. Transforming a controlled
      // value here moves the browser caret to the end after every keystroke.
      [field]: value,
    }));
  }

  function updateFormFields(nextFields) {
    setForm((previous) => ({
      ...previous,
      // Uppercase normalization is applied only when the form is submitted.
      ...nextFields,
    }));
  }

  function handleAvailablePositionChange(positionKey, position) {
    const normalizedPosition = normalizeAvailablePosition(position);

    setForm((previous) => ({
      ...previous,
      jobDescriptionId: String(normalizedPosition.jdId || ""),
      selectedAvailablePositionId: String(positionKey || ""),
      positionId: normalizedPosition.positionId,
      openPosition: normalizedPosition.positionTitle,
    }));
    setApplicationForm(null);
    setApplicationQuestions([]);
    setApplicationQuestionAnswers({});
    setApplicationQuestionsError("");
    setCurrentPage(1);
    setIsPageOneComplete(false);
  }

  function updateTrainingAttended(index, value) {
    setForm((previous) => {
      const rows = ensureTrainingEntryRows(previous.trainingAttended);
      const nextRows = rows.map((item, itemIndex) =>
        itemIndex === index ? value : item,
      );

      return {
        ...previous,
        trainingAttended: nextRows,
      };
    });
  }

  function addTrainingAttended() {
    setForm((previous) => ({
      ...previous,
      trainingAttended: [...ensureTrainingEntryRows(previous.trainingAttended), ""],
    }));
  }

  function removeTrainingAttended(index) {
    setForm((previous) => {
      const nextRows = ensureTrainingEntryRows(previous.trainingAttended).filter(
        (_, itemIndex) => itemIndex !== index,
      );

      return {
        ...previous,
        trainingAttended: nextRows.length ? nextRows : [""],
      };
    });
  }

  function handleReferralChoiceChange(value) {
    if (value === "Yes") {
      setHasReferralCode("Yes");
      setReferralLookupStatus("");
      setReferralLookupMessage("");
      setIsLoadingReferralPrefill(false);

      setForm((previous) => ({
        ...previous,
        referralCode: initialReferralCodeRef.current || "",
      }));

      return;
    }

    const referralPrefillValues = referralPrefillValuesRef.current;

    setHasReferralCode("No");
    setReferralLookupStatus("");
    setReferralLookupMessage("");
    setIsLoadingReferralPrefill(false);
    referralPrefillValuesRef.current = null;

    setForm((previous) => {
      const next = {
        ...previous,
        referralCode: "",
        referredBy: "",
        employeeId: "",
      };

      if (!referralPrefillValues) {
        return next;
      }

      [
        "firstName",
        "middleName",
        "lastName",
        "suffix",
        "email",
        "phone1",
        "applyingLocation",
      ].forEach((field) => {
        const prefilledValue = cleanText(referralPrefillValues[field]);

        if (
          prefilledValue &&
          cleanText(next[field]).toLowerCase() === prefilledValue.toLowerCase()
        ) {
          next[field] = "";
        }
      });

      if (
        Array.isArray(next.hearAboutUs) &&
        next.hearAboutUs.length === 1 &&
        next.hearAboutUs[0] === EXTERNAL_REFERRAL_LISTINGS_SOURCE
      ) {
        next.hearAboutUs = [];
      }

      return next;
    });
  }

  function handleHearAboutUsChange(values) {
    if (isReferralCodeMatched) return;

    const hasEmployeeReferralProgram = isEmployeeReferralProgramSelected(
      values,
      formOptions.hearAboutUs,
    );

    setForm((previous) => ({
      ...previous,
      hearAboutUs: values,
      referredBy: hasEmployeeReferralProgram ? previous.referredBy : "",
      employeeId: hasEmployeeReferralProgram ? previous.employeeId : "",
    }));
  }

  function handleEducationalAttainmentChange(value) {
    setForm((previous) => ({
      ...previous,
      highestEducationalAttainment: value,
      educationDetails: prepareEducationDetailsForAttainment(
        previous.educationDetails,
        value,
      ),
    }));
  }

  function updateEducationDetails(nextDetails) {
    setForm((previous) => ({
      ...previous,
      educationDetails: prepareEducationDetailsForAttainment(
        nextDetails,
        previous.highestEducationalAttainment,
      ),
    }));
  }

  function handleReset() {
    audioFileRef.current = null;
    attachmentFileRef.current = null;

    if (audioInputRef.current) {
      audioInputRef.current.value = "";
    }

    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }

    referralPrefillValuesRef.current = null;
    setHasReferralCode("");
    setReferralLookupStatus("");
    setReferralLookupMessage("");
    setIsLoadingReferralPrefill(false);
    setForm(createEmptyPublicForm());
    setSubmittedRecord(null);
    setCurrentPage(1);
    setIsPageOneComplete(false);
    setApplicationForm(null);
    setApplicationQuestions([]);
    setApplicationQuestionAnswers({});
    setApplicationQuestionsError("");
    setIsLoadingApplicationQuestions(false);
    setHighlightAudio(false);
    setHighlightAttachment(false);
    setHighlightConsent(false);
    applicantNameCheckRequestRef.current += 1;
    setApplicantNameCheck({
      status: "idle",
      key: "",
      duplicate: false,
      source: null,
    });

    showStatusModal({
      type: "success",
      title: "Form reset",
      message: "The application form has been cleared.",
    });
  }

  function handleFileChange(field, file) {
    if (!file) {
      if (field === "audioFile") {
        audioFileRef.current = null;
        setHighlightAudio(false);
      }

      if (field === "attachmentFile") {
        attachmentFileRef.current = null;
        setHighlightAttachment(false);
      }

      updateFormField(field, null);
      return true;
    }

    if (field === "audioFile" && !isAcceptedAudioFile(file)) {
      audioFileRef.current = null;
      setHighlightAudio(true);

      updateFormField("audioFile", null);

      showStatusModal({
        type: "error",
        title: "Invalid audio file",
        message:
          "Please upload a valid audio file. Accepted formats: MP3, WAV, M4A, AAC, OGG, WEBM, MP4, FLAC, AMR, 3GP, OPUS, AIFF, CAF, or WMA.",
      });

      return false;
    }

    if (field === "attachmentFile" && !isAcceptedDocumentFile(file)) {
      attachmentFileRef.current = null;
      setHighlightAttachment(true);

      updateFormField("attachmentFile", null);

      showStatusModal({
        type: "error",
        title: "Invalid supporting file",
        message:
          "Please upload a valid supporting file/Resume. Accepted formats: PDF, DOC, DOCX, XLS, XLSX, CSV, JPG, JPEG, PNG, or GIF.",
      });

      return false;
    }

    if (field === "audioFile") {
      audioFileRef.current = file;
      setHighlightAudio(false);
    }

    if (field === "attachmentFile") {
      attachmentFileRef.current = file;
      setHighlightAttachment(false);
    }

    updateFormField(field, file);
    return true;
  }

  function updatePrimaryExperience(nextExperience) {
    updateFormFields({
      industryRelevantExperience: nextExperience.industryRelevantExperience,
      lengthOfWorkExperience: nextExperience.lengthOfWorkExperience,
      years: nextExperience.years,
      role: nextExperience.role,
      company: nextExperience.company,
      monthlyCompensation: nextExperience.monthlyCompensation,
      reasonForLeaving: nextExperience.reasonForLeaving,
    });
  }

  function updateOtherExperience(index, nextExperience) {
    setForm((previous) => ({
      ...previous,
      otherExperiences: previous.otherExperiences.map(
        (experience, itemIndex) =>
          itemIndex === index ? nextExperience : experience,
      ),
    }));
  }

  function addOtherExperience() {
    setForm((previous) => ({
      ...previous,
      hasOtherExperience: "Yes",
      otherExperiences: [...previous.otherExperiences, createEmptyExperience()],
    }));
  }

  function removeOtherExperience(index) {
    setForm((previous) => {
      const nextOtherExperiences = previous.otherExperiences.filter(
        (_, itemIndex) => itemIndex !== index,
      );

      return {
        ...previous,
        otherExperiences: nextOtherExperiences,
        hasOtherExperience:
          nextOtherExperiences.length > 0 ? previous.hasOtherExperience : "No",
      };
    });
  }

  function handleOtherExperienceAnswer(value) {
    setForm((previous) => ({
      ...previous,
      hasOtherExperience: value,
      otherExperiences:
        value === "Yes"
          ? previous.otherExperiences.length > 0
            ? previous.otherExperiences
            : [createEmptyExperience()]
          : [],
    }));
  }

  function isPageOneReadyForQuestions() {
    if (!isApplicantNameVerifiedAvailable) return false;
    if (isLoadingData || loadError) return false;
    if (!hasReferralCode) return false;
    if (hasReferralCode === "Yes" && !cleanText(form.referralCode)) return false;
    if (hasReferralCode === "Yes" && !isReferralCodeMatched) return false;
    if (!activePositionOptions.length) return false;
    if (
      !formOptions.hearAboutUs.length ||
      !hasMatchingMultiOptionValue(formOptions.hearAboutUs, form.hearAboutUs)
    ) {
      return false;
    }

    if (
      hasEmployeeReferralProgram &&
      (!cleanText(form.referredBy) || !cleanText(form.employeeId))
    ) {
      return false;
    }

    const selectedAvailablePosition = activePositionOptions.find(
      (position) =>
        String(getPositionKey(position)) ===
        String(form.selectedAvailablePositionId || ""),
    );

    if (!selectedAvailablePosition || !form.openPosition) return false;
    if (!hasMatchingOptionValue(formOptions.locations, form.applyingLocation)) {
      return false;
    }
    if (!cleanText(form.firstName)) return false;
    if (!cleanText(form.lastName)) return false;
    if (!form.dateOfBirth) return false;
    if (!cleanText(form.email)) return false;
    if (!cleanText(form.physicalAddress)) return false;
    if (!hasMatchingOptionValue(formOptions.workExperience, form.workExperience)) {
      return false;
    }
    if (
      !hasMatchingOptionValue(
        formOptions.educationalAttainment,
        form.highestEducationalAttainment,
      )
    ) {
      return false;
    }

    if (
      validateEducationDetails(
        form.highestEducationalAttainment,
        form.educationDetails,
      )
    ) {
      return false;
    }

    if (!hasMatchingOptionValue(formOptions.yesNo, form.fullyVaccinated)) {
      return false;
    }
    if (!hasMatchingOptionValue(formOptions.yesNo, form.comfortableOnSite)) {
      return false;
    }
    if (!hasMatchingOptionValue(formOptions.yesNo, form.willingGraveyard)) {
      return false;
    }
    if (
      !hasMatchingOptionValue(
        formOptions.employmentInterest,
        form.employmentInterest,
      )
    ) {
      return false;
    }
    if (!hasMatchingOptionValue(formOptions.yesNo, form.remoteWorkAccess)) {
      return false;
    }
    if (!hasMatchingOptionValue(formOptions.yesNo, form.willingDrugTest)) {
      return false;
    }
    if (!hasMatchingOptionValue(formOptions.yesNo, form.willingBackgroundCheck)) {
      return false;
    }

    if (hasRelevantExperience) {
      if (
        !hasMatchingOptionValue(
          formOptions.lengthOfExperience,
          form.lengthOfWorkExperience,
        )
      ) {
        return false;
      }

      const requiredExperienceValues = [
        form.lengthOfWorkExperience,
        form.years,
        form.role,
        form.company,
        form.monthlyCompensation,
        form.reasonForLeaving,
      ];

      if (requiredExperienceValues.some((value) => !cleanText(value))) {
        return false;
      }

      if (form.hasOtherExperience === "Yes") {
        if (!form.otherExperiences.length) return false;

        const requiredOtherExperienceFields = [
          "lengthOfWorkExperience",
          "years",
          "role",
          "company",
          "monthlyCompensation",
          "reasonForLeaving",
        ];

        const hasIncompleteOtherExperience = form.otherExperiences.some(
          (experience) =>
            requiredOtherExperienceFields.some(
              (field) => !cleanText(experience?.[field]),
            ),
        );

        if (hasIncompleteOtherExperience) return false;

        const hasInvalidOtherExperienceLength = form.otherExperiences.some(
          (experience) =>
            !hasMatchingOptionValue(
              formOptions.lengthOfExperience,
              experience?.lengthOfWorkExperience,
            ),
        );

        if (hasInvalidOtherExperienceLength) return false;
      }
    }

    const requiredReferenceNames = [
      form.reference1Name,
      form.reference2Name,
      form.reference3Name,
    ];

    if (!requiredReferenceNames.every((value) => Boolean(cleanText(value)))) {
      return false;
    }

    return [
      form.reference1Phone,
      form.reference2Phone,
      form.reference3Phone,
    ].every(isValidReferencePhoneNumber);
  }

  function validatePageOne() {
    if (isLoadingData) {
      showStatusModal({
        type: "error",
        title: "Please wait",
        message: "Please wait while the form data is loading.",
      });
      return false;
    }

    if (loadError) {
      showStatusModal({
        type: "error",
        title: "Form data error",
        message: loadError,
      });
      return false;
    }

    if (!hasReferralCode) {
      showStatusModal({
        type: "error",
        title: "Referral selection required",
        message: "Please select whether you have a referral code.",
      });
      return false;
    }

    if (hasReferralCode === "Yes" && !cleanText(form.referralCode)) {
      showStatusModal({
        type: "error",
        title: "Referral code required",
        message: "Please enter your referral code before continuing.",
      });
      return false;
    }

    if (hasReferralCode === "Yes" && !isReferralCodeMatched) {
      showStatusModal({
        type: "error",
        title: "Referral code not matched",
        message: "Please enter a valid matched referral code before continuing.",
      });
      return false;
    }

    if (!activePositionOptions.length) {
      showStatusModal({
        type: "error",
        title: "No open positions",
        message:
          "No approved and active available positions are currently available.",
      });
      return false;
    }

    if (formOptions.hearAboutUs.length === 0) {
      showStatusModal({
        type: "error",
        title: "Missing source options",
        message:
          "No application source options are configured in the database.",
      });
      return false;
    }

    if (!hasMatchingMultiOptionValue(formOptions.hearAboutUs, form.hearAboutUs)) {
      showStatusModal({
        type: "error",
        title: "Application source required",
        message:
          "Please select at least one source under How did you first hear about us?",
      });
      return false;
    }

    if (hasEmployeeReferralProgram && !form.referredBy.trim()) {
      showStatusModal({
        type: "error",
        title: "Referrer name required",
        message: "Please enter the name of the employee who referred you.",
      });
      return false;
    }

    if (hasEmployeeReferralProgram && !form.employeeId.trim()) {
      showStatusModal({
        type: "error",
        title: "Referrer employee ID required",
        message: "Please enter the employee ID of your referrer.",
      });
      return false;
    }

    const selectedAvailablePosition = activePositionOptions.find(
      (position) =>
        String(getPositionKey(position)) ===
        String(form.selectedAvailablePositionId || ""),
    );

    if (!selectedAvailablePosition || !form.openPosition) {
      showStatusModal({
        type: "error",
        title: "Open position required",
        message: "Please select one of the approved active open positions.",
      });
      return false;
    }

    if (!hasMatchingOptionValue(formOptions.locations, form.applyingLocation)) {
      showStatusModal({
        type: "error",
        title: "Location required",
        message: "Please select which location you are applying for.",
      });
      return false;
    }

    if (!form.firstName.trim()) {
      showStatusModal({
        type: "error",
        title: "First name required",
        message: "Please enter your first name.",
      });
      return false;
    }

    if (!form.lastName.trim()) {
      showStatusModal({
        type: "error",
        title: "Last name required",
        message: "Please enter your last name.",
      });
      return false;
    }

    if (!form.dateOfBirth) {
      showStatusModal({
        type: "error",
        title: "Date of birth required",
        message: "Please select your date of birth.",
      });
      return false;
    }

    if (!form.email.trim()) {
      showStatusModal({
        type: "error",
        title: "Email required",
        message: "Please enter your email address.",
      });
      return false;
    }

    if (!form.physicalAddress.trim()) {
      showStatusModal({
        type: "error",
        title: "Physical address required",
        message: "Please enter your complete physical address.",
      });
      return false;
    }

    if (!hasMatchingOptionValue(formOptions.workExperience, form.workExperience)) {
      showStatusModal({
        type: "error",
        title: "Work experience required",
        message: "Please select your work experience.",
      });
      return false;
    }

    if (
      !hasMatchingOptionValue(
        formOptions.educationalAttainment,
        form.highestEducationalAttainment,
      )
    ) {
      showStatusModal({
        type: "error",
        title: "Educational attainment required",
        message: "Please select your highest educational attainment.",
      });
      return false;
    }

    const educationValidationMessage = validateEducationDetails(
      form.highestEducationalAttainment,
      form.educationDetails,
    );

    if (educationValidationMessage) {
      scrollToRef(educationSectionRef);

      showStatusModal({
        type: "error",
        title: "Incomplete education details",
        message: educationValidationMessage,
      });
      return false;
    }

    if (!hasMatchingOptionValue(formOptions.yesNo, form.fullyVaccinated)) {
      showStatusModal({
        type: "error",
        title: "Missing required field",
        message: "Please answer if you are fully vaccinated.",
      });
      return false;
    }

    if (!hasMatchingOptionValue(formOptions.yesNo, form.comfortableOnSite)) {
      showStatusModal({
        type: "error",
        title: "Missing required field",
        message: "Please answer if you are comfortable working on site.",
      });
      return false;
    }

    if (!hasMatchingOptionValue(formOptions.yesNo, form.willingGraveyard)) {
      showStatusModal({
        type: "error",
        title: "Missing required field",
        message: "Please answer if you are willing to work in graveyard shift.",
      });
      return false;
    }

    if (
      !hasMatchingOptionValue(
        formOptions.employmentInterest,
        form.employmentInterest,
      )
    ) {
      showStatusModal({
        type: "error",
        title: "Employment preference required",
        message: "Please select your employment preference.",
      });
      return false;
    }

    if (!hasMatchingOptionValue(formOptions.yesNo, form.remoteWorkAccess)) {
      showStatusModal({
        type: "error",
        title: "Missing required field",
        message:
          "Please answer if you have access to a computer, internet connection, and private space.",
      });
      return false;
    }

    if (!hasMatchingOptionValue(formOptions.yesNo, form.willingDrugTest)) {
      showStatusModal({
        type: "error",
        title: "Missing required field",
        message:
          "Please answer if you are willing to undertake a drug test as part of this hiring process.",
      });
      return false;
    }

    if (
      !hasMatchingOptionValue(formOptions.yesNo, form.willingBackgroundCheck)
    ) {
      showStatusModal({
        type: "error",
        title: "Missing required field",
        message:
          "Please answer if you are willing to undergo a background check.",
      });
      return false;
    }

    if (hasRelevantExperience) {
      if (
        !hasMatchingOptionValue(
          formOptions.lengthOfExperience,
          form.lengthOfWorkExperience,
        )
      ) {
        showStatusModal({
          type: "error",
          title: "Length of work experience required",
          message: "Please select a valid length of work experience.",
        });
        return false;
      }

      const requiredExperienceFields = [
        [form.lengthOfWorkExperience, "Length of work experience"],
        [form.years, "Years"],
        [form.role, "Role"],
        [form.company, "Company"],
        [form.monthlyCompensation, "Monthly Compensation"],
        [form.reasonForLeaving, "Reason for leaving"],
        [form.highestEducationalAttainment, "Highest Educational Attainment"],
      ];

      const missingField = requiredExperienceFields.find(
        ([value]) => !String(value || "").trim(),
      );

      if (missingField) {
        showStatusModal({
          type: "error",
          title: "Missing required field",
          message: `${missingField[1]} is required.`,
        });
        return false;
      }

      if (form.hasOtherExperience === "Yes") {
        if (!form.otherExperiences.length) {
          showStatusModal({
            type: "error",
            title: "Other experience required",
            message: "Please add your other work experience details.",
          });
          return false;
        }

        const requiredOtherExperienceFields = [
          "lengthOfWorkExperience",
          "years",
          "role",
          "company",
          "monthlyCompensation",
          "reasonForLeaving",
        ];

        const hasIncompleteOtherExperience = form.otherExperiences.some(
          (experience) =>
            requiredOtherExperienceFields.some(
              (field) => !String(experience[field] || "").trim(),
            ),
        );

        if (hasIncompleteOtherExperience) {
          showStatusModal({
            type: "error",
            title: "Incomplete other experience",
            message:
              "Please complete all required fields in your other work experience.",
          });
          return false;
        }

        const hasInvalidOtherExperienceLength = form.otherExperiences.some(
          (experience) =>
            !hasMatchingOptionValue(
              formOptions.lengthOfExperience,
              experience?.lengthOfWorkExperience,
            ),
        );

        if (hasInvalidOtherExperienceLength) {
          showStatusModal({
            type: "error",
            title: "Invalid work experience length",
            message:
              "Please select a valid length of work experience for every additional experience.",
          });
          return false;
        }
      }
    }

    const requiredReferenceFields = [
      [form.reference1Name, "Reference 1 full name"],
      [form.reference1Phone, "Reference 1 phone number"],
      [form.reference2Name, "Reference 2 full name"],
      [form.reference2Phone, "Reference 2 phone number"],
      [form.reference3Name, "Reference 3 full name"],
      [form.reference3Phone, "Reference 3 phone number"],
    ];

    const missingReferenceField = requiredReferenceFields.find(
      ([value]) => !cleanText(value),
    );

    if (missingReferenceField) {
      showStatusModal({
        type: "error",
        title: "Character reference required",
        message: `${missingReferenceField[1]} is required.`,
      });
      return false;
    }

    const invalidReferencePhone = [
      [form.reference1Phone, "Reference 1 phone number"],
      [form.reference2Phone, "Reference 2 phone number"],
      [form.reference3Phone, "Reference 3 phone number"],
    ].find(([value]) => !isValidReferencePhoneNumber(value));

    if (invalidReferencePhone) {
      showStatusModal({
        type: "error",
        title: "Invalid reference phone number",
        message: `${invalidReferencePhone[1]} must be exactly 11 digits and start with 09.`,
      });
      return false;
    }

    return true;
  }

  function validatePageTwo() {
    const currentAudioFile = audioFileRef.current || form.audioFile;
    const currentAttachmentFile =
      attachmentFileRef.current || form.attachmentFile;

    const questionValidationMessage = validateApplicationQuestionAnswers(
      applicationQuestions,
      applicationQuestionAnswers,
    );

    if (questionValidationMessage) {
      scrollToRef(questionsSectionRef);

      showStatusModal({
        type: "error",
        title: "Position question required",
        message: questionValidationMessage,
      });
      return false;
    }

    if (!currentAudioFile) {
      setHighlightAudio(true);
      scrollToRef(fileSectionRef);

      showStatusModal({
        type: "error",
        title: "Audio file required",
        message:
          "Please upload a single audio file. Click the audio upload box and select your audio file again.",
      });
      return false;
    }

    if (!isAcceptedAudioFile(currentAudioFile)) {
      setHighlightAudio(true);
      scrollToRef(fileSectionRef);

      showStatusModal({
        type: "error",
        title: "Invalid audio file",
        message:
          "Please upload a valid audio file. Accepted formats: MP3, WAV, M4A, AAC, OGG, WEBM, MP4, FLAC, AMR, 3GP, OPUS, AIFF, CAF, or WMA.",
      });
      return false;
    }

    if (!currentAttachmentFile) {
      setHighlightAttachment(true);
      scrollToRef(fileSectionRef);

      showStatusModal({
        type: "error",
        title: "Supporting file required",
        message: "Please upload your supporting document or file.",
      });
      return false;
    }

    if (!isAcceptedDocumentFile(currentAttachmentFile)) {
      setHighlightAttachment(true);
      scrollToRef(fileSectionRef);

      showStatusModal({
        type: "error",
        title: "Invalid supporting file",
        message:
          "Please upload a valid supporting file. Accepted formats: PDF, DOC, DOCX, XLS, XLSX, CSV, JPG, JPEG, PNG, or GIF.",
      });
      return false;
    }

    if (!form.consent) {
      setHighlightConsent(true);
      scrollToRef(consentRef);

      showStatusModal({
        type: "error",
        title: "Consent required",
        message:
          "Please check the consent box at the bottom of the form before submitting.",
      });
      return false;
    }

    return true;
  }

  function updateApplicationQuestionAnswer(questionId, patch) {
    const key = String(questionId);

    setApplicationQuestionAnswers((previous) => ({
      ...previous,
      [key]: {
        ...(previous?.[key] || {
          questionId: Number(questionId || 0),
          answerType: "Text",
          textAnswer: "",
        }),
        ...patch,
      },
    }));
  }

  async function handlePageTwoTabClick() {
    if (currentPage === 2 || isLoadingApplicationQuestions) return;

    if (!isPageOneReadyForQuestions()) {
      showStatusModal({
        type: "error",
        title: "Required Information Incomplete",
        message:
          "Please complete all required fields in Page 1 before proceeding to Position Screening Questions.",
      });
      return;
    }

    await handleNextPage();
  }

  async function handleNextPage() {
    const applicantNameAvailable = await ensureApplicantNameAvailable();

    if (!applicantNameAvailable) return;
    if (!validatePageOne()) return;

    setIsPageOneComplete(true);

    const positionId = cleanText(form.positionId);

    if (!positionId) {
      showStatusModal({
        type: "error",
        title: "Position configuration unavailable",
        message:
          "The selected open position does not have a Position ID. Please select the position again.",
      });
      return;
    }

    setIsLoadingApplicationQuestions(true);
    setApplicationQuestionsError("");

    try {
      const response = await getTalentPoolApplicationForm(positionId);

      if (!response?.success) {
        throw new Error(
          response?.message || "Failed to load application questions.",
        );
      }

      const nextForm = response?.data?.form || null;
      const nextQuestions = normalizeApplicationFormQuestions(
        response?.data || {},
      );

      setApplicationForm(nextForm);
      setApplicationQuestions(nextQuestions);
      setApplicationQuestionAnswers((previous) =>
        createQuestionAnswerState(nextQuestions, previous),
      );
      setCurrentPage(2);

      window.setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 50);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load application questions.";

      setApplicationQuestionsError(message);

      showStatusModal({
        type: "error",
        title: "Unable to load position questions",
        message,
      });
    } finally {
      setIsLoadingApplicationQuestions(false);
    }
  }

  function handlePreviousPage() {
    setCurrentPage(1);
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (currentPage !== 2) {
      await handleNextPage();
      return;
    }

    if (!validatePageOne() || !validatePageTwo()) return;

    setIsSubmitting(true);

    const submitForm = {
      ...normalizePublicFormFields(form),
      referredBy: hasEmployeeReferralProgram ? form.referredBy : "",
      employeeId: hasEmployeeReferralProgram ? form.employeeId : "",
      phone1: normalizePhoneNumberForSubmit(form.phone1),
      phone2: normalizePhoneNumberForSubmit(form.phone2),
      reference1Phone: normalizePhoneNumberForSubmit(form.reference1Phone),
      reference2Phone: normalizePhoneNumberForSubmit(form.reference2Phone),
      reference3Phone: normalizePhoneNumberForSubmit(form.reference3Phone),
      educationDetails: normalizeEducationDetails(form.educationDetails),
      trainingAttended: normalizeTrainingEntries(form.trainingAttended),
      otherExperiences: form.otherExperiences.map(normalizeExperienceValues),
      positionId: form.positionId,
      applicationFormAnswers: buildApplicationFormAnswersPayload(
        applicationQuestions,
        applicationQuestionAnswers,
      ),
      audioFile: audioFileRef.current || form.audioFile,
      attachmentFile: attachmentFileRef.current || form.attachmentFile,
    };

    try {
      const response = await submitPublicTalentPoolApplication(submitForm);

      if (!response?.success) {
        if (response?.code === "APPLICANT_NAME_EXISTS") {
          const nameKey = buildApplicantNameCheckKey({
            firstName: form.firstName,
            middleName: form.middleName,
            lastName: form.lastName,
          });

          setApplicantNameCheck({
            status: "duplicate",
            key: nameKey,
            duplicate: true,
            source: null,
          });
          setCurrentPage(1);
          setIsPageOneComplete(false);
          return;
        }

        showStatusModal({
          type: "error",
          title: "Application not saved",
          message:
            response?.message ||
            "The application was not saved. Please check the required fields and try again.",
        });
        return;
      }

      const savedSubmission = response?.data;

      audioFileRef.current = null;
      attachmentFileRef.current = null;

      if (audioInputRef.current) {
        audioInputRef.current.value = "";
      }

      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = "";
      }

      setSubmittedRecord(savedSubmission);
      referralPrefillValuesRef.current = null;
      setHasReferralCode("");
      setReferralLookupStatus("");
      setReferralLookupMessage("");
      setIsLoadingReferralPrefill(false);
      setForm(createEmptyPublicForm());
      setCurrentPage(1);
      setApplicationForm(null);
      setApplicationQuestions([]);
      setApplicationQuestionAnswers({});
      setApplicationQuestionsError("");
      setIsLoadingApplicationQuestions(false);
      setHighlightAudio(false);
      setHighlightAttachment(false);
      setHighlightConsent(false);

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("ta-public-submissions-updated", {
            detail: savedSubmission,
          }),
        );
      }

      showStatusModal({
        type: "success",
        title: "Application Success",
        message:
          "We will review your application and we will send an update through email.",
      });
    } catch (error) {
      console.error("Submit public talent pool application error:", error);

      showStatusModal({
        type: "error",
        title: "Application not saved",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to submit application. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-sibs-primary-3 font-jakarta text-[#101828]">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[1000] -translate-y-20 rounded-md bg-[#042C51] px-4 py-2 text-sm font-bold text-white transition-transform focus:translate-y-0 focus-visible:ring-2 focus-visible:ring-[#FF5C28] focus-visible:ring-offset-2"
      >
        Skip to application
      </a>
      <PublicWebsiteNavbar completionPercentage={completionPercentage} />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1"
      >
        <section
          data-testid="public-application-hero"
          className="relative border-b border-[#E5EAEF] bg-white px-4 sm:px-6"
        >
          <div className="mx-auto flex min-h-0 w-full max-w-[980px] items-center py-4 sm:py-5 lg:py-6 2xl:min-h-[240px] 2xl:py-10">
            <div className="max-w-[820px]">
              <h1 className="font-heading text-2xl font-black leading-tight tracking-tight text-[#042C51] sm:text-3xl lg:text-4xl 2xl:text-[3.25rem] 2xl:leading-[1.02]">
                <span className="relative inline-block">
                  <span
                    aria-hidden="true"
                    className="absolute bottom-[0.14em] -left-1 -right-1 h-[0.35em] bg-[#FFD400]"
                  />
                  <span className="relative">Apply</span>
                </span>{" "}
                to join SiBS
              </h1>

              <p className="mt-2 max-w-[760px] text-xs font-medium leading-5 text-[#243B55] sm:mt-2.5 sm:text-sm sm:leading-6 2xl:mt-4 2xl:text-base 2xl:leading-7">
                Complete your application and take the next step toward joining
                the SiBS team. Tell us about your experience, qualifications,
                and the position that fits you best.
              </p>

              <div className="mt-2.5 flex flex-wrap gap-2 2xl:mt-4 2xl:gap-2.5">
                <span className="inline-flex min-h-7 items-center gap-1.5 rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 text-[10px] font-bold text-[#042C51] 2xl:min-h-8 2xl:gap-2 2xl:px-3 2xl:text-[11px]">
                  <ShieldCheck size={13} className="2xl:h-3.5 2xl:w-3.5" aria-hidden="true" />
                  No account required
                </span>
                <span className="inline-flex min-h-7 items-center gap-1.5 rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 text-[10px] font-bold text-[#042C51] 2xl:min-h-8 2xl:gap-2 2xl:px-3 2xl:text-[11px]">
                  <BriefcaseBusiness size={13} className="2xl:h-3.5 2xl:w-3.5" aria-hidden="true" />
                  Two-part application
                </span>
                <span className="inline-flex min-h-7 items-center gap-1.5 rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 text-[10px] font-bold text-[#042C51] 2xl:min-h-8 2xl:gap-2 2xl:px-3 2xl:text-[11px]">
                  <CircleCheckBig size={13} className="2xl:h-3.5 2xl:w-3.5" aria-hidden="true" />
                  Progress shown as you complete the form
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-[1120px] px-4 pt-4 pb-8 sm:px-6 2xl:pt-6 2xl:pb-12">
          {loadError && (
            <section className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 shadow-sm">
              {loadError}
            </section>
          )}

          {submittedRecord && (
            <section className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <CheckCircle2 size={22} />
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-emerald-700">
                    Application Success
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-emerald-700/80">
                    We will review your application and we will send an update
                    through email.
                    {submittedRecord?.candidateId && (
                      <>
                        {" "}
                        Your Candidate ID is{" "}
                        <span className="font-extrabold">
                          {submittedRecord.candidateId}
                        </span>
                        .
                      </>
                    )}
                  </p>
                </div>
              </div>
            </section>
          )}

          <form onSubmit={handleSubmit} className="mx-auto max-w-[980px] space-y-4 2xl:space-y-6 pt-0">
          {isLoadingData ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-[#174A7C] shadow-sm">
              Loading form options and approved open positions from the
              database...
            </div>
          ) : null}

          <ApplicationPageTabs
            visible={shouldRenderApplicationFields}
            currentPage={currentPage}
            isPageOneComplete={isPageOneComplete}
            isLoadingPageTwo={
              isLoadingApplicationQuestions || isApplicantNameGateLocked
            }
            completionPercentage={completionPercentage}
            onPageOneClick={handlePreviousPage}
            onPageTwoClick={handlePageTwoTabClick}
          />

          {currentPage === 1 ? (
            <SectionCard
            icon={BriefcaseBusiness}
            step={1}
            title="Application Source and Position"
            description="Tell us where you learned about SiBS and what position you are applying for."
          >
            <div className="space-y-3.5 2xl:space-y-4">
              <div className="rounded-2xl border border-[#DCE6F1] bg-[#F8FAFC] p-3.5 sm:p-4 2xl:p-5 shadow-sm">
                <div className="flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between 2xl:gap-4">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#E6531B]">
                      Referral
                    </p>
                    <p className="mt-0.5 text-xs 2xl:text-sm font-extrabold text-[#042C51] 2xl:mt-1">
                      Do you have a referral code? <RequiredMark />
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold leading-4 text-[#667085] 2xl:text-xs 2xl:leading-5">
                      Select Yes if a referral code was shared with you. Select
                      No to continue with the regular application form.
                    </p>
                  </div>

                  <div className="grid w-full grid-cols-2 gap-2 md:w-[220px] 2xl:w-[260px]">
                    <button
                      type="button"
                      onClick={() => handleReferralChoiceChange("Yes")}
                      className={`h-8.5 2xl:h-10 rounded-[10px] border px-3 2xl:px-4 text-xs font-extrabold transition ${
                        hasReferralCode === "Yes"
                          ? "border-[#FF5C28] bg-[#FFF0EB] text-[#FF5C28] shadow-sm"
                          : "border-[#DCE6F1] bg-white text-[#344054] hover:border-[#FF5C28]/40 hover:bg-[#FFF9F6] hover:text-[#FF5C28]"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReferralChoiceChange("No")}
                      className={`h-8.5 2xl:h-10 rounded-[10px] border px-3 2xl:px-4 text-xs font-extrabold transition ${
                        hasReferralCode === "No"
                          ? "border-[#FF5C28] bg-[#FFF0EB] text-[#FF5C28] shadow-sm"
                          : "border-[#DCE6F1] bg-white text-[#344054] hover:border-[#FF5C28]/40 hover:bg-[#FFF9F6] hover:text-[#FF5C28]"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              {!hasReferralCode ? (
                <div
                  data-testid="referral-gate-status"
                  aria-live="polite"
                  className="rounded-xl border border-[#DCE6F1] bg-[#F8FAFC] px-4 py-3 text-xs font-semibold leading-5 text-[#667085]"
                >
                  Select Yes or No above to continue with the application.
                </div>
              ) : null}

              {hasReferralCode === "Yes" ? (
                <div className="rounded-2xl border border-[#FFB27A] bg-[#FFF7F1] p-4 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#E6531B]">
                        Referral Code
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-[#042C51]">
                        Enter and match your referral code to continue.
                      </p>
                      {isReferralCodeFromEmail ? (
                        <p className="mt-1 text-xs font-semibold text-emerald-700">
                          {isLoadingReferralPrefill
                            ? "Loading your saved applicant lead information..."
                            : "This referral code came from your email invitation."}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs font-semibold text-[#667085]">
                          The remaining application fields will appear after a
                          valid referral code is matched.
                        </p>
                      )}
                    </div>
                    <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                      {referralLookupStatus ? (
                        <div
                          className={[
                            "flex min-h-10 items-center gap-1.5 text-xs font-extrabold md:max-w-[190px]",
                            referralLookupStatus === "matched"
                              ? "text-emerald-700"
                              : referralLookupStatus === "missing"
                                ? "text-amber-700"
                                : "text-[#174A7C]",
                          ].join(" ")}
                        >
                          {referralLookupStatus === "checking" ? (
                            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                          ) : referralLookupStatus === "matched" ? (
                            <CircleCheckBig className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className="leading-tight">
                            {referralLookupMessage}
                          </span>
                        </div>
                      ) : null}
                      <input
                        value={form.referralCode}
                        disabled={isReferralCodeFromEmail}
                        maxLength={10}
                        onChange={(e) =>
                          updateFormField(
                            "referralCode",
                            e.target.value.toUpperCase().slice(0, 10),
                          )
                        }
                        placeholder="e.g. REF-******"
                        className={[
                          "public-referral-code-input h-10 w-full rounded-[10px] border bg-white px-3 text-xs font-semibold uppercase text-[#042C51] transition placeholder:text-[#98A2B3] disabled:cursor-not-allowed disabled:border-[#D7DEE8] disabled:bg-[#F2F4F7] disabled:text-[#667085] md:w-[260px]",
                          referralLookupStatus === "matched"
                            ? "public-referral-code-input--matched"
                            : referralLookupStatus === "missing"
                              ? "public-referral-code-input--missing"
                              : "public-referral-code-input--default",
                          isReferralCodeFromEmail ? "cursor-not-allowed" : "",
                        ].join(" ")}
                      />
                    </div>
                  </div>
                </div>
              ) : null}


              {shouldShowApplicationFields ? (
                <>
                  <div>
                    <FieldLabel>
                      How did you first hear about us? <RequiredMark />
                </FieldLabel>
                <MultiSelectCheckboxGroup
                  required
                  options={formOptions.hearAboutUs}
                  values={form.hearAboutUs}
                  onChange={handleHearAboutUsChange}
                  disabled={isReferralCodeMatched}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>
                    Check our open positions <RequiredMark />
                  </FieldLabel>

                  <PositionJobDescriptionDropdown
                    value={form.selectedAvailablePositionId}
                    disabled={isLoadingData || !activePositionOptions.length}
                    positions={activePositionOptions}
                    placeholder={
                      isLoadingData
                        ? "Loading positions..."
                        : activePositionOptions.length
                          ? "Select open position"
                          : "No approved active positions found"
                    }
                    onChange={handleAvailablePositionChange}
                    onOpenJobDescription={handleOpenPositionJobDescription}
                  />

                  <p className="mt-2 text-xs font-semibold text-gray-500">
                    Only approved and active available positions are shown.
                  </p>
                </div>

                <div>
                  <FieldLabel>
                    Which location are you applying for? <RequiredMark />
                  </FieldLabel>
                  <DatabaseSelect
                    required
                    value={form.applyingLocation}
                    options={formOptions.locations}
                    placeholder="Select location"
                    onChange={(value) =>
                      updateFormField("applyingLocation", value)
                    }
                    zIndex="z-[190]"
                  />
                </div>

                <div>
                  <FieldLabel>Nickname</FieldLabel>
                  <input
                    value={form.nickname}
                    onChange={(e) =>
                      updateFormField("nickname", e.target.value)
                    }
                    placeholder="Preferred nickname"
                    className={inputClass()}
                  />
                </div>

                {hasEmployeeReferralProgram && (
                  <>
                    <div>
                      <FieldLabel>
                        Who referred you to us? <RequiredMark />
                      </FieldLabel>
                      <input
                        required
                        value={form.referredBy}
                        onChange={(e) =>
                          updateFormField("referredBy", e.target.value)
                        }
                        placeholder="Referrer name"
                        className={inputClass()}
                      />
                    </div>

                    <div>
                      <FieldLabel>
                        Employee ID <RequiredMark />
                      </FieldLabel>
                      <input
                        required
                        value={form.employeeId}
                        onChange={(e) =>
                          updateFormField("employeeId", e.target.value)
                        }
                        placeholder="Referrer employee ID"
                        className={inputClass()}
                      />
                    </div>
                  </>
                )}
                  </div>
                </>
              ) : null}
            </div>
          </SectionCard>
          ) : null}

          {shouldRenderApplicationFields ? (
            <>
              {currentPage === 1 ? (
                <>
              <SectionCard
                icon={UserPlus}
            step={2}
            title="Personal Information"
            description="Enter your legal name, contact details, and address."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <FieldLabel>
                  First Name <RequiredMark />
                </FieldLabel>
                <input
                  required
                  value={form.firstName}
                  onChange={(e) => updateFormField("firstName", e.target.value)}
                  placeholder="Enter first name"
                  aria-invalid={hasDuplicateApplicantName}
                  className={inputClass(
                    hasDuplicateApplicantName
                      ? "border-red-300 bg-red-50 ring-4 ring-red-100 focus:border-red-400 focus:ring-red-100"
                      : "",
                  )}
                />
              </div>

              <div>
                <FieldLabel>
                  Middle Name <RequiredMark />
                </FieldLabel>
                <input
                  required
                  value={form.middleName}
                  onChange={(e) =>
                    updateFormField("middleName", e.target.value)
                  }
                  placeholder="Enter middle name"
                  aria-invalid={hasDuplicateApplicantName}
                  className={inputClass(
                    hasDuplicateApplicantName
                      ? "border-red-300 bg-red-50 ring-4 ring-red-100 focus:border-red-400 focus:ring-red-100"
                      : "",
                  )}
                />
              </div>

              <div>
                <FieldLabel>
                  Last Name <RequiredMark />
                </FieldLabel>
                <input
                  required
                  value={form.lastName}
                  onChange={(e) => updateFormField("lastName", e.target.value)}
                  placeholder="Enter last name"
                  aria-invalid={hasDuplicateApplicantName}
                  className={inputClass(
                    hasDuplicateApplicantName
                      ? "border-red-300 bg-red-50 ring-4 ring-red-100 focus:border-red-400 focus:ring-red-100"
                      : "",
                  )}
                />
              </div>

              <div>
                <FieldLabel>Suffix</FieldLabel>
                <input
                  value={form.suffix}
                  onChange={(e) => updateFormField("suffix", e.target.value)}
                  placeholder="Jr., Sr., III"
                  className={inputClass()}
                />
              </div>

              {hasDuplicateApplicantName ? (
                <div
                  data-testid="duplicate-applicant-name-error"
                  className="md:col-span-4 -mt-1 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold leading-5 text-red-700"
                  role="alert"
                >
                  Applicant already exists in SiBS records. The same First Name,
                  Middle Name, and Last Name cannot be used for another application.
                </div>
              ) : applicantNameCheck.status === "checking" ? (
                <div className="md:col-span-4 -mt-1 rounded-[10px] border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs font-bold leading-5 text-[#174A7C]">
                  Checking applicant name in Kronos and Talent Pool...
                </div>
              ) : applicantNameCheck.status === "error" ? (
                <div className="md:col-span-4 -mt-1 rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-bold leading-5 text-amber-700">
                  Applicant name could not be verified. Update the name fields to try again.
                </div>
              ) : !isApplicantNameVerifiedAvailable ? (
                <div className="md:col-span-4 -mt-1 rounded-[10px] border border-[#DCE6F1] bg-[#F8FAFC] px-3 py-2.5 text-xs font-bold leading-5 text-[#667085]">
                  Complete First Name, Middle Name, and Last Name to unlock the rest of the form.
                </div>
              ) : null}

              <fieldset
                data-testid="applicant-name-dependent-fields"
                disabled={isApplicantNameGateLocked}
                className={`contents ${isApplicantNameGateLocked ? "opacity-60" : ""}`}
              >
              <div>
                <FieldLabel>
                  Date of Birth <RequiredMark />
                </FieldLabel>

                <CalendarDatePicker
                  required
                  disabled={isApplicantNameGateLocked}
                  value={form.dateOfBirth}
                  onChange={(value) => updateFormField("dateOfBirth", value)}
                  placeholder="Select date"
                />

                {age !== null && (
                  <p className="mt-2 text-xs font-bold text-[#667085]">
                    Age as of application date: {age}
                  </p>
                )}
              </div>

              <div>
                <FieldLabel>
                  Email <RequiredMark />
                </FieldLabel>
                <input
                  required
                  disabled={isApplicantNameGateLocked}
                  type="email"
                  value={form.email}
                  onChange={(e) => updateFormField("email", e.target.value)}
                  placeholder="Enter email"
                  className={inputClass("", { uppercase: false })}
                />
              </div>

              <div>
                <FieldLabel>Phone 1</FieldLabel>
                <input
                  disabled={isApplicantNameGateLocked}
                  value={form.phone1}
                  onChange={(e) =>
                    updateFormField(
                      "phone1",
                      normalizePhoneNumberInput(e.target.value),
                    )
                  }
                  placeholder="09xxxxxxxxx"
                  inputMode="numeric"
                  maxLength={11}
                  className={inputClass()}
                />
              </div>

              <div>
                <FieldLabel>Phone 2</FieldLabel>
                <input
                  disabled={isApplicantNameGateLocked}
                  value={form.phone2}
                  onChange={(e) =>
                    updateFormField(
                      "phone2",
                      normalizePhoneNumberInput(e.target.value),
                    )
                  }
                  placeholder="Optional"
                  inputMode="numeric"
                  maxLength={11}
                  className={inputClass()}
                />
              </div>

              <div className="md:col-span-4">
                <FieldLabel>
                  Physical Address <RequiredMark />
                </FieldLabel>
                <input
                  required
                  disabled={isApplicantNameGateLocked}
                  value={form.physicalAddress}
                  onChange={(e) =>
                    updateFormField("physicalAddress", e.target.value)
                  }
                  placeholder="Complete physical address"
                  className={inputClass()}
                />
              </div>
              </fieldset>
            </div>
          </SectionCard>

          <fieldset
            disabled={isApplicantNameGateLocked}
            className={isApplicantNameGateLocked ? "space-y-6 opacity-60" : "space-y-6"}
          >
          <SectionCard
            icon={BriefcaseBusiness}
            step={3}
            title="Work Experience"
            description="Additional work experience fields will appear when you select Has work Experience."
          >
            <div className="space-y-4">
              <div>
                <FieldLabel>
                  Work experience <RequiredMark />
                </FieldLabel>
                <DatabaseSelect
                  required
                  value={form.workExperience}
                  options={formOptions.workExperience}
                  placeholder="Select work experience"
                  onChange={(value) => updateFormField("workExperience", value)}
                  zIndex="z-[180]"
                />
              </div>

              {hasRelevantExperience && (
                <div className="space-y-4">
                  <ExperienceFields
                    title="Industry or Relevant Experience"
                    lengthOptions={formOptions.lengthOfExperience}
                    experience={{
                      industryRelevantExperience:
                        form.industryRelevantExperience,
                      lengthOfWorkExperience: form.lengthOfWorkExperience,
                      years: form.years,
                      role: form.role,
                      company: form.company,
                      monthlyCompensation: form.monthlyCompensation,
                      reasonForLeaving: form.reasonForLeaving,
                    }}
                    onChange={updatePrimaryExperience}
                  />

                  <WorkReadinessQuestion
                    question="Do you have other experience?"
                    name="has-other-experience"
                    required={false}
                    value={form.hasOtherExperience}
                    options={formOptions.yesNo}
                    onChange={handleOtherExperienceAnswer}
                  />

                  {form.hasOtherExperience === "Yes" &&
                    form.otherExperiences.map((experience, index) => (
                      <ExperienceFields
                        key={`other-experience-${index}`}
                        title={`Other Experience ${index + 1}`}
                        lengthOptions={formOptions.lengthOfExperience}
                        experience={experience}
                        onChange={(nextExperience) =>
                          updateOtherExperience(index, nextExperience)
                        }
                        showRemove
                        onRemove={() => removeOtherExperience(index)}
                      />
                    ))}

                  {form.hasOtherExperience === "Yes" && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={addOtherExperience}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#FF5C28] px-4 text-xs font-extrabold text-white shadow-sm transition-colors hover:bg-[#F04B18] focus-visible:ring-2 focus-visible:ring-[#042C51] focus-visible:ring-offset-2"
                      >
                        <Plus size={14} />
                        Add Other Experience
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </SectionCard>

          <div ref={educationSectionRef}>
            <SectionCard
              icon={GraduationCap}
              step={4}
              title="Education, Affiliations, and Training"
              description="Select educational attainment and complete the school details required for that level."
            >
              <div className="space-y-5">
                <div>
                  <FieldLabel>
                    Highest Educational Attainment <RequiredMark />
                  </FieldLabel>
                  <DatabaseSelect
                    required
                    value={form.highestEducationalAttainment}
                    options={formOptions.educationalAttainment}
                    placeholder="Select educational attainment"
                    onChange={handleEducationalAttainmentChange}
                    zIndex="z-[170]"
                  />
                </div>

                <EducationDetailsFields
                  attainment={form.highestEducationalAttainment}
                  details={form.educationDetails}
                  onChange={updateEducationDetails}
                />

                <div>
                  <FieldLabel>Affiliations and Certifications</FieldLabel>
                  <MultiSelectCheckboxGroup
                    options={formOptions.affiliationCertification}
                    values={form.affiliationsAndCertifications}
                    onChange={(values) =>
                      updateFormField("affiliationsAndCertifications", values)
                    }
                  />
                </div>

                <div>
                  <FieldLabel>Training Attended</FieldLabel>
                  <div className="space-y-2">
                    {ensureTrainingEntryRows(form.trainingAttended).map(
                      (training, index) => (
                        <div
                          key={`training-attended-${index}`}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="text"
                            value={training}
                            onChange={(event) =>
                              updateTrainingAttended(index, event.target.value)
                            }
                            placeholder="LIST TRAINING ATTENDED"
                            className={inputClass("flex-1")}
                          />

                          {index ===
                          ensureTrainingEntryRows(form.trainingAttended).length -
                            1 ? (
                            <button
                              type="button"
                              onClick={addTrainingAttended}
                              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-blue-100 bg-blue-50 text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                              aria-label="Add training attended"
                              title="Add training"
                            >
                              <Plus size={16} />
                            </button>
                          ) : null}

                          {canRemoveTrainingEntryRow(
                            index,
                            ensureTrainingEntryRows(form.trainingAttended)
                              .length,
                          ) ? (
                            <button
                              type="button"
                              onClick={() => removeTrainingAttended(index)}
                              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-red-100 bg-red-50 text-red-600 transition hover:border-red-200 hover:bg-red-100"
                              aria-label="Remove training attended"
                              title="Remove training"
                            >
                              <Trash2 size={15} />
                            </button>
                          ) : null}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            icon={ShieldCheck}
            step={5}
            title="Work Readiness Questions"
            description="These questions help Talent Acquisition review work setup and compliance readiness."
          >
            <div className="space-y-3">
              <WorkReadinessQuestion
                question="Are you fully vaccinated?"
                name="work-readiness-fully-vaccinated"
                value={form.fullyVaccinated}
                options={formOptions.yesNo}
                onChange={(value) => updateFormField("fullyVaccinated", value)}
              />

              <WorkReadinessQuestion
                question="Are you comfortable working on site?"
                name="work-readiness-comfortable-on-site"
                value={form.comfortableOnSite}
                options={formOptions.yesNo}
                onChange={(value) =>
                  updateFormField("comfortableOnSite", value)
                }
              />

              <WorkReadinessQuestion
                question="Are you willing to work in graveyard shift?"
                name="work-readiness-willing-graveyard"
                value={form.willingGraveyard}
                options={formOptions.yesNo}
                onChange={(value) => updateFormField("willingGraveyard", value)}
              />

              <WorkReadinessQuestion
                question="Full-time, part-time, or either?"
                name="work-readiness-employment-interest"
                value={form.employmentInterest}
                options={formOptions.employmentInterest}
                onChange={(value) =>
                  updateFormField("employmentInterest", value)
                }
                optionClassName="min-w-[104px]"
              />

              <WorkReadinessQuestion
                question="If this is a remote position, do you have access to a computer, Internet connection, and a private space to work remotely?"
                name="work-readiness-remote-work-access"
                value={form.remoteWorkAccess}
                options={formOptions.yesNo}
                onChange={(value) => updateFormField("remoteWorkAccess", value)}
              />

              <WorkReadinessQuestion
                question="Are you willing to undertake a drug test as part of this hiring process?"
                name="work-readiness-willing-drug-test"
                value={form.willingDrugTest}
                options={formOptions.yesNo}
                onChange={(value) => updateFormField("willingDrugTest", value)}
              />

              <WorkReadinessQuestion
                question="Are you willing to allow SiBS to undergo a background check as part of this hiring process?"
                name="work-readiness-background-check"
                value={form.willingBackgroundCheck}
                options={formOptions.yesNo}
                onChange={(value) =>
                  updateFormField("willingBackgroundCheck", value)
                }
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={Users}
            step={6}
            title="Character References"
            description="Provide three people who can confirm your employment, education, or character background."
          >
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {[
                {
                  number: 1,
                  name: form.reference1Name,
                  phone: form.reference1Phone,
                  nameField: "reference1Name",
                  phoneField: "reference1Phone",
                },
                {
                  number: 2,
                  name: form.reference2Name,
                  phone: form.reference2Phone,
                  nameField: "reference2Name",
                  phoneField: "reference2Phone",
                },
                {
                  number: 3,
                  name: form.reference3Name,
                  phone: form.reference3Phone,
                  nameField: "reference3Name",
                  phoneField: "reference3Phone",
                },
              ].map((reference) => (
                <div
                  key={reference.number}
                  className="rounded-[12px] border border-[#DCE6F1] bg-[#F8FAFC] p-4"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-[#FFF0EB] text-[10px] font-extrabold text-[#FF5C28]">
                      {reference.number}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-normal text-[#042C51]">
                      Reference {reference.number}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <FieldLabel>
                        Full Name <RequiredMark />
                      </FieldLabel>
                      <input
                        required
                        value={reference.name}
                        onChange={(event) =>
                          updateFormField(
                            reference.nameField,
                            event.target.value,
                          )
                        }
                        placeholder="Reference name"
                        className={inputClass()}
                      />
                    </div>

                    <div>
                      <FieldLabel>
                        Phone Number <RequiredMark />
                      </FieldLabel>
                      <input
                        required
                        type="tel"
                        value={reference.phone}
                        onChange={(event) =>
                          updateFormField(
                            reference.phoneField,
                            normalizeReferencePhoneInput(
                              event.target.value,
                              reference.phone,
                            ),
                          )
                        }
                        placeholder="09xxxxxxxxx"
                        inputMode="numeric"
                        maxLength={11}
                        pattern="09[0-9]{9}"
                        title="Enter an 11-digit phone number starting with 09"
                        className={inputClass()}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <section className="flex flex-col gap-3 rounded-2xl border border-[#E6ECF2] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 2xl:p-6 shadow-[0_8px_24px_rgba(4,44,81,0.05)]">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#E6531B]">
                Page 1 complete
              </p>
              <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-[#042C51] 2xl:mt-1">
                Continue to the questions for {form.openPosition || "your selected position"}.
              </p>
              <p className="mt-0.5 text-[11px] font-semibold leading-4 text-[#667085] sm:text-xs 2xl:mt-1 2xl:leading-5">
                Your answers, uploads, consent, and final submission are on the next page.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting || isLoadingApplicationQuestions}
                className="inline-flex h-9 2xl:h-11 items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-lg 2xl:rounded-xl border border-[#D6DEE8] bg-white px-3.5 sm:px-4 2xl:px-5 text-xs 2xl:text-sm font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/50 hover:bg-[#FFF7F3] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={15} className="shrink-0" />
                Reset Form
              </button>

              <button
                type="submit"
                disabled={!canSubmit || isLoadingApplicationQuestions}
                className="inline-flex h-9 2xl:h-11 items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-lg 2xl:rounded-xl bg-[#FF5C28] px-4 sm:px-5 2xl:px-6 text-xs 2xl:text-sm font-extrabold text-white transition-colors hover:bg-[#EB3800] focus-visible:ring-2 focus-visible:ring-[#FF5C28] focus-visible:ring-offset-2 active:bg-[#D94514] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoadingApplicationQuestions ? (
                  <Loader2 size={15} className="animate-spin shrink-0" />
                ) : (
                  <ChevronRight size={15} className="shrink-0" />
                )}
                {isLoadingApplicationQuestions ? "Loading Questions..." : "Next"}
              </button>
            </div>
          </section>
          </fieldset>
                </>
              ) : (
                <>
          <div ref={questionsSectionRef}>
            <SectionCard
              icon={BriefcaseBusiness}
              step={7}
              title="Position Questions"
              description={`Answer the text questions configured for ${form.openPosition || "the selected position"}.`}
            >
              <div className="space-y-4">
                {applicationQuestionsError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {applicationQuestionsError}
                  </div>
                ) : null}

                {applicationForm?.formName ? (
                  <div className="rounded-2xl border border-[#DCE6F1] bg-[#F8FAFC] px-4 py-3 sm:px-5 sm:py-3.5 2xl:py-4 font-jakarta">
                    <p className="text-[10px] 2xl:text-[11px] font-extrabold uppercase tracking-wide text-[#E6531B]">
                      Application Form
                    </p>
                    <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-[#042C51] 2xl:mt-1">
                      {applicationForm.formName}
                    </p>
                  </div>
                ) : null}

                {applicationQuestions.length ? (
                  <div className="space-y-3.5 font-jakarta">
                    {applicationQuestions.map((question, index) => {
                      const answer =
                        applicationQuestionAnswers?.[String(question.id)] || {
                          answerType: "Text",
                          textAnswer: "",
                        };
                      const textOptions =
                        getApplicationQuestionTextOptions(question);

                      return (
                        <div
                          key={question.id}
                          className="rounded-2xl border border-[#DCE6F1] bg-[#F8FAFC] p-3.5 sm:p-4.5 2xl:p-5"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF0EB] text-[10px] font-extrabold text-[#FF5C28]">
                                {index + 1}
                              </span>
                              {question.isRequired ? (
                                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-red-600">
                                  Required
                                </span>
                              ) : (
                                <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
                                  Optional
                                </span>
                              )}
                            </div>
                            <div className="mt-2.5 text-xs sm:text-sm font-extrabold leading-5 text-[#042C51] 2xl:leading-6">
                              <RichTextViewer
                                value={question.questionText}
                                emptyText="Untitled question"
                                className="text-[#042C51]"
                              />
                            </div>
                            {question.helperText ? (
                              <p className="mt-0.5 text-[11px] sm:text-xs font-semibold leading-4 text-[#667085] 2xl:leading-5">
                                {question.helperText}
                              </p>
                            ) : null}
                          </div>

                          <div className="mt-3.5">
                            <FieldLabel>
                              Text Answer {question.isRequired ? <RequiredMark /> : null}
                            </FieldLabel>
                            {textOptions.length ? (
                              <DatabaseSelect
                                required={question.isRequired}
                                value={answer.textAnswer || ""}
                                options={textOptions}
                                placeholder="Select answer"
                                onChange={(value) =>
                                  updateApplicationQuestionAnswer(question.id, {
                                    answerType: "Text",
                                    textAnswer: value,
                                  })
                                }
                                zIndex="z-[160]"
                              />
                            ) : (
                              <AutoResizeTextarea
                                required={question.isRequired}
                                value={answer.textAnswer || ""}
                                onChange={(event) =>
                                  updateApplicationQuestionAnswer(question.id, {
                                    answerType: "Text",
                                    textAnswer: event.target.value,
                                  })
                                }
                                placeholder={
                                  question.placeholderText ||
                                  "Type your answer here"
                                }
                                className={textareaClass("min-h-9 2xl:min-h-11 leading-5 2xl:leading-6")}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-xs sm:text-sm font-semibold leading-5 text-emerald-800 2xl:leading-6">
                    No additional application questions are configured for this position. You can continue with the uploads and consent below.
                  </div>
                )}


              </div>
            </SectionCard>
          </div>

          <div ref={fileSectionRef}>
            <SectionCard
              icon={Mic}
              step={8}
              title="Audio and File Upload"
              description="Upload a single audio file answering the listed questions and one supporting document/file."
            >
              <div className="space-y-5">
                <div className="rounded-2xl border border-[#FFD9C7] bg-[#FFFBF9] p-3.5 sm:p-4.5 2xl:p-5 font-jakarta">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FFF0EB] text-[#FF5C28]">
                      <Mic size={14} />
                    </span>
                    <p className="text-xs sm:text-sm font-extrabold text-[#042C51]">
                      Your audio file must answer these questions:
                    </p>
                  </div>

                  {formOptions.audioQuestions.length ? (
                    <ul className="mt-2.5 space-y-1.5 pl-1">
                      {formOptions.audioQuestions.map((question) => (
                        <li
                          key={question.id || getOptionValue(question)}
                          className="flex items-start gap-2 text-xs sm:text-[13px] font-bold text-[#042C51]"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF5C28]" />
                          <span>{getOptionLabel(question)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs font-semibold text-[#667085]">
                      No audio questions configured in the database.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 items-stretch gap-3 sm:gap-4 lg:grid-cols-2 font-jakarta">
                  <div className="flex flex-col">
                    <FieldLabel>
                      Upload single audio file <RequiredMark />
                    </FieldLabel>
                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      className={`group flex w-full flex-1 min-h-[160px] 2xl:min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-5 2xl:px-5 2xl:py-6 text-center transition hover:border-[#FF5C28] hover:bg-[#FFF9F6] ${
                        highlightAudio && !selectedAudioFile
                          ? "border-red-300 bg-red-50 ring-4 ring-red-100"
                          : selectedAudioFile
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-[#D6E0EA] bg-[#F8FAFC]"
                      }`}
                    >
                      <div className="flex h-11 w-11 2xl:h-12 2xl:w-12 items-center justify-center rounded-xl bg-white border border-[#E6ECF2] shadow-sm text-[#FF5C28] group-hover:scale-105 transition-transform">
                        <Mic size={22} className="2xl:h-6 2xl:w-6" />
                      </div>
                      <p className="mt-2.5 max-w-full truncate text-xs sm:text-sm font-extrabold text-[#042C51] group-hover:text-[#FF5C28] transition-colors">
                        {selectedAudioFile?.name || "Choose audio file"}
                      </p>
                      {selectedAudioFile && (
                        <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-emerald-700">
                          Audio selected • {formatFileSize(selectedAudioFile)}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] 2xl:text-[11px] font-semibold text-[#667085]">
                        Accepted: MP3, WAV, M4A, AAC, OGG, WEBM, MP4, FLAC, AMR,
                        3GP, OPUS, AIFF, CAF, WMA
                      </p>
                    </button>
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept={acceptedAudioTypes}
                      onClick={(event) => {
                        event.currentTarget.value = "";
                      }}
                      onChange={(e) => {
                        const accepted = handleFileChange(
                          "audioFile",
                          e.target.files?.[0],
                        );

                        if (!accepted) {
                          e.target.value = "";
                        }
                      }}
                      className="hidden"
                    />

                    {highlightAudio && !selectedAudioFile && (
                      <p className="mt-1.5 text-xs font-bold text-red-600">
                        Please upload your audio file before submitting.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <FieldLabel>
                      Upload supporting file/Resume <RequiredMark />
                    </FieldLabel>
                    <button
                      type="button"
                      onClick={() => attachmentInputRef.current?.click()}
                      className={`group flex w-full flex-1 min-h-[160px] 2xl:min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-5 2xl:px-5 2xl:py-6 text-center transition hover:border-[#FF5C28] hover:bg-[#FFF9F6] ${
                        highlightAttachment && !selectedAttachmentFile
                          ? "border-red-300 bg-red-50 ring-4 ring-red-100"
                          : selectedAttachmentFile
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-[#D6E0EA] bg-[#F8FAFC]"
                      }`}
                    >
                      <div className="flex h-11 w-11 2xl:h-12 2xl:w-12 items-center justify-center rounded-xl bg-white border border-[#E6ECF2] shadow-sm text-[#FF5C28] group-hover:scale-105 transition-transform">
                        <UploadCloud size={22} className="2xl:h-6 2xl:w-6" />
                      </div>
                      <p className="mt-2.5 max-w-full truncate text-xs sm:text-sm font-extrabold text-[#042C51] group-hover:text-[#FF5C28] transition-colors">
                        {selectedAttachmentFile?.name || "Choose file / Resume"}
                      </p>
                      {selectedAttachmentFile && (
                        <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-emerald-700">
                          File selected •{" "}
                          {formatFileSize(selectedAttachmentFile)}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] 2xl:text-[11px] font-semibold text-[#667085]">
                        Accepted: PDF, DOC/DOCX, XLS/CSV, JPG/JPEG, PNG, GIF
                      </p>
                    </button>
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      accept={acceptedDocumentTypes}
                      onClick={(event) => {
                        event.currentTarget.value = "";
                      }}
                      onChange={(e) => {
                        const accepted = handleFileChange(
                          "attachmentFile",
                          e.target.files?.[0],
                        );

                        if (!accepted) {
                          e.target.value = "";
                        }
                      }}
                      className="hidden"
                    />

                    {highlightAttachment && !selectedAttachmentFile && (
                      <p className="mt-1.5 text-xs font-bold text-red-600">
                        Please upload your supporting file before submitting.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          <div ref={consentRef}>
            <SectionCard
              icon={ShieldCheck}
              step={9}
              title="Terms and Privacy Consent"
              description="Review the consent statement before submitting your candidate profile."
            >
              <label
                className={`group flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 sm:p-3.5 transition font-jakarta ${
                  highlightConsent && !form.consent
                    ? "border-red-300 bg-red-50 ring-4 ring-red-100"
                    : form.consent
                      ? "border-[#FF5C28] bg-[#FFF0EB]"
                      : "border-[#DCE6F1] bg-[#F8FAFC] hover:border-[#FF5C28]/40 hover:bg-[#FFF9F6]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(event) => {
                    updateFormField("consent", event.target.checked);
                    setHighlightConsent(false);
                  }}
                  className="mt-0.5 h-3.5 w-3.5 2xl:h-4 2xl:w-4 shrink-0 cursor-pointer rounded border-[#98A2B3] accent-[#FF5C28]"
                />

                <span
                  className={`text-xs sm:text-[13px] font-bold leading-5 2xl:leading-6 transition ${
                    highlightConsent && !form.consent
                      ? "text-red-700"
                      : form.consent
                        ? "text-[#042C51]"
                        : "text-[#344054] group-hover:text-[#FF5C28]"
                  }`}
                >
                  I agree to terms &amp; conditions provided by the company. By
                  providing my phone number, I agree to receive text messages
                  from the business.
                </span>
              </label>

              {highlightConsent && !form.consent ? (
                <p className="mt-2 text-xs font-bold text-red-600">
                  Please check this consent box before submitting.
                </p>
              ) : null}
            </SectionCard>
          </div>

          <section className="flex flex-col gap-3 rounded-2xl border border-[#E6ECF2] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 2xl:p-6 shadow-[0_8px_24px_rgba(4,44,81,0.05)]">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#E6531B]">
                Ready to submit
              </p>
              <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-[#042C51] 2xl:mt-1">
                Your form is {completionPercentage}% complete.
              </p>
              <p className="mt-0.5 text-[11px] font-semibold leading-4 text-[#667085] sm:text-xs 2xl:mt-1 2xl:leading-5">
                Review your information and uploaded files before sending the
                application to Talent Acquisition.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePreviousPage}
                disabled={isSubmitting}
                className="inline-flex h-9 2xl:h-11 items-center justify-center gap-1.5 2xl:gap-2 whitespace-nowrap shrink-0 rounded-lg 2xl:rounded-xl border border-[#D6DEE8] bg-white px-3 sm:px-3.5 2xl:px-4 text-xs 2xl:text-sm font-extrabold text-[#042C51] transition hover:border-[#174A7C]/50 hover:bg-blue-50 hover:text-[#174A7C] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={15} className="shrink-0" />
                Back
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="inline-flex h-9 2xl:h-11 items-center justify-center gap-1.5 2xl:gap-2 whitespace-nowrap shrink-0 rounded-lg 2xl:rounded-xl border border-[#D6DEE8] bg-white px-3 sm:px-3.5 2xl:px-4 text-xs 2xl:text-sm font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/50 hover:bg-[#FFF7F3] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={15} className="shrink-0" />
                Reset Form
              </button>

              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex h-9 2xl:h-11 items-center justify-center gap-1.5 2xl:gap-2 whitespace-nowrap shrink-0 rounded-lg 2xl:rounded-xl bg-[#FF5C28] px-3.5 sm:px-4.5 2xl:px-6 text-xs 2xl:text-sm font-extrabold text-white transition-colors hover:bg-[#EB3800] focus-visible:ring-2 focus-visible:ring-[#FF5C28] focus-visible:ring-offset-2 active:bg-[#D94514] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={15} className="shrink-0" />
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </section>
                </>
              )}
            </>
          ) : null}
        </form>
        </div>
      </main>

      <footer className="mt-10 border-t border-[#E6ECF2] bg-white py-6 text-[#042C51] font-jakarta sm:py-7">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <div className="flex items-center gap-2.5">
              <SiBSBrandLogo className="h-5.5 w-auto" />
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-[#667085]">
                Practice. Purpose. Philosophy.
              </span>
            </div>
            <p className="text-xs text-[#667085]">
              © {new Date().getFullYear()} SiBS Outsourcing Solutions. All rights reserved.
            </p>
          </div>

          <div className="flex items-center gap-5 text-xs font-bold text-[#042C51]">
            <a
              href="https://sibscontactcenter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-[#FF5C28]"
            >
              About Us
            </a>
            <a
              href="https://sibscontactcenter.com/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-[#FF5C28]"
            >
              Applicant Privacy
            </a>
            <a
              href="https://sibscontactcenter.com/#faq"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-[#FF5C28]"
            >
              FAQ &amp; Support
            </a>
          </div>
        </div>
      </footer>

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={closeStatusModal}
        variant="center"
        lockScroll
      />
    </div>
  );
}
