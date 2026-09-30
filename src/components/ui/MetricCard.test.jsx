import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Users } from "lucide-react";

import MetricCard, { MetricGrid } from "./MetricCard";

describe("MetricCard", () => {
  it("TC-01: renders kicker, value, description, and icon correctly", () => {
    render(
      <MetricCard
        label="Total Headcount"
        value="520"
        description="Active workforce"
        icon={Users}
        tone="orange"
      />,
    );

    expect(screen.getByText("Total Headcount")).toBeInTheDocument();
    expect(screen.getByText("520")).toBeInTheDocument();
    expect(screen.getByText("Active workforce")).toBeInTheDocument();
  });

  it("TC-02: renders trend indicator with direction styling", () => {
    const { rerender } = render(
      <MetricCard
        title="Revenue"
        value="$10,000"
        trend="+15%"
        trendDirection="up"
      />,
    );

    expect(screen.getByText("+15%")).toHaveClass("text-emerald-600");

    rerender(
      <MetricCard
        title="Revenue"
        value="$8,000"
        trend="-5%"
        trendDirection="down"
      />,
    );

    expect(screen.getByText("-5%")).toHaveClass("text-rose-600");
  });

  it("TC-03: renders skeleton when loading is true", () => {
    render(
      <MetricCard
        label="Pending Leaves"
        value="12"
        loading={true}
      />,
    );

    expect(screen.getByTestId("metric-card-skeleton")).toBeInTheDocument();
    expect(screen.queryByText("12")).not.toBeInTheDocument();
  });

  it("TC-04: triggers onClick when clicked if interactive", () => {
    const handleClick = vi.fn();

    render(
      <MetricCard
        label="Assigned Users"
        value="34"
        onClick={handleClick}
      />,
    );

    const card = screen.getByRole("button");
    fireEvent.click(card);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("TC-05: MetricGrid renders child cards in a responsive grid", () => {
    const { container } = render(
      <MetricGrid columns={4}>
        <MetricCard label="Card 1" value="1" />
        <MetricCard label="Card 2" value="2" />
      </MetricGrid>,
    );

    expect(container.firstChild).toHaveClass("grid");
    expect(screen.getByText("Card 1")).toBeInTheDocument();
    expect(screen.getByText("Card 2")).toBeInTheDocument();
  });
});
