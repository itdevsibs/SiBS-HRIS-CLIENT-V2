import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import SiBSAIAssistant from "./SiBSAIAssistant";
import { sendHermesAgentChat } from "@/lib/axios/hermes-agent-chat";

vi.mock("@/services/context/UserContext", () => ({
  useUser: () => ({ user: { firstName: "Sam" }, loading: false }),
}));
vi.mock("@/lib/axios/hermes-agent-chat", () => ({ sendHermesAgentChat: vi.fn() }));

afterEach(() => vi.clearAllMocks());

it("keeps Hermes messages across closing and reopening, and shows measured latency", async () => {
  vi.mocked(sendHermesAgentChat).mockResolvedValue({ reply: "Hermes answer" });
  const { rerender } = render(
    <SiBSAIAssistant variant="hermes" isOpen hideTrigger />,
  );

  fireEvent.change(screen.getByPlaceholderText(/authorized HRIS data/i), {
    target: { value: "My question" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));

  await waitFor(() => expect(screen.getByText("Hermes answer")).toBeInTheDocument());
  expect(sendHermesAgentChat).toHaveBeenCalledWith(expect.objectContaining({ message: "My question" }));
  expect(screen.getByText(/Response time: \d+ ms/)).toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText(/authorized HRIS data/i), {
    target: { value: "And last month?" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await waitFor(() => expect(sendHermesAgentChat).toHaveBeenCalledTimes(2));
  expect(sendHermesAgentChat).toHaveBeenLastCalledWith(expect.objectContaining({
    message: "And last month?",
    conversation: [
      { role: "user", content: "My question" },
      { role: "assistant", content: "Hermes answer" },
    ],
  }));

  rerender(<SiBSAIAssistant variant="hermes" isOpen={false} hideTrigger />);
  rerender(<SiBSAIAssistant variant="hermes" isOpen hideTrigger />);
  expect(screen.getAllByText("Hermes answer")).toHaveLength(2);
});

it("shows backend errors and clears Hermes history for a new chat", async () => {
  vi.mocked(sendHermesAgentChat)
    .mockRejectedValueOnce(new Error("Hermes unavailable"))
    .mockResolvedValueOnce({ reply: "Recovered answer" });
  render(<SiBSAIAssistant variant="hermes" isOpen hideTrigger />);

  fireEvent.change(screen.getByPlaceholderText(/authorized HRIS data/i), {
    target: { value: "First question" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await waitFor(() => expect(screen.getByText("Hermes unavailable")).toBeInTheDocument());

  fireEvent.change(screen.getByPlaceholderText(/authorized HRIS data/i), {
    target: { value: "Second question" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await waitFor(() => expect(screen.getByText("Recovered answer")).toBeInTheDocument());
  expect(screen.queryByText("Hermes unavailable")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /start a new ask sibs ai \(hermes\) chat/i }));
  expect(screen.queryByText("Recovered answer")).not.toBeInTheDocument();
});

it("renders Hermes profile sections and fields without raw Markdown markers", async () => {
  vi.mocked(sendHermesAgentChat).mockResolvedValue({ reply: "Your profile:\n\n- **Name:** Ada Lovelace\n- **Email:** ada@example.test\n\n**Employment:**\n- **Tenure:** 1 year, 2 months\n\n**Management:**\n- **Manager:** Grace Hopper" });
  render(<SiBSAIAssistant variant="hermes" isOpen hideTrigger />);

  fireEvent.change(screen.getByPlaceholderText(/authorized HRIS data/i), { target: { value: "My profile" } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));

  await waitFor(() => expect(screen.getByText("Ada Lovelace")).toBeInTheDocument());
  expect(screen.getByRole("heading", { name: "Your profile" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Employment" })).toBeInTheDocument();
  expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
  expect(screen.queryByText(/\*\*Name:\*\*/)).not.toBeInTheDocument();
});
