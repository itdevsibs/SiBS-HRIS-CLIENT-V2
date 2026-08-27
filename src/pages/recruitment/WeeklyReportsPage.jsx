import Header from "../../components/layout/Header";
import WeeklyReportDetailsModal from "../../components/recruitment/weeklyReports/WeeklyReportDetailsModal.jsx";
import WeeklyReportSnapshot from "../../components/recruitment/weeklyReports/WeeklyReportSnapshot.jsx";
import WeeklyReportsHeader from "../../components/recruitment/weeklyReports/WeeklyReportsHeader.jsx";
import WeeklyReportsList from "../../components/recruitment/weeklyReports/WeeklyReportsList.jsx";
import WeeklyReportsModuleSignals from "../../components/recruitment/weeklyReports/WeeklyReportsModuleSignals.jsx";
import WeeklyReportsStats from "../../components/recruitment/weeklyReports/WeeklyReportsStats.jsx";
import useWeeklyReportsPage from "../../hooks/weeklyReports/useWeeklyReportsPage.js";

export default function WeeklyReportsPage() {
  const weeklyReports = useWeeklyReportsPage();

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main
        ref={weeklyReports.mainRef}
        className="sibs-dashboard-main-wide"
      >
        <div className="mx-auto w-full max-w-[1600px] space-y-3.5 sm:space-y-4 2xl:space-y-5">
          <WeeklyReportsHeader
            onRefresh={weeklyReports.handleRefreshData}
            onGenerate={weeklyReports.handleGenerateCurrentWeek}
            isManualRefreshing={weeklyReports.isManualRefreshing}
          />

          <WeeklyReportsStats stats={weeklyReports.stats} />

          <WeeklyReportSnapshot
            report={weeklyReports.stats.current}
            onViewReport={weeklyReports.setSelectedReport}
          />

          <WeeklyReportsModuleSignals items={weeklyReports.moduleSignalCards} />

          <WeeklyReportsList
            search={weeklyReports.search}
            statusFilter={weeklyReports.statusFilter}
            filteredReports={weeklyReports.filteredReports}
            paginatedReports={weeklyReports.paginatedReports}
            currentPage={weeklyReports.currentPage}
            totalPages={weeklyReports.totalPages}
            showingFrom={weeklyReports.showingFrom}
            showingTo={weeklyReports.showingTo}
            onSearchChange={weeklyReports.setSearch}
            onStatusChange={weeklyReports.setStatusFilter}
            onClearFilters={weeklyReports.handleClearFilters}
            onPageChange={weeklyReports.handlePageChange}
            onViewReport={weeklyReports.setSelectedReport}
          />
        </div>
      </main>

      <WeeklyReportDetailsModal
        open={Boolean(weeklyReports.selectedReport)}
        report={weeklyReports.selectedReport}
        onClose={() => weeklyReports.setSelectedReport(null)}
        onMarkSent={weeklyReports.handleMarkSent}
      />
    </div>
  );
}
