import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HelpdeskSupportPage from "./HelpdeskSupportPage";
import { getChatMessages, getHelpdeskTicketDetails, getHelpdeskTicketEligibility, getHelpdeskTicketSummaries, updateHelpdeskTicketStatus } from "@/lib/axios/sibsChat";

const { conversation, ticket } = vi.hoisted(() => {
  const conversation = {
    id: 42,
    isHelpdesk: true,
    helpdeskCategory: "IT",
    isHelpdeskSupportMember: true,
    caseCode: "IT-4",
    createdBySibsId: "1000",
    requester: { displayName: "Test Employee", assignedLocationLabel: "Davao" },
  };
  return { conversation, ticket: { conversationId: 42, status: "IN_PROGRESS", caseCode: "IT-4", acceptedBySibsId: "2000" } };
});

vi.mock("@/components/layout/Header", () => ({ default: () => null }));
vi.mock("@/services/context/ChatContext", () => ({
  useChat: () => ({ currentSibsId: "2000", conversations: [conversation] }),
}));
vi.mock("@/services/context/UserContext", () => ({
  useUser: () => ({ user: { username: "2000" } }),
}));
vi.mock("@/lib/axios/chatSocket", () => ({ default: { on: vi.fn(), off: vi.fn() } }));
vi.mock("@/lib/axios/sibsChat", () => ({
  getChatAttachmentUrl: vi.fn(),
  getChatHelpdeskSupportScope: vi.fn(async () => ({ categories: ["IT"], locationsByCategory: { IT: ["Davao"] } })),
  getHelpdeskTicketSummaries: vi.fn(async () => [ticket]),
  getHelpdeskTicketDetails: vi.fn(),
  getHelpdeskTicketEligibility: vi.fn(),
  acceptHelpdeskTicket: vi.fn(),
  updateHelpdeskTicketStatus: vi.fn(),
  getChatMessages: vi.fn(async () => []),
  markChatRead: vi.fn(),
  sendChatMessage: vi.fn(),
}));

async function openCase() {
  render(<HelpdeskSupportPage />);
  const row = await screen.findByRole("button", { name: "View Test Employee's Helpdesk ticket" });
  row.focus();
  await act(async () => { fireEvent.keyDown(row, { key: "Enter" }); });
  return row;
}

async function openConfirmation(dialog, option, action) {
  const status = await within(dialog).findByRole("combobox", { name: /^Update status:/ });
  status.focus();
  fireEvent.click(status);
  fireEvent.click(await screen.findByRole("option", { name: option }));
  const trigger = within(dialog).getByRole("button", { name: action });
  trigger.focus();
  fireEvent.click(trigger);
  return trigger;
}

