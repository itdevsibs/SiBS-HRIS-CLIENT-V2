import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("Ticket SIBS-UIUX-MODAL-FOOTER-FONT-01: Modal Footer Spacing & Dual-Font Normalization (TDD)", () => {
  const offerDetailsPath = path.resolve(
    __dirname,
    "../modals/offers/OfferDetailsModal.jsx"
  );
  const addHiringNeedsPath = path.resolve(
    __dirname,
    "../modals/hiringNeeds/AddHiringNeedsModal.jsx"
  );
  const viewHiringNeedsPath = path.resolve(
    __dirname,
    "../modals/hiringNeeds/ViewHiringNeedsModal.jsx"
  );
  const dropOffModalPath = path.resolve(
    __dirname,
    "../modals/candidatePipeline/DropOffModal.jsx"
  );
  const moveStageModalPath = path.resolve(
    __dirname,
    "../modals/candidatePipeline/MoveStageModal.jsx"
  );
  const revisedOfferModalPath = path.resolve(
    __dirname,
    "../modals/candidatePipeline/RevisedOfferModal.jsx"
  );
  const candidateOfferDetailsPath = path.resolve(
    __dirname,
    "../modals/candidatePipeline/CandidateOfferDetailsModal.jsx"
  );
  const scheduleInterviewPath = path.resolve(
    __dirname,
    "../modals/candidatePipeline/ScheduleInterviewModal.jsx"
  );
  const declineResponsePath = path.resolve(
    __dirname,
    "../modals/offers/DeclineResponseModel.jsx"
  );
  const onboardingOutcomePath = path.resolve(
    __dirname,
    "../modals/onboarding/OnboardingOutcomeModal.jsx"
  );
  const positionFormPath = path.resolve(
    __dirname,
    "../modals/availablePositions/PositionFormModal.jsx"
  );
  const weeklyReportDetailsPath = path.resolve(
    __dirname,
    "../recruitment/weeklyReports/WeeklyReportDetailsModal.jsx"
  );

  it("TC-MFFH-01: OfferDetailsModal section headers adopt canonical font-heading (Roboto Condensed)", () => {
    const content = fs.readFileSync(offerDetailsPath, "utf-8");

    // All section <h3> headers in OfferDetailsModal must include font-heading
    const h3Matches = content.match(/<h3 className="([^"]+)">/g) || [];
    expect(h3Matches.length).toBeGreaterThan(0);
    h3Matches.forEach((h3Tag) => {
      expect(h3Tag).toContain("font-heading");
    });
  });

  it("TC-MFFH-02: AddHiringNeedsModal adopts font-heading on guide heading and canonical gap-2.5 sm:gap-3 on footer", () => {
    const content = fs.readFileSync(addHiringNeedsPath, "utf-8");
    expect(content).toContain('font-heading text-xs font-extrabold text-sibs-navy');
    expect(content).toMatch(/flex flex-col-reverse gap-2\.5 sm:gap-3 sm:flex-row/);
  });

  it("TC-MFFH-03: ViewHiringNeedsModal adopts font-heading on relink guide and context headings", () => {
    const content = fs.readFileSync(viewHiringNeedsPath, "utf-8");
    expect(content).toContain('font-heading text-xs font-extrabold text-amber-900');
  });

  it("TC-MFFH-04: DropOffModal adopts font-jakarta on body container and canonical footer spacing", () => {
    const content = fs.readFileSync(dropOffModalPath, "utf-8");
    expect(content).toMatch(/space-y-4 font-jakarta/);
    expect(content).toMatch(/flex flex-col-reverse justify-end gap-2\.5 sm:gap-3 sm:flex-row/);
  });

  it("TC-MFFH-05: MoveStageModal adopts font-jakarta on body container and canonical footer spacing", () => {
    const content = fs.readFileSync(moveStageModalPath, "utf-8");
    expect(content).toMatch(/space-y-2\.5 2xl:space-y-3\.5 font-jakarta/);
    expect(content).toMatch(/flex flex-col-reverse justify-end gap-2\.5 sm:gap-3 sm:flex-row/);
  });

  it("TC-MFFH-06: RevisedOfferModal adopts font-jakarta on form container and canonical footer spacing", () => {
    const content = fs.readFileSync(revisedOfferModalPath, "utf-8");
    expect(content).toMatch(/id="candidate-revised-offer-form"[^>]*font-jakarta/);
    expect(content).toMatch(/flex flex-col-reverse justify-end gap-2\.5 sm:gap-3 sm:flex-row/);
  });

  it("TC-MFFH-07: CandidateOfferDetailsModal adopts font-jakarta on form and canonical footer spacing", () => {
    const content = fs.readFileSync(candidateOfferDetailsPath, "utf-8");
    expect(content).toMatch(/id="candidate-offer-details-form"[^>]*font-jakarta/);
    expect(content).toMatch(/flex flex-col-reverse justify-end gap-2\.5 sm:gap-3 sm:flex-row/);
    expect(content).toMatch(/flex justify-end gap-2\.5 sm:gap-3/);
  });

  it("TC-MFFH-08: ScheduleInterviewModal, DeclineResponseModel, OnboardingOutcomeModal, and PositionFormModal adopt canonical footer spacing", () => {
    const scheduleContent = fs.readFileSync(scheduleInterviewPath, "utf-8");
    const declineContent = fs.readFileSync(declineResponsePath, "utf-8");
    const onboardingContent = fs.readFileSync(onboardingOutcomePath, "utf-8");
    const positionContent = fs.readFileSync(positionFormPath, "utf-8");

    expect(scheduleContent).toMatch(/flex flex-col-reverse justify-end gap-2\.5 sm:gap-3 sm:flex-row/);
    expect(declineContent).toMatch(/flex justify-end gap-2\.5 sm:gap-3/);
    expect(onboardingContent).toMatch(/flex w-full flex-col-reverse gap-2\.5 sm:gap-3 sm:flex-row sm:justify-end/);
    expect(positionContent).toMatch(/flex flex-wrap items-center justify-end gap-2\.5 sm:gap-3/);
  });

  it("TC-MFFH-09: WeeklyReportDetailsModal adopts canonical bg-sibs-surface and gap-2.5 sm:gap-3 on footer", () => {
    const content = fs.readFileSync(weeklyReportDetailsPath, "utf-8");
    expect(content).toMatch(/flex flex-col-reverse gap-2\.5 sm:gap-3 sm:flex-row/);
    expect(content).toMatch(/footerClassName="[^"]*bg-sibs-surface[^"]*"/);
  });
});
