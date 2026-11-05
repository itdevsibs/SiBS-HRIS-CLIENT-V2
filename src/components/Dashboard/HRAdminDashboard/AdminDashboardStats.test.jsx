import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AdminDashboardStats from "./AdminDashboardStats";

describe("HR dashboard primary metrics", () => {
  it("does not show the payroll eligibility card", () => {
    render(
      <AdminDashboardStats
        metrics={[
          { id: "employees", label: "Active Employees", value: "507" },
          { id: "payroll", label: "Payroll", value: "507" },
        ]}
      />,
    );

    expect(screen.getByText("Active Employees")).toBeInTheDocument();
    expect(screen.queryByText("Payroll")).not.toBeInTheDocument();
  });
});
