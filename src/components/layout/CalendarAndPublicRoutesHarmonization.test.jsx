import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("Ticket SIBS-UIUX-CALENDAR-01: Calendar Modal Shell & Public Routes Harmonization", () => {
  const shellPath = path.resolve(__dirname, "./HeaderCalendarModalShell.jsx");
  const modalPath = path.resolve(__dirname, "./HeaderCalendarModal.jsx");
  const revisedOfferPath = path.resolve(__dirname, "../../pages/hr/approvals/RevisedOfferApprovalPage.jsx");

  it("TC-01: HeaderCalendarModalShell eliminates astronomical z-[2147483000] and uses canonical z-[9999]", () => {
    const shellContent = fs.readFileSync(shellPath, "utf-8");
    expect(shellContent).not.toContain("z-[2147483000]");
    expect(shellContent).toContain("z-[9999]");
    expect(shellContent).toContain("rounded-[14px]");
  });

  it("TC-02: HeaderCalendarModal composes canonical ConfirmModal for calendar disconnection", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");
    // Should import ConfirmModal
    expect(modalContent).toMatch(/import\s+ConfirmModal\s+from\s+["']@\/components\/ui\/ConfirmModal["']/);
    // Should NOT contain the bespoke absolute inset-0 z-[40] overlay
    expect(modalContent).not.toContain("absolute inset-0 z-[40]");
  });

  it("TC-03: RevisedOfferApprovalPage eradicates native browser window.prompt()", () => {
    const revisedOfferContent = fs.readFileSync(revisedOfferPath, "utf-8");
    expect(revisedOfferContent).not.toContain("window.prompt");
  });

  it("TC-04: RevisedOfferApprovalPage adopts font-heading and canonical design tokens", () => {
    const revisedOfferContent = fs.readFileSync(revisedOfferPath, "utf-8");
    expect(revisedOfferContent).toContain("font-heading");
    expect(revisedOfferContent).toContain("rounded-[14px]");
    expect(revisedOfferContent).toContain("rounded-[10px]");
    // Ensure no raw hexes
    const hexRegex = /#[0-9a-fA-F]{3,8}\b/g;
    expect(revisedOfferContent.match(hexRegex)).toBeNull();
  });
});
