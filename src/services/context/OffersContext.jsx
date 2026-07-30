import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useUser } from "./UserContext";
import useConfirmDialog from "../../hooks/offers/useConfirmDialog";

import {
  OFFER_ELIGIBLE_STORAGE_KEY,
  OFFER_RECORDS_STORAGE_KEY,
  PIPELINE_CANDIDATES_STORAGE_KEY,
  PIPELINE_SYNC_EVENTS_KEY,
} from "../../lib/utils/offers/offerConstants";

import { getCurrentTimestamp } from "../../lib/utils/offers/offerFormatters";

import {
  safeReadArray,
  safeWriteArray,
} from "../../lib/utils/offers/offerStorage";

import {
  buildPipelineOfferPayload,
  getCandidateKey,
  isOfferedCandidate,
  normalizePipelineCandidateToOffer,
} from "../../lib/utils/offers/offerHelpers";

import { useCandidatePipeline } from "./CandidatePipelineContext";
import StatusModal from "../../components/modals/StatusModal";

import { getOfferApprovalUsers as fetchOfferApprovalUsers } from "../../lib/axios/getOfferApprovalRules";

import {
  getCandidatePipelineCandidates,
  updateCandidatePipelineOfferApproval,
} from "../../lib/axios/getCandidatePipeline";

const OffersContext = createContext(null);

export function useOffers() {
  const context = useContext(OffersContext);

  if (!context) {
    throw new Error("useOffers must be used inside OffersProvider");
  }

  return context;
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeKey(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s-]/g, "");
}

function stripSibsPrefix(value) {
  return cleanText(value).replace(/^\d+\s*-\s*/i, "").trim();
}

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function getApiErrorMessage(error, fallback = "Request failed.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function getLocalStorageValue(keys = []) {
  if (typeof window === "undefined") return "";

  for (const key of keys) {
    const value = window.localStorage.getItem(key);

    if (value !== null && value !== undefined && cleanText(value)) {
      return cleanText(value);
    }
  }

  return "";
}

function getStoredPipelineCandidates() {
  const pipelineCandidates = safeReadArray(PIPELINE_CANDIDATES_STORAGE_KEY);

  if (pipelineCandidates.length) {
    return pipelineCandidates;
  }

  return safeReadArray(OFFER_ELIGIBLE_STORAGE_KEY);
}

function readOfferOverrides() {
  return safeReadArray(OFFER_RECORDS_STORAGE_KEY);
}

function writeOfferOverride(updatedOffer) {
  const current = readOfferOverrides();
  const updatedKey = getCandidateKey(updatedOffer);

  const exists = current.some((item) => getCandidateKey(item) === updatedKey);

  const next = exists
    ? current.map((item) =>
        getCandidateKey(item) === updatedKey ? updatedOffer : item,
      )
    : [updatedOffer, ...current];

  safeWriteArray(OFFER_RECORDS_STORAGE_KEY, next);
}

function getCurrentUserName(user) {
  const currentUser = Array.isArray(user) ? user[0] : user;

  const directName =
    currentUser?.name ||
    currentUser?.fullName ||
    currentUser?.employeeName ||
    currentUser?.displayName ||
    currentUser?.username ||
    currentUser?.gy_user_fullname ||
    currentUser?.gy_user_name ||
    currentUser?.gy_user_username ||
    getLocalStorageValue(["fullName", "name", "displayName", "username"]);

  if (directName) {
    return cleanText(directName);
  }

  const lastName = cleanText(currentUser?.lastName || currentUser?.last_name);
  const firstName = cleanText(currentUser?.firstName || currentUser?.first_name);
  const middleName = cleanText(
    currentUser?.middleName || currentUser?.middle_name,
  );

  const firstAndMiddle = [firstName, middleName].filter(Boolean).join(" ");

  const fullNameFromParts = [lastName, firstAndMiddle]
    .filter(Boolean)
    .join(", ")
    .trim();

  return (
    fullNameFromParts ||
    currentUser?.email ||
    currentUser?.gy_user_email ||
    "Current User"
  );
}

function getCurrentUserSibsId(user) {
  const currentUser = Array.isArray(user) ? user[0] : user;

  return cleanText(
    currentUser?.sibsId ||
      currentUser?.sibs_id ||
      currentUser?.userCode ||
      currentUser?.username ||
      currentUser?.gy_emp_code ||
      currentUser?.employeeId ||
      currentUser?.employee_id ||
      getLocalStorageValue([
        "userCode",
        "sibsId",
        "sibs_id",
        "username",
        "employeeId",
        "employee_id",
      ]),
  );
}

