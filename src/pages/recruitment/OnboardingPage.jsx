import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Header from "../../components/layout/Header";
import { CreateOnboardingModal } from "../../components/modals/onboarding/OnboardingModal.jsx";
import {
  ClipboardList,
  Search,
  Eye,
  Plus,
  X,
  CalendarDays,
  CheckCircle2,
  CircleX,
  Clock3,
  UserCheck,
  UserX,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Timer,
  Filter,
  ChevronDown,
} from "lucide-react";
import { saveCandidateExperienceRecord } from "@/lib/utils/candidateExperienceStore";

const ONBOARDING_STORAGE_KEY = "ta_onboarding_records";
const OFFER_RECORDS_STORAGE_KEY = "ta_offer_records";
const CANDIDATE_APPLICATIONS_STORAGE_KEY = "ta_candidate_applications";
const PIPELINE_CANDIDATES_STORAGE_KEY = "ta_pipeline_candidates";

const OFFERS_UPDATED_BROWSER_EVENT = "ta-offers-updated";
const ONBOARDING_UPDATED_BROWSER_EVENT = "ta-onboarding-updated";
const PIPELINE_SYNC_BROWSER_EVENT = "ta-pipeline-sync-updated";

const ONBOARDING_RECORDS_PER_PAGE = 8;

const initialOnboardingRecords = [
  {
    id: 1,
    onboardingId: "ONB-001",
    offerId: "OFF-001",
    candidateApplicationId: 1,
    candidateId: "CAND-001",
    candidateName: "Juan Dela Cruz",
    candidateEmail: "juan.delacruz@email.com",
    roleTitle: "Customer Service Representative",
    account: "SIBS Operations",
    roleAccount: "Customer Service Representative - SIBS Operations",
    acceptedOfferDate: "2026-05-03",
    expectedStartDate: "2026-05-10",
    actualStartDate: "2026-05-10",
    showStatus: "Show",
    preStartWithdrawal: "No",
    withdrawalReason: null,
    reasonCategory: null,
    candidateFeedback: null,
    experienceRating: null,
    feedbackTag: null,
    finalOutcome: "True Hire",
    owner: "Maria Reyes",
    location: "Davao",
    remarks: "Candidate showed up on expected start date.",
  },
  {
    id: 2,
    onboardingId: "ONB-002",
    offerId: "OFF-002",
    candidateApplicationId: 8,
    candidateId: "CAND-008",
    candidateName: "Maria Santos",
    candidateEmail: "maria.santos@email.com",
    roleTitle: "QA Specialist",
    account: "SIBS Operations",
    roleAccount: "QA Specialist - SIBS Operations",
    acceptedOfferDate: "2026-05-05",
    expectedStartDate: "2026-05-14",
    actualStartDate: null,
    showStatus: "Pending",
    preStartWithdrawal: "No",
    withdrawalReason: null,
    reasonCategory: null,
    candidateFeedback: null,
    experienceRating: null,
    feedbackTag: null,
    finalOutcome: "Pending Start",
    owner: "John Dela Cruz",
    location: "Tagum",
    remarks: "Waiting for candidate start date.",
  },
];

const fallbackAcceptedOffers = [
  {
    offerId: "OFF-006",
    candidateApplicationId: 10,
    candidateId: "CAND-010",
    candidateName: "Lara Mendoza",
    candidateEmail: "lara.mendoza@email.com",
    roleTitle: "Customer Service Representative",
    account: "SIBS Operations",
    roleAccount: "Customer Service Representative - SIBS Operations",
    acceptedOfferDate: "2026-05-07",
    owner: "Maria Reyes",
  },
  {
    offerId: "OFF-007",
    candidateApplicationId: 11,
    candidateId: "CAND-011",
    candidateName: "Renz Castillo",
    candidateEmail: "renz.castillo@email.com",
    roleTitle: "RCM Analyst",
    account: "SIBS RCM",
    roleAccount: "RCM Analyst - SIBS RCM",
    acceptedOfferDate: "2026-05-08",
    owner: "Kim Domingo",
  },
  {
    offerId: "OFF-008",
    candidateApplicationId: 12,
    candidateId: "CAND-012",
    candidateName: "Nicole Tan",
    candidateEmail: "nicole.tan@email.com",
    roleTitle: "QA Specialist",
    account: "SIBS Operations",
    roleAccount: "QA Specialist - SIBS Operations",
    acceptedOfferDate: "2026-05-09",
    owner: "John Dela Cruz",
  },
];

const showStatusOptions = [
  "All Status",
  "Pending",
  "Show",
  "No Show",
  "Withdrawn",
];

const outcomeOptions = [
  "All Outcomes",
  "Pending Start",
  "True Hire",
  "No Show",
  "Pre-start Withdrawal",
];

const ownerOptions = [
  "All Owners",
  "Maria Reyes",
  "John Dela Cruz",
  "Kim Domingo",
  "Paul Garcia",
];

const onboardingReasonCategoryOptions = [
  "No Response",
  "Personal Reason",
  "Schedule",
  "Accepted Other Offer",
  "Location Issue",
  "Incomplete Requirements",
  "Others",
];

const emptyOnboardingForm = {
  offerId: "",
  candidateApplicationId: "",
  candidateId: "",
  candidateName: "",
  candidateEmail: "",
  roleTitle: "",
  account: "",
  roleAccount: "",
  acceptedOfferDate: "",
  expectedStartDate: "",
  owner: "",
  location: "Davao",
  remarks: "",
};

const emptyOutcomeForm = {
  actualStartDate: "",
  reasonCategory: "",
  withdrawalReason: "",
  candidateFeedback: "",
  experienceRating: 3,
  feedbackTag: "",
  remarks: "",
};

