import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import AdminDashboardActivity from "./AdminDashboardActivity";
import AdminDashboardNotifications from "./AdminDashboardNotifications";
import AdminDashboardQuickActions from "./AdminDashboardQuickActions";

vi.mock("../../../services/context/SidebarNotificationContext", () => ({
  useSidebarNotifications: () => ({
    notificationsList: [],
    dismissNotification: vi.fn(),
  }),
}));

describe("HR Admin dashboard panels", () => {
  it("uses the shared leave tone for activity markers", () => {
    render(
      <AdminDashboardActivity
        activities={[
          { id: "leave-1", type: "leave", user: "Ava Santos", action: "requested leave", details: "Annual leave", time: "Today" },
        ]}
      />,
    );

    const activity = screen.getByText(/requested leave/).closest("article");
    expect(activity.querySelector("span.rounded-full")).toHaveClass(
      "sibs-tone-amber-icon",
    );
  });

  it("uses the shared orange tone for quick-action icons and keeps actions clickable", () => {
    const onAction = vi.fn();
    render(
      <AdminDashboardQuickActions
        actions={[
          { id: "employees", title: "Employee Directory", description: "Open employee records" },
        ]}
        onAction={onAction}
      />,
    );

    const action = screen.getByRole("button", { name: /Employee Directory/ });
    expect(action.querySelector("span.flex")).toHaveClass("sibs-tone-orange-icon");
    expect(action.querySelector("svg")).toHaveClass("text-sibs-faint");

    fireEvent.click(action);
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: "employees" }),
    );
  });

  it.each([
    ["action", "sibs-tone-blue-icon", "sibs-btn-primary"],
    ["warning", "sibs-tone-amber-icon", "sibs-btn-secondary"],
    ["info", "sibs-tone-navy-icon", "sibs-btn-secondary"],
  ])("uses shared SiBS styling for %s notifications", (type, iconTone, buttonTone) => {
    const onAction = vi.fn();
    render(
      <AdminDashboardNotifications
        notifications={[
          {
            id: `${type}-notice`,
            type,
            title: `${type} notice`,
            message: "A dashboard item needs review.",
            actionLabel: "Review",
          },
        ]}
        onAction={onAction}
      />,
    );

    const notice = screen.getByText(`${type} notice`).closest("article");
    expect(notice).toHaveClass("border-sibs-border-panel");
    expect(notice.querySelector("span.rounded-lg")).toHaveClass(iconTone);

    const action = screen.getByRole("button", { name: "Review" });
    expect(action).toHaveClass(buttonTone);
    fireEvent.click(action);
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
