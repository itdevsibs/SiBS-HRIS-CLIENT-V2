import React from "react";
import Header from "../../components/layout/Header";
import WorkforceHiringOverviewCharts from "../../components/recruitment/workforceHiringOverview/WorkforceHiringOverviewCharts";
import WorkforceHiringOverviewDetailsTable from "../../components/recruitment/workforceHiringOverview/WorkforceHiringOverviewDetailsTable";
import WorkforceHiringOverviewHeader from "../../components/recruitment/workforceHiringOverview/WorkforceHiringOverviewHeader";
import { WorkforceHiringOverviewPipelineStrip } from "../../components/recruitment/workforceHiringOverview/WorkforceHiringOverviewPipeline";
import WorkforceHiringOverviewSummary from "../../components/recruitment/workforceHiringOverview/WorkforceHiringOverviewSummary";
import useWorkforceHiringPage from "../../hooks/workforceHiring/useWorkforceHiringPage";
import { useWorkforceHiringView } from "../../services/context/WorkforceHiringContextAdapter";

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
  const hasAccountError = Boolean(status?.error) && !status?.isLoadingAccountData;

  return (
    <div className="sibs-dashboard-shell bg-sibs-canvas font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main ref={mainScrollRef} className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-4 sm:space-y-5">
          <WorkforceHiringOverviewHeader />
          {hasAccountError ? (
            <section role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sibs-navy shadow-sm">
              <h2 className="text-base font-bold">Workforce data could not be loaded</h2>
              <p className="mt-2 text-sm">
                The server returned an error, so headcount and hiring metrics are unavailable—not zero.
              </p>
              <p className="mt-1 break-words text-xs text-slate-600">{status.error}</p>
              <button
                type="button"
                onClick={status.refetch}
                className="mt-4 rounded-lg bg-sibs-navy px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Retry loading data
              </button>
            </section>
          ) : (
            <>
              <WorkforceHiringOverviewSummary />
              <WorkforceHiringOverviewPipelineStrip />
              <WorkforceHiringOverviewCharts />
              <WorkforceHiringOverviewDetailsTable />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
