import { afterEach, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
import api from "./api-template";
import { getUatStatus, submitUatFeedback, getUatMonitoring } from "./hris-uat";

const originalAdapter = api.defaults.adapter;
const originalAuthorization = api.defaults.headers.common.Authorization;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
  if (originalAuthorization === undefined) delete api.defaults.headers.common.Authorization;
  else api.defaults.headers.common.Authorization = originalAuthorization;
});

it("carries authenticated UAT requests through the real Axios bridge and serializes feedback without granting roles", async () => {
  const network = vi.fn(async (config) => ({ data: { success: true, participant: true, reviewer: false }, status: 200, statusText: "OK", headers: {}, config }));
  api.defaults.adapter = network;
  api.defaults.headers.common.Authorization = "Bearer test-only-session";
  const status = await getUatStatus();
  expect(status.reviewer).toBe(false);
  const statusRequest = network.mock.calls[0][0];
  expect(statusRequest.url).toBe("/api/dev-ai/uat/status");
  expect(statusRequest.withCredentials).toBe(true);
  expect(statusRequest.headers.get("Authorization")).toBe("Bearer test-only-session");
  expect(statusRequest.headers.get("Cache-Control")).toBe("no-cache");
  const feedback = { scenarioId: "TEST", executionStatus: "NOT_TESTED", correlationId: "request-test" };
  await submitUatFeedback(feedback);
  const feedbackRequest = network.mock.calls.at(-1)[0];
  expect(feedbackRequest.url).toBe("/api/dev-ai/uat/feedback");
  expect(feedbackRequest.method).toBe("post");
  expect(JSON.parse(feedbackRequest.data)).toEqual(feedback);
  expect(feedbackRequest.withCredentials).toBe(true);
});

it("preserves backend reviewer denials through the real Axios response interceptors", async () => {
  api.defaults.adapter = async (config) => {
    const response = { status: 403, data: { success: false, message: "UAT reviewer access requires an HR Admin or Super Admin role." }, config, headers: {}, statusText: "Forbidden" };
    throw new AxiosError("Forbidden", "ERR_BAD_REQUEST", config, null, response);
  };
  await expect(getUatMonitoring()).rejects.toMatchObject({ response: { status: 403, data: { success: false } } });
});

