import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("Ticket SIBS-UIUX-DROPDOWN-01: Global Dropdown Standardization & DropdownField Modernization", () => {
  const dropdownFieldPath = path.resolve(__dirname, "./DropdownField.jsx");
  const offersModalPath = path.resolve(__dirname, "../../modals/offers/OffersModal.jsx");
  const pipelineModalPath = path.resolve(__dirname, "../../modals/candidatePipeline/CandidatePipelineModal.jsx");

  it("TC-01: DropdownField.jsx composes canonical DropdownPortal from @/components/ui", () => {
    const content = fs.readFileSync(dropdownFieldPath, "utf-8");
    expect(content).toMatch(/import\s+DropdownPortal\s+from\s+["']@\/components\/ui\/DropdownPortal(?:\.jsx)?["']/);
  });

  it("TC-02: DropdownField.jsx eliminates manual createPortal and manual boundary arithmetic", () => {
    const content = fs.readFileSync(dropdownFieldPath, "utf-8");
    // Should not import raw createPortal from react-dom
    expect(content).not.toContain("import { createPortal }");
    // Should not contain manual window scroll listener hacks
    expect(content).not.toContain("window.addEventListener(\"scroll\"");
    // Should not exceed 250 lines (down from 552 lines)
    const lines = content.split("\n").length;
    expect(lines, `DropdownField.jsx should be concise, found ${lines} lines`).toBeLessThanOrEqual(250);
  });

  it("TC-03: OffersModal.jsx eradicates all raw <select> elements in favor of canonical SelectDropdown", () => {
    const content = fs.readFileSync(offersModalPath, "utf-8");
    const rawSelectMatches = content.match(/<select[\s>]/g) || [];
    expect(
      rawSelectMatches.length,
      `OffersModal.jsx must have 0 raw <select> tags, found ${rawSelectMatches.length}`
    ).toBe(0);
    expect(content).toMatch(/import\s*\{[^}]*SelectDropdown[^}]*\}\s*from\s*["']@\/components\/ui["']|import\s+SelectDropdown\s+from\s+["']@\/components\/ui\/SelectDropdown["']/);
  });

  it("TC-04: CandidatePipelineModal.jsx eliminates orphaned DropdownField import", () => {
    const content = fs.readFileSync(pipelineModalPath, "utf-8");
    expect(content).not.toContain("DropdownField");
  });
});
