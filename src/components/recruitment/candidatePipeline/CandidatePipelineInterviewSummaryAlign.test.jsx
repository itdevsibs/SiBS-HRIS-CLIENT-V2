import React from "react";
import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("Ticket SIBS-UIUX-INTERVIEW-SUMMARY-ALIGN-01: Interview Summary Body Metric Strip (TDD)", () => {
  const modalPath = path.resolve(
    __dirname,
    "../../modals/candidatePipeline/CandidatePipelineModal.jsx"
  );

  it("TC-ISA-01: Interview Summary section does NOT use awkward far-right floating headerAction", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");

    // Must NOT have headerAction on Interview Summary CandidateModalSection
    expect(modalContent).not.toMatch(
      /title="Interview Summary"[\s\S]*?headerAction=\{/
    );
  });

  it("TC-ISA-02: Interview Summary body contains a balanced, full-width metric strip with Final Interview and Job Evaluation", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");

    // Must contain the full-width metric strip inside Interview Summary
    expect(modalContent).toMatch(
      /title="Interview Summary"[\s\S]*?Final Interview:[\s\S]*?Job Evaluation:/
    );
  });

  it("TC-ISA-03: Both Final Interview and Job Evaluation scores use symmetrical outcome pills", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");

    // Job Evaluation score must be housed in a pill matching interviewSummaryScore
    expect(modalContent).toMatch(
      /title="Interview Summary"[\s\S]*?Job Evaluation:[\s\S]*?rounded-lg border px-2\.5 py-0\.5 text-\[10px\] font-black tabular-nums sm:text-xs/
    );
  });
});
