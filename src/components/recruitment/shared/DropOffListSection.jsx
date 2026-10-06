import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
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
  const suppressDropOffRowClickRef = useRef(false);
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
      "button, a, input, select, textarea",
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

    if (Math.abs(distance) > 5) {
      suppressDropOffRowClickRef.current = true;
    }

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

  function openDropOffCandidate(candidate) {
    if (suppressDropOffRowClickRef.current) {
      suppressDropOffRowClickRef.current = false;
      return;
    }

    onViewCandidate?.(candidate);
  }

  function handleDropOffCandidateKeyDown(event, candidate) {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    onViewCandidate?.(candidate);
  }

  return (
    <section className="sibs-page-card-in overflow-hidden rounded-2xl border border-sibs-border bg-white font-jakarta shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((previousValue) => !previousValue)}
        className="flex w-full items-center justify-between gap-4 border-b border-sibs-border bg-white px-4 py-5 text-left transition hover:bg-sibs-cream-light/40 sm:px-5"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-700">
            <AlertTriangle size={17} />
          </div>

          <div className="min-w-0">
            <h2 className="sibs-section-title">
              Drop-off List
            </h2>

            <p className="sibs-section-subtitle">
              Review candidates removed from the Talent Pool or Candidate
              Pipeline.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-red-100 bg-red-50 px-3 text-xs font-extrabold text-red-700">
            {candidates.length}
          </span>

          <span className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-sibs-border bg-white px-3 text-xs font-extrabold text-sibs-primary-1 shadow-sm">
            {expanded ? "Hide" : "Show"}
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="p-4 sm:p-5">
          <div className="mb-5 rounded-xl border border-sibs-border bg-white p-4">
            <label
              htmlFor="drop-off-list-search"
              className="mb-1.5 block font-jakarta text-xs font-extrabold tracking-normal text-sibs-navy"
            >
              Search
            </label>

            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sibs-muted"
              />

              <input
                id="drop-off-list-search"
                type="search"
                value={searchQuery}
                disabled={isLoading}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search drop-off candidates..."
                className="h-10 w-full rounded-[10px] border border-sibs-border bg-sibs-surface pl-9 pr-11 text-xs font-semibold text-sibs-navy outline-none transition placeholder:text-sibs-muted hover:border-sibs-orange/40 hover:bg-white focus:border-sibs-orange focus:bg-white focus:ring-4 focus:ring-sibs-orange/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear Drop-off List search"
                  className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-sibs-muted transition hover:bg-sibs-cream-light hover:text-sibs-orange"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-sibs-muted">
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
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold leading-5 text-red-700">
              {loadError}
            </div>
          )}

          {isLoading && candidates.length === 0 ? (
            <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-sibs-border bg-sibs-surface px-5 py-10">
              <div className="flex flex-col items-center text-center">
                <Loader2 size={22} className="animate-spin text-sibs-primary-1" />
                <p className="mt-3 text-xs font-extrabold text-sibs-navy">
                  Loading drop-off candidates...
                </p>
              </div>
            </div>
          ) : candidates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-sibs-border bg-sibs-surface px-5 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-sibs-border bg-white text-sibs-tertiary-5">
                <AlertTriangle size={22} />
              </div>

              <p className="mt-3 text-xs font-extrabold text-sibs-navy">
                No drop-off candidates
              </p>

              <p className="mt-1 text-xs font-semibold text-sibs-muted">
                Candidates moved to Drop-off will appear here.
              </p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-sibs-border bg-sibs-surface px-5 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-sibs-border bg-white text-sibs-primary-1">
                <Search size={22} />
              </div>

              <p className="mt-3 text-xs font-extrabold text-sibs-navy">
                No drop-off candidates match your search.
              </p>

              <p className="mt-1 text-xs font-semibold text-sibs-muted">
                Try searching by candidate, position, location, account,
                status, reason, or date.
              </p>

              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-[10px] border border-sibs-border bg-white px-4 text-xs font-extrabold text-sibs-primary-1 transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light/60 hover:text-sibs-orange"
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
                  className={`overflow-x-auto overscroll-x-contain rounded-xl border border-sibs-border bg-white sibs-scrollbar ${
                    isDropOffTableDragging
                      ? "cursor-grabbing select-none"
                      : "cursor-grab"
                  }`}
                  aria-label="Drop-off candidates table. Drag left or right to view all drop-off columns."
                >
                  <table className="w-full min-w-[1320px] table-fixed border-separate border-spacing-0 text-left">
                    <thead className="sibs-data-table-head">
                      <tr className="sibs-data-table-head-row">
                        <th className="sibs-data-table-th w-[18%] text-left">
                          Candidate
                        </th>

                        <th className="sibs-data-table-th w-[19%] text-left">
                          Applied Position
                        </th>

                        <th className="sibs-data-table-th w-[21%] text-left">
                          Preferred Location / Final Account
                        </th>

                        <th className="sibs-data-table-th w-[12%] text-center">
                          Status
                        </th>

                        <th className="sibs-data-table-th w-[20%] text-left">
                          Drop-off Reason
                        </th>

                        <th className="sibs-data-table-th w-[10%] text-left">
                          Date
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
                          role="button"
                          tabIndex={0}
                          onClick={() => openDropOffCandidate(candidate)}
                          onKeyDown={(event) =>
                            handleDropOffCandidateKeyDown(event, candidate)
                          }
                          className="cursor-pointer transition hover:bg-sibs-cream-light/40 focus:bg-sibs-cream-light/40 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sibs-orange/30"
                        >
                          <td className="border-b border-sibs-border px-4 py-3.5 align-middle">
                            <p className="truncate text-xs font-extrabold text-sibs-navy">
                              {getDropOffCandidateName(candidate)}
                            </p>

                            <p className="mt-0.5 truncate text-[11px] font-semibold text-sibs-muted">
                              {getDropOffCandidateId(candidate)}
                            </p>
                          </td>

                          <td className="border-b border-sibs-border px-4 py-3.5 align-middle">
                            <p className="truncate text-xs font-bold text-sibs-navy">
                              {candidate.openPosition ||
                                candidate.open_position ||
                                candidate.roleCapability ||
                                candidate.role_capability ||
                                getDropOffCandidateRole(candidate)}
                            </p>

                            <p className="mt-0.5 truncate text-[11px] font-semibold text-sibs-muted">
                              Skills: {candidate.skillsLanguage || candidate.skills_language || "—"}
                            </p>
                          </td>

                          <td className="border-b border-sibs-border px-4 py-3.5 align-middle">
                            <p className="truncate text-xs font-semibold text-sibs-navy">
                              {candidate.applyingLocation ||
                                candidate.applying_location ||
                                "—"}
                            </p>

                            <p className="mt-0.5 truncate text-[11px] font-semibold text-sibs-muted">
                              Final Account: {getDropOffCandidateAccount(candidate)}
                            </p>
                          </td>

                          <td className="border-b border-sibs-border px-4 py-3.5 text-center align-middle">
                            <span className="inline-flex max-w-full rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-extrabold text-red-700">
                              <span className="truncate">
                                {candidate.dropOffCategory ||
                                  candidate.drop_off_category ||
                                  "Drop Off"}
                              </span>
                            </span>
                          </td>

                          <td className="border-b border-sibs-border px-4 py-3.5 align-middle">
                            <p className="line-clamp-2 text-xs font-semibold leading-5 text-sibs-navy">
                              {getDropOffReason(candidate)}
                            </p>

                            {getDropOffBy(candidate) && (
                              <p className="mt-0.5 truncate text-[11px] font-semibold text-sibs-muted">
                                By: {getDropOffBy(candidate)}
                              </p>
                            )}
                          </td>

                          <td className="border-b border-sibs-border px-4 py-3.5 align-middle">
                            <p className="text-xs font-semibold text-sibs-navy">
                              {formatDropOffDate(getDropOffDate(candidate))}
                            </p>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3 lg:hidden">
                {filteredCandidates.map((candidate) => (
                  <button
                    type="button"
                    key={`${getDropOffCandidateId(candidate)}-${
                      candidate.pipelineRecordId ||
                      candidate.talentPoolRecordId ||
                      getDropOffDate(candidate)
                    }-mobile`}
                    onClick={() => onViewCandidate?.(candidate)}
                    className="block w-full rounded-2xl border border-sibs-border bg-white p-4 text-left font-jakarta shadow-sm transition hover:border-sibs-orange/35 hover:bg-sibs-cream-light/20 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sibs-orange/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-[13px] font-extrabold text-sibs-navy">
                          {getDropOffCandidateName(candidate)}
                        </h3>

                        <p className="mt-0.5 truncate text-[11px] font-semibold text-sibs-muted">
                          {getDropOffCandidateId(candidate)}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-extrabold text-red-700">
                        {candidate.dropOffCategory ||
                          candidate.drop_off_category ||
                          "Drop Off"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-sibs-border bg-sibs-surface p-3">
                        <p className="text-[10px] font-extrabold uppercase tracking-normal text-sibs-muted">
                          Applied Position
                        </p>

                        <p className="mt-1 text-xs font-bold leading-4 text-sibs-navy">
                          {candidate.openPosition ||
                            candidate.open_position ||
                            candidate.roleCapability ||
                            candidate.role_capability ||
                            getDropOffCandidateRole(candidate)}
                        </p>
                      </div>

                      <div className="rounded-lg border border-sibs-border bg-sibs-surface p-3">
                        <p className="text-[10px] font-extrabold uppercase tracking-normal text-sibs-muted">
                          Preferred Location
                        </p>

                        <p className="mt-1 text-xs font-bold leading-4 text-sibs-navy">
                          {candidate.applyingLocation ||
                            candidate.applying_location ||
                            "—"}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 rounded-lg border border-sibs-border bg-sibs-surface p-3 text-xs font-semibold leading-5 text-sibs-navy">
                      {getDropOffReason(candidate)}
                    </p>

                    <div className="mt-4">
                      <p className="text-xs font-semibold text-sibs-muted">
                        {formatDropOffDate(getDropOffDate(candidate))}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
