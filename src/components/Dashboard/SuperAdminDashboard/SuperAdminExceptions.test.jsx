import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import SuperAdminExceptions from "./SuperAdminExceptions";

describe("SuperAdminExceptions", () => {
  const sampleItems = [
    {
      id: "EXC-101",
      title: "Unmapped Account Assignment",
      severity: "High",
      description: "Employee EMP-092 has no mapped account group.",
      moduleTarget: "Access Governance",
      daysPending: 4,
      assignedTo: "HR Admin",
      path: "/administration",
    },
    {
      id: "EXC-102",
      title: "Pending Resignation Clearance",
      severity: "Medium",
      description: "Asset return pending for supervisor signoff.",
      moduleTarget: "Resignations",
      daysPending: 2,
      assignedTo: "IT Support",
      path: "/resignation",
    },
  ];

  it("TC-SA-04: renders search input, target module filter, and exceptions", () => {
    render(
      <SuperAdminExceptions
        items={sampleItems}
        totalItems={2}
        pagination={{ currentPage: 1, totalPages: 1, onPageChange: vi.fn() }}
        moduleOptions={["All Modules", "Access Governance", "Resignations"]}
      />,
    );

    expect(screen.getByText(/Risk & Exception Escalation Desk \(2\)/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search exception title/i)).toBeInTheDocument();
    expect(screen.getByText("Unmapped Account Assignment")).toBeInTheDocument();
    expect(screen.getByText("Pending Resignation Clearance")).toBeInTheDocument();
    expect(screen.getByText(/showing/i)).toHaveTextContent("Showing 1–2 of 2 risk exceptions");
  });

  it("TC-SA-05: handles search changes and resolve actions", () => {
    const handleSearchChange = vi.fn();
    const handleResolve = vi.fn();
    const handleNavigate = vi.fn();

    render(
      <SuperAdminExceptions
        items={sampleItems}
        totalItems={2}
        pagination={{ currentPage: 1, totalPages: 1, onPageChange: vi.fn() }}
        onSearchChange={handleSearchChange}
        onResolve={handleResolve}
        onNavigate={handleNavigate}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/Search exception title/i);
    fireEvent.change(searchInput, { target: { value: "Unmapped" } });
    expect(handleSearchChange).toHaveBeenCalledWith("Unmapped");

    const resolveButtons = screen.getAllByRole("button", { name: "Mark Resolved" });
    fireEvent.click(resolveButtons[0]);
    expect(handleResolve).toHaveBeenCalledWith("EXC-101");

    const openButtons = screen.getAllByRole("button", { name: "Open Module" });
    fireEvent.click(openButtons[0]);
    expect(handleNavigate).toHaveBeenCalledWith("/administration");
  });

  it("TC-SA-06: renders empty state when no items match", () => {
    render(
      <SuperAdminExceptions
        items={[]}
        totalItems={0}
        pagination={{ currentPage: 1, totalPages: 1, onPageChange: vi.fn() }}
      />,
    );

    expect(screen.getByText("No Risk Exceptions Found")).toBeInTheDocument();
    expect(screen.getByText(/showing/i)).toHaveTextContent("Showing 0 of 0 risk exceptions");
  });
});
