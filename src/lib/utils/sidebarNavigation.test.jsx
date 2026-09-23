import { describe, expect, it } from "vitest";

import {
  getVisibleSidebarGroups,
  hasSidebarGroupAttention,
  isSidebarGroupOpen,
  isSidebarGroupActive,
} from "./sidebarNavigation";

const groups = [
  {
    id: "planning",
    items: [
      { name: "Hiring Needs", path: "/recruitment/hiring-needs", allowedUsers: [2], alertNotificationKey: "needsAlert" },
      { name: "Available Positions", path: "/recruitment/available-positions", allowedUsers: [7] },
    ],
  },
  {
    id: "finance",
    items: [{ name: "Payroll", path: "/payroll", allowedUsers: [4] }],
  },
];

describe("sidebar navigation groups", () => {
  it("keeps only a user's permitted child links and hides empty groups", () => {
    expect(getVisibleSidebarGroups(groups, 2)).toEqual([
      {
        id: "planning",
        items: [
          {
            name: "Hiring Needs",
            path: "/recruitment/hiring-needs",
            allowedUsers: [2],
            alertNotificationKey: "needsAlert",
          },
        ],
      },
    ]);
  });

  it("marks a group active when the current route belongs to one of its child pages", () => {
    expect(isSidebarGroupActive(groups[0], "/recruitment/hiring-needs/42")).toBe(true);
    expect(isSidebarGroupActive(groups[0], "/recruitment/talent-pool")).toBe(false);
  });

  it("surfaces group attention when any visible child has a notification", () => {
    expect(
      hasSidebarGroupAttention(groups[0], {
        needsAlert: { count: 1, tone: "warning" },
      }),
    ).toBe(true);
    expect(hasSidebarGroupAttention(groups[0], {})).toBe(false);
  });

  it("keeps an active group open after navigation but respects an explicit close on the current route", () => {
    expect(isSidebarGroupOpen(groups[0], "/recruitment/hiring-needs", {}, null)).toBe(true);
    expect(
      isSidebarGroupOpen(groups[0], "/recruitment/hiring-needs", {}, {
        groupId: "planning",
        pathname: "/recruitment/hiring-needs",
      }),
    ).toBe(false);
    expect(
      isSidebarGroupOpen(groups[0], "/recruitment/hiring-needs/42", {}, {
        groupId: "planning",
        pathname: "/recruitment/hiring-needs",
      }),
    ).toBe(true);
  });

  it("surfaces group attention for a visible label-only badge", () => {
    expect(
      hasSidebarGroupAttention(
        { id: "operations", items: [{ name: "Weekly Reports", path: "/reports", badge: "RAMPS" }] },
        {},
      ),
    ).toBe(true);
  });
});
