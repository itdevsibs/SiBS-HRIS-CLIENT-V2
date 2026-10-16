import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import fs from "fs";
import path from "path";
import DepartmentSummaryCards from "@/components/departments/DepartmentSummaryCards";

describe("SIBS-UIUX-SKELETON-HARMONIZATION-01: Skeleton Loading Harmonization", () => {
  describe("DepartmentSummaryCards", () => {
    it("renders MetricGridSkeleton when loading is true", () => {
      render(<DepartmentSummaryCards summary={{}} loading={true} />);
      const skeletonGrid = screen.getByRole("status", { name: /loading department metrics/i });
      expect(skeletonGrid).toBeInTheDocument();
      expect(skeletonGrid).toHaveAttribute("aria-busy", "true");
    });

    it("renders metric cards when loading is false", () => {
      const summary = {
        totalDepartments: 12,
        totalAccounts: 34,
        activeAccounts: 30,
        inactiveAccounts: 4,
        activeRate: 88,
      };
      render(<DepartmentSummaryCards summary={summary} loading={false} />);
      expect(screen.getByText("Total Departments")).toBeInTheDocument();
      expect(screen.getByText("Total Accounts")).toBeInTheDocument();
      expect(screen.queryByRole("status", { name: /loading department metrics/i })).not.toBeInTheDocument();
    });
  });

  describe("DepartmentsPage.jsx Codebase Audit", () => {
    const departmentsPagePath = path.resolve(
      __dirname,
      "../../pages/administration/DepartmentsPage.jsx"
    );
    const content = fs.readFileSync(departmentsPagePath, "utf-8");

    it("passes loading prop to DepartmentSummaryCards", () => {
      expect(content).toMatch(/<DepartmentSummaryCards[^>]*loading=\{departments\.loading\}/);
    });

    it("uses DepartmentCardSkeleton instead of raw Loader2 for the directory loading state", () => {
      expect(content).toContain("DepartmentCardSkeleton");
      // Must not use Loader2 spinner as the main department list fallback
      expect(content).not.toMatch(/departments\.loading\s*\?\s*\(\s*<div[^>]*>\s*<Loader2/);
    });
  });

  describe("Department & Account Approval Requests Skeletons", () => {
    const deptApprovalPath = path.resolve(
      __dirname,
      "../departments/DepartmentApprovalRequests.jsx"
    );
    const acctApprovalPath = path.resolve(
      __dirname,
      "../departments/AccountApprovalRequests.jsx"
    );
    const deptContent = fs.readFileSync(deptApprovalPath, "utf-8");
    const acctContent = fs.readFileSync(acctApprovalPath, "utf-8");

    it("uses TableSkeletonRows in DepartmentApprovalRequests instead of raw Loader2 spinner", () => {
      expect(deptContent).toContain("TableSkeletonRows");
      expect(deptContent).not.toMatch(/loading\s*\?\s*\(\s*<div[^>]*>\s*<Loader2/);
    });

    it("uses TableSkeletonRows in AccountApprovalRequests instead of raw Loader2 spinner", () => {
      expect(acctContent).toContain("TableSkeletonRows");
      expect(acctContent).not.toMatch(/loading\s*\?\s*\(\s*<div[^>]*>\s*<Loader2/);
    });
  });

  describe("EmailLogsPage.jsx Codebase Audit", () => {
    const emailLogsPagePath = path.resolve(
      __dirname,
      "../../pages/communication/EmailLogsPage.jsx"
    );
    const content = fs.readFileSync(emailLogsPagePath, "utf-8");

    it("renders TableSkeletonRows when logs.loading is true and avoids premature EmptyStatePanel", () => {
      // Must render TableSkeletonRows in JSX
      expect(content).toMatch(/<TableSkeletonRows/);
      // logs.loading condition must be checked before rendering EmptyStatePanel or live table
      expect(content).toMatch(/logs\.loading\s*\?/);
    });
  });

  describe("SIBS-UIUX-SKELETON-02: Table and Modal Skeleton Harmonization", () => {
    const dropOffSectionPath = path.resolve(
      __dirname,
      "../recruitment/shared/DropOffListSection.jsx"
    );
    const talentPoolPagePath = path.resolve(
      __dirname,
      "../../pages/recruitment/talent-pool/TalentPoolPage.jsx"
    );
    const deptDetailsModalPath = path.resolve(
      __dirname,
      "../departments/DepartmentDetailsModal.jsx"
    );
    const watchlistPath = path.resolve(
      __dirname,
      "../recruitment/actionItems/ActionItemsPriorityWatchlist.jsx"
    );

    it("TC-SKEL-01: DropOffListSection uses TableSkeletonRows and DataCard.Skeleton instead of raw Loader2 spinner", () => {
      const content = fs.readFileSync(dropOffSectionPath, "utf-8");
      expect(content).toContain("TableSkeletonRows");
      expect(content).toContain("DataCard");
      // Must not use raw Loader2 as main drop-off loading fallback
      expect(content).not.toMatch(/isLoading\s*&&\s*candidates\.length\s*===\s*0\s*\?\s*\(\s*<div[^>]*>\s*<div[^>]*>\s*<Loader2/);
    });

    it("TC-SKEL-02: TalentPoolPage passes loading prop to TalentPoolTable for converted leads tab", () => {
      const content = fs.readFileSync(talentPoolPagePath, "utf-8");
      // Must pass loading={leadsLoading} to TalentPoolTable
      expect(content).toMatch(/<TalentPoolTable[\s\S]*?candidates=\{convertedLeadCandidates\}[\s\S]*?loading=\{leadsLoading\}/);
    });

    it("TC-SKEL-03: DepartmentDetailsModal replaces raw Loader2 with Skeleton cards for account employee list", () => {
      const content = fs.readFileSync(deptDetailsModalPath, "utf-8");
      // Must not use raw Loader2 spinner for employee roster loading
      expect(content).not.toMatch(/loading\s*\?\s*\(\s*<div[^>]*min-h-52[^>]*>\s*<Loader2/);
      expect(content).toContain("employee-card-skeleton");
    });

    it("TC-SKEL-04: ActionItemsPriorityWatchlist guards against premature empty state during loading", () => {
      const content = fs.readFileSync(watchlistPath, "utf-8");
      // Must check loading state
      expect(content).toMatch(/loading/);
      expect(content).toContain("watchlist-skeleton");
    });
  });
});

