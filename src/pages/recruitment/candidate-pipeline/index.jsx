import React, { useEffect, useMemo, useState } from "react";
import Header from "../../../components/layout/Header";
import {
  UsersRound,
  Search,
  Columns3,
  Table2,
  Eye,
  UserCheck,
  UserX,
  BriefcaseBusiness,
  CheckCircle2,
  X,
  History,
  CalendarDays,
  UserRound,
  Tag,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { saveCandidateExperienceRecord } from "@/lib/utils/candidateExperienceStore";

const CANDIDATE_APPLICATIONS_STORAGE_KEY = "ta_candidate_applications";
const PIPELINE_CANDIDATES_STORAGE_KEY = "ta_pipeline_candidates";
const OFFER_ELIGIBLE_STORAGE_KEY = "ta_offer_eligible_candidates";
const PIPELINE_SYNC_EVENTS_KEY = "ta_pipeline_sync_events";
const PIPELINE_SYNC_BROWSER_EVENT = "ta-pipeline-sync-updated";

const defaultPipelineCandidates = [
  {
    id: 1,
    candidateApplicationId: 1,
    candidateId: "CAND-001",
    name: "Juan Dela Cruz",
    email: "juan.delacruz@email.com",
    roleAccount: "CSR - SIBS",
    source: "LinkedIn",
    owner: "Maria Reyes",
    currentStage: "Sourced",
    previousStage: null,
    dateMoved: "2026-05-01",
    reasonForMovement: "Initial candidate entry from LinkedIn sourcing.",
    dropOffReason: null,
    dropOffCategory: null,
    timeline: [
      {
        stage: "Sourced",
        owner: "Maria Reyes",
        source: "LinkedIn",
        timestamp: "2026-05-01 09:30 AM",
        reason: "Candidate sourced from LinkedIn.",
      },
    ],
  },
  {
    id: 2,
    candidateApplicationId: 2,
    candidateId: "CAND-002",
    name: "Carlo Reyes",
    email: "carlo.reyes@email.com",
    roleAccount: "RCM Analyst - SIBS",
    source: "Referral",
    owner: "John Dela Cruz",
    currentStage: "Screened",
    previousStage: "Sourced",
    dateMoved: "2026-05-02",
    reasonForMovement: "Passed initial resume screening.",
    dropOffReason: null,
    dropOffCategory: null,
    timeline: [
      {
        stage: "Sourced",
        owner: "John Dela Cruz",
        source: "Referral",
        timestamp: "2026-04-30 10:10 AM",
        reason: "Candidate referred by employee.",
      },
      {
        stage: "Screened",
        owner: "John Dela Cruz",
        source: "Referral",
        timestamp: "2026-05-02 02:30 PM",
        reason: "Passed initial screening.",
      },
    ],
  },
  {
    id: 3,
    candidateApplicationId: 3,
    candidateId: "CAND-003",
    name: "Mark Sy",
    email: "mark.sy@email.com",
    roleAccount: "IT Support - SIBS",
    source: "JobStreet",
    owner: "Kim Domingo",
    currentStage: "Interviewed",
    previousStage: "Screened",
    dateMoved: "2026-05-03",
    reasonForMovement: "Completed initial interview.",
    dropOffReason: null,
    dropOffCategory: null,
    timeline: [
      {
        stage: "Sourced",
        owner: "Kim Domingo",
        source: "JobStreet",
        timestamp: "2026-04-29 08:50 AM",
        reason: "Candidate applied through JobStreet.",
      },
      {
        stage: "Screened",
        owner: "Kim Domingo",
        source: "JobStreet",
        timestamp: "2026-05-01 01:20 PM",
        reason: "Qualified for interview.",
      },
      {
        stage: "Interviewed",
        owner: "Kim Domingo",
        source: "JobStreet",
        timestamp: "2026-05-03 04:00 PM",
        reason: "Interview completed.",
      },
    ],
  },
  {
    id: 4,
    candidateApplicationId: 4,
    candidateId: "CAND-004",
    name: "Kim Cruz",
    email: "kim.cruz@email.com",
    roleAccount: "CSR - SIBS",
    source: "Referral",
    owner: "Paul Garcia",
    currentStage: "Offered",
    previousStage: "Interviewed",
    dateMoved: "2026-05-04",
    reasonForMovement: "Passed final interview and moved to offer stage.",
    dropOffReason: null,
    dropOffCategory: null,
    timeline: [
      {
        stage: "Sourced",
        owner: "Paul Garcia",
        source: "Referral",
        timestamp: "2026-04-28 11:00 AM",
        reason: "Candidate referral.",
      },
      {
        stage: "Screened",
        owner: "Paul Garcia",
        source: "Referral",
        timestamp: "2026-04-29 02:00 PM",
        reason: "Passed screening.",
      },
      {
        stage: "Interviewed",
        owner: "Paul Garcia",
        source: "Referral",
        timestamp: "2026-05-02 03:00 PM",
        reason: "Passed interview.",
      },
      {
        stage: "Offered",
        owner: "Paul Garcia",
        source: "Referral",
        timestamp: "2026-05-04 10:00 AM",
        reason: "Offer prepared.",
      },
    ],
  },
  {
    id: 5,
    candidateApplicationId: 5,
    candidateId: "CAND-005",
    name: "Paul Garcia",
    email: "paul.garcia@email.com",
    roleAccount: "QA - SIBS",
    source: "JobStreet",
    owner: "Maria Reyes",
    currentStage: "Accepted",
    previousStage: "Offered",
    dateMoved: "2026-05-05",
    reasonForMovement: "Candidate accepted the offer.",
    dropOffReason: null,
    dropOffCategory: null,
    timeline: [
      {
        stage: "Sourced",
        owner: "Maria Reyes",
        source: "JobStreet",
        timestamp: "2026-04-27 09:00 AM",
        reason: "Candidate applied through JobStreet.",
      },
      {
        stage: "Screened",
        owner: "Maria Reyes",
        source: "JobStreet",
        timestamp: "2026-04-29 09:00 AM",
        reason: "Qualified for QA role.",
      },
      {
        stage: "Interviewed",
        owner: "Maria Reyes",
        source: "JobStreet",
        timestamp: "2026-05-01 02:00 PM",
        reason: "Passed interview.",
      },
      {
        stage: "Offered",
        owner: "Maria Reyes",
        source: "JobStreet",
        timestamp: "2026-05-03 11:30 AM",
        reason: "Offer sent.",
      },
      {
        stage: "Accepted",
        owner: "Maria Reyes",
        source: "JobStreet",
        timestamp: "2026-05-05 01:00 PM",
        reason: "Candidate accepted the offer.",
      },
    ],
  },
  {
    id: 6,
    candidateApplicationId: 6,
    candidateId: "CAND-006",
    name: "Rica Mae",
    email: "rica.mae@email.com",
    roleAccount: "CSR - SIBS",
    source: "Referral",
    owner: "John Dela Cruz",
    currentStage: "Hired",
    previousStage: "Accepted",
    dateMoved: "2026-05-06",
    reasonForMovement: "Candidate started and was marked hired.",
    dropOffReason: null,
    dropOffCategory: null,
    timeline: [
      {
        stage: "Sourced",
        owner: "John Dela Cruz",
        source: "Referral",
        timestamp: "2026-04-25 10:00 AM",
        reason: "Referral candidate.",
      },
      {
        stage: "Screened",
        owner: "John Dela Cruz",
        source: "Referral",
        timestamp: "2026-04-26 10:00 AM",
        reason: "Passed screening.",
      },
      {
        stage: "Interviewed",
        owner: "John Dela Cruz",
        source: "Referral",
        timestamp: "2026-04-29 03:00 PM",
        reason: "Passed interview.",
      },
      {
        stage: "Offered",
        owner: "John Dela Cruz",
        source: "Referral",
        timestamp: "2026-05-01 04:00 PM",
        reason: "Offer sent.",
      },
      {
        stage: "Accepted",
        owner: "John Dela Cruz",
        source: "Referral",
        timestamp: "2026-05-03 09:30 AM",
        reason: "Accepted offer.",
      },
      {
        stage: "Hired",
        owner: "John Dela Cruz",
        source: "Referral",
        timestamp: "2026-05-06 08:00 AM",
        reason: "Showed up on start date.",
      },
    ],
  },
  {
    id: 7,
    candidateApplicationId: 7,
    candidateId: "CAND-007",
    name: "Ana Reyes",
    email: "ana.reyes@email.com",
    roleAccount: "QA - SIBS",
    source: "Facebook",
    owner: "Kim Domingo",
    currentStage: "Drop-offs",
    previousStage: "Interviewed",
    dateMoved: "2026-04-30",
    reasonForMovement: "Candidate exited after interview stage.",
    dropOffReason: "Compensation expectation mismatch.",
    dropOffCategory: "Compensation",
    timeline: [
      {
        stage: "Sourced",
        owner: "Kim Domingo",
        source: "Facebook",
        timestamp: "2026-04-24 01:00 PM",
        reason: "Candidate sourced from Facebook.",
      },
      {
        stage: "Screened",
        owner: "Kim Domingo",
        source: "Facebook",
        timestamp: "2026-04-26 01:00 PM",
        reason: "Passed screening.",
      },
      {
        stage: "Interviewed",
        owner: "Kim Domingo",
        source: "Facebook",
        timestamp: "2026-04-28 09:00 AM",
        reason: "Completed interview.",
      },
      {
        stage: "Drop-offs",
        owner: "Kim Domingo",
        source: "Facebook",
        timestamp: "2026-04-30 05:00 PM",
        reason: "Candidate exited after interview.",
        dropOffReason: "Compensation expectation mismatch.",
      },
    ],
  },
];

const stages = [
  "Sourced",
  "Screened",
  "Interviewed",
  "Offered",
  "Accepted",
  "Hired",
  "Drop-offs",
];

const normalStageFlow = [
  "Sourced",
  "Screened",
  "Interviewed",
  "Offered",
  "Accepted",
  "Hired",
];

const roleOptions = [
  "All Roles",
  "CSR - SIBS",
  "QA - SIBS",
  "RCM Analyst - SIBS",
  "IT Support - SIBS",
];

const ownerOptions = [
  "All Owners",
  "Maria Reyes",
  "John Dela Cruz",
  "Kim Domingo",
  "Paul Garcia",
];

const accountOptions = ["All Accounts", "SIBS"];

const dropOffCategoryOptions = [
  "Compensation",
  "Schedule",
  "Process Delay",
  "No Response",
  "Failed Assessment",
  "Failed Interview",
  "Accepted Other Offer",
  "Location Issue",
  "Personal Reason",
  "Incomplete Requirements",
  "Others",
];

function safeReadArray(key) {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWriteArray(key, value) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local frontend storage only.
  }
}

