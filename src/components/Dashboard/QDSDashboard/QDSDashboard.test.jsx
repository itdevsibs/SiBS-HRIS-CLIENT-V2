import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import {
  QDSDashboardStats,
  QDSTrainerCalibration,
  QDSTrainingFunnel,
  QDSTraineeAuditTable,
  QDSDashboardSkeleton,
} from "./index";

const MOCK_METRICS = {
  totalTrainees: 48,
  qaPassRate: 88,
  calibrationGaps: 3,
  pendingAudits: 7,
};

const MOCK_TRAINER_SUMMARIES = [
  {
    trainerName: "Elena Santos (Quality Lead)",
    traineeCount: 18,
    scoredCount: 16,
    meanComposite: 90,
    meanQa: 89,
    meanTr: 91,
    calibrationGap: 2,
    hasLargeGap: false,
    highCount: 12,
    supportCount: 1,
    avgAttendance: 98,
    pendingRequests: 1,
  },
  {
    trainerName: "Marcus Vance (Senior Trainer)",
    traineeCount: 15,
    scoredCount: 14,
    meanComposite: 81,
    meanQa: 76,
    meanTr: 92,
    calibrationGap: 16,
    hasLargeGap: true,
    highCount: 5,
    supportCount: 4,
    avgAttendance: 92,
    pendingRequests: 4,
  },
];

const MOCK_FUNNEL = {
  nho: 12,
  fst: 14,
  pst: 10,
  nesting: 8,
  floorReady: 4,
  dropouts: 2,
  activeTrainees: 48,
  conversionRate: 96,
};

const MOCK_TRAINEES = [
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
];

describe("QDSDashboardStats", () => {
  it("renders 4 KPI metric cards with accurate values and labels", () => {
    render(<QDSDashboardStats metrics={MOCK_METRICS} />);

    expect(screen.getByText("TRAINEES IN OVERSIGHT")).toBeInTheDocument();
    expect(screen.getByText("48")).toBeInTheDocument();

    expect(screen.getByText("INDEPENDENT QA PASS RATE")).toBeInTheDocument();
    expect(screen.getByText("88%")).toBeInTheDocument();

    expect(screen.getByText("CALIBRATION GAPS")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    expect(screen.getByText("PENDING QUALITY AUDITS")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("handles loading state cleanly", () => {
    const { container } = render(
      <QDSDashboardStats metrics={MOCK_METRICS} loading={true} />,
    );
    expect(
      container.querySelectorAll('[data-slot="skeleton"], .animate-sibs-pulse, [data-testid="metric-card-skeleton"]').length,
    ).toBeGreaterThan(0);
  });
});

describe("QDSTrainerCalibration", () => {
  it("renders trainer calibration dispersion cards and calibration gap badge", () => {
    render(<QDSTrainerCalibration trainerSummaries={MOCK_TRAINER_SUMMARIES} />);

    expect(
      screen.getByText("Trainer Calibration & Audit Dispersion"),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Elena Santos (Quality Lead)")[0],
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Marcus Vance (Senior Trainer)")[0],
    ).toBeInTheDocument();

    // Large gap warning badge
    expect(
      screen.getAllByText("+16 pp · Calibration review recommended")[0],
    ).toBeInTheDocument();

    // Well-calibrated badge
    expect(
      screen.getAllByText("+2 pp · Well Calibrated")[0],
    ).toBeInTheDocument();
  });
});

describe("QDSTrainingFunnel", () => {
  it("renders all 5 training stages and operations readiness banner", () => {
    render(<QDSTrainingFunnel funnel={MOCK_FUNNEL} />);

    expect(
      screen.getByText("Cohort Training Progression Gateway"),
    ).toBeInTheDocument();
    expect(screen.getByText("Day 1 NHO")).toBeInTheDocument();
    expect(screen.getByText("Foundational (FST)")).toBeInTheDocument();
    expect(screen.getByText("Product-Specific (PST)")).toBeInTheDocument();
    expect(screen.getByText("Day 30 Nesting")).toBeInTheDocument();
    expect(screen.getByText("Floor Handover")).toBeInTheDocument();

    // Readiness callout banner
    expect(
      screen.getByText(/Operations Readiness Gateway \(96% Handover\)/),
    ).toBeInTheDocument();
  });
});

describe("QDSTraineeAuditTable", () => {
  it("renders data grid, filters, and opens scorecard modal on action click", () => {
    render(<QDSTraineeAuditTable trainees={MOCK_TRAINEES} />);

    expect(screen.getByText("Trainee Quality Audit Matrix")).toBeInTheDocument();
    expect(screen.getAllByText("Alyssa Rivera").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Theresa Mae Santos").length).toBeGreaterThan(0);

    // Open scorecard modal for Alyssa Rivera
    const scorecardBtns = screen.getAllByRole("button", { name: /Scorecard/i });
    expect(scorecardBtns.length).toBeGreaterThan(0);
    fireEvent.click(scorecardBtns[0]);

    // Modal should be open
    expect(
      screen.getByText("Trainee Quality Scorecard & Audit Breakdown"),
    ).toBeInTheDocument();
    expect(screen.getByText("Close Scorecard")).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByText("Close Scorecard"));
    expect(
      screen.queryByText("Trainee Quality Scorecard & Audit Breakdown"),
    ).not.toBeInTheDocument();
  });
});

describe("QDSDashboardSkeleton", () => {
  it("renders full-page skeleton with polite aria status", () => {
    render(<QDSDashboardSkeleton />);
    const statuses = screen.getAllByRole("status");
    expect(statuses.length).toBeGreaterThan(0);
    const mainStatus = screen.getByLabelText("Loading QDS Dashboard");
    expect(mainStatus).toHaveAttribute("aria-busy", "true");
    expect(screen.getByTestId("qds-metrics-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("qds-analytics-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("qds-table-skeleton")).toBeInTheDocument();
  });
});
