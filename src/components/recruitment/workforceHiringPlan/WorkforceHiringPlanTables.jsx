import React, { useMemo } from "react";
import WorkforceHiringAccountsTable from "../../tables/WorkforceHiringPlan/WorkforceHiringAccountsTable";
import { useWorkforceHiring } from "../../../services/context/WorkforceHiringContext";
import ForecastHeadcountPlanTable from "./ForecastHeadcountPlanTables";
import ForecastWorkforceHiringOverviewSummary from "./ForecastWorkforceHiringOverview";
import ForecastBottomGraphs from "./ForecastBottomGraph";

export default function WorkforceHiringPlanTables() {
  const { tables, weeklyVersion } = useWorkforceHiring();

  const forecastRows = useMemo(() => {
    if (Array.isArray(tables.forecastRows)) {
      return tables.forecastRows;
    }

    if (Array.isArray(weeklyVersion.forecastRows)) {
      return weeklyVersion.forecastRows;
    }

    return [];
  }, [tables.forecastRows, weeklyVersion.forecastRows]);

  return (
    <div className="space-y-3 sm:space-y-4">
      <section className="relative z-[20]" style={{ animationDelay: "60ms" }}>
        <ForecastWorkforceHiringOverviewSummary />
      </section>

      <section className="relative z-[15]" style={{ animationDelay: "90ms" }}>
        <ForecastHeadcountPlanTable />
      </section>

      <section className="relative z-[10]" style={{ animationDelay: "120ms" }}>
        <ForecastBottomGraphs rows={forecastRows} />
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
