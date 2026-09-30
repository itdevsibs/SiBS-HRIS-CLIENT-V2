import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import TablePagination from "./TablePagination";

describe("TablePagination", () => {
  it("TC-01: renders formatted range count when limit and loadedCount are provided", () => {
    render(
      <TablePagination
        currentPage={1}
        totalPages={3}
        totalRecords={34}
        limit={15}
        loadedCount={15}
        recordLabel="assigned users"
      />,
    );

    expect(screen.getByText(/showing/i)).toBeInTheDocument();
    expect(screen.getByText("1–15")).toBeInTheDocument();
    expect(screen.getByText("34")).toBeInTheDocument();
    expect(screen.getByText(/assigned users/i)).toBeInTheDocument();
  });

  it("TC-02: renders correct range on subsequent pages", () => {
    const { rerender } = render(
      <TablePagination
        currentPage={2}
        totalPages={3}
        totalRecords={34}
        limit={15}
        loadedCount={15}
        recordLabel="assigned users"
      />,
    );

    expect(screen.getByText("16–30")).toBeInTheDocument();

    rerender(
      <TablePagination
        currentPage={3}
        totalPages={3}
        totalRecords={34}
        limit={15}
        loadedCount={4}
        recordLabel="assigned users"
      />,
    );

    expect(screen.getByText("31–34")).toBeInTheDocument();
  });

  it("TC-03: supports alias props totalItems, limit, and itemName", () => {
    render(
      <TablePagination
        currentPage={1}
        totalPages={10}
        totalItems={100}
        limit={10}
        itemName="records"
      />,
    );

    expect(screen.getByText("1–10")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText(/records/i)).toBeInTheDocument();
  });

  it("TC-04: handles 0 records correctly", () => {
    render(
      <TablePagination
        currentPage={1}
        totalPages={1}
        totalRecords={0}
        recordLabel="assigned users"
      />,
    );

    const zeroElements = screen.getAllByText("0");
    expect(zeroElements.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/assigned users/i)).toBeInTheDocument();
  });

  it("TC-05: keeps the formatted range for a single record", () => {
    render(
      <TablePagination
        currentPage={1}
        totalPages={1}
        totalRecords={1}
        limit={15}
        loadedCount={1}
        recordLabel="user"
      />,
    );

    expect(screen.getByText("1–1")).toBeInTheDocument();
    expect(screen.getByText("1", { selector: "span.font-extrabold" })).toBeInTheDocument();
  });

  it("TC-06: triggers onPageChange when clicking next, previous, and page number buttons", () => {
    const handlePageChange = vi.fn();

    render(
      <TablePagination
        currentPage={2}
        totalPages={5}
        totalRecords={50}
        limit={10}
        onPageChange={handlePageChange}
      />,
    );

    const prevButton = screen.getByRole("button", { name: /previous/i });
    fireEvent.click(prevButton);
    expect(handlePageChange).toHaveBeenCalledWith(1);

    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);
    expect(handlePageChange).toHaveBeenCalledWith(3);

    const page4Button = screen.getByRole("button", { name: "4" });
    fireEvent.click(page4Button);
    expect(handlePageChange).toHaveBeenCalledWith(4);
  });

  it("TC-07: disables previous on first page and next on last page", () => {
    const { rerender } = render(
      <TablePagination
        currentPage={1}
        totalPages={3}
        totalRecords={30}
        limit={10}
      />,
    );

    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).not.toBeDisabled();

    rerender(
      <TablePagination
        currentPage={3}
        totalPages={3}
        totalRecords={30}
        limit={10}
      />,
    );

    expect(screen.getByRole("button", { name: /previous/i })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });
});
