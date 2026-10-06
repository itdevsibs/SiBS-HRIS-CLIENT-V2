import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  PencilLine,
  RotateCcw,
  XCircle,
} from "lucide-react";

import { getJobDescriptionApprovalRequests } from "../../../lib/axios/getApprovalRequest";
import { usePagination } from "../../../services/context/PaginationContext";
import { DataCard, ResponsiveTableShell, TablePagination, TableSkeletonRows } from "@/components/ui";

const JOB_DESCRIPTION_REQUEST_ENTITY = "job-description-approval-requests";

function formatDate(dateValue) {
  if (!dateValue) return "--";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
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

function StatusIcon({ status, size = 11, className = "" }) {
  switch (normalizeStatus(status)) {
    case "Approved":
      return <CheckCircle2 size={size} className={className} />;

    case "Rejected":
      return <XCircle size={size} className={className} />;

    case "For Review":
      return <AlertCircle size={size} className={className} />;

    case "Pending":
    default:
      return <Clock3 size={size} className={className} />;
  }
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
    <DataCard interactive onClick={() => onView?.(request)}>
      <DataCard.Header
        icon={<FileText className="h-4 w-4 text-sibs-orange" />}
        title={safeText(request.title)}
        subtitle={
          <span className="truncate font-semibold text-sibs-navy">
            {safeText(getRawValue(request, "jdCode", request.id))}
          </span>
        }
        badge={
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getStatusClass(
              normalizedStatus,
            )}`}
          >
            <StatusIcon status={normalizedStatus} size={11} />
            {normalizedStatus}
          </span>
        }
      />

      <DataCard.ContextRow>
        <span className="text-[11px] font-extrabold text-sibs-navy">
          {request.department || getRawValue(request, "department") || "—"}
        </span>
        {getRawValue(request, "linkedHiringRequirement") && (
          <span className="text-[11px] font-semibold text-sibs-muted">
            PRF: {getRawValue(request, "linkedHiringRequirement")}
          </span>
        )}
      </DataCard.ContextRow>

      <DataCard.Metrics cols={3}>
        <DataCard.MetricItem
          label="Requester"
          value={request.requester || request.employeeSibsId || "—"}
        />
        <DataCard.MetricItem
          label="Owner"
          value={getRawValue(request, "ownerSibsId", request.approver) || "—"}
        />
        <DataCard.MetricItem
          label="Date"
          value={formatDate(request.dateRequested || request.requestDate)}
        />
      </DataCard.Metrics>

      <DataCard.Footer>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getJdStatusClass(
            rawStatus,
          )}`}
        >
          {safeText(rawStatus)}
        </span>
        <span className="shrink-0 text-[10px] font-extrabold uppercase text-sibs-orange">
          View Details →
        </span>
      </DataCard.Footer>
    </DataCard>
  );
}

