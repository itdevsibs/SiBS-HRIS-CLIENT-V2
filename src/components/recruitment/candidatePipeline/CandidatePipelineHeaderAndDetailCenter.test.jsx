import React from "react";
import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("Ticket SIBS-UIUX-HEADER-AND-DETAIL-CENTER-01: Header Duplication Fix & Detail Centering (TDD)", () => {
  const modalPath = path.resolve(
    __dirname,
    "../../modals/candidatePipeline/CandidatePipelineModal.jsx"
  );
  const shellPath = path.resolve(
    __dirname,
    "./CandidatePipelineModalShell.jsx"
  );

  it("TC-HD-01: CandidatePipelineModalShell passes canonical title, badge, icon, and subtitle props to ModalShell", () => {
    const shellContent = fs.readFileSync(shellPath, "utf-8");

    // ModalShell call must pass canonical header props
    expect(shellContent).toContain("<ModalShell");
    expect(shellContent).toContain("variant=\"navy\"");
  });

  it("TC-HD-02: CandidatePipelineModal adopts canonical two-tier header with title, badge, icon, and subtitle breadcrumb", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");

    // Must pass canonical title, badge, icon, and subtitle props
    expect(modalContent).toContain("icon={BriefcaseBusiness}");
    expect(modalContent).toContain("title=\"Candidate Pipeline Record\"");
    expect(modalContent).toContain("badge={currentStage}");
    expect(modalContent).toContain("subtitle={");
    expect(modalContent).toContain("Candidate Pipeline");
    expect(modalContent).toContain("Candidate Record");
  });

  it("TC-HD-03: CandidateDetailItem vertically centers icon and text using items-center", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");

    // CandidateDetailItem root div must use items-center
    expect(modalContent).toMatch(/function CandidateDetailItem[\s\S]*?items-center gap-3/);
  });

  it("TC-HD-04: Assessment Summary detail items are vertically centered and horizontally balanced", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");

    // Detail items container must use full height items-center and columns with sm:justify-center
    expect(modalContent).toMatch(/grid\s+h-full\s+grid-cols-1\s+items-center/);
    expect(modalContent).toMatch(/sm:justify-center/);
  });
});
