import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Loader2,
  PencilLine,
  RotateCcw,
  XCircle,
} from "lucide-react";

import { getJobDescriptionApprovalRequests } from "../../../lib/axios/getApprovalRequest";
import { usePagination } from "../../../services/context/PaginationContext";
import TableFooter from "../footer/TableFooter";

const JOB_DESCRIPTION_REQUEST_ENTITY = "job-description-approval-requests";

function formatDate(dateValue) {
  if (!dateValue) return "--";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function safeText(value, fallback = "--") {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeStatus(status) {
  const value = String(status || "").trim();

  if (value === "Existing") return "Approved";
  if (value === "For Revision") return "For Review";
  if (value === "New Job Description") return "Pending";
  if (value === "Approved") return "Approved";
  if (value === "Rejected") return "Rejected";
  if (value === "Declined") return "Rejected";

  return value || "Pending";
}

function getStatusClass(status) {
  switch (normalizeStatus(status)) {
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "Rejected":
      return "border-red-200 bg-red-50 text-red-700";

    case "For Review":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "Pending":
      return "border-amber-200 bg-amber-50 text-amber-700";

    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getStatusIcon(status) {
  switch (normalizeStatus(status)) {
    case "Approved":
      return CheckCircle2;

    case "Rejected":
      return XCircle;

    case "For Review":
      return AlertCircle;

    case "Pending":
      return Clock3;

    default:
      return Clock3;
  }
}

function getJdStatusIcon(status) {
  const value = String(status || "").trim();

  if (value === "Existing") return CheckCircle2;
  if (value === "For Revision") return RotateCcw;
  if (value === "New Job Description") return PencilLine;

  return FileText;
}

function getJdStatusClass(status) {
  const value = String(status || "").trim();

  if (value === "Existing") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (value === "For Revision") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (value === "New Job Description") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return getStatusClass(value);
}

function getRawValue(request, key, fallback = "") {
  return request?.raw?.[key] ?? request?.[key] ?? fallback;
}

function JobDescriptionMobileCard({ request, onView }) {
  const rawStatus = getRawValue(request, "jdStatus", request.status);
  const normalizedStatus = normalizeStatus(request.status || rawStatus);

  return (
    <button
      type="button"
      onClick={() => onView?.(request)}
      className="w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-extrabold text-[#101828]">
            {safeText(request.title)}
          </h3>

          <p className="mt-1 truncate text-xs font-semibold text-sibs-primary-1">
            {safeText(getRawValue(request, "jdCode", request.id))}
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
            normalizedStatus,
          )}`}
        >
          {normalizedStatus}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MobileMetric
          label="Requested By"
          value={request.requester || request.employeeSibsId}
        />

        <MobileMetric
          label="Owner"
          value={getRawValue(request, "ownerSibsId", request.approver)}
        />

        <MobileMetric
          label="Date Requested"
          value={formatDate(request.dateRequested || request.requestDate)}
        />

        <MobileMetric
          label="Department"
          value={request.department || getRawValue(request, "department")}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${getJdStatusClass(
            rawStatus,
          )}`}
        >
          {safeText(rawStatus)}
        </span>

        {getRawValue(request, "linkedHiringRequirement") && (
          <span className="inline-flex rounded-full border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-1 text-xs font-bold text-[#344054]">
            HR: {getRawValue(request, "linkedHiringRequirement")}
          </span>
        )}
      </div>

      <div className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1">
        <Eye size={16} />
        View Details
      </div>
    </button>
  );
}

function MobileMetric({ label, value }) {
  return (
    <div className="rounded-xl bg-[#F8FAFC] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-extrabold text-sibs-primary-1">
        {safeText(value)}
      </p>
    </div>
  );
}

const JobDescriptionRequestTable = ({ onView }) => {
  const { setPagination } = usePagination(JOB_DESCRIPTION_REQUEST_ENTITY);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);

        const response = await getJobDescriptionApprovalRequests();
        const requestList = Array.isArray(response?.data) ? response.data : [];

        setRequests(requestList);

        setPagination({
          totalPages: response?.pagination?.totalPages || 1,
          currentPage: response?.pagination?.currentPage || 1,
          total: response?.pagination?.total || requestList.length,
          limit: response?.pagination?.limit || requestList.length || 15,
        });
      } catch (error) {
        console.error("Error fetching job description requests:", error);

        setRequests([]);

        setPagination({
          totalPages: 1,
          currentPage: 1,
          total: 0,
          limit: 15,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [setPagination]);

  useEffect(() => {
    setPagination((prev) => ({
      totalPages: prev?.totalPages || 1,
      currentPage: prev?.currentPage || 1,
      total: requests.length,
      limit: prev?.limit || requests.length || 15,
    }));
  }, [requests.length, setPagination]);

  return (
    <div className="flex h-[calc(100dvh-360px)] min-h-[520px] flex-col overflow-hidden">
      <div className="min-h-0 flex-1">
        <div className="hidden h-full lg:block">
          <div className="h-full overflow-auto sibs-scrollbar">
            <table className="w-full min-w-[1120px] table-fixed border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white text-left">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                  <th className="w-[24%] px-5 py-4 text-left align-middle first:rounded-tl-2xl">
                    Job Description
                  </th>

                  <th className="w-[11%] px-4 py-4 text-center align-middle">
                    JD Code
                  </th>

                  <th className="w-[29%] px-5 py-4 text-left align-middle">
                    Requested By
                  </th>

                  <th className="w-[13%] px-4 py-4 text-center align-middle">
                    Date Requested
                  </th>

                  <th className="w-[11%] px-4 py-4 text-center align-middle">
                    JD Status
                  </th>

                  <th className="w-[12%] px-5 py-4 text-center align-middle last:rounded-tr-2xl">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                    >
                      <Loader2
                        size={28}
                        className="mx-auto mb-3 animate-spin text-sibs-primary-1"
                      />
                      Loading Job Description approval requests...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                    >
                      No approval requests found for Job Description.
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => {
                    const rawStatus = getRawValue(
                      request,
                      "jdStatus",
                      request.status,
                    );

                    const normalizedStatus = normalizeStatus(
                      request.status || rawStatus,
                    );

                    const StatusIcon = getStatusIcon(normalizedStatus);

                    return (
                      <tr
                        key={`${request.source || "job-description"}-${
                          request.id || request.rawId
                        }`}
                        className="transition hover:bg-[#FAFBFC]"
                      >
                        <td className="border-b border-[#E6ECF2] px-5 py-5 align-middle">
                          <div className="min-w-0">
                            <p
                              title={request.title}
                              className="max-w-[260px] truncate text-sm font-extrabold text-[#101828]"
                            >
                              {safeText(request.title)}
                            </p>

                            <p
                              title={getRawValue(
                                request,
                                "linkedHiringRequirement",
                              )}
                              className="mt-1 max-w-[260px] truncate text-xs font-semibold text-sibs-tertiary-5"
                            >
                              Linked Hiring Requirement:{" "}
                              {safeText(
                                getRawValue(request, "linkedHiringRequirement"),
                              )}
                            </p>
                          </div>
                        </td>

                        <td className="border-b border-[#E6ECF2] px-4 py-5 text-center align-middle">
                          <span className="mx-auto inline-flex max-w-full items-center justify-center truncate rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1">
                            {safeText(
                              getRawValue(request, "jdCode", request.id),
                            )}
                          </span>
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 align-middle">
                          <div className="min-w-0">
                            <p
                              title={
                                request.requester || request.employeeSibsId
                              }
                              className="truncate text-sm font-bold text-[#344054]"
                            >
                              {safeText(
                                request.requester || request.employeeSibsId,
                              )}
                            </p>

                            <p
                              title={
                                request.createdBy ||
                                getRawValue(
                                  request,
                                  "createdBy",
                                  request.employeeSibsId,
                                )
                              }
                              className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5"
                            >
                              Created by:{" "}
                              {safeText(
                                request.createdBy ||
                                  getRawValue(
                                    request,
                                    "createdBy",
                                    request.employeeSibsId,
                                  ),
                              )}
                            </p>
                          </div>
                        </td>

                        <td className="border-b border-[#E6ECF2] px-4 py-5 text-center align-middle">
                          <p
                            title={formatDate(
                              request.dateRequested || request.requestDate,
                            )}
                            className="truncate text-sm font-bold text-[#344054]"
                          >
                            {formatDate(
                              request.dateRequested || request.requestDate,
                            )}
                          </p>
                        </td>

                        <td className="border-b border-[#E6ECF2] px-4 py-5 text-center align-middle">
                          <span
                            title={normalizedStatus}
                            className={`mx-auto inline-flex max-w-full items-center justify-center gap-1.5 truncate rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                              normalizedStatus,
                            )}`}
                          >
                            <StatusIcon size={13} className="shrink-0" />
                            <span className="truncate">{normalizedStatus}</span>
                          </span>
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => onView?.(request)}
                            className="mx-auto inline-flex h-10 min-w-[104px] items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
                          >
                            <Eye size={16} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="block h-full lg:hidden">
          <div className="h-full overflow-y-auto sibs-scrollbar">
            {loading ? (
              <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-10 text-center text-sm font-bold text-gray-500">
                <Loader2
                  size={28}
                  className="mx-auto mb-3 animate-spin text-sibs-primary-1"
                />
                Loading Job Description approval requests...
              </div>
            ) : requests.length === 0 ? (
              <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-10 text-center text-sm font-bold text-gray-500">
                No approval requests found for Job Description.
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <JobDescriptionMobileCard
                    key={`${request.source || "job-description"}-${
                      request.id || request.rawId
                    }`}
                    request={request}
                    onView={onView}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <TableFooter
        tableEntity={JOB_DESCRIPTION_REQUEST_ENTITY}
        totalLabel="Total Job Description Requests"
      />
    </div>
  );
};

export default JobDescriptionRequestTable;
