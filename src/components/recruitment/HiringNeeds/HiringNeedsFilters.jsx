import { useMemo } from "react";
import { RotateCcw } from "lucide-react";

import { useHiringNeeds } from "../../../services/context/HiringNeedsContext";
import { usePagination } from "../../../services/context/PaginationContext";
import PaginationTable from "../../../services/pagination/PaginationTable";
import {
  getHiringNeedsReason,
  getHiringNeedsSite,
} from "./hiringNeedsPresentation";

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
    <>
      <div className="rounded-t-2xl border-b border-[#E6ECF2] bg-white px-4 py-5 font-jakarta sm:px-5">
        <h2 className="sibs-section-title">
          Personnel Requisition Records
        </h2>

        <p className="sibs-section-subtitle">
          Search and filter Hiring Needs records by request,
          department, account, site, reason, and approval status.
        </p>
      </div>

      <div className="relative overflow-visible p-4 font-jakarta sm:p-5">
        <PaginationTable
          filterLayout="ta-inline"
          showFilterPanel={false}
          showFilterHeader={false}
          showPagination={false}
          searchValue={searchInput}
          searchPlaceholder="Search by ID, department, account, job title, reason, or week..."
          onSearchChange={setSearchInput}
          onSearchKeyDown={handleSearchKeyDown}
          controlsClassName="flex flex-col gap-3 overflow-visible sm:flex-row sm:items-center"
          searchClassName="relative min-w-0 flex-1"
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
              placeholder: "All Statuses",
              className:
                "w-full sm:w-[175px] xl:w-[190px]",
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
              placeholder: "Search sites...",
              className:
                "w-full sm:w-[165px] xl:w-[185px]",
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
              placeholder: "Search reasons...",
              className:
                "w-full sm:w-[185px] xl:w-[210px]",
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
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#E6ECF2] bg-white px-3 text-xs font-extrabold text-[#98A2B3] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF7F3] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#E6ECF2] disabled:hover:bg-white disabled:hover:text-[#98A2B3] sm:w-auto"
            >
              <RotateCcw size={14} />
              Clear
            </button>
          }
        />
      </div>
    </>
  );
}
