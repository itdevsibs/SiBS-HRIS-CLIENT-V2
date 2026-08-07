import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown, UserX, X } from "lucide-react";

import { useTalentPool } from "../../../services/context/TalentPoolContext";
import {
  textareaClass,
  toDisplayPersonName,
} from "../../../lib/utils/talentPool/talentPoolHelpers";
import { FieldLabel } from "../../recruitment/talentPool/TalentPoolShared";
import {
  markTalentPoolCandidateAsDropOff,
  moveTalentPoolCandidateToPipeline,
} from "../../../lib/axios/getTalentPool";
import StatusModal from "../StatusModal";

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ");
}

function normalizePositionOption(item) {
  if (!item) return null;

  const positionId =
    item.positionId ||
    item.position_id ||
    item.positionCode ||
    item.position_code ||
    item.id ||
    "";

  const positionTitle =
    item.positionTitle ||
    item.position_title ||
    item.title ||
    item.position ||
    item.openPosition ||
    item.roleCapability ||
    item.name ||
    "";

  const departmentId =
    item.departmentId ||
    item.department_id ||
    item.gy_dept_id ||
    item.id_department ||
    item.positionDepartmentId ||
    item.position_department_id ||
    "";

  const departmentName =
    item.departmentName ||
    item.department_name ||
    item.name_department ||
    item.department ||
    item.positionDepartment ||
    item.position_department ||
    "";

  const accountId =
    item.accountId ||
    item.account_id ||
    item.gy_acc_id ||
    item.positionAccountId ||
    item.position_account_id ||
    "";

  const accountName =
    item.accountName ||
    item.account_name ||
    item.gy_acc_name ||
    item.account ||
    item.leadAccount ||
    item.accountFit ||
    item.appliedAccount ||
    item.currentAppliedAccount ||
    item.positionAccountName ||
    item.position_account_name ||
    "";

  const accountGhlName =
    item.accountGhlName ||
    item.account_ghl_name ||
    item.gy_acc_ghl_name ||
    item.positionAccountGhlName ||
    item.position_account_ghl_name ||
    "";

  const finalTitle = cleanText(positionTitle || positionId);

  if (!finalTitle) return null;

  return {
    positionId: cleanText(positionId),
    positionTitle: finalTitle,
    departmentId: cleanText(departmentId),
    departmentName: cleanText(departmentName),
    accountId: cleanText(accountId),
    accountName: cleanText(accountName),
    accountGhlName: cleanText(accountGhlName),
  };
}

function findMatchingPosition(positions = [], candidate = {}) {
  const normalizedPositions = positions
    .map(normalizePositionOption)
    .filter(Boolean);

  const targetPositionId = cleanText(
    candidate.positionId ||
      candidate.openPositionId ||
      candidate.availablePositionId ||
      "",
  );

  const targetPositionTitle = normalizeKey(
    candidate.openPosition ||
      candidate.roleCapability ||
      candidate.currentAppliedRole ||
      candidate.roleTitle ||
      candidate.appliedPosition ||
      "",
  );

  return (
    normalizedPositions.find(
      (position) =>
        targetPositionId &&
        cleanText(position.positionId) === targetPositionId,
    ) ||
    normalizedPositions.find(
      (position) =>
        targetPositionTitle &&
        normalizeKey(position.positionTitle) === targetPositionTitle,
    ) ||
    null
  );
}

function getApplicationId(candidate = {}) {
  return (
    candidate.rawId ||
    candidate.applicationRawId ||
    candidate.applicationId ||
    candidate.application_id ||
    candidate.dbId ||
    candidate.databaseId ||
    candidate.id ||
    candidate.candidateId ||
    ""
  );
}

function getSibsId(value) {
  if (!value || typeof value !== "object") return "";

  return cleanText(
    value.sibsId ||
      value.sibs_id ||
      value.employeeId ||
      value.employee_id ||
      value.userId ||
      value.user_id ||
      "",
  );
}

function getCandidateName(candidate = {}) {
  return cleanText(candidate.name || candidate.candidateName) || "Candidate";
}

const RESUMABLE_PIPELINE_STAGES = [
  "Initial Screening",
  "Online Assessment",
  "Assessment Fit",
  "Interview Scheduled",
  "Interviewed",
  "Offered",
  "Accepted",
  "For NHO",
  "For Onboarding - Incomplete Requirements",
  "Onboarding",
  "Hired / Active",
];

