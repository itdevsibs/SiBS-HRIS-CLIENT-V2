import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import SearchInput from "./SearchInput";

describe("SearchInput", () => {
  it("TC-01: renders input with placeholder and label", () => {
    render(
      <SearchInput
        label="Search Employees"
        placeholder="Type name or SIBS ID..."
        value=""
        onChange={() => {}}
      />,
    );

    expect(screen.getByText("Search Employees")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Type name or SIBS ID...")).toBeInTheDocument();
  });

  it("TC-02: calls onChange when user types", () => {
    const handleChange = vi.fn();

    render(
      <SearchInput
        placeholder="Search..."
        value=""
        onChange={handleChange}
      />,
    );

    const input = screen.getByPlaceholderText("Search...");
    fireEvent.change(input, { target: { value: "John" } });

    expect(handleChange).toHaveBeenCalledWith("John", expect.anything());
  });

  it("TC-03: renders clear button when value is present and clears on click", () => {
    const handleClear = vi.fn();

    render(
      <SearchInput
        placeholder="Search..."
        value="Developer"
        onClear={handleClear}
      />,
    );

    const clearButton = screen.getByRole("button", { name: /clear search input/i });
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it("TC-04: does not render clear button when value is empty", () => {
    render(
      <SearchInput
        placeholder="Search..."
        value=""
      />,
    );

    expect(screen.queryByRole("button", { name: /clear search input/i })).not.toBeInTheDocument();
  });

  it("TC-05: respects disabled state", () => {
    render(
      <SearchInput
        placeholder="Search..."
        value="test"
        disabled={true}
      />,
    );

    expect(screen.getByPlaceholderText("Search...")).toBeDisabled();
    expect(screen.queryByRole("button", { name: /clear search input/i })).not.toBeInTheDocument();
  });
});
