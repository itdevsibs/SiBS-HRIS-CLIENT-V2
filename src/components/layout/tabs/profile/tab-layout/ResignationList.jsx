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
          }
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
  }, [
    page,
    search,
    statusFilter,
    refreshKey,
    limit,
    setLoading,
    setPagination,
  ]);

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
        return "bg-gray-100 text-gray-500";

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

  const containerStyle =
    Number(maxHeight) > 0
      ? {
          height: maxHeight,
          minHeight: 480,
        }
      : {
          minHeight: 520,
        };

  return (
    <div
      className="flex w-full min-w-0 flex-col overflow-hidden rounded-[22px] border border-[#D9E2EC] bg-white shadow-sm"
      style={containerStyle}
    >
      {/* HEADER */}
      <div className="shrink-0 border-b border-[#E6ECF2] bg-white px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold leading-tight text-sibs-primary-1 sm:text-[28px]">
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
                className="h-10 w-full rounded-xl border border-[#D7DEE8] bg-white pl-9 pr-3 text-sm text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-[var(--sibs-primary-1)] sm:w-[220px]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-[#D7DEE8] bg-white px-3 text-sm text-sibs-primary-1 outline-none transition focus:border-[var(--sibs-primary-1)]"
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

      {/* LIST */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-5">
        {loading ? (
          <EmptyState text="Loading resignation records..." />
        ) : data.length === 0 ? (
          <EmptyState text="No resignation records found." />
        ) : (
          <div className="space-y-4">
            {data.map((item, index) => (
              <div
                key={item.id}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOpenView(item);
                  }
                }}
                className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-base font-bold text-sibs-primary-1">
                        {item.reason || "Resignation Request"}
                      </h3>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                          item.status
                        )}`}
                      >
                        {item.status || "Pending"}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-sibs-tertiary-5">
                      Resignation Request No. {data.length - index}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <ActionButton
                      icon={Pencil}
                      label="Edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenEditResignationModal(true);
                        setResignationId(item.id);
                      }}
                    />

                    <ActionButton
                      icon={Eye}
                      label="View Attrition"
                      disabled={
                        !item.status || item.status.toLowerCase() === "pending"
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenView(item);
                      }}
                    />

                    <ActionButton
                      icon={Paperclip}
                      label="Attachments"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_360px]">
                  <DateCard
                    title="Notice Date"
                    value={formatDate(
                      item.attritionDate ||
                        item.resignationDate ||
                        item.resignation_date
                    )}
                  />

                  <DateCard
                    title="Last Working Date"
                    value={formatDate(
                      item.extendedLastWorkingDate ||
                        item.extended_last_working_date ||
                        item.lastWorkingDate ||
                        item.last_working_date
                    )}
                  />

                  <div className="grid gap-3">
                    <StatusCard
                      icon={UserCheck}
                      title="Attrition Status"
                      value={item.status || "Not Attrited"}
                      className={getStatusClasses(item.status)}
                    />

                    <StatusCard
                      icon={Undo2}
                      title="Retract Status"
                      value={
                        item.retractStatus ||
                        item.retract_status ||
                        "No Retraction Request"
                      }
                      className={getStatusClasses(
                        item.retractStatus ||
                          item.retract_status ||
                          "No Retraction Request"
                      )}
                    />
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

      <div className="shrink-0 border-t border-[#E6ECF2] bg-white">
        <TableFooter tableEntity={ENTITY} totalLabel="Total Resignations" />
      </div>
    </div>
  );
};

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#D7DEE8] bg-white p-8 text-center text-sm text-sibs-tertiary-5">
      {text}
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center gap-1 rounded-lg border border-[#D7DEE8] bg-white px-3 text-sm font-medium text-sibs-primary-1 transition hover:bg-[var(--sibs-tertiary-10)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function DateCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <div className="flex items-center gap-2 text-sibs-primary-1">
        <CalendarDays size={15} />
        <p className="text-xs font-semibold uppercase tracking-wide">
          {title}
        </p>
      </div>

      <p className="mt-2 text-sm font-medium text-sibs-primary-1">
        {value || "N/A"}
      </p>
    </div>
  );
}

function StatusCard({ icon: Icon, title, value, className }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E6ECF2] bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-sibs-primary-1">
        <Icon size={18} />
        <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
      </div>

      <span
        className={`inline-flex shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${className}`}
      >
        {value || "N/A"}
      </span>
    </div>
  );
}

export default ResignationList;