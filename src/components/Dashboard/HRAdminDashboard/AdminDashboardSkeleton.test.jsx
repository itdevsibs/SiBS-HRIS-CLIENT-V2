import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import AdminDashboardSkeleton from "./AdminDashboardSkeleton";

vi.mock("../../layout/Header", () => ({
  default: () => <div aria-hidden="true" />,
}));

describe("AdminDashboardSkeleton", () => {
  it("matches the live KPI labels and responsive grid", () => {
    render(<AdminDashboardSkeleton />);

    const metricGrid = screen.getByTestId("metric-grid-skeleton");
    expect(metricGrid).toHaveClass(
      "grid-cols-1",
      "sm:grid-cols-2",
      "md:grid-cols-3",
      "xl:grid-cols-3",
      "2xl:grid-cols-6",
    );
    expect(screen.getByText("Payroll")).toBeInTheDocument();
    expect(screen.queryByText("Active Requisitions")).not.toBeInTheDocument();
  });
});
