import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

describe("HeaderCalendarModal & BirthdayCelebrationOverlay Token Harmonization (TDD)", () => {
  const calendarModalPath = path.resolve(
    __dirname,
    "./HeaderCalendarModal.jsx",
  );
  const birthdayOverlayPath = path.resolve(
    __dirname,
    "../birthday/BirthdayCelebrationOverlay.jsx",
  );

  it("TC-01: HeaderCalendarModal.jsx contains zero raw Tailwind arbitrary hex classes", () => {
    const content = fs.readFileSync(calendarModalPath, "utf-8");

    // Must not contain any arbitrary Tailwind hex classes like bg-[#...], text-[#...], border-[#...], etc.
    const arbitraryHexClassRegex =
      /(?:bg|text|border|ring|accent|from|to|via|placeholder:text|hover:bg|hover:text|hover:border|focus:border)-\[#[0-9a-fA-F]{3,8}\]/g;
    const matches = content.match(arbitraryHexClassRegex);

    expect(
      matches,
      "HeaderCalendarModal.jsx must not contain any Tailwind arbitrary hex classes",
    ).toBeNull();
  });

  it("TC-02: HeaderCalendarModal.jsx consumes canonical Tailwind design tokens", () => {
    const content = fs.readFileSync(calendarModalPath, "utf-8");

    // Navy tokens
    expect(content).toContain("text-sibs-navy");
    expect(content).toContain("bg-sibs-navy");
    expect(content).toContain("accent-sibs-navy");

    // Orange & Action tokens
    expect(content).toContain("text-sibs-orange");
    expect(content).toContain("bg-sibs-orange");
    expect(content).toContain("ring-sibs-orange");
    expect(content).toContain("focus:border-sibs-orange");
    expect(content).toContain("hover:bg-sibs-button-hover");

    // Surface, Border, & Typography tokens
    expect(content).toContain("border-sibs-border");
    expect(content).toContain("border-sibs-border-subtle");
    expect(content).toContain("bg-sibs-canvas");
    expect(content).toContain("text-sibs-primary-1");
    expect(content).toContain("text-sibs-text-secondary");
    expect(content).toContain("text-sibs-muted");
    expect(content).toContain("placeholder:text-sibs-muted");
  });

  it("TC-03: HeaderCalendarModal.jsx preserves vendor logo colors and contains no other raw hex strings", () => {
    const content = fs.readFileSync(calendarModalPath, "utf-8");
    const allHexMatches = content.match(/#[0-9a-fA-F]{3,8}(?!;)/g) || [];

    // The only allowed hex colors in this file are the 4 official Google branding SVG fills inside GoogleLogoIcon
    const allowedBrandHexes = ["#FFC107", "#FF3D00", "#4CAF50", "#1976D2"];
    const nonBrandHexes = allHexMatches.filter(
      (hex) => !allowedBrandHexes.includes(hex.toUpperCase()),
    );

    expect(
      nonBrandHexes,
      `HeaderCalendarModal.jsx must only contain vendor brand logo SVGs. Unexpected hex: ${nonBrandHexes.join(", ")}`,
    ).toEqual([]);

    expect(allHexMatches.length).toBe(4);
  });

  it("TC-04: BirthdayCelebrationOverlay.jsx contains zero raw hex colors", () => {
    const content = fs.readFileSync(birthdayOverlayPath, "utf-8");
    const hexRegex = /#[0-9a-fA-F]{3,8}(?!;)/g;
    const matches = content.match(hexRegex);

    expect(
      matches,
      "BirthdayCelebrationOverlay.jsx must contain 0 raw hex colors",
    ).toBeNull();
  });

  it("TC-05: BirthdayCelebrationOverlay.jsx consumes canonical design tokens and gradients", () => {
    const content = fs.readFileSync(birthdayOverlayPath, "utf-8");

    // Canonical tokens
    expect(content).toContain("bg-sibs-navy/90");
    expect(content).toContain("bg-sibs-orange");
    expect(content).toContain("from-sibs-orange via-orange-400 to-sibs-orange");

    // Must not contain legacy hex classes
    expect(content).not.toContain("bg-[#042C51]/90");
    expect(content).not.toContain("from-[#FF5C28]");
    expect(content).not.toContain("via-[#FF7A45]");
    expect(content).not.toContain("to-[#FF5C28]");
    expect(content).not.toContain("bg-[#FF5C28]");
    expect(content).not.toContain("bg-[#FFB020]");
    expect(content).not.toContain("bg-[#38BDF8]");
    expect(content).not.toContain("bg-[#34D399]");
  });
});
