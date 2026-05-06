import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/layout/Header";
import {
  BookOpen,
  Search,
  Eye,
  X,
  UserX,
  Star,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  UsersRound,
  MessageSquareText,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ThumbsUp,
  ThumbsDown,
  ListChecks,
  Plus,
  RotateCcw,
} from "lucide-react";
import {
  getCandidateExperienceRecords,
  saveCandidateExperienceRecord,
} from "@/lib/utils/candidateExperienceStore";

const initialCandidateExperienceRecords = [
  {
    id: "EXP-SEED-001",
    candidateId: "CAND-001",
    candidateName: "Juan Dela Cruz",
    candidateEmail: "juan.delacruz@email.com",
    roleTitle: "Customer Service Representative",
    account: "SIBS Operations",
    source: "JobStreet",
    eventType: "Pipeline Drop-off",
    currentStage: "Interviewed",
    finalStatus: "Drop-off",
    dropOffStage: "Interviewed",
    dropOffCategory: "Compensation",
    dropOffReason: "Candidate declined due to salary expectation mismatch.",
    feedback:
      "The interview was okay, but the expected salary range was lower than my current offer.",
    experienceRating: 3,
    feedbackTag: "Compensation Concern",
    owner: "Maria Reyes",
    dateRecorded: "2026-05-04",
    stageTimeline: [
      { stage: "Sourced", status: "Completed", date: "2026-04-28" },
      { stage: "Screened", status: "Completed", date: "2026-04-29" },
      { stage: "Interviewed", status: "Drop-off", date: "2026-05-04" },
    ],
  },
  {
    id: "EXP-SEED-002",
    candidateId: "CAND-002",
    candidateName: "Maria Santos",
    candidateEmail: "maria.santos@email.com",
    roleTitle: "QA Specialist",
    account: "SIBS Operations",
    source: "Referral",
    eventType: "Pipeline Drop-off",
    currentStage: "Screened",
    finalStatus: "Drop-off",
    dropOffStage: "Screened",
    dropOffCategory: "Schedule",
    dropOffReason: "Candidate could not commit to required schedule.",
    feedback:
      "The process was clear, but the work schedule does not match my availability.",
    experienceRating: 4,
    feedbackTag: "Schedule Concern",
    owner: "John Dela Cruz",
    dateRecorded: "2026-05-03",
    stageTimeline: [
      { stage: "Sourced", status: "Completed", date: "2026-04-30" },
      { stage: "Screened", status: "Drop-off", date: "2026-05-03" },
    ],
  },
  {
    id: "EXP-SEED-003",
    candidateId: "CAND-003",
    candidateName: "Carlo Reyes",
    candidateEmail: "carlo.reyes@email.com",
    roleTitle: "System Developer",
    account: "SIBS IT",
    source: "LinkedIn",
    eventType: "Offer Declined",
    currentStage: "Offered",
    finalStatus: "Drop-off",
    dropOffStage: "Offered",
    dropOffCategory: "Accepted Other Offer",
    dropOffReason: "Candidate accepted another offer before final confirmation.",
    feedback:
      "The team was responsive, but another company gave a faster final offer.",
    experienceRating: 4,
    feedbackTag: "Offer Speed",
    owner: "Kim Domingo",
    dateRecorded: "2026-05-02",
    stageTimeline: [
      { stage: "Sourced", status: "Completed", date: "2026-04-25" },
      { stage: "Screened", status: "Completed", date: "2026-04-26" },
      { stage: "Interviewed", status: "Completed", date: "2026-04-29" },
      { stage: "Offered", status: "Drop-off", date: "2026-05-02" },
    ],
  },
  {
    id: "EXP-SEED-004",
    candidateId: "CAND-004",
    candidateName: "Angela Lim",
    candidateEmail: "angela.lim@email.com",
    roleTitle: "RCM Analyst",
    account: "SIBS RCM",
    source: "Facebook",
    eventType: "Pipeline Drop-off",
    currentStage: "Interviewed",
    finalStatus: "Drop-off",
    dropOffStage: "Interviewed",
    dropOffCategory: "Process Delay",
    dropOffReason: "Candidate became unresponsive after delayed feedback.",
    feedback:
      "I waited too long after the interview and decided to proceed with another application.",
    experienceRating: 2,
    feedbackTag: "Process Delay",
    owner: "Paul Garcia",
    dateRecorded: "2026-05-01",
    stageTimeline: [
      { stage: "Sourced", status: "Completed", date: "2026-04-23" },
      { stage: "Screened", status: "Completed", date: "2026-04-24" },
      { stage: "Interviewed", status: "Drop-off", date: "2026-05-01" },
    ],
  },
  {
    id: "EXP-SEED-005",
    candidateId: "CAND-005",
    candidateName: "Mark Sy",
    candidateEmail: "mark.sy@email.com",
    roleTitle: "IT Support",
    account: "SIBS IT",
    source: "Walk-in",
    eventType: "Candidate Feedback",
    currentStage: "Hired",
    finalStatus: "Completed",
    dropOffStage: null,
    dropOffCategory: null,
    dropOffReason: null,
    feedback: "The process was straightforward and communication was clear.",
    experienceRating: 5,
    feedbackTag: "Positive Experience",
    owner: "Maria Reyes",
    dateRecorded: "2026-05-05",
    stageTimeline: [
      { stage: "Sourced", status: "Completed", date: "2026-04-28" },
      { stage: "Screened", status: "Completed", date: "2026-04-29" },
      { stage: "Interviewed", status: "Completed", date: "2026-05-01" },
      { stage: "Offered", status: "Completed", date: "2026-05-03" },
      { stage: "Hired", status: "Completed", date: "2026-05-05" },
    ],
  },
];

