import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/layout/Header";
import {
  BriefcaseBusiness,
  Gift,
  Search,
  Eye,
  Plus,
  X,
  CalendarDays,
  DollarSign,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  FileText,
  Timer,
  Star,
  RotateCcw,
} from "lucide-react";
import { saveCandidateExperienceRecord } from "@/lib/utils/candidateExperienceStore";

const OFFER_ELIGIBLE_STORAGE_KEY = "ta_offer_eligible_candidates";
const PIPELINE_SYNC_EVENTS_KEY = "ta_pipeline_sync_events";

const offerRecords = [
  {
    id: 1,
    offerId: "OFF-001",
    candidateApplicationId: 1,
    candidateId: "CAND-001",
    candidateName: "Juan Dela Cruz",
    candidateEmail: "juan.delacruz@email.com",
    roleAccount: "CSR - SIBS Operations",
    roleTitle: "Customer Service Representative",
    account: "SIBS Operations",
    offerDate: "2026-05-01",
    basicPay: 22000,
    deMinimis: 3000,
    dailyRate: 25000,
    offeredCompensation: 25000,
    status: "Accepted",
    acceptedDate: "2026-05-03",
    declinedDate: null,
    declineCategory: null,
    declineReason: null,
    candidateFeedback: null,
    experienceRating: null,
    feedbackTag: null,
    turnaroundDays: 2,
    owner: "Maria Reyes",
    remarks: "Candidate accepted within target turnaround time.",
  },
  {
    id: 2,
    offerId: "OFF-002",
    candidateApplicationId: 8,
    candidateId: "CAND-008",
    candidateName: "Maria Santos",
    candidateEmail: "maria.santos@email.com",
    roleAccount: "QA - SIBS Operations",
    roleTitle: "QA Specialist",
    account: "SIBS Operations",
    offerDate: "2026-05-02",
    basicPay: 27000,
    deMinimis: 3000,
    dailyRate: 30000,
    offeredCompensation: 30000,
    status: "Pending",
    acceptedDate: null,
    declinedDate: null,
    declineCategory: null,
    declineReason: null,
    candidateFeedback: null,
    experienceRating: null,
    feedbackTag: null,
    turnaroundDays: 3,
    owner: "John Dela Cruz",
    remarks: "Awaiting candidate response.",
  },
  {
    id: 3,
    offerId: "OFF-003",
    candidateApplicationId: 2,
    candidateId: "CAND-002",
    candidateName: "Carlo Reyes",
    candidateEmail: "carlo.reyes@email.com",
    roleAccount: "System Developer - SIBS IT",
    roleTitle: "System Developer",
    account: "SIBS IT",
    offerDate: "2026-04-28",
    basicPay: 40000,
    deMinimis: 5000,
    dailyRate: 45000,
    offeredCompensation: 45000,
    status: "Declined",
    acceptedDate: null,
    declinedDate: "2026-04-30",
    declineCategory: "Accepted Other Offer",
    declineReason: "Accepted another offer with higher compensation.",
    candidateFeedback:
      "The process was good, but another company provided a faster and higher offer.",
    experienceRating: 4,
    feedbackTag: "Offer Competitiveness",
    turnaroundDays: 2,
    owner: "Kim Domingo",
    remarks: "Compensation mismatch. Can be considered for future higher range.",
  },
  {
    id: 4,
    offerId: "OFF-004",
    candidateApplicationId: 9,
    candidateId: "CAND-009",
    candidateName: "Angela Lim",
    candidateEmail: "angela.lim@email.com",
    roleAccount: "RCM Analyst - SIBS RCM",
    roleTitle: "RCM Analyst",
    account: "SIBS RCM",
    offerDate: "2026-05-04",
    basicPay: 29000,
    deMinimis: 3000,
    dailyRate: 32000,
    offeredCompensation: 32000,
    status: "Accepted",
    acceptedDate: "2026-05-05",
    declinedDate: null,
    declineCategory: null,
    declineReason: null,
    candidateFeedback: null,
    experienceRating: null,
    feedbackTag: null,
    turnaroundDays: 1,
    owner: "Paul Garcia",
    remarks: "Ready for onboarding transition.",
  },
  {
    id: 5,
    offerId: "OFF-005",
    candidateApplicationId: 3,
    candidateId: "CAND-003",
    candidateName: "Mark Sy",
    candidateEmail: "mark.sy@email.com",
    roleAccount: "IT Support - SIBS IT",
    roleTitle: "IT Support",
    account: "SIBS IT",
    offerDate: "2026-05-01",
    basicPay: 25000,
    deMinimis: 3000,
    dailyRate: 28000,
    offeredCompensation: 28000,
    status: "Declined",
    acceptedDate: null,
    declinedDate: "2026-05-04",
    declineCategory: "Schedule",
    declineReason: "Schedule conflict with candidate availability.",
    candidateFeedback: "The role was okay, but the shift schedule was not fit.",
    experienceRating: 3,
    feedbackTag: "Schedule Concern",
    turnaroundDays: 3,
    owner: "Maria Reyes",
    remarks: "Candidate declined due to schedule concern.",
  },
];

const statusOptions = ["All Status", "Pending", "Accepted", "Declined"];

const ownerOptions = [
  "All Owners",
  "Maria Reyes",
  "John Dela Cruz",
  "Kim Domingo",
  "Paul Garcia",
];

const accountOptions = [
  "All Accounts",
  "SIBS",
  "SIBS Operations",
  "SIBS IT",
  "SIBS RCM",
];

const declineCategoryOptions = [
  "Compensation",
  "Schedule",
  "Process Delay",
  "Accepted Other Offer",
  "Location Issue",
  "Personal Reason",
  "Incomplete Requirements",
  "Others",
];

const defaultEligibleCandidates = [
  {
    candidateApplicationId: 4,
    candidateId: "CAND-004",
    candidateName: "Kim Cruz",
    candidateEmail: "kim.cruz@email.com",
    roleTitle: "CSR",
    account: "SIBS",
    roleAccount: "CSR - SIBS",
    owner: "Paul Garcia",
    currentStage: "Offered",
    source: "Referral",
  },
];

