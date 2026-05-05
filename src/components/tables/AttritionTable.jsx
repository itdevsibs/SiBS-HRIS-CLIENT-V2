import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "@/lib/router";
import { Clock3, Eye, Pencil } from "lucide-react";
import { getMyAttritions } from "../../lib/axios/getAttrition";
import { usePagination } from "@/services/context/PaginationContext";
import { useUser } from "../../services/context/UserContext";
import TableFooter from "./footer/TableFooter";
import {
  formatDate,
  formatDateTime,
} from "@/components/layout/FormatDateTime";

function FileTypeIcon({ filename }) {
  const ext = filename?.split(".").pop()?.toLowerCase() || "";

  const config = {
    doc: { label: "W", color: "bg-blue-600" },
    docx: { label: "W", color: "bg-blue-600" },
    xls: { label: "X", color: "bg-green-600" },
    xlsx: { label: "X", color: "bg-green-600" },
    csv: { label: "X", color: "bg-green-600" },
    pdf: { label: "PDF", color: "bg-red-600" },
    jpg: { label: "IMG", color: "bg-purple-600" },
    jpeg: { label: "IMG", color: "bg-purple-600" },
    png: { label: "IMG", color: "bg-purple-600" },
    gif: { label: "IMG", color: "bg-purple-600" },
    webp: { label: "IMG", color: "bg-purple-600" },
    svg: { label: "IMG", color: "bg-purple-600" },
  };

  const file = config[ext] || { label: "FILE", color: "bg-gray-600" };

  return (
    <div className="relative h-12 w-10 shrink-0">
      <div className="absolute inset-0 rounded-md border-2 border-gray-300 bg-white" />
      <div className="absolute right-0 top-0 h-3 w-3 border-l-2 border-b-2 border-gray-300 bg-gray-100" />
      <div className="absolute left-1 top-1/2 h-[2px] w-6 -translate-y-1/2 bg-gray-300" />
      <div className="absolute left-1 top-[60%] h-[2px] w-5 bg-gray-300" />

      <div
        className={`absolute -left-2 bottom-1 rounded-md px-2 py-1 text-[10px] font-bold text-white shadow ${file.color}`}
      >
        {file.label}
      </div>
    </div>
  );
}

