import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import ExpandableCandidateRemark from "./ExpandableCandidateRemark";

describe("ExpandableCandidateRemark", () => {
  afterEach(() => vi.restoreAllMocks());

  it("expands and collapses remarks when the text exceeds two lines", () => {
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(
      function getScrollHeight() {
        return this.dataset.testid === "candidate-remark-measure" ? 64 : 0;
      },
    );

    render(
      <ExpandableCandidateRemark value="A longer assessment remark that needs room to read." />,
    );

    const preview = screen.getAllByText(
      "A longer assessment remark that needs room to read.",
    )[0];
    const toggle = screen.getByRole("button", { name: "Show more" });
    expect(preview).toHaveClass("line-clamp-2");

    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(preview).not.toHaveClass("line-clamp-2");

    fireEvent.click(screen.getByRole("button", { name: "Show less" }));
    expect(screen.getByRole("button", { name: "Show more" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("keeps short remarks compact without an expand control", () => {
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(20);

    render(<ExpandableCandidateRemark value="Clear" />);

    expect(screen.getAllByText("Clear")[0]).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
