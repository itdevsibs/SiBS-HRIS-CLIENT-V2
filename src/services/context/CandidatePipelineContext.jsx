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
  isPrfReviewed,
  getRoleTitle,
  getAccount,
  getNextStage,
  canMoveToOnlineAssessment,
  canScheduleInterview,
  canUpdateInterviewSchedule,
  hasInterviewSchedule,
  getAssessmentResult,
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
} from "../../lib/utils/candidatePipeline/candidatePipelineHelpers";

import { useConfirmDialog } from "../../components/layout/common/ConfirmationModal";

const CandidatePipelineContext = createContext(null);

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

    const normalizedCandidates = baseCandidates.map(normalizeCandidate);

    setCandidateList(normalizedCandidates);
    savePipelineCandidateData(normalizedCandidates);
    setHasLoadedStorage(true);
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
      const event = syncEvents.find(
        (item) =>
          String(item.candidateApplicationId) ===
            String(candidate.candidateApplicationId || candidate.id) ||
          String(item.candidateId || "") ===
            String(candidate.candidateId || "") ||
          String(item.candidateEmail || "").toLowerCase() ===
            String(candidate.email || "").toLowerCase(),
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

        return normalizeCandidate({
          ...candidate,
          offerApprovals: event.offerApprovals || candidate.offerApprovals,
          offerApprovalStatus: approvalStatus,
          reasonForMovement:
            event.reasonForMovement ||
            `Offer approval status updated to ${approvalStatus}.`,
          timeline: [
            ...(candidate.timeline || []),
            {
              stage: "Offered",
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
        return normalizeCandidate({
          ...candidate,
          offerEmailSent: true,
          offerEmailSentAt: event.timestamp || getCurrentTimestamp(),
          reasonForMovement:
            event.reasonForMovement ||
            "Offer contract email was sent to the candidate.",
          timeline: [
            ...(candidate.timeline || []),
            {
              stage: "Offered",
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
        return normalizeCandidate({
          ...candidate,
          offerDecision: "Negotiate",
          offerDecisionAt: event.timestamp || getCurrentTimestamp(),
          reasonForMovement:
            event.reasonForMovement || "Candidate requested offer negotiation.",
          timeline: [
            ...(candidate.timeline || []),
            {
              stage: "Offered",
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
        return normalizeCandidate({
          ...candidate,
          previousStage: candidate.currentStage,
          currentStage: "Accepted",
          offerApprovalStatus: "Approved",
          offerEmailSent: true,
          offerDecision: "Accepted",
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
        return normalizeCandidate({
          ...candidate,
          previousStage: candidate.currentStage,
          currentStage: "Drop-off",
          offerDecision: "Rejected",
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

  function syncSelectedCandidate(updatedCandidate) {
    setSelectedCandidate((prev) =>
      prev?.id === updatedCandidate.id ? updatedCandidate : prev,
    );

    setMoveCandidate((prev) =>
      prev?.id === updatedCandidate.id ? updatedCandidate : prev,
    );

    setScheduleCandidate((prev) =>
      prev?.id === updatedCandidate.id ? updatedCandidate : prev,
    );

    setAssessmentCandidate((prev) =>
      prev?.id === updatedCandidate.id ? updatedCandidate : prev,
    );

    setOfferCandidate((prev) =>
      prev?.id === updatedCandidate.id ? updatedCandidate : prev,
    );
  }

  function updateCandidateRecord(updatedCandidate) {
    const normalizedCandidate = normalizeCandidate(updatedCandidate);

    setCandidateList((prev) => {
      const next = prev.map((candidate) =>
        candidate.id === normalizedCandidate.id
          ? normalizedCandidate
          : candidate,
      );

      savePipelineCandidateData(next);
      return next;
    });

    syncSelectedCandidate(normalizedCandidate);
    syncTalentPoolFromPipelineApplication(normalizedCandidate);
  }

  async function handleUpdatePrfStatus(candidate, nextPrfStatus) {
    if (
      !(await confirmAction(
        `Set PRF status of ${candidate.name} to ${nextPrfStatus}?`,
      ))
    ) {
      return;
    }

    const movementReason = `PRF status set to ${nextPrfStatus}.`;

    const updatedCandidate = {
      ...candidate,
      prfStatus: nextPrfStatus,
      prfReviewed: true,
      prfReviewedAt: getCurrentTimestamp(),
      currentStage: "Initial Screening",
      interviewDate: null,
      interviewType: "-",
      interviewStatus: "For Assessment",
      dateMoved: getCurrentDate(),
      reasonForMovement: movementReason,
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: "Initial Screening",
          owner: currentUserName,
          source: "PRF Review",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks: `Match Type: ${nextPrfStatus}`,
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
    setActiveStage("Initial Screening");
  }

  async function handleOpenScheduleInterview(candidate) {
    const isUpdatingSchedule = candidate.currentStage === "Interview Scheduled";

    if (!isUpdatingSchedule && !canScheduleInterview(candidate)) {
      alert(
        "Candidate must be Assessment Taken and Assessment Fit before interview scheduling.",
      );
      return;
    }

    if (isUpdatingSchedule && !canUpdateInterviewSchedule(candidate)) {
      alert("This interview schedule cannot be updated.");
      return;
    }

    setScheduleCandidate(candidate);
    setScheduleForm({
      interviewDate: isUpdatingSchedule
        ? toDateInputValue(candidate.interviewDate)
        : "",
      interviewType:
        isUpdatingSchedule && candidate.interviewType !== "-"
          ? candidate.interviewType
          : "",
      onlineInterviewLink:
        isUpdatingSchedule && candidate.interviewType === "Online"
          ? candidate.onlineInterviewLink || ""
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

    const isUpdatingSchedule =
      scheduleCandidate.currentStage === "Interview Scheduled";

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
        `${isUpdatingSchedule ? "Update" : "Save"} interview schedule for ${scheduleCandidate.name}?`,
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

      const updatedCandidate = {
        ...scheduleCandidate,
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
      };

      updateCandidateRecord(updatedCandidate);
      setSelectedCandidate(updatedCandidate);
      setActiveStage("Interview Scheduled");
      handleCloseScheduleInterview();
      return;
    }

    const movementReason =
      "Candidate passed online assessment. Interview schedule has been set and candidate moved to Interview Scheduled.";

    const updatedCandidate = {
      ...scheduleCandidate,
      previousStage: "Online Assessment",
      currentStage: "Interview Scheduled",
      dateMoved: getCurrentDate(),
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
    };

    updateCandidateRecord(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
    setActiveStage("Interview Scheduled");
    handleCloseScheduleInterview();
  }

  async function handleCancelInterview(candidate) {
    if (candidate.currentStage !== "Interview Scheduled") {
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

    const updatedCandidate = {
      ...candidate,
      currentStage: "Interview Scheduled",
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
          owner: candidate.owner,
          source: "Interview Cancellation",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks: cleanedReason,
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
    setActiveStage("Interview Scheduled");
  }

  async function handleCompleteInterview(candidate) {
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

    const shouldMoveToInterviewed =
      candidate.currentStage === "Interview Scheduled";

    const movementReason = shouldMoveToInterviewed
      ? "Interview completed. Candidate moved from Interview Scheduled to Interviewed."
      : "Interview marked as completed.";

    const updatedCandidate = {
      ...candidate,
      previousStage: shouldMoveToInterviewed
        ? "Interview Scheduled"
        : candidate.previousStage,
      currentStage: shouldMoveToInterviewed
        ? "Interviewed"
        : candidate.currentStage,
      dateMoved: shouldMoveToInterviewed
        ? getCurrentDate()
        : candidate.dateMoved,
      interviewStatus: "Completed",
      reasonForMovement: movementReason,
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: shouldMoveToInterviewed
            ? "Interviewed"
            : candidate.currentStage,
          owner: currentUserName,
          source: "Interview",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
        },
      ],
    };

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

    const updatedCandidate = {
      ...candidate,
      interviewNotes: String(notes || "").trim(),
      interviewNotesUpdatedAt: getCurrentTimestamp(),
      interviewNotesUpdatedBy: currentUserName,
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: candidate.currentStage,
          owner: currentUserName,
          source: "Interview Notes",
          timestamp: getCurrentTimestamp(),
          reason: "TA interview notes were updated.",
          remarks: String(notes || "").trim(),
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
  }

  async function handleOpenOfferModal(candidate) {
    if (candidate.currentStage !== "Interviewed") {
      alert(
        "Offer details can only be prepared after the interview is completed.",
      );
      return;
    }

    const offerDetails = candidate.offerDetails || {};
    const currentRoleTitle = getRoleTitle(candidate.roleAccount);
    const currentAccount = getAccount(candidate.roleAccount);

    setOfferCandidate(candidate);
    setOfferForm({
      hiringRequirementId:
        offerDetails.hiringRequirementId || candidate.hiringRequirementId || "",
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
      "Interview completed. Offer details prepared and sent for approval of Raul Nadela and Haasanor.";

    const updatedCandidate = {
      ...offerCandidate,
      previousStage: offerCandidate.currentStage,
      currentStage: "Offered",
      dateMoved: getCurrentDate(),
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
      offerApprovals: {
        "Raul Nadela": { status: "For Review", updatedAt: null, remarks: "" },
        Haasanor: { status: "For Review", updatedAt: null, remarks: "" },
      },
      offerApprovalStatus: "For Review",
      offerEmailSent: false,
      offerEmailSentAt: null,
      offerDecision: "",
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
            `Hiring Requirement: ${offerForm.hiringRequirementId}, Final Role: ${offerForm.roleTitle}, Final Account: ${offerForm.account}, Basic Pay: ${formatCurrency(offerForm.basicPay)}, Deminimis / Daily Rate: ${formatCurrency(offerForm.deminimisDailyRate)}`,
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);
    upsertOfferEligibleCandidate(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
    setActiveStage("Offered");
    handleCloseOfferModal();
  }

  async function handleOpenMoveModal(candidate) {
    const nextStage = getNextStage(candidate.currentStage);

    if (!nextStage) return;

    if (candidate.currentStage === "Initial Screening") {
      if (!canMoveToOnlineAssessment(candidate)) {
        alert("Only PRF Matched candidates can move to Online Assessment.");
        return;
      }
    }

    if (candidate.currentStage === "Online Assessment") {
      handleOpenScheduleInterview(candidate);
      return;
    }

    if (nextStage === "Offered") {
      handleOpenOfferModal(candidate);
      return;
    }

    setMoveCandidate(candidate);
    setMoveForm({
      reason:
        nextStage === "Online Assessment"
          ? "PRF matched. Candidate moved from Initial Screening to Online Assessment and assessment email will be sent."
          : `Candidate moved from ${candidate.currentStage} to ${nextStage}.`,
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

    const nextStage = getNextStage(moveCandidate.currentStage);

    if (!nextStage) {
      alert("This candidate cannot be moved forward.");
      return;
    }

    if (moveCandidate.currentStage === "Initial Screening") {
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
        `Move ${moveCandidate.name} from ${moveCandidate.currentStage} to ${nextStage}?`,
      ))
    ) {
      return;
    }

    const movingToOnlineAssessment = nextStage === "Online Assessment";
    const movingToOffered = nextStage === "Offered";
    const movementReason = moveForm.reason.trim();

    const updatedCandidate = {
      ...moveCandidate,
      previousStage: moveCandidate.currentStage,
      currentStage: nextStage,
      dateMoved: getCurrentDate(),
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
        ...(moveCandidate.timeline || []),
        {
          stage: nextStage,
          owner: currentUserName,
          source: movingToOnlineAssessment
            ? "Online Assessment"
            : moveCandidate.source,
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks: movingToOnlineAssessment
            ? moveForm.remarks.trim() ||
              "Assessment email has been triggered to the candidate."
            : moveForm.remarks.trim(),
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);

    if (movingToOnlineAssessment) {
      await triggerAssessmentEmail(updatedCandidate);
      setActiveStage("Online Assessment");
    }

    if (movingToOffered) {
      upsertOfferEligibleCandidate(updatedCandidate);
    } else {
      removeOfferEligibleCandidate(updatedCandidate);
    }

    setSelectedCandidate(updatedCandidate);
    handleCloseMoveModal();
  }

  async function handleOpenAssessmentModal(candidate) {
    if (candidate.currentStage !== "Online Assessment") {
      alert("Assessment update is only available in Online Assessment stage.");
      return;
    }

    setAssessmentCandidate(candidate);
    setAssessmentForm({
      assessmentStatus: candidate.assessmentStatus || "Not Take",
      assessmentResult: candidate.assessmentResult || "",
      assessmentRemarks: candidate.assessmentRemarks || "",
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

    const updatedCandidate = {
      ...candidate,
      assessmentEmailSent: true,
      assessmentEmailSentAt: getCurrentTimestamp(),
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: candidate.currentStage,
          owner: currentUserName,
          source: "Online Assessment",
          timestamp: getCurrentTimestamp(),
          reason: "Assessment email was sent to the candidate.",
          remarks: buildAssessmentLink(candidate),
        },
      ],
    };

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

    const updatedCandidate = {
      ...assessmentCandidate,
      assessmentStatus: assessmentForm.assessmentStatus,
      assessmentResult: isTaken ? assessmentForm.assessmentResult : "",
      assessmentRemarks: assessmentForm.assessmentRemarks.trim(),
      assessmentTakenAt: isTaken ? getCurrentTimestamp() : null,
      assessmentTaggedAt: isTaken ? getCurrentTimestamp() : null,
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
        },
      ],
    };

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

    const movementReason = `Candidate moved from ${dropOffCandidate.currentStage} to Drop-off. Reason: ${dropOffForm.reason.trim()}`;

    const updatedCandidate = {
      ...dropOffCandidate,
      previousStage: dropOffCandidate.currentStage,
      currentStage: "Drop-off",
      dateMoved: getCurrentDate(),
      reasonForMovement: movementReason,
      dropOffCategory: dropOffForm.category.trim(),
      dropOffReason: dropOffForm.reason.trim(),
      dropOffRemarks: dropOffForm.remarks.trim(),
      timeline: [
        ...(dropOffCandidate.timeline || []),
        {
          stage: "Drop-off",
          owner: currentUserName,
          source: dropOffCandidate.source,
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          dropOffReason: dropOffForm.reason.trim(),
          dropOffCategory: dropOffForm.category.trim(),
          remarks: dropOffForm.remarks.trim(),
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);
    removeOfferEligibleCandidate(dropOffCandidate);
    setSelectedCandidate(updatedCandidate);
    handleCloseDropOffModal();
  }

  async function handleUpdateOfferApproval(candidate, approver, status) {
    if (candidate.currentStage !== "Offered") return;

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

    const movementReason = `${approver} tagged the offer as ${status}. Overall offer approval status: ${approvalSummary}.`;

    const updatedCandidate = {
      ...candidate,
      offerApprovals: nextApprovals,
      offerApprovalStatus: approvalSummary,
      reasonForMovement: movementReason,
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: "Offered",
          owner: approver,
          source: "Offer Approval",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);
    upsertOfferEligibleCandidate(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
  }

  async function handleSendOfferEmail(candidate) {
    if (!isOfferApproved(candidate)) {
      alert(
        "Offer must be approved by Raul Nadela and Haasanor before sending the contract email.",
      );
      return;
    }

    if (
      !(await confirmAction(`Send offer contract email for ${candidate.name}?`))
    ) {
      return;
    }

    const movementReason =
      "Offer contract email was sent to the lead for contract review and response.";

    const updatedCandidate = {
      ...candidate,
      offerEmailSent: true,
      offerEmailSentAt: getCurrentTimestamp(),
      reasonForMovement: movementReason,
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: "Offered",
          owner: currentUserName,
          source: "Offer Contract",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks: buildOfferContractLink(candidate),
        },
      ],
    };

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

    if (decision === "Accepted") {
      const movementReason =
        "Lead accepted the offer contract. Candidate moved to Accepted.";

      const updatedCandidate = {
        ...candidate,
        previousStage: "Offered",
        currentStage: "Accepted",
        dateMoved: getCurrentDate(),
        offerDecision: "Accepted",
        offerDecisionAt: getCurrentTimestamp(),
        reasonForMovement: movementReason,
        timeline: [
          ...(candidate.timeline || []),
          {
            stage: "Accepted",
            owner: candidate.owner,
            source: "Offer Contract",
            timestamp: getCurrentTimestamp(),
            reason: movementReason,
          },
        ],
      };

      updateCandidateRecord(updatedCandidate);
      upsertOfferEligibleCandidate(updatedCandidate);
      setSelectedCandidate(updatedCandidate);
      setActiveStage("Accepted");
      return;
    }

    if (decision === "Rejected") {
      const movementReason =
        "Lead rejected the offer contract. Candidate moved to Drop-off.";

      const updatedCandidate = {
        ...candidate,
        previousStage: "Offered",
        currentStage: "Drop-off",
        dateMoved: getCurrentDate(),
        offerDecision: "Rejected",
        offerDecisionAt: getCurrentTimestamp(),
        reasonForMovement: movementReason,
        dropOffCategory: "Compensation",
        dropOffReason: "Candidate rejected the offer contract.",
        dropOffRemarks: "Offer response: Rejected",
        timeline: [
          ...(candidate.timeline || []),
          {
            stage: "Drop-off",
            owner: candidate.owner,
            source: "Offer Contract",
            timestamp: getCurrentTimestamp(),
            reason: movementReason,
            remarks: "Offer response: Rejected",
          },
        ],
      };

      updateCandidateRecord(updatedCandidate);
      upsertOfferRecordFromPipeline(updatedCandidate);
      removeOfferEligibleCandidate(updatedCandidate);
      setSelectedCandidate(updatedCandidate);
      setActiveStage("Drop-off");
      return;
    }

    const movementReason = "Lead requested offer negotiation.";

    const updatedCandidate = {
      ...candidate,
      offerDecision: "Negotiate",
      offerDecisionAt: getCurrentTimestamp(),
      reasonForMovement: movementReason,
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: "Offered",
          owner: currentUserName,
          source: "Offer Contract",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);
    upsertOfferEligibleCandidate(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
  }

  function handleResetSampleData() {
    localStorage.removeItem(CANDIDATE_APPLICATIONS_STORAGE_KEY);
    localStorage.removeItem(PIPELINE_CANDIDATES_STORAGE_KEY);
    localStorage.removeItem(OFFER_ELIGIBLE_STORAGE_KEY);

    const normalizedCandidates =
      defaultPipelineCandidates.map(normalizeCandidate);

    setCandidateList(normalizedCandidates);
    savePipelineCandidateData(normalizedCandidates);
    setActiveStage("Initial Screening");
    setPageView("pipeline");
    setSelectedCandidate(null);

    confirmAction("Sample candidate pipeline data has been reset.", {
      title: "Reset Complete",
      confirmText: "OK",
      variant: "default",
    });
  }

  const filteredCandidates = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return candidateList.map(normalizeCandidate).filter((candidate) => {
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
      if (candidate.currentStage === "Initial Screening") {
        return isPrfReviewed(candidate);
      }

      if (candidate.currentStage === "Online Assessment") {
        return candidate.prfStatus === "Matched";
      }

      if (candidate.currentStage === "Interview Scheduled") {
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
        (candidate) => candidate.currentStage === stage,
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
      (candidate) => candidate.currentStage === activeStage,
    );
  }, [stageVisibleCandidates, activeStage]);

  const showStatusColumn = useMemo(() => {
    if (activeStage === "Online Assessment") return false;
    return true;
  }, [activeStage]);

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