const candidatesForExperience = [
  {
    candidateId: "CAND-006",
    candidateName: "Lara Mendoza",
    candidateEmail: "lara.mendoza@email.com",
    roleTitle: "Customer Service Representative",
    account: "SIBS Operations",
    source: "Referral",
    currentStage: "Interviewed",
    owner: "Maria Reyes",
  },
  {
    candidateId: "CAND-007",
    candidateName: "Renz Castillo",
    candidateEmail: "renz.castillo@email.com",
    roleTitle: "RCM Analyst",
    account: "SIBS RCM",
    source: "LinkedIn",
    currentStage: "Offered",
    owner: "Kim Domingo",
  },
  {
    candidateId: "CAND-008",
    candidateName: "Nicole Tan",
    candidateEmail: "nicole.tan@email.com",
    roleTitle: "QA Specialist",
    account: "SIBS Operations",
    source: "JobStreet",
    currentStage: "Screened",
    owner: "John Dela Cruz",
  },
];

const eventTypeOptions = [
  "Pipeline Drop-off",
  "Offer Declined",
  "Pre-start Withdrawal",
  "No Show",
  "Candidate Feedback",
];

const stageOptions = [
  "All Stages",
  "Sourced",
  "Screened",
  "Interviewed",
  "Offered",
  "Accepted",
  "Hired",
];

const candidateStageOptions = [
  "Sourced",
  "Screened",
  "Interviewed",
  "Offered",
  "Accepted",
  "Hired",
];

const categoryOptions = [
  "All Categories",
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
  "Positive Experience",
  "Others",
];

const reasonCategoryOptions = [
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
  "Positive Experience",
  "Others",
];

const ratingOptions = ["All Ratings", "5", "4", "3", "2", "1"];

const ownerOptions = [
  "Maria Reyes",
  "John Dela Cruz",
  "Kim Domingo",
  "Paul Garcia",
];

const emptyExperienceForm = {
  candidateId: "",
  candidateName: "",
  candidateEmail: "",
  roleTitle: "",
  account: "",
  source: "",
  owner: "",
  eventType: "Pipeline Drop-off",
  currentStage: "",
  dropOffStage: "",
  reasonCategory: "",
  reason: "",
  feedback: "",
  experienceRating: 3,
  feedbackTag: "",
};

