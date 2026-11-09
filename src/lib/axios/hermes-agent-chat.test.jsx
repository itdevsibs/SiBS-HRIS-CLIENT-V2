import { expect, it, vi } from "vitest";
import { sendHermesAgentChat } from "./hermes-agent-chat";

it("posts the planned development contract and returns a successful reply", async () => {
  const post = vi.fn().mockResolvedValue({
    data: { success: true, reply: "Hermes answer", model: "hermes-agent" },
  });

  await expect(sendHermesAgentChat({ apiClient: { post }, message: "  Hello  " }))
    .resolves.toEqual({ reply: "Hermes answer", model: "hermes-agent" });
  expect(post).toHaveBeenCalledWith(
    "/api/dev-ai/chat",
    { message: "Hello", conversation: [] },
    expect.objectContaining({ timeout: 180000 }),
  );
});

it("rejects an unsuccessful response even when it contains a reply", async () => {
  const post = vi.fn().mockResolvedValue({
    data: { success: false, reply: "Do not show this", message: "Hermes unavailable" },
  });

  await expect(sendHermesAgentChat({ apiClient: { post }, message: "Hello" }))
    .rejects.toThrow("Hermes unavailable");
});

it("sends prior Hermes turns for follow-up questions", async () => {
  const post = vi.fn().mockResolvedValue({ data: { success: true, reply: "3 days", model: "hermes-agent" } });
  const conversation = [{ role: "user", content: "My leave balance" }, { role: "assistant", content: "You have 3 days." }];
  await sendHermesAgentChat({ apiClient: { post }, message: "And last month?", conversation });
  expect(post).toHaveBeenCalledWith("/api/dev-ai/chat", { message: "And last month?", conversation }, expect.any(Object));
});
