import React, {
  createContext,
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
  getOfferApprovalSummary,
  isOfferedCandidate,
  normalizePipelineCandidateToOffer,
} from "../../lib/utils/offers/offerHelpers";
import {
  canUserApproveOffer,
  getOfferApprovalUsers,
} from "../../lib/utils/offers/offerApprovalSettings";
import { useCandidatePipeline } from "./CandidatePipelineContext";

const OffersContext = createContext(null);

export function useOffers() {
  const context = useContext(OffersContext);

  if (!context) {
    throw new Error("useOffers must be used inside OffersProvider");
  }

  return context;
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

function updateCandidateStorageFromOffer(updatedOffer) {
  const payload = buildPipelineOfferPayload(updatedOffer);

  [PIPELINE_CANDIDATES_STORAGE_KEY, OFFER_ELIGIBLE_STORAGE_KEY].forEach(
    (key) => {
      const current = safeReadArray(key);

      if (!current.length) return;

      const offerKey = getCandidateKey(payload);
      const candidateEmail = String(payload.candidateEmail || "")
        .toLowerCase()
        .trim();

      const next = current.map((candidate) => {
        const candidateKey = getCandidateKey(candidate);

        const emailMatch =
          candidateEmail &&
          String(candidate.candidateEmail || candidate.email || "")
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
        };
      });

      safeWriteArray(key, next);
    },
  );
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
    currentUser?.gy_user_username;

  if (directName) {
    return String(directName).trim();
  }

  const lastName = String(currentUser?.lastName || "").trim();
  const firstName = String(currentUser?.firstName || "").trim();
  const middleName = String(currentUser?.middleName || "").trim();

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

export function OffersProvider({ children }) {
  const { user } = useUser();

  const { candidateList = [], updateCandidateFromOffer } =
    useCandidatePipeline() || {};

  const { confirmAction, ConfirmationDialog } = useConfirmDialog();

  const currentUserName = useMemo(() => getCurrentUserName(user), [user]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [accountFilter, setAccountFilter] = useState("All Accounts");
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [offerOverrides, setOfferOverrides] = useState(() =>
    readOfferOverrides(),
  );

  useEffect(() => {
    console.log("Current User:", currentUserName);
  }, [currentUserName]);

  const sourceCandidates = useMemo(() => {
    return candidateList.length ? candidateList : getStoredPipelineCandidates();
  }, [candidateList]);

  const offerList = useMemo(() => {
    const overrideMap = new Map(
      offerOverrides.map((offer) => [getCandidateKey(offer), offer]),
    );

    return sourceCandidates
      .map((candidate, index) => {
        const override = overrideMap.get(getCandidateKey(candidate)) || {};

        return normalizePipelineCandidateToOffer(candidate, index, override);
      })
      .filter(isOfferedCandidate);
  }, [offerOverrides, sourceCandidates]);

  const filteredOffers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return offerList.filter((offer) => {
      const matchesSearch =
        !keyword ||
        String(offer.offerId || "")
          .toLowerCase()
          .includes(keyword) ||
        String(offer.candidateName || "")
          .toLowerCase()
          .includes(keyword) ||
        String(offer.roleTitle || "")
          .toLowerCase()
          .includes(keyword) ||
        String(offer.account || "")
          .toLowerCase()
          .includes(keyword) ||
        String(offer.hiringRequirementId || "")
          .toLowerCase()
          .includes(keyword) ||
        String(offer.owner || "")
          .toLowerCase()
          .includes(keyword);

      const matchesStatus =
        statusFilter === "All Status" || offer.status === statusFilter;

      const matchesAccount =
        accountFilter === "All Accounts" || offer.account === accountFilter;

      return matchesSearch && matchesStatus && matchesAccount;
    });
  }, [accountFilter, offerList, search, statusFilter]);

  const stats = useMemo(() => {
    const total = offerList.length;

    const forReview = offerList.filter(
      (offer) => offer.status === "For Review",
    ).length;

    const approved = offerList.filter(
      (offer) => offer.status === "Approved",
    ).length;

    const contractSent = offerList.filter(
      (offer) => offer.status === "Contract Sent",
    ).length;

    const accepted = offerList.filter(
      (offer) =>
        offer.status === "Accepted" ||
        offer.currentStage === "Accepted" ||
        offer.stage === "Accepted" ||
        offer.pipelineStage === "Accepted",
    ).length;

    const declined = offerList.filter(
      (offer) => offer.status === "Declined" || offer.status === "Rejected",
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
  }, [offerList]);

  function appendPipelineSyncEvent(event) {
    const current = safeReadArray(PIPELINE_SYNC_EVENTS_KEY);
    safeWriteArray(PIPELINE_SYNC_EVENTS_KEY, [event, ...current]);
  }

  function updateOffer(updatedOffer) {
    const payload = buildPipelineOfferPayload(updatedOffer);

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
  }

  async function handleApproval(offer, status) {
    const approvalUsers = getOfferApprovalUsers();
    const currentUserCanApprove = canUserApproveOffer(currentUserName);

    if (!currentUserCanApprove) {
      alert("You are not allowed to approve or reject offers.");
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

    const updatedApprovals = {
      ...(offer.approvals || offer.offerApprovals || {}),
      [currentUserName]: {
        status,
        updatedAt: getCurrentTimestamp(),
        remarks: `Updated by ${currentUserName}`,
      },
    };

    const nextApprovalStatus = getOfferApprovalSummary({
      approvals: updatedApprovals,
    });

    const nextStage =
      nextApprovalStatus === "Approved" ? "Accepted" : "Offered";

    const nextCandidateResponse =
      nextApprovalStatus === "Approved" ? "Accepted" : "Pending";

    const updatedOffer = normalizePipelineCandidateToOffer(
      {
        ...offer,
        currentStage: nextStage,
        stage: nextStage,
        pipelineStage: nextStage,
        offerApprovals: updatedApprovals,
        offerApprovalStatus: nextApprovalStatus,
        offerDecision: nextCandidateResponse,
        candidateResponse: nextCandidateResponse,
      },
      0,
      {
        ...offer,
        currentStage: nextStage,
        stage: nextStage,
        pipelineStage: nextStage,
        approvals: updatedApprovals,
        offerApprovals: updatedApprovals,
        status: nextApprovalStatus,
        candidateResponse: nextCandidateResponse,
        offerDecision: nextCandidateResponse,
        remarks:
          nextApprovalStatus === "Approved"
            ? `${currentUserName} approved the offer. Candidate moved to Accepted.`
            : `${currentUserName} marked the offer as ${status}.`,
      },
    );

    updateOffer(updatedOffer);

    appendPipelineSyncEvent({
      syncId: `SYNC-${Date.now()}-${offer.candidateApplicationId}-APPROVAL`,
      type: "offer_approval_update",
      candidateApplicationId: offer.candidateApplicationId,
      candidateId: offer.candidateId,
      candidateEmail: offer.candidateEmail,
      offerApprovals: updatedApprovals,
      offerApprovalStatus: nextApprovalStatus,
      approvalUsers,
      approvedOrRejectedBy: currentUserName,
      approvalAction: status,
      currentStage: nextStage,
      stage: nextStage,
      pipelineStage: nextStage,
      offerDecision: nextCandidateResponse,
      candidateResponse: nextCandidateResponse,
      timestamp: getCurrentTimestamp(),
      reasonForMovement:
        nextApprovalStatus === "Approved"
          ? `${currentUserName} approved the offer. Candidate moved from Offered to Accepted.`
          : `${currentUserName} marked the offer as ${status}. Overall offer approval status: ${nextApprovalStatus}.`,
      owner: currentUserName,
      source: "Offers Page",
      remarks: `Updated by ${currentUserName}`,
    });
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
    canCurrentUserApproveOffer: canUserApproveOffer(currentUserName),
    approvalUsers: getOfferApprovalUsers(),
  };

  return (
    <OffersContext.Provider value={value}>{children}</OffersContext.Provider>
  );
}
