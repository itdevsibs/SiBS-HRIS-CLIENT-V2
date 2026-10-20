import { afterEach, describe, expect, it, vi } from "vitest";
import api from "./api-template";
import { getAttendance } from "./getAttendance";
import { getLeaves } from "./getLeaves";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Attendance and Leaves page API clients", () => {
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
});
