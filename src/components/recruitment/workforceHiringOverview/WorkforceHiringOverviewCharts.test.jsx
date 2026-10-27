import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import WorkforceHiringOverviewCharts from "./WorkforceHiringOverviewCharts";
const requestState = vi.hoisted(() => ({ error: "" }));

vi.mock("../../../services/context/WorkforceHiringContextAdapter", () => ({
  useWorkforceHiringView: () => ({
    overview: {
      summary: {},
      attritionStages: [],
      trendSummary: { absenteeismPercentage: 4.25, attritionPercentage: 1.5, bufferPercentage: 8 },
      trends: { absenteeism: [4.25], attrition: [1.5], buffer: [8] },
      trendWeeks: ["Week 43"],
      trendDetails: [], trendMeta: {}, trendsLoading: false, trendsError: requestState.error,
    },
    filters: { selectedWeek: { weekNumber: 43, year: 2026 } },
    status: { isLoading: false },
  }),
}));
vi.mock("./WorkforceHiringOverviewPipeline", () => ({ HiringFunnelCard: () => null }));
vi.mock("../../modals/workforceHiringOverview/WorkforceHiringTrendDetailsModal", () => ({ default: () => null }));
vi.mock("./shared/TrendSvg", () => ({ default: () => null }));

describe("six-week trend summary", () => {
  it("shows returned averages without an extra animation wait", () => {
    render(<WorkforceHiringOverviewCharts />);
    expect(screen.getByText("4.25%", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("1.50%", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("8.00%", { exact: true })).toBeInTheDocument();
  });
  it("settles failed trend averages without leaving skeletons or successful percentages", () => {
    requestState.error = "Kronos unavailable. Please retry.";
    const { container } = render(<WorkforceHiringOverviewCharts />);
    expect(screen.getByText(requestState.error)).toBeInTheDocument();
    expect(screen.queryByText("4.25%", { exact: true })).not.toBeInTheDocument();
    expect(container.querySelector('[data-testid="trends-chart-skeleton"]')).toBeNull();
    expect(container.querySelector("strong.text-slate-300")).toBeNull();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
    requestState.error = "";
  });
});
