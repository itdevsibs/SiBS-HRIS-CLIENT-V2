import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileText,
  GitCompare,
  MessageSquareText,
  Plus,
  RotateCcw,
  Loader2,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useJobDescription } from "../../../services/context/JobDescriptionContext";
import { ModalShell, ConfirmModal, SelectDropdown, DatePicker, StatusBadge } from "../../ui";
import DocumentRecordInfoTable from "../../layout/tabs/JobDescriptionView/details/DocumentRecordInfoTable";
import { getJobDescriptionDropdowns } from "../../../lib/axios/getJobDescription";

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

const proficiencyOptions = ["Average", "Proficient", "Excellent"];

const PERSONALITY_TYPE_OPTIONS = [
  { code: "INTJ", label: "Architect" },
  { code: "INTP", label: "Logician" },
  { code: "ENTJ", label: "Commander" },
  { code: "ENTP", label: "Debater" },
  { code: "INFJ", label: "Advocate" },
  { code: "INFP", label: "Mediator" },
  { code: "ENFJ", label: "Protagonist" },
  { code: "ENFP", label: "Campaigner" },
  { code: "ISTJ", label: "Logistician" },
  { code: "ISFJ", label: "Defender" },
  { code: "ESTJ", label: "Executive" },
  { code: "ESFJ", label: "Consul" },
  { code: "ISTP", label: "Virtuoso" },
  { code: "ISFP", label: "Adventurer" },
  { code: "ESTP", label: "Entrepreneur" },
  { code: "ESFP", label: "Entertainer" },
];

const RECORD_FIELDS = [
  {
    key: "documentTitle",
    label: "Document Title",
    inputType: "text",
    aliases: ["documentTitle", "document_title", "title"],
  },
  {
    key: "roleTitle",
    label: "Position",
    inputType: "text",
    aliases: ["roleTitle", "role_title", "position"],
  },
  {
    key: "department",
    label: "Department",
    inputType: "text",
    aliases: ["department", "departmentName", "department_name"],
  },
  {
    key: "locationWorkSetup",
    label: "Location / Work Setup",
    inputType: "select",
    aliases: [
      "locationWorkSetup",
      "location_work_setup",
      "workSetup",
      "work_setup",
      "location",
      "site",
      "siteName",
      "site_name",
    ],
  },
  {
    key: "dateRequested",
    label: "Date Requested",
    inputType: "date",
    aliases: ["dateRequested", "date_requested"],
  },
  {
    key: "linkedHiringRequirement",
    label: "Linked Hiring Requirement",
    inputType: "text",
    aliases: [
      "linkedHiringRequirement",
      "linked_hiring_requirement",
      "existingJdId",
      "existing_jd_id",
    ],
  },
  {
    key: "preparedFor",
    label: "Prepared For",
    inputType: "text",
    aliases: [
      "preparedFor",
      "prepared_for",
      "account",
      "accountName",
      "account_name",
    ],
  },
  {
    key: "createdBy",
    label: "Created By",
    inputType: "text",
    aliases: [
      "createdBy",
      "created_by",
      "requestedBy",
      "requested_by",
      "requester",
    ],
  },
  // {
  //   key: "jdCode",
  //   label: "Document Code",
  //   inputType: "text",
  //   aliases: ["jdCode", "jd_code"],
  // },
  {
    key: "currentVersion",
    label: "Revision No.",
    inputType: "text",
    aliases: [
      "currentVersion",
      "current_version",
      "revisionNo",
      "revision_no",
      "version",
    ],
  },
  {
    key: "effectiveDate",
    label: "Effective Date",
    inputType: "date",
    aliases: [
      "effectiveDate",
      "effective_date",
      "effectivityDate",
      "effectivity_date",
    ],
  },
  {
    key: "lastUpdated",
    label: "Last Reviewed",
    inputType: "date",
    aliases: [
      "lastUpdated",
      "last_updated",
      "lastReviewed",
      "last_reviewed",
      "updatedAt",
      "updated_at",
    ],
  },
  {
    key: "reportsTo",
    label: "Reports To",
    inputType: "text",
    aliases: ["reportsTo", "reports_to"],
  },
  {
    key: "supervisory",
    label: "Supervisory",
    inputType: "text",
    aliases: ["supervisory"],
  },
];

const REVISION_SECTIONS = [
  {
    key: "recordInformation",
    label: "Record Information",
    helper: "Update document details requested by reviewers.",
    type: "record",
  },
  {
    key: "description",
    formKey: "description",
    label: "Position Overview",
    helper: "Update the position summary requested by reviewers.",
    type: "text",
  },
  {
    key: "responsibilities",
    formKey: "responsibilities",
    label: "Duties & Responsibilities",
    helper: "Update duties and responsibilities requested by reviewers.",
    type: "text",
  },
  {
    key: "qualifications",
    formKey: "qualifications",
    label: "Qualifications & Characteristics",
    helper: "Update qualifications and characteristics requested by reviewers.",
    type: "text",
  },
  {
    key: "education",
    formKey: "education",
    label: "Education",
    helper: "Update education requirements requested by reviewers.",
    type: "text",
  },
  {
    key: "experience",
    formKey: "experience",
    label: "Experience",
    helper: "Update experience requirements requested by reviewers.",
    type: "text",
  },
  {
    key: "certificationsAffiliations",
    formKey: "certificationsAffiliations",
    label: "Certifications and Affiliations",
    helper: "Update certifications and affiliations requested by reviewers.",
    type: "text",
  },
  {
    key: "personalityType",
    formKey: "personalityType",
    label: "Preferred Personality Type",
    helper: "Update the preferred personality type requested by reviewers.",
    type: "personalityPicker",
  },
  {
    key: "competencies",
    formKey: "competenciesText",
    label: "Desired Competencies",
    helper: "Update competency requirements requested by reviewers.",
    type: "competencyTable",
  },
];

function getRecordDraftFieldStackClass(fieldKey = "") {
  if (fieldKey === "documentTitle") return "relative z-[100]";
  if (fieldKey === "roleTitle") return "relative z-[90]";
  if (fieldKey === "preparedFor") return "relative z-[90]";
  if (fieldKey === "department") return "relative z-[80]";
  if (fieldKey === "effectiveDate") return "relative z-[70]";
  if (fieldKey === "linkedHiringRequirement") return "relative z-[60]";
  if (fieldKey === "reportsTo") return "relative z-[60]";
  if (fieldKey === "supervisory") return "relative z-[10]";

  return "relative z-[10]";
}

const REVISION_FIELD_LABEL_CLASS =
  "mb-1.5 block text-xs font-bold text-sibs-navy";

const REVISION_INPUT_CLASS =
  "h-11 w-full rounded-[10px] border border-sibs-border-subtle bg-white px-3.5 text-sm font-medium text-sibs-navy outline-none transition focus:border-sibs-orange focus:ring-2 focus:ring-sibs-orange/10";

const REVISION_TEXTAREA_CLASS =
  "min-h-[260px] flex-1 resize-none rounded-[10px] border border-sibs-border bg-white px-4 py-3 text-sm font-medium leading-7 text-sibs-navy outline-none transition placeholder:text-sibs-muted focus:border-sibs-navy focus:ring-2 focus:ring-blue-100";

const REVISION_DISPLAY_VALUE_CLASS =
  "mt-2 block max-w-full overflow-x-auto whitespace-nowrap pb-1 text-sm font-bold leading-6 text-sibs-text-secondary [scrollbar-width:thin]";

const RECORD_DRAFT_FIELD_ORDER = [
  "documentTitle",
  "roleTitle",
  "preparedFor",
  "department",
  "locationWorkSetup",
  "effectiveDate",
  "linkedHiringRequirement",
  "jdCode",
  "reportsTo",
  "supervisory",
];

const RECORD_DATE_FIELD_KEYS = new Set([
  "dateRequested",
  "effectiveDate",
  "lastUpdated",
]);

const REPORTS_TO_OPTIONS = [
  "Team Supervisor",
  "Operations Manager",
  "Senior Operations Manager",
  "Department Head",
  "HR Manager",
];

const REVISION_TEXT_FORM_KEYS = new Set(
  REVISION_SECTIONS.filter((section) => section.type === "text").map(
    (section) => section.formKey,
  ),
);

const LOCATION_WORK_SETUP_OPTIONS = [
  "Davao Site (On-Site)",
  "Tagum Site (On-Site)",
  "Mabini Site (On-Site)",
];

function getOrderedRecordFields() {
  return RECORD_DRAFT_FIELD_ORDER.map((fieldKey) =>
    RECORD_FIELDS.find((field) => field.key === fieldKey),
  ).filter(Boolean);
}

function getRecordDraftFieldClass(fieldKey = "") {
  if (fieldKey === "documentTitle") {
    return "sm:col-span-2";
  }

  return "";
}

function createCompetencyRow() {
  return {
    id:
      globalThis.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: "",
    description: "",
    level: "",
  };
}

function cleanText(value = "") {
  return String(value ?? "").trim();
}

function richTextToPlainText(value = "") {
  const source = String(value || "");

  if (!/<\/?[a-z][\s\S]*>/i.test(source)) {
    return source;
  }

  const sourceWithLineBreaks = source
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|li|h[1-6]|blockquote|tr)\s*>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "- ");

  let plainText = sourceWithLineBreaks.replace(/<[^>]*>/g, "");

  if (typeof DOMParser !== "undefined") {
    const parsedDocument = new DOMParser().parseFromString(
      sourceWithLineBreaks,
      "text/html",
    );

    plainText = parsedDocument.body.textContent || plainText;
  }

  return plainText
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeCompareText(value = "") {
  return String(value || "")
    .trim()
    .replace(/^[-•*]\s*/, "")
    .replace(/^\d+\.\d+(?:[.)])?\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/^[a-zA-Z][.)]\s*/, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function stripInlineListMarker(line = "") {
  return String(line || "").replace(
    /^\s*(?:[-•*]\s*)?(?:(?:\d+(?:\.\d+)*)|[a-zA-Z])(?:[.)])?\s+/,
    "",
  );
}

function normalizeSelectedPhrase(value = "") {
  return String(value || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => stripInlineListMarker(line).trim())
    .filter(Boolean)
    .join("\n");
}

function buildNormalizedTextMap(value = "") {
  const original = String(value || "").replace(/\r/g, "");
  let normalized = "";
  const map = [];
  let originalIndex = 0;
  let lastWasSpace = false;

  const parts = original.split(/(\n)/);

  parts.forEach((part) => {
    if (part === "\n") {
      if (!lastWasSpace && normalized.length > 0) {
        normalized += " ";
        map.push(originalIndex);
        lastWasSpace = true;
      }

      originalIndex += 1;
      return;
    }

    const strippedLine = stripInlineListMarker(part);
    const skippedChars = part.length - strippedLine.length;
    const lineStartIndex = originalIndex + skippedChars;

    for (let index = 0; index < strippedLine.length; index += 1) {
      const char = strippedLine[index];
      const realIndex = lineStartIndex + index;

      if (/\s/.test(char)) {
        if (!lastWasSpace && normalized.length > 0) {
          normalized += " ";
          map.push(realIndex);
          lastWasSpace = true;
        }

        continue;
      }

      normalized += char.toLowerCase();
      map.push(realIndex);
      lastWasSpace = false;
    }

    originalIndex += part.length;
  });

  return {
    normalized: normalized.trim(),
    map,
  };
}

function getNormalizedLineMatches(source, selectedText = "") {
  const selectedLines = String(selectedText || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => stripInlineListMarker(line).trim())
    .filter((line) => line.length >= 4);

  const matches = [];
  let searchFrom = 0;

  selectedLines.forEach((line) => {
    const normalizedLine = buildNormalizedTextMap(line).normalized;

    if (!normalizedLine) return;

    const foundIndex = source.normalized.indexOf(normalizedLine, searchFrom);

    if (foundIndex < 0) return;

    const start = source.map[foundIndex];
    const endMapIndex = foundIndex + normalizedLine.length - 1;
    const end = Number(source.map[endMapIndex] ?? start) + 1;

    matches.push({
      start,
      end,
      normalizedStart: foundIndex,
      normalizedEnd: foundIndex + normalizedLine.length,
    });

    searchFrom = foundIndex + normalizedLine.length;
  });

  return matches;
}

function findSelectedPhraseRange(text = "", selectedText = "") {
  const sourceText = String(text || "");
  const rawSelectedText = String(selectedText || "");

  if (!sourceText.trim() || !rawSelectedText.trim()) return null;

  const source = buildNormalizedTextMap(sourceText);
  const selected = buildNormalizedTextMap(rawSelectedText);

  if (!source.normalized || !selected.normalized) return null;

  const normalizedIndex = source.normalized.indexOf(selected.normalized);

  if (normalizedIndex >= 0) {
    const start = source.map[normalizedIndex];
    const endMapIndex = normalizedIndex + selected.normalized.length - 1;
    const end = Number(source.map[endMapIndex] ?? start) + 1;

    return {
      start,
      end,
    };
  }

  const lineMatches = getNormalizedLineMatches(source, rawSelectedText);

  if (lineMatches.length > 0) {
    return {
      start: lineMatches[0].start,
      end: lineMatches[lineMatches.length - 1].end,
    };
  }

  return null;
}

function getCommentStableKey(comment = {}) {
  return String(
    comment.id ||
      `${comment.sectionKey || ""}-${comment.selectedText || ""}-${
        comment.comment || comment.commentText || comment.comment_text || ""
      }`,
  );
}

function getReviewerCommentText(comment = {}) {
  return cleanText(
    comment.comment ||
      comment.commentText ||
      comment.comment_text ||
      comment.remarks ||
      "",
  );
}

