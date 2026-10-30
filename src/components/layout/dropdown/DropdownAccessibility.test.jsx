import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

import ThemedDropdown from "./ThemedDropdown";
import UserDropdown from "./UserDropdown";
import NotificationDropdown from "./NotificationDropdown";
import ProfileDropdown from "../profile/ProfileDropdown";

// Mock UserContext, HeaderContext, AdminContext for UserDropdown
vi.mock("../../../services/context/UserContext", () => ({
  useUser: () => ({
    user: { id: "1", firstName: "Jane", lastName: "Doe", role: "employee", email: "jane@sibs.com" },
    setUser: vi.fn(),
    refetchUser: vi.fn(),
  }),
}));

vi.mock("../../../services/context/HeaderContext", () => ({
  useHeader: () => ({
    setAdminLogin: vi.fn(),
  }),
}));

vi.mock("../../../services/context/AdminContext", () => ({
  useAdmin: () => ({
    getAccessLabel: () => "Admin",
    ADMIN_ROLES: ["hr_admin", "super_admin"],
  }),
}));

// Mock SidebarNotificationContext for NotificationDropdown
vi.mock("../../../services/context/SidebarNotificationContext", () => ({
  useSidebarNotifications: () => ({
    notificationsList: [
      { id: "1", title: "Time-off approval needed", category: "approvals", type: "action" },
      { id: "2", title: "System maintenance tonight", category: "system", type: "warning" },
    ],
    fullNotificationsList: [],
    unreadCount: 1,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  }),
}));

// Mock getMyResignationStatus for ProfileDropdown
vi.mock("../../../lib/axios/getMyResignationStatus.js", () => ({
  getMyResignationStatus: vi.fn(async () => ({ latest: null })),
}));

