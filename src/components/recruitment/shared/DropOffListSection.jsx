import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Eye,
  Loader2,
  Search,
  X,
} from "lucide-react";

import {
  formatDropOffDate,
  getDropOffBy,
  getDropOffCandidateAccount,
  getDropOffCandidateId,
  getDropOffCandidateName,
  getDropOffCandidateRole,
  getDropOffDate,
  getDropOffReason,
} from "../../../lib/utils/recruitment/dropOffCandidates";

function normalizeDropOffSearchValue(value = "") {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getDropOffCandidateSearchText(candidate = {}) {
  const appliedPosition =
    candidate.openPosition ||
    candidate.open_position ||
    candidate.roleCapability ||
    candidate.role_capability ||
    getDropOffCandidateRole(candidate);

  const preferredLocation =
    candidate.applyingLocation ||
    candidate.applying_location ||
    "";

  const status =
    candidate.dropOffCategory ||
    candidate.drop_off_category ||
    "Drop Off";

  const skills =
    candidate.skillsLanguage ||
    candidate.skills_language ||
    "";

  const rawDropOffDate = getDropOffDate(candidate);

  return [
    getDropOffCandidateName(candidate),
    getDropOffCandidateId(candidate),
    appliedPosition,
    skills,
    preferredLocation,
    getDropOffCandidateAccount(candidate),
    status,
    getDropOffReason(candidate),
    getDropOffBy(candidate),
    rawDropOffDate,
    formatDropOffDate(rawDropOffDate),
  ]
    .map(normalizeDropOffSearchValue)
    .filter(Boolean)
    .join(" ");
}

export default function DropOffListSection({
  candidates = [],
  onViewCandidate,
  isLoading = false,
  loadError = "",
}) {
  const [expanded, setExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const dropOffTableScrollRef = useRef(null);
  const dropOffDragStateRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    scrollLeft: 0,
  });
  const [isDropOffTableDragging, setIsDropOffTableDragging] = useState(false);

  const normalizedSearchQuery = normalizeDropOffSearchValue(searchQuery);

  const filteredCandidates = useMemo(() => {
    if (!normalizedSearchQuery) {
      return candidates;
    }

    return candidates.filter((candidate) =>
      getDropOffCandidateSearchText(candidate).includes(normalizedSearchQuery),
    );
  }, [candidates, normalizedSearchQuery]);

  function handleDropOffTablePointerDown(event) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;

    const interactiveElement = event.target.closest(
      "button, a, input, select, textarea, [role='button']",
    );

    if (interactiveElement) return;

    const container = dropOffTableScrollRef.current;

    if (!container || container.scrollWidth <= container.clientWidth) return;

    dropOffDragStateRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: container.scrollLeft,
    };

    container.setPointerCapture?.(event.pointerId);
    setIsDropOffTableDragging(true);
    event.preventDefault();
  }

  function handleDropOffTablePointerMove(event) {
    const container = dropOffTableScrollRef.current;
    const dragState = dropOffDragStateRef.current;

    if (
      !container ||
      !dragState.active ||
      dragState.pointerId !== event.pointerId
    ) {
      return;
    }

    const distance = event.clientX - dragState.startX;

    container.scrollLeft = dragState.scrollLeft - distance;
    event.preventDefault();
  }

  function stopDropOffTableDragging() {
    const container = dropOffTableScrollRef.current;
    const pointerId = dropOffDragStateRef.current.pointerId;

    if (
      container &&
      pointerId !== null &&
      container.hasPointerCapture?.(pointerId)
    ) {
      try {
        container.releasePointerCapture(pointerId);
      } catch {
        // The browser may already have released pointer capture.
      }
    }

    dropOffDragStateRef.current = {
      active: false,
      pointerId: null,
      startX: 0,
      scrollLeft: container?.scrollLeft || 0,
    };

    setIsDropOffTableDragging(false);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((previousValue) => !previousValue)}
        className="flex w-full items-center justify-between gap-4 border-b border-[#E6ECF2] bg-white px-5 py-4 text-left transition hover:bg-[#F8FAFC]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-700">
            <AlertTriangle size={20} />
          </div>

          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-[#101828]">
              Drop-off List
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-primary-1">
              Review candidates removed from the Talent Pool or Candidate
              Pipeline.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-red-100 bg-red-50 px-3 text-xs font-extrabold text-red-700">
            {candidates.length}
          </span>

          <span className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-3 text-xs font-extrabold text-sibs-primary-1 shadow-sm">
            {expanded ? "Hide" : "Show"}
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="p-5">
          <div className="mb-5 rounded-2xl border border-[#D9E2EC] bg-[#F8FAFC] p-4">
            <label
              htmlFor="drop-off-list-search"
              className="block text-xs font-extrabold uppercase tracking-wide text-[#101828]"
            >
              Search
            </label>

            <div className="relative mt-2">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sibs-primary-1"
              />

              <input
                id="drop-off-list-search"
                type="search"
                value={searchQuery}
                disabled={isLoading}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search drop-off candidates..."
                className="h-11 w-full rounded-xl border border-[#D6DEE8] bg-white pl-11 pr-11 text-sm font-semibold text-[#344054] shadow-sm outline-none transition placeholder:text-[#98A2B3] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear Drop-off List search"
                  className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#667085] transition hover:bg-[#F2F6FA] hover:text-sibs-primary-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-sibs-tertiary-5">
                Showing {filteredCandidates.length} of {candidates.length}{" "}
                drop-off candidates
              </p>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="w-fit text-xs font-extrabold text-sibs-primary-1 transition hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>

          {loadError && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {loadError}
            </div>
          )}

          {isLoading && candidates.length === 0 ? (
            <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-[#D9E2EC] bg-[#F8FAFC] px-5 py-10">
              <div className="flex flex-col items-center text-center">
                <Loader2 size={22} className="animate-spin text-sibs-primary-1" />
                <p className="mt-3 text-sm font-extrabold text-[#101828]">
                  Loading drop-off candidates...
                </p>
              </div>
            </div>
          ) : candidates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D9E2EC] bg-[#F8FAFC] px-5 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#E6ECF2] bg-white text-sibs-tertiary-5">
                <AlertTriangle size={22} />
              </div>

              <p className="mt-3 text-sm font-extrabold text-[#101828]">
                No drop-off candidates
              </p>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Candidates moved to Drop-off will appear here.
              </p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D9E2EC] bg-[#F8FAFC] px-5 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#E6ECF2] bg-white text-sibs-primary-1">
                <Search size={22} />
              </div>

              <p className="mt-3 text-sm font-extrabold text-[#101828]">
                No drop-off candidates match your search.
              </p>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Try searching by candidate, position, location, account,
                status, reason, or date.
              </p>

              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
              >
                Clear search
              </button>
            </div>
          ) : (
            <>
              <div className="hidden lg:block">
                <div
                  ref={dropOffTableScrollRef}
                  onPointerDown={handleDropOffTablePointerDown}
                  onPointerMove={handleDropOffTablePointerMove}
                  onPointerUp={stopDropOffTableDragging}
                  onPointerCancel={stopDropOffTableDragging}
                  onLostPointerCapture={stopDropOffTableDragging}
                  onDragStart={(event) => event.preventDefault()}
                  className={`overflow-x-auto overscroll-x-contain rounded-2xl border border-[#D9E2EC] bg-white sibs-scrollbar ${
                    isDropOffTableDragging
                      ? "cursor-grabbing select-none"
                      : "cursor-grab"
                  }`}
                  aria-label="Drop-off candidates table. Drag left or right to view all drop-off columns."
                >
                  <table className="w-full min-w-[1520px] table-fixed text-left">
                    <thead>
                      <tr className="bg-[#F5F7FA] text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                        <th className="w-[15%] px-6 py-4 text-left">
                          Candidate
                        </th>

                        <th className="w-[17%] px-6 py-4 text-left">
                          Applied Position
                        </th>

                        <th className="w-[18%] px-6 py-4 text-left">
                          Preferred Location / Final Account
                        </th>

                        <th className="w-[12%] px-6 py-4 text-center">
                          Status
                        </th>

                        <th className="w-[20%] px-6 py-4 text-left">
                          Drop-off Reason
                        </th>

                        <th className="w-[11%] px-6 py-4 text-left">Date</th>

                        <th className="w-[130px] whitespace-nowrap px-5 py-4 text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredCandidates.map((candidate) => (
                        <tr
                          key={`${getDropOffCandidateId(candidate)}-${
                            candidate.pipelineRecordId ||
                            candidate.talentPoolRecordId ||
                            getDropOffDate(candidate)
                          }`}
                          className="border-t border-[#E6ECF2] text-sm"
                        >
                          <td className="px-6 py-5 align-middle">
                            <p className="truncate font-extrabold text-[#101828]">
                              {getDropOffCandidateName(candidate)}
                            </p>

                            <p className="mt-1 truncate text-sm font-semibold text-sibs-primary-1">
                              {getDropOffCandidateId(candidate)}
                            </p>
                          </td>

                          <td className="px-6 py-5 align-middle">
                            <p className="truncate font-extrabold text-[#101828]">
                              {candidate.openPosition ||
                                candidate.open_position ||
                                candidate.roleCapability ||
                                candidate.role_capability ||
                                getDropOffCandidateRole(candidate)}
                            </p>

                            <p className="mt-1 truncate text-sm font-semibold text-sibs-primary-1">
                              Skills: {candidate.skillsLanguage || candidate.skills_language || "—"}
                            </p>
                          </td>

                          <td className="px-6 py-5 align-middle">
                            <p className="truncate font-semibold text-[#101828]">
                              {candidate.applyingLocation ||
                                candidate.applying_location ||
                                "—"}
                            </p>

                            <p className="mt-1 truncate text-sm font-semibold text-sibs-primary-1">
                              Final Account: {getDropOffCandidateAccount(candidate)}
                            </p>
                          </td>

                          <td className="px-6 py-5 text-center align-middle">
                            <span className="inline-flex max-w-full rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-extrabold text-red-700">
                              <span className="truncate">
                                {candidate.dropOffCategory ||
                                  candidate.drop_off_category ||
                                  "Drop Off"}
                              </span>
                            </span>
                          </td>

                          <td className="px-6 py-5 align-middle">
                            <p className="line-clamp-2 font-semibold leading-5 text-[#344054]">
                              {getDropOffReason(candidate)}
                            </p>

                            {getDropOffBy(candidate) && (
                              <p className="mt-1 truncate text-xs font-bold text-sibs-primary-1">
                                By: {getDropOffBy(candidate)}
                              </p>
                            )}
                          </td>

                          <td className="px-6 py-5 align-middle">
                            <p className="font-bold text-[#344054]">
                              {formatDropOffDate(getDropOffDate(candidate))}
                            </p>
                          </td>

                          <td className="w-[130px] px-5 py-5 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => onViewCandidate?.(candidate)}
                              className="mx-auto inline-flex h-10 min-w-[96px] items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-extrabold text-sibs-primary-1 transition hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] hover:shadow-sm"
                            >
                              <Eye size={16} />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3 lg:hidden">
                {filteredCandidates.map((candidate) => (
                  <div
                    key={`${getDropOffCandidateId(candidate)}-${
                      candidate.pipelineRecordId ||
                      candidate.talentPoolRecordId ||
                      getDropOffDate(candidate)
                    }-mobile`}
                    className="rounded-2xl border border-[#D9E2EC] bg-[#F8FAFC] p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-extrabold text-[#101828]">
                          {getDropOffCandidateName(candidate)}
                        </h3>

                        <p className="mt-1 truncate text-xs font-bold text-sibs-primary-1">
                          {getDropOffCandidateId(candidate)}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-extrabold text-red-700">
                        {candidate.dropOffCategory ||
                          candidate.drop_off_category ||
                          "Drop Off"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                          Applied Position
                        </p>

                        <p className="mt-1 text-sm font-bold text-sibs-primary-1">
                          {candidate.openPosition ||
                            candidate.open_position ||
                            candidate.roleCapability ||
                            candidate.role_capability ||
                            getDropOffCandidateRole(candidate)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-3">
                        <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                          Preferred Location
                        </p>

                        <p className="mt-1 text-sm font-bold text-sibs-primary-1">
                          {candidate.applyingLocation ||
                            candidate.applying_location ||
                            "—"}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 rounded-xl bg-white p-3 text-sm font-semibold leading-6 text-[#475467]">
                      {getDropOffReason(candidate)}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-xs font-bold text-sibs-tertiary-5">
                        {formatDropOffDate(getDropOffDate(candidate))}
                      </p>

                      <button
                        type="button"
                        onClick={() => onViewCandidate?.(candidate)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