function normalizeApprovalUser(user = {}) {
  const sibsId = cleanText(user.sibsId || user.sibs_id);

  const displayName = cleanText(user.displayName || user.display_name);

  const firstName = cleanText(user.firstName || user.first_name);
  const middleName = cleanText(user.middleName || user.middle_name);
  const lastName = cleanText(user.lastName || user.last_name);

  const fallbackName = [
    sibsId,
    [lastName, [firstName, middleName].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(", "),
  ]
    .filter(Boolean)
    .join(" - ");

  return {
    id: user.id,
    sibsId,
    displayName: (displayName || fallbackName || sibsId).toUpperCase(),
    firstName,
    middleName,
    lastName,
    isActive: user.isActive ?? user.is_active ?? true,
    sortOrder: Number(user.sortOrder ?? user.sort_order ?? 0),
  };
}

function getApprovalUserLabel(user = {}) {
  return cleanText(
    user.displayName || user.display_name || user.name,
  ).toUpperCase();
}

function getApprovalsObject(offer = {}) {
  return offer.approvals || offer.offerApprovals || {};
}

function getApprovalRecordForUser(approvals = {}, user = {}) {
  const userSibsId = cleanText(user.sibsId || user.sibs_id);
  const userLabel = getApprovalUserLabel(user);
  const userLabelWithoutId = stripSibsPrefix(userLabel);

  if (userLabel && approvals[userLabel]) return approvals[userLabel];
  if (userSibsId && approvals[userSibsId]) return approvals[userSibsId];

  const approvalEntries = Object.entries(approvals || {});

  const matched = approvalEntries.find(([key]) => {
    const cleanKey = cleanText(key);
    const cleanKeyWithoutId = stripSibsPrefix(cleanKey);

    return (
      normalizeKey(cleanKey) === normalizeKey(userLabel) ||
      normalizeKey(cleanKeyWithoutId) === normalizeKey(userLabelWithoutId) ||
      (userSibsId && normalizeKey(cleanKey).includes(normalizeKey(userSibsId)))
    );
  });

  return matched?.[1] || null;
}

function getDirectOfferApprovalStatus(offer = {}) {
  return cleanText(
    offer.offerApprovalStatus ||
      offer.offer_approval_status ||
      offer.approvalStatus ||
      offer.approval_status ||
      offer.status,
  );
}

function getOfferDecisionStatus(offer = {}) {
  return cleanText(
    offer.offerDecision ||
      offer.offer_decision ||
      offer.candidateResponse ||
      offer.candidate_response,
  );
}

function normalizeTerminalOfferStatus(value = "") {
  const key = cleanText(value).toLowerCase();

  if (key === "approved" || key === "accepted") return "Approved";
  if (key === "rejected" || key === "declined") return "Rejected";

  return "";
}

function isTerminalOfferApprovalStatus(value = "") {
  return Boolean(normalizeTerminalOfferStatus(value));
}

function getOfferApprovalSummaryFromUsers(offer = {}, approvalUsers = []) {
  const directTerminalStatus = normalizeTerminalOfferStatus(
    getDirectOfferApprovalStatus(offer),
  );

  if (directTerminalStatus) return directTerminalStatus;

  const decisionTerminalStatus = normalizeTerminalOfferStatus(
    getOfferDecisionStatus(offer),
  );

  if (decisionTerminalStatus) return decisionTerminalStatus;

  const approvals = getApprovalsObject(offer);

  if (!approvalUsers.length) {
    return getDirectOfferApprovalStatus(offer) || "For Review";
  }

  const hasRejected = approvalUsers.some((user) => {
    const approval = getApprovalRecordForUser(approvals, user);

    return normalizeTerminalOfferStatus(approval?.status) === "Rejected";
  });

  if (hasRejected) return "Rejected";

  const allApproved = approvalUsers.every((user) => {
    const approval = getApprovalRecordForUser(approvals, user);

    return normalizeTerminalOfferStatus(approval?.status) === "Approved";
  });

  if (allApproved) return "Approved";

  return getDirectOfferApprovalStatus(offer) || "For Review";
}

function findCurrentApprovalUser({
  approvalUsers = [],
  currentUserName = "",
  currentUserSibsId = "",
}) {
  const currentNameKey = normalizeKey(currentUserName);
  const currentNameWithoutIdKey = normalizeKey(stripSibsPrefix(currentUserName));
  const currentSibsKey = normalizeKey(currentUserSibsId);

  return approvalUsers.find((approvalUser) => {
    const approvalSibsKey = normalizeKey(approvalUser.sibsId);
    const approvalDisplayKey = normalizeKey(approvalUser.displayName);
    const approvalDisplayWithoutIdKey = normalizeKey(
      stripSibsPrefix(approvalUser.displayName),
    );

    if (currentSibsKey && approvalSibsKey && currentSibsKey === approvalSibsKey) {
      return true;
    }

    if (currentSibsKey && approvalDisplayKey.includes(currentSibsKey)) {
      return true;
    }

    if (currentNameKey && approvalDisplayKey === currentNameKey) {
      return true;
    }

    if (
      currentNameWithoutIdKey &&
      approvalDisplayWithoutIdKey &&
      currentNameWithoutIdKey === approvalDisplayWithoutIdKey
    ) {
      return true;
    }

    return false;
  });
}

function getCandidateStatus(candidate = {}) {
  return cleanText(
    candidate.status ||
      candidate.offerApprovalStatus ||
      candidate.approvalStatus ||
      candidate.offer_approval_status,
  );
}

function getCandidateStage(candidate = {}) {
  const directStage = cleanText(
    candidate.currentStage ||
      candidate.currentPipelineStage ||
      candidate.pipelineStage ||
      candidate.stage ||
      candidate.current_stage,
  );

  if (directStage) return directStage;

  const status = getCandidateStatus(candidate);

  if (status === "Offered") return "Offered";
  if (status === "Accepted") return "Accepted";
  if (status === "For NHO") return "For NHO";

  return "";
}

function getCandidatePipelineRecordId(offer = {}) {
  return (
    offer.pipelineDbId ||
    offer.dbId ||
    offer.pipelineId ||
    offer.candidatePipelineId ||
    offer.rawId ||
    offer.id ||
    offer.candidateApplicationId ||
    offer.applicationId ||
    offer.candidateId ||
    ""
  );
}

function getMergedCandidateKey(candidate = {}) {
  return (
    getCandidateKey(candidate) ||
    cleanText(candidate.pipelineDbId) ||
    cleanText(candidate.dbId) ||
    cleanText(candidate.rawId) ||
    cleanText(candidate.id) ||
    cleanText(candidate.candidatePipelineId) ||
    cleanText(candidate.candidateApplicationId) ||
    cleanText(candidate.applicationId) ||
    cleanText(candidate.candidateId) ||
    cleanText(candidate.email || candidate.candidateEmail).toLowerCase()
  );
}

function getOfferMatchValues(record = {}) {
  return [
    getCandidateKey(record),
    getMergedCandidateKey(record),
    getCandidatePipelineRecordId(record),
    record.offerId,
    record.offer_id,
    record.pipelineDbId,
    record.dbId,
    record.rawId,
    record.id,
    record.candidatePipelineId,
    record.candidate_pipeline_id,
    record.candidateApplicationId,
    record.candidate_application_id,
    record.applicationId,
    record.application_id,
    record.candidateId,
    record.candidate_id,
    cleanText(record.email || record.candidateEmail).toLowerCase(),
  ]
    .map(cleanText)
    .filter(Boolean);
}

function isSameOfferRecord(first = {}, second = {}) {
  const firstValues = new Set(getOfferMatchValues(first));
  const secondValues = getOfferMatchValues(second);

  return secondValues.some((value) => firstValues.has(value));
}

function getOfferDetailsObject(candidate = {}) {
  const offerDetails = candidate.offerDetails || candidate.offer_details || {};

  return safeObject(offerDetails);
}

function normalizeCandidateForOffers(candidate = {}) {
  const safeCandidate = safeObject(candidate);

  const offerDetails = getOfferDetailsObject(safeCandidate);

  const status = getCandidateStatus(safeCandidate);
  const currentStage =
    getCandidateStage(safeCandidate) ||
    (status === "Offered" ? "Offered" : "") ||
    "Initial Screening";

  const candidateName =
    safeCandidate.candidateName ||
    safeCandidate.name ||
    safeCandidate.fullName ||
    safeCandidate.full_name ||
    "Unnamed Candidate";

  const candidateEmail =
    safeCandidate.candidateEmail ||
    safeCandidate.email ||
    safeCandidate.email_address ||
    "";

  const roleTitle =
    offerDetails.roleTitle ||
    offerDetails.finalRole ||
    safeCandidate.roleTitle ||
    safeCandidate.role_title ||
    safeCandidate.currentAppliedRole ||
    safeCandidate.current_applied_role ||
    safeCandidate.openPosition ||
    safeCandidate.open_position ||
    safeCandidate.roleCapability ||
    "Not assigned yet";

  const account =
    offerDetails.account ||
    offerDetails.finalAccount ||
    safeCandidate.account ||
    safeCandidate.currentAppliedAccount ||
    safeCandidate.current_applied_account ||
    safeCandidate.leadAccount ||
    safeCandidate.lead_account ||
    safeCandidate.accountFit ||
    "Not assigned yet";

  const offerApprovalStatus =
    safeCandidate.offerApprovalStatus ||
    safeCandidate.offer_approval_status ||
    safeCandidate.approvalStatus ||
    (status === "Offered" ? "For Review" : "");

  const offerApprovals =
    safeCandidate.offerApprovals ||
    safeCandidate.approvals ||
    safeCandidate.offer_approvals ||
    {};

  return {
    ...safeCandidate,

    dbId:
      safeCandidate.dbId ||
      safeCandidate.pipelineDbId ||
      safeCandidate.candidatePipelineId ||
      safeCandidate.rawId ||
      safeCandidate.id,

    pipelineDbId:
      safeCandidate.pipelineDbId ||
      safeCandidate.dbId ||
      safeCandidate.candidatePipelineId ||
      safeCandidate.rawId ||
      safeCandidate.id,

    rawId: safeCandidate.rawId || safeCandidate.id,

    id: safeCandidate.id,

    candidateId:
      safeCandidate.candidateId ||
      safeCandidate.candidate_id ||
      safeCandidate.candidate_code ||
      "",

    candidateApplicationId:
      safeCandidate.candidateApplicationId ||
      safeCandidate.applicationId ||
      safeCandidate.candidate_application_id ||
      "",

    applicationId:
      safeCandidate.applicationId ||
      safeCandidate.candidateApplicationId ||
      safeCandidate.candidate_application_id ||
      "",

    sourceTalentPoolId:
      safeCandidate.sourceTalentPoolId || safeCandidate.source_talent_pool_id,

    candidateName,
    name: candidateName,

    candidateEmail,
    email: candidateEmail,

    status: status === "Offered" ? "For Review" : status || "For Review",

    currentStage,
    currentPipelineStage: currentStage,
    stage: currentStage,
    pipelineStage: currentStage,

    roleTitle,
    currentAppliedRole: safeCandidate.currentAppliedRole || roleTitle,
    openPosition: safeCandidate.openPosition || roleTitle,
    roleCapability: safeCandidate.roleCapability || roleTitle,

    account,
    currentAppliedAccount: safeCandidate.currentAppliedAccount || account,
    leadAccount: safeCandidate.leadAccount || account,
    accountFit: safeCandidate.accountFit || account,

    roleAccount:
      safeCandidate.roleAccount ||
      safeCandidate.role_account ||
      [roleTitle, account].filter(Boolean).join(" / ") ||
      "Not assigned yet",

    hiringRequirementId:
      offerDetails.hiringRequirementId ||
      safeCandidate.hiringRequirementId ||
      safeCandidate.hiringRequirement ||
      "",

    basicPay: offerDetails.basicPay || safeCandidate.basicPay || "",
    deminimisDailyRate:
      offerDetails.deminimisDailyRate ||
      safeCandidate.deminimisDailyRate ||
      safeCandidate.deminimis ||
      "",

    offerDetails: {
      ...offerDetails,
      roleTitle,
      finalRole: offerDetails.finalRole || roleTitle,
      account,
      finalAccount: offerDetails.finalAccount || account,
      hiringRequirementId:
        offerDetails.hiringRequirementId ||
        safeCandidate.hiringRequirementId ||
        safeCandidate.hiringRequirement ||
        "",
      basicPay: offerDetails.basicPay || safeCandidate.basicPay || "",
      deminimisDailyRate:
        offerDetails.deminimisDailyRate ||
        safeCandidate.deminimisDailyRate ||
        safeCandidate.deminimis ||
        "",
    },

    offerApprovals,
    approvals: offerApprovals,

    offerApprovalStatus,
    approvalStatus: offerApprovalStatus,

    offerDecision:
      safeCandidate.offerDecision ||
      safeCandidate.candidateResponse ||
      safeCandidate.offer_decision ||
      "",

    candidateResponse:
      safeCandidate.candidateResponse ||
      safeCandidate.offerDecision ||
      safeCandidate.offer_decision ||
      "Pending",

    offerEmailSent: Boolean(
      safeCandidate.offerEmailSent ||
        safeCandidate.offer_email_sent ||
        safeCandidate.contractSent,
    ),

    offerEmailSentAt:
      safeCandidate.offerEmailSentAt ||
      safeCandidate.offer_email_sent_at ||
      safeCandidate.contractSentAt ||
      "",

    owner:
      safeCandidate.owner ||
      safeCandidate.currentTaOwner ||
      safeCandidate.current_ta_owner ||
      safeCandidate.taOwner ||
      safeCandidate.updatedBySibsId ||
      safeCandidate.updated_by_sibs_id ||
      safeCandidate.createdBySibsId ||
      safeCandidate.created_by_sibs_id ||
      "—",
  };
}

function dedupeCandidates(candidates = []) {
  const map = new Map();

  safeArray(candidates).forEach((candidate) => {
    const normalizedCandidate = normalizeCandidateForOffers(candidate);
    const key = getMergedCandidateKey(normalizedCandidate);

    if (!key) return;

    const existing = map.get(key);

    map.set(key, {
      ...(existing || {}),
      ...normalizedCandidate,
      offerDetails: {
        ...(existing?.offerDetails || {}),
        ...(normalizedCandidate.offerDetails || {}),
      },
      offerApprovals: {
        ...(existing?.offerApprovals || {}),
        ...(normalizedCandidate.offerApprovals || {}),
      },
      approvals: {
        ...(existing?.approvals || {}),
        ...(normalizedCandidate.approvals || {}),
      },
    });
  });

  return Array.from(map.values());
}

function extractCandidatesFromResponse(response) {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.candidates)) return payload.candidates;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.records)) return payload.records;

  if (Array.isArray(payload?.data?.candidates)) return payload.data.candidates;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.records)) return payload.data.records;

  return [];
}

