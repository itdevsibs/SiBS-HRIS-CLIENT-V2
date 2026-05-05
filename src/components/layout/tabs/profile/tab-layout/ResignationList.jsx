import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Paperclip,
  Pencil,
  CalendarDays,
  UserCheck,
  Eye,
  Undo2,
} from "lucide-react";
import TableFooter from "../../../../tables/footer/TableFooter";
import { getMyResignation } from "@/lib/axios/getResignation";
import { usePagination } from "@/services/context/PaginationContext";
import { useResignationList } from "@/services/context/ResignationListContext";
import AttritionModal from "@/components/modals/attrition/AttritionModal";
import {
  formatDate,
  formatDateTime,
} from "@/components/layout/FormatDateTime";

const ENTITY = "resignation-list";

const ResignationList = ({ maxHeight }) => {
  const [statusFilter, setStatusFilter] = useState("");

  const {
    page,
    search,
    searchInput,
    loading,
    pagination,
    setPagination,
    setLoading,
    setSearchInput,
    handleSearchKeyDown,
  } = usePagination(ENTITY);

  const { refreshKey, setOpenEditResignationModal, setResignationId } =
    useResignationList();

  const [data, setData] = useState([]);

  const [viewModal, setViewModal] = useState({
    open: false,
    data: null,
  });

  const limit = pagination?.limit || 15;

  useEffect(() => {
    let isMounted = true;

    const fetchMyResignation = async () => {
      try {
        setLoading(true);

        const result = await getMyResignation({
          page,
          limit,
          search,
          status: statusFilter,
        });

        if (!isMounted) return;

        setData(result?.data || []);
        setPagination(
          result?.pagination || {
            totalPages: 1,
            currentPage: 1,
            total: 0,
            limit,
          },
        );
      } catch (error) {
        console.error("My resignation fetch error:", error);

        if (!isMounted) return;

        setData([]);
        setPagination({
          totalPages: 1,
          currentPage: 1,
          total: 0,
          limit,
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMyResignation();

    return () => {
      isMounted = false;
    };
  }, [page, search, statusFilter, refreshKey, limit]);

  const getStatusClasses = (status) => {
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
        return "bg-blue-100 text-blue-700";

      case "no retraction request":
      case "no attrition record":
      case "no record":
      case "no request":
      case "not attrited":
        return "bg-gray-100 text-gray-400";

      case "pending":
      default:
        return "status-late";
    }
  };

  const handleOpenView = (item) => {
    setViewModal({
      open: true,
      data: {
        ...item,

        id: item.attritionId || item.id,
        resignationId: item.id,

        sibsId: item.sibsId || "",
        employeeName: item.employeeName || "",
        fullName: item.employeeName || item.fullName || "",

        resignationType: item.resignationType || "",

        attritionDate:
          item.attritionDate ||
          item.resignationDate ||
          item.resignation_date ||
          "",

        resignationDate:
          item.attritionDate ||
          item.resignationDate ||
          item.resignation_date ||
          "",

        lastWorkingDate:
          item.extendedLastWorkingDate ||
          item.extended_last_working_date ||
          item.lastWorkingDate ||
          item.last_working_date ||
          "",

        reason: item.reason || "",
        specifyOthers: item.specifyOthers || item.specify_others || "",
        uploadedFile: item.uploadedFile || item.uploaded_file || "",

        status: item.status || "Pending",
        managerApproval: item.managerApproval || "N/A",

        tlSibsId: item.tlSibsId || item.tl_sibs_id || "",
        tlFullName: item.tlFullName || "",
        tlIsApproved: Number(item.tlIsApproved || item.tl_is_approved || 0),
        tlIsDeclined: Number(item.tlIsDeclined || item.tl_is_declined || 0),
        tlRemarks: item.tlRemarks || item.tl_remarks || "",

        omSibsId: item.omSibsId || item.om_sibs_id || "",
        omFullName: item.omFullName || "",
        omIsApproved: Number(item.omIsApproved || item.om_is_approved || 0),
        omIsDeclined: Number(item.omIsDeclined || item.om_is_declined || 0),
        omRemarks: item.omRemarks || item.om_remarks || "",

        somSibsId: item.somSibsId || item.som_sibs_id || "",
        somFullName: item.somFullName || "",
        somIsApproved: Number(item.somIsApproved || item.som_is_approved || 0),
        somIsDeclined: Number(item.somIsDeclined || item.som_is_declined || 0),
        somRemarks: item.somRemarks || item.som_remarks || "",

        createdAt: item.createdAt || item.created_at || "",
        updatedAt: item.updatedAt || item.updated_at || "",
      },
    });
  };

  const totalCasesLabel = useMemo(() => {
    const total = Number(pagination?.total || 0);
    return `${total} case${total !== 1 ? "s" : ""} found`;
  }, [pagination?.total]);

  return (
    <div
      className="flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm"
      style={{ height: maxHeight }}
    >
      <div className="shrink-0 border-b border-[#E6ECF2] bg-white px-5 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[28px] font-semibold leading-none text-sibs-primary-1">
              Resignation Cases
            </h2>
            <p className="mt-2 text-sm text-sibs-tertiary-5">
              {totalCasesLabel}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
              />
              <input
                type="text"
                placeholder="Search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="h-10 w-full rounded-xl border border-[#D7DEE8] bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[var(--sibs-primary-1)] sm:w-[220px]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-[#D7DEE8] bg-white px-3 text-sm outline-none transition focus:border-[var(--sibs-primary-1)]"
            >
              <option value="">Filter Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Declined">Declined</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100 p-5">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-[#D7DEE8] p-8 text-center text-sm text-sibs-tertiary-5">
            Loading attrition records...
          </div>
        ) : data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D7DEE8] p-8 text-center text-sm text-sibs-tertiary-5">
            No attrition records found.
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item, index) => (
              <div
                key={item.id}
                // role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOpenView(item);
                  }
                }}
                className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-base font-semibold text-sibs-primary-1">
                        {item.reason}
                      </h3>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                          item.status,
                        )}`}
                      >
                        {item.status || "Pending"}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-sibs-tertiary-5">
                      Resignation Request No.{data.length - index}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenEditResignationModal(true);
                        setResignationId(item.id);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#D7DEE8] px-3 py-2 text-sm font-medium text-sibs-primary-1 transition hover:bg-[var(--sibs-tertiary-10)]"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        // setOpenViewAttritionModal(true);
                        handleOpenView(item);
                      }}
                      disabled={
                        !item.status || item.status.toLowerCase() === "pending"
                      }
                      className="inline-flex items-center gap-1 rounded-lg border
                       border-[#D7DEE8] px-3 py-2 text-sm font-medium
                        text-sibs-primary-1 transition hover:bg-[var(--sibs-tertiary-10)]
                        disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Eye size={14} />
                      View Attrition
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#D7DEE8] px-3 py-2 text-sm font-medium text-sibs-primary-1 transition hover:bg-[var(--sibs-tertiary-10)]"
                    >
                      <Paperclip size={14} />
                      Attachments
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_360px]">
                  <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                    <div className="flex items-center gap-2 text-sibs-primary-1">
                      <CalendarDays size={15} />
                      <p className="text-xs font-semibold uppercase tracking-wide">
                        Notice Date
                      </p>
                    </div>

                    <p className="mt-2 text-sm font-medium text-sibs-primary-1">
                      {formatDate(
                        item.attritionDate ||
                          item.resignationDate ||
                          item.resignation_date,
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                    <div className="flex items-center gap-2 text-sibs-primary-1">
                      <CalendarDays size={15} />
                      <p className="text-xs font-semibold uppercase tracking-wide">
                        Last Working Date
                      </p>
                    </div>

                    <p className="mt-2 text-sm font-medium text-sibs-primary-1">
                      {formatDate(
                        item.extendedLastWorkingDate ||
                          item.extended_last_working_date ||
                          item.lastWorkingDate ||
                          item.last_working_date,
                      )}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E6ECF2] bg-white px-4 py-3">
                      <div className="flex items-center gap-2 text-sibs-primary-1">
                        <UserCheck size={18} />
                        <p className="text-xs font-semibold uppercase tracking-wide">
                          Attrition Status
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                          item.status,
                        )}`}
                      >
                        {item.status || "Not Attrited"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E6ECF2] bg-white px-4 py-3">
                      <div className="flex items-center gap-2 text-sibs-primary-1">
                        <Undo2 size={18} />
                        <p className="text-xs font-semibold uppercase tracking-wide">
                          Retract Status
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                          item.retractStatus ||
                            item.retract_status ||
                            "No Retraction Request",
                        )}`}
                      >
                        {item.retractStatus ||
                          item.retract_status ||
                          "No Retraction Request"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AttritionModal
        mode="view"
        open={viewModal.open}
        data={viewModal.data}
        onClose={() =>
          setViewModal({
            open: false,
            data: null,
          })
        }
        formatDate={formatDate}
        formatDateTime={formatDateTime}
      />

      <div className="shrink-0">
        <TableFooter tableEntity={ENTITY} totalLabel="Total Resignations" />
      </div>
    </div>
  );
};

export default ResignationList;
