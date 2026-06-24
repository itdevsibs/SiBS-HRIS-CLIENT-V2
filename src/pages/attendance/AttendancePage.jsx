import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

import Header from "../../components/layout/Header";
import { useUser } from "../../services/context/UserContext";
import AttendanceTable from "../../components/tables/AttendanceTable";
import { usePagination } from "../../services/context/PaginationContext";

export default function AttendancePage() {
  const { user } = useUser();
  const mainScrollRef = useRef(null);
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

  function scrollPageToTop() {
    requestAnimationFrame(() => {
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTo({
          top: 0,
          left: 0,
          behavior: "auto",
        });
      }

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    });
  }

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
    scrollPageToTop();
  }, [search]);

  return (
    <div className="flex h-screen flex-1 flex-col bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main
        ref={mainScrollRef}
        className="min-w-0 flex-1 overflow-y-scroll overflow-x-hidden bg-sibs-tertiary-10 px-4 py-6 sm:px-6 lg:px-8"
      >
        <div className="flex min-w-0 flex-col gap-6">
          <section className="sibs-page-header-in flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-3">
                <Clock
                  size={34}
                  strokeWidth={2.2}
                  className="shrink-0 text-sibs-primary-1 transition-transform duration-300 group-hover:scale-105"
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

          <section
            className="sibs-profile-tab-panel min-w-0 overflow-hidden rounded-xl bg-white shadow-sm"
            style={{ animationDelay: "80ms" }}
          >
            {tableReady ? (
              <AttendanceTable />
            ) : (
              <div className="p-5">
                <div className="rounded-xl border border-[#E6ECF2] bg-white p-6 text-center text-sm font-bold text-sibs-tertiary-5">
                  Loading...
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}