import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Clock, RefreshCw } from "lucide-react";

import Header from "../../components/layout/Header";
import { useUser } from "../../services/context/UserContext";
import AttendanceTable from "../../components/tables/AttendanceTable";
import { usePagination } from "../../services/context/PaginationContext";
import { PageHeaderHero } from "@/components/ui";

function getAnimationStyle(delay = 0) {
  return {
    animationDelay: `${delay}ms`,
    animationFillMode: "both",
  };
}

export default function AttendancePage() {
  const { user } = useUser();
  const mainRef = useRef(null);
  const didResetPageOnMountRef = useRef(false);
  const [tableReady, setTableReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { page, search, setPage, setCurrentPage, handlePageChange } =
    usePagination("attendance");

  const isEmployee = String(user?.role || "").toLowerCase() === "employee";
  const pageTitle = isEmployee ? "My Attendance" : "Time & Attendance";

  function goToPage(nextPage) {
    const cleanPage = Math.max(Number(nextPage) || 1, 1);

    if (typeof setPage === "function") {
      setPage(cleanPage);
      return;
    }

    if (typeof setCurrentPage === "function") {
      setCurrentPage(cleanPage);
      return;
    }

    if (typeof handlePageChange === "function") {
      handlePageChange(cleanPage);
    }
  }

  function scrollToTop(behavior = "auto") {
    requestAnimationFrame(() => {
      mainRef.current?.scrollTo({
        top: 0,
        left: 0,
        behavior,
      });
    });
  }

  useLayoutEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    scrollToTop("auto");

    const timer = window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (didResetPageOnMountRef.current) return;

    didResetPageOnMountRef.current = true;

    if (Number(page || 1) !== 1) {
      goToPage(1);
      return;
    }

    setTableReady(true);
    // Intentionally runs once to reset stale attendance pagination.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!didResetPageOnMountRef.current) return;

    if (Number(page || 1) === 1) {
      setTableReady(true);
    }
  }, [page]);

  useEffect(() => {
    scrollToTop("auto");
  }, [search]);

  function handleRefresh() {
    setIsRefreshing(true);
    setTableReady(false);
    setPage?.(1);
    window.setTimeout(() => {
      setTableReady(true);
      setIsRefreshing(false);
    }, 400);
  }

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main ref={mainRef} className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-4 sm:space-y-5">
          <PageHeaderHero
            kicker="Core HR View"
            title={pageTitle}
            description={
              isEmployee
                ? "Review your attendance records, clock-in and clock-out activity, breaks, and approved hours."
                : "Monitor employee clock-in and clock-out activity, breaks, work hours, and attendance approvals."
            }
            actions={
              <>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  title="Refresh Attendance Data"
                  className="sibs-btn-icon"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                      isRefreshing ? "animate-spin text-sibs-orange" : ""
                    }`}
                  />
                </button>

                <span className="sibs-btn-primary pointer-events-none max-sm:flex-1">
                  <Clock className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-white" />
                  Attendance Records
                </span>
              </>
            }
          />

          {tableReady ? (
            <AttendanceTable />
          ) : (
            <section
              className="sibs-profile-tab-panel sibs-page-card-in sibs-card overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm"
              style={getAnimationStyle(80)}
            >
              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-8 text-center text-xs font-extrabold text-[#667085]">
                Loading attendance records...
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
