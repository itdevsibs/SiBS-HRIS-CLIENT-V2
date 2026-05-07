import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock3, Eye, Pencil } from "lucide-react";

import { getMyAttritions } from "../../lib/axios/getAttrition";
import { usePagination } from "@/services/context/PaginationContext";
import { useUser } from "../../services/context/UserContext";
import TableFooter from "./footer/TableFooter";
import { formatDate, formatDateTime } from "@/components/layout/FormatDateTime";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

function getFileType(filename) {
  const ext = filename?.split(".").pop()?.toLowerCase() || "";

  const typeMap = {
    doc: "word",
    docx: "word",
    xls: "excel",
    xlsx: "excel",
    csv: "excel",
    pdf: "pdf",
    jpg: "image",
    jpeg: "image",
    png: "image",
    gif: "image",
    webp: "image",
    svg: "image",
  };

  return typeMap[ext] || "file";
}

function FileTypeIcon({ filename }) {
  const type = getFileType(filename);

  const labelMap = {
    word: "W",
    excel: "X",
    pdf: "PDF",
    image: "IMG",
    file: "FILE",
  };

  const badgeClassMap = {
    word: "bg-blue-600",
    excel: "bg-green-600",
    pdf: "bg-red-600",
    image: "bg-purple-600",
    file: "bg-gray-600",
  };

  return (
    <div className="relative h-12 w-10 shrink-0">
      <div className="absolute inset-0 rounded-md border-2 border-gray-300 bg-white" />
      <div className="absolute right-0 top-0 h-3 w-3 border-b-2 border-l-2 border-gray-300 bg-gray-100" />
      <div className="absolute left-1 top-1/2 h-0.5 w-6 -translate-y-1/2 bg-gray-300" />
      <div className="absolute left-1 top-[60%] h-0.5 w-5 bg-gray-300" />

      <div
        className={`absolute bottom-1 left-[-8px] rounded-md px-2 py-1 text-[10px] font-bold leading-none text-white shadow-sm ${
          badgeClassMap[type] || badgeClassMap.file
        }`}
      >
        {labelMap[type]}
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
      className={`inline-flex min-w-0 max-w-[260px] items-center gap-3 rounded-lg p-1 text-left text-sm text-gray-700 no-underline transition hover:bg-slate-50 hover:text-sibs-primary-1 ${className}`}
      title={`Open ${filename}`}
      onClick={(e) => e.stopPropagation()}
    >
      <FileTypeIcon filename={filename} />

      <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
        {filename}
      </span>
    </a>
  );
}

