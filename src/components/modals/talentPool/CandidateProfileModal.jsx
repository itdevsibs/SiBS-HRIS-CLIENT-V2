import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileDown,
  FileImage,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  MessageSquareText,
  Network,
  Phone,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  StickyNote,
  UploadCloud,
  UserRound,
  UserRoundPen,
  UserX,
  WalletCards,
  X,
} from "lucide-react";

import { useTalentPool } from "../../../services/context/TalentPoolContext";
import { useUser } from "../../../services/context/UserContext";
import { getVisibleCandidateTimeline } from "../../../lib/utils/candidatePipeline/candidatePipelineStageVisibility";
import {
  formatCurrency,
  formatDate,
  formatList,
  getEncodedByName,
  getStatusClass,
  textareaClass,
  toDisplayPersonName,
} from "../../../lib/utils/talentPool/talentPoolHelpers";

import {
  ReferenceCard,
  StatusTile,
  ViewableFileRow,
} from "../../recruitment/talentPool/TalentPoolShared";

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
      {children}
      {required && <span className="text-[#FF5C28]"> *</span>}
    </label>
  );
}

import GetAssessmentTimelineFiles from "../../../lib/utils/candidatePipeline/react-utils/GetAssessmentTimelineFiles";
import StatusModal from "../StatusModal";
import DocumentVaultManager from "../../documents/DocumentVaultManager.jsx";
import NhoUploadModal from "../candidatePipeline/NhoUploadModal";
import api from "../../../lib/axios/api-template";
import {
  getTalentPoolApplicationById,
  getTalentPoolApplicationAnswers,
  getTalentPoolResumePdf,
  markTalentPoolCandidateAsDropOff,
  updateTalentPoolApplicationStatus,
} from "../../../lib/axios/getTalentPool";
import {
  getTalentPoolStatusForNhoStage,
} from "../../../lib/utils/candidatePipeline/nhoRequirementRouting";
import {
  shouldShowMoveToPipelineAction,
} from "../../../lib/utils/talentPool/talentPoolTabs";

const TALENT_POOL_ROUTE = "/recruitment/talent-pool";
const CANDIDATE_PIPELINE_ROUTE = "/recruitment/candidate-pipeline";
const ONBOARDING_ROUTE = "/recruitment/onboarding";

const INCOMPLETE_ONBOARDING_STAGE = "For Onboarding - Incomplete Requirements";
const ONBOARDING_STAGE = "Onboarding";

const TALENT_POOL_STATUS_OPTIONS = [
  { value: "New Applicant", label: "New Applicant" },
  { value: "Silver Pool", label: "Silver Pool" },
  { value: "Recyclable", label: "Recyclable" },
  { value: "Do Not Reprocess", label: "Do Not Reprocess" },
  { value: "Hired / Active", label: "Hired / Active" },
  { value: "Initial Screening", label: "Initial Screening" },
  { value: "Active", label: "Active" },
];

const MAJOR_PRE_EMPLOYMENT_REQUIREMENTS = [
  "Transcript of Records and/or Diploma",
  "Medical Records",
  "NBI Clearance",
  "Birth Certificate",
  "Valid ID",
];

const PREVIOUS_EMPLOYMENT_REQUIREMENTS = [
  "BIR 2316 Form",
  "Employment Certificate",
];

const PRE_EMPLOYMENT_REQUIREMENT_GROUPS = [
  {
    id: "major",
    title: "Major Requirements",
    requirements: MAJOR_PRE_EMPLOYMENT_REQUIREMENTS,
  },
  {
    id: "other",
    title: "Other Requirements",
    requirements: [
      "ID picture (2 pcs passport size)",
      "Urinalysis, Fecalysis, Pregnancy Test, Drug Test, Chest X-ray",
      "TIN Verification Slip",
      "SSS E1 Form",
      "PhilHealth MDR",
      "Pag-IBIG MDF",
      "Vaccination Card",
    ],
  },
  {
    id: "previous-employment",
    title: "Previous Employment",
    requirements: PREVIOUS_EMPLOYMENT_REQUIREMENTS,
  },
];

const OFFICIAL_PRE_EMPLOYMENT_REQUIREMENTS =
  PRE_EMPLOYMENT_REQUIREMENT_GROUPS.flatMap((group) => group.requirements);

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeAuditRole(value = "") {
  return cleanText(value)
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getAuditAccessValues(user = {}) {
  const directValues = [
    user?.adminAccess,
    user?.admin_access,
    user?.gy_user_access,
    user?.access,
    user?.adminLevel,
    user?.admin_level,
  ];

  const assignedValues = Array.isArray(user?.assignedAccounts)
    ? user.assignedAccounts.flatMap((account) => [
        account?.adminAccess,
        account?.admin_access,
        account?.gy_user_access,
        account?.access,
      ])
    : [];

  return [...directValues, ...assignedValues]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
}

function formatCurrentAuditActorLabel(user = {}) {
  const accessLabels = {
    1: "TA",
    2: "HR",
    3: "HR Admin",
    7: "Super Admin",
  };

  const accessValues = getAuditAccessValues(user);
  const highestAccess = accessValues.length
    ? Math.max(...accessValues)
    : Number(user?.adminAccess || user?.admin_access || 0);

  const roleLabels = {
    ta: "TA",
    talent_acquisition: "TA",
    hr: "HR",
    human_resource: "HR",
    human_resources: "HR",
    hr_admin: "HR Admin",
    hradmin: "HR Admin",
    super_admin: "Super Admin",
    superadmin: "Super Admin",
  };

  const normalizedRole = normalizeAuditRole(
    user?.resolvedRole ||
      user?.resolved_role ||
      user?.role ||
      user?.userRole ||
      user?.user_role ||
      user?.adminRole ||
      user?.admin_role ||
      user?.roleName ||
      user?.role_name ||
      "",
  );

  const accessLabel =
    accessLabels[highestAccess] || roleLabels[normalizedRole] || "User";

  const displayName = cleanText(
    user?.fullName ||
      user?.full_name ||
      user?.name ||
      [user?.firstName, user?.middleName, user?.lastName]
        .map(cleanText)
        .filter(Boolean)
        .join(" ") ||
      [user?.first_name, user?.middle_name, user?.last_name]
        .map(cleanText)
        .filter(Boolean)
        .join(" ") ||
      user?.sibs_id ||
      user?.sibsId ||
      user?.username ||
      "",
  );

  return `${accessLabel} - ${displayName || "Unknown User"}`;
}

function getCandidateStage(candidate = {}) {
  return cleanText(
    candidate.currentStage ||
      candidate.currentPipelineStage ||
      candidate.pipelineStage ||
      candidate.stage ||
      "Initial Screening",
  );
}

function getRawTimeline(candidate = {}) {
  const safeCandidate =
    candidate && typeof candidate === "object" ? candidate : {};

  const rawTimeline =
    safeCandidate.timeline ||
    safeCandidate.movementHistory ||
    safeCandidate.movement_history ||
    safeCandidate.movementTimeline ||
    safeCandidate.movement_timeline ||
    safeCandidate.pipelineTimeline ||
    safeCandidate.pipeline_timeline ||
    safeCandidate.history ||
    safeCandidate.pipelineHistory ||
    safeCandidate.pipeline_history ||
    [];

  if (Array.isArray(rawTimeline)) return rawTimeline;
  if (typeof rawTimeline === "string") {
    try {
      const parsed = JSON.parse(rawTimeline);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [];
    }
  }

  return [];
}

function getTimelineDate(item = {}) {
  return (
    item.date ||
    item.createdAt ||
    item.created_at ||
    item.updatedAt ||
    item.updated_at ||
    item.timestamp ||
    ""
  );
}

function getTimelineStage(item = {}, fallbackStage = "") {
  return cleanText(
    item.stage ||
      item.currentStage ||
      item.current_stage ||
      item.pipelineStage ||
      item.pipeline_stage ||
      item.status ||
      fallbackStage ||
      "Pipeline Update",
  );
}

function getTimelineReason(item = {}) {
  return cleanText(
    item.reason ||
      item.description ||
      item.message ||
      item.action ||
      item.remarks ||
      item.note ||
      "Candidate pipeline record updated.",
  );
}

function getUpdatedBy(item = {}, currentAuditActorLabel = "", candidateName = "") {
  const savedActor = cleanText(
    item.updatedBy ||
      item.updated_by ||
      item.owner ||
      item.taOwner ||
      item.ta_owner ||
      item.createdBy ||
      item.created_by ||
      item.user ||
      item.actor ||
      item.extra?.updatedBy ||
      item.extra?.updated_by ||
      item.extra?.owner ||
      item.extra?.taOwner ||
      item.extra?.ta_owner ||
      item.extra?.createdBy ||
      item.extra?.created_by ||
      item.extra?.user ||
      item.extra?.actor ||
      "",
  );

  const savedActorLower = savedActor.toLowerCase();

  if (savedActorLower === "current user") {
    return cleanText(currentAuditActorLabel) || "System";
  }

  if (savedActorLower === "candidate" || savedActorLower === "applicant") {
    return `Applicant - ${cleanText(candidateName) || "Candidate"}`;
  }

  const applicantActorMatch = savedActor.match(
    /^(?:Applicant|Candidate)\s*-\s*(.+)$/i,
  );

  if (applicantActorMatch) {
    return `Applicant - ${cleanText(applicantActorMatch[1]) || cleanText(candidateName) || "Candidate"}`;
  }

  return savedActor || "System";
}

function getSortableTime(item = {}) {
  const value = getTimelineDate(item);
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function getTimelineSources(item = {}) {
  return [item, item.extra].filter(
    (source) => source && typeof source === "object",
  );
}

function getFirstValue(item, keys) {
  for (const source of getTimelineSources(item)) {
    for (const key of keys) {
      if (source[key] !== null && source[key] !== undefined && cleanText(source[key])) {
        return source[key];
      }
    }
  }

  return "";
}

function getTimelineFiles(item = {}) {
  const files = getFirstValue(item, [
    "files",
    "attachments",
    "assessmentFiles",
    "assessment_files",
  ]);

  if (Array.isArray(files)) return files;

  const fileName = getFirstValue(item, [
    "assessmentAttachmentName",
    "assessment_attachment_name",
    "assessmentFileName",
    "assessment_file_name",
    "fileName",
    "filename",
  ]);

  const fileUrl = getFirstValue(item, [
    "assessmentAttachmentUrl",
    "assessment_attachment_url",
    "assessmentFileUrl",
    "assessment_file_url",
    "fileUrl",
    "file_url",
    "url",
  ]);

  if (fileName || fileUrl) {
    return [
      {
        name: fileName || "Assessment Attachment",
        url: fileUrl,
        size: getFirstValue(item, [
          "assessmentAttachmentSize",
          "assessment_attachment_size",
          "fileSize",
          "file_size",
          "size",
        ]),
        type: getFirstValue(item, [
          "assessmentAttachmentType",
          "assessment_attachment_type",
          "fileType",
          "file_type",
          "type",
        ]),
      },
    ];
  }

  return [];
}

function getTimelineLinks(item = {}) {
  const links = [];
  const directLink = getFirstValue(item, [
    "assessmentLink",
    "assessment_link",
    "link",
    "assessmentUrl",
    "assessment_url",
  ]);

  if (directLink) {
    links.push({
      label: "Assessment",
      url: directLink,
    });
  }

  const interviewLink = getFirstValue(item, [
    "interviewLink",
    "interview_link",
    "meetingLink",
    "meeting_link",
  ]);

  if (interviewLink) {
    links.push({
      label: "Interview",
      url: interviewLink,
    });
  }

  return links;
}

function normalizeNhoFileTrackingEntry(file = {}, defaultAction = "") {
  if (!file || typeof file !== "object" || Array.isArray(file)) return null;

  const requirement = cleanText(
    file.requirement ||
      file.label ||
      file.title ||
      file.category ||
      "",
  );

  const fileName = cleanText(
    file.savedFileName ||
      file.saved_file_name ||
      file.filename ||
      file.storedFileName ||
      file.stored_file_name ||
      file.fileName ||
      file.file_name ||
      file.name ||
      file.originalName ||
      file.original_name ||
      file.originalname ||
      "",
  );

  const action = cleanText(file.action || defaultAction);

  if (!requirement && !fileName) return null;

  return {
    requirement: requirement || "Pre-Employment Requirement",
    fileName: fileName || "Uploaded file",
    action: action || "Updated",
  };
}

function getNhoFileTracking(item = {}) {
  const tracking = [];

  getTimelineSources(item).forEach((source) => {
    const uploadedFiles =
      source.uploadedNhoFiles ||
      source.uploaded_nho_files ||
      [];

    if (Array.isArray(uploadedFiles)) {
      uploadedFiles.forEach((file) => {
        const normalized = normalizeNhoFileTrackingEntry(file, "Uploaded");

        if (normalized) tracking.push(normalized);
      });
    }

    const deletedFile =
      source.deletedNhoFile ||
      source.deleted_nho_file ||
      null;

    if (deletedFile && typeof deletedFile === "object") {
      const normalized = normalizeNhoFileTrackingEntry(deletedFile, "Deleted");

      if (normalized) tracking.push(normalized);
    }
  });

  const unique = new Map();

  tracking.forEach((file) => {
    const key = [
      cleanText(file.action).toLowerCase(),
      cleanText(file.requirement).toLowerCase(),
      cleanText(file.fileName).toLowerCase(),
    ].join("|");

    if (!unique.has(key)) {
      unique.set(key, file);
    }
  });

  return Array.from(unique.values());
}

function getNhoMovementDisplayStage(stage = "", nhoFileTracking = []) {
  if (!Array.isArray(nhoFileTracking) || nhoFileTracking.length === 0) {
    return stage;
  }

  const actions = new Set(
    nhoFileTracking
      .map((file) => cleanText(file.action).toLowerCase())
      .filter(Boolean),
  );

  if (actions.size === 1 && actions.has("uploaded")) {
    return "Pre-Employment File Uploaded";
  }

  if (actions.size === 1 && actions.has("deleted")) {
    return "Pre-Employment File Deleted";
  }

  return "Pre-Employment Files Updated";
}



function formatMovementCurrency(value) {
  const text = cleanText(value);

  if (!text) return "";

  if (/^₱/.test(text)) return text;
  if (/^PHP\s*/i.test(text)) {
    return `₱${text.replace(/^PHP\s*/i, "")}`;
  }

  const numericValue = Number(text.replace(/,/g, ""));

  if (!Number.isFinite(numericValue)) return text;

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function getOfferMovementSummary(item = {}, stage = "", remarks = "") {
  if (cleanText(stage).toLowerCase() !== "offered") return null;

  const offerDetails =
    (item.offerDetails && typeof item.offerDetails === "object"
      ? item.offerDetails
      : null) ||
    (item.offer_details && typeof item.offer_details === "object"
      ? item.offer_details
      : null) ||
    (item.extra?.offerDetails && typeof item.extra.offerDetails === "object"
      ? item.extra.offerDetails
      : null) ||
    (item.extra?.offer_details && typeof item.extra.offer_details === "object"
      ? item.extra.offer_details
      : null) ||
    {};

  const remarksText = cleanText(remarks);

  function getRemarkValue(pattern) {
    const match = remarksText.match(pattern);
    return cleanText(match?.[1] || "");
  }

  const account = cleanText(
    item.offerAccount ||
      item.offer_account ||
      item.finalAccount ||
      item.final_account ||
      offerDetails.account ||
      offerDetails.accountName ||
      offerDetails.account_name ||
      offerDetails.finalAccount ||
      offerDetails.final_account ||
      getRemarkValue(/(?:Final Account|Account):\s*([^,]+)/i),
  );

  const basicPay = cleanText(
    item.basicPay ||
      item.basic_pay ||
      offerDetails.basicPay ||
      offerDetails.basic_pay ||
      getRemarkValue(/Basic Pay:\s*([^,]+)/i),
  );

  const deMinimisDailyRate = cleanText(
    item.deminimisDailyRate ||
      item.deminimis_daily_rate ||
      item.deMinimisDailyRate ||
      item.de_minimis_daily_rate ||
      offerDetails.deminimisDailyRate ||
      offerDetails.deminimis_daily_rate ||
      offerDetails.deMinimisDailyRate ||
      offerDetails.de_minimis_daily_rate ||
      getRemarkValue(/(?:Deminimis|De Minimis) \/ Daily Rate:\s*([^,]+)/i),
  );

  if (!account && !basicPay && !deMinimisDailyRate) return null;

  return {
    account: account || "—",
    basicPay: formatMovementCurrency(basicPay) || "—",
    deMinimisDailyRate: formatMovementCurrency(deMinimisDailyRate) || "—",
  };
}

function isGeneratedOfferDetailRemarks(stage = "", remarks = "", offerSummary = null) {
  if (cleanText(stage).toLowerCase() !== "offered" || !offerSummary) {
    return false;
  }

  const text = cleanText(remarks);

  return Boolean(
    text &&
      /Final Account:/i.test(text) &&
      /Basic Pay:/i.test(text) &&
      /(?:Deminimis|De Minimis) \/ Daily Rate:/i.test(text),
  );
}

function normalizeTimelineItem(
  rawItem = {},
  index = 0,
  fallbackStage = "",
  currentAuditActorLabel = "",
  candidateName = "",
) {
  const item =
    rawItem && typeof rawItem === "object"
      ? rawItem
      : { reason: cleanText(rawItem) };

  const stage = getTimelineStage(item, fallbackStage);
  const reason = getTimelineReason(item);
  const rawDate = getTimelineDate(item);
  const updatedBy = getUpdatedBy(item, currentAuditActorLabel, candidateName);

  const remarks = getFirstValue(item, [
    "remarks",
    "notes",
    "comment",
    "comments",
  ]);

  const score = getFirstValue(item, [
    "score",
    "assessmentScore",
    "assessment_score",
    "finalScore",
    "final_score",
    "interviewScore",
    "interview_score",
  ]);

  const result = getFirstValue(item, [
    "result",
    "assessmentResult",
    "assessment_result",
    "finalResult",
    "final_result",
    "interviewResult",
    "interview_result",
  ]);

  const links = getTimelineLinks(item);
  const files = getTimelineFiles(item);
  const nhoFileTracking = getNhoFileTracking(item);
  const displayStage = getNhoMovementDisplayStage(stage, nhoFileTracking);
  const offerSummary = getOfferMovementSummary(item, stage, remarks);
  const visibleRemarks =
    remarks &&
    remarks !== reason &&
    !isGeneratedOfferDetailRemarks(stage, remarks, offerSummary)
      ? remarks
      : "";

  return {
    id: `${stage}-${rawDate || index}-${index}`,
    stage,
    displayStage,
    reason,
    rawDate,
    updatedBy,
    remarks: visibleRemarks,
    details: {
      score,
      result,
      links,
      files,
      nhoFileTracking,
      offerSummary,
    },
  };
}

function getMovementHistoryItems(candidate = {}, currentAuditActorLabel = "") {
  const stage = getCandidateStage(candidate);
  const candidateName = cleanText(
    candidate.name ||
      candidate.candidateName ||
      candidate.candidate_name ||
      candidate.fullName ||
      candidate.full_name ||
      "",
  );
  const rawTimeline = getRawTimeline(candidate);
  const timeline = getVisibleCandidateTimeline(rawTimeline, stage);

  return timeline
    .slice()
    .sort((a, b) => getSortableTime(b) - getSortableTime(a))
    .map((item, index) =>
      normalizeTimelineItem(
        item,
        index,
        stage,
        currentAuditActorLabel,
        candidateName,
      ),
    );
}

function normalizeTalentPoolMovementActor(
  savedActor = "",
  currentAuditActorLabel = "",
  candidateName = "",
) {
  return getUpdatedBy(
    { owner: savedActor },
    currentAuditActorLabel,
    candidateName,
  );
}

function getTalentPoolPersonalMovementHistory(
  candidate = {},
  currentAuditActorLabel = "",
) {
  return getMovementHistoryItems(candidate, currentAuditActorLabel).map((item) => ({
    ...item,
    updatedBy: normalizeTalentPoolMovementActor(
      item.updatedBy,
      currentAuditActorLabel,
      candidate.name || candidate.candidateName || candidate.candidate_name || "",
    ),
  }));
}

function getTalentPoolApplicationId(candidate = {}) {
  const safeCandidate = safeObject(candidate);

  return cleanText(
    safeCandidate.sourceTalentPoolId ||
      safeCandidate.source_talent_pool_id ||
      safeCandidate.talentPoolApplicationId ||
      safeCandidate.talent_pool_application_id ||
      safeCandidate.candidateApplicationId ||
      safeCandidate.candidate_application_id ||
      safeCandidate.rawId ||
      safeCandidate.applicationRawId ||
      safeCandidate.applicationId ||
      safeCandidate.application_id ||
      safeCandidate.dbId ||
      safeCandidate.databaseId ||
      safeCandidate.id ||
      safeCandidate.candidateId ||
      "",
  );
}

function getTalentPoolOwnerSibsId(value) {
  if (!value || typeof value !== "object") return "";

  return cleanText(
    value.sibsId ||
      value.sibs_id ||
      value.employeeId ||
      value.employee_id ||
      value.userId ||
      value.user_id ||
      "",
  );
}

function normalizeLower(value) {
  return cleanText(value).toLowerCase();
}

function isDropOffCandidateStatus(value = "") {
  return (
    normalizeLower(value)
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() === "drop off"
  );
}

function isDropOffCandidateRecord(candidate = {}) {
  const safeCandidate =
    candidate && typeof candidate === "object" ? candidate : {};

  const explicitStatus = cleanText(
    safeCandidate.status ||
      safeCandidate.candidateStatus ||
      safeCandidate.candidate_status ||
      safeCandidate.talentPoolStatus ||
      safeCandidate.talent_pool_status,
  );

  if (isDropOffCandidateStatus(explicitStatus)) {
    return true;
  }

  /*
   * A known active Talent Pool status is authoritative. This prevents a
   * restored candidate from being treated as Drop-off only because old audit
   * fields remain in metadata.
   */
  const hasKnownActiveStatus = TALENT_POOL_STATUS_OPTIONS.some(
    (option) => normalizeLower(option.value) === normalizeLower(explicitStatus),
  );

  if (explicitStatus && hasKnownActiveStatus) {
    return false;
  }

  const stageValues = [
    safeCandidate.currentPipelineStage,
    safeCandidate.current_pipeline_stage,
    safeCandidate.currentStage,
    safeCandidate.current_stage,
    safeCandidate.pipelineStage,
    safeCandidate.pipeline_stage,
    safeCandidate.stage,
    safeCandidate.pipelineStatus,
    safeCandidate.pipeline_status,
  ];

  if (stageValues.some((value) => isDropOffCandidateStatus(value))) {
    return true;
  }

  const dropOffFlags = [
    safeCandidate.isDropOff,
    safeCandidate.is_drop_off,
    safeCandidate.droppedOff,
    safeCandidate.dropped_off,
    safeCandidate.isDroppedOff,
    safeCandidate.is_dropped_off,
  ];

  if (
    dropOffFlags.some((value) =>
      [true, 1, "true", "1", "yes"].includes(
        typeof value === "string" ? normalizeLower(value) : value,
      ),
    )
  ) {
    return true;
  }

  /*
   * Shared Drop-off List rows can be lightweight records. They may not carry
   * `status`, but they do carry the Drop-off category/reason/date used by the
   * table. Treat those fields as the current record state when no known active
   * Talent Pool status is present.
   */
  const dropOffCategory = cleanText(
    safeCandidate.dropOffCategory ||
      safeCandidate.drop_off_category ||
      safeCandidate.dropoffCategory ||
      safeCandidate.dropoff_category,
  );

  const dropOffReason = cleanText(
    safeCandidate.dropOffReason ||
      safeCandidate.drop_off_reason ||
      safeCandidate.dropoffReason ||
      safeCandidate.dropoff_reason,
  );

  const dropOffDate = cleanText(
    safeCandidate.dropOffDate ||
      safeCandidate.drop_off_date ||
      safeCandidate.droppedOffAt ||
      safeCandidate.dropped_off_at ||
      safeCandidate.dropoffDate ||
      safeCandidate.dropoff_date,
  );

  return Boolean(dropOffCategory || (dropOffReason && dropOffDate));
}

function hasCandidateValue(value) {
  if (Array.isArray(value)) {
    return value.some((item) => hasCandidateValue(item));
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((item) => hasCandidateValue(item));
  }

  if (value === null || value === undefined) return false;

  const normalized = cleanText(value).toLowerCase();

  return !["", "—", "-", "n/a", "na", "none", "null", "undefined"].includes(
    normalized,
  );
}

function firstCandidateValue(...values) {
  return values.find((value) => hasCandidateValue(value)) ?? "";
}

function normalizeCandidateRecordList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [parsed];
    } catch {
      return [trimmed];
    }
  }

  if (value && typeof value === "object") return [value];

  return [];
}


const CANDIDATE_EDUCATION_SECTION_DEFINITIONS = [
  { key: "elementary", label: "Elementary School" },
  { key: "highSchool", label: "High School" },
  { key: "seniorHighSchool", label: "Senior High School" },
  { key: "college", label: "College" },
  { key: "vocational", label: "Vocational / Technical School" },
  { key: "lawSchool", label: "Law School" },
  { key: "masters", label: "Master's Degree" },
  { key: "doctorate", label: "Doctorate Degree" },
];

function parseCandidateJsonObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") return {};

  const trimmed = value.trim();

  if (!trimmed) return {};

  try {
    const parsed = JSON.parse(trimmed);

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function getCandidateEducationDetails(candidate = {}) {
  const safeCandidate = safeObject(candidate);
  const metadata = safeObject(safeCandidate.metadata);
  const candidateSnapshot = safeObject(safeCandidate.candidateSnapshot);
  const pipelineCandidate = safeObject(safeCandidate.pipelineCandidate);
  const pipelineDetails = safeObject(safeCandidate.pipelineDetails);

  const sources = [
    safeCandidate.educationDetails,
    safeCandidate.education_details,
    safeCandidate.educationDetailsJson,
    safeCandidate.education_details_json,

    metadata.educationDetails,
    metadata.education_details,
    metadata.educationDetailsJson,
    metadata.education_details_json,

    candidateSnapshot.educationDetails,
    candidateSnapshot.education_details,
    candidateSnapshot.educationDetailsJson,
    candidateSnapshot.education_details_json,

    pipelineCandidate.educationDetails,
    pipelineCandidate.education_details,
    pipelineCandidate.educationDetailsJson,
    pipelineCandidate.education_details_json,

    pipelineDetails.educationDetails,
    pipelineDetails.education_details,
    pipelineDetails.educationDetailsJson,
    pipelineDetails.education_details_json,
  ];

  for (const source of sources) {
    const parsed = parseCandidateJsonObject(source);

    if (Object.keys(parsed).length > 0) {
      return parsed;
    }
  }

  return {};
}

function getCandidateEducationAttainment(candidate = {}) {
  return firstCandidateValue(
    candidate.highestEducationalAttainment,
    candidate.highest_educational_attainment,
    candidate.educationalAttainment,
    candidate.educational_attainment,
  );
}

function getEducationSectionDisplayLabel(sectionKey, attainment = "") {
  if (
    sectionKey === "college" &&
    normalizeLower(attainment) === "college level"
  ) {
    return "Current College";
  }

  return (
    CANDIDATE_EDUCATION_SECTION_DEFINITIONS.find(
      (section) => section.key === sectionKey,
    )?.label || sectionKey
  );
}

function normalizeCandidateEducationSchool(
  sectionKey,
  sectionValue,
  attainment = "",
) {
  const section = parseCandidateJsonObject(sectionValue);

  const record = {
    source: "educationDetails",
    sectionKey,
    level: getEducationSectionDisplayLabel(sectionKey, attainment),
    schoolName: firstCandidateValue(
      section.schoolName,
      section.school_name,
      section.school,
      section.name,
    ),
    address: firstCandidateValue(
      section.address,
      section.schoolAddress,
      section.school_address,
    ),
    course: firstCandidateValue(
      section.course,
      section.program,
      section.degree,
      section.degreeCourse,
      section.degree_course,
    ),
    schoolYearGraduated: firstCandidateValue(
      section.schoolYearGraduated,
      section.school_year_graduated,
      section.yearGraduated,
      section.year_graduated,
      section.schoolYear,
      section.school_year,
    ),
  };

  return hasCandidateValue({
    schoolName: record.schoolName,
    address: record.address,
    course: record.course,
    schoolYearGraduated: record.schoolYearGraduated,
  })
    ? record
    : null;
}

function getCandidateDetailedEducationRecords(candidate = {}) {
  const attainment = getCandidateEducationAttainment(candidate);
  const details = getCandidateEducationDetails(candidate);

  return CANDIDATE_EDUCATION_SECTION_DEFINITIONS.map((section) =>
    normalizeCandidateEducationSchool(
      section.key,
      details[section.key] || details[section.key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)],
      attainment,
    ),
  ).filter(Boolean);
}

function normalizeLegacyEducationRecord(record, index = 0) {
  const item =
    record && typeof record === "object" && !Array.isArray(record)
      ? record
      : { degree: record };

  const normalizedRecord = {
    source: "legacy",
    sectionKey: cleanText(item.key || item.sectionKey || `legacy-${index}`),
    level: firstCandidateValue(
      item.level,
      item.educationLevel,
      item.education_level,
      item.type,
    ),
    schoolName: firstCandidateValue(
      item.school,
      item.schoolName,
      item.school_name,
      item.name,
    ),
    address: firstCandidateValue(
      item.address,
      item.schoolAddress,
      item.school_address,
    ),
    course: firstCandidateValue(
      item.degree,
      item.course,
      item.program,
      item.degreeCourse,
      item.degree_course,
    ),
    schoolYearGraduated: firstCandidateValue(
      item.schoolYearGraduated,
      item.school_year_graduated,
      item.yearGraduated,
      item.year_graduated,
      item.schoolYear,
      item.school_year,
    ),
  };

  return hasCandidateValue({
    level: normalizedRecord.level,
    schoolName: normalizedRecord.schoolName,
    address: normalizedRecord.address,
    course: normalizedRecord.course,
    schoolYearGraduated: normalizedRecord.schoolYearGraduated,
  })
    ? normalizedRecord
    : null;
}

function getCandidateLegacyEducationRecords(candidate = {}) {
  const sources = [
    candidate.education,
    candidate.educationalBackground,
    candidate.educational_background,
    candidate.academicRecords,
    candidate.academic_records,
  ];

  return sources
    .flatMap((source) => normalizeCandidateRecordList(source))
    .map(normalizeLegacyEducationRecord)
    .filter(Boolean);
}

function getCandidateEducationRecordKey(record = {}) {
  return [
    record.level,
    record.schoolName,
    record.address,
    record.course,
    record.schoolYearGraduated,
  ]
    .map((value) => normalizeLower(value))
    .join("|");
}

function getCandidateEducationRecords(candidate = {}) {
  const detailedRecords = getCandidateDetailedEducationRecords(candidate);
  const legacyRecords = getCandidateLegacyEducationRecords(candidate);
  const uniqueRecords = new Map();

  [...detailedRecords, ...legacyRecords].forEach((record) => {
    const key = getCandidateEducationRecordKey(record);

    if (!key.replace(/\|/g, "")) return;

    if (!uniqueRecords.has(key)) {
      uniqueRecords.set(key, record);
    }
  });

  return Array.from(uniqueRecords.values());
}

function getApiErrorMessage(error, fallback = "Request failed.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function normalizeRequirementKey(value = "") {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeRequirementText(value = "") {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ");
}

function getOfficialRequirementMatch(value = "") {
  const key = normalizeRequirementKey(value);

  if (!key) return "";

  return (
    OFFICIAL_PRE_EMPLOYMENT_REQUIREMENTS.find((requirement) => {
      const requirementKey = normalizeRequirementKey(requirement);

      return (
        key === requirementKey ||
        key.startsWith(`${requirementKey}_`) ||
        key.includes(requirementKey)
      );
    }) || ""
  );
}

function getNormalizedPreEmploymentRequirement(file = {}) {
  const directRequirement =
    file.requirement || file.label || file.title || file.category || "";

  const directMatch = getOfficialRequirementMatch(directRequirement);

  if (directMatch) return directMatch;

  const filename =
    file.savedFileName ||
    file.filename ||
    file.saved_file_name ||
    file.storedFileName ||
    file.stored_file_name ||
    file.fileName ||
    file.name ||
    file.originalName ||
    file.originalname ||
    "";

  return getOfficialRequirementMatch(filename);
}

function getRequirementDisplayLabel(file = {}) {
  return (
    getNormalizedPreEmploymentRequirement(file) ||
    cleanText(file.requirement) ||
    cleanText(file.label) ||
    cleanText(file.title) ||
    cleanText(file.category) ||
    cleanText(file.folderName) ||
    cleanText(file.applicantFolderName) ||
    "NHO Uploaded File"
  );
}

function isOfficialPreEmploymentFile(file = {}) {
  return Boolean(getNormalizedPreEmploymentRequirement(file));
}

function isMajorPreEmploymentRequirement(requirement = "") {
  const key = normalizeRequirementKey(requirement);

  return MAJOR_PRE_EMPLOYMENT_REQUIREMENTS.some(
    (item) => normalizeRequirementKey(item) === key,
  );
}

