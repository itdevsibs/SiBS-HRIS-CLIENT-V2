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
import DropOffListSection from "../../components/recruitment/shared/DropOffListSection";
import useCombinedDropOffCandidates from "../../hooks/useCombinedDropOffCandidates";
import {
  filterDropOffCandidates,
  isDropOffCandidate,
} from "../../lib/utils/recruitment/dropOffCandidates";

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
    offerSubmitting,

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
    handleReprofileOfferAccount,
    handleSubmitOfferDetails,
    handleUpdateOfferApproval,
    handleSendOfferEmail,
    handleOfferDecision,
    handleScheduleNhoAuto,
  } = useCandidatePipeline();

  const {
    candidates: combinedDropOffCandidates,
    isLoading: dropOffListLoading,
    loadError: dropOffListError,
    refresh: refreshDropOffCandidates,
  } = useCombinedDropOffCandidates();

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

  const dropOffCandidates = useMemo(
    () =>
      filterDropOffCandidates(combinedDropOffCandidates, {
        search,
        roleFilter,
        accountFilter,
      }),
    [combinedDropOffCandidates, search, roleFilter, accountFilter],
  );

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
      refreshDropOffCandidates(),
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
        onReprofile={handleReprofileOfferAccount}
        onSubmit={handleSubmitOfferDetails}
        submitting={offerSubmitting}
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