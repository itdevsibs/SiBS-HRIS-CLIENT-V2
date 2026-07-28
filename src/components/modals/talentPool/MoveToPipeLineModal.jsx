import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";

import { useTalentPool } from "../../../services/context/TalentPoolContext";
import {
  textareaClass,
  toDisplayPersonName,
} from "../../../lib/utils/talentPool/talentPoolHelpers";
import { FieldLabel } from "../../recruitment/talentPool/TalentPoolShared";
import { moveTalentPoolCandidateToPipeline } from "../../../lib/axios/getTalentPool";
import StatusModal from "../StatusModal";
import {
  findMatchingFinalInterviewForm,
  getCandidateAppliedPositionId,
  getCandidateAppliedPositionTitle,
  getFinalInterviewFormFields,
  getFinalInterviewFormId,
  getFinalInterviewFormName,
  getFinalInterviewFormPositionId,
  getFinalInterviewFormPositionTitle,
} from "../../../lib/utils/recruitment/finalInterviewFormMatching";

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

function getCandidateName(candidate = {}) {
  return cleanText(candidate.name || candidate.candidateName) || "Candidate";
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

  const safePipelineTarget = pipelineTarget || {};
  const form = moveToPipelineForm || {};
  const ownerSource = form.taOwner || currentTaOwner;
  const ownerName = toDisplayPersonName(ownerSource, "Current User");
  const isBusy = moveSaving;
  const candidateName = getCandidateName(safePipelineTarget);

  const positionAppliedId =
    getCandidateAppliedPositionId(
      safePipelineTarget,
      matchedPosition?.positionId,
    );

  const positionApplied =
    getCandidateAppliedPositionTitle(
      safePipelineTarget,
      matchedPosition?.positionTitle,
    ) || "Not assigned yet";

  const matchedFinalInterviewForm = useMemo(() => {
    if (!pipelineTarget) return null;

    return findMatchingFinalInterviewForm({
      preferredFormId:
        safePipelineTarget.finalInterviewFormId ||
        safePipelineTarget.final_interview_form_id ||
        "",
      positionId: positionAppliedId,
      positionTitle: positionApplied,
    });
  }, [
    pipelineTarget,
    safePipelineTarget.finalInterviewFormId,
    safePipelineTarget.final_interview_form_id,
    positionAppliedId,
    positionApplied,
  ]);

  const matchedFinalInterviewFormId =
    matchedFinalInterviewForm
      ? getFinalInterviewFormId(
          matchedFinalInterviewForm,
        )
      : "";

  const matchedFinalInterviewFormName =
    matchedFinalInterviewForm
      ? getFinalInterviewFormName(
          matchedFinalInterviewForm,
        )
      : "";

  const matchedFinalInterviewPositionId =
    matchedFinalInterviewForm
      ? getFinalInterviewFormPositionId(
          matchedFinalInterviewForm,
        ) || positionAppliedId
      : positionAppliedId;

  const matchedFinalInterviewPositionTitle =
    matchedFinalInterviewForm
      ? getFinalInterviewFormPositionTitle(
          matchedFinalInterviewForm,
        ) || positionApplied
      : positionApplied;

  const matchedFinalInterviewFields =
    matchedFinalInterviewForm
      ? getFinalInterviewFormFields(
          matchedFinalInterviewForm,
        )
      : [];

  // All Hooks must run before this conditional return.
  if (!pipelineTarget) return null;

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

  async function handleMoveCandidate(event) {
    event?.preventDefault?.();

    if (isBusy) return;

    const applicationId = getApplicationId(pipelineTarget);

    if (!applicationId) {
      showError("Candidate not moved", "Missing candidate application ID.");
      return;
    }

    setMoveSaving(true);

    try {
      const payload = {
        candidateId: pipelineTarget.candidateId || "",
        applicationId,
        candidateName,
        email: pipelineTarget.email || "",
        openPosition: positionApplied,
        appliedPosition: positionApplied,
        positionTitle: positionApplied,
        positionId: positionAppliedId,
        finalInterviewPositionId:
          matchedFinalInterviewPositionId,
        final_interview_position_id:
          matchedFinalInterviewPositionId,
        finalInterviewPositionTitle:
          matchedFinalInterviewPositionTitle,
        final_interview_position_title:
          matchedFinalInterviewPositionTitle,
        finalInterviewFormId:
          matchedFinalInterviewFormId,
        final_interview_form_id:
          matchedFinalInterviewFormId,
        finalInterviewFormName:
          matchedFinalInterviewFormName,
        final_interview_form_name:
          matchedFinalInterviewFormName,
        finalInterviewFields:
          matchedFinalInterviewFields,
        final_interview_fields:
          matchedFinalInterviewFields,
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
        currentStage: "Initial Screening",
        pipelineStage: "Initial Screening",
        currentPipelineStage: "Initial Screening",
        status: "Initial Screening",
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
          movedCandidate: {
            ...payload,
            ...(
              response?.candidate ||
              response?.data?.pipelineCandidate ||
              response?.data ||
              {}
            ),
            finalInterviewFormId:
              response?.candidate?.finalInterviewFormId ||
              response?.data?.pipelineCandidate
                ?.finalInterviewFormId ||
              response?.data?.finalInterviewFormId ||
              matchedFinalInterviewFormId,
            finalInterviewPositionId:
              response?.candidate
                ?.finalInterviewPositionId ||
              response?.data?.pipelineCandidate
                ?.finalInterviewPositionId ||
              response?.data?.finalInterviewPositionId ||
              matchedFinalInterviewPositionId,
            finalInterviewPositionTitle:
              response?.candidate
                ?.finalInterviewPositionTitle ||
              response?.data?.pipelineCandidate
                ?.finalInterviewPositionTitle ||
              response?.data
                ?.finalInterviewPositionTitle ||
              matchedFinalInterviewPositionTitle,
          },
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
      className="sibs-modal-blur fixed inset-0 z-[10002] flex h-dvh items-center justify-center px-4 py-4"
      onClick={isBusy ? undefined : closeMoveToPipeline}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1">
              Move to Candidate Pipeline
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
              placeholder="Optional notes before moving this candidate to Initial Screening."
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


            <button
              type="button"
              disabled={isBusy}
              onClick={handleMoveCandidate}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowRight size={16} />
              {moveSaving ? "Moving..." : "Move Candidate"}
            </button>
          </div>
        </div>
      </div>

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
