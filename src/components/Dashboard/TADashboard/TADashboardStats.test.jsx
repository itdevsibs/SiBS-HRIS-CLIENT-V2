import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Briefcase } from "lucide-react";
import TADashboardSkeleton from "./TADashboardSkeleton";

import TADashboardStats from "./TADashboardStats";

vi.mock("../../layout/Header", () => ({ default: () => null }));

const metrics = Array.from({ length: 8 }, (_, index) => ({
  id: `metric-${index}`,
  label: `Metric ${index + 1}`,
  value: String(index + 1),
  description: `Description ${index + 1}`,
  icon: Briefcase,
  tone: index === 3 ? "rose" : index === 7 ? "slate" : "navy",
}));

describe("TADashboardStats", () => {
  it("uses the shared metric grid while retaining all eight TA metrics", () => {
    const { container } = render(<TADashboardStats metrics={metrics} />);

    expect(container.firstChild).toHaveClass(
      "grid-cols-1",
      "sm:grid-cols-2",
      "md:grid-cols-3",
      "xl:grid-cols-3",
      "2xl:grid-cols-6",
    );
    expect(screen.getAllByRole("article")).toHaveLength(8);
    expect(screen.getByText("Description 8")).toBeInTheDocument();
    expect(screen.getByText("Metric 4")).toHaveClass("sibs-tone-red-label");
    expect(screen.getByText("Metric 8")).toHaveClass("sibs-tone-navy-label");
  });

  it("matches the responsive metric breakpoints in the loading skeleton", () => {
    const { container } = render(<TADashboardSkeleton />);
    const metrics = screen.getAllByTestId("ta-skeleton-metric");
    const grid = metrics[0].parentElement;

    expect(metrics).toHaveLength(8);
    expect(grid).toHaveClass(
      "grid-cols-1",
      "sm:grid-cols-2",
      "md:grid-cols-3",
      "xl:grid-cols-3",
      "2xl:grid-cols-6",
    );
    expect(container.querySelector("[aria-label='Loading TA dashboard']"))
      .toBeInTheDocument();
  });
});
