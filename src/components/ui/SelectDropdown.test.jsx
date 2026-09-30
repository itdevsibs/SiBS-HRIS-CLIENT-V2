import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import SelectDropdown from "./SelectDropdown";

describe("SelectDropdown", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("TC-01: renders trigger and opens portal menu with sibs-dropdown-pop-in when clicked", () => {
    render(
      <SelectDropdown
        label="Gender"
        options={["Male", "Female", "Non-binary", "Prefer not to say"]}
        value=""
        placeholder="Choose option"
      />,
    );

    const trigger = screen.getByRole("button", { name: /gender/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    const menu = document.body.querySelector(".sibs-dropdown-pop-in");
    expect(menu).toBeInTheDocument();
  });

  it("TC-02: calls onChange and closes menu when an option is selected", () => {
    const handleChange = vi.fn();
    render(
      <SelectDropdown
        label="Gender"
        options={["Male", "Female"]}
        value=""
        onChange={handleChange}
        placeholder="Choose option"
      />,
    );

    const trigger = screen.getByRole("button", { name: /gender/i });
    fireEvent.click(trigger);

    const maleOption = screen.getByRole("option", { name: /^male$/i });
    fireEvent.click(maleOption);

    expect(handleChange).toHaveBeenCalledWith("Male", expect.anything());
    expect(document.body.querySelector(".sibs-dropdown-pop-in")).not.toBeInTheDocument();
  });

  it("TC-03: closes when clicking outside the dropdown", () => {
    render(
      <div>
        <div data-testid="outside-area">Outside</div>
        <SelectDropdown
          label="Civil Status"
          options={["Single", "Married"]}
          value="Single"
        />
      </div>,
    );

    const trigger = screen.getByRole("button", { name: /civil status/i });
    fireEvent.click(trigger);
    expect(document.body.querySelector(".sibs-dropdown-pop-in")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId("outside-area"));
    expect(document.body.querySelector(".sibs-dropdown-pop-in")).not.toBeInTheDocument();
  });

  it("TC-04: closes when pressing Escape key", () => {
    render(
      <SelectDropdown
        label="Blood Type"
        options={["A+", "B+"]}
        value="A+"
      />,
    );

    const trigger = screen.getByRole("button", { name: /blood type/i });
    fireEvent.click(trigger);
    expect(document.body.querySelector(".sibs-dropdown-pop-in")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.body.querySelector(".sibs-dropdown-pop-in")).not.toBeInTheDocument();
  });

  it("TC-05: does not open when disabled", () => {
    render(
      <SelectDropdown
        label="Gender"
        disabled
        options={["Male", "Female"]}
        value="Male"
      />,
    );

    const trigger = screen.getByRole("button", { name: /gender/i });
    expect(trigger).toBeDisabled();

    fireEvent.click(trigger);
    expect(document.body.querySelector(".sibs-dropdown-pop-in")).not.toBeInTheDocument();
  });

  it("TC-06: clears selection when placeholder / reset option is clicked", () => {
    const handleChange = vi.fn();
    render(
      <SelectDropdown
        label="Work Setup"
        options={["Hybrid", "WFH", "On-site"]}
        value="Hybrid"
        onChange={handleChange}
        placeholder="Choose option"
      />,
    );

    const trigger = screen.getByRole("button", { name: /work setup/i });
    fireEvent.click(trigger);

    const resetOption = screen.getByRole("option", { name: /choose option/i });
    fireEvent.click(resetOption);

    expect(handleChange).toHaveBeenCalledWith("", null);
  });

  it("TC-07: applies custom labelClassName when provided", () => {
    render(
      <SelectDropdown
        label="Custom Styled Label"
        labelClassName="custom-label-style"
        options={["A", "B"]}
        value="A"
      />,
    );

    const label = screen.getByText("Custom Styled Label");
    expect(label).toHaveClass("custom-label-style");
  });
});
