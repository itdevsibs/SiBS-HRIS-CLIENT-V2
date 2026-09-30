import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { DashboardModalManager } from "./AdminDashboardModals";

afterEach(() => {
  vi.useRealTimers();
});

describe("DashboardModalManager", () => {
  it("shows the final-page range and preserves employee fields in mobile and desktop views", () => {
    const employees = [
      { id: "S-1001", name: "Ava Santos", department: "Human Resources", role: "HR Admin", shift: "Day Shift", status: "On Leave" },
      { id: "S-1002", name: "Ben Cruz", department: "Operations", role: "Supervisor", shift: "Night Shift", status: "Present" },
      { id: "S-1003", name: "Cara Lim", department: "Finance", role: "Analyst", shift: "Day Shift", status: "Present" },
      { id: "S-1004", name: "Drew Tan", department: "Talent Acquisition", role: "Recruiter", shift: "Mid Shift", status: "Late" },
    ];

    render(
      <DashboardModalManager
        activeModal="employees"
        detail={{
          data: employees,
          pagination: { currentPage: 3, totalPages: 3, total: 34, limit: 15 },
        }}
      />,
    );

    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Showing 31–34 of 34 records",
    );
    expect(screen.getAllByText("Ava Santos")).toHaveLength(2);
    expect(screen.getAllByText("Human Resources")).toHaveLength(2);
    expect(screen.getAllByText("Day Shift")).toHaveLength(4);
    expect(screen.getAllByText("On Leave")).toHaveLength(2);
    expect(screen.getAllByRole("columnheader")[0]).toHaveClass(
      "sibs-data-table-th",
    );
  });

  it("keeps search debounced and exposes the shared clear-search action", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();

    render(
      <DashboardModalManager
        activeModal="employees"
        detail={{ data: [], pagination: { currentPage: 1, totalPages: 1, total: 0, limit: 15 } }}
        onSearch={onSearch}
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Search live records" }), {
      target: { value: "Ava" },
    });

    expect(screen.getByRole("button", { name: "Clear search input" })).toBeInTheDocument();
    expect(onSearch).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(349));
    expect(onSearch).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onSearch).toHaveBeenLastCalledWith("Ava");
  });
});
