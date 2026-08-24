import { Layers3 } from "lucide-react";
import WeeklyReportsFilters from "./WeeklyReportsFilters.jsx";
import WeeklyReportsPagination from "./WeeklyReportsPagination.jsx";
import WeeklyReportsTable from "./WeeklyReportsTable.jsx";

export default function WeeklyReportsList({
  search,
  statusFilter,
  filteredReports,
  paginatedReports,
  currentPage,
  totalPages,
  showingFrom,
  showingTo,
  onSearchChange,
  onStatusChange,
  onClearFilters,
  onPageChange,
  onViewReport,
}) {
  return (
    <section
      className="sibs-page-card-in overflow-hidden rounded-xl 2xl:rounded-2xl border border-[#E6ECF2] bg-white font-jakarta shadow-sm"
      style={{ animationDelay: "240ms", animationFillMode: "both" }}
    >
      <header className="flex flex-col gap-2 border-b border-[#E6ECF2] bg-white px-4 py-3 sm:px-5 2xl:px-6 2xl:py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm 2xl:text-base font-black text-[#042C51]">
            Weekly Performance Reports Log
          </h2>
          <p className="mt-0.5 text-xs font-semibold text-[#667085]">
            Review weekly hiring reports compiled across active recruitment modules.
          </p>
        </div>

        <p className="text-xs font-semibold text-[#667085]">
          Showing {filteredReports.length} report log entries
        </p>
      </header>

      <div className="space-y-3.5 p-3.5 font-jakarta sm:space-y-4 sm:p-4 2xl:space-y-5 2xl:p-5">
        <WeeklyReportsFilters
          search={search}
          statusFilter={statusFilter}
          onSearchChange={onSearchChange}
          onStatusChange={onStatusChange}
          onClear={onClearFilters}
        />

        <WeeklyReportsTable reports={paginatedReports} onView={onViewReport} />

        <WeeklyReportsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          showingFrom={showingFrom}
          showingTo={showingTo}
          totalRecords={filteredReports.length}
          onPageChange={onPageChange}
        />
      </div>
    </section>
  );
}
