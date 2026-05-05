import { usePagination } from "@/services/context/PaginationContext";
import TableFooter from "./footer/TableFooter";
import React from "react";

const ResignationTable = () => {
  const { page, search, loading, setLoading, setPagination } =
    usePagination("attendance");

  return (
    <div className="overflow-auto">
      <table className="w-full min-w-[1200px] text-sm">
        <thead className="bg-[var(--sibs-tertiary-9)]">
          <tr>
            <th className="p-4 text-left">ID</th>
            <th className="p-4 text-left">Resignation Date</th>
            <th className="p-4 text-left">Last Working Date</th>
            <th className="p-4 text-left">Reason</th>
            <th className="p-4 text-left">Specify Others</th>
            <th className="p-4 text-left">Uploaded File</th>
            <th className="p-4 text-left">Submitted At</th>
            <th className="p-4 text-left">Status</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan="8" className="p-6 text-center">
                Loading...
              </td>
            </tr>
          ) : filteredResignations.length === 0 ? (
            <tr>
              <td colSpan="8" className="p-6 text-center">
                No resignation records found
              </td>
            </tr>
          ) : (
            filteredResignations.map((item) => {
              const fileUrl =
                item.uploadedFile && item.sibsId
                  ? `${process.env.NEXT_PUBLIC_API_URL}/api/resignation/file/${item.sibsId}/${item.uploadedFile}`
                  : "";

              return (
                <tr
                  key={item.id}
                  className="border-t transition hover:bg-[var(--sibs-tertiary-10)]"
                >
                  <td className="p-4 font-medium text-sibs-primary-1">
                    {item.id}
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <CalendarDays
                        size={16}
                        className="text-sibs-tertiary-5"
                      />
                      <span>{formatDate(item.resignationDate)}</span>
                    </div>
                  </td>

                  <td className="p-4">{formatDate(item.lastWorkingDate)}</td>

                  <td className="p-4">{item.reason || "N/A"}</td>

                  <td className="max-w-[240px] p-4">
                    <p className="truncate">{item.specifyOthers || "N/A"}</p>
                  </td>

                  <td className="px-4 py-3">
                    <UploadedFileCell
                      filename={item.uploadedFile}
                      fileUrl={fileUrl}
                    />
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock3 size={16} className="text-sibs-tertiary-5" />
                      <span>{formatDateTime(item.createdAt)}</span>
                    </div>
                  </td>

                  <td className="p-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                        item.status,
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <TableFooter tableEntity="resignation" totalLabel="Total Resignations" />
    </div>
  );
};

export default ResignationTable;
