import React from "react";
import CandidateAvatar from "./CandidateAvatar";
import {
  cleanAssignmentValue,
  getAccount as getRoleAccountAccount,
  getRoleTitle as getRoleAccountRole,
} from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";

function cleanText(value) {
  return String(value ?? "").trim();
}

function getRole(candidate = {}) {
  return cleanAssignmentValue(
    candidate.currentAppliedRole ||
      candidate.roleTitle ||
      candidate.openPosition ||
      candidate.position ||
      getRoleAccountRole(candidate.roleAccount || candidate.role_account),
  );
}

function getAccount(candidate = {}) {
  return cleanAssignmentValue(
    candidate.currentAppliedAccount ||
      candidate.account ||
      candidate.initialAccount ||
      candidate.finalAccount ||
      getRoleAccountAccount(candidate.roleAccount || candidate.role_account),
  );
}

export default function CandidateModalSummary({
  candidate = {},
  stage = "",
  statusClass = "border-[#FF5C28]/25 bg-[#FFF0EB] text-[#FF5C28]",
  compact = false,
  showAssignment = true,
}) {
  const candidateName =
    cleanText(candidate.name || candidate.candidateName || candidate.fullName) ||
    "Candidate";
  const email =
    cleanText(candidate.email || candidate.candidateEmail) || "No email saved";
  const candidateId = cleanText(candidate.candidateId || candidate.candidate_id);
  const candidateApplicationId = cleanText(
    candidate.candidateApplicationId ||
      candidate.candidate_application_id ||
      candidate.applicationId,
  );
  const currentStage = cleanText(
    stage || candidate.currentStage || candidate.currentPipelineStage || candidate.stage,
  );
  const roleAccount = [getRole(candidate), getAccount(candidate)]
    .filter(Boolean)
    .join(" • ");

  return (
    <section className="rounded-xl border border-[#E6ECF2] bg-white p-3 sm:p-3.5 2xl:p-4 shadow-[0_8px_22px_rgba(4,44,81,0.04)]">
      <div className="flex items-start gap-2.5">
        <CandidateAvatar candidate={candidate} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="truncate sibs-text-xs sm:sibs-text-sm font-extrabold text-[#101828]">
                {candidateName}
              </h3>
              <p className="mt-0.5 truncate text-[10px] 2xl:text-[11px] font-semibold text-[#667085]">
                {email}
              </p>
            </div>
            {currentStage && (
              <span
                className={`w-fit shrink-0 rounded-full border px-2 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wide ${statusClass}`}
              >
                {currentStage}
              </span>
            )}
          </div>

          {!compact && (
            <>
              {showAssignment && (
                <p className="mt-1.5 sibs-text-xs font-bold text-sibs-primary-1">
                  {roleAccount}
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[9px] 2xl:text-[10px] font-semibold text-[#98A2B3]">
                {candidateId && <span>ID: {candidateId}</span>}
                {candidateApplicationId && (
                  <span>App: {candidateApplicationId}</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
