import React, { useEffect, useMemo, useRef, useState } from "react";
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
} from "lucide-react";
import StatusModal from "@/components/modals/StatusModal";
import {
  checkTalentPoolCandidateFullName,
  getTalentPoolFormOptions,
  getTalentPoolOpenPositions,
  submitPublicTalentPoolApplication,
} from "@/lib/axios/publicTalentPool";

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

const defaultFormOptions = {
  hearAboutUs: [],
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
    schoolYearGraduated: normalizeSchoolYearValue(
      draft.schoolYearGraduated,
    ),
  };
}

function getEducationDetailsDraft(details = {}) {
  const draft = createEmptyEducationDetails();

  draft.attendedSeniorHighSchool = Boolean(
    details?.attendedSeniorHighSchool,
  );

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
    (config.seniorHighMode === "optional" &&
      current.attendedSeniorHighSchool)
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
    const values = normalizedDetails[section.key] || createEmptyEducationSchool();

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

function createEmptyPublicForm() {
  return {
    hearAboutUs: [],
    openPosition: "",
    nickname: "",
    applyingLocation: "",
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
    trainingAttended: "",

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

const uppercasePublicTextFields = new Set([
  "nickname",
  "referredBy",
  "employeeId",
  "firstName",
  "lastName",
  "middleName",
  "suffix",
  "physicalAddress",
  "phone1",
  "phone2",
  "industryRelevantExperience",
  "years",
  "role",
  "company",
  "monthlyCompensation",
  "reasonForLeaving",
  "trainingAttended",
  "reference1Name",
  "reference1Phone",
  "reference2Name",
  "reference2Phone",
  "reference3Name",
  "reference3Phone",
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
  return Object.entries(experience).reduce((normalizedExperience, [field, value]) => {
    normalizedExperience[field] = normalizeExperienceFieldValue(field, value);
    return normalizedExperience;
  }, {});
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

  return `h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold ${
    shouldUppercase ? "uppercase" : "normal-case"
  } text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10 ${extra}`;
}

function textareaClass(extra = "") {
  return `w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold uppercase text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10 ${extra}`;
}

function AutoResizeTextarea({
  value,
  onChange,
  minHeight = 44,
  className = "",
  ...props
}) {
  const textareaRef = useRef(null);

  function resizeTextarea(textarea) {
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, minHeight)}px`;
  }

  useEffect(() => {
    resizeTextarea(textareaRef.current);
  }, [value, minHeight]);

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
        id: option?.id || optionValue || optionLabel,
        value: optionValue || optionLabel,
        label: optionLabel || optionValue,
      };
    })
    .filter(Boolean);
}

function normalizeOptionsPayload(payload) {
  const data = payload && typeof payload === "object" ? payload : {};

  return {
    hearAboutUs: Array.isArray(data.hearAboutUs) ? data.hearAboutUs : [],
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

function normalizePosition(position) {
  return {
    id: position?.id || position?.positionId || position?.positionTitle,
    positionId: position?.positionId || position?.position_id || "",
    positionTitle:
      position?.positionTitle ||
      position?.position_title ||
      position?.title ||
      position?.name ||
      "",
    department: position?.department || "",
    locationSite: position?.locationSite || position?.location_site || "",
    status: position?.status || "",
  };
}

function FieldLabel({ children }) {
  return (
    <label className="mb-1 flex min-h-0 items-end text-xs font-bold uppercase leading-4 tracking-wide text-gray-400 md:min-h-[36px]">
      <span>{children}</span>
    </label>
  );
}

function RequiredMark() {
  return <span className="text-red-500">*</span>;
}

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        {Icon && (
          <div className="rounded-2xl bg-[var(--sibs-primary-1)]/10 p-3 text-sibs-primary-1">
            <Icon size={18} />
          </div>
        )}

        <div>
          <h3 className="text-sm font-extrabold text-gray-900">{title}</h3>
          {description && (
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {description}
            </p>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}

function EmptyOptionNotice({ message = "No options configured in database." }) {
  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
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
}) {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);

  const normalizedOptions = normalizeDropdownOptions(options);
  const selectedOption = normalizedOptions.find(
    (option) => String(option.value) === String(value || ""),
  );

  const displayText = selectedOption?.label || placeholder;

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
    <div
      ref={dropdownRef}
      className={`relative min-w-0 ${open ? zIndex : "z-[1]"}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-bold shadow-sm outline-none transition ${
          open
            ? "border-[var(--sibs-primary-1)] ring-4 ring-[var(--sibs-primary-1)]/10"
            : "border-gray-200 hover:border-[var(--sibs-primary-1)]"
        } ${
          disabled
            ? "cursor-not-allowed bg-gray-50 text-gray-400 opacity-70"
            : "text-gray-800"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selectedOption ? "text-gray-800" : "text-gray-400"
          }`}
        >
          {displayText}
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-[var(--sibs-primary-1)] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {required && (
        <input
          tabIndex={-1}
          value={value || ""}
          onChange={() => {}}
          required
          className="pointer-events-none absolute bottom-0 left-0 h-px w-px opacity-0"
        />
      )}

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[99999] overflow-hidden rounded-xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="max-h-72 overflow-y-auto">
            {normalizedOptions.length > 0 ? (
              normalizedOptions.map((option) => {
                const active = String(option.value) === String(value || "");

                return (
                  <button
                    key={option.id || option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`block w-full px-4 py-3.5 text-left text-sm font-semibold transition ${
                      active
                        ? "bg-[#EAF4FF] text-sibs-primary-1"
                        : "bg-white text-gray-700 hover:bg-[#F5F9FF] hover:text-sibs-primary-1"
                    }`}
                  >
                    <span className="block min-w-0 truncate">
                      {option.label}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3.5 text-sm font-semibold text-gray-400">
                No options found.
              </div>
            )}
          </div>
        </div>
      )}
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
        className={`flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-xl border bg-white px-3 text-left text-xs font-extrabold shadow-sm outline-none transition ${
          open
            ? "border-[var(--sibs-primary-1)] ring-4 ring-[var(--sibs-primary-1)]/10"
            : "border-[#D0D5DD] hover:border-[var(--sibs-primary-1)]"
        } text-sibs-primary-1`}
      >
        <span className="min-w-0 flex-1 truncate">{displayText}</span>

        <ChevronDown
          size={14}
          className={`shrink-0 text-[var(--sibs-primary-1)] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute left-0 top-[calc(100%+8px)] z-[100000] overflow-hidden rounded-xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)] ${menuClassName}`}
        >
          <div className="max-h-72 overflow-y-auto">
            {options.map((option) => {
              const active = String(option.value) === String(value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`block w-full px-4 py-3.5 text-left text-sm font-semibold transition ${
                    active
                      ? "bg-[#EAF4FF] text-sibs-primary-1"
                      : "bg-white text-gray-700 hover:bg-[#F5F9FF] hover:text-sibs-primary-1"
                  }`}
                >
                  <span className="block min-w-0 truncate">
                    {option.label}
                  </span>
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
}) {
  const calendarRef = useRef(null);
  const selectedDate = parseDateInputValue(value);
  const today = new Date();

  const currentYear = today.getFullYear();
  const minimumYear = currentYear - 80;
  const maximumYear = currentYear;

  const monthOptions = useMemo(() => {
    return monthNames.map((month, index) => ({
      value: index,
      label: month,
    }));
  }, []);

  const yearOptions = useMemo(() => {
    const years = [];

    for (let year = maximumYear; year >= minimumYear; year -= 1) {
      years.push({
        value: year,
        label: String(year),
      });
    }

    return years;
  }, [maximumYear, minimumYear]);

  const [open, setOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState(
    selectedDate || new Date(currentYear - 18, today.getMonth(), 1),
  );

  const calendarDays = useMemo(
    () => buildCalendarDays(displayDate),
    [displayDate],
  );

  const displayText = value ? formatDateDisplay(value) : placeholder;

  useEffect(() => {
    if (selectedDate) {
      setDisplayDate(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
      );
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!calendarRef.current) return;

      if (!calendarRef.current.contains(event.target)) {
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
    setDisplayDate(
      (previous) => new Date(previous.getFullYear(), Number(monthIndex), 1),
    );
  }

  function handleYearChange(year) {
    setDisplayDate(
      (previous) => new Date(Number(year), previous.getMonth(), 1),
    );
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

  return (
    <div ref={calendarRef} className="relative z-[220] min-w-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-bold shadow-sm outline-none transition ${
          open
            ? "border-[var(--sibs-primary-1)] ring-4 ring-[var(--sibs-primary-1)]/10"
            : hasError
              ? "border-red-300 hover:border-red-500"
              : "border-gray-200 hover:border-[var(--sibs-primary-1)]"
        } ${
          disabled
            ? "cursor-not-allowed bg-gray-50 text-gray-400 opacity-70"
            : "text-gray-800"
        }`}
      >
        <span className="inline-flex min-w-0 flex-1 items-center gap-2 truncate">
          <CalendarDays
            size={16}
            className="shrink-0 text-[var(--sibs-primary-1)]"
          />

          <span
            className={`min-w-0 truncate ${
              value ? "text-gray-800" : "text-gray-400"
            }`}
          >
            {displayText}
          </span>
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-[var(--sibs-primary-1)] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[99999] w-[340px] overflow-visible rounded-2xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between border-b border-[#E6ECF2] px-4 py-3">
            <button
              type="button"
              onClick={goPreviousMonth}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sibs-primary-1 transition hover:bg-[#EAF2FB]"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="grid min-w-0 flex-1 grid-cols-[1fr_96px] gap-2 px-3">
              <CalendarHeaderDropdown
                value={displayDate.getMonth()}
                options={monthOptions}
                onChange={handleMonthChange}
                className="z-[100002]"
                menuClassName="w-[180px]"
              />

              <CalendarHeaderDropdown
                value={displayDate.getFullYear()}
                options={yearOptions}
                onChange={handleYearChange}
                className="z-[100001]"
                menuClassName="w-[120px]"
              />
            </div>

            <button
              type="button"
              onClick={goNextMonth}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sibs-primary-1 transition hover:bg-[#EAF2FB]"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="px-4 py-4">
            <div className="grid grid-cols-7 gap-1">
              {weekdayLabels.map((dayLabel) => (
                <div
                  key={dayLabel}
                  className="flex h-8 items-center justify-center text-xs font-extrabold text-[#174A7C]"
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
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold transition ${
                      active
                        ? "bg-[#E7F0FA] text-sibs-primary-1 ring-2 ring-sibs-primary-1/20"
                        : currentDay
                          ? "bg-[#F2F6FA] text-sibs-primary-1"
                          : day.isCurrentMonth
                            ? "text-sibs-primary-1 hover:bg-[#EAF2FB]"
                            : "text-[#98A7BA] hover:bg-[#F7FAFC]"
                    }`}
                  >
                    {day.dayNumber}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#E6ECF2] px-5 py-3">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg px-2 py-1 text-xs font-extrabold text-sibs-primary-1 transition hover:bg-[#F2F6FA]"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={handleToday}
              className="rounded-lg px-2 py-1 text-xs font-extrabold text-sibs-primary-1 transition hover:bg-[#F2F6FA]"
            >
              Today
            </button>
          </div>
        </div>
      )}
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
        className={`flex h-11 w-full min-w-0 items-center gap-3 rounded-xl border bg-white px-4 text-sm font-bold shadow-sm outline-none transition ${
          open
            ? "border-[var(--sibs-primary-1)] ring-4 ring-[var(--sibs-primary-1)]/10"
            : "border-gray-200 hover:border-[var(--sibs-primary-1)]"
        }`}
      >
        <Search
          size={17}
          className="shrink-0 text-[var(--sibs-primary-1)]"
        />

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
          className={`h-full min-w-0 flex-1 border-0 bg-transparent text-sm font-bold outline-none placeholder:text-gray-400 ${
            selectedOption && !open ? "text-gray-800" : "text-gray-700"
          }`}
        />

        <button
          type="button"
          onClick={handleToggle}
          aria-label={open ? "Close school year options" : "Open school year options"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-[#F2F6FA]"
        >
          <ChevronDown
            size={18}
            className={`text-[var(--sibs-primary-1)] transition-transform duration-200 ${
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
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[99999] overflow-hidden rounded-xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
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
                    className={`block w-full px-4 py-3.5 text-left text-sm font-semibold transition ${
                      active
                        ? "bg-[#EAF4FF] text-sibs-primary-1"
                        : "bg-white text-gray-700 hover:bg-[#F5F9FF] hover:text-sibs-primary-1"
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
    <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-5">
      <div className="flex flex-col gap-1">
        <h4 className="text-sm font-extrabold text-sibs-primary-1">
          {section.title}
        </h4>
        <p className="text-xs font-semibold leading-5 text-gray-500">
          Complete all required information for this school level.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <FieldLabel>
            {section.schoolNameLabel || `${section.title} Name`} <RequiredMark />
          </FieldLabel>
          <AutoResizeTextarea
            required
            value={school.schoolName}
            onChange={(event) => updateField("schoolName", event.target.value)}
            placeholder={`Enter ${String(
              section.schoolNameLabel || `${section.title} name`,
            ).toLowerCase()}`}
            className={textareaClass("min-h-11 leading-6")}
          />
        </div>

        <div>
          <FieldLabel>
            {section.title} Address <RequiredMark />
          </FieldLabel>
          <AutoResizeTextarea
            required
            value={school.address}
            onChange={(event) => updateField("address", event.target.value)}
            placeholder="Complete school address"
            className={textareaClass("min-h-11 leading-6")}
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
            <p className="mt-2 text-xs font-semibold text-gray-500">
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
    <div className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-5">
      <div>
        <h4 className="text-sm font-extrabold text-gray-900">
          Required Education Details
        </h4>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          The school fields below are based on the selected highest educational
          attainment. Every displayed school name and address is required.
        </p>
      </div>

      <div className="space-y-4">
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
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-blue-100 bg-white p-4">
                    <input
                      type="checkbox"
                      checked={educationDetails.attendedSeniorHighSchool}
                      onChange={(event) =>
                        handleSeniorHighAttendanceChange(event.target.checked)
                      }
                      className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[var(--sibs-primary-1)]"
                    />
                    <span>
                      <span className="block text-sm font-extrabold text-sibs-primary-1">
                        I attended Senior High School
                      </span>
                      <span className="mt-1 block text-xs font-semibold leading-5 text-gray-500">
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

function MultiSelectCheckboxGroup({ options, values, onChange }) {
  function toggleValue(optionValue) {
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
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {options.map((option) => {
        const optionValue = getOptionValue(option);
        const optionLabel = getOptionLabel(option);

        return (
          <label
            key={option?.id || optionValue}
            className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4"
          >
            <input
              type="checkbox"
              checked={values.includes(optionValue)}
              onChange={() => toggleValue(optionValue)}
              className="h-4 w-4"
            />
            <span className="text-sm font-semibold text-gray-700">
              {optionLabel}
            </span>
          </label>
        );
      })}
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
    />
  );
}

function YesNoSelect({ value, onChange, options, required = true }) {
  return (
    <DatabaseSelect
      required={required}
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Select answer"
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
    <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="text-sm font-extrabold text-sibs-primary-1">{title}</h4>

        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-red-100 bg-white px-4 text-xs font-bold text-red-600 transition hover:bg-red-50"
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
  const consentRef = useRef(null);

  const [form, setForm] = useState(createEmptyPublicForm);
  const [submittedRecord, setSubmittedRecord] = useState(null);
  const [activePositionOptions, setActivePositionOptions] = useState([]);
  const [formOptions, setFormOptions] = useState(defaultFormOptions);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isCheckingDuplicateFullName, setIsCheckingDuplicateFullName] =
    useState(false);
  const [duplicateFullNameExists, setDuplicateFullNameExists] =
    useState(false);

  const [highlightAudio, setHighlightAudio] = useState(false);
  const [highlightAttachment, setHighlightAttachment] = useState(false);
  const [highlightConsent, setHighlightConsent] = useState(false);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const selectedAudioFile = audioFileRef.current || form.audioFile;
  const selectedAttachmentFile = attachmentFileRef.current || form.attachmentFile;

  useEffect(() => {
    const styleId = "public-talent-pool-hide-sidebar-style";

    document.body.classList.add("public-talent-pool-form-page");
    document.documentElement.classList.add("public-talent-pool-form-page");

    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
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

        body.public-talent-pool-form-page main,
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
      `;
      document.head.appendChild(style);
    }

    return () => {
      document.body.classList.remove("public-talent-pool-form-page");
      document.documentElement.classList.remove("public-talent-pool-form-page");
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDatabaseData() {
      setIsLoadingData(true);
      setLoadError("");

      try {
        const [optionsResponse, positionsResponse] = await Promise.all([
          getTalentPoolFormOptions(),
          getTalentPoolOpenPositions(),
        ]);

        if (!isMounted) return;

        if (!optionsResponse?.success) {
          throw new Error(
            optionsResponse?.message || "Failed to load form options.",
          );
        }

        if (!positionsResponse?.success) {
          throw new Error(
            positionsResponse?.message || "Failed to load open positions.",
          );
        }

        setFormOptions(normalizeOptionsPayload(optionsResponse?.data));

        const positions = Array.isArray(positionsResponse?.data)
          ? positionsResponse.data
          : [];

        setActivePositionOptions(
          positions
            .map(normalizePosition)
            .filter(
              (position) =>
                position.positionTitle && position.status === "Active",
            ),
        );
      } catch (error) {
        console.error("Load public talent pool form data error:", error);

        if (!isMounted) return;

        const errorMessage =
          error?.response?.data?.message ||
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

  useEffect(() => {
    const firstName = cleanText(form.firstName);
    const middleName = cleanText(form.middleName);
    const lastName = cleanText(form.lastName);
    const suffix = cleanText(form.suffix);

    if (!firstName || !lastName) {
      setIsCheckingDuplicateFullName(false);
      setDuplicateFullNameExists(false);
      return undefined;
    }

    const controller = new AbortController();

    setIsCheckingDuplicateFullName(true);
    setDuplicateFullNameExists(false);

    const timeoutId = window.setTimeout(async () => {
      const response = await checkTalentPoolCandidateFullName(
        {
          firstName,
          middleName,
          lastName,
          suffix,
        },
        {
          signal: controller.signal,
        },
      );

      if (controller.signal.aborted) return;

      setDuplicateFullNameExists(
        Boolean(response?.success && response?.data?.exists),
      );
      setIsCheckingDuplicateFullName(false);
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [form.firstName, form.middleName, form.lastName, form.suffix]);

  const age = calculateAge(form.dateOfBirth);
  const isMinor = age !== null && age < 18;

  const hasRelevantExperience =
    form.workExperience ===
    "Has work Experience (at least 6 months relevant work experience)";

  const hasEmployeeReferralProgram = useMemo(
    () =>
      isEmployeeReferralProgramSelected(
        form.hearAboutUs,
        formOptions.hearAboutUs,
      ),
    [form.hearAboutUs, formOptions.hearAboutUs],
  );

  const openPositionOptions = useMemo(() => {
    return activePositionOptions.map((position) => ({
      id: position.id || position.positionId || position.positionTitle,
      value: position.positionTitle,
      label: position.positionTitle,
    }));
  }, [activePositionOptions]);

  const canSubmit = useMemo(() => {
    if (isLoadingData) return false;
    if (isSubmitting) return false;
    if (isCheckingDuplicateFullName) return false;
    if (duplicateFullNameExists) return false;
    if (loadError) return false;
    if (isMinor) return false;
    return true;
  }, [
    duplicateFullNameExists,
    isCheckingDuplicateFullName,
    isLoadingData,
    isMinor,
    isSubmitting,
    loadError,
  ]);

  function showStatusModal({ type = "success", title = "", message = "" }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });
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

  function handleHearAboutUsChange(values) {
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

    setForm(createEmptyPublicForm());
    setSubmittedRecord(null);
    setHighlightAudio(false);
    setHighlightAttachment(false);
    setHighlightConsent(false);

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
          "Please upload a valid supporting file. Accepted formats: PDF, DOC, DOCX, XLS, XLSX, CSV, JPG, JPEG, PNG, or GIF.",
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
          nextOtherExperiences.length > 0
            ? previous.hasOtherExperience
            : "No",
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

  function validateBeforeSubmit() {
    const currentAudioFile = audioFileRef.current || form.audioFile;
    const currentAttachmentFile =
      attachmentFileRef.current || form.attachmentFile;

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

    if (!activePositionOptions.length) {
      showStatusModal({
        type: "error",
        title: "No active positions",
        message: "No active open positions are configured in the database.",
      });
      return false;
    }

    if (formOptions.hearAboutUs.length === 0) {
      showStatusModal({
        type: "error",
        title: "Missing source options",
        message: "No application source options are configured in the database.",
      });
      return false;
    }

    if (form.hearAboutUs.length === 0) {
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
        message:
          "Please enter the name of the employee who referred you.",
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

    if (!form.openPosition) {
      showStatusModal({
        type: "error",
        title: "Open position required",
        message: "Please select an active open position.",
      });
      return false;
    }

    if (!form.applyingLocation) {
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

    if (duplicateFullNameExists) {
      showStatusModal({
        type: "error",
        title: "Duplicate candidate",
        message: "Candidate already exists.",
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

    if (!form.workExperience) {
      showStatusModal({
        type: "error",
        title: "Work experience required",
        message: "Please select your work experience.",
      });
      return false;
    }

    if (!form.highestEducationalAttainment) {
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

    if (!form.fullyVaccinated) {
      showStatusModal({
        type: "error",
        title: "Missing required field",
        message: "Please answer if you are fully vaccinated.",
      });
      return false;
    }

    if (!form.comfortableOnSite) {
      showStatusModal({
        type: "error",
        title: "Missing required field",
        message: "Please answer if you are comfortable working on site.",
      });
      return false;
    }

    if (!form.willingGraveyard) {
      showStatusModal({
        type: "error",
        title: "Missing required field",
        message: "Please answer if you are willing to work in graveyard shift.",
      });
      return false;
    }

    if (!form.employmentInterest) {
      showStatusModal({
        type: "error",
        title: "Employment preference required",
        message: "Please select your employment preference.",
      });
      return false;
    }

    if (!form.remoteWorkAccess) {
      showStatusModal({
        type: "error",
        title: "Missing required field",
        message:
          "Please answer if you have access to a computer, internet connection, and private space.",
      });
      return false;
    }

    if (!form.willingDrugTest) {
      showStatusModal({
        type: "error",
        title: "Missing required field",
        message:
          "Please answer if you are willing to undertake a drug test as part of this hiring process.",
      });
      return false;
    }

    if (!form.willingBackgroundCheck) {
      showStatusModal({
        type: "error",
        title: "Missing required field",
        message:
          "Please answer if you are willing to undergo a background check.",
      });
      return false;
    }

    if (isMinor) {
      showStatusModal({
        type: "error",
        title: "Applicant is below 18",
        message: "Applicant is below 18 years old as of date of application.",
      });
      return false;
    }

    if (hasRelevantExperience) {
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
      }
    }

    if (!currentAudioFile) {
      setHighlightAudio(true);
      scrollToRef(fileSectionRef);

      showStatusModal({
        type: "error",
        title: "Audio file required",
        message:
          "Please upload a single audio file. Click the audio upload box and select your MP3 file again.",
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

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateBeforeSubmit()) return;

    setIsSubmitting(true);

    const submitForm = {
      ...normalizePublicFormFields(form),
      referredBy: hasEmployeeReferralProgram ? form.referredBy : "",
      employeeId: hasEmployeeReferralProgram ? form.employeeId : "",
      educationDetails: normalizeEducationDetails(form.educationDetails),
      otherExperiences: form.otherExperiences.map(normalizeExperienceValues),
      audioFile: audioFileRef.current || form.audioFile,
      attachmentFile: attachmentFileRef.current || form.attachmentFile,
    };

    try {
      const response = await submitPublicTalentPoolApplication(submitForm);

      if (!response?.success) {
        const isDuplicateFullName =
          response?.status === 409 ||
          response?.code === "DUPLICATE_FULL_NAME";

        showStatusModal({
          type: "error",
          title: isDuplicateFullName
            ? "Duplicate candidate"
            : "Application not saved",
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
      setForm(createEmptyPublicForm());
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
        title: "Application saved",
        message: `Your application has been submitted successfully.${
          savedSubmission?.candidateId
            ? `\n\nTracking ID: ${savedSubmission.candidateId}`
            : ""
        }\n\nOur Talent Acquisition team will review your profile.`,
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
    <div className="min-h-screen bg-[var(--sibs-tertiary-10)] px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="bg-[var(--sibs-primary-1)] px-6 py-8 text-white">
            <div className="mb-8 flex w-full justify-center">
              <style>
                {`
                  @keyframes sibsLogoReflect {
                    0% {
                      transform: translateX(-160%) skewX(-18deg);
                      opacity: 0;
                    }
                    18% {
                      opacity: 0.75;
                    }
                    45% {
                      opacity: 0.95;
                    }
                    70% {
                      opacity: 0.35;
                    }
                    100% {
                      transform: translateX(260%) skewX(-18deg);
                      opacity: 0;
                    }
                  }

                  @keyframes sibsLogoGlow {
                    0%, 100% {
                      filter: drop-shadow(0 0 0 rgba(255, 255, 255, 0));
                    }
                    50% {
                      filter: drop-shadow(0 0 16px rgba(255, 255, 255, 0.45));
                    }
                  }
                `}
              </style>

              <div className="relative inline-flex overflow-hidden rounded-2xl">
                <img
                  src="/SiBS_Logo%20w%20Tagline-white.png"
                  alt="SiBS Logo"
                  className="h-16 w-auto md:h-20"
                  style={{
                    animation: "sibsLogoGlow 2.8s ease-in-out infinite",
                  }}
                />

                <span
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/80 to-transparent"
                  style={{
                    animation: "sibsLogoReflect 2.6s ease-in-out infinite",
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wide">
                  <UserPlus size={15} />
                  Candidate Talent Pool
                </div>

                <h1 className="mt-4 text-3xl font-extrabold">
                  Public Application Form
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/80">
                  Complete your candidate profile for current and future SiBS
                  openings. Fields marked with * are required.
                </p>
              </div>

              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-white/70">
                  Application Type
                </p>
                <p className="mt-1 text-lg font-extrabold">
                  Public Talent Pool
                </p>
              </div>
            </div>
          </div>
        </section>

        {loadError && (
          <section className="rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
            {loadError}
          </section>
        )}

        {submittedRecord && (
          <section className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <CheckCircle2 size={22} />
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-emerald-700">
                  Application submitted successfully
                </h2>
                <p className="mt-1 text-sm leading-6 text-emerald-700/80">
                  Your tracking ID is{" "}
                  <span className="font-extrabold">
                    {submittedRecord.candidateId}
                  </span>
                  . Our Talent Acquisition team will review your profile.
                </p>
              </div>
            </div>
          </section>
        )}

        <section>
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-3xl bg-white p-6 shadow-sm"
          >
            <div>
              <h2 className="text-xl font-extrabold text-sibs-primary-1">
                Candidate Information
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {isLoadingData
                  ? "Loading form data from database..."
                  : "Please complete the required details before submitting."}
              </p>
            </div>

            <SectionCard
              icon={BriefcaseBusiness}
              title="Application Source and Position"
              description="Tell us where you learned about SiBS and what position you are applying for."
            >
              <div className="space-y-4">
                <div>
                  <FieldLabel>
                    How did you first hear about us? <RequiredMark />
                  </FieldLabel>
                  <MultiSelectCheckboxGroup
                    options={formOptions.hearAboutUs}
                    values={form.hearAboutUs}
                    onChange={handleHearAboutUsChange}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel>
                      Check our open positions <RequiredMark />
                    </FieldLabel>
                    <DatabaseSelect
                      required
                      value={form.openPosition}
                      disabled={isLoadingData || !activePositionOptions.length}
                      options={openPositionOptions}
                      placeholder={
                        isLoadingData
                          ? "Loading positions..."
                          : activePositionOptions.length
                            ? "Select open position"
                            : "No active positions found"
                      }
                      onChange={(value) =>
                        updateFormField("openPosition", value)
                      }
                      zIndex="z-[200]"
                    />
                    <p className="mt-2 text-xs font-semibold text-gray-500">
                      Only active positions from the database are shown here.
                    </p>
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
              </div>
            </SectionCard>

            <SectionCard
              icon={UserPlus}
              title="Personal Information"
              description="Enter your legal name, contact details, and address."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <FieldLabel>
                    First Name <RequiredMark />
                  </FieldLabel>
                  <input
                    value={form.firstName}
                    onChange={(e) =>
                      updateFormField("firstName", e.target.value)
                    }
                    placeholder="Enter first name"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <FieldLabel>Middle Name</FieldLabel>
                  <input
                    value={form.middleName}
                    onChange={(e) =>
                      updateFormField("middleName", e.target.value)
                    }
                    placeholder="Enter middle name"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <FieldLabel>
                    Last Name <RequiredMark />
                  </FieldLabel>
                  <input
                    value={form.lastName}
                    onChange={(e) =>
                      updateFormField("lastName", e.target.value)
                    }
                    placeholder="Enter last name"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <FieldLabel>Suffix</FieldLabel>
                  <input
                    value={form.suffix}
                    onChange={(e) =>
                      updateFormField("suffix", e.target.value)
                    }
                    placeholder="Jr., Sr., III"
                    className={inputClass()}
                  />
                </div>

                {duplicateFullNameExists && (
                  <div className="md:col-span-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                    Candidate already exists.
                  </div>
                )}

                <div>
                  <FieldLabel>
                    Date of Birth <RequiredMark />
                  </FieldLabel>

                  <CalendarDatePicker
                    value={form.dateOfBirth}
                    onChange={(value) => updateFormField("dateOfBirth", value)}
                    placeholder="Select date"
                    hasError={isMinor}
                  />

                  {age !== null && (
                    <p
                      className={`mt-2 text-xs font-bold ${
                        isMinor ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      Age as of application date: {age}
                      {isMinor ? " — Applicant is below 18 years old." : ""}
                    </p>
                  )}
                </div>

                <div>
                  <FieldLabel>
                    Email <RequiredMark />
                  </FieldLabel>
                  <input
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
                    value={form.phone1}
                    onChange={(e) => updateFormField("phone1", e.target.value)}
                    placeholder="09xxxxxxxxx"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <FieldLabel>Phone 2</FieldLabel>
                  <input
                    value={form.phone2}
                    onChange={(e) => updateFormField("phone2", e.target.value)}
                    placeholder="Optional"
                    className={inputClass()}
                  />
                </div>

                <div className="md:col-span-4">
                  <FieldLabel>
                    Physical Address <RequiredMark />
                  </FieldLabel>
                  <AutoResizeTextarea
                    required
                    value={form.physicalAddress}
                    onChange={(e) =>
                      updateFormField("physicalAddress", e.target.value)
                    }
                    placeholder="Complete physical address"
                    className={textareaClass("min-h-11 leading-6")}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={BriefcaseBusiness}
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

                    <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px] md:items-end">
                        <div>
                          <FieldLabel>Do you have other experience?</FieldLabel>
                          <YesNoSelect
                            required={false}
                            value={form.hasOtherExperience}
                            options={formOptions.yesNo}
                            onChange={handleOtherExperienceAnswer}
                          />
                        </div>

                        {form.hasOtherExperience === "Yes" && (
                          <button
                            type="button"
                            onClick={addOtherExperience}
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--sibs-primary-1)] px-4 text-sm font-bold text-white transition hover:opacity-90"
                          >
                            Add Other Experience
                          </button>
                        )}
                      </div>
                    </div>

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
                  </div>
                )}
              </div>
            </SectionCard>

            <div ref={educationSectionRef}>
              <SectionCard
                icon={GraduationCap}
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
                    <textarea
                      value={form.trainingAttended}
                      onChange={(e) =>
                        updateFormField("trainingAttended", e.target.value)
                      }
                      placeholder="List trainings attended"
                      rows={4}
                      className={textareaClass()}
                    />
                  </div>
                </div>
              </SectionCard>
            </div>

            <SectionCard
              icon={ShieldCheck}
              title="Work Readiness Questions"
              description="These questions help Talent Acquisition review work setup and compliance readiness."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>
                    Are you fully vaccinated? <RequiredMark />
                  </FieldLabel>
                  <YesNoSelect
                    value={form.fullyVaccinated}
                    options={formOptions.yesNo}
                    onChange={(value) =>
                      updateFormField("fullyVaccinated", value)
                    }
                  />
                </div>

                <div>
                  <FieldLabel>
                    Are you comfortable working on site? <RequiredMark />
                  </FieldLabel>
                  <YesNoSelect
                    value={form.comfortableOnSite}
                    options={formOptions.yesNo}
                    onChange={(value) =>
                      updateFormField("comfortableOnSite", value)
                    }
                  />
                </div>

                <div>
                  <FieldLabel>
                    Are you willing to work in graveyard shift? <RequiredMark />
                  </FieldLabel>
                  <YesNoSelect
                    value={form.willingGraveyard}
                    options={formOptions.yesNo}
                    onChange={(value) =>
                      updateFormField("willingGraveyard", value)
                    }
                  />
                </div>

                <div>
                  <FieldLabel>
                    Full-time, part-time, or either? <RequiredMark />
                  </FieldLabel>
                  <DatabaseSelect
                    required
                    value={form.employmentInterest}
                    options={formOptions.employmentInterest}
                    placeholder="Select employment preference"
                    onChange={(value) =>
                      updateFormField("employmentInterest", value)
                    }
                    zIndex="z-[160]"
                  />
                </div>

                <div className="md:col-span-2">
                  <FieldLabel>
                    If this is a remote position, do you have access to a
                    computer, Internet connection, and a private space to work
                    remotely? <RequiredMark />
                  </FieldLabel>
                  <YesNoSelect
                    value={form.remoteWorkAccess}
                    options={formOptions.yesNo}
                    onChange={(value) =>
                      updateFormField("remoteWorkAccess", value)
                    }
                  />
                </div>

                <div>
                  <FieldLabel>
                    Are you willing to undertake a drug test as part of this
                    hiring process? <RequiredMark />
                  </FieldLabel>
                  <YesNoSelect
                    value={form.willingDrugTest}
                    options={formOptions.yesNo}
                    onChange={(value) =>
                      updateFormField("willingDrugTest", value)
                    }
                  />
                </div>

                <div>
                  <FieldLabel>
                    Are you willing to allow SiBS to undergo a background check
                    as part of this hiring process? <RequiredMark />
                  </FieldLabel>
                  <YesNoSelect
                    value={form.willingBackgroundCheck}
                    options={formOptions.yesNo}
                    onChange={(value) =>
                      updateFormField("willingBackgroundCheck", value)
                    }
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={Users}
              title="References"
              description="Please list at least three references and their contact information."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>
                    Reference 1 <RequiredMark />
                  </FieldLabel>
                  <input
                    value={form.reference1Name}
                    onChange={(e) =>
                      updateFormField("reference1Name", e.target.value)
                    }
                    placeholder="Reference 1 name"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <FieldLabel>Phone</FieldLabel>
                  <input
                    value={form.reference1Phone}
                    onChange={(e) =>
                      updateFormField("reference1Phone", e.target.value)
                    }
                    placeholder="Reference 1 phone"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <FieldLabel>
                    Reference 2 <RequiredMark />
                  </FieldLabel>
                  <input
                    value={form.reference2Name}
                    onChange={(e) =>
                      updateFormField("reference2Name", e.target.value)
                    }
                    placeholder="Reference 2 name"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <FieldLabel>Phone</FieldLabel>
                  <input
                    value={form.reference2Phone}
                    onChange={(e) =>
                      updateFormField("reference2Phone", e.target.value)
                    }
                    placeholder="Reference 2 phone"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <FieldLabel>
                    Reference 3 <RequiredMark />
                  </FieldLabel>
                  <input
                    value={form.reference3Name}
                    onChange={(e) =>
                      updateFormField("reference3Name", e.target.value)
                    }
                    placeholder="Reference 3 name"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <FieldLabel>Phone</FieldLabel>
                  <input
                    value={form.reference3Phone}
                    onChange={(e) =>
                      updateFormField("reference3Phone", e.target.value)
                    }
                    placeholder="Reference 3 phone"
                    className={inputClass()}
                  />
                </div>
              </div>
            </SectionCard>

            <div ref={fileSectionRef}>
              <SectionCard
                icon={Mic}
                title="Audio and File Upload"
                description="Upload a single audio file answering the listed questions and one supporting document/file."
              >
                <div className="space-y-5">
                  <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-sm font-semibold leading-7 text-amber-800">
                    <p className="font-extrabold">
                      Your audio file must answer these questions:
                    </p>

                    {formOptions.audioQuestions.length ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {formOptions.audioQuestions.map((question) => (
                          <li key={question.id || getOptionValue(question)}>
                            {getOptionLabel(question)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2">
                        No audio questions configured in the database.
                      </p>
                    )}
                  </div>

                  <div>
                    <FieldLabel>
                      Upload single audio file <RequiredMark />
                    </FieldLabel>
                    <label
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed px-5 py-8 text-center transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5 ${
                        highlightAudio && !selectedAudioFile
                          ? "border-red-300 bg-red-50 ring-4 ring-red-100"
                          : selectedAudioFile
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-gray-300 bg-gray-50"
                      }`}
                    >
                      <Mic
                        size={26}
                        className={
                          selectedAudioFile
                            ? "text-emerald-700"
                            : "text-sibs-primary-1"
                        }
                      />
                      <p className="mt-2 max-w-full truncate text-sm font-extrabold text-gray-800">
                        {selectedAudioFile?.name || "Choose audio file"}
                      </p>
                      {selectedAudioFile && (
                        <p className="mt-1 text-xs font-bold text-emerald-700">
                          Audio selected • {formatFileSize(selectedAudioFile)}
                        </p>
                      )}
                      <p className="mt-1 text-xs font-semibold text-gray-500">
                        Accepted: MP3, WAV, M4A, AAC, OGG, WEBM, MP4, FLAC,
                        AMR, 3GP, OPUS, AIFF, CAF, WMA
                      </p>
                      <input
                        ref={audioInputRef}
                        type="file"
                        accept={acceptedAudioTypes}
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
                    </label>

                    {highlightAudio && !selectedAudioFile && (
                      <p className="mt-2 text-sm font-bold text-red-600">
                        Please upload your audio file before submitting.
                      </p>
                    )}
                  </div>

                  <div>
                    <FieldLabel>
                      Upload supporting file <RequiredMark />
                    </FieldLabel>
                    <label
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed px-5 py-8 text-center transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5 ${
                        highlightAttachment && !selectedAttachmentFile
                          ? "border-red-300 bg-red-50 ring-4 ring-red-100"
                          : selectedAttachmentFile
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-gray-300 bg-gray-50"
                      }`}
                    >
                      <UploadCloud
                        size={26}
                        className={
                          selectedAttachmentFile
                            ? "text-emerald-700"
                            : "text-sibs-primary-1"
                        }
                      />
                      <p className="mt-2 max-w-full truncate text-sm font-extrabold text-gray-800">
                        {selectedAttachmentFile?.name || "Choose file"}
                      </p>
                      {selectedAttachmentFile && (
                        <p className="mt-1 text-xs font-bold text-emerald-700">
                          File selected • {formatFileSize(selectedAttachmentFile)}
                        </p>
                      )}
                      <p className="mt-1 text-xs font-semibold text-gray-500">
                        PDF, DOC/DOCX, XLS/CSV, JPG/JPEG, PNG, GIF
                      </p>
                      <input
                        ref={attachmentInputRef}
                        type="file"
                        accept={acceptedDocumentTypes}
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
                    </label>

                    {highlightAttachment && !selectedAttachmentFile && (
                      <p className="mt-2 text-sm font-bold text-red-600">
                        Please upload your supporting file before submitting.
                      </p>
                    )}
                  </div>
                </div>
              </SectionCard>
            </div>

            <div
              ref={consentRef}
              className={`rounded-3xl border p-5 transition ${
                highlightConsent && !form.consent
                  ? "border-red-300 bg-red-50 ring-4 ring-red-100"
                  : "border-gray-100 bg-gray-50"
              }`}
            >
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => {
                    updateFormField("consent", e.target.checked);
                    setHighlightConsent(false);
                  }}
                  className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-[var(--sibs-primary-1)]"
                />
                <span
                  className={`text-sm font-semibold leading-6 ${
                    highlightConsent && !form.consent
                      ? "text-red-700"
                      : "text-gray-600"
                  }`}
                >
                  I agree to terms & conditions provided by the company. By
                  providing my phone number, I agree to receive text messages
                  from the business.
                </span>
              </label>

              {highlightConsent && !form.consent && (
                <p className="mt-3 text-sm font-bold text-red-600">
                  Please check this consent box before submitting.
                </p>
              )}
            </div>

            <div className="flex flex-col justify-end gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={16} />
                Reset
              </button>

              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </section>
      </div>

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