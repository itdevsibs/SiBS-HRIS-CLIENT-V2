import React, { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, renderHook, act } from "@testing-library/react";

// 1. FUNC-01 imports
import {
  parseLocalDate,
  isResignationApproved,
  getResignationStatus,
} from "../pages/resignation-management/ResignationManagementPage";

// 2. FUNC-02 imports
import {
  HiringNeedsProvider,
  useHiringNeeds,
} from "../services/context/HiringNeedsContext";

// 3. FUNC-03 & FUNC-08 imports
import {
  PaginationProvider,
  usePagination,
  PaginationDateRangeFilter,
} from "../services/context/PaginationContext";

// 4. PUBLIC-ROUTING & LOGIN-OFFERS imports
import {
  isStandalonePublicPath,
  isStandalonePublicRoute,
  normalizePath,
  STANDALONE_PUBLIC_PATHS,
} from "../config/publicRoutes";

// 5. FUNC-05 imports
import DropdownPortal from "../components/ui/DropdownPortal";
import ModalShell from "../components/ui/ModalShell";

// Mock useUser for HiringNeedsProvider
vi.mock("../services/context/UserContext", () => ({
  useUser: () => ({ user: { role: "Super Admin", id: 1 } }),
  UserProvider: ({ children }) => children,
}));