function loadPipelineCandidateData() {
  const applicationCandidates = safeReadArray(CANDIDATE_APPLICATIONS_STORAGE_KEY);
  const pipelineCandidatesFromStorage = safeReadArray(
    PIPELINE_CANDIDATES_STORAGE_KEY
  );

  return applicationCandidates.length > 0
    ? applicationCandidates
    : pipelineCandidatesFromStorage;
}

function savePipelineCandidateData(candidates) {
  safeWriteArray(PIPELINE_CANDIDATES_STORAGE_KEY, candidates);
  safeWriteArray(CANDIDATE_APPLICATIONS_STORAGE_KEY, candidates);
}

function getRoleTitle(roleAccount = "") {
  return roleAccount.split(" - ")?.[0] || roleAccount || "";
}

function getAccount(roleAccount = "") {
  return roleAccount.split(" - ")?.[1] || "SIBS";
}

function getCandidateKey(candidate) {
  return String(
    candidate?.candidateApplicationId ||
      candidate?.id ||
      candidate?.candidateId ||
      candidate?.email ||
      candidate?.candidateEmail ||
      ""
  );
}

function upsertOfferEligibleCandidate(candidate) {
  const current = safeReadArray(OFFER_ELIGIBLE_STORAGE_KEY);

  const payload = {
    candidateApplicationId: candidate.candidateApplicationId || candidate.id,
    candidateId: candidate.candidateId,
    candidateName: candidate.name,
    candidateEmail: candidate.email,
    roleTitle: getRoleTitle(candidate.roleAccount),
    account: getAccount(candidate.roleAccount),
    roleAccount: candidate.roleAccount,
    owner: candidate.owner,
    currentStage: "Offered",
    source: candidate.source,
  };

  const next = current.some(
    (item) =>
      String(item.candidateApplicationId) ===
        String(payload.candidateApplicationId) ||
      item.candidateEmail === payload.candidateEmail
  )
    ? current.map((item) =>
        String(item.candidateApplicationId) ===
          String(payload.candidateApplicationId) ||
        item.candidateEmail === payload.candidateEmail
          ? payload
          : item
      )
    : [payload, ...current];

  safeWriteArray(OFFER_ELIGIBLE_STORAGE_KEY, next);
}