const emptyOfferForm = {
  candidateApplicationId: "",
  candidateId: "",
  candidateEmail: "",
  candidateName: "",
  roleTitle: "",
  account: "",
  roleAccount: "",
  offerDate: new Date().toISOString().split("T")[0],
  basicPay: "",
  deMinimis: "",
  dailyRate: 0,
  offeredCompensation: "",
  status: "Pending",
  acceptedDate: "",
  declinedDate: "",
  declineCategory: "",
  declineReason: "",
  candidateFeedback: "",
  experienceRating: 3,
  feedbackTag: "",
  owner: "",
  remarks: "",
  source: "",
};

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

function mergeUniqueCandidates(items) {
  const map = new Map();

  items.forEach((item) => {
    const key =
      item.candidateApplicationId || item.candidateId || item.candidateEmail;

    if (!key) return;

    map.set(String(key), item);
  });

  return Array.from(map.values());
}

function removeEligibleCandidate(candidate) {
  const current = safeReadArray(OFFER_ELIGIBLE_STORAGE_KEY);

  const next = current.filter(
    (item) =>
      String(item.candidateApplicationId) !==
        String(candidate.candidateApplicationId) &&
      item.candidateEmail !== candidate.candidateEmail
  );

  safeWriteArray(OFFER_ELIGIBLE_STORAGE_KEY, next);
}

