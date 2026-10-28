import { describe, expect, it, vi } from "vitest";
import { createHrisQueryCache } from "./hrisQueryCache";

describe("HRIS query cache", () => {
  it("coalesces identical reads but isolates users and normalized filters", async () => {
    let now = 1000;
    let scope = "employee:1";
    const cache = createHrisQueryCache({ now: () => now, getScope: () => scope });
    const read = vi.fn(async () => ({ value: read.mock.calls.length }));
    const options = { path: "/api/hr-dashboard/overview", params: { b: 2, a: 1 }, ttlMs: 1000 };
    const [first, second] = await Promise.all([
      cache.get(options, read),
      cache.get({ ...options, params: { a: 1, b: 2 } }, read),
    ]);
    expect(first).toEqual(second);
    expect(read).toHaveBeenCalledTimes(1);
    scope = "employee:2";
    await cache.get(options, read);
    await cache.get({ ...options, params: { a: 2, b: 2 } }, read);
    expect(read).toHaveBeenCalledTimes(3);
    scope = "admin:1";
    await cache.get(options, read);
    expect(read).toHaveBeenCalledTimes(4);
    now += 100;
    await cache.get(options, read);
    expect(read).toHaveBeenCalledTimes(4);
  });

  it("returns stale data, refreshes once, and invalidation cannot restore old data", async () => {
    let now = 1000;
    const cache = createHrisQueryCache({ now: () => now, getScope: () => "admin:1" });
    const options = { path: "/api/hr-dashboard/overview", ttlMs: 100, staleMs: 1000 };
    await cache.get(options, async () => "old");
    now += 150;
    let finish;
    const refresh = vi.fn(() => new Promise((resolve) => { finish = resolve; }));
    expect(await cache.get(options, refresh)).toBe("old");
    expect(await cache.get(options, refresh)).toBe("old");
    await Promise.resolve();
    expect(refresh).toHaveBeenCalledTimes(1);
    cache.invalidate();
    finish("obsolete");
    await Promise.resolve();
    expect(await cache.get(options, async () => "new")).toBe("new");
  });

  it("bypasses cache without an authenticated scope and retains stale on refresh failure", async () => {
    let scope = "";
    let now = 1000;
    const cache = createHrisQueryCache({ now: () => now, getScope: () => scope });
    const options = { path: "/api/hr-dashboard/overview", ttlMs: 10, staleMs: 100 };
    const read = vi.fn(async () => "ok");
    await cache.get(options, read);
    await cache.get(options, read);
    expect(read).toHaveBeenCalledTimes(2);
    scope = "admin:1";
    await cache.get(options, read);
    now += 20;
    expect(await cache.get(options, async () => { throw Error("offline"); })).toBe("ok");
  });

  it("supports targeted path invalidation and tracks metrics", async () => {
    let now = 1000;
    const cache = createHrisQueryCache({ now: () => now, getScope: () => "admin:1" });
    const optDept = { path: "/api/departments", ttlMs: 1000 };
    const optAcc = { path: "/api/assigned-accounts/accounts", ttlMs: 1000 };

    await cache.get(optDept, async () => [{ id: 1 }]);
    await cache.get(optAcc, async () => [{ id: 10 }]);

    let stats = cache.getStats();
    expect(stats.miss).toBe(2);
    expect(stats.queries).toBe(2);

    // Hit
    await cache.get(optDept, async () => [{ id: 2 }]);
    stats = cache.getStats();
    expect(stats.hit).toBe(1);

    // Invalidate only departments
    cache.invalidate("/api/departments");
    expect(await cache.get(optDept, async () => [{ id: 99 }])).toEqual([{ id: 99 }]);
    // Accounts remains cached
    expect(await cache.get(optAcc, async () => [{ id: 99 }])).toEqual([{ id: 10 }]);
  });
});
