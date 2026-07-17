import { Activity, Search } from "lucide-react";
import { WEEKLY_REPORT_STATUS_OPTIONS } from "../../../lib/utils/weeklyReports/weeklyReportsConstants.js";
import CustomSelect from "./CustomSelect.jsx";

function inputClass(extra = "") {
  return `h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

export default function WeeklyReportsFilters({
  search,
  statusFilter,
  recordCount,
  onSearchChange,
  onStatusChange,
  onClear,
}) {
  return (
    <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-sibs-primary-1">
            Weekly Report List
          </h2>

          <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
            Search and filter generated, sent, and archived reports.
          </p>
        </div>

        <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1">
          {recordCount} Records
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_320px_auto] xl:items-end">
        <div>
          <label className="mb-1 block text-sm font-bold text-[#101828]">
            Search
          </label>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
            />

            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search report, week, status..."
              className={inputClass("pl-11 pr-4")}
            />
          </div>
        </div>

        <CustomSelect
          label="Status"
          value={statusFilter}
          options={WEEKLY_REPORT_STATUS_OPTIONS}
          onChange={onStatusChange}
          zIndex="z-50"
        />

        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
        >
          <Activity size={17} />
          Clear
        </button>
      </div>
    </div>
  );
}