function isOfferStageCandidate(candidate = {}) {
  const normalizedCandidate = normalizeCandidateForOffers(candidate);
  const stage = getCandidateStage(normalizedCandidate);
  const rawStatus = getCandidateStatus(candidate);
  const normalizedStatus = getCandidateStatus(normalizedCandidate);
  const directApprovalStatus = getDirectOfferApprovalStatus(normalizedCandidate);
  const decisionStatus = getOfferDecisionStatus(normalizedCandidate);

  const excludedStages = [
    "Initial Screening",
    "Online Assessment",
    "Assessment Fit",
    "Interview Scheduled",
    "Interviewed",
    "Accepted",
    "For NHO",
    "For Onboarding - Incomplete Requirements",
    "Onboarding",
    "Hired / Active",
    "Drop-off",
    "Drop-offs",
  ];

  if (isTerminalOfferApprovalStatus(directApprovalStatus)) return false;
  if (isTerminalOfferApprovalStatus(decisionStatus)) return false;
  if (excludedStages.includes(stage)) return false;

  if (stage === "Offered") return true;

  if (!stage) {
    if (rawStatus === "Offered") return true;
    if (normalizedStatus === "Offered") return true;
  }

  return false;
}

function shouldDisplayOfferRecord(offer = {}, approvalUsers = []) {
  if (!isOfferStageCandidate(offer)) return false;

  const approvalStatus = getOfferApprovalSummaryFromUsers(offer, approvalUsers);

  return !isTerminalOfferApprovalStatus(approvalStatus);
}

