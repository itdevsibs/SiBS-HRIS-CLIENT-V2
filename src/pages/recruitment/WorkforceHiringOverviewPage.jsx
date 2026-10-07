import React from "react";
import Header from "../../components/layout/Header";
import WorkforceHiringOverviewCharts from "../../components/recruitment/workforceHiringOverview/WorkforceHiringOverviewCharts";
import WorkforceHiringOverviewDetailsTable from "../../components/recruitment/workforceHiringOverview/WorkforceHiringOverviewDetailsTable";
import WorkforceHiringOverviewHeader from "../../components/recruitment/workforceHiringOverview/WorkforceHiringOverviewHeader";
import { WorkforceHiringOverviewPipelineStrip } from "../../components/recruitment/workforceHiringOverview/WorkforceHiringOverviewPipeline";
import WorkforceHiringOverviewSummary from "../../components/recruitment/workforceHiringOverview/WorkforceHiringOverviewSummary";
import useWorkforceHiringPage from "../../hooks/workforceHiring/useWorkforceHiringPage";

export default function WorkforceHiringOverviewPage() {
  const { mainScrollRef } = useWorkforceHiringPage({
    // Load the overview immediately using the full accessible scope.
    // The shared hook initializes both filters to ["All"] when explicit
    // filter selection is not required, so the header displays
    // "All Clusters" and "All Accounts" on first open.
    requireFilterSelection: false,
    fastOverviewMode: true,
  });

  return (
    <div className="sibs-dashboard-shell bg-sibs-canvas font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main ref={mainScrollRef} className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-4 sm:space-y-5">
          <WorkforceHiringOverviewHeader />
          <WorkforceHiringOverviewSummary />
          <WorkforceHiringOverviewPipelineStrip />
          <WorkforceHiringOverviewCharts />
          <WorkforceHiringOverviewDetailsTable />
        </div>
      </main>
    </div>
  );
}
