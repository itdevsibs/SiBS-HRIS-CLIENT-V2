import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import ConfirmModal from "./ConfirmModal";

describe("ConfirmModal", () => {
  it("TC-01: renders modal when open is true", () => {
    render(
      <ConfirmModal
        open={true}
        title="Revoke Permission"
        description="Are you sure you want to revoke this admin permission?"
        confirmLabel="Yes, Revoke"
        cancelLabel="Cancel"
      />,
    );

    expect(screen.getByText("Revoke Permission")).toBeInTheDocument();
    expect(screen.getByText("Are you sure you want to revoke this admin permission?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yes, Revoke" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("TC-02: does not render modal when open is false", () => {
    render(
      <ConfirmModal
        open={false}
        title="Delete Access"
      />,
    );

    expect(screen.queryByText("Delete Access")).not.toBeInTheDocument();
  });

  it("TC-03: triggers onConfirm when confirm button is clicked", () => {
    const handleConfirm = vi.fn();

    render(
      <ConfirmModal
        open={true}
        onConfirm={handleConfirm}
        confirmLabel="Confirm"
      />,
    );

    const confirmButton = screen.getByRole("button", { name: "Confirm" });
    fireEvent.click(confirmButton);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it("TC-04: triggers onClose when cancel button is clicked", () => {
    const handleClose = vi.fn();

    render(
      <ConfirmModal
        open={true}
        onClose={handleClose}
        cancelLabel="Cancel"
      />,
    );

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("TC-05: disables buttons when loading is true", () => {
    render(
      <ConfirmModal
        open={true}
        loading={true}
        confirmLabel="Deleting..."
      />,
    );

    expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});
