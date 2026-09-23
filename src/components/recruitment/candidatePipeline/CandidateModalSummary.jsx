import React from "react";
import {
  BriefcaseBusiness,
  Building2,
  Database,
  Hash,
  Mail,
} from "lucide-react";
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

function getPrfStatus(candidate = {}) {
  return cleanText(
    candidate.prfStatus ||
      candidate.prf_status ||
      candidate.prfReviewStatus ||
      candidate.prf_review_status,
  );
}

function getSource(candidate = {}) {
  return cleanText(
    candidate.source ||
      candidate.sourceName ||
      candidate.source_name ||
      candidate.applicationSource ||
      candidate.application_source ||
      candidate.metadata?.source,
  );
}

function getPrfClass(value = "") {
  const key = cleanText(value).toLowerCase();

  if (key.includes("not matched") || key.includes("rejected")) {
    return "border-red-100 bg-red-50 text-red-700";
  }

  if (key.includes("matched") || key.includes("approved")) {
    return "border-emerald-200 bg-emerald-600 text-white";
  }

  return "border-amber-100 bg-amber-50 text-amber-700";
}

function AssignmentChip({ icon: Icon, children }) {
  if (!children) return null;

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg border border-sibs-border bg-sibs-surface px-2.5 py-1.5 sibs-text-xs font-extrabold text-sibs-navy">
      <Icon size={12} className="shrink-0 text-[#FF5C28]" />
      <span className="truncate">{children}</span>
    </span>
  );
}

function MetadataItem({ label, value }) {
  if (!value) return null;

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-[9px] font-bold text-[#8190A5] 2xl:text-[10px]">
      <Hash size={10} className="shrink-0 text-[#9AA8B9]" />
      <span className="shrink-0 uppercase tracking-[0.08em]">{label}</span>
      <span className="min-w-0 truncate font-mono font-semibold normal-case tracking-normal text-[#667085]">
        {value}
      </span>
    </span>
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
  const prfStatus = getPrfStatus(candidate);
  const source = getSource(candidate) || "Candidate Pipeline";
  const role = getRole(candidate);
  const account = getAccount(candidate);
  const hasAssignment = Boolean(role || account);
  const hasMetadata = Boolean(candidateId || candidateApplicationId);

  return (
    <section className="sibs-card relative h-full overflow-hidden">
      <div className="sibs-top-accent" />

      <div className="relative p-4 sm:p-4.5 2xl:p-5">
        <div className="flex items-start gap-3.5 sm:gap-4">
          <div className="shrink-0 rounded-2xl bg-white p-1 shadow-[0_5px_16px_rgba(4,44,81,0.11)] ring-1 ring-[#D9E3ED]">
            <CandidateAvatar candidate={candidate} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-heading text-base font-black leading-tight tracking-[-0.015em] text-[#042C51] sm:text-lg 2xl:text-xl">
              {candidateName}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {currentStage ? (
                <span
                  className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[8.5px] font-extrabold uppercase tracking-[0.08em] 2xl:text-[9px] ${statusClass}`}
                >
                  {currentStage}
                </span>
              ) : null}

              {prfStatus ? (
                <span
                  className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[8.5px] font-extrabold uppercase tracking-[0.08em] 2xl:text-[9px] ${getPrfClass(prfStatus)}`}
                >
                  PRF: {prfStatus}
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex min-w-0 items-center gap-1.5 text-[10px] font-semibold text-[#667085] 2xl:text-[11px]">
              <Database size={12} className="shrink-0 text-[#7A91AA]" />
              <span className="truncate">{source}</span>
            </div>

            {!compact ? (
              <>
                <div className="mt-2 flex min-w-0 items-center gap-1.5 text-[10px] font-semibold text-[#667085] 2xl:text-[11px]">
                  <Mail size={11} className="shrink-0 text-[#8EA0B4]" />
                  <span className="truncate">{email}</span>
                </div>

                {showAssignment && hasAssignment ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <AssignmentChip icon={BriefcaseBusiness}>{role}</AssignmentChip>
                    <AssignmentChip icon={Building2}>{account}</AssignmentChip>
                  </div>
                ) : null}

                {hasMetadata ? (
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#E9EFF5] pt-2.5">
                    <MetadataItem label="Candidate" value={candidateId} />
                    <MetadataItem label="Application" value={candidateApplicationId} />
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
