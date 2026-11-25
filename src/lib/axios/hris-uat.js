import api from "./api-template";

const BASE = "/api/dev-ai/uat";

async function request(method, route, data, signal) {
  const config = { signal, timeout: route === "/benchmark" ? 1_200_000 : 15_000 };
  const response = method === "get"
    ? await api.get(`${BASE}${route}`, config)
    : await api.post(`${BASE}${route}`, data, config);
  if (response.data?.success !== true) {
    throw new Error(response.data?.message || response.data?.reason || "UAT request could not be completed.");
  }
  return response.data;
}

export async function getUatStatus(signal) {
  try {
    return await request("get", "/status", undefined, signal);
  } catch (error) {
    const response = error?.response;
    // UAT is optional. An explicitly disabled flag is an expected hidden state,
    // not a Hermes chat error. Other configuration/network failures still surface.
    if (response?.status === 503 && response.data?.status === "BLOCKED"
      && response.data?.configured?.featureFlag === false) {
      return { success: true, status: "DISABLED", participant: false, reviewer: false, benchmarkEnabled: false };
    }
    throw error;
  }
}
export const getUatCatalog = (signal) => request("get", "/catalog", undefined, signal);
export const getOwnUatFeedback = (signal) => request("get", "/feedback", undefined, signal);
export const getUatMonitoring = (signal) => request("get", "/monitoring", undefined, signal);
export const submitUatFeedback = (data, signal) => request("post", "/feedback", data, signal);
export const reviewUatFeedback = (recordId, data, signal) => request("post", `/feedback/${encodeURIComponent(recordId)}/review`, data, signal);
export const runUatBenchmark = (scenarioIds, signal) => request("post", "/benchmark", { scenarioIds }, signal);