function UploadedFileCell({ filename, fileUrl, className = "" }) {
  if (!filename || !fileUrl) {
    return <span className="text-sm text-gray-400">N/A</span>;
  }

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex min-w-0 items-center gap-3 rounded-lg p-1 transition hover:bg-gray-50 ${className}`}
      title={`Open ${filename}`}
      onClick={(e) => e.stopPropagation()}
    >
      <FileTypeIcon filename={filename} />

      <span className="truncate text-sm text-gray-700 hover:text-[var(--sibs-primary-1)]">
        {filename}
      </span>
    </a>
  );
}

function MobileAttritionCard({
  item,
  user,
  loggedInSibsId,
  onView,
  onEdit,
  getStatusClasses,
}) {
  const fileUrl =
    item.uploadedFile && item.sibsId
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/resignation/file/${encodeURIComponent(
          item.sibsId,
        )}/${encodeURIComponent(item.uploadedFile)}`
      : "";

  const isPending = String(item.status || "").toLowerCase() === "pending";

  const isApprover =
    String(item.tlSibsId || "").trim() === loggedInSibsId ||
    String(item.omSibsId || "").trim() === loggedInSibsId ||
    String(item.somSibsId || "").trim() === loggedInSibsId;

  const isEditable = isPending && isApprover;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView?.(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView?.(item);
        }
      }}
      className="cursor-pointer rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm transition hover:border-[var(--sibs-primary-1)] hover:bg-gray-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-sibs-tertiary-5">
            Request ID
          </p>

          <h3 className="text-sm font-semibold text-sibs-primary-1">
            {item.id}
          </h3>

          {user?.tokenType === "admin" && (
            <p className="mt-1 text-xs text-sibs-tertiary-5">
              Employee SIBS ID: {item.sibsId || "N/A"}
            </p>
          )}
        </div>

        <span
          className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
            item.status,
          )}`}
        >
          {item.status || "Pending"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-[var(--sibs-tertiary-10)] p-3">
          <p className="text-xs text-sibs-tertiary-5">Notice Date</p>
          <p className="mt-1 text-sm font-medium text-sibs-primary-1">
            {formatDate(item.attritionDate)}
          </p>
        </div>

        <div className="rounded-lg bg-[var(--sibs-tertiary-10)] p-3">
          <p className="text-xs text-sibs-tertiary-5">Last Working Date</p>
          <p className="mt-1 text-sm font-medium text-sibs-primary-1">
            {formatDate(item.lastWorkingDate)}
          </p>
        </div>

        <div className="col-span-2 rounded-lg bg-[var(--sibs-tertiary-10)] p-3">
          <p className="text-xs text-sibs-tertiary-5">Reason</p>
          <p className="mt-1 text-sm font-medium text-sibs-primary-1">
            {item.reason || "N/A"}
          </p>
        </div>

        <div className="col-span-2 rounded-lg bg-[var(--sibs-tertiary-10)] p-3">
          <p className="text-xs text-sibs-tertiary-5">Specify Others</p>
          <p className="mt-1 text-sm font-medium text-sibs-primary-1">
            {item.specifyOthers || "N/A"}
          </p>
        </div>

        <div className="col-span-2 rounded-lg bg-[var(--sibs-tertiary-10)] p-3">
          <p className="text-xs text-sibs-tertiary-5">Uploaded File</p>

          <div className="mt-2">
            <UploadedFileCell
              filename={item.uploadedFile}
              fileUrl={fileUrl}
              className="w-full"
            />
          </div>
        </div>

        <div className="col-span-2 rounded-lg bg-[var(--sibs-tertiary-10)] p-3">
          <p className="text-xs text-sibs-tertiary-5">Submitted At</p>

          <div className="mt-1 flex items-center gap-2 text-sm font-medium text-sibs-primary-1">
            <Clock3 size={16} className="text-sibs-tertiary-5" />
            <span>{formatDateTime(item.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onView?.(item);
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-[#D7DEE8] px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <Eye size={14} />
          View
        </button>

        {isEditable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(item);
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-[var(--sibs-primary-1)] px-3 py-2 text-xs font-medium text-white transition hover:opacity-90"
          >
            <Pencil size={14} />
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

const AttritionTable = ({ reloadKey = 0, onView, onEdit }) => {
  const [attritions, setAttritions] = useState([]);

  const { page, search, loading, setLoading, setPagination } =
    usePagination("attrition");

  const { user } = useUser();
  const router = useRouter();
  const tableScrollRef = useRef(null);

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

    const fetchAttritions = async () => {
      try {
        setLoadingRef.current?.(true);

        const result = await getMyAttritions(page, search);

        if (cancelled) return;

        if (!result?.success) {
          if (result?.status === 401) {
            routerRef.current.push("/login");
            return;
          }

          setAttritions([]);
          setPaginationRef.current?.({
            totalPages: 1,
            currentPage: 1,
            total: 0,
          });
          return;
        }

        const data = result.data || [];
        const pagination = result.pagination || {
          totalPages: 1,
          currentPage: 1,
          total: data.length,
        };

        setAttritions(data);
        setPaginationRef.current?.(pagination);
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to load attritions:", error);

        setAttritions([]);
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

    fetchAttritions();

    return () => {
      cancelled = true;
    };
  }, [page, search, reloadKey]);

  const getStatusClasses = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "declined":
      case "rejected":
        return "bg-red-100 text-red-700";
      case "pending":
      default:
        return "bg-amber-100 text-amber-700";
    }
  };

  const loggedInSibsId = String(
    user?.sibs_id || user?.sibsId || user?.username || "",
  ).trim();

  return (
    <div className="h-full rounded-xl bg-inherit">
      <div className="hidden lg:block">
        <div ref={tableScrollRef} className="max-h-[620px] overflow-auto">
          <table className="w-full min-w-[1380px] text-sm">
            <thead className="sticky top-0 z-10 bg-gray-100">
              <tr>
                <th className="rounded-tl-xl p-4 text-left">ID</th>

                {user?.tokenType === "admin" && (
                  <th className="p-4 text-left">Employee SIBS ID</th>
                )}

                <th className="p-4 text-left">Notice Date</th>
                <th className="p-4 text-left">Last Working Date</th>
                <th className="p-4 text-left">Reason</th>
                <th className="p-4 text-left">Specify Others</th>
                <th className="p-4 text-left">Uploaded File</th>
                <th className="p-4 text-left">Submitted At</th>
                <th className="p-4 text-left">Status</th>
                <th className="rounded-tr-xl p-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={user?.tokenType === "admin" ? 10 : 9}
                    className="p-6 text-center"
                  >
                    Loading...
                  </td>
                </tr>
              ) : attritions.length === 0 ? (
                <tr>
                  <td
                    colSpan={user?.tokenType === "admin" ? 10 : 9}
                    className="p-6 text-center"
                  >
                    No attrition records found
                  </td>
                </tr>
              ) : (
                attritions.map((item) => {
                  const fileUrl =
                    item.uploadedFile && item.sibsId
                      ? `${process.env.NEXT_PUBLIC_API_URL}/api/resignation/file/${encodeURIComponent(
                          item.sibsId,
                        )}/${encodeURIComponent(item.uploadedFile)}`
                      : "";

                  const isPending =
                    String(item.status || "").toLowerCase() === "pending";

                  const isApprover =
                    String(item.tlSibsId || "").trim() === loggedInSibsId ||
                    String(item.omSibsId || "").trim() === loggedInSibsId ||
                    String(item.somSibsId || "").trim() === loggedInSibsId;

                  const isEditable = isPending && isApprover;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onView?.(item)}
                      className="cursor-pointer border-t transition hover:bg-gray-50"
                    >
                      <td className="p-4 font-medium text-sibs-primary-1">
                        {item.id}
                      </td>

                      {user?.tokenType === "admin" && (
                        <td className="p-4">{item.sibsId || "N/A"}</td>
                      )}

                      <td className="p-4">{formatDate(item.attritionDate)}</td>

                      <td className="p-4">
                        {formatDate(item.lastWorkingDate)}
                      </td>

                      <td className="p-4">{item.reason || "N/A"}</td>

                      <td className="max-w-[240px] p-4">
                        <p className="truncate">
                          {item.specifyOthers || "N/A"}
                        </p>
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
                          {item.status || "Pending"}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onView?.(item);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#D7DEE8] px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                          >
                            <Eye size={14} />
                            View
                          </button>

                          {isEditable && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit?.(item);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-[var(--sibs-primary-1)] px-3 py-2 text-xs font-medium text-white transition hover:opacity-90"
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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
          ) : attritions.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center text-sm">
              No attrition records found
            </div>
          ) : (
            <div className="space-y-3">
              {attritions.map((item) => (
                <MobileAttritionCard
                  key={item.id}
                  item={item}
                  user={user}
                  loggedInSibsId={loggedInSibsId}
                  onView={onView}
                  onEdit={onEdit}
                  getStatusClasses={getStatusClasses}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <TableFooter tableEntity="attrition" totalLabel="Total Attrition" />
    </div>
  );
};

export default AttritionTable;