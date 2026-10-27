import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import api from "./api-template";
import { getAttendance } from "./getAttendance";
import { getLeaves } from "./getLeaves";
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
