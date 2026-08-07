import { useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  UsersRound,
} from "lucide-react";
import { useTalentPool } from "../../../services/context/TalentPoolContext";
import {
  formatDate,
  getStatusClass,
} from "../../../lib/utils/talentPool/talentPoolHelpers";
import TalentPoolMobileCard from "./TalentPoolMobileCard";

const PAGE_SIZE = 15;

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

function TableState({ icon, title, message, tone = "neutral", spin = false }) {
  const IconComponent = icon;

  const toneClasses = {
    neutral: "border-[#D9E2EC] bg-[#F8FAFC] text-[#667085]",
    error: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <div
      className={`flex min-h-[150px] flex-col items-center justify-center rounded-xl border border-dashed px-5 py-8 text-center ${
        toneClasses[tone] || toneClasses.neutral
      }`}
      role={tone === "error" ? "alert" : "status"}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80">
        <IconComponent className={`h-4.5 w-4.5 ${spin ? "animate-spin" : ""}`} />
      </span>
      <p className="mt-2 text-[13px] font-extrabold">{title}</p>
      {message ? (
        <p className="mt-1 max-w-md text-xs font-medium leading-5 opacity-85">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export default function TalentPoolTable() {
  const {
    filteredCandidates,
    setSelectedCandidate,
    statusFilter,
    isLoading,
    loadError,
  } = useTalentPool();

  const [pageState, setPageState] = useState({
    key: "",
    page: 1,
  });

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

  const currentPage = Math.min(
    Math.max(
      pageState.key === filteredCandidateKey ? pageState.page : 1,
      1,
    ),
    totalPages,
  );

  const pageStartIndex = (currentPage - 1) * PAGE_SIZE;

  const paginatedCandidates = useMemo(
    () =>
      filteredCandidates.slice(
        pageStartIndex,
        pageStartIndex + PAGE_SIZE,
      ),
    [filteredCandidates, pageStartIndex],
  );

  function goToPage(pageNumber) {
    const nextPage = Math.min(Math.max(pageNumber, 1), totalPages);
    setPageState({
      key: filteredCandidateKey,
      page: nextPage,
    });
  }

  function goToPreviousPage() {
    goToPage(currentPage - 1);
  }

  function goToNextPage() {
    goToPage(currentPage + 1);
  }

  function openCandidate(candidate) {
    setSelectedCandidate(candidate);
  }

  function handleRowKeyDown(event, candidate) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openCandidate(candidate);
  }

  return (
    <div className="p-4 font-jakarta sm:p-5">
      {isLoading ? (
        <TableState
          icon={LoaderCircle}
          title="Loading candidates"
          message="Retrieving current candidate profiles from the database."
          spin
        />
      ) : null}

      {!isLoading && loadError ? (
        <TableState
          icon={AlertCircle}
          title="Candidate directory unavailable"
          message={loadError}
          tone="error"
        />
      ) : null}

      {!isLoading && !loadError ? (
        <>
          <div className="space-y-3 lg:hidden">
            {paginatedCandidates.length > 0 ? (
              paginatedCandidates.map((candidate) => (
                <TalentPoolMobileCard
                  key={candidate.id || candidate.candidateId}
                  candidate={candidate}
                />
              ))
            ) : (
              <TableState
                icon={UsersRound}
                title="No candidate profiles found"
                message="Try changing or clearing the current search filters."
              />
            )}
          </div>

          <div className="hidden lg:block">
            <div className="overflow-x-auto rounded-xl border border-[#E6ECF2] bg-white">
              <table className="w-full min-w-[1060px] table-fixed border-separate border-spacing-0 text-left">
                <thead className="sibs-data-table-head">
                  <tr className="sibs-data-table-head-row">
                    <th className="sibs-data-table-th w-[23%] text-left">Candidate</th>
                    <th className="sibs-data-table-th w-[23%] text-left">Applied Position</th>
                    <th className="sibs-data-table-th w-[26%] text-left">
                      Preferred Location / Final Account
                    </th>
                    <th className="sibs-data-table-th w-[14%] text-center">Status</th>
                    <th className="sibs-data-table-th w-[14%] text-center">Last Activity</th>
                  </tr>
                </thead>

                <tbody key={statusFilter || "All"}>
                  {paginatedCandidates.length > 0 ? (
                    paginatedCandidates.map((candidate, index) => {
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
                          role="button"
                          tabIndex={0}
                          onClick={() => openCandidate(candidate)}
                          onKeyDown={(event) => handleRowKeyDown(event, candidate)}
                          className="sibs-page-card-in cursor-pointer transition hover:bg-[#FFF9F6] focus-visible:bg-[#FFF9F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF5C28]/25"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <td className="border-b border-[#E6ECF2] px-4 py-3.5 align-middle">
                            <div className="min-w-0">
                              <div className="flex min-w-0 items-center gap-2">
                                <p
                                  title={candidate.name}
                                  className="min-w-0 truncate text-xs font-extrabold text-[#042C51]"
                                >
                                  {candidate.name || "—"}
                                </p>

                                {candidate.isPublicSubmission ? (
                                  <span
                                    title="Public Submission"
                                    className="shrink-0 rounded-md border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-normal text-purple-700"
                                  >
                                    Public
                                  </span>
                                ) : null}
                              </div>

                              <p
                                title={candidate.candidateId}
                                className="mt-0.5 truncate text-[11px] font-semibold text-[#667085]"
                              >
                                {candidate.candidateId || "—"}
                              </p>
                            </div>
                          </td>

                          <td className="border-b border-[#E6ECF2] px-4 py-3.5 align-middle">
                            <p
                              title={appliedPosition}
                              className="truncate text-xs font-bold text-[#344054]"
                            >
                              {appliedPosition}
                            </p>
                            <p
                              title={candidate.skillsLanguage || "—"}
                              className="mt-0.5 truncate text-[11px] font-semibold text-[#667085]"
                            >
                              Skills: {candidate.skillsLanguage || "—"}
                            </p>
                          </td>

                          <td className="border-b border-[#E6ECF2] px-4 py-3.5 align-middle">
                            <p
                              title={preferredLocation}
                              className="truncate text-xs font-semibold text-[#344054]"
                            >
                              {preferredLocation}
                            </p>
                            <p
                              title={finalAccount}
                              className="mt-0.5 truncate text-[11px] font-semibold text-[#667085]"
                            >
                              Final Account: {finalAccount}
                            </p>
                          </td>

                          <td className="border-b border-[#E6ECF2] px-4 py-3.5 text-center align-middle">
                            <span
                              title={displayStatus}
                              className={`mx-auto inline-flex max-w-[195px] items-center justify-center rounded-lg border px-2.5 py-1 text-center text-[10px] font-extrabold leading-4 ${getStatusClass(
                                displayStatus,
                              )}`}
                            >
                              <span className="line-clamp-2 break-words">
                                {shortStatus}
                              </span>
                            </span>
                          </td>

                          <td className="border-b border-[#E6ECF2] px-4 py-3.5 text-center align-middle">
                            <p
                              title={lastActivity}
                              className="truncate text-[12px] font-semibold text-[#344054]"
                            >
                              {lastActivity}
                            </p>
                          </td>

                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-12">
                        <div className="flex flex-col items-center text-center text-[#667085]">
                          <UsersRound className="h-6 w-6" />
                          <p className="mt-2 text-[13px] font-extrabold">
                            No candidate profiles found
                          </p>
                          <p className="mt-1 text-xs font-medium">
                            Try changing or clearing the current filters.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sibs-pagination sibs-pagination--compact mt-4">
            <p className="sibs-pagination__summary">
              Showing <span>{paginatedCandidates.length}</span> loaded candidate profiles
              {totalCandidates > 0 ? (
                <>
                  {" "}
                  out of <span>{totalCandidates}</span>
                </>
              ) : null}
            </p>

            {totalCandidates > 0 ? (
              <div className="sibs-pagination__controls">
                <button
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  aria-label="Go to previous page"
                  className="sibs-pagination__button h-10 gap-1.5 px-3 sm:px-4"
                >
                  <ChevronLeft size={15} />
                  <span>Previous</span>
                </button>

                <span className="sibs-pagination__page is-active h-10 px-3 sm:px-4">
                  Page {currentPage}
                  {totalPages > 1 ? ` of ${totalPages}` : ""}
                </span>

                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  aria-label="Go to next page"
                  className="sibs-pagination__button h-10 gap-1.5 px-3 sm:px-4"
                >
                  <span>Next</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
