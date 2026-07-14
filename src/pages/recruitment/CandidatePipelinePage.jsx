import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "../../components/layout/Header";
import { useCandidatePipeline } from "../../services/context/CandidatePipelineContext";
import { getTalentPoolApplications } from "../../lib/axios/getTalentPool";

import {
  Search,
  UserCheck,
  BriefcaseBusiness,
  ShieldCheck,
  Filter,
  CalendarDays,
  ClipboardCheck,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Eye,
  RefreshCw,
  Loader2,
} from "lucide-react";

import DashboardMetric from "../../components/layout/common/DashboardMetric";
import MoveStageModal from "../../components/modals/candidatePipeline/MoveStageModal";
import ScheduleInterviewModal from "../../components/modals/candidatePipeline/ScheduleInterviewModal";
import AssessmentModal from "../../components/modals/candidatePipeline/AssessmentModal";
import DropOffModal from "../../components/modals/candidatePipeline/DropOffModal";
import OfferDetailsModal from "../../components/modals/candidatePipeline/OfferDetailsModal";
import CandidatePipelineModal from "../../components/modals/candidatePipeline/CandidatePipelineModal";
import PipelineCardsBoard from "../../components/recruitment/candidatePipeline/PipelineCardBoard";
import InterviewCalendar from "../../components/recruitment/candidatePipeline/InterviewCalendar";

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeText(value) {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ");
}

function getRawCandidateName(candidate = {}) {
  return (
    candidate.name ||
    candidate.candidateName ||
    candidate.fullName ||
    candidate.full_name ||
    ""
  );
}

function getRawCandidateEmail(candidate = {}) {
  return (
    candidate.email ||
    candidate.candidateEmail ||
    candidate.candidate_email ||
    candidate.emailAddress ||
    candidate.email_address ||
    ""
  );
}

function getCandidateStage(candidate = {}) {
  return (
    candidate.currentStage ||
    candidate.currentPipelineStage ||
    candidate.pipelineStage ||
    candidate.stage ||
    "Initial Screening"
  );
}

function formatDisplayDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getCandidateName(candidate = {}) {
  return candidate.name || candidate.candidateName || "—";
}

function getCandidateId(candidate = {}) {
  return (
    candidate.candidateId ||
    candidate.candidateApplicationId ||
    candidate.applicationId ||
    candidate.id ||
    "—"
  );
}

function getCandidateRole(candidate = {}) {
  return (
    candidate.currentAppliedRole ||
    candidate.roleTitle ||
    candidate.openPosition ||
    candidate.roleCapability ||
    "Not assigned yet"
  );
}

function getCandidateAccount(candidate = {}) {
  return (
    candidate.currentAppliedAccount ||
    candidate.account ||
    candidate.leadAccount ||
    candidate.accountFit ||
    "Not assigned yet"
  );
}

function getDropOffReason(candidate = {}) {
  return (
    candidate.dropOffReason ||
    candidate.drop_off_reason ||
    candidate.reasonForMovement ||
    candidate.reason_for_movement ||
    candidate.remarks ||
    "No reason provided."
  );
}

function getDropOffDate(candidate = {}) {
  return (
    candidate.droppedOffAt ||
    candidate.dropped_off_at ||
    candidate.dateMoved ||
    candidate.date_moved ||
    candidate.updatedAt ||
    candidate.updated_at ||
    candidate.lastActivity ||
    candidate.last_activity ||
    ""
  );
}

function getDropOffBy(candidate = {}) {
  return (
    candidate.droppedOffByName ||
    candidate.dropped_off_by_name ||
    candidate.currentTaOwner ||
    candidate.current_ta_owner ||
    ""
  );
}

function isDropOffCandidate(candidate = {}) {
  const possibleValues = [
    candidate.currentStage,
    candidate.currentPipelineStage,
    candidate.pipelineStage,
    candidate.stage,
    candidate.status,
    candidate.pipelineStatus,
    candidate.dropOffCategory,
  ]
    .map(normalizeText)
    .filter(Boolean);

  const acceptedValues = new Set([
    "drop off",
    "drop-off",
    "drop offs",
    "drop-offs",
    "dropped off",
  ]);

  return (
    possibleValues.some((value) => acceptedValues.has(value)) ||
    Boolean(
      cleanText(
        candidate.dropOffReason ||
          candidate.drop_off_reason ||
          candidate.droppedOffAt ||
          candidate.dropped_off_at,
      ),
    )
  );
}

