import React from "react";
import HeadcountTable from "../../tables/WorkforceHiringPlan/HeadcountTable";
import PercentageRiskGraphTable from "../../tables/WorkforceHiringPlan/PercentageRiskGraphTable";
import WorkforceHiringAccountsTable from "../../tables/WorkforceHiringPlan/WorkforceHiringAccountsTable";
import { useWorkforceHiring } from "../../../services/context/WorkforceHiringContext";

export default function WorkforceHiringPlanTables() {
  const { tables } = useWorkforceHiring();

  return (
    <div className="space-y-3 sm:space-y-4">
      <section className="relative z-[20]" style={{ animationDelay: "60ms" }}>
        <HeadcountTable
          filteredPlans={tables.filteredPlans}
          activeWeek={tables.activeWeek}
        />
      </section>

      <section className="relative z-[10]" style={{ animationDelay: "120ms" }}>
        <PercentageRiskGraphTable
          filteredPlans={tables.filteredPlans}
          activeWeek={tables.activeWeek}
        />
      </section>

      <section
        key={tables.tableKey}
        className="relative z-[0]"
        style={{ animationDelay: "180ms" }}
      >
        <WorkforceHiringAccountsTable
          accountsLoading={tables.accountsLoading}
          filteredPlans={tables.filteredPlans}
          onViewPlan={tables.onViewPlan}
        />
      </section>
    </div>
  );
}
