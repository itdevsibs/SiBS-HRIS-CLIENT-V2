import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
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
import SearchDropdown from "../../layout/dropdown/SearchDropdown";
import SingleSelectDropdown from "../../layout/dropdown/SingleSelectDropdown";

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
    aliases: ["preparedFor", "prepared_for", "account"],
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
    aliases: ["effectiveDate", "effective_date"],
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
    helper: "Compare key document details and tracking information.",
    type: "record",
  },
  {
    key: "description",
    formKey: "description",
    label: "Position Overview",
    helper: "Compare the current position summary with the revised version.",
    type: "text",
  },
  {
    key: "responsibilities",
    formKey: "responsibilities",
    label: "Duties & Responsibilities",
    helper: "Update the duties based on the reviewer comments.",
    type: "text",
  },
  {
    key: "qualifications",
    formKey: "qualifications",
    label: "Qualifications & Characteristics",
    helper: "Revise qualification requirements and characteristics.",
    type: "text",
  },
  {
    key: "education",
    formKey: "education",
    label: "Education",
    helper: "Revise the minimum education requirements for this position.",
    type: "text",
  },
  {
    key: "experience",
    formKey: "experience",
    label: "Experience",
    helper: "Revise the required operational or industry experience.",
    type: "text",
  },
  {
    key: "certificationsAffiliations",
    formKey: "certificationsAffiliations",
    label: "Certifications and Affiliations",
    helper: "Revise required or preferred certifications and affiliations.",
    type: "text",
  },
  {
    key: "personalityType",
    formKey: "personalityType",
    label: "Preferred Personality Type",
    helper: "Update the preferred personality type based on reviewer comments.",
    type: "personalityPicker",
  },
  {
    key: "competencies",
    formKey: "competenciesText",
    label: "Desired Competencies",
    helper: "Update the expected competency requirements for this position.",
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
  "mb-1 block text-sm font-medium text-sibs-primary-1";

const REVISION_INPUT_CLASS =
  "w-full rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm text-sibs-primary-1 outline-none focus:border-[var(--sibs-primary-1)]";

const REVISION_TEXTAREA_CLASS =
  "min-h-[260px] flex-1 resize-none rounded-xl border border-[#9BB0C7] bg-white px-4 py-3 text-sm font-medium leading-7 text-[#0D4676] outline-none transition placeholder:text-[#8AA0B8] focus:border-sibs-primary-1 focus:ring-2 focus:ring-blue-100";

const REVISION_DISPLAY_VALUE_CLASS =
  "mt-2 block max-w-full overflow-x-auto whitespace-nowrap pb-1 text-sm font-bold leading-6 text-[#344054] [scrollbar-width:thin]";

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

  if (!parsed) return String(value || "");

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

function getRecordFieldValue(item = {}, field = {}) {
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
    return formatDateForInput(value);
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
        isRecordDateField(field) ? formatDateForInput(value) : value,
      ];
    }),
  );

  const competencies = normalizeCompetenciesForEditor(
    getCompetenciesArray(activeItem),
  );

  return {
    ...recordDefaults,
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
      <div className="whitespace-pre-wrap text-[14px] font-medium leading-8 text-[#344054]">
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
        <span className="inline-flex items-center self-center text-sm font-extrabold leading-none text-[#E6531B]">
          &gt;&gt;&gt;
        </span>{" "}
        <span
          className="inline rounded-md bg-[#FFF3B8] px-1.5 py-0.5 font-[inherit] leading-normal text-[#101828] ring-1 ring-amber-300"
          title={getReviewerCommentText(match.comment) || "Marked for revision"}
        >
          {text.slice(match.start, match.end)}
        </span>{" "}
        <span className="inline-flex items-center self-center text-sm font-extrabold leading-none text-[#E6531B]">
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
    <div className="whitespace-pre-wrap text-[14px] font-medium leading-8 text-[#344054]">
      {nodes}
    </div>
  );
}

