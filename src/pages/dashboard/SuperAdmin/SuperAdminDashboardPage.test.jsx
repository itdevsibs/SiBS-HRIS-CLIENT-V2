import React, { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { PaginationProvider } from "../../../services/context/PaginationContext";
import SuperAdminDashboardPage from "./SuperAdminDashboardPage";

const api = vi.hoisted(() => ({
  overview: vi.fn(), feed: vi.fn(), employees: vi.fn(),
  users: vi.fn(), approvals: vi.fn(), leaves: vi.fn(),
}));
vi.mock("../../../lib/axios/getHrDashboard", () => ({
  getHrDashboardOverview: api.overview, getHrDashboardFeed: api.feed,
}));
vi.mock("../../../lib/axios/getEmployee", () => ({ getEmployee: api.employees }));
vi.mock("../../../lib/axios/userSettings", () => ({ getUserSettingsUsers: api.users }));
vi.mock("../../../lib/axios/getApprovalRequest", () => ({ getApprovalRequests: api.approvals }));
vi.mock("../../../lib/axios/getLeaves", () => ({ getLeaves: api.leaves }));
vi.mock("../../../lib/axios/getCandidatePipeline", () => ({
  getActiveCandidateCountCacheKey: () => "test-cache-key",
  getActiveCandidatePipelineCount: vi.fn().mockResolvedValue(10),
  getCachedActiveCandidatePipelineCount: () => 10,
  subscribeActiveCandidatePipelineCount: () => () => {},
}));
// Global header and authentication have their own unrelated network/session lifecycle.
vi.mock("../../../components/layout/Header", () => ({ default: () => null }));
vi.mock("../../../services/context/UserContext", () => ({
  useUser: () => ({ user: { firstName: "Test", role: "super_admin" } }),
}));

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

const employee = {
  sibsId: "EMP-1", fullName: "Directory Admin", email: "directory@example.com",
  adminAccess: 7, role: "super_admin", department: "HR", account: "Internal",
};
const payloads = {
  overview: { metrics: { employees: 80, departments: 5 }, attendance: { late: 2, absent: 3 } },
  feed: { recentActivities: [{ id: "LOG-1", actor: "Audit Actor", action: "UPDATED_EMPLOYEE", details: "Updated directory", status: "Success" }] },
  employees: { data: [employee], pagination: { total: 42 }, departmentOptions: ["HR", "TA"] },
  users: { data: [{ id: "USER-1", fullName: "Assigned Admin", email: "assigned@example.com", role: "super_admin", adminAccess: 7 }] },
  approvals: { counts: { pending: 6 }, data: [], total: 6 },
  leaves: { data: [], pagination: { total: 4 } },
};

function renderDashboard() {
  return render(<StrictMode><MemoryRouter><PaginationProvider><SuperAdminDashboardPage /></PaginationProvider></MemoryRouter></StrictMode>);
}

function pendingBatch() {
  return Object.fromEntries(Object.entries(api).map(([key, fn]) => {
    const request = deferred();
    fn.mockReturnValue(request.promise);
    return [key, request];
  }));
}

async function resolveBatch(batch, except = []) {
  await act(async () => {
    Object.entries(batch).forEach(([key, request]) => {
      if (!except.includes(key)) request.resolve(payloads[key]);
    });
  });
}

describe("Super Admin dashboard requests", () => {
  beforeEach(() => {
    Object.entries(api).forEach(([key, fn]) => {
      fn.mockReset();
      fn.mockResolvedValue(payloads[key]);
    });
  });

  it("shares the initial batch across StrictMode and focus events, then allows a later refresh", async () => {
    const batch = pendingBatch();
    renderDashboard();
    act(() => {
      window.dispatchEvent(new Event("focus"));
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(api.overview).toHaveBeenCalledTimes(1);
    expect(api.feed).toHaveBeenCalledTimes(1);
    expect(api.users).toHaveBeenCalledTimes(1);
    expect(api.approvals).toHaveBeenCalledTimes(1);
    expect(api.leaves).toHaveBeenCalledTimes(1);
    expect(api.employees).not.toHaveBeenCalled();
    await resolveBatch(batch);
    await waitFor(() => expect(screen.getByRole("main").getAttribute("aria-busy")).toBe("false"));
    await act(async () => window.dispatchEvent(new Event("focus")));
    Object.entries(api).forEach(([key, fn]) =>
      expect(fn).toHaveBeenCalledTimes(key === "employees" ? 0 : 2),
    );
  });

  it("queues a forced manual refresh behind a pending automatic batch", async () => {
    const batch = pendingBatch();
    const forcedBatch = Object.fromEntries(Object.entries(api).map(([key, fn]) => {
      const request = deferred();
      fn.mockReturnValueOnce(batch[key].promise).mockReturnValue(request.promise);
      return [key, request];
    }));
    renderDashboard();
    fireEvent.click(screen.getByTitle("Refresh Dashboard Data"));
    expect(screen.getByTitle("Refresh Dashboard Data").disabled).toBe(true);
    expect(api.overview).toHaveBeenCalledTimes(1);
    await resolveBatch(batch);
    await waitFor(() => expect(api.overview).toHaveBeenCalledTimes(2));
    expect(api.overview).toHaveBeenLastCalledWith({ forceRefresh: true });
    expect(screen.getByTitle("Refresh Dashboard Data").disabled).toBe(true);
    await resolveBatch(forcedBatch);
    await waitFor(() =>
      expect(api.feed).toHaveBeenLastCalledWith({ forceRefresh: true }),
    );
    await waitFor(() => expect(screen.getByTitle("Refresh Dashboard Data").disabled).toBe(false));
  });

  it("shows metrics and exception results while the activity feed is still pending", async () => {
    const batch = pendingBatch();
    renderDashboard();
    await resolveBatch(batch, ["feed"]);
    expect(screen.getByRole("button", { name: /Employees.*80/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Attendance Flags.*5/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Pending Approvals.*6/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: /Risk & Exceptions Desk/ }));
    expect(screen.getAllByText("4 Leave Request/s Awaiting Approval").length).toBeGreaterThan(0);
    await resolveBatch(batch);
  });

  it("renders overview metrics without downloading the employee directory or waiting for secondary data", async () => {
    const batch = pendingBatch();
    renderDashboard();

    await act(async () => {
      batch.overview.resolve(payloads.overview);
    });

    expect(api.employees).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Employees.*80/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Attendance Flags.*5/ })).toBeTruthy();

    await resolveBatch(batch);
  });

  it("runs dashboard requests concurrently rather than waterfalling behind the overview", async () => {
    const batch = pendingBatch();
    renderDashboard();

    expect(api.overview).toHaveBeenCalledTimes(1);
    expect(api.feed).toHaveBeenCalledTimes(1);
    expect(api.users).toHaveBeenCalledTimes(1);
    expect(api.approvals).toHaveBeenCalledTimes(1);
    expect(api.leaves).toHaveBeenCalledTimes(1);
    expect(api.employees).not.toHaveBeenCalled();

    await resolveBatch(batch);
  });

  it("shows completed activity and assigned users without downloading the employee directory", async () => {
    const batch = pendingBatch();
    renderDashboard();
    await resolveBatch(batch, ["employees"]);
    fireEvent.click(screen.getByRole("tab", { name: /System & Module Activity/ }));
    expect(screen.getAllByText("Audit Actor").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("tab", { name: /Access & Roles Governance/ }));
    expect(screen.getAllByText("Assigned Admin").length).toBeGreaterThan(0);
    expect(api.employees).not.toHaveBeenCalled();
    expect(screen.queryByText("Directory Admin")).toBeNull();
    await resolveBatch(batch);
    expect(screen.queryByText("Directory Admin")).toBeNull();
  });

  it("retains the employee fallback and successful data when unrelated requests fail", async () => {
    api.users.mockRejectedValue(new Error("users unavailable"));
    api.leaves.mockRejectedValue(new Error("leaves unavailable"));
    renderDashboard();
    await waitFor(() => expect(screen.getByRole("main").getAttribute("aria-busy")).toBe("false"));
    expect(screen.getByRole("button", { name: /Employees.*80/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: /Access & Roles Governance/ }));
    expect(screen.getAllByText("Directory Admin").length).toBeGreaterThan(0);
    api.overview.mockRejectedValue(new Error("offline"));
    api.feed.mockRejectedValue(new Error("offline"));
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(screen.getByRole("button", { name: /Attendance Flags.*5/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: /System & Module Activity/ }));
    expect(within(screen.getByRole("tabpanel")).getAllByText("Audit Actor").length).toBeGreaterThan(0);
  });
});