function getStatusClass(status) {
  const value = String(status || "").trim().toLowerCase();

  if (value === "approved") {
    return "border-green-200 bg-green-100 text-green-700";
  }

  if (value === "declined" || value === "rejected") {
    return "border-red-200 bg-red-100 text-red-600";
  }

  return "border-amber-200 bg-amber-100 text-amber-700";
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${getStatusClass(
        status
      )}`}
    >
      {status || "Pending"}
    </span>
  );
}

function ActionButton({ type = "view", children, onClick }) {
  const isEdit = type === "edit";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition ${
        isEdit
          ? "border border-sibs-primary-1 bg-sibs-primary-1 text-white hover:opacity-90"
          : "border border-[#d7dee8] bg-white text-gray-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function MobileInfo({ label, value, full = false }) {
  return (
    <div
      className={`rounded-[10px] bg-sibs-tertiary-10 p-3 ${
        full ? "col-span-2 max-sm:col-span-1" : ""
      }`}
    >
      <p className="m-0 text-xs font-normal text-sibs-tertiary-5">{label}</p>

      <strong className="mt-1 block break-words text-sm font-medium text-sibs-primary-1">
        {value || "N/A"}
      </strong>
    </div>
  );
}

function MobileAttritionCard({
  item,
  user,
  loggedInSibsId,
  onView,
  onEdit,
}) {
  const fileUrl =
    item.uploadedFile && item.sibsId
      ? `${API_BASE_URL}/api/resignation/file/${encodeURIComponent(
          item.sibsId
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
      className="cursor-pointer rounded-xl border border-[#e6ecf2] bg-white p-4 text-left shadow-sm transition hover:border-sibs-primary-1 hover:bg-slate-50 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-xs font-medium text-sibs-tertiary-5">
            Request ID
          </p>

          <h3 className="m-0 text-sm font-semibold leading-tight text-sibs-primary-1">
            {item.id || "N/A"}
          </h3>

          {user?.tokenType === "admin" && (
            <span className="mt-1 block text-xs text-sibs-tertiary-5">
              Employee SIBS ID: {item.sibsId || "N/A"}
            </span>
          )}
        </div>

        <div className="shrink-0">
          <StatusBadge status={item.status} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <MobileInfo label="Notice Date" value={formatDate(item.attritionDate)} />

        <MobileInfo
          label="Last Working Date"
          value={formatDate(item.lastWorkingDate)}
        />

        <MobileInfo label="Reason" value={item.reason || "N/A"} full />

        <MobileInfo
          label="Specify Others"
          value={item.specifyOthers || "N/A"}
          full
        />

        <div className="col-span-2 rounded-[10px] bg-sibs-tertiary-10 p-3 max-sm:col-span-1">
          <p className="m-0 text-xs font-normal text-sibs-tertiary-5">
            Uploaded File
          </p>

          <div className="mt-2">
            <UploadedFileCell
              filename={item.uploadedFile}
              fileUrl={fileUrl}
              className="w-full max-w-full"
            />
          </div>
        </div>

        <div className="col-span-2 rounded-[10px] bg-sibs-tertiary-10 p-3 max-sm:col-span-1">
          <p className="m-0 text-xs font-normal text-sibs-tertiary-5">
            Submitted At
          </p>

          <div className="mt-1 flex items-center gap-2">
            <Clock3 size={16} className="shrink-0 text-sibs-tertiary-5" />
            <strong className="block text-sm font-medium text-sibs-primary-1">
              {formatDateTime(item.createdAt)}
            </strong>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <ActionButton
          type="view"
          onClick={(e) => {
            e.stopPropagation();
            onView?.(item);
          }}
        >
          <Eye size={14} />
          View
        </ActionButton>

        {isEditable && (
          <ActionButton
            type="edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(item);
            }}
          >
            <Pencil size={14} />
            Edit
          </ActionButton>
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
  const navigate = useNavigate();

  const tableScrollRef = useRef(null);
  const mobileScrollRef = useRef(null);

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
      tableScrollRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollTo({
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
            navigateRef.current("/login");
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

        setAttritions(data);
        setPaginationRef.current?.(
          result.pagination || {
            totalPages: 1,
            currentPage: 1,
            total: data.length,
          }
        );
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

  const loggedInSibsId = String(
    user?.sibs_id || user?.sibsId || user?.username || ""
  ).trim();

  const adminView = user?.tokenType === "admin";
  const colSpan = adminView ? 10 : 9;

  return (
    <div className="min-w-0 overflow-hidden rounded-xl bg-white">
      <div className="hidden lg:block">
        <div ref={tableScrollRef} className="max-h-[620px] overflow-auto">
          <table className="w-full min-w-[1380px] border-collapse bg-white text-sm text-sibs-primary-1">
            <thead className="sticky top-0 z-10 bg-[#f3f4f6]">
              <tr>
                <th className="h-12 whitespace-nowrap px-4 text-left text-sm font-semibold text-sibs-primary-1">
                  ID
                </th>

                {adminView && (
                  <th className="h-12 whitespace-nowrap px-4 text-left text-sm font-semibold text-sibs-primary-1">
                    Employee SIBS ID
                  </th>
                )}

                <th className="h-12 whitespace-nowrap px-4 text-left text-sm font-semibold text-sibs-primary-1">
                  Notice Date
                </th>
                <th className="h-12 whitespace-nowrap px-4 text-left text-sm font-semibold text-sibs-primary-1">
                  Last Working Date
                </th>
                <th className="h-12 whitespace-nowrap px-4 text-left text-sm font-semibold text-sibs-primary-1">
                  Reason
                </th>
                <th className="h-12 whitespace-nowrap px-4 text-left text-sm font-semibold text-sibs-primary-1">
                  Specify Others
                </th>
                <th className="h-12 whitespace-nowrap px-4 text-left text-sm font-semibold text-sibs-primary-1">
                  Uploaded File
                </th>
                <th className="h-12 whitespace-nowrap px-4 text-left text-sm font-semibold text-sibs-primary-1">
                  Submitted At
                </th>
                <th className="h-12 whitespace-nowrap px-4 text-left text-sm font-semibold text-sibs-primary-1">
                  Status
                </th>
                <th className="h-12 whitespace-nowrap px-4 text-center text-sm font-semibold text-sibs-primary-1">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={colSpan}
                    className="h-24 text-center text-sm text-sibs-tertiary-5"
                  >
                    Loading...
                  </td>
                </tr>
              ) : attritions.length === 0 ? (
                <tr>
                  <td
                    colSpan={colSpan}
                    className="h-24 text-center text-sm text-sibs-tertiary-5"
                  >
                    No attrition records found
                  </td>
                </tr>
              ) : (
                attritions.map((item) => {
                  const fileUrl =
                    item.uploadedFile && item.sibsId
                      ? `${API_BASE_URL}/api/resignation/file/${encodeURIComponent(
                          item.sibsId
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
                      className="cursor-pointer transition hover:bg-slate-50"
                    >
                      <td className="h-[58px] whitespace-nowrap border-t border-[#e6ecf2] px-4 text-sm font-medium text-sibs-primary-1">
                        {item.id || "N/A"}
                      </td>

                      {adminView && (
                        <td className="h-[58px] whitespace-nowrap border-t border-[#e6ecf2] px-4 text-sm text-sibs-primary-1">
                          {item.sibsId || "N/A"}
                        </td>
                      )}

                      <td className="h-[58px] whitespace-nowrap border-t border-[#e6ecf2] px-4 text-sm text-sibs-primary-1">
                        {formatDate(item.attritionDate)}
                      </td>

                      <td className="h-[58px] whitespace-nowrap border-t border-[#e6ecf2] px-4 text-sm text-sibs-primary-1">
                        {formatDate(item.lastWorkingDate)}
                      </td>

                      <td className="h-[58px] whitespace-nowrap border-t border-[#e6ecf2] px-4 text-sm text-sibs-primary-1">
                        {item.reason || "N/A"}
                      </td>

                      <td className="h-[58px] max-w-[240px] whitespace-nowrap border-t border-[#e6ecf2] px-4 text-sm text-sibs-primary-1">
                        <p className="m-0 max-w-[240px] overflow-hidden text-ellipsis whitespace-nowrap">
                          {item.specifyOthers || "N/A"}
                        </p>
                      </td>

                      <td className="h-[58px] whitespace-nowrap border-t border-[#e6ecf2] px-4 text-sm text-sibs-primary-1">
                        <UploadedFileCell
                          filename={item.uploadedFile}
                          fileUrl={fileUrl}
                        />
                      </td>

                      <td className="h-[58px] whitespace-nowrap border-t border-[#e6ecf2] px-4 text-sm text-sibs-primary-1">
                        <div className="inline-flex items-center gap-2">
                          <Clock3
                            size={16}
                            className="shrink-0 text-sibs-tertiary-5"
                          />
                          <span>{formatDateTime(item.createdAt)}</span>
                        </div>
                      </td>

                      <td className="h-[58px] whitespace-nowrap border-t border-[#e6ecf2] px-4 text-sm">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="h-[58px] whitespace-nowrap border-t border-[#e6ecf2] px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <ActionButton
                            type="view"
                            onClick={(e) => {
                              e.stopPropagation();
                              onView?.(item);
                            }}
                          >
                            <Eye size={14} />
                            View
                          </ActionButton>

                          {isEditable && (
                            <ActionButton
                              type="edit"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit?.(item);
                              }}
                            >
                              <Pencil size={14} />
                              Edit
                            </ActionButton>
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

      <div className="block lg:hidden">
        <div ref={mobileScrollRef} className="max-h-[620px] overflow-y-auto p-3">
          {loading ? (
            <div className="rounded-xl bg-white p-6 text-center text-sm text-sibs-tertiary-5">
              Loading...
            </div>
          ) : attritions.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center text-sm text-sibs-tertiary-5">
              No attrition records found
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {attritions.map((item) => (
                <MobileAttritionCard
                  key={item.id}
                  item={item}
                  user={user}
                  loggedInSibsId={loggedInSibsId}
                  onView={onView}
                  onEdit={onEdit}
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