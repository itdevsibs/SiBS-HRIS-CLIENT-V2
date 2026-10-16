import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricGrid } from "./MetricCard";
import { MetricGridSkeleton, getMetricGridColClass } from "./MetricCardSkeleton";

describe("MetricGrid & MetricGridSkeleton Unified Architecture", () => {
  describe("getMetricGridColClass column mapping", () => {
    it("maps columns=6 to compact 2-column mobile standard", () => {
      expect(getMetricGridColClass(6)).toBe(
        "grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6",
      );
    });

    it("maps columns=4 to 2-column mobile standard", () => {
      expect(getMetricGridColClass(4)).toBe(
        "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4",
      );
    });

    it("maps columns=9 to high-density workforce layout", () => {
      expect(getMetricGridColClass(9)).toBe(
        "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-9",
      );
    });

    it("maps columns=2 to 2-column mobile standard", () => {
      expect(getMetricGridColClass(2)).toBe("grid-cols-2 sm:grid-cols-2");
    });

    it("honors custom string column class overrides", () => {
      expect(getMetricGridColClass("grid-cols-custom")).toBe("grid-cols-custom");
    });
  });

  describe("MetricGrid & MetricGridSkeleton class synchronization", () => {
    it("renders MetricGridSkeleton with columns={6} using exact shared classes", () => {
      render(
        <MetricGridSkeleton
          columns={6}
          count={6}
          labels={["A", "B", "C", "D", "E", "F"]}
          testId="test-skeleton-6"
        />,
      );

      const section = screen.getByTestId("test-skeleton-6");
      expect(section.className).toContain("grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6");
      expect(section.className).toContain("gap-2.5 2xl:gap-3");
    });

    it("renders MetricGridSkeleton with columns={4} using exact shared classes", () => {
      render(
        <MetricGridSkeleton
          columns={4}
          count={4}
          labels={["A", "B", "C", "D"]}
          testId="test-skeleton-4"
        />,
      );

      const section = screen.getByTestId("test-skeleton-4");
      expect(section.className).toContain("grid-cols-2 sm:grid-cols-2 lg:grid-cols-4");
      expect(section.className).toContain("gap-2.5 2xl:gap-3");
    });

    it("ensures MetricGrid and MetricGridSkeleton have identical container classes", () => {
      const { container: liveContainer } = render(
        <MetricGrid columns={6}>
          <div>Item 1</div>
        </MetricGrid>,
      );

      const { container: skeletonContainer } = render(
        <MetricGridSkeleton columns={6} count={6} testId="test-sync" />,
      );

      const liveSection = liveContainer.querySelector("section");
      const skeletonSection = skeletonContainer.querySelector("section");

      // Both should have the same grid breakpoint classes
      expect(liveSection?.className).toContain(getMetricGridColClass(6));
      expect(skeletonSection?.className).toContain(getMetricGridColClass(6));
    });
  });
});
