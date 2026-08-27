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

export default function TalentPoolMobileCard({ candidate, index = 0 }) {
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
    candidate.currentAppliedAccount || "";

  return (
    <button
      type="button"
      onClick={() => setSelectedCandidate(candidate)}
      className="sibs-page-card-in group w-full rounded-2xl border border-sibs-border bg-white p-3.5 2xl:p-4 text-left font-jakarta shadow-sm outline-none transition hover:border-sibs-orange/40 hover:bg-[#FFF8F5] hover:shadow-md focus-visible:ring-2 focus-visible:ring-sibs-orange/25 active:scale-[0.995]"
      style={{
        animationDelay: `${index * 40}ms`,
        animationFillMode: "both",
      }}
      aria-label={`View candidate ${candidate.name || "profile"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-extrabold uppercase tracking-normal text-sibs-orange">
            {candidate.candidateId || "Candidate"}
          </p>

          <h3 className="mt-0.5 truncate sibs-text-xs font-extrabold leading-5 text-sibs-navy">
            {candidate.name || "—"}
          </h3>

          <p className="mt-0.5 truncate text-[10px] 2xl:text-[11px] font-semibold text-sibs-text-muted">
            {candidate.email || candidate.contactNumber || "—"}
          </p>
        </div>

        <span
          title={displayStatus}
          className={`inline-flex max-w-[150px] shrink-0 items-center justify-center rounded-lg border px-2 py-0.5 2xl:py-1 text-center text-[10px] font-extrabold leading-4 ${getStatusClass(
            displayStatus,
          )}`}
        >
          <span className="line-clamp-2 break-words">
            {getTalentPoolStatusLabel(displayStatus)}
          </span>
        </span>
      </div>

      <div className="mt-2.5 2xl:mt-3 grid grid-cols-2 gap-2">
        <div className="min-w-0 rounded-lg border border-sibs-border bg-sibs-canvas p-2.5 2xl:p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-normal text-sibs-text-muted">
            Position
          </p>
          <p className="mt-0.5 line-clamp-2 sibs-text-xs font-bold leading-4 text-sibs-text-secondary">
            {position}
          </p>
        </div>

        <div className="min-w-0 rounded-lg border border-sibs-border bg-sibs-canvas p-2.5 2xl:p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-normal text-sibs-text-muted">
            Location
          </p>
          <p className="mt-0.5 line-clamp-2 sibs-text-xs font-bold leading-4 text-sibs-text-secondary">
            {location}
          </p>
        </div>
      </div>

      <div className="mt-2.5 2xl:mt-3 flex items-end justify-between gap-3 border-t border-sibs-border pt-2.5 2xl:pt-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex max-w-full truncate rounded-md border border-sibs-border bg-sibs-canvas px-2 py-0.5 text-[10px] font-bold text-sibs-text-muted">
              {candidate.source || "Source not specified"}
            </span>

            {candidate.isPublicSubmission ? (
              <span className="inline-flex rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                Public
              </span>
            ) : null}
          </div>

          <p className="mt-1.5 truncate text-[10px] font-semibold text-sibs-text-muted">
            Final account: <span className="font-extrabold text-sibs-navy">{finalAccount}</span>
          </p>
        </div>

        <span className="flex h-7.5 w-7.5 2xl:h-8 2xl:w-8 shrink-0 items-center justify-center rounded-lg bg-sibs-cream text-sibs-navy transition group-hover:bg-sibs-orange group-hover:text-white">
          <ArrowUpRight size={14} />
        </span>
      </div>
    </button>
  );
}
