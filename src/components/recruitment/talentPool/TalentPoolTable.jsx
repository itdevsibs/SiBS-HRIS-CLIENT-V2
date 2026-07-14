import { useEffect, useMemo, useState } from "react";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useTalentPool } from "../../../services/context/TalentPoolContext";
import {
  formatDate,
  getStatusClass,
} from "../../../lib/utils/talentPool/talentPoolHelpers";
import TalentPoolMobileCard from "./TalentPoolMobileCard";


const PAGE_SIZE = 15;

function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "end-ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "start-ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "start-ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "end-ellipsis",
    totalPages,
  ];
}

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

export default function TalentPoolTable() {
  const {
    filteredCandidates,
    setSelectedCandidate,
    isLoading,
    loadError,
  } = useTalentPool();

  const [currentPage, setCurrentPage] = useState(1);

  const totalCandidates = filteredCandidates.length;
  const totalPages = Math.max(1, Math.ceil(totalCandidates / PAGE_SIZE));

  const filteredCandidateKey = useMemo(
    () =>
      filteredCandidates
        .map(
          (candidate) =>
            candidate.id ||
            candidate.candidateId ||
            candidate.email ||
            candidate.name ||
            "",
        )
        .join("|"),
    [filteredCandidates],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredCandidateKey]);

  useEffect(() => {
    setCurrentPage((previousPage) =>
      Math.min(Math.max(previousPage, 1), totalPages),
    );
  }, [totalPages]);

  const pageStartIndex = (currentPage - 1) * PAGE_SIZE;

  const paginatedCandidates = useMemo(
    () =>
      filteredCandidates.slice(
        pageStartIndex,
        pageStartIndex + PAGE_SIZE,
      ),
    [filteredCandidates, pageStartIndex],
  );

  const paginationItems = useMemo(
    () => getPaginationItems(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const showingFrom = totalCandidates > 0 ? pageStartIndex + 1 : 0;
  const showingTo =
    totalCandidates > 0
      ? Math.min(pageStartIndex + paginatedCandidates.length, totalCandidates)
      : 0;

  function goToPage(pageNumber) {
    const nextPage = Math.min(Math.max(pageNumber, 1), totalPages);
    setCurrentPage(nextPage);
  }

  function goToPreviousPage() {
    goToPage(currentPage - 1);
  }

  function goToNextPage() {
    goToPage(currentPage + 1);
  }

  return (
    <div className="px-4 pb-5 pt-6 sm:px-6 sm:pb-6 sm:pt-7">
      {isLoading && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-8 text-center text-sm font-bold text-sibs-primary-1">
          Loading candidates from database...
        </div>
      )}

      {!isLoading && loadError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-8 text-center text-sm font-bold text-red-700">
          {loadError}
        </div>
      )}

      {!isLoading && !loadError && (
        <>
          <div className="space-y-3 lg:hidden">
            {paginatedCandidates.length > 0 ? (
              paginatedCandidates.map((candidate) => (
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
              <table className="w-full min-w-[1300px] table-fixed border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left">
                <thead>
                  <tr className="bg-[#F5F7FA] text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
                    <th className="w-[18%] px-5 py-4 first:rounded-tl-2xl">
                      Candidate
                    </th>

                    <th className="w-[18%] px-5 py-4">
                      Applied Position
                    </th>

                    <th className="w-[24%] px-5 py-4">
                      Preferred Location / Final Account
                    </th>

                    <th className="w-[230px] px-5 py-4 text-center">
                      Status
                    </th>

                    <th className="w-[150px] px-5 py-4">
                      Last Activity
                    </th>

                    <th className="w-[140px] px-5 py-4 text-right last:rounded-tr-2xl">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedCandidates.length > 0 ? (
                    paginatedCandidates.map((candidate) => {
                      const appliedPosition =
                        candidate.openPosition ||
                        candidate.roleCapability ||
                        "—";

                      const preferredLocation =
                        candidate.applyingLocation || "—";

                      const finalAccount =
                        candidate.currentAppliedAccount || "Not assigned yet";

                      const displayStatus =
                        candidate.currentPipelineStage ||
                        candidate.pipelineStage ||
                        candidate.currentStage ||
                        candidate.pipelineStatus ||
                        candidate.status ||
                        "—";

                      const shortStatus = getTalentPoolStatusLabel(displayStatus);

                      const lastActivity = formatDate(
                        candidate.lastPipelineUpdate || candidate.lastActivity,
                      );

                      return (
                        <tr
                          key={candidate.id || candidate.candidateId}
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
                              className={`mx-auto inline-flex max-w-[210px] items-center justify-center rounded-full border px-3 py-1.5 text-center text-[11px] font-extrabold leading-4 ${getStatusClass(
                                displayStatus,
                              )}`}
                            >
                              <span className="line-clamp-2 break-words">
                                {shortStatus}
                              </span>
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
            <div>
              <p className="text-sm font-semibold text-sibs-tertiary-5">
                Showing {showingFrom} to {showingTo} of {totalCandidates}{" "}
                candidate profiles
              </p>

              <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                15 candidates per page
              </p>
            </div>

            {totalCandidates > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  aria-label="Go to previous page"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:border-[#E6ECF2] disabled:hover:bg-white"
                >
                  <ChevronLeft size={16} />
                </button>

                {paginationItems.map((item) => {
                  if (typeof item !== "number") {
                    return (
                      <span
                        key={item}
                        className="flex h-10 min-w-8 items-center justify-center px-1 text-sm font-bold text-sibs-tertiary-5"
                      >
                        ...
                      </span>
                    );
                  }

                  const isActive = item === currentPage;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => goToPage(item)}
                      aria-label={`Go to page ${item}`}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-bold transition ${
                        isActive
                          ? "border-sibs-primary-1 bg-sibs-primary-1 text-white"
                          : "border-[#E6ECF2] bg-white text-sibs-primary-1 hover:border-sibs-primary-1 hover:bg-[#F8FAFC]"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  aria-label="Go to next page"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:border-[#E6ECF2] disabled:hover:bg-white"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}