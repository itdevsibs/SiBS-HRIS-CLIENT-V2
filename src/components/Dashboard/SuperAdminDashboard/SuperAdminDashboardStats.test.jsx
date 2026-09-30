import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import SuperAdminDashboardStats from "./SuperAdminDashboardStats";

describe("SuperAdminDashboardStats", () => {
  it("TC-SA-01: renders 6 metric cards with fallback values", () => {
    render(<SuperAdminDashboardStats adminCount={12} />);

    expect(screen.getByText("Employees")).toBeInTheDocument();
    expect(screen.getByText("2,840")).toBeInTheDocument();
    expect(screen.getByText("Admin Users")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Attendance Flags")).toBeInTheDocument();
    expect(screen.getByText("Pending Approvals")).toBeInTheDocument();
    expect(screen.getByText("Leaves & Resignations")).toBeInTheDocument();
    expect(screen.getByText("Recruitment Funnel")).toBeInTheDocument();
  });

  it("TC-SA-02: renders live metric overrides when provided", () => {
    const liveMetrics = {
      employees: "3,150",
      departmentsCount: 22,
      admins: 15,
      attendanceFlags: 5,
      pendingApprovals: 9,
      leavesCount: 7,
      recruitmentCount: 88,
    };

    render(
      <SuperAdminDashboardStats
        adminCount={15}
        liveMetrics={liveMetrics}
      />,
    );

    expect(screen.getByText("3,150")).toBeInTheDocument();
    expect(screen.getByText("Across 22 active depts")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("88")).toBeInTheDocument();
  });

  it("TC-SA-03: invokes onMetricClick callback when card is clicked", () => {
    const handleClick = vi.fn();

    render(
      <SuperAdminDashboardStats
        adminCount={8}
        onMetricClick={handleClick}
      />,
    );

    const adminCard = screen.getByText("Admin Users").closest("button, article");
    expect(adminCard).toBeInTheDocument();

    fireEvent.click(adminCard);
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(
      expect.objectContaining({ key: "admins" }),
    );
  });
});
