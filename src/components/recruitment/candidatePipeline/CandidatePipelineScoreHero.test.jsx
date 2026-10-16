import React from "react";
import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("Ticket SIBS-UIUX-ASSESSMENT-SCORE-HERO-01: Assessment Summary Score Card Emphasized (TDD)", () => {
  const modalPath = path.resolve(
    __dirname,
    "../../modals/candidatePipeline/CandidatePipelineModal.jsx"
  );

  it("TC-SCORE-01: Assessment Summary contains an emphasized hero card displaying Assessment Score and Award icon", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");

    // Modal must import Award from lucide-react
    expect(modalContent).toMatch(/import\s*\{[^}]*\bAward\b[^}]*\}\s*from\s*["']lucide-react["']/);
    // Assessment Summary must render an emphasized score card with Assessment Score label
    expect(modalContent).toContain("Assessment Score");
    // Must render assessmentSummaryScore inside a large tracking-tight font
    expect(modalContent).toMatch(/text-xl\s+font-black[^>]*>\s*\{\s*assessmentSummaryScore\s*\}/);
  });

  it("TC-SCORE-02: Assessment Score hero card uses gradient and tone coloring matching the Matched card pattern", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");

    // Must define assessmentTone or tone-based background gradient
    expect(modalContent).toContain("assessmentTone");
    // Must have decorative radial glow matching the matched card
    expect(modalContent).toMatch(/pointer-events-none\s+absolute\s+-right-8\s+-bottom-10/);
  });

  it("TC-SCORE-03: Assessment Summary lays out score hero card and details in a responsive grid", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");

    // Grid layout for score card and candidate detail items
    expect(modalContent).toMatch(/grid\s+grid-cols-1\s+gap-3\s+lg:grid-cols-/);
  });
});
