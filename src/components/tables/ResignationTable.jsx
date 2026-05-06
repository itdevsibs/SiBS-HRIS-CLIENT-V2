import React, { useMemo } from "react";
import { CalendarDays, Clock3, Paperclip } from "lucide-react";

import { usePagination } from "@/services/context/PaginationContext";
import TableFooter from "./footer/TableFooter";
import {
  formatDate,
  formatDateTime,
} from "@/components/layout/FormatDateTime";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const ResignationTable = ({ data = [], loading: propLoading = false }) => {
  const { search, loading: paginationLoading } = usePagination("resignation");

  const loading = propLoading || paginationLoading;

  const filteredResignations = useMemo(() => {
    const list = Array.isArray(data) ? data : [];

    if (!search) return list;

    const keyword = String(search).toLowerCase();

    return list.filter((item) => {
      return [
        item.id,
        item.sibsId,
        item.employeeName,
        item.fullName,
        item.reason,
        item.specifyOthers,
        item.status,
        item.uploadedFile,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [data, search]);

  return (
    <div className="resignation-table">
      <div className="resignation-table-scroll">
        <table className="resignation-table-main">
          <thead>
            <tr>
              <th>ID</th>
              <th>Resignation Date</th>
              <th>Last Working Date</th>
              <th>Reason</th>
              <th>Specify Others</th>
              <th>Uploaded File</th>
              <th>Submitted At</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="resignation-table-empty">
                  Loading...
                </td>
              </tr>
            ) : filteredResignations.length === 0 ? (
              <tr>
                <td colSpan="8" className="resignation-table-empty">
                  No resignation records found
                </td>
              </tr>
            ) : (
              filteredResignations.map((item) => {
                const fileUrl =
                  item.uploadedFile && item.sibsId
                    ? `${API_URL}/api/resignation/file/${item.sibsId}/${item.uploadedFile}`
                    : "";

                return (
                  <tr key={item.id}>
                    <td className="resignation-table-id">{item.id || "N/A"}</td>

                    <td>
                      <div className="resignation-table-icon-text">
                        <CalendarDays size={16} />
                        <span>{formatDate(item.resignationDate)}</span>
                      </div>
                    </td>

                    <td>{formatDate(item.lastWorkingDate)}</td>

                    <td>{item.reason || "N/A"}</td>

                    <td className="resignation-table-truncate-cell">
                      <p>{item.specifyOthers || "N/A"}</p>
                    </td>

                    <td>
                      <UploadedFileCell
                        filename={item.uploadedFile}
                        fileUrl={fileUrl}
                      />
                    </td>

                    <td>
                      <div className="resignation-table-icon-text">
                        <Clock3 size={16} />
                        <span>{formatDateTime(item.createdAt)}</span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`resignation-status-badge ${getStatusClasses(
                          item.status
                        )}`}
                      >
                        {item.status || "Pending"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <TableFooter tableEntity="resignation" totalLabel="Total Resignations" />
    </div>
  );
};

function UploadedFileCell({ filename, fileUrl }) {
  if (!filename) {
    return <span className="resignation-file-empty">No file</span>;
  }

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noreferrer"
      className="resignation-file-link"
      title={filename}
    >
      <Paperclip size={15} />
      <span>{filename}</span>
    </a>
  );
}

function getStatusClasses(status) {
  const value = String(status || "")
    .trim()
    .toLowerCase();

  switch (value) {
    case "approved":
      return "status-present";

    case "declined":
    case "rejected":
      return "status-absence";

    case "retained":
      return "resignation-status-retained";

    case "pending":
    default:
      return "status-late";
  }
}

export default ResignationTable;