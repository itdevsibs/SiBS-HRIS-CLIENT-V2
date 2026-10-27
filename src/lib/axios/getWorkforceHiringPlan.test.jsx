import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("./api-template", () => ({ default: api }));

import { getWorkforceHiringPlanTrends, getWorkforceHiringPlanAccounts } from "./getWorkforceHiringPlan";

it("account failures are recoverable errors instead of successful empty data", async () => {
  api.get.mockRejectedValueOnce(new Error("Upstream timeout"));
  await expect(getWorkforceHiringPlanAccounts("All", "2026-10-26", "2026-11-01", "All", false)).rejects.toThrow("Upstream timeout");
});

it("cancels one stale consumer without cancelling the identical active request", async () => {
  let resolve;
  api.get.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
  const controller = new AbortController();
  const params = { weekStart: "2026-08-03", weekEnd: "2026-08-09" };
  const stale = getWorkforceHiringPlanTrends({ ...params, signal: controller.signal });
  const active = getWorkforceHiringPlanTrends(params);
  await Promise.resolve();
  controller.abort();
  resolve({ data: { success: true, labels: [], trends: {} } });
  await expect(stale).rejects.toMatchObject({ name: "AbortError" });
  await expect(active).resolves.toMatchObject({ success: true });
});

describe("RAMPS trend reads", () => {
  beforeEach(() => api.get.mockReset());

  it("rejects a failed 200 response and retries the same request instead of caching empty trends", async () => {
    api.get.mockResolvedValueOnce({ data: { success: false, message: "Kronos unavailable" } });
    api.get.mockResolvedValueOnce({ data: { success: true, labels: ["Week 43"], trends: { absenteeism: [2], attrition: [1], buffer: [3] } } });
    const request = { weekStart: "2026-10-19", weekEnd: "2026-10-25" };

    await expect(getWorkforceHiringPlanTrends(request)).rejects.toThrow("Kronos unavailable");
    await expect(getWorkforceHiringPlanTrends(request)).resolves.toMatchObject({ success: true, labels: ["Week 43"] });
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it("rejects HTTP failures rather than resolving fake zero trends", async () => {
    api.get.mockRejectedValueOnce(new Error("Network unavailable"));

    await expect(getWorkforceHiringPlanTrends({ weekStart: "2026-10-12", weekEnd: "2026-10-18" }))
      .rejects.toThrow("Network unavailable");
  });

  it("does not cache a malformed successful HTTP response as empty trend data", async () => {
    api.get.mockResolvedValueOnce({ data: {} });
    api.get.mockResolvedValueOnce({ data: { success: true, labels: ["Week 42"], trends: { absenteeism: [1], attrition: [2], buffer: [3] } } });
    const request = { weekStart: "2026-10-05", weekEnd: "2026-10-11" };

    await expect(getWorkforceHiringPlanTrends(request)).rejects.toThrow("Failed to fetch 6-week trends.");
    await expect(getWorkforceHiringPlanTrends(request)).resolves.toMatchObject({ success: true, labels: ["Week 42"] });
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
