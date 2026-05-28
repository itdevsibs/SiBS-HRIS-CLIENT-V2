import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock3, Eye, Pencil } from "lucide-react";

import { getMyAttritions } from "../../lib/axios/getAttrition";
import { usePagination } from "@/services/context/PaginationContext";
import { useUser } from "../../services/context/UserContext";
import PaginationTable from "@/services/pagination/PaginationTable";
import { formatDate, formatDateTime } from "@/components/layout/FormatDateTime";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
const PAGE_LIMIT = 15;

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
    <div className="relative h-12 w-10 shrink-0" draggable={false}>
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

function getUploadedFileUrl(item) {
  if (!item?.uploadedFile || !item?.sibsId) return "";

  return `${API_BASE_URL}/api/resignation/file/${encodeURIComponent(
    item.sibsId,
  )}/${encodeURIComponent(item.uploadedFile)}`;
}

function UploadedFileCell({ filename, fileUrl, className = "" }) {
  if (!filename || !fileUrl) {
    return <span className="text-sm font-semibold text-gray-400">N/A</span>;
  }

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      draggable={false}
      data-no-table-drag="true"
      className={`flex min-w-0 items-center gap-3 rounded-lg p-1 text-left text-sm font-semibold text-[#344054] no-underline transition hover:bg-slate-50 hover:text-sibs-primary-1 ${className}`}
      title={`Open ${filename}`}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <FileTypeIcon filename={filename} />

      <span
        draggable={false}
        data-no-table-drag="true"
        className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
      >
        {filename}
      </span>
    </a>
  );
}

