import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  UploadCloud,
  UserPlus,
  BriefcaseBusiness,
  GraduationCap,
  ShieldCheck,
  Users,
  Mic,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Search,
  Loader2,
  CircleCheckBig,
  TriangleAlert,
  ExternalLink,
} from "lucide-react";

import { useTalentPool } from "../../../services/context/TalentPoolContext";
import {
  getTalentPoolApplicationForm,
  getTalentPoolReferralPrefill,
} from "../../../lib/axios/getTalentPool";
import {
  checkTalentPoolApplicantNameAvailability,
  getTalentPoolOpenPositions,
} from "../../../lib/axios/publicTalentPool";
import {
  canRemoveTrainingEntryRow,
  ensureTrainingEntryRows,
} from "../../../lib/utils/talentPool/trainingEntries";
import {
  buildApplicationFormAnswersPayload,
  createQuestionAnswerState,
  normalizeApplicationFormQuestions,
  validateApplicationQuestionAnswers,
} from "../../../lib/utils/talentPool/publicApplicationQuestions";
import StatusModal from "../StatusModal";

const acceptedAudioTypes =
  ".mp3,.wav,.wave,.m4a,.aac,.ogg,.oga,.webm,.mp4,.mpeg,.mpga,.flac,.amr,.3gp,.opus,.aif,.aiff,.caf,.wma,audio/*,video/mp4,video/3gpp";

const acceptedDocumentTypes =
  ".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif";

const OUTBOUND_SOURCE = "Outbound";

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
    schoolName: draft.schoolName.trim(),
    address: draft.address.trim(),
    course: draft.course.trim(),
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

const uppercaseCandidateFields = new Set([
  "nickname",
  "referredBy",
  "employeeId",
  "firstName",
  "lastName",
  "middleName",
  "suffix",
  "phoneNumber1",
  "phoneNumber2",
  "physicalAddress",
  "trainingAttended",
  "remarks",
]);

const uppercaseExperienceFields = new Set([
  "industry",
  "industryRelevantExperience",
  "years",
  "role",
  "company",
  "monthlyCompensation",
  "reasonForLeaving",
]);