function appendPipelineSyncEvent(event) {
  const current = safeReadArray(PIPELINE_SYNC_EVENTS_KEY);
  safeWriteArray(PIPELINE_SYNC_EVENTS_KEY, [event, ...current]);
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
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

function generateOfferId(nextNumber) {
  return `OFF-${String(nextNumber).padStart(3, "0")}`;
}

function calculateTurnaroundDays(offerDate, responseDate) {
  if (!offerDate || !responseDate) return 0;

  const start = new Date(offerDate);
  const end = new Date(responseDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diff = end.getTime() - start.getTime();

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return "—";

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateDailyRate(basicPay, deMinimis) {
  return toNumber(basicPay) + toNumber(deMinimis);
}

function getOfferDailyRate(offer) {
  return toNumber(
    offer.dailyRate ||
      offer.offeredCompensation ||
      calculateDailyRate(offer.basicPay, offer.deMinimis)
  );
}

function getStatusClass(status) {
  switch (status) {
    case "Accepted":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Declined":
      return "border-red-200 bg-red-50 text-red-700";
    case "Pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getTurnaroundClass(days) {
  if (days <= 2) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (days <= 4) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-red-200 bg-red-50 text-red-700";
}

function RatingStars({ rating }) {
  const numericRating = Number(rating || 0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= numericRating;

        return (
          <Star
            key={star}
            size={15}
            className={active ? "text-amber-400" : "text-gray-300"}
            fill={active ? "currentColor" : "none"}
          />
        );
      })}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, description }) {
  return (
    <div className="flex min-w-0 items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--sibs-primary-1)] text-white">
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

function ProgressBar({ label, value, total }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="min-w-0 truncate text-sm font-bold text-[#344054]">
          {label}
        </p>
        <p className="shrink-0 text-sm font-bold text-sibs-primary-1">
          {percentage}%
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]">
        <div
          className="h-full rounded-full bg-[var(--sibs-primary-1)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function OfferMobileCard({ offer, onView, onUpdate }) {
  return (
    <div className="w-full rounded-xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-[var(--sibs-primary-1)]/40 hover:bg-[#F8FAFC]">
      <button type="button" onClick={onView} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-sibs-primary-1">
              {offer.offerId}
            </p>
            <h3 className="mt-1 text-sm font-bold text-[#101828]">
              {offer.candidateName}
            </h3>
            <p className="mt-1 break-words text-xs font-semibold text-sibs-tertiary-5">
              {offer.roleTitle} / {offer.account}
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
              offer.status
            )}`}
          >
            {offer.status}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-[#F8FAFC] p-3">
            <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
              Daily Rate
            </p>
            <p className="mt-1 text-xs font-bold text-[#344054]">
              {formatCurrency(getOfferDailyRate(offer))}
            </p>
          </div>

          <div className="rounded-lg bg-[#F8FAFC] p-3">
            <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
              Turnaround
            </p>
            <p className="mt-1 text-xs font-bold text-[#344054]">
              {offer.turnaroundDays} day/s
            </p>
          </div>
        </div>

        <div className="mt-3 text-xs font-semibold text-sibs-tertiary-5">
          Offer Date:{" "}
          <span className="font-bold text-[#344054]">
            {formatDate(offer.offerDate)}
          </span>
        </div>

        <div className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
          Owner:{" "}
          <span className="font-bold text-[#344054]">{offer.owner}</span>
        </div>

        {offer.status === "Declined" && offer.declineReason && (
          <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold leading-5 text-red-700">
            {offer.declineReason}
          </div>
        )}
      </button>

      <div className="mt-4 flex gap-2">
        {offer.status === "Pending" && (
          <button
            type="button"
            onClick={onUpdate}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-3 py-2 text-xs font-bold text-white transition hover:opacity-90"
          >
            <CheckCircle2 size={15} />
            Update
          </button>
        )}

        <button
          type="button"
          onClick={onView}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-3 py-2 text-xs font-bold text-sibs-primary-1 transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5"
        >
          <Eye size={15} />
          View
        </button>
      </div>
    </div>
  );
}

function CreateOfferModal({
  open,
  form,
  setForm,
  eligibleCandidates,
  onClose,
  onSubmit,
  onReset,
}) {
  if (!open) return null;

  function handleCandidateChange(value) {
    const selectedCandidate = eligibleCandidates.find(
      (candidate) =>
        String(candidate.candidateApplicationId) === String(value) ||
        candidate.candidateEmail === value
    );

    if (!selectedCandidate) {
      setForm({
        ...form,
        candidateApplicationId: "",
        candidateId: "",
        candidateEmail: "",
        candidateName: "",
        roleTitle: "",
        account: "",
        roleAccount: "",
        owner: "",
        source: "",
      });
      return;
    }

    setForm({
      ...form,
      candidateApplicationId: selectedCandidate.candidateApplicationId,
      candidateId: selectedCandidate.candidateId,
      candidateEmail: selectedCandidate.candidateEmail,
      candidateName: selectedCandidate.candidateName,
      roleTitle: selectedCandidate.roleTitle,
      account: selectedCandidate.account,
      roleAccount: selectedCandidate.roleAccount,
      owner: selectedCandidate.owner,
      source: selectedCandidate.source || "Offer Management",
    });
  }

  function handleStatusChange(status) {
    setForm({
      ...form,
      status,
      acceptedDate: status === "Accepted" ? getTodayDate() : "",
      declinedDate: status === "Declined" ? getTodayDate() : "",
      declineCategory: status === "Declined" ? form.declineCategory : "",
      declineReason: status === "Declined" ? form.declineReason : "",
      candidateFeedback: status === "Declined" ? form.candidateFeedback : "",
      experienceRating: status === "Declined" ? form.experienceRating || 3 : 3,
      feedbackTag: status === "Declined" ? form.feedbackTag : "",
    });
  }

  function handleBasicPayChange(value) {
    const dailyRate = calculateDailyRate(value, form.deMinimis);

    setForm({
      ...form,
      basicPay: value,
      dailyRate,
      offeredCompensation: dailyRate,
    });
  }

  function handleDeMinimisChange(value) {
    const dailyRate = calculateDailyRate(form.basicPay, value);

    setForm({
      ...form,
      deMinimis: value,
      dailyRate,
      offeredCompensation: dailyRate,
    });
  }

  const computedDailyRate = calculateDailyRate(form.basicPay, form.deMinimis);

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Create Offer
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Create an offer from a candidate already moved to the Offered
              stage.
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
                  Candidate and Role Information
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Candidate <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={form.candidateApplicationId}
                      onChange={(e) => handleCandidateChange(e.target.value)}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                    >
                      <option value="">Select candidate from Offered stage</option>
                      {eligibleCandidates.map((candidate) => (
                        <option
                          key={`${candidate.candidateApplicationId}-${candidate.candidateEmail}`}
                          value={candidate.candidateApplicationId}
                        >
                          {candidate.candidateName} — {candidate.roleAccount}
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
                      Role Title
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
                      TA Owner
                    </label>
                    <input
                      readOnly
                      value={form.owner}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Offer Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="date"
                      value={form.offerDate}
                      onChange={(e) =>
                        setForm({ ...form, offerDate: e.target.value })
                      }
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Offer Details
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Basic Pay <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={form.basicPay}
                      onChange={(e) => handleBasicPayChange(e.target.value)}
                      placeholder="Example: 22000"
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      De Minimis <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={form.deMinimis}
                      onChange={(e) => handleDeMinimisChange(e.target.value)}
                      placeholder="Example: 3000"
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Daily Rate
                    </label>
                    <input
                      readOnly
                      value={formatCurrency(computedDailyRate)}
                      className="h-11 w-full cursor-not-allowed rounded-xl border border-blue-100 bg-blue-50 px-4 text-sm font-bold text-sibs-primary-1 outline-none"
                    />
                    <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
                      Daily Rate is automatically computed as Basic Pay + De
                      Minimis.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Initial Offer Status{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={form.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Declined">Declined</option>
                    </select>
                  </div>

                  {form.status === "Accepted" && (
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                        Accepted Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="date"
                        value={form.acceptedDate}
                        onChange={(e) =>
                          setForm({ ...form, acceptedDate: e.target.value })
                        }
                        className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                      />
                    </div>
                  )}

                  {form.status === "Declined" && (
                    <>
                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                          Declined Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="date"
                          value={form.declinedDate}
                          onChange={(e) =>
                            setForm({ ...form, declinedDate: e.target.value })
                          }
                          className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                          Decline Category{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={form.declineCategory}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              declineCategory: e.target.value,
                            })
                          }
                          className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                        >
                          <option value="">Select decline category</option>
                          {declineCategoryOptions.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                          Decline Reason{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          required
                          value={form.declineReason}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              declineReason: e.target.value,
                            })
                          }
                          rows={3}
                          placeholder="Example: Candidate accepted another offer with higher compensation."
                          className="w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                          Candidate Feedback
                        </label>
                        <textarea
                          value={form.candidateFeedback}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              candidateFeedback: e.target.value,
                            })
                          }
                          rows={3}
                          placeholder="Optional candidate feedback regarding the offer."
                          className="w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                          Experience Rating
                        </label>
                        <select
                          value={form.experienceRating}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              experienceRating: Number(e.target.value),
                            })
                          }
                          className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                        >
                          <option value={5}>5 - Excellent</option>
                          <option value={4}>4 - Good</option>
                          <option value={3}>3 - Neutral</option>
                          <option value={2}>2 - Poor</option>
                          <option value={1}>1 - Very Poor</option>
                        </select>
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
                          placeholder="Example: Offer Declined, Compensation Concern"
                          className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                        />
                      </div>
                    </>
                  )}

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Remarks
                    </label>
                    <textarea
                      value={form.remarks}
                      onChange={(e) =>
                        setForm({ ...form, remarks: e.target.value })
                      }
                      rows={3}
                      placeholder="Optional offer notes."
                      className="w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  How this connects to TA-HRIS
                </h3>
                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  Creating an offer should be linked to a candidate application
                  that already reached the Offered stage. If accepted, this
                  should move the pipeline to Accepted. If declined, the
                  pipeline should move to Drop-offs and feed Candidate
                  Experience.
                </p>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Data Created
                </h3>

                <div className="mt-4">
                  <DetailRow label="Offer Record" value="Yes" />
                  <DetailRow
                    label="Candidate Link"
                    value={form.candidateName}
                  />
                  <DetailRow label="Pipeline Stage" value="Offered" />
                  <DetailRow label="Status" value={form.status} />
                  <DetailRow
                    label="Basic Pay"
                    value={
                      form.basicPay ? formatCurrency(Number(form.basicPay)) : "—"
                    }
                  />
                  <DetailRow
                    label="De Minimis"
                    value={
                      form.deMinimis
                        ? formatCurrency(Number(form.deMinimis))
                        : "—"
                    }
                  />
                  <DetailRow
                    label="Daily Rate"
                    value={formatCurrency(computedDailyRate)}
                  />

                  {form.status === "Accepted" && (
                    <DetailRow
                      label="Pipeline Update"
                      value="Move to Accepted"
                    />
                  )}

                  {form.status === "Declined" && (
                    <>
                      <DetailRow
                        label="Pipeline Update"
                        value="Move to Drop-offs"
                      />
                      <DetailRow
                        label="Experience Record"
                        value="Will be created"
                      />
                      <DetailRow
                        label="Rating"
                        value={`${form.experienceRating}/5`}
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                <h3 className="text-sm font-bold text-amber-700">
                  Backend Later
                </h3>
                <p className="mt-2 text-sm leading-6 text-amber-700/90">
                  This form should later call{" "}
                  <span className="font-bold">
                    POST /api/recruitment/offers
                  </span>
                  . Accepted offers should update candidate pipeline to
                  Accepted. Declined offers should update candidate pipeline to
                  Drop-offs and create candidate experience data.
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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5"
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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <Plus size={17} />
              Save Offer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OfferDetailsModal({ open, offer, onClose }) {
  if (!open || !offer) return null;

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
              Offer Details
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Offer date, basic pay, de minimis, daily rate, response status,
              and turnaround time.
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
                      {offer.candidateName}
                    </h3>
                    <p className="mt-1 break-words text-sm font-semibold text-sibs-tertiary-5">
                      {offer.candidateEmail}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                          offer.status
                        )}`}
                      >
                        {offer.status}
                      </span>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getTurnaroundClass(
                          offer.turnaroundDays
                        )}`}
                      >
                        {offer.turnaroundDays} day turnaround
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1/70">
                      Daily Rate
                    </p>
                    <p className="mt-1 text-2xl font-bold text-sibs-primary-1">
                      {formatCurrency(getOfferDailyRate(offer))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Offer Timeline
                </h3>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-xs font-bold text-blue-700">
                        1
                      </div>
                      <div className="my-1 h-full min-h-8 w-px bg-gray-200" />
                    </div>

                    <div className="flex-1 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                      <p className="text-sm font-bold text-[#101828]">
                        Offer Created
                      </p>
                      <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                        {formatDate(offer.offerDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold ${getStatusClass(
                          offer.status
                        )}`}
                      >
                        2
                      </div>
                    </div>

                    <div className="flex-1 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                      <p className="text-sm font-bold text-[#101828]">
                        Candidate Response
                      </p>
                      <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                        {offer.status === "Accepted"
                          ? formatDate(offer.acceptedDate)
                          : offer.status === "Declined"
                            ? formatDate(offer.declinedDate)
                            : "Pending response"}
                      </p>

                      {offer.status === "Declined" && (
                        <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-700">
                          Decline reason: {offer.declineReason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {offer.status === "Declined" && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-5">
                  <h3 className="text-sm font-bold text-red-700">
                    Candidate Experience Captured
                  </h3>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-red-100 bg-white p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-red-400">
                        Decline Category
                      </p>
                      <p className="mt-1 text-sm font-bold text-red-700">
                        {offer.declineCategory || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-red-100 bg-white p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-red-400">
                        Experience Rating
                      </p>
                      <div className="mt-2">
                        {offer.experienceRating ? (
                          <RatingStars rating={offer.experienceRating} />
                        ) : (
                          <p className="text-sm font-bold text-red-700">—</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {offer.candidateFeedback && (
                    <p className="mt-4 rounded-xl border border-red-100 bg-white p-4 text-sm leading-6 text-red-700">
                      Candidate Feedback: {offer.candidateFeedback}
                    </p>
                  )}

                  {offer.feedbackTag && (
                    <p className="mt-3 rounded-xl border border-red-100 bg-white p-4 text-sm leading-6 text-red-700">
                      Feedback Tag: {offer.feedbackTag}
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#101828]">Remarks</h3>
                <p className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#344054]">
                  {offer.remarks}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Offer Summary
                </h3>

                <div className="mt-4">
                  <DetailRow label="Offer ID" value={offer.offerId} />
                  <DetailRow label="Candidate ID" value={offer.candidateId} />
                  <DetailRow label="Role" value={offer.roleTitle} />
                  <DetailRow label="Account" value={offer.account} />
                  <DetailRow
                    label="Offer Date"
                    value={formatDate(offer.offerDate)}
                  />
                  <DetailRow
                    label="Basic Pay"
                    value={formatCurrency(offer.basicPay)}
                  />
                  <DetailRow
                    label="De Minimis"
                    value={formatCurrency(offer.deMinimis)}
                  />
                  <DetailRow
                    label="Daily Rate"
                    value={formatCurrency(getOfferDailyRate(offer))}
                  />
                  <DetailRow label="Status" value={offer.status} />
                  <DetailRow label="Owner" value={offer.owner} />
                  <DetailRow
                    label="Turnaround Time"
                    value={`${offer.turnaroundDays} day/s`}
                  />
                </div>
              </div>

              {offer.status === "Declined" && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-5">
                  <h3 className="text-sm font-bold text-red-700">
                    Mandatory Decline Reason
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-red-700/90">
                    {offer.declineReason}
                  </p>
                </div>
              )}

              {offer.status === "Accepted" && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                  <h3 className="text-sm font-bold text-emerald-700">
                    Onboarding Trigger
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-emerald-700/90">
                    Accepted offers should trigger an onboarding transition
                    record with expected start date and show/no-show tracking.
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Offer Management Rule
                </h3>
                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  If an offer is accepted, the candidate moves to Accepted in
                  Candidate Pipeline. If declined, the candidate moves to
                  Drop-offs and Candidate Experience data is captured.
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
              className="rounded-xl bg-[var(--sibs-primary-1)] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UpdateOfferStatusModal({
  open,
  offer,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  if (!open || !offer) return null;

  function handleStatusChange(status) {
    setForm({
      ...form,
      status,
      acceptedDate: status === "Accepted" ? getTodayDate() : "",
      declinedDate: status === "Declined" ? getTodayDate() : "",
      declineCategory: "",
      declineReason: "",
      candidateFeedback: "",
      experienceRating: 3,
      feedbackTag: "",
    });
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Update Pending Offer
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Mark this pending offer as accepted or declined.
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
              <h3 className="text-lg font-bold text-sibs-primary-1">
                {offer.candidateName}
              </h3>
              <p className="mt-1 text-sm font-semibold text-sibs-primary-1/80">
                {offer.roleTitle} — {offer.account}
              </p>
              <p className="mt-2 text-sm font-bold text-sibs-primary-1">
                Offer ID: {offer.offerId}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                New Status <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              >
                <option value="Accepted">Accepted</option>
                <option value="Declined">Declined</option>
              </select>
            </div>

            {form.status === "Accepted" && (
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  Accepted Date <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="date"
                  value={form.acceptedDate}
                  onChange={(e) =>
                    setForm({ ...form, acceptedDate: e.target.value })
                  }
                  className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                />
              </div>
            )}

            {form.status === "Declined" && (
              <>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                    Declined Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    value={form.declinedDate}
                    onChange={(e) =>
                      setForm({ ...form, declinedDate: e.target.value })
                    }
                    className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                    Decline Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={form.declineCategory}
                    onChange={(e) =>
                      setForm({ ...form, declineCategory: e.target.value })
                    }
                    className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                  >
                    <option value="">Select decline category</option>
                    {declineCategoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                    Decline Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={form.declineReason}
                    onChange={(e) =>
                      setForm({ ...form, declineReason: e.target.value })
                    }
                    rows={3}
                    placeholder="Example: Candidate accepted another offer."
                    className="w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
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
                    placeholder="Optional candidate feedback."
                    className="w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                    Experience Rating
                  </label>
                  <select
                    value={form.experienceRating}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        experienceRating: Number(e.target.value),
                      })
                    }
                    className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                  >
                    <option value={5}>5 - Excellent</option>
                    <option value={4}>4 - Good</option>
                    <option value={3}>3 - Neutral</option>
                    <option value={2}>2 - Poor</option>
                    <option value={1}>1 - Very Poor</option>
                  </select>
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
                    placeholder="Example: Offer Declined"
                    className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Remarks
              </label>
              <textarea
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                rows={3}
                placeholder="Optional remarks."
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
              <CheckCircle2 size={16} />
              Save Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OffersPage() {
  const [offerList, setOfferList] = useState(offerRecords);
  const [eligibleCandidates, setEligibleCandidates] = useState(
    defaultEligibleCandidates
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [ownerFilter, setOwnerFilter] = useState("All Owners");
  const [accountFilter, setAccountFilter] = useState("All Accounts");
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [offerForm, setOfferForm] = useState(emptyOfferForm);
  const [statusOffer, setStatusOffer] = useState(null);
  const [statusForm, setStatusForm] = useState({
    status: "Accepted",
    acceptedDate: getTodayDate(),
    declinedDate: getTodayDate(),
    declineCategory: "",
    declineReason: "",
    candidateFeedback: "",
    experienceRating: 3,
    feedbackTag: "",
    remarks: "",
  });

  useEffect(() => {
    const storedCandidates = safeReadArray(OFFER_ELIGIBLE_STORAGE_KEY);

    const existingFinalEmails = new Set(
      offerList
        .filter(
          (offer) =>
            offer.status === "Accepted" ||
            offer.status === "Declined" ||
            offer.status === "Pending"
        )
        .map((offer) => offer.candidateEmail)
    );

    const merged = mergeUniqueCandidates([
      ...defaultEligibleCandidates,
      ...storedCandidates,
    ]).filter((candidate) => !existingFinalEmails.has(candidate.candidateEmail));

    setEligibleCandidates(merged);
  }, [offerList]);

  function handleResetOfferForm() {
    setOfferForm(emptyOfferForm);
  }

  function handleCloseCreateModal() {
    setShowCreateModal(false);
    setOfferForm(emptyOfferForm);
  }

  function handleOpenStatusModal(offer) {
    setStatusOffer(offer);
    setStatusForm({
      status: "Accepted",
      acceptedDate: getTodayDate(),
      declinedDate: getTodayDate(),
      declineCategory: "",
      declineReason: "",
      candidateFeedback: "",
      experienceRating: 3,
      feedbackTag: "",
      remarks: "",
    });
  }

  function handleCloseStatusModal() {
    setStatusOffer(null);
    setStatusForm({
      status: "Accepted",
      acceptedDate: getTodayDate(),
      declinedDate: getTodayDate(),
      declineCategory: "",
      declineReason: "",
      candidateFeedback: "",
      experienceRating: 3,
      feedbackTag: "",
      remarks: "",
    });
  }

  function handleUpdatePendingOffer(e) {
    e.preventDefault();

    if (!statusOffer) return;

    if (statusOffer.status !== "Pending") {
      alert("Only pending offers can be updated.");
      return;
    }

    if (statusForm.status === "Accepted" && !statusForm.acceptedDate) {
      alert("Accepted date is required.");
      return;
    }

    if (statusForm.status === "Declined") {
      if (!statusForm.declinedDate) {
        alert("Declined date is required.");
        return;
      }

      if (!statusForm.declineCategory) {
        alert("Decline category is required.");
        return;
      }

      if (!statusForm.declineReason.trim()) {
        alert("Decline reason is required.");
        return;
      }
    }

    const responseDate =
      statusForm.status === "Accepted"
        ? statusForm.acceptedDate
        : statusForm.declinedDate;

    const updatedOffer = {
      ...statusOffer,
      status: statusForm.status,
      acceptedDate:
        statusForm.status === "Accepted" ? statusForm.acceptedDate : null,
      declinedDate:
        statusForm.status === "Declined" ? statusForm.declinedDate : null,
      declineCategory:
        statusForm.status === "Declined" ? statusForm.declineCategory : null,
      declineReason:
        statusForm.status === "Declined"
          ? statusForm.declineReason.trim()
          : null,
      candidateFeedback:
        statusForm.status === "Declined"
          ? statusForm.candidateFeedback.trim()
          : null,
      experienceRating:
        statusForm.status === "Declined"
          ? Number(statusForm.experienceRating || 3)
          : null,
      feedbackTag:
        statusForm.status === "Declined"
          ? statusForm.feedbackTag.trim() ||
            statusForm.declineCategory ||
            "Offer Declined"
          : null,
      turnaroundDays: calculateTurnaroundDays(statusOffer.offerDate, responseDate),
      remarks:
        statusForm.remarks ||
        (statusForm.status === "Accepted"
          ? "Offer accepted. Ready for onboarding transition."
          : "Offer declined. Candidate experience record captured."),
    };

    setOfferList((prev) =>
      prev.map((offer) => (offer.id === statusOffer.id ? updatedOffer : offer))
    );

    if (statusForm.status === "Accepted") {
      appendPipelineSyncEvent({
        syncId: `SYNC-${Date.now()}-${statusOffer.candidateApplicationId}`,
        candidateApplicationId: statusOffer.candidateApplicationId,
        candidateId: statusOffer.candidateId,
        candidateEmail: statusOffer.candidateEmail,
        toStage: "Accepted",
        status: "Accepted",
        dateMoved: statusForm.acceptedDate,
        timestamp: getCurrentTimestamp(),
        reasonForMovement: "Candidate accepted the offer.",
        owner: statusOffer.owner,
        source: "Offer Management",
        remarks: statusForm.remarks,
      });
    }

    if (statusForm.status === "Declined") {
      appendPipelineSyncEvent({
        syncId: `SYNC-${Date.now()}-${statusOffer.candidateApplicationId}`,
        candidateApplicationId: statusOffer.candidateApplicationId,
        candidateId: statusOffer.candidateId,
        candidateEmail: statusOffer.candidateEmail,
        toStage: "Drop-offs",
        status: "Declined",
        dateMoved: statusForm.declinedDate,
        timestamp: getCurrentTimestamp(),
        reasonForMovement: "Candidate declined the offer.",
        dropOffStage: "Offered",
        dropOffCategory: statusForm.declineCategory,
        dropOffReason: statusForm.declineReason.trim(),
        candidateFeedback: statusForm.candidateFeedback.trim(),
        experienceRating: Number(statusForm.experienceRating || 3),
        feedbackTag:
          statusForm.feedbackTag.trim() ||
          statusForm.declineCategory ||
          "Offer Declined",
        owner: statusOffer.owner,
        source: "Offer Management",
        remarks: statusForm.remarks,
      });

      saveCandidateExperienceRecord({
        candidateId: statusOffer.candidateId || statusOffer.candidateEmail,
        candidateName: statusOffer.candidateName,
        candidateEmail: statusOffer.candidateEmail,
        roleTitle: statusOffer.roleTitle,
        account: statusOffer.account,
        source: "Offer Management",
        eventType: "Offer Declined",
        currentStage: "Offered",
        finalStatus: "Drop-off",
        dropOffStage: "Offered",
        dropOffCategory: statusForm.declineCategory,
        dropOffReason: statusForm.declineReason.trim(),
        feedback: statusForm.candidateFeedback.trim(),
        experienceRating: Number(statusForm.experienceRating || 3),
        feedbackTag:
          statusForm.feedbackTag.trim() ||
          statusForm.declineCategory ||
          "Offer Declined",
        owner: statusOffer.owner,
        stageTimeline: [
          {
            stage: "Offered",
            status: "Drop-off",
            date: statusForm.declinedDate,
          },
        ],
      });
    }

    setSelectedOffer(updatedOffer);
    handleCloseStatusModal();
  }

  function handleCreateOffer(e) {
    e.preventDefault();

    if (!offerForm.candidateApplicationId || !offerForm.candidateEmail) {
      alert("Candidate is required.");
      return;
    }

    if (!offerForm.offerDate) {
      alert("Offer date is required.");
      return;
    }

    if (offerForm.basicPay === "" || offerForm.deMinimis === "") {
      alert("Basic Pay and De Minimis are required.");
      return;
    }

    const computedDailyRate = calculateDailyRate(
      offerForm.basicPay,
      offerForm.deMinimis
    );

    if (computedDailyRate <= 0) {
      alert("Daily Rate must be greater than zero.");
      return;
    }

    if (offerForm.status === "Accepted" && !offerForm.acceptedDate) {
      alert("Accepted date is required.");
      return;
    }

    if (offerForm.status === "Declined") {
      if (!offerForm.declinedDate) {
        alert("Declined date is required.");
        return;
      }

      if (!offerForm.declineCategory) {
        alert("Decline category is required.");
        return;
      }

      if (!offerForm.declineReason.trim()) {
        alert("Decline reason is required.");
        return;
      }
    }

    const nextId =
      offerList.length > 0
        ? Math.max(...offerList.map((offer) => offer.id)) + 1
        : 1;

    const responseDate =
      offerForm.status === "Accepted"
        ? offerForm.acceptedDate
        : offerForm.status === "Declined"
          ? offerForm.declinedDate
          : getTodayDate();

    const newOffer = {
      id: nextId,
      offerId: generateOfferId(nextId),
      candidateApplicationId: offerForm.candidateApplicationId,
      candidateId: offerForm.candidateId,
      candidateName: offerForm.candidateName,
      candidateEmail: offerForm.candidateEmail,
      roleAccount: offerForm.roleAccount,
      roleTitle: offerForm.roleTitle,
      account: offerForm.account,
      offerDate: offerForm.offerDate,
      basicPay: Number(offerForm.basicPay),
      deMinimis: Number(offerForm.deMinimis),
      dailyRate: computedDailyRate,
      offeredCompensation: computedDailyRate,
      status: offerForm.status,
      acceptedDate:
        offerForm.status === "Accepted" ? offerForm.acceptedDate : null,
      declinedDate:
        offerForm.status === "Declined" ? offerForm.declinedDate : null,
      declineCategory:
        offerForm.status === "Declined" ? offerForm.declineCategory : null,
      declineReason:
        offerForm.status === "Declined"
          ? offerForm.declineReason.trim()
          : null,
      candidateFeedback:
        offerForm.status === "Declined"
          ? offerForm.candidateFeedback.trim()
          : null,
      experienceRating:
        offerForm.status === "Declined"
          ? Number(offerForm.experienceRating || 3)
          : null,
      feedbackTag:
        offerForm.status === "Declined"
          ? offerForm.feedbackTag.trim() ||
            offerForm.declineCategory ||
            "Offer Declined"
          : null,
      turnaroundDays: calculateTurnaroundDays(
        offerForm.offerDate,
        responseDate
      ),
      owner: offerForm.owner,
      remarks:
        offerForm.remarks ||
        (offerForm.status === "Pending"
          ? "Offer created and awaiting candidate response."
          : offerForm.status === "Accepted"
            ? "Offer accepted. Ready for onboarding transition."
            : "Offer declined. Candidate experience record captured."),
    };

    setOfferList((prev) => [newOffer, ...prev]);

    removeEligibleCandidate(newOffer);

    setEligibleCandidates((prev) =>
      prev.filter(
        (candidate) =>
          String(candidate.candidateApplicationId) !==
            String(newOffer.candidateApplicationId) &&
          candidate.candidateEmail !== newOffer.candidateEmail
      )
    );

    if (offerForm.status === "Accepted") {
      appendPipelineSyncEvent({
        syncId: `SYNC-${Date.now()}-${offerForm.candidateApplicationId}`,
        candidateApplicationId: offerForm.candidateApplicationId,
        candidateId: offerForm.candidateId,
        candidateEmail: offerForm.candidateEmail,
        toStage: "Accepted",
        status: "Accepted",
        dateMoved: offerForm.acceptedDate,
        timestamp: getCurrentTimestamp(),
        reasonForMovement: "Candidate accepted the offer.",
        owner: offerForm.owner,
        source: "Offer Management",
        remarks: offerForm.remarks,
      });
    }

    if (offerForm.status === "Declined") {
      appendPipelineSyncEvent({
        syncId: `SYNC-${Date.now()}-${offerForm.candidateApplicationId}`,
        candidateApplicationId: offerForm.candidateApplicationId,
        candidateId: offerForm.candidateId,
        candidateEmail: offerForm.candidateEmail,
        toStage: "Drop-offs",
        status: "Declined",
        dateMoved: offerForm.declinedDate,
        timestamp: getCurrentTimestamp(),
        reasonForMovement: "Candidate declined the offer.",
        dropOffStage: "Offered",
        dropOffCategory: offerForm.declineCategory,
        dropOffReason: offerForm.declineReason.trim(),
        candidateFeedback: offerForm.candidateFeedback.trim(),
        experienceRating: Number(offerForm.experienceRating || 3),
        feedbackTag:
          offerForm.feedbackTag.trim() ||
          offerForm.declineCategory ||
          "Offer Declined",
        owner: offerForm.owner,
        source: "Offer Management",
        remarks: offerForm.remarks,
      });

      saveCandidateExperienceRecord({
        candidateId: offerForm.candidateId || offerForm.candidateEmail,
        candidateName: offerForm.candidateName,
        candidateEmail: offerForm.candidateEmail,
        roleTitle: offerForm.roleTitle,
        account: offerForm.account,
        source: "Offer Management",
        eventType: "Offer Declined",
        currentStage: "Offered",
        finalStatus: "Drop-off",
        dropOffStage: "Offered",
        dropOffCategory: offerForm.declineCategory,
        dropOffReason: offerForm.declineReason.trim(),
        feedback: offerForm.candidateFeedback.trim(),
        experienceRating: Number(offerForm.experienceRating || 3),
        feedbackTag:
          offerForm.feedbackTag.trim() ||
          offerForm.declineCategory ||
          "Offer Declined",
        owner: offerForm.owner,
        stageTimeline: [
          {
            stage: "Offered",
            status: "Drop-off",
            date: offerForm.declinedDate,
          },
        ],
      });
    }

    setSelectedOffer(newOffer);
    handleCloseCreateModal();
  }

  const filteredOffers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return offerList.filter((offer) => {
      const matchesSearch =
        !keyword ||
        offer.offerId.toLowerCase().includes(keyword) ||
        offer.candidateName.toLowerCase().includes(keyword) ||
        offer.candidateEmail.toLowerCase().includes(keyword) ||
        offer.roleAccount.toLowerCase().includes(keyword) ||
        offer.owner.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "All Status" || offer.status === statusFilter;

      const matchesOwner =
        ownerFilter === "All Owners" || offer.owner === ownerFilter;

      const matchesAccount =
        accountFilter === "All Accounts" || offer.account === accountFilter;

      return matchesSearch && matchesStatus && matchesOwner && matchesAccount;
    });
  }, [offerList, search, statusFilter, ownerFilter, accountFilter]);

  const stats = useMemo(() => {
    const total = offerList.length;
    const accepted = offerList.filter(
      (offer) => offer.status === "Accepted"
    ).length;
    const declined = offerList.filter(
      (offer) => offer.status === "Declined"
    ).length;
    const pending = offerList.filter(
      (offer) => offer.status === "Pending"
    ).length;

    const acceptanceRate =
      total > 0 ? Math.round((accepted / total) * 100) : 0;

    const averageTurnaround =
      total > 0
        ? (
            offerList.reduce((sum, offer) => sum + offer.turnaroundDays, 0) /
            total
          ).toFixed(1)
        : "0.0";

    return {
      total,
      accepted,
      declined,
      pending,
      acceptanceRate,
      averageTurnaround,
    };
  }, [offerList]);

  return (
    <div className="flex-1 flex flex-col bg-[var(--sibs-tertiary-10)]">
      <Header />

      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Gift size={28} className="shrink-0 text-sibs-primary-1" />

            <h1 className="min-w-0 break-words text-2xl font-bold text-sibs-primary-1 sm:text-4xl">
              Offers
            </h1>
          </div>

          <p className="mt-1 text-sm text-sibs-tertiary-5">
            Create and manage candidate offers, acceptance, and decline reasons.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard
            title="Total Offers"
            value={stats.total}
            icon={FileText}
            description="Offers created"
          />

          <StatCard
            title="Accepted"
            value={stats.accepted}
            icon={UserCheck}
            description={`${stats.acceptanceRate}% rate`}
          />

          <StatCard
            title="Declined"
            value={stats.declined}
            icon={UserX}
            description="Requires reason"
          />

          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock3}
            description="Awaiting response"
          />

          <StatCard
            title="Acceptance Rate"
            value={`${stats.acceptanceRate}%`}
            icon={CheckCircle2}
            description="Offer KPI"
          />

          <StatCard
            title="Avg Turnaround"
            value={`${stats.averageTurnaround}d`}
            icon={Timer}
            description="Response time"
          />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_420px]">
          <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-sibs-primary-1">
                  Offer Acceptance Summary
                </h2>
                <p className="text-sm text-sibs-tertiary-5">
                  Accepted, declined, and pending offer breakdown.
                </p>
              </div>

              <DollarSign size={20} className="shrink-0 text-gray-400" />
            </div>

            <div className="space-y-5">
              <ProgressBar
                label="Accepted Offers"
                value={stats.accepted}
                total={stats.total}
              />
              <ProgressBar
                label="Declined Offers"
                value={stats.declined}
                total={stats.total}
              />
              <ProgressBar
                label="Pending Offers"
                value={stats.pending}
                total={stats.total}
              />
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white p-3 text-sibs-primary-1">
                <AlertTriangle size={22} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-sibs-primary-1">
                  Offer Stage Requirement
                </h3>
                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  Offer date, basic pay, de minimis, computed daily rate,
                  accepted or declined status, offer turnaround time, and
                  mandatory decline reason must be captured to support offer
                  acceptance reporting.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-semibold text-sibs-primary-1">
              Offer Records
            </h3>

            <p className="text-sm text-sibs-tertiary-5">
              Candidate offer tracking from offer date to final response.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
          >
            <Plus size={18} />
            Create Offer
          </button>
        </div>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_300px_160px_180px_180px] xl:items-center">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-sibs-primary-1">
                  Offer List
                </h2>
                <p className="text-sm text-sibs-tertiary-5">
                  Search and filter offer records.
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
                  placeholder="Search candidate, offer ID, role..."
                  className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
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
            <div className="space-y-3 lg:hidden">
              {filteredOffers.length > 0 ? (
                filteredOffers.map((offer) => (
                  <OfferMobileCard
                    key={offer.id}
                    offer={offer}
                    onView={() => setSelectedOffer(offer)}
                    onUpdate={() => handleOpenStatusModal(offer)}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                  No offer records found.
                </div>
              )}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-[#E6ECF2] lg:block">
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full min-w-[1180px] border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
                    <tr className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      <th className="px-5 py-4">Offer ID</th>
                      <th className="px-5 py-4">Candidate</th>
                      <th className="px-5 py-4">Role / Account</th>
                      <th className="px-5 py-4">Offer Date</th>
                      <th className="px-5 py-4 text-right">Daily Rate</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-center">Turnaround</th>
                      <th className="px-5 py-4">Owner</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredOffers.length > 0 ? (
                      filteredOffers.map((offer) => (
                        <tr
                          key={offer.id}
                          className="transition hover:bg-[#F8FAFC]"
                        >
                          <td className="px-5 py-4 text-sm font-bold text-sibs-primary-1">
                            {offer.offerId}
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-[#101828]">
                              {offer.candidateName}
                            </p>
                            <p className="text-xs font-semibold text-sibs-tertiary-5">
                              {offer.candidateEmail}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-[#344054]">
                              {offer.roleTitle}
                            </p>
                            <p className="text-xs font-semibold text-sibs-tertiary-5">
                              {offer.account}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                            <div className="flex items-center gap-2">
                              <CalendarDays
                                size={15}
                                className="text-gray-400"
                              />
                              {formatDate(offer.offerDate)}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right text-sm font-bold text-[#344054]">
                            {formatCurrency(getOfferDailyRate(offer))}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                                offer.status
                              )}`}
                            >
                              {offer.status}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getTurnaroundClass(
                                offer.turnaroundDays
                              )}`}
                            >
                              {offer.turnaroundDays}d
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                            {offer.owner}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              {offer.status === "Pending" && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenStatusModal(offer)}
                                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
                                >
                                  <CheckCircle2 size={15} />
                                  Update
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setSelectedOffer(offer)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 py-2 text-xs font-bold text-sibs-primary-1 transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5"
                              >
                                <Eye size={15} />
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                        >
                          No offer records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <p className="text-sm font-semibold text-sibs-tertiary-5">
                Showing 1 to {filteredOffers.length} of {offerList.length} offer
                records
              </p>

              <div className="flex items-center gap-2">
                <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50">
                  <ChevronLeft size={16} />
                </button>

                <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--sibs-primary-1)] text-sm font-bold text-white">
                  1
                </button>

                <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-sm font-bold text-gray-600 transition hover:bg-gray-50">
                  2
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
            Offer Management Rule
          </h3>
          <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
            Offer Date, Basic Pay, De Minimis, Daily Rate, Accepted / Declined
            status, Offer Turnaround Time, and Decline Reason must be captured.
            If the offer is accepted, Candidate Pipeline moves to Accepted. If
            declined, Candidate Pipeline moves to Drop-offs and Candidate
            Experience data must also be captured.
          </p>
        </section>
      </main>

      <CreateOfferModal
        open={showCreateModal}
        form={offerForm}
        setForm={setOfferForm}
        eligibleCandidates={eligibleCandidates}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateOffer}
        onReset={handleResetOfferForm}
      />

      <OfferDetailsModal
        open={!!selectedOffer}
        offer={selectedOffer}
        onClose={() => setSelectedOffer(null)}
      />

      <UpdateOfferStatusModal
        open={!!statusOffer}
        offer={statusOffer}
        form={statusForm}
        setForm={setStatusForm}
        onClose={handleCloseStatusModal}
        onSubmit={handleUpdatePendingOffer}
      />
    </div>
  );
}