function inputClass(extra = "") {
  return `h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function textareaClass(extra = "") {
  return `w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function AnimatedDropdown({ open, children, className = "" }) {
  return (
    <div
      className={`absolute left-0 right-0 top-full mt-2 grid transition-all duration-300 ease-out ${
        open
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0"
      } ${className}`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl transition-all duration-300 ease-out ${
            open ? "translate-y-0 scale-100" : "-translate-y-2 scale-[0.98]"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function CustomSelect({
  label,
  value,
  options = [],
  onChange,
  placeholder = "Select",
  required = false,
  zIndex = "z-30",
  height = "h-12",
  labelClassName = "mb-1 block text-sm font-bold text-[#101828]",
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const displayValue = value || placeholder;

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${zIndex}`}>
      <label className={labelClassName}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex ${height} w-full items-center justify-between rounded-xl border border-[#D0D5DD] bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition-all duration-200 hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10`}
      >
        <span
          className={`truncate ${
            value ? "text-[#344054]" : "text-sibs-tertiary-5"
          }`}
        >
          {displayValue}
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatedDropdown open={open}>
        <div className="max-h-64 overflow-y-auto py-2 sibs-scrollbar">
          {options.map((option) => {
            const selected = String(value) === String(option);

            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-3 text-left text-sm transition ${
                  selected
                    ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                    : "text-[#344054] hover:bg-[#F8FAFC]"
                }`}
              >
                <span className="block truncate">{option}</span>
              </button>
            );
          })}
        </div>
      </AnimatedDropdown>
    </div>
  );
}

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
    window.localStorage.setItem(
      key,
      JSON.stringify(Array.isArray(value) ? value : []),
    );
  } catch {
    // localStorage only.
  }
}

function dispatchBrowserEvent(eventName, detail = null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
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

function generateOnboardingId(nextNumber) {
  return `ONB-${String(nextNumber).padStart(3, "0")}`;
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getRoleTitle(roleAccount = "") {
  return roleAccount.split(" - ")?.[0] || roleAccount || "";
}

function getAccount(roleAccount = "") {
  return roleAccount.split(" - ")?.[1] || "SIBS";
}

function getDaysToStart(acceptedDate, expectedDate) {
  if (!acceptedDate || !expectedDate) return "—";

  const accepted = new Date(acceptedDate);
  const expected = new Date(expectedDate);

  if (Number.isNaN(accepted.getTime()) || Number.isNaN(expected.getTime())) {
    return "—";
  }

  const diff = expected.getTime() - accepted.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return `${days} day/s`;
}

function getShowStatusClass(status) {
  switch (status) {
    case "Show":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "No Show":
      return "border-red-200 bg-red-50 text-red-700";
    case "Withdrawn":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "Pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getOutcomeClass(outcome) {
  switch (outcome) {
    case "True Hire":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "No Show":
      return "border-red-200 bg-red-50 text-red-700";
    case "Pre-start Withdrawal":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "Pending Start":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function normalizeOfferToAcceptedOffer(offer) {
  const roleTitle = offer.roleTitle || getRoleTitle(offer.roleAccount);
  const account = offer.account || getAccount(offer.roleAccount);

  return {
    offerId: offer.offerId,
    candidateApplicationId: offer.candidateApplicationId,
    candidateId: offer.candidateId,
    candidateName: offer.candidateName || offer.name || "Unknown Candidate",
    candidateEmail: offer.candidateEmail || offer.email || "",
    roleTitle,
    account,
    roleAccount: offer.roleAccount || `${roleTitle} - ${account}`,
    acceptedOfferDate: offer.acceptedDate || offer.acceptedOfferDate,
    owner: offer.owner || "Unassigned",
  };
}

function getAcceptedOffersFromStorage() {
  const storedOffers = safeReadArray(OFFER_RECORDS_STORAGE_KEY);

  const acceptedFromOffers = storedOffers
    .filter((offer) => offer.status === "Accepted")
    .map((offer) => normalizeOfferToAcceptedOffer(offer));

  return acceptedFromOffers.length > 0
    ? acceptedFromOffers
    : fallbackAcceptedOffers;
}

function normalizeOnboardingRecord(record) {
  const roleTitle = record.roleTitle || getRoleTitle(record.roleAccount);
  const account = record.account || getAccount(record.roleAccount);

  return {
    ...record,
    offerId: record.offerId || "",
    candidateApplicationId:
      record.candidateApplicationId || record.applicationId || "",
    candidateId: record.candidateId || record.candidateEmail || "",
    candidateName: record.candidateName || record.name || "Unknown Candidate",
    candidateEmail: record.candidateEmail || record.email || "",
    roleTitle,
    account,
    roleAccount: record.roleAccount || `${roleTitle} - ${account}`,
    showStatus: record.showStatus || "Pending",
    preStartWithdrawal: record.preStartWithdrawal || "No",
    finalOutcome: record.finalOutcome || "Pending Start",
    owner: record.owner || "Unassigned",
    location: record.location || "Davao",
    remarks: record.remarks || "",
  };
}

function saveOnboardingList(records) {
  const normalizedRecords = records.map((record) =>
    normalizeOnboardingRecord(record),
  );

  safeWriteArray(ONBOARDING_STORAGE_KEY, normalizedRecords);
  dispatchBrowserEvent(ONBOARDING_UPDATED_BROWSER_EVENT, normalizedRecords);

  return normalizedRecords;
}

function updatePipelineForOnboarding(record, nextStage, reason) {
  const normalizedRecord = normalizeOnboardingRecord(record);

  const storageKeys = [
    CANDIDATE_APPLICATIONS_STORAGE_KEY,
    PIPELINE_CANDIDATES_STORAGE_KEY,
  ];

  storageKeys.forEach((storageKey) => {
    const current = safeReadArray(storageKey);

    if (!current.length) return;

    const next = current.map((candidate) => {
      const isMatch =
        String(candidate.candidateApplicationId || "") ===
          String(normalizedRecord.candidateApplicationId || "") ||
        String(candidate.candidateEmail || candidate.email || "") ===
          String(normalizedRecord.candidateEmail || "");

      if (!isMatch) return candidate;

      const alreadyUpdated = candidate.timeline?.some(
        (item) =>
          item.onboardingId === normalizedRecord.onboardingId &&
          item.stage === nextStage,
      );

      if (alreadyUpdated) {
        return {
          ...candidate,
          currentStage: nextStage,
          status: nextStage === "Hired" ? "Hired" : "Drop-off",
        };
      }

      return {
        ...candidate,
        previousStage: candidate.currentStage || "Accepted",
        currentStage: nextStage,
        status: nextStage === "Hired" ? "Hired" : "Drop-off",
        dateMoved: getTodayDate(),
        reasonForMovement: reason,
        dropOffCategory:
          nextStage === "Drop-offs" ? normalizedRecord.reasonCategory : null,
        dropOffReason:
          nextStage === "Drop-offs" ? normalizedRecord.withdrawalReason : null,
        candidateFeedback:
          nextStage === "Drop-offs" ? normalizedRecord.candidateFeedback : null,
        experienceRating:
          nextStage === "Drop-offs" ? normalizedRecord.experienceRating : null,
        feedbackTag:
          nextStage === "Drop-offs" ? normalizedRecord.feedbackTag : null,
        timeline: [
          ...(candidate.timeline || []),
          {
            stage: nextStage,
            owner: normalizedRecord.owner,
            source: "Onboarding",
            timestamp: getCurrentTimestamp(),
            reason,
            onboardingId: normalizedRecord.onboardingId,
            dropOffReason:
              nextStage === "Drop-offs"
                ? normalizedRecord.withdrawalReason
                : null,
            dropOffCategory:
              nextStage === "Drop-offs" ? normalizedRecord.reasonCategory : null,
          },
        ],
      };
    });

    safeWriteArray(storageKey, next);
  });

  dispatchBrowserEvent(PIPELINE_SYNC_BROWSER_EVENT, {
    onboardingId: normalizedRecord.onboardingId,
    candidateApplicationId: normalizedRecord.candidateApplicationId,
    candidateEmail: normalizedRecord.candidateEmail,
    nextStage,
  });
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  description,
  valueClassName = "text-sibs-primary-1",
  iconClassName = "bg-[#F2F6FA] text-sibs-primary-1",
  delay = 0,
}) {
  return (
    <div
      className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
            {title}
          </p>

          <p className={`mt-3 truncate text-3xl font-extrabold ${valueClassName}`}>
            {value}
          </p>

          {description && (
            <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
              {description}
            </p>
          )}
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, total, delay = 0 }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="sibs-page-card-in" style={{ animationDelay: `${delay}ms` }}>
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
          className="h-full rounded-full bg-sibs-primary-1 transition-all duration-700 ease-out"
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

function OnboardingMobileCard({ record, onView }) {
  const normalizedRecord = normalizeOnboardingRecord(record);

  return (
    <button
      type="button"
      onClick={onView}
      className="sibs-page-card-in w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] hover:shadow-md active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-sibs-primary-1">
            {normalizedRecord.onboardingId}
          </p>

          <h3 className="mt-1 text-sm font-bold text-[#101828]">
            {normalizedRecord.candidateName}
          </h3>

          <p className="mt-1 break-words text-xs font-semibold text-sibs-tertiary-5">
            {normalizedRecord.roleTitle} / {normalizedRecord.account}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getShowStatusClass(
            normalizedRecord.showStatus,
          )}`}
        >
          {normalizedRecord.showStatus}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Expected
          </p>

          <p className="mt-1 text-xs font-bold text-[#344054]">
            {formatDate(normalizedRecord.expectedStartDate)}
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Actual
          </p>

          <p className="mt-1 text-xs font-bold text-[#344054]">
            {formatDate(normalizedRecord.actualStartDate)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getOutcomeClass(
            normalizedRecord.finalOutcome,
          )}`}
        >
          {normalizedRecord.finalOutcome}
        </span>

        <span className="inline-flex rounded-full border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-bold text-[#344054]">
          {normalizedRecord.owner}
        </span>
      </div>

      {(normalizedRecord.showStatus === "No Show" ||
        normalizedRecord.showStatus === "Withdrawn") &&
        normalizedRecord.withdrawalReason && (
          <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold leading-5 text-red-700">
            {normalizedRecord.withdrawalReason}
          </div>
        )}

      <div className="mt-4">
        <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-3 py-2 text-xs font-bold text-sibs-primary-1">
          <Eye size={15} />
          View Details
        </span>
      </div>
    </button>
  );
}

function OutcomeModal({ open, record, type, form, setForm, onClose, onSubmit }) {
  if (!open || !record) return null;

  const isShow = type === "Show";
  const isNoShow = type === "No Show";
  const isWithdraw = type === "Withdrawn";

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="sibs-profile-tab-panel flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2
              className={`text-lg font-bold sm:text-xl ${
                isShow
                  ? "text-emerald-700"
                  : isNoShow
                    ? "text-red-700"
                    : "text-orange-700"
              }`}
            >
              {isShow && "Mark as Show / True Hire"}
              {isNoShow && "Mark as No Show"}
              {isWithdraw && "Mark as Pre-start Withdrawal"}
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Update the final onboarding outcome for this accepted offer.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-100 hover:text-gray-700 active:scale-[0.98]"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-5">
            <div
              className={`rounded-xl border p-5 ${
                isShow
                  ? "border-emerald-100 bg-emerald-50"
                  : isNoShow
                    ? "border-red-100 bg-red-50"
                    : "border-orange-100 bg-orange-50"
              }`}
            >
              <h3
                className={`text-lg font-bold ${
                  isShow
                    ? "text-emerald-700"
                    : isNoShow
                      ? "text-red-700"
                      : "text-orange-700"
                }`}
              >
                {record.candidateName}
              </h3>

              <p
                className={`mt-1 text-sm font-semibold ${
                  isShow
                    ? "text-emerald-700/80"
                    : isNoShow
                      ? "text-red-700/80"
                      : "text-orange-700/80"
                }`}
              >
                {record.roleTitle} / {record.account}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/70 bg-white px-3 py-1 text-xs font-bold text-[#344054]">
                  Expected Start: {formatDate(record.expectedStartDate)}
                </span>

                <span className="rounded-full border border-white/70 bg-white px-3 py-1 text-xs font-bold text-[#344054]">
                  Current Status: {record.showStatus}
                </span>
              </div>
            </div>

            {isShow && (
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  Actual Start Date <span className="text-red-500">*</span>
                </label>

                <input
                  required
                  type="date"
                  value={form.actualStartDate}
                  onChange={(e) =>
                    setForm({ ...form, actualStartDate: e.target.value })
                  }
                  className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
            )}

            {(isNoShow || isWithdraw) && (
              <>
                <CustomSelect
                  label="Reason Category"
                  required
                  value={form.reasonCategory}
                  options={onboardingReasonCategoryOptions}
                  placeholder="Select reason category"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      reasonCategory: value,
                    })
                  }
                  height="h-11"
                  zIndex="z-50"
                  labelClassName="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5"
                />

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                    {isNoShow ? "No Show Reason" : "Withdrawal Reason"}{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    required
                    value={form.withdrawalReason}
                    onChange={(e) =>
                      setForm({ ...form, withdrawalReason: e.target.value })
                    }
                    rows={4}
                    placeholder={
                      isNoShow
                        ? "Example: Candidate did not respond or did not appear on start date."
                        : "Example: Candidate accepted another offer before start date."
                    }
                    className={`w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition ${
                      isNoShow
                        ? "focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                        : "focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                    }`}
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
                    className={textareaClass()}
                  />
                </div>

                <CustomSelect
                  label="Experience Rating"
                  value={String(form.experienceRating)}
                  options={["5", "4", "3", "2", "1"]}
                  placeholder="Select rating"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      experienceRating: Number(value),
                    })
                  }
                  height="h-11"
                  zIndex="z-40"
                  labelClassName="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5"
                />

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                    Feedback Tag
                  </label>

                  <input
                    value={form.feedbackTag}
                    onChange={(e) =>
                      setForm({ ...form, feedbackTag: e.target.value })
                    }
                    placeholder={
                      isNoShow
                        ? "Example: No Show"
                        : "Example: Pre-start Withdrawal"
                    }
                    className={inputClass()}
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
                className={textareaClass()}
              />
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <h3 className="text-sm font-bold text-sibs-primary-1">
                System Action
              </h3>

              <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                {isShow &&
                  "Marking as Show moves the Candidate Pipeline to Hired and increases filled count."}
                {isNoShow &&
                  "Marking as No Show creates a Candidate Experience record and moves the Pipeline to Drop-offs."}
                {isWithdraw &&
                  "Pre-start withdrawal creates a Candidate Experience record and moves the Pipeline to Drop-offs."}
              </p>
            </div>
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
            >
              Cancel
            </button>

            <button
              type="submit"
              onClick={onSubmit}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${
                isShow
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : isNoShow
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              {isShow && <UserCheck size={16} />}
              {isNoShow && <UserX size={16} />}
              {isWithdraw && <CircleX size={16} />}
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OnboardingDetailsModal({
  open,
  record,
  onClose,
  onOpenOutcomeModal,
}) {
  if (!open || !record) return null;

  const normalizedRecord = normalizeOnboardingRecord(record);

  const isFinal =
    normalizedRecord.finalOutcome === "True Hire" ||
    normalizedRecord.finalOutcome === "No Show" ||
    normalizedRecord.finalOutcome === "Pre-start Withdrawal";

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="sibs-profile-tab-panel flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Onboarding Transition Details
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Track accepted offer to actual start, show/no-show, and pre-start
              withdrawal.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-100 hover:text-gray-700 active:scale-[0.98]"
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
                      {normalizedRecord.candidateName}
                    </h3>

                    <p className="mt-1 break-words text-sm font-semibold text-sibs-tertiary-5">
                      {normalizedRecord.candidateEmail}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getShowStatusClass(
                          normalizedRecord.showStatus,
                        )}`}
                      >
                        {normalizedRecord.showStatus}
                      </span>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getOutcomeClass(
                          normalizedRecord.finalOutcome,
                        )}`}
                      >
                        {normalizedRecord.finalOutcome}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1/70">
                      Expected Start
                    </p>

                    <p className="mt-1 text-2xl font-bold text-sibs-primary-1">
                      {formatDate(normalizedRecord.expectedStartDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Onboarding Timeline
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
                        Offer Accepted
                      </p>

                      <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                        {formatDate(normalizedRecord.acceptedOfferDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-100 bg-amber-50 text-xs font-bold text-amber-700">
                        2
                      </div>

                      <div className="my-1 h-full min-h-8 w-px bg-gray-200" />
                    </div>

                    <div className="flex-1 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                      <p className="text-sm font-bold text-[#101828]">
                        Expected Start Date
                      </p>

                      <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                        {formatDate(normalizedRecord.expectedStartDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold ${getShowStatusClass(
                          normalizedRecord.showStatus,
                        )}`}
                      >
                        3
                      </div>
                    </div>

                    <div className="flex-1 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                      <p className="text-sm font-bold text-[#101828]">
                        Final Start Outcome
                      </p>

                      <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                        {normalizedRecord.actualStartDate
                          ? formatDate(normalizedRecord.actualStartDate)
                          : normalizedRecord.finalOutcome}
                      </p>

                      {normalizedRecord.preStartWithdrawal === "Yes" && (
                        <div className="mt-3 rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm font-semibold leading-6 text-orange-700">
                          Withdrawal reason:{" "}
                          {normalizedRecord.withdrawalReason}
                        </div>
                      )}

                      {normalizedRecord.showStatus === "No Show" && (
                        <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-700">
                          No Show reason: {normalizedRecord.withdrawalReason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {(normalizedRecord.showStatus === "No Show" ||
                normalizedRecord.showStatus === "Withdrawn") && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-5">
                  <h3 className="text-sm font-bold text-red-700">
                    Candidate Experience Data
                  </h3>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-red-100 bg-white p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-red-400">
                        Reason Category
                      </p>

                      <p className="mt-1 text-sm font-bold text-red-700">
                        {normalizedRecord.reasonCategory || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-red-100 bg-white p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-red-400">
                        Experience Rating
                      </p>

                      <p className="mt-1 text-sm font-bold text-red-700">
                        {normalizedRecord.experienceRating
                          ? `${normalizedRecord.experienceRating}/5`
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {normalizedRecord.candidateFeedback && (
                    <p className="mt-4 rounded-xl border border-red-100 bg-white p-4 text-sm leading-6 text-red-700">
                      Candidate Feedback: {normalizedRecord.candidateFeedback}
                    </p>
                  )}

                  {normalizedRecord.feedbackTag && (
                    <p className="mt-3 rounded-xl border border-red-100 bg-white p-4 text-sm leading-6 text-red-700">
                      Feedback Tag: {normalizedRecord.feedbackTag}
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#101828]">Remarks</h3>

                <p className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#344054]">
                  {normalizedRecord.remarks || "No remarks provided."}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Onboarding Summary
                </h3>

                <div className="mt-4">
                  <DetailRow
                    label="Onboarding ID"
                    value={normalizedRecord.onboardingId}
                  />
                  <DetailRow label="Offer ID" value={normalizedRecord.offerId} />
                  <DetailRow label="Role" value={normalizedRecord.roleTitle} />
                  <DetailRow label="Account" value={normalizedRecord.account} />
                  <DetailRow
                    label="Location"
                    value={normalizedRecord.location}
                  />
                  <DetailRow
                    label="Accepted Offer Date"
                    value={formatDate(normalizedRecord.acceptedOfferDate)}
                  />
                  <DetailRow
                    label="Expected Start Date"
                    value={formatDate(normalizedRecord.expectedStartDate)}
                  />
                  <DetailRow
                    label="Actual Start Date"
                    value={formatDate(normalizedRecord.actualStartDate)}
                  />
                  <DetailRow
                    label="Days to Start"
                    value={getDaysToStart(
                      normalizedRecord.acceptedOfferDate,
                      normalizedRecord.expectedStartDate,
                    )}
                  />
                  <DetailRow label="Owner" value={normalizedRecord.owner} />
                </div>
              </div>

              {!isFinal && (
                <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-[#101828]">
                    Update Outcome
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-sibs-tertiary-5">
                    Onboarding controls the final hiring result. Only Show will
                    count as a true hire.
                  </p>

                  <div className="mt-4 space-y-2">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenOutcomeModal(normalizedRecord, "Show")
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md active:scale-[0.98]"
                    >
                      <UserCheck size={16} />
                      Mark as Show
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onOpenOutcomeModal(normalizedRecord, "No Show")
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md active:scale-[0.98]"
                    >
                      <UserX size={16} />
                      Mark as No Show
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onOpenOutcomeModal(normalizedRecord, "Withdrawn")
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-700 hover:shadow-md active:scale-[0.98]"
                    >
                      <CircleX size={16} />
                      Mark as Withdrawn
                    </button>
                  </div>
                </div>
              )}

              {normalizedRecord.preStartWithdrawal === "Yes" && (
                <div className="rounded-xl border border-orange-100 bg-orange-50 p-5">
                  <h3 className="text-sm font-bold text-orange-700">
                    Pre-start Withdrawal
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-orange-700/90">
                    {normalizedRecord.withdrawalReason}
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Onboarding Rule
                </h3>

                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  Accepted offer creates onboarding. Show creates true hire. No
                  Show and Pre-start Withdrawal create Candidate Experience
                  records and do not count as hired.
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
              className="rounded-xl bg-sibs-primary-1 px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const mainRef = useRef(null);

  const [onboardingList, setOnboardingList] = useState(initialOnboardingRecords);
  const [acceptedOfferList, setAcceptedOfferList] =
    useState(fallbackAcceptedOffers);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  const [search, setSearch] = useState("");
  const [showStatusFilter, setShowStatusFilter] = useState("All Status");
  const [outcomeFilter, setOutcomeFilter] = useState("All Outcomes");
  const [ownerFilter, setOwnerFilter] = useState("All Owners");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState(emptyOnboardingForm);

  const [outcomeRecord, setOutcomeRecord] = useState(null);
  const [outcomeType, setOutcomeType] = useState("");
  const [outcomeForm, setOutcomeForm] = useState(emptyOutcomeForm);

  function scrollToTop(behavior = "auto") {
    requestAnimationFrame(() => {
      if (mainRef.current) {
        mainRef.current.scrollTo({
          top: 0,
          left: 0,
          behavior,
        });
      }

      if (typeof window !== "undefined") {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior,
        });
      }

      if (typeof document !== "undefined") {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
    });
  }

  useLayoutEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    scrollToTop("auto");

    const timer = window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const storedOnboarding = safeReadArray(ONBOARDING_STORAGE_KEY);

    const baseOnboarding =
      storedOnboarding.length > 0
        ? storedOnboarding
        : initialOnboardingRecords;

    const normalizedOnboarding = baseOnboarding.map((record) =>
      normalizeOnboardingRecord(record),
    );

    const acceptedOffers = getAcceptedOffersFromStorage();

    setOnboardingList(normalizedOnboarding);
    setAcceptedOfferList(acceptedOffers);
    saveOnboardingList(normalizedOnboarding);
    setHasLoadedStorage(true);
    scrollToTop("auto");

    const timer = window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    saveOnboardingList(onboardingList);
  }, [onboardingList, hasLoadedStorage]);

  useEffect(() => {
    function refreshAcceptedOffers() {
      setAcceptedOfferList(getAcceptedOffersFromStorage());
      setCurrentPage(1);
      scrollToTop("auto");

      window.setTimeout(() => {
        scrollToTop("auto");
      }, 0);
    }

    window.addEventListener(OFFERS_UPDATED_BROWSER_EVENT, refreshAcceptedOffers);
    window.addEventListener("storage", refreshAcceptedOffers);

    return () => {
      window.removeEventListener(
        OFFERS_UPDATED_BROWSER_EVENT,
        refreshAcceptedOffers,
      );
      window.removeEventListener("storage", refreshAcceptedOffers);
    };
  }, []);

  function handleOpenCreateModal() {
    setAcceptedOfferList(getAcceptedOffersFromStorage());
    setShowCreateModal(true);
    setOnboardingForm(emptyOnboardingForm);
  }

  function handleCloseCreateModal() {
    setShowCreateModal(false);
    setOnboardingForm(emptyOnboardingForm);
  }

  function handleResetOnboardingForm() {
    setOnboardingForm(emptyOnboardingForm);
  }

  function handleCreateOnboarding(e) {
    e.preventDefault();

    if (!onboardingForm.offerId) {
      alert("Accepted offer is required.");
      return;
    }

    if (!onboardingForm.expectedStartDate) {
      alert("Expected start date is required.");
      return;
    }

    const alreadyExists = onboardingList.some(
      (record) =>
        String(record.offerId || "") === String(onboardingForm.offerId || "") ||
        String(record.candidateEmail || "") ===
          String(onboardingForm.candidateEmail || ""),
    );

    if (alreadyExists) {
      alert("This accepted offer already has an onboarding record.");
      return;
    }

    const nextId =
      onboardingList.length > 0
        ? Math.max(...onboardingList.map((record) => Number(record.id) || 0)) +
          1
        : 1;

    const newRecord = normalizeOnboardingRecord({
      id: nextId,
      onboardingId: generateOnboardingId(nextId),
      offerId: onboardingForm.offerId,
      candidateApplicationId: onboardingForm.candidateApplicationId,
      candidateId: onboardingForm.candidateId,
      candidateName: onboardingForm.candidateName,
      candidateEmail: onboardingForm.candidateEmail,
      roleTitle: onboardingForm.roleTitle,
      account: onboardingForm.account,
      roleAccount: onboardingForm.roleAccount,
      acceptedOfferDate: onboardingForm.acceptedOfferDate,
      expectedStartDate: onboardingForm.expectedStartDate,
      actualStartDate: null,
      showStatus: "Pending",
      preStartWithdrawal: "No",
      withdrawalReason: null,
      reasonCategory: null,
      candidateFeedback: null,
      experienceRating: null,
      feedbackTag: null,
      finalOutcome: "Pending Start",
      owner: onboardingForm.owner,
      location: onboardingForm.location,
      remarks:
        onboardingForm.remarks ||
        "Onboarding record created from accepted offer. Waiting for start date.",
    });

    setOnboardingList((prev) => {
      const next = [newRecord, ...prev].map((record) =>
        normalizeOnboardingRecord(record),
      );

      saveOnboardingList(next);
      return next;
    });

    setSelectedRecord(newRecord);
    setCurrentPage(1);
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);

    handleCloseCreateModal();
  }

  function handleOpenOutcomeModal(record, type) {
    const normalizedRecord = normalizeOnboardingRecord(record);

    setOutcomeRecord(normalizedRecord);
    setOutcomeType(type);
    setOutcomeForm({
      actualStartDate: type === "Show" ? getTodayDate() : "",
      reasonCategory: type === "No Show" ? "No Response" : "",
      withdrawalReason: "",
      candidateFeedback: "",
      experienceRating: 3,
      feedbackTag: type === "No Show" ? "No Show" : "Pre-start Withdrawal",
      remarks: "",
    });
  }

  function handleCloseOutcomeModal() {
    setOutcomeRecord(null);
    setOutcomeType("");
    setOutcomeForm(emptyOutcomeForm);
  }

  function handleSubmitOutcome(e) {
    e.preventDefault();

    if (!outcomeRecord || !outcomeType) return;

    if (outcomeType === "Show" && !outcomeForm.actualStartDate) {
      alert("Actual start date is required.");
      return;
    }

    if (outcomeType === "No Show" || outcomeType === "Withdrawn") {
      if (!outcomeForm.reasonCategory) {
        alert("Reason category is required.");
        return;
      }

      if (!outcomeForm.withdrawalReason.trim()) {
        alert(
          outcomeType === "No Show"
            ? "No Show reason is required."
            : "Withdrawal reason is required.",
        );
        return;
      }
    }

    let updatedRecord = normalizeOnboardingRecord(outcomeRecord);

    if (outcomeType === "Show") {
      updatedRecord = normalizeOnboardingRecord({
        ...updatedRecord,
        actualStartDate: outcomeForm.actualStartDate,
        showStatus: "Show",
        preStartWithdrawal: "No",
        withdrawalReason: null,
        reasonCategory: null,
        candidateFeedback: null,
        experienceRating: null,
        feedbackTag: null,
        finalOutcome: "True Hire",
        remarks:
          outcomeForm.remarks ||
          "Candidate showed up and was converted to true hire.",
      });

      updatePipelineForOnboarding(
        updatedRecord,
        "Hired",
        "Candidate showed up and was marked as True Hire.",
      );
    }

    if (outcomeType === "No Show") {
      updatedRecord = normalizeOnboardingRecord({
        ...updatedRecord,
        actualStartDate: null,
        showStatus: "No Show",
        preStartWithdrawal: "No",
        withdrawalReason: outcomeForm.withdrawalReason.trim(),
        reasonCategory: outcomeForm.reasonCategory,
        candidateFeedback: outcomeForm.candidateFeedback.trim(),
        experienceRating: Number(outcomeForm.experienceRating || 3),
        feedbackTag: outcomeForm.feedbackTag.trim() || "No Show",
        finalOutcome: "No Show",
        remarks:
          outcomeForm.remarks ||
          "Candidate did not show up on the expected start date.",
      });

      updatePipelineForOnboarding(
        updatedRecord,
        "Drop-offs",
        "Candidate did not show up on the expected start date.",
      );
    }

    if (outcomeType === "Withdrawn") {
      updatedRecord = normalizeOnboardingRecord({
        ...updatedRecord,
        actualStartDate: null,
        showStatus: "Withdrawn",
        preStartWithdrawal: "Yes",
        withdrawalReason: outcomeForm.withdrawalReason.trim(),
        reasonCategory: outcomeForm.reasonCategory,
        candidateFeedback: outcomeForm.candidateFeedback.trim(),
        experienceRating: Number(outcomeForm.experienceRating || 3),
        feedbackTag: outcomeForm.feedbackTag.trim() || "Pre-start Withdrawal",
        finalOutcome: "Pre-start Withdrawal",
        remarks:
          outcomeForm.remarks ||
          "Candidate withdrew before the expected start date.",
      });

      updatePipelineForOnboarding(
        updatedRecord,
        "Drop-offs",
        "Candidate withdrew before the expected start date.",
      );
    }

    setOnboardingList((prev) => {
      const next = prev.map((record) =>
        record.id === outcomeRecord.id ||
        record.onboardingId === outcomeRecord.onboardingId
          ? updatedRecord
          : record,
      );

      saveOnboardingList(next);
      return next;
    });

    if (outcomeType === "No Show" || outcomeType === "Withdrawn") {
      const eventType =
        outcomeType === "No Show" ? "No Show" : "Pre-start Withdrawal";

      saveCandidateExperienceRecord({
        candidateId: updatedRecord.candidateId || updatedRecord.candidateEmail,
        candidateName: updatedRecord.candidateName,
        candidateEmail: updatedRecord.candidateEmail,
        applicationId: updatedRecord.candidateApplicationId,
        roleTitle: updatedRecord.roleTitle,
        account: updatedRecord.account,
        source: "Onboarding",
        eventType,
        currentStage: "Accepted",
        finalStatus: "Drop-off",
        dropOffStage: "Accepted",
        dropOffCategory: outcomeForm.reasonCategory,
        dropOffReason: outcomeForm.withdrawalReason.trim(),
        feedback: outcomeForm.candidateFeedback.trim(),
        experienceRating: Number(outcomeForm.experienceRating || 3),
        feedbackTag:
          outcomeForm.feedbackTag.trim() ||
          (outcomeType === "No Show" ? "No Show" : "Pre-start Withdrawal"),
        owner: updatedRecord.owner,
        stageTimeline: [
          {
            stage: "Offered",
            status: "Completed",
            date: updatedRecord.acceptedOfferDate,
          },
          {
            stage: "Accepted",
            status: "Drop-off",
            date: getTodayDate(),
          },
        ],
      });
    }

    setSelectedRecord(updatedRecord);
    setCurrentPage(1);
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);

    handleCloseOutcomeModal();
  }

  function handleClearFilters() {
    setSearch("");
    setShowStatusFilter("All Status");
    setOutcomeFilter("All Outcomes");
    setOwnerFilter("All Owners");
    setCurrentPage(1);
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);
  }

  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return onboardingList.filter((item) => {
      const record = normalizeOnboardingRecord(item);

      const matchesSearch =
        !keyword ||
        String(record.onboardingId || "").toLowerCase().includes(keyword) ||
        String(record.offerId || "").toLowerCase().includes(keyword) ||
        String(record.candidateName || "").toLowerCase().includes(keyword) ||
        String(record.candidateEmail || "").toLowerCase().includes(keyword) ||
        String(record.roleTitle || "").toLowerCase().includes(keyword) ||
        String(record.account || "").toLowerCase().includes(keyword) ||
        String(record.owner || "").toLowerCase().includes(keyword);

      const matchesShowStatus =
        showStatusFilter === "All Status" ||
        record.showStatus === showStatusFilter;

      const matchesOutcome =
        outcomeFilter === "All Outcomes" ||
        record.finalOutcome === outcomeFilter;

      const matchesOwner =
        ownerFilter === "All Owners" || record.owner === ownerFilter;

      return (
        matchesSearch && matchesShowStatus && matchesOutcome && matchesOwner
      );
    });
  }, [
    onboardingList,
    search,
    showStatusFilter,
    outcomeFilter,
    ownerFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / ONBOARDING_RECORDS_PER_PAGE),
  );

  const paginatedRecords = useMemo(() => {
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const start = (safePage - 1) * ONBOARDING_RECORDS_PER_PAGE;
    const end = start + ONBOARDING_RECORDS_PER_PAGE;

    return filteredRecords.slice(start, end);
  }, [filteredRecords, currentPage, totalPages]);

  const showingFrom =
    filteredRecords.length > 0
      ? (currentPage - 1) * ONBOARDING_RECORDS_PER_PAGE + 1
      : 0;

  const showingTo = Math.min(
    currentPage * ONBOARDING_RECORDS_PER_PAGE,
    filteredRecords.length,
  );

  useEffect(() => {
    setCurrentPage(1);
    scrollToTop("auto");

    const timer = window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search, showStatusFilter, outcomeFilter, ownerFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
      scrollToTop("auto");
    }
  }, [currentPage, totalPages]);

  function handlePageChange(nextPage) {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);

    if (safePage === currentPage) {
      scrollToTop("auto");

      window.setTimeout(() => {
        scrollToTop("auto");
      }, 0);

      return;
    }

    setCurrentPage(safePage);
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);
  }

  const stats = useMemo(() => {
    const total = onboardingList.length;

    const trueHires = onboardingList.filter(
      (record) => normalizeOnboardingRecord(record).finalOutcome === "True Hire",
    ).length;

    const pending = onboardingList.filter(
      (record) =>
        normalizeOnboardingRecord(record).finalOutcome === "Pending Start",
    ).length;

    const noShow = onboardingList.filter(
      (record) => normalizeOnboardingRecord(record).finalOutcome === "No Show",
    ).length;

    const withdrawals = onboardingList.filter(
      (record) =>
        normalizeOnboardingRecord(record).finalOutcome ===
        "Pre-start Withdrawal",
    ).length;

    const showRate = total > 0 ? Math.round((trueHires / total) * 100) : 0;

    return {
      total,
      trueHires,
      pending,
      noShow,
      withdrawals,
      showRate,
    };
  }, [onboardingList]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main
        ref={mainRef}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6"
      >
        <div className="mx-auto max-w-[1600px] space-y-5">
          <div className="sibs-page-header-in flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                <ClipboardList size={14} />
                Recruitment Setup
              </div>

              <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
                Onboarding
              </h1>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Track onboarding transitions, true hires, show/no-show, and
                pre-start withdrawals.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
            >
              <Plus size={18} />
              Add Onboarding Record
            </button>
          </div>

          <section
            className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5"
            style={{ animationDelay: "60ms" }}
          >
            <h2 className="text-base font-bold text-[#101828]">
              Onboarding Summary
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <SummaryCard
                title="Accepted Offers"
                value={stats.total}
                icon={FileText}
                description="Moved to onboarding"
                delay={0}
              />

              <SummaryCard
                title="True Hires"
                value={stats.trueHires}
                icon={UserCheck}
                description={`${stats.showRate}% show rate`}
                valueClassName="text-emerald-600"
                iconClassName="bg-emerald-50 text-emerald-600"
                delay={60}
              />

              <SummaryCard
                title="Pending Start"
                value={stats.pending}
                icon={Clock3}
                description="Waiting for start date"
                valueClassName="text-amber-500"
                iconClassName="bg-amber-50 text-amber-600"
                delay={120}
              />

              <SummaryCard
                title="No Show"
                value={stats.noShow}
                icon={UserX}
                description="Did not start"
                valueClassName="text-red-600"
                iconClassName="bg-red-50 text-red-600"
                delay={180}
              />

              <SummaryCard
                title="Pre-start Withdrawal"
                value={stats.withdrawals}
                icon={CircleX}
                description="Needs reason"
                valueClassName="text-orange-600"
                iconClassName="bg-orange-50 text-orange-600"
                delay={240}
              />

              <SummaryCard
                title="Show Rate"
                value={`${stats.showRate}%`}
                icon={CheckCircle2}
                description="Onboarding KPI"
                valueClassName="text-sibs-primary-1"
                iconClassName="bg-[#F2F6FA] text-sibs-primary-1"
                delay={300}
              />
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_420px]">
            <section
              className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5"
              style={{ animationDelay: "120ms" }}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[#101828]">
                    Onboarding Outcome Summary
                  </h2>

                  <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                    Tracks true hires versus accepted offers.
                  </p>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
                  <Timer size={22} />
                </div>
              </div>

              <div className="space-y-5">
                <ProgressBar
                  label="True Hires"
                  value={stats.trueHires}
                  total={stats.total}
                  delay={0}
                />

                <ProgressBar
                  label="Pending Start"
                  value={stats.pending}
                  total={stats.total}
                  delay={60}
                />

                <ProgressBar
                  label="No Show"
                  value={stats.noShow}
                  total={stats.total}
                  delay={120}
                />

                <ProgressBar
                  label="Pre-start Withdrawal"
                  value={stats.withdrawals}
                  total={stats.total}
                  delay={180}
                />
              </div>
            </section>

            <section
              className="sibs-profile-tab-panel rounded-xl border border-blue-100 bg-blue-50 p-5 shadow-sm sm:p-6"
              style={{ animationDelay: "180ms" }}
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white p-3 text-sibs-primary-1">
                  <AlertTriangle size={22} />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-sibs-primary-1">
                    Correct Onboarding Flow
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                    Accepted Offer creates onboarding. Onboarding determines if
                    the candidate becomes a True Hire. Only Show should move the
                    candidate to Hired and count as filled.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <section
            className="relative z-[80] sibs-profile-tab-panel overflow-visible rounded-2xl border border-[#D9E2EC] bg-white shadow-sm"
            style={{ animationDelay: "240ms" }}
          >
            <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-sibs-primary-1">
                    Onboarding Records
                  </h2>

                  <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                    Search and filter accepted offer to actual start records.
                  </p>
                </div>

                <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1">
                  {filteredRecords.length} Records
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_190px_230px_190px_auto] xl:items-end">
                <div>
                  <label className="mb-1 block text-sm font-bold text-[#101828]">
                    Search
                  </label>

                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                    />

                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search candidate, role, account..."
                      className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                    />
                  </div>
                </div>

                <CustomSelect
                  label="Show Status"
                  value={showStatusFilter}
                  options={showStatusOptions}
                  onChange={setShowStatusFilter}
                  zIndex="z-50"
                />

                <CustomSelect
                  label="Outcome"
                  value={outcomeFilter}
                  options={outcomeOptions}
                  onChange={setOutcomeFilter}
                  zIndex="z-40"
                />

                <CustomSelect
                  label="Owner"
                  value={ownerFilter}
                  options={ownerOptions}
                  onChange={setOwnerFilter}
                  zIndex="z-30"
                />

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
                >
                  <Filter size={17} />
                  Clear
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="space-y-3 lg:hidden">
                {paginatedRecords.length > 0 ? (
                  paginatedRecords.map((item) => {
                    const record = normalizeOnboardingRecord(item);

                    return (
                      <OnboardingMobileCard
                        key={`${record.onboardingId}-${record.candidateEmail}`}
                        record={record}
                        onView={() => setSelectedRecord(record)}
                      />
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                    No onboarding records found.
                  </div>
                )}
              </div>

              <div className="hidden lg:block">
                <div className="overflow-x-auto p-0">
                  <table className="w-full min-w-[1350px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left">
                    <thead>
                      <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                        <th className="px-5 py-4 first:rounded-tl-2xl">
                          Onboarding ID
                        </th>
                        <th className="px-5 py-4">Candidate</th>
                        <th className="px-5 py-4">Role / Account</th>
                        <th className="px-5 py-4">Accepted Offer</th>
                        <th className="px-5 py-4">Expected Start</th>
                        <th className="px-5 py-4">Actual Start</th>
                        <th className="px-5 py-4">Show Status</th>
                        <th className="px-5 py-4">Final Outcome</th>
                        <th className="px-5 py-4">Owner</th>
                        <th className="px-5 py-4 text-right last:rounded-tr-2xl">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedRecords.length > 0 ? (
                        paginatedRecords.map((item) => {
                          const record = normalizeOnboardingRecord(item);

                          return (
                            <tr
                              key={`${record.onboardingId}-${record.candidateEmail}`}
                              className="transition-all duration-200 hover:bg-[#FAFBFC]"
                            >
                              <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-bold text-sibs-primary-1">
                                {record.onboardingId}
                              </td>

                              <td className="border-b border-[#E6ECF2] px-5 py-5">
                                <p className="text-sm font-bold text-[#101828]">
                                  {record.candidateName}
                                </p>

                                <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                                  {record.candidateEmail}
                                </p>
                              </td>

                              <td className="border-b border-[#E6ECF2] px-5 py-5">
                                <p className="text-sm font-bold text-[#344054]">
                                  {record.roleTitle}
                                </p>

                                <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                                  {record.account}
                                </p>
                              </td>

                              <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                                <div className="flex items-center gap-2">
                                  <CalendarDays
                                    size={15}
                                    className="text-gray-400"
                                  />
                                  {formatDate(record.acceptedOfferDate)}
                                </div>
                              </td>

                              <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                                {formatDate(record.expectedStartDate)}
                              </td>

                              <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                                {formatDate(record.actualStartDate)}
                              </td>

                              <td className="border-b border-[#E6ECF2] px-5 py-5">
                                <span
                                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getShowStatusClass(
                                    record.showStatus,
                                  )}`}
                                >
                                  {record.showStatus}
                                </span>
                              </td>

                              <td className="border-b border-[#E6ECF2] px-5 py-5">
                                <span
                                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getOutcomeClass(
                                    record.finalOutcome,
                                  )}`}
                                >
                                  {record.finalOutcome}
                                </span>
                              </td>

                              <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                                {record.owner}
                              </td>

                              <td className="border-b border-[#E6ECF2] px-5 py-5 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedRecord(record)}
                                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 py-2 text-xs font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
                                >
                                  <Eye size={15} />
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={10}
                            className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                          >
                            No onboarding records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <p className="text-sm font-semibold text-sibs-tertiary-5">
                  Showing {showingFrom} to {showingTo} of {filteredRecords.length}{" "}
                  onboarding records
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }).map((_, index) => {
                    const pageNumber = index + 1;
                    const active = currentPage === pageNumber;

                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => handlePageChange(pageNumber)}
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
                          active
                            ? "bg-sibs-primary-1 text-white shadow-sm"
                            : "border border-[#E6ECF2] bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section
            className="sibs-profile-tab-panel rounded-xl border border-blue-100 bg-blue-50 p-5"
            style={{ animationDelay: "300ms" }}
          >
            <h3 className="text-sm font-bold text-sibs-primary-1">
              Onboarding Transition Rule
            </h3>

            <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
              Accepted Offer creates onboarding. Start Date, Show / No Show, and
              Pre-start Withdrawal must be captured. Only Show becomes True Hire
              and should move the candidate to Hired.
            </p>
          </section>
        </div>
      </main>

      <CreateOnboardingModal
        open={showCreateModal}
        form={onboardingForm}
        setForm={setOnboardingForm}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateOnboarding}
        onReset={handleResetOnboardingForm}
        onboardingList={onboardingList}
        acceptedOfferList={acceptedOfferList}
      />

      <OnboardingDetailsModal
        open={!!selectedRecord}
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onOpenOutcomeModal={handleOpenOutcomeModal}
      />

      <OutcomeModal
        open={!!outcomeRecord}
        record={outcomeRecord}
        type={outcomeType}
        form={outcomeForm}
        setForm={setOutcomeForm}
        onClose={handleCloseOutcomeModal}
        onSubmit={handleSubmitOutcome}
      />
    </div>
  );
}