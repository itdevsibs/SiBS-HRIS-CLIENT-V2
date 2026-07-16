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
      className="relative z-[80] sibs-profile-tab-panel overflow-visible rounded-2xl border border-[#D9E2EC] bg-white shadow-sm"
      style={{ animationDelay: "300ms" }}
    >
      <WeeklyReportsFilters
        search={search}
        statusFilter={statusFilter}
        recordCount={filteredReports.length}
        onSearchChange={onSearchChange}
        onStatusChange={onStatusChange}
        onClear={onClearFilters}
      />

      <div className="p-4 sm:p-6">
        <WeeklyReportsTable
          reports={paginatedReports}
          onView={onViewReport}
        />

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