function formatFileSize(size = 0) {
  const numberSize = Number(size || 0);

  if (!numberSize) return "—";

  const kb = numberSize / 1024;

  if (kb < 1024) return `${kb.toFixed(1)} KB`;

  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatUploadedDate(value = "") {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function FileTypeIcon({ fileName = "", ...props }) {
  const value = String(fileName || "").toLowerCase();

  if (/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(value)) {
    return <FileImage {...props} />;
  }

  if (/\.(xls|xlsx|csv)$/i.test(value)) {
    return <FileSpreadsheet {...props} />;
  }

  return <FileText {...props} />;
}

function getRequirementSortIndex(requirement = "") {
  const requirementKey = normalizeRequirementText(requirement);

  const index = OFFICIAL_PRE_EMPLOYMENT_REQUIREMENTS.findIndex(
    (item) => normalizeRequirementText(item) === requirementKey,
  );

  return index === -1 ? 9999 : index;
}

function calculateMajorRequirementProgress(files = []) {
  const uploadedRequirementKeys = new Set(
    files
      .filter(isOfficialPreEmploymentFile)
      .map((file) =>
        normalizeRequirementKey(getNormalizedPreEmploymentRequirement(file)),
      )
      .filter(Boolean),
  );

  const completed = MAJOR_PRE_EMPLOYMENT_REQUIREMENTS.filter((requirement) =>
    uploadedRequirementKeys.has(normalizeRequirementKey(requirement)),
  ).length;

  const total = MAJOR_PRE_EMPLOYMENT_REQUIREMENTS.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  return {
    completed,
    total,
    percent,
    isComplete: total > 0 && completed >= total,
  };
}

function calculateTotalRequirementProgress(files = []) {
  const uploadedRequirementKeys = new Set(
    files
      .filter(isOfficialPreEmploymentFile)
      .map((file) =>
        normalizeRequirementKey(getNormalizedPreEmploymentRequirement(file)),
      )
      .filter(Boolean),
  );

  const completed = OFFICIAL_PRE_EMPLOYMENT_REQUIREMENTS.filter((requirement) =>
    uploadedRequirementKeys.has(normalizeRequirementKey(requirement)),
  ).length;

  const total = OFFICIAL_PRE_EMPLOYMENT_REQUIREMENTS.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  return {
    completed,
    total,
    percent,
    isComplete: total > 0 && completed >= total,
  };
}

function getCandidateStageValue(candidate = {}) {
  /*
    Pipeline stage must come from verified Candidate Pipeline fields only.
    Do not fall back to talent pool status because statuses like
    "New Applicant", "Interviewed", or "Public Submission" can make an
    unlinked talent pool candidate look linked.
  */
  return cleanText(
    candidate.currentPipelineStage ||
      candidate.current_pipeline_stage ||
      candidate.currentStage ||
      candidate.current_stage ||
      candidate.pipelineStage ||
      candidate.pipeline_stage ||
      candidate.stage ||
      "",
  );
}

function getCandidatePublicId(candidate = {}) {
  return cleanText(
    candidate.candidateId ||
      candidate.candidate_id ||
      candidate.candidateApplicationId ||
      candidate.candidate_application_id ||
      candidate.applicationId ||
      candidate.application_id ||
      candidate.publicId ||
      candidate.public_id ||
      "",
  );
}

function AnimatedProfileTabPanel({ children }) {
  return <>{children}</>;
}

function CandidateProfileHorizontalNavigation({
  tabs = [],
  activeTab = "",
  onTabChange,
}) {
  const activePrimaryKey = String(activeTab || "personal.basic").split(".")[0];
  const activePrimary = tabs.find((tab) => tab.key === activePrimaryKey);
  const secondaryTabs = Array.isArray(activePrimary?.children)
    ? activePrimary.children
    : [];

  function handlePrimaryClick(tab) {
    const nextKey = tab.children?.[0]?.key || tab.key;
    onTabChange?.(nextKey);
  }

  return (
    <nav
      className="rounded-xl border border-sibs-border bg-white p-1.5 xl:p-2 shadow-2xs"
      aria-label="Candidate profile navigation"
    >
      <div className="no-scrollbar flex min-w-0 gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon || FileText;
          const active = tab.key === activePrimaryKey;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handlePrimaryClick(tab)}
              aria-current={active ? "page" : undefined}
              className={`inline-flex h-7 xl:h-8.5 min-w-max shrink-0 items-center justify-center gap-1.5 rounded-md xl:rounded-lg border px-2.5 xl:px-3.5 text-[10.5px] xl:text-xs font-extrabold transition-all duration-150 ${
                active
                  ? "border-sibs-orange/40 bg-sibs-cream text-sibs-orange shadow-2xs"
                  : "border-transparent text-sibs-text-muted hover:bg-sibs-cream-subtle hover:text-sibs-navy"
              }`}
            >
              <Icon
                size={14}
                className={active ? "text-sibs-orange" : "text-sibs-text-muted"}
              />
              {tab.label}
            </button>
          );
        })}
      </div>

      {secondaryTabs.length > 0 && (
        <div className="no-scrollbar mt-1 xl:mt-1.5 flex items-center gap-1.5 overflow-x-auto border-t border-sibs-border pt-1 xl:pt-1.5">
          <span className="shrink-0 px-1.5 text-[8.5px] xl:text-[9.5px] font-black uppercase tracking-widest text-sibs-text-muted">
            Subsections:
          </span>

          {secondaryTabs.map((child) => {
            const active = child.key === activeTab;

            return (
              <button
                key={child.key}
                type="button"
                onClick={() => onTabChange?.(child.key)}
                aria-selected={active}
                className={`h-5.5 xl:h-6.5 min-w-max shrink-0 rounded-full px-2.5 xl:px-3 text-[9px] xl:text-[10px] font-extrabold transition-all ${
                  active
                    ? "bg-sibs-navy text-white shadow-2xs"
                    : "bg-slate-100 text-sibs-text-muted hover:bg-slate-200 hover:text-sibs-navy"
                }`}
              >
                {child.label}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}

function getCandidatePipelineLookupId(candidate = {}) {
  const safeCandidate = safeObject(candidate);
  const metadata = safeObject(safeCandidate.metadata);
  const candidateSnapshot = safeObject(safeCandidate.candidateSnapshot);
  const pipelineCandidate = safeObject(safeCandidate.pipelineCandidate);
  const pipelineDetails = safeObject(safeCandidate.pipelineDetails);

  return cleanText(
    pipelineCandidate.dbId ||
      pipelineCandidate.id ||
      pipelineCandidate.rawId ||
      pipelineCandidate.pipelineId ||
      pipelineCandidate.pipeline_id ||
      pipelineDetails.dbId ||
      pipelineDetails.id ||
      pipelineDetails.rawId ||
      pipelineDetails.pipelineId ||
      pipelineDetails.pipeline_id ||
      safeCandidate.pipelineDbId ||
      safeCandidate.pipeline_db_id ||
      safeCandidate.pipelineId ||
      safeCandidate.pipeline_id ||
      safeCandidate.pipelineCandidateId ||
      safeCandidate.pipeline_candidate_id ||
      metadata.pipelineId ||
      metadata.pipeline_id ||
      metadata.pipelineDbId ||
      metadata.pipeline_db_id ||
      metadata.candidatePipelineId ||
      metadata.candidate_pipeline_id ||
      candidateSnapshot.pipelineId ||
      candidateSnapshot.pipeline_id ||
      candidateSnapshot.dbId ||
      candidateSnapshot.pipelineDbId ||
      "",
  );
}

function getResolvedPipelineId(candidate = {}, fallback = "") {
  const safeCandidate = safeObject(candidate);

  return cleanText(
    safeCandidate.dbId ||
      safeCandidate.id ||
      safeCandidate.pipelineId ||
      safeCandidate.pipeline_id ||
      safeCandidate.pipelineDbId ||
      safeCandidate.pipeline_db_id ||
      safeCandidate.candidatePipelineId ||
      safeCandidate.candidate_pipeline_id ||
      getCandidatePipelineLookupId(safeCandidate) ||
      fallback,
  );
}

function isTruthyFlag(value) {
  if (value === true) return true;
  if (value === 1) return true;

  const normalized = normalizeLower(value);

  return ["true", "1", "yes", "linked", "moved"].includes(normalized);
}

function isCandidateActivelyLinkedToPipeline(candidate = {}) {
  const safeCandidate = safeObject(candidate);

  if (!Object.keys(safeCandidate).length) return false;
  if (isDropOffCandidateRecord(safeCandidate)) return false;

  const hasCamelCaseFlag = Object.prototype.hasOwnProperty.call(
    safeCandidate,
    "movedToPipeline",
  );
  const hasSnakeCaseFlag = Object.prototype.hasOwnProperty.call(
    safeCandidate,
    "moved_to_pipeline",
  );

  if (hasCamelCaseFlag || hasSnakeCaseFlag) {
    const explicitMovedFlag = hasCamelCaseFlag
      ? safeCandidate.movedToPipeline
      : safeCandidate.moved_to_pipeline;

    /*
      The Talent Pool status endpoint explicitly returns false/0 after a
      Drop-off candidate is restored. That value is authoritative even when an
      old pipeline ID remains in metadata for audit history.
    */
    return isTruthyFlag(explicitMovedFlag);
  }

  const pipelineStatus = normalizeLower(
    safeCandidate.pipelineStatus || safeCandidate.pipeline_status,
  )
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (["drop off", "dropped off", "inactive", "deleted"].includes(pipelineStatus)) {
    return false;
  }

  const verifiedPipelineId = getCandidatePipelineLookupId(safeCandidate);
  const currentStage = getCandidateStageValue(safeCandidate);

  return Boolean(
    verifiedPipelineId &&
      (currentStage || pipelineStatus === "active"),
  );
}

function getResolvedFileUrl(fileUrl = "") {
  const value = cleanText(fileUrl);

  if (!value) return "";

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  const apiBaseUrl = cleanText(import.meta.env.VITE_API_URL).replace(/\/+$/, "");

  if (value.startsWith("/api/") && apiBaseUrl) {
    return `${apiBaseUrl}${value}`;
  }

  return value;
}

function buildCandidatePipelineFileUrl(candidate = {}, file = {}) {
  const lookupId = getResolvedPipelineId(candidate);

  const filename =
    file.savedFileName ||
    file.filename ||
    file.saved_file_name ||
    file.storedFileName ||
    file.stored_file_name ||
    file.fileName ||
    file.name ||
    "";

  if (!lookupId || !filename) return "";

  return `/api/candidate-pipeline/file/${encodeURIComponent(
    lookupId,
  )}/${encodeURIComponent(filename)}`;
}

function normalizeCandidateFile(file = {}, candidate = {}) {
  const safeFile = safeObject(file);

  const savedFileName =
    safeFile.savedFileName ||
    safeFile.filename ||
    safeFile.saved_file_name ||
    safeFile.storedFileName ||
    safeFile.stored_file_name ||
    "";

  /*
   * Persisted pre-employment files must display the exact physical
   * file-server name. Fall back to the original browser name only when the
   * file has not been saved yet and therefore has no savedFileName.
   */
  const fileName =
    savedFileName ||
    safeFile.fileName ||
    safeFile.name ||
    safeFile.originalName ||
    safeFile.originalname ||
    safeFile.attachmentFileName ||
    safeFile.audioFileName ||
    "";

  const fileUrl =
    safeFile.fileUrl ||
    safeFile.url ||
    safeFile.dataUrl ||
    safeFile.previewUrl ||
    safeFile.downloadUrl ||
    safeFile.attachmentFileUrl ||
    safeFile.audioFileUrl ||
    buildCandidatePipelineFileUrl(candidate, {
      ...safeFile,
      fileName,
      savedFileName,
    });

  const requirement = getRequirementDisplayLabel({
    ...safeFile,
    fileName,
    savedFileName,
  });

  return {
    ...safeFile,
    id:
      safeFile.id ||
      safeFile.fileId ||
      safeFile.file_id ||
      `${requirement || "nho-file"}-${fileName}-${savedFileName}-${fileUrl}`,
    requirement,
    officialRequirement: getNormalizedPreEmploymentRequirement({
      ...safeFile,
      fileName,
      savedFileName,
    }),
    fileName,
    savedFileName,
    filename: safeFile.filename || savedFileName,
    fileUrl: getResolvedFileUrl(fileUrl),
    fileType:
      safeFile.fileType ||
      safeFile.type ||
      safeFile.mimetype ||
      safeFile.mimeType ||
      safeFile.attachmentFileType ||
      safeFile.audioFileType ||
      "",
    fileSize:
      safeFile.fileSize ||
      safeFile.size ||
      safeFile.attachmentFileSize ||
      safeFile.audioFileSize ||
      0,
    uploadedAt:
      safeFile.uploadedAt ||
      safeFile.uploaded_at ||
      safeFile.createdAt ||
      safeFile.created_at ||
      safeFile.updatedAt ||
      safeFile.updated_at ||
      "",
    uploadedBy:
      safeFile.uploadedBy ||
      safeFile.uploaded_by ||
      safeFile.createdBy ||
      safeFile.created_by ||
      safeFile.updatedBy ||
      safeFile.updated_by ||
      "",
    applicantFolderName:
      safeFile.applicantFolderName ||
      safeFile.applicant_folder_name ||
      safeFile.folderName ||
      "",
  };
}

function getCandidateFileUniqueKey(file = {}) {
  return [
    cleanText(file.requirement),
    cleanText(file.fileName),
    cleanText(file.savedFileName),
    cleanText(file.filename),
    cleanText(file.fileUrl),
    cleanText(file.uploadedAt),
  ]
    .filter(Boolean)
    .join("|")
    .toLowerCase();
}

function normalizeCandidateFiles(files = [], candidate = {}) {
  const map = new Map();

  files
    .filter(Boolean)
    .map((file) => normalizeCandidateFile(file, candidate))
    .filter((file) => file.fileName || file.savedFileName || file.fileUrl)
    .forEach((file) => {
      const key =
        getCandidateFileUniqueKey(file) ||
        `${file.requirement}-${file.fileName}`;

      if (!map.has(key)) {
        map.set(key, file);
      }
    });

  return Array.from(map.values()).sort((a, b) => {
    const aMajor = isMajorPreEmploymentRequirement(a.requirement) ? 0 : 1;
    const bMajor = isMajorPreEmploymentRequirement(b.requirement) ? 0 : 1;

    if (aMajor !== bMajor) return aMajor - bMajor;

    const aOfficial = isOfficialPreEmploymentFile(a) ? 0 : 1;
    const bOfficial = isOfficialPreEmploymentFile(b) ? 0 : 1;

    if (aOfficial !== bOfficial) return aOfficial - bOfficial;

    const requirementSort =
      getRequirementSortIndex(a.requirement) -
      getRequirementSortIndex(b.requirement);

    if (requirementSort !== 0) return requirementSort;

    const dateA = new Date(a.uploadedAt || 0).getTime();
    const dateB = new Date(b.uploadedAt || 0).getTime();

    if (Number.isFinite(dateA) && Number.isFinite(dateB) && dateA !== dateB) {
      return dateB - dateA;
    }

    return cleanText(a.fileName).localeCompare(cleanText(b.fileName));
  });
}

function getCandidatePreEmploymentFiles(candidate = {}) {
  const safeCandidate = safeObject(candidate);
  const metadata = safeObject(safeCandidate.metadata);
  const candidateSnapshot = safeObject(safeCandidate.candidateSnapshot);
  const pipelineCandidate = safeObject(safeCandidate.pipelineCandidate);
  const pipelineDetails = safeObject(safeCandidate.pipelineDetails);
  const pipelineMetadata = safeObject(pipelineCandidate.metadata);

  const sources = [
    safeCandidate.nhoFiles,
    safeCandidate.nho_files,
    safeCandidate.preEmploymentFiles,
    safeCandidate.pre_employment_files,
    safeCandidate.uploadedFiles,
    safeCandidate.files,

    metadata.nhoFiles,
    metadata.nho_files,
    metadata.preEmploymentFiles,
    metadata.pre_employment_files,
    metadata.uploadedFiles,
    metadata.files,

    candidateSnapshot.nhoFiles,
    candidateSnapshot.nho_files,
    candidateSnapshot.preEmploymentFiles,
    candidateSnapshot.pre_employment_files,
    candidateSnapshot.uploadedFiles,
    candidateSnapshot.files,

    pipelineCandidate.nhoFiles,
    pipelineCandidate.nho_files,
    pipelineCandidate.preEmploymentFiles,
    pipelineCandidate.pre_employment_files,
    pipelineCandidate.uploadedFiles,
    pipelineCandidate.files,

    pipelineDetails.nhoFiles,
    pipelineDetails.nho_files,
    pipelineDetails.preEmploymentFiles,
    pipelineDetails.pre_employment_files,
    pipelineDetails.uploadedFiles,
    pipelineDetails.files,

    pipelineMetadata.nhoFiles,
    pipelineMetadata.nho_files,
    pipelineMetadata.preEmploymentFiles,
    pipelineMetadata.pre_employment_files,
    pipelineMetadata.uploadedFiles,
    pipelineMetadata.files,
  ];

  return normalizeCandidateFiles(
    sources.flatMap((source) => safeArray(source)),
    safeCandidate,
  );
}

function getNhoFilesFromApiResponse(response) {
  const payload = response?.data ?? response;
  const data = payload?.data || {};

  return [
    ...safeArray(payload?.files),
    ...safeArray(data?.files),
    ...safeArray(payload?.nhoFiles),
    ...safeArray(payload?.nho_files),
    ...safeArray(data?.nhoFiles),
    ...safeArray(data?.nho_files),
    ...safeArray(payload?.candidate?.nhoFiles),
    ...safeArray(payload?.candidate?.nho_files),
    ...safeArray(data?.candidate?.nhoFiles),
    ...safeArray(data?.candidate?.nho_files),
  ];
}

function getPipelineCandidateFromResponse(response) {
  const payload = response?.data ?? response;

  return (
    payload?.data?.candidate ||
    payload?.candidate ||
    payload?.data ||
    payload ||
    null
  );
}

function getPipelineRowsFromListResponse(response) {
  const payload = response?.data ?? response;

  return safeArray(
    payload?.data ||
      payload?.candidates ||
      payload?.records ||
      payload?.rows ||
      [],
  );
}

function normalizeMatchText(value = "") {
  return normalizeLower(value)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function namesMatchStrict(firstName = "", secondName = "") {
  const first = normalizeMatchText(firstName);
  const second = normalizeMatchText(secondName);

  if (!first || !second) return false;

  return first === second;
}

function collectCandidateIdentityIds(candidate = {}) {
  return [
    candidate.candidateId,
    candidate.candidate_id,
    candidate.candidateApplicationId,
    candidate.candidate_application_id,
    candidate.applicationId,
    candidate.application_id,
    candidate.publicId,
    candidate.public_id,
  ]
    .map(cleanText)
    .filter(Boolean);
}

function candidateMatchesPipeline(candidate = {}, pipelineCandidate = {}) {
  const sourceTalentPoolId = cleanText(
    pipelineCandidate.sourceTalentPoolId ||
      pipelineCandidate.source_talent_pool_id,
  );

  const talentPoolId = cleanText(candidate.id || candidate.rawId);

  if (sourceTalentPoolId && talentPoolId && sourceTalentPoolId === talentPoolId) {
    return true;
  }

  const candidateIds = collectCandidateIdentityIds(candidate);
  const pipelineCandidateIds = collectCandidateIdentityIds(pipelineCandidate);

  if (candidateIds.some((id) => pipelineCandidateIds.includes(id))) {
    return true;
  }

  const hasStrongCandidateIdentity = Boolean(
    talentPoolId || candidateIds.length,
  );
  const hasStrongPipelineIdentity = Boolean(
    sourceTalentPoolId || pipelineCandidateIds.length,
  );

  /*
    Never connect two identified records only because they reuse the same
    email and name. This prevents a new Talent Pool row from inheriting the
    Drop-off stage or Already Linked state of another record.
  */
  if (hasStrongCandidateIdentity || hasStrongPipelineIdentity) {
    return false;
  }

  const email = normalizeLower(candidate.email);
  const pipelineEmail = normalizeLower(pipelineCandidate.email);

  const name =
    candidate.name ||
    candidate.fullName ||
    [candidate.firstName, candidate.middleName, candidate.lastName]
      .filter(Boolean)
      .join(" ");

  const pipelineName =
    pipelineCandidate.name ||
    pipelineCandidate.fullName ||
    pipelineCandidate.candidateName ||
    [
      pipelineCandidate.firstName,
      pipelineCandidate.middleName,
      pipelineCandidate.lastName,
    ]
      .filter(Boolean)
      .join(" ");

  /*
    Email alone is not safe. The same email can be reused in test records or
    public submissions. Only treat an email match as linked when the candidate
    name also matches exactly after normalization.
  */
  return Boolean(
    email &&
      pipelineEmail &&
      email === pipelineEmail &&
      namesMatchStrict(name, pipelineName),
  );
}

async function fetchPipelineCandidateByAnyIdentity(candidate = {}) {
  const directLookupId = getCandidatePipelineLookupId(candidate);

  if (directLookupId) {
    try {
      const response = await api.get(
        `/api/candidate-pipeline/${encodeURIComponent(directLookupId)}`,
        {
          withCredentials: true,
          params: {
            _t: Date.now(),
          },
        },
      );

      const directCandidate = getPipelineCandidateFromResponse(response);

      if (directCandidate && directCandidate.success !== false) {
        return safeObject(directCandidate);
      }
    } catch {
      // Continue to list fallback.
    }
  }

  const structuralSearchTerms = [
    candidate.candidateId,
    candidate.candidate_id,
    candidate.candidateApplicationId,
    candidate.candidate_application_id,
    candidate.applicationId,
    candidate.application_id,
    candidate.id,
    candidate.rawId,
  ]
    .map(cleanText)
    .filter(Boolean);

  const fallbackSearchTerms = structuralSearchTerms.length
    ? []
    : [candidate.email, candidate.name].map(cleanText).filter(Boolean);

  const uniqueSearchTerms = Array.from(
    new Set([...structuralSearchTerms, ...fallbackSearchTerms]),
  );

  for (const term of uniqueSearchTerms) {
    try {
      const response = await api.get("/api/candidate-pipeline", {
        withCredentials: true,
        params: {
          page: 1,
          limit: 500,
          search: term,
          _t: Date.now(),
        },
      });

      const rows = getPipelineRowsFromListResponse(response);
      const match = rows.find((row) =>
        candidateMatchesPipeline(candidate, row),
      );

      if (match) {
        return safeObject(match);
      }
    } catch {
      // Try next term.
    }
  }

  return null;
}

function mergeHistoryArrays(...sources) {
  return sources.flatMap((source) => safeArray(source));
}

function mergeCandidateWithPipelineDetails(candidate = {}, pipelineCandidate = {}) {
  const safeCandidate = safeObject(candidate);
  const safePipelineCandidate = safeObject(pipelineCandidate);

  if (!Object.keys(safePipelineCandidate).length) {
    return safeCandidate;
  }

  const candidateMetadata = safeObject(safeCandidate.metadata);
  const pipelineMetadata = safeObject(safePipelineCandidate.metadata);
  const existingPipelineCandidate = safeObject(safeCandidate.pipelineCandidate);
  const candidateSnapshot = safeObject(safeCandidate.candidateSnapshot);

  const pipelineTimeline = mergeHistoryArrays(
    safePipelineCandidate.timeline,
    safePipelineCandidate.movementTimeline,
    safePipelineCandidate.movementHistory,
    safePipelineCandidate.pipelineHistory,
    safePipelineCandidate.stageHistory,
    safePipelineCandidate.history,
    safePipelineCandidate.activityHistory,
    pipelineMetadata.timeline,
    pipelineMetadata.movementTimeline,
    pipelineMetadata.movementHistory,
    pipelineMetadata.pipelineHistory,
  );

  const applicationHistory = mergeHistoryArrays(
    safeCandidate.applicationHistory,
    safeCandidate.movementTimeline,
    safeCandidate.movementHistory,
    safeCandidate.pipelineHistory,
    safeCandidate.stageHistory,
    safeCandidate.timeline,
    safeCandidate.history,
    safeCandidate.activityHistory,

    candidateSnapshot.applicationHistory,
    candidateSnapshot.timeline,
    candidateSnapshot.movementTimeline,

    candidateMetadata.applicationHistory,
    candidateMetadata.timeline,
    candidateMetadata.movementTimeline,
    candidateMetadata.pipelineHistory,
    candidateMetadata.pipelineTimeline,

    pipelineTimeline,
  );

  const pipelineNhoFiles = mergeHistoryArrays(
    safePipelineCandidate.nhoFiles,
    safePipelineCandidate.nho_files,
    safePipelineCandidate.preEmploymentFiles,
    safePipelineCandidate.pre_employment_files,
    safePipelineCandidate.uploadedFiles,
    safePipelineCandidate.files,
    pipelineMetadata.nhoFiles,
    pipelineMetadata.nho_files,
    pipelineMetadata.preEmploymentFiles,
    pipelineMetadata.pre_employment_files,
    pipelineMetadata.uploadedFiles,
    pipelineMetadata.files,
  );

  return {
    ...safeCandidate,

    pipelineCandidate: {
      ...existingPipelineCandidate,
      ...safePipelineCandidate,
    },

    pipelineDetails: safePipelineCandidate,

    pipelineStatus:
      safePipelineCandidate.pipelineStatus ||
      safePipelineCandidate.pipeline_status ||
      safeCandidate.pipelineStatus ||
      (safePipelineCandidate.currentStage ||
      safePipelineCandidate.current_stage ||
      safePipelineCandidate.currentPipelineStage ||
      safePipelineCandidate.current_pipeline_stage
        ? "Active"
        : safeCandidate.pipelineStatus),

    currentPipelineStage:
      safePipelineCandidate.currentPipelineStage ||
      safePipelineCandidate.current_pipeline_stage ||
      safePipelineCandidate.currentStage ||
      safePipelineCandidate.current_stage ||
      safePipelineCandidate.pipelineStage ||
      safePipelineCandidate.pipeline_stage ||
      safePipelineCandidate.stage ||
      safeCandidate.currentPipelineStage ||
      safeCandidate.current_pipeline_stage ||
      safeCandidate.currentStage ||
      safeCandidate.current_stage ||
      safeCandidate.pipelineStage ||
      safeCandidate.pipeline_stage,

    currentStage:
      safePipelineCandidate.currentStage ||
      safePipelineCandidate.current_stage ||
      safePipelineCandidate.currentPipelineStage ||
      safePipelineCandidate.current_pipeline_stage ||
      safePipelineCandidate.pipelineStage ||
      safePipelineCandidate.pipeline_stage ||
      safePipelineCandidate.stage ||
      safeCandidate.currentStage ||
      safeCandidate.current_stage ||
      safeCandidate.currentPipelineStage ||
      safeCandidate.current_pipeline_stage ||
      safeCandidate.pipelineStage ||
      safeCandidate.pipeline_stage,

    pipelineStage:
      safePipelineCandidate.pipelineStage ||
      safePipelineCandidate.pipeline_stage ||
      safePipelineCandidate.currentStage ||
      safePipelineCandidate.current_stage ||
      safePipelineCandidate.currentPipelineStage ||
      safePipelineCandidate.current_pipeline_stage ||
      safeCandidate.pipelineStage ||
      safeCandidate.pipeline_stage,

    currentAppliedRole:
      safePipelineCandidate.currentAppliedRole ||
      safePipelineCandidate.current_applied_role ||
      safePipelineCandidate.roleTitle ||
      safePipelineCandidate.role_title ||
      safePipelineCandidate.openPosition ||
      safePipelineCandidate.open_position ||
      safePipelineCandidate.roleCapability ||
      safePipelineCandidate.role_capability ||
      safeCandidate.currentAppliedRole ||
      safeCandidate.current_applied_role,

    currentAppliedAccount:
      safePipelineCandidate.currentAppliedAccount ||
      safePipelineCandidate.current_applied_account ||
      safePipelineCandidate.account ||
      safePipelineCandidate.accountName ||
      safePipelineCandidate.leadAccount ||
      safePipelineCandidate.lead_account ||
      safeCandidate.currentAppliedAccount ||
      safeCandidate.current_applied_account,

    currentTaOwner:
      safePipelineCandidate.currentTaOwner ||
      safePipelineCandidate.current_ta_owner ||
      safePipelineCandidate.updatedBySibsId ||
      safePipelineCandidate.updated_by_sibs_id ||
      safeCandidate.currentTaOwner ||
      safeCandidate.current_ta_owner,

    nhoFiles: normalizeCandidateFiles(
      [...getCandidatePreEmploymentFiles(safeCandidate), ...pipelineNhoFiles],
      safePipelineCandidate,
    ),

    applicationHistory,
    timeline: pipelineTimeline.length ? pipelineTimeline : safeCandidate.timeline,

    finalInterviewSubmittedForms:
      safePipelineCandidate.finalInterviewSubmittedForms ||
      safePipelineCandidate.final_interview_submitted_forms ||
      safeCandidate.finalInterviewSubmittedForms,

    final_interview_submitted_forms:
      safePipelineCandidate.final_interview_submitted_forms ||
      safePipelineCandidate.finalInterviewSubmittedForms ||
      safeCandidate.final_interview_submitted_forms,

    metadata: {
      ...candidateMetadata,
      pipeline: safePipelineCandidate,
      pipelineTimeline,
      applicationHistory,
    },
  };
}

function getNormalizedHistoryDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return cleanText(value);
  }

  return date.toISOString().slice(0, 16);
}

function getHistoryTitle(item = {}) {
  const rawTitle =
    item.stage ||
    item.pipelineStage ||
    item.pipeline_stage ||
    item.currentStage ||
    item.current_stage ||
    item.currentPipelineStage ||
    item.current_pipeline_stage ||
    item.status ||
    item.candidateStatus ||
    item.candidate_status ||
    item.outcome ||
    item.title ||
    "Application Update";

  const title = cleanText(rawTitle);
  const normalizedTitle = normalizeLower(title)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (
    normalizedTitle === "drop off" ||
    normalizedTitle === "dropped off" ||
    normalizedTitle.includes("marked as drop off") ||
    normalizedTitle.includes("moved to drop off")
  ) {
    return "Drop-off";
  }

  if (title.includes("PRF status changed")) return "Initial Screening";
  if (title.includes("PRF status updated")) return "Initial Screening";
  if (title.includes("Assessment marked")) return "Online Assessment";
  if (title.includes("Assessment updated")) return "Online Assessment";
  if (title.includes("interview schedule")) return "Interview Scheduled";
  if (title.includes("Interview schedule")) return "Interview Scheduled";
  if (title.includes("Interview started")) return "Interview Scheduled";
  if (title.includes("Interview completed")) return "Interviewed";
  if (title.includes("Final interview")) return "Interviewed";
  if (title.includes("Offer details")) return "Offered";
  if (title.includes("Offer approved")) return "Accepted";
  if (title.includes("NHO schedule")) return "For NHO";
  if (title.includes("incomplete major")) return INCOMPLETE_ONBOARDING_STAGE;

  return title || "Application Update";
}

function getHistoryDate(item = {}) {
  return (
    item.timestamp ||
    item.droppedOffAt ||
    item.dropped_off_at ||
    item.submittedAtIso ||
    item.submitted_at_iso ||
    item.createdAt ||
    item.created_at ||
    item.updatedAt ||
    item.updated_at ||
    item.activityDate ||
    item.activity_date ||
    item.submittedAt ||
    item.submitted_at ||
    item.date ||
    ""
  );
}

function getHistoryOwner(item = {}, candidate = {}, fallbackOwner = "—") {
  return (
    item.owner ||
    item.taOwner ||
    item.ta_owner ||
    item.updatedBy ||
    item.updated_by ||
    item.createdBy ||
    item.created_by ||
    item.updatedBySibsId ||
    item.updated_by_sibs_id ||
    item.createdBySibsId ||
    item.created_by_sibs_id ||
    candidate.currentTaOwner ||
    candidate.current_ta_owner ||
    candidate.taOwner ||
    candidate.ta_owner ||
    candidate.owner ||
    fallbackOwner ||
    "—"
  );
}

function getHistoryDropOffCategory(item = {}, candidate = {}) {
  const safeItem = safeObject(item);
  const itemExtra = safeObject(safeItem.extra);
  const safeCandidate = safeObject(candidate);
  const metadata = safeObject(safeCandidate.metadata);
  const candidateSnapshot = safeObject(safeCandidate.candidateSnapshot);
  const pipelineCandidate = safeObject(safeCandidate.pipelineCandidate);
  const pipelineDetails = safeObject(safeCandidate.pipelineDetails);

  return cleanText(
    firstCandidateValue(
      safeItem.dropOffCategory,
      safeItem.drop_off_category,
      safeItem.dropoffCategory,
      safeItem.dropoff_category,
      safeItem.category,
      itemExtra.dropOffCategory,
      itemExtra.drop_off_category,
      itemExtra.dropoffCategory,
      itemExtra.dropoff_category,
      itemExtra.category,
      safeCandidate.dropOffCategory,
      safeCandidate.drop_off_category,
      safeCandidate.dropoffCategory,
      safeCandidate.dropoff_category,
      metadata.dropOffCategory,
      metadata.drop_off_category,
      candidateSnapshot.dropOffCategory,
      candidateSnapshot.drop_off_category,
      pipelineCandidate.dropOffCategory,
      pipelineCandidate.drop_off_category,
      pipelineDetails.dropOffCategory,
      pipelineDetails.drop_off_category,
    ),
  );
}

function getHistoryAssessmentResult(item = {}, candidate = {}) {
  const safeItem = safeObject(item);
  const itemExtra = safeObject(safeItem.extra);
  const safeCandidate = safeObject(candidate);
  const metadata = safeObject(safeCandidate.metadata);
  const candidateSnapshot = safeObject(safeCandidate.candidateSnapshot);
  const pipelineCandidate = safeObject(safeCandidate.pipelineCandidate);
  const pipelineDetails = safeObject(safeCandidate.pipelineDetails);

  return cleanText(
    firstCandidateValue(
      safeItem.assessmentResult,
      safeItem.assessment_result,
      itemExtra.assessmentResult,
      itemExtra.assessment_result,
      safeCandidate.assessmentResult,
      safeCandidate.assessment_result,
      metadata.assessmentResult,
      metadata.assessment_result,
      candidateSnapshot.assessmentResult,
      candidateSnapshot.assessment_result,
      pipelineCandidate.assessmentResult,
      pipelineCandidate.assessment_result,
      pipelineDetails.assessmentResult,
      pipelineDetails.assessment_result,
    ),
  );
}

function isAssessmentFailureHistoryValue(value = "") {
  const normalizedValue = normalizeLower(value)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (
    normalizedValue === "assessment failed" ||
    normalizedValue === "assessment not fit" ||
    normalizedValue.includes("assessment failed") ||
    normalizedValue.includes("assessment not fit")
  );
}

function isAssessmentFailureReasonValue(value = "") {
  const normalizedValue = normalizeLower(value)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return Boolean(
    isAssessmentFailureHistoryValue(normalizedValue) ||
      normalizedValue.includes("minimum required assessment score") ||
      normalizedValue.includes("did not meet the required assessment") ||
      normalizedValue.includes("did not meet the assessment standard")
  );
}

function getHistoryAssessmentStatus(item = {}, candidate = {}) {
  const safeItem = safeObject(item);
  const itemExtra = safeObject(safeItem.extra);
  const safeCandidate = safeObject(candidate);
  const metadata = safeObject(safeCandidate.metadata);
  const candidateSnapshot = safeObject(safeCandidate.candidateSnapshot);
  const pipelineCandidate = safeObject(safeCandidate.pipelineCandidate);
  const pipelineDetails = safeObject(safeCandidate.pipelineDetails);

  return cleanText(
    firstCandidateValue(
      safeItem.assessmentStatus,
      safeItem.assessment_status,
      itemExtra.assessmentStatus,
      itemExtra.assessment_status,
      safeCandidate.assessmentStatus,
      safeCandidate.assessment_status,
      metadata.assessmentStatus,
      metadata.assessment_status,
      candidateSnapshot.assessmentStatus,
      candidateSnapshot.assessment_status,
      pipelineCandidate.assessmentStatus,
      pipelineCandidate.assessment_status,
      pipelineDetails.assessmentStatus,
      pipelineDetails.assessment_status,
    ),
  );
}

function isAssessmentUpdateSubmitted(item = {}, candidate = {}) {
  return normalizeLower(getHistoryAssessmentStatus(item, candidate)) === "taken";
}

function getHistoryStatusLabel(item = {}, historyTitle = "", candidate = {}) {
  const extra = safeObject(item.extra);
  const normalizedHistoryTitle = normalizeLower(historyTitle)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const isDropOffHistory =
    isDropOffCandidateStatus(historyTitle) ||
    normalizedHistoryTitle === "drop off" ||
    normalizedHistoryTitle === "dropped off" ||
    isDropOffCandidateStatus(item.status) ||
    isDropOffCandidateStatus(item.candidateStatus) ||
    isDropOffCandidateStatus(item.candidate_status) ||
    isDropOffCandidateStatus(extra.toStage) ||
    isDropOffCandidateStatus(extra.to_stage);

  if (isDropOffHistory) {
    const assessmentSubmitted = isAssessmentUpdateSubmitted(item, candidate);
    const dropOffCategory = getHistoryDropOffCategory(item, candidate);

    if (dropOffCategory) {
      if (isAssessmentFailureHistoryValue(dropOffCategory)) {
        return assessmentSubmitted ? "Assessment Failed" : "Drop-off";
      }

      return dropOffCategory;
    }

    const assessmentResult = getHistoryAssessmentResult(item, candidate);

    if (
      assessmentSubmitted &&
      isAssessmentFailureHistoryValue(assessmentResult)
    ) {
      return "Assessment Failed";
    }

    return "Drop-off";
  }

  const resolvedStatus = firstCandidateValue(
    item.statusLabel,
    item.status_label,
    item.assessmentResult,
    item.assessment_result,
    extra.assessmentResult,
    extra.assessment_result,
    item.prfStatus,
    item.prf_status,
    extra.prfStatus,
    extra.prf_status,
    item.interviewStatus,
    item.interview_status,
    extra.interviewStatus,
    extra.interview_status,
    item.offerApprovalStatus,
    item.offer_approval_status,
    extra.approvalSummary,
    extra.approval_summary,
    item.offerDecision,
    item.offer_decision,
    item.candidateStatus,
    item.candidate_status,
    item.status,
    extra.status,
    item.outcome,
    extra.outcome,
    extra.toStage,
    extra.to_stage,
    historyTitle,
  );

  const normalizedStatus = cleanText(resolvedStatus);

  if (isDropOffCandidateStatus(normalizedStatus)) {
    return "Drop-off";
  }

  return normalizedStatus || cleanText(historyTitle) || "Application Update";
}

function getHistoryDescription(item = {}) {
  const directDescription =
    item.description ||
    item.reason ||
    item.message ||
    item.note ||
    item.outcome ||
    "";

  if (directDescription) return directDescription;

  const title = getHistoryTitle(item);

  if (title === "Initial Screening") return "Candidate moved from Talent Pool.";
  if (title === "Online Assessment") return "Candidate moved to Online Assessment.";
  if (title === "Interview Scheduled") {
    return "Candidate interview schedule was set.";
  }
  if (title === "Interviewed") return "Final interview form was submitted.";
  if (title === "Offered") return "Offer details prepared for approval.";
  if (title === "Accepted") return "Candidate accepted the offer.";
  if (title === "For NHO") return "Candidate moved to For NHO.";
  if (title === INCOMPLETE_ONBOARDING_STAGE) {
    return "Candidate has fewer than 5 major requirements and was routed to Talent Pool for follow-up.";
  }
  if (title === ONBOARDING_STAGE) {
    return "Candidate completed the 5 major requirements and moved to Onboarding.";
  }

  return "Candidate application record updated.";
}

function getOfferDetail(item = {}) {
  const role =
    item.offerRole ||
    item.finalRole ||
    item.currentAppliedRole ||
    item.appliedRole ||
    item.role ||
    item.roleTitle ||
    item.offerDetails?.roleTitle ||
    item.extra?.offerDetails?.roleTitle ||
    "";

  const account =
    item.offerAccount ||
    item.finalAccount ||
    item.currentAppliedAccount ||
    item.appliedAccount ||
    item.account ||
    item.offerDetails?.account ||
    item.extra?.offerDetails?.account ||
    "";

  const basicPay =
    item.basicPay ||
    item.offerDetails?.basicPay ||
    item.extra?.offerDetails?.basicPay ||
    item.compensation ||
    "";

  const deminimisDailyRate =
    item.deminimisDailyRate ||
    item.offerDetails?.deminimisDailyRate ||
    item.extra?.offerDetails?.deminimisDailyRate ||
    "";

  const hiringRequirement =
    item.hiringRequirementId ||
    item.offerDetails?.hiringRequirementId ||
    item.extra?.offerDetails?.hiringRequirementId ||
    "";

  const details = [];

  if (hiringRequirement) details.push(`Hiring Requirement: ${hiringRequirement}`);
  if (role) details.push(`Final Role: ${role}`);
  if (account) details.push(`Final Account: ${account}`);
  if (basicPay) details.push(`Basic Pay: ${formatCurrency(basicPay)}`);
  if (deminimisDailyRate) {
    details.push(`Deminimis / Daily Rate: ${formatCurrency(deminimisDailyRate)}`);
  }

  return details.join(", ");
}

function normalizeHistoryItem(item = {}, candidate = {}, fallbackOwner = "—") {
  const historyTitle = getHistoryTitle(item);
  const historyStatus = getHistoryStatusLabel(
    item,
    historyTitle,
    candidate,
  );
  const historyDate = getHistoryDate(item);
  const historyDescription = getHistoryDescription(item);
  const historyRemarks = item.remarks || item.dropOffReason || "";
  const offerDetail = getOfferDetail(item);
  const savedFormLink =
    item.savedFormLink ||
    item.jobEvaluationLink ||
    item.extra?.savedFormLink ||
    item.extra?.jobEvaluationLink ||
    "";
  const sortDate = getNormalizedHistoryDate(historyDate);

  return {
    ...item,
    stage: historyTitle,
    statusLabel: historyStatus,
    status_label: historyStatus,
    date: historyDate,
    owner: getHistoryOwner(item, candidate, fallbackOwner),
    description: historyDescription,
    remarks: historyRemarks,
    offerDetail,
    savedFormLink,
    _dedupeKey: [
      historyTitle,
      historyStatus,
      sortDate,
      historyDescription,
      historyRemarks,
      offerDetail,
      savedFormLink,
    ]
      .join("|")
      .toLowerCase()
      .trim(),
    _sortDate: sortDate,
  };
}

function toPersistedCandidateHistory(history = []) {
  return safeArray(history)
    .map((historyItem) => {
      const {
        _dedupeKey,
        _sortDate,
        ...persistedItem
      } = safeObject(historyItem);

      return {
        ...persistedItem,
        stage: persistedItem.stage || getHistoryTitle(persistedItem),
        date: persistedItem.date || getHistoryDate(persistedItem),
      };
    })
    .filter((historyItem) => historyItem.stage || historyItem.description);
}

function getCandidateDropOffHistoryEntry(
  candidate = {},
  fallbackOwner = "—",
) {
  const safeCandidate = safeObject(candidate);
  const metadata = safeObject(safeCandidate.metadata);
  const candidateSnapshot = safeObject(safeCandidate.candidateSnapshot);
  const pipelineCandidate = safeObject(safeCandidate.pipelineCandidate);
  const pipelineDetails = safeObject(safeCandidate.pipelineDetails);

  const sources = [
    safeCandidate,
    metadata,
    candidateSnapshot,
    pipelineCandidate,
    pipelineDetails,
  ];

  const getFirstSourceValue = (...fieldNames) => {
    for (const source of sources) {
      for (const fieldName of fieldNames) {
        const value = source?.[fieldName];

        if (hasCandidateValue(value)) {
          return value;
        }
      }
    }

    return "";
  };

  const statusValues = sources.flatMap((source) => [
    source.status,
    source.candidateStatus,
    source.candidate_status,
    source.pipelineStatus,
    source.pipeline_status,
    source.currentPipelineStage,
    source.current_pipeline_stage,
    source.currentStage,
    source.current_stage,
    source.pipelineStage,
    source.pipeline_stage,
    source.stage,
  ]);

  const category = cleanText(
    getFirstSourceValue(
      "dropOffCategory",
      "drop_off_category",
      "dropoffCategory",
      "dropoff_category",
    ),
  );

  const assessmentStatus = cleanText(
    getFirstSourceValue("assessmentStatus", "assessment_status"),
  );

  const assessmentResult = cleanText(
    getFirstSourceValue("assessmentResult", "assessment_result"),
  );

  const assessmentScore = cleanText(
    getFirstSourceValue(
      "assessmentScore",
      "assessment_score",
      "assessmentScorePercent",
      "assessment_score_percent",
    ),
  );

  const reason = cleanText(
    getFirstSourceValue(
      "dropOffReason",
      "drop_off_reason",
      "dropoffReason",
      "dropoff_reason",
      "reasonForMovement",
      "reason_for_movement",
    ),
  );

  const droppedOffAt = cleanText(
    getFirstSourceValue(
      "droppedOffAt",
      "dropped_off_at",
      "dropOffDate",
      "drop_off_date",
      "dropoffDate",
      "dropoff_date",
      "dateMoved",
      "date_moved",
    ),
  );

  const hasDropOffStatus = statusValues.some((value) =>
    isDropOffCandidateStatus(value),
  );

  const isAssessmentSubmitted =
    normalizeLower(assessmentStatus) === "taken";
  const numericAssessmentScore = Number(assessmentScore);
  const isAssessmentFailure = Boolean(
    isAssessmentSubmitted &&
      (isAssessmentFailureHistoryValue(category) ||
        isAssessmentFailureHistoryValue(assessmentResult) ||
        (assessmentScore !== "" &&
          Number.isFinite(numericAssessmentScore) &&
          numericAssessmentScore < 30)),
  );

  if (
    !hasDropOffStatus &&
    !category &&
    !reason &&
    !droppedOffAt &&
    !isAssessmentFailure
  ) {
    return null;
  }

  const resolvedCategory =
    !isAssessmentSubmitted && isAssessmentFailureHistoryValue(category)
      ? ""
      : category || (isAssessmentFailure ? "Assessment Failed" : "");

  const displayedAssessmentResult = isAssessmentSubmitted
    ? assessmentResult
    : "";
  const displayedAssessmentScore = isAssessmentSubmitted
    ? assessmentScore
    : "";

  const owner = cleanText(
    getFirstSourceValue(
      "droppedOffByName",
      "dropped_off_by_name",
      "dropOffOwner",
      "drop_off_owner",
      "updatedBy",
      "updated_by",
    ),
  );

  const fallbackDate = cleanText(
    getFirstSourceValue(
      "lastActivity",
      "last_activity",
      "updatedAt",
      "updated_at",
      "createdAt",
      "created_at",
    ),
  );

  const displayedReason =
    !isAssessmentSubmitted && isAssessmentFailureReasonValue(reason)
      ? ""
      : reason;

  const resolvedReason =
    displayedReason ||
    (isAssessmentFailure
      ? "Candidate did not meet the minimum required assessment score."
      : "Candidate was moved to Drop-off.");

  const remarks = [
    resolvedCategory ? `Category: ${resolvedCategory}` : "",
    displayedAssessmentResult
      ? `Assessment Result: ${displayedAssessmentResult}`
      : "",
    displayedAssessmentScore
      ? `Assessment Score: ${displayedAssessmentScore} / 100`
      : "",
    resolvedReason ? `Reason: ${resolvedReason}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    stage: "Drop-off",
    status: resolvedCategory || "Drop Off",
    statusLabel: resolvedCategory || "Drop-off",
    status_label: resolvedCategory || "Drop-off",
    outcome: resolvedCategory || "Marked as Drop Off",
    date: droppedOffAt || fallbackDate,
    timestamp: droppedOffAt || fallbackDate,
    owner: owner || fallbackOwner || "—",
    description: isAssessmentFailure
      ? "Candidate failed the assessment and was moved to Drop-off."
      : "Candidate was moved to Drop-off.",
    reason: resolvedReason,
    remarks,
    assessmentStatus,
    assessment_status: assessmentStatus,
    assessmentResult: displayedAssessmentResult,
    assessment_result: displayedAssessmentResult,
    assessmentScore: displayedAssessmentScore,
    assessment_score: displayedAssessmentScore,
    dropOffReason: resolvedReason,
    drop_off_reason: resolvedReason,
    dropOffCategory: resolvedCategory,
    drop_off_category: resolvedCategory,
    source: isAssessmentFailure ? "Assessment" : "Drop-off",
    extra: {
      category: resolvedCategory,
      assessmentStatus,
      assessmentResult: displayedAssessmentResult,
      assessmentScore: displayedAssessmentScore,
      toStage: "Drop-off",
    },
  };
}

function isDropOffHistoryItem(item = {}) {
  return isDropOffCandidateStatus(getHistoryTitle(item));
}

function getCandidateApplicationHistory(candidate = {}, fallbackOwner = "—") {
  const safeCandidate = safeObject(candidate);
  const metadata = safeObject(safeCandidate.metadata);
  const pipelineCandidate = safeObject(safeCandidate.pipelineCandidate);
  const pipelineDetails = safeObject(safeCandidate.pipelineDetails);
  const candidateSnapshot = safeObject(safeCandidate.candidateSnapshot);

  const sources = [
    safeCandidate.applicationHistory,
    safeCandidate.movementTimeline,
    safeCandidate.movementHistory,
    safeCandidate.pipelineHistory,
    safeCandidate.stageHistory,
    safeCandidate.timeline,
    safeCandidate.history,
    safeCandidate.activityHistory,

    candidateSnapshot.applicationHistory,
    candidateSnapshot.timeline,
    candidateSnapshot.movementTimeline,

    metadata.applicationHistory,
    metadata.timeline,
    metadata.movementTimeline,
    metadata.pipelineHistory,
    metadata.pipelineTimeline,

    pipelineCandidate.timeline,
    pipelineCandidate.movementTimeline,
    pipelineCandidate.movementHistory,
    pipelineCandidate.pipelineHistory,
    pipelineCandidate.stageHistory,
    pipelineCandidate.history,
    pipelineCandidate.activityHistory,

    pipelineDetails.timeline,
    pipelineDetails.movementTimeline,
    pipelineDetails.movementHistory,
    pipelineDetails.pipelineHistory,
    pipelineDetails.stageHistory,
    pipelineDetails.history,
    pipelineDetails.activityHistory,
  ];

  const merged = sources
    .filter(Array.isArray)
    .flat()
    .filter(Boolean)
    .map((item) => normalizeHistoryItem(item, safeCandidate, fallbackOwner))
    .filter((item) => item.stage || item.description);

  const dropOffHistoryEntry = getCandidateDropOffHistoryEntry(
    safeCandidate,
    fallbackOwner,
  );

  if (dropOffHistoryEntry) {
    const dropOffHistoryIndex = merged.findIndex((item) =>
      isDropOffHistoryItem(item),
    );

    if (dropOffHistoryIndex >= 0) {
      const existingDropOffHistory = merged[dropOffHistoryIndex];
      const existingOwner = cleanText(existingDropOffHistory.owner);

      merged[dropOffHistoryIndex] = normalizeHistoryItem(
        {
          ...existingDropOffHistory,
          ...dropOffHistoryEntry,
          date:
            existingDropOffHistory.date ||
            dropOffHistoryEntry.date,
          timestamp:
            existingDropOffHistory.timestamp ||
            dropOffHistoryEntry.timestamp ||
            existingDropOffHistory.date ||
            dropOffHistoryEntry.date,
          owner:
            existingOwner && existingOwner !== "—"
              ? existingOwner
              : dropOffHistoryEntry.owner,
          description:
            dropOffHistoryEntry.description ||
            existingDropOffHistory.description,
          remarks:
            dropOffHistoryEntry.remarks ||
            existingDropOffHistory.remarks,
        },
        safeCandidate,
        fallbackOwner,
      );
    } else {
      merged.push(
        normalizeHistoryItem(
          dropOffHistoryEntry,
          safeCandidate,
          fallbackOwner,
        ),
      );
    }
  }

  const uniqueMap = new Map();

  merged.forEach((item) => {
    const key = item._dedupeKey;

    if (!key) return;

    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  });

  return Array.from(uniqueMap.values()).sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();

    if (Number.isNaN(dateA) && Number.isNaN(dateB)) return 0;
    if (Number.isNaN(dateA)) return 1;
    if (Number.isNaN(dateB)) return -1;

    return dateA - dateB;
  });
}

function getFilesForRequirement(files = [], requirement = "") {
  const requirementKey = normalizeRequirementKey(requirement);

  return files.filter((file) => {
    const officialKey = normalizeRequirementKey(file.officialRequirement);
    const displayKey = normalizeRequirementKey(file.requirement);

    return officialKey === requirementKey || displayKey === requirementKey;
  });
}

function getCompletedCountForGroup(files = [], requirements = []) {
  return requirements.filter(
    (requirement) => getFilesForRequirement(files, requirement).length > 0,
  ).length;
}

function buildCandidatePipelineNavigationUrl(candidate = {}, pipelineId = "") {
  const stage = getCandidateStageValue(candidate);
  const candidateId = getCandidatePublicId(candidate);
  const resolvedPipelineId = cleanText(
    pipelineId || getResolvedPipelineId(candidate),
  );

  const params = new URLSearchParams();

  if (stage) params.set("stage", stage);
  if (candidateId) params.set("candidateId", candidateId);
  if (resolvedPipelineId) params.set("pipelineId", resolvedPipelineId);

  return `${CANDIDATE_PIPELINE_ROUTE}${
    params.toString() ? `?${params.toString()}` : ""
  }`;
}

function buildOnboardingNavigationUrl(candidate = {}, pipelineId = "") {
  const candidateId = getCandidatePublicId(candidate);
  const resolvedPipelineId = cleanText(
    pipelineId || getResolvedPipelineId(candidate),
  );

  const params = new URLSearchParams();

  if (candidateId) params.set("candidateId", candidateId);
  if (resolvedPipelineId) params.set("pipelineId", resolvedPipelineId);

  return `${ONBOARDING_ROUTE}${params.toString() ? `?${params.toString()}` : ""}`;
}

function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="mb-3.5 flex flex-col gap-2 border-b border-sibs-border pb-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon && (
            <span className="flex h-7 w-7 2xl:h-8 2xl:w-8 shrink-0 items-center justify-center rounded-lg bg-[#E9F0FC] text-sibs-navy shadow-2xs">
              <Icon size={15} />
            </span>
          )}

          <h3 className="break-words text-xs 2xl:text-sm font-black uppercase tracking-wider text-sibs-navy">
            {title}
          </h3>
        </div>

        {description && (
          <p className="mt-0.5 text-[10px] 2xl:text-[11px] font-semibold text-sibs-text-muted">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function ProfileGrid({ children, cols = "md:grid-cols-2", className = "" }) {
  return (
    <div
      className={`grid min-w-0 grid-cols-1 gap-x-2.5 gap-y-2 sm:grid-cols-2 lg:grid-cols-3 ${cols} ${className}`}
    >
      {children}
    </div>
  );
}

function ProfileDetail({ label, value, mono = false, className = "" }) {
  const hasValue = hasCandidateValue(value);
  const displayValue = hasValue ? value : "—";

  return (
    <div className={`flex min-w-0 flex-col gap-0.5 text-left ${className}`}>
      <span className="block text-[9px] 2xl:text-[9.5px] font-extrabold uppercase tracking-wide text-sibs-text-muted">
        {label}
      </span>

      <div className="flex min-h-[30px] 2xl:min-h-[34px] items-center rounded-lg border border-sibs-border bg-[#F8FAFC] px-2.5 py-1 transition-colors duration-150">
        <span
          title={String(displayValue)}
          className={`block min-w-0 break-words text-[11px] 2xl:text-xs font-bold leading-tight ${
            hasValue ? "text-sibs-navy" : "text-sibs-text-muted"
          } ${mono ? "font-mono" : ""}`}
        >
          {displayValue}
        </span>
      </div>
    </div>
  );
}

function NhoRequirementCard({
  requirement,
  files = [],
  selectedFileId = "",
  onSelect,
}) {
  const hasFiles = files.length > 0;
  const isMajor = isMajorPreEmploymentRequirement(requirement);

  return (
    <div
      className={`rounded-xl border p-3.5 2xl:p-4 transition ${
        hasFiles
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-sibs-border bg-[#F8FAFC]"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
            hasFiles
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-[#B9C7D6] bg-white"
          }`}
        >
          {hasFiles && <Check size={14} strokeWidth={3} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <p
              title={requirement}
              className="truncate text-xs 2xl:text-sm font-extrabold text-sibs-navy"
            >
              {requirement}
            </p>

            {isMajor && (
              <span className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[9.5px] 2xl:text-[10px] font-extrabold uppercase tracking-wide text-sibs-navy">
                Major
              </span>
            )}
          </div>

          {!hasFiles && (
            <div className="mt-2.5 rounded-xl border border-dashed border-[#C9D6E4] bg-white px-3 py-2.5 text-xs font-bold text-sibs-text-muted">
              No uploaded file yet.
            </div>
          )}

          {hasFiles && (
            <div className="mt-2.5 space-y-1.5 2xl:space-y-2">
              {files.map((file) => {
                const isSelected = selectedFileId && selectedFileId === file.id;

                return (
                  <div
                    key={`${file.id}-${file.fileName}-${file.fileUrl}`}
                    className="space-y-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => onSelect?.(file)}
                      className={`flex w-full min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
                        isSelected
                          ? "border-sibs-orange bg-sibs-cream text-sibs-orange"
                          : "border-emerald-100 bg-white hover:bg-emerald-50 text-sibs-navy"
                      }`}
                    >
                      <FileTypeIcon
                        fileName={file.fileName}
                        size={16}
                        className={`shrink-0 ${
                          isSelected
                            ? "text-sibs-orange"
                            : "text-emerald-700"
                        }`}
                      />

                      <span className="min-w-0 flex-1">
                        <span
                          title={file.fileName || file.savedFileName}
                          className={`block truncate text-xs font-extrabold ${
                            isSelected
                              ? "text-sibs-orange"
                              : "text-emerald-900"
                          }`}
                        >
                          {file.fileName || file.savedFileName || "Uploaded file"}
                        </span>

                        <span
                          className={`mt-0.5 block truncate text-[10px] 2xl:text-[11px] font-bold ${
                            isSelected
                              ? "text-sibs-orange/80"
                              : "text-emerald-700/80"
                          }`}
                        >
                          {formatFileSize(file.fileSize)}
                        </span>
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileTextarea({ label, value, className = "" }) {
  const hasValue = hasCandidateValue(value);
  const displayValue = hasValue ? value : "—";

  return (
    <div className={`flex min-w-0 flex-col gap-0.5 text-left ${className}`}>
      <span className="block text-[9px] 2xl:text-[9.5px] font-extrabold uppercase tracking-wide text-sibs-text-muted">
        {label}
      </span>

      <div className="min-h-[55px] 2xl:min-h-[65px] rounded-lg border border-sibs-border bg-[#F8FAFC] px-2.5 py-1.5 transition-colors duration-150">
        <p
          className={`whitespace-pre-wrap break-words text-[11px] 2xl:text-xs font-bold leading-5 ${
            hasValue ? "text-sibs-navy" : "text-sibs-text-muted"
          }`}
        >
          {displayValue}
        </p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return <ProfileDetail label={label} value={value} />;
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-[#D9E2EC] bg-[#F8FAFC] px-4 py-8 text-center text-sm font-bold text-sibs-tertiary-5 sm:px-5">
      <p>{title}</p>

      {description && (
        <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
          {description}
        </p>
      )}
    </div>
  );
}

function NhoFilePreviewPanel({
  files = [],
  selectedFile,
  onSelectFile,
}) {
  const requirement = selectedFile?.requirement || files[0]?.requirement || "";
  const requirementFiles = requirement
    ? getFilesForRequirement(files, requirement)
    : [];

  const activeFile =
    requirementFiles.find((file) => file.id === selectedFile?.id) ||
    requirementFiles[0] ||
    null;

  if (!activeFile) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#B9C7D6] bg-[#F8FAFC] p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D9E2EC] bg-white text-sibs-primary-1 shadow-sm">
          <FileText size={27} />
        </div>

        <p className="mt-4 text-base font-extrabold text-[#101828]">
          No requirement selected
        </p>

        <p className="mt-2 max-w-xs text-sm font-semibold leading-6 text-sibs-tertiary-5">
          Select any uploaded requirement file to view all files saved under
          that requirement.
        </p>
      </div>
    );
  }

  const resolvedFileUrl = getResolvedFileUrl(activeFile.fileUrl);

  const isImageByType = String(activeFile.fileType || "").startsWith("image/");
  const isImageByName = /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(
    activeFile.fileName || activeFile.savedFileName || "",
  );

  const isPdf =
    String(activeFile.fileType || "").toLowerCase() === "application/pdf" ||
    /\.pdf$/i.test(activeFile.fileName || activeFile.savedFileName || "");

  const isImage =
    resolvedFileUrl &&
    (isImageByType || isImageByName) &&
    !String(resolvedFileUrl).startsWith("blob:");

  return (
    <div className="rounded-2xl border border-[#D9E2EC] bg-[#F8FAFC] p-5">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
          Requirement Files
        </p>

        <h3 className="mt-1 break-words text-base font-extrabold text-[#101828]">
          {requirement || "Pre-Employment Requirement"}
        </h3>

        <p className="mt-1 text-xs font-bold text-sibs-tertiary-5">
          {requirementFiles.length} file{requirementFiles.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {requirementFiles.map((file) => {
          const selected = file.id === activeFile.id;

          return (
            <button
              key={`${file.id}-${file.fileName}-${file.fileUrl}`}
              type="button"
              onClick={() => onSelectFile?.(file)}
              className={`flex w-full min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
                selected
                  ? "border-sibs-primary-1 bg-blue-50"
                  : "border-[#D9E2EC] bg-white hover:bg-[#F3F8FF]"
              }`}
            >
              <FileTypeIcon
                fileName={file.fileName || file.savedFileName}
                size={17}
                className={`shrink-0 ${
                  selected ? "text-sibs-primary-1" : "text-[#667085]"
                }`}
              />

              <span className="min-w-0 flex-1">
                <span
                  title={file.fileName || file.savedFileName}
                  className={`block truncate text-xs font-extrabold ${
                    selected ? "text-sibs-primary-1" : "text-[#344054]"
                  }`}
                >
                  {file.fileName || file.savedFileName || "Uploaded file"}
                </span>

                <span className="mt-0.5 block truncate text-[11px] font-bold text-sibs-tertiary-5">
                  {formatFileSize(file.fileSize)}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-3 rounded-xl border border-[#E6ECF2] bg-white p-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            Selected File
          </p>

          <p className="mt-1 break-words text-sm font-bold text-sibs-primary-1">
            {activeFile.fileName ||
              activeFile.savedFileName ||
              "Uploaded file"}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            Uploaded At
          </p>

          <p className="mt-1 text-sm font-bold text-sibs-primary-1">
            {formatUploadedDate(activeFile.uploadedAt)}
          </p>
        </div>

        {activeFile.uploadedBy && (
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
              Uploaded By
            </p>

            <p className="mt-1 break-words text-sm font-bold text-sibs-primary-1">
              {activeFile.uploadedBy}
            </p>
          </div>
        )}
      </div>

      {isImage && (
        <div className="mt-5 overflow-hidden rounded-xl border border-[#E6ECF2] bg-white">
          <img
            src={resolvedFileUrl}
            alt={
              activeFile.fileName ||
              activeFile.savedFileName ||
              "Uploaded file"
            }
            className="max-h-[360px] w-full object-contain"
          />
        </div>
      )}

      {isPdf && resolvedFileUrl && (
        <iframe
          src={resolvedFileUrl}
          title={
            activeFile.fileName ||
            activeFile.savedFileName ||
            "Uploaded PDF"
          }
          className="mt-5 h-[420px] w-full rounded-xl border border-[#E6ECF2] bg-white"
        />
      )}

      {resolvedFileUrl && (
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <a
            href={resolvedFileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D9E2EC] bg-white px-4 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
          >
            <Eye size={16} />
            Preview
          </a>

          <a
            href={resolvedFileUrl}
            download={
              activeFile.fileName ||
              activeFile.savedFileName ||
              "candidate-document"
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-4 text-sm font-extrabold text-white transition hover:opacity-90"
          >
            <Download size={16} />
            Download
          </a>
        </div>
      )}
    </div>
  );
}

function CandidateNhoFilesSection({
  files = [],
  selectedFile,
  onSelectFile,
  isLoading = false,
  error = "",
  canUpload = false,
  onUploadFollowUp,
}) {
  const majorProgress = useMemo(
    () => calculateMajorRequirementProgress(files),
    [files],
  );

  const totalProgress = useMemo(
    () => calculateTotalRequirementProgress(files),
    [files],
  );

  return (
    <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <SectionTitle
          icon={FileText}
          title="Pre-Employment / NHO Files"
          description="Candidate Pipeline NHO uploaded files and follow-up requirements."
        />

        {canUpload && (
          <button
            type="button"
            onClick={onUploadFollowUp}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]"
          >
            <UploadCloud size={17} />
            Upload Follow-up Requirements
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <section className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-lg font-extrabold text-[#101828]">
                  Candidate Pipeline NHO Uploaded Files
                </h3>

                <p className="mt-1 text-sm font-semibold text-sibs-primary-1/80">
                  Review and monitor candidate pre-employment requirements
                  uploaded from Candidate Pipeline.
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                    majorProgress.isComplete
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {majorProgress.completed} / {majorProgress.total} Major
                </span>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-sibs-primary-1">
                  {totalProgress.completed} / {totalProgress.total} Total
                </span>

                <span className="rounded-full bg-[#F2F6FA] px-3 py-1 text-xs font-extrabold text-[#344054]">
                  {isLoading
                    ? "Loading..."
                    : `${files.length} upload${files.length === 1 ? "" : "s"}`}
                </span>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <span>Major Completion</span>
                <span>{majorProgress.percent}%</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-[#EEF4FA]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    majorProgress.isComplete
                      ? "bg-emerald-600"
                      : "bg-sibs-primary-1"
                  }`}
                  style={{ width: `${majorProgress.percent}%` }}
                />
              </div>

              <div className="mb-2 mt-4 flex items-center justify-between text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <span>Total Completion</span>
                <span>{totalProgress.percent}%</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-[#EEF4FA]">
                <div
                  className="h-full rounded-full bg-sibs-primary-1/70 transition-all duration-300"
                  style={{ width: `${totalProgress.percent}%` }}
                />
              </div>
            </div>

            {!majorProgress.isComplete && (
              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-700">
                Candidate has fewer than 5 major requirements. Candidate should
                remain under{" "}
                <span className="font-extrabold">
                  For Onboarding - Incomplete Requirements
                </span>{" "}
                for Talent Pool follow-up.
              </div>
            )}

            {majorProgress.isComplete && (
              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-700">
                Candidate completed the 5 major requirements and can proceed to
                Onboarding.
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-700">
                {error}
              </div>
            )}

            {isLoading && files.length === 0 && (
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold leading-6 text-blue-700">
                Loading Candidate Pipeline NHO uploaded files...
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
            <h3 className="text-lg font-extrabold text-[#101828]">
              Pre-Employment Requirements
            </h3>

            <div className="mt-5 space-y-6">
              {PRE_EMPLOYMENT_REQUIREMENT_GROUPS.map((group) => {
                const groupCompleted = getCompletedCountForGroup(
                  files,
                  group.requirements,
                );

                return (
                  <div
                    key={group.id}
                    className="border-t border-[#E6ECF2] pt-5 first:border-t-0 first:pt-0"
                  >
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <h4 className="text-base font-extrabold text-sibs-primary-1">
                          {group.title}
                        </h4>

                        <span className="rounded-full bg-[#F2F6FA] px-3 py-1 text-xs font-extrabold text-sibs-primary-1">
                          {groupCompleted} / {group.requirements.length}
                        </span>
                      </div>

                      {group.id === "major" && (
                        <span
                          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-extrabold ${
                            groupCompleted >= group.requirements.length
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          Required before Onboarding
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {group.requirements.map((requirement) => (
                        <NhoRequirementCard
                          key={requirement}
                          requirement={requirement}
                          files={getFilesForRequirement(files, requirement)}
                          selectedFileId={selectedFile?.id || ""}
                          onSelect={onSelectFile}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-0 xl:self-start">
          <NhoFilePreviewPanel
            files={files}
            selectedFile={selectedFile}
            onSelectFile={onSelectFile}
          />
        </aside>
      </div>
    </section>
  );
}

function TalentPoolStatusDropdown({
  value,
  onChange,
  options = [],
  placeholder = "Select status",
  disabled = false,
}) {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value || ""),
  );

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
    onChange?.(nextValue);
    setOpen(false);
  }

  return (
    <div
      ref={dropdownRef}
      className={`relative min-w-0 font-jakarta ${open ? "z-[100050]" : "z-[1]"}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-10 2xl:h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-[#F8FAFC] px-3.5 text-left text-xs font-semibold shadow-xs outline-none transition ${
          open
            ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10"
            : "border-[#D7DEE8] hover:border-[#FF5C28]/40 hover:bg-white"
        } ${
          disabled
            ? "cursor-not-allowed bg-gray-50 text-gray-400 opacity-70"
            : "text-[#042C51]"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selectedOption ? "text-[#042C51] font-bold" : "text-gray-400 font-normal"
          }`}
        >
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          size={16}
          className={`shrink-0 text-[#FF5C28] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="sibs-animated-dropdown-box absolute left-0 right-0 top-[calc(100%+6px)] z-[100060] overflow-hidden rounded-xl border border-[#DCE6F1] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="max-h-64 overflow-y-auto" role="listbox">
            {options.length > 0 ? (
              options.map((option) => {
                const active =
                  String(option.value) === String(value || "");

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => handleSelect(option.value)}
                    className={`block w-full px-3.5 py-2.5 text-left text-xs font-semibold transition ${
                      active
                        ? "bg-[#FFF0EB] text-[#FF5C28] font-extrabold"
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
              <div className="px-3.5 py-2.5 text-xs font-semibold text-gray-400">
                No status options found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CandidateProfileModal() {
  const navigate = useNavigate();
  const { user } = useUser();
  const currentAuditActorLabel = useMemo(
    () => formatCurrentAuditActorLabel(user),
    [user],
  );

  const {
    selectedCandidate,
    setSelectedCandidate,
    currentTaOwner,
    openMoveToPipeline,
    refreshTalentPool,
    setCandidateList,
  } = useTalentPool();

  const [showFullApplicationHistory, setShowFullApplicationHistory] =
    useState(false);
  const [activeTab, setActiveTab] = useState("personal.basic");
  const [tabAnimationKey, setTabAnimationKey] = useState(0);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
    closeProfileOnClose: false,
  });

  const [talentPoolCandidateDetails, setTalentPoolCandidateDetails] =
    useState(null);

  const [applicationAnswers, setApplicationAnswers] = useState({
    form: null,
    applicationCount: 1,
    answers: [],
  });
  const [applicationAnswersLoading, setApplicationAnswersLoading] =
    useState(false);
  const [applicationAnswersError, setApplicationAnswersError] = useState("");

  const [pipelineCandidateDetails, setPipelineCandidateDetails] = useState(null);
  const [pipelineCandidateDetailsLoading, setPipelineCandidateDetailsLoading] =
    useState(false);
  const [pipelineCandidateDetailsError, setPipelineCandidateDetailsError] =
    useState("");

  const [resolvedPipelineId, setResolvedPipelineId] = useState("");

  const [candidatePipelineFiles, setCandidatePipelineFiles] = useState([]);
  const [candidatePipelineFilesLoading, setCandidatePipelineFilesLoading] =
    useState(false);
  const [candidatePipelineFilesError, setCandidatePipelineFilesError] =
    useState("");

  const [selectedNhoFile, setSelectedNhoFile] = useState(null);
  const [showNhoUploadModal, setShowNhoUploadModal] = useState(false);
  const [isMovingToOnboarding, setIsMovingToOnboarding] = useState(false);

  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [statusUpdateValue, setStatusUpdateValue] = useState("");
  const [statusUpdateSaving, setStatusUpdateSaving] = useState(false);
  const [statusUpdateValidation, setStatusUpdateValidation] = useState("");

  const [dropOffOpen, setDropOffOpen] = useState(false);
  const [dropOffReason, setDropOffReason] = useState("");
  const [dropOffSaving, setDropOffSaving] = useState(false);
  const [dropOffValidation, setDropOffValidation] = useState("");
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);

  const talentPoolApplicationId = useMemo(
    () => getTalentPoolApplicationId(selectedCandidate),
    [selectedCandidate],
  );

  const shouldLoadCandidatePipelineData = useMemo(
    () => isCandidateActivelyLinkedToPipeline(selectedCandidate),
    [selectedCandidate],
  );

  const candidatePipelineLookupId = useMemo(
    () =>
      shouldLoadCandidatePipelineData
        ? getCandidatePipelineLookupId(selectedCandidate)
        : "",
    [selectedCandidate, shouldLoadCandidatePipelineData],
  );

  useEffect(() => {
    setActiveTab("personal.basic");
    setShowFullApplicationHistory(false);
    setSelectedNhoFile(null);
    setShowNhoUploadModal(false);
    setTalentPoolCandidateDetails(null);
    setApplicationAnswers({ form: null, applicationCount: 1, answers: [] });
    setApplicationAnswersLoading(false);
    setApplicationAnswersError("");
    setPipelineCandidateDetails(null);
    setResolvedPipelineId("");
    setCandidatePipelineFiles([]);
    setCandidatePipelineFilesError("");
    setPipelineCandidateDetailsError("");
    setStatusUpdateOpen(false);
    setStatusUpdateValue("");
    setStatusUpdateValidation("");
    setDropOffOpen(false);
    setDropOffReason("");
    setDropOffValidation("");
    setIsGeneratingResume(false);
  }, [selectedCandidate?.id, selectedCandidate?.candidateId]);

  const loadTalentPoolCandidateDetails = useCallback(async () => {
    if (!selectedCandidate || !talentPoolApplicationId) {
      setTalentPoolCandidateDetails(null);
      return;
    }

    try {
      const response = await getTalentPoolApplicationById(
        talentPoolApplicationId,
      );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Unable to load the latest Talent Pool candidate details.",
        );
      }

      const responseCandidate = safeObject(
        response?.data ||
          response?.application ||
          response?.candidate ||
          {},
      );

      const responsePipelineCandidate = safeObject(
        response?.pipelineCandidate ||
          response?.candidate ||
          responseCandidate.pipelineCandidate ||
          responseCandidate.pipelineDetails ||
          {},
      );

      const responseApplicationHistory = safeArray(
        responseCandidate.applicationHistory ||
          responseCandidate.application_history ||
          responseCandidate.movementTimeline ||
          responseCandidate.movement_timeline ||
          responseCandidate.timeline ||
          response?.applicationHistory,
      );

      setTalentPoolCandidateDetails({
        ...safeObject(selectedCandidate),
        ...responseCandidate,
        applicationHistory: responseApplicationHistory.length
          ? responseApplicationHistory
          : safeArray(selectedCandidate.applicationHistory),
        application_history: responseApplicationHistory.length
          ? responseApplicationHistory
          : safeArray(
              selectedCandidate.application_history ||
                selectedCandidate.applicationHistory,
            ),
        movementTimeline: responseApplicationHistory.length
          ? responseApplicationHistory
          : safeArray(selectedCandidate.movementTimeline),
        movement_timeline: responseApplicationHistory.length
          ? responseApplicationHistory
          : safeArray(selectedCandidate.movement_timeline),
        timeline: responseApplicationHistory.length
          ? responseApplicationHistory
          : safeArray(selectedCandidate.timeline),
        pipelineCandidate: Object.keys(responsePipelineCandidate).length
          ? responsePipelineCandidate
          : safeObject(selectedCandidate.pipelineCandidate),
        pipelineDetails: Object.keys(responsePipelineCandidate).length
          ? responsePipelineCandidate
          : safeObject(selectedCandidate.pipelineDetails),
      });
    } catch (error) {
      console.error(
        "Load Talent Pool candidate details error:",
        getApiErrorMessage(
          error,
          "Unable to load the latest Talent Pool candidate details.",
        ),
      );
      setTalentPoolCandidateDetails(null);
    }
  }, [selectedCandidate, talentPoolApplicationId]);

  useEffect(() => {
    loadTalentPoolCandidateDetails();
  }, [loadTalentPoolCandidateDetails]);


  useEffect(() => {
    let cancelled = false;

    if (activeTab !== "answers") return undefined;

    if (!selectedCandidate || !talentPoolApplicationId) {
      setApplicationAnswers({ form: null, applicationCount: 1, answers: [] });
      setApplicationAnswersError("");
      setApplicationAnswersLoading(false);
      return undefined;
    }

    async function loadApplicationAnswers() {
      setApplicationAnswersLoading(true);
      setApplicationAnswersError("");

      try {
        const response = await getTalentPoolApplicationAnswers(
          talentPoolApplicationId,
        );

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Unable to load application questions and answers.",
          );
        }

        if (cancelled) return;

        const payload = safeObject(response?.data);

        setApplicationAnswers({
          form: safeObject(payload.form),
          applicationCount: Number(payload.applicationCount || 1),
          answers: safeArray(payload.answers),
        });
      } catch (error) {
        if (cancelled) return;

        setApplicationAnswers({ form: null, applicationCount: 1, answers: [] });
        setApplicationAnswersError(
          getApiErrorMessage(
            error,
            "Unable to load application questions and answers.",
          ),
        );
      } finally {
        if (!cancelled) {
          setApplicationAnswersLoading(false);
        }
      }
    }

    loadApplicationAnswers();

    return () => {
      cancelled = true;
    };
  }, [activeTab, selectedCandidate, talentPoolApplicationId]);

  const loadCandidatePipelineNhoFiles = useCallback(async () => {
    if (!selectedCandidate) return;

    const localFiles = getCandidatePreEmploymentFiles(selectedCandidate);

    setCandidatePipelineFiles(localFiles);
    setPipelineCandidateDetailsError("");
    setCandidatePipelineFilesError("");

    if (!shouldLoadCandidatePipelineData) {
      /*
        A restored Drop-off candidate is now Talent Pool-only. Do not call the
        Candidate Pipeline detail or NHO endpoints with the old soft-deleted
        pipeline ID because those routes correctly return 404.
      */
      setPipelineCandidateDetails(null);
      setResolvedPipelineId("");
      setPipelineCandidateDetailsLoading(false);
      setCandidatePipelineFilesLoading(false);
      return;
    }

    setPipelineCandidateDetailsLoading(true);
    setCandidatePipelineFilesLoading(true);

    try {
      const resolvedPipelineCandidate =
        await fetchPipelineCandidateByAnyIdentity(selectedCandidate);

      const pipelineCandidate = safeObject(resolvedPipelineCandidate);
      const pipelineId =
        getResolvedPipelineId(pipelineCandidate) || candidatePipelineLookupId;

      if (Object.keys(pipelineCandidate).length) {
        setPipelineCandidateDetails(pipelineCandidate);
      }

      if (pipelineId) {
        setResolvedPipelineId(pipelineId);
      }

      const pipelineLocalFiles = getCandidatePreEmploymentFiles({
        ...selectedCandidate,
        pipelineCandidate,
        pipelineDetails: pipelineCandidate,
      });

      let responseFiles = [];

      if (pipelineId) {
        try {
          const nhoResponse = await api.get(
            `/api/candidate-pipeline/${encodeURIComponent(
              pipelineId,
            )}/nho/files`,
            {
              withCredentials: true,
              params: {
                /*
                 * Candidate Profile is a complete file viewer. Request every
                 * physical file saved for every pre-employment requirement,
                 * including multiple files under the same requirement.
                 */
                includeAllFiles: 1,
                _t: Date.now(),
              },
            },
          );

          /*
           * Keep the full response array. normalizeCandidateFiles only removes
           * true duplicates by physical file identity; it does not collapse
           * files merely because they share the same requirement.
           */
          responseFiles = getNhoFilesFromApiResponse(nhoResponse);
        } catch (error) {
          if (!pipelineLocalFiles.length && !localFiles.length) {
            setCandidatePipelineFilesError(
              getApiErrorMessage(
                error,
                "Unable to load pre-employment files from Candidate Pipeline.",
              ),
            );
          }
        }
      }

      const allFiles = normalizeCandidateFiles(
        [...localFiles, ...pipelineLocalFiles, ...responseFiles],
        {
          ...selectedCandidate,
          ...pipelineCandidate,
          id: pipelineId || pipelineCandidate.id || selectedCandidate.id,
          dbId: pipelineId || pipelineCandidate.dbId,
        },
      );

      setCandidatePipelineFiles(allFiles);
    } catch (error) {
      setPipelineCandidateDetailsError(
        getApiErrorMessage(error, "Unable to load Candidate Pipeline details."),
      );

      if (!localFiles.length) {
        setCandidatePipelineFilesError(
          getApiErrorMessage(
            error,
            "Unable to load pre-employment files from Candidate Pipeline.",
          ),
        );
      }
    } finally {
      setPipelineCandidateDetailsLoading(false);
      setCandidatePipelineFilesLoading(false);
    }
  }, [
    selectedCandidate,
    candidatePipelineLookupId,
    shouldLoadCandidatePipelineData,
  ]);

  useEffect(() => {
    loadCandidatePipelineNhoFiles();
  }, [loadCandidatePipelineNhoFiles]);

  useEffect(() => {
    function handlePipelineFilesUpdated(event) {
      const payload = event?.detail || {};
      const eventCandidate = payload?.candidate || payload;

      if (
        selectedCandidate &&
        eventCandidate &&
        candidateMatchesPipeline(selectedCandidate, eventCandidate)
      ) {
        const nextFiles = normalizeCandidateFiles(
          [
            ...candidatePipelineFiles,
            ...safeArray(payload.files),
            ...getCandidatePreEmploymentFiles(eventCandidate),
          ],
          eventCandidate,
        );

        setPipelineCandidateDetails((prev) => ({
          ...safeObject(prev),
          ...safeObject(eventCandidate),
        }));

        setCandidatePipelineFiles(nextFiles);
      }
    }

    window.addEventListener(
      "ta-pipeline-candidates-updated",
      handlePipelineFilesUpdated,
    );
    window.addEventListener("ta-talent-pool-updated", handlePipelineFilesUpdated);

    return () => {
      window.removeEventListener(
        "ta-pipeline-candidates-updated",
        handlePipelineFilesUpdated,
      );
      window.removeEventListener(
        "ta-talent-pool-updated",
        handlePipelineFilesUpdated,
      );
    };
  }, [selectedCandidate, candidatePipelineFiles]);

  const profileCandidate = useMemo(() => {
    const baseCandidate =
      talentPoolCandidateDetails || selectedCandidate || {};
    const embeddedPipelineCandidate = safeObject(
      baseCandidate.pipelineCandidate ||
        baseCandidate.pipelineDetails,
    );
    const resolvedPipelineCandidate =
      pipelineCandidateDetails ||
      (Object.keys(embeddedPipelineCandidate).length
        ? embeddedPipelineCandidate
        : null);

    return mergeCandidateWithPipelineDetails(
      baseCandidate,
      resolvedPipelineCandidate,
    );
  }, [
    selectedCandidate,
    talentPoolCandidateDetails,
    pipelineCandidateDetails,
  ]);

  const movementHistoryCandidate = useMemo(() => {
    const baseCandidate = safeObject(profileCandidate || selectedCandidate);
    const embeddedPipelineCandidate = safeObject(
      baseCandidate.pipelineCandidate || baseCandidate.pipelineDetails,
    );
    const directPipelineCandidate = safeObject(pipelineCandidateDetails);
    const authoritativePipelineCandidate = Object.keys(directPipelineCandidate).length
      ? directPipelineCandidate
      : embeddedPipelineCandidate;
    const usePipelineTimeline = Boolean(
      shouldLoadCandidatePipelineData &&
        Object.keys(authoritativePipelineCandidate).length,
    );
    const sourceCandidate = usePipelineTimeline
      ? authoritativePipelineCandidate
      : baseCandidate;
    const sourceMetadata = safeObject(sourceCandidate.metadata);
    const timelineSources = usePipelineTimeline
      ? [
          sourceCandidate.timeline,
          sourceCandidate.movementHistory,
          sourceCandidate.movement_history,
          sourceCandidate.movementTimeline,
          sourceCandidate.movement_timeline,
          sourceCandidate.pipelineTimeline,
          sourceCandidate.pipeline_timeline,
          sourceCandidate.history,
          sourceCandidate.pipelineHistory,
          sourceCandidate.pipeline_history,
          sourceMetadata.timeline,
          sourceMetadata.movementTimeline,
          sourceMetadata.movement_timeline,
          sourceMetadata.movementHistory,
          sourceMetadata.movement_history,
          sourceMetadata.pipelineTimeline,
          sourceMetadata.pipeline_timeline,
        ]
      : [
          sourceCandidate.applicationHistory,
          sourceCandidate.application_history,
          sourceCandidate.timeline,
          sourceCandidate.movementTimeline,
          sourceCandidate.movement_timeline,
          sourceCandidate.movementHistory,
          sourceCandidate.movement_history,
          sourceCandidate.history,
          sourceMetadata.applicationHistory,
          sourceMetadata.application_history,
          sourceMetadata.timeline,
          sourceMetadata.movementTimeline,
          sourceMetadata.movement_timeline,
          sourceMetadata.movementHistory,
          sourceMetadata.movement_history,
        ];
    const personalTimeline =
      timelineSources
        .map((source) => normalizeCandidateRecordList(source))
        .find((records) => records.length > 0) || [];
    const candidateName = firstCandidateValue(
      baseCandidate.name,
      baseCandidate.candidateName,
      baseCandidate.candidate_name,
      sourceCandidate.name,
      sourceCandidate.candidateName,
      sourceCandidate.candidate_name,
    );

    return {
      ...baseCandidate,
      ...sourceCandidate,
      name: candidateName,
      candidateName,
      candidate_name: candidateName,
      timeline: personalTimeline,
      movementTimeline: personalTimeline,
      movement_timeline: personalTimeline,
    };
  }, [
    profileCandidate,
    selectedCandidate,
    pipelineCandidateDetails,
    shouldLoadCandidatePipelineData,
  ]);

  const personalMovementHistory = useMemo(
    () =>
      getTalentPoolPersonalMovementHistory(
        movementHistoryCandidate,
        currentAuditActorLabel,
      ),
    [movementHistoryCandidate, currentAuditActorLabel],
  );

  /*
   * candidatePipelineFiles is the authoritative file list after the NHO files
   * endpoint loads or mutates it. Do not merge the embedded profileCandidate
   * files here because those fields can still contain deleted-file metadata
   * until the entire Talent Pool record is fetched again.
   */
  const displayedPreEmploymentFiles = useMemo(
    () =>
      normalizeCandidateFiles(candidatePipelineFiles, {
        ...profileCandidate,
        id: resolvedPipelineId || profileCandidate?.id,
        dbId: resolvedPipelineId || profileCandidate?.dbId,
      }),
    [candidatePipelineFiles, profileCandidate, resolvedPipelineId],
  );

  const majorRequirementProgress = useMemo(
    () => calculateMajorRequirementProgress(displayedPreEmploymentFiles),
    [displayedPreEmploymentFiles],
  );

  const totalRequirementProgress = useMemo(
    () => calculateTotalRequirementProgress(displayedPreEmploymentFiles),
    [displayedPreEmploymentFiles],
  );

  const hasMissingPreEmploymentRequirements = useMemo(
    () =>
      totalRequirementProgress.total > 0 &&
      totalRequirementProgress.completed < totalRequirementProgress.total,
    [totalRequirementProgress],
  );

  useEffect(() => {
    if (!displayedPreEmploymentFiles.length) {
      setSelectedNhoFile(null);
      return;
    }

    setSelectedNhoFile((current) => {
      if (
        current &&
        displayedPreEmploymentFiles.some((file) => file.id === current.id)
      ) {
        return current;
      }

      return displayedPreEmploymentFiles[0] || null;
    });
  }, [displayedPreEmploymentFiles]);

  function showStatusModal({
    type = "success",
    title = "",
    message = "",
    closeProfileOnClose = false,
  }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
      closeProfileOnClose,
    });
  }

  function closeStatusModal() {
    const shouldCloseProfile = statusModal.closeProfileOnClose;

    setStatusModal((previous) => ({
      ...previous,
      open: false,
      closeProfileOnClose: false,
    }));

    if (shouldCloseProfile) {
      setSelectedCandidate(null);
    }
  }

  if (!selectedCandidate) return null;

  const activeCandidate = profileCandidate || selectedCandidate;
  const encodedBy = getEncodedByName(activeCandidate, currentTaOwner);
  const dropOffOwnerName = toDisplayPersonName(currentTaOwner, "Current User");
  const dropOffOwnerSibsId = getTalentPoolOwnerSibsId(currentTaOwner);
  const candidateDisplayName =
    cleanText(activeCandidate.name || activeCandidate.candidateName) ||
    "Candidate";
  const isDoNotReprocess = activeCandidate.status === "Do Not Reprocess";
  const isDropOffCandidate = isDropOffCandidateRecord(activeCandidate);
  const candidateDisplayStatus = isDropOffCandidate
    ? "Drop-off"
    : activeCandidate.status;

  const isAlreadyInPipeline =
    isCandidateActivelyLinkedToPipeline(activeCandidate);
  const shouldShowMoveToPipeline = shouldShowMoveToPipelineAction(
    activeCandidate,
    { isAlreadyInPipeline, isDoNotReprocess },
  );
  const hasActivePipelineLink = Boolean(
    isAlreadyInPipeline && !isDropOffCandidate
  );
  const currentStage = isAlreadyInPipeline
    ? getCandidateStageValue(activeCandidate)
    : "";
  const normalizedCurrentStage = normalizeLower(currentStage);

  const isIncompleteRequirementsStage =
    normalizedCurrentStage === normalizeLower(INCOMPLETE_ONBOARDING_STAGE);

  const isAlreadyOnboarding =
    normalizedCurrentStage === normalizeLower(ONBOARDING_STAGE);

  const canUploadFollowUpNhoRequirements = Boolean(
    (resolvedPipelineId || candidatePipelineLookupId) &&
      hasActivePipelineLink &&
      hasMissingPreEmploymentRequirements
  );

  const canMoveToOnboarding = Boolean(
    hasActivePipelineLink &&
      majorRequirementProgress.isComplete &&
      (resolvedPipelineId || candidatePipelineLookupId) &&
      !isAlreadyOnboarding,
  );

  const shouldShowLinkedButton = Boolean(
    hasActivePipelineLink &&
      !isIncompleteRequirementsStage &&
      !canMoveToOnboarding,
  );

  const candidateInitials =
    activeCandidate.name
      ?.split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "C";

  const validReferences = Array.isArray(activeCandidate.references)
    ? activeCandidate.references.filter(
        (reference) => reference?.name || reference?.phone,
      )
    : [];

  const workExperiences = Array.isArray(activeCandidate.workExperiences)
    ? activeCandidate.workExperiences.filter(Boolean)
    : [];

  const applicationHistory = getCandidateApplicationHistory(
    activeCandidate,
    encodedBy,
  );

  const collapsedHistoryLimit = 3;

  const visibleApplicationHistoryStartIndex = showFullApplicationHistory
    ? 0
    : Math.max(applicationHistory.length - collapsedHistoryLimit, 0);

  const visibleApplicationHistory = showFullApplicationHistory
    ? applicationHistory
    : applicationHistory.slice(visibleApplicationHistoryStartIndex);

  const hasMoreApplicationHistory =
    applicationHistory.length > collapsedHistoryLimit;

  const profileTabs = [
    {
      key: "personal",
      label: "Personal Info",
      icon: UserRound,
      children: [
        { key: "personal.basic", label: "Basic Info" },
        { key: "personal.contact", label: "Contact" },
        { key: "personal.address", label: "Address" },
        { key: "personal.ids", label: "Government IDs" },
      ],
    },
    {
      key: "family",
      label: "Family",
      icon: UserRoundPen,
      children: [
        { key: "family.spouse", label: "Spouse" },
        { key: "family.parents", label: "Parents" },
        { key: "family.children", label: "Children" },
        { key: "family.emergency", label: "Emergency Contact" },
      ],
    },
    {
      key: "education",
      label: "Education",
      icon: GraduationCap,
    },
    {
      key: "eligibility",
      label: "Credentials",
      icon: BadgeCheck,
    },
    {
      key: "experience",
      label: "Experience",
      icon: BriefcaseBusiness,
    },
    {
      key: "training",
      label: "Trainings",
      icon: GraduationCap,
    },
    {
      key: "skills",
      label: "Skills / Awards",
      icon: Sparkles,
      children: [
        { key: "skills.skills", label: "Skills" },
        { key: "skills.recognitions", label: "Recognition" },
        { key: "skills.organizations", label: "Organizations" },
      ],
    },
    {
      key: "references",
      label: "References",
      icon: Phone,
    },
    {
      key: "application",
      label: "Application & HR",
      icon: Network,
      children: [
        { key: "application.overview", label: "Overview" },
        { key: "application.pipeline", label: "Pipeline" },
        { key: "application.assessment", label: "Assessment" },
        { key: "application.readiness", label: "Readiness" },
        { key: "application.history", label: "Status History" },
      ],
    },
    {
      key: "documents",
      label: "Documents",
      icon: FileText,
      children: [
        { key: "documents.vault", label: "Document Vault" },
      ],
    },
    {
      key: "answers",
      label: "Application Response",
      icon: MessageSquareText,
    },
    {
      key: "movement-history",
      label: "Movement History",
      icon: RefreshCcw,
    },
    {
      key: "notes",
      label: "Notes",
      icon: StickyNote,
    },
  ];

  const activeProfileParent = profileTabs.find(
    (tab) =>
      activeTab === tab.key ||
      String(activeTab || "").startsWith(`${tab.key}.`),
  );

  const activeProfileChild = Array.isArray(activeProfileParent?.children)
    ? activeProfileParent.children.find((child) => child.key === activeTab)
    : null;

  function handleProfileTabChange(tabId) {
    if (activeTab === tabId) return;

    setActiveTab(tabId);
    setTabAnimationKey((previous) => previous + 1);
  }

  function handleCloseCandidateProfile() {
    setSelectedCandidate(null);
  }

  async function handleGenerateResume() {
    if (!talentPoolApplicationId || isGeneratingResume) return;

    const previewWindow = window.open("", "_blank");
    if (previewWindow) {
      previewWindow.opener = null;
      previewWindow.document.title = "Generating SiBS Candidate PDS";
      previewWindow.document.body.textContent = "Generating candidate Personal Data Sheet (PDS)...";
    }

    setIsGeneratingResume(true);
    try {
      const result = await getTalentPoolResumePdf(talentPoolApplicationId);
      if (!result.success || !result.data) {
        throw new Error(
          result.message || "Unable to generate the candidate PDS.",
        );
      }

      const objectUrl = URL.createObjectURL(result.data);
      if (previewWindow) {
        previewWindow.location.replace(objectUrl);
      } else {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setStatusModal({
          open: true,
          type: "success",
          title: "PDS generated",
          message:
            "The PDF preview was blocked, so the candidate PDS was downloaded instead.",
          closeProfileOnClose: false,
        });
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      if (previewWindow && !previewWindow.closed) previewWindow.close();
      setStatusModal({
        open: true,
        type: "error",
        title: "PDS generation failed",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to generate the candidate PDS.",
        closeProfileOnClose: false,
      });
    } finally {
      setIsGeneratingResume(false);
    }
  }

  function handleUpdateCandidateStatus(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    const currentStatus = cleanText(candidateDisplayStatus);
    const isAllowedStatus = TALENT_POOL_STATUS_OPTIONS.some(
      (option) => option.value === currentStatus,
    );

    setStatusUpdateValue(isAllowedStatus ? currentStatus : "");
    setStatusUpdateValidation("");
    setStatusUpdateOpen(true);
  }

  function handleCloseStatusUpdate() {
    if (statusUpdateSaving) return;

    setStatusUpdateOpen(false);
    setStatusUpdateValue("");
    setStatusUpdateValidation("");
  }

  async function handleSaveCandidateStatus(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (statusUpdateSaving) return;

    const nextStatus = cleanText(statusUpdateValue);

    if (!nextStatus) {
      setStatusUpdateValidation("Please select a new status.");
      return;
    }

    if (normalizeLower(nextStatus) === "drop off") {
      setStatusUpdateValidation(
        "Drop Off is managed through the dedicated Mark as Drop Off action.",
      );
      return;
    }

    const applicationId = getTalentPoolApplicationId(activeCandidate);

    if (!applicationId) {
      setStatusUpdateValidation("Missing candidate application ID.");
      return;
    }

    setStatusUpdateSaving(true);
    setStatusUpdateValidation("");

    try {
      const response = await updateTalentPoolApplicationStatus(applicationId, {
        status: nextStatus,
      });

      if (!response?.success) {
        setStatusUpdateValidation(
          response?.message || "Failed to update candidate status.",
        );
        return;
      }

      const responseCandidate = safeObject(
        response?.candidate ||
          response?.data?.candidate ||
          response?.data ||
          {},
      );

      const isRestoredFromDropOff =
        isDropOffCandidate && !isDropOffCandidateStatus(nextStatus);

      /*
       * Keep the complete movement timeline before removing the active
       * Candidate Pipeline reference. The pipeline link is reset so a future
       * move starts from Initial Screening, but previous screening, Drop-off,
       * and status events remain visible under Status History.
       */
      const preservedApplicationHistory = toPersistedCandidateHistory(
        getCandidateApplicationHistory(
          {
            ...activeCandidate,
            ...responseCandidate,
          },
          encodedBy,
        ),
      );

      const nextCandidate = {
        ...activeCandidate,
        ...responseCandidate,
        status: responseCandidate.status || nextStatus,
        applicationHistory: preservedApplicationHistory,
        application_history: preservedApplicationHistory,
        movementTimeline: preservedApplicationHistory,
        movement_timeline: preservedApplicationHistory,
        timeline: preservedApplicationHistory,
        metadata: {
          ...safeObject(activeCandidate.metadata),
          ...safeObject(responseCandidate.metadata),
          applicationHistory: preservedApplicationHistory,
          application_history: preservedApplicationHistory,
          timeline: preservedApplicationHistory,
        },
        ...(isRestoredFromDropOff
          ? {
              movedToPipeline: false,
              moved_to_pipeline: 0,
              pipelineStatus: null,
              pipeline_status: null,
              currentPipelineStage: "",
              current_pipeline_stage: "",
              currentStage: "",
              current_stage: "",
              pipelineStage: "",
              pipeline_stage: "",
              stage: "",
              pipelineId: "",
              pipeline_id: "",
              pipelineDbId: "",
              pipeline_db_id: "",
              pipelineCandidateId: "",
              pipeline_candidate_id: "",
              pipelineCandidate: null,
              pipelineDetails: null,
            }
          : {}),
      };

      applyLocalCandidateUpdate(nextCandidate, {
        selectCandidate: false,
      });

      window.dispatchEvent(
        new CustomEvent("ta-talent-pool-updated", {
          detail: response?.data || nextCandidate,
        }),
      );

      if (typeof refreshTalentPool === "function") {
        try {
          await refreshTalentPool();
        } catch (refreshError) {
          console.error(
            "Refresh Talent Pool after status update error:",
            refreshError,
          );
        }
      }

      setStatusUpdateOpen(false);
      setStatusUpdateValue("");
      setStatusUpdateValidation("");
      setDropOffOpen(false);
      setShowNhoUploadModal(false);
      setStatusModal((previous) => ({
        ...previous,
        open: false,
        closeProfileOnClose: false,
      }));

      // Close Candidate Profile and return to the refreshed Talent Pool page.
      setSelectedCandidate(null);
      navigate(TALENT_POOL_ROUTE, { replace: true });
    } catch (error) {
      console.error("Update candidate status error:", error);

      setStatusUpdateValidation(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update candidate status.",
      );
    } finally {
      setStatusUpdateSaving(false);
    }
  }

  function handleOpenDropOff(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (
      dropOffSaving ||
      isAlreadyInPipeline ||
      isDoNotReprocess ||
      isDropOffCandidate
    ) {
      return;
    }

    setDropOffReason("");
    setDropOffValidation("");
    setDropOffOpen(true);
  }

  function handleCloseDropOff() {
    if (dropOffSaving) return;

    setDropOffOpen(false);
    setDropOffReason("");
    setDropOffValidation("");
  }

  async function handleConfirmDropOff(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (dropOffSaving) return;

    const reason = cleanText(dropOffReason);

    if (!reason) {
      setDropOffValidation("Drop Off Reason is required.");
      return;
    }

    const applicationId = getTalentPoolApplicationId(activeCandidate);

    if (!applicationId) {
      setDropOffValidation("Missing candidate application ID.");
      return;
    }

    setDropOffSaving(true);
    setDropOffValidation("");

    try {
      const response = await markTalentPoolCandidateAsDropOff(applicationId, {
        reason,
        droppedOffBySibsId: dropOffOwnerSibsId,
        droppedOffByName: dropOffOwnerName,
      });

      if (!response?.success) {
        setDropOffValidation(
          response?.message || "Failed to mark candidate as Drop Off.",
        );
        return;
      }

      const responseCandidate = safeObject(
        response?.candidate ||
          response?.data?.candidate ||
          response?.data ||
          {},
      );

      const nextCandidate = {
        ...activeCandidate,
        ...responseCandidate,
        status: responseCandidate.status || "Drop Off",
        dropOffReason: reason,
        drop_off_reason: reason,
      };

      applyLocalCandidateUpdate(nextCandidate);

      window.dispatchEvent(
        new CustomEvent("ta-talent-pool-updated", {
          detail: response?.data || nextCandidate,
        }),
      );

      if (typeof refreshTalentPool === "function") {
        try {
          await refreshTalentPool();
        } catch (refreshError) {
          console.error("Refresh Talent Pool after Drop Off error:", refreshError);
        }
      }

      setDropOffOpen(false);
      setDropOffReason("");

      showStatusModal({
        type: "success",
        title: "Candidate marked as Drop Off",
        message: `${candidateDisplayName} remains in Talent Pool with the Drop Off status.`,
        closeProfileOnClose: true,
      });
    } catch (error) {
      console.error("Mark candidate as Drop Off error:", error);

      setDropOffValidation(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to mark candidate as Drop Off.",
      );
    } finally {
      setDropOffSaving(false);
    }
  }

  function handleOpenLinkedCandidateDestination() {
    const stage = getCandidateStageValue(activeCandidate);
    const pipelineId = cleanText(resolvedPipelineId || candidatePipelineLookupId);
    const candidateId = getCandidatePublicId(activeCandidate);
    const targetIsOnboarding = normalizeLower(stage) === "onboarding";

    const url = targetIsOnboarding
      ? buildOnboardingNavigationUrl(activeCandidate, pipelineId)
      : buildCandidatePipelineNavigationUrl(activeCandidate, pipelineId);

    const detail = {
      candidate: activeCandidate,
      candidateId,
      pipelineId,
      stage,
      focusStage: stage,
      focusCandidateId: candidateId,
      focusPipelineId: pipelineId,
    };

    window.dispatchEvent(
      new CustomEvent(
        targetIsOnboarding
          ? "ta-onboarding-focus"
          : "ta-candidate-pipeline-focus",
        { detail },
      ),
    );

    setSelectedCandidate(null);

    navigate(url, {
      state: {
        fromTalentPool: true,
        candidate: activeCandidate,
        focusCandidate: activeCandidate,
        candidateId,
        pipelineId,
        stage,
        focusStage: stage,
        focusCandidateId: candidateId,
        focusPipelineId: pipelineId,
      },
    });
  }

  function handleMoveToPipeline(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (isDoNotReprocess) {
      showStatusModal({
        type: "error",
        title: "Cannot Move Candidate",
        message:
          "This candidate is marked as Do Not Reprocess. Please update the candidate status before moving to the pipeline.",
      });
      return;
    }

    if (isAlreadyInPipeline) {
      handleOpenLinkedCandidateDestination();
      return;
    }

    if (typeof openMoveToPipeline !== "function") {
      showStatusModal({
        type: "error",
        title: "Action Unavailable",
        message: "Move to Pipeline action is not available right now.",
      });
      return;
    }

    const candidateForMove = {
      ...(activeCandidate || selectedCandidate || {}),
    };

    openMoveToPipeline(candidateForMove);

    setTimeout(() => {
      setSelectedCandidate(null);
    }, 50);
  }

  function applyLocalCandidateUpdate(
    nextCandidate,
    { selectCandidate = true } = {},
  ) {
    if (selectCandidate) {
      setSelectedCandidate(nextCandidate);
    }

    if (typeof setCandidateList === "function") {
      setCandidateList((previousList = []) =>
        previousList.map((candidate) => {
          if (candidateMatchesPipeline(candidate, nextCandidate)) {
            return { ...candidate, ...nextCandidate };
          }

          return candidate;
        }),
      );
    }
  }

  async function handleMoveToOnboarding() {
    const pipelineId = cleanText(resolvedPipelineId || candidatePipelineLookupId);

    if (!pipelineId) {
      showStatusModal({
        type: "error",
        title: "Missing Candidate Pipeline ID",
        message:
          "Candidate Pipeline ID is missing. The candidate cannot be moved to Onboarding.",
      });
      return;
    }

    if (!majorRequirementProgress.isComplete) {
      showStatusModal({
        type: "error",
        title: "Incomplete Major Requirements",
        message:
          "The candidate must complete all 5 major requirements before moving to Onboarding.",
      });
      return;
    }

    if (isAlreadyOnboarding) {
      showStatusModal({
        type: "success",
        title: "Already in Onboarding",
        message: "This candidate is already under the Onboarding stage.",
      });
      return;
    }

    try {
      setIsMovingToOnboarding(true);

      const response = await api.post(
        `/api/candidate-pipeline/${encodeURIComponent(pipelineId)}/move`,
        {
          targetStage: ONBOARDING_STAGE,
          stage: ONBOARDING_STAGE,
          reason:
            "Candidate completed the 5 major pre-employment requirements from Talent Pool follow-up.",
          remarks:
            "Candidate completed the 5 major pre-employment requirements and was moved to Onboarding from Talent Pool.",
        },
        {
          withCredentials: true,
        },
      );

      const responsePayload = response?.data || {};

      if (responsePayload?.success === false) {
        throw new Error(
          responsePayload?.message ||
            "Failed to move candidate to Onboarding.",
        );
      }

      const responseCandidate = safeObject(
        responsePayload?.candidate ||
          responsePayload?.data?.candidate ||
          responsePayload?.data ||
          {},
      );

      const nextCandidateBase = {
        ...activeCandidate,
        ...responseCandidate,
        status: "Hired / Active",
        pipelineStatus:
          responseCandidate.pipelineStatus ||
          responseCandidate.pipeline_status ||
          activeCandidate.pipelineStatus ||
          "Active",
        currentPipelineStage: ONBOARDING_STAGE,
        current_pipeline_stage: ONBOARDING_STAGE,
        currentStage: ONBOARDING_STAGE,
        current_stage: ONBOARDING_STAGE,
        pipelineStage: ONBOARDING_STAGE,
        pipeline_stage: ONBOARDING_STAGE,
        stage: ONBOARDING_STAGE,
        nhoFiles: displayedPreEmploymentFiles,
        nho_files: displayedPreEmploymentFiles,
        preEmploymentFiles: displayedPreEmploymentFiles,
        pre_employment_files: displayedPreEmploymentFiles,
        uploadedFiles: displayedPreEmploymentFiles,
        files: displayedPreEmploymentFiles,
        majorNhoUploadProgress: majorRequirementProgress,
        major_nho_upload_progress: majorRequirementProgress,
      };

      const nextCandidate = mergeCandidateWithPipelineDetails(
        nextCandidateBase,
        responseCandidate,
      );

      applyLocalCandidateUpdate(nextCandidate);

      window.dispatchEvent(
        new CustomEvent("ta-talent-pool-updated", {
          detail: {
            candidate: nextCandidate,
            files: displayedPreEmploymentFiles,
            majorProgress: majorRequirementProgress,
            routedStage: ONBOARDING_STAGE,
          },
        }),
      );

      window.dispatchEvent(
        new CustomEvent("ta-pipeline-candidates-updated", {
          detail: {
            candidate: nextCandidate,
            files: displayedPreEmploymentFiles,
            majorProgress: majorRequirementProgress,
            routedStage: ONBOARDING_STAGE,
          },
        }),
      );

      window.dispatchEvent(
        new CustomEvent("ta-onboarding-updated", {
          detail: {
            candidate: nextCandidate,
            files: displayedPreEmploymentFiles,
            majorProgress: majorRequirementProgress,
          },
        }),
      );

      if (typeof refreshTalentPool === "function") {
        setTimeout(() => {
          refreshTalentPool();
        }, 300);
      }

      showStatusModal({
        type: "success",
        title: "Moved to Onboarding",
        message:
          "Candidate completed all 5 major requirements and was moved to Onboarding.",
        closeProfileOnClose: true,
      });
    } catch (error) {
      showStatusModal({
        type: "error",
        title: "Move to Onboarding Failed",
        message: getApiErrorMessage(
          error,
          "Failed to move candidate to Onboarding.",
        ),
      });
    } finally {
      setIsMovingToOnboarding(false);
    }
  }

  function handleTalentPoolNhoSave({
    files = [],
    candidate: updatedCandidate = null,
    majorProgress = null,
    routedStage = "",
    response = null,
  } = {}) {
    const savedFiles = normalizeCandidateFiles(
      [...displayedPreEmploymentFiles, ...files],
      activeCandidate,
    );

    const responseCandidate = safeObject(
      updatedCandidate || response?.candidate || response?.data || {},
    );

    const nextStage = cleanText(
      routedStage ||
        responseCandidate.currentStage ||
        responseCandidate.current_stage ||
        responseCandidate.currentPipelineStage ||
        responseCandidate.current_pipeline_stage ||
        responseCandidate.pipelineStage ||
        responseCandidate.pipeline_stage ||
        responseCandidate.stage ||
        activeCandidate.currentPipelineStage ||
        activeCandidate.current_stage ||
        activeCandidate.currentStage ||
        activeCandidate.current_stage ||
        activeCandidate.pipelineStage ||
        activeCandidate.pipeline_stage ||
        "",
    );

    const computedMajorProgress =
      majorProgress || calculateMajorRequirementProgress(savedFiles);

    const nextCandidateBase = {
      ...activeCandidate,
      ...responseCandidate,

      nhoFiles: savedFiles,
      nho_files: savedFiles,
      preEmploymentFiles: savedFiles,
      pre_employment_files: savedFiles,
      uploadedFiles: savedFiles,
      files: savedFiles,

      majorNhoUploadProgress: computedMajorProgress,
      major_nho_upload_progress: computedMajorProgress,

      ...(nextStage
        ? {
            status: getTalentPoolStatusForNhoStage(
              nextStage,
              activeCandidate.status,
            ),
            pipelineStatus:
              responseCandidate.pipelineStatus ||
              responseCandidate.pipeline_status ||
              activeCandidate.pipelineStatus ||
              "Active",
            currentPipelineStage: nextStage,
            current_pipeline_stage: nextStage,
            currentStage: nextStage,
            current_stage: nextStage,
            pipelineStage: nextStage,
            pipeline_stage: nextStage,
            stage: nextStage,
          }
        : {}),
    };

    const nextCandidate = mergeCandidateWithPipelineDetails(
      nextCandidateBase,
      responseCandidate,
    );

    setCandidatePipelineFiles(savedFiles);
    setSelectedNhoFile(savedFiles[0] || null);
    setShowNhoUploadModal(false);

    applyLocalCandidateUpdate(nextCandidate);

    window.dispatchEvent(
      new CustomEvent("ta-talent-pool-updated", {
        detail: {
          candidate: nextCandidate,
          files: savedFiles,
          majorProgress: computedMajorProgress,
          routedStage: nextStage,
        },
      }),
    );

    window.dispatchEvent(
      new CustomEvent("ta-pipeline-candidates-updated", {
        detail: {
          candidate: nextCandidate,
          files: savedFiles,
          majorProgress: computedMajorProgress,
          routedStage: nextStage,
        },
      }),
    );

    if (nextStage === ONBOARDING_STAGE) {
      window.dispatchEvent(
        new CustomEvent("ta-onboarding-updated", {
          detail: {
            candidate: nextCandidate,
            files: savedFiles,
            majorProgress: computedMajorProgress,
          },
        }),
      );
    }

    showStatusModal({
      type: "success",
      title:
        nextStage === ONBOARDING_STAGE
          ? "Moved to Onboarding"
          : "Requirements Saved",
      message:
        nextStage === ONBOARDING_STAGE
          ? "Candidate completed the 5 major requirements and was moved to Onboarding."
          : "NHO uploaded files were saved and displayed in the candidate profile.",
    });
  }

  function renderPersonalBasic() {
    return (
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        <ProfileDetail label="First Name" value={activeCandidate.firstName} />
        <ProfileDetail
          label="Middle Name"
          value={activeCandidate.middleName}
        />
        <ProfileDetail label="Last Name" value={activeCandidate.lastName} />
        <ProfileDetail
          label="Name Extension (Jr/III)"
          value={firstCandidateValue(
            activeCandidate.suffix,
            activeCandidate.nameExtension,
            activeCandidate.name_extension,
          )}
        />
        <ProfileDetail
          label="Preferred Name"
          value={activeCandidate.nickname}
        />
        <ProfileDetail
          label="Birth Date"
          value={formatDate(
            firstCandidateValue(
              activeCandidate.dateOfBirth,
              activeCandidate.birthdate,
              activeCandidate.birthDate,
            ),
          )}
        />
        <ProfileDetail
          label="Place of Birth"
          value={firstCandidateValue(
            activeCandidate.placeOfBirth,
            activeCandidate.place_of_birth,
            activeCandidate.birthPlace,
          )}
        />
        <ProfileDetail label="Gender" value={activeCandidate.gender} />
        <ProfileDetail
          label="Civil Status"
          value={firstCandidateValue(
            activeCandidate.civilStatus,
            activeCandidate.civil_status,
            activeCandidate.maritalStatus,
          )}
        />
        <ProfileDetail
          label="Citizenship"
          value={firstCandidateValue(
            activeCandidate.citizenship,
            activeCandidate.nationality,
          )}
        />
        <ProfileDetail
          label="Blood Type"
          value={firstCandidateValue(
            activeCandidate.bloodType,
            activeCandidate.blood_type,
          )}
        />
        <ProfileDetail label="Height" value={activeCandidate.height} />
        <ProfileDetail label="Weight" value={activeCandidate.weight} />
      </div>
    );
  }

  function renderPersonalContact() {
    return (
      <ProfileGrid cols="md:grid-cols-3">
        <ProfileDetail label="Email" value={activeCandidate.email} />
        <ProfileDetail
          label="Mobile Number"
          value={firstCandidateValue(
            activeCandidate.phoneNumber1,
            activeCandidate.contactNumber,
            activeCandidate.phone,
          )}
        />
        <ProfileDetail
          label="Telephone"
          value={firstCandidateValue(
            activeCandidate.telephone,
            activeCandidate.telephoneNumber,
            activeCandidate.phoneNumber2,
          )}
        />
      </ProfileGrid>
    );
  }

  function renderPersonalAddress() {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
            <h3 className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-2.5 text-[11px] font-black uppercase tracking-wider text-[#042C51]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF5C28]" />
              Residential Address
            </h3>
            <p className="min-h-24 rounded-xl bg-white p-4 text-sm font-bold leading-6 text-[#344054]">
              {firstCandidateValue(
                activeCandidate.residentialAddress,
                activeCandidate.residential_address,
                activeCandidate.physicalAddress,
                activeCandidate.address,
              ) || "—"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
            <h3 className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-2.5 text-[11px] font-black uppercase tracking-wider text-[#042C51]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#042C51]" />
              Permanent Address
            </h3>
            <p className="min-h-24 rounded-xl bg-white p-4 text-sm font-bold leading-6 text-[#344054]">
              {firstCandidateValue(
                activeCandidate.permanentAddress,
                activeCandidate.permanent_address,
                activeCandidate.physicalAddress,
                activeCandidate.address,
              ) || "—"}
            </p>
          </div>
        </div>

        <ProfileGrid cols="sm:grid-cols-2">
          <ProfileDetail
            label="Preferred Location"
            value={activeCandidate.applyingLocation}
          />
          <ProfileDetail
            label="Work Setup Preference"
            value={firstCandidateValue(
              activeCandidate.workSetup,
              activeCandidate.work_setup,
              activeCandidate.workArrangement,
              activeCandidate.work_arrangement,
            )}
          />
        </ProfileGrid>
      </div>
    );
  }

  function renderGovernmentIds() {
    const governmentIds = {
      gsis: firstCandidateValue(
        activeCandidate.gsis,
        activeCandidate.gsisNo,
        activeCandidate.gsis_no,
      ),
      sss: firstCandidateValue(
        activeCandidate.sss,
        activeCandidate.sssNo,
        activeCandidate.sss_no,
      ),
      philHealth: firstCandidateValue(
        activeCandidate.phic,
        activeCandidate.philhealth,
        activeCandidate.philhealthNo,
        activeCandidate.philhealth_no,
      ),
      pagIbig: firstCandidateValue(
        activeCandidate.hdmf,
        activeCandidate.pagibig,
        activeCandidate.pagibigNo,
        activeCandidate.pagibig_no,
      ),
      tin: firstCandidateValue(
        activeCandidate.tin,
        activeCandidate.tinNo,
        activeCandidate.tin_no,
      ),
    };

    const hasGovernmentId = Object.values(governmentIds).some(hasCandidateValue);

    return (
      <section className="space-y-4">
        <SectionTitle
          icon={WalletCards}
          title="Government IDs"
          description="Government identification numbers collected from the candidate."
        />

        {hasGovernmentId ? (
          <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-5">
            <ProfileDetail label="GSIS" value={governmentIds.gsis} />
            <ProfileDetail label="SSS" value={governmentIds.sss} />
            <ProfileDetail label="PhilHealth" value={governmentIds.philHealth} />
            <ProfileDetail label="PAG-IBIG / HDMF" value={governmentIds.pagIbig} />
            <ProfileDetail label="TIN" value={governmentIds.tin} />
          </ProfileGrid>
        ) : (
          <EmptyState
            title="No government ID information"
            description="Government ID information has not been collected at the candidate stage."
          />
        )}
      </section>
    );
  }

  function renderFamilySection(section) {
    if (section === "spouse") {
      const fields = [
        firstCandidateValue(activeCandidate.spouseSurname, activeCandidate.spouse_surname),
        firstCandidateValue(activeCandidate.spouseFirstName, activeCandidate.spouse_first_name),
        firstCandidateValue(activeCandidate.spouseMiddleName, activeCandidate.spouse_middle_name),
        firstCandidateValue(activeCandidate.spouseOccupation, activeCandidate.spouse_occupation),
        firstCandidateValue(activeCandidate.spouseEmployer, activeCandidate.spouse_employer),
        firstCandidateValue(activeCandidate.spouseTelephone, activeCandidate.spouse_telephone),
        firstCandidateValue(
          activeCandidate.spouseBusinessAddress,
          activeCandidate.spouse_business_address,
        ),
      ];

      return (
        <section className="space-y-4">
          <SectionTitle
            icon={UserRoundPen}
            title="Spouse Information"
            description="Candidate spouse and family background details."
          />

          {fields.some(hasCandidateValue) ? (
            <div className="space-y-3">
              <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
                <ProfileDetail label="Surname" value={fields[0]} />
                <ProfileDetail label="First Name" value={fields[1]} />
                <ProfileDetail label="Middle Name" value={fields[2]} />
                <ProfileDetail label="Occupation" value={fields[3]} />
                <ProfileDetail label="Employer / Business" value={fields[4]} />
                <ProfileDetail label="Telephone" value={fields[5]} />
              </ProfileGrid>
              <ProfileTextarea label="Business Address" value={fields[6]} />
            </div>
          ) : (
            <EmptyState title="No spouse information provided." />
          )}
        </section>
      );
    }

    if (section === "parents") {
      const father = [
        firstCandidateValue(activeCandidate.fatherSurname, activeCandidate.father_surname),
        firstCandidateValue(activeCandidate.fatherFirstName, activeCandidate.father_first_name),
        firstCandidateValue(activeCandidate.fatherMiddleName, activeCandidate.father_middle_name),
      ];
      const mother = [
        firstCandidateValue(
          activeCandidate.motherMaidenSurname,
          activeCandidate.mother_maiden_surname,
          activeCandidate.motherSurname,
        ),
        firstCandidateValue(activeCandidate.motherFirstName, activeCandidate.mother_first_name),
        firstCandidateValue(activeCandidate.motherMiddleName, activeCandidate.mother_middle_name),
      ];

      return (
        <section className="space-y-4">
          <SectionTitle
            icon={UserRound}
            title="Parents Information"
            description="Candidate father and mother details."
          />

          {[...father, ...mother].some(hasCandidateValue) ? (
            <div className="space-y-5">
              <div>
                <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  Father
                </p>
                <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
                  <ProfileDetail label="Surname" value={father[0]} />
                  <ProfileDetail label="First Name" value={father[1]} />
                  <ProfileDetail label="Middle Name" value={father[2]} />
                </ProfileGrid>
              </div>

              <div>
                <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  Mother
                </p>
                <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
                  <ProfileDetail label="Maiden Surname" value={mother[0]} />
                  <ProfileDetail label="First Name" value={mother[1]} />
                  <ProfileDetail label="Middle Name" value={mother[2]} />
                </ProfileGrid>
              </div>
            </div>
          ) : (
            <EmptyState title="No parent information provided." />
          )}
        </section>
      );
    }

    if (section === "children") {
      const children = normalizeCandidateRecordList(activeCandidate.children);

      return (
        <section className="space-y-4">
          <SectionTitle
            icon={UserRound}
            title="Children"
            description="Candidate child records."
          />

          {children.length > 0 ? (
            <div className="space-y-3">
              {children.map((child, index) => {
                const item =
                  child && typeof child === "object" ? child : { name: child };

                return (
                  <div
                    key={`${item.name || "child"}-${index}`}
                    className="rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] p-4"
                  >
                    <ProfileGrid cols="sm:grid-cols-2">
                      <ProfileDetail
                        label={`Child ${index + 1}`}
                        value={firstCandidateValue(
                          item.name,
                          item.fullName,
                          item.full_name,
                        )}
                      />
                      <ProfileDetail
                        label="Birth Date"
                        value={formatDate(
                          firstCandidateValue(
                            item.birthDate,
                            item.birth_date,
                            item.dateOfBirth,
                          ),
                        )}
                      />
                    </ProfileGrid>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No children records provided." />
          )}
        </section>
      );
    }

    const emergencyFields = [
      firstCandidateValue(
        activeCandidate.emergencyName,
        activeCandidate.emergencyContactName,
        activeCandidate.emergency_contact_name,
      ),
      firstCandidateValue(
        activeCandidate.emergencyRelationship,
        activeCandidate.emergencyContactRelationship,
        activeCandidate.emergency_contact_relationship,
      ),
      firstCandidateValue(
        activeCandidate.emergencyPhone,
        activeCandidate.emergencyContactNumber,
        activeCandidate.emergency_contact_number,
      ),
      firstCandidateValue(
        activeCandidate.emergencyEmail,
        activeCandidate.emergency_contact_email,
      ),
    ];

    return (
      <section className="space-y-4">
        <SectionTitle
          icon={Phone}
          title="Emergency Contact"
          description="Candidate emergency contact details."
        />

        {emergencyFields.some(hasCandidateValue) ? (
          <ProfileGrid cols="sm:grid-cols-2">
            <ProfileDetail label="Name" value={emergencyFields[0]} />
            <ProfileDetail label="Relationship" value={emergencyFields[1]} />
            <ProfileDetail label="Phone Number" value={emergencyFields[2]} />
            <ProfileDetail label="Email" value={emergencyFields[3]} />
          </ProfileGrid>
        ) : (
          <EmptyState title="No emergency contact provided." />
        )}
      </section>
    );
  }

  function renderApplicationOverview() {
    return (
      <section className="space-y-4">
        <SectionTitle
          icon={BriefcaseBusiness}
          title="Application Overview"
          description="Candidate source, role preference, and recruitment application details."
        />

        <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
          <ProfileDetail
            label="Candidate ID"
            value={getCandidatePublicId(activeCandidate)}
            mono
          />
          <ProfileDetail
            label="Candidate Status"
            value={candidateDisplayStatus}
          />
          <ProfileDetail
            label="Age as of Application"
            value={firstCandidateValue(
              activeCandidate.ageAsOfApplication,
              activeCandidate.age,
            )}
          />
          <ProfileDetail
            label="Encoded By"
            value={encodedBy}
          />
          <ProfileDetail
            label="Applied Position"
            value={activeCandidate.openPosition || activeCandidate.roleCapability}
          />
          <ProfileDetail
            label="Preferred Location"
            value={activeCandidate.applyingLocation}
          />
          <ProfileDetail label="Source" value={activeCandidate.source} />
          <ProfileDetail
            label="How did you hear about us"
            value={formatList(activeCandidate.hearAboutUs)}
          />
          <ProfileDetail label="Referred By" value={activeCandidate.referredBy} />
          <ProfileDetail label="Employee ID" value={activeCandidate.employeeId} />
          <ProfileDetail
            label="Expected Salary"
            value={firstCandidateValue(
              activeCandidate.expectedSalary,
              activeCandidate.expected_salary,
            )}
          />
          <ProfileDetail
            label="Availability"
            value={firstCandidateValue(
              activeCandidate.availability,
              activeCandidate.availableDate,
            )}
          />
          <ProfileDetail
            label="Recruiter"
            value={firstCandidateValue(
              activeCandidate.recruiter,
              activeCandidate.recruiterName,
              activeCandidate.currentTaOwner,
            )}
          />
          <ProfileDetail
            label="Created At"
            value={formatDate(activeCandidate.createdAt)}
          />
        </ProfileGrid>
      </section>
    );
  }

  function renderPipelineLink() {
    const pipelineStages = [
      "Sourcing",
      "Initial Screening",
      "Evaluation",
      "Final Interview",
      "Onboarding",
      "Completed",
    ];
    const activeStage = currentStage || activeCandidate.pipelineStage || "Sourcing";
    const currentIndex = Math.max(
      pipelineStages.findIndex(
        (stage) => stage.toLowerCase() === String(activeStage).toLowerCase(),
      ),
      0,
    );

    return (
      <section className="space-y-4">
        <SectionTitle
          icon={Network}
          title="Pipeline Link"
          description="Current pipeline status, assignment, and TA ownership."
        />

        <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#FF5C28]">
            • Active Recruitment Funnel Tracker
          </p>
          <div className="relative py-6">
            <div className="absolute left-8 right-8 top-[42px] hidden h-1 bg-slate-100 md:block" />
            <div className="relative grid grid-cols-2 gap-6 md:grid-cols-6">
              {pipelineStages.map((stage, index) => {
                const state =
                  index < currentIndex
                    ? "completed"
                    : index === currentIndex
                    ? "active"
                    : "pending";
                return (
                  <div
                    key={stage}
                    className="flex flex-col items-center text-center"
                  >
                    <span
                      className={`z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-extrabold ${
                        state === "completed"
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : state === "active"
                          ? "border-[#042C51] bg-[#042C51] text-white ring-4 ring-[#E9F0FC]"
                          : "border-slate-200 bg-white text-slate-400"
                      }`}
                    >
                      {state === "completed" ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span
                      className={`mt-2 max-w-[110px] text-[10px] font-extrabold ${
                        state === "active" ? "text-[#042C51]" : "text-[#667085]"
                      }`}
                    >
                      {stage}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {pipelineCandidateDetailsLoading && (
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
            Loading Candidate Pipeline details...
          </div>
        )}

        {pipelineCandidateDetailsError && (
          <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
            {pipelineCandidateDetailsError}
          </div>
        )}

        <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
          <ProfileDetail
            label="Pipeline ID"
            value={resolvedPipelineId || candidatePipelineLookupId || "—"}
          />

          <ProfileDetail
            label="Pipeline Status"
            value={activeCandidate.pipelineStatus || "—"}
          />

          <ProfileDetail label="Current Stage" value={currentStage || "—"} />

          <ProfileDetail
            label="Final Role"
            value={activeCandidate.currentAppliedRole || "Not assigned yet"}
          />

          <ProfileDetail
            label="Final Account"
            value={activeCandidate.currentAppliedAccount || "Not assigned yet"}
          />

          <ProfileDetail
            label="TA Owner"
            value={activeCandidate.currentTaOwner || "—"}
          />
        </ProfileGrid>
      </section>
    );
  }

  function renderEducation() {
    const attainment = getCandidateEducationAttainment(activeCandidate);
    const records = getCandidateEducationRecords(activeCandidate);

    return (
      <section className="space-y-4">
        <SectionTitle
          icon={GraduationCap}
          title="Educational Background"
          description="Candidate educational attainment and complete academic history."
        />

        {hasCandidateValue(attainment) && (
          <div className="mb-4">
            <ProfileDetail
              label="Highest Educational Attainment"
              value={attainment}
            />
          </div>
        )}

        {records.length > 0 ? (
          <div className="space-y-4">
            {records.map((record, index) => (
              <article
                key={`${record.sectionKey || record.level || "education"}-${
                  record.schoolName || index
                }-${index}`}
                className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white"
              >
                <div className="flex items-start gap-3 border-b border-[#E6ECF2] bg-[#F8FAFC] px-4 py-4 sm:px-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FB] text-sibs-primary-1">
                    <GraduationCap size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1/60 sm:text-[11px]">
                      Academic Record {index + 1}
                    </p>
                    <h4 className="mt-1 break-words text-sm font-extrabold text-[#101828] sm:text-base">
                      {record.level || "Educational Background"}
                    </h4>
                  </div>
                </div>

                <div className="space-y-3 p-4 sm:p-5">
                  <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
                    <ProfileDetail
                      label="School Name"
                      value={record.schoolName}
                    />

                    {hasCandidateValue(record.course) && (
                      <ProfileDetail
                        label="Course / Program"
                        value={record.course}
                      />
                    )}

                    {hasCandidateValue(record.schoolYearGraduated) && (
                      <ProfileDetail
                        label="School Year Graduated"
                        value={record.schoolYearGraduated}
                      />
                    )}
                  </ProfileGrid>

                  {hasCandidateValue(record.address) && (
                    <ProfileTextarea
                      label="School Address"
                      value={record.address}
                    />
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : !hasCandidateValue(attainment) ? (
          <EmptyState title="No education information provided." />
        ) : (
          <EmptyState
            title="No detailed school records provided."
            description="The candidate's highest educational attainment is available, but school-level details were not saved for this record."
          />
        )}
      </section>
    );
  }

  function renderEligibility() {
    const records = normalizeCandidateRecordList(
      firstCandidateValue(
        activeCandidate.eligibility,
        activeCandidate.certifications,
        activeCandidate.licenses,
        activeCandidate.licenseAndEligibility,
      ),
    );

    return (
      <section className="space-y-4">
        <SectionTitle
          icon={BadgeCheck}
          title="Eligibility"
          description="Candidate licenses, certifications, and eligibility records."
        />

        {records.length > 0 ? (
          <div className="space-y-3">
            {records.map((record, index) => {
              const item =
                record && typeof record === "object"
                  ? record
                  : { title: record };

              return (
                <div
                  key={`${item.title || item.name || "eligibility"}-${index}`}
                  className="rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] p-4"
                >
                  <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-4">
                    <ProfileDetail
                      label="Eligibility / License"
                      value={firstCandidateValue(item.title, item.name)}
                    />
                    <ProfileDetail label="Rating" value={item.rating} />
                    <ProfileDetail
                      label="License Number"
                      value={firstCandidateValue(
                        item.licenseNumber,
                        item.license_number,
                      )}
                    />
                    <ProfileDetail
                      label="Validity Date"
                      value={formatDate(
                        firstCandidateValue(
                          item.validityDate,
                          item.validity_date,
                        ),
                      )}
                    />
                  </ProfileGrid>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No eligibility or license information provided." />
        )}
      </section>
    );
  }

  function renderTraining() {
    const records = normalizeCandidateRecordList(
      firstCandidateValue(
        activeCandidate.trainings,
        activeCandidate.training,
        activeCandidate.trainingRecords,
      ),
    );
    const attended = activeCandidate.trainingAttended;

    return (
      <section className="space-y-4">
        <SectionTitle
          icon={GraduationCap}
          title="Training"
          description="Candidate training programs, seminars, and interventions attended."
        />

        {hasCandidateValue(attended) && (
          <div className="mb-4">
            <ProfileTextarea label="Training Attended" value={attended} />
          </div>
        )}

        {records.length > 0 ? (
          <div className="space-y-3">
            {records.map((record, index) => {
              const item =
                record && typeof record === "object"
                  ? record
                  : { title: record };

              return (
                <div
                  key={`${item.title || "training"}-${index}`}
                  className="rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] p-4"
                >
                  <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-4">
                    <ProfileDetail label="Training Title" value={item.title} />
                    <ProfileDetail
                      label="From"
                      value={formatDate(firstCandidateValue(item.from, item.startDate))}
                    />
                    <ProfileDetail
                      label="To"
                      value={formatDate(firstCandidateValue(item.to, item.endDate))}
                    />
                    <ProfileDetail
                      label="Conducted By"
                      value={firstCandidateValue(
                        item.conductedBy,
                        item.sponsor,
                        item.provider,
                      )}
                    />
                  </ProfileGrid>
                </div>
              );
            })}
          </div>
        ) : !hasCandidateValue(attended) ? (
          <EmptyState title="No training information provided." />
        ) : null}
      </section>
    );
  }

  function renderSkillsSection(section) {
    const skills = firstCandidateValue(
      activeCandidate.skillsLanguage,
      activeCandidate.skills,
      activeCandidate.languages,
    );
    const recognitions = firstCandidateValue(
      activeCandidate.recognitions,
      activeCandidate.awards,
      activeCandidate.distinctions,
    );
    const affiliations = firstCandidateValue(
      activeCandidate.affiliations,
      activeCandidate.organizations,
      activeCandidate.memberships,
    );

    if (section === "recognitions") {
      return (
        <section className="space-y-4">
          <SectionTitle
            icon={BadgeCheck}
            title="Recognition"
            description="Candidate awards, distinctions, and recognition received."
          />
          {hasCandidateValue(recognitions) ? (
            <ProfileTextarea
              label="Recognition"
              value={formatList(recognitions)}
            />
          ) : (
            <EmptyState title="No recognition information provided." />
          )}
        </section>
      );
    }

    if (section === "organizations") {
      return (
        <section className="space-y-4">
          <SectionTitle
            icon={UserRoundPen}
            title="Organizations"
            description="Candidate affiliations, organizations, and memberships."
          />
          {hasCandidateValue(affiliations) ? (
            <ProfileTextarea
              label="Affiliations / Organizations"
              value={formatList(affiliations)}
            />
          ) : (
            <EmptyState title="No organization information provided." />
          )}
        </section>
      );
    }

    return (
      <section className="space-y-4">
        <SectionTitle
          icon={Sparkles}
          title="Skills"
          description="Candidate skills, languages, and competencies."
        />
        {hasCandidateValue(skills) ? (
          <ProfileTextarea label="Skills / Language" value={formatList(skills)} />
        ) : (
          <EmptyState title="No skills information provided." />
        )}
      </section>
    );
  }

  function renderWorkExperience() {
    return (
      <section className="space-y-4">
        <SectionTitle
          icon={BriefcaseBusiness}
          title="Work Experience"
          description="Candidate employment background, previous role, company, and compensation."
        />

        <div className="mb-4">
          <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
            {activeCandidate.workExperience || "—"}
          </span>
        </div>

        {workExperiences.length > 0 ? (
          <div className="space-y-4">
            {workExperiences.map((experience, index) => (
              <div
                key={`experience-${index}`}
                className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                      Experience {index + 1}
                    </p>

                    <h5 className="mt-1 break-words text-base font-extrabold text-[#101828]">
                      {experience.role || experience.industry || "—"}
                    </h5>

                    <p className="mt-1 break-words text-sm font-bold text-sibs-primary-1">
                      {experience.company || "Company not provided"}
                    </p>
                  </div>

                  <span className="inline-flex w-fit shrink-0 rounded-full border border-[#D6E9FF] bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
                    {experience.years
                      ? `${experience.years} year(s)`
                      : "No duration"}
                  </span>
                </div>

                <div className="mt-4">
  <ProfileGrid cols="md:grid-cols-3">
    <ProfileDetail label="Industry" value={experience.industry} />

    <ProfileDetail
      label="Compensation"
      value={
        experience.monthlyCompensation
          ? formatCurrency(experience.monthlyCompensation)
          : "—"
      }
    />

    <ProfileDetail
      label="Length of Experience"
      value={experience.lengthOfWorkExperience}
    />

    <div className="md:col-span-3">
      <ProfileDetail
        label="Reason for Leaving"
        value={experience.reasonForLeaving}
      />
    </div>
  </ProfileGrid>
</div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No work experience details"
            description={
              activeCandidate.workExperience || "No work experience provided."
            }
          />
        )}
      </section>
    );
  }

  function renderAssessment() {
    const assessmentStatus = firstCandidateValue(
      activeCandidate.assessmentStatus,
      activeCandidate.assessment_status,
    );
    const assessmentScore = firstCandidateValue(
      activeCandidate.assessmentScore,
      activeCandidate.assessment_score,
      activeCandidate.onlineAssessmentScore,
    );
    const assessmentResult = firstCandidateValue(
      activeCandidate.assessmentResult,
      activeCandidate.assessment_result,
      activeCandidate.onlineAssessmentResult,
    );
    const assessmentRemarks = firstCandidateValue(
      activeCandidate.assessmentRemarks,
      activeCandidate.assessment_remarks,
    );
    const hasAssessment = [
      assessmentStatus,
      assessmentScore,
      assessmentResult,
      assessmentRemarks,
    ].some(hasCandidateValue);

    return (
      <section className="space-y-4">
        <SectionTitle
          icon={BadgeCheck}
          title="Assessment"
          description="Candidate assessment status, score, and results."
        />

        {hasAssessment ? (
          <div className="space-y-3">
            <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
              <ProfileDetail label="Assessment Status" value={assessmentStatus} />
              <ProfileDetail label="Assessment Score" value={assessmentScore} />
              <ProfileDetail label="Assessment Result" value={assessmentResult} />
            </ProfileGrid>
            {hasCandidateValue(assessmentRemarks) && (
              <ProfileTextarea
                label="Assessment Remarks"
                value={assessmentRemarks}
              />
            )}
          </div>
        ) : (
          <EmptyState title="No assessment information provided." />
        )}
      </section>
    );
  }

 function renderReadiness() {
  return (
    <section className="space-y-4">
      <SectionTitle
        icon={ShieldCheck}
        title="Readiness and Compliance"
        description="Availability, work setup, and compliance readiness."
      />

      <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
        <ProfileDetail label="Vaccinated" value={activeCandidate.fullyVaccinated} />

        <ProfileDetail
          label="On-site Ready"
          value={activeCandidate.comfortableOnSite}
        />

        <ProfileDetail
          label="Graveyard Shift"
          value={activeCandidate.willingGraveyard}
        />

        <ProfileDetail
          label="Employment Type"
          value={activeCandidate.employmentInterest}
        />

        <ProfileDetail
          label="Remote Access"
          value={activeCandidate.remoteWorkAccess}
        />

        <ProfileDetail label="Drug Test" value={activeCandidate.willingDrugTest} />

        <div className="sm:col-span-2 xl:col-span-3">
          <ProfileDetail
            label="Background Check"
            value={activeCandidate.willingBackgroundCheck}
          />
        </div>
      </ProfileGrid>
    </section>
  );
}

  function renderReferences() {
    return (
      <section className="space-y-4">
        <SectionTitle
          icon={Phone}
          title="References"
          description="Candidate character or work references."
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {validReferences.length > 0 ? (
            validReferences.map((reference, index) => (
              <ReferenceCard
                key={`reference-${index}`}
                reference={reference}
                index={index}
              />
            ))
          ) : (
            <div className="md:col-span-2">
              <EmptyState title="No references provided." />
            </div>
          )}
        </div>
      </section>
    );
  }

  function renderUploadedFiles() {
    const audioFileUrl = getResolvedFileUrl(activeCandidate.audioFileUrl);
    const attachmentFileUrl = getResolvedFileUrl(activeCandidate.attachmentFileUrl);

    function openFile(fileUrl) {
      const resolvedUrl = getResolvedFileUrl(fileUrl);

      if (!resolvedUrl) {
        showStatusModal({
          type: "error",
          title: "File Not Available",
          message: "This file has no saved file URL.",
        });
        return;
      }

      window.open(resolvedUrl, "_blank", "noopener,noreferrer");
    }

    return (
      <section className="space-y-4">
        <SectionTitle
          icon={FileText}
          title="Other Files"
          description="Candidate audio recording, resume, and supporting attachments."
        />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  Audio Recording
                </p>

                <p
                  title={activeCandidate.audioFileName || "—"}
                  className="mt-2 truncate text-sm font-extrabold text-[#344054]"
                >
                  {activeCandidate.audioFileName || "—"}
                </p>
              </div>

              <button
                type="button"
                disabled={!audioFileUrl}
                onClick={() => openFile(audioFileUrl)}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Eye size={16} />
                View
              </button>
            </div>

            {audioFileUrl ? (
              <audio
                controls
                src={audioFileUrl}
                className="mt-4 w-full"
              >
                Your browser does not support the audio element.
              </audio>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-[#C9D6E4] bg-white px-4 py-3 text-sm font-bold text-sibs-tertiary-5">
                No audio recording uploaded.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  Attachment
                </p>

                <p
                  title={activeCandidate.attachmentFileName || "—"}
                  className="mt-2 truncate text-sm font-extrabold text-[#344054]"
                >
                  {activeCandidate.attachmentFileName || "—"}
                </p>
              </div>

              <button
                type="button"
                disabled={!attachmentFileUrl}
                onClick={() => openFile(attachmentFileUrl)}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Eye size={16} />
                View
              </button>
            </div>

            {attachmentFileUrl ? (
              <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-bold text-sibs-primary-1">
                Click View to open the uploaded attachment.
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-[#C9D6E4] bg-white px-4 py-3 text-sm font-bold text-sibs-tertiary-5">
                No attachment uploaded.
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }


  function renderPreEmploymentFiles() {
    return (
      <CandidateNhoFilesSection
        files={displayedPreEmploymentFiles}
        selectedFile={selectedNhoFile}
        onSelectFile={setSelectedNhoFile}
        isLoading={candidatePipelineFilesLoading}
        error={candidatePipelineFilesError}
        canUpload={canUploadFollowUpNhoRequirements}
        onUploadFollowUp={() => setShowNhoUploadModal(true)}
      />
    );
  }

  function renderDocumentVault() {
    return (
      <DocumentVaultManager
        title="Document Vault Manager"
        description="Manage Candidate Pipeline pre-employment files in one place."
        preEmploymentCount={displayedPreEmploymentFiles.length}
        defaultSection="pre-employment"
        showOtherFiles={false}
        renderPreEmploymentFiles={renderPreEmploymentFiles}
      />
    );
  }

  function renderApplicationHistory({
    title = "Application History",
    description =
      "Candidate movement and application timeline, including Candidate Pipeline process.",
    icon = Network,
  } = {}) {
    return (
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <SectionTitle
            icon={icon}
            title={title}
            description={description}
          />

          {applicationHistory.length > 0 && (
            <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
              {applicationHistory.length} record
              {applicationHistory.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="mt-5">
          {applicationHistory.length > 0 ? (
            <>
              <div className="relative space-y-4">
                {visibleApplicationHistory.map((item, index) => {
                  const historyTitle = item.stage || "Application Update";
                  const historyStatus =
                    item.statusLabel ||
                    getHistoryStatusLabel(item, historyTitle, activeCandidate);
                  const historyDate = item.date || activeCandidate.lastActivity;
                  const historyOwner = item.owner || encodedBy || "—";
                  const historyDescription = item.description;

                  return (
                    <div
                      key={`${item._dedupeKey}-${historyDate}-${index}`}
                      className="relative grid grid-cols-[42px_minmax(0,1fr)] gap-4"
                    >
                      <div className="relative flex justify-center">
                        {index < visibleApplicationHistory.length - 1 && (
                          <span className="absolute left-1/2 top-10 -bottom-4 w-px -translate-x-1/2 bg-[#DCE8F5]" />
                        )}

                        <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-extrabold text-blue-700 shadow-[0_0_0_6px_#FFFFFF]">
                          {visibleApplicationHistoryStartIndex + index + 1}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#D9E2EC] bg-[#F8FAFC] p-4 transition hover:border-sibs-primary-1/30 hover:bg-white hover:shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h5
                              title={historyTitle}
                              className="line-clamp-2 text-sm font-extrabold leading-6 text-[#101828]"
                            >
                              {historyTitle}
                            </h5>

                            <p className="mt-1 text-sm font-bold text-sibs-primary-1">
                              {formatDate(historyDate)}
                            </p>
                          </div>

                          <div className="flex max-w-full shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                            <span
                              title={`Status: ${historyStatus}`}
                              className={`inline-flex max-w-full items-center justify-center truncate rounded-full border px-3 py-1 text-xs font-extrabold ${getStatusClass(
                                historyStatus,
                              )}`}
                            >
                              Status: {historyStatus}
                            </span>

                            <span
                              title={historyOwner}
                              className="inline-flex max-w-full items-center justify-center truncate rounded-full border border-[#D6DEE8] bg-white px-3 py-1 text-xs font-bold text-[#475467]"
                            >
                              {historyOwner}
                            </span>
                          </div>
                        </div>

                        <p className="mt-4 whitespace-pre-line break-words text-sm font-medium leading-6 text-[#475467]">
                          {historyDescription}
                        </p>

                        {item.remarks && (
                          <div className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#344054]">
                            {item.remarks}
                          </div>
                        )}

                        <GetAssessmentTimelineFiles
                          item={item}
                          candidate={activeCandidate}
                        />

                        {item.offerDetail && (
                          <div className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#344054]">
                            {item.offerDetail}
                          </div>
                        )}

                        {item.savedFormLink && (
                          <div className="mt-4 min-w-0">
                            <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                              Job Evaluation Link
                            </p>

                            <a
                              href={item.savedFormLink}
                              target="_blank"
                              rel="noreferrer"
                              title={item.savedFormLink}
                              dir="ltr"
                              className="mt-2 block w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap rounded-xl border border-[#D9E2EC] bg-white px-3 py-2 text-left text-sm text-blue-700 underline"
                            >
                              {item.savedFormLink.startsWith("http")
                                ? item.savedFormLink
                                : `${window.location.origin}${item.savedFormLink}`}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMoreApplicationHistory && (
                <div className="mt-5 flex justify-center border-t border-[#E6ECF2] pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      setShowFullApplicationHistory(
                        (previousValue) => !previousValue,
                      )
                    }
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-sibs-primary-1 transition hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC]"
                  >
                    {showFullApplicationHistory
                      ? "Show Less History"
                      : "View Full History"}

                    <ChevronDown
                      size={16}
                      className={`transition ${
                        showFullApplicationHistory ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState title="No application history yet." />
          )}
        </div>
      </section>
    );
  }

  function renderMovementHistory() {
    return (
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <SectionTitle
            icon={RefreshCcw}
            title="Movement History"
            description="Personal candidate movement and audit trail using the same Candidate Pipeline history rules."
          />

          {personalMovementHistory.length > 0 && (
            <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
              {personalMovementHistory.length} record
              {personalMovementHistory.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {personalMovementHistory.length === 0 ? (
          <EmptyState title="No movement history recorded yet." />
        ) : (
          <div className="relative pl-6">
            <div className="absolute bottom-2 left-2 top-2 w-[2px] bg-[#E6ECF2]" />

            <div className="space-y-4">
              {personalMovementHistory.map((item, index) => {
                const isLatest = index === 0;
                const details = safeObject(item.details);
                const offerSummary = safeObject(details.offerSummary);
                const links = safeArray(details.links);
                const files = safeArray(details.files);
                const nhoFileTracking = safeArray(details.nhoFileTracking);

                return (
                  <article key={item.id || `${item.stage}-${item.rawDate}-${index}`} className="relative">
                    <span
                      className={`absolute -left-[25px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 bg-white ${
                        isLatest
                          ? "border-[#FF5C28] ring-4 ring-[#FFF0EB]"
                          : "border-[#98A2B3]"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isLatest ? "bg-[#FF5C28]" : "bg-[#98A2B3]"
                        }`}
                      />
                    </span>

                    <div
                      className={`rounded-2xl border p-4 ${
                        isLatest
                          ? "border-[#FFD7C8] bg-[#FFFBF9]"
                          : "border-[#D9E2EC] bg-white"
                      }`}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="text-sm font-extrabold text-[#042C51]">
                              {item.displayStage || item.stage || "Application Update"}
                            </h5>

                            {isLatest && (
                              <span className="rounded bg-[#FF5C28] px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-white">
                                Latest
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-semibold text-[#667085]">
                            <span className="inline-flex items-center gap-1.5">
                              <UserRound size={12} className="text-[#98A2B3]" />
                              {item.updatedBy || "System"}
                            </span>

                            {item.rawDate && (
                              <span className="inline-flex items-center gap-1.5">
                                <CalendarDays size={12} className="text-[#98A2B3]" />
                                {formatUploadedDate(item.rawDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#475467]">
                        {item.reason || "Candidate pipeline record updated."}
                      </div>

                      {nhoFileTracking.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {nhoFileTracking.map((file, fileIndex) => (
                            <div
                              key={`${file.action}-${file.requirement}-${file.fileName}-${fileIndex}`}
                              className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-[#F8FAFC]"
                            >
                              {[
                                ["Requirement:", file.requirement],
                                ["File:", file.fileName],
                                ["Action:", file.action],
                              ].map(([label, value], detailIndex) => (
                                <div
                                  key={label}
                                  className={`flex items-start justify-between gap-3 px-4 py-2.5 ${
                                    detailIndex < 2 ? "border-b border-[#E6ECF2]" : ""
                                  }`}
                                >
                                  <span className="text-[10px] font-extrabold text-[#667085]">
                                    {label}
                                  </span>
                                  <span className="min-w-0 break-all text-right text-[10px] font-extrabold text-[#042C51]">
                                    {value || "—"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}

                      {Object.keys(offerSummary).length > 0 && (
                        <div className="mt-3 overflow-hidden rounded-xl border border-[#E6ECF2] bg-[#F8FAFC]">
                          {[
                            ["Account", offerSummary.account],
                            ["Basic Pay", offerSummary.basicPay],
                            [
                              "De Minimis / Daily Rate",
                              offerSummary.deMinimisDailyRate,
                            ],
                          ].map(([label, value], detailIndex) => (
                            <div
                              key={label}
                              className={`flex items-start justify-between gap-3 px-4 py-2.5 ${
                                detailIndex < 2
                                  ? "border-b border-[#E6ECF2]"
                                  : ""
                              }`}
                            >
                              <span className="text-[10px] font-extrabold text-[#667085]">
                                {label}:
                              </span>
                              <span className="text-right text-[10px] font-extrabold text-[#042C51]">
                                {value || "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {item.remarks && item.remarks !== item.reason && (
                        <p className="mt-3 whitespace-pre-line break-words text-[11px] font-semibold leading-5 text-[#667085]">
                          {item.remarks}
                        </p>
                      )}

                      {(details.score || details.result) && (
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {details.score && (
                            <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
                              <p className="text-[9px] font-extrabold uppercase tracking-wide text-[#174A78]">
                                Score
                              </p>
                              <p className="mt-0.5 text-sm font-extrabold text-[#042C51]">
                                {details.score}
                              </p>
                            </div>
                          )}

                          {details.result && (
                            <div className="rounded-xl border border-blue-100 bg-white px-3 py-2.5">
                              <p className="text-[9px] font-extrabold uppercase tracking-wide text-[#174A78]">
                                Result
                              </p>
                              <p className="mt-0.5 text-sm font-extrabold text-[#042C51]">
                                {details.result}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {links.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {links.map((link) => (
                            <a
                              key={`${link.label}-${link.url}`}
                              href={getResolvedFileUrl(link.url)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex w-full items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-left text-xs font-extrabold text-blue-700 underline"
                            >
                              <span className="truncate">Open {link.label}</span>
                              <ArrowRight size={14} className="shrink-0" />
                            </a>
                          ))}
                        </div>
                      )}

                      {files.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {files.map((file, fileIndex) => {
                            const fileName = cleanText(
                              file.name ||
                                file.fileName ||
                                file.filename ||
                                file.title ||
                                "Attachment",
                            );
                            const fileUrl = getResolvedFileUrl(
                              file.url ||
                                file.fileUrl ||
                                file.file_url ||
                                file.path ||
                                "",
                            );

                            return (
                              <div
                                key={`${fileName}-${fileIndex}`}
                                className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-[#F8FAFC] px-3 py-2.5"
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <FileText
                                    size={17}
                                    className="shrink-0 text-[#FF5C28]"
                                  />
                                  <p className="truncate text-xs font-extrabold text-[#042C51]">
                                    {fileName}
                                  </p>
                                </div>

                                {fileUrl && (
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="shrink-0 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-[10px] font-extrabold text-blue-700"
                                  >
                                    Open File
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>
    );
  }

  function renderApplicationAnswers() {
    const answers = safeArray(applicationAnswers.answers);
    const form = safeObject(applicationAnswers.form);

    return (
      <div className="space-y-6">
        <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <SectionTitle
            icon={MessageSquareText}
            title="Application Questions & Answers"
            description="Read-only answers submitted by the applicant for the selected open position."
          />

          {answers.length > 0 && (
            <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
              {answers.length} answer{answers.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {form.formName ? (
          <div className="rounded-2xl border border-[#D9E2EC] bg-[#F8FAFC] p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#8A98B8]">
              Application Form
            </p>
            <p className="mt-1 text-sm font-extrabold text-[#042C51]">
              {form.formName}
            </p>
          </div>
        ) : null}

        {applicationAnswersLoading ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-[#E6ECF2] bg-white p-6">
            <div className="flex items-center gap-2 text-sm font-bold text-[#667085]">
              <Loader2 size={18} className="animate-spin text-[#FF5C28]" />
              Loading application questions and answers...
            </div>
          </div>
        ) : applicationAnswersError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
            {applicationAnswersError}
          </div>
        ) : answers.length === 0 ? (
          <EmptyState title="No application questions were submitted for this candidate." />
        ) : (
          <div className="space-y-3">
            {answers.map((answer, index) => (
              <article
                key={answer.id || `${answer.questionId || "question"}-${index}`}
                className="rounded-2xl border border-[#D9E2EC] bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-[#FFF0EA] px-2 text-[10px] font-black text-[#FF5C28]">
                        {index + 1}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide ${
                          answer.isRequired
                            ? "bg-red-50 text-red-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {answer.isRequired ? "Required" : "Optional"}
                      </span>
                    </div>

                    <h4 className="mt-3 break-words text-sm font-extrabold leading-6 text-[#042C51]">
                      {answer.questionText || "Application Question"}
                    </h4>

                    {answer.helperText ? (
                      <p className="mt-1 text-xs font-semibold leading-5 text-[#667085]">
                        {answer.helperText}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#8A98B8]">
                    Applicant Answer
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-[#344054]">
                    {cleanText(answer.textAnswer) || "No text answer submitted."}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
        </section>

        {renderUploadedFiles()}
      </div>
    );
  }

  function renderRemarks() {
  return (
    <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <SectionTitle
        icon={FileText}
        title="Notes"
        description="Candidate profile notes and general remarks."
      />

      <ProfileTextarea
        label="Notes"
        value={activeCandidate.remarks || "No additional notes."}
      />
    </section>
  );
}

  function renderActiveTabContent() {
    if (activeTab === "personal.basic") return renderPersonalBasic();
    if (activeTab === "personal.contact") return renderPersonalContact();
    if (activeTab === "personal.address") return renderPersonalAddress();
    if (activeTab === "personal.ids") return renderGovernmentIds();

    if (activeTab === "family.spouse") return renderFamilySection("spouse");
    if (activeTab === "family.parents") return renderFamilySection("parents");
    if (activeTab === "family.children") return renderFamilySection("children");
    if (activeTab === "family.emergency") return renderFamilySection("emergency");

    if (activeTab === "education") return renderEducation();
    if (activeTab === "eligibility") return renderEligibility();
    if (activeTab === "experience") return renderWorkExperience();
    if (activeTab === "training") return renderTraining();

    if (activeTab === "skills.skills") return renderSkillsSection("skills");
    if (activeTab === "skills.recognitions") {
      return renderSkillsSection("recognitions");
    }
    if (activeTab === "skills.organizations") {
      return renderSkillsSection("organizations");
    }

    if (activeTab === "references") return renderReferences();

    if (activeTab === "application.overview") {
      return renderApplicationOverview();
    }
    if (activeTab === "application.pipeline") return renderPipelineLink();
    if (activeTab === "application.assessment") return renderAssessment();
    if (activeTab === "application.readiness") return renderReadiness();
    if (activeTab === "application.history") return renderApplicationHistory();

    if (activeTab === "documents.vault") return renderDocumentVault();

    if (activeTab === "answers") return renderApplicationAnswers();

    if (activeTab === "movement-history") return renderMovementHistory();

    if (activeTab === "notes") return renderRemarks();

    return renderPersonalBasic();
  }

  return (
    <>
      <div
        className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[10000] flex h-dvh items-center justify-center p-2 font-jakarta sm:p-3 2xl:p-4"
        onClick={handleCloseCandidateProfile}
      >
        <div
          className="sibs-modal-pop-in flex h-[88dvh] xl:h-[92dvh] max-h-[88dvh] xl:max-h-[92dvh] w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1400px] flex-col overflow-hidden rounded-2xl border border-sibs-border bg-[#F8FAFC] shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#174A7C] bg-sibs-navy px-3.5 py-2 text-white sm:px-5 xl:px-6 xl:py-3.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-7.5 w-7.5 xl:h-9 xl:w-9 shrink-0 items-center justify-center rounded-lg bg-sibs-orange text-white shadow-xs">
                <UserRound size={16} />
              </span>

              <div className="min-w-0">
                <h2 className="truncate text-xs sm:text-sm xl:text-base font-extrabold uppercase tracking-wide text-white">
                  Talent Pool Candidate Profile
                </h2>
                <p className="truncate text-[9.5px] sm:text-[10.5px] xl:text-xs font-semibold text-blue-100">
                  Comprehensive candidate filing and talent screening profile record
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseCandidateProfile}
              aria-label="Close candidate profile"
              className="inline-flex h-7 w-7 xl:h-8.5 xl:w-8.5 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/10 text-white/80 transition hover:border-sibs-orange/60 hover:bg-sibs-orange hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X size={16} />
            </button>
          </div>

          <div className="thin-scroll flex-1 overflow-y-auto bg-[#F8FAFC] p-2.5 sm:p-3.5 xl:p-5 2xl:p-6">
            <div className="space-y-2.5 xl:space-y-4">
              <section className="relative overflow-hidden rounded-xl border border-sibs-border bg-white px-3 py-2 xl:px-5 xl:py-3.5 shadow-2xs">
                <span
                  className="pointer-events-none absolute left-0 right-0 top-0 h-0.5 overflow-hidden"
                  aria-hidden="true"
                >
                  <span className="block h-full w-full bg-gradient-to-r from-[#042C51] via-[#FF5C28] to-[#042C51]" />
                </span>

                <div className="flex flex-col items-center justify-between gap-2.5 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
                    <div className="relative flex h-10 w-10 xl:h-12 xl:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#042C51] to-[#084782] text-sm xl:text-base font-black text-white shadow-xs">
                      {candidateInitials}
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                        <h3 className="truncate text-sm sm:text-base xl:text-lg font-black leading-tight tracking-tight text-sibs-navy">
                          {activeCandidate.name || "Unnamed Candidate"}
                        </h3>

                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.2 text-[8.5px] sm:text-[9px] xl:text-[9.5px] font-extrabold uppercase ${getStatusClass(
                            candidateDisplayStatus,
                          )}`}
                        >
                          {candidateDisplayStatus || "—"}
                        </span>

                        <span className="rounded-md border border-blue-100 bg-[#E9F0FC] px-1.5 py-0.2 font-mono text-[8.5px] sm:text-[9px] xl:text-[9.5px] font-extrabold uppercase text-sibs-navy">
                          {activeCandidate.candidateId || "—"}
                        </span>
                      </div>

                      <div className="mt-0.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[9.5px] sm:text-[10.5px] xl:text-xs font-semibold text-sibs-text-muted sm:justify-start">
                        <span className="font-bold text-sibs-orange">
                          {activeCandidate.openPosition ||
                            activeCandidate.roleCapability ||
                            "No position"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Mail size={12} className="text-sibs-orange" />
                          {activeCandidate.email || "No email"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={12} className="text-sibs-orange" />
                          Applied: {formatDate(
                            firstCandidateValue(
                              activeCandidate.applicationDate,
                              activeCandidate.application_date,
                              activeCandidate.createdAt,
                              activeCandidate.created_at,
                            ),
                          )}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} className="text-sibs-orange" />
                          {activeCandidate.applyingLocation || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full shrink-0 flex-row items-center justify-end gap-1.5 sm:w-auto">
                    <button
                      type="button"
                      onClick={handleGenerateResume}
                      disabled={!talentPoolApplicationId || isGeneratingResume}
                      className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 rounded-lg border border-sibs-border bg-white px-3 2xl:px-3.5 sibs-text-xs font-extrabold text-sibs-navy shadow-2xs transition hover:border-sibs-orange/40 hover:bg-sibs-cream-subtle hover:text-sibs-orange focus-visible:ring-2 focus-visible:ring-sibs-orange/30 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isGeneratingResume ? (
                        <>
                          <Loader2 size={13} className="animate-spin text-sibs-orange" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <FileDown size={13} className="text-sibs-orange" />
                          <span>Generate PDS</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleUpdateCandidateStatus}
                      className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 rounded-lg bg-sibs-navy px-3 2xl:px-3.5 sibs-text-xs font-extrabold text-white shadow-2xs transition hover:bg-sibs-navy/90"
                    >
                      <RefreshCcw size={13} className="text-sibs-orange" />
                      Status
                    </button>
                  </div>
                </div>

                {isDoNotReprocess && (
                  <div className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                    This candidate is marked as Do Not Reprocess and cannot be
                    moved to the pipeline unless the status is updated.
                  </div>
                )}
              </section>

              <CandidateProfileHorizontalNavigation
                tabs={profileTabs}
                activeTab={activeTab}
                onTabChange={handleProfileTabChange}
              />

              <div className="sibs-page-card-in grid grid-cols-1 items-start">
                <section
                  key={activeTab}
                  className="sibs-profile-tab-panel min-w-0 rounded-xl border border-sibs-border bg-white p-3 sm:p-4 xl:p-5 2xl:p-6 shadow-2xs"
                >
                  <div className="mb-2.5 flex items-center justify-between border-b border-sibs-border pb-1.5 xl:pb-2.5">
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm xl:text-base font-black uppercase tracking-wider text-sibs-navy">
                        {activeProfileParent?.label || "Profile"}
                        {activeProfileChild?.label
                          ? ` - ${activeProfileChild.label}`
                          : ""}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-sibs-navy" />
                      <span className="text-[9px] sm:text-[9.5px] xl:text-[10px] font-extrabold uppercase text-sibs-text-muted">
                        Official Profile Record
                      </span>
                    </div>
                  </div>

                  <AnimatedProfileTabPanel key={`${activeTab}-${tabAnimationKey}`}>
                    {renderActiveTabContent()}
                  </AnimatedProfileTabPanel>
                </section>
              </div>
            </div>
          </div>

          <div className="relative z-[40] flex flex-col-reverse gap-2 border-t border-sibs-border bg-white px-3.5 py-2 sm:px-5 xl:px-6 xl:py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="inline-flex w-fit max-w-full items-center rounded-full border border-sibs-border bg-sibs-canvas px-2.5 py-1 xl:px-3.5 xl:py-1.5 text-[10px] sm:text-[10.5px] xl:text-xs font-extrabold leading-tight text-sibs-navy">
              {isDropOffCandidate ? (
                <span className="font-extrabold text-amber-700">
                  Candidate is marked as Drop-off. Use Move to Pipeline to
                  continue from the last completed process stage.
                </span>
              ) : canMoveToOnboarding ? (
                <span className="font-extrabold text-emerald-600">
                  Candidate completed the 5 major requirements and can be moved
                  to Onboarding.
                </span>
              ) : isIncompleteRequirementsStage ? (
                <span className="font-extrabold text-amber-700">
                  Candidate is linked to the pipeline and pending onboarding
                  requirements.
                </span>
              ) : isAlreadyOnboarding ? (
                <span className="font-extrabold text-emerald-600">
                  Candidate is already under Onboarding.
                </span>
              ) : isAlreadyInPipeline ? (
                <span className="font-extrabold text-emerald-600">
                  Candidate is already linked to the Candidate Pipeline.
                </span>
              ) : isDoNotReprocess ? (
                <span className="font-extrabold text-red-600">
                  Update the candidate status before moving to pipeline.
                </span>
              ) : (
                "Review all candidate details before moving to pipeline."
              )}
            </p>

            <div className="relative z-[50] flex flex-col gap-1.5 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleCloseCandidateProfile}
                className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-navy transition hover:border-sibs-orange/40 hover:bg-sibs-cream-subtle hover:text-sibs-orange focus-visible:ring-2 focus-visible:ring-sibs-orange/30"
              >
                Close
              </button>

              {!isAlreadyInPipeline &&
                !isDoNotReprocess &&
                !isDropOffCandidate && (
                <button
                  type="button"
                  onClick={handleOpenDropOff}
                  disabled={dropOffSaving}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-red-700 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-100 hover:shadow-2xs disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UserX size={14} />
                  {dropOffSaving ? "Saving..." : "Mark as Drop Off"}
                </button>
              )}

              {canMoveToOnboarding && (
                <button
                  type="button"
                  disabled={isMovingToOnboarding}
                  onClick={handleMoveToOnboarding}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 rounded-lg bg-sibs-orange px-4 2xl:px-5 sibs-text-xs font-extrabold text-white shadow-2xs transition hover:bg-sibs-orange/90 focus-visible:ring-4 focus-visible:ring-sibs-orange/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isMovingToOnboarding ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ArrowRight size={14} />
                  )}
                  {isMovingToOnboarding ? "Moving..." : "Move to Onboarding"}
                </button>
              )}

              {shouldShowLinkedButton && (
                <button
                  type="button"
                  onClick={handleOpenLinkedCandidateDestination}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 rounded-lg bg-sibs-orange px-4 2xl:px-5 sibs-text-xs font-extrabold text-white shadow-2xs transition hover:bg-sibs-orange/90 focus-visible:ring-4 focus-visible:ring-sibs-orange/20"
                >
                  <ArrowRight size={14} />
                  Already Linked
                </button>
              )}

              {shouldShowMoveToPipeline && (
                <button
                  type="button"
                  onClick={handleMoveToPipeline}
                  className="relative z-[60] inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 rounded-lg bg-sibs-orange px-4 2xl:px-5 sibs-text-xs font-extrabold text-white shadow-2xs transition hover:bg-sibs-orange/90 focus-visible:ring-4 focus-visible:ring-sibs-orange/20 active:scale-[0.98]"
                >
                  <ArrowRight size={14} />
                  {isDropOffCandidate
                    ? "Resume in Pipeline"
                    : "Move to Pipeline"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {statusUpdateOpen && (
        <div
          className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[10025] flex h-dvh items-center justify-center px-3 py-3 font-jakarta sm:px-4 sm:py-4"
          onClick={(event) => {
            event.stopPropagation();
            handleCloseStatusUpdate();
          }}
        >
          <div
            className="sibs-modal-pop-in relative flex w-full max-w-lg flex-col overflow-visible rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* SiBS Standard Dark Navy Modal Header */}
            <header className="shrink-0 rounded-t-2xl bg-[#042C51] px-5 py-4 text-white sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF5C28] text-white shadow-sm">
                    <RefreshCcw size={17} />
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-sm font-extrabold text-white sm:text-base">
                        Update Candidate Status
                      </h2>

                      <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-white/90 sm:text-[9px]">
                        Talent Pool Status
                      </span>
                    </div>

                    <p className="mt-0.5 truncate text-[10px] font-semibold text-white/65 sm:text-xs">
                      Update classification and recruitment stage for this candidate.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseStatusUpdate}
                  disabled={statusUpdateSaving}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white/80 transition hover:border-[#FF5C28]/60 hover:bg-[#FF5C28] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Close update candidate status modal"
                >
                  <X size={16} />
                </button>
              </div>
            </header>

            {/* Modal Body with Section Cards */}
            <div className="overflow-visible bg-[#F7F9FC] p-4 sm:p-5 space-y-3.5">
              {/* Candidate Summary Card */}
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-[0_8px_22px_rgba(4,44,81,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#667085]">
                      Candidate
                    </p>
                    <h3 className="mt-0.5 truncate text-sm font-extrabold text-[#042C51]">
                      {candidateDisplayName}
                    </h3>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#667085]">
                      Current Status
                    </p>
                    <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-[#DCE6F1] bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-extrabold text-[#042C51]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#FF5C28]" />
                      {candidateDisplayStatus || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Update Details Card */}
              <div className="relative z-[50] overflow-visible rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-[0_8px_22px_rgba(4,44,81,0.04)]">
                <form onSubmit={handleSaveCandidateStatus} className="space-y-4">
                  <div className="relative z-[100]">
                    <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-[#042C51]">
                      New Status <span className="text-red-500">*</span>
                    </label>
                    <TalentPoolStatusDropdown
                      value={statusUpdateValue}
                      options={TALENT_POOL_STATUS_OPTIONS}
                      disabled={statusUpdateSaving}
                      placeholder="Select status"
                      onChange={(nextValue) => {
                        setStatusUpdateValue(nextValue);

                        if (statusUpdateValidation) {
                          setStatusUpdateValidation("");
                        }
                      }}
                    />

                    {statusUpdateValidation && (
                      <p className="mt-2 text-[10px] font-extrabold text-red-600">
                        {statusUpdateValidation}
                      </p>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Standard SiBS Modal Footer */}
            <footer className="relative z-[10] shrink-0 rounded-b-2xl border-t border-[#E6ECF2] bg-white px-5 py-3.5 sm:px-6">
              <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCloseStatusUpdate}
                  disabled={statusUpdateSaving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D6E0EA] bg-white px-4 text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/35 hover:bg-[#FFF8F5] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveCandidateStatus}
                  disabled={statusUpdateSaving || !cleanText(statusUpdateValue)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#FF5C28] px-5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1F] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF5C28]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {statusUpdateSaving ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <RefreshCcw size={15} />
                  )}
                  {statusUpdateSaving ? "Saving..." : "Save Status"}
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {dropOffOpen && (
        <div
          className="sibs-modal-blur fixed inset-0 z-[10030] flex h-dvh items-center justify-center px-4 py-4"
          onClick={(event) => {
            event.stopPropagation();
            handleCloseDropOff();
          }}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-[#B42318]">
                  Mark as Drop Off
                </h3>
                <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                  {candidateDisplayName}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseDropOff}
                disabled={dropOffSaving}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close Drop Off reason modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmDropOff} className="space-y-4 p-5">
              <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold leading-6 text-[#B42318]">
                The candidate will remain visible in Talent Pool with the Drop
                Off status. Enter the reason before confirming.
              </div>

              <div>
                <FieldLabel>Drop Off Reason</FieldLabel>
                <textarea
                  autoFocus
                  rows={5}
                  value={dropOffReason}
                  onChange={(event) => {
                    setDropOffReason(event.target.value);

                    if (dropOffValidation) {
                      setDropOffValidation("");
                    }
                  }}
                  disabled={dropOffSaving}
                  className={`${textareaClass()} ${
                    dropOffValidation
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : ""
                  }`}
                  placeholder="Enter the reason for dropping off this candidate."
                />

                {dropOffValidation && (
                  <p className="mt-1.5 text-xs font-bold text-red-600">
                    {dropOffValidation}
                  </p>
                )}
              </div>
            </form>

            <div className="border-t border-gray-100 px-5 py-3.5">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseDropOff}
                  disabled={dropOffSaving}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#042C51] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDropOff}
                  disabled={dropOffSaving || !cleanText(dropOffReason)}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 2xl:gap-2 rounded-lg bg-red-600 px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UserX size={15} />
                  {dropOffSaving ? "Saving..." : "Confirm Drop Off"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {canUploadFollowUpNhoRequirements && (
        <NhoUploadModal
          open={showNhoUploadModal}
          onClose={() => setShowNhoUploadModal(false)}
          candidateId={resolvedPipelineId || candidatePipelineLookupId}
          candidateName={activeCandidate.name || "Candidate"}
          candidateEmail={activeCandidate.email || ""}
          initialFiles={displayedPreEmploymentFiles}
          currentFile={selectedNhoFile || displayedPreEmploymentFiles[0] || null}
          previousEmploymentEnabled
          onSave={handleTalentPoolNhoSave}
        />
      )}

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        variant="center"
        onClose={closeStatusModal}
        lockScroll={false}
      />
    </>
  );
}
