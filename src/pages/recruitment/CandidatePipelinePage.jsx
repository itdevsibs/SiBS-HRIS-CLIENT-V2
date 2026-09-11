import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
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
  Loader2,
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
import { PageHeaderHero } from "@/components/ui";

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
  const [filterSearch, setFilterSearch] = useState("");

  const normalizedOptions = normalizeDropdownOptions(options);

  const selectedOption = normalizedOptions.find(
    (option) => String(option.value) === String(value ?? ""),
  );

  const displayLabel = selectedOption?.label || placeholder;

  const filteredOptions = useMemo(() => {
    if (!cleanText(filterSearch)) return normalizedOptions;
    const query = filterSearch.toLowerCase().trim();
    return normalizedOptions.filter((option) =>
      String(option.label || "").toLowerCase().includes(query)
    );
  }, [normalizedOptions, filterSearch]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target)) {
        setOpen(false);
        setFilterSearch("");
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
        setFilterSearch("");
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
    setFilterSearch("");
  }

  return (
    <div
      ref={dropdownRef}
      className={`relative min-w-0 ${open ? zIndex : "z-[1]"}`}
    >
      {label ? (
        <label className="mb-1 block text-xs font-bold text-[#042C51]">
          {label}
        </label>
      ) : null}

      <div className="group relative">
        <input
          type="text"
          value={open ? filterSearch : displayLabel}
          onChange={(e) => {
            setFilterSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setFilterSearch("");
          }}
          placeholder={`Search ${label ? label.toLowerCase() : "options"}...`}
          autoComplete="off"
          disabled={disabled}
          className={`h-8.5 w-full rounded-xl border px-3 pr-8 font-jakarta sibs-text-xs font-bold outline-none transition placeholder:text-[#98A2B3] disabled:cursor-not-allowed disabled:opacity-50 2xl:h-10 ${
            open
              ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10 text-[#042C51]"
              : "border-[#E6ECF2] bg-[#F8FAFC] text-[#042C51] hover:border-[#FF5C28]/40 hover:bg-white"
          }`}
        />

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setOpen((prev) => !prev);
            setFilterSearch("");
          }}
          className="absolute right-1 top-1/2 flex h-6.5 w-6.5 -translate-y-1/2 items-center justify-center rounded-lg text-[#667085] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
          aria-label={`Toggle ${label || "dropdown"}`}
        >
          <ChevronDown
            size={15}
            className={`transition-transform duration-300 ${
              open ? "rotate-180 text-[#FF5C28]" : ""
            }`}
          />
        </button>
      </div>

      {open && !disabled && (
        <div className="sibs-dropdown-pop-in absolute left-0 right-0 top-[calc(100%+6px)] z-[99999] min-w-[200px] overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-[0_20px_25px_-5px_rgba(15,23,42,0.15),0_8px_10px_-6px_rgba(15,23,42,0.1)]">
          <div role="listbox" className="sibs-scrollbar max-h-60 overflow-y-auto py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const active = String(option.value) === String(value ?? "");

                return (
                  <button
                    key={option.id || option.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => handleSelect(option.value)}
                    className={`flex min-h-9 w-full items-center justify-between gap-2 px-3.5 py-2 text-left sibs-text-xs transition ${
                      active
                        ? "bg-[#FFF0EB] font-extrabold text-[#FF5C28]"
                        : "font-semibold text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {active && <Check size={14} className="shrink-0 text-[#FF5C28]" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3.5 py-3 sibs-text-xs font-semibold text-[#667085]">
                No matching options found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
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

const METRIC_TONES = {
  navy: {
    label: "text-[#042C51]",
    icon: "border-blue-100 bg-[#E9F0FC] text-[#042C51]",
    value: "text-[#042C51]",
  },
  indigo: {
    label: "text-indigo-700",
    icon: "border-indigo-100 bg-indigo-50 text-indigo-600",
    value: "text-[#042C51]",
  },
  blue: {
    label: "text-blue-700",
    icon: "border-blue-100 bg-blue-50 text-blue-600",
    value: "text-[#042C51]",
  },
  green: {
    label: "text-emerald-700",
    icon: "border-emerald-100 bg-emerald-50 text-emerald-600",
    value: "text-[#042C51]",
  },
  amber: {
    label: "text-amber-700",
    icon: "border-amber-100 bg-amber-50 text-amber-600",
    value: "text-[#042C51]",
  },
  orange: {
    label: "text-[#C2410C]",
    icon: "border-orange-100 bg-orange-50 text-[#FF5C28]",
    value: "text-emerald-600",
  },
};

function PipelineMetricCard({ label, value, description, icon: Icon, tone = "navy", delay = 0 }) {
  return (
    <article
      className="sibs-page-card-in sibs-metric-card flex h-[104px] 2xl:h-[116px] min-h-[96px] 2xl:min-h-[112px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex h-full items-start justify-between gap-2.5 2xl:gap-3">
        <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
          <div>
            <p className={`m-0 truncate sibs-kpi-kicker sibs-tone-${tone}-label`}>
              {label}
            </p>
            <p className={`mt-0.5 font-heading text-2xl 2xl:text-3xl font-bold leading-none tabular-nums tracking-tight sibs-tone-${tone}-label`}>
              {Number(value || 0).toLocaleString("en-US")}
            </p>
          </div>

          <p className="line-clamp-1 truncate sibs-kpi-desc text-sibs-muted">
            {description}
          </p>
        </div>

        <span className={`flex h-7.5 w-7.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105 sibs-tone-${tone}-icon`}>
          <Icon className="h-4 w-4 2xl:h-4.5 2xl:w-4.5" strokeWidth={2} />
        </span>
      </div>
    </article>
  );
}

function LoadingPipelineBoard() {
  return (
    <section className="sibs-page-card-in sibs-card overflow-hidden">
      <div className="border-b border-[#E6ECF2] px-4 py-3.5 sm:px-5">
        <h2 className="sibs-section-title">Candidate Pipeline</h2>
        <p className="sibs-section-subtitle">Loading current pipeline records.</p>
      </div>

      <div className="flex min-h-[360px] items-center justify-center p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-[#E9F0FC] text-[#042C51]">
            <Loader2 size={20} className="animate-spin" />
          </div>
          <p className="mt-3 sibs-text-sm font-extrabold text-[#042C51]">
            Loading candidate pipeline...
          </p>
          <p className="mt-1 sibs-text-xs font-semibold text-[#667085]">
            Preparing the latest recruitment records.
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
    if (!location) return;

    const queryParams = new URLSearchParams(location.search || "");
    const targetStage = queryParams.get("stage");
    const targetCandidateId = queryParams.get("candidateId") || queryParams.get("pipelineId");
    const stateCandidate = location.state?.candidate;

    if (targetStage && typeof setActiveStage === "function") {
      setActiveStage(targetStage);
    }

    if (stateCandidate && typeof setSelectedCandidate === "function") {
      setSelectedCandidate(stateCandidate);
    } else if (targetCandidateId && Array.isArray(safeFilteredCandidates) && safeFilteredCandidates.length) {
      const match = safeFilteredCandidates.find((c) => {
        const id = String(c.id || c.candidateId || c.pipelineRecordId || c.candidatePipelineRowId || "");
        return id === String(targetCandidateId);
      });
      if (match && typeof setSelectedCandidate === "function") {
        setSelectedCandidate(match);
      }
    }
  }, [location, safeFilteredCandidates, setActiveStage, setSelectedCandidate]);

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
              className="sibs-page-card-in rounded-xl border border-red-200 bg-red-50 px-4 py-3 sibs-text-xs font-bold leading-5 text-red-700"
              style={{ animationDelay: "45ms", animationFillMode: "both" }}
            >
              {loadError}
            </section>
          ) : null}

          <section aria-label="Pipeline Summary" className="grid grid-cols-2 gap-2.5 2xl:gap-3 md:grid-cols-3 xl:grid-cols-6">
            <PipelineMetricCard
              label="Initial Screening"
              value={safeMetrics.initialScreening}
              icon={UserCheck}
              description="PRF match review"
              tone="navy"
              delay={0}
            />
            <PipelineMetricCard
              label="Online Assessment"
              value={safeMetrics.onlineAssessment}
              icon={ClipboardCheck}
              description="Matched candidates"
              tone="indigo"
              delay={60}
            />
            <PipelineMetricCard
              label="Interview Scheduled"
              value={safeMetrics.interviewScheduled}
              icon={CalendarDays}
              description="Booked sessions"
              tone="blue"
              delay={120}
            />
            <PipelineMetricCard
              label="Interviewed"
              value={safeMetrics.interviewed}
              icon={ShieldCheck}
              description="Evaluations complete"
              tone="green"
              delay={180}
            />
            <PipelineMetricCard
              label="Offered"
              value={safeMetrics.offered}
              icon={BriefcaseBusiness}
              description="Offers processing"
              tone="amber"
              delay={240}
            />
            <PipelineMetricCard
              label="Accepted"
              value={safeMetrics.accepted}
              icon={UserCheck}
              description="Ready for NHO"
              tone="orange"
              delay={300}
            />
          </section>

          <section
            className="sibs-page-card-in sibs-card relative z-[100] overflow-visible p-3 sm:p-4 2xl:p-5"
            style={{ animationDelay: "120ms", animationFillMode: "both" }}
          >
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] p-1">
                  <button
                    type="button"
                    onClick={() => setPageView("pipeline")}
                    className={`inline-flex h-7.5 2xl:h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-[11px] 2xl:text-xs font-extrabold transition ${
                      pageView === "pipeline"
                        ? "bg-[#FF5C28] text-white shadow-sm"
                        : "text-[#667085] hover:text-[#042C51]"
                    }`}
                  >
                    <LayoutGrid size={13} />
                    Pipeline View
                  </button>

                  <button
                    type="button"
                    onClick={() => setPageView("calendar")}
                    className={`inline-flex h-7.5 2xl:h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-[11px] 2xl:text-xs font-extrabold transition ${
                      pageView === "calendar"
                        ? "bg-[#FF5C28] text-white shadow-sm"
                        : "text-[#667085] hover:text-[#042C51]"
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
                    className="inline-flex h-7.5 2xl:h-8 items-center justify-center gap-1.5 rounded-lg border border-[#FF5C28]/30 bg-[#FFF9F6] px-2.5 text-[11px] 2xl:text-xs font-extrabold text-[#FF5C28] transition hover:bg-[#FF5C28] hover:text-white active:scale-[0.98]"
                  >
                    <RotateCcw size={12} />
                    Reset Filters
                  </button>
                ) : null}
              </div>

              {pageView === "pipeline" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9.5px] 2xl:text-[10px] font-extrabold uppercase tracking-wide text-[#042C51]">
                    Sub-View:
                  </span>

                  <div className="flex items-center gap-1 rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] p-1">
                    <button
                      type="button"
                      onClick={() => setBoardSubView("board")}
                      className={`inline-flex h-7.5 2xl:h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-[11px] 2xl:text-xs font-extrabold transition ${
                        boardSubView === "board"
                          ? "bg-[#FF5C28] text-white shadow-sm"
                          : "text-[#667085] hover:text-[#042C51]"
                      }`}
                    >
                      <LayoutGrid size={13} />
                      Kanban Board
                    </button>

                    <button
                      type="button"
                      onClick={() => setBoardSubView("list")}
                      className={`inline-flex h-7.5 2xl:h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-[11px] 2xl:text-xs font-extrabold transition ${
                        boardSubView === "list"
                          ? "bg-[#FF5C28] text-white shadow-sm"
                          : "text-[#667085] hover:text-[#042C51]"
                      }`}
                    >
                      <List size={13} />
                      List View
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2.5 border-t border-[#E6ECF2] pt-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="relative min-w-0">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search candidate name, ID, or email..."
                  className="h-8.5 w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] pl-8.5 pr-8 sibs-text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#042C51]/45 hover:bg-white focus:border-[#042C51] focus:bg-white focus:ring-4 focus:ring-[#042C51]/10 2xl:h-10"
                />
                {cleanText(search) ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#98A2B3] transition hover:bg-white hover:text-[#042C51]"
                  >
                    <X size={13} />
                  </button>
                ) : null}
              </div>

              <FilterDropdown
                value={departmentFilter}
                onChange={setDepartmentFilter}
                options={departmentOptions}
                placeholder="All Departments"
                zIndex="z-[140]"
              />

              <FilterDropdown
                value={accountFilter}
                onChange={setAccountFilter}
                options={accountOptions}
                placeholder="All Accounts"
                zIndex="z-[130]"
              />

              <FilterDropdown
                value={prfStatusFilter}
                onChange={setPrfStatusFilter}
                options={prfStatusOptions}
                placeholder="All PRF Status"
                zIndex="z-[120]"
              />

              <FilterDropdown
                value={sourceFilter}
                onChange={setSourceFilter}
                options={sourceOptions}
                placeholder="All Sources"
                zIndex="z-[110]"
              />
            </div>
          </section>

          {pageView === "pipeline" && (
            <div className="space-y-5">
              {isLoading ? (
                <LoadingPipelineBoard />
              ) : (
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
                />
              )}
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
