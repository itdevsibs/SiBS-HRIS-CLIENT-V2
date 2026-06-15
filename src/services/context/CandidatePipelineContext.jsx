import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useUser } from "./UserContext";

import {
  CANDIDATE_APPLICATIONS_STORAGE_KEY,
  PIPELINE_CANDIDATES_STORAGE_KEY,
  OFFER_ELIGIBLE_STORAGE_KEY,
  PIPELINE_SYNC_EVENTS_KEY,
  defaultPipelineCandidates,
  pipelineStages,
  OFFER_RECORDS_STORAGE_KEY,
} from "../../lib/utils/candidatePipeline/candidatePipelineConstants";

import {
  safeReadArray,
  safeWriteArray,
  loadPipelineCandidateData,
  savePipelineCandidateData,
} from "../../lib/utils/candidatePipeline/candidatePipelineStorage";

import {
  getCurrentDate,
  getCurrentTimestamp,
  formatDateTime,
  toDateInputValue,
  formatCurrency,
} from "../../lib/utils/candidatePipeline/candidatePipelineFormatters";

import {
  normalizeCandidate,
  getCandidateStage,
  getRoleTitle,
  getAccount,
  getNextStage,
  canMoveToOnlineAssessment,
  canScheduleInterview,
  canUpdateInterviewSchedule,
  hasInterviewSchedule,
  getOfferApprovalSummary,
  isOfferApproved,
  triggerAssessmentEmail,
  triggerOfferEmail,
  buildAssessmentLink,
  buildOfferContractLink,
  syncTalentPoolFromPipelineApplication,
  upsertOfferEligibleCandidate,
  removeOfferEligibleCandidate,
  upsertOfferRecordFromPipeline,
  getFridayOfCurrentWeek,
  formatNhoScheduleDate,
} from "../../lib/utils/candidatePipeline/candidatePipelineHelpers";

import {
  INTERNAL_CANDIDATES_KEY,
  PUBLIC_SUBMISSIONS_KEY,
  CANDIDATE_APPLICATIONS_KEY as TALENT_POOL_APPLICATIONS_KEY,
  initialCandidates as talentPoolInitialCandidates,
} from "../../lib/utils/talentPool/talentPoolConstants";

import { normalizeCandidateRecord } from "../../lib/utils/talentPool/talentPoolHelpers";

import { useConfirmDialog } from "../../components/layout/common/ConfirmationModal";

const CandidatePipelineContext = createContext(null);

function normalizePipelineCandidateForBoard(candidate = {}) {
  const currentStage = getCandidateStage(candidate);

  return normalizeCandidate({
    ...candidate,

    currentStage,
    currentPipelineStage: currentStage,
    stage: currentStage,
    pipelineStage: currentStage,

    applicationStatus: candidate.applicationStatus || "Active",
    pipelineStatus: candidate.pipelineStatus || "Active",

    prfStatus: candidate.prfStatus || "Review",
    prfReviewed: Boolean(candidate.prfReviewed),
    prfReviewedAt: candidate.prfReviewedAt || null,

    assessmentStatus: candidate.assessmentStatus || "Not Take",
    assessmentResult: candidate.assessmentResult || "",
    interviewStatus: candidate.interviewStatus || "For Assessment",

    roleTitle: candidate.roleTitle || "Not assigned yet",
    account: candidate.account || "Not assigned yet",
    roleAccount:
      candidate.roleAccount ||
      `${candidate.roleTitle || "Not assigned yet"} - ${
        candidate.account || "Not assigned yet"
      }`,

    candidateSnapshot: {
      ...(candidate.candidateSnapshot || {}),
      candidateId:
        candidate.candidateId || candidate.candidateSnapshot?.candidateId,
      name:
        candidate.name ||
        candidate.candidateName ||
        candidate.candidateSnapshot?.name ||
        "Unnamed Candidate",
      email: candidate.email || candidate.candidateSnapshot?.email || "",
      currentStage,
      currentPipelineStage: currentStage,
      pipelineStage: currentStage,
      pipelineStatus: candidate.pipelineStatus || "Active",
      movedToPipeline: true,
    },
  });
}

function readArrayStorage(key, fallback = []) {
  try {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) return fallback;

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : fallback;
  } catch {
    return fallback;
  }
}

function isTemporaryPipelineId(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .startsWith("PIPE-");
}

function isBlankProfileValue(value) {
  if (value === null || value === undefined) return true;

  if (Array.isArray(value)) return value.length === 0;

  const text = String(value).trim().toLowerCase();

  return (
    text === "" ||
    text === "—" ||
    text === "--" ||
    text === "n/a" ||
    text === "na" ||
    text === "null" ||
    text === "undefined" ||
    text === "not assigned yet"
  );
}

function stripNestedCandidateSnapshot(candidate = {}) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return {};
  }

  const { candidateSnapshot, ...rest } = candidate;
  return rest;
}

function getCandidateIdentity(candidate = {}) {
  return {
    id: String(candidate.id || "").trim(),
    candidateId: String(candidate.candidateId || "").trim(),
    snapshotCandidateId: String(
      candidate.candidateSnapshot?.candidateId || "",
    ).trim(),
    candidateApplicationId: String(
      candidate.candidateApplicationId || candidate.applicationId || "",
    ).trim(),
    email: String(candidate.email || candidate.candidateEmail || "")
      .trim()
      .toLowerCase(),
    snapshotEmail: String(candidate.candidateSnapshot?.email || "")
      .trim()
      .toLowerCase(),
    name: String(candidate.name || candidate.candidateName || "")
      .trim()
      .toLowerCase(),
    snapshotName: String(candidate.candidateSnapshot?.name || "")
      .trim()
      .toLowerCase(),
  };
}

function isSamePipelineCandidate(candidateA = {}, candidateB = {}) {
  const left = getCandidateIdentity(candidateA);
  const right = getCandidateIdentity(candidateB);

  return Boolean(
    (left.candidateId &&
      right.candidateId &&
      !isTemporaryPipelineId(left.candidateId) &&
      !isTemporaryPipelineId(right.candidateId) &&
      left.candidateId === right.candidateId) ||
    (left.candidateId &&
      right.snapshotCandidateId &&
      !isTemporaryPipelineId(left.candidateId) &&
      left.candidateId === right.snapshotCandidateId) ||
    (left.snapshotCandidateId &&
      right.candidateId &&
      !isTemporaryPipelineId(right.candidateId) &&
      left.snapshotCandidateId === right.candidateId) ||
    (left.candidateApplicationId &&
      right.candidateApplicationId &&
      left.candidateApplicationId === right.candidateApplicationId) ||
    (left.email && right.email && left.email === right.email) ||
    (left.email && right.snapshotEmail && left.email === right.snapshotEmail) ||
    (left.snapshotEmail && right.email && left.snapshotEmail === right.email) ||
    (left.name && right.name && left.name === right.name) ||
    (left.name && right.snapshotName && left.name === right.snapshotName) ||
    (left.snapshotName && right.name && left.snapshotName === right.name),
  );
}

function findMatchingCandidate(list = [], target = {}) {
  return list.find((candidate) => isSamePipelineCandidate(candidate, target));
}

function mergeProfileSafe(existingCandidate = {}, incomingCandidate = {}) {
  const existingClean = stripNestedCandidateSnapshot(existingCandidate);
  const incomingClean = stripNestedCandidateSnapshot(incomingCandidate);

  const existingSnapshot = existingCandidate.candidateSnapshot || {};
  const incomingSnapshot = incomingCandidate.candidateSnapshot || {};

  const mergedCandidate = {
    ...existingClean,
    ...incomingClean,
  };

  const alwaysUseIncomingFields = new Set([
    "status",
    "pipelineStatus",
    "applicationStatus",
    "currentStage",
    "currentPipelineStage",
    "pipelineStage",
    "stage",
    "previousStage",
    "currentApplicationStatus",
    "currentApplicationId",
    "candidateApplicationId",
    "applicationId",
    "currentAppliedRole",
    "currentAppliedAccount",
    "currentTaOwner",
    "movedToPipeline",
    "lastActivity",
    "updatedAt",
    "dateMoved",
    "reasonForMovement",
    "prfStatus",
    "prfReviewed",
    "prfReviewedAt",
    "assessmentStatus",
    "assessmentResult",
    "assessmentEmailSent",
    "assessmentEmailSentAt",
    "assessmentTakenAt",
    "assessmentTaggedAt",
    "assessmentRemarks",
    "assessmentFileName",
    "assessmentFileUrl",
    "assessmentFileType",
    "assessmentFileSize",
    "assessmentAttachmentName",
    "assessmentAttachmentUrl",
    "assessmentAttachmentType",
    "assessmentAttachmentSize",
    "interviewStatus",
    "interviewDate",
    "interviewType",
    "onlineInterviewLink",
    "offerDetails",
    "offerApprovals",
    "offerApprovalStatus",
    "offerDecision",
    "offerEmailSent",
    "offerEmailSentAt",
    "candidateResponse",
    "dropOffCategory",
    "dropOffReason",
    "dropOffRemarks",
    "timeline",
  ]);

  Object.keys(mergedCandidate).forEach((key) => {
    if (alwaysUseIncomingFields.has(key)) return;

    const existingValue = existingClean[key];
    const incomingValue = incomingClean[key];

    if (
      isBlankProfileValue(incomingValue) &&
      !isBlankProfileValue(existingValue)
    ) {
      mergedCandidate[key] = existingValue;
    }
  });

  const preservedLeadAccount =
    incomingClean.leadAccount ||
    incomingClean.initialAccount ||
    incomingClean.accountFit ||
    incomingSnapshot.leadAccount ||
    incomingSnapshot.initialAccount ||
    incomingSnapshot.accountFit ||
    existingClean.leadAccount ||
    existingClean.initialAccount ||
    existingClean.accountFit ||
    existingSnapshot.leadAccount ||
    existingSnapshot.initialAccount ||
    existingSnapshot.accountFit ||
    "";

  mergedCandidate.leadAccount =
    incomingClean.leadAccount ||
    incomingClean.initialAccount ||
    incomingClean.accountFit ||
    incomingSnapshot.leadAccount ||
    incomingSnapshot.initialAccount ||
    incomingSnapshot.accountFit ||
    existingClean.leadAccount ||
    existingClean.initialAccount ||
    existingClean.accountFit ||
    existingSnapshot.leadAccount ||
    existingSnapshot.initialAccount ||
    existingSnapshot.accountFit ||
    preservedLeadAccount ||
    "";

  mergedCandidate.initialAccount =
    incomingClean.initialAccount ||
    incomingClean.leadAccount ||
    incomingClean.accountFit ||
    incomingSnapshot.initialAccount ||
    incomingSnapshot.leadAccount ||
    incomingSnapshot.accountFit ||
    existingClean.initialAccount ||
    existingClean.leadAccount ||
    existingClean.accountFit ||
    existingSnapshot.initialAccount ||
    existingSnapshot.leadAccount ||
    existingSnapshot.accountFit ||
    preservedLeadAccount ||
    "";

  mergedCandidate.accountFit =
    incomingClean.accountFit ||
    incomingClean.leadAccount ||
    incomingClean.initialAccount ||
    incomingSnapshot.accountFit ||
    incomingSnapshot.leadAccount ||
    incomingSnapshot.initialAccount ||
    existingClean.accountFit ||
    existingClean.leadAccount ||
    existingClean.initialAccount ||
    existingSnapshot.accountFit ||
    existingSnapshot.leadAccount ||
    existingSnapshot.initialAccount ||
    preservedLeadAccount ||
    "";

  mergedCandidate.candidateId =
    existingClean.candidateId &&
    !isTemporaryPipelineId(existingClean.candidateId)
      ? existingClean.candidateId
      : incomingClean.candidateId &&
          !isTemporaryPipelineId(incomingClean.candidateId)
        ? incomingClean.candidateId
        : existingCandidate.candidateSnapshot?.candidateId ||
          incomingCandidate.candidateSnapshot?.candidateId ||
          existingClean.candidateId ||
          incomingClean.candidateId;

  mergedCandidate.timeline = dedupePipelineTimeline([
    ...(Array.isArray(existingClean.timeline) ? existingClean.timeline : []),
    ...(Array.isArray(incomingClean.timeline) ? incomingClean.timeline : []),
  ]);

  mergedCandidate.applicationHistory = dedupePipelineTimeline([
    ...(Array.isArray(existingClean.applicationHistory)
      ? existingClean.applicationHistory
      : []),
    ...(Array.isArray(incomingClean.applicationHistory)
      ? incomingClean.applicationHistory
      : []),
  ]);

  mergedCandidate.workExperiences =
    Array.isArray(incomingClean.workExperiences) &&
    incomingClean.workExperiences.length > 0
      ? incomingClean.workExperiences
      : existingClean.workExperiences;

  mergedCandidate.references =
    Array.isArray(incomingClean.references) &&
    incomingClean.references.length > 0
      ? incomingClean.references
      : existingClean.references;

  mergedCandidate.hearAboutUs =
    Array.isArray(incomingClean.hearAboutUs) &&
    incomingClean.hearAboutUs.length > 0
      ? incomingClean.hearAboutUs
      : existingClean.hearAboutUs;

  mergedCandidate.affiliations =
    Array.isArray(incomingClean.affiliations) &&
    incomingClean.affiliations.length > 0
      ? incomingClean.affiliations
      : existingClean.affiliations;

  return mergedCandidate;
}

