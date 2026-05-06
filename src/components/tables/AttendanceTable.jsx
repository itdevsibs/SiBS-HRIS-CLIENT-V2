import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleCheckBig, CircleX } from "lucide-react";

import { useUser } from "../../services/context/UserContext";
import { getAttendance } from "../../lib/axios/getAttendance";
import { usePagination } from "@/services/context/PaginationContext";
import socket from "@/lib/axios/socket";
import TableFooter from "./footer/TableFooter";
import { formatDate } from "@/components/layout/FormatDateTime";

const AttendanceTable = () => {
  const [attendance, setAttendance] = useState([]);

  const { page, search, loading, setLoading, setPagination } =
    usePagination("attendance");

  const navigate = useNavigate();
  const tableScrollRef = useRef(null);
  const mobileScrollRef = useRef(null);
  const { user } = useUser();

  const setLoadingRef = useRef(setLoading);
  const setPaginationRef = useRef(setPagination);
  const navigateRef = useRef(navigate);

  useEffect(() => {
    setLoadingRef.current = setLoading;
    setPaginationRef.current = setPagination;
    navigateRef.current = navigate;
  }, [setLoading, setPagination, navigate]);

  useEffect(() => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
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
            navigateRef.current("/login");
            return;
          }

          setAttendance([]);
          setPaginationRef.current?.({
            totalPages: 1,
            currentPage: 1,
            total: 0,
          });

          return;
        }

        setAttendance(result.data || []);

        setPaginationRef.current?.(
          result.pagination || {
            totalPages: 1,
            currentPage: 1,
            total: 0,
          }
        );
      } catch (err) {
        if (cancelled) return;

        console.error("Fetch attendance error:", err);

        setAttendance([]);
        setPaginationRef.current?.({
          totalPages: 1,
          currentPage: 1,
          total: 0,
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
            total: 0,
          }
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
    if (value === "--") {
      return "text-sibs-primary-1";
    }

    if (statusKey === "on-time") {
      return "bg-green-100 text-green-700";
    }

    return "bg-red-100 text-red-600";
  };

  const renderStatusBadge = (status) => {
    const approved = status === "Approved";

    return (
      <div
        className={`inline-flex items-center justify-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
          approved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
        }`}
      >
        {approved ? <CircleCheckBig size={16} /> : <CircleX size={16} />}
        <span>{status ?? "--"}</span>
      </div>
    );
  };

  const adminView = user?.tokenType === "admin";

  return (
    <div className="min-w-0 overflow-hidden rounded-xl bg-white">
      <div className="hidden lg:block">
        <div ref={tableScrollRef} className="max-h-[670px] overflow-auto">
          <table className="w-full min-w-[1280px] border-collapse bg-white text-sm text-sibs-primary-1">
            <thead className="sticky top-0 z-10 bg-[#f3f4f6]">
              <tr>
                {adminView && (
                  <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-bold text-sibs-primary-1">
                    SiBS ID
                  </th>
                )}

                {adminView && (
                  <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-bold text-sibs-primary-1">
                    Employee Name
                  </th>
                )}

                <th className="h-12 whitespace-nowrap px-3 text-left text-sm font-bold text-sibs-primary-1">
                  Tracker Date
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-center text-sm font-bold text-sibs-primary-1">
                  Login
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-center text-sm font-bold text-sibs-primary-1">
                  Start Break
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-center text-sm font-bold text-sibs-primary-1">
                  End Break
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-center text-sm font-bold text-sibs-primary-1">
                  Logout
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-center text-sm font-bold text-sibs-primary-1">
                  WH
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-center text-sm font-bold text-sibs-primary-1">
                  BH
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-center text-sm font-bold text-sibs-primary-1">
                  OT
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-center text-sm font-bold text-sibs-primary-1">
                  ATH
                </th>
                <th className="h-12 whitespace-nowrap px-3 text-center text-sm font-bold text-sibs-primary-1">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    className="p-6 text-center text-sm text-sibs-tertiary-5"
                    colSpan={adminView ? 12 : 10}
                  >
                    Loading...
                  </td>
                </tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td
                    className="p-6 text-center text-sm text-sibs-tertiary-5"
                    colSpan={adminView ? 12 : 10}
                  >
                    No records found
                  </td>
                </tr>
              ) : (
                attendance.map((item, index) => {
                  const loginTime = formatTime(item.gy_tracker_login);
                  const breakoutTime = formatTime(item.gy_tracker_breakout);
                  const breakinTime = formatTime(item.gy_tracker_breakin);
                  const logoutTime = formatTime(item.gy_tracker_logout);

                  return (
                    <tr
                      key={`${item.gy_tracker_date || "row"}-${index}`}
                      className="transition hover:bg-slate-50"
                    >
                      {adminView && (
                        <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-left text-sm font-normal text-sibs-primary-1">
                          {item.gy_emp_code || "--"}
                        </td>
                      )}

                      {adminView && (
                        <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-left text-sm font-medium text-sibs-primary-1">
                          {[
                            item.gy_emp_fname,
                            item.gy_emp_mname,
                            item.gy_emp_lname,
                          ]
                            .filter(Boolean)
                            .join(" ")
                            .trim()
                            .toUpperCase() || "--"}
                        </td>
                      )}

                      <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-left text-sm font-normal text-sibs-primary-1">
                        {formatDate(item.gy_tracker_date)}
                      </td>

                      <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-center">
                        <div
                          className={`inline-flex min-w-[74px] items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold ${getTimeBadgeClass(
                            loginTime,
                            item.login_status
                          )}`}
                        >
                          {loginTime}
                        </div>
                      </td>

                      <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-center">
                        <div
                          className={`inline-flex min-w-[74px] items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold ${
                            breakoutTime === "--"
                              ? "text-sibs-primary-1"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {breakoutTime}
                        </div>
                      </td>

                      <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-center">
                        <div
                          className={`inline-flex min-w-[74px] items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold ${getTimeBadgeClass(
                            breakinTime,
                            item.breakin_status
                          )}`}
                        >
                          {breakinTime}
                        </div>
                      </td>

                      <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-center">
                        <div
                          className={`inline-flex min-w-[74px] items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold ${getTimeBadgeClass(
                            logoutTime,
                            item.logout_status
                          )}`}
                        >
                          {logoutTime}
                        </div>
                      </td>

                      <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-center text-sm text-sibs-primary-1">
                        {item.gy_tracker_wh ?? "--"}
                      </td>

                      <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-center text-sm text-sibs-primary-1">
                        {item.gy_tracker_bh ?? "--"}
                      </td>

                      <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-center text-sm text-sibs-primary-1">
                        {item.gy_tracker_ot ?? "--"}
                      </td>

                      <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-center text-sm text-sibs-primary-1">
                        {item.gy_tracker_ath ?? "--"}
                      </td>

                      <td className="h-[54px] whitespace-nowrap border-t border-[#e6ecf2] px-3 text-center">
                        {renderStatusBadge(item.gy_tracker_status)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="block lg:hidden">
        <div ref={mobileScrollRef} className="max-h-[670px] overflow-y-auto p-3">
          {loading ? (
            <div className="rounded-xl bg-white p-6 text-center text-sm text-sibs-tertiary-5">
              Loading...
            </div>
          ) : attendance.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center text-sm text-sibs-tertiary-5">
              No records found
            </div>
          ) : (
            <div className="flex flex-col gap-3">
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

                const loginTime = formatTime(item.gy_tracker_login);
                const breakoutTime = formatTime(item.gy_tracker_breakout);
                const breakinTime = formatTime(item.gy_tracker_breakin);
                const logoutTime = formatTime(item.gy_tracker_logout);

                return (
                  <div
                    key={`${item.gy_tracker_date || "mobile"}-${index}`}
                    className="rounded-xl border border-[#e6ecf2] bg-white p-4 text-left shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {adminView && (
                          <p className="m-0 text-xs font-medium text-sibs-tertiary-5">
                            {item.gy_emp_code || "N/A"}
                          </p>
                        )}

                        <h3 className="m-0 text-sm font-semibold leading-tight text-sibs-primary-1">
                          {adminView
                            ? employeeName || "N/A"
                            : formatDate(item.gy_tracker_date)}
                        </h3>

                        {adminView && (
                          <p className="mt-1 text-xs font-medium text-sibs-tertiary-5">
                            {formatDate(item.gy_tracker_date)}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0">
                        {renderStatusBadge(item.gy_tracker_status)}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <MobileMetric
                        label="Login"
                        value={loginTime}
                        className={getTimeBadgeClass(
                          loginTime,
                          item.login_status
                        )}
                      />

                      <MobileMetric
                        label="Start Break"
                        value={breakoutTime}
                        className={
                          breakoutTime === "--"
                            ? "text-sibs-primary-1"
                            : "bg-green-100 text-green-700"
                        }
                      />

                      <MobileMetric
                        label="End Break"
                        value={breakinTime}
                        className={getTimeBadgeClass(
                          breakinTime,
                          item.breakin_status
                        )}
                      />

                      <MobileMetric
                        label="Logout"
                        value={logoutTime}
                        className={getTimeBadgeClass(
                          logoutTime,
                          item.logout_status
                        )}
                      />

                      <MobileMetric
                        label="WH"
                        value={item.gy_tracker_wh ?? "--"}
                      />
                      <MobileMetric
                        label="BH"
                        value={item.gy_tracker_bh ?? "--"}
                      />
                      <MobileMetric
                        label="OT"
                        value={item.gy_tracker_ot ?? "--"}
                      />
                      <MobileMetric
                        label="ATH"
                        value={item.gy_tracker_ath ?? "--"}
                      />
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

function MobileMetric({ label, value, className = "" }) {
  return (
    <div className="rounded-[10px] bg-sibs-tertiary-10 p-3">
      <p className="m-0 text-xs font-normal text-sibs-tertiary-5">{label}</p>

      {className ? (
        <div
          className={`mt-1 inline-flex min-w-[70px] items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold ${className}`}
        >
          {value}
        </div>
      ) : (
        <strong className="mt-1 block text-sm font-medium text-sibs-primary-1">
          {value}
        </strong>
      )}
    </div>
  );
}

export default AttendanceTable;