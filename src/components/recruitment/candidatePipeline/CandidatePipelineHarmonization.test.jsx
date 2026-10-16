import React from "react";
import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("Ticket SIBS-UIUX-PIPELINE-01: Candidate Pipeline Harmonization (TDD)", () => {
  const pagePath = path.resolve(
    __dirname,
    "../../../pages/recruitment/CandidatePipelinePage.jsx"
  );
  const shellPath = path.resolve(
    __dirname,
    "./CandidatePipelineModalShell.jsx"
  );

  it("TC-01: CandidatePipelinePage composes canonical MetricGrid & MetricCard and removes xl:grid-cols-6", () => {
    const pageContent = fs.readFileSync(pagePath, "utf-8");

    // Must import canonical MetricGrid & MetricCard
    expect(pageContent).toMatch(
      /import\s+{[^}]*MetricGrid[^}]*}\s+from\s+["'](?:@\/|(?:\.\.\/)*)components\/ui(?:\/index(?:\.js)?)?["']/
    );
    expect(pageContent).toMatch(
      /import\s+{[^}]*MetricCard[^}]*}\s+from\s+["'](?:@\/|(?:\.\.\/)*)components\/ui(?:\/index(?:\.js)?)?["']/
    );

    // Must use MetricGrid columns={6}
    expect(pageContent).toContain("<MetricGrid");
    expect(pageContent).toContain("columns={6}");

    // Must eliminate bespoke PipelineMetricCard definition
    expect(pageContent).not.toContain("function PipelineMetricCard(");

    // Must eliminate responsive violation xl:grid-cols-6
    expect(pageContent).not.toContain("xl:grid-cols-6");
  });

  it("TC-02: CandidatePipelinePage eradicates local FilterDropdown and uses canonical SelectDropdown", () => {
    const pageContent = fs.readFileSync(pagePath, "utf-8");

    // Must import canonical SelectDropdown
    expect(pageContent).toMatch(
      /import\s+{[^}]*SelectDropdown[^}]*}\s+from\s+["'](?:@\/|(?:\.\.\/)*)components\/ui(?:\/index(?:\.js)?)?["']/
    );

    // Must eradicate local FilterDropdown definition
    expect(pageContent).not.toContain("function FilterDropdown(");

    // Must not call FilterDropdown
    expect(pageContent).not.toContain("<FilterDropdown");
  });

  it("TC-03: CandidatePipelineModalShell composes canonical ModalShell", () => {
    const shellContent = fs.readFileSync(shellPath, "utf-8");

    // Must import canonical ModalShell
    expect(shellContent).toMatch(
      /import\s+ModalShell\s+from\s+["'](?:\.\.\/)*ui\/ModalShell(?:\.jsx)?["']/
    );

    // Must render ModalShell
    expect(shellContent).toContain("<ModalShell");
  });

  it("TC-04: CandidatePipelineModalShell preserves movement history and exported button/section contracts", () => {
    const shellContent = fs.readFileSync(shellPath, "utf-8");

    // Must retain exported helpers
    expect(shellContent).toContain("export function CandidateModalPrimaryButton");
    expect(shellContent).toContain("export function CandidateModalSecondaryButton");
    expect(shellContent).toContain("export function CandidateModalSection");

    // Must retain movement history drawer
    expect(shellContent).toContain("movementHistoryEnabled");
    expect(shellContent).toContain("CandidateMovementHistoryDrawer");
  });
});
