import Header from "../../components/layout/Header";
import WeeklyReportDetailsModal from "../../components/recruitment/weeklyReports/WeeklyReportDetailsModal.jsx";
import WeeklyReportSnapshot from "../../components/recruitment/weeklyReports/WeeklyReportSnapshot.jsx";
import WeeklyReportsHeader from "../../components/recruitment/weeklyReports/WeeklyReportsHeader.jsx";
import WeeklyReportsList from "../../components/recruitment/weeklyReports/WeeklyReportsList.jsx";
import WeeklyReportsModuleSignals from "../../components/recruitment/weeklyReports/WeeklyReportsModuleSignals.jsx";
import WeeklyReportsRule from "../../components/recruitment/weeklyReports/WeeklyReportsRule.jsx";
import WeeklyReportsStats from "../../components/recruitment/weeklyReports/WeeklyReportsStats.jsx";
import useWeeklyReportsPage from "../../hooks/weeklyReports/useWeeklyReportsPage.js";

export default function WeeklyReportsPage() {
  const weeklyReports = useWeeklyReportsPage();

  return (
    <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main
        ref={weeklyReports.mainRef}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6"
      >
        <div className="mx-auto max-w-[1600px] space-y-5">
          <WeeklyReportsHeader
            onRefresh={weeklyReports.handleRefreshData}
            onGenerate={weeklyReports.handleGenerateCurrentWeek}
          />

          <WeeklyReportsStats stats={weeklyReports.stats} />

          <WeeklyReportSnapshot report={weeklyReports.stats.current} />

          <WeeklyReportsModuleSignals
            items={weeklyReports.moduleSignalCards}
          />

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

          <WeeklyReportsRule
            onGenerate={weeklyReports.handleGenerateCurrentWeek}
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