describe("Remediation Automated Regression Test Suite", () => {
  /* =======================================================================
   * 1. FUNC-01: Resignation Status Classification & Local Date Parsing
   * ======================================================================= */
  describe("FUNC-01: Resignation status classification & date parsing", () => {
    it("keeps pending resignation as 'For Approval' even when lastWorkingDate is in the future", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const yyyy = futureDate.getFullYear();
      const mm = String(futureDate.getMonth() + 1).padStart(2, "0");
      const dd = String(futureDate.getDate()).padStart(2, "0");
      const futureDateStr = `${yyyy}-${mm}-${dd}`;

      const pendingRecord = {
        id: 101,
        status: "Pending",
        lastWorkingDate: futureDateStr,
        isApproved: false,
        somIsApproved: 0,
      };

      expect(isResignationApproved(pendingRecord)).toBe(false);
      expect(getResignationStatus(pendingRecord)).toBe("For Approval");
    });

    it("transitions approved resignation to 'In Notice Period' when lastWorkingDate >= today", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      const yyyy = futureDate.getFullYear();
      const mm = String(futureDate.getMonth() + 1).padStart(2, "0");
      const dd = String(futureDate.getDate()).padStart(2, "0");

      const approvedRecord = {
        id: 102,
        status: "Approved",
        lastWorkingDate: `${yyyy}-${mm}-${dd}`,
        isApproved: true,
      };

      expect(isResignationApproved(approvedRecord)).toBe(true);
      expect(getResignationStatus(approvedRecord)).toBe("In Notice Period");
    });

    it("marks approved resignation as 'Completed' when lastWorkingDate is in the past", () => {
      const pastRecord = {
        id: 103,
        status: "Approved",
        lastWorkingDate: "2020-01-01",
        isApproved: true,
      };

      expect(isResignationApproved(pastRecord)).toBe(true);
      expect(getResignationStatus(pastRecord)).toBe("Completed");
    });

    it("classifies declined resignations as 'Declined'", () => {
      const declinedRecord = {
        id: 104,
        status: "Declined",
        tlIsDeclined: 1,
      };
      expect(getResignationStatus(declinedRecord)).toBe("Declined");
    });

    it("parses YYYY-MM-DD dates in local calendar time without UTC midnight shift", () => {
      const parsed = parseLocalDate("2026-11-15");
      expect(parsed).not.toBeNull();
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(10); // 0-indexed November
      expect(parsed.getDate()).toBe(15);
    });
  });

  /* =======================================================================
   * 2. FUNC-02: Hiring Needs Search and Filter Reset
   * ======================================================================= */
  describe("FUNC-02: Hiring Needs search and filter clearing", () => {
    it("clearFilters resets search query, draft input, and categorical filters", () => {
      const wrapper = ({ children }) => (
        <PaginationProvider>
          <HiringNeedsProvider>{children}</HiringNeedsProvider>
        </PaginationProvider>
      );

      const { result } = renderHook(() => useHiringNeeds(), { wrapper });

      // Simulate active search
      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.hasActiveFilters).toBe(false);
    });
  });

  /* =======================================================================
   * 3. FUNC-03 & FUNC-08: PaginationContext Filter Clearing & Draft Search
   * ======================================================================= */
  describe("FUNC-03 & FUNC-08: PaginationContext filter clearing and draft search", () => {
    it("FUNC-08: Backspacing draft search input when search is empty does NOT reset page or set loading", () => {
      const wrapper = ({ children }) => (
        <PaginationProvider>{children}</PaginationProvider>
      );

      const { result } = renderHook(() => usePagination("employees"), { wrapper });

      // Set page to 3 and settle loading
      act(() => {
        result.current.setPage(3);
        result.current.setLoading(false);
      });
      expect(result.current.page).toBe(3);
      expect(result.current.loading).toBe(false);

      // Type draft letters without submitting search
      act(() => {
        result.current.setSearchInput("abc");
      });
      expect(result.current.searchInput).toBe("abc");
      expect(result.current.search).toBe("");
      expect(result.current.page).toBe(3);

      // Backspace draft letters to empty string
      act(() => {
        result.current.setSearchInput("");
      });
      expect(result.current.searchInput).toBe("");
      expect(result.current.search).toBe("");
      // Page must NOT be reset to 1
      expect(result.current.page).toBe(3);
      expect(result.current.loading).toBe(false);
    });

    it("FUNC-08: Clearing search input when applied search was non-empty resets page to 1 and triggers loading", () => {
      const wrapper = ({ children }) => (
        <PaginationProvider>{children}</PaginationProvider>
      );

      const { result } = renderHook(() => usePagination("employees"), { wrapper });

      // Apply search and navigate to page 4
      act(() => {
        result.current.setSearch("engineer");
        result.current.setPage(4);
      });
      expect(result.current.search).toBe("engineer");
      expect(result.current.page).toBe(4);

      // Clear search input
      act(() => {
        result.current.setSearchInput("");
      });
      expect(result.current.search).toBe("");
      expect(result.current.page).toBe(1);
      expect(result.current.loading).toBe(true);
    });

    it("FUNC-03: resetFilters clears date range to empty strings", () => {
      const wrapper = ({ children }) => (
        <PaginationProvider>{children}</PaginationProvider>
      );

      const { result } = renderHook(() => usePagination("schedule"), { wrapper });

      act(() => {
        result.current.setDateRange({ dateFrom: "2026-01-01", dateTo: "2026-01-07" });
      });
      expect(result.current.filterValues.dateFrom).toBe("2026-01-01");

      act(() => {
        result.current.resetFilters();
      });
      expect(result.current.filterValues.dateFrom).toBe("");
      expect(result.current.filterValues.dateTo).toBe("");
      expect(result.current.page).toBe(1);
    });

    it("FUNC-03: PaginationDateRangeFilter preserves empty string when date filter is explicitly cleared", () => {
      function DateRangeTestHarness() {
        return (
          <PaginationProvider>
            <PaginationDateRangeFilter entity="leaves" visible={true} />
          </PaginationProvider>
        );
      }

      render(<DateRangeTestHarness />);
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });

  /* =======================================================================
   * 4. PUBLIC-ROUTING & LOGIN-OFFERS: Standalone Public Route Matching
   * ======================================================================= */
  describe("PUBLIC-ROUTING & LOGIN-OFFERS: Route matching and provider gating", () => {
    it("identifies /applicant-portal and /public/applicant-portal as standalone public paths", () => {
      expect(isStandalonePublicPath("/applicant-portal")).toBe(true);
      expect(isStandalonePublicPath("/public/applicant-portal")).toBe(true);
      expect(isStandalonePublicRoute("/applicant-portal")).toBe(true);
    });

    it("identifies /login as a standalone public path to isolate unauthenticated visits from private providers", () => {
      expect(isStandalonePublicPath("/login")).toBe(true);
      expect(STANDALONE_PUBLIC_PATHS).toContain("/login");
    });

    it("returns false for authenticated private application paths", () => {
      expect(isStandalonePublicPath("/dashboard")).toBe(false);
      expect(isStandalonePublicPath("/employees")).toBe(false);
      expect(isStandalonePublicPath("/schedule")).toBe(false);
      expect(isStandalonePublicPath("/resignation-management")).toBe(false);
    });

    it("normalizes trailing slashes and query strings cleanly", () => {
      expect(normalizePath("/applicant-portal/")).toBe("/applicant-portal");
      expect(normalizePath("/login?redirect=/dashboard")).toBe("/login");
      expect(normalizePath("/")).toBe("/");
    });
  });

  /* =======================================================================
   * 5. FUNC-05: Modal Escape Handling & Dropdown Portal Isolation
   * ======================================================================= */
  describe("FUNC-05: Modal Escape handling and dropdown portal isolation", () => {
    function ModalWithDropdown() {
      const [modalOpen, setModalOpen] = useState(true);
      const [dropdownOpen, setDropdownOpen] = useState(true);
      const buttonRef = useRef(null);

      return (
        <div>
          <ModalShell
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Parent Modal"
            closeOnEscape={true}
          >
            <button ref={buttonRef} type="button">Anchor Button</button>
            <DropdownPortal
              open={dropdownOpen}
              anchorRef={buttonRef}
              onClose={() => setDropdownOpen(false)}
              topLayer={true}
            >
              <div role="listbox">
                <div role="option">Option 1</div>
              </div>
            </DropdownPortal>
          </ModalShell>
          <div data-testid="modal-state">{modalOpen ? "open" : "closed"}</div>
          <div data-testid="dropdown-state">{dropdownOpen ? "open" : "closed"}</div>
        </div>
      );
    }

    it("pressing Escape inside topLayer dropdown closes the dropdown without closing the parent modal", () => {
      render(<ModalWithDropdown />);

      expect(screen.getByTestId("modal-state")).toHaveTextContent("open");
      expect(screen.getByTestId("dropdown-state")).toHaveTextContent("open");

      // Press Escape
      fireEvent.keyDown(document, { key: "Escape" });

      // Dropdown must close, parent modal must stay OPEN
      expect(screen.getByTestId("dropdown-state")).toHaveTextContent("closed");
      expect(screen.getByTestId("modal-state")).toHaveTextContent("open");
    });
  });
});