function updateCandidateStorageFromOffer(updatedOffer) {
  const payload = buildPipelineOfferPayload(updatedOffer);

  [PIPELINE_CANDIDATES_STORAGE_KEY, OFFER_ELIGIBLE_STORAGE_KEY].forEach(
    (key) => {
      const current = safeReadArray(key);

      if (!current.length) return;

      const offerKey = getCandidateKey(payload);
      const candidateEmail = cleanText(payload.candidateEmail || "")
        .toLowerCase()
        .trim();

      const next = current.map((candidate) => {
        const candidateKey = getCandidateKey(candidate);

        const emailMatch =
          candidateEmail &&
          cleanText(candidate.candidateEmail || candidate.email || "")
            .toLowerCase()
            .trim() === candidateEmail;

        if (candidateKey !== offerKey && !emailMatch) {
          return candidate;
        }

        return {
          ...candidate,
          ...payload,
          offerDetails: {
            ...(candidate.offerDetails || {}),
            ...(payload.offerDetails || {}),
          },
          offerApprovals: {
            ...(candidate.offerApprovals || {}),
            ...(payload.offerApprovals || {}),
          },
          approvals: {
            ...(candidate.approvals || {}),
            ...(payload.offerApprovals || {}),
          },
        };
      });

      safeWriteArray(key, next);
    },
  );
}

