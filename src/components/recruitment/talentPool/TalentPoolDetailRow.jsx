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
      <td className="border-b border-[#E6ECF2] px-5 py-5 align-middle">
        <div className="min-w-0">
          <p
            title={candidate.name}
            className="truncate text-sm font-extrabold text-[#101828]"
          >
            {candidate.name || "—"}
          </p>

          <p
            title={candidate.candidateId}
            className="mt-1 truncate text-xs font-semibold text-sibs-primary-1"
          >
            {candidate.candidateId || "—"}
          </p>
        </div>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5 align-middle">
        <div className="min-w-0">
          <p
            title={appliedPosition}
            className="truncate text-sm font-bold text-[#101828]"
          >
            {appliedPosition}
          </p>

          <p
            title={candidate.skillsLanguage}
            className="mt-1 truncate text-xs font-semibold text-sibs-primary-1"
          >
            Skills: {candidate.skillsLanguage || "—"}
          </p>
        </div>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5 align-middle">
        <div className="min-w-0">
          <p
            title={applicationSource}
            className="truncate text-sm font-semibold text-[#344054]"
          >
            {applicationSource}
          </p>

          <p
            title={referrer}
            className="mt-1 truncate text-xs font-semibold text-sibs-primary-1"
          >
            Ref: {referrer}
          </p>
        </div>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5 align-middle">
        <div className="min-w-0">
          <p
            title={preferredLocation}
            className="truncate text-sm font-semibold text-[#344054]"
          >
            {preferredLocation}
          </p>

          <p
            title={finalAccount}
            className="mt-1 truncate text-xs font-semibold text-sibs-primary-1"
          >
            Final Account: {finalAccount}
          </p>
        </div>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5 text-center align-middle">
        <span
          title={displayStatus}
          className={`mx-auto inline-flex max-w-full items-center justify-center truncate rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
            displayStatus,
          )}`}
        >
          {displayStatus}
        </span>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5 align-middle">
        <p
          title={lastActivity}
          className="truncate text-sm font-semibold text-[#344054]"
        >
          {lastActivity}
        </p>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5 text-right align-middle">
        <button
          type="button"
          onClick={() => setSelectedCandidate(candidate)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC] hover:shadow-sm"
        >
          <Eye size={16} />
          View
        </button>
      </td>
    </tr>
  );
}
