import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import api from "./api-template";
import { getAttendance } from "./getAttendance";
import {
  getLeaves,
  getLeavesSummary,
  getLeaveSummaryCacheKey,
} from "./getLeaves";
import { getSchedule } from "./getSchedule";
import { getAttendanceInitialDateRange } from "../utils/attendance/attendanceHelpers";
import { getLeavesInitialDateRange } from "../utils/leaves/leaveHelpers";
import {
  PaginationDateRangeFilter,
  PaginationProvider,
} from "../../services/context/PaginationContext";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Attendance and Leaves page API clients", () => {
  it("defaults employee attendance to an inclusive fourteen-day range", () => {
    expect(
      getAttendanceInitialDateRange(
        true,
        new Date(2026, 9, 21, 12, 0, 0),
      ),
    ).toEqual({
      dateFrom: "2026-10-08",
      dateTo: "2026-10-21",
    });
  });

  it("defaults administrative attendance to today's date", () => {
    expect(
      getAttendanceInitialDateRange(
        false,
        new Date(2026, 9, 21, 12, 0, 0),
      ),
    ).toEqual({
      dateFrom: "2026-10-21",
      dateTo: "2026-10-21",
    });
  });

  it("keeps employee leave dates optional so My Leaves can show all records", () => {
    expect(
      getLeavesInitialDateRange(
        true,
        new Date(2026, 9, 21, 12, 0, 0),
      ),
    ).toEqual({
      dateFrom: "",
      dateTo: "",
    });
  });

  it("defaults administrative leaves to an inclusive seven-day range", () => {
    expect(
      getLeavesInitialDateRange(
        false,
        new Date(2026, 9, 21, 12, 0, 0),
      ),
    ).toEqual({
      dateFrom: "2026-10-15",
      dateTo: "2026-10-21",
    });
  });

  it("bounds the attendance request and preserves the backend envelope", async () => {
    const payload = { success: true, data: [], pagination: { hasNextPage: false } };
    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({ data: payload });

    await expect(getAttendance(1, "", "All")).resolves.toEqual(payload);
    expect(getSpy).toHaveBeenCalledWith("/api/attendance", expect.objectContaining({
      timeout: 30000,
      withCredentials: true,
    }));
  });

  it("returns a retryable attendance failure after an API timeout", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(api, "get").mockRejectedValueOnce({ code: "ECONNABORTED", message: "timeout of 30000ms exceeded" });

    const result = await getAttendance();
    expect(result.success).toBe(false);
    expect(result.message).toContain("timeout");
  });

  it("loads requested organization options for the complete attendance screen", async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({
      data: { success: true, data: [] },
    });

    await getAttendance(1, "", "All", {
      includeDepartments: true,
      includeAccounts: true,
    });

    expect(getSpy).toHaveBeenCalledWith(
      "/api/attendance",
      expect.objectContaining({
        params: expect.objectContaining({
          includeDepartments: 1,
          includeAccounts: 1,
        }),
      }),
    );
  });

  it("defaults blank attendance dates to today's local calendar date", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 20, 12, 0, 0));

    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({
      data: { success: true, data: [] },
    });

    await getAttendance(1, "", "All");

    expect(getSpy).toHaveBeenCalledWith(
      "/api/attendance",
      expect.objectContaining({
        params: expect.objectContaining({
          dateFrom: "2026-10-20",
          dateTo: "2026-10-20",
        }),
      }),
    );
  });

  it("bounds the leaves request and does not convert a timeout into success", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const getSpy = vi.spyOn(api, "get").mockRejectedValueOnce({ code: "ECONNABORTED", message: "timeout of 30000ms exceeded" });

    const result = await getLeaves();
    expect(getSpy).toHaveBeenCalledWith("/api/leaves", expect.objectContaining({ timeout: 30000 }));
    expect(result.success).toBe(false);
    expect(result.message).toContain("timeout");
  });

  it("defaults blank leaves dates to an inclusive seven-day local range", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 20, 12, 0, 0));

    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({
      data: { success: true, data: [] },
    });

    await getLeaves();

    expect(getSpy).toHaveBeenCalledWith(
      "/api/leaves",
      expect.objectContaining({
        params: expect.objectContaining({
          dateFrom: "2026-10-14",
          dateTo: "2026-10-20",
        }),
      }),
    );
  });

  it("preserves blank optional dates when loading all personal leave records", async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({
      data: { success: true, data: [] },
    });

    await getLeaves({ useDefaultDateRange: false });

    expect(getSpy).toHaveBeenCalledWith(
      "/api/leaves",
      expect.objectContaining({
        params: expect.objectContaining({
          dateFrom: "",
          dateTo: "",
        }),
      }),
    );
  });

  it("defaults blank schedule dates to an inclusive seven-day local range", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 20, 12, 0, 0));

    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({
      data: { success: true, data: [] },
    });

    await getSchedule();

    expect(getSpy).toHaveBeenCalledWith(
      "/api/employee-schedule",
      expect.objectContaining({
        params: expect.objectContaining({
          dateFrom: "2026-10-14",
          dateTo: "2026-10-20",
        }),
      }),
    );
  });

  it("reflects default dates on schedule controls when filter is unselected", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 21, 12, 0, 0));

    render(
      <PaginationProvider>
        <PaginationDateRangeFilter entity="schedule" visible />
      </PaginationProvider>,
    );

    expect(
      screen.getByRole("button", { name: "From October 15, 2026" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "To October 21, 2026" }),
    ).toBeInTheDocument();
  });
});

