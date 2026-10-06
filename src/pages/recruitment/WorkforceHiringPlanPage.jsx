import React from "react";
import Header from "../../components/layout/Header";
import WorkforceHiringPlanHeader from "../../components/recruitment/workforceHiringPlan/WorkforceHiringPlanHeader";
import WorkforceHiringPlanTables from "../../components/recruitment/workforceHiringPlan/WorkforceHiringPlanTables";
import WorkforceHiringPlanModals from "../../components/recruitment/workforceHiringPlan/WorkforceHiringPlanModals";
import useWorkforceHiringPage from "../../hooks/workforceHiring/useWorkforceHiringPage";

export default function WorkforceHiringPlanPage() {
  const { mainScrollRef, ...workforceHiringPlanModals } =
    useWorkforceHiringPage({
      forecastPlanMode: true,
      requireFilterSelection: true,
    });

  return (
    <div className="sibs-dashboard-shell bg-sibs-canvas font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main ref={mainScrollRef} className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-4 sm:space-y-5">
          <WorkforceHiringPlanHeader />
          <WorkforceHiringPlanTables />
        </div>
      </main>

      <WorkforceHiringPlanModals {...workforceHiringPlanModals} />
    </div>
  );
}
