import Header from "../../components/layout/Header";
import WorkforceHiringPlanHeader from "../../components/recruitment/workforceHiringPlan/WorkforceHiringPlanHeader";
import WorkforceHiringPlanTables from "../../components/recruitment/workforceHiringPlan/WorkforceHiringPlanTables";
import WorkforceHiringPlanModals from "../../components/recruitment/workforceHiringPlan/WorkforceHiringPlanModals";
import useWorkforceHiringPage from "../../hooks/workforceHiring/useWorkforceHiringPage";

export default function WorkforceHiringPlanPage() {
  const { mainScrollRef, ...workforceHiringPlanModals } =
    useWorkforceHiringPage();

  return (
    <div
      className={`flex h-screen flex-1 flex-col bg-sibs-tertiary-10 font-jakarta`}
    >
      <Header />

      <main
        ref={mainScrollRef}
        className="min-w-0 flex-1 overflow-y-scroll overflow-x-hidden px-3 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-6"
      >
        <WorkforceHiringPlanHeader />
        <WorkforceHiringPlanTables />
      </main>

      <WorkforceHiringPlanModals {...workforceHiringPlanModals} />
    </div>
  );
}
