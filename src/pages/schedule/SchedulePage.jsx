import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, CalendarDays, RefreshCw } from "lucide-react";

import Header from "../../components/layout/Header";
import { getSchedule } from "../../lib/axios/getSchedule";
import { usePagination } from "@/services/context/PaginationContext";
import ScheduleTable from "@/components/tables/Schedule/ScheduleTable";
import { PageHeaderHero } from "@/components/ui";

const SCHEDULE_STATE_KEY = "schedulePageState";
const PAGE_LIMIT = 15;

export default function SchedulePage() {
  const [schedule, setSchedule] = useState([]);
  const [loadError, setLoadError] = useState("");

  const paginationContext = usePagination("schedule");

  const {
    page = 1,
    search = "",
    searchInput = "",
    loading,
    setLoading,
    setSearchInput,
    setSearch,
    pagination,
    setPagination,
    filterValues,
    setPage,
    setDateRange,
  } = paginationContext;

  const restoredRef = useRef(false);
  const mainScrollRef = useRef(null);

  const dateFrom = filterValues?.dateFrom || "";
  const dateTo = filterValues?.dateTo || "";

  useEffect(() => {
    if (restoredRef.current) return;

    try {
      const savedState = sessionStorage.getItem(SCHEDULE_STATE_KEY);

      if (savedState) {
        const parsed = JSON.parse(savedState);

        if (typeof parsed.search === "string") {
          setSearchInput(parsed.search);
          setSearch(parsed.search);
        }

        if (typeof parsed.page === "number" && parsed.page > 0) {
          setPage(parsed.page);
        }

        if (
          typeof setDateRange === "function" &&
          (typeof parsed.dateFrom === "string" ||
            typeof parsed.dateTo === "string")
        ) {
          setDateRange({
            dateFrom: parsed.dateFrom || "",
            dateTo: parsed.dateTo || "",
          });
        }
      }
    } catch (err) {
      console.error("Schedule state restore error:", err);
    } finally {
      restoredRef.current = true;
    }
  }, [setDateRange, setPage, setSearch, setSearchInput]);

  useEffect(() => {
    if (!restoredRef.current) return;

    sessionStorage.setItem(
      SCHEDULE_STATE_KEY,
      JSON.stringify({
        search,
        page,
        dateFrom,
        dateTo,
      }),
    );
  }, [search, page, dateFrom, dateTo]);

  async function fetchSchedule(showLoading = true) {
    setLoadError("");
    if (showLoading) setLoading(true);

    try {
      const result = await getSchedule(page, search, {
        dateFrom,
        dateTo,
      });

      if (!result?.success) {
        setLoadError(result?.message || "Unable to load schedule records. Please try again.");
        setSchedule([]);

        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalRecords: 0,
          total: 0,
          limit: PAGE_LIMIT,
          hasPreviousPage: false,
          hasNextPage: false,
        });

        return;
      }

      setSchedule(result.data || []);

      setPagination(
        result.pagination || {
          currentPage: page,
          totalPages: 1,
          totalRecords: result.data?.length || 0,
          total: result.data?.length || 0,
          limit: PAGE_LIMIT,
          hasPreviousPage: page > 1,
          hasNextPage: false,
        },
      );
    } catch (err) {
      console.error("Schedule fetch error:", err);
      setLoadError(err?.message || "Unable to load schedule records. Please try again.");

      setSchedule([]);

      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        total: 0,
        limit: PAGE_LIMIT,
        hasPreviousPage: false,
        hasNextPage: false,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!restoredRef.current) return;

    fetchSchedule(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, dateFrom, dateTo]);

  useEffect(() => {
    const handleFocus = () => {
      fetchSchedule(false);
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, dateFrom, dateTo]);

  function handleSetSearchKeyword(value) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main ref={mainScrollRef} className="sibs-dashboard-main-wide">
        <div className="mx-auto flex min-h-full w-full max-w-[1700px] flex-col gap-4 sm:gap-5">
          <PageHeaderHero
            kicker="Core HR View"
            title="My Schedule"
            description="View your work schedule and assigned shift details."
            actions={
              <>
                <button
                  type="button"
                  onClick={() => fetchSchedule(true)}
                  disabled={loading}
                  title="Refresh Schedule Data"
                  className="sibs-btn-icon"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                      loading ? "animate-spin text-sibs-orange" : ""
                    }`}
                  />
                </button>

                <span className="sibs-btn-primary pointer-events-none max-sm:flex-1">
                  <CalendarDays className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-white" />
                  Schedule Records
                </span>
              </>
            }
          />

          {loadError ? (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700"
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                <AlertCircle size={16} aria-hidden="true" className="shrink-0 text-rose-600" />
                <span>{loadError}</span>
              </div>
              <button
                type="button"
                onClick={() => fetchSchedule(true)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-extrabold text-rose-700 shadow-2xs transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={13} aria-hidden="true" className={loading ? "animate-spin" : ""} />
                Retry
              </button>
            </div>
          ) : null}

          <ScheduleTable
            loadError={loadError}
            onRetry={() => fetchSchedule(true)}
            schedule={schedule}
            loading={loading}
            page={page}
            searchInput={searchInput}
            searchKeyword={search}
            setSearchInput={setSearchInput}
            setSearchKeyword={handleSetSearchKeyword}
            setPage={setPage}
            pagination={pagination}
            filterValues={filterValues}
          />
        </div>
      </main>
    </div>
  );
}
