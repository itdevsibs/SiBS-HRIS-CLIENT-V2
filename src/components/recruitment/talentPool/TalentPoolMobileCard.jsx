import { ArrowUpRight } from "lucide-react";
import { useTalentPool } from "../../../services/context/TalentPoolContext";
import { getStatusClass } from "../../../lib/utils/talentPool/talentPoolHelpers";

function getTalentPoolStatusLabel(status = "") {
  const value = String(status || "").trim();

  if (
    value === "For Onboarding - Incomplete Requirements" ||
    value === "Onboarding - Incomplete Requirements"
  ) {
    return "Incomplete Requirements";
  }

  return value || "—";
}

export default function TalentPoolMobileCard({ candidate }) {
  const { setSelectedCandidate } = useTalentPool();

  const displayStatus =
    candidate.currentPipelineStage ||
    candidate.pipelineStage ||
    candidate.currentStage ||
    candidate.pipelineStatus ||
    candidate.status ||
    "—";

  const position =
    candidate.openPosition || candidate.roleCapability || "—";
  const location = candidate.applyingLocation || "—";
  const finalAccount =
    candidate.currentAppliedAccount || "Not assigned yet";

  return (
    <button
      type="button"
      onClick={() => setSelectedCandidate(candidate)}
      className="group w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left font-jakarta shadow-sm outline-none transition hover:border-[#FF5C28]/35 hover:bg-[#FFFCFA] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#042C51]/25 active:scale-[0.995]"
      aria-label={`View candidate ${candidate.name || "profile"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-extrabold uppercase tracking-normal text-[#FF5C28]">
            {candidate.candidateId || "Candidate"}
          </p>

          <h3 className="mt-1 truncate text-[13px] font-extrabold leading-5 text-[#042C51]">
            {candidate.name || "—"}
          </h3>

          <p className="mt-0.5 truncate text-[11px] font-semibold text-[#667085]">
            {candidate.email || candidate.contactNumber || "—"}
          </p>
        </div>

        <span
          title={displayStatus}
          className={`inline-flex max-w-[150px] shrink-0 items-center justify-center rounded-lg border px-2 py-1 text-center text-[10px] font-extrabold leading-4 ${getStatusClass(
            displayStatus,
          )}`}
        >
          <span className="line-clamp-2 break-words">
            {getTalentPoolStatusLabel(displayStatus)}
          </span>
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="min-w-0 rounded-lg border border-[#EEF2F6] bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-normal text-[#667085]">
            Position
          </p>
          <p className="mt-1 line-clamp-2 text-xs font-bold leading-4 text-[#344054]">
            {position}
          </p>
        </div>

        <div className="min-w-0 rounded-lg border border-[#EEF2F6] bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-normal text-[#667085]">
            Location
          </p>
          <p className="mt-1 line-clamp-2 text-xs font-bold leading-4 text-[#344054]">
            {location}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3 border-t border-[#F1F5F9] pt-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex max-w-full truncate rounded-md border border-[#E6ECF2] bg-[#F8FAFC] px-2 py-1 text-[10px] font-bold text-[#667085]">
              {candidate.source || "Source not specified"}
            </span>

            {candidate.isPublicSubmission ? (
              <span className="inline-flex rounded-md border border-purple-200 bg-purple-50 px-2 py-1 text-[10px] font-bold text-purple-700">
                Public
              </span>
            ) : null}
          </div>

          <p className="mt-2 truncate text-[10px] font-semibold text-[#667085]">
            Final account: <span className="font-extrabold text-[#042C51]">{finalAccount}</span>
          </p>
        </div>

        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E9F0FC] text-[#042C51] transition group-hover:bg-[#FF5C28] group-hover:text-white">
          <ArrowUpRight size={15} />
        </span>
      </div>
    </button>
  );
}
