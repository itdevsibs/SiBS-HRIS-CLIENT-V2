import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "../../components/layout/Header";
import { useCandidatePipeline } from "../../services/context/CandidatePipelineContext";

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
  return candidate.name || candidate.candidateName || "Unnamed Candidate";
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
      <label className="mb-1 block text-sm font-bold text-[#101828]">
        {label}
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-12 w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-bold shadow-sm outline-none transition ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : "border-[#D0D5DD] hover:border-sibs-primary-1"
        } ${
          disabled
            ? "cursor-not-allowed bg-gray-50 text-gray-400 opacity-70"
            : "text-[#344054]"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selectedOption ? "text-[#344054]" : "text-sibs-tertiary-5"
          }`}
        >
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
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[99999] overflow-hidden rounded-xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="max-h-72 overflow-y-auto">
            {normalizedOptions.length > 0 ? (
              normalizedOptions.map((option) => {
                const active = String(option.value) === String(value ?? "");

                return (
                  <button
                    key={option.id || option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`block w-full px-4 py-3.5 text-left text-sm font-semibold transition ${
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
              <div className="px-4 py-3.5 text-sm font-semibold text-sibs-tertiary-5">
                No options found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DropOffListSection({ candidates = [], onViewCandidate }) {
  const [expanded, setExpanded] = useState(false);

  const visibleCandidates = expanded ? candidates : candidates.slice(0, 3);
  const hasMore = candidates.length > 3;

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
          {candidates.length === 0 ? (
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
              <div className="hidden overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white lg:block">
                <table className="w-full table-fixed text-left">
                  <thead>
                    <tr className="bg-[#F5F7FA] text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                      <th className="w-[18%] px-6 py-4 text-left">
                        Candidate
                      </th>

                      <th className="w-[22%] px-6 py-4 text-left">
                        Applied Position
                      </th>

                      <th className="w-[24%] px-6 py-4 text-left">
                        Preferred Location / Final Account
                      </th>

                      <th className="w-[14%] px-6 py-4 text-center">
                        Drop-off Category
                      </th>

                      <th className="w-[14%] px-6 py-4 text-left">
                        Last Activity
                      </th>

                      <th className="w-[8%] px-6 py-4 text-center">
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
                              {candidate.dropOffCategory || "Drop-off"}
                            </span>
                          </span>
                        </td>

                        <td className="px-6 py-5 align-middle">
                          <p className="font-bold text-[#344054]">
                            {formatDisplayDate(
                              candidate.dateMoved ||
                                candidate.updatedAt ||
                                candidate.lastActivity,
                            )}
                          </p>
                        </td>

                        <td className="px-6 py-5 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => onViewCandidate(candidate)}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-extrabold text-sibs-primary-1 transition hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] hover:shadow-sm"
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
                        {candidate.dropOffCategory || "Drop-off"}
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
                      {candidate.dropOffReason ||
                        candidate.reasonForMovement ||
                        "No reason provided."}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-xs font-bold text-sibs-tertiary-5">
                        {formatDisplayDate(
                          candidate.dateMoved ||
                            candidate.updatedAt ||
                            candidate.lastActivity,
                        )}
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

  const dropOffCandidates = useMemo(() => {
    return filteredCandidates.filter((candidate) => {
      const stage = getCandidateStage(candidate);

      return stage === "Drop-off" || stage === "Drop-offs";
    });
  }, [filteredCandidates]);

  const hasActiveFilters =
    cleanText(search) ||
    roleFilter !== "All Roles" ||
    accountFilter !== "All Accounts";

  function clearFilters() {
    setSearch("");
    setRoleFilter("All Roles");
    setAccountFilter("All Accounts");
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
                onClick={refreshCandidatePipeline}
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
                value={metrics.initialScreening}
                icon={UserCheck}
                description="PRF reviewed"
              />
              <DashboardMetric
                label="Online Assessment"
                value={metrics.onlineAssessment}
                icon={ClipboardCheck}
                description="Assessment stage"
              />
              <DashboardMetric
                label="Interview Scheduled"
                value={metrics.interviewScheduled}
                icon={CalendarDays}
                description="Calendar booked"
              />
              <DashboardMetric
                label="Interviewed"
                value={metrics.interviewed}
                icon={ShieldCheck}
                description="Interview done"
              />
              <DashboardMetric
                label="Offered"
                value={metrics.offered}
                icon={BriefcaseBusiness}
                description="Offer processing"
              />
              <DashboardMetric
                label="Accepted"
                value={metrics.accepted}
                icon={UserCheck}
                description="Converted"
                valueClassName="text-emerald-600"
              />
            </div>
          </section>

          {pageView === "pipeline" && (
            <div className="space-y-5">
              <section className="relative z-[90] overflow-visible rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
                <div className="relative z-[90] border-b border-[#E6ECF2] p-4 sm:p-5">
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

              <PipelineCardsBoard
                candidates={stageVisibleCandidates}
                stageCounts={stageCounts}
                activeStage={activeStage}
                setActiveStage={setActiveStage}
                onViewCandidate={(candidate) => setSelectedCandidate(candidate)}
                onOpenMoveModal={handleOpenMoveModal}
                onOpenAssessmentModal={handleOpenAssessmentModal}
                onOpenScheduleModal={handleOpenScheduleInterview}
                onCancelInterview={handleCancelInterview}
                onCompleteInterview={handleCompleteInterview}
              />

              <DropOffListSection
                candidates={dropOffCandidates}
                onViewCandidate={(candidate) => setSelectedCandidate(candidate)}
              />
            </div>
          )}

          {pageView === "calendar" && (
            <InterviewCalendar
              candidates={filteredCandidates}
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
        onOpenDropOffModal={handleOpenDropOffModal}
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