describe("Leave summary cache identity and single-flight telemetry", () => {
  it("constructs a standardized cache key across user identifier variations", () => {
    expect(getLeaveSummaryCacheKey(null)).toBe("");
    expect(getLeaveSummaryCacheKey(undefined)).toBe("");
    expect(getLeaveSummaryCacheKey({})).toBe("");
    expect(
      getLeaveSummaryCacheKey({
        sibs_id: "EMP-001",
        admin_access: 1,
        role: "admin",
      }),
    ).toBe("EMP-001|1|admin");
    expect(
      getLeaveSummaryCacheKey({
        sibsId: "EMP-002",
        adminAccess: 7,
        role: "super_admin",
      }),
    ).toBe("EMP-002|7|super_admin");
    expect(
      getLeaveSummaryCacheKey({
        employee_id: "EMP-003",
        role: "employee",
      }),
    ).toBe("EMP-003||employee");
    expect(
      getLeaveSummaryCacheKey({
        username: "testuser",
        userRole: "approver",
      }),
    ).toBe("testuser||approver");
  });

  it("coalesces simultaneous getLeavesSummary calls for the same key", async () => {
    const payload = { success: true, ready: true, data: { pendingLeaves: 5 } };
    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({ data: payload });

    const key = "coalesce-test-user|1|admin";
    const [res1, res2] = await Promise.all([
      getLeavesSummary({ cacheKey: key }),
      getLeavesSummary({ cacheKey: key }),
    ]);

    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(res1).toEqual(payload);
    expect(res2).toEqual(payload);
  });

  it("serves from cache within TTL and bypasses cache when forceRefresh is true", async () => {
    const payload1 = { success: true, ready: true, data: { pendingLeaves: 5 } };
    const payload2 = { success: true, ready: true, data: { pendingLeaves: 8 } };
    const getSpy = vi
      .spyOn(api, "get")
      .mockResolvedValueOnce({ data: payload1 })
      .mockResolvedValueOnce({ data: payload2 });

    const key = "force-refresh-test-user|1|admin";
    const res1 = await getLeavesSummary({ cacheKey: key });
    expect(res1.data.pendingLeaves).toBe(5);
    expect(getSpy).toHaveBeenCalledTimes(1);

    // Call without forceRefresh -> should return cached result
    const resCached = await getLeavesSummary({ cacheKey: key, forceRefresh: false });
    expect(resCached.data.pendingLeaves).toBe(5);
    expect(getSpy).toHaveBeenCalledTimes(1);

    // Call with forceRefresh -> should make a fresh network request
    const resForced = await getLeavesSummary({ cacheKey: key, forceRefresh: true });
    expect(resForced.data.pendingLeaves).toBe(8);
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  it("expires ready: false responses after 1500ms rather than 10000ms", async () => {
    vi.useFakeTimers();
    const payloadNotReady = { success: true, ready: false };
    const payloadReady = { success: true, ready: true, data: { pendingLeaves: 3 } };

    const getSpy = vi
      .spyOn(api, "get")
      .mockResolvedValueOnce({ data: payloadNotReady })
      .mockResolvedValueOnce({ data: payloadReady });

    const key = "ttl-test-user|1|admin";
    const res1 = await getLeavesSummary({ cacheKey: key });
    expect(res1.ready).toBe(false);
    expect(getSpy).toHaveBeenCalledTimes(1);

    // Advance by 1,000ms (less than 1,500ms TTL) -> still cached
    vi.advanceTimersByTime(1000);
    const resCached = await getLeavesSummary({ cacheKey: key });
    expect(resCached.ready).toBe(false);
    expect(getSpy).toHaveBeenCalledTimes(1);

    // Advance past 1,500ms (total 1,600ms) -> expired, triggers fresh fetch
    vi.advanceTimersByTime(600);
    const resFresh = await getLeavesSummary({ cacheKey: key });
    expect(resFresh.ready).toBe(true);
    expect(resFresh.data.pendingLeaves).toBe(3);
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  it("keeps recent Manila window results isolated from all-date and other-user results", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-09T15:59:59Z"));
    const firstWindow = { dateFrom: "2026-09-29", dateTo: "2026-11-09" };
    const secondWindow = { dateFrom: "2026-09-30", dateTo: "2026-11-10" };
    const ready = (count, range) => ({ success: true, ready: true, data: {
      recentPendingLeaves: { count, ...range },
    } });
    const allDate = { success: true, ready: true, data: { pendingLeaves: 99 } };
    const getSpy = vi.spyOn(api, "get")
      .mockResolvedValueOnce({ data: allDate })
      .mockResolvedValueOnce({ data: ready(4, firstWindow) })
      .mockResolvedValueOnce({ data: ready(7, firstWindow) })
      .mockResolvedValueOnce({ data: ready(8, secondWindow) });
    const cacheKey = "RECENT-1|7|super_admin";
    const recent = { cacheKey, window: "recent" };

    expect(await getLeavesSummary({ cacheKey })).toEqual(allDate);
    expect(await getLeavesSummary(recent)).toEqual(ready(4, firstWindow));
    expect(await getLeavesSummary(recent)).toEqual(ready(4, firstWindow));
    expect(await getLeavesSummary({ ...recent, cacheKey: "RECENT-2|7|super_admin" })).toEqual(ready(7, firstWindow));

    vi.setSystemTime(new Date("2026-11-09T16:00:00Z"));
    expect(await getLeavesSummary(recent)).toEqual(ready(8, secondWindow));
    expect(await getLeavesSummary({ cacheKey })).toEqual(allDate);
    expect(getSpy).toHaveBeenCalledTimes(4);
    expect(getSpy.mock.calls[0][1].params).toBeUndefined();
    expect(getSpy.mock.calls[1][1].params).toEqual({ window: "recent" });
    expect(getSpy.mock.calls[1][1].skipInFlightDeduplication).toBe(true);
  });

  it("keeps a canceled recent request from replacing the fresh cached count", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-09T12:00:00Z"));
    const request = { cacheKey: "RECENT-CANCELED|7|super_admin", window: "recent" };
    const controller = new AbortController();
    const payload = (count) => ({
      success: true, ready: true, data: {
        recentPendingLeaves: { count, dateFrom: "2026-09-29", dateTo: "2026-11-09" },
      },
    });
    let resolveCanceled;
    const getSpy = vi.spyOn(api, "get")
      .mockReturnValueOnce(new Promise((resolve) => { resolveCanceled = resolve; }))
      .mockResolvedValueOnce({ data: payload(8) });
    const canceled = getLeavesSummary({ ...request, signal: controller.signal });
    controller.abort();
    expect(await getLeavesSummary(request)).toEqual(payload(8));
    resolveCanceled({ data: payload(2) });
    await canceled;

    expect(await getLeavesSummary(request)).toEqual(payload(8));
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  it("honors recent 503 backoff even for a forced refresh", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-09T12:00:00Z"));
    const request = { cacheKey: "RECENT-BACKOFF|7|super_admin", window: "recent" };
    const getSpy = vi.spyOn(api, "get").mockRejectedValue({
      response: { status: 503, data: { retryAfterSeconds: 5 } },
    });

    expect(await getLeavesSummary(request)).toMatchObject({ success: false, status: 503 });
    vi.advanceTimersByTime(4_999);
    expect(await getLeavesSummary({ ...request, forceRefresh: true })).toMatchObject({ status: 503 });
    expect(getSpy).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    await getLeavesSummary(request);
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  it("preserves ready: true responses for 30000ms", async () => {
    vi.useFakeTimers();
    const payloadReady = { success: true, ready: true, data: { pendingLeaves: 12 } };
    const payloadAfterExpiry = { success: true, ready: true, data: { pendingLeaves: 14 } };

    const getSpy = vi
      .spyOn(api, "get")
      .mockResolvedValueOnce({ data: payloadReady })
      .mockResolvedValueOnce({ data: payloadAfterExpiry });

    const key = "ttl-ready-test-user|1|admin";
    const res1 = await getLeavesSummary({ cacheKey: key });
    expect(res1.data.pendingLeaves).toBe(12);
    expect(getSpy).toHaveBeenCalledTimes(1);

    // Advance by 25,000ms -> still cached
    vi.advanceTimersByTime(25_000);
    const resCached = await getLeavesSummary({ cacheKey: key });
    expect(resCached.data.pendingLeaves).toBe(12);
    expect(getSpy).toHaveBeenCalledTimes(1);

    // Advance past 30,000ms (total 31,000ms) -> expired
    vi.advanceTimersByTime(6_000);
    const resFresh = await getLeavesSummary({ cacheKey: key });
    expect(resFresh.data.pendingLeaves).toBe(14);
    expect(getSpy).toHaveBeenCalledTimes(2);
  });
});
