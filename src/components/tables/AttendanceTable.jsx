import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "@/lib/router";
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
          }
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
    if (value === "--") return "";

    if (statusKey === "on-time") return "status-present";
    return "status-absence";
  };

  const renderStatusBadge = (status) => {
    const approved = status === "Approved";

    return (
      <div
        className={`attendance-status-badge ${
          approved ? "status-present" : "status-late"
        }`}
      >
        {approved ? <CircleCheckBig size={16} /> : <CircleX size={16} />}
        <span>{status ?? "--"}</span>
      </div>
    );
  };

  return (
    <div className="attendance-table">
      <div className="attendance-table-desktop">
        <table className="attendance-table-head">
          <thead>
            <tr>
              {user?.tokenType === "admin" && <th className="col-sibs">SiBS ID</th>}

              {user?.tokenType === "admin" && (
                <th className="col-employee text-left">Employee Name</th>
              )}

              <th className="col-date">Tracker Date</th>
              <th className="col-time">Login</th>
              <th className="col-time">Start Break</th>
              <th className="col-time">End Break</th>
              <th className="col-time">Logout</th>
              <th className="col-small">WH</th>
              <th className="col-small">BH</th>
              <th className="col-small">OT</th>
              <th className="col-small">ATH</th>
              <th className="col-status">Status</th>
            </tr>
          </thead>
        </table>

        <div ref={tableScrollRef} className="attendance-table-scroll">
          <table className="attendance-table-body">
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={user?.tokenType === "admin" ? 12 : 10}>
                    Loading...
                  </td>
                </tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td colSpan={user?.tokenType === "admin" ? 12 : 10}>
                    No records found
                  </td>
                </tr>
              ) : (
                attendance.map((item, index) => (
                  <tr key={index}>
                    {user?.tokenType === "admin" && (
                      <td className="col-sibs">{item.gy_emp_code}</td>
                    )}

                    {user?.tokenType === "admin" && (
                      <td className="col-employee text-left">
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

                    <td className="col-date">
                      {formatDate(item.gy_tracker_date)}
                    </td>

                    <td className="col-time">
                      <div
                        className={`attendance-time-badge ${getTimeBadgeClass(
                          formatTime(item.gy_tracker_login),
                          item.login_status
                        )}`}
                      >
                        {formatTime(item.gy_tracker_login)}
                      </div>
                    </td>

                    <td className="col-time">
                      <div
                        className={`attendance-time-badge ${
                          formatTime(item.gy_tracker_breakout) === "--"
                            ? ""
                            : "status-present"
                        }`}
                      >
                        {formatTime(item.gy_tracker_breakout)}
                      </div>
                    </td>

                    <td className="col-time">
                      <div
                        className={`attendance-time-badge ${getTimeBadgeClass(
                          formatTime(item.gy_tracker_breakin),
                          item.breakin_status
                        )}`}
                      >
                        {formatTime(item.gy_tracker_breakin)}
                      </div>
                    </td>

                    <td className="col-time">
                      <div
                        className={`attendance-time-badge ${getTimeBadgeClass(
                          formatTime(item.gy_tracker_logout),
                          item.logout_status
                        )}`}
                      >
                        {formatTime(item.gy_tracker_logout)}
                      </div>
                    </td>

                    <td className="col-small">{item.gy_tracker_wh ?? "--"}</td>
                    <td className="col-small">{item.gy_tracker_bh ?? "--"}</td>
                    <td className="col-small">{item.gy_tracker_ot ?? "--"}</td>
                    <td className="col-small">{item.gy_tracker_ath ?? "--"}</td>

                    <td className="col-status">
                      {renderStatusBadge(item.gy_tracker_status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="attendance-table-mobile">
        <div ref={tableScrollRef} className="attendance-mobile-scroll">
          {loading ? (
            <div className="attendance-mobile-empty">Loading...</div>
          ) : attendance.length === 0 ? (
            <div className="attendance-mobile-empty">No records found</div>
          ) : (
            <div className="attendance-mobile-list">
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
                  <div key={index} className="attendance-mobile-card">
                    <div className="attendance-mobile-card-header">
                      <div className="attendance-mobile-card-title">
                        {user?.tokenType === "admin" && (
                          <p className="attendance-mobile-id">
                            {item.gy_emp_code || "N/A"}
                          </p>
                        )}

                        <h3>
                          {user?.tokenType === "admin"
                            ? employeeName || "N/A"
                            : formatDate(item.gy_tracker_date)}
                        </h3>

                        {user?.tokenType === "admin" && (
                          <p className="attendance-mobile-date">
                            {formatDate(item.gy_tracker_date)}
                          </p>
                        )}
                      </div>

                      <div className="attendance-mobile-status">
                        {renderStatusBadge(item.gy_tracker_status)}
                      </div>
                    </div>

                    <div className="attendance-mobile-grid">
                      <MobileMetric
                        label="Login"
                        value={formatTime(item.gy_tracker_login)}
                        className={getTimeBadgeClass(
                          formatTime(item.gy_tracker_login),
                          item.login_status
                        )}
                      />

                      <MobileMetric
                        label="Start Break"
                        value={formatTime(item.gy_tracker_breakout)}
                        className={
                          formatTime(item.gy_tracker_breakout) === "--"
                            ? ""
                            : "status-present"
                        }
                      />

                      <MobileMetric
                        label="End Break"
                        value={formatTime(item.gy_tracker_breakin)}
                        className={getTimeBadgeClass(
                          formatTime(item.gy_tracker_breakin),
                          item.breakin_status
                        )}
                      />

                      <MobileMetric
                        label="Logout"
                        value={formatTime(item.gy_tracker_logout)}
                        className={getTimeBadgeClass(
                          formatTime(item.gy_tracker_logout),
                          item.logout_status
                        )}
                      />

                      <MobileMetric label="WH" value={item.gy_tracker_wh ?? "--"} />
                      <MobileMetric label="BH" value={item.gy_tracker_bh ?? "--"} />
                      <MobileMetric label="OT" value={item.gy_tracker_ot ?? "--"} />
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
    <div className="attendance-mobile-metric">
      <p>{label}</p>

      {className ? (
        <div className={`attendance-time-badge ${className}`}>{value}</div>
      ) : (
        <strong>{value}</strong>
      )}
    </div>
  );
}

export default AttendanceTable;