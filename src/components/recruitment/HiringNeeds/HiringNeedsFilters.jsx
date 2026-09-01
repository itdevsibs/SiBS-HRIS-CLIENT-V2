import { useMemo } from "react";
import { RotateCcw } from "lucide-react";

import { useHiringNeeds } from "../../../services/context/HiringNeedsContext";
import { usePagination } from "../../../services/context/PaginationContext";
import PaginationTable from "../../../services/pagination/PaginationTable";
import {
  getHiringNeedsReason,
  getHiringNeedsSite,
} from "../../../lib/utils/hiringNeeds/hiringNeedsHelpers";

const HIRING_NEEDS_ENTITY = "hiring-needs";

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "All" },
  { label: "For Approval", value: "For Approval" },
  { label: "Approved", value: "Approved" },
  { label: "Not Approved", value: "Not Approved" },
];

function uniqueFilterOptions(items, getter, allLabel) {
  const values = [
    ...new Set(
      (Array.isArray(items) ? items : [])
        .map((item) => String(getter(item) || "").trim())
        .filter((value) => value && value !== "—"),
    ),
  ].sort((left, right) => left.localeCompare(right));

  return [
    { label: allLabel, value: "All" },
    ...values.map((value) => ({
      label: value,
      value,
    })),
  ];
}

export default function HiringNeedsFilters() {
  const {
    searchInput,
    setSearchInput,
    commitSearch,
    resetFilters,
    filterValues,
    setFilter,
  } = usePagination(HIRING_NEEDS_ENTITY);

  const {
    list,
    clearFilters,
  } = useHiringNeeds();

  const status = filterValues?.status || "All";
  const site = filterValues?.site || "All";
  const reason = filterValues?.reason || "All";

  const siteOptions = useMemo(
    () =>
      uniqueFilterOptions(
        list,
        getHiringNeedsSite,
        "All Sites",
      ),
    [list],
  );

  const reasonOptions = useMemo(
    () =>
      uniqueFilterOptions(
        list,
        getHiringNeedsReason,
        "All Reasons",
      ),
    [list],
  );

  const hasActiveFilters =
    Boolean(String(searchInput || "").trim()) ||
    status !== "All" ||
    site !== "All" ||
    reason !== "All";

  function handleSearchKeyDown(event) {
    if (event.key !== "Enter") return;

    event.preventDefault();
    commitSearch();
  }

  function handleClearAll() {
    setSearchInput("");
    resetFilters();
    setFilter("status", "All");
    setFilter("site", "All");
    setFilter("reason", "All");
    clearFilters?.();
  }

  return (
    <div className="border-b border-sibs-border p-4 sm:p-5 2xl:p-6 font-jakarta">
      <h2 className="sibs-card-title">
        Personnel Requisition Records
      </h2>

      <p className="sibs-card-subtitle">
        Search and filter Hiring Needs records by request,
        department, account, site, reason, and approval status.
      </p>

      <div className="relative z-[90] mt-3.5 2xl:mt-4 overflow-visible">
        <PaginationTable
          filterLayout="ta-inline"
          showFilterPanel={false}
          showFilterHeader={false}
          showPagination={false}
          searchValue={searchInput}
          searchPlaceholder="Search by ID, department, account, job title, reason, or week..."
          onSearchChange={setSearchInput}
          onSearchKeyDown={handleSearchKeyDown}
          className="border-0 bg-transparent p-0 shadow-none"
          filters={[
            {
              key: "status",
              value: status,
              options: STATUS_OPTIONS,
              onChange: (value) =>
                setFilter("status", value),
              searchable: false,
              includeAll: false,
              allLabel: "All Statuses",
              label: "Approval Status",
              placeholder: "All Statuses",
            },
            {
              key: "site",
              value: site,
              options: siteOptions,
              onChange: (value) =>
                setFilter("site", value),
              searchable: true,
              includeAll: false,
              allLabel: "All Sites",
              label: "Location / Site",
              placeholder: "Search sites...",
            },
            {
              key: "reason",
              value: reason,
              options: reasonOptions,
              onChange: (value) =>
                setFilter("reason", value),
              searchable: true,
              includeAll: false,
              allLabel: "All Reasons",
              label: "Reason",
              placeholder: "Search reasons...",
            },
          ]}
          onReset={handleClearAll}
          resetLabel={
            hasActiveFilters ? "Reset filters" : "Clear"
          }
          rightContent={
            <button
              type="button"
              onClick={handleClearAll}
              disabled={!hasActiveFilters}
              className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-muted transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-sibs-border disabled:hover:bg-white disabled:hover:text-sibs-muted xl:w-auto"
            >
              <RotateCcw size={14} />
              Clear
            </button>
          }
        />
      </div>
    </div>
  );
}