function getDropOffCandidateKey(candidate = {}) {
  return normalizeText(
    candidate.sourceTalentPoolId ||
      candidate.source_talent_pool_id ||
      candidate.candidateId ||
      candidate.candidate_id ||
      candidate.candidateApplicationId ||
      candidate.applicationId ||
      candidate.id ||
      candidate.email ||
      candidate.name,
  );
}

function mergeUniqueCandidates(...candidateGroups) {
  const candidateMap = new Map();

  candidateGroups
    .flat()
    .filter(Boolean)
    .forEach((candidate) => {
      const key = getDropOffCandidateKey(candidate);

      if (!key) return;

      if (!candidateMap.has(key)) {
        candidateMap.set(key, candidate);
        return;
      }

      candidateMap.set(key, {
        ...candidateMap.get(key),
        ...candidate,
      });
    });

  return Array.from(candidateMap.values());
}

function matchesDropOffFilters(
  candidate,
  search,
  roleFilter,
  accountFilter,
) {
  const keyword = normalizeText(search);

  const searchableText = normalizeText(
    [
      getCandidateName(candidate),
      getRawCandidateEmail(candidate),
      getCandidateId(candidate),
      getCandidateRole(candidate),
      getCandidateAccount(candidate),
      candidate.applyingLocation,
      getDropOffReason(candidate),
      getDropOffBy(candidate),
    ]
      .filter(Boolean)
      .join(" "),
  );

  const matchesSearch = !keyword || searchableText.includes(keyword);

  const matchesRole =
    roleFilter === "All Roles" ||
    normalizeText(getCandidateRole(candidate)) === normalizeText(roleFilter);

  const matchesAccount =
    accountFilter === "All Accounts" ||
    normalizeText(getCandidateAccount(candidate)) ===
      normalizeText(accountFilter);

  return matchesSearch && matchesRole && matchesAccount;
}

function isPlaceholderCandidate(candidate = {}) {
  const name = normalizeText(getRawCandidateName(candidate));
  const email = normalizeText(getRawCandidateEmail(candidate));

  const role = normalizeText(
    candidate.currentAppliedRole ||
      candidate.roleTitle ||
      candidate.openPosition ||
      candidate.roleCapability ||
      candidate.position ||
      "",
  );

  const account = normalizeText(
    candidate.currentAppliedAccount ||
      candidate.account ||
      candidate.leadAccount ||
      candidate.accountFit ||
      candidate.initialAccount ||
      "",
  );

  const nameIsPlaceholder =
    !name ||
    name === "unnamed candidate" ||
    name === "no name" ||
    name === "—" ||
    name === "-";

  const emailIsPlaceholder =
    !email ||
    email === "no email saved" ||
    email === "no email provided" ||
    email === "—" ||
    email === "-";

  const roleIsPlaceholder =
    !role || role === "not assigned yet" || role === "—" || role === "-";

  const accountIsPlaceholder =
    !account || account === "not assigned yet" || account === "—" || account === "-";

  return (
    nameIsPlaceholder &&
    emailIsPlaceholder &&
    roleIsPlaceholder &&
    accountIsPlaceholder
  );
}

function filterRenderableCandidates(candidates = []) {
  if (!Array.isArray(candidates)) return [];

  return candidates.filter((candidate) => !isPlaceholderCandidate(candidate));
}

function buildSafeStageCounts(stageCounts = {}, candidates = []) {
  const nextCounts = { ...(stageCounts || {}) };

  Object.keys(nextCounts).forEach((key) => {
    nextCounts[key] = 0;
  });

  candidates.forEach((candidate) => {
    const stage = getCandidateStage(candidate);

    nextCounts[stage] = Number(nextCounts[stage] || 0) + 1;
  });

  return nextCounts;
}

