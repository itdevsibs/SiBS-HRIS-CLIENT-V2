import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import useWorkforceHiringPage from "./useWorkforceHiringPage";

const state = vi.hoisted(() => ({ snapshot: null, reads: [] }));
const api = vi.hoisted(() => ({
  getWorkforceHiringPlanWeeks: vi.fn(), getWorkforceHiringPlanFilterOptions: vi.fn(),
  getWorkforceHiringPlanAccountOptions: vi.fn(), getWorkforceHiringPlanAccounts: vi.fn(),
  getWorkforceHiringPlanAccountTrends: vi.fn(), getWorkforceHiringPlanSixWeekTable: vi.fn(),
  getWorkforceHiringPlanForecast: vi.fn(), lockWorkforceHiringPlanSnapshot: vi.fn(),
  openWorkforceHiringPlanFile: vi.fn(), saveRequiredHeadcount: vi.fn(),
  saveWorkforceHiringPlanActionItem: vi.fn(), updateWorkforceHiringPlanFile: vi.fn(),
}));
vi.mock("../../lib/axios/getWorkforceHiringPlan", () => api);
vi.mock("../../services/context/UserContext", () => ({ useUser: () => ({ user: { role: "super_admin", adminAccess: 1 } }) }));
vi.mock("../../services/context/WorkforceHiringContext", () => ({ useRegisterWorkforceHiringPage: (value) => { state.snapshot = value; } }));
vi.mock("./useWorkforceHiringAi", () => ({ default: () => ({ aiInsightResult: { insight: "" }, aiInsightConversation: [] }) }));

beforeEach(() => {
  vi.clearAllMocks(); state.reads = []; state.snapshot = null;
  api.getWorkforceHiringPlanWeeks.mockResolvedValue([{ startDate: "2026-10-19", endDate: "2026-10-25", weekNumber: 43 }]);
  api.getWorkforceHiringPlanFilterOptions.mockResolvedValue({ clusters: ["C"], accounts: [] });
  api.getWorkforceHiringPlanAccountOptions.mockResolvedValue([{ id: 4, accountName: "A" }, { id: 5, accountName: "B" }]);
  api.getWorkforceHiringPlanAccountTrends.mockResolvedValue({ success: true, sixWeekTableRows: [], sixWeekTableWeeks: [] });
  api.getWorkforceHiringPlanAccounts.mockImplementation((...args) => new Promise((resolve, reject) => state.reads.push({ args, resolve, reject })));
});

it("loads history independently and ignores a stale account response after a filter change", async () => {
  const hook = renderHook(() => useWorkforceHiringPage({ fastOverviewMode: true }));
  await waitFor(() => expect(state.reads.length).toBeGreaterThan(0));
  await waitFor(() => expect(api.getWorkforceHiringPlanAccountTrends).toHaveBeenCalled());
  const stale = state.reads[0];
  act(() => state.snapshot.weeklyVersion.setSelectedAccounts(["B"]));
  await waitFor(() => expect(state.reads.some((read) => read.args[3] === "B")).toBe(true));
  const current = state.reads.findLast((read) => read.args[3] === "B");
  await act(async () => current.resolve([{ id: 5, accountName: "B", actualHeadcount: 9 }]));
  await waitFor(() => expect(state.snapshot.weeklyVersion.accountDataReady).toBe(true));
  await act(async () => stale.resolve([{ id: 4, accountName: "A", actualHeadcount: 99 }]));
  expect(stale.args[5].signal.aborted).toBe(true);
  expect(state.snapshot.tables.displayData.map((row) => row.account)).toEqual(["B"]);
  hook.unmount();
});

it("a metadata failure settles loading and exposes a retryable error", async () => {
  api.getWorkforceHiringPlanWeeks.mockRejectedValueOnce(new Error("Metadata unavailable"));
  const hook = renderHook(() => useWorkforceHiringPage({ fastOverviewMode: true }));
  await waitFor(() => expect(state.snapshot.weeklyVersion.accountDataError).toBe("Metadata unavailable"));
  expect(state.snapshot.weeklyVersion.accountDataLoading).toBe(false);
  expect(state.snapshot.weeklyVersion.weeksLoading).toBe(false);
  expect(state.snapshot.tables.sixWeekTableLoading).toBe(false);
  hook.unmount();
});

it("loads all accounts in a newly selected overview cluster instead of leaving empty metrics", async () => {
  const hook = renderHook(() => useWorkforceHiringPage({
    fastOverviewMode: true,
    requireFilterSelection: false,
  }));
  await waitFor(() => expect(state.reads.length).toBeGreaterThan(0));
  await act(async () => state.reads[0].resolve([{ id: 4, accountName: "A", actualHeadcount: 5 }]));
  await waitFor(() => expect(state.snapshot.weeklyVersion.accountDataReady).toBe(true));

  act(() => state.snapshot.weeklyVersion.setSelectedClusters(["C"]));

  expect(state.snapshot.weeklyVersion.selectedAccounts).toEqual(["All"]);
  expect(state.snapshot.weeklyVersion.accountDataLoading).toBe(true);
  await waitFor(() => expect(state.reads.some((read) => read.args[0] === "C" && read.args[3] === "All")).toBe(true));
  const scopedRead = state.reads.findLast((read) => read.args[0] === "C" && read.args[3] === "All");
  await act(async () => scopedRead.resolve([{ id: 5, accountName: "B", clusterName: "C", actualHeadcount: 9 }]));
  await waitFor(() => expect(state.snapshot.weeklyVersion.accountDataReady).toBe(true));
  expect(state.snapshot.tables.displayData.map((row) => row.account)).toEqual(["B"]);
  hook.unmount();
});

it("keeps account selection explicit on the workforce plan page", async () => {
  const hook = renderHook(() => useWorkforceHiringPage({
    requireFilterSelection: true,
  }));
  await waitFor(() => expect(state.snapshot.weeklyVersion.activeWeek).toBeTruthy());

  act(() => state.snapshot.weeklyVersion.setSelectedClusters(["C"]));

  expect(state.snapshot.weeklyVersion.selectedAccounts).toEqual([]);
  expect(state.reads).toHaveLength(0);
  hook.unmount();
});
