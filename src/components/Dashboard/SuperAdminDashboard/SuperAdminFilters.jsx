import { RotateCcw } from "lucide-react";

import PaginationTable from "../../../services/pagination/PaginationTable";

export default function SuperAdminFilters({
  searchInput,
  onSearchChange,
  onSearchKeyDown,
  accessLevel,
  module,
  account,
  status,
  accessOptions,
  moduleOptions,
  accountOptions,
  statusOptions,
  onFilterChange,
  onReset,
  hasActiveFilters,
}) {
  return (
    <section className="sibs-page-card-in sibs-card overflow-visible">
      <div className="border-b border-[#EEF2F6] px-4 py-4 sm:px-5">
        <h2 className="sibs-section-title">
          Filter Super Admin Operations, Roles &amp; Exceptions
        </h2>
        <p className="sibs-section-subtitle">
          Search and filter command-center records using the shared dashboard controls.
        </p>
      </div>

      <PaginationTable
        className="border-0 bg-transparent p-4 shadow-none sm:p-5"
        showPagination={false}
        searchValue={searchInput}
        searchPlaceholder="Search then press Enter..."
        onSearchChange={onSearchChange}
        onSearchKeyDown={onSearchKeyDown}
        controlsClassName="grid grid-cols-1 gap-3 overflow-visible md:grid-cols-2 xl:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))_auto] xl:items-end"
        searchClassName="relative w-full"
        filters={[
          {
            key: "accessLevel",
            label: "Access Level (1-7)",
            value: accessLevel,
            options: accessOptions,
            onChange: (value) => onFilterChange("accessLevel", value),
            searchable: false,
            allLabel: "All Access Levels",
            className: "w-full",
          },
          {
            key: "module",
            label: "Target Module",
            value: module,
            options: moduleOptions,
            onChange: (value) => onFilterChange("module", value),
            searchable: true,
            allLabel: "All Modules",
            className: "w-full",
          },
          {
            key: "account",
            label: "Account Group",
            value: account,
            options: accountOptions,
            onChange: (value) => onFilterChange("account", value),
            searchable: true,
            allLabel: "All Accounts",
            className: "w-full",
          },
          {
            key: "status",
            label: "Status Filter",
            value: status,
            options: statusOptions,
            onChange: (value) => onFilterChange("status", value),
            searchable: false,
            allLabel: "All Statuses",
            className: "w-full",
          },
        ]}
        rightContent={
          <button
            type="button"
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#E6ECF2] bg-white px-3 text-xs font-extrabold text-[#98A2B3] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF7F3] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50 xl:w-auto"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        }
      />
    </section>
  );
}