function getStatusClass(status) {
  const value = String(status || "").trim().toLowerCase();

  if (value === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-600";
  }

  if (value === "declined" || value === "rejected") {
    return "border-red-200 bg-red-50 text-red-600";
  }

  return "border-amber-200 bg-amber-50 text-amber-600";
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
        status,
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
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
        isEdit
          ? "border border-sibs-primary-1 bg-sibs-primary-1 text-white hover:opacity-90"
          : "border border-[#E6ECF2] bg-white text-sibs-primary-1 hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5"
      }`}
    >
      {children}
    </button>
  );
}

function MobileInfo({ label, value, full = false }) {
  return (
    <div
      className={`rounded-xl border border-[#E6ECF2] bg-slate-50 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm ${
        full ? "col-span-2 max-sm:col-span-1" : ""
      }`}
    >
      <p className="m-0 text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <strong className="mt-1 block break-words text-sm font-bold text-sibs-primary-1">
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
  const fileUrl = getUploadedFileUrl(item);

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
      className="sibs-page-card-in cursor-pointer rounded-xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-xs font-semibold text-sibs-tertiary-5">
            Request ID
          </p>

          <h3 className="m-0 text-sm font-bold leading-tight text-sibs-primary-1">
            {item.id || "N/A"}
          </h3>

          {user?.tokenType === "admin" && (
            <span className="mt-1 block text-xs font-semibold text-sibs-tertiary-5">
              Employee SiBS ID: {item.sibsId || "N/A"}
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

        <div className="col-span-2 rounded-xl border border-[#E6ECF2] bg-slate-50 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm max-sm:col-span-1">
          <p className="m-0 text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
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

        <div className="col-span-2 rounded-xl border border-[#E6ECF2] bg-slate-50 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm max-sm:col-span-1">
          <p className="m-0 text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
            Submitted At
          </p>

          <div className="mt-1 flex items-center gap-2">
            <Clock3 size={16} className="shrink-0 text-sibs-tertiary-5" />

            <strong className="block text-sm font-bold text-sibs-primary-1">
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

export default function AttritionTable({ reloadKey = 0, onView, onEdit }) {
  const [attritions, setAttritions] = useState([]);
  const [isDraggingTable, setIsDraggingTable] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");

  const paginationContext = usePagination("attrition");

  const {
    page = 1,
    search = "",
    searchInput = "",
    setSearchInput,
    handleSearchKeyDown,
    loading,
    setLoading,
    setPagination,
    pagination,
    setPage,
    setCurrentPage,
    handlePageChange,
  } = paginationContext;

  const { user } = useUser();
  const navigate = useNavigate();

  const tableScrollRef = useRef(null);
  const mobileScrollRef = useRef(null);

  const setLoadingRef = useRef(setLoading);
  const setPaginationRef = useRef(setPagination);
  const navigateRef = useRef(navigate);

  const dragStateRef = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  const loggedInSibsId = String(
    user?.sibs_id || user?.sibsId || user?.username || "",
  ).trim();

  const adminView = user?.tokenType === "admin";
  const colSpan = adminView ? 10 : 9;

  const safePagination = pagination || {
    currentPage: page || 1,
    totalPages: 1,
    total: 0,
    limit: PAGE_LIMIT,
  };

  const currentPage = Number(safePagination.currentPage || page || 1);
  const totalPages = Math.max(Number(safePagination.totalPages || 1), 1);
  const totalRecords = Number(safePagination.total || 0);
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const displayedAttritions = useMemo(() => {
    if (statusFilter === "All") return attritions;

    return attritions.filter(
      (item) =>
        String(item.status || "")
          .trim()
          .toLowerCase() === statusFilter.toLowerCase(),
    );
  }, [attritions, statusFilter]);

  useEffect(() => {
    setLoadingRef.current = setLoading;
    setPaginationRef.current = setPagination;
    navigateRef.current = navigate;
  }, [setLoading, setPagination, navigate]);

  useEffect(() => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }

    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }
  }, [page, statusFilter]);

  useEffect(() => {
    let cancelled = false;

    const fetchAttritions = async () => {
      try {
        setLoadingRef.current?.(true);

        const result = await getMyAttritions(page, search, {
          status: statusFilter,
        });

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
            limit: PAGE_LIMIT,
          });

          return;
        }

        const data = result.data || [];

        setAttritions(data);

        setPaginationRef.current?.(
          result.pagination || {
            totalPages: 1,
            currentPage: page,
            total: data.length,
            limit: PAGE_LIMIT,
          },
        );
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to load attritions:", error);

        setAttritions([]);
        setPaginationRef.current?.({
          totalPages: 1,
          currentPage: 1,
          total: 0,
          limit: PAGE_LIMIT,
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
  }, [page, search, reloadKey, statusFilter]);

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

  function handlePreviousPage() {
    if (loading || !hasPreviousPage) return;
    goToPage(currentPage - 1);
  }

  function handleNextPage() {
    if (loading || !hasNextPage) return;
    goToPage(currentPage + 1);
  }

  function handleStatusChange(nextStatus) {
    setStatusFilter(nextStatus);
    goToPage(1);
  }

  function handleAttritionSearchKeyDown(e) {
    if (typeof handleSearchKeyDown === "function") {
      handleSearchKeyDown(e);
    }

    if (e.key === "Enter") {
      goToPage(1);
    }
  }

  function handleDragStart(e) {
    if (e.button !== 0) return;

    const target = e.target;

    const isInteractiveElement = target.closest(
      "button, a, input, select, textarea, [data-no-table-drag='true']",
    );

    if (isInteractiveElement) return;

    const container = tableScrollRef.current;
    if (!container) return;

    dragStateRef.current = {
      isDown: true,
      startX: e.pageX - container.offsetLeft,
      scrollLeft: container.scrollLeft,
      moved: false,
    };

    setIsDraggingTable(true);
  }

  function handleDragMove(e) {
    const container = tableScrollRef.current;
    const dragState = dragStateRef.current;

    if (!dragState.isDown || !container) return;

    e.preventDefault();

    const x = e.pageX - container.offsetLeft;
    const walk = (x - dragState.startX) * 1.4;

    if (Math.abs(walk) > 4) {
      dragStateRef.current.moved = true;
    }

    container.scrollLeft = dragState.scrollLeft - walk;
  }

  function handleDragEnd() {
    dragStateRef.current.isDown = false;

    window.setTimeout(() => {
      setIsDraggingTable(false);
      dragStateRef.current.moved = false;
    }, 0);
  }

  function handleRowView(item) {
    if (dragStateRef.current.moved) return;
    onView?.(item);
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-xl bg-white">
      <div className="p-4 sm:p-5">
        <PaginationTable
          title="Attrition Records"
          subtitle="Only 15 attrition records are loaded from the backend per page."
          loading={loading}
          searchValue={searchInput}
          searchPlaceholder="Search then press Enter"
          onSearchChange={(value) => setSearchInput?.(value)}
          onSearchKeyDown={handleAttritionSearchKeyDown}
          filters={[
            {
              key: "status",
              value: statusFilter,
              onChange: handleStatusChange,
              options: [
                { label: "All Status", value: "All" },
                { label: "Pending", value: "Pending" },
                { label: "Approved", value: "Approved" },
                { label: "Rejected", value: "Rejected" },
                { label: "Declined", value: "Declined" },
              ],
            },
          ]}
          showPagination={false}
          className="mb-5"
        />

        <div className="hidden overflow-hidden rounded-xl border border-[#E6ECF2] lg:block">
          <div
            ref={tableScrollRef}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            className={`max-h-[620px] overflow-auto select-none ${
              isDraggingTable ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            <table className="w-full min-w-[1380px] table-fixed border-collapse bg-white">
              <colgroup>
                <col className="w-[100px]" />
                {adminView && <col className="w-[150px]" />}
                <col className="w-[170px]" />
                <col className="w-[190px]" />
                <col className="w-[220px]" />
                <col className="w-[220px]" />
                <col className="w-[280px]" />
                <col className="w-[190px]" />
                <col className="w-[130px]" />
                <col className="w-[190px]" />
              </colgroup>

              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    ID
                  </th>

                  {adminView && (
                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Employee SiBS ID
                    </th>
                  )}

                  <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Notice Date
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Last Working Date
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Reason
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Specify Others
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Uploaded File
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Submitted At
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Status
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody key={`${page}-${search}-${statusFilter}-${loading}`}>
                {loading ? (
                  Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                    <tr key={index}>
                      <td
                        colSpan={colSpan}
                        className="border-t border-[#f3f4f6] px-5 py-4"
                      >
                        <div className="h-5 w-full animate-sibs-pulse rounded bg-gray-200" />
                      </td>
                    </tr>
                  ))
                ) : displayedAttritions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={colSpan}
                      className="border-t border-[#f3f4f6] p-10 text-center text-sm font-bold text-gray-500"
                    >
                      No attrition records found.
                    </td>
                  </tr>
                ) : (
                  displayedAttritions.map((item) => {
                    const fileUrl = getUploadedFileUrl(item);

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
                        onClick={() => handleRowView(item)}
                        className="cursor-pointer transition-all duration-200 hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-sibs-primary-1">
                          {item.id || "N/A"}
                        </td>

                        {adminView && (
                          <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-sibs-primary-1">
                            {item.sibsId || "N/A"}
                          </td>
                        )}

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                          {formatDate(item.attritionDate)}
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                          {formatDate(item.lastWorkingDate)}
                        </td>

                        <td className="border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                          <p className="m-0 overflow-hidden text-ellipsis whitespace-nowrap">
                            {item.reason || "N/A"}
                          </p>
                        </td>

                        <td className="border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                          <p className="m-0 overflow-hidden text-ellipsis whitespace-nowrap">
                            {item.specifyOthers || "N/A"}
                          </p>
                        </td>

                        <td className="border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                          <UploadedFileCell
                            filename={item.uploadedFile}
                            fileUrl={fileUrl}
                          />
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                          <div className="inline-flex items-center gap-2">
                            <Clock3
                              size={16}
                              className="shrink-0 text-sibs-tertiary-5"
                            />

                            <span>{formatDateTime(item.createdAt)}</span>
                          </div>
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center">
                          <StatusBadge status={item.status} />
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center">
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

          <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
            Hold left click and drag left or right to scroll the table.
          </p>
        </div>

        <div className="block lg:hidden">
          <div ref={mobileScrollRef} className="max-h-[620px] overflow-y-auto">
            {loading ? (
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-6 text-center text-sm font-bold text-gray-500">
                Loading...
              </div>
            ) : displayedAttritions.length === 0 ? (
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-6 text-center text-sm font-bold text-gray-500">
                No attrition records found.
              </div>
            ) : (
              <div
                key={`${page}-${search}-${statusFilter}`}
                className="flex flex-col gap-3"
              >
                {displayedAttritions.map((item) => (
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

        <PaginationTable
          loading={loading}
          showSearch={false}
          showPagination
          currentPage={currentPage}
          totalPages={totalPages}
          loadedCount={displayedAttritions.length}
          totalRecords={totalRecords}
          recordLabel="attrition records"
          onPrevious={handlePreviousPage}
          onNext={handleNextPage}
        />
      </div>
    </div>
  );
}