function mergeCandidateSnapshotSafe(...candidates) {
  return candidates.reduce((mergedSnapshot, candidate) => {
    const cleanCandidate = stripNestedCandidateSnapshot(candidate || {});

    const nextSnapshot = {
      ...mergedSnapshot,
      ...cleanCandidate,
    };

    Object.keys(nextSnapshot).forEach((key) => {
      const existingValue = mergedSnapshot[key];
      const incomingValue = cleanCandidate[key];

      if (
        isBlankProfileValue(incomingValue) &&
        !isBlankProfileValue(existingValue)
      ) {
        nextSnapshot[key] = existingValue;
      }
    });

    return nextSnapshot;
  }, {});
}

function normalizeHistoryDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).trim();
  }

  return date.toISOString().slice(0, 16);
}

function dedupePipelineTimeline(timeline = []) {
  const map = new Map();

  timeline.filter(Boolean).forEach((item) => {
    const key = [
      item.stage || "",
      item.source || "",
      item.reason || "",
      item.description || "",
      item.remarks || "",
      item.savedFormLink || "",
      normalizeHistoryDate(
        item.date || item.createdAt || item.updatedAt || item.timestamp,
      ),
    ]
      .join("|")
      .toLowerCase()
      .trim();

    if (!key) return;

    if (!map.has(key)) {
      map.set(key, item);
    }
  });

  return Array.from(map.values());
}

function buildUpdatedPipelineList(list = [], updatedCandidate = {}) {
  const normalizedCandidate =
    normalizePipelineCandidateForBoard(updatedCandidate);

  const normalizedList = Array.isArray(list)
    ? list.map(normalizePipelineCandidateForBoard)
    : [];

  const existingIndex = normalizedList.findIndex((candidate) =>
    isSamePipelineCandidate(candidate, normalizedCandidate),
  );

  if (existingIndex === -1) {
    return [normalizedCandidate, ...normalizedList];
  }

  return normalizedList.map((candidate, index) => {
    if (index !== existingIndex) return candidate;

    return normalizePipelineCandidateForBoard(
      mergeProfileSafe(candidate, normalizedCandidate),
    );
  });
}

