import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("Ticket SIBS-UIUX-MODAL-CSS-01: Modal Button Radius & Inline Style Harmonization (TDD)", () => {
  const indexCssPath = path.resolve(__dirname, "../../index.css");
  const departmentModalPath = path.resolve(
    __dirname,
    "../departments/DepartmentDetailsModal.jsx"
  );
  const statutoryModalPath = path.resolve(
    __dirname,
    "../Dashboard/FinanceDashboard/StatutoryCoverageModal.jsx"
  );
  const applicantLeadModalPath = path.resolve(
    __dirname,
    "../recruitment/applicantLeads/ApplicantLeadModal.jsx"
  );
  const candidateOfferDetailsModalPath = path.resolve(
    __dirname,
    "../modals/candidatePipeline/CandidateOfferDetailsModal.jsx"
  );
  const scheduleInterviewModalPath = path.resolve(
    __dirname,
    "../modals/candidatePipeline/ScheduleInterviewModal.jsx"
  );
  const viewHiringNeedsModalPath = path.resolve(
    __dirname,
    "../modals/hiringNeeds/ViewHiringNeedsModal.jsx"
  );

  it("TC-MBRH-01: index.css modal button classes adopt canonical rounded-[10px]", () => {
    const cssContent = fs.readFileSync(indexCssPath, "utf-8");

    // Match .sibs-modal-btn-primary block
    const primaryMatch = cssContent.match(/\.sibs-modal-btn-primary\s*\{([^}]+)\}/);
    expect(primaryMatch).not.toBeNull();
    expect(primaryMatch[1]).toContain("rounded-[10px]");
    expect(primaryMatch[1]).not.toContain("rounded-xl");

    // Match .sibs-modal-btn-secondary block
    const secondaryMatch = cssContent.match(/\.sibs-modal-btn-secondary\s*\{([^}]+)\}/);
    expect(secondaryMatch).not.toBeNull();
    expect(secondaryMatch[1]).toContain("rounded-[10px]");
    expect(secondaryMatch[1]).not.toContain("rounded-xl");
  });

  it("TC-MBRH-02: DepartmentDetailsModal does not contain raw <style> blocks overriding modal typography", () => {
    const content = fs.readFileSync(departmentModalPath, "utf-8");
    expect(content).not.toContain("<style>");
    expect(content).not.toContain(".sibs-modal-title");
  });

  it("TC-MBRH-03: StatutoryCoverageModal does not contain raw <style> blocks overriding modal typography", () => {
    const content = fs.readFileSync(statutoryModalPath, "utf-8");
    expect(content).not.toContain("<style>");
    expect(content).not.toContain(".sibs-modal-title");
  });

  it("TC-MBRH-04: ApplicantLeadModal action buttons use canonical rounded-[10px]", () => {
    const content = fs.readFileSync(applicantLeadModalPath, "utf-8");
    // History trigger and comment action buttons should be rounded-[10px]
    expect(content).not.toMatch(/inline-flex h-8(?:\.5)?.*?rounded-lg/);
    expect(content).not.toMatch(/inline-flex h-7\.5.*?rounded-lg/);
  });

  it("TC-MBRH-05: CandidateOfferDetailsModal controls adopt canonical rounded-[10px] (no rounded-[8px])", () => {
    const content = fs.readFileSync(candidateOfferDetailsModalPath, "utf-8");
    expect(content).not.toContain("rounded-[8px]");
  });

  it("TC-MBRH-06: ScheduleInterviewModal calendar slot & time buttons adopt canonical rounded-[10px]", () => {
    const content = fs.readFileSync(scheduleInterviewModalPath, "utf-8");
    expect(content).not.toContain("h-9 rounded-[8px]");
    expect(content).not.toContain("rounded-lg border border-sibs-border p-2");
    expect(content).not.toContain("rounded-lg border px-2 py-2 text-[11px]");
  });

  it("TC-MBRH-07: ViewHiringNeedsModal footer action buttons adopt canonical rounded-[10px]", () => {
    const content = fs.readFileSync(viewHiringNeedsModalPath, "utf-8");
    // Relink and Decline buttons in ViewHiringNeedsModal footer should be rounded-[10px] instead of rounded-xl
    expect(content).not.toContain("rounded-xl bg-sibs-orange px-4");
    expect(content).not.toContain("rounded-xl border border-red-200");
  });

  it("TC-MBRH-08: StatutoryCoverageModal tab and pagination buttons adopt canonical rounded-[10px]", () => {
    const content = fs.readFileSync(statutoryModalPath, "utf-8");
    // TabButton should be rounded-[10px]
    expect(content).not.toMatch(/min-w-\[145px\].*?rounded-lg/);
    // Pagination buttons should be rounded-[10px]
    expect(content).not.toMatch(/rounded-lg border border-sibs-border bg-white px-3 py-2/);
  });
});
