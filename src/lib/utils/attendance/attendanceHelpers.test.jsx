import { describe, expect, it } from "vitest";

import {
  formatNumber,
  normalizeStatus,
  getNumberValue,
  getValidDate,
  getTimeOnlyParts,
  buildDateTimeFromTrackerDate,
  getHoursBetween,
  isLateBySchedule,
  getComputedWorkHours,
  capWorkHoursFromItem,
  displayCappedWorkHours,
  getLoginIndicator,
  getLogoutIndicator,
  getSiteBadgeClass,
  getAssignedSite,
} from "./attendanceHelpers";

describe("attendanceHelpers", () => {
  describe("formatNumber", () => {
    it("handles placeholder, null, and undefined values", () => {
      expect(formatNumber("...")).toBe("...");
      expect(formatNumber(null)).toBe("...");
      expect(formatNumber(undefined)).toBe("...");
    });

    it("formats numbers using en-PH locale with maximum 2 decimals", () => {
      expect(formatNumber(1250)).toBe("1,250");
      expect(formatNumber(8.5)).toBe("8.5");
      expect(formatNumber(8.555)).toBe("8.56");
    });
  });

  describe("normalizeStatus", () => {
    it("trims, lowercases, and replaces spaces or underscores with hyphens", () => {
      expect(normalizeStatus("Early Out")).toBe("early-out");
      expect(normalizeStatus(" ON_TIME ")).toBe("on-time");
      expect(normalizeStatus(null)).toBe("");
      expect(normalizeStatus("Pending")).toBe("pending");
    });
  });

  describe("getNumberValue", () => {
    it("returns parsed number or zero fallback", () => {
      expect(getNumberValue("8.5")).toBe(8.5);
      expect(getNumberValue(4)).toBe(4);
      expect(getNumberValue(null)).toBe(0);
      expect(getNumberValue(undefined)).toBe(0);
      expect(getNumberValue("")).toBe(0);
      expect(getNumberValue("not-a-number")).toBe(0);
    });
  });

  describe("getValidDate", () => {
    it("parses valid date strings and instances", () => {
      const valid = getValidDate("2026-09-28T08:00:00+08:00");
      expect(valid).toBeInstanceOf(Date);
      expect(Number.isNaN(valid.getTime())).toBe(false);
    });

    it("returns null for invalid or empty dates", () => {
      expect(getValidDate(null)).toBeNull();
      expect(getValidDate("")).toBeNull();
      expect(getValidDate("invalid-date-token")).toBeNull();
    });
  });

  describe("getTimeOnlyParts", () => {
    it("parses 12-hour AM/PM formats accurately", () => {
      expect(getTimeOnlyParts("09:30 AM")).toEqual({
        hour: 9,
        minute: 30,
        second: 0,
      });
      expect(getTimeOnlyParts("06:15:45 PM")).toEqual({
        hour: 18,
        minute: 15,
        second: 45,
      });
      expect(getTimeOnlyParts("12:00 AM")).toEqual({
        hour: 0,
        minute: 0,
        second: 0,
      });
      expect(getTimeOnlyParts("12:30 PM")).toEqual({
        hour: 12,
        minute: 30,
        second: 0,
      });
    });

    it("parses 24-hour formats", () => {
      expect(getTimeOnlyParts("14:45")).toEqual({
        hour: 14,
        minute: 45,
        second: 0,
      });
      expect(getTimeOnlyParts("08:15:30")).toEqual({
        hour: 8,
        minute: 15,
        second: 30,
      });
    });

    it("returns null for non-time strings", () => {
      expect(getTimeOnlyParts(null)).toBeNull();
      expect(getTimeOnlyParts("")).toBeNull();
      expect(getTimeOnlyParts("random text")).toBeNull();
    });
  });

  describe("buildDateTimeFromTrackerDate and getHoursBetween", () => {
    it("combines base tracker date with time string", () => {
      const combined = buildDateTimeFromTrackerDate("2026-09-28", "08:00 AM");
      expect(combined.getHours()).toBe(8);
      expect(combined.getMinutes()).toBe(0);
    });

    it("calculates hours between two dates", () => {
      const start = new Date("2026-09-28T08:00:00Z");
      const end = new Date("2026-09-28T17:00:00Z");
      expect(getHoursBetween(start, end)).toBe(9);
    });

    it("handles overnight cross-midnight shifts by adding 24 hours", () => {
      const start = new Date("2026-09-28T22:00:00Z");
      const end = new Date("2026-09-28T06:00:00Z"); // diff is -16h, +24h = 8h
      expect(getHoursBetween(start, end)).toBe(8);
    });
  });

  describe("isLateBySchedule", () => {
    it("detects on-time and grace period tolerance", () => {
      const scheduled = new Date("2026-09-28T08:00:00");
      const actualOnTime = new Date("2026-09-28T07:58:00");
      const actualWithinGrace = new Date("2026-09-28T08:00:50"); // 50s late < 60s
      const actualLate = new Date("2026-09-28T08:01:30"); // 90s late >= 60s

      expect(isLateBySchedule(actualOnTime, scheduled)).toBe(false);
      expect(isLateBySchedule(actualWithinGrace, scheduled)).toBe(false);
      expect(isLateBySchedule(actualLate, scheduled)).toBe(true);
    });

    it("returns false if times are missing", () => {
      expect(isLateBySchedule(null, new Date())).toBe(false);
      expect(isLateBySchedule(new Date(), null)).toBe(false);
    });
  });

  describe("getComputedWorkHours and capWorkHoursFromItem", () => {
    it("computes net work hours deducting break hours", () => {
      const item = {
        gy_tracker_date: "2026-09-28",
        gy_tracker_login: "2026-09-28T08:00:00",
        gy_tracker_logout: "2026-09-28T17:00:00",
        gy_tracker_bh: 1, // 1 hour break
      };

      expect(getComputedWorkHours(item)).toBe(8);
      expect(capWorkHoursFromItem(item)).toBe(8);
      expect(displayCappedWorkHours(item)).toBe("8");
    });

    it("caps hours above 8 at 8", () => {
      const item = {
        gy_tracker_date: "2026-09-28",
        gy_tracker_login: "2026-09-28T08:00:00",
        gy_tracker_logout: "2026-09-28T20:00:00", // 12 hours total
        gy_tracker_bh: 1, // net 11 hours
      };

      expect(getComputedWorkHours(item)).toBe(11);
      expect(capWorkHoursFromItem(item)).toBe(8);
      expect(displayCappedWorkHours(item)).toBe("8");
    });

    it("falls back to saved work hours when timestamps are missing", () => {
      const item = {
        gy_tracker_wh: 7.5,
      };

      expect(getComputedWorkHours(item)).toBe(7.5);
      expect(capWorkHoursFromItem(item)).toBe(7.5);
      expect(displayCappedWorkHours(item)).toBe("7.5");
    });
  });

  describe("getLoginIndicator and getLogoutIndicator", () => {
    it("identifies login status", () => {
      expect(getLoginIndicator({})).toEqual({
        label: "No clock-in",
        tone: "neutral",
      });
      expect(getLoginIndicator({ gy_tracker_login: "2026-09-28T08:00:00", login_status: "on-time" })).toEqual({
        label: "On-Time",
        tone: "success",
      });
      expect(getLoginIndicator({ gy_tracker_login: "2026-09-28T08:15:00", login_status: "late" })).toEqual({
        label: "Late clock-in",
        tone: "danger",
      });
    });

    it("identifies logout status", () => {
      expect(getLogoutIndicator({})).toEqual({
        label: "No clock-out",
        tone: "neutral",
      });
      expect(getLogoutIndicator({ gy_tracker_logout: "2026-09-28T17:00:00", logout_status: "normal" })).toEqual({
        label: "Full shift",
        tone: "success",
      });
      expect(getLogoutIndicator({ gy_tracker_logout: "2026-09-28T15:00:00", logout_status: "early-out" })).toEqual({
        label: "Early logout",
        tone: "warning",
      });
    });
  });

  describe("getSiteBadgeClass and getAssignedSite", () => {
    it("maps site codes correctly in getAssignedSite", () => {
      expect(getAssignedSite({ site: "0" })).toBe("Tagum");
      expect(getAssignedSite({ assigned_loc: "1" })).toBe("Davao");
      expect(getAssignedSite({ gy_assignedloc: "2" })).toBe("Both Tagum and Davao");
      expect(getAssignedSite({ site: "3" })).toBe("Hybrid");
      expect(getAssignedSite({})).toBe("—");
    });

    it("returns correct CSS classes in getSiteBadgeClass", () => {
      expect(getSiteBadgeClass("Davao")).toContain("text-violet-700");
      expect(getSiteBadgeClass("Tagum")).toContain("text-blue-700");
      expect(getSiteBadgeClass("Hybrid")).toContain("text-teal-700");
      expect(getSiteBadgeClass("Unknown")).toContain("text-slate-600");
    });
  });
});
