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
      className="sibs-page-card-in overflow-hidden rounded-xl 2xl:rounded-2xl border border-sibs-border bg-white font-jakarta shadow-sm"
      style={{ animationDelay: "240ms", animationFillMode: "both" }}
    >
      <header className="border-b border-sibs-border bg-white p-4 sm:p-5 2xl:p-6 font-jakarta">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="sibs-card-title">
              Weekly Performance Reports Log
            </h2>
            <p className="sibs-card-subtitle">
              Review weekly hiring reports compiled across active recruitment modules.
            </p>
          </div>

          <p className="sibs-text-xs font-semibold text-sibs-muted">
            Showing {filteredReports.length} report log entries
          </p>
        </div>

        <div className="relative z-[90] mt-3.5 2xl:mt-4 overflow-visible">
          <WeeklyReportsFilters
            search={search}
            statusFilter={statusFilter}
            onSearchChange={onSearchChange}
            onStatusChange={onStatusChange}
            onClear={onClearFilters}
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-3.5 p-4 font-jakarta sm:space-y-4 sm:p-5 2xl:space-y-5 2xl:p-6">
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