function getInlineCommentMatches(text = "", comments = []) {
  const matches = comments
    .map((comment) => {
      const selectedText = comment.selectedText || comment.selected_text || "";
      const range = findSelectedPhraseRange(text, selectedText);

      if (!range) return null;

      return {
        comment,
        start: range.start,
        end: range.end,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const nonOverlappingMatches = [];
  let cursor = 0;

  matches.forEach((match) => {
    if (match.start < cursor) return;

    nonOverlappingMatches.push(match);
    cursor = match.end;
  });

  return nonOverlappingMatches;
}

function getSelectedTextCandidatePhrases(selectedText = "") {
  const rawSelectedText = String(selectedText || "").trim();

  if (!rawSelectedText) return [];

  const phrases = [];

  const pushPhrase = (value = "") => {
    const cleanValue = normalizeSelectedPhrase(value)
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanValue) return;

    const alreadyExists = phrases.some(
      (phrase) =>
        phrase.toLowerCase().replace(/\s+/g, " ").trim() ===
        cleanValue.toLowerCase().replace(/\s+/g, " ").trim(),
    );

    if (!alreadyExists) {
      phrases.push(cleanValue);
    }
  };

  pushPhrase(rawSelectedText);

  String(rawSelectedText)
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => stripInlineListMarker(line).trim())
    .filter(Boolean)
    .forEach(pushPhrase);

  return phrases.sort((a, b) => b.length - a.length);
}

function getLineInlineCommentMatches(text = "", comments = []) {
  const matches = comments
    .flatMap((comment) => {
      const selectedText = comment.selectedText || comment.selected_text || "";
      const candidatePhrases = getSelectedTextCandidatePhrases(selectedText);

      return candidatePhrases
        .map((phrase) => {
          const range = findSelectedPhraseRange(text, phrase);

          if (!range) return null;

          return {
            comment,
            phrase,
            start: range.start,
            end: range.end,
          };
        })
        .filter(Boolean);
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const nonOverlappingMatches = [];
  let cursor = 0;

  matches.forEach((match) => {
    if (match.start < cursor) return;

    nonOverlappingMatches.push(match);
    cursor = match.end;
  });

  return nonOverlappingMatches;
}

function getSourceValue(source = {}, aliases = []) {
  const raw = source?.raw || {};

  for (const alias of aliases) {
    const value = source?.[alias] ?? raw?.[alias];

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return "";
}

function parseFlexibleDate(value = "") {
  const rawValue = String(value || "").trim();

  if (!rawValue) return null;

  const ymdMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));

    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const parsed = new Date(rawValue);

  if (!Number.isNaN(parsed.getTime())) return parsed;

  return null;
}

function formatDateForInput(value = "") {
  const parsed = parseFlexibleDate(value);

  if (!parsed) {
    const raw = String(value || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(value = "") {
  const parsed = parseFlexibleDate(value);

  if (!parsed) return String(value || "");

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeDateCompareValue(value = "") {
  const parsed = parseFlexibleDate(value);

  if (!parsed) return normalizeCompareText(value);

  return formatDateForInput(parsed);
}

function isRecordDateField(field = {}) {
  return RECORD_DATE_FIELD_KEYS.has(field.key) || field.inputType === "date";
}

function getCurrentLocationWorkSetup(item = {}) {
  const direct = cleanText(
    getSourceValue(item, [
      "locationWorkSetup",
      "location_work_setup",
      "workSetup",
      "work_setup",
    ]),
  );

  if (direct) return direct;

  const location = cleanText(
    getSourceValue(item, ["location", "site", "siteName", "site_name"]),
  );
  const workSetup = cleanText(
    getSourceValue(item, ["workSetup", "work_setup"]),
  );

  if (
    location &&
    workSetup &&
    !normalizeCompareText(workSetup).includes(normalizeCompareText(location))
  ) {
    return `${location} (${workSetup})`;
  }

  return workSetup || location || "";
}

function getRecordFieldValue(item = {}, field = {}) {
  if (field.key === "locationWorkSetup") {
    return getCurrentLocationWorkSetup(item);
  }

  return cleanText(getSourceValue(item, field.aliases || [field.key]));
}

function getRecordFieldDisplayValue(item = {}, field = {}) {
  const value = getRecordFieldValue(item, field);

  if (isRecordDateField(field)) {
    return formatDateForDisplay(value);
  }

  return value;
}

function getRecordFieldInputValue(form = {}, field = {}) {
  const value = form?.[field.key] || "";

  if (isRecordDateField(field)) {
    return formatDateForInput(value) || (field.key === "effectiveDate" ? getTodayDate() : "");
  }

  return value;
}

function getPersonalityTypeValue(item = {}) {
  return cleanText(
    item.personalityType ||
      item.personality_type ||
      item.preferredPersonalityType ||
      item.preferred_personality_type ||
      item.raw?.personalityType ||
      item.raw?.personality_type ||
      item.raw?.preferredPersonalityType ||
      item.raw?.preferred_personality_type ||
      "",
  );
}

function normalizePersonalityCode(value = "") {
  return String(value || "")
    .trim()
    .replace(/\(.*?\)/g, "")
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase();
}

function getPersonalityOption(code = "") {
  const normalizedCode = normalizePersonalityCode(code);

  return PERSONALITY_TYPE_OPTIONS.find(
    (option) => option.code === normalizedCode,
  );
}

function formatPersonalityTypeLabel(value = "") {
  const code = normalizePersonalityCode(value);
  const option = getPersonalityOption(code);

  if (!code) return "";

  return option ? `${option.code} (${option.label})` : code;
}

function parsePersonalityTypes(value = "") {
  return String(value || "")
    .split(/[,;\n|]/)
    .map((item) => normalizePersonalityCode(item))
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);
}

function serializePersonalityTypes(codes = []) {
  return codes
    .map((code) => normalizePersonalityCode(code))
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index)
    .join(", ");
}

function doesCommentMatchPersonalityType(comment = {}, code = "") {
  const selectedText = cleanText(
    comment.selectedText || comment.selected_text || "",
  );

  if (!selectedText || !code) return false;

  const selectedCodes = parsePersonalityTypes(selectedText);
  const normalizedCode = normalizePersonalityCode(code);

  return selectedCodes.includes(normalizedCode);
}

function normalizeLevel(item = {}) {
  if (item.level) return String(item.level);

  if (Number(item.average) === 1) return "Average";
  if (Number(item.proficient) === 1) return "Proficient";
  if (Number(item.excellent) === 1) return "Excellent";

  return "";
}

function getCompetencyTitleAndDescription(item = {}) {
  const rawTitle = cleanText(item.title);
  const rawDescription = cleanText(item.description);

  if (rawTitle) {
    return {
      title: rawTitle,
      description: rawDescription,
    };
  }

  const lines = rawDescription
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return {
      title: "",
      description: rawDescription,
    };
  }

  return {
    title: lines[0],
    description: lines.slice(1).join("\n"),
  };
}

function getCompetenciesArray(item = {}) {
  if (Array.isArray(item.competencies)) return item.competencies;
  if (Array.isArray(item.desiredCompetencies)) return item.desiredCompetencies;
  if (Array.isArray(item.desired_competencies)) {
    return item.desired_competencies;
  }
  if (Array.isArray(item.raw?.competencies)) return item.raw.competencies;
  if (Array.isArray(item.raw?.desiredCompetencies)) {
    return item.raw.desiredCompetencies;
  }

  return [];
}

function normalizeCompetenciesForEditor(competencies = []) {
  return competencies.map((item) => {
    const { title, description } = getCompetencyTitleAndDescription(item);

    return {
      id:
        item.id ||
        item.competencyId ||
        globalThis.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      competencyId: item.competencyId || item.competency_id || item.id || "",
      title,
      description,
      level: normalizeLevel(item),
      average: Number(item.average || 0),
      proficient: Number(item.proficient || 0),
      excellent: Number(item.excellent || 0),
    };
  });
}

function serializeCompetenciesFromRows(rows = []) {
  return rows
    .map((row, index) => {
      const title = cleanText(row.title);
      const description = cleanText(row.description);
      const level = cleanText(row.level);

      return [
        `${index + 1}. ${title || "Untitled Competency"}`,
        description,
        level ? `Level: ${level}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function serializeCompetencies(item = {}) {
  return serializeCompetenciesFromRows(
    normalizeCompetenciesForEditor(getCompetenciesArray(item)),
  );
}

function normalizeRevisionCompareText(value = "") {
  return String(value || "")
    .trim()
    .replace(/^[-•*]\s*/, "")
    .replace(/^\d+\.\d+(?:[.)])?\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/^[a-zA-Z][.)]\s*/, "")
    .replace(/[.]+$/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function isCompetencySection(sectionKey = "") {
  const key = String(sectionKey || "").toLowerCase();

  return key.includes("competenc") || key.includes("desired");
}

function getCompetencyComments(item = {}, comments = []) {
  const competencyId = Number(item.id || item.competencyId || 0);

  const { title, description } = getCompetencyTitleAndDescription(item);

  const competencyText = normalizeRevisionCompareText(
    `${title || ""} ${description || ""}`,
  );

  const descriptionText = normalizeRevisionCompareText(description || "");
  const titleText = normalizeRevisionCompareText(title || "");

  return comments.filter((comment) => {
    const commentSectionKey = String(
      comment.sectionKey || comment.section_key || "",
    ).toLowerCase();

    if (!isCompetencySection(commentSectionKey)) return false;

    const commentCompetencyId = Number(
      comment.competencyId || comment.competency_id || 0,
    );

    if (competencyId && commentCompetencyId) {
      return competencyId === commentCompetencyId;
    }

    const selectedText = normalizeRevisionCompareText(
      comment.selectedText || comment.selected_text || "",
    );

    if (!selectedText) return false;

    if (!competencyText && !descriptionText && !titleText) return false;

    return (
      selectedText === competencyText ||
      selectedText === descriptionText ||
      selectedText === titleText ||
      competencyText.includes(selectedText) ||
      selectedText.includes(competencyText) ||
      descriptionText.includes(selectedText) ||
      selectedText.includes(descriptionText) ||
      titleText.includes(selectedText) ||
      selectedText.includes(titleText)
    );
  });
}

function getSectionComments(sectionKey = "", comments = []) {
  return comments.filter((comment) => {
    const commentSectionKey = String(
      comment.sectionKey || comment.section_key || "",
    );

    if (sectionKey === "competencies") {
      return isCompetencySection(commentSectionKey);
    }

    return commentSectionKey === sectionKey;
  });
}

function getWholeSectionComments(comments = []) {
  return comments.filter(
    (comment) =>
      !cleanText(comment.selectedText || comment.selected_text || ""),
  );
}

function getSelectedTextComments(comments = []) {
  return comments.filter((comment) =>
    cleanText(comment.selectedText || comment.selected_text || ""),
  );
}

function getCurrentValueForSection(item = {}, section = {}) {
  if (section.type === "record") {
    return getOrderedRecordFields()
      .map(
        (field) => `${field.label}: ${getRecordFieldValue(item, field) || "—"}`,
      )
      .join("\n");
  }
  if (section.key === "personalityType") {
    return getPersonalityTypeValue(item);
  }

  if (section.key === "competencies") {
    return serializeCompetencies(item);
  }

  return richTextToPlainText(
    item?.[section.key] || item?.raw?.[section.key] || "",
  );
}

function getDraftValueForSection(form = {}, section = {}, item = {}) {
  if (section.type === "record") {
    return getOrderedRecordFields()
      .map(
        (field) =>
          `${field.label}: ${
            form?.[field.key] ?? getRecordFieldValue(item, field) ?? "—"
          }`,
      )
      .join("\n");
  }

  if (section.key === "competencies") {
    if (Array.isArray(form?.competencies)) {
      return serializeCompetenciesFromRows(form.competencies);
    }

    return String(form?.competenciesText || "");
  }

  if (section.formKey) {
    return richTextToPlainText(
      form?.[section.formKey] ?? getCurrentValueForSection(item, section) ?? "",
    );
  }

  return "";
}

function countChangedSections(item = {}, form = {}) {
  return REVISION_SECTIONS.filter((section) => {
    const currentValue = getCurrentValueForSection(item, section);
    const nextValue = getDraftValueForSection(form, section, item);

    return (
      normalizeCompareText(currentValue) !== normalizeCompareText(nextValue)
    );
  }).length;
}

function getRevisionProgress(item = {}, form = {}) {
  const total = REVISION_SECTIONS.length;
  const changed = countChangedSections(item, form);

  return {
    total,
    changed,
    unchanged: total - changed,
  };
}

function isRevisionCommentResolved(comment = {}) {
  const status = String(comment.status || "")
    .trim()
    .toLowerCase();

  return (
    status === "resolved" ||
    status === "closed" ||
    status === "done" ||
    status === "addressed" ||
    Boolean(comment.resolvedAt || comment.resolved_at)
  );
}

function isRevisionSectionChanged(item = {}, form = {}, section = {}) {
  const currentValue = getCurrentValueForSection(item, section);
  const draftValue = getDraftValueForSection(form, section, item);

  return (
    normalizeCompareText(currentValue) !== normalizeCompareText(draftValue)
  );
}

function isRevisionSectionChangedAgainstBaseline(
  item = {},
  baselineForm = {},
  form = {},
  section = {},
) {
  const hasBaseline =
    baselineForm && typeof baselineForm === "object" &&
    Object.keys(baselineForm).length > 0;

  const baselineValue = hasBaseline
    ? getDraftValueForSection(baselineForm, section, item)
    : getCurrentValueForSection(item, section);
  const draftValue = getDraftValueForSection(form, section, item);

  return (
    normalizeCompareText(baselineValue) !== normalizeCompareText(draftValue)
  );
}

function getRevisionProgressAgainstBaseline(
  item = {},
  baselineForm = {},
  form = {},
) {
  const total = REVISION_SECTIONS.length;
  const changed = REVISION_SECTIONS.filter((section) =>
    isRevisionSectionChangedAgainstBaseline(
      item,
      baselineForm,
      form,
      section,
    ),
  ).length;

  return {
    total,
    changed,
    unchanged: total - changed,
  };
}

function getUnresolvedRevisionIssues(item = {}, form = {}, comments = []) {
  if (!Array.isArray(comments) || comments.length === 0) return [];

  return REVISION_SECTIONS.flatMap((section) => {
    const sectionComments = getSectionComments(section.key, comments).filter(
      (comment) => !isRevisionCommentResolved(comment),
    );

    if (sectionComments.length === 0) return [];

    const sectionChanged = isRevisionSectionChanged(item, form, section);

    if (sectionChanged) return [];

    return sectionComments.map((comment) => ({
      ...comment,
      sectionKey: comment.sectionKey || comment.section_key || section.key,
      sectionTitle:
        comment.sectionTitle || comment.section_title || section.label,
    }));
  });
}

function getRevisionFormDefaults(activeItem = {}) {
  const recordDefaults = Object.fromEntries(
    RECORD_FIELDS.map((field) => {
      const value = getRecordFieldValue(activeItem, field);

      return [
        field.key,
        isRecordDateField(field)
          ? formatDateForInput(value) || (field.key === "effectiveDate" ? getTodayDate() : "")
          : value,
      ];
    }),
  );

  const competencies = normalizeCompetenciesForEditor(
    getCompetenciesArray(activeItem),
  );

  const accountId = cleanText(
    getSourceValue(activeItem, [
      "accountId",
      "account_id",
      "preparedForId",
      "prepared_for_id",
    ]),
  );
  const departmentId = cleanText(
    getSourceValue(activeItem, ["departmentId", "department_id"]),
  );

  return {
    ...recordDefaults,
    accountId,
    account_id: accountId,
    preparedForId: accountId,
    departmentId,
    department_id: departmentId,
    description: richTextToPlainText(
      activeItem.description || activeItem.raw?.description || "",
    ),
    responsibilities: richTextToPlainText(
      activeItem.responsibilities || activeItem.raw?.responsibilities || "",
    ),
    qualifications: richTextToPlainText(
      activeItem.qualifications || activeItem.raw?.qualifications || "",
    ),
    education: richTextToPlainText(
      activeItem.education || activeItem.raw?.education || "",
    ),
    experience: richTextToPlainText(
      activeItem.experience || activeItem.raw?.experience || "",
    ),
    certificationsAffiliations: richTextToPlainText(
      activeItem.certificationsAffiliations ||
        activeItem.certifications_affiliations ||
        activeItem.raw?.certificationsAffiliations ||
        activeItem.raw?.certifications_affiliations ||
        "",
    ),
    personalityType: getPersonalityTypeValue(activeItem),
    competencies,
    competenciesText: serializeCompetenciesFromRows(competencies),
  };
}

function HighlightedCurrentText({ value = "", comments = [] }) {
  const text = String(value || "");
  const matches = getInlineCommentMatches(text, comments);

  if (!text.trim()) {
    return (
      <p className="text-sm font-semibold text-sibs-tertiary-5">
        No current content provided.
      </p>
    );
  }

  if (!matches.length) {
    return (
      <div className="whitespace-pre-wrap text-[14px] font-medium leading-8 text-sibs-text-secondary">
        {text}
      </div>
    );
  }

  const nodes = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    if (match.start > cursor) {
      nodes.push(
        <span key={`before-${index}`}>{text.slice(cursor, match.start)}</span>,
      );
    }

    nodes.push(
      <span
        key={`match-${getCommentStableKey(match.comment)}-${match.start}`}
        className="inline align-baseline"
      >
        <span className="inline-flex items-center self-center text-sm font-extrabold leading-none text-sibs-orange">
          &gt;&gt;&gt;
        </span>{" "}
        <span
          className="inline rounded-[10px] bg-amber-100 px-1.5 py-0.5 font-[inherit] leading-normal text-sibs-navy ring-1 ring-amber-300"
          title={getReviewerCommentText(match.comment) || "Marked for revision"}
        >
          {text.slice(match.start, match.end)}
        </span>{" "}
        <span className="inline-flex items-center self-center text-sm font-extrabold leading-none text-sibs-orange">
          &lt;&lt;&lt;
        </span>
      </span>,
    );

    nodes.push(
      <div
        key={`inline-comment-${getCommentStableKey(match.comment)}-${match.start}`}
        className="my-4"
      >
        <RevisionCommentCard comment={match.comment} compact />
      </div>,
    );

    cursor = match.end;
  });

  if (cursor < text.length) {
    nodes.push(<span key="after">{text.slice(cursor)}</span>);
  }

  return (
    <div className="whitespace-pre-wrap text-[14px] font-medium leading-8 text-sibs-text-secondary">
      {nodes}
    </div>
  );
}

function RevisionCommentCard({ comment, compact = false }) {
  return (
    <div
      className={`rounded-[10px] border border-amber-300 bg-amber-50 ${
        compact ? "px-3 py-3" : "px-4 py-4"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-orange">
          Reviewer Comment
        </p>

        <StatusBadge
          status={comment.status || "Open"}
          className="shrink-0 whitespace-nowrap"
        />
      </div>

      <div className="mt-3 rounded-[10px] border border-amber-300 bg-white/70 px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-sibs-orange" />

          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-orange">
            Reviewer Comment
          </p>
        </div>

        <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-6 text-orange-800">
          {getReviewerCommentText(comment) || "No revision comment provided."}
        </p>
      </div>
    </div>
  );
}

function normalizeRecordTarget(value = "") {
  return String(value || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getRecordCommentTarget(comment = {}) {
  return normalizeRecordTarget(
    comment.fieldKey ||
      comment.field_key ||
      comment.targetField ||
      comment.target_field ||
      comment.sectionTitle ||
      comment.section_title ||
      comment.fieldTitle ||
      comment.field_title ||
      "",
  );
}

function doesRecordCommentTargetField(comment = {}, field = {}) {
  const target = getRecordCommentTarget(comment);

  if (!target) return false;

  const fieldKey = normalizeRecordTarget(field.key);
  const fieldLabel = normalizeRecordTarget(field.label);

  return (
    target === fieldKey ||
    target === fieldLabel ||
    target.includes(fieldKey) ||
    target.includes(fieldLabel) ||
    fieldLabel.includes(target)
  );
}

function doesRecordCommentSelectedTextMatchValue(
  comment = {},
  value = "",
  field = {},
) {
  const selectedText = cleanText(
    comment.selectedText || comment.selected_text || "",
  );

  if (!selectedText || !value) return false;

  if (isRecordDateField(field)) {
    const normalizedSelectedDate = normalizeDateCompareValue(selectedText);
    const normalizedValueDate = normalizeDateCompareValue(value);

    return normalizedSelectedDate === normalizedValueDate;
  }

  const normalizedSelected = normalizeCompareText(selectedText);
  const normalizedValue = normalizeCompareText(value);

  return (
    normalizedSelected === normalizedValue ||
    normalizedSelected.includes(normalizedValue) ||
    normalizedValue.includes(normalizedSelected)
  );
}

function getInferredRecordFieldKey(comment = {}) {
  const combinedText = normalizeRecordTarget(
    [
      comment.fieldKey,
      comment.field_key,
      comment.targetField,
      comment.target_field,
      comment.sectionTitle,
      comment.section_title,
      comment.fieldTitle,
      comment.field_title,
      getReviewerCommentText(comment),
    ]
      .filter(Boolean)
      .join(" "),
  );

  if (
    combinedText.includes("position") ||
    combinedText.includes("role title") ||
    combinedText.includes("role")
  ) {
    return "roleTitle";
  }

  if (
    combinedText.includes("document title") ||
    combinedText.includes("documenttitle")
  ) {
    return "documentTitle";
  }

  if (
    combinedText.includes("prepared for") ||
    combinedText.includes("account")
  ) {
    return "preparedFor";
  }

  if (combinedText.includes("department")) {
    return "department";
  }

  if (combinedText.includes("effective date")) {
    return "effectiveDate";
  }

  if (combinedText.includes("created by")) {
    return "createdBy";
  }

  if (combinedText.includes("date requested")) {
    return "dateRequested";
  }

  if (
    combinedText.includes("linked hiring requirement") ||
    combinedText.includes("hiring requirement")
  ) {
    return "linkedHiringRequirement";
  }

  if (
    combinedText.includes("document code") ||
    combinedText.includes("jd code")
  ) {
    return "jdCode";
  }

  if (
    combinedText.includes("revision no") ||
    combinedText.includes("revision number") ||
    combinedText.includes("version")
  ) {
    return "currentVersion";
  }

  if (
    combinedText.includes("last reviewed") ||
    combinedText.includes("last updated")
  ) {
    return "lastUpdated";
  }

  if (combinedText.includes("reports to")) {
    return "reportsTo";
  }

  if (combinedText.includes("supervisory")) {
    return "supervisory";
  }

  return "";
}

function getRecordCommentAssignedFieldKey(comment = {}, item = {}) {
  const orderedFields = getOrderedRecordFields();

  const explicitField = orderedFields.find((field) =>
    doesRecordCommentTargetField(comment, field),
  );

  if (explicitField) {
    return explicitField.key;
  }

  const inferredFieldKey = getInferredRecordFieldKey(comment);

  if (inferredFieldKey) {
    const inferredField = orderedFields.find(
      (field) => field.key === inferredFieldKey,
    );

    const inferredValue = inferredField
      ? getRecordFieldValue(item, inferredField)
      : "";

    if (
      !cleanText(comment.selectedText || comment.selected_text || "") ||
      doesRecordCommentSelectedTextMatchValue(
        comment,
        inferredValue,
        inferredField,
      )
    ) {
      return inferredFieldKey;
    }
  }

  const valueMatchedFields = orderedFields.filter((field) => {
    const value = getRecordFieldValue(item, field);
    return doesRecordCommentSelectedTextMatchValue(comment, value, field);
  });

  if (valueMatchedFields.length === 1) {
    return valueMatchedFields[0].key;
  }

  if (
    valueMatchedFields.length > 1 &&
    valueMatchedFields.some((field) => field.key === "roleTitle")
  ) {
    return "roleTitle";
  }

  return valueMatchedFields[0]?.key || "";
}

function isRevisionCommentTargetChanged(
  item = {},
  form = {},
  comment = {},
  baselineForm = {},
) {
  const sectionKey = resolveRevisionCommentSectionKey(comment);
  const hasBaseline =
    baselineForm && typeof baselineForm === "object" &&
    Object.keys(baselineForm).length > 0;

  if (sectionKey === "recordInformation") {
    const fieldKey = getRecordCommentAssignedFieldKey(comment, item);
    const field = getOrderedRecordFields().find(
      (candidate) => candidate.key === fieldKey,
    );

    if (field) {
      const currentValue = hasBaseline
        ? baselineForm?.[field.key] ?? getRecordFieldValue(item, field)
        : getRecordFieldValue(item, field);
      const draftValue = form?.[field.key] ?? currentValue;

      if (isRecordDateField(field)) {
        return (
          normalizeDateCompareValue(currentValue) !==
          normalizeDateCompareValue(draftValue)
        );
      }

      return (
        normalizeCompareText(currentValue) !== normalizeCompareText(draftValue)
      );
    }
  }

  const section = REVISION_SECTIONS.find(
    (candidate) => candidate.key === sectionKey,
  );

  return section
    ? isRevisionSectionChangedAgainstBaseline(
        item,
        baselineForm,
        form,
        section,
      )
    : false;
}

function RecordCurrentView({ item = {}, comments = [] }) {
  const selectedTextComments = getSelectedTextComments(comments);

  return (
    <div className="grid w-full auto-rows-min grid-cols-1 content-start items-start gap-x-4 gap-y-5 sm:grid-cols-2">
      {getOrderedRecordFields()
        .filter(
          (field) =>
            !Array.isArray(visibleFieldKeys) ||
            visibleFieldKeys.length === 0 ||
            visibleFieldKeys.includes(field.key),
        )
        .map((field) => {
        const rawValue = getRecordFieldValue(item, field);
        const displayValue = getRecordFieldDisplayValue(item, field);

        const matchedComments = selectedTextComments.filter(
          (comment) =>
            getRecordCommentAssignedFieldKey(comment, item) === field.key,
        );

        const hasComments = matchedComments.length > 0;

        return (
          <div
            key={field.key}
            className={`min-w-0 overflow-hidden space-y-3 ${getRecordDraftFieldClass(
              field.key,
            )}`}
          >
            <div
              className={`min-h-[72px] overflow-hidden rounded-[10px] border px-4 py-3 ${
                hasComments
                  ? "border-amber-300 bg-amber-100"
                  : "border-sibs-border bg-sibs-surface"
              }`}
            >
              <p
                className={`text-[10px] font-extrabold uppercase tracking-wide ${
                  hasComments ? "text-sibs-orange" : "text-sibs-primary-1/70"
                }`}
              >
                {field.label}
              </p>

              <p className={REVISION_DISPLAY_VALUE_CLASS}>
                {displayValue || rawValue || "—"}
              </p>
            </div>

            {hasComments && (
              <div className="space-y-3">
                {matchedComments.map((comment, index) => (
                  <RevisionCommentCard
                    key={
                      comment.id ||
                      `${field.key}-${
                        getReviewerCommentText(comment) || "comment"
                      }-${index}`
                    }
                    comment={comment}
                    compact
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function getLinkedRequirementLabel(value = "", options = []) {
  if (!value) return "";

  const matchedOption = options.find((option) => {
    const optionValue =
      option.value ||
      option.id ||
      option.jdCode ||
      option.jd_code ||
      option.existingJdId ||
      option.existing_jd_id ||
      "";

    return String(optionValue) === String(value);
  });

  return (
    matchedOption?.label ||
    matchedOption?.name ||
    matchedOption?.title ||
    matchedOption?.documentTitle ||
    matchedOption?.document_title ||
    matchedOption?.jdCode ||
    matchedOption?.jd_code ||
    value
  );
}

function ReportsToDraftSelect({
  value = "",
  onChange,
  open,
  setOpen,
  onBeforeOpen,
}) {
  const reportsToRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!reportsToRef.current) return;

      if (!reportsToRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, setOpen]);

  return (
    <div ref={reportsToRef} className="relative">
      <button
        type="button"
        onClick={() => {
          onBeforeOpen?.();
          setOpen((prev) => !prev);
        }}
        className={`flex w-full items-center justify-between gap-3 rounded-[10px] border bg-white px-4 py-3 text-left text-sm text-sibs-primary-1 outline-none transition ${
          open ? "border-[var(--sibs-primary-1)]" : "border-sibs-tertiary-8"
        }`}
      >
        <span className={value ? "truncate" : "truncate text-sibs-muted"}>
          {value || "Select reporting line"}
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-primary-1 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-[10px] border border-sibs-tertiary-8 bg-white shadow-xl">
          {REPORTS_TO_OPTIONS.map((option) => {
            const selected =
              String(value || "")
                .trim()
                .toLowerCase() === option.toLowerCase();

            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`flex w-full items-center border-b border-sibs-border px-4 py-3 text-left text-sm font-semibold transition last:border-b-0 ${
                  selected
                    ? "bg-blue-50 text-sibs-primary-1"
                    : "bg-white text-sibs-primary-1 hover:bg-sibs-surface"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function normalizeSupervisoryDraftValue(value = "") {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized === "yes" || normalized === "true" || normalized === "1") {
    return "Yes";
  }

  return "No";
}

function SupervisoryDraftToggle({ value = "", onChange }) {
  const currentValue = normalizeSupervisoryDraftValue(value);
  const isYes = currentValue === "Yes";

  return (
    <div className="h-11 w-full overflow-hidden rounded-[10px] border border-sibs-border-subtle bg-sibs-surface shadow-sm">
      <div className="relative grid h-full grid-cols-2">
        <span
          className={`absolute left-0 top-0 z-0 h-full w-1/2 rounded-[10px] bg-sibs-navy shadow-md transition-transform duration-300 ease-out ${
            isYes ? "translate-x-0" : "translate-x-full"
          }`}
        />

        <button
          type="button"
          onClick={() => onChange("Yes")}
          className={`relative z-10 h-full text-sm font-extrabold transition-colors duration-300 ${
            isYes ? "text-white" : "text-sibs-navy"
          }`}
        >
          Yes
        </button>

        <button
          type="button"
          onClick={() => onChange("No")}
          className={`relative z-10 h-full text-sm font-extrabold transition-colors duration-300 ${
            !isYes ? "text-white" : "text-sibs-navy"
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

function RecordDraftEditor({ form = {}, setForm, visibleFieldKeys = null }) {
  const {
    accounts = [],
    departments = [],
    dropdownLoading = false,
    linkedRequirementOptions = [],
  } = useJobDescription();

  function updateField(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  const accountOptions = useMemo(() => {
    const list = (Array.isArray(accounts) ? accounts : []).map((acc) => {
      const name = String(acc?.gy_acc_name || acc?.name || acc?.accountName || acc?.account || acc?.label || acc?.value || "").trim();
      const id = String(acc?.gy_acc_id || acc?.id || acc?.accountId || acc?.account_id || name).trim();
      return { raw: acc, value: name || id, label: name || id, id };
    }).filter((opt) => opt.value && opt.label);

    const currentVal = cleanText(form.preparedFor || form.account || "");
    if (currentVal && !list.some((opt) => opt.value === currentVal || opt.label === currentVal)) {
      list.unshift({
        raw: { gy_acc_id: form.accountId || form.preparedForId || "", gy_acc_name: currentVal },
        value: currentVal,
        label: currentVal,
        id: form.accountId || form.preparedForId || "",
      });
    }
    return list;
  }, [accounts, form.preparedFor, form.account, form.accountId, form.preparedForId]);

  const departmentOptions = useMemo(() => {
    const list = (Array.isArray(departments) ? departments : []).map((dept) => {
      const name = String(dept?.name_department || dept?.name || dept?.departmentName || dept?.department || dept?.label || dept?.value || "").trim();
      const id = String(dept?.id_department || dept?.id || dept?.departmentId || dept?.department_id || name).trim();
      return { raw: dept, value: name || id, label: name || id, id };
    }).filter((opt) => opt.value && opt.label);

    const currentDept = cleanText(form.department || "");
    if (currentDept && !list.some((opt) => opt.value === currentDept || opt.label === currentDept)) {
      list.unshift({
        raw: { id_department: form.departmentId || "", name_department: currentDept },
        value: currentDept,
        label: currentDept,
        id: form.departmentId || "",
      });
    }
    return list;
  }, [departments, form.department, form.departmentId]);

  return (
    <div className="grid w-full grid-cols-1 items-start gap-4 md:grid-cols-2">
      {getOrderedRecordFields().map((field) => {
        if (field.key === "documentTitle") {
          return (
            <div
              key={field.key}
              className={`${getRecordDraftFieldStackClass(
                field.key,
              )} md:col-span-2`}
            >
              <label className={REVISION_FIELD_LABEL_CLASS}>
                {field.label}
              </label>

              <input
                value={getRecordFieldInputValue(form, field)}
                onChange={(event) => updateField(field.key, event.target.value)}
                className={REVISION_INPUT_CLASS}
                placeholder={field.label}
              />
            </div>
          );
        }

        if (field.key === "preparedFor") {
          return (
            <div
              key={field.key}
              className={getRecordDraftFieldStackClass(field.key)}
            >
              <SelectDropdown
                label="Prepared For"
                labelClassName={REVISION_FIELD_LABEL_CLASS}
                buttonClassName="h-11 rounded-[10px] border-sibs-border-subtle bg-white text-sm font-medium text-sibs-navy"
                value={form.preparedFor || form.account || ""}
                placeholder="Search account"
                disabled={false}
                searchable={true}
                searchPlaceholder="Search accounts..."
                options={accountOptions}
                optionValue={(item) => item?.value || item?.label || item?.gy_acc_name}
                optionLabel={(item) => item?.label || item?.gy_acc_name}
                onChange={(val, opt) => {
                  const selectedAccount = opt?.raw;
                  const accId = selectedAccount?.gy_acc_id || selectedAccount?.id || opt?.id || "";
                  const accName = val || selectedAccount?.gy_acc_name || selectedAccount?.name || opt?.label || "";
                  setForm((prev) => ({
                    ...prev,
                    accountId: accId,
                    preparedForId: accId,
                    account: accName,
                    preparedFor: accName,
                  }));
                }}
              />
            </div>
          );
        }

        if (field.key === "department") {
          return (
            <div
              key={field.key}
              className={getRecordDraftFieldStackClass(field.key)}
            >
              <SelectDropdown
                label="Department"
                labelClassName={REVISION_FIELD_LABEL_CLASS}
                buttonClassName="h-11 rounded-[10px] border-sibs-border-subtle bg-white text-sm font-medium text-sibs-navy"
                value={form.department || ""}
                placeholder="Search department"
                disabled={false}
                searchable={true}
                searchPlaceholder="Search departments..."
                options={departmentOptions}
                optionValue={(item) => item?.value || item?.label || item?.name_department}
                optionLabel={(item) => item?.label || item?.name_department}
                onChange={(val, opt) => {
                  const selectedDepartment = opt?.raw;
                  const deptId = selectedDepartment?.id_department || selectedDepartment?.id || opt?.id || "";
                  const deptName = val || selectedDepartment?.name_department || selectedDepartment?.name || opt?.label || "";
                  setForm((prev) => ({
                    ...prev,
                    departmentId: deptId,
                    department: deptName,
                  }));
                }}
              />
            </div>
          );
        }

        if (field.key === "linkedHiringRequirement") {
          return (
            <div
              key={field.key}
              className={getRecordDraftFieldStackClass(field.key)}
            >
              <SelectDropdown
                label="Linked Hiring Requirement"
                labelClassName={REVISION_FIELD_LABEL_CLASS}
                buttonClassName="h-11 rounded-[10px] border-sibs-border-subtle bg-white text-sm font-medium text-sibs-navy"
                value={form.linkedHiringRequirement || ""}
                placeholder="Select existing job description"
                disabled={false}
                searchable={true}
                options={linkedRequirementOptions}
                optionValue={(item) => item?.value}
                optionLabel={(item) => item?.label}
                onChange={(value) => {
                  updateField("linkedHiringRequirement", value || "");
                }}
              />
            </div>
          );
        }

        if (field.key === "locationWorkSetup") {
          return (
            <div
              key={field.key}
              className={getRecordDraftFieldStackClass(field.key)}
            >
              <SelectDropdown
                label={field.label}
                labelClassName={REVISION_FIELD_LABEL_CLASS}
                buttonClassName="h-11 rounded-[10px] border-sibs-border-subtle bg-white text-sm font-medium text-sibs-navy"
                value={form.locationWorkSetup || ""}
                placeholder="Select location / work setup"
                options={LOCATION_WORK_SETUP_OPTIONS}
                onChange={(value) => updateField("locationWorkSetup", value || "")}
              />
            </div>
          );
        }

        if (field.key === "reportsTo") {
          return (
            <div
              key={field.key}
              className={getRecordDraftFieldStackClass(field.key)}
            >
              <SelectDropdown
                label={field.label}
                labelClassName={REVISION_FIELD_LABEL_CLASS}
                buttonClassName="h-11 rounded-[10px] border-sibs-border-subtle bg-white text-sm font-medium text-sibs-navy"
                value={form.reportsTo || ""}
                placeholder="Select reporting line"
                options={REPORTS_TO_OPTIONS}
                onChange={(value) => updateField("reportsTo", value || "")}
              />
            </div>
          );
        }

        if (field.key === "supervisory") {
          return (
            <div
              key={field.key}
              className={getRecordDraftFieldStackClass(field.key)}
            >
              <label className={REVISION_FIELD_LABEL_CLASS}>
                {field.label}
              </label>

              <SupervisoryDraftToggle
                value={form.supervisory || ""}
                onChange={(value) => updateField("supervisory", value)}
              />
            </div>
          );
        }

        if (isRecordDateField(field)) {
          return (
            <div
              key={field.key}
              className={`${getRecordDraftFieldStackClass(field.key)} self-start`}
            >
              <label className={REVISION_FIELD_LABEL_CLASS}>{field.label}</label>

              <DatePicker
                value={getRecordFieldInputValue(form, field)}
                onChange={(nextValue) => updateField(field.key, nextValue)}
                placeholder={field.label}
                buttonClassName={REVISION_INPUT_CLASS}
              />
            </div>
          );
        }

        return (
          <div
            key={field.key}
            className={`${getRecordDraftFieldStackClass(field.key)} self-start`}
          >
            <label className={REVISION_FIELD_LABEL_CLASS}>{field.label}</label>

            <input
              type={field.inputType}
              value={getRecordFieldInputValue(form, field)}
              onChange={(event) => updateField(field.key, event.target.value)}
              className={REVISION_INPUT_CLASS}
              placeholder={field.label}
            />
          </div>
        );
      })}
    </div>
  );
}

function LevelIndicator({ active = false }) {
  return (
    <div
      className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
        active
          ? "border-sibs-primary-1 bg-sibs-primary-1 text-white"
          : "border-sibs-border bg-white text-transparent"
      }`}
    >
      {active && <Check size={15} strokeWidth={3} />}
    </div>
  );
}

function getCommentsForCompetencyTextLine(text = "", comments = []) {
  const matches = getLineInlineCommentMatches(text, comments);
  const uniqueComments = [];

  matches.forEach((match) => {
    const exists = uniqueComments.some(
      (comment) =>
        String(comment.id || "") === String(match.comment.id || "") &&
        String(getReviewerCommentText(comment)) ===
          String(getReviewerCommentText(match.comment)) &&
        String(comment.selectedText || "") ===
          String(match.comment.selectedText || ""),
    );

    if (!exists) {
      uniqueComments.push(match.comment);
    }
  });

  return uniqueComments;
}

function getFirstMatchedLineKey(lines = [], comment = {}) {
  for (const line of lines) {
    const hasMatch =
      getLineInlineCommentMatches(line.text, [comment]).length > 0;

    if (hasMatch) return line.key;
  }

  return "";
}

function getLastMatchedLineKey(lines = [], comment = {}) {
  let lastKey = "";

  lines.forEach((line) => {
    const hasMatch =
      getLineInlineCommentMatches(line.text, [comment]).length > 0;

    if (hasMatch) {
      lastKey = line.key;
    }
  });

  return lastKey;
}

function InlineCommentedText({
  text = "",
  comments = [],
  className = "",
  boundaryMap = {},
}) {
  const matches = getLineInlineCommentMatches(text, comments);

  if (!matches.length) {
    return <span className={className}>{text}</span>;
  }

  const nodes = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    if (match.start > cursor) {
      nodes.push(
        <span key={`text-before-${index}`}>
          {text.slice(cursor, match.start)}
        </span>,
      );
    }

    const commentKey = getCommentStableKey(match.comment);
    const boundary = boundaryMap[commentKey] || {};
    const isStart = Boolean(boundary.start);
    const isEnd = Boolean(boundary.end);
    const highlightedText = text.slice(match.start, match.end);

    nodes.push(
      <span
        key={`highlight-fragment-${commentKey}-${match.start}`}
        className="inline"
      >
        {isStart && (
          <span className="mr-1 inline font-extrabold text-sibs-orange">
            &gt;&gt;&gt;
          </span>
        )}

        <span
          className="inline rounded-[10px] bg-amber-100 px-1.5 py-0.5 font-[inherit] leading-[1.9] text-sibs-navy ring-1 ring-amber-300 box-decoration-clone"
          title={getReviewerCommentText(match.comment) || "Marked for revision"}
        >
          {highlightedText}
        </span>

        {isEnd && (
          <span className="ml-1 inline font-extrabold text-sibs-orange">
            &lt;&lt;&lt;
          </span>
        )}
      </span>,
    );

    cursor = match.end;
  });

  if (cursor < text.length) {
    nodes.push(<span key="text-after">{text.slice(cursor)}</span>);
  }

  return <span className={className}>{nodes}</span>;
}

function CompetencyTextWithComments({
  title = "",
  description = "",
  comments = [],
}) {
  const titleLines = title
    ? [
        {
          key: "title",
          text: title,
          type: "title",
        },
      ]
    : [];

  const descriptionLines = String(description || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => stripInlineListMarker(line).trim())
    .filter(Boolean)
    .map((line, index) => ({
      key: `description-${index}`,
      text: line,
      type: "description",
    }));

  const allLines = [...titleLines, ...descriptionLines];

  if (!allLines.length) {
    return (
      <p className="whitespace-pre-line text-[15px] font-medium leading-7 text-sibs-text-secondary">
        —
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {allLines.map((line) => {
        const lineComments = getCommentsForCompetencyTextLine(
          line.text,
          comments,
        );

        const lineCommentsToDisplay = lineComments.filter(
          (comment) => getLastMatchedLineKey(allLines, comment) === line.key,
        );

        const boundaryMap = Object.fromEntries(
          lineComments.map((comment) => {
            const commentKey = getCommentStableKey(comment);

            return [
              commentKey,
              {
                start: getFirstMatchedLineKey(allLines, comment) === line.key,
                end: getLastMatchedLineKey(allLines, comment) === line.key,
              },
            ];
          }),
        );

        return (
          <div key={line.key}>
            {line.type === "title" ? (
              <p className="text-sm font-extrabold leading-6 text-sibs-navy selection:bg-amber-100 selection:text-sibs-navy">
                <InlineCommentedText
                  text={line.text}
                  comments={comments}
                  boundaryMap={boundaryMap}
                />
              </p>
            ) : (
              <p className="whitespace-pre-line text-[15px] font-medium leading-7 text-sibs-text-secondary selection:bg-amber-100 selection:text-sibs-navy">
                <InlineCommentedText
                  text={line.text}
                  comments={comments}
                  boundaryMap={boundaryMap}
                />
              </p>
            )}

            {lineCommentsToDisplay.length > 0 && (
              <div className="space-y-3">
                {lineCommentsToDisplay.map((comment, index) => (
                  <RevisionCommentCard
                    key={
                      comment.id ||
                      `${line.key}-${getReviewerCommentText(comment)}-${index}`
                    }
                    comment={comment}
                    compact
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CompetenciesCurrentTable({ item = {}, comments = [] }) {
  const competencies = normalizeCompetenciesForEditor(
    getCompetenciesArray(item),
  );

  return (
    <div className="overflow-hidden rounded-[10px] border border-sibs-border bg-white selection:bg-amber-100 selection:text-sibs-navy">
      <div className="hidden grid-cols-[minmax(0,1fr)_110px_110px_110px] border-b border-sibs-border bg-sibs-surface md:grid">
        <div className="px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
          Competency for this Position
        </div>

        {proficiencyOptions.map((option) => (
          <div
            key={option}
            className="flex items-center justify-center border-l border-sibs-border px-3 py-3 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1"
          >
            {option}
          </div>
        ))}
      </div>

      {competencies.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm font-semibold text-sibs-tertiary-5">
          No competencies provided.
        </div>
      ) : (
        <div className="divide-y divide-sibs-border">
          {competencies.map((competency, index) => {
            const level = normalizeLevel(competency);
            const rowComments = getCompetencyComments(competency, comments);
            const { title, description } =
              getCompetencyTitleAndDescription(competency);

            return (
              <div
                key={competency.id || `${title}-${index}`}
                className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_110px_110px_110px]"
              >
                <div className="px-4 py-5 selection:bg-amber-100 selection:text-sibs-navy md:border-r md:border-sibs-border">
                  <CompetencyTextWithComments
                    title={title}
                    description={
                      description || (!title ? competency.description : "")
                    }
                    comments={rowComments}
                  />
                </div>

                {proficiencyOptions.map((option) => (
                  <div
                    key={option}
                    className="flex items-center justify-between gap-3 border-t border-sibs-border px-4 py-4 md:justify-center md:border-l md:border-t-0"
                  >
                    <span className="text-sm font-bold text-sibs-primary-1 md:hidden">
                      {option}
                    </span>

                    <LevelIndicator active={level === option} />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AutoGrowCompetencyTextarea({
  value = "",
  onChange,
  placeholder = "Describe this competency...",
}) {
  const textareaRef = useRef(null);

  function resizeTextarea() {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  useLayoutEffect(() => {
    resizeTextarea();

    const resizeTimer = window.setTimeout(resizeTextarea, 0);

    return () => window.clearTimeout(resizeTimer);
  }, [value]);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(() => {
      resizeTextarea();
    });

    observer.observe(textarea.parentElement || textarea);

    return () => observer.disconnect();
  }, []);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(event) => {
        onChange?.(event.target.value);

        requestAnimationFrame(() => {
          resizeTextarea();
        });
      }}
      onInput={resizeTextarea}
      placeholder={placeholder}
      className="block min-h-[90px] w-full resize-none rounded-[10px] border border-sibs-border bg-white px-4 py-3 text-sm font-medium leading-7 text-sibs-navy outline-none transition placeholder:text-sibs-muted focus:border-sibs-primary-1 focus:ring-2 focus:ring-blue-100"
      style={{
        height: "auto",
        overflow: "hidden",
      }}
    />
  );
}

function CompetenciesDraftTable({ form = {}, setForm }) {
  const competencies = Array.isArray(form?.competencies)
    ? form.competencies
    : [];

  function commitCompetencies(nextCompetencies) {
    setForm((prev) => ({
      ...prev,
      competencies: nextCompetencies,
      competenciesText: serializeCompetenciesFromRows(nextCompetencies),
    }));
  }

  function handleAddRow() {
    commitCompetencies([...competencies, createCompetencyRow()]);
  }

  function handleRemoveRow(id) {
    commitCompetencies(competencies.filter((item) => item.id !== id));
  }

  function handleChange(id, field, value) {
    commitCompetencies(
      competencies.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-[10px] border border-sibs-border bg-white">
        <div className="hidden grid-cols-[minmax(0,1fr)_110px_110px_110px_56px] border-b border-sibs-border bg-sibs-surface md:grid">
          <div className="px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
            Competency for this Position
          </div>

          {proficiencyOptions.map((option) => (
            <div
              key={option}
              className="flex items-center justify-center border-l border-sibs-border px-3 py-3 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1"
            >
              {option}
            </div>
          ))}

          <div className="border-l border-sibs-border px-3 py-3" />
        </div>

        {competencies.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm font-semibold text-sibs-tertiary-5">
            No competencies added yet.
          </div>
        ) : (
          <div className="divide-y divide-sibs-border">
            {competencies.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_110px_110px_110px_56px]"
              >
                <div className="min-w-0 border-b border-sibs-border p-4 md:border-b-0 md:border-r md:border-sibs-border">
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={item.title || ""}
                      onChange={(event) =>
                        handleChange(item.id, "title", event.target.value)
                      }
                      placeholder={`Competency ${index + 1} title`}
                      className="w-full rounded-[10px] border border-sibs-border bg-white px-4 py-3 text-sm font-semibold text-sibs-navy outline-none transition placeholder:text-sibs-muted focus:border-sibs-primary-1 focus:ring-2 focus:ring-blue-100"
                    />

                    <AutoGrowCompetencyTextarea
                      value={item.description || ""}
                      onChange={(value) =>
                        handleChange(item.id, "description", value)
                      }
                      placeholder="Describe this competency..."
                    />
                  </div>
                </div>

                {proficiencyOptions.map((option) => (
                  <div
                    key={option}
                    className="flex items-center justify-center border-b border-sibs-border px-3 py-4 md:border-b-0 md:border-r md:border-sibs-border"
                  >
                    <label className="flex cursor-pointer flex-col items-center gap-2">
                      <span className="text-sm font-semibold text-sibs-text-secondary md:hidden">
                        {option}
                      </span>

                      <input
                        type="radio"
                        name={`competency-level-${item.id}`}
                        value={option}
                        checked={item.level === option}
                        onChange={(event) =>
                          handleChange(item.id, "level", event.target.value)
                        }
                        className="h-4 w-4 accent-sibs-primary-1"
                      />
                    </label>
                  </div>
                ))}

                <div className="flex items-center justify-center px-2 py-4">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(item.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                    aria-label="Remove competency"
                    title="Remove competency"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
        >
          <Plus size={18} />
          Add Competency
        </button>
      </div>
    </div>
  );
}

function PersonalityCapsule({
  code = "",
  selected = false,
  highlighted = false,
  removable = false,
  onClick,
  onRemove,
}) {
  const label = formatPersonalityTypeLabel(code);

  return (
    <span
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return;

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold transition ${
        highlighted
          ? "border-amber-300 bg-amber-100 text-sibs-navy"
          : selected
            ? "border-sibs-orange bg-sibs-orange text-white"
            : "border-sibs-orange/30 bg-sibs-cream-subtle text-sibs-navy"
      } ${onClick ? "cursor-pointer hover:border-sibs-orange" : ""}`}
      title={label}
    >
      <span className="min-w-0 truncate">{label}</span>

      {removable && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove?.();
          }}
          className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${
            selected
              ? "bg-white/20 text-white hover:bg-white/30"
              : "bg-white text-sibs-navy/70 hover:bg-sibs-orange/10 hover:text-sibs-orange"
          }`}
          aria-label={`Remove ${label}`}
        >
          <X size={11} strokeWidth={3} />
        </button>
      )}
    </span>
  );
}

function PersonalityCurrentView({ value = "", comments = [] }) {
  const personalityTypes = parsePersonalityTypes(value);
  const selectedTextComments = getSelectedTextComments(comments);

  if (!personalityTypes.length) {
    return (
      <div className="rounded-[10px] border border-sibs-border bg-sibs-surface px-4 py-4 text-sm font-semibold text-sibs-tertiary-5">
        No preferred personality type provided.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[10px] border border-sibs-border bg-sibs-surface px-4 py-4">
        <div className="flex flex-wrap gap-2">
          {personalityTypes.map((code) => {
            const matchedComments = selectedTextComments.filter((comment) =>
              doesCommentMatchPersonalityType(comment, code),
            );

            return (
              <PersonalityCapsule
                key={code}
                code={code}
                highlighted={matchedComments.length > 0}
              />
            );
          })}
        </div>
      </div>

      {selectedTextComments.length > 0 && (
        <div className="space-y-3">
          {selectedTextComments.map((comment, index) => (
            <RevisionCommentCard
              key={
                comment.id ||
                `personality-${getReviewerCommentText(comment)}-${index}`
              }
              comment={comment}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PersonalityDraftPicker({ form = {}, setForm }) {
  const [open, setOpen] = useState(false);

  const selectedCodes = parsePersonalityTypes(form?.personalityType || "");

  function commitSelectedCodes(nextCodes = []) {
    setForm((prev) => ({
      ...prev,
      personalityType: serializePersonalityTypes(nextCodes),
    }));
  }

  function toggleCode(code = "") {
    const normalizedCode = normalizePersonalityCode(code);

    if (!normalizedCode) return;

    const exists = selectedCodes.includes(normalizedCode);

    const nextCodes = exists
      ? selectedCodes.filter((item) => item !== normalizedCode)
      : [...selectedCodes, normalizedCode];

    commitSelectedCodes(nextCodes);
  }

  function removeCode(code = "") {
    const normalizedCode = normalizePersonalityCode(code);

    commitSelectedCodes(
      selectedCodes.filter((item) => item !== normalizedCode),
    );
  }

  function clearAll() {
    commitSelectedCodes([]);
  }

  return (
    <div className="w-full">
      <div
        className={`rounded-[10px] border bg-white transition ${
          open
            ? "border-sibs-orange ring-2 ring-sibs-orange/10"
            : "border-sibs-border-subtle hover:border-sibs-orange/40"
        }`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen((prev) => !prev)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setOpen((prev) => !prev);
            }
          }}
          className="flex min-h-[52px] w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left"
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {selectedCodes.length > 0 && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  clearAll();
                }}
                className="inline-flex h-8 items-center justify-center rounded-full border border-sibs-border-subtle bg-sibs-surface px-3 text-xs font-bold text-sibs-muted transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                Clear all
              </button>
            )}

            {selectedCodes.length === 0 ? (
              <span className="px-1 text-sm font-semibold text-sibs-muted">
                Select preferred personality type
              </span>
            ) : (
              selectedCodes.map((code) => (
                <PersonalityCapsule
                  key={code}
                  code={code}
                  selected
                  removable
                  onRemove={() => removeCode(code)}
                />
              ))
            )}
          </div>

          <ChevronDown
            size={18}
            className={`shrink-0 transition ${
              open ? "rotate-180 text-sibs-orange" : "text-sibs-navy"
            }`}
          />
        </div>
      </div>

      {open && (
        <div className="mt-2 max-h-[280px] overflow-y-auto rounded-[10px] border border-sibs-border bg-white shadow-sm">
          {PERSONALITY_TYPE_OPTIONS.map((option) => {
            const selected = selectedCodes.includes(option.code);

            return (
              <button
                key={option.code}
                type="button"
                onClick={() => toggleCode(option.code)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold transition ${
                  selected
                    ? "bg-sibs-cream-subtle font-extrabold text-sibs-orange"
                    : "bg-white text-sibs-navy hover:bg-sibs-cream-light hover:text-sibs-orange"
                }`}
              >
                <span>
                  {option.code} ({option.label})
                </span>

                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-[10px] border ${
                    selected
                      ? "border-sibs-orange bg-sibs-orange text-white"
                      : "border-sibs-border bg-white text-transparent"
                  }`}
                >
                  <Check size={13} strokeWidth={3} />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionMergeEditor({
  section,
  item,
  form,
  baselineForm = {},
  setForm,
  comments = [],
  sectionRef,
}) {
  const currentValue = getCurrentValueForSection(item, section);
  const draftValue = getDraftValueForSection(form, section, item);
  const changed =
    normalizeCompareText(currentValue) !== normalizeCompareText(draftValue);

  const selectedTextComments = getSelectedTextComments(comments);
  const wholeSectionComments = getWholeSectionComments(comments);
  const isRecordSection = section.type === "record";
  const isCompetencySectionType = section.type === "competencyTable";
  const isPersonalityPickerSection = section.type === "personalityPicker";

  const inlineMatchedCommentKeys =
    isRecordSection || isCompetencySectionType || isPersonalityPickerSection
      ? new Set(
          selectedTextComments.map((comment) => getCommentStableKey(comment)),
        )
      : new Set(
          getInlineCommentMatches(currentValue, selectedTextComments).map(
            (match) => getCommentStableKey(match.comment),
          ),
        );

  const fallbackSelectedTextComments =
    isRecordSection || isCompetencySectionType || isPersonalityPickerSection
      ? []
      : selectedTextComments.filter(
          (comment) =>
            !inlineMatchedCommentKeys.has(getCommentStableKey(comment)),
        );

  function updateDraft(value) {
    if (!section.formKey) return;

    setForm((prev) => ({
      ...prev,
      [section.formKey]: value,
    }));
  }

  function useCurrentVersion() {
    if (section.type === "record") {
      setForm((prev) => ({
        ...prev,
        ...Object.fromEntries(
          getOrderedRecordFields().map((field) => {
            const baselineValue =
              baselineForm?.[field.key] ?? getRecordFieldValue(item, field);

            return [
              field.key,
              isRecordDateField(field)
                ? formatDateForInput(baselineValue)
                : baselineValue,
            ];
          }),
        ),
      }));

      return;
    }

    if (section.type === "personalityPicker") {
      setForm((prev) => ({
        ...prev,
        personalityType:
          baselineForm?.personalityType ?? getPersonalityTypeValue(item),
      }));

      return;
    }

    if (section.type === "competencyTable") {
      const competencies = Array.isArray(baselineForm?.competencies)
        ? normalizeCompetenciesForEditor(baselineForm.competencies)
        : normalizeCompetenciesForEditor(getCompetenciesArray(item));

      setForm((prev) => ({
        ...prev,
        competencies,
        competenciesText: serializeCompetenciesFromRows(competencies),
      }));

      return;
    }

    updateDraft(
      baselineForm?.[section.formKey] ?? currentValue,
    );
  }

  return (
    <section
      ref={sectionRef}
      className="scroll-mt-3 overflow-hidden rounded-[14px] border border-sibs-border bg-white shadow-sm transition"
    >
      <div className="flex flex-col gap-3 border-b border-sibs-border bg-sibs-surface px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="sibs-modal-section-title text-sibs-navy">
              {section.label}
            </h3>

            {comments.length > 0 && (
              <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[11px] font-extrabold text-sibs-navy">
                {comments.length} comment{comments.length > 1 ? "s" : ""}
              </span>
            )}

            {changed ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700">
                Modified
              </span>
            ) : (
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-extrabold text-slate-500">
                Same as current
              </span>
            )}
          </div>

          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
            {section.helper}
          </p>
        </div>

        <button
          type="button"
          onClick={useCurrentVersion}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-sibs-border bg-white px-3 text-xs font-bold text-sibs-primary-1 transition hover:bg-sibs-surface"
        >
          <RotateCcw size={14} />
          Use Current
        </button>
      </div>

      <div className="grid grid-cols-1 items-stretch lg:grid-cols-2">
        <div className="flex flex-col border-b border-sibs-border bg-white lg:border-b-0 lg:border-r lg:border-sibs-border">
          <div className="flex items-center justify-between border-b border-sibs-border px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-sibs-primary-1" />

              <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Current Version
              </p>
            </div>

            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-extrabold uppercase text-amber-700">
              With Review Notes
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-4 px-4 py-4">
            <div
              className={`rounded-[10px] border border-sibs-border ${
                isCompetencySectionType || isPersonalityPickerSection
                  ? "bg-white p-0"
                  : "bg-sibs-surface px-4 py-4"
              }`}
            >
              {isRecordSection ? (
                <RecordCurrentView item={item} comments={comments} />
              ) : isCompetencySectionType ? (
                <CompetenciesCurrentTable item={item} comments={comments} />
              ) : isPersonalityPickerSection ? (
                <PersonalityCurrentView
                  value={currentValue}
                  comments={comments}
                />
              ) : (
                <HighlightedCurrentText
                  value={currentValue}
                  comments={selectedTextComments}
                />
              )}
            </div>

            {wholeSectionComments.length > 0 && (
              <div className="space-y-3">
                {wholeSectionComments.map((comment, index) => (
                  <RevisionCommentCard
                    key={
                      comment.id ||
                      `${section.key}-whole-${getReviewerCommentText(
                        comment,
                      )}-${index}`
                    }
                    comment={comment}
                    compact
                  />
                ))}
              </div>
            )}

            {fallbackSelectedTextComments.length > 0 && (
              <div className="space-y-3">
                {fallbackSelectedTextComments.map((comment, index) => (
                  <RevisionCommentCard
                    key={
                      comment.id ||
                      `${section.key}-selected-${getReviewerCommentText(
                        comment,
                      )}-${index}`
                    }
                    comment={comment}
                    compact
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col bg-white">
          <div className="flex items-center justify-between border-b border-sibs-border px-4 py-3">
            <div className="flex items-center gap-2">
              <GitCompare size={16} className="text-sibs-primary-1" />

              <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                New Revision
              </p>
            </div>

            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase ${
                changed
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              {changed ? "Edited" : "Unchanged"}
            </span>
          </div>

          <div
            className={`flex flex-1 px-4 py-4 ${
              isRecordSection ||
              isCompetencySectionType ||
              isPersonalityPickerSection
                ? "items-start"
                : ""
            }`}
          >
            {isRecordSection ? (
              <RecordDraftEditor form={form} setForm={setForm} />
            ) : isCompetencySectionType ? (
              <CompetenciesDraftTable form={form} setForm={setForm} />
            ) : isPersonalityPickerSection ? (
              <PersonalityDraftPicker form={form} setForm={setForm} />
            ) : (
              <textarea
                value={draftValue}
                onChange={(event) => updateDraft(event.target.value)}
                className={REVISION_TEXTAREA_CLASS}
                placeholder={`Write the revised ${section.label.toLowerCase()} here...`}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


function resolveRevisionCommentSectionKey(comment = {}) {
  const matchedSection = REVISION_SECTIONS.find(
    (section) => getSectionComments(section.key, [comment]).length > 0,
  );

  if (matchedSection) return matchedSection.key;

  const fallbackKey = String(
    comment.sectionKey || comment.section_key || "",
  ).trim();

  return fallbackKey || "recordInformation";
}

function getRevisionCommentSelectedText(comment = {}) {
  return cleanText(comment.selectedText || comment.selected_text || "");
}

function getRecordCommentsForDisplayedValue(value = "", comments = []) {
  const normalizedValue = normalizeCompareText(value);

  if (!normalizedValue) return [];

  return comments.filter((comment) => {
    const selectedText = getRevisionCommentSelectedText(comment);

    if (!selectedText) return false;

    const normalizedSelected = normalizeCompareText(selectedText);

    if (!normalizedSelected) return false;

    return (
      normalizedSelected === normalizedValue ||
      normalizedValue.includes(normalizedSelected) ||
      normalizedSelected.includes(normalizedValue)
    );
  });
}

function RevisionDocumentSection({
  section,
  sectionIndex,
  item,
  form,
  baselineForm = {},
  setForm,
  comments = [],
  sectionRef,
  showOriginal = false,
  onToggleOriginal,
  isCommentAddressed,
  activeCommentKey = "",
}) {
  const { accounts = [] } = useJobDescription();

  const currentValue = getCurrentValueForSection(item, section);
  const draftValue = getDraftValueForSection(form, section, item);
  const changed = isRevisionSectionChangedAgainstBaseline(
    item,
    baselineForm,
    form,
    section,
  );

  const remainingSectionComments = comments.filter(
    (comment) => !isCommentAddressed(comment),
  );

  const addressedSectionComments = comments.length - remainingSectionComments.length;
  const sectionHasActiveComment = comments.some(
    (comment) => getCommentStableKey(comment) === activeCommentKey,
  );

  const isRecordSection = section.type === "record";
  const isCompetencySectionType = section.type === "competencyTable";
  const isPersonalityPickerSection = section.type === "personalityPicker";

  const accountOptions = useMemo(
    () =>
      (Array.isArray(accounts) ? accounts : [])
        .map((account) => ({
          value:
            account?.gy_acc_id ||
            account?.id ||
            account?.accountId ||
            account?.account_id ||
            "",
          label:
            account?.gy_acc_name ||
            account?.name ||
            account?.accountName ||
            account?.account_name ||
            "",
        }))
        .filter((option) => option.value && option.label),
    [accounts],
  );

  const locationOptions = useMemo(
    () =>
      LOCATION_WORK_SETUP_OPTIONS.map((option) => ({
        value: option,
        label: option,
      })),
    [],
  );

  function updateDraft(value) {
    if (!section.formKey) return;

    setForm((prev) => ({
      ...prev,
      [section.formKey]: value,
    }));
  }

  function resetSection() {
    if (section.type === "record") {
      setForm((prev) => ({
        ...prev,
        ...Object.fromEntries(
          getOrderedRecordFields().map((field) => {
            const baselineValue =
              baselineForm?.[field.key] ?? getRecordFieldValue(item, field);

            return [
              field.key,
              isRecordDateField(field)
                ? formatDateForInput(baselineValue)
                : baselineValue,
            ];
          }),
        ),
      }));

      return;
    }

    if (section.type === "personalityPicker") {
      setForm((prev) => ({
        ...prev,
        personalityType:
          baselineForm?.personalityType ?? getPersonalityTypeValue(item),
      }));

      return;
    }

    if (section.type === "competencyTable") {
      const competencies = Array.isArray(baselineForm?.competencies)
        ? normalizeCompetenciesForEditor(baselineForm.competencies)
        : normalizeCompetenciesForEditor(getCompetenciesArray(item));

      setForm((prev) => ({
        ...prev,
        competencies,
        competenciesText: serializeCompetenciesFromRows(competencies),
      }));

      return;
    }

    updateDraft(
      baselineForm?.[section.formKey] ?? currentValue,
    );
  }

  function handleRecordFieldChange(fieldKey, value) {
    if (fieldKey === "accountId") {
      const selectedAccount = (Array.isArray(accounts) ? accounts : []).find(
        (account) =>
          String(
            account?.gy_acc_id ||
              account?.id ||
              account?.accountId ||
              account?.account_id ||
              "",
          ) === String(value),
      );

      const accountLabel =
        selectedAccount?.gy_acc_name ||
        selectedAccount?.name ||
        selectedAccount?.accountName ||
        selectedAccount?.account_name ||
        "";

      setForm((prev) => ({
        ...prev,
        accountId: value,
        preparedForId: value,
        preparedFor: accountLabel,
        account: accountLabel,
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  }

  const sectionNumber = sectionIndex;

  return (
    <section
      ref={sectionRef}
      className="scroll-mt-5 border-t border-sibs-border pt-7 first:border-t-0 first:pt-0"
      data-revision-section={section.key}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-base font-extrabold uppercase tracking-tight text-sibs-navy sm:text-[17px]">
              {isRecordSection
                ? "Record Information"
                : `${sectionNumber}. ${section.label}`}
            </h3>

            {comments.length > 0 && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${
                  remainingSectionComments.length > 0
                    ? sectionHasActiveComment
                      ? "border-orange-300 bg-orange-50 text-orange-700 shadow-sm"
                      : "border-amber-200 bg-amber-50/80 text-amber-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {remainingSectionComments.length > 0 ? (
                  <MessageSquareText size={12} strokeWidth={2.4} />
                ) : (
                  <CheckCircle2 size={12} strokeWidth={2.4} />
                )}
                {remainingSectionComments.length > 0
                  ? `${remainingSectionComments.length} open comment${
                      remainingSectionComments.length === 1 ? "" : "s"
                    }`
                  : "Comments addressed"}
              </span>
            )}

            {changed && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold text-blue-700">
                <FileText size={12} strokeWidth={2.4} />
                Changed
              </span>
            )}
          </div>

          <p className="mt-1 text-xs font-semibold leading-5 text-sibs-muted">
            {section.helper}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {!isRecordSection && (
            <button
              type="button"
              onClick={onToggleOriginal}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[10px] border border-sibs-border-subtle bg-white px-3 text-[11px] font-bold text-sibs-primary-1 transition hover:bg-sibs-surface"
            >
              <Eye size={14} />
              {showOriginal ? "Hide Original" : "Show Original"}
            </button>
          )}

          <button
            type="button"
            onClick={resetSection}
            disabled={!changed}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[10px] border border-sibs-border-subtle bg-white px-3 text-[11px] font-bold text-sibs-primary-1 transition hover:bg-sibs-surface disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw size={14} />
            Revert changes
          </button>

        </div>
      </div>

      {isRecordSection ? (
        <div className="space-y-5">
          <DocumentRecordInfoTable
            item={item}
            recordInfoDraft={form}
            editingRecordInfo
            getRecordFieldComments={(value) =>
              getRecordCommentsForDisplayedValue(value, comments).map(
                (comment) => ({
                  ...comment,
                  __revisionUiActive:
                    getCommentStableKey(comment) === activeCommentKey,
                  __revisionUiAddressed: isCommentAddressed(comment),
                }),
              )
            }
            onChange={handleRecordFieldChange}
            accountOptions={accountOptions}
            locationOptions={locationOptions}
            revisionMode
          />

          <div className="rounded-[10px] border border-sibs-border bg-sibs-surface p-4">
            <div className="mb-4">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Additional Document Details
              </p>

              <p className="mt-1 text-xs font-semibold leading-5 text-sibs-muted">
                Update the position metadata that is used by the HRIS record.
              </p>
            </div>

            <RecordDraftEditor
              form={form}
              setForm={setForm}
              visibleFieldKeys={[
                "roleTitle",
                "department",
                "linkedHiringRequirement",
                "reportsTo",
                "supervisory",
              ]}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {showOriginal && (
            <div className="rounded-[10px] border border-amber-200 bg-amber-50/70 px-4 py-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-amber-700">
                  Original Version
                </p>

                {comments.length > 0 && (
                  <span className="text-[10px] font-bold text-amber-700">
                    Reviewer notes highlighted
                  </span>
                )}
              </div>

              {isCompetencySectionType ? (
                <CompetenciesCurrentTable item={item} comments={comments} />
              ) : isPersonalityPickerSection ? (
                <PersonalityCurrentView
                  value={currentValue}
                  comments={comments}
                />
              ) : (
                <HighlightedCurrentText
                  value={currentValue}
                  comments={getSelectedTextComments(comments)}
                />
              )}
            </div>
          )}

          <div
            className={`relative rounded-[10px] border px-4 py-4 transition ${
              sectionHasActiveComment && remainingSectionComments.length > 0
                ? "border-orange-300 bg-orange-50/35 shadow-sm ring-2 ring-orange-100"
                : comments.length > 0 && remainingSectionComments.length > 0
                  ? "border-amber-200 bg-amber-50/20"
                  : changed
                    ? "border-blue-200 bg-blue-50/20"
                    : comments.length > 0
                      ? "border-emerald-200 bg-emerald-50/15"
                      : "border-sibs-border bg-white"
            }`}
          >
            {sectionHasActiveComment && remainingSectionComments.length > 0 && (
              <div className="mb-3 flex items-center gap-2 rounded-[10px] border border-orange-200 bg-white/85 px-3 py-2 text-[11px] font-extrabold text-orange-700">
                <MessageSquareText size={14} strokeWidth={2.4} />
                Selected reviewer comment applies to this section
              </div>
            )}
            {isCompetencySectionType ? (
              <CompetenciesDraftTable form={form} setForm={setForm} />
            ) : isPersonalityPickerSection ? (
              <PersonalityDraftPicker form={form} setForm={setForm} />
            ) : (
              <textarea
                value={draftValue}
                onChange={(event) => updateDraft(event.target.value)}
                rows={Math.max(5, String(draftValue || "").split("\n").length + 2)}
                className="min-h-[150px] w-full resize-y border-0 bg-transparent p-0 text-[14px] font-medium leading-8 text-sibs-text-secondary outline-none placeholder:text-sibs-muted"
                placeholder={`Write the revised ${section.label.toLowerCase()} here...`}
              />
            )}
          </div>

          {comments.length > 0 && (
            <div
              className={`flex flex-wrap items-center justify-between gap-3 rounded-[10px] border px-3 py-2.5 ${
                remainingSectionComments.length > 0
                  ? "border-amber-100 bg-amber-50/45"
                  : "border-emerald-100 bg-emerald-50/45"
              }`}
            >
              <p
                className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                  remainingSectionComments.length > 0
                    ? "text-amber-800"
                    : "text-emerald-700"
                }`}
              >
                {remainingSectionComments.length > 0 ? (
                  <MessageSquareText size={13} />
                ) : (
                  <CheckCircle2 size={13} />
                )}
                {addressedSectionComments} of {comments.length} reviewer comment
                {comments.length === 1 ? "" : "s"} addressed
              </p>

              {!changed && remainingSectionComments.length > 0 && (
                <p className="text-xs font-bold text-sibs-muted">
                  Update the highlighted content to address the comment.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function RevisionCommentsRail({
  comments = [],
  activeCommentKey,
  item,
  form,
  baselineForm = {},
  isCommentAddressed,
  isCommentLocallyAddressed,
  onOpenComment,
  onToggleCommentAddressed,
  onPreviousIssue,
  onNextIssue,
  addressedCount = 0,
  remainingCount = 0,
}) {
  if (!comments.length) {
    return (
      <aside className="rounded-[14px] border border-sibs-border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <MessageSquareText size={17} className="text-sibs-primary-1" />
          <h3 className="text-sm font-extrabold text-sibs-primary-1">
            Reviewer Comments
          </h3>
        </div>

        <p className="mt-3 text-xs font-semibold leading-5 text-sibs-muted">
          No reviewer comments were found for this revision.
        </p>
      </aside>
    );
  }

  const progressPercent = comments.length
    ? Math.round((addressedCount / comments.length) * 100)
    : 100;

  return (
    <aside className="overflow-hidden rounded-[14px] border border-sibs-border-panel bg-white shadow-sm xl:flex xl:max-h-[calc(100dvh-218px)] xl:min-h-0 xl:flex-col">
      <div className="shrink-0 border-b border-sibs-border px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-orange-50 text-orange-600">
                <MessageSquareText size={15} strokeWidth={2.4} />
              </span>
              <h3 className="text-sm font-extrabold text-sibs-primary-1">
                Reviewer Comments
              </h3>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold">
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 size={12} />
                {addressedCount} addressed
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-700">
                <MessageSquareText size={12} />
                {remainingCount} remaining
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sibs-canvas">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onPreviousIssue}
            disabled={remainingCount === 0}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[10px] border border-sibs-border-subtle bg-white px-2 text-[10px] font-bold text-sibs-primary-1 transition hover:bg-sibs-surface disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={13} />
            Previous
          </button>

          <button
            type="button"
            onClick={onNextIssue}
            disabled={remainingCount === 0}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[10px] border border-sibs-border-subtle bg-white px-2 text-[10px] font-bold text-sibs-primary-1 transition hover:bg-sibs-surface disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      <div className="thin-scroll max-h-[calc(100dvh-275px)] space-y-2 overflow-y-auto overscroll-contain p-3 xl:min-h-0 xl:max-h-none xl:flex-1">
        {comments.map((comment, index) => {
          const commentKey = getCommentStableKey(comment);
          const sectionKey = resolveRevisionCommentSectionKey(comment);
          const section = REVISION_SECTIONS.find(
            (candidate) => candidate.key === sectionKey,
          );
          const targetChanged = isRevisionCommentTargetChanged(
            item,
            form,
            comment,
            baselineForm,
          );
          const addressed = isCommentAddressed(comment);
          const selectedText = getRevisionCommentSelectedText(comment);
          const backendResolved = isRevisionCommentResolved(comment);
          const locallyAddressed = isCommentLocallyAddressed(comment);

          return (
            <article
              key={`${commentKey}-${index}`}
              className={`rounded-[10px] border border-l-4 p-3 transition ${
                activeCommentKey === commentKey
                  ? addressed
                    ? "border-emerald-300 border-l-emerald-500 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-100"
                    : "border-orange-300 border-l-orange-500 bg-orange-50/70 shadow-sm ring-1 ring-orange-100"
                  : addressed
                    ? "border-emerald-100 border-l-emerald-400 bg-emerald-50/25"
                    : "border-sibs-border-subtle border-l-amber-400 bg-white hover:border-orange-200 hover:border-l-orange-500 hover:bg-orange-50/20"
              }`}
            >
              <button
                type="button"
                onClick={() => onOpenComment(comment)}
                className="block w-full text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide ${
                        addressed
                          ? "text-emerald-700"
                          : activeCommentKey === commentKey
                            ? "text-orange-700"
                            : "text-sibs-primary-1/70"
                      }`}
                    >
                      {addressed ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <MessageSquareText size={12} />
                      )}
                      {section?.label || "General Comment"}
                    </p>

                    <p className="mt-1.5 flex items-start gap-1.5 text-xs font-bold leading-5 text-sibs-text-secondary">
                      <span
                        className={`mt-[2px] shrink-0 ${
                          addressed ? "text-emerald-600" : "text-orange-600"
                        }`}
                      >
                        {addressed ? (
                          <Check size={13} />
                        ) : (
                          <MessageSquareText size={13} />
                        )}
                      </span>
                      <span>
                        {getReviewerCommentText(comment) ||
                          "No revision comment provided."}
                      </span>
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                      addressed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : activeCommentKey === commentKey
                          ? "border-orange-300 bg-orange-100 text-orange-700"
                          : "border-amber-300 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {addressed
                      ? "Addressed"
                      : activeCommentKey === commentKey
                        ? "Current"
                        : "Open"}
                  </span>
                </div>

                {selectedText && (
                  <div className="mt-2 rounded-[10px] border border-white/80 bg-white/80 px-2.5 py-2">
                    <p className="line-clamp-2 text-[11px] font-semibold leading-5 text-sibs-muted" title={selectedText}>
                      “{selectedText}”
                    </p>
                  </div>
                )}
              </button>

              {!backendResolved && (
                <div className="mt-3 border-t border-black/5 pt-2.5">
                  {locallyAddressed ? (
                    <button
                      type="button"
                      onClick={() => onToggleCommentAddressed(comment)}
                      className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-[10px] border border-sibs-border-subtle bg-white px-3 text-[11px] font-extrabold text-sibs-primary-1 transition hover:bg-sibs-surface"
                    >
                      <RotateCcw size={13} />
                      Reopen Comment
                    </button>
                  ) : targetChanged ? (
                    <button
                      type="button"
                      onClick={() => onToggleCommentAddressed(comment)}
                      className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-[10px] bg-emerald-600 px-3 text-[11px] font-extrabold text-white transition hover:bg-emerald-700"
                    >
                      <CheckCircle2 size={13} />
                      Mark Addressed
                    </button>
                  ) : (
                    <div className="flex items-start gap-2 rounded-[10px] bg-sibs-surface px-2.5 py-2 text-[10px] font-semibold leading-4 text-sibs-muted">
                      <MessageSquareText
                        size={13}
                        className="mt-0.5 shrink-0 text-amber-600"
                      />
                      Update the highlighted content to enable resolution.
                    </div>
                  )}
                </div>
              )}

              {backendResolved && (
                <div className="mt-3 flex items-center justify-center gap-1.5 border-t border-emerald-100 pt-2.5 text-[11px] font-extrabold text-emerald-700">
                  <CheckCircle2 size={14} />
                  Addressed
                </div>
              )}
            </article>
          );
        })}
      </div>
    </aside>
  );
}

export default function ReviseJobDescriptionModal({
  open,
  item,
  form,
  setForm,
  initialSection = "recordInformation",
  onClose,
  onSubmit,
}) {
  const {
    selectedJobDescription,
    revisionComments,
    loadRevisionComments,
    saveRevision,
    revisionSaving,
    revisionSaveError,
    revisionCommentsLoading,
    accounts = [],
    setAccounts,
    departments = [],
    setDepartments,
    setDropdownLoading,
  } = useJobDescription();

  useEffect(() => {
    if (!open) return;
    if (accounts.length > 0 && departments.length > 0) return;

    let cancelled = false;

    async function ensureDropdowns() {
      try {
        setDropdownLoading?.(true);
        const result = await getJobDescriptionDropdowns();
        if (cancelled || !result?.success) return;

        setAccounts?.(result.accounts || []);
        setDepartments?.(result.departments || []);
      } catch (err) {
        console.error("Failed to load dropdowns in ReviseModal:", err);
      } finally {
        if (!cancelled) {
          setDropdownLoading?.(false);
        }
      }
    }

    ensureDropdowns();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    accounts.length,
    departments.length,
    setAccounts,
    setDepartments,
    setDropdownLoading,
  ]);

  const activeItem = item || selectedJobDescription || {};

  const sectionRefs = useRef({});
  const contentScrollRef = useRef(null);
  const documentScrollRef = useRef(null);

  const [activeSection, setActiveSection] = useState(
    initialSection || "recordInformation",
  );
  const [submitError, setSubmitError] = useState("");
  const [reviewSaveOpen, setReviewSaveOpen] = useState(false);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [addressedCommentKeys, setAddressedCommentKeys] = useState(() => new Set());
  const [originalSections, setOriginalSections] = useState(() => new Set());
  const [baselineForm, setBaselineForm] = useState({});
  const [activeCommentKey, setActiveCommentKey] = useState("");

  const progress = useMemo(
    () => getRevisionProgressAgainstBaseline(activeItem, baselineForm, form),
    [activeItem, baselineForm, form],
  );

  const totalComments = Array.isArray(revisionComments)
    ? revisionComments.length
    : 0;

  function isCommentLocallyAddressed(comment = {}) {
    return addressedCommentKeys.has(getCommentStableKey(comment));
  }

  function isCommentAddressed(comment = {}) {
    if (isRevisionCommentResolved(comment)) return true;

    return (
      isRevisionCommentTargetChanged(
        activeItem,
        form,
        comment,
        baselineForm,
      ) &&
      addressedCommentKeys.has(getCommentStableKey(comment))
    );
  }

  const remainingComments = useMemo(
    () =>
      (Array.isArray(revisionComments) ? revisionComments : []).filter(
        (comment) => !isCommentAddressed(comment),
      ),
    // addressedCommentKeys is intentionally part of the dependency list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      activeItem,
      baselineForm,
      form,
      revisionComments,
      addressedCommentKeys,
    ],
  );

  const unresolvedIssueCount = remainingComments.length;
  const hasUnresolvedIssues = unresolvedIssueCount > 0;
  const addressedCommentCount = Math.max(totalComments - unresolvedIssueCount, 0);

  const changedSections = useMemo(
    () =>
      REVISION_SECTIONS.filter((section) =>
        isRevisionSectionChangedAgainstBaseline(
          activeItem,
          baselineForm,
          form,
          section,
        ),
      ),
    [activeItem, baselineForm, form],
  );

  const jdCode =
    activeItem.jdCode ||
    activeItem.jd_code ||
    activeItem.raw?.jdCode ||
    activeItem.raw?.jd_code ||
    "JD";

  const documentTitle =
    activeItem.documentTitle ||
    activeItem.document_title ||
    activeItem.title ||
    activeItem.roleTitle ||
    activeItem.role_title ||
    "Job Description";

  const footerVersion =
    activeItem.currentVersion ||
    activeItem.current_version ||
    activeItem.revisionNo ||
    activeItem.revision_no ||
    activeItem.version ||
    "1";

  const hasUnsavedRevisionWork =
    progress.changed > 0 ||
    addressedCommentKeys.size > 0 ||
    Boolean(cleanText(form?.revisionRemarks));

  useEffect(() => {
    if (!open) return;

    const resolvedId =
      activeItem.id ||
      activeItem.rawId ||
      activeItem.raw_id ||
      activeItem.jdId ||
      activeItem.jd_id ||
      "";

    if (!resolvedId) return;

    loadRevisionComments?.(resolvedId);
  }, [
    open,
    activeItem?.id,
    activeItem?.rawId,
    activeItem?.raw_id,
    activeItem?.jdId,
    activeItem?.jd_id,
    loadRevisionComments,
  ]);

  useEffect(() => {
    if (!open || !activeItem) return;

    const defaults = getRevisionFormDefaults(activeItem);
    const currentPreparedFor = cleanText(
      defaults.preparedFor || defaults.account || "",
    );
    const matchedAccount = (Array.isArray(accounts) ? accounts : []).find(
      (account) =>
        normalizeCompareText(
          account?.gy_acc_name ||
            account?.name ||
            account?.accountName ||
            account?.account_name ||
            "",
        ) === normalizeCompareText(currentPreparedFor),
    );
    const matchedAccountId = cleanText(
      matchedAccount?.gy_acc_id ||
        matchedAccount?.id ||
        matchedAccount?.accountId ||
        matchedAccount?.account_id ||
        defaults.accountId ||
        "",
    );

    const seededForm = {
      ...Object.fromEntries(
        Object.entries(defaults).map(([key, value]) => [
          key,
          REVISION_TEXT_FORM_KEYS.has(key)
            ? richTextToPlainText(value)
            : value,
        ]),
      ),
      accountId: matchedAccountId,
      account_id: matchedAccountId,
      preparedForId: matchedAccountId,
    };

    setBaselineForm(seededForm);
    setForm((previous) => ({
      ...seededForm,
      revisionRemarks: previous?.revisionRemarks || "",
    }));
  }, [open, activeItem?.id, accounts, setForm]);

  useEffect(() => {
    if (!open) return;

    const targetSection = initialSection || "recordInformation";
    setActiveSection(targetSection);
    setSubmitError("");
    setReviewSaveOpen(false);
    setExitConfirmOpen(false);
    setAddressedCommentKeys(new Set());
    setOriginalSections(new Set());
    setActiveCommentKey("");

    requestAnimationFrame(() => {
      if (targetSection && targetSection !== "recordInformation") {
        scrollToRevisionSection(targetSection);
      } else {
        if (contentScrollRef.current) {
          contentScrollRef.current.scrollTop = 0;
        }

        if (documentScrollRef.current) {
          documentScrollRef.current.scrollTop = 0;
        }
      }
    });
  }, [open, initialSection]);

  useEffect(() => {
    if (!open || !Array.isArray(revisionComments) || revisionComments.length === 0) {
      return;
    }

    setActiveCommentKey((previous) => {
      const previousStillExists = revisionComments.some(
        (comment) => getCommentStableKey(comment) === previous,
      );

      if (previousStillExists) return previous;

      const firstOpenComment = revisionComments.find(
        (comment) => !isRevisionCommentResolved(comment),
      );

      return getCommentStableKey(firstOpenComment || revisionComments[0]);
    });
  }, [open, revisionComments]);

  function handleWorkspaceBackgroundWheel(event) {
    const container = contentScrollRef.current;

    if (!container || event.target !== event.currentTarget || !event.deltaY) {
      return;
    }

    // The empty left/right workspace gutters are part of the revision
    // viewport. Explicitly forward wheel/touchpad movement to the main
    // document scroller so those areas never feel "dead".
    event.preventDefault();
    container.scrollBy({
      top: event.deltaY,
      left: 0,
      behavior: "auto",
    });
  }

  function scrollToRevisionSection(sectionKey = "") {
    const resolvedSectionKey =
      REVISION_SECTIONS.some((section) => section.key === sectionKey)
        ? sectionKey
        : "recordInformation";

    setActiveSection(resolvedSectionKey);

    requestAnimationFrame(() => {
      const container = contentScrollRef.current;
      const target = sectionRefs.current?.[resolvedSectionKey];

      if (!container || !target) return;

      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      container.scrollTo({
        top: Math.max(
          container.scrollTop + targetRect.top - containerRect.top - 20,
          0,
        ),
        behavior: "smooth",
      });
    });
  }

  function openRevisionComment(comment = {}) {
    const sectionKey = resolveRevisionCommentSectionKey(comment);
    setActiveCommentKey(getCommentStableKey(comment));
    scrollToRevisionSection(sectionKey);
  }

  function toggleOriginalSection(sectionKey) {
    setOriginalSections((previous) => {
      const next = new Set(previous);

      if (next.has(sectionKey)) {
        next.delete(sectionKey);
      } else {
        next.add(sectionKey);
      }

      return next;
    });
  }

  function toggleCommentAddressed(comment) {
    if (isRevisionCommentResolved(comment)) return;

    const commentKey = getCommentStableKey(comment);
    const targetChanged = isRevisionCommentTargetChanged(
      activeItem,
      form,
      comment,
      baselineForm,
    );

    setAddressedCommentKeys((previous) => {
      const next = new Set(previous);

      if (next.has(commentKey)) {
        next.delete(commentKey);
        return next;
      }

      if (!targetChanged) {
        return previous;
      }

      next.add(commentKey);
      return next;
    });
  }


  function goToAdjacentIssue(direction = 1) {
    if (!remainingComments.length) return;

    const currentIndex = remainingComments.findIndex(
      (comment) => getCommentStableKey(comment) === activeCommentKey,
    );

    const startIndex = currentIndex >= 0 ? currentIndex : -1;
    const nextIndex =
      direction < 0
        ? Math.max(startIndex - 1, 0)
        : Math.min(startIndex + 1, remainingComments.length - 1);

    const targetComment =
      currentIndex < 0 && direction >= 0
        ? remainingComments[0]
        : remainingComments[nextIndex];

    setActiveCommentKey(getCommentStableKey(targetComment));
    scrollToRevisionSection(
      resolveRevisionCommentSectionKey(targetComment),
    );
  }

  function requestExitRevision() {
    if (!hasUnsavedRevisionWork) {
      onClose?.();
      return;
    }

    setExitConfirmOpen(true);
  }

  function openReviewSave() {
    setSubmitError("");

    if (hasUnresolvedIssues) {
      setSubmitError(
        `${unresolvedIssueCount} reviewer comment${
          unresolvedIssueCount === 1 ? "" : "s"
        } still need to be addressed.`,
      );

      const firstRemaining = remainingComments[0];

      if (firstRemaining) {
        scrollToRevisionSection(
          resolveRevisionCommentSectionKey(firstRemaining),
        );
      }

      return;
    }

    if (progress.changed === 0) {
      setSubmitError(
        "No changes detected yet. Update at least one document section before saving.",
      );
      return;
    }

    setReviewSaveOpen(true);
  }

  async function handleRevisionSubmit(event) {
    event?.preventDefault?.();

    if (revisionSaving) return;

    setSubmitError("");

    const resolvedJdId =
      activeItem.rawId ||
      activeItem.raw_id ||
      activeItem.id ||
      activeItem.jdId ||
      activeItem.jd_id ||
      "";

    if (!resolvedJdId) {
      setSubmitError("Invalid job description ID.");
      return;
    }

    if (hasUnresolvedIssues) {
      setSubmitError(
        `${unresolvedIssueCount} reviewer comment${
          unresolvedIssueCount === 1 ? "" : "s"
        } still need to be addressed before saving.`,
      );
      setReviewSaveOpen(false);
      return;
    }

    if (progress.changed === 0) {
      setSubmitError(
        "No changes detected yet. Update at least one document section before saving.",
      );
      setReviewSaveOpen(false);
      return;
    }

    if (!cleanText(form.revisionRemarks)) {
      setSubmitError("Revision remarks are required before saving.");
      return;
    }

    const submittedComments = (Array.isArray(revisionComments)
      ? revisionComments
      : []
    ).map((comment) => {
      if (
        isRevisionCommentResolved(comment) ||
        !addressedCommentKeys.has(getCommentStableKey(comment))
      ) {
        return comment;
      }

      return {
        ...comment,
        status: "Addressed",
      };
    });

    const result = await saveRevision(resolvedJdId, {
      ...form,
      comments: submittedComments,
      revisionComments: submittedComments,
    });

    if (!result?.success) {
      setSubmitError(result?.message || "Failed to save revision.");
      return;
    }

    setReviewSaveOpen(false);
    onSubmit?.(result);
    onClose?.();
  }

  if (!open) return null;

  return (
    <div className="sibs-modal-backdrop-in fixed inset-0 z-[99999] flex min-h-0 flex-col overflow-hidden bg-sibs-canvas font-jakarta text-sibs-primary-1">
      <form
        onSubmit={handleRevisionSubmit}
        className="flex h-full min-h-0 flex-col"
      >
        <header className="shrink-0 border-b border-sibs-border bg-white px-4 py-3 sm:px-6 sm:py-4">
          <div className="mx-auto flex w-full max-w-[1760px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1/70">
                  Job Description Overview
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-extrabold uppercase text-sibs-orange">
                  <GitCompare size={13} />
                  Revision Mode
                </span>
              </div>

              <h1 className="mt-1 break-words text-base font-extrabold leading-tight text-sibs-primary-1 sm:text-xl">
                {jdCode} • {documentTitle}
              </h1>

              <p className="mt-1 text-xs font-semibold text-sibs-text-secondary sm:text-sm">
                {activeItem.department || "—"} •{" "}
                {activeItem.account ||
                  activeItem.preparedFor ||
                  activeItem.prepared_for ||
                  "—"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <div
                className={`inline-flex h-9 items-center gap-2 rounded-[10px] border px-3 text-xs font-bold ${
                  hasUnresolvedIssues
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                <MessageSquareText size={15} />
                {hasUnresolvedIssues
                  ? `${unresolvedIssueCount} comment${
                      unresolvedIssueCount === 1 ? "" : "s"
                    } remaining`
                  : "All comments addressed"}
              </div>
            </div>
          </div>
        </header>

        <main
          ref={contentScrollRef}
          onWheel={handleWorkspaceBackgroundWheel}
          className="thin-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5 sm:py-6 lg:px-8"
        >
          <div className="mx-auto grid w-full max-w-[1540px] items-start gap-5 xl:grid-cols-[minmax(0,1120px)_360px]">
            <div
              ref={documentScrollRef}
              className="min-w-0"
            >
              <article className="overflow-hidden bg-white px-5 py-5 shadow-[0_18px_55px_rgba(15,23,42,0.12)] sm:px-8 sm:py-7 lg:min-h-[1056px] lg:px-10">
              <section className="mb-6 overflow-hidden rounded-[10px] border border-sibs-border-panel bg-sibs-surface">
                <div className="flex items-start gap-3 border-l-4 border-l-orange-500 px-4 py-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-orange-50 text-orange-600">
                    <GitCompare size={15} strokeWidth={2.4} />
                  </span>

                  <div className="min-w-0">
                    <h2 className="text-xs font-extrabold text-sibs-primary-1 sm:text-sm">
                      Revision in progress
                    </h2>

                    <p className="mt-0.5 text-[11px] font-semibold leading-5 text-sibs-muted sm:text-xs">
                      Orange marks reviewer attention, blue marks your changes, and green marks addressed comments. Use Show Original only when you need to compare the saved version.
                    </p>
                  </div>
                </div>
              </section>

              {(submitError || revisionSaveError) && (
                <div className="mb-6 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {submitError || revisionSaveError}
                </div>
              )}

              {revisionCommentsLoading && (
                <div className="mb-6 flex items-center gap-2 rounded-[10px] border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-bold text-sibs-primary-1">
                  <Loader2 size={15} className="animate-spin" />
                  Loading reviewer comments...
                </div>
              )}

              <div className="space-y-8">
                {REVISION_SECTIONS.map((section, index) => (
                  <RevisionDocumentSection
                    key={section.key}
                    section={section}
                    sectionIndex={index}
                    item={activeItem}
                    form={form}
                    baselineForm={baselineForm}
                    setForm={setForm}
                    comments={getSectionComments(
                      section.key,
                      revisionComments,
                    )}
                    sectionRef={(element) => {
                      sectionRefs.current[section.key] = element;
                    }}
                    showOriginal={originalSections.has(section.key)}
                    onToggleOriginal={() =>
                      toggleOriginalSection(section.key)
                    }
                    isCommentAddressed={isCommentAddressed}
                    activeCommentKey={activeCommentKey}
                  />
                ))}
              </div>
              </article>
            </div>

            <div className="min-w-0 xl:sticky xl:top-0 xl:self-start xl:mb-4">
              <RevisionCommentsRail
                comments={revisionComments}
                activeCommentKey={activeCommentKey}
                item={activeItem}
                form={form}
                baselineForm={baselineForm}
                isCommentAddressed={isCommentAddressed}
                isCommentLocallyAddressed={isCommentLocallyAddressed}
                onOpenComment={openRevisionComment}
                onToggleCommentAddressed={toggleCommentAddressed}
                onPreviousIssue={() => goToAdjacentIssue(-1)}
                onNextIssue={() => goToAdjacentIssue(1)}
                addressedCount={addressedCommentCount}
                remainingCount={unresolvedIssueCount}
              />
            </div>
          </div>
        </main>

        <footer className="shrink-0 border-t border-sibs-border bg-white px-4 py-3 sm:px-6">
          <div className="mx-auto flex w-full max-w-[1760px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-sibs-muted sm:text-xs">
                Document Code:{" "}
                <span className="font-extrabold text-sibs-primary-1">
                  {jdCode}
                </span>
                <span className="mx-1 text-sibs-faint">•</span>
                Current Version:{" "}
                <span className="font-extrabold text-sibs-primary-1">
                  v{footerVersion}
                </span>
              </p>

              <p
                className={`mt-0.5 text-[11px] font-bold ${
                  hasUnresolvedIssues ? "text-amber-700" : "text-emerald-700"
                }`}
              >
                {hasUnresolvedIssues
                  ? `${unresolvedIssueCount} comment${
                      unresolvedIssueCount === 1 ? "" : "s"
                    } must be addressed before this revision can be reviewed.`
                  : progress.changed === 0
                    ? "Update at least one document section before reviewing this revision."
                    : "All reviewer comments addressed. Ready for final review."}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={requestExitRevision}
                className="inline-flex h-9 items-center justify-center rounded-[10px] border border-sibs-border-subtle bg-white px-4 text-xs font-bold text-sibs-primary-1 transition hover:bg-sibs-surface"
              >
                Exit Revision
              </button>

              <button
                type="button"
                onClick={openReviewSave}
                disabled={
                  revisionSaving ||
                  hasUnresolvedIssues ||
                  progress.changed === 0
                }
                className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] bg-sibs-orange px-4 text-xs font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                title={
                  hasUnresolvedIssues
                    ? "Address all reviewer comments first."
                    : progress.changed === 0
                      ? "Update at least one section first."
                      : "Review and save this revision."
                }
              >
                <Save size={15} />
                Review & Save
              </button>
            </div>
          </div>
        </footer>

        <ModalShell
          open={reviewSaveOpen}
          onClose={() => setReviewSaveOpen(false)}
          title="Review Revision"
          subtitle="Confirm the changed sections and summarize what was revised."
          variant="navy"
          maxWidth="max-w-2xl"
          footer={
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end w-full">
              <button
                type="button"
                onClick={() => setReviewSaveOpen(false)}
                disabled={revisionSaving}
                className="sibs-btn-secondary inline-flex h-10 items-center justify-center rounded-[10px] px-5 text-sm font-bold disabled:opacity-50"
              >
                Back to Revision
              </button>

              <button
                type="button"
                onClick={handleRevisionSubmit}
                disabled={
                  revisionSaving || !cleanText(form.revisionRemarks)
                }
                className="sibs-btn-primary inline-flex h-10 items-center justify-center gap-2 rounded-[10px] px-5 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {revisionSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}

                {revisionSaving ? "Saving..." : "Save Revision"}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-[10px] border border-sibs-border bg-sibs-surface px-4 py-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">
                  Changed Sections
                </p>
                <p className="mt-1 text-xl font-extrabold text-sibs-primary-1">
                  {changedSections.length}
                </p>
              </div>

              <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">
                  Comments Addressed
                </p>
                <p className="mt-1 text-xl font-extrabold text-emerald-700">
                  {addressedCommentCount}/{totalComments}
                </p>
              </div>

              <div className="rounded-[10px] border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-blue-700">
                  Current Version
                </p>
                <p className="mt-1 text-xl font-extrabold text-blue-700">
                  v{footerVersion}
                </p>
              </div>
            </div>

            <div className="rounded-[10px] border border-sibs-border bg-white px-4 py-4">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Changed Sections
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {changedSections.map((section) => (
                  <span
                    key={section.key}
                    className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold text-blue-700"
                  >
                    {section.label}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-extrabold text-sibs-primary-1">
                Revision Remarks <span className="text-red-500">*</span>
              </label>

              <textarea
                value={form.revisionRemarks || ""}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    revisionRemarks: event.target.value,
                  }))
                }
                rows={5}
                placeholder="Summarize what was changed and why..."
                className="w-full resize-y rounded-[10px] border border-sibs-border-subtle bg-white px-4 py-3 text-sm font-semibold leading-6 text-sibs-primary-1 outline-none transition placeholder:text-sibs-faint focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
              />
            </div>

            {(submitError || revisionSaveError) && (
              <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {submitError || revisionSaveError}
              </div>
            )}
          </div>
        </ModalShell>

        <ConfirmModal
          open={exitConfirmOpen}
          onClose={() => setExitConfirmOpen(false)}
          onConfirm={() => {
            setExitConfirmOpen(false);
            onClose?.();
          }}
          title="Exit revision mode?"
          description="Your unsaved revision changes and local addressed-comment progress will be discarded."
          confirmLabel="Discard & Exit"
          cancelLabel="Continue Revising"
          variant="danger"
          icon={AlertTriangle}
        />
      </form>
    </div>
  );
}
