import { expect, it } from "vitest";
import { buildFilteredTotals, buildPeriodDisplayRow } from "./WorkforceHiringOverviewDetailsTable";

it("does not replace a missing week with the previous week's data", () => {
  const row = { account: "A", history: [{ period: "Week 42", requiredHeadcount: 10, actualHeadcount: 8 }] };
  expect(buildPeriodDisplayRow(row, "Week 43", 43)).toBeNull();
  expect(buildPeriodDisplayRow(row, "Week 42", 43)).toMatchObject({ requiredHeadcount: 10, actualHeadcount: 8 });
});
it("ledger totals use every scoped row and empty filters cannot reuse global totals", () => {
  const rows = Array.from({ length: 30 }, () => ({ requiredHeadcount: 10, actualHeadcount: 8, absenteeism: 1, attrition: 1, acceptedJo: 4, hiredCount: 2 }));
  expect(buildFilteredTotals(rows)).toMatchObject({ requiredHeadcount: 300, actualHeadcount: 240, netActualHc: 180, hiringNeeded: 120, hiringRate: 50 });
  expect(buildFilteredTotals([], { actualHeadcount: 999 })).toMatchObject({ actualHeadcount: 0, netActualHc: 0 });
});
it("All 6 Weeks keeps the existing averaging formula on real supplied weeks", () => {
  const row = { history: [{ period: "Week 42", requiredHeadcount: 10, actualHeadcount: 8, absenteeism: 1, attrition: 1 }, { period: "Week 43", requiredHeadcount: 20, actualHeadcount: 14, absenteeism: 2, attrition: 2 }] };
  expect(buildPeriodDisplayRow(row, "All 6 Weeks", 43)).toMatchObject({ requiredHeadcount: 15, actualHeadcount: 11 });
});
