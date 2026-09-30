import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import StatusBadge from "./StatusBadge";

describe("StatusBadge TA states", () => {
  it.each([
    ["On Track", "sibs-badge-success"],
    ["At Risk", "sibs-badge-warning"],
    ["Delayed", "sibs-badge-danger"],
    ["High Risk", "sibs-badge-danger"],
    ["Medium Risk", "sibs-badge-warning"],
    ["Low Risk", "sibs-badge-info"],
    ["None Risk", "sibs-badge-neutral"],
  ])("maps %s to its shared semantic badge", (status, tone) => {
    render(<StatusBadge status={status} />);

    const expectedLabel = [
      "High Risk",
      "Medium Risk",
      "Low Risk",
      "None Risk",
    ].includes(status)
      ? status.replace(" Risk", "")
      : status;
    expect(screen.getByText(expectedLabel)).toHaveClass(tone);
  });

  it("supports a prefix for risk labels", () => {
    render(<StatusBadge status="Low Risk" prefix="Risk: " showDot={false} />);

    expect(screen.getByText("Risk: Low")).toHaveClass("sibs-badge-info");
  });
});
