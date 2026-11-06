import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import QDSDashboardPage from "./QDSDashboardPage";
import { JourneyProvider } from "@/components/recruitment/journey/JourneyContext";

// Mock dependencies
vi.mock("@/components/layout/Header", () => ({
  default: () => <div data-testid="global-header">Header Mock</div>,
}));

const mockBootstrapData = {
  success: true,
  data: {
    metrics: {
      totalTrainees: 24,
      qaPassRate: 85,
      calibrationGaps: 2,
      pendingAudits: 5,
      funnel: {
        nho: 6,
        fst: 8,
        pst: 5,
        nesting: 3,
        floorReady: 2,
        dropouts: 1,
        activeTrainees: 24,
        conversionRate: 96,
      },
    },
    trainerSummaries: [
      {
        trainerName: "Elena Santos (Quality Lead)",
        traineeCount: 14,
        scoredCount: 12,
        meanComposite: 88,
        meanQa: 87,
        meanTr: 89,
        calibrationGap: 2,
        hasLargeGap: false,
        highCount: 8,
        supportCount: 1,
        avgAttendance: 98,
        pendingRequests: 2,
      },
      {
        trainerName: "Marcus Vance (Senior Trainer)",
        traineeCount: 10,
        scoredCount: 9,
        meanComposite: 79,
        meanQa: 74,
        meanTr: 88,
        calibrationGap: 14,
        hasLargeGap: true,
        highCount: 2,
        supportCount: 3,
        avgAttendance: 91,
        pendingRequests: 3,
      },
    ],
    trainees: [
      {
        id: "TRN-001",
        sibsEmployeeId: "SIBS-2901",
        fullName: "Alyssa Rivera",
        account: "Fintech Core Banking",
        trainerName: "Elena Santos (Quality Lead)",
        trainingPhase: "Day 30 Nesting",
        trainerScore: 89,
        qaScore: 88,
        simScore: 92,
        composite: 89,
        calibrationGap: 1,
        attendanceRate: 98,
        auditStatus: "Completed",
        coachingStatus: "Evaluated",
        lastAuditDate: "2026-10-24",
      },
      {
        id: "TRN-002",
        sibsEmployeeId: "SIBS-2902",
        fullName: "Theresa Mae Santos",
        account: "Healthcare Patient Support",
        trainerName: "Marcus Vance (Senior Trainer)",
        trainingPhase: "PST",
        trainerScore: 94,
        qaScore: 78,
        simScore: 80,
        composite: 84,
        calibrationGap: 16,
        attendanceRate: 92,
        auditStatus: "Pending",
        coachingStatus: "Overdue",
        lastAuditDate: "2026-10-22",
      },
    ],
  },
};

vi.mock("@/lib/axios/getQdsDashboard", () => ({
  getQdsDashboardBootstrap: vi.fn().mockImplementation(() => Promise.resolve(mockBootstrapData)),
  buildFallbackQdsBootstrap: vi.fn().mockImplementation(() => mockBootstrapData),
}));

describe("QDSDashboardPage (Canonical 5-Tier Architecture)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Tier 1 PageHeaderHero with title, kicker, and action CTAs", async () => {
    render(
      <MemoryRouter>
        <JourneyProvider><QDSDashboardPage /></JourneyProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("Quality Development Specialist (QDS)")).toBeInTheDocument();
    expect(screen.getByText("QDS Dashboard & Training Quality Oversight")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Refresh/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /NHO Module/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ESEP Coaching/i })).toBeInTheDocument();
  });

  it("renders Tier 2 Executive Horizon metrics accurately after loading", async () => {
    render(
      <MemoryRouter>
        <JourneyProvider><QDSDashboardPage /></JourneyProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("TRAINEES IN OVERSIGHT")).toBeInTheDocument();
      expect(screen.getByText("INDEPENDENT QA PASS RATE")).toBeInTheDocument();
      expect(screen.getByText("CALIBRATION GAPS")).toBeInTheDocument();
      expect(screen.getByText("PENDING QUALITY AUDITS")).toBeInTheDocument();
    });

    expect(screen.getAllByText("24").length).toBeGreaterThan(0);
    expect(screen.getByText("85%")).toBeInTheDocument();
  });

  it("renders Tier 3 Strategic Analytics (Trainer Calibration & Cohort Funnel)", async () => {
    render(
      <MemoryRouter>
        <JourneyProvider><QDSDashboardPage /></JourneyProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Trainer Calibration/i)).toBeInTheDocument();
      expect(screen.getByText(/Progression Gateway/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Elena Santos/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Marcus Vance/i).length).toBeGreaterThan(0);
    });
  });

  it("renders Tier 4 Tactical Operations Table with Pattern B filters", async () => {
    render(
      <MemoryRouter>
        <JourneyProvider><QDSDashboardPage /></JourneyProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Trainee Quality Audit Matrix")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Search trainee, SIBS ID, trainer, or account/i)).toBeInTheDocument();
      expect(screen.getAllByText("Alyssa Rivera").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Theresa Mae Santos").length).toBeGreaterThan(0);
    });
  });

  it("renders the unified Quality Oversight & Audit Matrix view cleanly without redundant tabs", async () => {
    render(
      <MemoryRouter>
        <JourneyProvider><QDSDashboardPage /></JourneyProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("TRAINEES IN OVERSIGHT")).toBeInTheDocument();
      expect(screen.getByText("Trainee Quality Audit Matrix")).toBeInTheDocument();
    });

    // Ensure the fabricated mode-switcher tabs are not rendered
    expect(screen.queryByRole("tab", { name: /Curriculum Materials/i })).not.toBeInTheDocument();
  });
});
