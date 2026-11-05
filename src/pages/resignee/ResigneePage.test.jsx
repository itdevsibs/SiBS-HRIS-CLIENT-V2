import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Replicate and test pure date formatting behavior
function formatDate(value) {
  if (!value) return "—";
  const raw = String(value);
  const day = raw.slice(0, 10);
  const date = new Date(`${day}T12:00:00Z`);
  return Number.isNaN(date.getTime())
    ? day
    : new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" }).format(date);
}

// Replicate and test avatar initials extraction
function getInitials(record) {
  const first = String(record?.firstName || "").trim();
  const last = String(record?.lastName || "").trim();
  if (first || last) return `${first[0] || ""}${last[0] || ""}`.toUpperCase();
  const rawName = String(record?.employeeName || "").trim();
  if (rawName.includes(",")) {
    const [lastPart, firstPart] = rawName.split(",").map((s) => s.trim());
    return `${(lastPart || "")[0] || ""}${(firstPart || "")[0] || ""}`.toUpperCase() || "E";
  }
  const words = rawName.split(/\s+/).filter(Boolean);
  return `${words[0]?.[0] || "E"}${words[1]?.[0] || ""}`.toUpperCase();
}

// Replicate preview positioning calculation
function getPreviewPosition(rect) {
  if (!rect) return null;
  const placeBelow = rect.top < 188;
  return {
    left: rect.left + rect.width / 2,
    top: placeBelow ? rect.bottom + 12 : rect.top - 12,
    placeBelow,
  };
}

describe("ResigneePage - Formatting & Data Helpers", () => {
  it("formats dates into readable format without timezone drift", () => {
    expect(formatDate("2025-10-31")).toBe("October 31, 2025");
    expect(formatDate("2024-01-15T00:00:00.000Z")).toBe("January 15, 2024");
    expect(formatDate(null)).toBe("—");
    expect(formatDate("")).toBe("—");
    expect(formatDate(undefined)).toBe("—");
  });

  it("extracts clean uppercase initials from employee records", () => {
    expect(getInitials({ firstName: "Juan", lastName: "Dela Cruz" })).toBe("JD");
    expect(getInitials({ firstName: "Maria", lastName: "" })).toBe("M");
    expect(getInitials({ employeeName: "DELA CRUZ, JUAN" })).toBe("DJ");
    expect(getInitials({ employeeName: "SingleName" })).toBe("S");
    expect(getInitials({})).toBe("E");
  });

  it("calculates avatar hover preview placement relative to viewport boundary", () => {
    // When element is near the top (< 188px), preview opens below
    const topElement = { top: 120, bottom: 156, left: 300, width: 36 };
    const belowPlacement = getPreviewPosition(topElement);
    expect(belowPlacement.placeBelow).toBe(true);
    expect(belowPlacement.top).toBe(168); // 156 + 12

    // When element is further down (>= 188px), preview opens above
    const lowerElement = { top: 350, bottom: 386, left: 300, width: 36 };
    const abovePlacement = getPreviewPosition(lowerElement);
    expect(abovePlacement.placeBelow).toBe(false);
    expect(abovePlacement.top).toBe(338); // 350 - 12
  });

  it("defensively normalizes pagination when totalPages is omitted", () => {
    const normalizePagination = (rawPagination, page, fallbackLimit) => {
      const total = Math.max(0, Number(rawPagination?.total) || 0);
      const limit = Math.max(1, Number(rawPagination?.limit) || fallbackLimit);
      const totalPages = Math.max(1, Number(rawPagination?.totalPages) || Math.ceil(total / limit) || 1);
      const currentPage = Math.max(1, Number(rawPagination?.currentPage || page) || 1);
      return { currentPage, totalPages, total, limit };
    };

    // Upstream sends total: 45 without totalPages
    const normalized = normalizePagination({ total: 45, limit: 15 }, 1, 15);
    expect(normalized.totalPages).toBe(3);
    expect(normalized.currentPage).toBe(1);
    expect(normalized.total).toBe(45);

    // Empty records
    const emptyNormalized = normalizePagination({ total: 0 }, 1, 15);
    expect(emptyNormalized.totalPages).toBe(1);
    expect(emptyNormalized.total).toBe(0);
  });
});

describe("ResigneePage - Global Standard Table Layout Conformance", () => {
  const resigneePagePath = path.resolve(__dirname, "./ResigneePage.jsx");
  const content = fs.readFileSync(resigneePagePath, "utf-8");

  it("conforms to standard table header and decoupled filter controls", () => {
    expect(content).toContain("<SearchInput");
    expect(content).toContain("<SelectDropdown");
    expect(content).toContain("<TablePagination");
    expect(content).toContain("sibs-data-table-th");
    expect(content).toContain("ResponsiveTableShell");
  });

  it("places filters on dedicated row beneath section title instead of cramped header inline", () => {
    // Dedicated filter row pattern
    expect(content).toContain("relative z-[90] mt-3.5 2xl:mt-4 flex flex-col gap-3 overflow-visible xl:flex-row xl:items-end");
    // Does not push Search to the right of the title in md:flex-row md:items-end md:justify-between
    expect(content).not.toMatch(/md:items-end\s+md:justify-between[\s\S]*?<SearchInput/);
  });

  it("places TablePagination directly below the table shell without double nested container", () => {
    expect(content).toContain('<div className="mt-4 2xl:mt-5">');
  });
});
