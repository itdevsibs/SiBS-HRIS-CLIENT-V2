import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import SuperAdminAccessGovernance from "./SuperAdminAccessGovernance";

describe("SuperAdminAccessGovernance", () => {
  const sampleAdmins = [
    {
      id: "ADM-001",
      name: "Maria Santos",
      email: "maria.santos@thesiblingssolutions.com",
      accessLevel: "7 - Super Admin",
      department: "Executive",
      accountGroup: "Executive Office",
      status: "Active",
      lastActive: "10 mins ago",
    },
    {
      id: "ADM-002",
      name: "Juan Dela Cruz",
      email: "juan.delacruz@thesiblingssolutions.com",
      accessLevel: "3 - HR Admin",
      department: "Human Resources",
      accountGroup: "Internal HR Ops",
      status: "Active",
      lastActive: "1 hour ago",
    },
  ];

  it("TC-SA-07: renders admin table and search input", () => {
    render(
      <SuperAdminAccessGovernance
        admins={sampleAdmins}
        totalItems={2}
        pagination={{ currentPage: 1, totalPages: 1, onPageChange: vi.fn() }}
        accessOptions={["7 - Super Admin", "3 - HR Admin"]}
        accountOptions={["Executive Office", "Internal HR Ops"]}
        statusOptions={["Active", "Suspended"]}
      />,
    );

    expect(screen.getByText(/Admin Users & Access Levels \(2\)/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search admin name or email/i)).toBeInTheDocument();
    expect(screen.getAllByText("Maria Santos")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Juan Dela Cruz")[0]).toBeInTheDocument();
    expect(screen.getByText(/showing/i)).toHaveTextContent("Showing 1–2 of 2 admin users");
  });

  it("TC-SA-08: triggers search, add user, and edit access callbacks", () => {
    const handleSearchChange = vi.fn();
    const handleAddUser = vi.fn();
    const handleEditAccess = vi.fn();

    render(
      <SuperAdminAccessGovernance
        admins={sampleAdmins}
        totalItems={2}
        pagination={{ currentPage: 1, totalPages: 1, onPageChange: vi.fn() }}
        onSearchChange={handleSearchChange}
        onAddUser={handleAddUser}
        onEditAccess={handleEditAccess}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/Search admin name or email/i);
    fireEvent.change(searchInput, { target: { value: "Maria" } });
    expect(handleSearchChange).toHaveBeenCalledWith("Maria");

    const newAdminBtn = screen.getByRole("button", { name: /New Admin Account/i });
    fireEvent.click(newAdminBtn);
    expect(handleAddUser).toHaveBeenCalledTimes(1);

    const editButtons = screen.getAllByRole("button", { name: "Edit Access" });
    fireEvent.click(editButtons[0]);
    expect(handleEditAccess).toHaveBeenCalledWith(sampleAdmins[0]);
  });
});
