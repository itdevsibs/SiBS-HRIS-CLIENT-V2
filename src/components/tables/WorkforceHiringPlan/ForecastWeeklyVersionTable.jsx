import WeeklyVersionTable from "./WeeklyVersionTable";
import { useWorkforceHiring } from "../../../services/context/WorkforceHiringContext";

export default function ForecastPlanWeeklyVersionTable(props) {
  const { weeklyVersion } = useWorkforceHiring();

  return (
    <WeeklyVersionTable
      {...props}
      forecastWeekMode
      forecastWeeklyVersions={weeklyVersion.forecastWeeklyVersions || []}
      selectedForecastWeek={weeklyVersion.selectedForecastWeek || null}
      selectedForecastWeekId={weeklyVersion.selectedForecastWeekId || ""}
      setSelectedForecastWeekId={weeklyVersion.setSelectedForecastWeekId}
    />
  );
}
