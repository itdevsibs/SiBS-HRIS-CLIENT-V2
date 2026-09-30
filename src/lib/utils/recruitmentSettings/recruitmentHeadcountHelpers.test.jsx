import { describe, expect, it } from "vitest";

import {
  canEditRequiredHeadcountByRole,
  formatHeadcountNumber,
  formatHeadcountPercent,
  getActualBufferClass,
  getRecruitmentClusterName,
  getRecruitmentHeadcountMetrics,
  getRecruitmentStatusForHeadcountTable,
} from "./recruitmentHeadcountHelpers";

describe("recruitmentHeadcountHelpers", () => {
  it("calculates headcount metrics correctly", () => {
    const item = {
      requiredHeadcount: 10,
      actualHeadcount: 8,
      opsPrf: 2,
      hiringRate: 0.65,
    };

    const metrics = getRecruitmentHeadcountMetrics(item);

    expect(metrics.requiredHeadcount).toBe(10);
    expect(metrics.actualHeadcount).toBe(8);
    expect(metrics.opsPrf).toBe(2);
    expect(metrics.requiredBufferHeadcount).toBe(1); // 10 * 0.1 default buffer
    expect(metrics.requiredBufferPercent).toBe(10); // (1 / 10) * 100
    expect(metrics.actualBufferCount).toBe(-2); // 8 - 10
    expect(metrics.actualBufferPercent).toBe(-20); // (-2 / 10) * 100
    expect(metrics.actualHeadcountNeeds).toBe(3); // 1 + 0 + 0 + 2
    expect(metrics.hiringRate).toBe(0.65);
  });

  it("assigns appropriate text color classes based on buffer count", () => {
    expect(getActualBufferClass(-3)).toBe("text-red-700");
    expect(getActualBufferClass(0)).toBe("text-emerald-700");
    expect(getActualBufferClass(4)).toBe("text-emerald-700");
  });

  it("formats percentages correctly", () => {
    expect(formatHeadcountPercent(0.15)).toBe("15.00%");
    expect(formatHeadcountPercent(15)).toBe("15.00%");
    expect(formatHeadcountPercent(0)).toBe("0.00%");
  });

  it("formats numbers with Philippine locale formatting", () => {
    expect(formatHeadcountNumber(1000)).toBe("1,000");
    expect(formatHeadcountNumber(25.5, 1)).toBe("25.5");
  });

  it("determines cluster names accurately", () => {
    expect(getRecruitmentClusterName({ account: "CD - Downtown Clinic" })).toBe("Coast Dental");
    expect(getRecruitmentClusterName({ account: "US Visa Assistance Team" })).toBe("US Visa");
    expect(getRecruitmentClusterName({ account: "SME - FrontSteps Billing" })).toBe("SME");
    expect(getRecruitmentClusterName({ account: "Yomdel Live Chat" })).toBe("Yomdel");
    expect(getRecruitmentClusterName({ account: "Corporate HR" })).toBe("Corporate");
  });

  it("validates role permissions for updating required headcount", () => {
    const hrAdmin = { role: "HR Admin", adminAccess: "full" };
    const employee = { role: "Agent", adminAccess: "none" };
    const superAdmin = { role: "Super Admin", adminAccess: "full" };

    expect(canEditRequiredHeadcountByRole(hrAdmin)).toBe(true);
    expect(canEditRequiredHeadcountByRole(superAdmin)).toBe(true);
    expect(canEditRequiredHeadcountByRole(employee)).toBe(false);
  });

  it("resolves status for headcount display", () => {
    expect(getRecruitmentStatusForHeadcountTable({ recruitmentSettingsStatus: "Approved" })).toBe("Approved");
    expect(getRecruitmentStatusForHeadcountTable({})).toBe("Kronos");
  });
});
