import React from "react";
import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("Ticket SIBS-UIUX-MOBILE-PIPELINE-MODAL-01: Candidate Pipeline Modal Mobile Harmonization (TDD)", () => {
  const modalPath = path.resolve(
    __dirname,
    "../../modals/candidatePipeline/CandidatePipelineModal.jsx"
  );
  const shellPath = path.resolve(
    __dirname,
    "../../ui/ModalShell.jsx"
  );

  it("TC-MOB-01: RecruitmentJourneySection wraps 11-stage stepper in horizontal scroll track on mobile", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");

    // Stepper container must provide touch-scrollable overflow on mobile
    expect(modalContent).toContain("overflow-x-auto");
    // Stepper grid must enforce minimum width on mobile to prevent character-level word wrapping
    expect(modalContent).toContain("min-w-[720px]");
    // Must reset minimum width on tablet and desktop
    expect(modalContent).toContain("sm:min-w-0");
  });

  it("TC-MOB-02: Header breadcrumb hides parent crumb on narrow mobile viewports", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");

    // Must hide Candidate Pipeline parent crumb on mobile to prevent crowding header actions
    expect(modalContent).toMatch(
      /className=["'][^"']*hidden\s+sm:inline[^"']*["']>\s*Candidate Pipeline/
    );
  });

  it("TC-MOB-03: Modal footer buttons span full-width on mobile viewports", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");

    // recordFooter buttons must support full width on mobile
    expect(modalContent).toContain("w-full sm:w-auto");
  });

  it("TC-MOB-04: ModalShell footer wrapper allows full-width mobile actions", () => {
    const shellContent = fs.readFileSync(shellPath, "utf-8");

    // ModalShell footer container must support flex-col / full width on mobile
    expect(shellContent).toMatch(/w-full|flex-col\s+sm:flex-row/);
  });

  it("TC-MOB-05: CandidatePipelineModalShell exports primary and secondary buttons with mobile full-width and centered styling", () => {
    const customShellPath = path.resolve(
      __dirname,
      "CandidatePipelineModalShell.jsx"
    );
    const customShellContent = fs.readFileSync(customShellPath, "utf-8");

    expect(customShellContent).toContain("w-full sm:w-auto justify-center");
  });
});

