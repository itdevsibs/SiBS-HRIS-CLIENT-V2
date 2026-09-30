import { describe, expect, it } from "vitest";

import {
  formatCompactDate,
  formatCompactDateTime,
  formatEmployeeName,
  getAccountId,
  getAccountName,
  getAdminAccess,
  getAuditDateValue,
  getAuditDisplayValue,
  getDepartmentName,
  getRoleLabel,
  getRolePillClass,
  getStatusPillClass,
  isActiveAssignedUser,
  isSuperAdmin,
  normalizeRole,
} from "./userSettingsHelpers";

describe("userSettingsHelpers", () => {
  describe("isSuperAdmin & getAdminAccess", () => {
    it("identifies super admins by access level 7 or higher", () => {
      expect(isSuperAdmin({ adminAccess: 7 })).toBe(true);
      expect(isSuperAdmin({ adminAccess: "7" })).toBe(true);
      expect(isSuperAdmin({ admin_access: 8 })).toBe(true);
      expect(isSuperAdmin({ adminAccess: 6 })).toBe(false);
      expect(isSuperAdmin({ adminAccess: 0 })).toBe(false);
    });

    it("identifies super admins by role string", () => {
      expect(isSuperAdmin({ role: "Super Admin" })).toBe(true);
      expect(isSuperAdmin({ role: "super_admin" })).toBe(true);
      expect(isSuperAdmin({ role: "superadmin" })).toBe(true);
      expect(isSuperAdmin({ role: "Manager" })).toBe(false);
      expect(isSuperAdmin(null)).toBe(false);
      expect(isSuperAdmin({})).toBe(false);
    });

    it("extracts admin access correctly with fallbacks", () => {
      expect(getAdminAccess({ adminAccess: 5 })).toBe(5);
      expect(getAdminAccess({ admin_access: "3" })).toBe(3);
      expect(getAdminAccess({ role: "super admin" })).toBe(7);
      expect(getAdminAccess({ role: "Admin" })).toBe(6);
      expect(getAdminAccess({ role: "Operations Manager" })).toBe(4);
      expect(getAdminAccess({ role: "Team Leader" })).toBe(2);
      expect(getAdminAccess({})).toBe(0);
    });
  });

  describe("formatEmployeeName", () => {
    it("formats full employee name with fallback to separate parts", () => {
      expect(
        formatEmployeeName({
          firstName: "John",
          middleName: "D",
          lastName: "Doe",
        }),
      ).toBe("John D Doe");

      expect(
        formatEmployeeName({
          fullName: "Jane A. Smith",
        }),
      ).toBe("Jane A. Smith");

      expect(formatEmployeeName({})).toBe("—");
      expect(formatEmployeeName(null)).toBe("—");
    });
  });

  describe("getRoleLabel & getRolePillClass", () => {
    it("returns correct role label by access and role", () => {
      expect(getRoleLabel("Super Admin", 7)).toBe("Super Admin");
      expect(getRoleLabel("", 6)).toBe("Admin");
      expect(getRoleLabel("", 4)).toBe("Manager");
      expect(getRoleLabel("", 3)).toBe("SOM");
      expect(getRoleLabel("", 2)).toBe("Team Leaders");
      expect(getRoleLabel("", 1)).toBe("WFM");
      expect(getRoleLabel("", 0)).toBe("Employee");
      expect(getRoleLabel("Special Role", null)).toBe("Special Role");
    });

    it("returns appropriate pill styling classes", () => {
      expect(getRolePillClass(7)).toContain("text-purple-700");
      expect(getRolePillClass(6)).toContain("text-indigo-700");
      expect(getRolePillClass(4)).toContain("text-blue-700");
      expect(getRolePillClass(1)).toContain("text-cyan-700");
    });
  });

  describe("Account and Department extractors", () => {
    it("extracts account names from various object structures", () => {
      expect(getAccountName({ account_name: "CD - Cash" })).toBe("CD - Cash");
      expect(getAccountName({ account: "US Visa" })).toBe("US Visa");
      expect(getAccountName({ name: "Managers" })).toBe("Managers");
      expect(getAccountName("Direct String")).toBe("Direct String");
      expect(getAccountName(null)).toBe("—");
    });

    it("extracts account ID cleanly", () => {
      expect(getAccountId({ id: 101 })).toBe("101");
      expect(getAccountId({ account_id: 202 })).toBe("202");
      expect(getAccountId("string-id")).toBe("string-id");
      expect(getAccountId(null)).toBe("");
    });

    it("extracts department name correctly", () => {
      expect(
        getDepartmentName({ department_name: "Call Center Operations" }),
      ).toBe("Call Center Operations");
      expect(getDepartmentName({ department: "IT Support" })).toBe("IT Support");
      expect(getDepartmentName(null)).toBe("—");
    });
  });

  describe("Audit trail value resolution", () => {
    it("resolves creator name with fallback hierarchy", () => {
      const user = {
        created_by_name: "Crister Canitan",
        created_by_sibs_id: "6496",
      };
      expect(getAuditDisplayValue(user, "creator")).toBe(
        "6496 - Crister Canitan",
      );
    });

    it("resolves updater name with fallback hierarchy", () => {
      const user = {
        updated_by_name: "Roland James Labus",
        updated_by_sibs_id: "6099",
      };
      expect(getAuditDisplayValue(user, "updater")).toBe(
        "6099 - Roland James Labus",
      );
    });

    it("handles missing audit data gracefully", () => {
      expect(getAuditDisplayValue({}, "creator")).toBe("—");
      expect(getAuditDateValue({}, "created")).toBe(null);
    });
  });

  describe("formatCompactDate & formatCompactDateTime", () => {
    it("formats dates to compact Philippine format", () => {
      const testDate = "2026-09-16T08:30:00.000Z";
      expect(formatCompactDate(testDate)).toBeTruthy();
      expect(formatCompactDate(null)).toBe("—");
      expect(formatCompactDateTime(testDate)).toBeTruthy();
      expect(formatCompactDateTime(null)).toBe("—");
    });
  });

  describe("status helpers", () => {
    it("identifies active status correctly", () => {
      expect(isActiveAssignedUser({ status: "Active" })).toBe(true);
      expect(isActiveAssignedUser({ status: "inactive" })).toBe(false);
    });

    it("returns correct pill styling for statuses", () => {
      expect(getStatusPillClass("active")).toContain("text-emerald-700");
      expect(getStatusPillClass("inactive")).toContain("text-slate-700");
    });
  });
});