export function CandidatePipelineProvider({ children }) {
  const { user } = useUser();
  const { confirmAction, ConfirmationDialog } = useConfirmDialog();

  const currentUserName =
    user?.name ||
    user?.fullName ||
    user?.employeeName ||
    user?.displayName ||
    user?.username ||
    "Current User";

  const [candidateList, setCandidateList] = useState(defaultPipelineCandidates);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [accountFilter, setAccountFilter] = useState("All Accounts");
  const [activeStage, setActiveStage] = useState("Initial Screening");
  const [pageView, setPageView] = useState("pipeline");

  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [moveCandidate, setMoveCandidate] = useState(null);
  const [moveForm, setMoveForm] = useState({
    reason: "",
    remarks: "",
  });

  const [scheduleCandidate, setScheduleCandidate] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    interviewDate: "",
    interviewType: "",
    onlineInterviewLink: "",
    remarks: "",
  });

  const [assessmentCandidate, setAssessmentCandidate] = useState(null);
  const [assessmentForm, setAssessmentForm] = useState({
    assessmentStatus: "Not Take",
    assessmentResult: "",
    assessmentRemarks: "",
    assessmentFileName: "",
    assessmentFileUrl: "",
    assessmentFileType: "",
    assessmentFileSize: "",
  });

  const [dropOffCandidate, setDropOffCandidate] = useState(null);
  const [dropOffForm, setDropOffForm] = useState({
    category: "",
    reason: "",
    remarks: "",
  });

  const [offerCandidate, setOfferCandidate] = useState(null);
  const [offerForm, setOfferForm] = useState({
    hiringRequirementId: "",
    roleTitle: "",
    account: "",
    basicPay: "",
    deminimisDailyRate: "",
    remarks: "",
  });

  const hideInterviewColumns =
    activeStage === "Initial Screening" || activeStage === "Online Assessment";

  const showAssessmentStatusColumn = false;
  const showAssessmentResultColumn = activeStage === "Online Assessment";

  useEffect(() => {
    const storedCandidates = loadPipelineCandidateData();

    const baseCandidates =
      storedCandidates.length > 0
        ? storedCandidates
        : defaultPipelineCandidates;

    const normalizedCandidates = baseCandidates.map(
      normalizePipelineCandidateForBoard,
    );

    setCandidateList(normalizedCandidates);
    savePipelineCandidateData(normalizedCandidates);
    setHasLoadedStorage(true);
  }, []);

  useEffect(() => {
    function syncPipelineCandidatesFromStorage() {
      const storedCandidates = loadPipelineCandidateData();

      const baseCandidates =
        storedCandidates.length > 0
          ? storedCandidates
          : defaultPipelineCandidates;

      const normalizedCandidates = baseCandidates.map(
        normalizePipelineCandidateForBoard,
      );

      setCandidateList(normalizedCandidates);
    }

    window.addEventListener(
      "ta-pipeline-candidates-updated",
      syncPipelineCandidatesFromStorage,
    );
    window.addEventListener("focus", syncPipelineCandidatesFromStorage);
    window.addEventListener("storage", syncPipelineCandidatesFromStorage);

    return () => {
      window.removeEventListener(
        "ta-pipeline-candidates-updated",
        syncPipelineCandidatesFromStorage,
      );
      window.removeEventListener("focus", syncPipelineCandidatesFromStorage);
      window.removeEventListener("storage", syncPipelineCandidatesFromStorage);
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    savePipelineCandidateData(candidateList);
  }, [candidateList, hasLoadedStorage]);

  useEffect(() => {
    if (!hasLoadedStorage) return;

    const syncEvents = safeReadArray(PIPELINE_SYNC_EVENTS_KEY);
    if (!syncEvents.length) return;

    let changed = false;

    const nextCandidates = candidateList.map((candidate) => {
      const currentStage = getCandidateStage(candidate);

      const event = syncEvents.find(
        (item) =>
          String(item.candidateApplicationId || "") ===
            String(candidate.candidateApplicationId || candidate.id || "") ||
          String(item.candidateId || "") ===
            String(candidate.candidateId || "") ||
          String(item.candidateEmail || "").toLowerCase() ===
            String(
              candidate.email || candidate.candidateEmail || "",
            ).toLowerCase(),
      );

      if (!event) return candidate;

      changed = true;

      if (event.type === "offer_approval_update" || event.offerApprovals) {
        const approvalStatus =
          event.offerApprovalStatus ||
          getOfferApprovalSummary({
            ...candidate,
            offerApprovals: event.offerApprovals || candidate.offerApprovals,
          });

        const nextStage =
          event.currentStage ||
          event.stage ||
          event.pipelineStage ||
          (approvalStatus === "Approved" ? "Accepted" : currentStage);

        const nextCandidateResponse =
          event.candidateResponse ||
          event.offerDecision ||
          (approvalStatus === "Approved"
            ? "Accepted"
            : candidate.candidateResponse);

        return normalizePipelineCandidateForBoard({
          ...candidate,

          previousStage:
            nextStage !== currentStage ? currentStage : candidate.previousStage,

          currentStage: nextStage,
          currentPipelineStage: nextStage,
          stage: nextStage,
          pipelineStage: nextStage,

          offerApprovals: event.offerApprovals || candidate.offerApprovals,
          offerApprovalStatus: approvalStatus,
          offerDecision: nextCandidateResponse,
          candidateResponse: nextCandidateResponse,

          dateMoved:
            nextStage !== currentStage
              ? event.dateMoved || getCurrentDate()
              : candidate.dateMoved,

          updatedAt: getCurrentDate(),

          reasonForMovement:
            event.reasonForMovement ||
            `Offer approval status updated to ${approvalStatus}.`,

          timeline: [
            ...(candidate.timeline || []),
            {
              stage: nextStage,
              owner: event.owner || currentUserName,
              source: "Offers Page",
              timestamp: event.timestamp || getCurrentTimestamp(),
              reason:
                event.reasonForMovement ||
                `Offer approval status updated to ${approvalStatus}.`,
              remarks:
                event.remarks || "Approval update synced from Offers page.",
            },
          ],
        });
      }

      if (event.type === "offer_contract_sent") {
        return normalizePipelineCandidateForBoard({
          ...candidate,
          offerEmailSent: true,
          offerEmailSentAt: event.timestamp || getCurrentTimestamp(),
          reasonForMovement:
            event.reasonForMovement ||
            "Offer contract email was sent to the candidate.",
          timeline: [
            ...(candidate.timeline || []),
            {
              stage: currentStage || "Offered",
              owner: event.owner || currentUserName,
              source: "Offer Contract",
              timestamp: event.timestamp || getCurrentTimestamp(),
              reason:
                event.reasonForMovement ||
                "Offer contract email was sent to the candidate.",
              remarks:
                event.remarks || "Contract sent from Candidate Pipeline.",
            },
          ],
        });
      }

      if (event.status === "Negotiate" || event.status === "Negotiation") {
        return normalizePipelineCandidateForBoard({
          ...candidate,
          offerDecision: "Negotiate",
          offerDecisionAt: event.timestamp || getCurrentTimestamp(),
          reasonForMovement:
            event.reasonForMovement || "Candidate requested offer negotiation.",
          timeline: [
            ...(candidate.timeline || []),
            {
              stage: currentStage || "Offered",
              owner: event.owner || currentUserName,
              source: "Offer Contract",
              timestamp: event.timestamp || getCurrentTimestamp(),
              reason:
                event.reasonForMovement ||
                "Candidate requested offer negotiation.",
              remarks:
                event.remarks || "Negotiation request synced from offer link.",
            },
          ],
        });
      }

      if (event.status === "Accepted" || event.toStage === "Accepted") {
        return normalizePipelineCandidateForBoard({
          ...candidate,
          previousStage: currentStage,
          currentStage: "Accepted",
          currentPipelineStage: "Accepted",
          stage: "Accepted",
          pipelineStage: "Accepted",
          offerApprovalStatus: "Approved",
          offerEmailSent: true,
          offerDecision: "Accepted",
          candidateResponse: "Accepted",
          offerDecisionAt: event.timestamp,
          dateMoved: event.dateMoved || getCurrentDate(),
          reasonForMovement:
            event.reasonForMovement || "Candidate accepted the offer.",
          timeline: [
            ...(candidate.timeline || []),
            {
              stage: "Accepted",
              owner: event.owner || currentUserName,
              source: "Offers Page",
              timestamp: event.timestamp || getCurrentTimestamp(),
              reason:
                event.reasonForMovement || "Candidate accepted the offer.",
              remarks:
                event.remarks || "Accepted from candidate contract response.",
            },
          ],
        });
      }

      if (
        event.status === "Declined" ||
        event.toStage === "Drop-off" ||
        event.toStage === "Drop-offs"
      ) {
        return normalizePipelineCandidateForBoard({
          ...candidate,
          previousStage: currentStage,
          currentStage: "Drop-off",
          currentPipelineStage: "Drop-off",
          stage: "Drop-off",
          pipelineStage: "Drop-off",
          offerDecision: "Rejected",
          candidateResponse: "Rejected",
          offerDecisionAt: event.timestamp,
          dropOffCategory: event.dropOffCategory || "Offer Declined",
          dropOffReason:
            event.dropOffReason ||
            event.reasonForMovement ||
            "Candidate declined the offer.",
          dropOffRemarks:
            event.remarks || "Declined from candidate contract response.",
          dateMoved: event.dateMoved || getCurrentDate(),
          reasonForMovement:
            event.reasonForMovement || "Candidate declined the offer.",
          timeline: [
            ...(candidate.timeline || []),
            {
              stage: "Drop-off",
              owner: event.owner || currentUserName,
              source: "Offers Page",
              timestamp: event.timestamp || getCurrentTimestamp(),
              reason:
                event.reasonForMovement || "Candidate declined the offer.",
              remarks:
                event.dropOffReason ||
                event.remarks ||
                "Candidate declined the contract.",
            },
          ],
        });
      }

      return candidate;
    });

    if (changed) {
      setCandidateList(nextCandidates);
      savePipelineCandidateData(nextCandidates);
      safeWriteArray(PIPELINE_SYNC_EVENTS_KEY, []);
    }
  }, [candidateList, currentUserName, hasLoadedStorage]);

  function getCandidateIdentity(candidate = {}) {
    return {
      id: String(candidate.id || "").trim(),
      candidateId: String(candidate.candidateId || "").trim(),
      candidateApplicationId: String(
        candidate.candidateApplicationId || candidate.applicationId || "",
      ).trim(),
      email: String(candidate.email || candidate.candidateEmail || "")
        .trim()
        .toLowerCase(),
      name: String(candidate.name || candidate.candidateName || "")
        .trim()
        .toLowerCase(),
    };
  }

  function isSamePipelineCandidate(a = {}, b = {}) {
    const left = getCandidateIdentity(a);
    const right = getCandidateIdentity(b);

    return Boolean(
      (left.id && right.id && left.id === right.id) ||
      (left.candidateId &&
        right.candidateId &&
        left.candidateId === right.candidateId) ||
      (left.candidateApplicationId &&
        right.candidateApplicationId &&
        left.candidateApplicationId === right.candidateApplicationId) ||
      (left.email && right.email && left.email === right.email) ||
      (left.name && right.name && left.name === right.name),
    );
  }

  function syncSelectedCandidate(updatedCandidate) {
    setSelectedCandidate((prev) =>
      prev && isSamePipelineCandidate(prev, updatedCandidate)
        ? updatedCandidate
        : prev,
    );

    setMoveCandidate((prev) =>
      prev && isSamePipelineCandidate(prev, updatedCandidate)
        ? updatedCandidate
        : prev,
    );

    setScheduleCandidate((prev) =>
      prev && isSamePipelineCandidate(prev, updatedCandidate)
        ? updatedCandidate
        : prev,
    );

    setAssessmentCandidate((prev) =>
      prev && isSamePipelineCandidate(prev, updatedCandidate)
        ? updatedCandidate
        : prev,
    );

    setOfferCandidate((prev) =>
      prev && isSamePipelineCandidate(prev, updatedCandidate)
        ? updatedCandidate
        : prev,
    );

    setDropOffCandidate((prev) =>
      prev && isSamePipelineCandidate(prev, updatedCandidate)
        ? updatedCandidate
        : prev,
    );
  }

  function buildUpdatedPipelineList(list = [], updatedCandidate = {}) {
    const normalizedCandidate =
      normalizePipelineCandidateForBoard(updatedCandidate);

    const normalizedList = Array.isArray(list)
      ? list.map(normalizePipelineCandidateForBoard)
      : [];

    const existingIndex = normalizedList.findIndex((candidate) =>
      isSamePipelineCandidate(candidate, normalizedCandidate),
    );

    if (existingIndex === -1) {
      return [normalizedCandidate, ...normalizedList];
    }

    return normalizedList.map((candidate, index) => {
      if (index !== existingIndex) return candidate;

      return normalizePipelineCandidateForBoard({
        ...candidate,
        ...normalizedCandidate,
        id: candidate.id || normalizedCandidate.id,
        candidateApplicationId:
          candidate.candidateApplicationId ||
          normalizedCandidate.candidateApplicationId,
        applicationId:
          candidate.applicationId || normalizedCandidate.applicationId,
        timeline: Array.isArray(normalizedCandidate.timeline)
          ? normalizedCandidate.timeline
          : candidate.timeline || [],
      });
    });
  }

  function commitCandidateUpdate(updatedCandidate) {
    const storedPipelineCandidates = loadPipelineCandidateData();

    const storedInternalCandidates = readArrayStorage(
      INTERNAL_CANDIDATES_KEY,
      [],
    );

    const storedPublicSubmissions = readArrayStorage(
      PUBLIC_SUBMISSIONS_KEY,
      [],
    );

    const existingPipelineCandidate =
      findMatchingCandidate(storedPipelineCandidates, updatedCandidate) ||
      findMatchingCandidate(candidateList, updatedCandidate) ||
      {};

    const masterTalentCandidate =
      findMatchingCandidate(storedInternalCandidates, updatedCandidate) ||
      findMatchingCandidate(storedPublicSubmissions, updatedCandidate) ||
      findMatchingCandidate(
        storedInternalCandidates,
        existingPipelineCandidate.candidateSnapshot || {},
      ) ||
      findMatchingCandidate(
        storedPublicSubmissions,
        existingPipelineCandidate.candidateSnapshot || {},
      ) ||
      {};

    const mergedCandidate = mergeProfileSafe(
      mergeProfileSafe(masterTalentCandidate, existingPipelineCandidate),
      updatedCandidate,
    );

    const currentStage = getCandidateStage(mergedCandidate);

    const preservedLeadAccount =
      updatedCandidate.leadAccount ||
      updatedCandidate.initialAccount ||
      updatedCandidate.accountFit ||
      updatedCandidate.candidateSnapshot?.leadAccount ||
      updatedCandidate.candidateSnapshot?.initialAccount ||
      updatedCandidate.candidateSnapshot?.accountFit ||
      existingPipelineCandidate.leadAccount ||
      existingPipelineCandidate.initialAccount ||
      existingPipelineCandidate.accountFit ||
      existingPipelineCandidate.candidateSnapshot?.leadAccount ||
      existingPipelineCandidate.candidateSnapshot?.initialAccount ||
      existingPipelineCandidate.candidateSnapshot?.accountFit ||
      masterTalentCandidate.leadAccount ||
      masterTalentCandidate.initialAccount ||
      masterTalentCandidate.accountFit ||
      masterTalentCandidate.candidateSnapshot?.leadAccount ||
      masterTalentCandidate.candidateSnapshot?.initialAccount ||
      masterTalentCandidate.candidateSnapshot?.accountFit ||
      "";

    const normalizedCandidate = normalizePipelineCandidateForBoard({
      ...mergedCandidate,

      leadAccount: preservedLeadAccount,
      initialAccount: preservedLeadAccount,
      accountFit: preservedLeadAccount || mergedCandidate.accountFit || "",

      currentStage,
      currentPipelineStage: currentStage,
      pipelineStage: currentStage,
      stage: currentStage,
    });

    normalizedCandidate.leadAccount =
      normalizedCandidate.leadAccount ||
      normalizedCandidate.initialAccount ||
      normalizedCandidate.accountFit ||
      preservedLeadAccount ||
      "";

    normalizedCandidate.initialAccount =
      normalizedCandidate.initialAccount ||
      normalizedCandidate.leadAccount ||
      normalizedCandidate.accountFit ||
      preservedLeadAccount ||
      "";

    normalizedCandidate.accountFit =
      normalizedCandidate.accountFit ||
      normalizedCandidate.leadAccount ||
      normalizedCandidate.initialAccount ||
      preservedLeadAccount ||
      "";

    normalizedCandidate.candidateSnapshot = mergeCandidateSnapshotSafe(
      masterTalentCandidate,
      existingPipelineCandidate.candidateSnapshot || {},
      existingPipelineCandidate,
      updatedCandidate.candidateSnapshot || {},
      updatedCandidate,
      normalizedCandidate,
      {
        candidateId:
          normalizedCandidate.candidateId ||
          masterTalentCandidate.candidateId ||
          existingPipelineCandidate.candidateId,

        name:
          normalizedCandidate.name ||
          masterTalentCandidate.name ||
          existingPipelineCandidate.name,

        email:
          normalizedCandidate.email ||
          masterTalentCandidate.email ||
          existingPipelineCandidate.email,

        leadAccount:
          normalizedCandidate.leadAccount ||
          normalizedCandidate.initialAccount ||
          normalizedCandidate.accountFit ||
          preservedLeadAccount ||
          "",

        initialAccount:
          normalizedCandidate.initialAccount ||
          normalizedCandidate.leadAccount ||
          normalizedCandidate.accountFit ||
          preservedLeadAccount ||
          "",

        accountFit:
          normalizedCandidate.accountFit ||
          normalizedCandidate.leadAccount ||
          normalizedCandidate.initialAccount ||
          preservedLeadAccount ||
          "",

        currentStage,
        currentPipelineStage: currentStage,
        pipelineStage: currentStage,
        stage: currentStage,
        pipelineStatus: normalizedCandidate.pipelineStatus || "Active",
        applicationStatus: normalizedCandidate.applicationStatus || "Active",
        movedToPipeline: true,
      },
    );

    normalizedCandidate.timeline = dedupePipelineTimeline(
      normalizedCandidate.timeline || [],
    );

    normalizedCandidate.applicationHistory = dedupePipelineTimeline(
      normalizedCandidate.applicationHistory || [],
    );

    const sourceList =
      storedPipelineCandidates.length > 0
        ? storedPipelineCandidates
        : candidateList;

    const nextCandidates = buildUpdatedPipelineList(
      sourceList,
      normalizedCandidate,
    );

    savePipelineCandidateData(nextCandidates);
    setCandidateList(nextCandidates);

    setSelectedCandidate((prev) =>
      prev && isSamePipelineCandidate(prev, normalizedCandidate)
        ? normalizedCandidate
        : prev,
    );

    setMoveCandidate((prev) =>
      prev && isSamePipelineCandidate(prev, normalizedCandidate)
        ? normalizedCandidate
        : prev,
    );

    setScheduleCandidate((prev) =>
      prev && isSamePipelineCandidate(prev, normalizedCandidate)
        ? normalizedCandidate
        : prev,
    );

    setAssessmentCandidate((prev) =>
      prev && isSamePipelineCandidate(prev, normalizedCandidate)
        ? normalizedCandidate
        : prev,
    );

    setOfferCandidate((prev) =>
      prev && isSamePipelineCandidate(prev, normalizedCandidate)
        ? normalizedCandidate
        : prev,
    );

    setDropOffCandidate((prev) =>
      prev && isSamePipelineCandidate(prev, normalizedCandidate)
        ? normalizedCandidate
        : prev,
    );

    syncTalentPoolFromPipelineApplication(normalizedCandidate);

    window.dispatchEvent(new Event("ta-pipeline-candidates-updated"));
    window.dispatchEvent(new Event("ta-public-submissions-updated"));

    return normalizedCandidate;
  }

  function updateCandidateRecord(updatedCandidate) {
    return commitCandidateUpdate(updatedCandidate);
  }

  function closeAllPipelineModals() {
    setSelectedCandidate(null);

    setMoveCandidate(null);
    setMoveForm({
      reason: "",
      remarks: "",
    });

    setScheduleCandidate(null);
    setScheduleForm({
      interviewDate: "",
      interviewType: "",
      onlineInterviewLink: "",
      remarks: "",
    });

    setAssessmentCandidate(null);
    setAssessmentForm({
      assessmentStatus: "Not Take",
      assessmentResult: "",
      assessmentRemarks: "",
    });

    setDropOffCandidate(null);
    setDropOffForm({
      category: "",
      reason: "",
      remarks: "",
    });

    setOfferCandidate(null);
    setOfferForm({
      hiringRequirementId: "",
      roleTitle: "",
      account: "",
      basicPay: "",
      deminimisDailyRate: "",
      remarks: "",
    });
  }

  async function handleUpdatePrfStatus(candidate, nextPrfStatus) {
    if (
      !(await confirmAction(
        `Set PRF status of ${candidate.name} to ${nextPrfStatus}?`,
      ))
    ) {
      return;
    }

    const currentStage = getCandidateStage(candidate);

    const movementReason =
      nextPrfStatus === "Matched"
        ? "PRF status changed to Matched. Candidate is ready to move to Online Assessment."
        : `PRF status set to ${nextPrfStatus}.`;

    const updatedCandidate = normalizePipelineCandidateForBoard({
      ...candidate,

      prfStatus: nextPrfStatus,
      prfReviewed: true,
      prfReviewedAt: getCurrentTimestamp(),

      previousStage: currentStage,
      currentStage: "Initial Screening",
      currentPipelineStage: "Initial Screening",
      stage: "Initial Screening",
      pipelineStage: "Initial Screening",

      interviewDate: null,
      interviewType: "-",
      interviewStatus: "For Assessment",

      dateMoved: getCurrentDate(),
      updatedAt: getCurrentDate(),
      reasonForMovement: movementReason,

      timeline: [
        ...(Array.isArray(candidate.timeline) ? candidate.timeline : []),
        {
          stage: "Initial Screening",
          owner: currentUserName,
          source: "PRF Review",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks: `PRF Status: ${nextPrfStatus}`,
        },
      ],
    });

    const committedCandidate = commitCandidateUpdate(updatedCandidate);

    setSelectedCandidate(committedCandidate);
    setActiveStage("Initial Screening");
  }

  async function handleOpenScheduleInterview(candidate) {
    const currentStage = getCandidateStage(candidate);
    const normalizedCandidate = normalizePipelineCandidateForBoard({
      ...candidate,
      currentStage,
      currentPipelineStage: currentStage,
      stage: currentStage,
      pipelineStage: currentStage,
    });

    const isUpdatingSchedule = currentStage === "Interview Scheduled";

    if (!isUpdatingSchedule && !canScheduleInterview(normalizedCandidate)) {
      alert(
        "Candidate must be Assessment Taken and Assessment Fit before interview scheduling.",
      );
      return;
    }

    if (
      isUpdatingSchedule &&
      !canUpdateInterviewSchedule(normalizedCandidate)
    ) {
      alert("This interview schedule cannot be updated.");
      return;
    }

    setScheduleCandidate(normalizedCandidate);
    setScheduleForm({
      interviewDate: isUpdatingSchedule
        ? toDateInputValue(normalizedCandidate.interviewDate)
        : "",
      interviewType:
        isUpdatingSchedule && normalizedCandidate.interviewType !== "-"
          ? normalizedCandidate.interviewType
          : "",
      onlineInterviewLink:
        isUpdatingSchedule && normalizedCandidate.interviewType === "Online"
          ? normalizedCandidate.onlineInterviewLink || ""
          : "",
      remarks: "",
    });
  }

  async function handleCloseScheduleInterview() {
    setScheduleCandidate(null);
    setScheduleForm({
      interviewDate: "",
      interviewType: "",
      onlineInterviewLink: "",
      remarks: "",
    });
  }

  async function handleSubmitScheduleInterview(e) {
    e.preventDefault();

    if (!scheduleCandidate) return;

    const currentStage = getCandidateStage(scheduleCandidate);
    const isUpdatingSchedule = currentStage === "Interview Scheduled";

    if (!isUpdatingSchedule && !canScheduleInterview(scheduleCandidate)) {
      alert(
        "Only candidates tagged as Assessment Fit can be scheduled for interview.",
      );
      return;
    }

    if (isUpdatingSchedule && !canUpdateInterviewSchedule(scheduleCandidate)) {
      alert("This interview schedule cannot be updated.");
      return;
    }

    if (!scheduleForm.interviewDate || !scheduleForm.interviewType) {
      alert("Interview date and interview type are required.");
      return;
    }

    if (
      scheduleForm.interviewType === "Online" &&
      !String(scheduleForm.onlineInterviewLink || "").trim()
    ) {
      alert("Online interview link is required for online interviews.");
      return;
    }

    if (
      !(await confirmAction(
        `${isUpdatingSchedule ? "Update" : "Save"} interview schedule for ${
          scheduleCandidate.name
        }?`,
      ))
    ) {
      return;
    }

    if (isUpdatingSchedule) {
      const previousSchedule = formatDateTime(scheduleCandidate.interviewDate);
      const previousType = scheduleCandidate.interviewType || "—";

      const movementReason = `Interview schedule updated from ${previousSchedule} (${previousType}) to ${formatDateTime(
        scheduleForm.interviewDate,
      )} (${scheduleForm.interviewType}).`;

      const updatedCandidate = normalizePipelineCandidateForBoard({
        ...scheduleCandidate,
        currentStage,
        currentPipelineStage: currentStage,
        stage: currentStage,
        pipelineStage: currentStage,
        interviewDate: scheduleForm.interviewDate,
        interviewType: scheduleForm.interviewType,
        onlineInterviewLink:
          scheduleForm.interviewType === "Online"
            ? scheduleForm.onlineInterviewLink
            : "",
        interviewStatus:
          scheduleCandidate.interviewStatus === "Completed"
            ? "Completed"
            : "Rescheduled",
        updatedAt: getCurrentDate(),
        reasonForMovement: movementReason,
        timeline: [
          ...(scheduleCandidate.timeline || []),
          {
            stage: "Interview Scheduled",
            owner: currentUserName,
            source: "Interview Scheduling",
            timestamp: getCurrentTimestamp(),
            reason: movementReason,
            remarks: scheduleForm.remarks.trim(),
          },
        ],
      });

      updateCandidateRecord(updatedCandidate);
      setSelectedCandidate(updatedCandidate);
      setActiveStage("Interview Scheduled");
      closeAllPipelineModals();
      return;
    }

    const movementReason =
      "Candidate passed online assessment. Interview schedule has been set and candidate moved to Interview Scheduled.";

    const updatedCandidate = normalizePipelineCandidateForBoard({
      ...scheduleCandidate,
      previousStage: "Online Assessment",
      currentStage: "Interview Scheduled",
      currentPipelineStage: "Interview Scheduled",
      stage: "Interview Scheduled",
      pipelineStage: "Interview Scheduled",
      dateMoved: getCurrentDate(),
      updatedAt: getCurrentDate(),
      interviewDate: scheduleForm.interviewDate,
      interviewType: scheduleForm.interviewType,
      onlineInterviewLink:
        scheduleForm.interviewType === "Online"
          ? scheduleForm.onlineInterviewLink
          : "",
      interviewStatus: "Scheduled",
      reasonForMovement: movementReason,
      timeline: [
        ...(scheduleCandidate.timeline || []),
        {
          stage: "Interview Scheduled",
          owner: currentUserName,
          source: "Interview Scheduling",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks:
            scheduleForm.remarks.trim() ||
            `Schedule: ${formatDateTime(
              scheduleForm.interviewDate,
            )}, Type: ${scheduleForm.interviewType}`,
        },
      ],
    });

    updateCandidateRecord(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
    setActiveStage("Interview Scheduled");
    closeAllPipelineModals();
  }

  async function handleCancelInterview(candidate) {
    const currentStage = getCandidateStage(candidate);

    if (currentStage !== "Interview Scheduled") {
      alert("Only scheduled interviews can be cancelled.");
      return;
    }

    if (!(await confirmAction(`Cancel interview for ${candidate.name}?`))) {
      return;
    }

    const cancellationReason = window.prompt(
      `Enter cancellation reason for ${candidate.name}:`,
      candidate.cancellationReason ||
        "Candidate requested to cancel the interview.",
    );

    if (cancellationReason === null) return;

    const cleanedReason = cancellationReason.trim();

    if (!cleanedReason) {
      alert("Cancellation reason is required.");
      return;
    }

    const movementReason = `Interview was cancelled. Reason: ${cleanedReason}`;

    const updatedCandidate = normalizePipelineCandidateForBoard({
      ...candidate,
      currentStage: "Interview Scheduled",
      currentPipelineStage: "Interview Scheduled",
      stage: "Interview Scheduled",
      pipelineStage: "Interview Scheduled",
      previousStage: candidate.previousStage || "Online Assessment",
      dateMoved: getCurrentDate(),
      updatedAt: getCurrentDate(),
      interviewStatus: "Cancelled",
      cancellationReason: cleanedReason,
      reasonForMovement: movementReason,
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: "Interview Scheduled",
          owner: candidate.owner || currentUserName,
          source: "Interview Cancellation",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks: cleanedReason,
        },
      ],
    });

    updateCandidateRecord(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
    setActiveStage("Interview Scheduled");
  }

  async function handleCompleteInterview(candidate) {
    const currentStage = getCandidateStage(candidate);

    if (!hasInterviewSchedule(candidate)) {
      alert("Create the interview schedule first.");
      return;
    }

    if (
      !(await confirmAction(
        `Mark interview as completed for ${candidate.name}?`,
      ))
    ) {
      return;
    }

    const shouldMoveToInterviewed = currentStage === "Interview Scheduled";

    const movementReason = shouldMoveToInterviewed
      ? "Interview completed. Candidate moved from Interview Scheduled to Interviewed."
      : "Interview marked as completed.";

    const nextStage = shouldMoveToInterviewed ? "Interviewed" : currentStage;

    const updatedCandidate = normalizePipelineCandidateForBoard({
      ...candidate,
      previousStage: shouldMoveToInterviewed
        ? "Interview Scheduled"
        : candidate.previousStage,
      currentStage: nextStage,
      currentPipelineStage: nextStage,
      stage: nextStage,
      pipelineStage: nextStage,
      dateMoved: shouldMoveToInterviewed
        ? getCurrentDate()
        : candidate.dateMoved,
      updatedAt: getCurrentDate(),
      interviewStatus: "Completed",
      reasonForMovement: movementReason,
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: nextStage,
          owner: currentUserName,
          source: "Interview",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
        },
      ],
    });

    updateCandidateRecord(updatedCandidate);
    setSelectedCandidate(updatedCandidate);

    if (shouldMoveToInterviewed) {
      setActiveStage("Interviewed");
    }
  }

  async function handleSaveInterviewNotes(candidate, notes) {
    if (!(await confirmAction(`Save interview notes for ${candidate.name}?`))) {
      return;
    }

    const currentStage = getCandidateStage(candidate);

    const updatedCandidate = normalizePipelineCandidateForBoard({
      ...candidate,
      currentStage,
      currentPipelineStage: currentStage,
      stage: currentStage,
      pipelineStage: currentStage,
      interviewNotes: String(notes || "").trim(),
      interviewNotesUpdatedAt: getCurrentTimestamp(),
      interviewNotesUpdatedBy: currentUserName,
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: currentStage,
          owner: currentUserName,
          source: "Interview Notes",
          timestamp: getCurrentTimestamp(),
          reason: "TA interview notes were updated.",
          remarks: String(notes || "").trim(),
        },
      ],
    });

    updateCandidateRecord(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
  }

  async function handleOpenOfferModal(candidate) {
    const currentStage = getCandidateStage(candidate);

    if (currentStage !== "Interviewed") {
      alert(
        "Offer details can only be prepared after the interview is completed.",
      );
      return;
    }

    const normalizedCandidate = normalizePipelineCandidateForBoard({
      ...candidate,
      currentStage,
      currentPipelineStage: currentStage,
      stage: currentStage,
      pipelineStage: currentStage,
    });

    const offerDetails = normalizedCandidate.offerDetails || {};
    const currentRoleTitle = getRoleTitle(normalizedCandidate.roleAccount);
    const currentAccount = getAccount(normalizedCandidate.roleAccount);

    setOfferCandidate(normalizedCandidate);
    setOfferForm({
      hiringRequirementId:
        offerDetails.hiringRequirementId ||
        normalizedCandidate.hiringRequirementId ||
        "",
      roleTitle:
        offerDetails.roleTitle ||
        (currentRoleTitle === "Not assigned yet" ? "" : currentRoleTitle),
      account:
        offerDetails.account ||
        (currentAccount === "Not assigned yet" ? "" : currentAccount),
      basicPay: offerDetails.basicPay || "",
      deminimisDailyRate: offerDetails.deminimisDailyRate || "",
      remarks: "",
    });
  }

  async function handleCloseOfferModal() {
    setOfferCandidate(null);
    setOfferForm({
      hiringRequirementId: "",
      roleTitle: "",
      account: "",
      basicPay: "",
      deminimisDailyRate: "",
      remarks: "",
    });
  }

  async function handleSubmitOfferDetails(e) {
    e.preventDefault();

    if (!offerCandidate) return;

    const currentStage = getCandidateStage(offerCandidate);

    if (
      !offerForm.hiringRequirementId ||
      !offerForm.roleTitle ||
      !offerForm.account ||
      !offerForm.basicPay ||
      !offerForm.deminimisDailyRate
    ) {
      alert(
        "Hiring requirement, final role, final account, basic pay, and deminimis / daily rate are required.",
      );
      return;
    }

    if (
      !(await confirmAction(
        `Proceed with offer assignment for ${offerCandidate.name}?`,
      ))
    ) {
      return;
    }

    const movementReason =
      "Interview completed. Offer details prepared and sent for approval.";

    const updatedCandidate = normalizePipelineCandidateForBoard({
      ...offerCandidate,
      previousStage: currentStage,
      currentStage: "Offered",
      currentPipelineStage: "Offered",
      stage: "Offered",
      pipelineStage: "Offered",
      dateMoved: getCurrentDate(),
      updatedAt: getCurrentDate(),
      hiringRequirementId: offerForm.hiringRequirementId,
      roleTitle: offerForm.roleTitle,
      account: offerForm.account,
      roleAccount: `${offerForm.roleTitle} - ${offerForm.account}`,
      offerDetails: {
        hiringRequirementId: offerForm.hiringRequirementId,
        roleTitle: offerForm.roleTitle,
        account: offerForm.account,
        basicPay: Number(offerForm.basicPay),
        deminimisDailyRate: Number(offerForm.deminimisDailyRate),
        preparedAt: getCurrentTimestamp(),
        preparedBy: currentUserName,
      },
      offerApprovals: {},
      offerApprovalStatus: "For Review",
      offerEmailSent: false,
      offerEmailSentAt: null,
      offerDecision: "",
      candidateResponse: "Pending",
      offerDecisionAt: null,
      offerDecisionRemarks: "",
      reasonForMovement: movementReason,
      timeline: [
        ...(offerCandidate.timeline || []),
        {
          stage: "Offered",
          owner: currentUserName,
          source: "Offer Approval",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks:
            offerForm.remarks.trim() ||
            `Hiring Requirement: ${offerForm.hiringRequirementId}, Final Role: ${offerForm.roleTitle}, Final Account: ${offerForm.account}, Basic Pay: ${formatCurrency(
              offerForm.basicPay,
            )}, Deminimis / Daily Rate: ${formatCurrency(
              offerForm.deminimisDailyRate,
            )}`,
        },
      ],
    });

    updateCandidateRecord(updatedCandidate);
    upsertOfferEligibleCandidate(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
    setActiveStage("Offered");
    closeAllPipelineModals();
  }

  async function handleOpenMoveModal(candidate) {
    const currentStage = getCandidateStage(candidate);
    const nextStage = getNextStage(currentStage);

    if (!nextStage) return;

    const normalizedCandidate = normalizePipelineCandidateForBoard({
      ...candidate,
      currentStage,
      currentPipelineStage: currentStage,
      stage: currentStage,
      pipelineStage: currentStage,
    });

    if (currentStage === "Initial Screening") {
      if (!canMoveToOnlineAssessment(normalizedCandidate)) {
        alert("Only PRF Matched candidates can move to Online Assessment.");
        return;
      }
    }

    if (currentStage === "Online Assessment") {
      handleOpenScheduleInterview(normalizedCandidate);
      return;
    }

    if (nextStage === "Offered") {
      handleOpenOfferModal(normalizedCandidate);
      return;
    }

    setMoveCandidate(normalizedCandidate);
    setMoveForm({
      reason:
        nextStage === "Online Assessment"
          ? "PRF matched. Candidate moved from Initial Screening to Online Assessment and assessment email will be sent."
          : `Candidate moved from ${currentStage} to ${nextStage}.`,
      remarks: "",
    });
  }

  async function handleCloseMoveModal() {
    setMoveCandidate(null);
    setMoveForm({
      reason: "",
      remarks: "",
    });
  }

  async function handleSubmitMove(e) {
    e.preventDefault();

    if (!moveCandidate) return;

    const currentStage = getCandidateStage(moveCandidate);
    const nextStage = getNextStage(currentStage);

    if (!nextStage) {
      alert("This candidate cannot be moved forward.");
      return;
    }

    if (currentStage === "Initial Screening") {
      if (!canMoveToOnlineAssessment(moveCandidate)) {
        alert("Only PRF Matched candidates can move to Online Assessment.");
        return;
      }
    }

    if (!moveForm.reason.trim()) {
      alert("Movement reason is required.");
      return;
    }

    if (
      !(await confirmAction(
        `Move ${moveCandidate.name} from ${currentStage} to ${nextStage}?`,
      ))
    ) {
      return;
    }

    const movingToOnlineAssessment = nextStage === "Online Assessment";
    const movingToOffered = nextStage === "Offered";
    const movementReason = moveForm.reason.trim();

    const updatedCandidate = normalizePipelineCandidateForBoard({
      ...moveCandidate,

      previousStage: currentStage,
      currentStage: nextStage,
      currentPipelineStage: nextStage,
      stage: nextStage,
      pipelineStage: nextStage,

      dateMoved: getCurrentDate(),
      updatedAt: getCurrentDate(),
      reasonForMovement: movementReason,

      assessmentStatus: movingToOnlineAssessment
        ? "Not Take"
        : moveCandidate.assessmentStatus || "Not Take",

      assessmentResult: movingToOnlineAssessment
        ? ""
        : moveCandidate.assessmentResult || "",

      assessmentEmailSent: movingToOnlineAssessment
        ? true
        : moveCandidate.assessmentEmailSent,

      assessmentEmailSentAt: movingToOnlineAssessment
        ? getCurrentTimestamp()
        : moveCandidate.assessmentEmailSentAt,

      interviewDate: movingToOnlineAssessment
        ? null
        : moveCandidate.interviewDate,
      interviewType: movingToOnlineAssessment
        ? "-"
        : moveCandidate.interviewType,

      interviewStatus: movingToOnlineAssessment
        ? "For Assessment"
        : moveCandidate.interviewStatus,

      timeline: [
        ...(Array.isArray(moveCandidate.timeline)
          ? moveCandidate.timeline
          : []),
        {
          stage: nextStage,
          owner: currentUserName,
          source: movingToOnlineAssessment
            ? "Online Assessment"
            : moveCandidate.source || "Candidate Pipeline",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks: movingToOnlineAssessment
            ? moveForm.remarks.trim() ||
              "Assessment email has been triggered to the candidate."
            : moveForm.remarks.trim(),
        },
      ],
    });

    const committedCandidate = commitCandidateUpdate(updatedCandidate);

    if (movingToOnlineAssessment) {
      setActiveStage("Online Assessment");

      // Do not await this. If fetch/mailto fails, it should not block the board update.
      triggerAssessmentEmail(committedCandidate);
    }

    if (movingToOffered) {
      upsertOfferEligibleCandidate(committedCandidate);
    } else {
      removeOfferEligibleCandidate(committedCandidate);
    }

    closeAllPipelineModals();
  }

  async function handleOpenAssessmentModal(candidate) {
    const currentStage = getCandidateStage(candidate);

    if (currentStage !== "Online Assessment") {
      alert("Assessment update is only available in Online Assessment stage.");
      return;
    }

    const normalizedCandidate = normalizePipelineCandidateForBoard({
      ...candidate,
      currentStage,
      currentPipelineStage: currentStage,
      stage: currentStage,
      pipelineStage: currentStage,
    });

    setAssessmentCandidate(normalizedCandidate);
    setAssessmentForm({
      assessmentStatus: normalizedCandidate.assessmentStatus || "Not Take",
      assessmentResult: normalizedCandidate.assessmentResult || "",
      assessmentRemarks: normalizedCandidate.assessmentRemarks || "",
    });
  }

  async function handleCloseAssessmentModal() {
    setAssessmentCandidate(null);
    setAssessmentForm({
      assessmentStatus: "Not Take",
      assessmentResult: "",
      assessmentRemarks: "",
    });
  }

  async function handleSendAssessmentEmail(candidate) {
    if (!(await confirmAction(`Send assessment email to ${candidate.name}?`))) {
      return;
    }

    const currentStage = getCandidateStage(candidate);

    const updatedCandidate = normalizePipelineCandidateForBoard({
      ...candidate,
      currentStage,
      currentPipelineStage: currentStage,
      stage: currentStage,
      pipelineStage: currentStage,
      assessmentEmailSent: true,
      assessmentEmailSentAt: getCurrentTimestamp(),
      updatedAt: getCurrentDate(),
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: currentStage,
          owner: currentUserName,
          source: "Online Assessment",
          timestamp: getCurrentTimestamp(),
          reason: "Assessment email was sent to the candidate.",
          remarks: buildAssessmentLink(candidate),
        },
      ],
    });

    updateCandidateRecord(updatedCandidate);
    setSelectedCandidate(updatedCandidate);

    await triggerAssessmentEmail(updatedCandidate);
  }

  async function handleSubmitAssessment(e) {
    e.preventDefault();

    if (!assessmentCandidate) return;

    if (!assessmentForm.assessmentStatus) {
      alert("Assessment status is required.");
      return;
    }

    if (
      assessmentForm.assessmentStatus === "Taken" &&
      !assessmentForm.assessmentResult
    ) {
      alert("Assessment result is required when assessment status is Taken.");
      return;
    }

    if (
      !(await confirmAction(
        `Save assessment update for ${assessmentCandidate.name}?`,
      ))
    ) {
      return;
    }

    const isTaken = assessmentForm.assessmentStatus === "Taken";

    const movementReason = isTaken
      ? `Assessment marked as Taken and tagged as ${assessmentForm.assessmentResult}.`
      : "Assessment marked as Not Take.";

    const updatedCandidate = normalizePipelineCandidateForBoard({
      ...assessmentCandidate,
      currentStage: "Online Assessment",
      currentPipelineStage: "Online Assessment",
      stage: "Online Assessment",
      pipelineStage: "Online Assessment",
      assessmentStatus: assessmentForm.assessmentStatus,
      assessmentResult: isTaken ? assessmentForm.assessmentResult : "",
      assessmentRemarks: assessmentForm.assessmentRemarks.trim(),
      assessmentTakenAt: isTaken ? getCurrentTimestamp() : null,
      assessmentTaggedAt: isTaken ? getCurrentTimestamp() : null,
      updatedAt: getCurrentDate(),
      reasonForMovement: movementReason,
      timeline: [
        ...(assessmentCandidate.timeline || []),
        {
          stage: "Online Assessment",
          owner: currentUserName,
          source: "Online Assessment",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks: assessmentForm.assessmentRemarks.trim(),
          assessmentFiles:
            assessmentForm.assessmentFileName ||
            assessmentForm.assessmentFileUrl
              ? [
                  {
                    id: `assessment-file-${Date.now()}`,
                    fileName: assessmentForm.assessmentFileName,
                    fileUrl: assessmentForm.assessmentFileUrl,
                    fileType: assessmentForm.assessmentFileType,
                    fileSize: assessmentForm.assessmentFileSize,
                  },
                ]
              : [],
          assessmentFileName: assessmentForm.assessmentFileName || "",
          assessmentFileUrl: assessmentForm.assessmentFileUrl || "",
          assessmentFileType: assessmentForm.assessmentFileType || "",
          assessmentFileSize: assessmentForm.assessmentFileSize || "",
          assessmentAttachmentName: assessmentForm.assessmentFileName || "",
          assessmentAttachmentUrl: assessmentForm.assessmentFileUrl || "",
          assessmentAttachmentType: assessmentForm.assessmentFileType || "",
          assessmentAttachmentSize: assessmentForm.assessmentFileSize || "",
        },
      ],
    });

    updateCandidateRecord(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
    handleCloseAssessmentModal();
  }

  async function handleOpenDropOffModal(candidate) {
    setDropOffCandidate(candidate);
    setDropOffForm({
      category:
        candidate.assessmentResult === "Assessment Not Fit"
          ? "Failed Assessment"
          : "",
      reason:
        candidate.assessmentResult === "Assessment Not Fit"
          ? "Candidate was tagged as Assessment Not Fit."
          : "",
      remarks: "",
    });
  }

  async function handleCloseDropOffModal() {
    setDropOffCandidate(null);
    setDropOffForm({
      category: "",
      reason: "",
      remarks: "",
    });
  }

  async function handleSubmitDropOff(e) {
    e.preventDefault();

    if (!dropOffCandidate) return;

    const currentStage = getCandidateStage(dropOffCandidate);

    if (!dropOffForm.category.trim()) {
      alert("Drop-off category is required.");
      return;
    }

    if (!dropOffForm.reason.trim()) {
      alert("Drop-off reason is required.");
      return;
    }

    if (!(await confirmAction(`Move ${dropOffCandidate.name} to Drop-off?`))) {
      return;
    }

    const movementReason = `Candidate moved from ${currentStage} to Drop-off. Reason: ${dropOffForm.reason.trim()}`;

    const updatedCandidate = normalizePipelineCandidateForBoard({
      ...dropOffCandidate,
      previousStage: currentStage,
      currentStage: "Drop-off",
      currentPipelineStage: "Drop-off",
      stage: "Drop-off",
      pipelineStage: "Drop-off",
      dateMoved: getCurrentDate(),
      updatedAt: getCurrentDate(),
      reasonForMovement: movementReason,
      dropOffCategory: dropOffForm.category.trim(),
      dropOffReason: dropOffForm.reason.trim(),
      dropOffRemarks: dropOffForm.remarks.trim(),
      timeline: [
        ...(dropOffCandidate.timeline || []),
        {
          stage: "Drop-off",
          owner: currentUserName,
          source: dropOffCandidate.source || "Candidate Pipeline",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          dropOffReason: dropOffForm.reason.trim(),
          dropOffCategory: dropOffForm.category.trim(),
          remarks: dropOffForm.remarks.trim(),
        },
      ],
    });

    updateCandidateRecord(updatedCandidate);
    removeOfferEligibleCandidate(dropOffCandidate);
    setSelectedCandidate(updatedCandidate);
    setActiveStage("Drop-off");
    closeAllPipelineModals();
  }

  async function handleUpdateOfferApproval(candidate, approver, status) {
    const currentStage = getCandidateStage(candidate);

    if (currentStage !== "Offered") return;

    if (
      !(await confirmAction(
        `Set ${approver} offer approval to ${status} for ${candidate.name}?`,
      ))
    ) {
      return;
    }

    const nextApprovals = {
      ...(candidate.offerApprovals || {}),
      [approver]: {
        status,
        updatedAt: getCurrentTimestamp(),
        remarks: "",
      },
    };

    const approvalSummary = getOfferApprovalSummary({
      ...candidate,
      offerApprovals: nextApprovals,
    });

    const nextStage = approvalSummary === "Approved" ? "Accepted" : "Offered";

    const movementReason =
      approvalSummary === "Approved"
        ? `${approver} approved the offer. Candidate moved from Offered to Accepted.`
        : `${approver} tagged the offer as ${status}. Overall offer approval status: ${approvalSummary}.`;

    const updatedCandidate = normalizePipelineCandidateForBoard({
      ...candidate,
      previousStage:
        nextStage !== currentStage ? currentStage : candidate.previousStage,
      currentStage: nextStage,
      currentPipelineStage: nextStage,
      stage: nextStage,
      pipelineStage: nextStage,
      dateMoved:
        nextStage !== currentStage ? getCurrentDate() : candidate.dateMoved,
      updatedAt: getCurrentDate(),
      offerApprovals: nextApprovals,
      offerApprovalStatus: approvalSummary,
      offerDecision: approvalSummary === "Approved" ? "Accepted" : "Pending",
      candidateResponse:
        approvalSummary === "Approved" ? "Accepted" : "Pending",
      reasonForMovement: movementReason,
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: nextStage,
          owner: approver,
          source: "Offer Approval",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
        },
      ],
    });

    updateCandidateRecord(updatedCandidate);

    if (nextStage === "Accepted") {
      upsertOfferRecordFromPipeline(updatedCandidate);
      removeOfferEligibleCandidate(updatedCandidate);
      setActiveStage("Accepted");
    } else {
      upsertOfferEligibleCandidate(updatedCandidate);
      setActiveStage("Offered");
    }

    setSelectedCandidate(updatedCandidate);
  }

  async function handleSendOfferEmail(candidate) {
    if (!isOfferApproved(candidate)) {
      alert("Offer must be approved before sending the contract email.");
      return;
    }

    if (
      !(await confirmAction(`Send offer contract email for ${candidate.name}?`))
    ) {
      return;
    }

    const movementReason =
      "Offer contract email was sent to the lead for contract review and response.";

    const updatedCandidate = normalizePipelineCandidateForBoard({
      ...candidate,
      offerEmailSent: true,
      offerEmailSentAt: getCurrentTimestamp(),
      updatedAt: getCurrentDate(),
      reasonForMovement: movementReason,
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: getCandidateStage(candidate),
          owner: currentUserName,
          source: "Offer Contract",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks: buildOfferContractLink(candidate),
        },
      ],
    });

    updateCandidateRecord(updatedCandidate);
    upsertOfferEligibleCandidate(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
    await triggerOfferEmail(updatedCandidate);
  }

  async function handleOfferDecision(candidate, decision) {
    if (!candidate.offerEmailSent) {
      alert(
        "Send the approved contract email first before recording the lead response.",
      );
      return;
    }

    if (
      !(await confirmAction(
        `Record candidate response as ${decision} for ${candidate.name}?`,
      ))
    ) {
      return;
    }

    const currentStage = getCandidateStage(candidate);

    if (decision === "Accepted") {
      const movementReason =
        "Lead accepted the offer contract. Candidate moved to Accepted.";

      const updatedCandidate = normalizePipelineCandidateForBoard({
        ...candidate,
        previousStage: currentStage,
        currentStage: "Accepted",
        currentPipelineStage: "Accepted",
        stage: "Accepted",
        pipelineStage: "Accepted",
        dateMoved: getCurrentDate(),
        updatedAt: getCurrentDate(),
        offerDecision: "Accepted",
        candidateResponse: "Accepted",
        offerDecisionAt: getCurrentTimestamp(),
        reasonForMovement: movementReason,
        timeline: [
          ...(candidate.timeline || []),
          {
            stage: "Accepted",
            owner: candidate.owner || currentUserName,
            source: "Offer Contract",
            timestamp: getCurrentTimestamp(),
            reason: movementReason,
          },
        ],
      });

      updateCandidateRecord(updatedCandidate);
      upsertOfferRecordFromPipeline(updatedCandidate);
      removeOfferEligibleCandidate(updatedCandidate);
      setSelectedCandidate(updatedCandidate);
      setActiveStage("Accepted");
      return;
    }

    if (decision === "Rejected") {
      const movementReason =
        "Lead rejected the offer contract. Candidate moved to Drop-off.";

      const updatedCandidate = normalizePipelineCandidateForBoard({
        ...candidate,
        previousStage: currentStage,
        currentStage: "Drop-off",
        currentPipelineStage: "Drop-off",
        stage: "Drop-off",
        pipelineStage: "Drop-off",
        dateMoved: getCurrentDate(),
        updatedAt: getCurrentDate(),
        offerDecision: "Rejected",
        candidateResponse: "Rejected",
        offerDecisionAt: getCurrentTimestamp(),
        reasonForMovement: movementReason,
        dropOffCategory: "Compensation",
        dropOffReason: "Candidate rejected the offer contract.",
        dropOffRemarks: "Offer response: Rejected",
        timeline: [
          ...(candidate.timeline || []),
          {
            stage: "Drop-off",
            owner: candidate.owner || currentUserName,
            source: "Offer Contract",
            timestamp: getCurrentTimestamp(),
            reason: movementReason,
            remarks: "Offer response: Rejected",
          },
        ],
      });

      updateCandidateRecord(updatedCandidate);
      upsertOfferRecordFromPipeline(updatedCandidate);
      removeOfferEligibleCandidate(updatedCandidate);
      setSelectedCandidate(updatedCandidate);
      setActiveStage("Drop-off");
      return;
    }

    const movementReason = "Lead requested offer negotiation.";

    const updatedCandidate = normalizePipelineCandidateForBoard({
      ...candidate,
      offerDecision: "Negotiate",
      candidateResponse: "Negotiate",
      offerDecisionAt: getCurrentTimestamp(),
      updatedAt: getCurrentDate(),
      reasonForMovement: movementReason,
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: currentStage,
          owner: currentUserName,
          source: "Offer Contract",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
        },
      ],
    });

    updateCandidateRecord(updatedCandidate);
    upsertOfferEligibleCandidate(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
  }

  function sanitizeTalentPoolResetCandidate(candidate = {}) {
    const cleanedCandidate = {
      ...candidate,

      status:
        candidate.status === "Do Not Reprocess"
          ? candidate.status
          : "New Applicant",

      pipelineStatus: "",
      applicationStatus: "",
      currentPipelineStage: "",
      pipelineStage: "",
      currentStage: "",
      stage: "",
      previousStage: "",

      currentApplicationStatus: "",
      currentApplicationId: "",
      candidateApplicationId: "",
      applicationId: "",

      currentAppliedRole: "",
      currentAppliedAccount: "",
      currentTaOwner: "",

      movedToPipeline: false,

      prfStatus: "",
      prfReviewed: false,
      prfReviewedAt: "",

      assessmentStatus: "",
      assessmentResult: "",
      assessmentEmailSent: false,
      assessmentEmailSentAt: "",
      assessmentTakenAt: "",
      assessmentTaggedAt: "",
      assessmentRemarks: "",

      interviewStatus: "",
      interviewDate: "",
      interviewType: "",
      onlineInterviewLink: "",

      offerDetails: null,
      offerApprovals: null,
      offerApprovalStatus: "",
      offerDecision: "",
      offerEmailSent: false,
      offerEmailSentAt: "",
      candidateResponse: "",

      dropOffCategory: "",
      dropOffReason: "",
      dropOffRemarks: "",

      reasonForMovement: "",
      dateMoved: "",

      timeline: [],
      movementTimeline: [],
      movementHistory: [],
      pipelineHistory: [],
      stageHistory: [],

      candidateSnapshot: undefined,
    };

    return normalizeCandidateRecord
      ? normalizeCandidateRecord(cleanedCandidate)
      : cleanedCandidate;
  }

  function clearRecruitmentSampleStorage() {
    const exactKeysToRemove = [
      CANDIDATE_APPLICATIONS_STORAGE_KEY,
      PIPELINE_CANDIDATES_STORAGE_KEY,
      OFFER_ELIGIBLE_STORAGE_KEY,
      OFFER_RECORDS_STORAGE_KEY,
      PIPELINE_SYNC_EVENTS_KEY,

      INTERNAL_CANDIDATES_KEY,
      PUBLIC_SUBMISSIONS_KEY,
      TALENT_POOL_APPLICATIONS_KEY,

      "ta_candidate_applications",
      "ta_pipeline_candidates",
      "ta_offer_eligible_candidates",
      "ta_offer_records",
      "ta_pipeline_sync_events",
      "ta_internal_candidates",
      "ta_public_candidate_submissions",
    ];

    exactKeysToRemove.forEach((key) => {
      if (key) localStorage.removeItem(key);
    });

    Object.keys(localStorage).forEach((key) => {
      const shouldRemove =
        key.startsWith("ta_pipeline_") ||
        key.startsWith("ta_offer_") ||
        key === "ta_candidate_applications" ||
        key === "ta_internal_candidates" ||
        key === "ta_public_candidate_submissions";

      if (shouldRemove) {
        localStorage.removeItem(key);
      }
    });
  }

  function handleResetSampleData() {
    const confirmed = window.confirm(
      "Reset Candidate Pipeline and Talent Pool sample data? This will remove saved local changes.",
    );

    if (!confirmed) return;

    clearRecruitmentSampleStorage();

    const normalizedPipelineCandidates = defaultPipelineCandidates.map(
      normalizePipelineCandidateForBoard,
    );

    const normalizedTalentPoolCandidates = talentPoolInitialCandidates.map(
      sanitizeTalentPoolResetCandidate,
    );

    savePipelineCandidateData(normalizedPipelineCandidates);

    localStorage.setItem(
      INTERNAL_CANDIDATES_KEY,
      JSON.stringify(normalizedTalentPoolCandidates),
    );

    localStorage.setItem(PUBLIC_SUBMISSIONS_KEY, JSON.stringify([]));
    localStorage.setItem(TALENT_POOL_APPLICATIONS_KEY, JSON.stringify([]));

    const offerEligibleCandidates = normalizedPipelineCandidates.filter(
      (candidate) => {
        const currentStage =
          candidate.currentStage ||
          candidate.currentPipelineStage ||
          candidate.pipelineStage ||
          candidate.stage;

        return currentStage === "Offered";
      },
    );

    localStorage.setItem(
      OFFER_ELIGIBLE_STORAGE_KEY,
      JSON.stringify(offerEligibleCandidates),
    );

    localStorage.setItem(OFFER_RECORDS_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(PIPELINE_SYNC_EVENTS_KEY, JSON.stringify([]));

    setCandidateList(normalizedPipelineCandidates);
    setActiveStage("Initial Screening");
    setPageView("pipeline");

    setSelectedCandidate(null);
    setMoveCandidate(null);
    setScheduleCandidate(null);
    setAssessmentCandidate(null);
    setDropOffCandidate(null);
    setOfferCandidate(null);

    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("ta-pipeline-candidates-updated"));
    window.dispatchEvent(new Event("ta-public-submissions-updated"));

    confirmAction(
      "Candidate Pipeline and Talent Pool sample data have been reset.",
      {
        title: "Reset Complete",
        confirmText: "OK",
        variant: "default",
      },
    );
  }
  const filteredCandidates = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return candidateList
      .map(normalizePipelineCandidateForBoard)
      .filter((candidate) => {
        const role = getRoleTitle(candidate.roleAccount);
        const account = getAccount(candidate.roleAccount);

        const matchesSearch =
          !keyword ||
          String(candidate.name || "")
            .toLowerCase()
            .includes(keyword) ||
          String(candidate.email || "")
            .toLowerCase()
            .includes(keyword) ||
          String(candidate.candidateId || "")
            .toLowerCase()
            .includes(keyword) ||
          String(candidate.roleAccount || "")
            .toLowerCase()
            .includes(keyword) ||
          String(candidate.source || "")
            .toLowerCase()
            .includes(keyword) ||
          String(candidate.prfStatus || "")
            .toLowerCase()
            .includes(keyword) ||
          String(candidate.assessmentStatus || "")
            .toLowerCase()
            .includes(keyword) ||
          String(candidate.assessmentResult || "")
            .toLowerCase()
            .includes(keyword) ||
          String(candidate.offerApprovalStatus || "")
            .toLowerCase()
            .includes(keyword) ||
          String(candidate.offerDecision || "")
            .toLowerCase()
            .includes(keyword) ||
          String(candidate.offerDetails?.account || "")
            .toLowerCase()
            .includes(keyword);

        const matchesRole = roleFilter === "All Roles" || role === roleFilter;
        const matchesAccount =
          accountFilter === "All Accounts" || account === accountFilter;

        return matchesSearch && matchesRole && matchesAccount;
      });
  }, [candidateList, search, roleFilter, accountFilter]);

  const stageVisibleCandidates = useMemo(() => {
    return filteredCandidates.filter((candidate) => {
      const currentStage = getCandidateStage(candidate);

      if (currentStage === "Initial Screening") {
        return true;
      }

      if (currentStage === "Online Assessment") {
        return candidate.prfStatus === "Matched";
      }

      if (currentStage === "Interview Scheduled") {
        return (
          candidate.assessmentStatus === "Taken" &&
          candidate.assessmentResult === "Assessment Fit" &&
          hasInterviewSchedule(candidate) &&
          candidate.interviewStatus !== "Completed"
        );
      }

      return true;
    });
  }, [filteredCandidates]);

  const stageCounts = useMemo(() => {
    return pipelineStages.reduce((acc, stage) => {
      acc[stage] = stageVisibleCandidates.filter(
        (candidate) => getCandidateStage(candidate) === stage,
      ).length;

      return acc;
    }, {});
  }, [stageVisibleCandidates]);

  const metrics = useMemo(() => {
    return {
      initialScreening: stageCounts["Initial Screening"] || 0,
      onlineAssessment: stageCounts["Online Assessment"] || 0,
      interviewScheduled: stageCounts["Interview Scheduled"] || 0,
      interviewed: stageCounts["Interviewed"] || 0,
      offered: stageCounts["Offered"] || 0,
      accepted: stageCounts["Accepted"] || 0,
    };
  }, [stageCounts]);

  const stageFilteredCandidates = useMemo(() => {
    return stageVisibleCandidates.filter(
      (candidate) => getCandidateStage(candidate) === activeStage,
    );
  }, [stageVisibleCandidates, activeStage]);

  const showStatusColumn = useMemo(() => {
    if (activeStage === "Online Assessment") return false;
    return true;
  }, [activeStage]);

  function handleStartInterview(candidate) {
    if (!candidate?.id) return;

    const currentStage = getCandidateStage(candidate);

    const movementReason =
      "Final interview has been started and is currently in progress.";

    const updatedCandidate = normalizePipelineCandidateForBoard({
      ...candidate,
      currentStage,
      currentPipelineStage: currentStage,
      stage: currentStage,
      pipelineStage: currentStage,
      interviewStatus: "Interview in Progress",
      updatedAt: getCurrentDate(),
      reasonForMovement: movementReason,
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: currentStage || "Interview Scheduled",
          owner: currentUserName,
          source: "Final Interview",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
        },
      ],
    });

    updateCandidateRecord(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
  }

  function handleSubmitFinalInterview({
    candidateId,
    candidateApplicationId,
    positionId,
    formId,
    formName = "",
    answers = {},
    fieldsSnapshot = [],
  }) {
    const matchedCandidate = candidateList.find((candidate) => {
      return (
        String(candidate.candidateId || "") === String(candidateId || "") ||
        String(candidate.candidateApplicationId || "") ===
          String(candidateApplicationId || "") ||
        String(candidate.applicationId || "") ===
          String(candidateApplicationId || "") ||
        String(candidate.id || "") === String(candidateApplicationId || "")
      );
    });

    if (!matchedCandidate) {
      console.warn("FINAL INTERVIEW SUBMIT: Candidate not found", {
        candidateId,
        candidateApplicationId,
        candidateList,
      });

      return false;
    }

    const currentStage = getCandidateStage(matchedCandidate);
    const submissionId = `final-interview-${Date.now()}`;

    const savedFormLink = `/recruitment/final-interview-form?candidateId=${encodeURIComponent(
      matchedCandidate.candidateId || candidateId || "",
    )}&candidateApplicationId=${encodeURIComponent(
      matchedCandidate.candidateApplicationId ||
        matchedCandidate.id ||
        candidateApplicationId ||
        "",
    )}&submissionId=${encodeURIComponent(submissionId)}&mode=view`;

    const submittedFormRecord = {
      id: submissionId,
      candidateId: matchedCandidate.candidateId || candidateId || "",
      candidateApplicationId:
        matchedCandidate.candidateApplicationId ||
        matchedCandidate.id ||
        candidateApplicationId ||
        "",
      positionId: positionId || "",
      formId: formId || "",
      formName: formName || "Final Interview Form",
      submittedAt: getCurrentTimestamp(),
      submittedBy: currentUserName,
      answers,
      fieldsSnapshot,
      savedFormLink,
    };

    const movementReason =
      "Final interview form was submitted. Candidate moved from Interview Scheduled to Interviewed.";

    const updatedCandidateRecord = normalizePipelineCandidateForBoard({
      ...matchedCandidate,
      previousStage: currentStage || "Interview Scheduled",
      currentStage: "Interviewed",
      currentPipelineStage: "Interviewed",
      stage: "Interviewed",
      pipelineStage: "Interviewed",
      dateMoved: getCurrentDate(),
      updatedAt: getCurrentDate(),
      interviewStatus: "Completed",

      finalInterviewSubmitted: true,
      finalInterviewSubmittedAt: getCurrentTimestamp(),
      finalInterviewPositionId: positionId || "",
      finalInterviewFormId: formId || "",
      finalInterviewAnswers: answers,
      finalInterviewSubmittedForms: [
        ...(matchedCandidate.finalInterviewSubmittedForms || []),
        submittedFormRecord,
      ],

      reasonForMovement: movementReason,
      timeline: [
        ...(matchedCandidate.timeline || []),
        {
          stage: "Interviewed",
          owner: currentUserName,
          source: "Final Interview Form",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks: "Interview status changed to Completed.",
          savedFormLink,
          submittedFormId: submissionId,
        },
      ],
    });

    setCandidateList((prev) => {
      const next = prev.map((candidate) => {
        const isMatchedCandidate =
          String(candidate.candidateId || "") === String(candidateId || "") ||
          String(candidate.candidateApplicationId || "") ===
            String(candidateApplicationId || "") ||
          String(candidate.applicationId || "") ===
            String(candidateApplicationId || "") ||
          String(candidate.id || "") === String(candidateApplicationId || "");

        return isMatchedCandidate ? updatedCandidateRecord : candidate;
      });

      savePipelineCandidateData(next);

      return next;
    });

    syncSelectedCandidate(updatedCandidateRecord);
    syncTalentPoolFromPipelineApplication(updatedCandidateRecord);
    setSelectedCandidate(updatedCandidateRecord);
    setActiveStage("Interviewed");

    window.dispatchEvent(new Event("ta-pipeline-candidates-updated"));
    window.dispatchEvent(new Event("ta-public-submissions-updated"));

    return true;
  }

  function resetConnectedRecruitmentStorage(sampleCandidates = []) {
    try {
      const normalizedSampleCandidates = sampleCandidates.map(
        normalizePipelineCandidateForBoard,
      );

      localStorage.setItem(
        PIPELINE_CANDIDATES_STORAGE_KEY,
        JSON.stringify(normalizedSampleCandidates),
      );

      localStorage.setItem(
        OFFER_ELIGIBLE_STORAGE_KEY,
        JSON.stringify(normalizedSampleCandidates),
      );

      localStorage.removeItem(OFFER_RECORDS_STORAGE_KEY);
      localStorage.removeItem(PIPELINE_SYNC_EVENTS_KEY);

      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("ta-pipeline-candidates-updated"));
    } catch (error) {
      console.error("RESET CONNECTED RECRUITMENT STORAGE ERROR:", error);
    }
  }

  function updateCandidateFromOffer(updatedCandidatePayload) {
    setCandidateList((prev) => {
      const next = prev.map((candidate) => {
        const sameApplication =
          String(
            candidate.candidateApplicationId || candidate.applicationId || "",
          )
            .trim()
            .toLowerCase() ===
          String(
            updatedCandidatePayload.candidateApplicationId ||
              updatedCandidatePayload.applicationId ||
              "",
          )
            .trim()
            .toLowerCase();

        const sameCandidate =
          String(candidate.candidateId || "")
            .trim()
            .toLowerCase() ===
          String(updatedCandidatePayload.candidateId || "")
            .trim()
            .toLowerCase();

        const sameEmail =
          String(candidate.email || candidate.candidateEmail || "")
            .trim()
            .toLowerCase() ===
          String(
            updatedCandidatePayload.candidateEmail ||
              updatedCandidatePayload.email ||
              "",
          )
            .trim()
            .toLowerCase();

        if (!sameApplication && !sameCandidate && !sameEmail) {
          return candidate;
        }

        const currentStage = getCandidateStage(candidate);

        const nextStage =
          updatedCandidatePayload.currentStage ||
          updatedCandidatePayload.stage ||
          updatedCandidatePayload.pipelineStage ||
          currentStage;

        const stageChanged = nextStage !== currentStage;

        const movementReason =
          updatedCandidatePayload.reasonForMovement ||
          updatedCandidatePayload.remarks ||
          (nextStage === "Accepted"
            ? "Offer approved. Candidate moved from Offered to Accepted."
            : "Offer approval status was updated.");

        const nextTimeline = [
          ...(candidate.timeline || []),
          {
            stage: nextStage,
            owner: updatedCandidatePayload.owner || currentUserName,
            source: "Offers Page",
            timestamp: getCurrentTimestamp(),
            reason: movementReason,
            remarks: updatedCandidatePayload.remarks || "",
          },
        ];

        return normalizePipelineCandidateForBoard({
          ...candidate,
          ...updatedCandidatePayload,

          previousStage: stageChanged ? currentStage : candidate.previousStage,

          currentStage: nextStage,
          currentPipelineStage: nextStage,
          stage: nextStage,
          pipelineStage: nextStage,

          dateMoved: stageChanged ? getCurrentDate() : candidate.dateMoved,
          updatedAt: getCurrentDate(),

          offerDetails: {
            ...(candidate.offerDetails || {}),
            ...(updatedCandidatePayload.offerDetails || {}),
          },

          offerApprovals: {
            ...(candidate.offerApprovals || {}),
            ...(updatedCandidatePayload.offerApprovals || {}),
          },

          offerApprovalStatus:
            updatedCandidatePayload.offerApprovalStatus ||
            candidate.offerApprovalStatus,

          offerDecision:
            updatedCandidatePayload.offerDecision || candidate.offerDecision,

          candidateResponse:
            updatedCandidatePayload.candidateResponse ||
            candidate.candidateResponse,

          reasonForMovement: movementReason,
          timeline: nextTimeline,
        });
      });

      savePipelineCandidateData(next);

      localStorage.setItem(OFFER_ELIGIBLE_STORAGE_KEY, JSON.stringify(next));

      return next;
    });

    if (
      updatedCandidatePayload.currentStage === "Accepted" ||
      updatedCandidatePayload.stage === "Accepted" ||
      updatedCandidatePayload.pipelineStage === "Accepted"
    ) {
      setActiveStage("Accepted");
    }

    window.dispatchEvent(new Event("ta-pipeline-candidates-updated"));
  }

  async function handleScheduleNhoAuto(candidate) {
    if (!candidate) return;

    const currentStage = getCandidateStage(candidate);

    if (currentStage !== "Accepted" && currentStage !== "Accepted (For NHO)") {
      alert("Only accepted candidates can be scheduled for NHO.");
      return;
    }

    const fridaySchedule = getFridayOfCurrentWeek();

    if (
      !(await confirmAction(
        `Schedule NHO for ${candidate.name} on ${formatNhoScheduleDate(
          fridaySchedule,
        )} and move candidate to For NHO?`,
      ))
    ) {
      return;
    }

    const autoNhoSchedule = {
      startDate: fridaySchedule.toISOString(),
      account:
        candidate?.offerDetails?.account ||
        candidate?.account ||
        getAccount(candidate?.roleAccount) ||
        "—",
      trainer: candidate?.trainer || "To be assigned",
      updatedShiftSchedule:
        candidate?.updatedShiftSchedule ||
        candidate?.nhoShiftSchedule ||
        "To be assigned",
      endorsementStatus: "For Endorsement",
      location: candidate?.workLocation || candidate?.nhoLocation || "—",
      status: "Scheduled",
      scheduledAt: getCurrentTimestamp(),
      scheduledBy: currentUserName,
      remarks: `NHO automatically scheduled for ${formatNhoScheduleDate(
        fridaySchedule,
      )}.`,
    };

    const movementReason = `NHO automatically scheduled for ${formatNhoScheduleDate(
      fridaySchedule,
    )}. Candidate moved from ${currentStage} to For NHO.`;

    const updatedCandidate = normalizePipelineCandidateForBoard({
      ...candidate,

      previousStage: currentStage,
      currentStage: "For NHO",
      currentPipelineStage: "For NHO",
      stage: "For NHO",
      pipelineStage: "For NHO",

      nhoSchedule: autoNhoSchedule,
      nhoStartDate: autoNhoSchedule.startDate,
      nhoStatus: "Scheduled",
      nhoAccount: autoNhoSchedule.account,
      nhoTrainer: autoNhoSchedule.trainer,
      nhoShiftSchedule: autoNhoSchedule.updatedShiftSchedule,
      endorsementStatus: autoNhoSchedule.endorsementStatus,

      dateMoved: getCurrentDate(),
      updatedAt: getCurrentDate(),
      reasonForMovement: movementReason,

      timeline: [
        ...(candidate.timeline || []),
        {
          stage: "For NHO",
          owner: currentUserName,
          source: "NHO Scheduling",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks: `Start Date: ${formatNhoScheduleDate(
            fridaySchedule,
          )}; Account: ${autoNhoSchedule.account}; Trainer: ${
            autoNhoSchedule.trainer
          }; Shift: ${autoNhoSchedule.updatedShiftSchedule}`,
        },
      ],
    });

    updateCandidateRecord(updatedCandidate);
    removeOfferEligibleCandidate(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
    setActiveStage("For NHO");
  }

  const value = {
    user,
    currentUserName,

    candidateList,
    setCandidateList,
    hasLoadedStorage,

    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    accountFilter,
    setAccountFilter,
    activeStage,
    setActiveStage,
    pageView,
    setPageView,

    selectedCandidate,
    setSelectedCandidate,

    moveCandidate,
    setMoveCandidate,
    moveForm,
    setMoveForm,

    scheduleCandidate,
    setScheduleCandidate,
    scheduleForm,
    setScheduleForm,

    assessmentCandidate,
    setAssessmentCandidate,
    assessmentForm,
    setAssessmentForm,

    dropOffCandidate,
    setDropOffCandidate,
    dropOffForm,
    setDropOffForm,

    offerCandidate,
    setOfferCandidate,
    offerForm,
    setOfferForm,

    hideInterviewColumns,
    showAssessmentStatusColumn,
    showAssessmentResultColumn,
    showStatusColumn,

    filteredCandidates,
    stageVisibleCandidates,
    stageCounts,
    metrics,
    stageFilteredCandidates,

    syncSelectedCandidate,
    updateCandidateRecord,
    updateCandidateFromOffer,

    handleUpdatePrfStatus,
    handleOpenScheduleInterview,
    handleCloseScheduleInterview,
    handleSubmitScheduleInterview,
    handleCancelInterview,
    handleCompleteInterview,
    handleSaveInterviewNotes,

    handleOpenOfferModal,
    handleCloseOfferModal,
    handleSubmitOfferDetails,
    handleUpdateOfferApproval,
    handleSendOfferEmail,
    handleOfferDecision,
    handleScheduleNhoAuto,

    handleOpenMoveModal,
    handleCloseMoveModal,
    handleSubmitMove,

    handleOpenAssessmentModal,
    handleCloseAssessmentModal,
    handleSendAssessmentEmail,
    handleSubmitAssessment,

    handleOpenDropOffModal,
    handleCloseDropOffModal,
    handleSubmitDropOff,

    handleResetSampleData,

    handleStartInterview,
    handleSubmitFinalInterview,

    resetConnectedRecruitmentStorage,

    ConfirmationDialog,
  };

  return (
    <CandidatePipelineContext.Provider value={value}>
      {children}
      {ConfirmationDialog}
    </CandidatePipelineContext.Provider>
  );
}

export function useCandidatePipeline() {
  const context = useContext(CandidatePipelineContext);

  if (!context) {
    throw new Error(
      "useCandidatePipeline must be used inside CandidatePipelineProvider",
    );
  }

  return context;
}