function normalizeStage(value = "") {
  const normalized = cleanText(value)
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");

  if (!normalized || normalized === "drop off" || normalized === "dropped off") {
    return "";
  }

  return (
    RESUMABLE_PIPELINE_STAGES.find(
      (stage) =>
        stage
          .toLowerCase()
          .replace(/[-_]+/g, " ")
          .replace(/\s+/g, " ") === normalized,
    ) || ""
  );
}

function getHistoryArrays(candidate = {}) {
  const sources = [
    candidate.applicationHistory,
    candidate.application_history,
    candidate.movementTimeline,
    candidate.movement_timeline,
    candidate.movementHistory,
    candidate.movement_history,
    candidate.pipelineHistory,
    candidate.pipeline_history,
    candidate.stageHistory,
    candidate.stage_history,
    candidate.timeline,
    candidate.history,
    candidate.activityHistory,
    candidate.activity_history,
    candidate.metadata?.applicationHistory,
    candidate.metadata?.application_history,
    candidate.metadata?.timeline,
    candidate.metadata?.pipelineTimeline,
    candidate.pipelineCandidate?.timeline,
    candidate.pipelineCandidate?.movementTimeline,
    candidate.pipelineDetails?.timeline,
    candidate.pipelineDetails?.movementTimeline,
  ];

  return sources.filter(Array.isArray).flat().filter(Boolean);
}

function getCompletedPipelineStages(candidate = {}) {
  const unique = [];
  const seen = new Set();

  getHistoryArrays(candidate).forEach((item) => {
    const stage = normalizeStage(
      item?.stage ||
        item?.toStage ||
        item?.to_stage ||
        item?.currentStage ||
        item?.current_stage ||
        item?.pipelineStage ||
        item?.pipeline_stage ||
        item?.status ||
        item?.title,
    );

    if (stage && !seen.has(stage)) {
      seen.add(stage);
      unique.push(stage);
    }
  });

  return unique.sort(
    (a, b) =>
      RESUMABLE_PIPELINE_STAGES.indexOf(a) -
      RESUMABLE_PIPELINE_STAGES.indexOf(b),
  );
}

function isDropOffCandidate(candidate = {}) {
  const values = [
    candidate.status,
    candidate.candidateStatus,
    candidate.candidate_status,
    candidate.currentStage,
    candidate.current_stage,
    candidate.currentPipelineStage,
    candidate.current_pipeline_stage,
    candidate.pipelineStage,
    candidate.pipeline_stage,
  ];

  return values.some(
    (value) =>
      cleanText(value)
        .toLowerCase()
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ") === "drop off",
  );
}


