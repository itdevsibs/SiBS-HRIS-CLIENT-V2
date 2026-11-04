import React from "react";
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import CollectibleAvatarFrame from "./CollectibleAvatarFrame.jsx";
import { DEVELOPER_BORDERS, MR_SIBS_BORDER } from "../../../config/developerBorders.js";

const profiles = [...Object.values(DEVELOPER_BORDERS), MR_SIBS_BORDER];

describe("ornate collectible avatars with square previews", () => {
  it("layers each employee photo beneath the supplied ornate artwork", () => {
    for (const collectible of profiles) {
      for (const variant of ["header", "profile"]) {
        const { container, unmount } = render(
          <CollectibleAvatarFrame collectible={collectible} photoUrl="/test/employee.jpg" variant={variant} />,
        );
        const photo = container.querySelector('img[alt="Employee profile"]');
        expect(photo.getAttribute("src")).toBe("/test/employee.jpg");
        expect(parseFloat(photo.parentElement.style.width)).toBeGreaterThanOrEqual(62);
        const art = container.querySelector('img[data-collectible-artwork]');
        expect(art).not.toBeNull();
        expect(art.getAttribute("src")).toBe(collectible.asset);
        expect(collectible.asset).toContain("/original_art/");
        expect(container.textContent).not.toContain(collectible.title);
        expect(container.querySelectorAll('img[src*="avatar-accessories"]')).toHaveLength(0);
        expect(container.querySelectorAll("svg")).toHaveLength(0);
        expect(container.querySelector('[data-collectible-avatar]').getAttribute("aria-label")).toContain(collectible.title);
        unmount();
      }
    }
  });

  it("keeps the square hover photo with a readable full title", () => {
    const { container, getByText } = render(
      <CollectibleAvatarFrame collectible={DEVELOPER_BORDERS["6099"]} photoUrl="/test/employee.jpg" variant="preview" />,
    );
    const photo = container.querySelector('img[alt="Employee profile"]');
    expect(photo.parentElement.style.width).toBe("");
    expect(photo.closest(".sibs-collectible-photo").className).toContain("rounded-xl");
    expect(getByText("THE QUEEN MANAGER")).not.toBeNull();
    expect(container.querySelector('img[data-collectible-artwork]')).toBeNull();
  });

  it("preserves initials and reports a failed portrait", () => {
    const onPhotoError = vi.fn();
    const { container, rerender, getByText } = render(
      <CollectibleAvatarFrame collectible={MR_SIBS_BORDER} photoUrl="/missing.jpg" fallback="RD" onPhotoError={onPhotoError} />,
    );
    fireEvent.error(container.querySelector('img[alt="Employee profile"]'));
    expect(onPhotoError).toHaveBeenCalledOnce();
    rerender(<CollectibleAvatarFrame collectible={MR_SIBS_BORDER} fallback="RD" />);
    expect(getByText("RD")).not.toBeNull();
  });

  it("renders nothing without a collectible", () => {
    const { container } = render(<CollectibleAvatarFrame collectible={null} />);
    expect(container.childElementCount).toBe(0);
  });
});
