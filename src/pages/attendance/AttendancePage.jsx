import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

import Header from "../../components/layout/Header";
import { useUser } from "../../services/context/UserContext";
import AttendanceTable from "../../components/tables/AttendanceTable";
import { usePagination } from "../../services/context/PaginationContext";

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

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main ref={mainRef} className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-4 sm:space-y-5">
          <section
            className="sibs-page-header-in sibs-page-card-in sibs-card relative overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm 2xl:p-6"
            style={getAnimationStyle(0)}
          >
            <span className="sibs-top-accent" aria-hidden="true" />

            <div className="mt-0.5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase text-[#042C51]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF5C28] animate-sibs-pulse" />
                    Time &amp; Attendance View
                  </span>
                </div>

                <h1 className="break-words text-lg 2xl:text-2xl font-extrabold text-[#042C51]">
                  {pageTitle}
                </h1>

                <p className="sibs-text-sm font-semibold leading-relaxed text-[#667085]">
                  {isEmployee
                    ? "Review your attendance records, clock-in and clock-out activity, breaks, and approved hours."
                    : "Monitor employee clock-in and clock-out activity, breaks, work hours, and attendance approvals."}
                </p>
              </div>

              <span className="inline-flex h-8.5 2xl:h-10 w-max shrink-0 items-center justify-center gap-2 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-3 2xl:px-3.5 sibs-text-xs font-extrabold text-[#042C51]">
                <Clock className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-[#FF5C28]" />
                Attendance Records
              </span>
            </div>
          </section>

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
