import { useTalentPool } from "../../../services/context/TalentPoolContext";
import { getStatusClass } from "../../../lib/utils/talentPool/talentPoolHelpers";

export default function TalentPoolMobileCard({ candidate }) {
  const { setSelectedCandidate } = useTalentPool();

  return (
    <button
      type="button"
      onClick={() => setSelectedCandidate(candidate)}
      className="w-full rounded-xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-sibs-primary-1">
            {candidate.candidateId}
          </p>

          <h3 className="mt-1 text-sm font-bold text-[#101828]">
            {candidate.name}
          </h3>

          <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
            {candidate.email}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
            candidate.status,
          )}`}
        >
          {candidate.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Position
          </p>
          <p className="mt-1 text-xs font-bold text-[#344054]">
            {candidate.openPosition || candidate.roleCapability || "—"}
          </p>
        </div>

        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Location
          </p>
          <p className="mt-1 text-xs font-bold text-[#344054]">
            {candidate.applyingLocation || "—"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-bold text-gray-600">
          {candidate.source || "—"}
        </span>

        {candidate.isPublicSubmission && (
          <span className="inline-flex rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-700">
            Public Submission
          </span>
        )}
      </div>
    </button>
  );
}