export function OffersProvider({ children }) {
  const { user } = useUser();

  const { candidateList = [], updateCandidateFromOffer } =
    useCandidatePipeline() || {};

  const { confirmAction, ConfirmationDialog } = useConfirmDialog();

  const currentUserName = useMemo(() => getCurrentUserName(user), [user]);

  const currentUserSibsId = useMemo(() => getCurrentUserSibsId(user), [user]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [accountFilter, setAccountFilter] = useState("All Accounts");
  const [selectedOffer, setSelectedOffer] = useState(null);

  const [offerOverrides, setOfferOverrides] = useState(() =>
    readOfferOverrides(),
  );

  const [approvalUsers, setApprovalUsers] = useState([]);
  const [approvalUsersLoading, setApprovalUsersLoading] = useState(false);

  const [apiCandidates, setApiCandidates] = useState([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [offersLoadError, setOffersLoadError] = useState("");
  const [storageSyncTick, setStorageSyncTick] = useState(0);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  function openStatusModal({ type = "success", title = "", message = "" }) {
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

  const refreshOffers = useCallback(async () => {
    setIsLoadingOffers(true);
    setOffersLoadError("");

    try {
      const response = await getCandidatePipelineCandidates({
        page: 1,
        limit: 500,
        _t: Date.now(),
      });

      const candidates = extractCandidatesFromResponse(response).map(
        normalizeCandidateForOffers,
      );

      const offeredCandidates = candidates.filter(isOfferStageCandidate);

      setApiCandidates(candidates);

      safeWriteArray(PIPELINE_CANDIDATES_STORAGE_KEY, candidates);
      safeWriteArray(OFFER_ELIGIBLE_STORAGE_KEY, offeredCandidates);

      setStorageSyncTick((previous) => previous + 1);

      return candidates;
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Failed to load offered candidates from Candidate Pipeline.",
      );

      console.error("Load offers from Candidate Pipeline error:", error);

      setOffersLoadError(message);

      return [];
    } finally {
      setIsLoadingOffers(false);
    }
  }, []);

  async function loadApprovalUsers() {
    try {
      setApprovalUsersLoading(true);

      const response = await fetchOfferApprovalUsers();

      const rows = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.users)
          ? response.users
          : [];

      setApprovalUsers(rows.map(normalizeApprovalUser));
    } catch (error) {
      console.error("Load offer approval users error:", error);

      setApprovalUsers([]);

      openStatusModal({
        type: "error",
        title: "Approval Users Not Loaded",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load offer approval users from database.",
      });
    } finally {
      setApprovalUsersLoading(false);
    }
  }

  useEffect(() => {
    loadApprovalUsers();
    refreshOffers();
  }, [refreshOffers]);

  useEffect(() => {
    function handleSyncEvent() {
      setOfferOverrides(readOfferOverrides());
      setStorageSyncTick((previous) => previous + 1);
      refreshOffers();
    }

    window.addEventListener("storage", handleSyncEvent);
    window.addEventListener("focus", handleSyncEvent);
    window.addEventListener("ta-pipeline-candidates-updated", handleSyncEvent);
    window.addEventListener("ta-offers-updated", handleSyncEvent);

    return () => {
      window.removeEventListener("storage", handleSyncEvent);
      window.removeEventListener("focus", handleSyncEvent);
      window.removeEventListener(
        "ta-pipeline-candidates-updated",
        handleSyncEvent,
      );
      window.removeEventListener("ta-offers-updated", handleSyncEvent);
    };
  }, [refreshOffers]);

  const currentApprovalUser = useMemo(() => {
    return findCurrentApprovalUser({
      approvalUsers,
      currentUserName,
      currentUserSibsId,
    });
  }, [approvalUsers, currentUserName, currentUserSibsId]);

  const sourceCandidates = useMemo(() => {
    return dedupeCandidates([
      ...getStoredPipelineCandidates(),
      ...safeArray(candidateList),
      ...safeArray(apiCandidates),
    ]);
  }, [apiCandidates, candidateList, storageSyncTick]);

  const offerList = useMemo(() => {
    const overrideMap = new Map(
      offerOverrides.map((offer) => [getCandidateKey(offer), offer]),
    );

    return sourceCandidates
      .map((candidate, index) => {
        const normalizedCandidate = normalizeCandidateForOffers(candidate);

        if (!isOfferStageCandidate(normalizedCandidate)) {
          return null;
        }

        const override =
          overrideMap.get(getCandidateKey(normalizedCandidate)) || {};

        const normalizedOffer = normalizePipelineCandidateToOffer(
          normalizedCandidate,
          index,
          override,
        );

        return normalizeCandidateForOffers({
          ...normalizedCandidate,
          ...normalizedOffer,
          currentStage: normalizedCandidate.currentStage,
          currentPipelineStage: normalizedCandidate.currentStage,
          stage: normalizedCandidate.currentStage,
          pipelineStage: normalizedCandidate.currentStage,
          offerDetails: {
            ...(normalizedCandidate.offerDetails || {}),
            ...(normalizedOffer.offerDetails || {}),
          },
          offerApprovals: {
            ...(normalizedCandidate.offerApprovals || {}),
            ...(normalizedOffer.offerApprovals || {}),
          },
          approvals: {
            ...(normalizedCandidate.approvals || {}),
            ...(normalizedOffer.approvals || {}),
          },
        });
      })
      .filter(Boolean)
      .filter((offer) => shouldDisplayOfferRecord(offer, approvalUsers));
  }, [approvalUsers, offerOverrides, sourceCandidates]);

  function getOfferApprovalStatus(offer = {}) {
    return getOfferApprovalSummaryFromUsers(offer, approvalUsers);
  }

  const filteredOffers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return offerList.filter((offer) => {
      const approvalStatus = getOfferApprovalStatus(offer);

      const offerDetails = safeObject(offer.offerDetails);

      const matchesSearch =
        !keyword ||
        String(offer.offerId || "")
          .toLowerCase()
          .includes(keyword) ||
        String(offer.candidateName || offer.name || "")
          .toLowerCase()
          .includes(keyword) ||
        String(offer.roleTitle || offerDetails.roleTitle || "")
          .toLowerCase()
          .includes(keyword) ||
        String(offer.account || offerDetails.account || "")
          .toLowerCase()
          .includes(keyword) ||
        String(offer.hiringRequirementId || "")
          .toLowerCase()
          .includes(keyword) ||
        String(offerDetails.hiringRequirementId || "")
          .toLowerCase()
          .includes(keyword) ||
        String(offer.owner || "")
          .toLowerCase()
          .includes(keyword);

      const matchesStatus =
        statusFilter === "All Status" || approvalStatus === statusFilter;

      const matchesAccount =
        accountFilter === "All Accounts" ||
        offer.account === accountFilter ||
        offerDetails.account === accountFilter;

      return matchesSearch && matchesStatus && matchesAccount;
    });
  }, [accountFilter, approvalUsers, offerList, search, statusFilter]);

  const stats = useMemo(() => {
    const total = offerList.length;

    const forReview = offerList.filter(
      (offer) => getOfferApprovalStatus(offer) === "For Review",
    ).length;

    const approved = offerList.filter(
      (offer) => getOfferApprovalStatus(offer) === "Approved",
    ).length;

    const contractSent = offerList.filter(
      (offer) =>
        offer.status === "Contract Sent" ||
        offer.offerEmailSent ||
        offer.contractSent,
    ).length;

    const accepted = offerList.filter(
      (offer) =>
        offer.status === "Accepted" ||
        offer.currentStage === "Accepted" ||
        offer.stage === "Accepted" ||
        offer.pipelineStage === "Accepted" ||
        offer.offerDecision === "Accepted" ||
        offer.candidateResponse === "Accepted",
    ).length;

    const declined = offerList.filter(
      (offer) =>
        getOfferApprovalStatus(offer) === "Rejected" ||
        offer.status === "Declined" ||
        offer.status === "Rejected" ||
        offer.offerDecision === "Declined" ||
        offer.offerDecision === "Rejected" ||
        offer.candidateResponse === "Declined" ||
        offer.candidateResponse === "Rejected",
    ).length;

    const acceptanceRate = total ? Math.round((accepted / total) * 100) : 0;

    return {
      total,
      forReview,
      approved,
      contractSent,
      accepted,
      declined,
      acceptanceRate,
    };
  }, [approvalUsers, offerList]);

  function appendPipelineSyncEvent(event) {
    const current = safeReadArray(PIPELINE_SYNC_EVENTS_KEY);
    safeWriteArray(PIPELINE_SYNC_EVENTS_KEY, [event, ...current]);
  }

  function removeOfferFromLocalSources(offerToRemove = {}) {
    if (!offerToRemove || typeof offerToRemove !== "object") return;

    setOfferOverrides((previous) =>
      previous.filter((offer) => !isSameOfferRecord(offer, offerToRemove)),
    );

    setApiCandidates((previous) =>
      previous.filter(
        (candidate) => !isSameOfferRecord(candidate, offerToRemove),
      ),
    );

    setSelectedOffer((previous) =>
      previous && isSameOfferRecord(previous, offerToRemove) ? null : previous,
    );

    safeWriteArray(
      OFFER_RECORDS_STORAGE_KEY,
      readOfferOverrides().filter(
        (offer) => !isSameOfferRecord(offer, offerToRemove),
      ),
    );

    safeWriteArray(
      OFFER_ELIGIBLE_STORAGE_KEY,
      safeReadArray(OFFER_ELIGIBLE_STORAGE_KEY).filter(
        (offer) => !isSameOfferRecord(offer, offerToRemove),
      ),
    );

    safeWriteArray(
      PIPELINE_CANDIDATES_STORAGE_KEY,
      safeReadArray(PIPELINE_CANDIDATES_STORAGE_KEY).filter(
        (candidate) => !isSameOfferRecord(candidate, offerToRemove),
      ),
    );

    setStorageSyncTick((previous) => previous + 1);

    window.dispatchEvent(
      new CustomEvent("ta-offers-updated", {
        detail: {
          removed: true,
          offer: offerToRemove,
        },
      }),
    );
  }

  function updateOffer(updatedOffer) {
    const payload = buildPipelineOfferPayload(updatedOffer);

    if (!shouldDisplayOfferRecord(updatedOffer, approvalUsers)) {
      updateCandidateFromOffer?.(payload);
      removeOfferFromLocalSources(updatedOffer);
      return;
    }

    writeOfferOverride(updatedOffer);
    updateCandidateStorageFromOffer(updatedOffer);

    updateCandidateFromOffer?.(payload);

    setOfferOverrides((prev) => {
      const updatedKey = getCandidateKey(updatedOffer);

      const exists = prev.some(
        (offer) => getCandidateKey(offer) === updatedKey,
      );

      return exists
        ? prev.map((offer) =>
            getCandidateKey(offer) === updatedKey ? updatedOffer : offer,
          )
        : [updatedOffer, ...prev];
    });

    setSelectedOffer((prev) =>
      prev && getCandidateKey(prev) === getCandidateKey(updatedOffer)
        ? updatedOffer
        : prev,
    );

    window.dispatchEvent(
      new CustomEvent("ta-offers-updated", {
        detail: updatedOffer,
      }),
    );
  }

  function canCurrentUserApproveOffer() {
    return Boolean(
      currentApprovalUser?.sibsId || currentApprovalUser?.displayName,
    );
  }

  async function handleApproval(offer, status) {
    if (approvalUsersLoading) {
      openStatusModal({
        type: "error",
        title: "Please Wait",
        message: "Approval users are still loading. Please try again.",
      });

      return;
    }

    if (!approvalUsers.length) {
      openStatusModal({
        type: "error",
        title: "No Approval Users",
        message:
          "No approval users are configured. Add approval users in Recruitment Settings first.",
      });

      return;
    }

    if (!canCurrentUserApproveOffer()) {
      openStatusModal({
        type: "error",
        title: "Not Allowed",
        message: "You are not allowed to approve or reject offers.",
      });

      return;
    }

    const action = status === "Approved" ? "approve" : "reject";

    const confirmed = await confirmAction(
      `You will ${action} the offer for ${offer.candidateName}. Continue?`,
      {
        title: status === "Approved" ? "Approve Offer" : "Reject Offer",
        confirmText: status === "Approved" ? "Approve" : "Reject",
        variant: status === "Approved" ? "default" : "danger",
      },
    );

    if (!confirmed) return;

    const approverKey = getApprovalUserLabel(currentApprovalUser);

    const updatedApprovals = {
      ...(offer.approvals || offer.offerApprovals || {}),
      [approverKey]: {
        status,
        updatedAt: getCurrentTimestamp(),
        updatedBy: currentUserName,
        approverSibsId: currentApprovalUser?.sibsId || currentUserSibsId,
        remarks: `Updated by ${currentUserName}`,
      },
    };

    const nextApprovalStatus = getOfferApprovalSummaryFromUsers(
      {
        ...offer,
        approvals: updatedApprovals,
        offerApprovals: updatedApprovals,
      },
      approvalUsers,
    );

    const nextStage =
      nextApprovalStatus === "Approved" ? "Accepted" : "Offered";

    const nextCandidateResponse =
      nextApprovalStatus === "Approved" ? "Accepted" : "Pending";

    try {
      const pipelineRecordId = getCandidatePipelineRecordId(offer);

      if (!pipelineRecordId) {
        throw new Error("Candidate pipeline record ID was not found.");
      }

      const response = await updateCandidatePipelineOfferApproval(
        pipelineRecordId,
        {
          approver: approverKey,
          approvedBy: approverKey,
          status,
          approvalStatus: status,
          remarks: `Updated by ${currentUserName}`,
        },
      );

      if (response?.success === false) {
        throw new Error(response?.message || "Failed to update offer approval.");
      }

      const apiCandidate = response?.data || response?.candidate || null;

      const localUpdatedOffer = normalizePipelineCandidateToOffer(
        {
          ...offer,
          currentStage: nextStage,
          currentPipelineStage: nextStage,
          stage: nextStage,
          pipelineStage: nextStage,
          offerApprovals: updatedApprovals,
          approvals: updatedApprovals,
          offerApprovalStatus: nextApprovalStatus,
          offerDecision: nextCandidateResponse,
          candidateResponse: nextCandidateResponse,
          reasonForMovement:
            nextApprovalStatus === "Approved"
              ? `${currentUserName} approved the offer. Candidate moved from Offered to Accepted.`
              : `${currentUserName} rejected the offer.`,
        },
        0,
        {
          ...offer,
          currentStage: nextStage,
          currentPipelineStage: nextStage,
          stage: nextStage,
          pipelineStage: nextStage,
          approvals: updatedApprovals,
          offerApprovals: updatedApprovals,
          status: nextApprovalStatus,
          candidateResponse: nextCandidateResponse,
          offerDecision: nextCandidateResponse,
          reasonForMovement:
            nextApprovalStatus === "Approved"
              ? `${currentUserName} approved the offer. Candidate moved from Offered to Accepted.`
              : `${currentUserName} rejected the offer.`,
          remarks:
            nextApprovalStatus === "Approved"
              ? `${currentUserName} approved the offer. Candidate moved to Accepted.`
              : `${currentUserName} rejected the offer.`,
        },
      );

      const finalUpdatedOffer = apiCandidate
        ? normalizePipelineCandidateToOffer(
            normalizeCandidateForOffers(apiCandidate),
            0,
            localUpdatedOffer,
          )
        : localUpdatedOffer;

      updateOffer(finalUpdatedOffer);

      appendPipelineSyncEvent({
        syncId: `SYNC-${Date.now()}-${
          offer.candidateApplicationId || offer.candidateId || offer.offerId
        }-APPROVAL`,
        type: "offer_approval_update",
        candidateApplicationId: offer.candidateApplicationId,
        candidateId: offer.candidateId,
        candidateEmail: offer.candidateEmail,
        offerApprovals: updatedApprovals,
        offerApprovalStatus: nextApprovalStatus,
        approvalUsers,
        approvedOrRejectedBy: approverKey,
        approvalAction: status,
        currentStage: nextStage,
        currentPipelineStage: nextStage,
        stage: nextStage,
        pipelineStage: nextStage,
        offerDecision: nextCandidateResponse,
        candidateResponse: nextCandidateResponse,
        timestamp: getCurrentTimestamp(),
        reasonForMovement:
          nextApprovalStatus === "Approved"
            ? `${currentUserName} approved the offer. Candidate moved from Offered to Accepted.`
            : `${currentUserName} rejected the offer.`,
        owner: currentUserName,
        source: "Offers Page",
        remarks: `Updated by ${currentUserName}`,
      });

      await refreshOffers();

      window.dispatchEvent(new Event("ta-pipeline-candidates-updated"));

      openStatusModal({
        type: "success",
        title: status === "Approved" ? "Offer Approved" : "Offer Rejected",
        message:
          nextApprovalStatus === "Approved"
            ? "The offer was approved and the candidate was moved to Accepted."
            : nextApprovalStatus === "Rejected"
              ? "The offer was rejected successfully."
              : "Your offer approval update was saved.",
      });
    } catch (error) {
      console.error("Offer approval update error:", error);

      openStatusModal({
        type: "error",
        title: "Approval Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to update offer approval.",
      });
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("All Status");
    setAccountFilter("All Accounts");
  }

  const value = {
    offerList,
    filteredOffers,
    stats,

    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    accountFilter,
    setAccountFilter,

    selectedOffer,
    setSelectedOffer,

    clearFilters,
    handleApproval,
    ConfirmationDialog,

    currentUserName,
    currentUserSibsId,
    currentApprovalUser,

    approvalUsers,
    approvalUsersLoading,
    reloadApprovalUsers: loadApprovalUsers,

    canCurrentUserApproveOffer,
    getOfferApprovalStatus,
    getApprovalRecordForUser: (offer, approvalUser) =>
      getApprovalRecordForUser(getApprovalsObject(offer), approvalUser),

    isLoadingOffers,
    offersLoadError,
    refreshOffers,
  };

  return (
    <OffersContext.Provider value={value}>
      {children}

      <ConfirmationDialog />

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={closeStatusModal}
        variant="center"
        lockScroll
      />
    </OffersContext.Provider>
  );
}

export default OffersContext;