import React from "react";
import Header from "../../components/layout/Header";
import WorkforceHiringOverviewCharts from "../../components/recruitment/workforceHiringOverview/WorkforceHiringOverviewCharts";
import WorkforceHiringOverviewDetailsTable from "../../components/recruitment/workforceHiringOverview/WorkforceHiringOverviewDetailsTable";
import WorkforceHiringOverviewHeader from "../../components/recruitment/workforceHiringOverview/WorkforceHiringOverviewHeader";
import { WorkforceHiringOverviewPipelineStrip } from "../../components/recruitment/workforceHiringOverview/WorkforceHiringOverviewPipeline";
import WorkforceHiringOverviewSummary from "../../components/recruitment/workforceHiringOverview/WorkforceHiringOverviewSummary";
import useWorkforceHiringPage from "../../hooks/workforceHiring/useWorkforceHiringPage";
import { useWorkforceHiringView } from "../../services/context/WorkforceHiringContextAdapter";
import { isCancellation } from "../../lib/axios/cancellation";

export default function WorkforceHiringOverviewPage() {
  const { mainScrollRef } = useWorkforceHiringPage({
    // Load the overview immediately using the full accessible scope.
    // The shared hook initializes both filters to ["All"] when explicit
    // filter selection is not required, so the header displays
    // "All Clusters" and "All Accounts" on first open.
    requireFilterSelection: false,
    fastOverviewMode: true,
  });

  const { status } = useWorkforceHiringView();
  const hasAccountError = Boolean(status?.error) && !status?.isLoadingAccountData && !isCancellation(status?.error);

  return (
    <div className="sibs-dashboard-shell bg-sibs-canvas font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main ref={mainScrollRef} className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-4 sm:space-y-5">
          <WorkforceHiringOverviewHeader />
          {hasAccountError && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold">Unable to load latest workforce data:</span>
                <span className="truncate max-w-xl">{status.error}</span>
              </div>
              <button
                type="button"
                onClick={status.refetch}
                className="rounded-lg bg-rose-600 px-3 py-1 font-semibold text-white transition hover:bg-rose-700"
              >
                Retry
              </button>
            </div>
          )}
          <WorkforceHiringOverviewSummary />
          <WorkforceHiringOverviewPipelineStrip />
          <WorkforceHiringOverviewCharts />
          <WorkforceHiringOverviewDetailsTable />
        </div>
      </main>
    </div>
  );
}
