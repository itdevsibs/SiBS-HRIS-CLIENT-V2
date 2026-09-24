import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ChatAudioPlayer from "./ChatAudioPlayer";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ChatAudioPlayer", () => {
  it("does not assign an empty audio source while the attachment is loading", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const { container } = render(
      <ChatAudioPlayer
        attachment={{
          id: 42,
          url: "/api/chat/attachments/42",
          originalName: "voice-message.mp3",
          mimeType: "audio/mpeg",
        }}
      />,
    );

    expect(container.querySelector("audio")).not.toHaveAttribute("src");
    const renderedEmptySourceWarning = consoleError.mock.calls.some((call) =>
      call.some(
        (argument) =>
          typeof argument === "string" &&
          argument.includes('An empty string ("") was passed to the'),
      ),
    );
    expect(renderedEmptySourceWarning).toBe(false);
  });

  it("shows the attachment request failure instead of hiding it behind a generic player error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );

    render(
      <ChatAudioPlayer
        attachment={{
          id: 42,
          url: "/api/chat/attachments/42",
          originalName: "voice-message.mp3",
          mimeType: "audio/mpeg",
        }}
      />,
    );

    expect(await screen.findByText("Audio storage is temporarily unavailable.")).toBeInTheDocument();
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining("/api/chat/attachments/42?full=1"),
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("explains when the browser cannot decode the audio format", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(["audio"], { type: "audio/mpeg" }),
      }),
    );
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:chat-audio"),
      revokeObjectURL: vi.fn(),
    });

    const { container } = render(
      <ChatAudioPlayer
        attachment={{
          id: 42,
          url: "/api/chat/attachments/42",
          originalName: "voice-message.mp3",
          mimeType: "audio/mpeg",
        }}
      />,
    );

    await waitFor(() => expect(container.querySelector("audio")).toHaveAttribute("src", "blob:chat-audio"));
    const audio = container.querySelector("audio");
    Object.defineProperty(audio, "error", { configurable: true, value: { code: 4 } });
    fireEvent.error(audio);

    expect(screen.getByText("This audio format can’t be played in this browser.")).toBeInTheDocument();
  });

  it("uses the saved audio MIME when the attachment response has a generic MIME", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(["mp3-bytes"], { type: "application/octet-stream" }),
      }),
    );
    const createObjectURL = vi.fn(() => "blob:chat-audio");
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL: vi.fn() });

    render(
      <ChatAudioPlayer
        attachment={{
          id: 42,
          url: "/api/chat/attachments/42",
          originalName: "renee-bituin-ng-mindanao.mp3",
          mimeType: "audio/mpeg",
        }}
      />,
    );

    await waitFor(() => expect(createObjectURL).toHaveBeenCalled());
    expect(createObjectURL.mock.calls[0][0].type).toBe("audio/mpeg");
  });
});
