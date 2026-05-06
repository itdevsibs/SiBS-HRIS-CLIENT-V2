import React from "react";
import { Eye, ArrowRight } from "lucide-react";

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStageClass(stage) {
  switch (stage) {
    case "Sourced":
      return "border-blue-100 bg-blue-50 text-blue-700";
    case "Screened":
      return "border-indigo-100 bg-indigo-50 text-indigo-700";
    case "Interviewed":
      return "border-violet-100 bg-violet-50 text-violet-700";
    case "Offered":
      return "border-amber-100 bg-amber-50 text-amber-700";
    case "Accepted":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "Hired":
      return "border-green-100 bg-green-50 text-green-700";
    case "Drop-offs":
      return "border-red-100 bg-red-50 text-red-700";
    default:
      return "border-gray-100 bg-gray-50 text-gray-600";
  }
}

function getNextStage(currentStage) {
  const normalStageFlow = [
    "Sourced",
    "Screened",
    "Interviewed",
    "Offered",
    "Accepted",
    "Hired",
  ];

  if (currentStage === "Offered") return null;

  const currentIndex = normalStageFlow.indexOf(currentStage);

  if (currentIndex === -1) return null;
  if (currentIndex === normalStageFlow.length - 1) return null;

  return normalStageFlow[currentIndex + 1];
}

function CandidateTableMobileCard({ candidate, onView, onOpenMoveModal }) {
  const nextStage = getNextStage(candidate.currentStage);

  return (
    <div className="w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC]">
      <button type="button" onClick={onView} className="block w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="whitespace-nowrap text-xs font-bold text-sibs-primary-1">
              {candidate.candidateId}
            </p>

            <h3 className="mt-1 break-words text-sm font-bold leading-5 text-[#101828]">
              {candidate.name}
            </h3>

            <p className="mt-1 break-words text-xs font-semibold leading-5 text-sibs-tertiary-5">
              {candidate.roleAccount}
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStageClass(
              candidate.currentStage
            )}`}
          >
            {candidate.currentStage}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="min-w-0 rounded-xl bg-[#F8FAFC] p-3">
            <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
              Owner
            </p>

            <p className="mt-1 break-words text-xs font-bold leading-5 text-[#344054]">
              {candidate.owner || "—"}
            </p>
          </div>

          <div className="min-w-0 rounded-xl bg-[#F8FAFC] p-3">
            <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
              Source
            </p>

            <p className="mt-1 break-words text-xs font-bold leading-5 text-[#344054]">
              {candidate.source || "—"}
            </p>
          </div>
        </div>

        <div className="mt-3 text-xs font-semibold leading-5 text-sibs-tertiary-5">
          Date Moved:{" "}
          <span className="font-bold text-[#344054]">
            {formatDate(candidate.dateMoved)}
          </span>
        </div>

        {candidate.dropOffReason && (
          <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold leading-5 text-red-700">
            {candidate.dropOffReason}
          </div>
        )}
      </button>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onView}
          className={`inline-flex h-9 min-w-0 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-3 text-xs font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5 ${
            nextStage ? "flex-1" : "w-full"
          }`}
        >
          <Eye size={15} className="shrink-0" />
          <span>View</span>
        </button>

        {nextStage && (
          <button
            type="button"
            onClick={() => onOpenMoveModal(candidate)}
            className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-3 text-xs font-bold text-white transition hover:opacity-90"
          >
            <ArrowRight size={15} className="shrink-0" />
            <span>Move</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function TableTab({
  filteredCandidates,
  onViewCandidate,
  onOpenMoveModal,
}) {
  return (
    <>
      <div className="space-y-3 lg:hidden">
        {filteredCandidates.length > 0 ? (
          filteredCandidates.map((candidate) => (
            <CandidateTableMobileCard
              key={candidate.id}
              candidate={candidate}
              onView={() => onViewCandidate(candidate)}
              onOpenMoveModal={onOpenMoveModal}
            />
          ))
        ) : (
          <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
            No candidate movement records found.
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-[#E6ECF2] lg:block">
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full min-w-[1200px] border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
              <tr className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                <th className="px-5 py-4">Candidate</th>
                <th className="px-5 py-4">Role / Account</th>
                <th className="px-5 py-4">Previous Stage</th>
                <th className="px-5 py-4">Current Stage</th>
                <th className="px-5 py-4">Owner</th>
                <th className="px-5 py-4">Source</th>
                <th className="px-5 py-4">Date Moved</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((candidate) => {
                  const nextStage = getNextStage(candidate.currentStage);

                  return (
                    <tr
                      key={candidate.id}
                      className="transition hover:bg-[#F8FAFC]"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-[#101828]">
                          {candidate.name}
                        </p>

                        <p className="text-xs font-semibold text-sibs-tertiary-5">
                          {candidate.email}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm font-bold text-sibs-primary-1">
                        {candidate.roleAccount}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                        {candidate.previousStage || "Initial Entry"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStageClass(
                            candidate.currentStage
                          )}`}
                        >
                          {candidate.currentStage}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                        {candidate.owner}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                        {candidate.source}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                        {formatDate(candidate.dateMoved)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onViewCandidate(candidate)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 py-2 text-xs font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5"
                          >
                            <Eye size={15} />
                            View
                          </button>

                          {nextStage && (
                            <button
                              type="button"
                              onClick={() => onOpenMoveModal(candidate)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
                            >
                              <ArrowRight size={15} />
                              Move
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                  >
                    No candidate movement records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}