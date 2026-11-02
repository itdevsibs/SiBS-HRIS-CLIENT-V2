import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import api, {
  clearAuthCredentialRegistry,
  getInFlightKey,
  inFlightRequests,
} from "./api-template";

describe("api-template in-flight request coalescing & key normalization", () => {
  beforeEach(() => {
    inFlightRequests.clear();
    clearAuthCredentialRegistry();
    delete api.defaults.headers.common.Authorization;
  });

  describe("getInFlightKey", () => {
    it("returns null for non-GET methods", () => {
      expect(getInFlightKey({ method: "post", url: "/api/users" })).toBeNull();
      expect(getInFlightKey({ method: "PUT", url: "/api/users" })).toBeNull();
      expect(getInFlightKey({ method: "delete", url: "/api/users" })).toBeNull();
      expect(getInFlightKey({ method: "patch", url: "/api/users" })).toBeNull();
    });

    it("returns null when refresh or skip deduplication flags are provided", () => {
      expect(getInFlightKey({ method: "get", url: "/api/users", params: { forceRefresh: true } })).toBeNull();
      expect(getInFlightKey({ method: "get", url: "/api/users", params: { refresh: true } })).toBeNull();
      expect(getInFlightKey({ method: "get", url: "/api/users", skipInFlightDeduplication: true })).toBeNull();
    });

    it("strips _t timestamp cache-busters from key computation", () => {
      const key1 = getInFlightKey({ method: "get", url: "/api/records", params: { _t: 12345, status: "Active" } });
      const key2 = getInFlightKey({ method: "get", url: "/api/records", params: { _t: 67890, status: "Active" } });
      expect(key1).toBe(key2);
      expect(key1).not.toContain("_t=");
    });

    it("normalizes equivalent parameter ordering into identical keys", () => {
      const key1 = getInFlightKey({ method: "get", url: "/api/items?b=2&a=1" });
      const key2 = getInFlightKey({ method: "get", url: "/api/items?a=1&b=2" });
      expect(key1).toBe(key2);
      expect(key1).toBe("[auth:none#scope:]#/api/items?a=1&b=2");
    });

    it("canonicalizes repeated parameters in query strings and array params", () => {
      const keyUrl1 = getInFlightKey({ method: "get", url: "/api/users?role=HR&role=Admin" });
      const keyUrl2 = getInFlightKey({ method: "get", url: "/api/users?role=Admin&role=HR" });
      expect(keyUrl1).toBe(keyUrl2);

      const keyParams1 = getInFlightKey({ method: "get", url: "/api/users", params: { role: ["HR", "Admin"] } });
      const keyParams2 = getInFlightKey({ method: "get", url: "/api/users", params: { role: ["Admin", "HR"] } });
      expect(keyParams1).toBe(keyParams2);
      expect(keyUrl1).toBe(keyParams1);
    });

    it("canonicalizes mixed URL query parameters and config.params", () => {
      const key1 = getInFlightKey({ method: "get", url: "/api/catalog?category=Books", params: { sort: "asc" } });
      const key2 = getInFlightKey({ method: "get", url: "/api/catalog?sort=asc", params: { category: "Books" } });
      expect(key1).toBe(key2);
      expect(key1).toBe("[auth:none#scope:]#/api/catalog?category=Books&sort=asc");
    });

    it("isolates different tokens using opaque credential IDs and NEVER embeds raw bearer tokens in keys", () => {
      const rawTokenA = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tokenA";
      const rawTokenB = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tokenB";

      const keyA1 = getInFlightKey({ method: "get", url: "/api/profile", headers: { Authorization: rawTokenA } });
      const keyA2 = getInFlightKey({ method: "get", url: "/api/profile", headers: { Authorization: rawTokenA } });
      const keyB = getInFlightKey({ method: "get", url: "/api/profile", headers: { Authorization: rawTokenB } });
      const keyPublic = getInFlightKey({ method: "get", url: "/api/profile" });

      // Two requests with identical token produce identical keys
      expect(keyA1).toBe(keyA2);

      // Different tokens produce different keys (no collision or sharing)
      expect(keyA1).not.toBe(keyB);
      expect(keyA1).not.toBe(keyPublic);
      expect(keyB).not.toBe(keyPublic);

      // Raw tokens MUST NEVER appear in generated keys or Map keys
      expect(keyA1).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
      expect(keyA1).not.toContain("tokenA");
      expect(keyB).not.toContain("tokenB");

      // Uses safe opaque identifiers
      expect(keyA1).toContain("[auth:auth_1#scope:]#");
      expect(keyB).toContain("[auth:auth_2#scope:]#");
      expect(keyPublic).toContain("[auth:none#scope:]#");
    });

    it("accounts for effective Axios defaults headers and Basic auth", () => {
      const keyWithoutDefault = getInFlightKey({ method: "get", url: "/api/settings" });

      // Setting default header affects subsequent requests that omit config.headers
      api.defaults.headers.common.Authorization = "Bearer globalInstanceToken";
      const keyWithDefault = getInFlightKey({ method: "get", url: "/api/settings" });
      expect(keyWithDefault).not.toBe(keyWithoutDefault);
      expect(keyWithDefault).not.toContain("globalInstanceToken");

      // Per-request header overrides defaults header
      const keyOverride = getInFlightKey({
        method: "get",
        url: "/api/settings",
        headers: { Authorization: "Bearer perRequestToken" },
      });
      expect(keyOverride).not.toBe(keyWithDefault);
      expect(keyOverride).not.toContain("perRequestToken");

      // Basic auth is supported as effective authorization
      delete api.defaults.headers.common.Authorization;
      const keyBasic = getInFlightKey({
        method: "get",
        url: "/api/settings",
        auth: { username: "admin", password: "secretPassword" },
      });
      expect(keyBasic).not.toContain("secretPassword");
      expect(keyBasic).toContain("[auth:auth_");
    });

    it("bypasses coalescing if safe credential identity cannot be established", () => {
      // Non-string invalid authorization header cannot establish safe identity
      const keyInvalid = getInFlightKey({
        method: "get",
        url: "/api/secure",
        headers: { Authorization: { invalid: true } },
      });
      expect(keyInvalid).toBeNull();
    });

    it("isolates different filter values to prevent stale or cross-talk responses", () => {
      const keyCluster1 = getInFlightKey({ method: "get", url: "/api/dashboard", params: { cluster: "Ops" } });
      const keyCluster2 = getInFlightKey({ method: "get", url: "/api/dashboard", params: { cluster: "Finance" } });
      expect(keyCluster1).not.toBe(keyCluster2);
    });
  });

  describe("concurrent request coalescing & lifecycle", () => {
    it("coalesces concurrent identical GET requests into a single network call", async () => {
      let callCount = 0;
      const fakeNetworkAdapter = vi.fn(async (config) => {
        callCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 30));
        return {
          data: { success: true, count: callCount },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      });

      const originalAdapter = api.defaults.adapter;
      api.defaults.adapter = fakeNetworkAdapter;

      try {
        const [res1, res2] = await Promise.all([
          api.get("/api/test-dedupe-route", { params: { department: "IT" } }),
          api.get("/api/test-dedupe-route", { params: { department: "IT" } }),
        ]);

        expect(callCount).toBe(1);
        expect(res1.data).toEqual(res2.data);
        expect(res1.data.count).toBe(1);
        // After settling, in-flight map is cleaned up
        expect(inFlightRequests.size).toBe(0);
      } finally {
        api.defaults.adapter = originalAdapter;
      }
    });

    it("clears auth credential registry when all in-flight requests settle to prevent sensitive string retention", async () => {
      const fakeNetworkAdapter = vi.fn(async (config) => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return { data: { ok: true }, status: 200, statusText: "OK", headers: {}, config };
      });
      const originalAdapter = api.defaults.adapter;
      api.defaults.adapter = fakeNetworkAdapter;

      try {
        await api.get("/api/test-idle-cleanup-1", { headers: { Authorization: "Bearer sessionToken1" } });
        expect(inFlightRequests.size).toBe(0);

        // When a subsequent request arrives after idle cleanup, the registry has been wiped, so counter resets to auth_1
        const nextKey = getInFlightKey({
          method: "get",
          url: "/api/test-idle-cleanup-2",
          headers: { Authorization: "Bearer sessionToken2" },
        });
        expect(nextKey).toContain("[auth:auth_1#scope:]#");
      } finally {
        api.defaults.adapter = originalAdapter;
      }
    });

    it("does not coalesce concurrent requests with different authorization headers", async () => {
      let callCount = 0;
      const fakeNetworkAdapter = vi.fn(async (config) => {
        callCount += 1;
        const callId = callCount;
        await new Promise((resolve) => setTimeout(resolve, 30));
        return {
          data: { success: true, callId },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      });

      const originalAdapter = api.defaults.adapter;
      api.defaults.adapter = fakeNetworkAdapter;

      try {
        const [res1, res2] = await Promise.all([
          api.get("/api/test-auth-isolation", { headers: { Authorization: "Bearer userToken1" } }),
          api.get("/api/test-auth-isolation", { headers: { Authorization: "Bearer userToken2" } }),
        ]);

        expect(callCount).toBe(2);
        expect(res1.data.callId).toBe(1);
        expect(res2.data.callId).toBe(2);
        expect(inFlightRequests.size).toBe(0);
      } finally {
        api.defaults.adapter = originalAdapter;
      }
    });

    it("coalesces concurrent requests with identical authorization headers into a single call", async () => {
      let callCount = 0;
      const fakeNetworkAdapter = vi.fn(async (config) => {
        callCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 30));
        return {
          data: { success: true, sharedCallId: callCount },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      });

      const originalAdapter = api.defaults.adapter;
      api.defaults.adapter = fakeNetworkAdapter;

      try {
        const [res1, res2] = await Promise.all([
          api.get("/api/test-auth-shared", { headers: { Authorization: "Bearer sameToken" } }),
          api.get("/api/test-auth-shared", { headers: { Authorization: "Bearer sameToken" } }),
        ]);

        expect(callCount).toBe(1);
        expect(res1.data.sharedCallId).toBe(1);
        expect(res2.data.sharedCallId).toBe(1);
        expect(inFlightRequests.size).toBe(0);
      } finally {
        api.defaults.adapter = originalAdapter;
      }
    });

    it("preserves active caller when one caller aborts", async () => {
      const controller1 = new AbortController();
      const controller2 = new AbortController();

      const fakeNetworkAdapter = vi.fn(async (config) => {
        await new Promise((resolve) => setTimeout(resolve, 60));
        return {
          data: { result: "active-succeeded" },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      });

      const originalAdapter = api.defaults.adapter;
      api.defaults.adapter = fakeNetworkAdapter;

      try {
        const p1 = api.get("/api/test-partial-abort", { signal: controller1.signal });
        const p2 = api.get("/api/test-partial-abort", { signal: controller2.signal });

        // Abort caller 1 after 15ms while request is still pending
        setTimeout(() => controller1.abort(), 15);

        await expect(p1).rejects.toThrow();
        const res2 = await p2;

        expect(res2.data.result).toBe("active-succeeded");
        expect(fakeNetworkAdapter).toHaveBeenCalledTimes(1);
        expect(inFlightRequests.size).toBe(0);
      } finally {
        api.defaults.adapter = originalAdapter;
      }
    });

    it("aborts underlying network request when ALL callers abort", async () => {
      const controller1 = new AbortController();
      const controller2 = new AbortController();
      let underlyingSignalAborted = false;

      const fakeNetworkAdapter = vi.fn(async (config) => {
        if (config.signal) {
          config.signal.addEventListener("abort", () => {
            underlyingSignalAborted = true;
          });
        }
        await new Promise((resolve) => setTimeout(resolve, 80));
        return {
          data: { result: "never-needed" },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      });

      const originalAdapter = api.defaults.adapter;
      api.defaults.adapter = fakeNetworkAdapter;

      try {
        const p1 = api.get("/api/test-all-abort", { signal: controller1.signal });
        const p2 = api.get("/api/test-all-abort", { signal: controller2.signal });

        setTimeout(() => {
          controller1.abort();
          controller2.abort();
        }, 15);

        await expect(p1).rejects.toThrow();
        await expect(p2).rejects.toThrow();

        expect(underlyingSignalAborted).toBe(true);
        expect(inFlightRequests.size).toBe(0);
      } finally {
        api.defaults.adapter = originalAdapter;
      }
    });

    it("does not delete a newer in-flight entry if an older aborted request settles afterwards", async () => {
      let firstRequestResolve;
      let firstCallCount = 0;
      let secondCallCount = 0;

      const fakeNetworkAdapter = vi.fn(async (config) => {
        if (firstCallCount === 0) {
          firstCallCount += 1;
          return new Promise((resolve) => {
            firstRequestResolve = resolve;
          });
        }
        secondCallCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 60));
        return {
          data: { result: "second-succeeded" },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      });

      const originalAdapter = api.defaults.adapter;
      api.defaults.adapter = fakeNetworkAdapter;

      try {
        const controller1 = new AbortController();
        const p1 = api.get("/api/test-stale-deletion", { signal: controller1.signal });

        // Let p1 dispatch and begin its network call, then abort
        setTimeout(() => controller1.abort(), 10);
        await expect(p1).rejects.toThrow();

        // Immediately start a second request on the same route
        const p2 = api.get("/api/test-stale-deletion");
        await new Promise((resolve) => setTimeout(resolve, 10));

        // The second request should be active in the map
        expect(inFlightRequests.size).toBe(1);

        // Now the first aborted request's network adapter promise finally settles
        firstRequestResolve({
          data: { result: "first-abandoned" },
          status: 200,
          statusText: "OK",
          headers: {},
        });
        await new Promise((resolve) => setTimeout(resolve, 20));

        // Safe entry verification ensures the second request was NOT deleted prematurely
        expect(inFlightRequests.size).toBe(1);

        const res2 = await p2;
        expect(res2.data.result).toBe("second-succeeded");
        expect(inFlightRequests.size).toBe(0);
      } finally {
        api.defaults.adapter = originalAdapter;
      }
    });

    it("cleans up on network failure and allows immediate subsequent retry", async () => {
      let callCount = 0;
      const fakeNetworkAdapter = vi.fn(async (config) => {
        callCount += 1;
        if (callCount === 1) {
          throw new Error("500 Server Error");
        }
        return {
          data: { retrySuccess: true },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      });

      const originalAdapter = api.defaults.adapter;
      api.defaults.adapter = fakeNetworkAdapter;

      try {
        // First attempt fails
        await expect(api.get("/api/test-retry-route")).rejects.toThrow("500 Server Error");
        expect(inFlightRequests.size).toBe(0);

        // Subsequent retry succeeds
        const retryRes = await api.get("/api/test-retry-route");
        expect(retryRes.data.retrySuccess).toBe(true);
        expect(callCount).toBe(2);
        expect(inFlightRequests.size).toBe(0);
      } finally {
        api.defaults.adapter = originalAdapter;
      }
    });
  });
});
