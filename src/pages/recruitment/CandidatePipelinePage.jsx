import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import api from "../../lib/axios/api-template";
import { useCandidatePipeline } from "../../services/context/CandidatePipelineContext";

import {
  Search,
  UserCheck,
  BriefcaseBusiness,
  ShieldCheck,
  CalendarDays,
  ClipboardCheck,
  ChevronDown,
  RefreshCw,
  Users,
  LayoutGrid,
  List,
  X,
  Check,
  RotateCcw,
} from "lucide-react";

import MoveStageModal from "../../components/modals/candidatePipeline/MoveStageModal";
import ScheduleInterviewModal from "../../components/modals/candidatePipeline/ScheduleInterviewModal";
import AssessmentModal from "../../components/modals/candidatePipeline/AssessmentModal";
import DropOffModal from "../../components/modals/candidatePipeline/DropOffModal";
import CandidateOfferDetailsModal from "../../components/modals/candidatePipeline/CandidateOfferDetailsModal";
import CandidatePipelineModal from "../../components/modals/candidatePipeline/CandidatePipelineModal";
import PipelineCardsBoard from "../../components/recruitment/candidatePipeline/PipelineCardBoard";
import InterviewCalendar from "../../components/recruitment/candidatePipeline/InterviewCalendar";
import useCombinedDropOffCandidates from "../../hooks/useCombinedDropOffCandidates";
import {
  filterDropOffCandidates,
  isDropOffCandidate,
} from "../../lib/utils/recruitment/dropOffCandidates";
import {
  PageHeaderHero,
  MetricGrid,
  MetricCard,
  MetricGridSkeleton,
  SearchInput,
  SelectDropdown,
} from "@/components/ui";

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



function getCandidateDepartment(candidate = {}) {
  return cleanText(
    candidate.department ||
      candidate.departmentName ||
      candidate.department_name ||
      candidate.cluster ||
      candidate.clusterName ||
      candidate.cluster_name ||
      "",
  );
}

function getCandidatePrfStatus(candidate = {}) {
  return cleanText(candidate.prfStatus || candidate.prf_status || "");
}

function getCandidateSource(candidate = {}) {
  return cleanText(
    candidate.source ||
      candidate.sourceName ||
      candidate.source_name ||
      candidate.applicationSource ||
      candidate.application_source ||
      candidate.hearAboutUs ||
      candidate.hear_about_us ||
      "",
  );
}

function buildDynamicFilterOptions(candidates = [], getter, allLabel) {
  const values = Array.from(
    new Set(
      candidates
        .map((candidate) => cleanText(getter(candidate)))
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));

  return [allLabel, ...values];
}

function matchesReferenceFilters(
  candidate,
  { departmentFilter, prfStatusFilter, sourceFilter },
) {
  if (
    departmentFilter !== "All Departments" &&
    getCandidateDepartment(candidate) !== departmentFilter
  ) {
    return false;
  }

  if (
    prfStatusFilter !== "All PRF Status" &&
    getCandidatePrfStatus(candidate) !== prfStatusFilter
  ) {
    return false;
  }

  if (
    sourceFilter !== "All Sources" &&
    getCandidateSource(candidate) !== sourceFilter
  ) {
    return false;
  }

  return true;
}