describe("Helpdesk case dialogs", () => {
  beforeEach(() => {
    getChatMessages.mockClear();
    getChatMessages.mockResolvedValue([]);
    getHelpdeskTicketEligibility.mockClear();
    getHelpdeskTicketDetails.mockResolvedValue(ticket);
    updateHelpdeskTicketStatus.mockReset();
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    Object.defineProperty(HTMLElement.prototype, "scrollTo", { configurable: true, value: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete HTMLElement.prototype.scrollTo;
  });

  it("names the case, contains keyboard focus, and restores the opener", async () => {
    const row = await openCase();
    const dialog = await screen.findByRole("dialog", { name: "Case Opened #4 (Davao Site)" });
    const close = within(dialog).getByRole("button", { name: "Close Details", exact: true });
    expect(dialog).toContainElement(document.activeElement);
    close.focus();
    fireEvent.keyDown(close, { key: "Tab" });
    expect(dialog).toContainElement(document.activeElement);
    expect(close).not.toHaveFocus();
    fireEvent.keyDown(document.activeElement, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(row).toHaveFocus();
  });

  it("closes the status dropdown on Escape before dismissing the case", async () => {
    await openCase();
    const dialog = await screen.findByRole("dialog");
    const status = await within(dialog).findByRole("combobox", { name: /^Update status:/ });
    status.focus();
    fireEvent.click(status);
    expect(status).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(status, { key: "Escape" });
    expect(status).toHaveAttribute("aria-expanded", "false");
    expect(dialog).toBeInTheDocument();
  });

  it("contains focus in the close confirmation and returns it to the action on Escape", async () => {
    await openCase();
    const dialog = await screen.findByRole("dialog");
    const trigger = await openConfirmation(dialog, "Closed", "Close Case");
    const confirm = screen.getByRole("alertdialog", { name: "Close this case?" });
    expect(within(confirm).getByRole("button", { name: "Cancel" })).toHaveFocus();
    const submit = within(confirm).getByRole("button", { name: "Close Case" });
    submit.focus();
    fireEvent.keyDown(submit, { key: "Tab" });
    expect(confirm).toContainElement(document.activeElement);
    expect(submit).not.toHaveFocus();
    fireEvent.keyDown(document.activeElement, { key: "Escape" });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(dialog).toBeInTheDocument();
  });

  it("keeps a failed spam report visible in its confirmation and preserves the reason", async () => {
    updateHelpdeskTicketStatus.mockRejectedValue({ response: { data: { message: "Try again later." } } });
    await openCase();
    const dialog = await screen.findByRole("dialog");
    await openConfirmation(dialog, "Spam", "Flag as Spam");
    const confirm = screen.getByRole("alertdialog", { name: "Flag this request as Spam?" });
    const reason = within(confirm).getByRole("textbox", { name: /Reason for flagging as Spam/ });
    expect(reason).toHaveFocus();
    fireEvent.change(reason, { target: { value: "Outside scope" } });
    fireEvent.click(within(confirm).getByRole("button", { name: "Flag as Spam" }));
    expect(await within(confirm).findByRole("alert")).toHaveTextContent("Try again later.");
    expect(reason).toHaveValue("Outside scope");
    await waitFor(() => expect(within(confirm).getByRole("button", { name: "Flag as Spam" })).toBeEnabled());
  });

  it("renders open cases conversation-focused while keeping the four case duration reports", async () => {
    await openCase();
    const dialog = await screen.findByRole("dialog", { name: "Case Opened #4 (Davao Site)" });
    const chatHeading = await within(dialog).findByRole("heading", { name: "Case conversation" });
    expect(within(dialog).getByRole("region", { name: "Conversation messages" })).toBeVisible();
    expect(within(dialog).getByRole("textbox", { name: "Support reply" })).toBeVisible();
    expect(within(dialog).queryByRole("heading", { name: "Support Assignment & Chat" })).not.toBeInTheDocument();
    expect(within(dialog).getByText("Queued time")).toBeVisible();
    expect(within(dialog).getByText("Response time")).toBeVisible();
    expect(within(dialog).getByText("Total resolution")).toBeVisible();
    expect(within(dialog).getByText("Handling time")).toBeVisible();
    fireEvent.click(within(dialog).getByRole("button", { name: "Go to chat" }));
    expect(chatHeading).toHaveFocus();
  });

  it("prefetches ticket details, messages, and open-case eligibility in parallel", async () => {
    const openTicket = { ...ticket, status: "OPEN", acceptedBySibsId: null };
    getHelpdeskTicketSummaries.mockResolvedValueOnce([openTicket]);
    const callStarts = {};
    const callEnds = {};
    const delay = (ms, value, label) => new Promise((resolve) => setTimeout(() => {
      callEnds[label] = performance.now();
      resolve(value);
    }, ms));

    getHelpdeskTicketDetails.mockImplementationOnce(() => {
      callStarts.details = performance.now();
      return delay(80, openTicket, "details");
    });
    getChatMessages.mockImplementationOnce(() => {
      callStarts.messages = performance.now();
      return delay(80, [{ id: 901, senderSibsId: "1000", messageText: "Need laptop help", createdAt: "2026-11-17T08:00:00+08:00" }], "messages");
    });
    getHelpdeskTicketEligibility.mockImplementationOnce(() => {
      callStarts.eligibility = performance.now();
      return delay(80, { eligible: true, reason: "" }, "eligibility");
    });

    await openCase();
    const dialog = await screen.findByRole("dialog", { name: "Case Opened #4 (Davao Site)" });
    await within(dialog).findByText("Need laptop help");
    const acceptBtn = await within(dialog).findByRole("button", { name: "Accept Request" });
    await waitFor(() => expect(acceptBtn).toBeEnabled());

    // All 3 requests started immediately in parallel before getHelpdeskTicketDetails resolved.
    expect(callStarts.messages).toBeLessThan(callEnds.details);
    expect(callStarts.eligibility).toBeLessThan(callEnds.details);
    expect(Math.abs(callStarts.messages - callStarts.details)).toBeLessThan(40);
    expect(Math.abs(callStarts.eligibility - callStarts.details)).toBeLessThan(40);
    expect(getChatMessages).toHaveBeenCalledTimes(1);
  });

  it("skips eligibility fetch for non-OPEN cases and refreshes messages on open-to-closed transition", async () => {
    getChatMessages
      .mockResolvedValueOnce([{ id: 101, senderSibsId: "1000", messageText: "Initial issue", createdAt: "2026-11-17T08:00:00+08:00" }])
      .mockResolvedValueOnce([
        { id: 101, senderSibsId: "1000", messageText: "Initial issue", createdAt: "2026-11-17T08:00:00+08:00" },
        { id: 102, senderSibsId: "2000", messageText: "Resolved reply", createdAt: "2026-11-17T08:05:00+08:00" },
      ]);
    await openCase();
    const dialog = await screen.findByRole("dialog", { name: "Case Opened #4 (Davao Site)" });
    await within(dialog).findByText("Initial issue");
    expect(getHelpdeskTicketEligibility).not.toHaveBeenCalled();

    const resolved = { ...ticket, status: "RESOLVED" };
    updateHelpdeskTicketStatus.mockResolvedValueOnce(resolved);
    getHelpdeskTicketSummaries.mockResolvedValueOnce([resolved]);
    await openConfirmation(dialog, "Closed", "Close Case");
    fireEvent.click(within(screen.getByRole("alertdialog", { name: "Close this case?" })).getByRole("button", { name: "Close Case" }));

    const archived = await screen.findByRole("dialog", { name: "Case Closed #4 (Davao Site)" });
    await within(archived).findByText("Resolved reply");
    expect(within(archived).getByText("Initial issue")).toBeVisible();
  });

  it("keeps the confirmation open while saving and returns focus to the queue after archival", async () => {
    let complete;
    updateHelpdeskTicketStatus.mockReturnValue(new Promise((resolve) => { complete = resolve; }));
    const row = await openCase();
    await openConfirmation(await screen.findByRole("dialog"), "Closed", "Close Case");
    const confirm = screen.getByRole("alertdialog", { name: "Close this case?" });
    const submit = within(confirm).getByRole("button", { name: "Close Case" });
    submit.focus();
    fireEvent.click(submit);
    expect(within(confirm).getByRole("button", { name: "Closing…" })).toBeDisabled();
    fireEvent.keyDown(document.activeElement, { key: "Escape" });
    expect(confirm).toBeInTheDocument();

    const resolved = { ...ticket, status: "RESOLVED" };
    getHelpdeskTicketSummaries.mockResolvedValueOnce([resolved]);
    await act(async () => complete(resolved));
    const archived = screen.getByRole("dialog", { name: "Case Closed #4 (Davao Site)" });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(within(archived).getByRole("heading", { name: "Case Closed #4 (Davao Site)" }))
      .toContainElement(document.activeElement);
    expect(within(archived).getByRole("heading", { name: "Lifecycle Milestones" })).toBeVisible();
    expect(within(archived).getByRole("heading", { name: "Activity Audit Log" })).toBeVisible();
    const chat = within(archived).getByRole("heading", { name: "Support Assignment & Chat" });
    fireEvent.click(within(archived).getByRole("button", { name: "Go to chat" }));
    expect(chat).toHaveFocus();
    expect(within(archived).getByRole("region", { name: "Conversation messages" })).toBeVisible();
    expect(within(archived).getByText("Archived conversation. Replies are disabled.")).toBeVisible();
    expect(within(archived).queryByRole("textbox", { name: "Support reply" })).not.toBeInTheDocument();
    expect(row).not.toBeInTheDocument();
    fireEvent.keyDown(document.activeElement, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Search" })).toHaveFocus();
  });

  it("disables OPEN case actions when ineligible without showing department restriction banner", async () => {
    const openTicket = { conversationId: 42, status: "OPEN", caseCode: "IT-4", acceptedBySibsId: null };
    getHelpdeskTicketSummaries.mockResolvedValueOnce([openTicket]);
    getHelpdeskTicketDetails.mockResolvedValueOnce(openTicket);
    getHelpdeskTicketEligibility.mockResolvedValueOnce({
      eligible: false,
      reason: "Only staff from this Helpdesk department can accept requests.",
    });

    await openCase();
    const dialog = await screen.findByRole("dialog", { name: "Case Opened #4 (Davao Site)" });
    await waitFor(() => {
      expect(within(dialog).getByRole("button", { name: "Accept Request" })).toBeDisabled();
    });
    expect(within(dialog).getByRole("button", { name: "Flag as Spam" })).toBeDisabled();
    expect(within(dialog).queryByText("Only staff from this Helpdesk department can accept requests.")).not.toBeInTheDocument();
  });
});
