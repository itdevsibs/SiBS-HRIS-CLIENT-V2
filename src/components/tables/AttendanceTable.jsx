import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "@/lib/router";
import { CircleCheckBig, CircleX } from "lucide-react";
import { useUser } from "../../services/context/UserContext";
import { getAttendance } from "../../lib/axios/getAttendance";
import { usePagination } from "@/services/context/PaginationContext";
import  socket  from "@/lib/axios/socket";
import TableFooter from "./footer/TableFooter";
import { formatDate } from "@/components/layout/FormatDateTime";

const AttendanceTable = () => {
  const [attendance, setAttendance] = useState([]);

  const { page, search, loading, setLoading, setPagination } =
    usePagination("attendance");

  const router = useRouter();
  const tableScrollRef = useRef(null);
  const { user } = useUser();

  const setLoadingRef = useRef(setLoading);
  const setPaginationRef = useRef(setPagination);
  const routerRef = useRef(router);

  useEffect(() => {
    setLoadingRef.current = setLoading;
    setPaginationRef.current = setPagination;
    routerRef.current = router;
  }, [setLoading, setPagination, router]);

  useEffect(() => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [page]);

  useEffect(() => {
    let cancelled = false;

    const fetchAttendance = async () => {
      try {
        setLoadingRef.current?.(true);

        const result = await getAttendance(page, search);

        if (cancelled) return;

        if (!result?.success) {
          if (result?.status === 401) {
            routerRef.current.push("/login");
            return;
          }

          setAttendance([]);
          setPaginationRef.current?.({
            totalPages: 1,
            currentPage: 1,
          });
          return;
        }

        setAttendance(result.data || []);
        setPaginationRef.current?.(
          result.pagination || {
            totalPages: 1,
            currentPage: 1,
          },
        );
      } catch (err) {
        if (cancelled) return;

        console.error("Fetch attendance error:", err);
        setAttendance([]);
        setPaginationRef.current?.({
          totalPages: 1,
          currentPage: 1,
        });
      } finally {
        if (!cancelled) {
          setLoadingRef.current?.(false);
        }
      }
    };

    fetchAttendance();

    return () => {
      cancelled = true;
    };
  }, [page, search]);

  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleAttendanceUpdated = async () => {
      try {
        const result = await getAttendance(page, search);

        if (!result?.success) return;

        setAttendance(result.data || []);
        setPaginationRef.current?.(
          result.pagination || {
            totalPages: 1,
            currentPage: 1,
          },
        );
      } catch (err) {
        console.error("Live attendance refresh error:", err);
      }
    };

    socket.on("attendance-updated", handleAttendanceUpdated);

    return () => {
      socket.off("attendance-updated", handleAttendanceUpdated);
    };
  }, [page, search]);

  const formatTime = (time) => {
    if (!time) return "--";

    const parsed = new Date(time);

    if (Number.isNaN(parsed.getTime())) {
      return "--";
    }

    return parsed.toLocaleTimeString("en-US", {
      timeZone: "Asia/Manila",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getTimeBadgeClass = (value, statusKey) => {
    if (value === "--") return "";

    if (statusKey === "on-time") return "status-present";
    return "status-absence";
  };

  const renderStatusBadge = (status) => {
    const approved = status === "Approved";

    return (
      <div
        className={`inline-flex min-w-[92px] items-center justify-center gap-1 rounded-full px-3 py-1 text-center ${
          approved ? "status-present" : "status-late"
        }`}
      >
        {approved ? <CircleCheckBig size={16} /> : <CircleX size={16} />}
        <span>{status ?? "--"}</span>
      </div>
    );
  };

  return (
    <div className="h-full rounded-xl bg-inherit">
      <div className="hidden lg:block">
        <table className="w-full table-fixed text-sm">
          <thead className="sticky top-0 z-10 bg-gray-100">
            <tr className="text-center">
              {user?.tokenType === "admin" && (
                <th className="w-[6%] rounded-tl-xl p-3">SiBS ID</th>
              )}

              {user?.tokenType === "admin" && (
                <th className="w-[18%] p-3 text-left">Employee Name</th>
              )}

              <th className="w-[9%] p-3 text-center">Tracker Date</th>
              <th className="w-[8%] p-3">Login</th>
              <th className="w-[8%] p-3">Start Break</th>
              <th className="w-[8%] p-3">End Break</th>
              <th className="w-[8%] p-3">Logout</th>
              <th className="w-[6%] p-3">WH</th>
              <th className="w-[6%] p-3">BH</th>
              <th className="w-[6%] p-3">OT</th>
              <th className="w-[6%] p-3">ATH</th>
              <th className="w-[11%] rounded-tr-xl p-3">Status</th>
            </tr>
          </thead>
        </table>

        <div ref={tableScrollRef} className="max-h-[620px] overflow-y-auto">
          <table className="w-full table-fixed text-sm">
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={user?.tokenType === "admin" ? 12 : 10}
                    className="p-6 text-center"
                  >
                    Loading...
                  </td>
                </tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td
                    colSpan={user?.tokenType === "admin" ? 12 : 10}
                    className="p-6 text-center"
                  >
                    No records found
                  </td>
                </tr>
              ) : (
                attendance.map((item, index) => (
                  <tr
                    key={index}
                    className="border-t text-center hover:bg-gray-50"
                  >
                    {user?.tokenType === "admin" && (
                      <td className="w-[6%] p-3">{item.gy_emp_code}</td>
                    )}

                    {user?.tokenType === "admin" && (
                      <td className="w-[18%] p-3 text-left">
                        {[
                          item.gy_emp_fname,
                          item.gy_emp_mname,
                          item.gy_emp_lname,
                        ]
                          .filter(Boolean)
                          .join(" ")
                          .trim()
                          .toUpperCase()}
                      </td>
                    )}

                    <td className="w-[9%] p-3 text-center">
                      {formatDate(item.gy_tracker_date)}
                    </td>

                    <td className="w-[8%] p-3 text-center">
                      <div
                        className={`mx-auto inline-flex min-w-[70px] justify-center px-2 py-[2px] text-center ${getTimeBadgeClass(
                          formatTime(item.gy_tracker_login),
                          item.login_status,
                        )}`}
                      >
                        {formatTime(item.gy_tracker_login)}
                      </div>
                    </td>

                    <td className="w-[8%] p-3 text-center">
                      <div
                        className={`mx-auto inline-flex min-w-[70px] justify-center px-2 py-[2px] text-center ${
                          formatTime(item.gy_tracker_breakout) === "--"
                            ? ""
                            : "status-present"
                        }`}
                      >
                        {formatTime(item.gy_tracker_breakout)}
                      </div>
                    </td>

                    <td className="w-[8%] p-3 text-center">
                      <div
                        className={`mx-auto inline-flex min-w-[70px] justify-center px-2 py-[2px] text-center ${getTimeBadgeClass(
                          formatTime(item.gy_tracker_breakin),
                          item.breakin_status,
                        )}`}
                      >
                        {formatTime(item.gy_tracker_breakin)}
                      </div>
                    </td>

                    <td className="w-[8%] p-3 text-center">
                      <div
                        className={`mx-auto inline-flex min-w-[70px] justify-center px-2 py-[2px] text-center ${getTimeBadgeClass(
                          formatTime(item.gy_tracker_logout),
                          item.logout_status,
                        )}`}
                      >
                        {formatTime(item.gy_tracker_logout)}
                      </div>
                    </td>

                    <td className="w-[6%] p-3">{item.gy_tracker_wh ?? "--"}</td>
                    <td className="w-[6%] p-3">{item.gy_tracker_bh ?? "--"}</td>
                    <td className="w-[6%] p-3">{item.gy_tracker_ot ?? "--"}</td>
                    <td className="w-[6%] p-3">
                      {item.gy_tracker_ath ?? "--"}
                    </td>

                    <td className="w-[11%] p-3 text-center">
                      {renderStatusBadge(item.gy_tracker_status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lg:hidden">
        <div ref={tableScrollRef} className="max-h-[620px] overflow-y-auto p-3">
          {loading ? (
            <div className="rounded-xl bg-white p-6 text-center text-sm">
              Loading...
            </div>
          ) : attendance.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center text-sm">
              No records found
            </div>
          ) : (
            <div className="space-y-3">
              {attendance.map((item, index) => {
                const employeeName = [
                  item.gy_emp_fname,
                  item.gy_emp_mname,
                  item.gy_emp_lname,
                ]
                  .filter(Boolean)
                  .join(" ")
                  .trim()
                  .toUpperCase();

                return (
                  <div
                    key={index}
                    className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {user?.tokenType === "admin" && (
                          <p className="text-xs font-medium text-sibs-tertiary-5">
                            {item.gy_emp_code || "N/A"}
                          </p>
                        )}

                        <h3 className="text-sm font-semibold text-sibs-primary-1">
                          {user?.tokenType === "admin"
                            ? employeeName || "N/A"
                            : formatDate(item.gy_tracker_date)}
                        </h3>

                        {user?.tokenType === "admin" && (
                          <p className="text-xs text-sibs-tertiary-5">
                            {formatDate(item.gy_tracker_date)}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0">
                        {renderStatusBadge(item.gy_tracker_status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-[var(--sibs-tertiary-10)] p-3">
                        <p className="text-xs text-sibs-tertiary-5">Login</p>

                        <div
                          className={`mt-1 inline-flex min-w-[70px] justify-center rounded-full px-2 py-[2px] ${getTimeBadgeClass(
                            formatTime(item.gy_tracker_login),
                            item.login_status,
                          )}`}
                        >
                          {formatTime(item.gy_tracker_login)}
                        </div>
                      </div>

                      <div className="rounded-lg bg-[var(--sibs-tertiary-10)] p-3">
                        <p className="text-xs text-sibs-tertiary-5">
                          Start Break
                        </p>

                        <div
                          className={`mt-1 inline-flex min-w-[70px] justify-center rounded-full px-2 py-[2px] ${
                            formatTime(item.gy_tracker_breakout) === "--"
                              ? ""
                              : "status-present"
                          }`}
                        >
                          {formatTime(item.gy_tracker_breakout)}
                        </div>
                      </div>

                      <div className="rounded-lg bg-[var(--sibs-tertiary-10)] p-3">
                        <p className="text-xs text-sibs-tertiary-5">
                          End Break
                        </p>

                        <div
                          className={`mt-1 inline-flex min-w-[70px] justify-center rounded-full px-2 py-[2px] ${getTimeBadgeClass(
                            formatTime(item.gy_tracker_breakin),
                            item.breakin_status,
                          )}`}
                        >
                          {formatTime(item.gy_tracker_breakin)}
                        </div>
                      </div>

                      <div className="rounded-lg bg-[var(--sibs-tertiary-10)] p-3">
                        <p className="text-xs text-sibs-tertiary-5">Logout</p>

                        <div
                          className={`mt-1 inline-flex min-w-[70px] justify-center rounded-full px-2 py-[2px] ${getTimeBadgeClass(
                            formatTime(item.gy_tracker_logout),
                            item.logout_status,
                          )}`}
                        >
                          {formatTime(item.gy_tracker_logout)}
                        </div>
                      </div>

                      <div className="rounded-lg bg-[var(--sibs-tertiary-10)] p-3">
                        <p className="text-xs text-sibs-tertiary-5">WH</p>
                        <p className="mt-1 font-medium text-sibs-primary-1">
                          {item.gy_tracker_wh ?? "--"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-[var(--sibs-tertiary-10)] p-3">
                        <p className="text-xs text-sibs-tertiary-5">BH</p>
                        <p className="mt-1 font-medium text-sibs-primary-1">
                          {item.gy_tracker_bh ?? "--"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-[var(--sibs-tertiary-10)] p-3">
                        <p className="text-xs text-sibs-tertiary-5">OT</p>
                        <p className="mt-1 font-medium text-sibs-primary-1">
                          {item.gy_tracker_ot ?? "--"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-[var(--sibs-tertiary-10)] p-3">
                        <p className="text-xs text-sibs-tertiary-5">ATH</p>
                        <p className="mt-1 font-medium text-sibs-primary-1">
                          {item.gy_tracker_ath ?? "--"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <TableFooter tableEntity="attendance" totalLabel="Total Attendance" />
    </div>
  );
};

export default AttendanceTable;