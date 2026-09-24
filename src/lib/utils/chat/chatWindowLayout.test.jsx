import { describe, expect, it } from "vitest";
import { getChatLayoutFlip, getExpandedChatBounds } from "./chatWindowLayout";

describe("getExpandedChatBounds", () => {
  it("aligns expanded chat with the measured page header card", () => {
    expect(
      getExpandedChatBounds({
        workspace: { left: 240, width: 1800 },
        top: 45,
        viewportHeight: 1000,
      }),
    ).toEqual({
      left: 290,
      top: 45,
      width: 1700,
      height: 939,
    });
  });

  it("uses the available width and keeps a 16px gutter on smaller workspaces", () => {
    expect(
      getExpandedChatBounds({
        workspace: { left: 80, width: 900 },
        top: 73,
        viewportHeight: 800,
      }),
    ).toEqual({
      left: 96,
      top: 73,
      width: 868,
      height: 711,
    });
  });

  it("matches the measured page content width when it is already inset", () => {
    expect(
      getExpandedChatBounds({
        workspace: { left: 156, width: 1640 },
        top: 86,
        viewportHeight: 1000,
        gutter: 0,
      }),
    ).toEqual({ left: 156, top: 86, width: 1640, height: 898 });
  });
});

describe("getChatLayoutFlip", () => {
  it("maps the new layout back to the previous panel bounds for a transform animation", () => {
    expect(
      getChatLayoutFlip(
        { left: 100, top: 100, width: 500, height: 400 },
        { left: 0, top: 50, width: 1000, height: 800 },
      ),
    ).toEqual({ translateX: 100, translateY: 50, scaleX: 0.5, scaleY: 0.5 });
  });
});
