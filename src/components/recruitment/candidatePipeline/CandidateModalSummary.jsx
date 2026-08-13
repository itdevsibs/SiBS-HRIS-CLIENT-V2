import React from "react";
import CandidateAvatar from "./CandidateAvatar";

function cleanText(value) {
  return String(value ?? "").trim();
}

function getRole(candidate = {}) {
  return cleanText(
    candidate.currentAppliedRole ||
      candidate.roleTitle ||
      candidate.openPosition ||
      candidate.position ||
      candidate.roleAccount?.split?.(" - ")?.[0] ||
      "Not assigned yet",
  );
}

function getAccount(candidate = {}) {
  const roleAccount = cleanText(candidate.roleAccount);
  const roleAccountParts = roleAccount.split(" - ");
  return cleanText(
    candidate.currentAppliedAccount ||
      candidate.account ||
      candidate.initialAccount ||
      candidate.finalAccount ||
      roleAccountParts[1] ||
      "Not assigned yet",
  );
}

export default function CandidateModalSummary({
  candidate = {},
  stage = "",
  statusClass = "border-blue-100 bg-blue-50 text-blue-700",
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
    <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-[0_8px_22px_rgba(4,44,81,0.04)]">
      <div className="flex items-start gap-3">
        <CandidateAvatar candidate={candidate} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="break-words sibs-text-sm font-extrabold text-[#101828]">
                {candidateName}
              </h3>
              <p className="mt-0.5 break-all sibs-text-xs font-semibold text-[#667085]">
                {email}
              </p>
            </div>
            {currentStage && (
              <span
                className={`w-fit shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide ${statusClass}`}
              >
                {currentStage}
              </span>
            )}
          </div>

          {!compact && (
            <>
              {showAssignment && (
                <p className="mt-2 sibs-text-xs font-bold text-sibs-primary-1">
                  {roleAccount}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold text-[#98A2B3]">
                {candidateId && <span>Candidate ID: {candidateId}</span>}
                {candidateApplicationId && (
                  <span>Application: {candidateApplicationId}</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
