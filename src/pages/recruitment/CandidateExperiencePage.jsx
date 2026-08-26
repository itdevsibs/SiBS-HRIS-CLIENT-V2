import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Header from "../../components/layout/Header";
import {
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ThumbsUp,
  ThumbsDown,
  ListChecks,
  Plus,
  RefreshCw,
  ClipboardList,
  Filter,
  Timer,
} from "lucide-react";
import {
  getCandidateExperienceRecords,
  saveCandidateExperienceRecord,
} from "@/lib/utils/candidateExperienceStore";
import { AddExperienceModal } from "../../components/modals/candidateExperience/CandidateExperienceModal.jsx";

const RECORDS_PER_PAGE = 8;

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

const stageOptions = [
  "All Stages",
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

const ratingOptions = ["All Ratings", "5", "4", "3", "2", "1"];

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
  return `h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
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
  zIndex = "z-30",
  formatOption,
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
      <label className="mb-1 block text-sm font-bold text-[#101828]">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-12 w-full items-center justify-between rounded-xl border border-[#D0D5DD] bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition-all duration-200 hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
      >
        <span className="truncate">
          {formatOption ? formatOption(displayValue) : displayValue}
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
            const selected = value === option;

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
                <span className="block truncate">
                  {formatOption ? formatOption(option) : option}
                </span>
              </button>
            );
          })}
        </div>
      </AnimatedDropdown>
    </div>
  );
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
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

function SummaryCard({
  title,
  value,
  icon: Icon,
  description,
  tone = "navy",
  valueClassName,
  iconClassName,
  delay = 0,
}) {
  const toneClasses = {
    navy: {
      label: "text-[#042C51]",
      value: "text-[#042C51]",
      icon: "bg-[#EAF2FB] text-[#042C51]",
    },
    emerald: {
      label: "text-[#047857]",
      value: "text-[#047857]",
      icon: "bg-[#ECFDF3] text-[#059669]",
    },
    amber: {
      label: "text-[#B45309]",
      value: "text-[#F59E0B]",
      icon: "bg-[#FFFBEB] text-[#F59E0B]",
    },
    red: {
      label: "text-[#BE123C]",
      value: "text-[#E11D48]",
      icon: "bg-[#FFF1F2] text-[#E11D48]",
    },
    orange: {
      label: "text-[#C2410C]",
      value: "text-[#FF5C28]",
      icon: "bg-[#FFF3ED] text-[#FF5C28]",
    },
  };

  const selectedTone = toneClasses[tone] || toneClasses.navy;

  return (
    <article
      className="sibs-metric-card sibs-page-card-in flex h-[104px] 2xl:h-[116px] min-h-[96px] 2xl:min-h-[112px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5 font-jakarta"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex h-full items-start justify-between gap-2.5 2xl:gap-3">
        <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
          <div>
            <p className={`m-0 truncate sibs-text-micro font-extrabold uppercase ${selectedTone.label}`}>
              {title}
            </p>
            <p className={`mt-1 text-2xl 2xl:text-3xl font-extrabold leading-none tabular-nums ${valueClassName || selectedTone.value}`}>
              {value}
            </p>
          </div>

          <p className="mt-1 line-clamp-1 truncate sibs-text-micro font-bold text-[#667085]">
            {description}
          </p>
        </div>

        <span
          className={`flex h-7.5 w-7.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full ${
            iconClassName || selectedTone.icon
          }`}
        >
          <Icon className="h-4 w-4 2xl:h-4.5 2xl:w-4.5" strokeWidth={2} />
        </span>
      </div>
    </article>
  );
}

function BarRow({ label, value, max, delay = 0 }) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="sibs-page-card-in" style={{ animationDelay: `${delay}ms` }}>
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

function ExperienceMobileCard({ record, onView, delay = 0 }) {
  return (
    <button
      type="button"
      onClick={onView}
      className="sibs-page-card-in w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] hover:shadow-md active:scale-[0.98]"
      style={{ animationDelay: `${delay}ms` }}
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
            record.finalStatus,
          )}`}
        >
          {record.finalStatus}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Event
          </p>

          <p className="mt-1 text-xs font-bold text-[#344054]">
            {record.eventType || "—"}
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3">
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
              record.dropOffCategory,
            )}`}
          >
            {record.dropOffCategory}
          </span>
        )}

        <span className="inline-flex rounded-full border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-bold text-[#344054]">
          {formatDate(record.dateRecorded)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-[#F8FAFC] p-3">
        <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
          Rating
        </p>

        <RatingStars rating={record.experienceRating} />
      </div>

      <div className="mt-4">
        <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-3 py-2 text-xs font-bold text-sibs-primary-1">
          <Eye size={15} />
          View Details
        </span>
      </div>
    </button>
  );
}

function CandidateExperienceModal({ open, record, onClose }) {
  if (!open || !record) return null;

  const timeline = Array.isArray(record.stageTimeline)
    ? record.stageTimeline
    : [];

  return (
    <div
      className="sibs-modal-blur fixed inset-0 z-[9999] flex h-dvh items-center justify-center px-4 py-4"
      onClick={onClose}
    >
      <div
        className="sibs-profile-tab-panel flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
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
            className="shrink-0 rounded-full p-2 text-gray-400 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-100 hover:text-gray-700 active:scale-[0.98]"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
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
                          record.finalStatus,
                        )}`}
                      >
                        {record.finalStatus}
                      </span>

                      {record.dropOffCategory && (
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getDropOffClass(
                            record.dropOffCategory,
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

              <div
                className="sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm"
                style={{ animationDelay: "60ms" }}
              >
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
                              item.status,
                            )}`}
                          >
                            {index + 1}
                          </div>

                          {index !== timeline.length - 1 && (
                            <div className="my-1 h-full min-h-8 w-px bg-gray-200" />
                          )}
                        </div>

                        <div className="flex-1 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
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
                                item.status,
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
                <div
                  className="sibs-profile-tab-panel rounded-xl border border-red-100 bg-red-50 p-5"
                  style={{ animationDelay: "120ms" }}
                >
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

              <div
                className="sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm"
                style={{ animationDelay: "180ms" }}
              >
                <h3 className="text-sm font-bold text-[#101828]">
                  Candidate Feedback
                </h3>

                <p className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#344054]">
                  {record.feedback || "No candidate feedback recorded."}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
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

              <div
                className="sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm"
                style={{ animationDelay: "80ms" }}
              >
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

              <div
                className="sibs-profile-tab-panel rounded-xl border border-blue-100 bg-blue-50 p-5"
                style={{ animationDelay: "140ms" }}
              >
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Rating Rule
                </h3>

                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  The star rating is saved as a number from 1 to 5. The frontend
                  only converts that number into stars.
                </p>
              </div>

              <div
                className="sibs-profile-tab-panel rounded-xl border border-emerald-100 bg-emerald-50 p-5"
                style={{ animationDelay: "200ms" }}
              >
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

export default function CandidateExperiencePage() {
  const mainRef = useRef(null);

  const [experienceList, setExperienceList] = useState(
    initialCandidateExperienceRecords,
  );

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All Stages");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [ratingFilter, setRatingFilter] = useState("All Ratings");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [experienceForm, setExperienceForm] = useState(emptyExperienceForm);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    try {
      const records = getCandidateExperienceRecords();
      setExperienceList(mergeExperienceRecords(records, initialCandidateExperienceRecords));
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  function scrollToTop(behavior = "auto") {
    requestAnimationFrame(() => {
      if (mainRef.current) {
        mainRef.current.scrollTo({
          top: 0,
          left: 0,
          behavior,
        });
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
    function loadStoredRecords() {
      const storedRecords = getCandidateExperienceRecords();

      setExperienceList(
        mergeExperienceRecords(storedRecords, initialCandidateExperienceRecords),
      );

      scrollToTop("auto");

      window.setTimeout(() => {
        scrollToTop("auto");
      }, 0);
    }

    loadStoredRecords();

    window.addEventListener("candidate-experience-updated", loadStoredRecords);
    window.addEventListener("storage", loadStoredRecords);

    return () => {
      window.removeEventListener(
        "candidate-experience-updated",
        loadStoredRecords,
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

  function handleClearFilters() {
    setSearch("");
    setStageFilter("All Stages");
    setCategoryFilter("All Categories");
    setRatingFilter("All Ratings");
    setCurrentPage(1);
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);
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
    setCurrentPage(1);
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);

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

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / RECORDS_PER_PAGE),
  );

  const paginatedRecords = useMemo(() => {
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const start = (safePage - 1) * RECORDS_PER_PAGE;
    const end = start + RECORDS_PER_PAGE;

    return filteredRecords.slice(start, end);
  }, [filteredRecords, currentPage, totalPages]);

  const showingFrom =
    filteredRecords.length > 0 ? (currentPage - 1) * RECORDS_PER_PAGE + 1 : 0;

  const showingTo = Math.min(
    currentPage * RECORDS_PER_PAGE,
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
  }, [search, stageFilter, categoryFilter, ratingFilter]);

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
    const total = experienceList.length;

    const dropOffs = experienceList.filter(
      (record) => record.finalStatus === "Drop-off",
    ).length;

    const completed = experienceList.filter(
      (record) => record.finalStatus === "Completed",
    ).length;

    const averageRating =
      total > 0
        ? (
            experienceList.reduce(
              (sum, record) => sum + Number(record.experienceRating || 0),
              0,
            ) / total
          ).toFixed(1)
        : "0.0";

    const lowRating = experienceList.filter(
      (record) => Number(record.experienceRating) <= 2,
    ).length;

    const positiveRating = experienceList.filter(
      (record) => Number(record.experienceRating) >= 4,
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
      (record) => record.finalStatus === "Drop-off",
    );

    return records.reduce((acc, record) => {
      const key = record.dropOffStage || "Unspecified";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [experienceList]);

  const dropOffByCategory = useMemo(() => {
    const records = experienceList.filter(
      (record) => record.finalStatus === "Drop-off",
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
    <div className="sibs-dashboard-shell font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main
        ref={mainRef}
        className="sibs-dashboard-main-wide min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6"
      >
        <div className="mx-auto max-w-[1600px] space-y-5">
          <section className="sibs-page-header-in sibs-card relative overflow-hidden p-4 font-jakarta 2xl:p-6 mb-5">
            <span className="sibs-top-accent pointer-events-none absolute left-[1px] right-[1px] top-[1px] h-1 rounded-t-[15px] bg-gradient-to-r from-[#042C51] via-[#FF5C28] to-[#042C51]" aria-hidden="true" />
            <div className="mt-0.5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-normal text-[#042C51]">
                    <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-[#FF5C28]" />
                    Recruitment Setup
                  </span>
                </div>

                <h1 className="break-words text-lg 2xl:text-2xl font-extrabold text-[#042C51]">
                  Candidate Experience
                </h1>

                <p className="sibs-text-sm font-semibold leading-relaxed text-[#667085]">
                  Track drop-offs, offer declines, onboarding no-shows, withdrawals, candidate feedback, and experience ratings.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 2xl:gap-2.5">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  title="Refresh Candidate Experience"
                  aria-label="Refresh Candidate Experience"
                  className="inline-flex h-8.5 2xl:h-10 w-8.5 2xl:w-10 shrink-0 items-center justify-center rounded-lg border border-[#D6E0EA] bg-white text-[#042C51] shadow-xs outline-none transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                      isRefreshing ? "animate-spin text-[#FF5C28]" : ""
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="inline-flex h-8.5 2xl:h-10 shrink-0 items-center justify-center gap-1.5 2xl:gap-2 whitespace-nowrap rounded-lg bg-sibs-orange px-3 2xl:px-3.5 sibs-text-xs font-extrabold text-white shadow-xs transition hover:bg-sibs-orange/90 active:scale-[0.98]"
                >
                  <Plus className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-white" />
                  Add Experience Record
                </button>
              </div>
            </div>
          </section>

          <section
            className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5"
            style={{ animationDelay: "60ms" }}
          >
            <h2 className="text-base font-bold text-[#101828]">
              Candidate Experience Summary
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-2.5 2xl:gap-3 md:grid-cols-3 xl:grid-cols-6">
              <SummaryCard
                title="Records"
                value={stats.total}
                icon={UsersRound}
                description="Experience records"
                delay={0}
              />

              <SummaryCard
                title="Drop-offs"
                value={stats.dropOffs}
                icon={UserX}
                description="Exited candidates"
                valueClassName="text-red-600"
                iconClassName="bg-red-50 text-red-600"
                delay={60}
              />

              <SummaryCard
                title="Completed"
                value={stats.completed}
                icon={CheckCircle2}
                description="Completed process"
                valueClassName="text-emerald-600"
                iconClassName="bg-emerald-50 text-emerald-600"
                delay={120}
              />

              <SummaryCard
                title="Avg. Rating"
                value={stats.averageRating}
                icon={Star}
                description="Out of 5"
                valueClassName="text-amber-600"
                iconClassName="bg-amber-50 text-amber-600"
                delay={180}
              />

              <SummaryCard
                title="Positive Ratings"
                value={stats.positiveRating}
                icon={ThumbsUp}
                description="4 to 5 rating"
                valueClassName="text-emerald-600"
                iconClassName="bg-emerald-50 text-emerald-600"
                delay={240}
              />

              <SummaryCard
                title="Low Ratings"
                value={stats.lowRating}
                icon={ThumbsDown}
                description="Needs review"
                valueClassName="text-red-600"
                iconClassName="bg-red-50 text-red-600"
                delay={300}
              />
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_420px]">
            <section
              className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5"
              style={{ animationDelay: "120ms" }}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[#101828]">
                    Drop-offs by Stage
                  </h2>

                  <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                    Shows where candidates are lost.
                  </p>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
                  <BarChart3 size={22} />
                </div>
              </div>

              <div className="space-y-5">
                {Object.entries(dropOffByStage).length > 0 ? (
                  Object.entries(dropOffByStage).map(
                    ([stage, count], index) => (
                      <BarRow
                        key={stage}
                        label={stage}
                        value={count}
                        max={maxStageDropOff}
                        delay={index * 60}
                      />
                    ),
                  )
                ) : (
                  <div className="rounded-xl border border-dashed border-[#E6ECF2] bg-[#F8FAFC] p-5 text-center text-sm font-bold text-sibs-tertiary-5">
                    No drop-off data yet.
                  </div>
                )}
              </div>
            </section>

            <section
              className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5"
              style={{ animationDelay: "180ms" }}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[#101828]">
                    Drop-offs by Reason
                  </h2>

                  <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                    Shows why candidates exit.
                  </p>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <AlertTriangle size={22} />
                </div>
              </div>

              <div className="space-y-5">
                {Object.entries(dropOffByCategory).length > 0 ? (
                  Object.entries(dropOffByCategory).map(
                    ([category, count], index) => (
                      <BarRow
                        key={category}
                        label={category}
                        value={count}
                        max={maxCategoryDropOff}
                        delay={index * 60}
                      />
                    ),
                  )
                ) : (
                  <div className="rounded-xl border border-dashed border-[#E6ECF2] bg-[#F8FAFC] p-5 text-center text-sm font-bold text-sibs-tertiary-5">
                    No drop-off reason data yet.
                  </div>
                )}
              </div>
            </section>

            <section
              className="sibs-profile-tab-panel rounded-xl border border-blue-100 bg-blue-50 p-5 shadow-sm sm:p-6"
              style={{ animationDelay: "240ms" }}
            >
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
            </section>
          </div>

          <section
            className="relative z-[80] sibs-profile-tab-panel overflow-visible rounded-2xl border border-[#D9E2EC] bg-white shadow-sm"
            style={{ animationDelay: "300ms" }}
          >
            <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-sibs-primary-1">
                    Candidate Experience List
                  </h2>

                  <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                    Search and filter candidate experience records.
                  </p>
                </div>

                <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1">
                  {filteredRecords.length} Records
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 2xl:grid-cols-[1fr_260px_230px_160px_auto] 2xl:items-end">
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
                      placeholder="Search candidate, role, feedback..."
                      className={inputClass("pl-11 pr-4")}
                    />
                  </div>
                </div>

                <CustomSelect
                  label="Stage"
                  value={stageFilter}
                  options={stageOptions}
                  onChange={setStageFilter}
                  zIndex="z-50"
                />

                <CustomSelect
                  label="Category"
                  value={categoryFilter}
                  options={categoryOptions}
                  onChange={setCategoryFilter}
                  zIndex="z-40"
                />

                <CustomSelect
                  label="Rating"
                  value={ratingFilter}
                  options={ratingOptions}
                  onChange={setRatingFilter}
                  zIndex="z-30"
                  formatOption={(value) =>
                    value === "All Ratings" ? value : `${value} Star`
                  }
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
                  paginatedRecords.map((record, index) => (
                    <ExperienceMobileCard
                      key={record.id}
                      record={record}
                      onView={() => setSelectedRecord(record)}
                      delay={index * 60}
                    />
                  ))
                ) : (
                  <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                    No candidate experience records found.
                  </div>
                )}
              </div>

              <div className="hidden lg:block">
                <div className="overflow-x-auto p-0">
                  <table className="w-full min-w-[1220px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left">
                    <thead>
                      <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                        <th className="px-5 py-4 first:rounded-tl-2xl">
                          Candidate
                        </th>
                        <th className="px-5 py-4">Role / Account</th>
                        <th className="px-5 py-4">Event</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Exit Stage</th>
                        <th className="px-5 py-4">Reason Category</th>
                        <th className="px-5 py-4">Rating</th>
                        <th className="px-5 py-4">Feedback Tag</th>
                        <th className="px-5 py-4">Date</th>
                        <th className="px-5 py-4 text-right last:rounded-tr-2xl">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedRecords.length > 0 ? (
                        paginatedRecords.map((record) => (
                          <tr
                            key={record.id}
                            className="transition-all duration-200 hover:bg-[#FAFBFC]"
                          >
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
                              {record.eventType}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                                  record.finalStatus,
                                )}`}
                              >
                                {record.finalStatus}
                              </span>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                              {record.dropOffStage || "—"}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5">
                              {record.dropOffCategory ? (
                                <span
                                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getDropOffClass(
                                    record.dropOffCategory,
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

                            <td className="border-b border-[#E6ECF2] px-5 py-5">
                              <RatingStars rating={record.experienceRating} />
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                              {record.feedbackTag || "—"}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                              <div className="flex items-center gap-2">
                                <CalendarDays
                                  size={15}
                                  className="text-gray-400"
                                />
                                {formatDate(record.dateRecorded)}
                              </div>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedRecord(record)}
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
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
                  Showing {showingFrom} to {showingTo} of{" "}
                  {filteredRecords.length} candidate experience records
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
            style={{ animationDelay: "360ms" }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white p-3 text-sibs-primary-1">
                  <Timer size={22} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-sibs-primary-1">
                    Candidate Experience Rule
                  </h3>

                  <p className="mt-2 max-w-5xl text-sm leading-6 text-sibs-primary-1/80">
                    The data comes from Candidate Pipeline drop-offs, Offer
                    declines, Onboarding no-shows or withdrawals, and manual
                    candidate feedback. The star rating is saved as a number
                    from 1 to 5 and only displayed as stars in the frontend.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenAddModal}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
              >
                <Plus size={18} />
                Add Feedback
              </button>
            </div>
          </section>
        </div>
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
