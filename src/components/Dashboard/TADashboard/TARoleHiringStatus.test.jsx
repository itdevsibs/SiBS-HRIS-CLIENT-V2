import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import TARoleHiringStatus from "./TARoleHiringStatus";

const sampleRole = {
  id: "role-1",
  roleTitle: "People Operations Analyst",
  roleAccount: "People Operations Analyst - HQ",
  account: "Head Office",
  department: "People Operations",
  taOwner: "Mara Cruz",
  status: "At Risk",
  riskFlag: "High",
  req: 4,
  filled: 2,
  open: 2,
  aging: 17,
  dueDate: "2026-10-15",
};

describe("TARoleHiringStatus", () => {
  it("uses shared search, status, pagination, and status badges", async () => {
    const onSearchChange = vi.fn();
    const onSearchKeyDown = vi.fn();
    const onStatusChange = vi.fn();
    const onPageChange = vi.fn();
    const onClearFilters = vi.fn();
    const { container } = render(
      <TARoleHiringStatus
        roles={[sampleRole]}
        totalRoles={14}
        searchInput="analyst"
        onSearchChange={onSearchChange}
        onSearchKeyDown={onSearchKeyDown}
        status="At Risk"
        onStatusChange={onStatusChange}
        hasActiveFilters
        onClearFilters={onClearFilters}
        onViewRole={vi.fn()}
        currentPage={2}
        totalPages={3}
        onPageChange={onPageChange}
      />,
    );

    expect(container.querySelector(".sibs-dashboard-input")).toBeInTheDocument();
    expect(container.querySelector(".sibs-data-table-th")).toBeInTheDocument();
    expect(screen.getAllByText("People Operations Analyst")).toHaveLength(2);
    expect(screen.getAllByText("Mara Cruz")).toHaveLength(2);
    expect(container).toHaveTextContent("Showing 7–7 of 14 roles");
    expect(screen.getAllByText("At Risk").some((node) =>
      node.classList.contains("sibs-badge-warning"),
    )).toBe(true);
    expect(screen.getAllByText("Risk: High").some((node) =>
      node.classList.contains("sibs-badge-danger"),
    )).toBe(true);

    const search = screen.getByRole("textbox", { name: /search by role/i });
    fireEvent.change(search, {
      target: { value: "engineer" },
    });
    expect(onSearchChange).toHaveBeenCalledWith("engineer", expect.anything());
    fireEvent.keyDown(search, { key: "Enter" });
    expect(onSearchKeyDown).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Status: At Risk" }));
    fireEvent.click(await screen.findByRole("option", { name: "On Track" }));
    expect(onStatusChange).toHaveBeenCalledWith(
      "On Track",
      expect.objectContaining({ value: "On Track" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClearFilters).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("preserves keyboard and click access to the role detail action", () => {
    const onViewRole = vi.fn();
    render(
      <TARoleHiringStatus
        roles={[sampleRole]}
        onViewRole={onViewRole}
        searchInput=""
        status="All"
        currentPage={1}
        totalPages={1}
      />,
    );

    fireEvent.click(document.querySelector('tr[aria-label^="Open details for"]'));
    expect(onViewRole).toHaveBeenCalledWith(sampleRole);
  });
});
