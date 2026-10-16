import { useEffect, useRef, useState } from "react";

import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Loader2,
  XCircle,
} from "lucide-react";

import { ModalShell, TableSkeletonRows } from "@/components/ui";

import { formatSystemDateTime } from "@/lib/axios/dateFormatter";

const ROWS_PER_PAGE = 15;

const departmentName = (request) =>
  request?.departmentName || request?.department_name || "-";

const requestedBy = (request) =>
  request?.requestedByDisplay ||
  request?.requested_by_display ||
  request?.requestedBy ||
  request?.requested_by ||
  "System";

const requestedAt = (request) =>
  formatSystemDateTime(request?.requestedAt || request?.requested_at);

function PendingBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-extrabold uppercase text-amber-700">
      <Clock3 className="h-3 w-3" /> Pending
    </span>
  );
}

function DetailItem({ label, children }) {
  return (
    <div className="min-w-0 rounded-[10px] border border-sibs-border bg-white px-3.5 py-3">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-bold leading-5 text-sibs-navy">
        {children}
      </p>
    </div>
  );
}

export default function DepartmentApprovalRequests({
  requests = [],

  loading = false,

  linkedRequestId = "",

  onLinkOpened,

  onLinkUnavailable,

  canApprove = false,

  processingId = "",

  onApprove,

  onReject,
}) {
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const handledEmailLinkRef = useRef("");

  const [page, setPage] = useState(1);

  const safeRequests = Array.isArray(requests) ? requests : [];

  const pageCount = Math.max(1, Math.ceil(safeRequests.length / ROWS_PER_PAGE));

  const currentPage = Math.min(page, pageCount);

  const firstRowIndex = (currentPage - 1) * ROWS_PER_PAGE;

  const visibleRequests = safeRequests.slice(
    firstRowIndex,
    firstRowIndex + ROWS_PER_PAGE,
  );

  const selectedRequest = safeRequests.find(
    (request) => String(request.id) === String(selectedRequestId),
  );

  const processingSelected = Boolean(
    selectedRequest && String(processingId) === String(selectedRequest.id),
  );

  // Dispatch an email deep link once per ID, even if an unavailable-request

  // status dialog triggers rerenders before the URL parameter is cleared.

  useEffect(() => {
    const requestId = String(linkedRequestId || "").trim();

    if (!requestId) {
      handledEmailLinkRef.current = "";

      return;
    }

    if (loading || handledEmailLinkRef.current === requestId) return;

    handledEmailLinkRef.current = requestId;

    const matchingRequest = safeRequests.find(
      (request) => String(request.id) === requestId,
    );

    if (matchingRequest) {
      setSelectedRequestId(matchingRequest.id);

      onLinkOpened?.();
    } else {
      onLinkUnavailable?.();
    }
  }, [linkedRequestId, loading, requests, onLinkOpened, onLinkUnavailable]);

  // After a successful approval/rejection it disappears from the pending list.

  useEffect(() => {
    if (
      !loading &&
      selectedRequestId !== null &&
      !safeRequests.some(
        (request) => String(request.id) === String(selectedRequestId),
      )
    ) {
      setSelectedRequestId(null);
    }
  }, [loading, requests, selectedRequestId]);

  if (!loading && safeRequests.length === 0) return null;

  return (
    <>
      <section
        className="sibs-page-card-in sibs-card mt-5 overflow-hidden rounded-[14px] border border-sibs-border bg-white font-jakarta shadow-xs"
        style={{ animationDelay: "180ms", animationFillMode: "both" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sibs-border px-4 py-4 sm:px-5">
          <div>
            <h2 className="sibs-card-title">Pending Department Approvals</h2>

            <p className="sibs-card-subtitle">
              Select a department request to view its details and approve or
              reject it.
            </p>
          </div>

          <span className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-extrabold text-amber-700">
            {loading ? "Loading..." : `${safeRequests.length} pending`}
          </span>
        </div>

        <div className="w-full overflow-x-auto sibs-scrollbar">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead className="bg-sibs-surface text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">
              <tr className="border-b border-sibs-border">
                <th scope="col" className="px-4 py-3 sm:pl-5">
                  Department Name
                </th>

                <th scope="col" className="px-3 py-3">
                  Requested By
                </th>

                <th scope="col" className="px-3 py-3">
                  Date Requested
                </th>

                <th scope="col" className="px-3 py-3">
                  Status
                </th>

                <th scope="col" className="px-4 py-3 text-right sm:pr-5">
                  Details
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-sibs-border text-xs">
              {loading ? (
                <TableSkeletonRows count={3} columns={5} />
              ) : (
                visibleRequests.map((request) => (
                  <tr
                    key={request.id}
                    onClick={() => setSelectedRequestId(request.id)}
                    className="group cursor-pointer transition-colors hover:bg-sibs-cream-light"
                  >
                    <td className="max-w-[260px] px-4 py-3 font-extrabold text-sibs-navy sm:pl-5">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedRequestId(request.id);
                        }}
                        className="break-words text-left outline-none hover:text-sibs-orange focus-visible:rounded focus-visible:ring-2 focus-visible:ring-sibs-orange"
                        aria-label={`View department approval request for ${departmentName(request)}`}
                      >
                        {departmentName(request)}
                      </button>
                    </td>

                    <td className="max-w-[250px] break-words px-3 py-3 font-semibold text-sibs-secondary">
                      {requestedBy(request)}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-sibs-muted">
                      {requestedAt(request)}
                    </td>

                    <td className="px-3 py-3">
                      <PendingBadge />
                    </td>

                    <td className="px-4 py-3 text-right sm:pr-5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-sibs-navy group-hover:text-sibs-orange">
                        <Eye className="h-3.5 w-3.5" /> View
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && safeRequests.length > ROWS_PER_PAGE ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sibs-border px-4 py-3 text-xs font-semibold text-sibs-muted sm:px-5">
                <span>
                  Showing {firstRowIndex + 1}–
                  {Math.min(firstRowIndex + ROWS_PER_PAGE, safeRequests.length)}{" "}
                  of {safeRequests.length} requests
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous pending departments page"
                    className="sibs-btn-icon !h-8 !w-8"
                    disabled={currentPage === 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="min-w-10 text-center font-extrabold text-sibs-navy">
                    {currentPage} / {pageCount}
                  </span>
                  <button
                    type="button"
                    aria-label="Next pending departments page"
                    className="sibs-btn-icon !h-8 !w-8"
                    disabled={currentPage === pageCount}
                    onClick={() =>
                      setPage((prev) => Math.min(pageCount, prev + 1))
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
      </section>

      <ModalShell
        open={Boolean(selectedRequest)}
        onClose={
          processingSelected ? undefined : () => setSelectedRequestId(null)
        }
        title="Department Approval Details"
        subtitle="Review the department request before making a decision."
        icon={Building2}
        badge="Pending Approval"
        maxWidth="max-w-2xl"
        closeOnBackdrop={false}
        closeOnEscape={!processingSelected}
        footer={
          canApprove ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-[10px] border border-red-200 bg-red-50 px-3.5 2xl:px-4 text-xs font-extrabold text-red-600 transition hover:bg-red-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => onReject?.(selectedRequest)}
                disabled={!selectedRequest || processingSelected}
              >
                {processingSelected ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <XCircle size={15} />
                )}
                Reject
              </button>
              <button
                type="button"
                className="sibs-modal-btn-primary gap-2"
                onClick={() => onApprove?.(selectedRequest)}
                disabled={!selectedRequest || processingSelected}
              >
                {processingSelected ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={15} />
                )}
                {processingSelected ? "Processing..." : "Approve"}
              </button>
            </div>
          ) : null
        }
      >
        {selectedRequest ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-[10px] border border-sibs-border bg-sibs-surface/60 p-4">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">
                  Requested Department
                </p>
                <h3 className="mt-1 break-words text-base font-extrabold text-sibs-navy">
                  {departmentName(selectedRequest)}
                </h3>
              </div>
              <PendingBadge />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem label="Requested By">
                {requestedBy(selectedRequest)}
              </DetailItem>
              <DetailItem label="Date Requested">
                {requestedAt(selectedRequest)}
              </DetailItem>
            </div>
            {!canApprove ? (
              <p className="rounded-[10px] border border-sibs-border bg-sibs-surface px-4 py-3 text-xs font-semibold text-sibs-muted">
                Only authorized Department approvers can approve or reject this
                request.
              </p>
            ) : null}
          </div>
        ) : null}
      </ModalShell>
    </>
  );
}
