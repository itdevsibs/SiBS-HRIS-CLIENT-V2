import { afterEach, expect, it, vi } from "vitest";
import api from "./api-template";
import { getUatStatus, getUatCatalog, getUatMonitoring, submitUatFeedback, reviewUatFeedback, runUatBenchmark } from "./hris-uat";

vi.mock("./api-template", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
afterEach(() => vi.resetAllMocks());

it("treats explicitly disabled UAT as hidden while preserving enabled configuration and network failures", async () => {
  api.get.mockRejectedValueOnce({ response: { status: 503, data: { status: "BLOCKED", configured: { featureFlag: false } } } });
  await expect(getUatStatus()).resolves.toEqual({ success: true, status: "DISABLED", participant: false, reviewer: false, benchmarkEnabled: false });
  for (const failure of [
    { response: { status: 503, data: { status: "BLOCKED", configured: { featureFlag: true } } } },
    { response: { status: 503, data: {} } },
    { response: { status: 403, data: { configured: { featureFlag: false } } } },
    new Error("Network error"),
  ]) {
    api.get.mockRejectedValueOnce(failure);
    await expect(getUatStatus()).rejects.toBe(failure);
  }
});

it("uses the existing authenticated Axios bridge for all UAT contracts with abort signals", async () => {
  const signal = new AbortController().signal;
  api.get.mockResolvedValue({ data: { success: true } });
  api.post.mockResolvedValue({ data: { success: true } });
  for (const [load, path] of [[getUatStatus, "status"], [getUatCatalog, "catalog"], [getUatMonitoring, "monitoring"]]) {
    await load(signal);
    expect(api.get).toHaveBeenLastCalledWith(`/api/dev-ai/uat/${path}`, { signal, timeout: 15000 });
  }
  const feedback = { scenarioId: "SCENARIO", executionStatus: "NOT_TESTED" };
  await submitUatFeedback(feedback, signal);
  expect(api.post).toHaveBeenLastCalledWith("/api/dev-ai/uat/feedback", feedback, { signal, timeout: 15000 });
  const review = { decision: "NEEDS_FOLLOW_UP", comment: "Verify source" };
  await reviewUatFeedback("record/1", review, signal);
  expect(api.post).toHaveBeenLastCalledWith("/api/dev-ai/uat/feedback/record%2F1/review", review, { signal, timeout: 15000 });
  await runUatBenchmark(["SCENARIO"], signal);
  expect(api.post).toHaveBeenLastCalledWith("/api/dev-ai/uat/benchmark", { scenarioIds: ["SCENARIO"] }, expect.objectContaining({ signal }));
});

it("rejects unsuccessful and malformed UAT responses and preserves authorization errors", async () => {
  api.get.mockResolvedValueOnce({ data: { success: false, message: "UAT disabled" } }).mockResolvedValueOnce({ data: {} });
  await expect(getUatStatus()).rejects.toThrow("UAT disabled");
  await expect(getUatCatalog()).rejects.toThrow("UAT request could not be completed");
  const forbidden = { response: { status: 403, data: { message: "Reviewer access required" } } };
  api.get.mockRejectedValueOnce(forbidden);
  await expect(getUatMonitoring()).rejects.toBe(forbidden);
  api.post.mockResolvedValueOnce({ data: { success: false, reason: "Dedicated development profile required" } });
  await expect(runUatBenchmark(["SCENARIO"])).rejects.toThrow("Dedicated development profile required");
});
