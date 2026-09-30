import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import AdminDashboardStats from "./AdminDashboardStats";

const metrics = [
  { id: "employees", label: "Employees", value: "520", description: "Active employees", tone: "orange" },
  { id: "departments", label: "Departments", value: "12", description: "Active departments", tone: "navy" },
  { id: "attendance", label: "Attendance", value: "410", description: "Present today", badge: "92.0%", tone: "green" },
  { id: "interviews", label: "Interviews Today", value: "8", description: "Scheduled interviews", tone: "indigo" },
  { id: "payroll", label: "Payroll", value: "480", description: "Payroll eligible", tone: "amber" },
];

describe("AdminDashboardStats", () => {
  it("uses the shared responsive metric grid breakpoints", () => {
    const { container } = render(<AdminDashboardStats metrics={metrics} />);

    expect(container.firstChild).toHaveClass(
      "grid-cols-1",
      "sm:grid-cols-2",
      "md:grid-cols-3",
      "xl:grid-cols-3",
      "2xl:grid-cols-6",
    );
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("preserves metric values and sends the selected metric to its click handler", () => {
    const onMetricClick = vi.fn();
    render(
      <AdminDashboardStats metrics={metrics} onMetricClick={onMetricClick} />,
    );

    expect(screen.getByText("520")).toBeInTheDocument();
    expect(screen.getByText("92.0%")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Departments/ }));

    expect(onMetricClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "departments" }),
    );
  });
});
