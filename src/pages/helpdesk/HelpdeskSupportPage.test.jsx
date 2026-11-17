import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HelpdeskSupportPage from "./HelpdeskSupportPage";
import { getHelpdeskTicketDetails, getHelpdeskTicketSummaries, updateHelpdeskTicketStatus } from "@/lib/axios/sibsChat";

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

  it("keeps a failed rejection visible in its confirmation and preserves the reason", async () => {
    updateHelpdeskTicketStatus.mockRejectedValue({ response: { data: { message: "Try again later." } } });
    await openCase();
    const dialog = await screen.findByRole("dialog");
    await openConfirmation(dialog, "Rejected", "Reject Request");
    const confirm = screen.getByRole("alertdialog", { name: "Reject this request?" });
    const reason = within(confirm).getByRole("textbox", { name: /Reason for rejection/ });
    expect(reason).toHaveFocus();
    fireEvent.change(reason, { target: { value: "Outside scope" } });
    fireEvent.click(within(confirm).getByRole("button", { name: "Reject Request" }));
    expect(await within(confirm).findByRole("alert")).toHaveTextContent("Try again later.");
    expect(reason).toHaveValue("Outside scope");
    await waitFor(() => expect(within(confirm).getByRole("button", { name: "Reject Request" })).toBeEnabled());
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
});
