import React from "react";
import { Filter, Search, X } from "lucide-react";
import ThemedDropdown from "../../layout/dropdown/ThemedDropdown.jsx";
import { WEEKLY_REPORT_STATUS_OPTIONS } from "../../../lib/utils/weeklyReports/weeklyReportsConstants.js";

const labelClass =
  "mb-1.5 block font-jakarta text-xs font-extrabold tracking-normal text-[#101828]";

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
    <div className="bg-white font-jakarta">
      <div className="flex flex-col gap-3 overflow-visible sm:flex-row sm:flex-wrap sm:items-end">
        <div className="relative w-full min-w-0 sm:min-w-[280px] sm:flex-1">
          <label className={labelClass}>Search</label>
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3]"
            />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by Week Label, Date Range, or Report ID..."
              className="h-10 w-full rounded-[10px] border border-[#D0D5DD] bg-white pl-9 pr-9 text-xs font-semibold text-[#101828] outline-none transition placeholder:text-[#98A2B3] focus:border-[#FF5C28] focus:ring-2 focus:ring-[#FF5C28]/20"
            />

            {search ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear weekly reports search"
                className="absolute right-2.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-[#98A2B3] hover:bg-white hover:text-[#FF5C28]"
              >
                <X size={13} />
              </button>
            ) : null}
          </div>
        </div>

        <div className="w-full min-w-0 sm:w-[220px]">
          <label className={labelClass}>Report Status</label>
          <ThemedDropdown
            value={statusFilter}
            options={toOptions(WEEKLY_REPORT_STATUS_OPTIONS)}
            onChange={onStatusChange}
            searchable={false}
            showPlaceholderOption={false}
            className="w-full"
          />
        </div>

        <button
          type="button"
          onClick={onClear}
          disabled={!isFiltered}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#D0D5DD] bg-white px-4 text-xs font-extrabold text-[#344054] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <Filter size={15} />
          Clear
        </button>
      </div>
    </div>
  );
}
