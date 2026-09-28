import { describe, expect, it } from "vitest";

import {
  cleanDashboardText,
  formatAttendanceTime,
  formatDashboardDate,
  formatPhtDate,
  formatPhtTime,
  getDashboardAnnouncements,
  getDashboardHolidays,
  getEmployeeDashboardProfile,
  getProgressPercent,
  normalizeLeaveStatus,
  normalizeLeaveType,
  normalizeScheduleMode,
} from "./employeeDashboardHelpers.js";

describe("employeeDashboardHelpers", () => {
  describe("cleanDashboardText", () => {
    it("trims whitespace and handles nullish values", () => {
      expect(cleanDashboardText("  Engineering  ")).toBe("Engineering");
      expect(cleanDashboardText(null)).toBe("");
      expect(cleanDashboardText(undefined)).toBe("");
      expect(cleanDashboardText(123)).toBe("123");
    });
  });

  describe("formatDashboardDate", () => {
    it("returns fallback for invalid or empty dates", () => {
      expect(formatDashboardDate(null)).toBe("—");
      expect(formatDashboardDate(undefined)).toBe("—");
      expect(formatDashboardDate("", "N/A")).toBe("N/A");
    });

    it("formats valid date string to readable format", () => {
      const formatted = formatDashboardDate("2026-10-15");
      expect(formatted).toMatch(/Oct/);
      expect(formatted).toMatch(/2026/);
    });
  });

  describe("formatPhtTime & formatPhtDate", () => {
    it("formats time and date with Asia/Manila timezone", () => {
      const testDate = new Date("2026-09-25T12:00:00Z");
      expect(formatPhtTime(testDate)).toMatch(/:/);
      expect(formatPhtDate(testDate)).toMatch(/2026/);
    });
  });

  describe("getProgressPercent", () => {
    it("calculates percentage and clamps between 0 and 100", () => {
      expect(getProgressPercent(5, 10)).toBe(50);
      expect(getProgressPercent(12, 10)).toBe(100);
      expect(getProgressPercent(0, 10)).toBe(0);
      expect(getProgressPercent(5, 0)).toBe(0);
    });
  });

  describe("getEmployeeDashboardProfile", () => {
    it("extracts and normalizes profile fields with fallback initials", () => {
      const user = {
        firstName: "Maria",
        lastName: "Santos",
        sibs_id: "SIBS-2024-001",
        position: "Senior Quality Specialist",
        department: "Quality Assurance",
        role: "employee",
      };

      const profile = getEmployeeDashboardProfile(user);
      expect(profile.fullName).toBe("Maria Santos");
      expect(profile.firstName).toBe("Maria");
      expect(profile.initials).toBe("MS");
      expect(profile.sibsId).toBe("SIBS-2024-001");
      expect(profile.position).toBe("Senior Quality Specialist");
      expect(profile.department).toBe("Quality Assurance");
    });

    it("handles empty user gracefully", () => {
      const profile = getEmployeeDashboardProfile({});
      expect(profile.fullName).toBe("Employee");
      expect(profile.initials).toBe("E");
      expect(profile.position).toBe("Employee");
    });
  });

  describe("formatAttendanceTime", () => {
    it("formats 24hr or timestamp time safely", () => {
      expect(formatAttendanceTime("09:00:00")).toBe("09:00 AM");
      expect(formatAttendanceTime("14:30")).toBe("02:30 PM");
      expect(formatAttendanceTime(null)).toBe("");
      expect(formatAttendanceTime("")).toBe("");
    });
  });

  describe("normalizeScheduleMode", () => {
    it("identifies work arrangement modes from numeric codes", () => {
      expect(normalizeScheduleMode("0")).toBe("Day Off");
      expect(normalizeScheduleMode("1")).toBe("Regular");
      expect(normalizeScheduleMode("2")).toBe("Rest Day");
      expect(normalizeScheduleMode("3")).toBe("Holiday");
      expect(normalizeScheduleMode("Custom")).toBe("Custom");
      expect(normalizeScheduleMode("")).toBe("—");
    });
  });

  describe("normalizeLeaveType & normalizeLeaveStatus", () => {
    it("normalizes common leave types and statuses", () => {
      expect(normalizeLeaveType(1)).toBe("Vacation / Personal");
      expect(normalizeLeaveType(2)).toBe("Sick");
      expect(normalizeLeaveType(9)).toBe("Emergency");
      expect(normalizeLeaveType("Custom Leave")).toBe("Custom Leave");

      expect(normalizeLeaveStatus("approved")).toBe("Approved");
      expect(normalizeLeaveStatus("rejected")).toBe("Rejected");
      expect(normalizeLeaveStatus("pending")).toBe("Pending");
    });
  });

  describe("getDashboardAnnouncements & getDashboardHolidays", () => {
    it("returns structured bulletin notices", () => {
      const bulletins = getDashboardAnnouncements({ department: "Operations" });
      expect(Array.isArray(bulletins)).toBe(true);
      expect(bulletins.length).toBeGreaterThanOrEqual(1);
      expect(bulletins[0]).toHaveProperty("title");
      expect(bulletins[0]).toHaveProperty("category");
    });

    it("returns sorted upcoming holidays from source", () => {
      const source = {
        data: [
          {
            holiday_name: "Christmas Day",
            holiday_date: "2026-12-25",
            status: "active",
          },
          {
            holiday_name: "New Year's Eve",
            holiday_date: "2026-12-31",
            status: "active",
          },
        ],
      };
      const now = new Date("2026-09-01T00:00:00Z");
      const holidays = getDashboardHolidays(source, now);
      expect(Array.isArray(holidays)).toBe(true);
      expect(holidays.length).toBe(2);
      expect(holidays[0].name).toBe("Christmas Day");
      expect(holidays[0].date).toBe("2026-12-25");
    });
  });
});
