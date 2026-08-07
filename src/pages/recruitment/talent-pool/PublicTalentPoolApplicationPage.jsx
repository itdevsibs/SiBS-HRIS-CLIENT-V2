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
} from "lucide-react";
import StatusModal from "@/components/modals/StatusModal";
import {
  getTalentPoolFormOptions,
  submitPublicTalentPoolApplication,
} from "@/lib/axios/publicTalentPool";
import { getPublicApprovedJobDescriptions } from "@/lib/axios/getPublicJobDescription";
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

  return `h-10 w-full rounded-[10px] border border-[#D7DEE8] bg-[#F8FAFC] px-3 text-xs font-semibold ${
    shouldUppercase ? "uppercase" : "normal-case"
  } text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:border-[#D7DEE8] disabled:bg-[#F2F4F7] disabled:text-[#667085] ${extra}`;
}

function textareaClass(extra = "") {
  return `w-full resize-none rounded-[10px] border border-[#D7DEE8] bg-[#F8FAFC] px-3 py-2.5 text-xs font-semibold uppercase text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:border-[#D7DEE8] disabled:bg-[#F2F4F7] disabled:text-[#667085] ${extra}`;
}

function AutoResizeTextarea({
  value,
  onChange,
  minHeight = 44,
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

function getPositionKey(position = {}) {
  return String(
    position.id ||
      position.jdId ||
      position.jd_id ||
      position.positionId ||
      position.position_id ||
      position.positionTitle ||
      position.position_title ||
      "",
  );
}

function normalizeJobTitleForMatch(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getJobDescriptionId(jobDescription = {}) {
  return (
    jobDescription.rawId ||
    jobDescription.raw_id ||
    jobDescription.jdId ||
    jobDescription.jd_id ||
    jobDescription.id ||
    jobDescription.raw?.id ||
    ""
  );
}

function normalizeApprovedJobDescriptionPosition(jobDescription = {}) {
  const jdId = getJobDescriptionId(jobDescription);

  const positionTitle = cleanText(
    jobDescription.roleTitle ||
      jobDescription.role_title ||
      jobDescription.documentTitle ||
      jobDescription.document_title ||
      jobDescription.title ||
      jobDescription.raw?.roleTitle ||
      jobDescription.raw?.role_title ||
      jobDescription.raw?.documentTitle ||
      jobDescription.raw?.document_title,
  );

  const documentTitle = cleanText(
    jobDescription.documentTitle ||
      jobDescription.document_title ||
      jobDescription.raw?.documentTitle ||
      jobDescription.raw?.document_title ||
      positionTitle,
  );

  return {
    id: jdId || positionTitle,
    positionId: jdId,
    positionTitle,
    jdId,
    jdCode: cleanText(
      jobDescription.jdCode ||
        jobDescription.jd_code ||
        jobDescription.raw?.jdCode ||
        jobDescription.raw?.jd_code,
    ),
    documentTitle,
    department: cleanText(
      jobDescription.department ||
        jobDescription.departmentName ||
        jobDescription.department_name ||
        jobDescription.raw?.department ||
        jobDescription.raw?.departmentName ||
        jobDescription.raw?.department_name,
    ),
    locationSite: cleanText(
      jobDescription.locationSite ||
        jobDescription.location_site ||
        jobDescription.location ||
        jobDescription.raw?.locationSite ||
        jobDescription.raw?.location_site ||
        jobDescription.raw?.location,
    ),
    status: "Approved",
  };
}

function buildApprovedPositionOptions(jobDescriptions = []) {
  const seenTitles = new Set();

  return toArray(jobDescriptions)
    .map(normalizeApprovedJobDescriptionPosition)
    .filter((position) => position.positionTitle && position.jdId)
    .filter((position) => {
      const titleKey = normalizeJobTitleForMatch(position.positionTitle);

      if (!titleKey || seenTitles.has(titleKey)) {
        return false;
      }

      seenTitles.add(titleKey);
      return true;
    })
    .sort((firstPosition, secondPosition) =>
      firstPosition.positionTitle.localeCompare(
        secondPosition.positionTitle,
        undefined,
        {
          sensitivity: "base",
        },
      ),
    );
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

function PublicSibsLogo() {
  return (
    <div className="flex min-w-0 select-none items-center gap-3">
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#FF5C28] shadow-[0_10px_24px_rgba(255,92,40,0.22)]">
        <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-[#042C51] bg-white" />
        <span className="relative text-[20px] font-semibold leading-none tracking-[-0.04em] text-white">
          S
        </span>
      </div>

      <div className="min-w-0 leading-none">
        <div className="flex min-w-0 items-baseline whitespace-nowrap">
          <span className="text-[22px] font-semibold tracking-[-0.035em] text-white">
            SiBS&nbsp;
          </span>
          <span className="text-[22px] font-semibold tracking-[-0.035em] text-[#FF5C28]">
            HRIS
          </span>
        </div>

        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-300/80">
          Human Resource System
        </p>
      </div>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  step,
  totalSteps = 8,
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

        {step ? (
          <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-[#DCE6F1] bg-[#F8FAFC] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
            Step {step} of {totalSteps}
          </span>
        ) : null}
      </div>

      <div className="p-5 sm:p-6">{children}</div>
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

      {required && (
        <input
          tabIndex={-1}
          value={value || ""}
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
    (position) =>
      String(position?.positionTitle || position?.position_title || "") ===
      String(value || ""),
  );

  const displayText =
    selectedPosition?.positionTitle ||
    selectedPosition?.position_title ||
    placeholder;

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
    const positionTitle = cleanText(
      position?.positionTitle || position?.position_title,
    );

    if (!positionTitle) return;

    onChange(positionTitle);
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
                    const positionTitle = cleanText(
                      position?.positionTitle || position?.position_title,
                    );

                    const active =
                      String(positionTitle) === String(value || "");

                    const positionKey =
                      getPositionKey(position) || positionTitle;

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
                            {positionTitle}
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
                    No approved positions found.
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
        className={`flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-[10px] border bg-white px-3 text-left text-xs font-extrabold outline-none transition ${
          open
            ? "border-[#FF5C28] ring-4 ring-[#FF5C28]/10"
            : "border-[#DCE6F1] hover:border-[#FF5C28]/40"
        } text-sibs-primary-1`}
      >
        <span className="min-w-0 flex-1 truncate">{displayText}</span>

        <ChevronDown
          size={14}
          className={`shrink-0 text-[#FF5C28] transition-transform duration-200 ${
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
                      ? "bg-[#FFF0EB] text-[#FF5C28]"
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

  useEffect(() => {
    if (!open || !calendarRef.current) return;

    function updatePanelPosition() {
      const rect = calendarRef.current.getBoundingClientRect();
      const panelWidth = 340;
      const gutter = 12;
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
    if (!open && selectedDate) {
      setDisplayDate(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
      );
    }

    setOpen((previous) => !previous);
  }

  return (
    <div ref={calendarRef} className="relative z-[220] min-w-0">
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggleOpen}
        className={`flex h-10 w-full min-w-0 items-center justify-between gap-3 rounded-[10px] border bg-[#F8FAFC] px-3 text-left text-xs font-semibold outline-none transition ${
          open
            ? "border-[#FF5C28] ring-4 ring-[#FF5C28]/10"
            : hasError
              ? "border-red-300 hover:border-red-500"
              : "border-[#DCE6F1] hover:border-[#FF5C28]/40"
        } ${
          disabled
            ? "cursor-not-allowed bg-gray-50 text-gray-400 opacity-70"
            : "text-[#042C51]"
        }`}
      >
        <span className="inline-flex min-w-0 flex-1 items-center gap-2 truncate">
          <CalendarDays
            size={16}
            className="shrink-0 text-[var(--sibs-primary-1)]"
          />

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
          className={`shrink-0 text-[#FF5C28] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled
        ? createPortal(
            <div
              ref={calendarPanelRef}
              className="fixed z-[100000] overflow-visible rounded-2xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]"
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
        className={`flex h-10 w-full min-w-0 items-center gap-3 rounded-[10px] border bg-[#F8FAFC] px-3 text-xs font-semibold outline-none transition ${
          open
            ? "border-[#FF5C28] ring-4 ring-[#FF5C28]/10"
            : "border-[#DCE6F1] hover:border-[#FF5C28]/40"
        }`}
      >
        <Search size={17} className="shrink-0 text-[var(--sibs-primary-1)]" />

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
          className={`h-full min-w-0 flex-1 border-0 bg-transparent text-xs font-semibold outline-none placeholder:text-[#98A2B3] ${
            selectedOption && !open ? "text-[#042C51]" : "text-[#344054]"
          }`}
        />

        <button
          type="button"
          onClick={handleToggle}
          aria-label={
            open ? "Close school year options" : "Open school year options"
          }
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
            {section.schoolNameLabel || `${section.title} Name`}{" "}
            <RequiredMark />
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
    <div className="space-y-4 rounded-[12px] border border-[#DCE6F1] bg-[#F8FAFC] p-4 sm:p-5">
      <div>
        <h4 className="text-sm font-extrabold text-[#042C51]">
          Required Education Details
        </h4>
        <p className="mt-1 text-sm font-semibold leading-6 text-[#667085]">
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
                  <label className="group flex cursor-pointer items-start gap-3 rounded-[10px] border border-[#DCE6F1] bg-white p-3.5 transition hover:border-[#FF5C28]/40 hover:bg-[#FFF9F6]">
                    <input
                      type="checkbox"
                      checked={educationDetails.attendedSeniorHighSchool}
                      onChange={(event) =>
                        handleSeniorHighAttendanceChange(event.target.checked)
                      }
                      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-[#98A2B3] accent-[#FF5C28]"
                    />
                    <span>
                      <span className="block text-[13px] font-extrabold text-[#042C51] transition group-hover:text-[#FF5C28]">
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
    <div className="grid grid-cols-1 gap-2 rounded-[12px] border border-[#DCE6F1] bg-[#F8FAFC] p-3 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((option) => {
        const optionValue = getOptionValue(option);
        const optionLabel = getOptionLabel(option);
        const checked = values.includes(optionValue);

        return (
          <label
            key={option?.id || optionValue}
            className={`group flex cursor-pointer items-start gap-2.5 rounded-[10px] border px-3 py-2.5 text-xs transition ${
              checked
                ? "border-[#FF5C28] bg-[#FFF0EB] font-extrabold text-[#042C51] shadow-sm"
                : "border-[#DCE6F1] bg-white font-bold text-[#344054] hover:border-[#FF5C28]/40 hover:bg-[#FFF9F6] hover:text-[#FF5C28]"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggleValue(optionValue)}
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
    <div className="rounded-[12px] border border-[#DCE6F1] bg-[#F8FAFC] p-4 sm:p-5">
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
  const consentRef = useRef(null);

  const [form, setForm] = useState(createEmptyPublicForm);
  const [submittedRecord, setSubmittedRecord] = useState(null);
  const [activePositionOptions, setActivePositionOptions] = useState([]);
  const [formOptions, setFormOptions] = useState(defaultFormOptions);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
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
  const selectedAttachmentFile =
    attachmentFileRef.current || form.attachmentFile;

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
    let isMounted = true;

    async function loadDatabaseData() {
      setIsLoadingData(true);
      setLoadError("");

      try {
        const [optionsResponse, approvedJobDescriptionsResponse] =
          await Promise.all([
            getTalentPoolFormOptions(),
            getPublicApprovedJobDescriptions({
              page: 1,
              limit: 500,
              search: "",
            }),
          ]);

        if (!isMounted) return;

        if (!optionsResponse?.success) {
          throw new Error(
            optionsResponse?.message || "Failed to load form options.",
          );
        }

        if (!approvedJobDescriptionsResponse?.success) {
          throw new Error(
            approvedJobDescriptionsResponse?.message ||
              "Failed to load approved job descriptions.",
          );
        }

        setFormOptions(normalizeOptionsPayload(optionsResponse?.data));

        const approvedJobDescriptions = Array.isArray(
          approvedJobDescriptionsResponse?.data,
        )
          ? approvedJobDescriptionsResponse.data
          : [];

        setActivePositionOptions(
          buildApprovedPositionOptions(approvedJobDescriptions),
        );
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

  const hasEmployeeReferralProgram = useMemo(
    () =>
      isEmployeeReferralProgramSelected(
        form.hearAboutUs,
        formOptions.hearAboutUs,
      ),
    [form.hearAboutUs, formOptions.hearAboutUs],
  );

  const completionPercentage = useMemo(() => {
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
      Boolean(form.reference1Name.trim() && form.reference1Phone.trim()),
      Boolean(form.reference2Name.trim() && form.reference2Phone.trim()),
      Boolean(form.reference3Name.trim() && form.reference3Phone.trim()),
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
  ]);

  const canSubmit = useMemo(() => {
    if (isLoadingData) return false;
    if (isSubmitting) return false;
    if (loadError) return false;
    return true;
  }, [isLoadingData, isSubmitting, loadError]);

  function showStatusModal({ type = "success", title = "", message = "" }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });
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
        title: "No approved positions",
        message: "No approved public job descriptions are available.",
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
      phone1: normalizePhoneNumberForSubmit(form.phone1),
      phone2: normalizePhoneNumberForSubmit(form.phone2),
      reference1Phone: normalizePhoneNumberForSubmit(form.reference1Phone),
      reference2Phone: normalizePhoneNumberForSubmit(form.reference2Phone),
      reference3Phone: normalizePhoneNumberForSubmit(form.reference3Phone),
      educationDetails: normalizeEducationDetails(form.educationDetails),
      trainingAttended: normalizeTrainingEntries(form.trainingAttended),
      otherExperiences: form.otherExperiences.map(normalizeExperienceValues),
      audioFile: audioFileRef.current || form.audioFile,
      attachmentFile: attachmentFileRef.current || form.attachmentFile,
    };

    try {
      const response = await submitPublicTalentPoolApplication(submitForm);

      if (!response?.success) {
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
    <div className="min-h-screen overflow-x-hidden bg-[#F4F7FB] font-jakarta text-[#101828]">
      <header className="sticky top-0 z-[500] border-b border-[#083A69] bg-[#042C51] text-white shadow-md">
        <div className="mx-auto flex w-full max-w-[1060px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <PublicSibsLogo />

            <div className="min-w-0 border-l border-white/10 pl-3">
              <span className="rounded-full border border-[#FF5C28]/40 bg-[#FF5C28]/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#FF8A63] sm:text-[10px]">
                Public Portal
              </span>
              <p className="mt-1.5 truncate text-[10px] font-semibold text-slate-300 sm:text-[11px]">
                Talent Pool Master Registration Form
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-[#021B33] px-3 py-2 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-sibs-pulse" />
            <span className="text-[10px] font-bold text-slate-300 sm:text-[11px]">
              Live Submissions Active
            </span>
          </div>
        </div>

        <div
          className="h-1.5 bg-[#02172C]"
          role="progressbar"
          aria-label="Form completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completionPercentage}
        >
          <div
            className="h-full bg-[#FF5C28] transition-[width] duration-500 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1060px] px-4 py-6 sm:px-6 sm:py-8">
        <section className="relative mb-6 overflow-hidden h-auto rounded-2xl border border-[#0A467E] bg-gradient-to-r from-[#042C51] via-[#073A6B] to-[#042C51] p-5 text-white shadow-lg sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#FF5C28]/15 blur-3xl" />

          <div className="relative z-10 h-full">
            <div className="min-w-0 h-full text-left">
              <img
                alt="SiBS Logo"
                className="mx-auto mb-5 block h-16 w-auto select-none md:h-20"
                src="/SiBS_Logo%20w%20Tagline-white.png"
                style={{
                  animation:
                    "2.8s ease-in-out 0s infinite normal none running sibsLogoGlow",
                }}
              />

              <span className="inline-flex items-center gap-2 rounded-full border border-[#FF5C28]/40 bg-[#FF5C28]/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#FF8A63]">
                <UserPlus size={13} />
                No Login Required • Direct Candidate Entry
              </span>

              <h2 className="mt-3 text-xl font-extrabold tracking-tight sm:text-2xl">
                Talent Pool Master Application
              </h2>

              <p className="mt-2 max-w-3xl text-xs font-semibold leading-6 text-slate-200 sm:max-w-[720px] sm:text-sm">
                Complete this form to submit your candidate profile directly to
                the SiBS HRIS Talent Pool for active and future recruitment
                opportunities. Fields marked with * are required.
              </p>
            </div>

            <div className="mt-4 w-full shrink-0 rounded-xl border border-white/10 bg-[#021930]/80 px-5 py-4 text-left backdrop-blur-sm sm:absolute sm:bottom-0 sm:right-0 sm:mt-0 sm:w-auto sm:min-w-[160px] sm:text-center">
              <p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-300">
                Form Completion
              </p>
              <p className="mt-1 text-2xl font-extrabold text-[#FF5C28]">
                {completionPercentage}%
              </p>
            </div>
          </div>
        </section>

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

        <form onSubmit={handleSubmit} className="space-y-6">
          {isLoadingData ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-[#174A7C] shadow-sm">
              Loading form options and approved job descriptions from the
              database...
            </div>
          ) : null}

          <SectionCard
            icon={BriefcaseBusiness}
            step={1}
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

                  <PositionJobDescriptionDropdown
                    value={form.openPosition}
                    disabled={isLoadingData || !activePositionOptions.length}
                    positions={activePositionOptions}
                    placeholder={
                      isLoadingData
                        ? "Loading positions..."
                        : activePositionOptions.length
                          ? "Select open position"
                          : "No approved positions found"
                    }
                    onChange={(value) => updateFormField("openPosition", value)}
                    onOpenJobDescription={handleOpenPositionJobDescription}
                  />

                  <p className="mt-2 text-xs font-semibold text-gray-500">
                    Use the button at the right of any position to open that
                    position's job description in a new tab.
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
                  value={form.firstName}
                  onChange={(e) => updateFormField("firstName", e.target.value)}
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
                  onChange={(e) => updateFormField("lastName", e.target.value)}
                  placeholder="Enter last name"
                  className={inputClass()}
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

              <div>
                <FieldLabel>
                  Date of Birth <RequiredMark />
                </FieldLabel>

                <CalendarDatePicker
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

                  <div className="rounded-[12px] border border-[#DCE6F1] bg-[#F8FAFC] p-4 sm:p-5">
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
                          className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[#FF5C28] px-4 text-sm font-extrabold text-white shadow-sm shadow-[#FF5C28]/15 transition hover:bg-[#E94F1F]"
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
                        value={reference.phone}
                        onChange={(event) =>
                          updateFormField(
                            reference.phoneField,
                            normalizePhoneNumberInput(event.target.value),
                          )
                        }
                        placeholder="Reference phone"
                        inputMode="numeric"
                        maxLength={11}
                        className={inputClass()}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div ref={fileSectionRef}>
            <SectionCard
              icon={Mic}
              step={7}
              title="Audio and File Upload"
              description="Upload a single audio file answering the listed questions and one supporting document/file."
            >
              <div className="space-y-5">
                <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-xs font-bold leading-6 text-amber-800 sm:text-sm">
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

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <FieldLabel>
                      Upload single audio file <RequiredMark />
                    </FieldLabel>
                    <label
                      className={`flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-[12px] border border-dashed px-5 py-8 text-center transition hover:border-[#FF5C28] hover:bg-[#FFF9F6] ${
                        highlightAudio && !selectedAudioFile
                          ? "border-red-300 bg-red-50 ring-4 ring-red-100"
                          : selectedAudioFile
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-[#DCE6F1] bg-[#F8FAFC]"
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
                      <p className="mt-2 max-w-full truncate text-sm font-extrabold text-[#042C51]">
                        {selectedAudioFile?.name || "Choose audio file"}
                      </p>
                      {selectedAudioFile && (
                        <p className="mt-1 text-xs font-bold text-emerald-700">
                          Audio selected • {formatFileSize(selectedAudioFile)}
                        </p>
                      )}
                      <p className="mt-1 text-xs font-semibold text-[#667085]">
                        Accepted: MP3, WAV, M4A, AAC, OGG, WEBM, MP4, FLAC, AMR,
                        3GP, OPUS, AIFF, CAF, WMA
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
                      className={`flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-[12px] border border-dashed px-5 py-8 text-center transition hover:border-[#FF5C28] hover:bg-[#FFF9F6] ${
                        highlightAttachment && !selectedAttachmentFile
                          ? "border-red-300 bg-red-50 ring-4 ring-red-100"
                          : selectedAttachmentFile
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-[#DCE6F1] bg-[#F8FAFC]"
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
                      <p className="mt-2 max-w-full truncate text-sm font-extrabold text-[#042C51]">
                        {selectedAttachmentFile?.name || "Choose file"}
                      </p>
                      {selectedAttachmentFile && (
                        <p className="mt-1 text-xs font-bold text-emerald-700">
                          File selected •{" "}
                          {formatFileSize(selectedAttachmentFile)}
                        </p>
                      )}
                      <p className="mt-1 text-xs font-semibold text-[#667085]">
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
              </div>
            </SectionCard>
          </div>

          <div ref={consentRef}>
            <SectionCard
              icon={ShieldCheck}
              step={8}
              title="Terms and Privacy Consent"
              description="Review the consent statement before submitting your candidate profile."
            >
              <label
                className={`group flex cursor-pointer items-start gap-3 rounded-[10px] border p-3.5 transition ${
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
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-[#98A2B3] accent-[#FF5C28]"
                />

                <span
                  className={`text-[13px] font-bold leading-6 transition ${
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
                <p className="mt-3 text-sm font-bold text-red-600">
                  Please check this consent box before submitting.
                </p>
              ) : null}
            </SectionCard>
          </div>

          <section className="flex flex-col gap-4 rounded-[12px] border border-[#DCE6F1] bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                Ready to submit
              </p>
              <p className="mt-1 text-sm font-extrabold text-[#042C51]">
                Your form is {completionPercentage}% complete.
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#667085]">
                Review your information and uploaded files before sending the
                application to Talent Acquisition.
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/50 hover:bg-[#FFF7F3] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={16} />
                Reset Form
              </button>

              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#FF5C28] px-5 text-sm font-extrabold text-white shadow-md shadow-[#FF5C28]/15 transition hover:-translate-y-0.5 hover:bg-[#E94F1F] hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <Send size={16} />
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </section>
        </form>
      </main>

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
