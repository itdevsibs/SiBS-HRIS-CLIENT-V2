import React from "react";
import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getMetricGridColClass } from "./MetricCardSkeleton";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("Ticket SIBS-UIUX-MOBILE-METRICS-HARMONIZATION-01: Mobile Metrics 2-Column Standard & Action Items Order (TDD)", () => {
  const actionItemsPagePath = path.resolve(
    __dirname,
    "../../pages/recruitment/ActionItemsPage.jsx"
  );
  const applicantLeadsSummaryPath = path.resolve(
    __dirname,
    "../recruitment/applicantLeads/ApplicantLeadsSummary.jsx"
  );
  const sourcingSummaryCardsPath = path.resolve(
    __dirname,
    "../recruitment/sourcingAnalytics/SourcingSummaryCards.jsx"
  );
  const attendanceTablePath = path.resolve(
    __dirname,
    "../tables/AttendanceTable.jsx"
  );
  const jobDescriptionPagePath = path.resolve(
    __dirname,
    "../../pages/recruitment/JobDescriptionPage.jsx"
  );
  const hiringNeedsStatsPath = path.resolve(
    __dirname,
    "../recruitment/HiringNeeds/HiringNeedsStats.jsx"
  );

  it("TC-MMH-01: ActionItemsPage places ActionItemsStats (metrics) before ActionItemsReportingScope (filters)", () => {
    const content = fs.readFileSync(actionItemsPagePath, "utf-8");

    const statsIndex = content.indexOf("<ActionItemsStats />");
    const scopeIndex = content.indexOf("<ActionItemsReportingScope />");

    expect(statsIndex).toBeGreaterThan(-1);
    expect(scopeIndex).toBeGreaterThan(-1);
    // Metrics must be at top (rendered before filters)
    expect(statsIndex).toBeLessThan(scopeIndex);
  });

  it("TC-MMH-02: getMetricGridColClass maps columns 2, 4, 5, and 6 to 2-column mobile standard (grid-cols-2)", () => {
    // 6 columns
    expect(getMetricGridColClass(6)).toContain("grid-cols-2");
    // 5 columns must start with grid-cols-2 on mobile
    expect(getMetricGridColClass(5)).toMatch(/^grid-cols-2/);
    // 4 columns must start with grid-cols-2 on mobile
    expect(getMetricGridColClass(4)).toMatch(/^grid-cols-2/);
    // 2 columns must start with grid-cols-2 on mobile
    expect(getMetricGridColClass(2)).toMatch(/^grid-cols-2/);
  });

  it("TC-MMH-03: ApplicantLeadsSummary and SourcingSummaryCards adopt grid-cols-2 base on mobile", () => {
    const leadsContent = fs.readFileSync(applicantLeadsSummaryPath, "utf-8");
    const sourcingContent = fs.readFileSync(sourcingSummaryCardsPath, "utf-8");

    expect(leadsContent).toMatch(/grid\s+grid-cols-2\s+gap-2\.5/);
    expect(sourcingContent).toMatch(/grid\s+grid-cols-2\s+gap-2\.5/);
  });

  it("TC-MMH-04: Skeletons in Attendance, Job Description, and Hiring Needs adopt grid-cols-2 base on mobile", () => {
    const attendanceContent = fs.readFileSync(attendanceTablePath, "utf-8");
    const jdContent = fs.readFileSync(jobDescriptionPagePath, "utf-8");
    const hiringContent = fs.readFileSync(hiringNeedsStatsPath, "utf-8");

    expect(attendanceContent).toMatch(/MetricGridSkeleton[\s\S]*?className="grid grid-cols-2/);
    expect(jdContent).toMatch(/MetricGridSkeleton[\s\S]*?className="grid grid-cols-2/);
    expect(hiringContent).toMatch(/MetricGridSkeleton[\s\S]*?className="grid grid-cols-2/);
  });

  it("TC-MMH-05: Kronos Attendance and Kronos Datas adopt grid-cols-2 base on mobile", () => {
    const kronosAttendancePath = path.resolve(
      __dirname,
      "../../pages/kronos-attendance/KronosAttendancePage.jsx"
    );
    const kronosDatasPath = path.resolve(
      __dirname,
      "../../pages/kronos-datas/KronosDatasPage.jsx"
    );

    const attContent = fs.readFileSync(kronosAttendancePath, "utf-8");
    const dataContent = fs.readFileSync(kronosDatasPath, "utf-8");

    // KronosAttendancePage Current Page Summary
    expect(attContent).toMatch(/grid\s+grid-cols-2\s+gap-2\.5[^\"]*sm:grid-cols-2\s+xl:grid-cols-4/);
    // KronosDatasPage MetricGridSkeleton and summary grid
    expect(dataContent).toMatch(/MetricGridSkeleton[\s\S]*?className="mt-4\s+grid\s+grid-cols-2/);
    expect(dataContent).toMatch(/div\s+className="mt-4\s+grid\s+grid-cols-2\s+gap-2\.5[^\"]*sm:grid-cols-2\s+xl:grid-cols-3/);
  });

  it("TC-MMH-06: OffersPage decision skeleton adopts grid-cols-2 base on mobile", () => {
    const offersPagePath = path.resolve(
      __dirname,
      "../../pages/recruitment/OffersPage.jsx"
    );
    const content = fs.readFileSync(offersPagePath, "utf-8");

    expect(content).toMatch(/section\s+className="grid\s+grid-cols-2\s+gap-2\.5[^\"]*sm:grid-cols-2\s+xl:grid-cols-4"/);
  });

  it("TC-MMH-07: SuperAdmin overview cards and skeletons adopt grid-cols-2 base on mobile", () => {
    const skeletonPath = path.resolve(
      __dirname,
      "../Dashboard/SuperAdminDashboard/SuperAdminDashboardSkeleton.jsx"
    );
    const overviewPath = path.resolve(
      __dirname,
      "../Dashboard/SuperAdminDashboard/SuperAdminOverview.jsx"
    );

    const skeletonContent = fs.readFileSync(skeletonPath, "utf-8");
    const overviewContent = fs.readFileSync(overviewPath, "utf-8");

    expect(skeletonContent).toMatch(/MetricGridSkeleton[\s\S]*?className="grid\s+grid-cols-2/);
    expect(skeletonContent).toMatch(/grid\s+grid-cols-2\s+gap-2\.5\s+sm:grid-cols-2\s+xl:grid-cols-4/);
    expect(overviewContent).toMatch(/grid\s+grid-cols-2\s+gap-2\.5\s+sm:grid-cols-2\s+xl:grid-cols-4/);
  });

  it("TC-MMH-08: DashboardLoadingSkeleton and FinanceDashboardPage adopt grid-cols-2 base on mobile", () => {
    const dashboardSkeletonPath = path.resolve(
      __dirname,
      "../Dashboard/shared/DashboardLoadingSkeleton.jsx"
    );
    const financeDashboardPath = path.resolve(
      __dirname,
      "../../pages/dashboard/FinanceDashboard/FinanceDashboardPage.jsx"
    );

    const skeletonContent = fs.readFileSync(dashboardSkeletonPath, "utf-8");
    const financeContent = fs.readFileSync(financeDashboardPath, "utf-8");

    expect(skeletonContent).toMatch(/grid\s+grid-cols-2\s+gap-2\.5\s+sm:grid-cols-2\s+lg:grid-cols-3/);
    expect(financeContent).toMatch(/section\s+className="grid\s+grid-cols-2\s+gap-2\.5\s+sm:grid-cols-2\s+xl:grid-cols-3/);
  });
});
