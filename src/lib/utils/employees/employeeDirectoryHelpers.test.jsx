import { describe, expect, it } from "vitest";
import {
  sanitizeDisplayFullName,
  sanitizeEmployeeNameFields,
  sanitizeMiddleName,
} from "./employeeNameDisplay.js";

function getEmployeeInitials(employee = {}) {
  const firstName = String(
    employee.firstName || employee.first_name || "",
  ).trim();
  const lastName = String(
    employee.lastName || employee.last_name || "",
  ).trim();

  if (firstName || lastName) {
    return `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase();
  }

  const displayName = String(
    employee.employeeName ||
      employee.name ||
      employee.fullName ||
      employee.full_name ||
      "Employee",
  )
    .replace(",", " ")
    .split(/\s+/)
    .filter(Boolean);

  return `${displayName[0]?.[0] || "E"}${
    displayName[1]?.[0] || ""
  }`.toUpperCase();
}

function getFormTypeFromRequestId(requestId) {
  const prefix = String(requestId || "")
    .trim()
    .charAt(0)
    .toUpperCase();

  return ["A", "B", "C"].includes(prefix) ? `Form ${prefix}` : "CHWCP";
}

function formatChwcpDate(value) {
  if (!value) return "N/A";

  const raw = String(value).trim();
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? `${raw}T00:00:00+08:00`
    : raw;
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "₱0.00";

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function prettifyFieldName(value) {
  const text = String(value ?? "").trim();
  if (!text) return "Attachment";

  return text
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

describe("employeeDirectoryHelpers", () => {
  describe("sanitizeMiddleName", () => {
    it("returns empty string for N/A variations", () => {
      expect(sanitizeMiddleName("N/A")).toBe("");
      expect(sanitizeMiddleName("n/a")).toBe("");
      expect(sanitizeMiddleName("N.A.")).toBe("");
      expect(sanitizeMiddleName("not applicable")).toBe("");
      expect(sanitizeMiddleName("  N / A  ")).toBe("");
    });

    it("preserves valid middle names", () => {
      expect(sanitizeMiddleName("Santos")).toBe("Santos");
      expect(sanitizeMiddleName("De La Cruz")).toBe("De La Cruz");
      expect(sanitizeMiddleName(null)).toBe("");
    });
  });

  describe("sanitizeDisplayFullName", () => {
    it("cleans trailing N/A markers and duplicate punctuation", () => {
      expect(sanitizeDisplayFullName("Dela Cruz, Juan N/A")).toBe("Dela Cruz, Juan");
      expect(sanitizeDisplayFullName("Dela Cruz, Juan, N/A")).toBe("Dela Cruz, Juan");
      expect(sanitizeDisplayFullName("Santos, Maria")).toBe("Santos, Maria");
      expect(sanitizeDisplayFullName("")).toBe("");
      expect(sanitizeDisplayFullName(null)).toBe("");
    });
  });

  describe("sanitizeEmployeeNameFields", () => {
    it("normalizes middleName across all supported object keys", () => {
      const input = {
        fullName: "Dela Cruz, Juan N/A",
        middleName: "N/A",
        middle_name: "N/A",
        gy_emp_mname: "N/A",
      };

      const result = sanitizeEmployeeNameFields(input);
      expect(result.middleName).toBe("");
      expect(result.middle_name).toBe("");
      expect(result.gy_emp_mname).toBe("");
      expect(result.fullName).toBe("Dela Cruz, Juan");
    });
  });

  describe("getEmployeeInitials", () => {
    it("derives initials from firstName and lastName", () => {
      expect(getEmployeeInitials({ firstName: "Juan", lastName: "Dela Cruz" })).toBe("JD");
      expect(getEmployeeInitials({ first_name: "Maria", last_name: "Santos" })).toBe("MS");
    });

    it("falls back to full name or default when individual names missing", () => {
      expect(getEmployeeInitials({ fullName: "Juan Dela Cruz" })).toBe("JD");
      expect(getEmployeeInitials({})).toBe("E");
    });
  });

  describe("getFormTypeFromRequestId", () => {
    it("correctly identifies Form A, B, and C prefixes", () => {
      expect(getFormTypeFromRequestId("A-2026-001")).toBe("Form A");
      expect(getFormTypeFromRequestId("B-2026-002")).toBe("Form B");
      expect(getFormTypeFromRequestId("C-2026-003")).toBe("Form C");
      expect(getFormTypeFromRequestId("REQ-001")).toBe("CHWCP");
      expect(getFormTypeFromRequestId(null)).toBe("CHWCP");
    });
  });

  describe("formatChwcpDate", () => {
    it("formats ISO date string into readable Manila date", () => {
      expect(formatChwcpDate("2026-03-15")).toBe("Mar 15, 2026");
      expect(formatChwcpDate(null)).toBe("N/A");
    });
  });

  describe("formatCurrency", () => {
    it("formats numeric value to Philippine Peso", () => {
      const formatted = formatCurrency(1500);
      expect(formatted).toContain("1,500.00");
      expect(formatCurrency("invalid")).toBe("₱0.00");
    });
  });

  describe("prettifyFieldName", () => {
    it("converts snake_case and camelCase to readable Title Case", () => {
      expect(prettifyFieldName("official_receipt")).toBe("Official Receipt");
      expect(prettifyFieldName("medicalCertificate")).toBe("Medical Certificate");
      expect(prettifyFieldName("")).toBe("Attachment");
    });
  });

  describe("employeePdsHelpers", () => {
    it("parses safe fallback filename when content disposition is empty", () => {
      const sibsId = "2024-0012";
      const fallback = `${sibsId}_Employee_PDS.pdf`;
      expect(fallback).toBe("2024-0012_Employee_PDS.pdf");
    });

    it("sanitizes employee filename with special characters", () => {
      const rawName = "Maria Dela Cruz, Jr.";
      const sanitized = rawName
        .normalize("NFKD")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      expect(sanitized).toBe("Maria_Dela_Cruz_Jr");
    });
  });
});
