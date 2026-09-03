import { useMemo, useState } from "react";
import { AlertCircle, LoaderCircle, UsersRound } from "lucide-react";
import { useTalentPool } from "../../../services/context/TalentPoolContext";
import PaginationTable from "../../../services/pagination/PaginationTable";
import {
  formatDate,
  getStatusClass,
} from "../../../lib/utils/talentPool/talentPoolHelpers";
import { isUnder18Candidate } from "../../../lib/utils/talentPool/talentPoolTabs";
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

function cleanText(value) {
  return String(value ?? "").trim();
}

function getTalentPoolStatusClass(status = "") {
  const value = String(status || "").trim().toLowerCase();

  if (value === "under age") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return getStatusClass(status);
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
        <IconComponent
          className={`h-4.5 w-4.5 ${spin ? "animate-spin" : ""}`}
        />
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

export default function TalentPoolTable({
  candidates = null,
  emptyTitle = "No candidate profiles found",
  emptyMessage = "Try changing or clearing the current search filters.",
  recordLabel = "candidate profiles",
}) {
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

  const displayedCandidates = Array.isArray(candidates)
    ? candidates
    : filteredCandidates;
  const totalCandidates = displayedCandidates.length;
  const totalPages = Math.max(1, Math.ceil(totalCandidates / PAGE_SIZE));

  const filteredCandidateKey = useMemo(
    () =>
      displayedCandidates
        .map(
          (candidate) =>
            candidate.id ||
            candidate.candidateId ||
            candidate.email ||
            candidate.name ||
            "",
        )
        .join("|"),
    [displayedCandidates],
  );

  const currentPage = Math.min(
    Math.max(pageState.key === filteredCandidateKey ? pageState.page : 1, 1),
    totalPages,
  );

  const pageStartIndex = (currentPage - 1) * PAGE_SIZE;

  const paginatedCandidates = useMemo(
    () => displayedCandidates.slice(pageStartIndex, pageStartIndex + PAGE_SIZE),
    [displayedCandidates, pageStartIndex],
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
    <div className="font-jakarta">
      {isLoading ? (
        <div className="py-4">
          <TableState
            icon={LoaderCircle}
            title="Loading candidates"
            message="Retrieving current candidate profiles from the database."
            spin
          />
        </div>
      ) : null}

      {!isLoading && loadError ? (
        <div className="py-4">
          <TableState
            icon={AlertCircle}
            title="Candidate directory unavailable"
            message={loadError}
            tone="error"
          />
        </div>
      ) : null}

      {!isLoading && !loadError ? (
        <>
          <div className="space-y-3 pt-3 lg:hidden">
            {paginatedCandidates.length > 0 ? (
              paginatedCandidates.map((candidate, index) => (
                <TalentPoolMobileCard
                  key={candidate.id || candidate.candidateId}
                  candidate={candidate}
                  index={index}
                />
              ))
            ) : (
              <TableState
                icon={UsersRound}
                title={emptyTitle}
                message={emptyMessage}
              />
            )}
          </div>

          <div className="hidden lg:block">
            <div className="overflow-x-auto rounded-b-xl border border-t-0 border-sibs-border bg-white">
              <table className="w-full min-w-[980px] 2xl:min-w-[1060px] table-fixed border-separate border-spacing-0 text-left">
                <thead className="sibs-data-table-head">
                  <tr className="sibs-data-table-head-row">
                    <th className="sibs-data-table-th w-[23%] px-3 py-2.5 2xl:px-4 2xl:py-3.5 text-left sibs-text-micro font-black uppercase tracking-wider text-sibs-navy">
                      Candidate
                    </th>
                    <th className="sibs-data-table-th w-[22%] px-3 py-2.5 2xl:px-4 2xl:py-3.5 text-left sibs-text-micro font-black uppercase tracking-wider text-sibs-navy">
                      Applied Position
                    </th>
                    <th className="sibs-data-table-th w-[25%] px-3 py-2.5 2xl:px-4 2xl:py-3.5 text-left sibs-text-micro font-black uppercase tracking-wider text-sibs-navy">
                      Preferred Location / Final Account
                    </th>
                    <th className="sibs-data-table-th w-[15%] px-3 py-2.5 2xl:px-4 2xl:py-3.5 text-center sibs-text-micro font-black uppercase tracking-wider text-sibs-navy">
                      Status
                    </th>
                    <th className="sibs-data-table-th w-[15%] px-3 py-2.5 2xl:px-4 2xl:py-3.5 text-center sibs-text-micro font-black uppercase tracking-wider text-sibs-navy">
                      Last Activity
                    </th>
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
                        candidate.currentAppliedAccount || "";

                      const displayStatus = isUnder18Candidate(candidate)
                        ? "Under Age"
                        : candidate.currentPipelineStage ||
                          candidate.pipelineStage ||
                          candidate.currentStage ||
                          candidate.pipelineStatus ||
                          candidate.status ||
                          "—";

                      const shortStatus =
                        getTalentPoolStatusLabel(displayStatus);

                      const lastActivity = formatDate(
                        candidate.lastPipelineUpdate || candidate.lastActivity,
                      );
                      const leadId = cleanText(
                        candidate.leadId ||
                          candidate.lead_id ||
                          candidate.applicantLeadId ||
                          candidate.applicant_lead_id ||
                          candidate.sourceLeadId ||
                          candidate.source_lead_id,
                      );
                      const talentPoolId =
                        candidate.candidateId ||
                        candidate.candidate_id ||
                        candidate.publicTalentPoolId ||
                        candidate.public_talent_pool_id ||
                        candidate.talentPoolCandidateId ||
                        candidate.talent_pool_candidate_id ||
                        candidate.talentPoolApplicationId ||
                        candidate.talent_pool_application_id ||
                        "";
                      const showsLeadAndTalentPoolIds =
                        Boolean(candidate.isConvertedLead) || Boolean(leadId);

                      return (
                        <tr
                          key={candidate.id || candidate.candidateId}
                          role="button"
                          tabIndex={0}
                          onClick={() => openCandidate(candidate)}
                          onKeyDown={(event) =>
                            handleRowKeyDown(event, candidate)
                          }
                          className="sibs-page-card-in cursor-pointer transition hover:bg-[#F8FAFC] focus-visible:bg-[#FFF9F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sibs-orange/25"
                          style={{
                            animationDelay: `${index * 35}ms`,
                            animationFillMode: "both",
                          }}
                        >
                          <td className="border-b border-sibs-border px-3 py-2 2xl:px-4 2xl:py-2.5 align-middle">
                            <div className="min-w-0">
                              <div className="flex min-w-0 items-center gap-1.5 2xl:gap-2">
                                <p
                                  title={candidate.name}
                                  className="min-w-0 truncate sibs-text-xs font-extrabold tracking-tight text-sibs-navy"
                                >
                                  {candidate.name || "—"}
                                </p>

                                {candidate.isPublicSubmission &&
                                !showsLeadAndTalentPoolIds ? (
                                  <span
                                    title="Public Submission"
                                    className="shrink-0 rounded border border-purple-200 bg-purple-50 px-1.5 py-0.2 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-purple-700"
                                  >
                                    Public
                                  </span>
                                ) : (
                                  <span
                                    title="Public Submission"
                                    className="shrink-0 rounded border border-green-200 bg-green-50 px-1.5 py-0.2 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-green-700"
                                  >
                                    Lead
                                  </span>
                                )}
                              </div>

                              {showsLeadAndTalentPoolIds ? (
                                <div className="mt-0.5 space-y-0.5">
                                  <p
                                    title={leadId}
                                    className="truncate font-mono text-[10px] 2xl:text-[11px] font-semibold text-sibs-text-muted tracking-tight"
                                  >
                                    Talent Pool ID: {leadId || "—"}
                                  </p>
                                  <p
                                    title={talentPoolId}
                                    className="truncate font-mono text-[10px] 2xl:text-[11px] font-extrabold text-emerald-700 tracking-tight"
                                  >
                                    Lead ID: {talentPoolId || "—"}
                                  </p>
                                </div>
                              ) : (
                                <p
                                  title={candidate.candidateId}
                                  className="mt-0.5 truncate font-mono text-[10px] 2xl:text-[11px] font-semibold text-sibs-text-muted tracking-tight"
                                >
                                  Talent Pool ID: {candidate.candidateId || "—"}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="border-b border-sibs-border px-3 py-2 2xl:px-4 2xl:py-2.5 align-middle">
                            <p
                              title={appliedPosition}
                              className="truncate sibs-text-xs font-bold text-sibs-navy"
                            >
                              {appliedPosition}
                            </p>
                            <p
                              title={candidate.skillsLanguage || "—"}
                              className="mt-0.5 truncate text-[10px] 2xl:text-[11px] font-medium text-sibs-text-muted"
                            >
                              Skills: {candidate.skillsLanguage || "—"}
                            </p>
                          </td>

                          <td className="border-b border-sibs-border px-3 py-2 2xl:px-4 2xl:py-2.5 align-middle">
                            <p
                              title={preferredLocation}
                              className="truncate sibs-text-xs font-bold text-sibs-navy"
                            >
                              {preferredLocation}
                            </p>
                            <p
                              title={finalAccount}
                              className="mt-0.5 truncate text-[10px] 2xl:text-[11px] font-medium text-sibs-text-muted"
                            >
                              Final Account: {finalAccount}
                            </p>
                          </td>

                          <td className="border-b border-sibs-border px-3 py-2 2xl:px-4 2xl:py-2.5 text-center align-middle">
                            <span
                              title={displayStatus}
                              className={`mx-auto inline-flex max-w-[195px] items-center justify-center rounded-lg border px-2.5 py-1 text-center text-[10px] 2xl:text-[10.5px] font-extrabold leading-tight shadow-2xs ${getTalentPoolStatusClass(
                                displayStatus,
                              )}`}
                            >
                              <span className="line-clamp-2 break-words">
                                {shortStatus}
                              </span>
                            </span>
                          </td>

                          <td className="border-b border-sibs-border px-3 py-2 2xl:px-4 2xl:py-2.5 text-center align-middle">
                            <p
                              title={lastActivity}
                              className="truncate sibs-text-xs font-semibold text-sibs-text-secondary whitespace-nowrap"
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
                            {emptyTitle}
                          </p>
                          <p className="mt-1 text-xs font-medium">
                            {emptyMessage}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <PaginationTable
            showSearch={false}
            showPagination
            showCount
            loading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            loadedCount={paginatedCandidates.length}
            totalRecords={totalCandidates}
            recordLabel={recordLabel}
            onPrevious={goToPreviousPage}
            onNext={goToNextPage}
            className="border-0 bg-transparent p-0 shadow-none"
          />
        </>
      ) : null}
    </div>
  );
}
