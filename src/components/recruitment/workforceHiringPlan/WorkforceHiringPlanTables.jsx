import React, { useCallback, useState } from "react";
import ForecastHeadcountPlanTable from "./ForecastHeadcountPlanTables";
import ForecastWorkforceHiringOverviewSummary from "./ForecastWorkforceHiringOverview";
import ForecastBottomGraphs from "./ForecastBottomGraph";
import ForecastClusterAccountAverageTable from "./ForecastClusterAccountAverageTable";

const EMPTY_FORECAST_SNAPSHOT = {
  rows: [],
  summary: {},
  accountRowsByWeek: [],
  loading: false,
  error: "",
};

export default function WorkforceHiringPlanTables() {
  const [forecastSnapshot, setForecastSnapshot] = useState(
    EMPTY_FORECAST_SNAPSHOT,
  );

  const handleForecastDataChange = useCallback((nextSnapshot = {}) => {
    setForecastSnapshot({
      rows: Array.isArray(nextSnapshot.rows) ? nextSnapshot.rows : [],
      summary: nextSnapshot.summary || {},
      accountRowsByWeek: Array.isArray(nextSnapshot.accountRowsByWeek)
        ? nextSnapshot.accountRowsByWeek
        : [],
      loading: Boolean(nextSnapshot.loading),
      error: String(nextSnapshot.error || ""),
    });
  }, []);

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="relative z-[30] sibs-page-card-in">
        <ForecastWorkforceHiringOverviewSummary rows={forecastSnapshot.rows} />
      </section>

      <section
        className="relative z-[20] sibs-page-card-in"
        style={{ animationDelay: "60ms" }}
      >
        <ForecastHeadcountPlanTable
          onForecastDataChange={handleForecastDataChange}
        />
      </section>

      <section
        className="relative z-[10] sibs-page-card-in"
        style={{ animationDelay: "120ms" }}
      >
        <ForecastBottomGraphs rows={forecastSnapshot.rows} />
      </section>

      <section
        className="relative z-[0] sibs-page-card-in"
        style={{ animationDelay: "180ms" }}
      >
        <ForecastClusterAccountAverageTable
          groups={forecastSnapshot.accountRowsByWeek}
          forecastWeekCount={forecastSnapshot.rows.length}
          loading={forecastSnapshot.loading}
          error={forecastSnapshot.error}
        />
      </section>
    </div>
  );
}
