import { Eye } from "lucide-react";

import { useTalentPool } from "../../../services/context/TalentPoolContext";
import {
  formatDate,
  formatList,
  getStatusClass,
} from "../../../lib/utils/talentPool/talentPoolHelpers";

export default function TalentPoolDetailRow({ candidate }) {
  const { setSelectedCandidate } = useTalentPool();

  const appliedPosition =
    candidate.openPosition || candidate.roleCapability || "—";

  const applicationSource =
    candidate.source || formatList(candidate.hearAboutUs) || "—";

  const referrer = candidate.referredBy || "—";
  const preferredLocation = candidate.applyingLocation || "—";
  const finalAccount = candidate.currentAppliedAccount || "";

  const displayStatus =
    candidate.currentPipelineStage ||
    candidate.pipelineStage ||
    candidate.currentStage ||
    candidate.status ||
    "—";

  const lastActivity = formatDate(
    candidate.lastPipelineUpdate || candidate.lastActivity,
  );

  return (
    <tr className="transition hover:bg-sibs-surface">
      <td className="border-b border-sibs-border px-4 py-3.5 align-middle">
        <div className="min-w-0">
          <p
            title={candidate.name}
            className="truncate text-[13px] font-extrabold text-sibs-navy"
          >
            {candidate.name || "—"}
          </p>
          <p
            title={candidate.candidateId}
            className="mt-0.5 truncate text-[11px] font-semibold text-sibs-muted"
          >
            {candidate.candidateId || "—"}
          </p>
        </div>
      </td>

      <td className="border-b border-sibs-border px-4 py-3.5 align-middle">
        <p title={appliedPosition} className="truncate text-[13px] font-bold text-sibs-navy">
          {appliedPosition}
        </p>
        <p title={candidate.skillsLanguage} className="mt-0.5 truncate text-[11px] font-semibold text-sibs-muted">
          Skills: {candidate.skillsLanguage || "—"}
        </p>
      </td>

      <td className="border-b border-sibs-border px-4 py-3.5 align-middle">
        <p title={applicationSource} className="truncate text-[13px] font-semibold text-sibs-navy">
          {applicationSource}
        </p>
        <p title={referrer} className="mt-0.5 truncate text-[11px] font-semibold text-sibs-muted">
          Ref: {referrer}
        </p>
      </td>

      <td className="border-b border-sibs-border px-4 py-3.5 align-middle">
        <p title={preferredLocation} className="truncate text-[13px] font-semibold text-sibs-navy">
          {preferredLocation}
        </p>
        <p title={finalAccount} className="mt-0.5 truncate text-[11px] font-semibold text-sibs-muted">
          Final Account: {finalAccount}
        </p>
      </td>

      <td className="border-b border-sibs-border px-4 py-3.5 text-center align-middle">
        <span
          title={displayStatus}
          className={`mx-auto inline-flex max-w-full items-center justify-center truncate rounded-[10px] border px-2.5 py-1 text-[10px] font-extrabold ${getStatusClass(
            displayStatus,
          )}`}
        >
          {displayStatus}
        </span>
      </td>

      <td className="border-b border-sibs-border px-4 py-3.5 align-middle">
        <p title={lastActivity} className="truncate text-[13px] font-semibold text-sibs-navy">
          {lastActivity}
        </p>
      </td>

      <td className="border-b border-sibs-border px-4 py-3.5 text-right align-middle">
        <button
          type="button"
          onClick={() => setSelectedCandidate(candidate)}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-sibs-border bg-white px-3 text-xs font-extrabold text-sibs-navy outline-none transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light/60 hover:text-sibs-orange focus-visible:ring-2 focus-visible:ring-sibs-orange/25 active:scale-[0.98]"
        >
          <Eye size={14} />
          View
        </button>
      </td>
    </tr>
  );
}