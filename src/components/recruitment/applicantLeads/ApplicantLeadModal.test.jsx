import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

const { useApplicantLeadsPageMock } = vi.hoisted(() => ({
  useApplicantLeadsPageMock: vi.fn(),
}));

vi.mock("../../../hooks/applicantLeads/useApplicantLeadsPage", () => ({
  useApplicantLeadsPage: useApplicantLeadsPageMock,
}));

vi.mock("../availablePositions/DropdownField", () => ({
  default: () => <div data-testid="applicant-lead-dropdown" />,
}));

vi.mock("./ApplicantLeadMovementHistoryDrawer", () => ({
  default: () => null,
}));

import ApplicantLeadModal from "./ApplicantLeadModal";

const lead = {
  id: "lead-1",
  firstName: "Alex",
  lastName: "Rivera",
  middleName: "",
  suffix: "",
  cpNum: "09123456789",
  email: "alex@example.com",
  facebookName: "Alex Rivera",
  facebookLink: "https://example.com/alex",
  school: "",
  departmentId: "",
  department: "",
  accountId: "",
  specificAccount: "",
  sourcingId: "",
  source: "Walk-in",
  preferredSite: "",
  status: "New",
  notes: "GOOD CANDIDATE",
};

describe("ApplicantLeadModal inquiry notes comments", () => {
  const setFormData = vi.fn();
  const setLeadComment = vi.fn();
  const handleAddLeadComment = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useApplicantLeadsPageMock.mockReturnValue({
      showLeadModal: true,
      editingLead: lead,
      formData: { ...lead },
      setFormData,
      closeLeadModal: vi.fn(),
      handleSaveLead: vi.fn((event) => event.preventDefault()),
      currentAccountName: "HR User",
      isSaving: false,
      leadHistory: [
        {
          id: "comment-1",
          comment: "Candidate asked about the night shift.",
          actorName: "Jamie Recruiter",
          createdAt: "2026-09-30T09:00:00Z",
        },
      ],
      isLeadHistoryLoading: false,
      leadHistoryError: "",
      leadComment: "",
      setLeadComment,
      isAddingLeadComment: false,
      handleAddLeadComment,
    });
  });

  it("keeps HR notes and the comment activity together in Inquiry Notes", () => {
    render(<ApplicantLeadModal />);

    const inquiryNotes = screen
      .getByRole("heading", { name: "Inquiry Notes & Remarks" })
      .closest("section");

    expect(inquiryNotes).not.toBeNull();
    expect(within(inquiryNotes).getByLabelText("HR Notes")).toHaveValue(
      "GOOD CANDIDATE",
    );
    const addCommentButton = within(inquiryNotes).getByRole("button", {
      name: "Add Comment",
    });
    const hrNotesField = within(inquiryNotes).getByLabelText("HR Notes");

    expect(
      addCommentButton.compareDocumentPosition(hrNotesField) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      within(inquiryNotes).queryByPlaceholderText(
        "Add a comment to these inquiry notes...",
      ),
    ).not.toBeInTheDocument();
    expect(
      within(inquiryNotes).getByText(
        "Candidate asked about the night shift.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Lead Comments" }),
    ).not.toBeInTheDocument();
  });

  it("adds comments without editing the HR Notes field", () => {
    const { rerender } = render(<ApplicantLeadModal />);

    fireEvent.click(screen.getByRole("button", { name: "Add Comment" }));
    expect(
      screen.getByRole("button", { name: "Hide Comment Form" }),
    ).toHaveAttribute("aria-expanded", "true");

    const commentInput = screen.getByPlaceholderText(
      "Add a comment to these inquiry notes...",
    );
    fireEvent.change(commentInput, {
      target: { value: "Candidate asked about the night shift." },
    });

    expect(setLeadComment).toHaveBeenCalledWith(
      "Candidate asked about the night shift.",
    );

    useApplicantLeadsPageMock.mockReturnValue({
      ...useApplicantLeadsPageMock.mock.results.at(-1).value,
      leadComment: "Candidate asked about the night shift.",
    });
    rerender(<ApplicantLeadModal />);
    fireEvent.click(screen.getByRole("button", { name: "Post Comment" }));
    expect(handleAddLeadComment).toHaveBeenCalledOnce();
    expect(setFormData).not.toHaveBeenCalled();
  });
});
