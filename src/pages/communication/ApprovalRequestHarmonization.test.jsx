import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("Ticket SIBS-UIUX-APPROVAL-01: ApprovalRequest Monolith Harmonization & Control Modernization", () => {
  const approvalRequestPath = path.resolve(__dirname, "./ApprovalRequest.jsx");
  const content = fs.readFileSync(approvalRequestPath, "utf-8");

  it("TC-01: Eliminates duplicate DropdownPortal function definition", () => {
    // Should not define a local duplicate DropdownPortal
    expect(content).not.toMatch(/function\s+DropdownPortal\s*\(/);
    // Should not contain astronomical or ad-hoc z-[999999]
    expect(content).not.toContain("z-[999999]");
  });

  it("TC-02: Eradicates all raw <select> elements in favor of canonical SelectDropdown", () => {
    // There must be 0 raw <select> tags in ApprovalRequest.jsx
    const rawSelectMatches = content.match(/<select[\s>]/g) || [];
    expect(
      rawSelectMatches.length,
      `Expected 0 raw <select> tags in ApprovalRequest.jsx, found ${rawSelectMatches.length}`
    ).toBe(0);
  });

  it("TC-03: CustomSelect composes canonical SelectDropdown from @/components/ui", () => {
    expect(content).toMatch(/import\s*\{[^}]*SelectDropdown[^}]*\}\s*from\s*["']@\/components\/ui["']/);
  });

  it("TC-04: Headings and modal titles adopt font-heading class", () => {
    // Modal titles should adopt font-heading
    expect(content).toContain("font-heading text-xl font-extrabold text-white");
    expect(content).toContain("font-heading text-2xl font-extrabold uppercase");
  });
});
