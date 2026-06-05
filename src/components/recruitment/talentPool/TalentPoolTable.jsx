import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useTalentPool } from "../../../services/context/TalentPoolContext";
import {
  formatDate,
  formatList,
  getStatusClass,
} from "../../../lib/utils/talentPool/talentPoolHelpers";
import TalentPoolMobileCard from "./TalentPoolMobileCard";

function getStageDotClass(status) {
  switch (status) {
    case "Initial Screening":
      return "bg-blue-500";

    case "Online Assessment":
      return "bg-cyan-500";

    case "Interview Scheduled":
      return "bg-indigo-500";

    case "Interviewed":
      return "bg-violet-500";

    case "Offered":
      return "bg-amber-500";

    case "Accepted":
    case "For NHO":
    case "Hired / Active":
      return "bg-emerald-500";

    case "Drop-off":
    case "Do Not Reprocess":
    case "Failed":
      return "bg-red-500";

    case "Withdrawn":
      return "bg-gray-500";

    case "New Applicant":
      return "bg-purple-500";

    case "Silver Pool":
      return "bg-blue-500";

    case "Recyclable":
      return "bg-amber-500";

    default:
      return "bg-gray-400";
  }
}

export default function TalentPoolTable() {
  const { filteredCandidates, candidateList, setSelectedCandidate } =
    useTalentPool();

  return (
    <div className="px-4 pb-5 pt-6 sm:px-6 sm:pb-6 sm:pt-7">
      <div className="space-y-3 lg:hidden">
        {filteredCandidates.length > 0 ? (
          filteredCandidates.map((candidate) => (
            <TalentPoolMobileCard key={candidate.id} candidate={candidate} />
          ))
        ) : (
          <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
            No candidate profiles found.
          </div>
        )}
      </div>

      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] table-fixed border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left">
            <thead>
              <tr className="bg-[#F5F7FA] text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
                <th className="w-[16%] px-5 py-4 first:rounded-tl-2xl">
                  Candidate
                </th>
                <th className="w-[18%] px-5 py-4">Applied Position</th>
                {/* <th className="w-[17%] px-5 py-4">Application Source</th> */}
                <th className="w-[17%] px-5 py-4">
                  Preferred Location / Final Account
                </th>
                <th className="w-[14%] px-5 py-4 text-center">Status</th>
                <th className="w-[10%] px-5 py-4">Last Activity</th>
                <th className="w-[10%] px-5 py-4 text-right last:rounded-tr-2xl">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((candidate) => {
                  const appliedPosition =
                    candidate.openPosition || candidate.roleCapability || "—";

                  const preferredLocation = candidate.applyingLocation || "—";
                  const finalAccount =
                    candidate.currentAppliedAccount || "Not assigned yet";

                  const displayStatus =
                    candidate.currentPipelineStage ||
                    candidate.pipelineStage ||
                    candidate.currentStage ||
                    candidate.status ||
                    "—";

                  return (
                    <tr
                      key={candidate.id}
                      className="transition hover:bg-[#FAFBFC]"
                    >
                      <td className="border-b border-[#E6ECF2] px-5 py-5 align-middle">
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <p
                              title={candidate.name}
                              className="min-w-0 truncate text-sm font-extrabold text-[#101828]"
                            >
                              {candidate.name || "—"}
                            </p>

                            {candidate.isPublicSubmission && (
                              <span
                                title="Public Submission"
                                className="shrink-0 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700"
                              >
                                Public
                              </span>
                            )}
                          </div>

                          <p
                            title={candidate.candidateId}
                            className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5"
                          >
                            {candidate.candidateId || "—"}
                          </p>
                        </div>
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 align-middle">
                        <div className="min-w-0">
                          <p
                            title={appliedPosition}
                            className="truncate text-sm font-bold text-sibs-primary-1"
                          >
                            {appliedPosition}
                          </p>

                          <p
                            title={candidate.skillsLanguage || "—"}
                            className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5"
                          >
                            Skills: {candidate.skillsLanguage || "—"}
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
                            className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5"
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
                          title={formatDate(
                            candidate.lastPipelineUpdate ||
                              candidate.lastActivity,
                          )}
                          className="truncate text-sm font-semibold text-[#344054]"
                        >
                          {formatDate(
                            candidate.lastPipelineUpdate ||
                              candidate.lastActivity,
                          )}
                        </p>
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-right align-middle">
                        <button
                          type="button"
                          onClick={() => setSelectedCandidate(candidate)}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] hover:shadow-sm"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                  >
                    No candidate profiles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <p className="text-sm font-semibold text-sibs-tertiary-5">
          Showing 1 to {filteredCandidates.length} of {candidateList.length}{" "}
          candidate profiles
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white text-gray-500 transition hover:bg-gray-50"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-sibs-primary-1 text-sm font-bold text-white"
          >
            1
          </button>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white text-gray-500 transition hover:bg-gray-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
