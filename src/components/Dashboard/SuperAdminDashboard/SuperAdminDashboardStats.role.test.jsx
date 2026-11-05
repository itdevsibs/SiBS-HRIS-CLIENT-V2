import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SuperAdminDashboardStats from "./SuperAdminDashboardStats";

describe("Super Admin primary KPIs", () => {
  it("keeps operational alerts primary and leaves access and recruitment in their detail sections", () => {
    render(<SuperAdminDashboardStats adminCount={3} liveMetrics={{
      employees: 80,
      attendanceFlags: 5,
      pendingApprovals: 6,
      leavesCount: 4,
      recruitmentCount: 10,
    }} />);

    expect(screen.getByText("Active Employees")).toBeInTheDocument();
    expect(screen.getByText("Attendance Flags")).toBeInTheDocument();
    expect(screen.getByText("Pending Approvals")).toBeInTheDocument();
    expect(screen.getByText("Pending Leaves")).toBeInTheDocument();
    expect(screen.queryByText("Users with Access")).not.toBeInTheDocument();
    expect(screen.queryByText("Recruitment Funnel")).not.toBeInTheDocument();
  });
});