function inputClass(extra = "") {
  return `h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function textareaClass(extra = "") {
  return `w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function getTodayDate() {
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

function safeText(value) {
  return String(value || "").toLowerCase();
}

function mergeExperienceRecords(storedRecords, seedRecords) {
  const map = new Map();

  [...storedRecords, ...seedRecords].forEach((record) => {
    const key =
      record.id ||
      `${record.candidateId}-${record.eventType}-${record.dateRecorded}`;

    if (!map.has(key)) {
      map.set(key, record);
    }
  });

  return Array.from(map.values());
}

function getDropOffClass(category) {
  switch (category) {
    case "Compensation":
      return "border-red-200 bg-red-50 text-red-700";
    case "Schedule":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Process Delay":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "Accepted Other Offer":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "Positive Experience":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "No Response":
      return "border-gray-200 bg-gray-50 text-gray-600";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function getStatusClass(status) {
  switch (status) {
    case "Drop-off":
      return "border-red-200 bg-red-50 text-red-700";
    case "Completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getTimelineClass(status) {
  switch (status) {
    case "Drop-off":
      return "border-red-200 bg-red-50 text-red-700";
    case "Completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function RatingStars({ rating, size = 15 }) {
  const safeRating = Number(rating || 0);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const active = index < safeRating;

        return (
          <Star
            key={index}
            size={size}
            className={active ? "text-amber-400" : "text-gray-300"}
            fill={active ? "currentColor" : "none"}
          />
        );
      })}
    </div>
  );
}

function StarRatingInput({ value, onChange }) {
  const numericValue = Number(value || 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {Array.from({ length: 5 }).map((_, index) => {
        const ratingValue = index + 1;
        const active = ratingValue <= numericValue;

        return (
          <button
            key={ratingValue}
            type="button"
            onClick={() => onChange(ratingValue)}
            className="rounded-lg p-1 transition hover:bg-amber-50"
            aria-label={`${ratingValue} star`}
          >
            <Star
              size={28}
              className={active ? "text-amber-400" : "text-gray-300"}
              fill={active ? "currentColor" : "none"}
            />
          </button>
        );
      })}

      <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
        {numericValue}/5
      </span>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, description }) {
  return (
    <div className="flex min-w-0 items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sibs-primary-1 text-white">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs text-sibs-tertiary-5">{title}</p>
        <h2 className="text-lg font-bold text-sibs-primary-1">{value}</h2>

        {description && (
          <p className="truncate text-xs text-sibs-tertiary-5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function BarRow({ label, value, max }) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="min-w-0 truncate text-sm font-bold text-[#344054]">
          {label}
        </p>

        <p className="shrink-0 text-sm font-bold text-sibs-primary-1">
          {value}
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]">
        <div
          className="h-full rounded-full bg-sibs-primary-1"
          style={{ width: `${percentage}%` }}
        />
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

function ExperienceMobileCard({ record, onView }) {
  return (
    <button
      type="button"
      onClick={onView}
      className="w-full rounded-xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-sibs-primary-1">
            {record.candidateId}
          </p>

          <h3 className="mt-1 text-sm font-bold text-[#101828]">
            {record.candidateName}
          </h3>

          <p className="mt-1 break-words text-xs font-semibold text-sibs-tertiary-5">
            {record.roleTitle} / {record.account}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
            record.finalStatus
          )}`}
        >
          {record.finalStatus}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Event
          </p>

          <p className="mt-1 text-xs font-bold text-[#344054]">
            {record.eventType || "—"}
          </p>
        </div>

        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Exit Stage
          </p>

          <p className="mt-1 text-xs font-bold text-[#344054]">
            {record.dropOffStage || record.currentStage || "—"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {record.dropOffCategory && (
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getDropOffClass(
              record.dropOffCategory
            )}`}
          >
            {record.dropOffCategory}
          </span>
        )}

        <span className="inline-flex rounded-full border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-bold text-[#344054]">
          {formatDate(record.dateRecorded)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-[#F8FAFC] p-3">
        <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
          Rating
        </p>

        <RatingStars rating={record.experienceRating} />
      </div>

      <div className="mt-4">
        <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-3 py-2 text-xs font-bold text-sibs-primary-1">
          <Eye size={15} />
          View Details
        </span>
      </div>
    </button>
  );
}

function AddExperienceModal({
  open,
  form,
  setForm,
  onClose,
  onSubmit,
  onReset,
}) {
  if (!open) return null;

  const isExitEvent =
    form.eventType === "Pipeline Drop-off" ||
    form.eventType === "Offer Declined" ||
    form.eventType === "Pre-start Withdrawal" ||
    form.eventType === "No Show";

  function handleCandidateChange(candidateId) {
    const selectedCandidate = candidatesForExperience.find(
      (candidate) => candidate.candidateId === candidateId
    );

    if (!selectedCandidate) {
      setForm(emptyExperienceForm);
      return;
    }

    setForm({
      ...form,
      candidateId: selectedCandidate.candidateId,
      candidateName: selectedCandidate.candidateName,
      candidateEmail: selectedCandidate.candidateEmail,
      roleTitle: selectedCandidate.roleTitle,
      account: selectedCandidate.account,
      source: selectedCandidate.source,
      owner: selectedCandidate.owner,
      currentStage: selectedCandidate.currentStage,
      dropOffStage: selectedCandidate.currentStage,
    });
  }

  function handleEventTypeChange(eventType) {
    const isFeedbackOnly = eventType === "Candidate Feedback";

    setForm({
      ...form,
      eventType,
      reasonCategory: isFeedbackOnly ? "Positive Experience" : "",
      reason: "",
      dropOffStage: isFeedbackOnly ? "" : form.currentStage,
      feedbackTag: isFeedbackOnly ? "Positive Experience" : "",
      experienceRating: isFeedbackOnly ? 5 : form.experienceRating,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Add Candidate Experience Record
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Record candidate feedback, exit reason, and 1–5 star experience
              rating.
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
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Candidate Source Data
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Candidate <span className="text-red-500">*</span>
                    </label>

                    <select
                      required
                      value={form.candidateId}
                      onChange={(e) => handleCandidateChange(e.target.value)}
                      className={inputClass()}
                    >
                      <option value="">Select candidate</option>
                      {candidatesForExperience.map((candidate) => (
                        <option
                          key={candidate.candidateId}
                          value={candidate.candidateId}
                        >
                          {candidate.candidateName} — {candidate.roleTitle} /{" "}
                          {candidate.account}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Candidate Name
                    </label>

                    <input
                      readOnly
                      value={form.candidateName}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Candidate Email
                    </label>

                    <input
                      readOnly
                      value={form.candidateEmail}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Role
                    </label>

                    <input
                      readOnly
                      value={form.roleTitle}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Account
                    </label>

                    <input
                      readOnly
                      value={form.account}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Source
                    </label>

                    <input
                      readOnly
                      value={form.source}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Owner
                    </label>

                    <select
                      value={form.owner}
                      onChange={(e) =>
                        setForm({ ...form, owner: e.target.value })
                      }
                      className={inputClass()}
                    >
                      <option value="">Select owner</option>
                      {ownerOptions.map((owner) => (
                        <option key={owner} value={owner}>
                          {owner}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Experience Details
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Event Type <span className="text-red-500">*</span>
                    </label>

                    <select
                      required
                      value={form.eventType}
                      onChange={(e) => handleEventTypeChange(e.target.value)}
                      className={inputClass()}
                    >
                      {eventTypeOptions.map((eventType) => (
                        <option key={eventType} value={eventType}>
                          {eventType}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Current Stage
                    </label>

                    <select
                      value={form.currentStage}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          currentStage: e.target.value,
                          dropOffStage: isExitEvent
                            ? e.target.value
                            : form.dropOffStage,
                        })
                      }
                      className={inputClass()}
                    >
                      <option value="">Select stage</option>
                      {candidateStageOptions.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isExitEvent && (
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                        Drop-off / Exit Stage{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <select
                        required
                        value={form.dropOffStage}
                        onChange={(e) =>
                          setForm({ ...form, dropOffStage: e.target.value })
                        }
                        className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                      >
                        <option value="">Select exit stage</option>
                        {candidateStageOptions.map((stage) => (
                          <option key={stage} value={stage}>
                            {stage}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Reason Category <span className="text-red-500">*</span>
                    </label>

                    <select
                      required
                      value={form.reasonCategory}
                      onChange={(e) =>
                        setForm({ ...form, reasonCategory: e.target.value })
                      }
                      className={inputClass()}
                    >
                      <option value="">Select reason category</option>
                      {reasonCategoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Reason <span className="text-red-500">*</span>
                    </label>

                    <textarea
                      required
                      value={form.reason}
                      onChange={(e) =>
                        setForm({ ...form, reason: e.target.value })
                      }
                      rows={3}
                      placeholder="Example: Candidate declined due to salary expectation mismatch."
                      className={textareaClass()}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Candidate Feedback
                    </label>

                    <textarea
                      value={form.feedback}
                      onChange={(e) =>
                        setForm({ ...form, feedback: e.target.value })
                      }
                      rows={3}
                      placeholder="Example: The recruiter was responsive, but the offer process took too long."
                      className={textareaClass()}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Experience Rating <span className="text-red-500">*</span>
                    </label>

                    <StarRatingInput
                      value={form.experienceRating}
                      onChange={(rating) =>
                        setForm({ ...form, experienceRating: rating })
                      }
                    />

                    <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
                      The selected stars are saved as a number from 1 to 5.
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Feedback Tag
                    </label>

                    <input
                      value={form.feedbackTag}
                      onChange={(e) =>
                        setForm({ ...form, feedbackTag: e.target.value })
                      }
                      placeholder="Example: Compensation Concern, Process Delay, Positive Experience"
                      className={inputClass()}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Where this data comes from
                </h3>

                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  This page reads records created by Candidate Pipeline, Offers,
                  Onboarding, and manual Candidate Experience entries.
                </p>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Star Rating Storage
                </h3>

                <div className="mt-4">
                  <DetailRow
                    label="Rating Value"
                    value={`${form.experienceRating}/5`}
                  />
                  <DetailRow label="Stored As" value="Integer number" />
                  <DetailRow label="Database Column" value="experience_rating" />
                  <DetailRow label="Display" value="Converted to stars in UI" />
                </div>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                <h3 className="text-sm font-bold text-amber-700">
                  Backend Later
                </h3>

                <p className="mt-2 text-sm leading-6 text-amber-700/90">
                  Replace localStorage with GET/POST
                  /api/recruitment/candidate-experience when backend is ready.
                </p>
              </div>
            </div>
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5"
            >
              <RotateCcw size={17} />
              Reset
            </button>

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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <Plus size={17} />
              Save Experience
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CandidateExperienceModal({ open, record, onClose }) {
  if (!open || !record) return null;

  const timeline = Array.isArray(record.stageTimeline)
    ? record.stageTimeline
    : [];

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
              Candidate Experience Details
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Drop-off stage, reason category, candidate feedback, and rating.
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
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-[#101828] sm:text-xl">
                      {record.candidateName}
                    </h3>

                    <p className="mt-1 break-words text-sm font-semibold text-sibs-tertiary-5">
                      {record.candidateEmail}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                          record.finalStatus
                        )}`}
                      >
                        {record.finalStatus}
                      </span>

                      {record.dropOffCategory && (
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getDropOffClass(
                            record.dropOffCategory
                          )}`}
                        >
                          {record.dropOffCategory}
                        </span>
                      )}

                      <span className="inline-flex rounded-full border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-1 text-xs font-bold text-[#344054]">
                        {record.source || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1/70">
                      Experience Rating
                    </p>

                    <div className="mt-2 flex justify-center">
                      <RatingStars rating={record.experienceRating} />
                    </div>

                    <p className="mt-1 text-2xl font-bold text-sibs-primary-1">
                      {record.experienceRating || 0}/5
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <ListChecks size={18} className="text-sibs-primary-1" />

                  <h3 className="text-sm font-bold text-[#101828]">
                    Candidate Stage Timeline
                  </h3>
                </div>

                <div className="space-y-4">
                  {timeline.length > 0 ? (
                    timeline.map((item, index) => (
                      <div
                        key={`${item.stage}-${index}`}
                        className="relative flex gap-4"
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold ${getTimelineClass(
                              item.status
                            )}`}
                          >
                            {index + 1}
                          </div>

                          {index !== timeline.length - 1 && (
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
                                {formatDate(item.date)}
                              </p>
                            </div>

                            <span
                              className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${getTimelineClass(
                                item.status
                              )}`}
                            >
                              {item.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#E6ECF2] bg-[#F8FAFC] p-5 text-center text-sm font-bold text-sibs-tertiary-5">
                      No timeline recorded.
                    </div>
                  )}
                </div>
              </div>

              {record.finalStatus === "Drop-off" && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-5">
                  <h3 className="text-sm font-bold text-red-700">
                    Drop-off / Exit Details
                  </h3>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-red-100 bg-white p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-red-400">
                        Exit Stage
                      </p>

                      <p className="mt-1 text-sm font-bold text-red-700">
                        {record.dropOffStage || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-red-100 bg-white p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-red-400">
                        Reason Category
                      </p>

                      <p className="mt-1 text-sm font-bold text-red-700">
                        {record.dropOffCategory || "—"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 rounded-xl border border-red-100 bg-white p-4 text-sm leading-6 text-red-700">
                    {record.dropOffReason || "No drop-off reason recorded."}
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#101828]">
                  Candidate Feedback
                </h3>

                <p className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#344054]">
                  {record.feedback || "No candidate feedback recorded."}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Candidate Summary
                </h3>

                <div className="mt-4">
                  <DetailRow label="Candidate ID" value={record.candidateId} />
                  <DetailRow label="Event Type" value={record.eventType} />
                  <DetailRow label="Role" value={record.roleTitle} />
                  <DetailRow label="Account" value={record.account} />
                  <DetailRow label="Source" value={record.source} />
                  <DetailRow label="Current Stage" value={record.currentStage} />
                  <DetailRow label="Final Status" value={record.finalStatus} />
                  <DetailRow label="Owner" value={record.owner} />
                  <DetailRow
                    label="Date Recorded"
                    value={formatDate(record.dateRecorded)}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#101828]">
                  Candidate Perception
                </h3>

                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Rating
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <RatingStars rating={record.experienceRating} />

                      <p className="text-sm font-bold text-sibs-primary-1">
                        {record.experienceRating || 0}/5
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Feedback Tag
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#344054]">
                      {record.feedbackTag || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Rating Rule
                </h3>

                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  The star rating is saved as a number from 1 to 5. The frontend
                  only converts that number into stars.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                <h3 className="text-sm font-bold text-emerald-700">
                  Employer Branding Data
                </h3>

                <p className="mt-2 text-sm leading-6 text-emerald-700/90">
                  Candidate feedback and experience rating should be saved at
                  candidate level so TA can analyze perception trends over time.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-sibs-primary-1 px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CandidateExperiencePage() {
  const [experienceList, setExperienceList] = useState(
    initialCandidateExperienceRecords
  );

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All Stages");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [ratingFilter, setRatingFilter] = useState("All Ratings");
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [experienceForm, setExperienceForm] = useState(emptyExperienceForm);

  useEffect(() => {
    function loadStoredRecords() {
      const storedRecords = getCandidateExperienceRecords();

      setExperienceList(
        mergeExperienceRecords(storedRecords, initialCandidateExperienceRecords)
      );
    }

    loadStoredRecords();

    window.addEventListener("candidate-experience-updated", loadStoredRecords);
    window.addEventListener("storage", loadStoredRecords);

    return () => {
      window.removeEventListener(
        "candidate-experience-updated",
        loadStoredRecords
      );
      window.removeEventListener("storage", loadStoredRecords);
    };
  }, []);

  function handleOpenAddModal() {
    setShowAddModal(true);
    setExperienceForm(emptyExperienceForm);
  }

  function handleCloseAddModal() {
    setShowAddModal(false);
    setExperienceForm(emptyExperienceForm);
  }

  function handleResetExperienceForm() {
    setExperienceForm(emptyExperienceForm);
  }

  function handleAddExperienceRecord(e) {
    e.preventDefault();

    if (!experienceForm.candidateId) {
      alert("Candidate is required.");
      return;
    }

    if (!experienceForm.eventType) {
      alert("Event type is required.");
      return;
    }

    if (!experienceForm.currentStage) {
      alert("Current stage is required.");
      return;
    }

    const isExitEvent =
      experienceForm.eventType === "Pipeline Drop-off" ||
      experienceForm.eventType === "Offer Declined" ||
      experienceForm.eventType === "Pre-start Withdrawal" ||
      experienceForm.eventType === "No Show";

    if (isExitEvent && !experienceForm.dropOffStage) {
      alert("Drop-off / exit stage is required.");
      return;
    }

    if (!experienceForm.reasonCategory) {
      alert("Reason category is required.");
      return;
    }

    if (!experienceForm.reason.trim()) {
      alert("Reason is required.");
      return;
    }

    if (
      !experienceForm.experienceRating ||
      Number(experienceForm.experienceRating) < 1 ||
      Number(experienceForm.experienceRating) > 5
    ) {
      alert("Experience rating must be from 1 to 5.");
      return;
    }

    const finalStatus = isExitEvent ? "Drop-off" : "Completed";

    const newRecord = {
      id: `EXP-MANUAL-${Date.now()}`,
      candidateId: experienceForm.candidateId,
      candidateName: experienceForm.candidateName,
      candidateEmail: experienceForm.candidateEmail,
      roleTitle: experienceForm.roleTitle,
      account: experienceForm.account,
      source: experienceForm.source,
      eventType: experienceForm.eventType,
      currentStage: experienceForm.currentStage,
      finalStatus,
      dropOffStage: isExitEvent ? experienceForm.dropOffStage : null,
      dropOffCategory: isExitEvent ? experienceForm.reasonCategory : null,
      dropOffReason: isExitEvent ? experienceForm.reason.trim() : null,
      feedback: experienceForm.feedback.trim(),
      experienceRating: Number(experienceForm.experienceRating),
      feedbackTag:
        experienceForm.feedbackTag.trim() || experienceForm.reasonCategory,
      owner: experienceForm.owner,
      dateRecorded: getTodayDate(),
      stageTimeline: [
        {
          stage: "Sourced",
          status: "Completed",
          date: getTodayDate(),
        },
        {
          stage: experienceForm.currentStage,
          status: finalStatus,
          date: getTodayDate(),
        },
      ],
    };

    const savedRecord = saveCandidateExperienceRecord(newRecord) || newRecord;

    setExperienceList((prev) => mergeExperienceRecords([savedRecord], prev));
    setSelectedRecord(savedRecord);
    handleCloseAddModal();
  }

  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return experienceList.filter((record) => {
      const matchesSearch =
        !keyword ||
        safeText(record.candidateId).includes(keyword) ||
        safeText(record.candidateName).includes(keyword) ||
        safeText(record.candidateEmail).includes(keyword) ||
        safeText(record.roleTitle).includes(keyword) ||
        safeText(record.account).includes(keyword) ||
        safeText(record.owner).includes(keyword) ||
        safeText(record.feedbackTag).includes(keyword);

      const matchesStage =
        stageFilter === "All Stages" ||
        record.dropOffStage === stageFilter ||
        record.currentStage === stageFilter;

      const matchesCategory =
        categoryFilter === "All Categories" ||
        record.dropOffCategory === categoryFilter;

      const matchesRating =
        ratingFilter === "All Ratings" ||
        String(record.experienceRating) === ratingFilter;

      return matchesSearch && matchesStage && matchesCategory && matchesRating;
    });
  }, [experienceList, search, stageFilter, categoryFilter, ratingFilter]);

  const stats = useMemo(() => {
    const total = experienceList.length;

    const dropOffs = experienceList.filter(
      (record) => record.finalStatus === "Drop-off"
    ).length;

    const completed = experienceList.filter(
      (record) => record.finalStatus === "Completed"
    ).length;

    const averageRating =
      total > 0
        ? (
            experienceList.reduce(
              (sum, record) => sum + Number(record.experienceRating || 0),
              0
            ) / total
          ).toFixed(1)
        : "0.0";

    const lowRating = experienceList.filter(
      (record) => Number(record.experienceRating) <= 2
    ).length;

    const positiveRating = experienceList.filter(
      (record) => Number(record.experienceRating) >= 4
    ).length;

    return {
      total,
      dropOffs,
      completed,
      averageRating,
      lowRating,
      positiveRating,
    };
  }, [experienceList]);

  const dropOffByStage = useMemo(() => {
    const records = experienceList.filter(
      (record) => record.finalStatus === "Drop-off"
    );

    return records.reduce((acc, record) => {
      const key = record.dropOffStage || "Unspecified";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [experienceList]);

  const dropOffByCategory = useMemo(() => {
    const records = experienceList.filter(
      (record) => record.finalStatus === "Drop-off"
    );

    return records.reduce((acc, record) => {
      const key = record.dropOffCategory || "Unspecified";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [experienceList]);

  const maxStageDropOff = Math.max(1, ...Object.values(dropOffByStage));
  const maxCategoryDropOff = Math.max(1, ...Object.values(dropOffByCategory));

  const topStage =
    Object.entries(dropOffByStage).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  const topCategory =
    Object.entries(dropOffByCategory).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "—";

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <BookOpen size={28} className="shrink-0 text-sibs-primary-1" />

            <h1 className="min-w-0 break-words text-2xl font-bold text-sibs-primary-1 sm:text-4xl">
              Candidate Experience
            </h1>
          </div>

          <p className="mt-1 text-sm text-sibs-tertiary-5">
            Drop-off tracking, candidate feedback, and experience rating.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard
            title="Records"
            value={stats.total}
            icon={UsersRound}
            description="Experience records"
          />

          <StatCard
            title="Drop-offs"
            value={stats.dropOffs}
            icon={UserX}
            description="Exited candidates"
          />

          <StatCard
            title="Completed"
            value={stats.completed}
            icon={CheckCircle2}
            description="Completed process"
          />

          <StatCard
            title="Avg. Rating"
            value={stats.averageRating}
            icon={Star}
            description="Out of 5"
          />

          <StatCard
            title="Positive Ratings"
            value={stats.positiveRating}
            icon={ThumbsUp}
            description="4 to 5 rating"
          />

          <StatCard
            title="Low Ratings"
            value={stats.lowRating}
            icon={ThumbsDown}
            description="Needs review"
          />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_420px]">
          <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-sibs-primary-1">
                  Drop-offs by Stage
                </h2>

                <p className="text-sm text-sibs-tertiary-5">
                  Shows where candidates are lost.
                </p>
              </div>

              <BarChart3 size={20} className="shrink-0 text-gray-400" />
            </div>

            <div className="space-y-5">
              {Object.entries(dropOffByStage).length > 0 ? (
                Object.entries(dropOffByStage).map(([stage, count]) => (
                  <BarRow
                    key={stage}
                    label={stage}
                    value={count}
                    max={maxStageDropOff}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-[#E6ECF2] bg-[#F8FAFC] p-5 text-center text-sm font-bold text-sibs-tertiary-5">
                  No drop-off data yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-sibs-primary-1">
                  Drop-offs by Reason
                </h2>

                <p className="text-sm text-sibs-tertiary-5">
                  Shows why candidates exit.
                </p>
              </div>

              <AlertTriangle size={20} className="shrink-0 text-gray-400" />
            </div>

            <div className="space-y-5">
              {Object.entries(dropOffByCategory).length > 0 ? (
                Object.entries(dropOffByCategory).map(([category, count]) => (
                  <BarRow
                    key={category}
                    label={category}
                    value={count}
                    max={maxCategoryDropOff}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-[#E6ECF2] bg-[#F8FAFC] p-5 text-center text-sm font-bold text-sibs-tertiary-5">
                  No drop-off reason data yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white p-3 text-sibs-primary-1">
                <MessageSquareText size={22} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-sibs-primary-1">
                  Candidate Experience Insight
                </h3>

                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  Most candidate losses currently happen during{" "}
                  <span className="font-bold">{topStage}</span>. The top
                  recorded reason is{" "}
                  <span className="font-bold">{topCategory}</span>.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-semibold text-sibs-primary-1">
              Candidate Experience Records
            </h3>

            <p className="text-sm text-sibs-tertiary-5">
              Drop-off reason, feedback, rating, and stage-level records.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
          >
            <Plus size={18} />
            Add Experience Record
          </button>
        </div>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_300px_170px_210px_150px] xl:items-center">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-sibs-primary-1">
                  Candidate Experience List
                </h2>

                <p className="text-sm text-sibs-tertiary-5">
                  Search and filter candidate experience records.
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
                  placeholder="Search candidate, role, feedback..."
                  className={inputClass("pl-11 pr-4")}
                />
              </div>

              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className={inputClass()}
              >
                {stageOptions.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={inputClass()}
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className={inputClass()}
              >
                {ratingOptions.map((rating) => (
                  <option key={rating} value={rating}>
                    {rating === "All Ratings" ? rating : `${rating} Star`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="space-y-3 lg:hidden">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <ExperienceMobileCard
                    key={record.id}
                    record={record}
                    onView={() => setSelectedRecord(record)}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                  No candidate experience records found.
                </div>
              )}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-[#E6ECF2] lg:block">
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full min-w-[1220px] border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
                    <tr className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      <th className="px-5 py-4">Candidate</th>
                      <th className="px-5 py-4">Role / Account</th>
                      <th className="px-5 py-4">Event</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Exit Stage</th>
                      <th className="px-5 py-4">Reason Category</th>
                      <th className="px-5 py-4">Rating</th>
                      <th className="px-5 py-4">Feedback Tag</th>
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((record) => (
                        <tr
                          key={record.id}
                          className="transition hover:bg-[#F8FAFC]"
                        >
                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-[#101828]">
                              {record.candidateName}
                            </p>

                            <p className="text-xs font-semibold text-sibs-tertiary-5">
                              {record.candidateEmail}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-[#344054]">
                              {record.roleTitle}
                            </p>

                            <p className="text-xs font-semibold text-sibs-tertiary-5">
                              {record.account}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                            {record.eventType}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                                record.finalStatus
                              )}`}
                            >
                              {record.finalStatus}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                            {record.dropOffStage || "—"}
                          </td>

                          <td className="px-5 py-4">
                            {record.dropOffCategory ? (
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getDropOffClass(
                                  record.dropOffCategory
                                )}`}
                              >
                                {record.dropOffCategory}
                              </span>
                            ) : (
                              <span className="text-sm font-semibold text-gray-400">
                                —
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <RatingStars rating={record.experienceRating} />
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                            {record.feedbackTag || "—"}
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                            <div className="flex items-center gap-2">
                              <CalendarDays
                                size={15}
                                className="text-gray-400"
                              />
                              {formatDate(record.dateRecorded)}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedRecord(record)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 py-2 text-xs font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5"
                            >
                              <Eye size={15} />
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                        >
                          No candidate experience records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <p className="text-sm font-semibold text-sibs-tertiary-5">
                Showing 1 to {filteredRecords.length} of{" "}
                {experienceList.length} candidate experience records
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-sibs-primary-1 text-sm font-bold text-white"
                >
                  1
                </button>

                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-sm font-bold text-gray-600 transition hover:bg-gray-50"
                >
                  2
                </button>

                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h3 className="text-sm font-bold text-sibs-primary-1">
            Candidate Experience Rule
          </h3>

          <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
            The data comes from Candidate Pipeline drop-offs, Offer declines,
            Onboarding no-shows or withdrawals, and manual candidate feedback.
            The star rating is saved as a number from 1 to 5 and only displayed
            as stars in the frontend.
          </p>
        </section>
      </main>

      <AddExperienceModal
        open={showAddModal}
        form={experienceForm}
        setForm={setExperienceForm}
        onClose={handleCloseAddModal}
        onSubmit={handleAddExperienceRecord}
        onReset={handleResetExperienceForm}
      />

      <CandidateExperienceModal
        open={!!selectedRecord}
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}