function ResumeStageDropdown({
  value = "",
  options = [],
  onChange,
  disabled = false,
}) {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!dropdownRef.current?.contains(event.target)) {
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

  const selectedOption = options.find((option) => option === value);

  function handleSelect(option) {
    onChange?.(option);
    setOpen(false);
  }

  return (
    <div
      ref={dropdownRef}
      className={`relative mt-2 ${open ? "z-[10040]" : "z-[1]"}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-11 w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-bold shadow-sm outline-none transition ${
          open
            ? "border-sibs-primary-1 ring-4 ring-blue-100"
            : "border-[#D0D5DD] hover:border-sibs-primary-1"
        } ${
          disabled
            ? "cursor-not-allowed bg-slate-100 text-slate-400 opacity-70"
            : "text-[#344054]"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selectedOption ? "text-[#344054]" : "text-[#98A2B3]"
          }`}
        >
          {selectedOption || "Select resume stage"}
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-primary-1 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[10050] overflow-hidden rounded-xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="max-h-64 overflow-y-auto py-1 sibs-scrollbar" role="listbox">
            {options.length > 0 ? (
              options.map((option) => {
                const active = option === value;

                return (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => handleSelect(option)}
                    className={`block w-full px-4 py-3 text-left text-sm font-semibold transition ${
                      active
                        ? "bg-[#EAF4FF] text-sibs-primary-1"
                        : "bg-white text-[#344054] hover:bg-[#F5F9FF] hover:text-sibs-primary-1"
                    }`}
                  >
                    <span className="block truncate">{option}</span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3 text-sm font-semibold text-[#98A2B3]">
                No completed stages found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MoveToPipeLineModal() {
  const navigate = useNavigate();

  const {
    pipelineTarget,
    moveToPipelineForm,
    setMoveToPipelineForm,
    currentTaOwner,
    closeMoveToPipeline,
    activePositionOptions = [],
    availablePositionOptions = [],
    openPositionOptions = [],
    refreshTalentPool,
  } = useTalentPool();

  const [moveSaving, setMoveSaving] = useState(false);
  const [dropOffOpen, setDropOffOpen] = useState(false);
  const [dropOffReason, setDropOffReason] = useState("");
  const [dropOffSaving, setDropOffSaving] = useState(false);
  const [dropOffValidation, setDropOffValidation] = useState("");
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "error",
    title: "",
    message: "",
    closeParent: false,
  });

  const positionSources = useMemo(
    () => [
      ...activePositionOptions,
      ...availablePositionOptions,
      ...openPositionOptions,
    ],
    [activePositionOptions, availablePositionOptions, openPositionOptions],
  );

  const matchedPosition = useMemo(() => {
    if (!pipelineTarget) return null;

    return findMatchingPosition(positionSources, pipelineTarget);
  }, [positionSources, pipelineTarget]);

  const completedStages = useMemo(
    () => (pipelineTarget ? getCompletedPipelineStages(pipelineTarget) : []),
    [pipelineTarget],
  );

  const dropOffResume = Boolean(
    pipelineTarget && isDropOffCandidate(pipelineTarget),
  );

  const defaultResumeStage =
    completedStages[completedStages.length - 1] || "Initial Screening";

  if (!pipelineTarget) return null;

  const form = moveToPipelineForm || {};
  const selectedResumeStage = cleanText(
    form.resumeStage || form.currentStage || defaultResumeStage,
  );

  const ownerSource = form.taOwner || currentTaOwner;
  const ownerName = toDisplayPersonName(ownerSource, "Current User");
  const ownerSibsId = getSibsId(ownerSource);
  const isBusy = moveSaving || dropOffSaving;
  const candidateName = getCandidateName(pipelineTarget);

  const positionApplied =
    cleanText(
      pipelineTarget.openPosition ||
        pipelineTarget.appliedPosition ||
        pipelineTarget.roleCapability ||
        pipelineTarget.currentAppliedRole ||
        pipelineTarget.roleTitle ||
        pipelineTarget.positionTitle ||
        matchedPosition?.positionTitle,
    ) || "Not assigned yet";

  function showError(title, message) {
    setStatusModal({
      open: true,
      type: "error",
      title,
      message,
      closeParent: false,
    });
  }

  function closeStatusModal() {
    const shouldCloseParent = statusModal.closeParent;

    setStatusModal((previous) => ({
      ...previous,
      open: false,
      closeParent: false,
    }));

    if (shouldCloseParent) {
      closeMoveToPipeline?.();
    }
  }

  function handleOpenDropOff() {
    if (isBusy) return;

    setDropOffReason("");
    setDropOffValidation("");
    setDropOffOpen(true);
  }

  function handleCloseDropOff() {
    if (dropOffSaving) return;

    setDropOffOpen(false);
    setDropOffReason("");
    setDropOffValidation("");
  }

  async function refreshAfterChange(responseData) {
    window.dispatchEvent(
      new CustomEvent("ta-talent-pool-updated", {
        detail: responseData || pipelineTarget,
      }),
    );

    if (typeof refreshTalentPool === "function") {
      await refreshTalentPool();
    }
  }

  async function handleConfirmDropOff(event) {
    event?.preventDefault?.();

    if (dropOffSaving) return;

    const reason = cleanText(dropOffReason);

    if (!reason) {
      setDropOffValidation("Drop Off Reason is required.");
      return;
    }

    const applicationId = getApplicationId(pipelineTarget);

    if (!applicationId) {
      setDropOffValidation("Missing candidate application ID.");
      return;
    }

    setDropOffSaving(true);
    setDropOffValidation("");

    try {
      const response = await markTalentPoolCandidateAsDropOff(applicationId, {
        reason,
        droppedOffBySibsId: ownerSibsId,
        droppedOffByName: ownerName,
      });

      if (!response?.success) {
        setDropOffValidation(
          response?.message || "Failed to mark candidate as Drop Off.",
        );
        return;
      }

      await refreshAfterChange(response.data);

      setDropOffOpen(false);
      setDropOffReason("");
      setStatusModal({
        open: true,
        type: "success",
        title: "Candidate marked as Drop Off",
        message: `${candidateName} remains in Talent Pool with the Drop Off status.`,
        closeParent: true,
      });
    } catch (error) {
      console.error("Mark candidate as Drop Off error:", error);

      setDropOffValidation(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to mark candidate as Drop Off.",
      );
    } finally {
      setDropOffSaving(false);
    }
  }

  async function handleMoveCandidate(event) {
    event?.preventDefault?.();

    if (isBusy) return;

    const applicationId = getApplicationId(pipelineTarget);

    if (!applicationId) {
      showError("Candidate not moved", "Missing candidate application ID.");
      return;
    }

    if (
      dropOffResume &&
      (!selectedResumeStage || !completedStages.includes(selectedResumeStage))
    ) {
      showError(
        "Candidate not moved",
        "Select a completed pipeline stage for this candidate.",
      );
      return;
    }

    setMoveSaving(true);

    try {
      const targetStage = dropOffResume
        ? selectedResumeStage
        : "Initial Screening";

      const payload = {
        candidateId: pipelineTarget.candidateId || "",
        applicationId,
        candidateName,
        email: pipelineTarget.email || "",
        openPosition: positionApplied,
        positionId:
          pipelineTarget.positionId ||
          pipelineTarget.openPositionId ||
          matchedPosition?.positionId ||
          "",
        leadDepartmentId:
          pipelineTarget.leadDepartmentId ||
          pipelineTarget.departmentId ||
          pipelineTarget.department_id ||
          matchedPosition?.departmentId ||
          "",
        leadDepartment:
          pipelineTarget.leadDepartment ||
          pipelineTarget.department ||
          pipelineTarget.departmentName ||
          matchedPosition?.departmentName ||
          "",
        leadAccountId:
          pipelineTarget.leadAccountId ||
          pipelineTarget.accountId ||
          pipelineTarget.account_id ||
          matchedPosition?.accountId ||
          "",
        leadAccount:
          pipelineTarget.leadAccount ||
          pipelineTarget.accountFit ||
          pipelineTarget.appliedAccount ||
          pipelineTarget.currentAppliedAccount ||
          pipelineTarget.accountName ||
          pipelineTarget.account ||
          matchedPosition?.accountName ||
          "",
        accountGhlName:
          pipelineTarget.accountGhlName ||
          pipelineTarget.account_ghl_name ||
          matchedPosition?.accountGhlName ||
          "",
        taOwner: ownerName,
        currentTaOwner: ownerName,
        resumeStage: targetStage,
        completedStages,
        currentStage: targetStage,
        pipelineStage: targetStage,
        currentPipelineStage: targetStage,
        status: targetStage,
        remarks: form.remarks || "",
      };

      const response = await moveTalentPoolCandidateToPipeline(
        applicationId,
        payload,
      );

      if (!response?.success) {
        showError(
          "Candidate not moved",
          response?.message || "Failed to move candidate to pipeline.",
        );
        return;
      }

      window.dispatchEvent(
        new CustomEvent("ta-pipeline-candidates-updated", {
          detail: response.data || payload,
        }),
      );

      await refreshAfterChange(response.data || payload);

      closeMoveToPipeline?.();

      navigate("/recruitment/candidate-pipeline", {
        replace: true,
        state: {
          movedCandidate:
            response?.candidate ||
            response?.data?.pipelineCandidate ||
            response?.data ||
            payload,
        },
      });
    } catch (error) {
      console.error("Move candidate to pipeline error:", error);

      showError(
        "Candidate not moved",
        error?.response?.data?.message ||
          error?.message ||
          "Failed to move candidate to pipeline.",
      );
    } finally {
      setMoveSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[10002] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={isBusy ? undefined : closeMoveToPipeline}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1">
              {dropOffResume
                ? "Resume Candidate in Pipeline"
                : "Move to Candidate Pipeline"}
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              {candidateName}
            </p>
          </div>

          <button
            type="button"
            onClick={closeMoveToPipeline}
            disabled={isBusy}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close move candidate modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleMoveCandidate} className="space-y-4 p-5">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold leading-6 text-sibs-primary-1">
            {dropOffResume
              ? "Select a stage already entered by the candidate. Future or unvisited stages are not available."
              : "This will create a pipeline application directly under Initial Screening. Department and account details are captured automatically from the candidate's available position record when present."}
          </div>

          <div>
            <FieldLabel>Position Applied</FieldLabel>

            <div
              className="mt-2 flex min-h-11 w-full items-center rounded-xl border border-[#D0D5DD] bg-[#F8FAFC] px-4 py-3 text-sm font-extrabold text-sibs-primary-1"
              aria-readonly="true"
              title={positionApplied}
            >
              {positionApplied}
            </div>

            <p className="mt-1.5 text-xs font-semibold text-sibs-tertiary-5">
              This value is read-only and comes from the candidate&apos;s applied
              position record.
            </p>
          </div>

          {dropOffResume && (
            <div>
              <FieldLabel>Resume Stage</FieldLabel>
              <ResumeStageDropdown
                value={selectedResumeStage}
                options={completedStages}
                disabled={isBusy}
                onChange={(nextStage) =>
                  setMoveToPipelineForm({
                    ...form,
                    resumeStage: nextStage,
                  })
                }
              />

              <p className="mt-1.5 text-xs font-semibold text-sibs-tertiary-5">
                Only stages already recorded before Drop-off are available.
              </p>
            </div>
          )}

          <div>
            <FieldLabel>Remarks</FieldLabel>
            <textarea
              rows={5}
              value={form.remarks || ""}
              onChange={(event) =>
                setMoveToPipelineForm({
                  ...form,
                  remarks: event.target.value,
                })
              }
              disabled={isBusy}
              className={textareaClass()}
              placeholder={
                dropOffResume
                  ? `Optional notes before resuming at ${selectedResumeStage || "the selected stage"}.`
                  : "Optional notes before moving this candidate to Initial Screening."
              }
            />
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={closeMoveToPipeline}
              disabled={isBusy}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            {!dropOffResume && (
              <button
                type="button"
                onClick={handleOpenDropOff}
                disabled={isBusy}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-700 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-100 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                <UserX size={17} />
                Mark as Drop Off
              </button>
            )}

            <button
              type="button"
              disabled={
                isBusy ||
                (dropOffResume &&
                  (!selectedResumeStage ||
                    !completedStages.includes(selectedResumeStage)))
              }
              onClick={handleMoveCandidate}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowRight size={16} />
              {moveSaving
                ? dropOffResume
                  ? "Resuming..."
                  : "Moving..."
                : dropOffResume
                  ? "Resume Candidate"
                  : "Move Candidate"}
            </button>
          </div>
        </div>
      </div>

      {dropOffOpen && (
        <div
          className="fixed inset-0 z-[10020] flex h-dvh items-center justify-center bg-black/50 px-4 py-4"
          onClick={(event) => {
            event.stopPropagation();
            handleCloseDropOff();
          }}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-[#B42318]">
                  Mark as Drop Off
                </h3>
                <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                  {candidateName}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseDropOff}
                disabled={dropOffSaving}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close Drop Off reason modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmDropOff} className="space-y-4 p-5">
              <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold leading-6 text-[#B42318]">
                The candidate will remain visible in Talent Pool with the Drop
                Off status. Enter the reason before confirming.
              </div>

              <div>
                <FieldLabel>Drop Off Reason</FieldLabel>
                <textarea
                  autoFocus
                  rows={5}
                  value={dropOffReason}
                  onChange={(event) => {
                    setDropOffReason(event.target.value);

                    if (dropOffValidation) {
                      setDropOffValidation("");
                    }
                  }}
                  disabled={dropOffSaving}
                  className={`${textareaClass()} ${
                    dropOffValidation
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : ""
                  }`}
                  placeholder="Enter the reason for dropping off this candidate."
                />

                {dropOffValidation && (
                  <p className="mt-1.5 text-xs font-bold text-red-600">
                    {dropOffValidation}
                  </p>
                )}
              </div>
            </form>

            <div className="border-t border-gray-100 px-5 py-4">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseDropOff}
                  disabled={dropOffSaving}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDropOff}
                  disabled={dropOffSaving || !cleanText(dropOffReason)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UserX size={17} />
                  {dropOffSaving ? "Saving..." : "Confirm Drop Off"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={closeStatusModal}
        variant="center"
        lockScroll={false}
      />
    </div>
  );
}
