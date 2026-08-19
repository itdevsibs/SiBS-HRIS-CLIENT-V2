import Header from "../../components/layout/Header";
import WorkforceHiringPlanHeader from "../../components/recruitment/workforceHiringPlan/WorkforceHiringPlanHeader";
import WorkforceHiringPlanTables from "../../components/recruitment/workforceHiringPlan/WorkforceHiringPlanTables";
import WorkforceHiringPlanModals from "../../components/recruitment/workforceHiringPlan/WorkforceHiringPlanModals";
import useWorkforceHiringPage from "../../hooks/workforceHiring/useWorkforceHiringPage";

export default function WorkforceHiringPlanPage() {
  const { mainScrollRef, ...workforceHiringPlanModals } =
    useWorkforceHiringPage();

  return (
    <div className="sibs-dashboard-shell flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main
        ref={mainScrollRef}
        className="sibs-dashboard-main-wide min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6 lg:p-7"
      >
        <div className="mx-auto w-full max-w-[1700px] space-y-4 sm:space-y-5">
          <WorkforceHiringPlanHeader />
          <WorkforceHiringPlanTables />
        </div>
      </main>

      <WorkforceHiringPlanModals {...workforceHiringPlanModals} />
    </div>
  );
}
