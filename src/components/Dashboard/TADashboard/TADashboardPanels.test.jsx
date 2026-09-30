import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import TAWeeklyMovement from "./TAWeeklyMovement";
import TARequirementProgress from "./TARequirementProgress";
import TARecruiterLoad from "./TARecruiterLoad";

describe("TA dashboard summary panels", () => {
  it("uses SiBS tone tokens for pipeline stages", () => {
    render(
      <TAWeeklyMovement
        funnel={{ sourced: 10, screened: 8, interviewed: 6, offered: 4, accepted: 2, hired: 1 }}
      />,
    );

    expect(screen.getAllByText("Sourced")[0].parentElement).toHaveClass(
      "sibs-tone-blue-icon",
    );
    expect(screen.getAllByText("Hired")[0].parentElement).toHaveClass(
      "sibs-tone-green-icon",
    );
  });

  it("uses semantic SiBS colors for requirement progress states", () => {
    const { container } = render(
      <TARequirementProgress
        roles={[
          { id: "risk", roleTitle: "Recruiter", status: "At Risk", req: 4, filled: 2 },
          { id: "delayed", roleTitle: "Analyst", status: "Delayed", req: 3, filled: 1 },
        ]}
      />,
    );

    expect(container.querySelector(".bg-sibs-warning")).toBeInTheDocument();
    expect(container.querySelector(".bg-sibs-danger")).toBeInTheDocument();
    expect(container.querySelector(".bg-slate-100")).not.toBeInTheDocument();
  });

  it("uses a shared badge for recruiter load", () => {
    render(
      <TARecruiterLoad
        recruiters={[
          {
            name: "Mara Cruz",
            activeRoles: 5,
            loadStatus: "High",
            output: { sourced: 12, interviewed: 4, hired: 1 },
          },
        ]}
      />,
    );

    const badge = screen.getByText("High");
    expect(badge).toHaveClass("sibs-badge-danger");
    expect(screen.getByText("Load")).toBeInTheDocument();
  });
});
