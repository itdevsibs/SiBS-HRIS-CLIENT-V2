import React from "react";
import { RotateCcw } from "lucide-react";
import PaginationTable from "../../../services/pagination/PaginationTable";
import { WEEKLY_REPORT_STATUS_OPTIONS } from "../../../lib/utils/weeklyReports/weeklyReportsConstants.js";

function toOptions(options) {
  return options.map((option) => ({ label: option, value: option }));
}

export default function WeeklyReportsFilters({
  search,
  statusFilter,
  onSearchChange,
  onStatusChange,
  onClear,
}) {
  const isFiltered = Boolean(search || (statusFilter && statusFilter !== "All Status"));

  return (
    <PaginationTable
      filterLayout="ta-inline"
      showFilterPanel={false}
      showFilterHeader={false}
      showPagination={false}
      searchValue={search}
      searchPlaceholder="Search by Week Label, Date Range, or Report ID..."
      onSearchChange={(val) =>
        onSearchChange(typeof val === "string" ? val : val?.target?.value ?? "")
      }
      className="border-0 bg-transparent p-0 shadow-none font-jakarta"
      filters={[
        {
          key: "status",
          value: statusFilter,
          options: toOptions(WEEKLY_REPORT_STATUS_OPTIONS),
          onChange: onStatusChange,
          includeAll: false,
          allLabel: "All Status",
          label: "Report Status",
          placeholder: "All Status",
          searchable: false,
          className: "w-full xl:w-[180px] 2xl:w-[210px] xl:flex-none",
        },
      ]}
      rightContent={
        <button
          type="button"
          onClick={onClear}
          disabled={!isFiltered}
          className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-muted transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-sibs-border disabled:hover:bg-white disabled:hover:text-sibs-muted xl:w-auto"
        >
          <RotateCcw size={14} />
          Clear
        </button>
      }
    />
  );
}