export default function CandidatePipelinePage() {
  const {
    isLoading,
    loadError,
    refreshCandidatePipeline,
    candidates: candidateList = [],

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

  const navigate = useNavigate();
  const location = useLocation();

  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [prfStatusFilter, setPrfStatusFilter] = useState("All PRF Status");
  const [sourceFilter, setSourceFilter] = useState("All Sources");
  const [boardSubView, setBoardSubView] = useState("board");
  const [interviewCalendarHandoff, setInterviewCalendarHandoff] = useState(false);
  const [linkedInterviewError, setLinkedInterviewError] = useState("");

  // Keep the selected candidate and form in context while the Google account
  // is connected/synced in SiBS Calendar. No route change or form reset.
  useEffect(() => {
    const resumeInterview = () => setInterviewCalendarHandoff(false);
    window.addEventListener("sibs:return-to-interview", resumeInterview);
    return () => window.removeEventListener("sibs:return-to-interview", resumeInterview);
  }, []);

  function openCalendarForInterview() {
    if (!scheduleCandidate) return;
    setInterviewCalendarHandoff(true);
    window.dispatchEvent(new CustomEvent("sibs:open-calendar", {
      detail: { source: "schedule-interview" },
    }));
  }

  useEffect(() => {
    if (roleFilter !== "All Roles") {
      setRoleFilter("All Roles");
    }
  }, [roleFilter, setRoleFilter]);

  const renderableCandidateList = useMemo(
    () => filterRenderableCandidates(candidateList),
    [candidateList],
  );

  const departmentOptions = useMemo(
    () =>
      buildDynamicFilterOptions(
        renderableCandidateList,
        getCandidateDepartment,
        "All Departments",
      ),
    [renderableCandidateList],
  );

  const prfStatusOptions = useMemo(
    () =>
      buildDynamicFilterOptions(
        renderableCandidateList,
        getCandidatePrfStatus,
        "All PRF Status",
      ),
    [renderableCandidateList],
  );

  const sourceOptions = useMemo(
    () =>
      buildDynamicFilterOptions(
        renderableCandidateList,
        getCandidateSource,
        "All Sources",
      ),
    [renderableCandidateList],
  );

  const {
    candidates: combinedDropOffCandidates,
    isLoading: dropOffListLoading,
    loadError: dropOffListError,
    refresh: refreshDropOffCandidates,
  } = useCombinedDropOffCandidates();

  const activeReferenceFilters = useMemo(
    () => ({ departmentFilter, prfStatusFilter, sourceFilter }),
    [departmentFilter, prfStatusFilter, sourceFilter],
  );

  const safeFilteredCandidates = useMemo(() => {
    if (isLoading) return [];

    return filterRenderableCandidates(filteredCandidates).filter((candidate) =>
      matchesReferenceFilters(candidate, activeReferenceFilters),
    );
  }, [activeReferenceFilters, filteredCandidates, isLoading]);

  useEffect(() => {
    if (!location) return undefined;

    const queryParams = new URLSearchParams(location.search || "");
    const targetStage = queryParams.get("stage");
    const targetPipelineId = cleanText(queryParams.get("pipelineId"));
    const targetCandidateId = cleanText(queryParams.get("candidateId"));
    const updateLinkedInterview = queryParams.get("updateInterview") === "1";
    const stateCandidate = location.state?.candidate;

    if (targetStage && typeof setActiveStage === "function") {
      setActiveStage(targetStage);
    }

    // "Already Linked" passes a Talent Pool profile in router state. That
    // object has Talent Pool identifiers, not necessarily candidate_pipeline.id.
    // Fetch the actual Pipeline record before opening the detail/NHO modals;
    // otherwise Manage Requirements cannot retrieve the candidate's files.
    if (targetPipelineId || targetCandidateId) {
      let cancelled = false;
      const lookupId = targetPipelineId || targetCandidateId;

      // Do not render a stale Talent Pool profile as a Pipeline record while
      // the authoritative record is being retrieved.
      setSelectedCandidate(null);

      async function openVerifiedPipelineRecord() {
        try {
          const response = await api.get(
            `/api/candidate-pipeline/${encodeURIComponent(lookupId)}`,
            { withCredentials: true, params: { _t: Date.now() } },
          );
          if (cancelled) return;

          const record =
            response?.data?.candidate ||
            response?.data?.data?.candidate ||
            response?.data?.data ||
            null;
          const numericId = cleanText(record?.dbId || record?.id);
          const publicId = cleanText(record?.candidateId || record?.candidate_id);

          // Refuse a different record if identifiers in the navigation state
          // are stale or collide with an unrelated candidate.
          if (
            !record ||
            !/^\d+$/.test(numericId) ||
            (targetPipelineId && numericId !== targetPipelineId) ||
            (targetCandidateId && publicId !== targetCandidateId)
          ) {
            throw new Error("The linked Candidate Pipeline record does not match the selected candidate.");
          }

          const verifiedId = Number(numericId);
          const verifiedCandidate = {
            ...record,
            id: verifiedId,
            dbId: verifiedId,
            candidatePipelineRowId: verifiedId,
            candidate_pipeline_row_id: verifiedId,
            candidatePipelineId: verifiedId,
            candidate_pipeline_id: verifiedId,
          };
          if (updateLinkedInterview) {
            // Never open an editor for a different stage or a stale/cancelled
            // interview. CandidatePipelineContext checks permissions again.
            if (normalizeText(getCandidateStage(verifiedCandidate)) === "interview scheduled") {
              await handleOpenScheduleInterview(verifiedCandidate);
            } else {
              setLinkedInterviewError("This candidate no longer has an active scheduled interview. Open the candidate record to review the latest stage.");
              setSelectedCandidate(verifiedCandidate);
            }
            const cleanParams = new URLSearchParams(location.search || "");
            cleanParams.delete("updateInterview");
            cleanParams.delete("candidateId");
            cleanParams.delete("pipelineId");
            navigate({ pathname: location.pathname, search: cleanParams.toString() ? `?${cleanParams}` : "" }, { replace: true, state: null });
          } else {
            setSelectedCandidate(verifiedCandidate);
          }
        } catch (error) {
          if (!cancelled) {
            console.error("Unable to open linked Candidate Pipeline record:", error);
            if (updateLinkedInterview) {
              setLinkedInterviewError(error?.response?.data?.message || error?.message || "Unable to locate this candidate's scheduled interview.");
              // Consume the action to avoid a retry loop if the user refreshes.
              const cleanParams = new URLSearchParams(location.search || "");
              cleanParams.delete("updateInterview");
              cleanParams.delete("candidateId");
              cleanParams.delete("pipelineId");
              navigate({ pathname: location.pathname, search: cleanParams.toString() ? `?${cleanParams}` : "" }, { replace: true, state: null });
            }
          }
        }
      }

      void openVerifiedPipelineRecord();
      return () => { cancelled = true; };
    }

    if (stateCandidate && typeof setSelectedCandidate === "function") {
      setSelectedCandidate(stateCandidate);
    }
    return undefined;
  }, [location.search, location.state, setActiveStage, setSelectedCandidate]);

  const safeStageVisibleCandidates = useMemo(() => {
    if (isLoading) return [];

    return filterRenderableCandidates(stageVisibleCandidates).filter((candidate) =>
      matchesReferenceFilters(candidate, activeReferenceFilters),
    );
  }, [activeReferenceFilters, stageVisibleCandidates, isLoading]);

  const safeStageCounts = useMemo(() => {
    if (isLoading) return buildSafeStageCounts(stageCounts, []);
    return buildSafeStageCounts(stageCounts, safeStageVisibleCandidates);
  }, [isLoading, safeStageVisibleCandidates, stageCounts]);

  const safeMetrics = useMemo(
    () => ({
      initialScreening: Number(safeStageCounts["Initial Screening"] || 0),
      onlineAssessment: Number(safeStageCounts["Online Assessment"] || 0),
      interviewScheduled: Number(safeStageCounts["Interview Scheduled"] || 0),
      interviewed: Number(safeStageCounts.Interviewed || 0),
      offered: Number(safeStageCounts.Offered || 0),
      accepted: Number(safeStageCounts.Accepted || 0),
    }),
    [safeStageCounts],
  );

  const dropOffCandidates = useMemo(() => {
    const baseRows = filterDropOffCandidates(combinedDropOffCandidates, {
      search,
      roleFilter: "All Roles",
      accountFilter,
    });

    return baseRows.filter((candidate) =>
      matchesReferenceFilters(candidate, activeReferenceFilters),
    );
  }, [
    accountFilter,
    activeReferenceFilters,
    combinedDropOffCandidates,
    search,
  ]);

  const hasActiveFilters = Boolean(
    cleanText(search) ||
      departmentFilter !== "All Departments" ||
      accountFilter !== "All Accounts" ||
      prfStatusFilter !== "All PRF Status" ||
      sourceFilter !== "All Sources",
  );

  function handleClearAllFilters() {
    setSearch("");
    setDepartmentFilter("All Departments");
    setAccountFilter("All Accounts");
    setPrfStatusFilter("All PRF Status");
    setSourceFilter("All Sources");
  }

  const selectedCandidateIsDropOff = useMemo(() => {
    return isDropOffCandidate(selectedCandidate || {});
  }, [selectedCandidate]);

  function handleCloseCandidateModal() {
    setSelectedCandidate(null);

    // Clear deep-link state so the URL effect cannot reopen the same record.
    const queryParams = new URLSearchParams(location.search || "");
    queryParams.delete("candidateId");
    queryParams.delete("pipelineId");

    navigate(
      {
        pathname: location.pathname,
        search: queryParams.toString() ? `?${queryParams.toString()}` : "",
      },
      { replace: true, state: null },
    );
  }

  function handleUpdateFromCalendarEvent(linkedCandidate) {
    const pipelineId = cleanText(linkedCandidate?.pipelineId);
    const candidateId = cleanText(linkedCandidate?.candidateId);
    if (!/^\d+$/.test(pipelineId) && !/^PUB-[A-Za-z0-9_-]+$/i.test(candidateId)) return;
    // Leave the current candidate's proposal untouched; select the verified
    // linked record on the Pipeline page instead of editing a Google event.
    setLinkedInterviewError("");
    void handleCloseScheduleInterview();
    setInterviewCalendarHandoff(false);
    const params = new URLSearchParams();
    if (/^\d+$/.test(pipelineId)) params.set("pipelineId", pipelineId);
    else params.set("candidateId", candidateId);
    params.set("updateInterview", "1");
    navigate(`/recruitment/candidate-pipeline?${params.toString()}`, { state: null });
  }

  async function handleRefreshPage() {
    await Promise.all([
      Promise.resolve(refreshCandidatePipeline?.()),
      refreshDropOffCandidates(),
    ]);
  }

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-4 sm:space-y-5">
          {linkedInterviewError && (
            <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
              <span>{linkedInterviewError}</span>
              <button type="button" aria-label="Dismiss linked interview error" onClick={() => setLinkedInterviewError("")} className="shrink-0 rounded-md p-1 hover:bg-amber-100"><X size={16} /></button>
            </div>
          )}
          <PageHeaderHero
            kicker="Recruitment Lifecycle"
            title="Candidate Pipeline"
            description="Stage-by-stage applicant progress engine. Review PRFs, issue online assessments, schedule interviews, process offers, and track onboarding conversions."
            actions={
              <>
                <button
                  type="button"
                  onClick={handleRefreshPage}
                  disabled={isLoading}
                  title="Refresh pipeline data"
                  aria-label="Refresh pipeline data"
                  className="sibs-btn-icon"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                      isLoading ? "animate-spin text-sibs-orange" : ""
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/recruitment/talent-pool")}
                  className="sibs-btn-primary max-sm:flex-1"
                >
                  <Users size={15} />
                  Sourced Talent Pool
                </button>
              </>
            }
          />

          {loadError ? (
            <section
              role="alert"
              className="sibs-page-card-in rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 sibs-text-xs font-bold leading-5 text-red-700"
              style={{ animationDelay: "45ms", animationFillMode: "both" }}
            >
              {loadError}
            </section>
          ) : null}

          {isLoading ? (
            <MetricGridSkeleton
              count={6}
              labels={[
                "Initial Screening",
                "Online Assessment",
                "Interview Scheduled",
                "Interviewed",
                "Offered",
                "Accepted",
              ]}
              ariaLabel="Loading pipeline metrics"
            />
          ) : (
            <MetricGrid columns={6} ariaLabel="Pipeline Summary">
              <MetricCard
                label="Initial Screening"
                value={safeMetrics.initialScreening}
                icon={UserCheck}
                description="PRF match review"
                tone="navy"
                delay={0}
              />
              <MetricCard
                label="Online Assessment"
                value={safeMetrics.onlineAssessment}
                icon={ClipboardCheck}
                description="Matched candidates"
                tone="indigo"
                delay={60}
              />
              <MetricCard
                label="Interview Scheduled"
                value={safeMetrics.interviewScheduled}
                icon={CalendarDays}
                description="Booked sessions"
                tone="blue"
                delay={120}
              />
              <MetricCard
                label="Interviewed"
                value={safeMetrics.interviewed}
                icon={ShieldCheck}
                description="Evaluations complete"
                tone="green"
                delay={180}
              />
              <MetricCard
                label="Offered"
                value={safeMetrics.offered}
                icon={BriefcaseBusiness}
                description="Offers processing"
                tone="amber"
                delay={240}
              />
              <MetricCard
                label="Accepted"
                value={safeMetrics.accepted}
                icon={UserCheck}
                description="Ready for NHO"
                tone="orange"
                delay={300}
              />
            </MetricGrid>
          )}

          <section
            className="sibs-page-card-in sibs-card relative z-[40] overflow-visible p-3 sm:p-4 2xl:p-5"
            style={{ animationDelay: "120ms", animationFillMode: "both" }}
          >
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-[10px] border border-sibs-border bg-sibs-surface p-1">
                  <button
                    type="button"
                    onClick={() => setPageView("pipeline")}
                    className={`inline-flex h-7.5 2xl:h-8 items-center justify-center gap-1.5 rounded-[10px] px-3 text-[11px] 2xl:text-xs font-extrabold transition ${
                      pageView === "pipeline"
                        ? "bg-sibs-orange text-white shadow-sm"
                        : "text-sibs-muted hover:text-sibs-navy"
                    }`}
                  >
                    <LayoutGrid size={13} />
                    Pipeline View
                  </button>

                  <button
                    type="button"
                    onClick={() => setPageView("calendar")}
                    className={`inline-flex h-7.5 2xl:h-8 items-center justify-center gap-1.5 rounded-[10px] px-3 text-[11px] 2xl:text-xs font-extrabold transition ${
                      pageView === "calendar"
                        ? "bg-sibs-orange text-white shadow-sm"
                        : "text-sibs-muted hover:text-sibs-navy"
                    }`}
                  >
                    <CalendarDays size={13} />
                    Calendar View
                  </button>
                </div>

                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="inline-flex h-7.5 2xl:h-8 items-center justify-center gap-1.5 rounded-[10px] border border-sibs-orange/30 bg-sibs-cream-light px-2.5 text-[11px] 2xl:text-xs font-extrabold text-sibs-orange transition hover:bg-sibs-orange hover:text-white active:scale-[0.98]"
                  >
                    <RotateCcw size={12} />
                    Reset Filters
                  </button>
                ) : null}
              </div>

              {pageView === "pipeline" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9.5px] 2xl:text-[10px] font-extrabold uppercase tracking-wide text-sibs-navy">
                    Sub-View:
                  </span>

                  <div className="flex items-center gap-1 rounded-[10px] border border-sibs-border bg-sibs-surface p-1">
                    <button
                      type="button"
                      onClick={() => setBoardSubView("board")}
                      className={`inline-flex h-7.5 2xl:h-8 items-center justify-center gap-1.5 rounded-[10px] px-3 text-[11px] 2xl:text-xs font-extrabold transition ${
                        boardSubView === "board"
                          ? "bg-sibs-orange text-white shadow-sm"
                          : "text-sibs-muted hover:text-sibs-navy"
                      }`}
                    >
                      <LayoutGrid size={13} />
                      Kanban Board
                    </button>

                    <button
                      type="button"
                      onClick={() => setBoardSubView("list")}
                      className={`inline-flex h-7.5 2xl:h-8 items-center justify-center gap-1.5 rounded-[10px] px-3 text-[11px] 2xl:text-xs font-extrabold transition ${
                        boardSubView === "list"
                          ? "bg-sibs-orange text-white shadow-sm"
                          : "text-sibs-muted hover:text-sibs-navy"
                      }`}
                    >
                      <List size={13} />
                      List View
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2.5 border-t border-sibs-border pt-3 sm:grid-cols-2 lg:grid-cols-5">
              <SearchInput
                value={search}
                onChange={setSearch}
                onClear={() => setSearch("")}
                placeholder="Search candidate name, ID, or email..."
                ariaLabel="Search candidate name, ID, or email"
                className="min-w-0"
              />

              <SelectDropdown
                value={departmentFilter}
                onChange={(val) => setDepartmentFilter(val || "All Departments")}
                options={departmentOptions}
                placeholder="All Departments"
                searchable
                clearable={false}
                className="min-w-0"
              />

              <SelectDropdown
                value={accountFilter}
                onChange={(val) => setAccountFilter(val || "All Accounts")}
                options={accountOptions}
                placeholder="All Accounts"
                searchable
                clearable={false}
                className="min-w-0"
              />

              <SelectDropdown
                value={prfStatusFilter}
                onChange={(val) => setPrfStatusFilter(val || "All PRF Status")}
                options={prfStatusOptions}
                placeholder="All PRF Status"
                searchable
                clearable={false}
                className="min-w-0"
              />

              <SelectDropdown
                value={sourceFilter}
                onChange={(val) => setSourceFilter(val || "All Sources")}
                options={sourceOptions}
                placeholder="All Sources"
                searchable
                clearable={false}
                className="min-w-0"
              />
            </div>
          </section>

          {pageView === "pipeline" && (
            <div className="space-y-5">
              <PipelineCardsBoard
                candidates={
                  boardSubView === "list"
                    ? safeFilteredCandidates
                    : safeStageVisibleCandidates
                }
                dropOffCandidates={dropOffCandidates}
                stageCounts={safeStageCounts}
                activeStage={activeStage}
                setActiveStage={setActiveStage}
                onViewCandidate={(candidate) => setSelectedCandidate(candidate)}
                onOpenMoveModal={handleOpenMoveModal}
                onOpenAssessmentModal={handleOpenAssessmentModal}
                onOpenScheduleModal={handleOpenScheduleInterview}
                onCancelInterview={handleCancelInterview}
                onCompleteInterview={handleCompleteInterview}
                viewMode={boardSubView}
                isLoading={isLoading}
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
        onClose={handleCloseCandidateModal}
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
        open={!!scheduleCandidate && !interviewCalendarHandoff}
        candidate={scheduleCandidate}
        form={scheduleForm}
        setForm={setScheduleForm}
        onClose={handleCloseScheduleInterview}
        onSubmit={handleSubmitScheduleInterview}
        onOpenSibsCalendar={openCalendarForInterview}
        onUpdateCandidateSchedule={handleUpdateFromCalendarEvent}
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

      <CandidateOfferDetailsModal
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
