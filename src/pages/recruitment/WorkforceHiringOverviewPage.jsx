import Header from "../../components/layout/Header";
import WorkforceHiringOverviewCharts from "../../components/recruitment/workforceHiringOverview/WorkforceHiringOverviewCharts";
import WorkforceHiringOverviewDetailsTable from "../../components/recruitment/workforceHiringOverview/WorkforceHiringOverviewDetailsTable";
import WorkforceHiringOverviewHeader from "../../components/recruitment/workforceHiringOverview/WorkforceHiringOverviewHeader";
import {
  WorkforceHiringOverviewPipelineStrip,
} from "../../components/recruitment/workforceHiringOverview/WorkforceHiringOverviewPipeline";
import WorkforceHiringOverviewSummary from "../../components/recruitment/workforceHiringOverview/WorkforceHiringOverviewSummary";
import useWorkforceHiringPage from "../../hooks/workforceHiring/useWorkforceHiringPage";

export default function WorkforceHiringOverviewPage() {
  useWorkforceHiringPage();

  return (
    <div className="flex h-screen flex-1 flex-col bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main className="min-w-0 flex-1 overflow-y-scroll overflow-x-hidden px-3 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-6">
        <WorkforceHiringOverviewHeader />
        <WorkforceHiringOverviewSummary />
        <WorkforceHiringOverviewPipelineStrip />
        <WorkforceHiringOverviewCharts />
        <WorkforceHiringOverviewDetailsTable />
      </main>
    </div>
  );
}