function RevisionCommentCard({ comment, compact = false }) {
  return (
    <div
      className={`rounded-xl border border-amber-300 bg-amber-50 ${
        compact ? "px-3 py-3" : "px-4 py-4"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#E6531B]">
          Reviewer Comment
        </p>

        <span className="rounded-full border border-amber-300 bg-white px-2.5 py-1 text-[10px] font-extrabold uppercase text-[#E6531B]">
          {comment.status || "Open"}
        </span>
      </div>

      <div className="mt-3 rounded-lg border border-amber-300 bg-white/70 px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#FF5C28]" />

          <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#E6531B]">
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

function RecordCurrentView({ item = {}, comments = [] }) {
  const selectedTextComments = getSelectedTextComments(comments);

  return (
    <div className="grid w-full auto-rows-min grid-cols-1 content-start items-start gap-x-4 gap-y-5 sm:grid-cols-2">
      {getOrderedRecordFields().map((field) => {
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
              className={`min-h-[72px] overflow-hidden rounded-xl border px-4 py-3 ${
                hasComments
                  ? "border-amber-300 bg-[#FFF3B8]"
                  : "border-[#D7DEE8] bg-[#F8FAFC]"
              }`}
            >
              <p
                className={`text-[10px] font-extrabold uppercase tracking-wide ${
                  hasComments ? "text-[#E6531B]" : "text-sibs-primary-1/70"
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
        className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-left text-sm text-sibs-primary-1 outline-none transition ${
          open ? "border-[var(--sibs-primary-1)]" : "border-sibs-tertiary-8"
        }`}
      >
        <span className={value ? "truncate" : "truncate text-[#8AA0B8]"}>
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
        <div className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-xl border border-sibs-tertiary-8 bg-white shadow-xl">
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
                className={`flex w-full items-center border-b border-[#D7DEE8] px-4 py-3 text-left text-sm font-semibold transition last:border-b-0 ${
                  selected
                    ? "bg-[#EAF2FB] text-sibs-primary-1"
                    : "bg-white text-sibs-primary-1 hover:bg-[#F8FAFC]"
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
    <div className="h-[46px] w-full overflow-hidden rounded-xl border border-sibs-tertiary-8 bg-gray-50 shadow-sm">
      <div className="relative grid h-full grid-cols-2">
        <span
          className={`absolute left-0 top-0 z-0 h-full w-1/2 rounded-xl bg-sibs-primary-1 shadow-md transition-transform duration-300 ease-out ${
            isYes ? "translate-x-0" : "translate-x-full"
          }`}
        />

        <button
          type="button"
          onClick={() => onChange("Yes")}
          className={`relative z-10 h-full text-sm font-extrabold transition-colors duration-300 ${
            isYes ? "text-white" : "text-sibs-primary-1"
          }`}
        >
          Yes
        </button>

        <button
          type="button"
          onClick={() => onChange("No")}
          className={`relative z-10 h-full text-sm font-extrabold transition-colors duration-300 ${
            !isYes ? "text-white" : "text-sibs-primary-1"
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

function RecordDraftEditor({ form = {}, setForm }) {
  const {
    accounts = [],
    departments = [],
    dropdownLoading = false,
    linkedRequirementOptions = [],
  } = useJobDescription();

  const linkedRequirementRef = useRef(null);
  const accountSearchRef = useRef(null);
  const departmentSearchRef = useRef(null);

  const [linkedRequirementOpen, setLinkedRequirementOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [reportsToOpen, setReportsToOpen] = useState(false);

  const [accountSearch, setAccountSearch] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");

  function updateField(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function closeAllDropdowns() {
    setLinkedRequirementOpen(false);
    setAccountOpen(false);
    setDepartmentOpen(false);
    setReportsToOpen(false);
  }

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
                onFocus={closeAllDropdowns}
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
              <SearchDropdown
                refBox={accountSearchRef}
                label="Prepared For"
                value={form.preparedFor || form.account || ""}
                searchValue={accountSearch}
                setSearchValue={setAccountSearch}
                placeholder="Search account"
                open={accountOpen}
                setOpen={setAccountOpen}
                disabled={false}
                loading={dropdownLoading}
                loadingText="Loading accounts..."
                options={accounts}
                selectedValue={form.accountId || form.preparedForId || ""}
                getOptionValue={(item) => item.gy_acc_id}
                getOptionLabel={(item) => item.gy_acc_name}
                onBeforeOpen={() => {
                  setLinkedRequirementOpen(false);
                  setDepartmentOpen(false);
                  setReportsToOpen(false);
                }}
                onSelect={(selectedAccount) => {
                  setForm((prev) => ({
                    ...prev,
                    accountId: selectedAccount ? selectedAccount.gy_acc_id : "",
                    preparedForId: selectedAccount
                      ? selectedAccount.gy_acc_id
                      : "",
                    account: selectedAccount ? selectedAccount.gy_acc_name : "",
                    preparedFor: selectedAccount
                      ? selectedAccount.gy_acc_name
                      : "",
                  }));
                }}
                zIndex="z-[110]"
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
              <SearchDropdown
                refBox={departmentSearchRef}
                label="Department"
                value={form.department || ""}
                searchValue={departmentSearch}
                setSearchValue={setDepartmentSearch}
                placeholder="Search department"
                open={departmentOpen}
                setOpen={setDepartmentOpen}
                disabled={false}
                loading={dropdownLoading}
                loadingText="Loading departments..."
                options={departments}
                selectedValue={form.departmentId || ""}
                getOptionValue={(item) => item.id_department}
                getOptionLabel={(item) => item.name_department}
                onBeforeOpen={() => {
                  setLinkedRequirementOpen(false);
                  setAccountOpen(false);
                  setReportsToOpen(false);
                }}
                onSelect={(selectedDepartment) => {
                  setForm((prev) => ({
                    ...prev,
                    departmentId: selectedDepartment
                      ? selectedDepartment.id_department
                      : "",
                    department: selectedDepartment
                      ? selectedDepartment.name_department
                      : "",
                  }));
                }}
                zIndex="z-[100]"
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
              <SingleSelectDropdown
                refBox={linkedRequirementRef}
                label="Linked Hiring Requirement"
                value={getLinkedRequirementLabel(
                  form.linkedHiringRequirement,
                  linkedRequirementOptions,
                )}
                placeholder="Select existing job description"
                open={linkedRequirementOpen}
                setOpen={setLinkedRequirementOpen}
                disabled={false}
                options={linkedRequirementOptions}
                selectedValue={form.linkedHiringRequirement || ""}
                zIndex="z-[120]"
                onBeforeOpen={() => {
                  setAccountOpen(false);
                  setDepartmentOpen(false);
                  setReportsToOpen(false);
                }}
                onSelect={(value) => {
                  updateField("linkedHiringRequirement", value);
                  setLinkedRequirementOpen(false);
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
              <label className={REVISION_FIELD_LABEL_CLASS}>
                {field.label}
              </label>

              <select
                value={form.locationWorkSetup || ""}
                onFocus={closeAllDropdowns}
                onChange={(event) =>
                  updateField("locationWorkSetup", event.target.value)
                }
                className={`${REVISION_INPUT_CLASS} cursor-pointer`}
              >
                <option value="">Select location / work setup</option>
                {LOCATION_WORK_SETUP_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        if (field.key === "reportsTo") {
          return (
            <div
              key={field.key}
              className={getRecordDraftFieldStackClass(field.key)}
            >
              <label className={REVISION_FIELD_LABEL_CLASS}>
                {field.label}
              </label>

              <ReportsToDraftSelect
                value={form.reportsTo || ""}
                open={reportsToOpen}
                setOpen={setReportsToOpen}
                onBeforeOpen={() => {
                  setLinkedRequirementOpen(false);
                  setAccountOpen(false);
                  setDepartmentOpen(false);
                }}
                onChange={(value) => updateField("reportsTo", value)}
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

        return (
          <div
            key={field.key}
            className={`${getRecordDraftFieldStackClass(field.key)} self-start`}
          >
            <label className={REVISION_FIELD_LABEL_CLASS}>{field.label}</label>

            <input
              type={field.inputType}
              value={getRecordFieldInputValue(form, field)}
              onFocus={closeAllDropdowns}
              onChange={(event) => updateField(field.key, event.target.value)}
              className={`${REVISION_INPUT_CLASS} ${
                isRecordDateField(field) ? "font-semibold" : ""
              }`}
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
          : "border-[#D7DEE8] bg-white text-transparent"
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
          <span className="mr-1 inline font-extrabold text-[#E6531B]">
            &gt;&gt;&gt;
          </span>
        )}

        <span
          className="inline rounded-md bg-[#FFF3B8] px-1.5 py-0.5 font-[inherit] leading-[1.9] text-[#101828] ring-1 ring-amber-300 box-decoration-clone"
          title={getReviewerCommentText(match.comment) || "Marked for revision"}
        >
          {highlightedText}
        </span>

        {isEnd && (
          <span className="ml-1 inline font-extrabold text-[#E6531B]">
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
      <p className="whitespace-pre-line text-[15px] font-medium leading-7 text-[#344054]">
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
              <p className="text-sm font-extrabold leading-6 text-[#101828] selection:bg-[#FFF3B8] selection:text-[#101828]">
                <InlineCommentedText
                  text={line.text}
                  comments={comments}
                  boundaryMap={boundaryMap}
                />
              </p>
            ) : (
              <p className="whitespace-pre-line text-[15px] font-medium leading-7 text-[#344054] selection:bg-[#FFF3B8] selection:text-[#101828]">
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
    <div className="overflow-hidden rounded-xl border border-[#D7DEE8] bg-white selection:bg-[#FFF3B8] selection:text-[#101828]">
      <div className="hidden grid-cols-[minmax(0,1fr)_110px_110px_110px] border-b border-[#D7DEE8] bg-[#F8FAFC] md:grid">
        <div className="px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
          Competency for this Position
        </div>

        {proficiencyOptions.map((option) => (
          <div
            key={option}
            className="flex items-center justify-center border-l border-[#E6ECF2] px-3 py-3 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1"
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
        <div className="divide-y divide-[#E6ECF2]">
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
                <div className="px-4 py-5 selection:bg-[#FFF3B8] selection:text-[#101828] md:border-r md:border-[#E6ECF2]">
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
                    className="flex items-center justify-between gap-3 border-t border-[#E6ECF2] px-4 py-4 md:justify-center md:border-l md:border-t-0"
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
      className="block min-h-[90px] w-full resize-none rounded-xl border border-[#9BB0C7] bg-white px-4 py-3 text-sm font-medium leading-7 text-[#0D4676] outline-none transition placeholder:text-[#8AA0B8] focus:border-sibs-primary-1 focus:ring-2 focus:ring-blue-100"
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
      <div className="overflow-hidden rounded-xl border border-[#D7DEE8] bg-white">
        <div className="hidden grid-cols-[minmax(0,1fr)_110px_110px_110px_56px] border-b border-[#D7DEE8] bg-[#F8FAFC] md:grid">
          <div className="px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
            Competency for this Position
          </div>

          {proficiencyOptions.map((option) => (
            <div
              key={option}
              className="flex items-center justify-center border-l border-[#E6ECF2] px-3 py-3 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1"
            >
              {option}
            </div>
          ))}

          <div className="border-l border-[#E6ECF2] px-3 py-3" />
        </div>

        {competencies.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm font-semibold text-sibs-tertiary-5">
            No competencies added yet.
          </div>
        ) : (
          <div className="divide-y divide-[#E6ECF2]">
            {competencies.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_110px_110px_110px_56px]"
              >
                <div className="min-w-0 border-b border-[#E6ECF2] p-4 md:border-b-0 md:border-r">
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={item.title || ""}
                      onChange={(event) =>
                        handleChange(item.id, "title", event.target.value)
                      }
                      placeholder={`Competency ${index + 1} title`}
                      className="w-full rounded-xl border border-[#9BB0C7] bg-white px-4 py-3 text-sm font-semibold text-[#0D4676] outline-none transition placeholder:text-[#8AA0B8] focus:border-sibs-primary-1 focus:ring-2 focus:ring-blue-100"
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
                    className="flex items-center justify-center border-b border-[#E6ECF2] px-3 py-4 md:border-b-0 md:border-r"
                  >
                    <label className="flex cursor-pointer flex-col items-center gap-2">
                      <span className="text-sm font-semibold text-[#344054] md:hidden">
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
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
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
          ? "border-amber-300 bg-[#FFF3B8] text-[#101828]"
          : selected
            ? "border-sibs-primary-1 bg-sibs-primary-1 text-white"
            : "border-[#BFD6F6] bg-[#EAF2FB] text-sibs-primary-1"
      } ${onClick ? "cursor-pointer hover:border-sibs-primary-1" : ""}`}
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
              : "bg-white text-sibs-primary-1 hover:bg-blue-50"
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
      <div className="rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-4 py-4 text-sm font-semibold text-sibs-tertiary-5">
        No preferred personality type provided.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-4 py-4">
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
        className={`rounded-xl border bg-white transition ${
          open
            ? "border-sibs-primary-1 ring-2 ring-blue-100"
            : "border-[#9BB0C7]"
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
                className="inline-flex h-8 items-center justify-center rounded-full border border-red-100 bg-red-50 px-3 text-xs font-extrabold text-red-600 transition hover:bg-red-100"
              >
                Clear all
              </button>
            )}

            {selectedCodes.length === 0 ? (
              <span className="px-1 text-sm font-semibold text-[#8AA0B8]">
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
            className={`shrink-0 text-sibs-primary-1 transition ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {open && (
        <div className="mt-2 max-h-[280px] overflow-y-auto rounded-xl border border-[#9BB0C7] bg-white shadow-sm">
          {PERSONALITY_TYPE_OPTIONS.map((option) => {
            const selected = selectedCodes.includes(option.code);

            return (
              <button
                key={option.code}
                type="button"
                onClick={() => toggleCode(option.code)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold transition ${
                  selected
                    ? "bg-[#EAF2FB] text-sibs-primary-1"
                    : "bg-white text-sibs-primary-1 hover:bg-[#F8FAFC]"
                }`}
              >
                <span>
                  {option.code} ({option.label})
                </span>

                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                    selected
                      ? "border-sibs-primary-1 bg-sibs-primary-1 text-white"
                      : "border-[#9BB0C7] bg-white text-transparent"
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
          getOrderedRecordFields().map((field) => [
            field.key,
            isRecordDateField(field)
              ? formatDateForInput(getRecordFieldValue(item, field))
              : getRecordFieldValue(item, field),
          ]),
        ),
      }));

      return;
    }

    if (section.type === "personalityPicker") {
      setForm((prev) => ({
        ...prev,
        personalityType: getPersonalityTypeValue(item),
      }));

      return;
    }

    if (section.type === "competencyTable") {
      const competencies = normalizeCompetenciesForEditor(
        getCompetenciesArray(item),
      );

      setForm((prev) => ({
        ...prev,
        competencies,
        competenciesText: serializeCompetenciesFromRows(competencies),
      }));

      return;
    }

    updateDraft(currentValue);
  }

  return (
    <section
      ref={sectionRef}
      className="scroll-mt-3 overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm transition"
    >
      <div className="flex flex-col gap-3 border-b border-[#E6ECF2] bg-[#F8FAFC] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="sibs-modal-section-title text-[#101828]">
              {section.label}
            </h3>

            {comments.length > 0 && (
              <span className="rounded-full border border-amber-300 bg-[#FFF3B8] px-2.5 py-1 text-[11px] font-extrabold text-[#101828]">
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
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#D7DEE8] bg-white px-3 text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
        >
          <RotateCcw size={14} />
          Use Current
        </button>
      </div>

      <div className="grid grid-cols-1 items-stretch lg:grid-cols-2">
        <div className="flex flex-col border-b border-[#E6ECF2] bg-white lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-[#E6ECF2] px-4 py-3">
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
              className={`rounded-xl border border-[#D7DEE8] ${
                isCompetencySectionType || isPersonalityPickerSection
                  ? "bg-white p-0"
                  : "bg-[#F8FAFC] px-4 py-4"
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
          <div className="flex items-center justify-between border-b border-[#E6ECF2] px-4 py-3">
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

export default function ReviseJobDescriptionModal({
  open,
  item,
  form,
  setForm,
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
  } = useJobDescription();

  const activeItem = item || selectedJobDescription || {};

  const sectionRefs = useRef({});
  const sectionNavRef = useRef(null);
  const headerRef = useRef(null);
  const contentScrollRef = useRef(null);
  const lastScrollTopRef = useRef(0);
  const navHideActivatedRef = useRef(false);

  const [activeSection, setActiveSection] = useState("recordInformation");
  const [chromeVisible, setChromeVisible] = useState(true);
  const [submitError, setSubmitError] = useState("");

  async function handleRevisionSubmit(event) {
    event.preventDefault();

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
        `${unresolvedIssueCount} unresolved issue${
          unresolvedIssueCount === 1 ? "" : "s"
        } remaining. Update every section with reviewer comments before saving.`,
      );
      return;
    }

    if (progress.changed === 0) {
      setSubmitError(
        "No section changes detected yet. Edit the new revision side before saving.",
      );
      return;
    }

    if (!cleanText(form.revisionRemarks)) {
      setSubmitError("Revision remarks are required before saving.");
      return;
    }

    const result = await saveRevision(resolvedJdId, {
      ...form,
      comments: revisionComments,
      revisionComments,
    });

    if (!result?.success) {
      setSubmitError(result?.message || "Failed to save revision.");
      return;
    }

    onSubmit?.(result);
    onClose?.();
  }

  function scrollToRevisionSection(sectionKey = "") {
    setActiveSection(sectionKey);
    setChromeVisible(true);

    requestAnimationFrame(() => {
      const container = contentScrollRef.current;
      const target = sectionRefs.current?.[sectionKey];

      if (!container || !target) return;

      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const offset = 14;

      const nextScrollTop =
        container.scrollTop + targetRect.top - containerRect.top - offset;

      container.scrollTo({
        top: Math.max(nextScrollTop, 0),
        behavior: "smooth",
      });
    });
  }

  function handleRevisionEditorMouseMove(event) {
    const containerRect = event.currentTarget.getBoundingClientRect();
    const mouseY = event.clientY - containerRect.top;
    const containerHeight = containerRect.height;

    const upperRevealArea = 110;

    if (mouseY <= Math.min(upperRevealArea, containerHeight)) {
      setChromeVisible(true);
    }
  }

  function handleRevisionEditorScroll(event) {
    const scrollPanel = event.currentTarget;
    const currentScrollTop = scrollPanel.scrollTop;
    const lastScrollTop = lastScrollTopRef.current;
    const scrollDifference = currentScrollTop - lastScrollTop;
    const distanceFromBottom = Math.max(
      0,
      scrollPanel.scrollHeight - scrollPanel.clientHeight - currentScrollTop,
    );

    if (currentScrollTop <= 20) {
      navHideActivatedRef.current = false;
      setChromeVisible(true);
      lastScrollTopRef.current = currentScrollTop;
      return;
    }

    // Keep the chrome hidden at the end of the editor. Revealing it changes
    // the scroll viewport and can otherwise create a show/hide feedback loop.
    if (distanceFromBottom <= 24) {
      navHideActivatedRef.current = true;
      setChromeVisible(false);
      lastScrollTopRef.current = currentScrollTop;
      return;
    }

    if (Math.abs(scrollDifference) < 8) {
      lastScrollTopRef.current = currentScrollTop;
      return;
    }

    const scrollingDown = scrollDifference > 0;
    const scrollingUp = scrollDifference < 0;

    if (scrollingDown) {
      navHideActivatedRef.current = true;
      setChromeVisible(false);
      lastScrollTopRef.current = currentScrollTop;
      return;
    }

    if (scrollingUp) {
      setChromeVisible(true);
      lastScrollTopRef.current = currentScrollTop;
      return;
    }

    lastScrollTopRef.current = currentScrollTop;
  }

  const progress = useMemo(
    () => getRevisionProgress(activeItem, form),
    [activeItem, form],
  );

  const totalComments = Array.isArray(revisionComments)
    ? revisionComments.length
    : 0;

  const unresolvedIssues = useMemo(
    () => getUnresolvedRevisionIssues(activeItem, form, revisionComments),
    [activeItem, form, revisionComments],
  );

  const unresolvedIssueCount = unresolvedIssues.length;
  const hasUnresolvedIssues = unresolvedIssueCount > 0;

  useEffect(() => {
    if (!open || !activeItem?.id) return;

    loadRevisionComments?.(activeItem.id);
  }, [open, activeItem?.id, loadRevisionComments]);

  useEffect(() => {
    if (!open || !activeItem) return;

    const defaults = getRevisionFormDefaults(activeItem);

    setForm((prev) => ({
      ...prev,
      ...Object.fromEntries(
        Object.entries(defaults).map(([key, value]) => {
          const previousValue = prev?.[key];

          const shouldKeepPrevious = Array.isArray(previousValue)
            ? previousValue.length > 0
            : previousValue !== undefined && previousValue !== "";

          const nextValue = shouldKeepPrevious ? previousValue : value;

          return [
            key,
            REVISION_TEXT_FORM_KEYS.has(key)
              ? richTextToPlainText(nextValue)
              : nextValue,
          ];
        }),
      ),
    }));
  }, [open, activeItem?.id, setForm]);

  useEffect(() => {
    if (!open) return;

    setActiveSection("recordInformation");
    setChromeVisible(true);
    lastScrollTopRef.current = 0;
    navHideActivatedRef.current = false;

    requestAnimationFrame(() => {
      if (contentScrollRef.current) {
        contentScrollRef.current.scrollTop = 0;
      }
    });
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-[#F3F6FA] font-jakarta">
      <form
        onSubmit={handleRevisionSubmit}
        className="flex h-full min-h-0 flex-col"
      >
        <header
          ref={headerRef}
          className={`shrink-0 overflow-hidden border-b bg-white transition-all duration-300 ${
            chromeVisible
              ? "max-h-[260px] border-[#D9E2EC] opacity-100"
              : "max-h-0 border-transparent opacity-0"
          }`}
        >
          <div className="mx-auto w-full max-w-[1700px] px-4 pt-4 sm:px-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-[8.5px] 2xl:text-[9.5px] font-extrabold uppercase tracking-wide text-[#042C51]">
                    <GitCompare size={13} className="text-[#FF5C28]" />
                    Revision Editor
                  </span>

                  <span className="rounded-full border border-amber-300 bg-[#FFF3B8] px-2.5 py-0.5 text-[8.5px] 2xl:text-[9.5px] font-extrabold text-[#101828]">
                    {totalComments} reviewer comment
                    {totalComments === 1 ? "" : "s"}
                  </span>

                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[8.5px] 2xl:text-[9.5px] font-extrabold text-emerald-700">
                    {progress.changed}/{progress.total} sections modified
                  </span>
                </div>

                <h2 className="sibs-modal-title mt-2 truncate text-[#042C51]">
                  {activeItem.documentTitle ||
                    activeItem.document_title ||
                    activeItem.title ||
                    activeItem.roleTitle ||
                    activeItem.role_title ||
                    "Revise Job Description"}
                </h2>

                <p className="sibs-modal-subtitle mt-0.5 text-[#667085]">
                  Compare the current version with reviewer comments and write
                  the corrected version on the right.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8.5 2xl:h-9 w-8.5 2xl:w-9 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white text-[#042C51] hover:bg-[#F8FAFC] transition active:scale-[0.98] self-start"
                aria-label="Close revision editor"
                title="Close"
              >
                <X size={17} />
              </button>
            </div>

            <nav
              ref={sectionNavRef}
              className="mt-4 border-t border-[#E6ECF2]"
              aria-label="Revision sections"
            >
              <div className="sibs-scrollbar flex min-w-0 flex-nowrap items-center overflow-x-auto overscroll-x-contain bg-[#F8FAFC] px-2.5 pt-2 sm:px-3 sm:pt-2.5">
                {REVISION_SECTIONS.map((section) => {
                  const sectionComments = getSectionComments(
                    section.key,
                    revisionComments,
                  );

                  const isActive = activeSection === section.key;

                  return (
                    <button
                      key={section.key}
                      type="button"
                      onClick={() => scrollToRevisionSection(section.key)}
                      className={`inline-flex h-9 shrink-0 items-center gap-1.5 border-b-2 px-3 sibs-text-micro font-extrabold uppercase tracking-wide transition-all sm:px-3.5 ${
                        isActive
                          ? "rounded-t-lg border-[#FF5C28] bg-white text-[#042C51]"
                          : "border-transparent text-[#667085] hover:text-[#042C51]"
                      }`}
                    >
                      <FileText
                        size={13}
                        className={
                          isActive ? "text-[#FF5C28]" : "text-[#98A2B3]"
                        }
                      />

                      {section.label}

                      {sectionComments.length > 0 && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 sibs-text-micro font-extrabold tabular-nums ${
                            isActive
                              ? "bg-[#042C51] text-white"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {sectionComments.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        </header>

        <main
          ref={contentScrollRef}
          onScroll={handleRevisionEditorScroll}
          onMouseMove={handleRevisionEditorMouseMove}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5"
        >
          <div className="mx-auto max-w-[1700px] space-y-5">
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="rounded-2xl border border-[#D9E2EC] bg-white p-4 shadow-sm">
                <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  Revision Remarks <span className="text-red-500">*</span>
                </p>

                <textarea
                  value={form.revisionRemarks || ""}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      revisionRemarks: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Summarize what was changed and why..."
                  className="mt-3 w-full resize-y rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-4 py-3 text-sm font-medium leading-7 text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="rounded-2xl border border-[#D9E2EC] bg-white p-4 shadow-sm">
                <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  Revision Status
                </p>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MessageSquareText
                        size={16}
                        className="text-sibs-primary-1"
                      />

                      <span className="text-sm font-bold text-[#344054]">
                        Comments
                      </span>
                    </div>

                    <span className="text-sm font-extrabold text-sibs-primary-1">
                      {totalComments}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />

                      <span className="text-sm font-bold text-[#344054]">
                        Modified Sections
                      </span>
                    </div>

                    <span className="text-sm font-extrabold text-emerald-700">
                      {progress.changed}
                    </span>
                  </div>

                  <div
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                      hasUnresolvedIssues
                        ? "border-amber-300 bg-[#FFF3B8]"
                        : "border-emerald-200 bg-emerald-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {hasUnresolvedIssues ? (
                        <AlertTriangle size={16} className="text-[#E6531B]" />
                      ) : (
                        <CheckCircle2 size={16} className="text-emerald-600" />
                      )}

                      <span className="text-sm font-bold text-[#344054]">
                        Unresolved Issues
                      </span>
                    </div>

                    <span
                      className={`text-sm font-extrabold ${
                        hasUnresolvedIssues
                          ? "text-[#E6531B]"
                          : "text-emerald-700"
                      }`}
                    >
                      {unresolvedIssueCount}
                    </span>
                  </div>

                  {hasUnresolvedIssues && (
                    <div className="rounded-xl border border-amber-300 bg-[#FFF3B8] px-4 py-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle
                          size={16}
                          className="mt-0.5 shrink-0 text-[#E6531B]"
                        />

                        <p className="text-xs font-bold leading-5 text-[#101828]">
                          Save is disabled until every section with reviewer
                          comments has been updated.
                        </p>
                      </div>
                    </div>
                  )}

                  {!hasUnresolvedIssues && progress.changed === 0 && (
                    <div className="rounded-xl border border-amber-300 bg-[#FFF3B8] px-4 py-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle
                          size={16}
                          className="mt-0.5 shrink-0 text-[#E6531B]"
                        />

                        <p className="text-xs font-bold leading-5 text-[#101828]">
                          No section changes detected yet. Edit the new revision
                          side before saving.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {(submitError || revisionSaveError) && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {submitError || revisionSaveError}
              </div>
            )}

            {REVISION_SECTIONS.map((section) => (
              <SectionMergeEditor
                key={section.key}
                section={section}
                item={activeItem}
                form={form}
                setForm={setForm}
                comments={getSectionComments(section.key, revisionComments)}
                sectionRef={(element) => {
                  sectionRefs.current[section.key] = element;
                }}
              />
            ))}
          </div>
        </main>

        <footer
          className={`shrink-0 overflow-hidden border-t bg-white px-4 transition-all duration-300 sm:px-5 ${
            chromeVisible
              ? "max-h-[120px] border-[#D9E2EC] py-4 opacity-100"
              : "max-h-0 border-transparent py-0 opacity-0"
          }`}
        >
          <div className="mx-auto flex max-w-[1700px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p
              className={`text-sm font-semibold ${
                hasUnresolvedIssues ? "text-[#E6531B]" : "text-sibs-tertiary-5"
              }`}
            >
              {hasUnresolvedIssues
                ? `${unresolvedIssueCount} unresolved issue${
                    unresolvedIssueCount === 1 ? "" : "s"
                  } remaining. Update the commented sections before saving.`
                : "Save only after the new revision reflects all reviewer comments."}
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg 2xl:rounded-xl border border-[#D7DEE8] bg-white px-4 2xl:px-5 sibs-text-xs font-bold text-[#042C51] transition hover:bg-[#F8FAFC] active:scale-[0.98]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={revisionSaving || hasUnresolvedIssues}
                title={
                  hasUnresolvedIssues
                    ? `${unresolvedIssueCount} unresolved issue${
                        unresolvedIssueCount === 1 ? "" : "s"
                      } remaining`
                    : ""
                }
                className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg 2xl:rounded-xl bg-[#FF5C28] px-4 2xl:px-5 sibs-text-xs font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98]"
              >
                {revisionSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}

                {revisionSaving ? "Saving..." : "Save Revision"}
              </button>
            </div>
          </div>
        </footer>
      </form>
    </div>
  );
}