const JobDescriptionRequestTable = ({ onView }) => {
  const { pagination, setPagination, setPage } = usePagination(JOB_DESCRIPTION_REQUEST_ENTITY);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);

        const response = await getJobDescriptionApprovalRequests();
        const requestList = Array.isArray(response?.data) 
          ? response.data.filter((req) => {
              const status = String(
                req?.jdStatus || req?.jd_status || req?.status || ""
              ).toLowerCase();
              return status !== "approved" && status !== "rejected";
            })
          : [];

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
        <ResponsiveTableShell
          mobileContent={
            loading ? (
              <DataCard.Skeleton count={4} lines={3} />
            ) : requests.length === 0 ? (
              <DataCard.Empty
                title="No Job Description Requests"
                description="No approval requests found for Job Description."
              />
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
            )
          }
          desktopContent={
            <div className="h-full overflow-auto sibs-scrollbar">
              <table className="w-full min-w-[1120px] table-fixed border-separate border-spacing-0 overflow-hidden rounded-2xl border border-sibs-border bg-white text-left">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-sibs-surface text-xs font-bold uppercase tracking-wide text-sibs-navy">
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

                <tbody aria-busy={loading ? "true" : undefined}>
                  {loading ? (
                    <TableSkeletonRows count={15} columns={6} />
                  ) : requests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-12 text-center text-sm font-bold text-sibs-muted"
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

                      return (
                        <tr
                          key={`${request.source || "job-description"}-${
                            request.id || request.rawId
                          }`}
                          className="transition-colors hover:bg-sibs-surface/80"
                        >
                          <td className="border-b border-sibs-border px-5 py-5 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-sibs-orange">
                                <FileText size={18} />
                              </div>

                              <div className="min-w-0">
                                <p
                                  title={safeText(request.title)}
                                  className="truncate text-sm font-bold text-sibs-navy"
                                >
                                  {safeText(request.title)}
                                </p>

                                <div className="mt-1 flex flex-wrap gap-2">
                                  <span
                                    title={safeText(rawStatus)}
                                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${getJdStatusClass(
                                      rawStatus,
                                    )}`}
                                  >
                                    {safeText(rawStatus)}
                                  </span>

                                  {getRawValue(
                                    request,
                                    "linkedHiringRequirement",
                                  ) && (
                                    <span className="inline-flex rounded-full border border-sibs-border bg-sibs-surface px-2.5 py-0.5 text-xs font-bold text-sibs-text-secondary">
                                      HR:{" "}
                                      {getRawValue(
                                        request,
                                        "linkedHiringRequirement",
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="border-b border-sibs-border px-4 py-5 text-center align-middle">
                            <span
                              title={safeText(
                                getRawValue(request, "jdCode", request.id),
                              )}
                              className="inline-flex rounded-lg bg-sibs-surface px-2.5 py-1 text-xs font-extrabold text-sibs-navy"
                            >
                              {safeText(
                                getRawValue(request, "jdCode", request.id),
                              )}
                            </span>
                          </td>

                          <td className="border-b border-sibs-border px-5 py-5 align-middle">
                            <div className="min-w-0">
                              <p
                                title={safeText(
                                  request.requester || request.employeeSibsId,
                                )}
                                className="truncate text-sm font-bold text-sibs-navy"
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
                                className="mt-1 truncate text-xs font-semibold text-sibs-muted"
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

                          <td className="border-b border-sibs-border px-4 py-5 text-center align-middle">
                            <p
                              title={formatDate(
                                request.dateRequested || request.requestDate,
                              )}
                              className="truncate text-sm font-bold text-sibs-text-secondary"
                            >
                              {formatDate(
                                request.dateRequested || request.requestDate,
                              )}
                            </p>
                          </td>

                          <td className="border-b border-sibs-border px-4 py-5 text-center align-middle">
                            <span
                              title={normalizedStatus}
                              className={`mx-auto inline-flex max-w-full items-center justify-center gap-1.5 truncate rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                                normalizedStatus,
                              )}`}
                            >
                              <StatusIcon status={normalizedStatus} size={13} className="shrink-0" />
                              <span className="truncate">{normalizedStatus}</span>
                            </span>
                          </td>

                          <td className="border-b border-sibs-border px-5 py-5 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => onView?.(request)}
                              className="mx-auto inline-flex h-8.5 2xl:h-9 min-w-[96px] items-center justify-center gap-1.5 rounded-lg border border-sibs-border bg-white px-3 text-xs font-bold text-sibs-navy transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange active:scale-[0.98]"
                            >
                              <Eye size={15} />
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
          }
        />
      </div>

      <TablePagination
        currentPage={pagination?.currentPage || 1}
        totalPages={pagination?.totalPages || 1}
        totalRecords={pagination?.total || requests.length}
        loadedCount={requests.length}
        limit={pagination?.limit || 15}
        recordLabel="requests"
        onPageChange={(page) => {
          if (typeof setPage === "function") {
            setPage(page);
          }
        }}
        showCount
      />
    </div>
  );
};

export default JobDescriptionRequestTable;
