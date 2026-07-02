import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Circle,
  Clock3,
  Send,
} from "lucide-react";
import { useJobDescription } from "../../../../services/context/JobDescriptionContext";

function formatDateTime(value) {
  if (!value) return "";

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeStatus(value = "") {
  return String(value || "").trim();
}

function getRequestedBy(item = {}) {
  return (
    item.requestedBy ||
    item.requested_by ||
    item.createdBy ||
    item.created_by ||
    item.preparedBy ||
    item.prepared_by ||
    item.raw?.requestedBy ||
    item.raw?.requested_by ||
    item.raw?.createdBy ||
    item.raw?.created_by ||
    "HR"
  );
}

function getDateRequested(item = {}) {
  return (
    item.dateRequested ||
    item.date_requested ||
    item.createdAt ||
    item.created_at ||
    item.raw?.dateRequested ||
    item.raw?.date_requested ||
    item.raw?.createdAt ||
    item.raw?.created_at ||
    ""
  );
}

function getApprovedDate(item = {}) {
  return (
    item.approvedDate ||
    item.approved_date ||
    item.lastApproved ||
    item.lastApprovedDate ||
    item.raw?.approvedDate ||
    item.raw?.approved_date ||
    item.raw?.lastApproved ||
    item.raw?.lastApprovedDate ||
    ""
  );
}

function getApprovalOwner(item = {}) {
  return (
    item.approver ||
    item.approvedBy ||
    item.approved_by ||
    item.raw?.approver ||
    item.raw?.approvedBy ||
    item.raw?.approved_by ||
    "Pending"
  );
}

function getApprovers(item = {}) {
  const rawApprovers =
    item.approvers ||
    item.approvalUsers ||
    item.approval_users ||
    item.raw?.approvers ||
    item.raw?.approvalUsers ||
    item.raw?.approval_users ||
    [];

  if (Array.isArray(rawApprovers) && rawApprovers.length > 0) {
    return rawApprovers.map((approver, index) => ({
      role:
        approver.role ||
        approver.approverRole ||
        approver.approver_role ||
        `Approver ${index + 1}`,
      name:
        approver.name ||
        approver.fullName ||
        approver.full_name ||
        approver.approverName ||
        approver.approver_name ||
        "Pending",
      status:
        approver.status ||
        approver.approvalStatus ||
        approver.approval_status ||
        "Pending",
    }));
  }

  return [
    {
      role: "BOD Member",
      name: "Mrs. Amiee Nadela",
      status: "Pending",
    },
    {
      role: "BOD Member",
      name: "Atty. Raul Nadela Jr.",
      status: "Pending",
    },
  ];
}

function getApprovalSteps(item = {}) {
  const status = normalizeStatus(
    item.jdStatus ||
      item.jd_status ||
      item.status ||
      item.raw?.jdStatus ||
      item.raw?.jd_status ||
      item.raw?.status ||
      "",
  );

  const requestedBy = getRequestedBy(item);
  const dateRequested = getDateRequested(item);
  const approvedDate = getApprovedDate(item);
  const approvalOwner = getApprovalOwner(item);

  const isApproved =
    status === "Approved" || status === "Existing" || status === "Active";

  const isForRevision =
    status === "For Revision" || status === "Returned for Revision";

  const isForApproval =
    status === "For Approval" ||
    status === "New Job Description" ||
    status === "New JD";

  return [
    {
      title: "Draft by HR",
      date: dateRequested,
      owner: requestedBy,
      status: "done",
    },
    {
      title: "Submitted for BOD Approval",
      date: dateRequested,
      owner: requestedBy,
      status: isApproved || isForApproval || isForRevision ? "done" : "active",
    },
    {
      title: isForRevision ? "Returned for Revision" : "For BOD Approval",
      date: isApproved ? approvedDate || dateRequested : dateRequested,
      owner: isApproved ? approvalOwner : "Pending",
      status: isApproved ? "done" : isForRevision ? "revision" : "active",
    },
    {
      title: "Final Approval",
      date: approvedDate,
      owner: isApproved ? approvalOwner : "Pending",
      status: isApproved ? "done" : "pending",
    },
  ];
}

function StepIcon({ status }) {
  const isDone = status === "done";
  const isActive = status === "active";
  const isRevision = status === "revision";

  return (
    <div
      className={`absolute -left-10 top-0 z-10 flex h-7 w-7 items-center justify-center rounded-full ${
        isDone
          ? "bg-emerald-500 text-white"
          : isActive
            ? "bg-blue-600 text-white"
            : isRevision
              ? "bg-amber-500 text-white"
              : "bg-gray-200 text-gray-400"
      }`}
    >
      {isDone ? (
        <Check size={15} strokeWidth={3} />
      ) : isActive ? (
        <span className="h-2.5 w-2.5 rounded-full bg-white" />
      ) : isRevision ? (
        <AlertTriangle size={14} strokeWidth={2.5} />
      ) : (
        <Circle size={11} fill="currentColor" />
      )}
    </div>
  );
}

function ApproverStatusBadge({ status = "Pending" }) {
  const cleanStatus = normalizeStatus(status) || "Pending";

  const className =
    cleanStatus === "Approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : cleanStatus === "Declined" || cleanStatus === "Rejected"
        ? "border-red-200 bg-red-50 text-red-700"
        : cleanStatus === "For Revision"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-[#DDE7F3] bg-[#F8FAFC] text-sibs-tertiary-5";

  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-xs font-extrabold ${className}`}
    >
      <Clock3 size={13} />
      {cleanStatus}
    </span>
  );
}

const Approvals = ({ onStatus, onRequestRevision }) => {
  const { selectedJobDescription } = useJobDescription();
  const item = selectedJobDescription || {};

  const [revisionReason, setRevisionReason] = useState("");

  const approvalSteps = useMemo(() => getApprovalSteps(item), [item]);
  const approvers = useMemo(() => getApprovers(item), [item]);

  function handleRequestRevision() {
    const reason = String(revisionReason || "").trim();

    if (!reason) {
      onStatus?.({
        type: "error",
        title: "Revision Reason Required",
        message: "Please enter a reason before requesting revision.",
      });
      return;
    }

    onRequestRevision?.({
      item,
      reason,
    });

    onStatus?.({
      type: "info",
      title: "Not Yet Connected",
      message: "Revision request action is not connected to the backend yet.",
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      <section className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
        <h3 className="mb-5 text-sm font-extrabold text-[#101828]">
          Approval Flow
        </h3>

        <div className="relative pl-10">
          <div className="absolute bottom-[30px] left-[14px] top-[14px] w-px bg-[#DDE7F3]" />

          <div className="space-y-10">
            {approvalSteps.map((step) => {
              const isActive = step.status === "active";
              const isRevision = step.status === "revision";

              return (
                <div key={step.title} className="relative">
                  <StepIcon status={step.status} />

                  <div>
                    <p
                      className={`text-sm font-extrabold leading-5 ${
                        isActive
                          ? "text-blue-600"
                          : isRevision
                            ? "text-amber-700"
                            : "text-[#101828]"
                      }`}
                    >
                      {step.title}
                    </p>

                    {step.date && (
                      <p className="mt-1 text-xs font-semibold text-[#1E5A92]">
                        {formatDateTime(step.date)}
                      </p>
                    )}

                    <p className="mt-1 text-xs font-bold text-[#344054]">
                      {step.owner || "Pending"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
          <h3 className="mb-5 text-sm font-extrabold text-[#101828]">
            Approver
          </h3>

          <div className="space-y-4">
            {approvers.map((approver, index) => (
              <div
                key={`${approver.name}-${index}`}
                className="grid grid-cols-1 items-center gap-3 md:grid-cols-[140px_minmax(0,1fr)_120px]"
              >
                <p className="text-sm font-bold text-[#344054]">
                  {approver.role || "Approver"}
                </p>

                <div className="min-h-10 rounded-md border border-[#DDE7F3] bg-[#F8FAFC] px-3 py-2 text-sm font-semibold text-[#344054]">
                  {approver.name || "Pending"}
                </div>

                <ApproverStatusBadge status={approver.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-[#101828]">
            Revision Request
          </h3>

          <p className="mt-2 text-xs font-semibold text-[#344054]">
            If revision is needed, please specify the reason.
          </p>

          <textarea
            value={revisionReason}
            onChange={(e) => setRevisionReason(e.target.value)}
            rows={4}
            placeholder="Enter reason..."
            className="mt-3 w-full resize-none rounded-md border border-[#DDE7F3] bg-white px-3 py-2 text-sm text-[#344054] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleRequestRevision}
              disabled={!String(revisionReason || "").trim()}
              className="inline-flex items-center gap-2 rounded-md border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={15} />
              Request Revision
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Approvals;