function normalizeDropdownOptions(options = []) {
  return options
    .map((option) => {
      if (typeof option === "string" || typeof option === "number") {
        return {
          id: option,
          value: option,
          label: String(option),
        };
      }

      const value = option?.value ?? option?.id ?? "";
      const label = option?.label ?? option?.name ?? option?.value ?? "";

      if (!cleanText(value) && !cleanText(label)) return null;

      return {
        id: option?.id ?? value ?? label,
        value: value || label,
        label: label || String(value),
      };
    })
    .filter(Boolean);
}

function FilterDropdown({
  label,
  value,
  options = [],
  onChange,
  placeholder = "Select",
  disabled = false,
  zIndex = "z-[100]",
}) {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);

  const normalizedOptions = normalizeDropdownOptions(options);

  const selectedOption = normalizedOptions.find(
    (option) => String(option.value) === String(value ?? ""),
  );

  const displayLabel = selectedOption?.label || placeholder;

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
      className={`relative min-w-0 ${open ? zIndex : "z-[1]"}`}
    >
      <label className="mb-1 block text-sm font-extrabold text-[#101828]">
        {label}
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-12 w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-extrabold shadow-sm outline-none transition ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : "border-[#D0D5DD] hover:border-sibs-primary-1"
        } ${
          disabled
            ? "cursor-not-allowed bg-gray-50 text-gray-400 opacity-70"
            : "text-[#344054]"
        }`}
      >
        <span className="min-w-0 flex-1 truncate text-[#344054]">
          {displayLabel}
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-primary-1 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[99999] overflow-hidden rounded-xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
          <div className="max-h-72 overflow-y-auto">
            {normalizedOptions.length > 0 ? (
              normalizedOptions.map((option) => {
                const active = String(option.value) === String(value ?? "");

                return (
                  <button
                    key={option.id || option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`block w-full px-4 py-4 text-left text-sm font-extrabold transition ${
                      active
                        ? "bg-[#EAF4FF] text-sibs-primary-1"
                        : "bg-white text-[#344054] hover:bg-[#F5F9FF] hover:text-sibs-primary-1"
                    }`}
                  >
                    <span className="block min-w-0 truncate">
                      {option.label}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-4 text-sm font-extrabold text-sibs-tertiary-5">
                No options found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingPipelineBoard() {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
      <div className="border-b border-[#E6ECF2] px-5 py-4">
        <h2 className="text-base font-extrabold text-[#101828]">Board</h2>
        <p className="mt-1 text-sm font-medium text-sibs-primary-1">
          Loading candidate pipeline records.
        </p>
      </div>

      <div className="flex min-h-[360px] items-center justify-center p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sibs-primary-1">
            <Loader2 size={22} className="animate-spin" />
          </div>

          <p className="mt-3 text-sm font-extrabold text-[#101828]">
            Loading candidate pipeline...
          </p>

          <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
            Please wait while the latest candidate data is being prepared.
          </p>
        </div>
      </div>
    </section>
  );
}

function DropOffListSection({
  candidates = [],
  onViewCandidate,
  isLoading = false,
  loadError = "",
}) {
  const [expanded, setExpanded] = useState(true);
  const dropOffTableScrollRef = useRef(null);
  const dropOffDragStateRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    scrollLeft: 0,
  });
  const [isDropOffTableDragging, setIsDropOffTableDragging] = useState(false);

  const visibleCandidates = expanded ? candidates : candidates.slice(0, 3);
  const hasMore = candidates.length > 3;

  function handleDropOffTablePointerDown(event) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;

    const interactiveElement = event.target.closest(
      "button, a, input, select, textarea, [role='button']",
    );

    if (interactiveElement) return;

    const container = dropOffTableScrollRef.current;

    if (!container || container.scrollWidth <= container.clientWidth) return;

    dropOffDragStateRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: container.scrollLeft,
    };

    container.setPointerCapture?.(event.pointerId);
    setIsDropOffTableDragging(true);
    event.preventDefault();
  }

  function handleDropOffTablePointerMove(event) {
    const container = dropOffTableScrollRef.current;
    const dragState = dropOffDragStateRef.current;

    if (
      !container ||
      !dragState.active ||
      dragState.pointerId !== event.pointerId
    ) {
      return;
    }

    const distance = event.clientX - dragState.startX;

    container.scrollLeft = dragState.scrollLeft - distance;
    event.preventDefault();
  }

  function stopDropOffTableDragging(event) {
    const container = dropOffTableScrollRef.current;
    const pointerId = dropOffDragStateRef.current.pointerId;

    if (
      container &&
      pointerId !== null &&
      container.hasPointerCapture?.(pointerId)
    ) {
      try {
        container.releasePointerCapture(pointerId);
      } catch {
        // Pointer capture may already be released by the browser.
      }
    }

    dropOffDragStateRef.current = {
      active: false,
      pointerId: null,
      startX: 0,
      scrollLeft: container?.scrollLeft || 0,
    };

    setIsDropOffTableDragging(false);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((previousValue) => !previousValue)}
        className="flex w-full items-center justify-between gap-4 border-b border-[#E6ECF2] bg-white px-5 py-4 text-left transition hover:bg-[#F8FAFC]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-700">
            <AlertTriangle size={20} />
          </div>

          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-[#101828]">
              Drop-off List
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-primary-1">
              Review candidates removed from the active pipeline.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-red-100 bg-red-50 px-3 text-xs font-extrabold text-red-700">
            {candidates.length}
          </span>

          <span className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-3 text-xs font-extrabold text-sibs-primary-1 shadow-sm">
            {expanded ? "Hide" : "Show"}
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="p-5">
          {loadError && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {loadError}
            </div>
          )}

          {isLoading && candidates.length === 0 ? (
            <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-[#D9E2EC] bg-[#F8FAFC] px-5 py-10">
              <div className="flex flex-col items-center text-center">
                <Loader2 size={22} className="animate-spin text-sibs-primary-1" />
                <p className="mt-3 text-sm font-extrabold text-[#101828]">
                  Loading drop-off candidates...
                </p>
              </div>
            </div>
          ) : candidates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D9E2EC] bg-[#F8FAFC] px-5 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#E6ECF2] bg-white text-sibs-tertiary-5">
                <AlertTriangle size={22} />
              </div>

              <p className="mt-3 text-sm font-extrabold text-[#101828]">
                No drop-off candidates
              </p>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Candidates moved to Drop-off will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block">
                <div
                  ref={dropOffTableScrollRef}
                  onPointerDown={handleDropOffTablePointerDown}
                  onPointerMove={handleDropOffTablePointerMove}
                  onPointerUp={stopDropOffTableDragging}
                  onPointerCancel={stopDropOffTableDragging}
                  onLostPointerCapture={stopDropOffTableDragging}
                  onDragStart={(event) => event.preventDefault()}
                  className={`overflow-x-auto overscroll-x-contain rounded-2xl border border-[#D9E2EC] bg-white sibs-scrollbar ${
                    isDropOffTableDragging
                      ? "cursor-grabbing select-none"
                      : "cursor-grab"
                  }`}
                  aria-label="Drop-off candidates table. Drag left or right to view all drop-off columns."
                >
                  <table className="w-full min-w-[1520px] table-fixed text-left">
                  <thead>
                    <tr className="bg-[#F5F7FA] text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                      <th className="w-[15%] px-6 py-4 text-left">
                        Candidate
                      </th>

                      <th className="w-[17%] px-6 py-4 text-left">
                        Applied Position
                      </th>

                      <th className="w-[18%] px-6 py-4 text-left">
                        Preferred Location / Final Account
                      </th>

                      <th className="w-[12%] px-6 py-4 text-center">
                        Status
                      </th>

                      <th className="w-[20%] px-6 py-4 text-left">
                        Drop-off Reason
                      </th>

                      <th className="w-[11%] px-6 py-4 text-left">
                        Date
                      </th>

                      <th className="w-[130px] whitespace-nowrap px-5 py-4 text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleCandidates.map((candidate) => (
                      <tr
                        key={`${getCandidateId(candidate)}-${
                          candidate.updatedAt ||
                          candidate.dateMoved ||
                          candidate.lastActivity ||
                          ""
                        }`}
                        className="border-t border-[#E6ECF2] text-sm"
                      >
                        <td className="px-6 py-5 align-middle">
                          <p className="truncate font-extrabold text-[#101828]">
                            {getCandidateName(candidate)}
                          </p>

                          <p className="mt-1 truncate text-sm font-semibold text-sibs-primary-1">
                            {getCandidateId(candidate)}
                          </p>
                        </td>

                        <td className="px-6 py-5 align-middle">
                          <p className="truncate font-extrabold text-[#101828]">
                            {candidate.openPosition ||
                              candidate.roleCapability ||
                              getCandidateRole(candidate)}
                          </p>

                          <p className="mt-1 truncate text-sm font-semibold text-sibs-primary-1">
                            Skills: {candidate.skillsLanguage || "—"}
                          </p>
                        </td>

                        <td className="px-6 py-5 align-middle">
                          <p className="truncate font-semibold text-[#101828]">
                            {candidate.applyingLocation || "—"}
                          </p>

                          <p className="mt-1 truncate text-sm font-semibold text-sibs-primary-1">
                            Final Account: {getCandidateAccount(candidate)}
                          </p>
                        </td>

                        <td className="px-6 py-5 text-center align-middle">
                          <span className="inline-flex max-w-full rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-extrabold text-red-700">
                            <span className="truncate">
                              {candidate.dropOffCategory || "Drop Off"}
                            </span>
                          </span>
                        </td>

                        <td className="px-6 py-5 align-middle">
                          <p className="line-clamp-2 font-semibold leading-5 text-[#344054]">
                            {getDropOffReason(candidate)}
                          </p>

                          {getDropOffBy(candidate) && (
                            <p className="mt-1 truncate text-xs font-bold text-sibs-primary-1">
                              By: {getDropOffBy(candidate)}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-5 align-middle">
                          <p className="font-bold text-[#344054]">
                            {formatDisplayDate(getDropOffDate(candidate))}
                          </p>
                        </td>

                        <td className="w-[130px] px-5 py-5 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => onViewCandidate(candidate)}
                            className="mx-auto inline-flex h-10 min-w-[96px] items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-extrabold text-sibs-primary-1 transition hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] hover:shadow-sm"
                          >
                            <Eye size={16} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3 lg:hidden">
                {visibleCandidates.map((candidate) => (
                  <div
                    key={`${getCandidateId(candidate)}-${
                      candidate.updatedAt ||
                      candidate.dateMoved ||
                      candidate.lastActivity ||
                      ""
                    }`}
                    className="rounded-2xl border border-[#D9E2EC] bg-[#F8FAFC] p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-extrabold text-[#101828]">
                          {getCandidateName(candidate)}
                        </h3>

                        <p className="mt-1 truncate text-xs font-bold text-sibs-primary-1">
                          {getCandidateId(candidate)}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-extrabold text-red-700">
                        {candidate.dropOffCategory || "Drop Off"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                          Applied Position
                        </p>

                        <p className="mt-1 text-sm font-bold text-sibs-primary-1">
                          {candidate.openPosition ||
                            candidate.roleCapability ||
                            getCandidateRole(candidate)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-3">
                        <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                          Preferred Location
                        </p>

                        <p className="mt-1 text-sm font-bold text-sibs-primary-1">
                          {candidate.applyingLocation || "—"}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 rounded-xl bg-white p-3 text-sm font-semibold leading-6 text-[#475467]">
                      {getDropOffReason(candidate)}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-xs font-bold text-sibs-tertiary-5">
                        {formatDisplayDate(getDropOffDate(candidate))}
                      </p>

                      <button
                        type="button"
                        onClick={() => onViewCandidate(candidate)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="mt-5 flex justify-center border-t border-[#E6ECF2] pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((previousValue) => !previousValue)
                    }
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC] hover:shadow-sm"
                  >
                    {expanded ? "Show Less" : "Show All"}
                    {expanded ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

export default function CandidatePipelinePage() {
  const {
    isLoading,
    loadError,
    refreshCandidatePipeline,

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

    roleOptions,
    accountOptions,

    selectedCandidate,
    setSelectedCandidate,

    moveCandidate,
    moveForm,
    setMoveForm,

    scheduleCandidate,
    scheduleForm,
    setScheduleForm,

    assessmentCandidate,
    assessmentForm,
    setAssessmentForm,

    dropOffCandidate,
    dropOffForm,
    setDropOffForm,

    offerCandidate,
    offerForm,
    setOfferForm,

    filteredCandidates,
    stageVisibleCandidates,
    stageCounts,
    metrics,

    handleUpdatePrfStatus,

    handleOpenMoveModal,
    handleCloseMoveModal,
    handleSubmitMove,

    handleOpenScheduleInterview,
    handleCloseScheduleInterview,
    handleSubmitScheduleInterview,
    handleCancelInterview,
    handleCompleteInterview,
    handleSaveInterviewNotes,

    handleOpenAssessmentModal,
    handleCloseAssessmentModal,
    handleSendAssessmentEmail,
    handleSubmitAssessment,

    handleOpenDropOffModal,
    handleCloseDropOffModal,
    handleSubmitDropOff,

    handleCloseOfferModal,
    handleSubmitOfferDetails,
    handleUpdateOfferApproval,
    handleSendOfferEmail,
    handleOfferDecision,
    handleScheduleNhoAuto,
  } = useCandidatePipeline();

  const [talentPoolDropOffCandidates, setTalentPoolDropOffCandidates] = useState(
    [],
  );
  const [dropOffListLoading, setDropOffListLoading] = useState(true);
  const [dropOffListError, setDropOffListError] = useState("");

  async function loadTalentPoolDropOffCandidates() {
    setDropOffListLoading(true);
    setDropOffListError("");

    try {
      const response = await getTalentPoolApplications({
        page: 1,
        limit: 500,
        status: "Drop Off",
      });

      if (!response?.success) {
        setTalentPoolDropOffCandidates([]);
        setDropOffListError(
          response?.message || "Failed to load Talent Pool drop-off records.",
        );
        return;
      }

      const records = Array.isArray(response?.data) ? response.data : [];

      setTalentPoolDropOffCandidates(
        records.filter((candidate) => isDropOffCandidate(candidate)),
      );
    } catch (error) {
      console.error("Load Talent Pool drop-off records error:", error);

      setTalentPoolDropOffCandidates([]);
      setDropOffListError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load Talent Pool drop-off records.",
      );
    } finally {
      setDropOffListLoading(false);
    }
  }

  useEffect(() => {
    loadTalentPoolDropOffCandidates();
  }, []);

  const safeFilteredCandidates = useMemo(() => {
    if (isLoading) return [];

    return filterRenderableCandidates(filteredCandidates);
  }, [filteredCandidates, isLoading]);

  const safeStageVisibleCandidates = useMemo(() => {
    if (isLoading) return [];

    return filterRenderableCandidates(stageVisibleCandidates);
  }, [stageVisibleCandidates, isLoading]);

  const safeStageCounts = useMemo(() => {
    if (isLoading) {
      return buildSafeStageCounts(stageCounts, []);
    }

    return buildSafeStageCounts(stageCounts, safeStageVisibleCandidates);
  }, [isLoading, safeStageVisibleCandidates, stageCounts]);

  const safeMetrics = useMemo(() => {
    if (!isLoading) return metrics;

    return {
      ...metrics,
      initialScreening: 0,
      onlineAssessment: 0,
      interviewScheduled: 0,
      interviewed: 0,
      offered: 0,
      accepted: 0,
    };
  }, [isLoading, metrics]);

  const dropOffCandidates = useMemo(() => {
    const pipelineDropOffCandidates = safeFilteredCandidates.filter(
      isDropOffCandidate,
    );

    return mergeUniqueCandidates(
      pipelineDropOffCandidates,
      talentPoolDropOffCandidates,
    )
      .filter((candidate) =>
        matchesDropOffFilters(candidate, search, roleFilter, accountFilter),
      )
      .sort((firstCandidate, secondCandidate) => {
        const firstDate = new Date(getDropOffDate(firstCandidate)).getTime();
        const secondDate = new Date(getDropOffDate(secondCandidate)).getTime();

        return (
          (Number.isFinite(secondDate) ? secondDate : 0) -
          (Number.isFinite(firstDate) ? firstDate : 0)
        );
      });
  }, [
    safeFilteredCandidates,
    talentPoolDropOffCandidates,
    search,
    roleFilter,
    accountFilter,
  ]);

  const selectedCandidateIsDropOff = useMemo(() => {
    return isDropOffCandidate(selectedCandidate || {});
  }, [selectedCandidate]);

  const hasActiveFilters =
    cleanText(search) ||
    roleFilter !== "All Roles" ||
    accountFilter !== "All Accounts";

  function clearFilters() {
    setSearch("");
    setRoleFilter("All Roles");
    setAccountFilter("All Accounts");
  }

  async function handleRefreshPage() {
    await Promise.all([
      Promise.resolve(refreshCandidatePipeline?.()),
      loadTalentPoolDropOffCandidates(),
    ]);
  }

  return (
    <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6">
        <div className="mx-auto max-w-[1600px] space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <ClipboardCheck size={14} />
                Recruitment
              </div>

              <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
                Candidate Pipeline
              </h1>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Track candidates from Initial Screening to Accepted. Final role,
                hiring requirement, and account are assigned during the offer
                stage.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleRefreshPage}
                disabled={isLoading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={18}
                  className={isLoading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={() => setPageView("pipeline")}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-90 ${
                  pageView === "pipeline"
                    ? "bg-[var(--sibs-primary-1)] text-white"
                    : "border border-[#D6DEE8] bg-white text-sibs-primary-1 hover:bg-[#F8FAFC]"
                }`}
              >
                <SlidersHorizontal size={18} />
                Pipeline View
              </button>

              <button
                type="button"
                onClick={() => setPageView("calendar")}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-90 ${
                  pageView === "calendar"
                    ? "bg-[var(--sibs-primary-1)] text-white"
                    : "border border-[#D6DEE8] bg-white text-sibs-primary-1 hover:bg-[#F8FAFC]"
                }`}
              >
                <CalendarDays size={18} />
                Calendar View
              </button>
            </div>
          </div>

          {loadError && (
            <section className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
              {loadError}
            </section>
          )}

          <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-bold text-[#101828]">
              Pipeline Summary
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <DashboardMetric
                label="Initial Screening"
                value={safeMetrics.initialScreening}
                icon={UserCheck}
                description="PRF reviewed"
              />

              <DashboardMetric
                label="Online Assessment"
                value={safeMetrics.onlineAssessment}
                icon={ClipboardCheck}
                description="Assessment stage"
              />

              <DashboardMetric
                label="Interview Scheduled"
                value={safeMetrics.interviewScheduled}
                icon={CalendarDays}
                description="Calendar booked"
              />

              <DashboardMetric
                label="Interviewed"
                value={safeMetrics.interviewed}
                icon={ShieldCheck}
                description="Interview done"
              />

              <DashboardMetric
                label="Offered"
                value={safeMetrics.offered}
                icon={BriefcaseBusiness}
                description="Offer processing"
              />

              <DashboardMetric
                label="Accepted"
                value={safeMetrics.accepted}
                icon={UserCheck}
                description="Converted"
                valueClassName="text-emerald-600"
              />
            </div>
          </section>

          {pageView === "pipeline" && (
            <div className="space-y-5">
              <section className="relative z-[90] overflow-visible rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
                <div className="relative z-[90] overflow-visible border-b border-[#E6ECF2] p-4 sm:p-5">
                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_220px_220px_auto] xl:items-end">
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
                          placeholder="Search candidate, PRF, assessment, role, account..."
                          className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 shadow-sm outline-none transition placeholder:text-sibs-tertiary-5 hover:border-sibs-primary-1 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                        />
                      </div>
                    </div>

                    <FilterDropdown
                      label="Role"
                      value={roleFilter}
                      onChange={setRoleFilter}
                      options={roleOptions}
                      placeholder="All Roles"
                      zIndex="z-[120]"
                    />

                    <FilterDropdown
                      label="Account"
                      value={accountFilter}
                      onChange={setAccountFilter}
                      options={accountOptions}
                      placeholder="All Accounts"
                      zIndex="z-[110]"
                    />

                    <button
                      type="button"
                      onClick={clearFilters}
                      disabled={!hasActiveFilters}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition hover:border-sibs-primary-1 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Filter size={17} />
                      Clear
                    </button>
                  </div>
                </div>
              </section>

              {isLoading ? (
                <LoadingPipelineBoard />
              ) : (
                <PipelineCardsBoard
                  candidates={safeStageVisibleCandidates}
                  stageCounts={safeStageCounts}
                  activeStage={activeStage}
                  setActiveStage={setActiveStage}
                  onViewCandidate={(candidate) => setSelectedCandidate(candidate)}
                  onOpenMoveModal={handleOpenMoveModal}
                  onOpenAssessmentModal={handleOpenAssessmentModal}
                  onOpenScheduleModal={handleOpenScheduleInterview}
                  onCancelInterview={handleCancelInterview}
                  onCompleteInterview={handleCompleteInterview}
                />
              )}

              <DropOffListSection
                candidates={dropOffCandidates}
                isLoading={dropOffListLoading}
                loadError={dropOffListError}
                onViewCandidate={(candidate) => setSelectedCandidate(candidate)}
              />
            </div>
          )}

          {pageView === "calendar" && (
            <InterviewCalendar
              candidates={safeFilteredCandidates}
              onViewCandidate={(candidate) => setSelectedCandidate(candidate)}
            />
          )}
        </div>
      </main>

      <CandidatePipelineModal
        open={!!selectedCandidate}
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onUpdatePrfStatus={handleUpdatePrfStatus}
        onOpenScheduleModal={handleOpenScheduleInterview}
        onOpenMoveModal={handleOpenMoveModal}
        onOpenAssessmentModal={handleOpenAssessmentModal}
        onOpenDropOffModal={
          selectedCandidateIsDropOff ? undefined : handleOpenDropOffModal
        }
        onCompleteInterview={handleCompleteInterview}
        onSendAssessmentEmail={handleSendAssessmentEmail}
        onCancelInterview={handleCancelInterview}
        onUpdateOfferApproval={handleUpdateOfferApproval}
        onSendOfferEmail={handleSendOfferEmail}
        onOfferDecision={handleOfferDecision}
        onSaveInterviewNotes={handleSaveInterviewNotes}
        onScheduleNhoAuto={handleScheduleNhoAuto}
      />

      <MoveStageModal
        open={!!moveCandidate}
        candidate={moveCandidate}
        form={moveForm}
        setForm={setMoveForm}
        onClose={handleCloseMoveModal}
        onSubmit={handleSubmitMove}
      />

      <ScheduleInterviewModal
        open={!!scheduleCandidate}
        candidate={scheduleCandidate}
        form={scheduleForm}
        setForm={setScheduleForm}
        onClose={handleCloseScheduleInterview}
        onSubmit={handleSubmitScheduleInterview}
      />

      <AssessmentModal
        open={!!assessmentCandidate}
        candidate={assessmentCandidate}
        form={assessmentForm}
        setForm={setAssessmentForm}
        onClose={handleCloseAssessmentModal}
        onSubmit={handleSubmitAssessment}
        onSendEmail={handleSendAssessmentEmail}
      />

      <OfferDetailsModal
        open={!!offerCandidate}
        candidate={offerCandidate}
        form={offerForm}
        setForm={setOfferForm}
        onClose={handleCloseOfferModal}
        onSubmit={handleSubmitOfferDetails}
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