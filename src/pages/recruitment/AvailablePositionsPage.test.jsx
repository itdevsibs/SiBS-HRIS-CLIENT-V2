import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AvailablePositionsPage from "./AvailablePositionsPage";

const mockApi = vi.hoisted(() => ({
  getAvailablePositionMeta: vi.fn(),
  getAvailablePositions: vi.fn(),
  getApprovedJobDescriptions: vi.fn(),
  getAvailablePositionApprovalRequests: vi.fn(),
  getAvailablePositionApprovalUsers: vi.fn(),
}));

vi.mock("../../lib/axios/getAvailablePosition", () => ({
  createAvailablePosition: vi.fn(),
  getAvailablePositionMeta: mockApi.getAvailablePositionMeta,
  getAvailablePositions: mockApi.getAvailablePositions,
  relinkAvailablePositionJobDescription: vi.fn(),
  updateAvailablePosition: vi.fn(),
  updateAvailablePositionStatus: vi.fn(),
}));

vi.mock("../../lib/axios/getJobDescription", () => ({
  getApprovedJobDescriptions: mockApi.getApprovedJobDescriptions,
}));

vi.mock("../../lib/axios/getApprovalRequest", () => ({
  getAvailablePositionApprovalRequests: mockApi.getAvailablePositionApprovalRequests,
  approveAvailablePositionRequest: vi.fn(),
  rejectAvailablePositionRequest: vi.fn(),
}));

vi.mock("../../lib/axios/getAvailablePositionApprovalSettings", () => ({
  getAvailablePositionApprovalUsers: mockApi.getAvailablePositionApprovalUsers,
}));

vi.mock("../../services/context/UserContext", () => ({
  useUser: () => ({ user: { role: "admin", sibsId: "1001", adminAccess: 1 } }),
}));

vi.mock("../../components/layout/Header", () => ({
  default: () => <div data-testid="header">Header</div>,
}));

vi.mock("@/components/ui", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    PageHeaderHero: ({ title, description }) => (
      <div data-testid="page-header">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    ),
    ConfirmModal: ({ open, title, description }) =>
      open ? (
        <div role="dialog" data-testid="confirm-modal">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      ) : null,
  };
});

describe("AvailablePositionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
    mockApi.getAvailablePositionMeta.mockResolvedValue({
      success: true,
      data: {
        statusOptions: ["Active", "Hold", "Closed"],
        departments: [{ id: 1, departmentName: "Engineering" }],
        accounts: [{ id: 10, accountName: "Core Ops" }],
      },
    });
    mockApi.getAvailablePositions.mockResolvedValue({
      success: true,
      data: [
        {
          id: 101,
          jobTitle: "Senior Software Engineer",
          status: "Active",
          department: "Engineering",
          account: "Core Ops",
        },
      ],
      counts: { total: 1, unlinkedFromJd: 0 },
    });
    mockApi.getApprovedJobDescriptions.mockResolvedValue({ success: true, data: [] });
    mockApi.getAvailablePositionApprovalRequests.mockResolvedValue({ success: true, data: [] });
    mockApi.getAvailablePositionApprovalUsers.mockResolvedValue({ success: true, data: [] });
  });

  it("loads available positions successfully without showing error modal", async () => {
    render(<AvailablePositionsPage />);

    await waitFor(() => {
      expect(screen.queryByTestId("confirm-modal")).toBeNull();
    });

    expect(screen.getByTestId("page-header")).toBeTruthy();
    expect(mockApi.getAvailablePositions).toHaveBeenCalled();
  });

  it("does not open error modal when request is cancelled", async () => {
    const cancelError = new Error("canceled");
    cancelError.name = "CanceledError";
    mockApi.getAvailablePositions.mockRejectedValueOnce(cancelError);

    render(<AvailablePositionsPage />);

    await waitFor(() => {
      expect(screen.queryByTestId("confirm-modal")).toBeNull();
    });
  });

  it("sanitizes technical exceptions and does not expose raw runtime traces to user modal", async () => {
    mockApi.getAvailablePositions.mockRejectedValueOnce(
      new Error("statusOptionsCache is not defined"),
    );

    render(<AvailablePositionsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("confirm-modal")).toBeTruthy();
    });

    expect(screen.queryByText(/statusOptionsCache is not defined/i)).toBeNull();
    expect(
      screen.getAllByText(/Unable to load positions due to a server connection issue/i).length,
    ).toBeGreaterThan(0);
  });
});
