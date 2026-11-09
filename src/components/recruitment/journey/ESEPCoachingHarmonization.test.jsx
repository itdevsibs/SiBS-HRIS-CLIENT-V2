import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ESEPCoachingTabView from "./views/ESEPCoachingTabView";
import TrainerCoachingDetailsModal from "./TrainerCoachingDetailsModal";
import { JourneyProvider } from "./JourneyContext";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function renderWithJourney(ui) {
  return render(<JourneyProvider>{ui}</JourneyProvider>);
}

describe("ESEP Coaching View & Modals Harmonization Gate", () => {
  it("renders Section 1: Coaching Results & Performance Outcomes with QDS table filters", () => {
    renderWithJourney(<ESEPCoachingTabView />);

    expect(screen.getByText("Coaching Results & Performance Outcomes")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search coachee, SIBS ID, account, or TL...")
    ).toBeInTheDocument();
  });

  it("renders Section 2: Coach Accountability & Weekly Coverage", () => {
    renderWithJourney(<ESEPCoachingTabView />);

    expect(screen.getByText("Daily Coaching Accountability")).toBeInTheDocument();
    expect(screen.getByText("Weekly CSR Coaching Coverage")).toBeInTheDocument();
    expect(screen.getByText("Target: 3-5 per coach")).toBeInTheDocument();
  });

  it("renders Section 3: GROW Coaching History & Evidence Ledger with QDS table filters", () => {
    renderWithJourney(<ESEPCoachingTabView />);

    expect(screen.getByText("GROW Coaching History & Evidence Ledger")).toBeInTheDocument();
    expect(screen.getByText("CHRONOLOGICAL AUDIT TRAIL")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search session ID, CSR, facilitator, goal, or action plan...")
    ).toBeInTheDocument();
  });

  it("renders TrainerCoachingDetailsModal with canonical sibs-modal tokens and metrics", () => {
    const mockEmployee = {
      id: "ONB-2026-001",
      sibsEmployeeId: "ONB-2026-001",
      fullName: "Theresa Mae Santos",
      account: "Elevance Health",
    };

    const mockSessions = [
      {
        id: "1",
        emp: "ONB-2026-001",
        type: "Weekly 1:1",
        date: "2026-10-08",
        facilitator: "Anton Reyes",
        facilitatorRole: "Team Leader",
        goal: "Improve handle time",
        reality: "Handles calls methodically",
        options: "Use quick templates",
        will: "Apply shortcuts on 5 calls",
        due: "2026-10-15",
      },
    ];

    render(
      <TrainerCoachingDetailsModal
        employee={mockEmployee}
        sessions={mockSessions}
        evaluations={[]}
        asOf="2026-10-14"
        onClose={vi.fn()}
      />
    );

    expect(screen.getAllByText("Theresa Mae Santos")[0]).toBeInTheDocument();
    expect(screen.getByText("Recorded Sessions")).toBeInTheDocument();
    expect(screen.getByText("Evaluated Follow-ups")).toBeInTheDocument();
    expect(screen.getByText("Overdue Follow-ups")).toBeInTheDocument();
    expect(screen.getByText("GROW Framework Breakdown")).toBeInTheDocument();
  });

  it("verifies zero raw hex codes exist in ESEPCoachingTabView.jsx", () => {
    const filePath = path.resolve(
      __dirname,
      "views",
      "ESEPCoachingTabView.jsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");
    const hexMatches = content.match(/#[0-9a-fA-F]{3,6}/g);
    expect(hexMatches).toBeNull();
  });
});