describe("Dropdown Accessibility & WAI-ARIA Verification", () => {
  describe("ThemedDropdown (Selector)", () => {
    const sampleOptions = [
      { value: "eng", label: "Engineering" },
      { value: "ops", label: "Operations" },
      { value: "hr", label: "Human Resources" },
    ];

    it("renders combobox and listbox semantics in searchable mode", async () => {
      render(
        <ThemedDropdown
          label="Department"
          placeholder="Select department..."
          options={sampleOptions}
          value="ops"
          onChange={vi.fn()}
        />
      );

      const combobox = screen.getByRole("combobox", { name: /department/i });
      expect(combobox).toBeInTheDocument();
      expect(combobox).toHaveAttribute("aria-expanded", "false");
      expect(combobox).toHaveAttribute("aria-haspopup", "listbox");
      expect(combobox).toHaveAttribute("aria-autocomplete", "list");

      const listboxId = combobox.getAttribute("aria-controls");
      expect(listboxId).toBeTruthy();

      // Open dropdown on focus
      fireEvent.focus(combobox);
      expect(combobox).toHaveAttribute("aria-expanded", "true");

      const listbox = document.getElementById(listboxId);
      expect(listbox).toBeInTheDocument();
      expect(listbox).toHaveAttribute("role", "listbox");

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(3);
      expect(options[1]).toHaveAttribute("aria-selected", "true");
      expect(options[0]).toHaveAttribute("aria-selected", "false");
    });

    it("supports keyboard arrow navigation and Enter selection via aria-activedescendant", async () => {
      const handleChange = vi.fn();
      render(
        <ThemedDropdown
          label="Department"
          placeholder="Select department..."
          options={sampleOptions}
          value=""
          onChange={handleChange}
        />
      );

      const combobox = screen.getByRole("combobox", { name: /department/i });
      fireEvent.focus(combobox);
      expect(combobox).toHaveAttribute("aria-expanded", "true");

      // Press ArrowDown to highlight first option
      fireEvent.keyDown(document, { key: "ArrowDown" });
      const listboxId = combobox.getAttribute("aria-controls");
      expect(combobox).toHaveAttribute("aria-activedescendant", `${listboxId}-option-0`);

      // Press ArrowDown again to highlight second option
      fireEvent.keyDown(document, { key: "ArrowDown" });
      expect(combobox).toHaveAttribute("aria-activedescendant", `${listboxId}-option-1`);

      // Press Enter to select highlighted option
      fireEvent.keyDown(document, { key: "Enter" });
      expect(handleChange).toHaveBeenCalledWith("ops", sampleOptions[1]);
      expect(combobox).toHaveAttribute("aria-expanded", "false");
    });

    it("restores focus to combobox on Escape key", async () => {
      render(
        <ThemedDropdown
          label="Department"
          placeholder="Select department..."
          options={sampleOptions}
          value=""
          onChange={vi.fn()}
        />
      );

      const combobox = screen.getByRole("combobox", { name: /department/i });
      fireEvent.focus(combobox);
      expect(combobox).toHaveAttribute("aria-expanded", "true");

      // Press Escape
      fireEvent.keyDown(document, { key: "Escape" });
      expect(combobox).toHaveAttribute("aria-expanded", "false");
      expect(document.activeElement).toBe(combobox);
    });

    it("supports non-searchable selector with button combobox semantics", () => {
      render(
        <ThemedDropdown
          label="Role"
          placeholder="Select role..."
          searchable={false}
          options={sampleOptions}
          value=""
          onChange={vi.fn()}
        />
      );

      const buttonCombobox = screen.getByRole("combobox", { name: /role/i });
      expect(buttonCombobox).toBeInTheDocument();
      expect(buttonCombobox).toHaveAttribute("aria-haspopup", "listbox");
      expect(buttonCombobox).toHaveAttribute("aria-expanded", "false");

      fireEvent.click(buttonCombobox);
      expect(buttonCombobox).toHaveAttribute("aria-expanded", "true");
    });

    it("invokes onChange with selected value and closes listbox", async () => {
      const handleChange = vi.fn();
      render(
        <ThemedDropdown
          label="Department"
          options={sampleOptions}
          value=""
          onChange={handleChange}
        />
      );

      const combobox = screen.getByRole("combobox", { name: /department/i });
      fireEvent.focus(combobox);

      const optionEng = screen.getByRole("option", { name: /engineering/i });
      fireEvent.click(optionEng);

      expect(handleChange).toHaveBeenCalledWith("eng", sampleOptions[0]);
      expect(combobox).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("UserDropdown (User Actions Menu)", () => {
    it("renders button menu trigger with aria-haspopup and accessible label", async () => {
      render(
        <BrowserRouter>
          <UserDropdown formattedName="Jane Doe" email="jane@sibs.com" />
        </BrowserRouter>
      );

      const trigger = screen.getByRole("button", { name: /user menu: jane doe/i });
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute("aria-haspopup", "menu");
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      // Click to open menu
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      const menu = screen.getByRole("menu", { name: /user actions/i });
      expect(menu).toBeInTheDocument();

      const logoutItem = screen.getByRole("menuitem", { name: /logout/i });
      expect(logoutItem).toBeInTheDocument();

      // Escape closes menu and restores focus to trigger button
      fireEvent.keyDown(document, { key: "Escape" });
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(document.activeElement).toBe(trigger);
    });

    it("supports arrow key navigation across menuitems", async () => {
      render(
        <BrowserRouter>
          <UserDropdown formattedName="Jane Doe" email="jane@sibs.com" />
        </BrowserRouter>
      );

      const trigger = screen.getByRole("button", { name: /user menu: jane doe/i });
      fireEvent.click(trigger);

      const menu = screen.getByRole("menu", { name: /user actions/i });
      const items = screen.getAllByRole("menuitem");
      expect(items.length).toBeGreaterThan(0);

      // Press ArrowDown inside menu
      fireEvent.keyDown(menu, { key: "ArrowDown" });
      expect(document.activeElement).toBe(items[0]);
    });
  });

  describe("NotificationDropdown (Notification Dialog)", () => {
    it("renders trigger button with dialog semantics and category tabs with tablist semantics", async () => {
      render(
        <BrowserRouter>
          <NotificationDropdown />
        </BrowserRouter>
      );

      const trigger = screen.getByRole("button", { name: /notifications/i });
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      const dialog = screen.getByRole("dialog", { name: /notifications/i });
      expect(dialog).toBeInTheDocument();
      // Verified non-modal popup: aria-modal is NOT set to true because panel does not trap focus
      expect(dialog).not.toHaveAttribute("aria-modal", "true");

      const tablist = screen.getByRole("tablist", { name: /notification categories/i });
      expect(tablist).toBeInTheDocument();

      const tabs = screen.getAllByRole("tab");
      expect(tabs.length).toBe(3);
      expect(tabs[0]).toHaveAttribute("aria-selected", "true"); // "All" tab active by default
      expect(tabs[0]).toHaveAttribute("tabindex", "0");
      expect(tabs[1]).toHaveAttribute("tabindex", "-1");

      // ArrowRight cycles to next tab
      fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
      expect(tabs[1]).toHaveAttribute("aria-selected", "true");

      // Explicit close button restores focus
      const closeButton = screen.getByRole("button", { name: /close notifications/i });
      fireEvent.click(closeButton);

      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(document.activeElement).toBe(trigger);
    });
  });

  describe("ProfileDropdown (Additional Actions Menu)", () => {
    it("renders menu semantics and responds to Escape key", async () => {
      const handleOpenDropdown = vi.fn();
      const handleOpenModal = vi.fn();

      render(
        <ProfileDropdown
          openDropdown={handleOpenDropdown}
          openModal={handleOpenModal}
          onViewResignation={vi.fn()}
        />
      );

      const menu = screen.getByRole("menu", { name: /additional actions/i });
      expect(menu).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByRole("menuitem", { name: /submit resignation/i })).toBeInTheDocument();
      });

      // Escape key closes menu
      fireEvent.keyDown(document, { key: "Escape" });
      expect(handleOpenDropdown).toHaveBeenCalledWith(false);
    });
  });
});
