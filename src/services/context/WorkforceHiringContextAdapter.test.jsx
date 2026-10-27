import { describe, expect, it } from "vitest";
import { buildDetailRows, buildWorkforceLedgerRows } from "./WorkforceHiringContextAdapter";

describe("RAMPS real account histories", () => {
  it("maps individual weekly populations without manufacturing prior weeks", () => {
    const [row] = buildWorkforceLedgerRows([{ id: 4, accountName: "A", clusterName: "C", requiredHeadcount: 20, actualHeadcount: 15, weekRows: [
      { label: "Week 42", weekStart: "2026-10-12", requiredHeadcount: 10, actualHeadcount: 8, absenteeismCount: 1.5, attritionCount: 1, interviewCount: 4, fstCount: 2, nhoCount: 3, pstCount: 1, projectedToBeEndorsed: 1 },
      { label: "Week 43", weekStart: "2026-10-19", requiredHeadcount: 20, actualHeadcount: 15, absenteeismCount: 0, attritionCount: 2, interviewCount: 8, fstCount: 3, nhoCount: 5, pstCount: 2, projectedToBeEndorsed: 2 },
    ] }]);
    expect(row.id).toBe(4);
    expect(row.history).toHaveLength(2);
    expect(row.history[0]).toMatchObject({ period: "Week 42", requiredHeadcount: 10, actualHeadcount: 8, netActualHc: 5.5, hiringRate: 50, goLive: 1 });
    expect(row.history[1]).toMatchObject({ period: "Week 43", requiredHeadcount: 20, actualHeadcount: 15, netActualHc: 13, hiringRate: 37.5, goLive: 2 });
    expect(buildWorkforceLedgerRows([{ id: 5 }])[0].history).toEqual([]);
  });
  it("retains the current KPI rounding and rate units", () => {
    const [row] = buildDetailRows([{ requiredHeadcount: 10, actualHeadcount: 8, scheduledDays: 2, currentWeekAbsenteeismCount: 3, attritionPastCount: 1, hiringRate: 0.25 }]);
    expect(row.absenteeism).toBe(2);
    expect(row.netActualHc).toBe(5.5);
    expect(row.hiringRate).toBe(25);
  });
});
