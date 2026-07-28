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
  const finalAccount = candidate.currentAppliedAccount || "Not assigned yet";

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
    <tr className="transition hover:bg-[#FAFBFC]">
      <td className="border-b border-[#E6ECF2] px-4 py-3.5 align-middle">
        <div className="min-w-0">
          <p
            title={candidate.name}
            className="truncate text-[13px] font-extrabold text-[#042C51]"
          >
            {candidate.name || "—"}
          </p>
          <p
            title={candidate.candidateId}
            className="mt-0.5 truncate text-[11px] font-semibold text-[#667085]"
          >
            {candidate.candidateId || "—"}
          </p>
        </div>
      </td>

      <td className="border-b border-[#E6ECF2] px-4 py-3.5 align-middle">
        <p title={appliedPosition} className="truncate text-[13px] font-bold text-[#344054]">
          {appliedPosition}
        </p>
        <p title={candidate.skillsLanguage} className="mt-0.5 truncate text-[11px] font-semibold text-[#667085]">
          Skills: {candidate.skillsLanguage || "—"}
        </p>
      </td>

      <td className="border-b border-[#E6ECF2] px-4 py-3.5 align-middle">
        <p title={applicationSource} className="truncate text-[13px] font-semibold text-[#344054]">
          {applicationSource}
        </p>
        <p title={referrer} className="mt-0.5 truncate text-[11px] font-semibold text-[#667085]">
          Ref: {referrer}
        </p>
      </td>

      <td className="border-b border-[#E6ECF2] px-4 py-3.5 align-middle">
        <p title={preferredLocation} className="truncate text-[13px] font-semibold text-[#344054]">
          {preferredLocation}
        </p>
        <p title={finalAccount} className="mt-0.5 truncate text-[11px] font-semibold text-[#667085]">
          Final Account: {finalAccount}
        </p>
      </td>

      <td className="border-b border-[#E6ECF2] px-4 py-3.5 text-center align-middle">
        <span
          title={displayStatus}
          className={`mx-auto inline-flex max-w-full items-center justify-center truncate rounded-lg border px-2.5 py-1 text-[10px] font-extrabold ${getStatusClass(
            displayStatus,
          )}`}
        >
          {displayStatus}
        </span>
      </td>

      <td className="border-b border-[#E6ECF2] px-4 py-3.5 align-middle">
        <p title={lastActivity} className="truncate text-[13px] font-semibold text-[#344054]">
          {lastActivity}
        </p>
      </td>

      <td className="border-b border-[#E6ECF2] px-4 py-3.5 text-right align-middle">
        <button
          type="button"
          onClick={() => setSelectedCandidate(candidate)}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#D6DEE8] bg-white px-3 text-xs font-extrabold text-[#042C51] outline-none transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] focus-visible:ring-2 focus-visible:ring-[#FF5C28]/25 active:scale-[0.98]"
        >
          <Eye size={14} />
          View
        </button>
      </td>
    </tr>
  );
}