function cleanText(value) {
  return String(value ?? "").trim();
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

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeUpperText(value) {
  return String(value ?? "").toUpperCase();
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

function normalizeCandidateFieldValue(field, value) {
  if (typeof value !== "string") return value;
  if (!uppercaseCandidateFields.has(field)) return value;
  return normalizeUpperText(value);
}

function normalizeExperienceFieldValue(field, value) {
  if (typeof value !== "string") return value;
  if (!uppercaseExperienceFields.has(field)) return value;
  return normalizeUpperText(value);
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

const EDUCATION_AUTO_AFFILIATION_KEYS = {
  mastersDegreeGraduate: new Set([
    "masterdegreeholder",
    "mastersdegreeholder",
  ]),
  doctorateDegreeGraduate: new Set([
    "doctorateholder",
    "doctoratedegreeholder",
  ]),
};

function getEducationAutoAffiliationValues(attainment, options = []) {
  const attainmentKey = normalizeEducationAttainmentKey(attainment);
  const acceptedKeys = EDUCATION_AUTO_AFFILIATION_KEYS[attainmentKey];

  if (!acceptedKeys) return [];

  const matchedOption = toArray(options).find((option) =>
    [getOptionValue(option), getOptionLabel(option)]
      .map(normalizeEducationalAttainmentOptionText)
      .some((optionText) => acceptedKeys.has(optionText)),
  );

  if (!matchedOption) return [];

  const matchedValue = getOptionValue(matchedOption) || getOptionLabel(matchedOption);

  return cleanText(matchedValue) ? [matchedValue] : [];
}

function mergeUniqueOptionValues(currentValues = [], additionalValues = []) {
  const nextValues = [];
  const seenValues = new Set();

  [...toArray(currentValues), ...toArray(additionalValues)].forEach((value) => {
    const key = String(value);

    if (!key || seenValues.has(key)) return;

    seenValues.add(key);
    nextValues.push(value);
  });

  return nextValues;
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

function formatFileSizeFromBytes(size = 0) {
  const numberSize = Number(size || 0);

  if (!numberSize) return "";

  const sizeInMb = numberSize / (1024 * 1024);

  if (sizeInMb >= 1) return `${sizeInMb.toFixed(2)} MB`;

  return `${Math.max(numberSize / 1024, 1).toFixed(0)} KB`;
}

function getCandidateFileSize(candidateForm = {}, type = "audio") {
  const keys =
    type === "audio"
      ? ["audioFile", "audioFileObject", "audio"]
      : ["attachmentFile", "attachmentFileObject", "attachment"];

  const file = keys.map((key) => candidateForm?.[key]).find(Boolean);

  return file?.size ? formatFileSizeFromBytes(file.size) : "";
}

function getCandidateFileName(candidateForm = {}, type = "audio") {
  if (type === "audio") {
    return (
      candidateForm.audioFileName ||
      candidateForm.audio_file_name ||
      candidateForm.audioName ||
      candidateForm.audio?.name ||
      candidateForm.audioFile?.name ||
      ""
    );
  }

  return (
    candidateForm.attachmentFileName ||
    candidateForm.attachment_file_name ||
    candidateForm.attachmentName ||
    candidateForm.attachment?.name ||
    candidateForm.attachmentFile?.name ||
    ""
  );
}

function inputClass(extra = "", options = {}) {
  const shouldUppercase = options.uppercase !== false;

  return `h-8.5 2xl:h-10 w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 2xl:px-3.5 sibs-text-xs font-semibold ${
    shouldUppercase ? "uppercase" : "normal-case"
  } text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:border-[#D7DEE8] disabled:bg-[#F2F4F7] disabled:text-[#667085] ${extra}`;
}

function textareaInputClass(extra = "") {
  return `w-full resize-none rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold uppercase text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:border-[#D7DEE8] disabled:bg-[#F2F4F7] disabled:text-[#667085] ${extra}`;
}

function AutoResizeTextarea({
  value,
  onChange,
  minHeight = 44,
  className = "",
  ...props
}) {
  const textareaRef = useRef(null);

  const resizeTextarea = useCallback((textarea) => {
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, minHeight)}px`;
  }, [minHeight]);

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

function FieldLabel({ children }) {
  return (
    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
      <span>{children}</span>
    </label>
  );
}

function RequiredMark() {
  return <span className="text-[#FF5C28]"> *</span>;
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
    `flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-left text-xs font-extrabold transition sm:text-sm ${
      active
        ? "bg-[#042C51] text-white shadow-[0_8px_20px_rgba(4,44,81,0.18)]"
        : "bg-white text-[#344054] hover:bg-[#F8FAFC]"
    }`;

  const numberClass = (active) =>
    `inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
      active
        ? "bg-[#FF5C28] text-white"
        : "bg-[#E9EEF5] text-[#667085]"
    }`;

  return (
    <nav
      aria-label="Add Candidate application pages"
      className="grid grid-cols-1 gap-2 rounded-2xl border border-[#DCE6F1] bg-white p-2 shadow-[0_8px_24px_rgba(4,44,81,0.06)] sm:grid-cols-2"
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
            size={16}
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
          className={`shrink-0 rounded-md px-2 py-1 text-[9px] font-black uppercase tracking-wide ${
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

function SectionCard({
  number,
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <section className="sibs-page-card-in relative overflow-visible rounded-2xl border border-[#E6ECF2] bg-white shadow-[0_8px_24px_rgba(4,44,81,0.05)]">
      <div className="flex flex-col gap-3 border-b border-[#F1F5F9] px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EB] text-[#FF5C28]">
              <Icon size={18} />
            </div>
          )}

          <div className="min-w-0">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51] sm:text-sm">
              {title}
            </h3>

            {description && (
              <p className="mt-1 text-xs font-semibold leading-5 text-[#667085] sm:text-sm">
                {description}
              </p>
            )}
          </div>
        </div>

        {number ? (
          <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-[#DCE6F1] bg-[#F8FAFC] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
            Step {number} of 9
          </span>
        ) : null}
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </section>
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
  const dropdownPanelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 288,
    placement: "below",
  });

  const normalizedOptions = normalizeDropdownOptions(options);
  const selectedOption = normalizedOptions.find(
    (option) => String(option.value) === String(value || ""),
  );

  const displayText = selectedOption?.label || placeholder;

  function calculatePanelPosition() {
    if (!dropdownRef.current || typeof window === "undefined") return null;

    const rect = dropdownRef.current.getBoundingClientRect();
    const gutter = 12;
    const gap = 8;
    const panelWidth = rect.width;
    const maxLeft = window.innerWidth - panelWidth - gutter;
    const estimatedHeight = Math.min(
      288,
      Math.max(48, normalizedOptions.length * 41 + 8),
    );
    const availableBelow = Math.max(
      0,
      window.innerHeight - rect.bottom - gutter - gap,
    );
    const availableAbove = Math.max(0, rect.top - gutter - gap);
    const openAbove =
      availableBelow < Math.min(estimatedHeight, 180) &&
      availableAbove > availableBelow;
    const availableHeight = openAbove ? availableAbove : availableBelow;
    const maxHeight = Math.max(96, Math.min(288, availableHeight || 96));
    const measuredHeight = dropdownPanelRef.current?.offsetHeight || estimatedHeight;
    const panelHeight = Math.min(measuredHeight, maxHeight);

    return {
      top: openAbove
        ? Math.max(gutter, rect.top - gap - panelHeight)
        : rect.bottom + gap,
      left: Math.max(gutter, Math.min(rect.left, maxLeft)),
      width: panelWidth,
      maxHeight,
      placement: openAbove ? "above" : "below",
    };
  }

  useEffect(() => {
    function handleClickOutside(event) {
      const clickedAnchor = dropdownRef.current?.contains(event.target);
      const clickedPanel = dropdownPanelRef.current?.contains(event.target);

      if (!clickedAnchor && !clickedPanel) {
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
    if (!open) return undefined;

    function updatePanelPosition() {
      const nextPosition = calculatePanelPosition();
      if (nextPosition) setPanelPosition(nextPosition);
    }

    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open, normalizedOptions.length]);

  function handleToggleOpen() {
    if (disabled) return;

    if (!open) {
      const nextPosition = calculatePanelPosition();
      if (nextPosition) setPanelPosition(nextPosition);
    }

    setOpen((previous) => !previous);
  }

  function handleSelect(nextValue) {
    onChange?.(nextValue);
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
        onClick={handleToggleOpen}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex h-10 w-full min-w-0 items-center justify-between gap-3 rounded-[10px] border bg-[#F8FAFC] px-3 text-left text-xs font-semibold outline-none transition ${
          open
            ? "border-[#FF5C28] bg-white text-[#042C51] ring-4 ring-[#FF5C28]/10"
            : "border-[#D7DEE8] hover:border-[#FF5C28]/40 hover:bg-white"
        } ${
          disabled
            ? "cursor-not-allowed border-[#D7DEE8] bg-[#F2F4F7] text-[#667085] opacity-70"
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
          value={value || ""}
          onChange={() => {}}
          required
          disabled={disabled}
          className="pointer-events-none absolute bottom-0 left-0 h-px w-px opacity-0"
        />
      )}

      {open && !disabled
        ? createPortal(
            <div
              ref={dropdownPanelRef}
              role="listbox"
              data-placement={panelPosition.placement}
              className="fixed z-[100000] overflow-hidden rounded-[10px] border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]"
              style={{
                left: `${panelPosition.left}px`,
                top: `${panelPosition.top}px`,
                width: `${panelPosition.width}px`,
              }}
            >
              <div
                className="overflow-y-auto py-1 sibs-scrollbar"
                style={{ maxHeight: `${panelPosition.maxHeight}px` }}
              >
                {normalizedOptions.length > 0 ? (
                  normalizedOptions.map((option) => {
                    const active = String(option.value) === String(value || "");

                    return (
                      <button
                        key={option.id || option.value}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => handleSelect(option.value)}
                        className={`block w-full border-b border-[#EEF2F6] px-3 py-2.5 text-left text-xs font-semibold transition last:border-b-0 ${
                          active
                            ? "bg-[#FFF0EB] text-[#FF5C28]"
                            : "bg-white text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                        }`}
                      >
                        <span className="block min-w-0 truncate">
                          {option.label}
                        </span>
                      </button>
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

function LocationPortalDropdown({
  value,
  onChange,
  options,
  placeholder = "Select location",
  required = true,
  disabled = false,
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

  function calculatePanelPosition() {
    if (!dropdownRef.current) return null;

    const rect = dropdownRef.current.getBoundingClientRect();
    const gutter = 12;
    const panelWidth = rect.width;
    const maxLeft = window.innerWidth - panelWidth - gutter;

    return {
      top: rect.bottom + 8,
      left: Math.max(gutter, Math.min(rect.left, maxLeft)),
      width: panelWidth,
    };
  }

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
      const nextPosition = calculatePanelPosition();
      if (nextPosition) setPanelPosition(nextPosition);
    }

    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open]);

  function handleToggleOpen() {
    if (disabled) return;

    if (!open) {
      const nextPosition = calculatePanelPosition();
      if (nextPosition) setPanelPosition(nextPosition);
    }

    setOpen((previous) => !previous);
  }

  function handleSelect(nextValue) {
    onChange?.(nextValue);
    setOpen(false);
  }

  return (
    <div
      ref={dropdownRef}
      className={`relative min-w-0 ${open ? "z-[190]" : "z-[1]"}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggleOpen}
        className={`flex h-10 w-full min-w-0 items-center justify-between gap-3 rounded-[10px] border bg-[#F8FAFC] px-3 text-left text-xs font-semibold outline-none transition ${
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

      {required ? (
        <input
          tabIndex={-1}
          value={value || ""}
          onChange={() => {}}
          required
          disabled={disabled}
          aria-label="Applying location"
          className="pointer-events-none absolute bottom-0 left-0 h-px w-px opacity-0"
        />
      ) : null}

      {open && !disabled
        ? createPortal(
            <div
              ref={dropdownPanelRef}
              className="fixed z-[100000] overflow-hidden rounded-[10px] border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]"
              style={{
                left: `${panelPosition.left}px`,
                top: `${panelPosition.top}px`,
                width: `${panelPosition.width}px`,
              }}
            >
              <div className="max-h-72 overflow-y-auto py-1">
                {normalizedOptions.length > 0 ? (
                  normalizedOptions.map((option) => {
                    const active = String(option.value) === String(value || "");

                    return (
                      <button
                        key={option.id || option.value}
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        className={`block w-full border-b border-[#EEF2F6] px-3 py-3 text-left text-xs font-semibold transition last:border-b-0 ${
                          active
                            ? "bg-[#FFF0EB] text-[#FF5C28]"
                            : "bg-white text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                        }`}
                      >
                        <span className="block min-w-0 truncate">
                          {option.label}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-3 text-xs font-semibold text-[#98A2B3]">
                    No locations found.
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
        className={`flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-[10px] border px-3 text-left text-xs font-extrabold outline-none transition ${
          open
            ? "border-[#FF5C28] bg-white text-[#042C51] ring-4 ring-[#FF5C28]/10"
            : "border-[#D7DEE8] bg-[#F8FAFC] text-[#042C51] hover:border-[#FF5C28]/40 hover:bg-white"
        }`}
      >
        <span className="min-w-0 flex-1 truncate">{displayText}</span>

        <ChevronDown
          size={14}
          className={`shrink-0 text-[#215789] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute left-0 top-[calc(100%+8px)] z-[100000] overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl ${menuClassName}`}
        >
          <div className="max-h-72 overflow-y-auto py-2 sibs-scrollbar">
            {options.map((option) => {
              const active = String(option.value) === String(value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`block w-full px-4 py-3 text-left text-xs font-bold transition ${
                    active
                      ? "bg-[#FFF0EB] text-[#FF5C28]"
                      : "bg-white text-[#042C51] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
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

function CalendarDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
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
    width: 340,
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

  const updateCalendarPanelPosition = useCallback(() => {
    if (!calendarRef.current) return;

    const rect = calendarRef.current.getBoundingClientRect();
    const panelWidth = 340;
    const gutter = 12;
    const maxLeft = window.innerWidth - panelWidth - gutter;

    setPanelPosition({
      top: rect.bottom + 8,
      left: Math.max(gutter, Math.min(rect.left, maxLeft)),
      width: panelWidth,
    });
  }, []);

  useEffect(() => {
    if (!open || !calendarRef.current) return;

    updateCalendarPanelPosition();
    window.addEventListener("resize", updateCalendarPanelPosition);
    window.addEventListener("scroll", updateCalendarPanelPosition, true);

    return () => {
      window.removeEventListener("resize", updateCalendarPanelPosition);
      window.removeEventListener("scroll", updateCalendarPanelPosition, true);
    };
  }, [open, updateCalendarPanelPosition]);

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

  function handleToggleOpen() {
    if (!open) {
      if (selectedDate) {
        setDisplayDate(
          new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
        );
      }

      updateCalendarPanelPosition();
    }

    setOpen((previous) => !previous);
  }

  return (
    <div ref={calendarRef} className="relative z-[220] min-w-0">
      {required && (
        <input
          tabIndex={-1}
          value={value || ""}
          onChange={() => {}}
          required
          disabled={disabled}
          aria-label="Date of Birth"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        />
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={handleToggleOpen}
        className={`flex h-10 w-full min-w-0 items-center justify-between gap-3 rounded-[10px] border px-3 text-left text-xs font-bold outline-none transition ${
          open
            ? "border-[#FF5C28] bg-white text-[#042C51] ring-4 ring-[#FF5C28]/10"
            : "border-[#D7DEE8] bg-[#F8FAFC] hover:border-[#FF5C28]/40 hover:bg-white"
        } ${
          disabled
            ? "cursor-not-allowed border-[#D7DEE8] bg-[#F2F4F7] text-[#667085] opacity-70"
            : "text-[#042C51]"
        }`}
      >
        <span className="inline-flex min-w-0 flex-1 items-center gap-2 truncate">
          <CalendarDays size={16} className="shrink-0 text-[#215789]" />

          <span
            className={`min-w-0 truncate ${
              value ? "text-[#042C51]" : "text-[#98A2B3]"
            }`}
          >
            {displayText}
          </span>
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-[#215789] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled
        ? createPortal(
            <div
              ref={calendarPanelRef}
              className="fixed z-[100000] overflow-visible rounded-2xl border border-[#D7DEE8] bg-white shadow-2xl"
              style={{
                left: `${panelPosition.left}px`,
                top: `${panelPosition.top}px`,
                width: `${panelPosition.width}px`,
              }}
            >
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
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] ${
                          active
                            ? "bg-[#FF5C28] text-white shadow-sm"
                            : currentDay
                              ? "border border-[#B9D7FF] bg-[#EFF6FF] text-[#042C51]"
                              : day.isCurrentMonth
                                ? "border border-transparent bg-white text-[#042C51] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                                : "border border-transparent bg-white text-[#C7D2E0] hover:bg-[#F8FAFC]"
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
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white px-3 text-xs font-extrabold text-sibs-tertiary-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FF5C28]/35 hover:bg-[#FFF7F3] hover:text-[#FF5C28] hover:shadow-sm active:scale-[0.98]"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={handleToday}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-sibs-primary-1 px-3 text-xs font-extrabold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D4676] hover:shadow-md active:scale-[0.98]"
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
  const dropdownPanelRef = useRef(null);
  const searchInputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [panelPosition, setPanelPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 256,
    placement: "below",
  });

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

  function calculatePanelPosition() {
    if (!dropdownRef.current || typeof window === "undefined") return null;

    const rect = dropdownRef.current.getBoundingClientRect();
    const gutter = 12;
    const gap = 8;
    const panelWidth = rect.width;
    const maxLeft = window.innerWidth - panelWidth - gutter;
    const estimatedHeight = Math.min(
      256,
      Math.max(48, visibleOptions.length * 41 + 8),
    );
    const availableBelow = Math.max(
      0,
      window.innerHeight - rect.bottom - gutter - gap,
    );
    const availableAbove = Math.max(0, rect.top - gutter - gap);
    const openAbove =
      availableBelow < Math.min(estimatedHeight, 180) &&
      availableAbove > availableBelow;
    const availableHeight = openAbove ? availableAbove : availableBelow;
    const maxHeight = Math.max(96, Math.min(256, availableHeight || 96));
    const measuredHeight = dropdownPanelRef.current?.offsetHeight || estimatedHeight;
    const panelHeight = Math.min(measuredHeight, maxHeight);

    return {
      top: openAbove
        ? Math.max(gutter, rect.top - gap - panelHeight)
        : rect.bottom + gap,
      left: Math.max(gutter, Math.min(rect.left, maxLeft)),
      width: panelWidth,
      maxHeight,
      placement: openAbove ? "above" : "below",
    };
  }

  useEffect(() => {
    function handleClickOutside(event) {
      const clickedAnchor = dropdownRef.current?.contains(event.target);
      const clickedPanel = dropdownPanelRef.current?.contains(event.target);

      if (!clickedAnchor && !clickedPanel) {
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

  useEffect(() => {
    if (!open) return undefined;

    function updatePanelPosition() {
      const nextPosition = calculatePanelPosition();
      if (nextPosition) setPanelPosition(nextPosition);
    }

    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open, visibleOptions.length]);

  function openSearch() {
    setSearchTerm("");

    const nextPosition = calculatePanelPosition();
    if (nextPosition) setPanelPosition(nextPosition);

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
      const nextPosition = calculatePanelPosition();
      if (nextPosition) setPanelPosition(nextPosition);
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
        className={`flex h-10 w-full min-w-0 items-center gap-3 rounded-[10px] border px-3 text-xs font-bold outline-none transition ${
          open
            ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10"
            : "border-[#D7DEE8] bg-[#F8FAFC] hover:border-[#FF5C28]/40 hover:bg-white"
        }`}
      >
        <Search size={17} className="shrink-0 text-[#215789]" />

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
          className="h-full min-w-0 flex-1 border-0 bg-transparent text-xs font-bold text-[#042C51] outline-none placeholder:text-[#98A2B3]"
        />

        <button
          type="button"
          onClick={handleToggle}
          aria-label={open ? "Close school year options" : "Open school year options"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-[#FFF7F3]"
        >
          <ChevronDown
            size={18}
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

      {open
        ? createPortal(
            <div
              ref={dropdownPanelRef}
              role="listbox"
              data-placement={panelPosition.placement}
              className="fixed z-[100000] overflow-hidden rounded-[10px] border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]"
              style={{
                left: `${panelPosition.left}px`,
                top: `${panelPosition.top}px`,
                width: `${panelPosition.width}px`,
              }}
            >
              <div
                className="overflow-y-auto py-1 sibs-scrollbar"
                style={{ maxHeight: `${panelPosition.maxHeight}px` }}
              >
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
                        className={`block w-full border-b border-[#EEF2F6] px-3 py-2.5 text-left text-xs font-semibold transition last:border-b-0 ${
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
                  <div className="px-3 py-2.5 text-xs font-semibold text-[#98A2B3]">
                    No school year found.
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

function EducationSchoolFields({ section, value, onChange }) {
  const school = getEducationSchoolDraft(value);

  function updateField(field, nextValue) {
    const normalizedValue =
      field === "schoolYearGraduated"
        ? normalizeSchoolYearInputValue(nextValue)
        : String(nextValue ?? "").toUpperCase();

    onChange({
      ...school,
      [field]: normalizedValue,
    });
  }

  return (
    <div className="rounded-[12px] border border-[#DCE6F1] bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-1">
        <h4 className="text-sm font-extrabold text-sibs-primary-1">
          {section.title}
        </h4>
        <p className="text-xs font-semibold leading-5 text-[#667085]">
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
            className={textareaInputClass("min-h-11 leading-6")}
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
            className={textareaInputClass("min-h-11 leading-6")}
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
            <p className="mt-2 text-xs font-semibold text-[#667085]">
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
    <div className="space-y-4 rounded-2xl border border-[#D6E0EA] bg-[#F8FAFC] p-4 sm:p-5">
      <div>
        <h4 className="text-xs font-extrabold uppercase tracking-normal text-[#042C51]">
          Required Education Details
        </h4>
        <p className="mt-1 text-xs font-semibold leading-5 text-[#667085]">
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
                  <label
                    className={`group flex cursor-pointer items-start gap-3 rounded-[10px] border p-3.5 transition ${
                      educationDetails.attendedSeniorHighSchool
                        ? "border-[#FF5C28] bg-[#FFF0EB] shadow-sm"
                        : "border-[#D7DEE8] bg-white hover:border-[#FF5C28]/40 hover:bg-[#FFF9F6]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={educationDetails.attendedSeniorHighSchool}
                      onChange={(event) =>
                        handleSeniorHighAttendanceChange(event.target.checked)
                      }
                      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#FF5C28]"
                    />
                    <span>
                      <span className="block text-xs font-extrabold text-[#042C51]">
                        I attended Senior High School
                      </span>
                      <span className="mt-1 block text-xs font-semibold leading-5 text-[#667085]">
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

function MultiCheckGroup({ options = [], value = [], onChange, disabled = false }) {
  const safeValue = Array.isArray(value) ? value : [];

  function toggle(optionValue) {
    if (disabled) return;

    if (safeValue.includes(optionValue)) {
      onChange(safeValue.filter((item) => item !== optionValue));
      return;
    }

    onChange([...safeValue, optionValue]);
  }

  if (!options.length) {
    return <EmptyOptionNotice />;
  }

  return (
    <div className="grid grid-cols-1 gap-2 rounded-[12px] border border-[#DCE6F1] bg-[#F8FAFC] p-3 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((option) => {
        const optionValue = getOptionValue(option);
        const optionLabel = getOptionLabel(option);
        const checked = safeValue.includes(optionValue);

        return (
          <label
            key={option?.id || optionValue}
            className={`group flex items-start gap-2.5 rounded-[10px] border px-3 py-2.5 text-xs transition ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"} ${
              checked
                ? "border-[#FF5C28] bg-[#FFF0EB] font-extrabold text-[#042C51] shadow-sm"
                : "border-[#DCE6F1] bg-white font-bold text-[#344054] hover:border-[#FF5C28]/40 hover:bg-[#FFF9F6] hover:text-[#FF5C28]"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={() => toggle(optionValue)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-[#98A2B3] accent-[#FF5C28]"
            />

            <span className="leading-5">{optionLabel}</span>
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
    <div className={`relative grid gap-2 ${columns}`}>
      {normalizedOptions.map((option) => {
        const active = String(option.value) === String(value || "");

        return (
          <button
            key={option.id || option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`min-h-10 rounded-[10px] border px-3 py-2 text-xs font-extrabold transition ${
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

function TextField({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  required = false,
  extra = "",
  uppercase = true,
  hasError = false,
  inputMode,
  maxLength,
  pattern,
  title,
}) {
  return (
    <div className={`min-w-0 ${extra}`}>
      <FieldLabel>
        {label} {required && <RequiredMark />}
      </FieldLabel>

      <input
        type={type}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        maxLength={maxLength}
        pattern={pattern}
        title={title}
        aria-invalid={hasError}
        className={inputClass(
          hasError
            ? "border-red-300 bg-red-50 ring-4 ring-red-100 focus:border-red-400 focus:ring-red-100"
            : "",
          { uppercase },
        )}
      />
    </div>
  );
}

function createEmptyExperience(baseExperience = {}) {
  return {
    ...baseExperience,
    id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    industry: "",
    industryRelevantExperience: "",
    lengthOfWorkExperience: "",
    years: "",
    role: "",
    company: "",
    monthlyCompensation: "",
    reasonForLeaving: "",
    hasOtherExperience: "No",
  };
}

function normalizeExperienceForForm(experience = {}) {
  return {
    ...experience,
    industry:
      experience.industry || experience.industryRelevantExperience || "",
    industryRelevantExperience:
      experience.industryRelevantExperience || experience.industry || "",
    lengthOfWorkExperience: experience.lengthOfWorkExperience || "",
    years: experience.years || "",
    role: experience.role || "",
    company: experience.company || "",
    monthlyCompensation: experience.monthlyCompensation || "",
    reasonForLeaving: experience.reasonForLeaving || "",
    hasOtherExperience: experience.hasOtherExperience || "No",
  };
}

function ExperienceFields({
  experience,
  index,
  title,
  onChange,
  lengthOptions,
  showRemove = false,
  onRemove,
}) {
  const normalizedExperience = normalizeExperienceForForm(experience);

  function updateExperienceField(field, value) {
    const normalizedValue = normalizeExperienceFieldValue(field, value);

    const nextExperience = {
      ...normalizedExperience,
      [field]: normalizedValue,
    };

    if (field === "industryRelevantExperience") {
      nextExperience.industry = normalizedValue;
    }

    if (field === "industry") {
      nextExperience.industryRelevantExperience = normalizedValue;
    }

    onChange(index, nextExperience);
  }

  return (
    <div className="sibs-page-card-in rounded-[12px] border border-[#DCE6F1] bg-[#F8FAFC] p-4 shadow-2xs transition-all duration-200 hover:border-[#C9D7E6] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="text-sm font-extrabold text-sibs-primary-1">{title}</h4>

        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-4 text-xs font-bold text-red-600 transition hover:bg-red-50"
          >
            <Trash2 size={14} />
            Remove
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <FieldLabel>Industry or Relevant Experience</FieldLabel>
          <input
            value={normalizedExperience.industryRelevantExperience}
            onChange={(event) =>
              updateExperienceField(
                "industryRelevantExperience",
                event.target.value,
              )
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
            value={normalizedExperience.lengthOfWorkExperience}
            options={lengthOptions}
            placeholder="Select length"
            onChange={(value) =>
              updateExperienceField("lengthOfWorkExperience", value)
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
            value={normalizedExperience.years}
            onChange={(event) => updateExperienceField("years", event.target.value)}
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
            value={normalizedExperience.role}
            onChange={(event) => updateExperienceField("role", event.target.value)}
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
            value={normalizedExperience.company}
            onChange={(event) =>
              updateExperienceField("company", event.target.value)
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
            value={normalizedExperience.monthlyCompensation}
            onChange={(event) =>
              updateExperienceField("monthlyCompensation", event.target.value)
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
            value={normalizedExperience.reasonForLeaving}
            onChange={(event) =>
              updateExperienceField("reasonForLeaving", event.target.value)
            }
            placeholder="Reason for leaving"
            className={inputClass()}
          />
        </div>
      </div>
    </div>
  );
}

function PositionInfoItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-gray-700">
        {value || "—"}
      </p>
    </div>
  );
}

function normalizePositionOption(position) {
  if (!position) return null;

  if (typeof position === "string") {
    const title = cleanText(position);

    if (!title) return null;

    return {
      id: title,
      positionKey: title,
      positionId: "",
      positionTitle: title,
      departmentId: "",
      department: "",
      accountId: "",
      accountName: "",
      accountGhlName: "",
      jdId: "",
      jdCode: "",
      documentTitle: "",
      locationSite: "",
      status: "",
      approvalStatus: "",
    };
  }

  const positionId =
    position.positionId ||
    position.position_id ||
    position.positionCode ||
    position.position_code ||
    position.id ||
    "";

  const positionTitle =
    position.positionTitle ||
    position.position_title ||
    position.title ||
    position.position ||
    position.name ||
    position.label ||
    position.value ||
    "";

  const departmentId =
    position.departmentId ||
    position.department_id ||
    position.gy_dept_id ||
    position.id_department ||
    "";

  const department =
    position.department ||
    position.departmentName ||
    position.department_name ||
    position.name_department ||
    "";

  const accountId =
    position.accountId || position.account_id || position.gy_acc_id || "";

  const accountName =
    position.accountName ||
    position.account_name ||
    position.gy_acc_name ||
    position.account ||
    "";

  const accountGhlName =
    position.accountGhlName ||
    position.account_ghl_name ||
    position.gy_acc_ghl_name ||
    "";

  const jdId =
    position.jdId ||
    position.jd_id ||
    position.jobDescriptionId ||
    position.job_description_id ||
    "";

  const jdCode = position.jdCode || position.jd_code || "";

  const documentTitle =
    position.documentTitle || position.document_title || "";

  const locationSite =
    position.locationSite ||
    position.location_site ||
    position.location ||
    position.site ||
    "";

  const status =
    position.status || position.positionStatus || position.position_status || "";

  const approvalStatus =
    position.approvalStatus || position.approval_status || "";

  const finalTitle = cleanText(positionTitle);
  const finalId = cleanText(positionId);

  if (!finalTitle && !finalId) return null;

  return {
    id: cleanText(position.id || finalId || finalTitle),
    positionKey: cleanText(finalId || finalTitle),
    positionId: finalId,
    positionTitle: finalTitle || finalId,
    departmentId: cleanText(departmentId),
    department: cleanText(department),
    accountId: cleanText(accountId),
    accountName: cleanText(accountName),
    accountGhlName: cleanText(accountGhlName),
    jdId: cleanText(jdId),
    jdCode: cleanText(jdCode),
    documentTitle: cleanText(documentTitle),
    locationSite: cleanText(locationSite),
    status: cleanText(status),
    approvalStatus: cleanText(approvalStatus),
  };
}

function isApprovedActivePosition(position = {}) {
  const normalizedPosition = normalizePositionOption(position);

  if (!normalizedPosition) return false;

  return (
    cleanText(normalizedPosition.status).toLowerCase() === "active" &&
    cleanText(normalizedPosition.approvalStatus).toLowerCase() === "approved"
  );
}

function getUniquePositionOptions(positions = []) {
  const map = new Map();

  positions.forEach((position) => {
    const normalizedPosition = normalizePositionOption(position);

    if (!normalizedPosition) return;

    const key = cleanText(
      normalizedPosition.positionId || normalizedPosition.positionTitle,
    ).toLowerCase();

    if (!key) return;

    if (!map.has(key)) {
      map.set(key, normalizedPosition);
    }
  });

  return Array.from(map.values()).sort((a, b) =>
    a.positionTitle.localeCompare(b.positionTitle),
  );
}

function getPositionKey(position = {}) {
  return cleanText(
    position.positionKey ||
      position.id ||
      position.openPositionDbId ||
      position.open_position_db_id ||
      position.positionId ||
      position.position_id ||
      position.positionTitle ||
      position.position_title ||
      "",
  );
}

function getAvailablePositionDisplayLabel(position = {}) {
  const normalizedPosition = normalizePositionOption(position);

  if (!normalizedPosition) return "";

  const accountLabel = cleanText(
    normalizedPosition.accountName || normalizedPosition.accountGhlName,
  );

  return accountLabel
    ? `${normalizedPosition.positionTitle} — ${accountLabel}`
    : normalizedPosition.positionTitle;
}

function PositionJobDescriptionDropdown({
  value,
  onChange,
  positions = [],
  placeholder = "Select open position",
  disabled = false,
  onOpenJobDescription,
}) {
  const dropdownRef = useRef(null);
  const dropdownPanelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const cleanPositions = toArray(positions)
    .map(normalizePositionOption)
    .filter((position) => cleanText(position?.positionTitle));

  const selectedPosition = cleanPositions.find(
    (position) => String(getPositionKey(position)) === String(value || ""),
  );

  const displayText = selectedPosition
    ? getAvailablePositionDisplayLabel(selectedPosition)
    : placeholder;

  function calculatePanelPosition() {
    if (!dropdownRef.current) return null;

    const rect = dropdownRef.current.getBoundingClientRect();
    const gutter = 12;
    const panelWidth = rect.width;
    const maxLeft = window.innerWidth - panelWidth - gutter;

    return {
      top: rect.bottom + 8,
      left: Math.max(gutter, Math.min(rect.left, maxLeft)),
      width: panelWidth,
    };
  }

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
      const nextPosition = calculatePanelPosition();
      if (nextPosition) setPanelPosition(nextPosition);
    }

    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open]);

  function handleToggleOpen() {
    if (disabled) return;

    if (!open) {
      const nextPosition = calculatePanelPosition();
      if (nextPosition) setPanelPosition(nextPosition);
    }

    setOpen((previous) => !previous);
  }

  function handleSelect(position) {
    const positionKey = getPositionKey(position);

    if (!positionKey) return;

    onChange?.(positionKey, position);
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
        onClick={handleToggleOpen}
        className={`flex h-10 w-full min-w-0 items-center justify-between gap-3 rounded-[10px] border bg-[#F8FAFC] px-3 text-left text-xs font-semibold outline-none transition ${
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
        value={value || ""}
        onChange={() => {}}
        required
        className="pointer-events-none absolute bottom-0 left-0 h-px w-px opacity-0"
      />

      {open && !disabled
        ? createPortal(
            <div
              ref={dropdownPanelRef}
              className="fixed z-[100000] overflow-hidden rounded-[10px] border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]"
              style={{
                left: `${panelPosition.left}px`,
                top: `${panelPosition.top}px`,
                width: `${panelPosition.width}px`,
              }}
            >
              <div className="max-h-72 overflow-y-auto">
                {cleanPositions.length > 0 ? (
                  cleanPositions.map((position) => {
                    const positionTitle = cleanText(position.positionTitle);
                    const positionKey = getPositionKey(position);
                    const active =
                      String(positionKey) === String(value || "");
                    const jobDescriptionTitle = `Open ${positionTitle} job description`;

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
                            title={jobDescriptionTitle}
                            aria-label={jobDescriptionTitle}
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-transparent text-[#7A8CA1] transition hover:border-[#E6ECF2] hover:bg-[#F8FAFC] hover:text-[#E84A17] focus:outline-none focus:ring-2 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-transparent disabled:text-[#B6C0CC]"
                          >
                            <ExternalLink size={15} strokeWidth={2.2} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-3 py-3 text-xs font-semibold text-[#98A2B3]">
                    No approved active positions found.
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

export default function AddCandidateModal() {
  const {
    showAddModal,
    candidateForm,
    setCandidateForm,
    closeAddCandidateModal,
    resetCandidateForm,
    addCandidate,
    handleCandidateFileChange,
    formOptions,
    activePositionOptions,
    emptyExperience,
    isRelevantWorkExperience,
    isSaving,
  } = useTalentPool();

  const educationSectionRef = useRef(null);
  const questionsSectionRef = useRef(null);
  const fileSectionRef = useRef(null);
  const consentRef = useRef(null);
  const formScrollRef = useRef(null);
  const referralPrefillValuesRef = useRef(null);

  const [hasReferralCode, setHasReferralCode] = useState("");
  const [referralLookupStatus, setReferralLookupStatus] = useState("");
  const [referralLookupMessage, setReferralLookupMessage] = useState("");
  const [isLoadingReferralPrefill, setIsLoadingReferralPrefill] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPageOneComplete, setIsPageOneComplete] = useState(false);
  const [applicationForm, setApplicationForm] = useState(null);
  const [applicationQuestions, setApplicationQuestions] = useState([]);
  const [applicationQuestionAnswers, setApplicationQuestionAnswers] = useState({});
  const [isLoadingApplicationQuestions, setIsLoadingApplicationQuestions] = useState(false);
  const [applicationQuestionsError, setApplicationQuestionsError] = useState("");
  const [publicPositionOptions, setPublicPositionOptions] = useState([]);
  const [publicPositionLoadFailed, setPublicPositionLoadFailed] = useState(false);
  const [isLoadingPublicPositions, setIsLoadingPublicPositions] = useState(false);
  const [applicantNameCheck, setApplicantNameCheck] = useState({
    status: "idle",
    key: "",
    duplicate: false,
    source: null,
  });

  const isReferralCodeMatched = referralLookupStatus === "matched";
  const shouldShowApplicationFields =
    hasReferralCode === "No" ||
    (hasReferralCode === "Yes" && isReferralCodeMatched);
  const currentApplicantNameCheckKey = buildApplicantNameCheckKey({
    firstName: candidateForm.firstName,
    middleName: candidateForm.middleName,
    lastName: candidateForm.lastName,
  });
  const isApplicantNameVerifiedAvailable =
    applicantNameCheck.status === "available" &&
    applicantNameCheck.key === currentApplicantNameCheckKey;
  const isApplicantNameGateLocked = !isApplicantNameVerifiedAvailable;
  const hasDuplicateApplicantName =
    applicantNameCheck.status === "duplicate" &&
    applicantNameCheck.key === currentApplicantNameCheckKey;

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  useEffect(() => {
    if (!showAddModal) return;

    setCurrentPage(1);
    setIsPageOneComplete(false);
    setApplicationForm(null);
    setApplicationQuestions([]);
    setApplicationQuestionAnswers({});
    setApplicationQuestionsError("");
    setIsLoadingApplicationQuestions(false);
    setReferralLookupStatus("");
    setReferralLookupMessage("");
    setIsLoadingReferralPrefill(false);
    setApplicantNameCheck({
      status: "idle",
      key: "",
      duplicate: false,
      source: null,
    });
    referralPrefillValuesRef.current = null;
    setHasReferralCode(cleanText(candidateForm.referralCode) ? "Yes" : "");
  }, [showAddModal]);

  useEffect(() => {
    if (!showAddModal) return undefined;

    let isCurrent = true;

    setPublicPositionOptions([]);
    setPublicPositionLoadFailed(false);
    setIsLoadingPublicPositions(true);

    async function loadPublicOpenPositions() {
      try {
        const response = await getTalentPoolOpenPositions();

        if (!isCurrent) return;

        if (!response?.success) {
          throw new Error(
            response?.message || "Failed to load approved active positions.",
          );
        }

        const approvedActivePositions = Array.isArray(response?.data)
          ? response.data
              .map(normalizePositionOption)
              .filter(
                (position) =>
                  cleanText(position?.positionTitle) &&
                  isApprovedActivePosition(position),
              )
          : [];

        setPublicPositionOptions(approvedActivePositions);
      } catch (error) {
        console.error("Load Add Candidate public open positions error:", error);

        if (isCurrent) {
          setPublicPositionLoadFailed(true);
          setPublicPositionOptions([]);
        }
      } finally {
        if (isCurrent) {
          setIsLoadingPublicPositions(false);
        }
      }
    }

    loadPublicOpenPositions();

    return () => {
      isCurrent = false;
    };
  }, [showAddModal]);

  useEffect(() => {
    const referralCode = cleanText(candidateForm.referralCode).toUpperCase();

    if (!showAddModal || hasReferralCode !== "Yes") {
      setReferralLookupStatus("");
      setReferralLookupMessage("");
      setIsLoadingReferralPrefill(false);
      return undefined;
    }

    if (!referralCode || referralCode.length !== 10) {
      setReferralLookupStatus("");
      setReferralLookupMessage("");
      setIsLoadingReferralPrefill(false);
      return undefined;
    }

    let isCurrent = true;

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
          phoneNumber1: cleanText(prefill.phone1),
          applyingLocation: cleanText(prefill.applyingLocation),
          hearAboutUs: [OUTBOUND_SOURCE],
        };

        referralPrefillValuesRef.current = matchedPrefillValues;

        setCandidateForm((previous) => ({
          ...previous,
          referralCode: prefill.referralCode || referralCode,
          firstName: matchedPrefillValues.firstName || previous.firstName,
          middleName: matchedPrefillValues.middleName || previous.middleName,
          lastName: matchedPrefillValues.lastName || previous.lastName,
          suffix: matchedPrefillValues.suffix || previous.suffix,
          email: matchedPrefillValues.email || previous.email,
          phoneNumber1:
            matchedPrefillValues.phoneNumber1 || previous.phoneNumber1,
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
    }, 500);

    return () => {
      isCurrent = false;
      window.clearTimeout(lookupTimer);
    };
  }, [
    candidateForm.referralCode,
    hasReferralCode,
    setCandidateForm,
    showAddModal,
  ]);

  useEffect(() => {
    if (!showAddModal || !shouldShowApplicationFields) {
      setApplicantNameCheck({
        status: "idle",
        key: "",
        duplicate: false,
        source: null,
      });
      return undefined;
    }

    const namePayload = {
      firstName: candidateForm.firstName,
      middleName: candidateForm.middleName,
      lastName: candidateForm.lastName,
    };
    const nameKey = buildApplicantNameCheckKey(namePayload);

    if (!hasCompleteApplicantNameForDuplicateCheck(namePayload)) {
      setApplicantNameCheck({
        status: "idle",
        key: nameKey,
        duplicate: false,
        source: null,
      });
      return undefined;
    }

    let isCurrent = true;

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

      if (!isCurrent) return;

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

      setApplicantNameCheck({
        status: duplicate ? "duplicate" : "available",
        key: nameKey,
        duplicate,
        source: response?.data?.source || null,
      });
    }, 450);

    return () => {
      isCurrent = false;
      window.clearTimeout(lookupTimer);
    };
  }, [
    candidateForm.firstName,
    candidateForm.middleName,
    candidateForm.lastName,
    shouldShowApplicationFields,
    showAddModal,
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

  async function handleSubmitCandidate(event) {
    event.preventDefault();

    if (currentPage === 1) {
      await handleNextPage();
      return;
    }

    if (!validatePageTwo()) return;

    try {
      await addCandidate(event);

      showStatusModal({
        type: "success",
        title: "Candidate Saved",
        message: "The candidate profile was saved successfully.",
      });
    } catch (error) {
      console.error("Save candidate error:", error);

      showStatusModal({
        type: "error",
        title: "Save Failed",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to save candidate. Please check the required fields and try again.",
      });
    }
  }

  function handleResetCandidate() {
    resetCandidateForm();
    setHasReferralCode("");
    setReferralLookupStatus("");
    setReferralLookupMessage("");
    setIsLoadingReferralPrefill(false);
    setApplicantNameCheck({
      status: "idle",
      key: "",
      duplicate: false,
      source: null,
    });
    referralPrefillValuesRef.current = null;
    setCurrentPage(1);
    setIsPageOneComplete(false);
    setApplicationForm(null);
    setApplicationQuestions([]);
    setApplicationQuestionAnswers({});
    setApplicationQuestionsError("");
    setIsLoadingApplicationQuestions(false);

    showStatusModal({
      type: "success",
      title: "Form Reset",
      message: "The candidate form has been cleared.",
    });
  }

  if (!showAddModal) {
    return (
      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        variant="center"
        onClose={closeStatusModal}
        lockScroll
      />
    );
  }

  const safeFormOptions = {
    hearAboutUs: toArray(formOptions?.hearAboutUs),
    locations: toArray(formOptions?.locations),
    workExperience: toArray(formOptions?.workExperience),
    lengthOfExperience: toArray(formOptions?.lengthOfExperience),
    educationalAttainment: toArray(formOptions?.educationalAttainment)
      .filter((option) => !isExcludedEducationalAttainmentOption(option))
      .map(normalizeEducationalAttainmentOption),
    affiliationCertification: toArray(formOptions?.affiliationCertification),
    yesNo: toArray(formOptions?.yesNo),
    employmentInterest: toArray(formOptions?.employmentInterest),
    audioQuestions: toArray(formOptions?.audioQuestions),
  };

  const positionSourceOptions = publicPositionLoadFailed
    ? activePositionOptions
    : publicPositionOptions;

  const positionOptions = getUniquePositionOptions(positionSourceOptions);

  const selectedPosition =
    positionOptions.find(
      (position) =>
        cleanText(position.positionId) &&
        cleanText(position.positionId) ===
          cleanText(candidateForm.openPositionId),
    ) ||
    positionOptions.find(
      (position) =>
        cleanText(position.positionKey) ===
        cleanText(candidateForm.openPosition),
    ) ||
    positionOptions.find(
      (position) =>
        cleanText(position.positionTitle).toLowerCase() ===
        cleanText(candidateForm.openPosition).toLowerCase(),
    ) ||
    null;

  const selectedPositionValue =
    selectedPosition?.positionKey ||
    candidateForm.openPositionId ||
    candidateForm.openPosition ||
    "";

  const checkRelevantWorkExperience =
    typeof isRelevantWorkExperience === "function"
      ? isRelevantWorkExperience
      : (value) => cleanText(value).toLowerCase().includes("has work");

  const hasRelevantExperience = checkRelevantWorkExperience(
    candidateForm.workExperience,
  );

  const hasEmployeeReferralProgram = isEmployeeReferralProgramSelected(
    candidateForm.hearAboutUs,
    safeFormOptions.hearAboutUs,
  );

  const hasOtherExperience =
    hasRelevantExperience && candidateForm.workExperiences?.length > 1;

  const audioFileName = getCandidateFileName(candidateForm, "audio");
  const attachmentFileName = getCandidateFileName(candidateForm, "attachment");
  const audioFileSize = getCandidateFileSize(candidateForm, "audio");
  const attachmentFileSize = getCandidateFileSize(candidateForm, "attachment");

  function updateField(field, value) {
    setCandidateForm({
      ...candidateForm,
      [field]: normalizeCandidateFieldValue(field, value),
    });
  }

  function handleHearAboutUsChange(values) {
    if (isReferralCodeMatched) return;

    const employeeReferralSelected = isEmployeeReferralProgramSelected(
      values,
      safeFormOptions.hearAboutUs,
    );

    setCandidateForm({
      ...candidateForm,
      hearAboutUs: values,
      referredBy: employeeReferralSelected
        ? candidateForm.referredBy || ""
        : "",
      employeeId: employeeReferralSelected
        ? candidateForm.employeeId || ""
        : "",
    });
  }

  const selectedEducationalAttainment =
    candidateForm.highestEducationalAttainment ||
    candidateForm.educationalAttainment ||
    "";

  const candidateEducationDetails = getEducationDetailsDraft(
    candidateForm.educationDetails,
  );

  function handleEducationalAttainmentChange(value) {
    const autoAffiliationValues = getEducationAutoAffiliationValues(
      value,
      safeFormOptions.affiliationCertification,
    );

    setCandidateForm({
      ...candidateForm,
      educationalAttainment: value,
      highestEducationalAttainment: value,
      educationDetails: prepareEducationDetailsForAttainment(
        candidateForm.educationDetails,
        value,
      ),
      affiliations: mergeUniqueOptionValues(
        candidateForm.affiliations,
        autoAffiliationValues,
      ),
    });
  }

  function updateEducationDetails(nextDetails) {
    setCandidateForm({
      ...candidateForm,
      educationDetails: prepareEducationDetailsForAttainment(
        nextDetails,
        selectedEducationalAttainment,
      ),
    });
  }

  function handleOpenPositionChange(value) {
    const selected =
      positionOptions.find(
        (position) => cleanText(position.positionKey) === cleanText(value),
      ) ||
      positionOptions.find(
        (position) => cleanText(position.positionTitle) === cleanText(value),
      ) ||
      null;

    setCandidateForm({
      ...candidateForm,
      openPosition: selected?.positionTitle || value,
      openPositionId: selected?.positionId || selected?.positionKey || "",
      appliedPosition: selected?.positionTitle || value,
      positionId: selected?.positionId || selected?.positionKey || "",
      positionDepartmentId: selected?.departmentId || "",
      positionDepartment: selected?.department || "",
      positionAccountId: selected?.accountId || "",
      positionAccountName: selected?.accountName || "",
      positionAccountGhlName: selected?.accountGhlName || "",
      positionLocationSite: selected?.locationSite || "",
      positionStatus: selected?.status || "",
      applicationFormAnswers: [],
    });

    setIsPageOneComplete(false);
    setApplicationForm(null);
    setApplicationQuestions([]);
    setApplicationQuestionAnswers({});
    setApplicationQuestionsError("");
  }

  function handleOpenPositionJobDescription(position) {
    const normalizedPosition = normalizePositionOption(position);
    const jdId = cleanText(normalizedPosition?.jdId);

    if (!jdId) {
      showStatusModal({
        type: "error",
        title: "Job Description Unavailable",
        message: "This position does not have a linked job description.",
      });
      return;
    }

    const jobDescriptionUrl = `/job-description/${encodeURIComponent(jdId)}`;

    window.open(jobDescriptionUrl, "_blank", "noopener,noreferrer");
  }

  function updateTrainingAttended(index, value) {
    setCandidateForm((previous) => {
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
    setCandidateForm((previous) => ({
      ...previous,
      trainingAttended: [
        ...ensureTrainingEntryRows(previous.trainingAttended),
        "",
      ],
    }));
  }

  function removeTrainingAttended(index) {
    setCandidateForm((previous) => {
      const nextRows = ensureTrainingEntryRows(
        previous.trainingAttended,
      ).filter((_, itemIndex) => itemIndex !== index);

      return {
        ...previous,
        trainingAttended: nextRows.length ? nextRows : [""],
      };
    });
  }

  function updateReference(index, field, value) {
    const references = Array.isArray(candidateForm.references)
      ? candidateForm.references
      : [
          { name: "", phone: "" },
          { name: "", phone: "" },
          { name: "", phone: "" },
        ];

    setCandidateForm({
      ...candidateForm,
      references: references.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]:
                field === "phone"
                  ? normalizeReferencePhoneInput(value, item.phone)
                  : normalizeUpperText(value),
            }
          : item,
      ),
    });
  }

  function updateExperience(index, nextExperience) {
    const currentExperiences = Array.isArray(candidateForm.workExperiences)
      ? candidateForm.workExperiences
      : [createEmptyExperience(emptyExperience)];

    setCandidateForm({
      ...candidateForm,
      workExperiences: currentExperiences.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...nextExperience,
              industry:
                nextExperience.industry ||
                nextExperience.industryRelevantExperience ||
                "",
              industryRelevantExperience:
                nextExperience.industryRelevantExperience ||
                nextExperience.industry ||
                "",
            }
          : item,
      ),
    });
  }

  function ensurePrimaryExperience() {
    const currentExperiences = Array.isArray(candidateForm.workExperiences)
      ? candidateForm.workExperiences
      : [];

    if (currentExperiences.length > 0) return currentExperiences;

    return [createEmptyExperience(emptyExperience)];
  }

  function handleWorkExperienceChange(value) {
    setCandidateForm({
      ...candidateForm,
      workExperience: value,
      workExperiences: checkRelevantWorkExperience(value)
        ? ensurePrimaryExperience()
        : [{ ...emptyExperience }],
    });
  }

  function addOtherExperience() {
    const currentExperiences = ensurePrimaryExperience();

    setCandidateForm({
      ...candidateForm,
      workExperiences: [
        ...currentExperiences,
        {
          ...createEmptyExperience(emptyExperience),
          id: Date.now(),
          hasOtherExperience: "No",
        },
      ],
    });
  }

  function removeExperience(index) {
    const currentExperiences = ensurePrimaryExperience();

    const nextExperiences = currentExperiences.filter(
      (_, itemIndex) => itemIndex !== index,
    );

    setCandidateForm({
      ...candidateForm,
      workExperiences:
        nextExperiences.length > 0
          ? nextExperiences
          : [createEmptyExperience(emptyExperience)],
    });
  }

  function handleOtherExperienceAnswer(value) {
    const currentExperiences = ensurePrimaryExperience();

    if (value === "Yes") {
      setCandidateForm({
        ...candidateForm,
        workExperiences:
          currentExperiences.length > 1
            ? currentExperiences
            : [
                currentExperiences[0],
                {
                  ...createEmptyExperience(emptyExperience),
                  id: Date.now(),
                },
              ],
      });

      return;
    }

    setCandidateForm({
      ...candidateForm,
      workExperiences: [currentExperiences[0]],
    });
  }

  const references = Array.isArray(candidateForm.references)
    ? candidateForm.references
    : [
        { name: "", phone: "" },
        { name: "", phone: "" },
        { name: "", phone: "" },
      ];

  const workExperiences = ensurePrimaryExperience();

  function scrollModalToTop() {
    window.setTimeout(() => {
      formScrollRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
    }, 50);
  }

  function handleReferralChoiceChange(value) {
    if (isSaving) return;

    if (value === "Yes") {
      setHasReferralCode("Yes");
      setApplicantNameCheck({
        status: "idle",
        key: "",
        duplicate: false,
        source: null,
      });
      setIsPageOneComplete(false);
      setCurrentPage(1);
      return;
    }

    const matchedValues = referralPrefillValuesRef.current || {};

    setHasReferralCode("No");
    setReferralLookupStatus("");
    setReferralLookupMessage("");
    setIsLoadingReferralPrefill(false);
    setApplicantNameCheck({
      status: "idle",
      key: "",
      duplicate: false,
      source: null,
    });
    referralPrefillValuesRef.current = null;
    setIsPageOneComplete(false);
    setCurrentPage(1);

    setCandidateForm((previous) => {
      const next = {
        ...previous,
        referralCode: "",
      };

      [
        "firstName",
        "middleName",
        "lastName",
        "suffix",
        "email",
        "phoneNumber1",
        "applyingLocation",
      ].forEach((field) => {
        if (
          cleanText(matchedValues[field]) &&
          cleanText(previous[field]) === cleanText(matchedValues[field])
        ) {
          next[field] = "";
        }
      });

      if (
        Array.isArray(matchedValues.hearAboutUs) &&
        JSON.stringify(previous.hearAboutUs || []) ===
          JSON.stringify(matchedValues.hearAboutUs)
      ) {
        next.hearAboutUs = [];
      }

      return next;
    });
  }

  function validatePageOne({ silent = false } = {}) {
    if (!hasReferralCode) {
      if (!silent) showStatusModal({
        type: "error",
        title: "Referral selection required",
        message: "Please select whether the candidate has a referral code.",
      });
      return false;
    }

    if (hasReferralCode === "Yes" && !cleanText(candidateForm.referralCode)) {
      if (!silent) showStatusModal({
        type: "error",
        title: "Referral code required",
        message: "Please enter the candidate referral code before continuing.",
      });
      return false;
    }

    if (hasReferralCode === "Yes" && !isReferralCodeMatched) {
      if (!silent) showStatusModal({
        type: "error",
        title: "Referral code not matched",
        message: "Please enter a valid matched referral code before continuing.",
      });
      return false;
    }

    if (!shouldShowApplicationFields) return false;

    if (isApplicantNameGateLocked) {
      return false;
    }

    if (!Array.isArray(candidateForm.hearAboutUs) || !candidateForm.hearAboutUs.length) {
      if (!silent) showStatusModal({
        type: "error",
        title: "Application source required",
        message: "Please select how the candidate first heard about SiBS.",
      });
      return false;
    }

    if (!cleanText(candidateForm.positionId || candidateForm.openPositionId)) {
      if (!silent) showStatusModal({
        type: "error",
        title: "Open position required",
        message: "Please select an approved active open position.",
      });
      return false;
    }

    if (!cleanText(candidateForm.applyingLocation)) {
      if (!silent) showStatusModal({
        type: "error",
        title: "Applying location required",
        message: "Please select which location the candidate is applying for.",
      });
      return false;
    }

    if (hasEmployeeReferralProgram && !cleanText(candidateForm.referredBy)) {
      if (!silent) showStatusModal({
        type: "error",
        title: "Referrer name required",
        message: "Please enter the name of the employee who referred the candidate.",
      });
      return false;
    }

    if (hasEmployeeReferralProgram && !cleanText(candidateForm.employeeId)) {
      if (!silent) showStatusModal({
        type: "error",
        title: "Referral SiBS ID required",
        message: "Please enter the SiBS ID of the employee who referred the candidate.",
      });
      return false;
    }

    const educationValidationMessage = validateEducationDetails(
      selectedEducationalAttainment,
      candidateForm.educationDetails,
    );

    if (educationValidationMessage) {
      window.setTimeout(() => {
        educationSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 50);

      if (!silent) showStatusModal({
        type: "error",
        title: "Incomplete Education Details",
        message: educationValidationMessage,
      });
      return false;
    }

    if (formScrollRef.current) {
      const isFormValid = silent
        ? formScrollRef.current.checkValidity()
        : formScrollRef.current.reportValidity();

      if (!isFormValid) {
        return false;
      }
    }

    return true;
  }

  function validatePageTwo() {
    const questionValidationMessage = validateApplicationQuestionAnswers(
      applicationQuestions,
      applicationQuestionAnswers,
    );

    if (questionValidationMessage) {
      questionsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      showStatusModal({
        type: "error",
        title: "Position question required",
        message: questionValidationMessage,
      });
      return false;
    }

    if (!candidateForm.audioFile) {
      fileSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      showStatusModal({
        type: "error",
        title: "Audio file required",
        message: "Please upload a single audio file before saving the candidate.",
      });
      return false;
    }

    if (!candidateForm.attachmentFile) {
      fileSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      showStatusModal({
        type: "error",
        title: "Supporting file required",
        message: "Please upload a supporting document or file before saving the candidate.",
      });
      return false;
    }

    if (!candidateForm.consent) {
      consentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      showStatusModal({
        type: "error",
        title: "Consent required",
        message: "Please confirm the recruitment processing consent before saving.",
      });
      return false;
    }

    return true;
  }

  function updateApplicationQuestionAnswer(questionId, patch) {
    const key = String(questionId);

    setApplicationQuestionAnswers((previous) => {
      const next = {
        ...previous,
        [key]: {
          ...(previous?.[key] || {
            questionId: Number(questionId || 0),
            answerType: "Text",
            textAnswer: "",
          }),
          ...patch,
        },
      };

      const applicationFormAnswers = buildApplicationFormAnswersPayload(
        applicationQuestions,
        next,
      );

      setCandidateForm((formPrevious) => ({
        ...formPrevious,
        applicationFormAnswers,
      }));

      return next;
    });
  }

  async function handlePageTwoTabClick() {
    if (currentPage === 2) return;

    if (!validatePageOne({ silent: true })) {
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
    if (currentPage === 2) return;
    if (!validatePageOne()) return;

    const positionId = cleanText(
      candidateForm.positionId || candidateForm.openPositionId,
    );

    if (!positionId) {
      showStatusModal({
        type: "error",
        title: "Position configuration unavailable",
        message: "The selected open position does not have a Position ID. Please select it again.",
      });
      return;
    }

    setIsPageOneComplete(true);
    setIsLoadingApplicationQuestions(true);
    setApplicationQuestionsError("");

    try {
      const response = await getTalentPoolApplicationForm(positionId);

      if (!response?.success) {
        throw new Error(
          response?.message || "Failed to load position screening questions.",
        );
      }

      const nextForm = response?.data?.form || null;
      const nextQuestions = normalizeApplicationFormQuestions(
        response?.data || {},
      );
      const nextAnswers = createQuestionAnswerState(
        nextQuestions,
        applicationQuestionAnswers,
      );

      setApplicationForm(nextForm);
      setApplicationQuestions(nextQuestions);
      setApplicationQuestionAnswers(nextAnswers);
      setCandidateForm((previous) => ({
        ...previous,
        positionId,
        referralCode:
          hasReferralCode === "Yes" ? cleanText(previous.referralCode).toUpperCase() : "",
        applicationFormAnswers: buildApplicationFormAnswersPayload(
          nextQuestions,
          nextAnswers,
        ),
      }));
      setCurrentPage(2);
      scrollModalToTop();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load position screening questions.";

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
    scrollModalToTop();
  }

  return (
    <>
      <div
        className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[10001] flex h-dvh items-center justify-center p-2 font-jakarta sm:p-3 2xl:p-4"
        onClick={closeAddCandidateModal}
      >
        <div
          className="sibs-modal-pop-in flex max-h-[88dvh] 2xl:max-h-[92dvh] w-full max-w-[1060px] flex-col overflow-hidden rounded-2xl border border-sibs-border bg-[#F4F7FB] font-jakarta shadow-[0_30px_90px_rgba(2,26,48,0.42)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex shrink-0 flex-col gap-2.5 border-b border-[#083A69] bg-[#042C51] px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6 2xl:py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-8.5 w-8.5 2xl:h-10 2xl:w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sibs-orange ring-1 ring-white/15">
                <UserPlus size={18} />
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="sibs-modal-title truncate text-white">
                    Add Candidate
                  </h2>
                  <span className="rounded bg-sibs-orange px-2 py-0.5 2xl:px-2.5 2xl:py-1 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-normal text-white">
                    Registration
                  </span>
                </div>
                <p className="sibs-modal-subtitle mt-0.5 text-white/75 truncate sm:text-clip">
                  Create a reusable candidate profile using database options and backend storage.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleResetCandidate}
                disabled={isSaving}
                className="inline-flex h-8 2xl:h-8.5 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 text-[10px] 2xl:text-xs font-extrabold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={13} />
                Reset
              </button>

              {shouldShowApplicationFields ? (
              <button
                type="submit"
                form="add-candidate-form"
                disabled={isSaving || isLoadingApplicationQuestions || isApplicantNameGateLocked}
                className="inline-flex h-8 2xl:h-8.5 items-center justify-center gap-1.5 rounded-lg bg-sibs-orange px-3.5 text-[10px] 2xl:text-xs font-extrabold text-white shadow-xs transition hover:bg-sibs-orange/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving || isLoadingApplicationQuestions ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : currentPage === 1 ? (
                  <ChevronRight size={13} />
                ) : (
                  <Save size={13} />
                )}
                {isSaving
                  ? "Saving..."
                  : isLoadingApplicationQuestions
                    ? "Loading..."
                    : currentPage === 1
                      ? "Next"
                      : "Save Candidate"}
              </button>
              ) : null}

              <button
                type="button"
                onClick={closeAddCandidateModal}
                disabled={isSaving}
                aria-label="Close add candidate modal"
                className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white/80 transition hover:border-sibs-orange/60 hover:bg-sibs-orange hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <form
            ref={formScrollRef}
            id="add-candidate-form"
            onSubmit={handleSubmitCandidate}
            className="thin-scroll flex-1 space-y-4 2xl:space-y-5 overflow-y-auto bg-[#F4F7FB] p-3.5 sm:p-4 2xl:p-6"
          >
            <div className="rounded-2xl border border-sibs-border bg-white p-3.5 2xl:p-4 shadow-xs">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EB] text-[#FF5C28]">
                  <ShieldCheck size={17} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-xs font-extrabold text-sibs-primary-1">
                    Candidate Profile Registration Standard
                  </h3>
                  <p className="mt-1 text-xs font-semibold leading-5 text-[#667085]">
                    Complete the sourcing, personal, work, education, readiness, reference, and upload information required for a reusable Talent Pool profile.
                  </p>
                </div>
              </div>
            </div>

            <ApplicationPageTabs
              visible={shouldShowApplicationFields}
              currentPage={currentPage}
              isPageOneComplete={isPageOneComplete}
              isLoadingPageTwo={isLoadingApplicationQuestions || isApplicantNameGateLocked}
              onPageOneClick={handlePreviousPage}
              onPageTwoClick={handlePageTwoTabClick}
            />

            {currentPage === 1 ? (
              <>
            <SectionCard
              number={1}
              icon={BriefcaseBusiness}
              title="Application Source and Position"
              description="Tell us where the applicant learned about SiBS and what position they are applying for."
            >
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#DCE6F1] bg-[#F8FAFC] p-4 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide text-[#E6531B]">
                        Referral
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-[#042C51]">
                        Do you have a referral code? <RequiredMark />
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#667085]">
                        Select Yes if a referral code was shared with the candidate. Select No to continue with the regular candidate form.
                      </p>
                    </div>

                    <div className="grid w-full grid-cols-2 gap-2 md:w-[260px]">
                      <button
                        type="button"
                        onClick={() => handleReferralChoiceChange("Yes")}
                        disabled={isSaving}
                        className={`h-10 rounded-[10px] border px-4 text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${
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
                        disabled={isSaving}
                        className={`h-10 rounded-[10px] border px-4 text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${
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

                {hasReferralCode === "Yes" ? (
                  <div className="rounded-2xl border border-[#FFB27A] bg-[#FFF7F1] p-4 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wide text-[#E6531B]">
                          Referral Code
                        </p>
                        <p className="mt-1 text-sm font-extrabold text-[#042C51]">
                          Enter and match the referral code to continue.
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#667085]">
                          Candidate information will be prefilled from the matched applicant lead.
                        </p>
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
                          value={candidateForm.referralCode || ""}
                          disabled={isSaving}
                          maxLength={10}
                          onChange={(event) =>
                            updateField(
                              "referralCode",
                              event.target.value.toUpperCase().slice(0, 10),
                            )
                          }
                          placeholder="e.g. REF-******"
                          className={[
                            "h-10 w-full rounded-[10px] border bg-white px-3 text-xs font-semibold uppercase text-[#042C51] outline-none transition placeholder:text-[#98A2B3] disabled:cursor-not-allowed disabled:bg-[#F2F4F7] md:w-[260px]",
                            referralLookupStatus === "matched"
                              ? "border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                              : referralLookupStatus === "missing"
                                ? "border-amber-400 focus:ring-4 focus:ring-amber-100"
                                : "border-[#D7DEE8] focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10",
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
                    How did the applicant first hear about us? <RequiredMark />
                  </FieldLabel>

                  <MultiCheckGroup
                    options={safeFormOptions.hearAboutUs}
                    value={candidateForm.hearAboutUs}
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
                      value={selectedPositionValue}
                      disabled={
                        isSaving ||
                        isLoadingPublicPositions ||
                        !positionOptions.length
                      }
                      positions={positionOptions}
                      placeholder={
                        isLoadingPublicPositions
                          ? "Loading approved active positions..."
                          : positionOptions.length
                            ? "Select open position"
                            : "No approved active positions found"
                      }
                      onChange={handleOpenPositionChange}
                      onOpenJobDescription={handleOpenPositionJobDescription}
                    />
                    <p className="mt-2 text-xs font-semibold text-[#667085]">
                      Only approved and active available positions are shown. Use the icon at the right to open the linked job description.
                    </p>
                  </div>

                  <TextField
                    label="Nickname"
                    value={candidateForm.nickname}
                    onChange={(event) =>
                      updateField("nickname", event.target.value)
                    }
                    placeholder="Preferred nickname"
                  />

                  <div>
                    <FieldLabel>
                      Which location are you applying for? <RequiredMark />
                    </FieldLabel>
                    <LocationPortalDropdown
                      required
                      value={candidateForm.applyingLocation}
                      options={safeFormOptions.locations}
                      placeholder="Select location"
                      onChange={(value) => updateField("applyingLocation", value)}
                    />
                  </div>

                  {hasEmployeeReferralProgram && (
                    <>
                      <TextField
                        label="Who referred you to us?"
                        value={candidateForm.referredBy}
                        onChange={(event) =>
                          updateField("referredBy", event.target.value)
                        }
                        placeholder="Referrer name"
                        required
                      />

                      <TextField
                        label="Referral SiBS ID"
                        value={candidateForm.employeeId}
                        onChange={(event) =>
                          updateField("employeeId", event.target.value)
                        }
                        placeholder="Referrer SiBS ID"
                        required
                      />
                    </>
                  )}
                </div>

                {!positionOptions.length && (
                  <p className="mt-1 text-xs font-bold text-amber-700">
                    No approved active positions found from the database.
                  </p>
                )}

                {selectedPosition && (
                  <div className="rounded-[12px] border border-[#DCE6F1] bg-[#F8FAFC] p-4 sm:p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                          Selected Position Details
                        </p>
                        <p className="mt-1 text-sm font-semibold text-sibs-primary-1/80">
                          These details are loaded from Available Positions.
                        </p>
                      </div>

                      {selectedPosition.status && (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
                          {selectedPosition.status}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <PositionInfoItem
                        label="Position"
                        value={selectedPosition.positionTitle}
                      />
                      <PositionInfoItem
                        label="Department"
                        value={selectedPosition.department}
                      />
                      <PositionInfoItem
                        label="Account"
                        value={selectedPosition.accountName}
                      />
                      <PositionInfoItem
                        label="Account GHL Name"
                        value={selectedPosition.accountGhlName}
                      />
                      <PositionInfoItem
                        label="Location / Site"
                        value={selectedPosition.locationSite}
                      />
                      <PositionInfoItem
                        label="Position ID"
                        value={selectedPosition.positionId}
                      />
                    </div>
                  </div>
                )}

                  </>
                ) : (
                  <div className="rounded-xl border border-[#DCE6F1] bg-[#F8FAFC] px-4 py-3 text-xs font-semibold leading-5 text-[#667085]">
                    {!hasReferralCode
                      ? "Select Yes or No above to continue with the candidate profile."
                      : referralLookupStatus === "checking"
                        ? "Checking the referral code. The candidate fields will open after the code is matched."
                        : "Enter a valid 10-character referral code and wait for the matched confirmation to continue."}
                  </div>
                )}              </div>
            </SectionCard>

            {shouldShowApplicationFields ? (
              <>
            <SectionCard
              number={2}
              icon={UserPlus}
              title="Personal Information"
              description="Enter the applicant legal name, contact details, and address."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <TextField
                  label="First Name"
                  value={candidateForm.firstName}
                  onChange={(event) =>
                    updateField("firstName", event.target.value)
                  }
                  placeholder="Enter first name"
                  required
                  hasError={hasDuplicateApplicantName}
                />

                <TextField
                  label="Middle Name"
                  value={candidateForm.middleName}
                  onChange={(event) =>
                    updateField("middleName", event.target.value)
                  }
                  placeholder="Enter middle name"
                  required
                  hasError={hasDuplicateApplicantName}
                />

                <TextField
                  label="Last Name"
                  value={candidateForm.lastName}
                  onChange={(event) =>
                    updateField("lastName", event.target.value)
                  }
                  placeholder="Enter last name"
                  required
                  hasError={hasDuplicateApplicantName}
                />

                <TextField
                  label="Suffix"
                  value={candidateForm.suffix}
                  onChange={(event) => updateField("suffix", event.target.value)}
                  placeholder="Jr., Sr., III"
                />

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
                    Complete First Name, Middle Name, and Last Name to unlock the fields below.
                  </div>
                ) : null}

                <fieldset
                  data-testid="applicant-name-dependent-fields"
                  disabled={isApplicantNameGateLocked}
                  className="contents"
                >
                  <div>
                    <FieldLabel>
                      Date of Birth <RequiredMark />
                    </FieldLabel>
                    <CalendarDatePicker
                      required
                      value={candidateForm.dateOfBirth}
                      onChange={(value) => updateField("dateOfBirth", value)}
                      placeholder="Select date"
                    />
                  </div>

                  <TextField
                    label="Email"
                    type="email"
                    value={candidateForm.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="Enter email"
                    required
                    uppercase={false}
                  />

                  <TextField
                    label="Phone 1"
                    value={candidateForm.phoneNumber1}
                    onChange={(event) =>
                      updateField("phoneNumber1", event.target.value)
                    }
                    placeholder="09xxxxxxxxx"
                  />

                  <TextField
                    label="Phone 2"
                    value={candidateForm.phoneNumber2}
                    onChange={(event) =>
                      updateField("phoneNumber2", event.target.value)
                    }
                    placeholder="Optional"
                  />

                  <div className="md:col-span-4">
                    <FieldLabel>
                      Physical Address <RequiredMark />
                    </FieldLabel>
                    <AutoResizeTextarea
                      required
                      value={candidateForm.physicalAddress || ""}
                      onChange={(event) =>
                        updateField("physicalAddress", event.target.value)
                      }
                      placeholder="Complete physical address"
                      className={textareaInputClass("min-h-11 leading-6")}
                    />
                  </div>
                </fieldset>
              </div>
            </SectionCard>

            <fieldset
              disabled={isApplicantNameGateLocked}
              className={`space-y-6 ${isApplicantNameGateLocked ? "opacity-60" : ""}`}
            >
            <SectionCard
              number={3}
              icon={BriefcaseBusiness}
              title="Work Experience"
              description="Additional work experience fields will appear when Has work Experience is selected."
            >
              <div className="space-y-4">
                <div>
                  <FieldLabel>
                    Work experience <RequiredMark />
                  </FieldLabel>
                  <DatabaseSelect
                    required
                    value={candidateForm.workExperience}
                    options={safeFormOptions.workExperience}
                    placeholder="Select work experience"
                    onChange={handleWorkExperienceChange}
                    zIndex="z-[180]"
                  />
                </div>

                {hasRelevantExperience && (
                  <div className="space-y-4">
                    <ExperienceFields
                      index={0}
                      title="Industry or Relevant Experience"
                      experience={workExperiences[0]}
                      onChange={updateExperience}
                      lengthOptions={safeFormOptions.lengthOfExperience}
                    />

                    <WorkReadinessQuestion
                      question="Do you have other experience?"
                      name="has-other-experience-modal"
                      required={false}
                      value={hasOtherExperience ? "Yes" : "No"}
                      options={safeFormOptions.yesNo}
                      onChange={handleOtherExperienceAnswer}
                    />

                    {hasOtherExperience &&
                      workExperiences.slice(1).map((experience, itemIndex) => {
                        const actualIndex = itemIndex + 1;

                        return (
                          <ExperienceFields
                            key={experience.id || actualIndex}
                            index={actualIndex}
                            title={`Other Experience ${itemIndex + 1}`}
                            experience={experience}
                            onChange={updateExperience}
                            lengthOptions={safeFormOptions.lengthOfExperience}
                            showRemove
                            onRemove={() => removeExperience(actualIndex)}
                          />
                        );
                      })}

                    {hasOtherExperience && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={addOtherExperience}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[var(--sibs-primary-1)] px-4 text-xs font-extrabold text-white shadow-sm transition hover:opacity-90"
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
              number={4}
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
                      value={selectedEducationalAttainment}
                      options={safeFormOptions.educationalAttainment}
                      placeholder="Select educational attainment"
                      onChange={handleEducationalAttainmentChange}
                      zIndex="z-[170]"
                    />
                  </div>

                  <EducationDetailsFields
                    attainment={selectedEducationalAttainment}
                    details={candidateEducationDetails}
                    onChange={updateEducationDetails}
                  />

                  <div>
                    <FieldLabel>Affiliations and Certifications</FieldLabel>
                    <MultiCheckGroup
                      options={safeFormOptions.affiliationCertification}
                      value={candidateForm.affiliations}
                      onChange={(value) => updateField("affiliations", value)}
                    />
                  </div>

                  <div>
                    <FieldLabel>Training Attended</FieldLabel>
                    <div className="space-y-2">
                      {ensureTrainingEntryRows(
                        candidateForm.trainingAttended,
                      ).map((training, index) => (
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
                          ensureTrainingEntryRows(
                            candidateForm.trainingAttended,
                          ).length -
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
                            ensureTrainingEntryRows(
                              candidateForm.trainingAttended,
                            ).length,
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
                      ))}
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            <SectionCard
              number={5}
              icon={ShieldCheck}
              title="Work Readiness Questions"
              description="These questions help Talent Acquisition review work setup and compliance readiness."
            >
              <div className="space-y-3">
                <WorkReadinessQuestion
                  question="Are you fully vaccinated?"
                  name="candidate-fully-vaccinated"
                  value={candidateForm.fullyVaccinated}
                  options={safeFormOptions.yesNo}
                  onChange={(value) => updateField("fullyVaccinated", value)}
                />

                <WorkReadinessQuestion
                  question="Are you comfortable working on site?"
                  name="candidate-comfortable-on-site"
                  value={candidateForm.comfortableOnSite}
                  options={safeFormOptions.yesNo}
                  onChange={(value) => updateField("comfortableOnSite", value)}
                />

                <WorkReadinessQuestion
                  question="Are you willing to work in graveyard shift?"
                  name="candidate-willing-graveyard"
                  value={candidateForm.willingGraveyard}
                  options={safeFormOptions.yesNo}
                  onChange={(value) => updateField("willingGraveyard", value)}
                />

                <WorkReadinessQuestion
                  question="Full-time, part-time, or either?"
                  name="candidate-employment-interest"
                  value={candidateForm.employmentInterest}
                  options={safeFormOptions.employmentInterest}
                  onChange={(value) => updateField("employmentInterest", value)}
                  optionClassName="min-w-[104px]"
                />

                <WorkReadinessQuestion
                  question="If this is a remote position, do you have access to a computer, Internet connection, and a private space to work remotely?"
                  name="candidate-remote-work-access"
                  value={candidateForm.remoteWorkAccess}
                  options={safeFormOptions.yesNo}
                  onChange={(value) => updateField("remoteWorkAccess", value)}
                />

                <WorkReadinessQuestion
                  question="Are you willing to undertake a drug test as part of this hiring process?"
                  name="candidate-willing-drug-test"
                  value={candidateForm.willingDrugTest}
                  options={safeFormOptions.yesNo}
                  onChange={(value) => updateField("willingDrugTest", value)}
                />

                <WorkReadinessQuestion
                  question="Are you willing to allow SiBS to undergo a background check as part of this hiring process?"
                  name="candidate-background-check"
                  value={candidateForm.willingBackgroundCheck}
                  options={safeFormOptions.yesNo}
                  onChange={(value) => updateField("willingBackgroundCheck", value)}
                />
              </div>
            </SectionCard>

            <SectionCard
              number={6}
              icon={Users}
              title="Character References"
              description="Provide three people who can confirm the candidate employment, education, or character background."
            >
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                {references.map((reference, index) => (
                  <div
                    key={`reference-${index}`}
                    className="rounded-[12px] border border-[#DCE6F1] bg-[#F8FAFC] p-4"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-[#FFF0EB] text-[10px] font-extrabold text-[#FF5C28]">
                        {index + 1}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase tracking-normal text-[#042C51]">
                        Reference {index + 1}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <TextField
                        label="Full Name"
                        value={reference.name}
                        onChange={(event) =>
                          updateReference(index, "name", event.target.value)
                        }
                        placeholder="Reference name"
                        required
                      />

                      <TextField
                        label="Phone Number"
                        type="tel"
                        value={reference.phone}
                        onChange={(event) =>
                          updateReference(index, "phone", event.target.value)
                        }
                        placeholder="09xxxxxxxxx"
                        inputMode="numeric"
                        maxLength={11}
                        pattern="09[0-9]{9}"
                        title="Enter an 11-digit phone number starting with 09"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Remarks"
              description="Optional internal notes, screening observations, or other details."
            >
              <textarea
                rows={4}
                value={candidateForm.remarks || ""}
                onChange={(event) => updateField("remarks", event.target.value)}
                className={textareaInputClass()}
                placeholder="Candidate notes, screening observations, or other details."
              />
            </SectionCard>
            </fieldset>
              </>
            ) : null}
              </>
            ) : (
              <>
            <div ref={questionsSectionRef}>
              <SectionCard
                number={7}
                icon={BriefcaseBusiness}
                title="Position Questions"
                description={`Answer the text questions configured for ${candidateForm.openPosition || "the selected position"}.`}
              >
                <div className="space-y-4">
                  {applicationQuestionsError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                      {applicationQuestionsError}
                    </div>
                  ) : null}

                  {applicationForm?.formName ? (
                    <div className="rounded-xl border border-[#DCE6F1] bg-[#F8FAFC] px-4 py-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                        Application Form
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-[#042C51]">
                        {applicationForm.formName}
                      </p>
                    </div>
                  ) : null}

                  {applicationQuestions.length ? (
                    <div className="space-y-4">
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
                            className="rounded-2xl border border-[#DCE6F1] bg-[#F8FAFC] p-4 sm:p-5"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF0EB] text-[10px] font-extrabold text-[#FF5C28]">
                                  {index + 1}
                                </span>
                                {question.isRequired ? (
                                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-red-600">
                                    Required
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
                                    Optional
                                  </span>
                                )}
                              </div>
                              <p className="mt-3 text-sm font-extrabold leading-6 text-[#042C51]">
                                {question.questionText}
                              </p>
                              {question.helperText ? (
                                <p className="mt-1 text-xs font-semibold leading-5 text-[#667085]">
                                  {question.helperText}
                                </p>
                              ) : null}
                            </div>

                            <div className="mt-4">
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
                                  className={textareaInputClass("min-h-[110px] leading-6")}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold leading-6 text-emerald-800">
                      No additional application questions are configured for this position. You can continue with the uploads and consent below.
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>

            <div ref={fileSectionRef}>
            <SectionCard
              number={8}
              icon={Mic}
              title="Audio and File Upload"
              description="Upload a single audio file and one supporting document/file."
            >
              <div className="space-y-5">
                <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-xs font-bold leading-6 text-amber-800 sm:text-sm">
                  <p className="font-extrabold">
                    The audio file may answer these questions:
                  </p>

                  {safeFormOptions.audioQuestions.length > 0 ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {safeFormOptions.audioQuestions.map((question) => (
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

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <FieldLabel>Upload single audio file <RequiredMark /></FieldLabel>
                    <label
                      className={`flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-[12px] border border-dashed px-5 py-8 text-center transition hover:border-[#FF5C28] hover:bg-[#FFF9F6] ${
                        audioFileName
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-[#DCE6F1] bg-[#F8FAFC]"
                      }`}
                    >
                      <Mic
                        size={26}
                        className={
                          audioFileName ? "text-emerald-700" : "text-sibs-primary-1"
                        }
                      />
                      <p className="mt-2 max-w-full truncate text-sm font-extrabold text-[#042C51]">
                        {audioFileName || "Choose audio file"}
                      </p>
                      {audioFileName && (
                        <p className="mt-1 text-xs font-bold text-emerald-700">
                          Audio selected
                          {audioFileSize ? ` • ${audioFileSize}` : ""}
                        </p>
                      )}
                      <p className="mt-1 text-xs font-semibold text-[#667085]">
                        Accepted: MP3, WAV, M4A, AAC, OGG, WEBM, MP4, FLAC,
                        AMR, 3GP, OPUS, AIFF, CAF, WMA
                      </p>
                      <input
                        type="file"
                        accept={acceptedAudioTypes}
                        className="hidden"
                        onChange={(event) =>
                          handleCandidateFileChange(
                            event,
                            "audio",
                            candidateForm,
                            setCandidateForm,
                          )
                        }
                      />
                    </label>
                  </div>

                  <div>
                    <FieldLabel>Upload supporting file <RequiredMark /></FieldLabel>
                    <label
                      className={`flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-[12px] border border-dashed px-5 py-8 text-center transition hover:border-[#FF5C28] hover:bg-[#FFF9F6] ${
                        attachmentFileName
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-[#DCE6F1] bg-[#F8FAFC]"
                      }`}
                    >
                      <UploadCloud
                        size={26}
                        className={
                          attachmentFileName
                            ? "text-emerald-700"
                            : "text-sibs-primary-1"
                        }
                      />
                      <p className="mt-2 max-w-full truncate text-sm font-extrabold text-[#042C51]">
                        {attachmentFileName || "Choose file"}
                      </p>
                      {attachmentFileName && (
                        <p className="mt-1 text-xs font-bold text-emerald-700">
                          File selected
                          {attachmentFileSize ? ` • ${attachmentFileSize}` : ""}
                        </p>
                      )}
                      <p className="mt-1 text-xs font-semibold text-[#667085]">
                        PDF, DOC/DOCX, XLS/CSV, JPG/JPEG, PNG, GIF
                      </p>
                      <input
                        type="file"
                        accept={acceptedDocumentTypes}
                        className="hidden"
                        onChange={(event) =>
                          handleCandidateFileChange(
                            event,
                            "attachment",
                            candidateForm,
                            setCandidateForm,
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>
            </SectionCard>

            </div>

            <div ref={consentRef}>
            <SectionCard
              number={9}
              icon={ShieldCheck}
              title="Terms and Privacy Consent"
              description="Confirm the candidate consent required for recruitment processing."
              meta="Privacy and Compliance"
            >
              <label
                className={`group flex cursor-pointer items-start gap-3 rounded-[10px] border p-3.5 transition ${
                  candidateForm.consent
                    ? "border-[#FF5C28] bg-[#FFF0EB]"
                    : "border-[#DCE6F1] bg-[#F8FAFC] hover:border-[#FF5C28]/40 hover:bg-[#FFF9F6]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(candidateForm.consent)}
                  onChange={(event) =>
                    updateField("consent", event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#FF5C28]"
                />

                <span className="text-xs font-semibold leading-5 text-[#667085]">
                  I agree to terms & conditions provided by the company. By
                  providing the candidate phone number, I confirm that the
                  candidate agreed to the collection and use of these details for
                  recruitment processing.
                </span>
              </label>
            </SectionCard>
            </div>
              </>
            )}
          </form>

          <div className="shrink-0 border-t border-sibs-border bg-white px-4 py-2.5 2xl:px-6 2xl:py-3.5">
            <div className="flex flex-col justify-end gap-2 sm:flex-row">
              {currentPage === 2 ? (
                <button
                  type="button"
                  onClick={handlePreviousPage}
                  disabled={isSaving}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 2xl:gap-2 rounded-lg border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-navy transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-orange/40 hover:bg-sibs-cream-subtle hover:text-sibs-orange hover:shadow-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft size={15} />
                  Back
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleResetCandidate}
                disabled={isSaving}
                className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 2xl:gap-2 rounded-lg border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-navy transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-orange/40 hover:bg-sibs-cream-subtle hover:text-sibs-orange hover:shadow-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={15} />
                Reset
              </button>

              {shouldShowApplicationFields ? (
              <button
                type="submit"
                form="add-candidate-form"
                disabled={isSaving || isLoadingApplicationQuestions || isApplicantNameGateLocked}
                className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 2xl:gap-2 rounded-lg bg-sibs-orange px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:bg-sibs-orange/90 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving || isLoadingApplicationQuestions ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : currentPage === 1 ? (
                  <ChevronRight size={15} />
                ) : (
                  <Save size={15} />
                )}
                {isSaving
                  ? "Saving..."
                  : isLoadingApplicationQuestions
                    ? "Loading Questions..."
                    : currentPage === 1
                      ? "Next"
                      : "Save Candidate"}
              </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        variant="center"
        onClose={closeStatusModal}
        lockScroll
      />
    </>
  );
}
