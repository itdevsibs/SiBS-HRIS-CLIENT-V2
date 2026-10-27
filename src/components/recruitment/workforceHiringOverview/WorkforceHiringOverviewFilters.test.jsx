import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import WorkforceHiringOverviewFilters from "./WorkforceHiringOverviewFilters";

const fixture = vi.hoisted(() => ({ cluster: ["Operations"], account: ["Support"] }));

vi.mock("../../../services/context/WorkforceHiringContext", () => ({
  useWorkforceHiring: () => ({ weeklyVersion: {} }),
}));

vi.mock("../../../services/context/WorkforceHiringContextAdapter", async () => {
  const { useState } = await import("react");
  return {
    useWorkforceHiringView: function useTestView() {
      const [weeklyVersion, setWeeklyVersion] = useState("week-44");
      const [cluster, setCluster] = useState(fixture.cluster);
      const [account, setAccount] = useState(fixture.account);
      return {
        filters: {
          weeklyVersion, setWeeklyVersion, cluster, setCluster, account, setAccount,
          options: {
            weeklyVersions: [
              { id: "week-44", year: 2026, weekNumber: 44 },
              { id: "week-43", year: 2026, weekNumber: 43 },
            ],
            clusters: ["Operations"],
            accounts: ["Support"],
          },
        },
        status: {},
      };
    },
  };
});

it.each([
  { cluster: ["Operations"], account: ["Support"], clusterLabel: "Operations", accountLabel: "Support" },
  { cluster: ["All Clusters"], account: ["All Accounts"], clusterLabel: "All Clusters", accountLabel: "All Accounts" },
])("preserves $accountLabel and keeps accounts usable when changing weeks", async (selection) => {
  fixture.cluster = selection.cluster;
  fixture.account = selection.account;
  render(<WorkforceHiringOverviewFilters />);

  fireEvent.click(screen.getByRole("button", { name: "2026 - Week 44" }));
  fireEvent.click(await screen.findByRole("button", { name: /^2026 - Week 43/ }));

  expect(screen.getByRole("button", { name: "2026 - Week 43", exact: true })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: selection.clusterLabel })).toBeInTheDocument();
  const accountInput = screen.getByRole("textbox");
  expect(accountInput).toBeEnabled();
  expect(accountInput).toHaveValue(selection.accountLabel);
  fireEvent.focus(accountInput);
  expect(await screen.findByRole("button", { name: "Support" })).toBeInTheDocument();
});

it("selects all clusters when the last chosen cluster is unchecked", async () => {
  fixture.cluster = ["Operations"];
  fixture.account = ["Support"];
  render(<WorkforceHiringOverviewFilters />);

  fireEvent.click(screen.getByRole("button", { name: "Operations" }));
  fireEvent.click((await screen.findAllByRole("button", { name: "Operations" })).at(-1));

  expect(screen.getAllByRole("button", { name: "All Clusters" })[0]).toBeInTheDocument();
  expect(screen.getByRole("textbox")).toBeEnabled();
});

it("selects all accounts when the last chosen account is unchecked", async () => {
  fixture.cluster = ["Operations"];
  fixture.account = ["Support"];
  render(<WorkforceHiringOverviewFilters />);

  fireEvent.focus(screen.getByRole("textbox"));
  fireEvent.click(await screen.findByRole("button", { name: "Support" }));
  fireEvent.mouseDown(document.body);

  expect(screen.getByRole("textbox")).toHaveValue("All Accounts");
});
