import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

import Header from "../../components/layout/Header";
import { useUser } from "../../services/context/UserContext";
import AttendanceTable from "../../components/tables/AttendanceTable";
import { usePagination } from "../../services/context/PaginationContext";

export default function AttendancePage() {
  const { user } = useUser();
  const mainRef = useRef(null);
  const didResetPageOnMountRef = useRef(false);

  const [tableReady, setTableReady] = useState(false);

  const { page, search, setPage, setCurrentPage, handlePageChange } =
    usePagination("attendance");

  const isEmployee = user?.role === "employee";
  const pageTitle = isEmployee ? "My Attendance" : "Attendance";

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
      if (mainRef.current) {
        mainRef.current.scrollTo({
          top: 0,
          left: 0,
          behavior,
        });
      }
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

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (didResetPageOnMountRef.current) return;

    didResetPageOnMountRef.current = true;

    if (Number(page || 1) !== 1) {
      goToPage(1);
      return;
    }

    setTableReady(true);
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
    <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main
        ref={mainRef}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6"
      >
        <div className="mx-auto max-w-[1600px] space-y-5">
          <section className="sibs-page-header-in">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-3">
                <Clock
                  size={34}
                  strokeWidth={2.2}
                  className="shrink-0 text-sibs-primary-1"
                />

                <h1 className="m-0 break-words text-[28px] font-bold leading-tight tracking-[-0.9px] text-sibs-primary-1 sm:text-[32px] xl:text-[38px]">
                  {pageTitle}
                </h1>
              </div>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                {isEmployee
                  ? "View your attendance records and details"
                  : "View attendance records of all employees"}
              </p>
            </div>
          </section>

          {tableReady ? (
            <AttendanceTable />
          ) : (
            <section
              className="sibs-profile-tab-panel overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm"
              style={{ animationDelay: "80ms" }}
            >
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-6 text-center text-sm font-bold text-sibs-tertiary-5">
                Loading...
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}