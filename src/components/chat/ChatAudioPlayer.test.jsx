import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
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
});