function removeOfferEligibleCandidate(candidate) {
  const current = safeReadArray(OFFER_ELIGIBLE_STORAGE_KEY);

  const next = current.filter(
    (item) =>
      String(item.candidateApplicationId) !==
        String(candidate.candidateApplicationId || candidate.id) &&
      item.candidateEmail !== candidate.email
  );

  safeWriteArray(OFFER_ELIGIBLE_STORAGE_KEY, next);
}

function getNextStage(currentStage) {
  if (currentStage === "Offered") return null;

  const currentIndex = normalStageFlow.indexOf(currentStage);

  if (currentIndex === -1) return null;
  if (currentIndex === normalStageFlow.length - 1) return null;

  return normalStageFlow[currentIndex + 1];
}

function getCurrentTimestamp() {
  return new Date().toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getCurrentDate() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStageClass(stage) {
  switch (stage) {
    case "Sourced":
      return "border-blue-100 bg-blue-50 text-blue-700";
    case "Screened":
      return "border-indigo-100 bg-indigo-50 text-indigo-700";
    case "Interviewed":
      return "border-violet-100 bg-violet-50 text-violet-700";
    case "Offered":
      return "border-amber-100 bg-amber-50 text-amber-700";
    case "Accepted":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "Hired":
      return "border-green-100 bg-green-50 text-green-700";
    case "Drop-offs":
      return "border-red-100 bg-red-50 text-red-700";
    default:
      return "border-gray-100 bg-gray-50 text-gray-600";
  }
}

function getStageIcon(stage) {
  switch (stage) {
    case "Sourced":
      return UsersRound;
    case "Screened":
      return Search;
    case "Interviewed":
      return UserRound;
    case "Offered":
      return BriefcaseBusiness;
    case "Accepted":
      return CheckCircle2;
    case "Hired":
      return UserCheck;
    case "Drop-offs":
      return UserX;
    default:
      return UsersRound;
  }
}

function applyOfferSyncEvents(candidates) {
  const syncEvents = safeReadArray(PIPELINE_SYNC_EVENTS_KEY);

  if (!syncEvents.length) return candidates;

  return candidates.map((candidate) => {
    const candidateKey = getCandidateKey(candidate);

    const matchingEvents = syncEvents
      .filter((event) => {
        const eventKey = String(
          event.candidateApplicationId ||
            event.candidateId ||
            event.candidateEmail ||
            ""
        );

        return (
          eventKey === candidateKey ||
          String(event.candidateEmail || "") === String(candidate.email || "")
        );
      })
      .reverse();

    if (!matchingEvents.length) return candidate;

    let updatedCandidate = { ...candidate };

    matchingEvents.forEach((event) => {
      const alreadyApplied = updatedCandidate.timeline?.some(
        (item) => item.pipelineSyncId === event.syncId
      );

      if (alreadyApplied) return;

      const fromStage =
        event.fromStage || updatedCandidate.currentStage || "Offered";

      const toStage = event.toStage || event.currentStage;

      if (!toStage) return;

      updatedCandidate = {
        ...updatedCandidate,
        previousStage: fromStage,
        currentStage: toStage,
        dateMoved: event.dateMoved || getCurrentDate(),
        reasonForMovement:
          event.reasonForMovement ||
          `Candidate moved from ${fromStage} to ${toStage}.`,
        dropOffCategory:
          toStage === "Drop-offs"
            ? event.dropOffCategory || updatedCandidate.dropOffCategory
            : null,
        dropOffReason:
          toStage === "Drop-offs"
            ? event.dropOffReason || updatedCandidate.dropOffReason
            : null,
        dropOffRemarks:
          toStage === "Drop-offs"
            ? event.remarks || updatedCandidate.dropOffRemarks
            : null,
        candidateFeedback:
          toStage === "Drop-offs"
            ? event.candidateFeedback || updatedCandidate.candidateFeedback
            : null,
        experienceRating:
          toStage === "Drop-offs"
            ? event.experienceRating || updatedCandidate.experienceRating
            : null,
        feedbackTag:
          toStage === "Drop-offs"
            ? event.feedbackTag || updatedCandidate.feedbackTag
            : null,
        timeline: [
          ...(updatedCandidate.timeline || []),
          {
            stage: toStage,
            owner: event.owner || updatedCandidate.owner,
            source: event.source || "Offer Management",
            timestamp: event.timestamp || getCurrentTimestamp(),
            reason:
              event.reasonForMovement ||
              `Candidate moved to ${toStage} from Offers.`,
            dropOffReason: toStage === "Drop-offs" ? event.dropOffReason : null,
            dropOffCategory:
              toStage === "Drop-offs" ? event.dropOffCategory : null,
            remarks: event.remarks || "",
            pipelineSyncId: event.syncId,
          },
        ],
      };
    });

    return updatedCandidate;
  });
}

function PipelineStat({ stage, count }) {
  const Icon = getStageIcon(stage);

  return (
    <div className="flex min-w-0 items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--sibs-primary-1)] text-white">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs text-sibs-tertiary-5">{stage}</p>
        <h2 className="text-lg font-bold text-sibs-primary-1">{count}</h2>
      </div>
    </div>
  );
}

function CandidateMobileCard({ candidate, onView, onOpenMoveModal }) {
  const nextStage = getNextStage(candidate.currentStage);

  return (
    <div className="w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-[var(--sibs-primary-1)]/40 hover:bg-[#F8FAFC]">
      <button
        type="button"
        onClick={onView}
        className="block w-full text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="whitespace-nowrap text-xs font-bold text-sibs-primary-1">
              {candidate.candidateId}
            </p>

            <h3 className="mt-1 break-words text-sm font-bold leading-5 text-[#101828]">
              {candidate.name}
            </h3>

            <p className="mt-1 break-words text-xs font-semibold leading-5 text-sibs-tertiary-5">
              {candidate.roleAccount}
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStageClass(
              candidate.currentStage
            )}`}
          >
            {candidate.currentStage}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="min-w-0 rounded-xl bg-[#F8FAFC] p-3">
            <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
              Owner
            </p>
            <p className="mt-1 break-words text-xs font-bold leading-5 text-[#344054]">
              {candidate.owner || "—"}
            </p>
          </div>

          <div className="min-w-0 rounded-xl bg-[#F8FAFC] p-3">
            <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
              Source
            </p>
            <p className="mt-1 break-words text-xs font-bold leading-5 text-[#344054]">
              {candidate.source || "—"}
            </p>
          </div>
        </div>

        <div className="mt-3 text-xs font-semibold leading-5 text-sibs-tertiary-5">
          Date Moved:{" "}
          <span className="font-bold text-[#344054]">
            {formatDate(candidate.dateMoved)}
          </span>
        </div>

        {candidate.dropOffReason && (
          <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold leading-5 text-red-700">
            {candidate.dropOffReason}
          </div>
        )}
      </button>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onView}
          className={`inline-flex h-9 min-w-0 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-3 text-xs font-bold text-sibs-primary-1 transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5 ${
            nextStage ? "flex-1" : "w-full"
          }`}
        >
          <Eye size={15} className="shrink-0" />
          <span>View</span>
        </button>

        {nextStage && (
          <button
            type="button"
            onClick={() => onOpenMoveModal(candidate)}
            className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-3 text-xs font-bold text-white transition hover:opacity-90"
          >
            <ArrowRight size={15} className="shrink-0" />
            <span>Move</span>
          </button>
        )}
      </div>
    </div>
  );
}

function StageMobileGroup({ stage, candidates, onView, onOpenMoveModal }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-[#101828]">{stage}</h2>
          <p className="text-xs font-semibold text-sibs-tertiary-5">
            {candidates.length} candidates
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${getStageClass(
            stage
          )}`}
        >
          {candidates.length}
        </span>
      </div>

      <div className="space-y-3">
        {candidates.length > 0 ? (
          candidates.map((candidate) => (
            <CandidateMobileCard
              key={candidate.id}
              candidate={candidate}
              onView={() => onView(candidate)}
              onOpenMoveModal={onOpenMoveModal}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-[#E6ECF2] bg-white p-5 text-center text-xs font-bold text-sibs-tertiary-5">
            No candidates
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>
      <div className="max-w-[60%] break-words text-right text-sm font-bold text-[#344054]">
        {value || "—"}
      </div>
    </div>
  );
}

function StarRatingInput({ value, onChange }) {
  const numericValue = Number(value || 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {[1, 2, 3, 4, 5].map((rating) => {
        const active = rating <= numericValue;

        return (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className="rounded-lg p-1 transition hover:bg-amber-50"
            aria-label={`${rating} star`}
          >
            <span
              className={`text-3xl leading-none ${
                active ? "text-amber-400" : "text-gray-300"
              }`}
            >
              ★
            </span>
          </button>
        );
      })}

      <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
        {numericValue}/5
      </span>
    </div>
  );
}

function MoveStageModal({
  open,
  candidate,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  if (!open || !candidate) return null;

  const nextStage = getNextStage(candidate.currentStage);

  if (!nextStage) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Move Candidate to Next Stage
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Confirm this movement before updating the candidate pipeline.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-5">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--sibs-primary-1)] text-white">
                  <ArrowRight size={22} />
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-sibs-primary-1">
                    {candidate.name}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-sibs-primary-1/80">
                    {candidate.roleAccount}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStageClass(
                        candidate.currentStage
                      )}`}
                    >
                      From: {candidate.currentStage}
                    </span>

                    <ArrowRight size={15} className="text-sibs-primary-1" />

                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStageClass(
                        nextStage
                      )}`}
                    >
                      To: {nextStage}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {nextStage === "Offered" && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <h3 className="text-sm font-bold text-amber-700">
                  Offer Module Connection
                </h3>
                <p className="mt-2 text-sm leading-6 text-amber-700/90">
                  After this movement, the candidate will become available in
                  the Offers page. Acceptance or decline should be handled in
                  Offers.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  Current Stage
                </label>
                <input
                  readOnly
                  value={candidate.currentStage}
                  className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  Next Stage
                </label>
                <input
                  readOnly
                  value={nextStage}
                  className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Movement Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={4}
                placeholder={`Example: Candidate passed ${candidate.currentStage.toLowerCase()} and is ready for ${nextStage.toLowerCase()}.`}
                className="w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Internal Remarks
              </label>
              <textarea
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                rows={3}
                placeholder="Optional notes for recruiter, hiring manager, or weekly report."
                className="w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              />
            </div>
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              onClick={onSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <ArrowRight size={16} />
              Confirm Move to {nextStage}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DropOffModal({
  open,
  candidate,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  if (!open || !candidate) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-red-700 sm:text-xl">
              Mark Candidate as Drop-off
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Capture the stage, category, reason, feedback, and rating before
              removing this candidate from the active pipeline.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-5">
            <div className="rounded-xl border border-red-100 bg-red-50 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
                  <UserX size={22} />
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-red-700">
                    {candidate.name}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-red-700/80">
                    {candidate.roleAccount}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  Drop-off Stage
                </label>
                <input
                  readOnly
                  value={candidate.currentStage}
                  className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  Reason Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                >
                  <option value="">Select category</option>
                  {dropOffCategoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Drop-off Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={4}
                placeholder="Example: Candidate declined due to salary expectation mismatch."
                className="w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Internal Remarks
              </label>
              <textarea
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                rows={3}
                placeholder="Optional recruiter remarks for future reprocessing or reporting."
                className="w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Candidate Feedback
              </label>
              <textarea
                value={form.candidateFeedback}
                onChange={(e) =>
                  setForm({ ...form, candidateFeedback: e.target.value })
                }
                rows={3}
                placeholder="Optional candidate feedback about the hiring process."
                className="w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Candidate Experience Rating
              </label>
              <StarRatingInput
                value={form.experienceRating}
                onChange={(rating) =>
                  setForm({ ...form, experienceRating: rating })
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Feedback Tag
              </label>
              <input
                value={form.feedbackTag}
                onChange={(e) =>
                  setForm({ ...form, feedbackTag: e.target.value })
                }
                placeholder="Example: Compensation Concern, Process Delay, No Response"
                className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              />
            </div>
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              onClick={onSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700"
            >
              <UserX size={16} />
              Confirm Drop-off
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CandidatePipelineModal({
  open,
  candidate,
  onClose,
  onOpenMoveModal,
  onOpenDropOffModal,
}) {
  if (!open || !candidate) return null;

  const nextStage = getNextStage(candidate.currentStage);

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Candidate Pipeline Details
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Transaction-level candidate movement and stage history.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[var(--sibs-primary-1)] text-xl font-bold text-white">
                    {candidate.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                      .slice(0, 2)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-xl font-bold text-[#101828]">
                      {candidate.name}
                    </h3>
                    <p className="mt-1 break-words text-sm font-semibold text-sibs-tertiary-5">
                      {candidate.email}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStageClass(
                          candidate.currentStage
                        )}`}
                      >
                        {candidate.currentStage}
                      </span>
                      <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">
                        {candidate.source}
                      </span>
                      <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">
                        {candidate.owner}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {candidate.currentStage === "Offered" && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                  <h3 className="text-sm font-bold text-amber-700">
                    Waiting for Offer Management
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-amber-700/90">
                    This candidate is already in the Offered stage. Acceptance
                    or decline should be handled in the Offers module.
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <History size={18} className="text-sibs-primary-1" />
                  <h3 className="text-sm font-bold text-[#101828]">
                    Stage Movement Timeline
                  </h3>
                </div>

                <div className="space-y-4">
                  {(candidate.timeline || []).map((item, index) => (
                    <div
                      key={`${item.stage}-${index}`}
                      className="relative flex gap-4"
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold ${getStageClass(
                            item.stage
                          )}`}
                        >
                          {index + 1}
                        </div>

                        {index !== candidate.timeline.length - 1 && (
                          <div className="my-1 h-full min-h-8 w-px bg-gray-200" />
                        )}
                      </div>

                      <div className="flex-1 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                          <div>
                            <p className="text-sm font-bold text-[#101828]">
                              {item.stage}
                            </p>
                            <p className="text-xs font-semibold text-sibs-tertiary-5">
                              {item.timestamp}
                            </p>
                          </div>

                          <span className="w-fit rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600">
                            {item.owner}
                          </span>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-[#344054]">
                          {item.reason}
                        </p>

                        {item.dropOffReason && (
                          <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold leading-5 text-red-700">
                            Drop-off reason: {item.dropOffReason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Current Movement Details
                </h3>

                <div className="mt-4">
                  <DetailRow label="Candidate ID" value={candidate.candidateId} />
                  <DetailRow
                    label="Role / Account"
                    value={candidate.roleAccount}
                  />
                  <DetailRow
                    label="Previous Stage"
                    value={candidate.previousStage || "Initial Entry"}
                  />
                  <DetailRow
                    label="Current Stage"
                    value={candidate.currentStage}
                  />
                  <DetailRow label="Owner" value={candidate.owner} />
                  <DetailRow label="Source" value={candidate.source} />
                  <DetailRow
                    label="Date Moved"
                    value={formatDate(candidate.dateMoved)}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#101828]">
                  Reason for Movement
                </h3>
                <p className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#344054]">
                  {candidate.reasonForMovement}
                </p>
              </div>

              {candidate.currentStage === "Drop-offs" && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-5">
                  <h3 className="text-sm font-bold text-red-700">
                    Drop-off Information
                  </h3>

                  <div className="mt-4">
                    <DetailRow
                      label="Drop-off Stage"
                      value={candidate.previousStage}
                    />
                    <DetailRow
                      label="Reason Category"
                      value={candidate.dropOffCategory}
                    />
                  </div>

                  <p className="mt-4 rounded-xl border border-red-100 bg-white p-4 text-sm leading-6 text-red-700">
                    {candidate.dropOffReason}
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Data Capture Rule
                </h3>
                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  Every movement must capture timestamp, owner, source, stage
                  movement, reason for movement, and drop-off reason if the
                  candidate exits.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            {candidate.currentStage !== "Drop-offs" &&
              candidate.currentStage !== "Hired" && (
                <button
                  type="button"
                  onClick={() => onOpenDropOffModal(candidate)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-700 transition hover:bg-red-100"
                >
                  <UserX size={16} />
                  Mark Drop-off
                </button>
              )}

            {nextStage && (
              <button
                type="button"
                onClick={() => onOpenMoveModal(candidate)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white transition hover:opacity-90"
              >
                <ArrowRight size={16} />
                Move to {nextStage}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CandidatePipelinePage() {
  const [candidateList, setCandidateList] = useState(defaultPipelineCandidates);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [viewMode, setViewMode] = useState("kanban");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [ownerFilter, setOwnerFilter] = useState("All Owners");
  const [accountFilter, setAccountFilter] = useState("All Accounts");
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [moveCandidate, setMoveCandidate] = useState(null);
  const [moveForm, setMoveForm] = useState({
    reason: "",
    remarks: "",
  });

  const [dropOffCandidate, setDropOffCandidate] = useState(null);
  const [dropOffForm, setDropOffForm] = useState({
    category: "",
    reason: "",
    remarks: "",
    candidateFeedback: "",
    experienceRating: 3,
    feedbackTag: "",
  });

  useEffect(() => {
    const storedCandidates = loadPipelineCandidateData();

    const baseCandidates =
      storedCandidates.length > 0 ? storedCandidates : defaultPipelineCandidates;

    const syncedCandidates = applyOfferSyncEvents(baseCandidates);

    setCandidateList(syncedCandidates);
    savePipelineCandidateData(syncedCandidates);

    syncedCandidates
      .filter((candidate) => candidate.currentStage === "Offered")
      .forEach((candidate) => {
        upsertOfferEligibleCandidate(candidate);
      });

    setHasLoadedStorage(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    savePipelineCandidateData(candidateList);
  }, [candidateList, hasLoadedStorage]);

  useEffect(() => {
    function handlePipelineSyncUpdated() {
      setCandidateList((prev) => {
        const syncedCandidates = applyOfferSyncEvents(prev);

        syncedCandidates
          .filter((candidate) => candidate.currentStage === "Offered")
          .forEach((candidate) => {
            upsertOfferEligibleCandidate(candidate);
          });

        savePipelineCandidateData(syncedCandidates);

        return syncedCandidates;
      });
    }

    window.addEventListener(
      PIPELINE_SYNC_BROWSER_EVENT,
      handlePipelineSyncUpdated
    );

    window.addEventListener("storage", handlePipelineSyncUpdated);

    return () => {
      window.removeEventListener(
        PIPELINE_SYNC_BROWSER_EVENT,
        handlePipelineSyncUpdated
      );

      window.removeEventListener("storage", handlePipelineSyncUpdated);
    };
  }, []);

  function syncSelectedCandidate(updatedCandidate) {
    setSelectedCandidate((prev) => {
      if (!prev) return prev;

      const prevKey = getCandidateKey(prev);
      const updatedKey = getCandidateKey(updatedCandidate);

      return prevKey === updatedKey ? updatedCandidate : prev;
    });
  }

  function handleOpenMoveModal(candidate) {
    const nextStage = getNextStage(candidate.currentStage);

    if (!nextStage) return;

    setMoveCandidate(candidate);
    setMoveForm({
      reason: `Candidate moved from ${candidate.currentStage} to ${nextStage}.`,
      remarks: "",
    });
  }

  function handleCloseMoveModal() {
    setMoveCandidate(null);
    setMoveForm({
      reason: "",
      remarks: "",
    });
  }

  function handleSubmitMove(e) {
    e.preventDefault();

    if (!moveCandidate) return;

    const nextStage = getNextStage(moveCandidate.currentStage);

    if (!nextStage) {
      alert("This candidate cannot be moved forward.");
      return;
    }

    if (!moveForm.reason.trim()) {
      alert("Movement reason is required.");
      return;
    }

    const movementReason = moveForm.reason.trim();

    const updatedCandidate = {
      ...moveCandidate,
      previousStage: moveCandidate.currentStage,
      currentStage: nextStage,
      dateMoved: getCurrentDate(),
      reasonForMovement: movementReason,
      movementRemarks: moveForm.remarks.trim(),
      dropOffReason: null,
      dropOffCategory: null,
      dropOffRemarks: null,
      candidateFeedback: null,
      experienceRating: null,
      feedbackTag: null,
      timeline: [
        ...(moveCandidate.timeline || []),
        {
          stage: nextStage,
          owner: moveCandidate.owner,
          source: moveCandidate.source,
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks: moveForm.remarks.trim(),
        },
      ],
    };

    setCandidateList((prev) => {
      const next = prev.map((item) =>
        item.id === moveCandidate.id ? updatedCandidate : item
      );

      savePipelineCandidateData(next);

      return next;
    });

    if (nextStage === "Offered") {
      upsertOfferEligibleCandidate(updatedCandidate);
    } else {
      removeOfferEligibleCandidate(updatedCandidate);
    }

    setSelectedCandidate(updatedCandidate);
    syncSelectedCandidate(updatedCandidate);
    handleCloseMoveModal();
  }

  function handleOpenDropOffModal(candidate) {
    setDropOffCandidate(candidate);
    setDropOffForm({
      category: "",
      reason: "",
      remarks: "",
      candidateFeedback: "",
      experienceRating: 3,
      feedbackTag: "",
    });
  }

  function handleCloseDropOffModal() {
    setDropOffCandidate(null);
    setDropOffForm({
      category: "",
      reason: "",
      remarks: "",
      candidateFeedback: "",
      experienceRating: 3,
      feedbackTag: "",
    });
  }

  function handleSubmitDropOff(e) {
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

    const movementReason = `Candidate moved from ${dropOffCandidate.currentStage} to Drop-offs.`;

    const updatedCandidate = {
      ...dropOffCandidate,
      previousStage: dropOffCandidate.currentStage,
      currentStage: "Drop-offs",
      dateMoved: getCurrentDate(),
      reasonForMovement: movementReason,
      dropOffCategory: dropOffForm.category.trim(),
      dropOffReason: dropOffForm.reason.trim(),
      dropOffRemarks: dropOffForm.remarks.trim(),
      candidateFeedback: dropOffForm.candidateFeedback.trim(),
      experienceRating: Number(dropOffForm.experienceRating || 3),
      feedbackTag: dropOffForm.feedbackTag.trim() || dropOffForm.category.trim(),
      timeline: [
        ...(dropOffCandidate.timeline || []),
        {
          stage: "Drop-offs",
          owner: dropOffCandidate.owner,
          source: dropOffCandidate.source,
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          dropOffReason: dropOffForm.reason.trim(),
          dropOffCategory: dropOffForm.category.trim(),
          remarks: dropOffForm.remarks.trim(),
        },
      ],
    };

    setCandidateList((prev) => {
      const next = prev.map((item) =>
        item.id === dropOffCandidate.id ? updatedCandidate : item
      );

      savePipelineCandidateData(next);

      return next;
    });

    removeOfferEligibleCandidate(dropOffCandidate);

    saveCandidateExperienceRecord({
      candidateId: dropOffCandidate.candidateId,
      candidateName: dropOffCandidate.name,
      candidateEmail: dropOffCandidate.email,
      roleTitle: getRoleTitle(dropOffCandidate.roleAccount),
      account: getAccount(dropOffCandidate.roleAccount),
      source: dropOffCandidate.source,
      eventType: "Pipeline Drop-off",
      currentStage: dropOffCandidate.currentStage,
      finalStatus: "Drop-off",
      dropOffStage: dropOffCandidate.currentStage,
      dropOffCategory: dropOffForm.category.trim(),
      dropOffReason: dropOffForm.reason.trim(),
      feedback: dropOffForm.candidateFeedback.trim(),
      experienceRating: Number(dropOffForm.experienceRating || 3),
      feedbackTag: dropOffForm.feedbackTag.trim() || dropOffForm.category.trim(),
      owner: dropOffCandidate.owner,
      stageTimeline: [
        ...(dropOffCandidate.timeline || []).map((item) => ({
          stage: item.stage,
          status: "Completed",
          date: getCurrentDate(),
        })),
        {
          stage: "Drop-offs",
          status: "Drop-off",
          date: getCurrentDate(),
        },
      ],
    });

    setSelectedCandidate(updatedCandidate);
    syncSelectedCandidate(updatedCandidate);
    handleCloseDropOffModal();
  }

  const filteredCandidates = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return candidateList.filter((candidate) => {
      const matchesSearch =
        !keyword ||
        String(candidate.name || "").toLowerCase().includes(keyword) ||
        String(candidate.email || "").toLowerCase().includes(keyword) ||
        String(candidate.candidateId || "").toLowerCase().includes(keyword) ||
        String(candidate.roleAccount || "").toLowerCase().includes(keyword) ||
        String(candidate.source || "").toLowerCase().includes(keyword);

      const matchesRole =
        roleFilter === "All Roles" || candidate.roleAccount === roleFilter;

      const matchesOwner =
        ownerFilter === "All Owners" || candidate.owner === ownerFilter;

      const matchesAccount =
        accountFilter === "All Accounts" ||
        candidate.roleAccount.toLowerCase().includes("sibs");

      return matchesSearch && matchesRole && matchesOwner && matchesAccount;
    });
  }, [candidateList, search, roleFilter, ownerFilter, accountFilter]);

  const stageCounts = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage] = filteredCandidates.filter(
        (candidate) => candidate.currentStage === stage
      ).length;
      return acc;
    }, {});
  }, [filteredCandidates]);

  const groupedByStage = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage] = filteredCandidates.filter(
        (candidate) => candidate.currentStage === stage
      );
      return acc;
    }, {});
  }, [filteredCandidates]);

  return (
    <div className="flex-1 flex flex-col bg-[var(--sibs-tertiary-10)]">
      <Header />

      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Table2 size={28} className="shrink-0 text-sibs-primary-1" />

            <h1 className="min-w-0 break-words text-2xl font-bold text-sibs-primary-1 sm:text-4xl">
              Candidate Pipeline
            </h1>
          </div>

          <p className="mt-1 text-sm text-sibs-tertiary-5">
            Track candidate movement across all recruitment stages
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PipelineStat
            stage="Sourced"
            count={stageCounts.Sourced || 0}
          />

          <PipelineStat
            stage="Screened"
            count={stageCounts.Screened || 0}
          />

          <PipelineStat
            stage="Interviewed"
            count={stageCounts.Interviewed || 0}
          />

          <PipelineStat
            stage="Offered"
            count={stageCounts.Offered || 0}
          />

          <PipelineStat
            stage="Accepted"
            count={stageCounts.Accepted || 0}
          />

          <PipelineStat
            stage="Hired"
            count={stageCounts.Hired || 0}
          />

          <PipelineStat
            stage="Drop-offs"
            count={stageCounts["Drop-offs"] || 0}
          />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-semibold text-sibs-primary-1">
              Candidate Pipeline Records
            </h3>

            <p className="text-sm text-sibs-tertiary-5">
              Candidate movement connected to Talent Pool, Offers, Onboarding,
              and Candidate Experience.
            </p>
          </div>

          <div className="inline-flex w-full rounded-xl border border-[#E6ECF2] bg-white p-1 shadow-sm sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition sm:flex-none ${
                viewMode === "kanban"
                  ? "bg-[var(--sibs-primary-1)] text-white shadow-sm"
                  : "text-[#344054] hover:bg-gray-50"
              }`}
            >
              <Columns3 size={17} />
              Kanban
            </button>

            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition sm:flex-none ${
                viewMode === "table"
                  ? "bg-[var(--sibs-primary-1)] text-white shadow-sm"
                  : "text-[#344054] hover:bg-gray-50"
              }`}
            >
              <Table2 size={17} />
              Table
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_260px_190px_190px_190px] xl:items-center">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-sibs-primary-1">
                  Candidate Pipeline List
                </h2>
                <p className="text-sm text-sibs-tertiary-5">
                  Search and filter candidate movement records.
                </p>
              </div>

              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search candidate, email, ID..."
                  className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-11 rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="h-11 rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              >
                {ownerOptions.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>

              <select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="h-11 rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              >
                {accountOptions.map((account) => (
                  <option key={account} value={account}>
                    {account}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {viewMode === "kanban" ? (
              <>
                <div className="space-y-4 lg:hidden">
                  {stages.map((stage) => (
                    <StageMobileGroup
                      key={stage}
                      stage={stage}
                      candidates={groupedByStage[stage] || []}
                      onView={setSelectedCandidate}
                      onOpenMoveModal={handleOpenMoveModal}
                    />
                  ))}
                </div>

                <div className="hidden overflow-x-auto pb-2 lg:block">
                  <div className="grid min-w-[1320px] grid-cols-7 gap-4">
                    {stages.map((stage) => {
                      const items = groupedByStage[stage] || [];

                      return (
                        <div
                          key={stage}
                          className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <div>
                              <h2 className="text-sm font-bold text-[#101828]">
                                {stage}
                              </h2>
                              <p className="text-xs font-semibold text-sibs-tertiary-5">
                                {items.length} candidates
                              </p>
                            </div>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getStageClass(
                                stage
                              )}`}
                            >
                              {items.length}
                            </span>
                          </div>

                          <div className="space-y-3">
                            {items.length > 0 ? (
                              items.map((candidate) => (
                                <CandidateMobileCard
                                  key={candidate.id}
                                  candidate={candidate}
                                  onView={() => setSelectedCandidate(candidate)}
                                  onOpenMoveModal={handleOpenMoveModal}
                                />
                              ))
                            ) : (
                              <div className="rounded-xl border border-dashed border-[#E6ECF2] bg-white p-5 text-center text-xs font-bold text-sibs-tertiary-5">
                                No candidates
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3 lg:hidden">
                  {filteredCandidates.length > 0 ? (
                    filteredCandidates.map((candidate) => (
                      <CandidateMobileCard
                        key={candidate.id}
                        candidate={candidate}
                        onView={() => setSelectedCandidate(candidate)}
                        onOpenMoveModal={handleOpenMoveModal}
                      />
                    ))
                  ) : (
                    <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                      No candidate movement records found.
                    </div>
                  )}
                </div>

                <div className="hidden overflow-hidden rounded-xl border border-[#E6ECF2] lg:block">
                  <div className="max-h-[520px] overflow-auto">
                    <table className="w-full min-w-[1200px] border-collapse text-left">
                      <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
                        <tr className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                          <th className="px-5 py-4">Candidate</th>
                          <th className="px-5 py-4">Role / Account</th>
                          <th className="px-5 py-4">Previous Stage</th>
                          <th className="px-5 py-4">Current Stage</th>
                          <th className="px-5 py-4">Owner</th>
                          <th className="px-5 py-4">Source</th>
                          <th className="px-5 py-4">Date Moved</th>
                          <th className="px-5 py-4 text-right">Action</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100 bg-white">
                        {filteredCandidates.length > 0 ? (
                          filteredCandidates.map((candidate) => {
                            const nextStage = getNextStage(
                              candidate.currentStage
                            );

                            return (
                              <tr
                                key={candidate.id}
                                className="transition hover:bg-[#F8FAFC]"
                              >
                                <td className="px-5 py-4">
                                  <p className="text-sm font-bold text-[#101828]">
                                    {candidate.name}
                                  </p>
                                  <p className="text-xs font-semibold text-sibs-tertiary-5">
                                    {candidate.email}
                                  </p>
                                </td>

                                <td className="px-5 py-4 text-sm font-bold text-sibs-primary-1">
                                  {candidate.roleAccount}
                                </td>

                                <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                                  {candidate.previousStage || "Initial Entry"}
                                </td>

                                <td className="px-5 py-4">
                                  <span
                                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStageClass(
                                      candidate.currentStage
                                    )}`}
                                  >
                                    {candidate.currentStage}
                                  </span>
                                </td>

                                <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                                  {candidate.owner}
                                </td>

                                <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                                  {candidate.source}
                                </td>

                                <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                                  {formatDate(candidate.dateMoved)}
                                </td>

                                <td className="px-5 py-4 text-right">
                                  <div className="inline-flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedCandidate(candidate)
                                      }
                                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 py-2 text-xs font-bold text-sibs-primary-1 transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5"
                                    >
                                      <Eye size={15} />
                                      View
                                    </button>

                                    {nextStage && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleOpenMoveModal(candidate)
                                        }
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
                                      >
                                        <ArrowRight size={15} />
                                        Move
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                            >
                              No candidate movement records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <p className="text-sm font-semibold text-sibs-tertiary-5">
                Showing 1 to {filteredCandidates.length} of{" "}
                {candidateList.length} candidate movements
              </p>

              <div className="flex items-center gap-2">
                <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50">
                  <ChevronLeft size={16} />
                </button>

                <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--sibs-primary-1)] text-sm font-bold text-white">
                  1
                </button>

                <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h3 className="text-sm font-bold text-sibs-primary-1">
            Candidate Pipeline Rule
          </h3>
          <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
            Every candidate movement should be saved as a transaction. When a
            candidate reaches Offered, the offer transaction should be handled in
            the Offers module. Accepted or Declined offer results should sync
            back to the pipeline.
          </p>
        </section>
      </main>

      <CandidatePipelineModal
        open={!!selectedCandidate}
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onOpenMoveModal={handleOpenMoveModal}
        onOpenDropOffModal={handleOpenDropOffModal}
      />

      <MoveStageModal
        open={!!moveCandidate}
        candidate={moveCandidate}
        form={moveForm}
        setForm={setMoveForm}
        onClose={handleCloseMoveModal}
        onSubmit={handleSubmitMove}
      />

      <DropOffModal
        open={!!dropOffCandidate}
        candidate={dropOffCandidate}
        form={dropOffForm}
        setForm={setDropOffForm}
        onClose={handleCloseDropOffModal}
        onSubmit={handleSubmitDropOff}
      />
    </div>
  );
}