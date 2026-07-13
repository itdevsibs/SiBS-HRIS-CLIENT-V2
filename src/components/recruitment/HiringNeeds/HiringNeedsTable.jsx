import React, { useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useHiringNeeds } from "../../../services/context/HiringNeedsContext";
import { usePagination } from "../../../services/context/PaginationContext";
import HiringNeedsMobileCard from "./HiringNeedsMobileCard";

function cleanText(value) {
  return String(value ?? "").trim();
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

function formatDateRange(startDate, endDate) {
  const start = formatDate(startDate);
  const end = formatDate(endDate);

  if (start !== "—" && end !== "—") return `${start} - ${end}`;
  if (start !== "—") return start;
  if (end !== "—") return end;

  return "—";
}

function getStatusClass(status) {
  switch (status) {
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Not Approved":
    case "Rejected":
      return "border-red-200 bg-red-50 text-red-700";
    case "For Approval":
    case "Pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getRequestType(item = {}) {
  const type = cleanText(item.requestType || item.request_type).toLowerCase();

  if (type === "downsize") return "Downsize";
  if (type === "requisition") return "Requisition";

  return "Requisition";
}

function getRequestTypeClass(type) {
  if (type === "Downsize") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-blue-100 bg-blue-50 text-sibs-primary-1";
}

function getApprovalStatus(item = {}) {
  return cleanText(item.approvalStatus || item.approval_status || "For Approval");
}

function getDepartmentAccount(item = {}) {
  return (
    cleanText(item.departmentAccount || item.department_account) ||
    [item.departmentName || item.department_name || item.department, item.accountName || item.account_name || item.account]
      .map(cleanText)
      .filter(Boolean)
      .join(" / ") ||
    "—"
  );
}

function getJobTitle(item = {}) {
  const requestType = getRequestType(item);

  if (requestType === "Downsize") {
    return (
      cleanText(item.positionTitle || item.position_title) ||
      cleanText(item.roleTitle || item.role_title) ||
      "Downsize Request"
    );
  }

  return (
    cleanText(item.jobDescriptionTitle || item.job_description_title) ||
    cleanText(item.positionTitle || item.position_title) ||
    cleanText(item.roleTitle || item.role_title) ||
    "—"
  );
}

function getJobSubtitle(item = {}) {
  const requestType = getRequestType(item);

  if (requestType === "Downsize") {
    return (
      cleanText(item.weeklyWeekDateRange || item.weekly_week_date_range) ||
      formatDateRange(
        item.weeklyWeekStart || item.weekly_week_start,
        item.weeklyWeekEnd || item.weekly_week_end,
      )
    );
  }

  return cleanText(item.jdCode || item.jd_code || item.jobDescriptionCode || item.job_description_code) || "—";
}

function getHeadcount(item = {}) {
  return (
    item.headcount ??
    item.requiredHeadcount ??
    item.required_headcount ??
    item.approvedRequirement ??
    item.approved_requirement ??
    "—"
  );
}

function getReason(item = {}) {
  const requestType = getRequestType(item);

  if (requestType === "Downsize") {
    return (
      cleanText(item.downsizeReason || item.downsize_reason) ||
      cleanText(item.reasonForHiring || item.reason_for_hiring) ||
      cleanText(item.reason) ||
      "—"
    );
  }

  return (
    cleanText(item.reasonForHiring || item.reason_for_hiring) ||
    cleanText(item.reason) ||
    "—"
  );
}

function getLocationSite(item = {}) {
  return cleanText(item.locationSite || item.location_site) || "—";
}

function getDateNeeded(item = {}) {
  const requestType = getRequestType(item);

  if (requestType === "Downsize") {
    return (
      cleanText(item.weeklyWeekDateRange || item.weekly_week_date_range) ||
      formatDateRange(
        item.weeklyWeekStart || item.weekly_week_start,
        item.weeklyWeekEnd || item.weekly_week_end,
      )
    );
  }

  return formatDate(item.dateNeeded || item.date_needed || item.dueDate || item.due_date);
}

export default function HiringNeedsTable({ onView }) {
  const { list, loading } = useHiringNeeds();
  const { page, setPage, setPagination, pagination, search, filterValues } =
    usePagination("hiring-needs");

  const limit = pagination?.limit || 15;

  const filteredList = useMemo(() => {
    const keyword = cleanText(search).toLowerCase();
    const statusF = filterValues?.status || "All";
    const siteF = filterValues?.site || "All";
    const reasonF = filterValues?.reason || "All";

    return list.filter((item) => {
      const requestType = getRequestType(item);
      const approvalStatus = getApprovalStatus(item);
      const locationSite = getLocationSite(item);
      const reason = getReason(item);

      const searchableText = [
        item.id,
        requestType,
        item.positionTitle,
        item.position_title,
        item.roleTitle,
        item.role_title,
        item.jobDescriptionTitle,
        item.job_description_title,
        item.jdCode,
        item.jd_code,
        item.departmentAccount,
        item.department_account,
        item.department,
        item.departmentName,
        item.department_name,
        item.account,
        item.accountName,
        item.account_name,
        item.downsizeReason,
        item.downsize_reason,
        item.reasonForHiring,
        item.reason_for_hiring,
        item.reason,
        item.weeklyWeekDateRange,
        item.weekly_week_date_range,
      ]
        .map(cleanText)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);
      const matchesStatus = statusF === "All" || approvalStatus === statusF;
      const matchesSite = siteF === "All" || locationSite === siteF;
      const matchesReason = reasonF === "All" || reason === reasonF;

      return matchesSearch && matchesStatus && matchesSite && matchesReason;
    });
  }, [list, search, filterValues]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredList.slice(start, start + limit);
  }, [filteredList, page, limit]);

  useEffect(() => {
    setPagination({
      total: filteredList.length,
      totalPages: Math.ceil(filteredList.length / limit) || 1,
    });
  }, [filteredList.length, limit, setPagination]);

  const totalPages = Math.ceil(filteredList.length / limit) || 1;

  return (
    <div className="px-4 pb-5 pt-6 sm:px-6 sm:pb-6 sm:pt-7">
      <div className="space-y-3 lg:hidden">
        {loading ? (
          <div className="py-12 text-center text-sm font-bold text-gray-500">
            Loading...
          </div>
        ) : paginatedData.length > 0 ? (
          paginatedData.map((item) => (
            <HiringNeedsMobileCard key={item.id} item={item} onView={onView} />
          ))
        ) : (
          <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
            No records found.
          </div>
        )}
      </div>

      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1550px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left">
            <thead>
              <tr className="whitespace-nowrap bg-[#F5F7FA] text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
                <th className="px-5 py-4 first:rounded-tl-2xl">ID</th>
                <th className="px-5 py-4">Request Type</th>
                <th className="px-5 py-4">Department / Account</th>
                <th className="px-5 py-4">Job Description / Request</th>
                <th className="px-5 py-4 text-center">Headcount</th>
                <th className="px-5 py-4">Reason</th>
                <th className="px-5 py-4">Location / Site</th>
                <th className="px-5 py-4">Date Needed / Week</th>
                <th className="px-5 py-4 text-center">Approval</th>
                <th className="px-5 py-4 text-right last:rounded-tr-2xl">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item) => {
                  const requestType = getRequestType(item);
                  const approvalStatus = getApprovalStatus(item);

                  return (
                    <tr key={item.id} className="transition hover:bg-[#FAFBFC]">
                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-bold text-sibs-primary-1">
                        {item.id}
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold ${getRequestTypeClass(
                            requestType,
                          )}`}
                        >
                          {requestType}
                        </span>
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-bold text-[#101828]">
                        {getDepartmentAccount(item)}
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5">
                        <p className="text-sm font-bold text-[#101828]">
                          {getJobTitle(item)}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                          {getJobSubtitle(item)}
                        </p>
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold text-sibs-primary-1">
                        {getHeadcount(item)}
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                        {getReason(item)}
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                        {getLocationSite(item)}
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                        {getDateNeeded(item)}
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold ${getStatusClass(
                            approvalStatus,
                          )}`}
                        >
                          {approvalStatus}
                        </span>
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-right">
                        <button
                          type="button"
                          onClick={() => onView(item)}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] hover:shadow-sm"
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                  >
                    No results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <p className="text-sm font-semibold text-sibs-tertiary-5">
          Showing {paginatedData.length} of {filteredList.length} records
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white text-gray-500 transition hover:bg-gray-50 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            className="flex h-9 min-w-[36px] items-center justify-center rounded-xl bg-sibs-primary-1 px-3 text-sm font-bold text-white shadow-sm"
          >
            {page}
          </button>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white text-gray-500 transition hover:bg-gray-50 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}