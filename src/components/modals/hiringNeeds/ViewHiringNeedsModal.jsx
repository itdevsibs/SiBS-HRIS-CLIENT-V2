import React from "react";
import { CheckCircle2, Clock, X, XCircle } from "lucide-react";

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeStatus(status) {
  if (!status) return "For Approval";

  if (status === "Pending") return "For Approval";
  if (status === "For Validation") return "For Approval";
  if (status === "Under Review") return "For Approval";
  if (status === "Approved") return "Approved";
  if (status === "Rejected") return "Not Approved";
  if (status === "Not Approved") return "Not Approved";

  return status;
}

function getStatusClass(status) {
  switch (normalizeStatus(status)) {
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Not Approved":
      return "border-red-200 bg-red-50 text-red-700";
    case "For Approval":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getApprovalIcon(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "Approved") {
    return <CheckCircle2 size={18} className="text-emerald-600" />;
  }

  if (normalized === "Not Approved") {
    return <XCircle size={18} className="text-red-600" />;
  }

  return <Clock size={18} className="text-amber-500" />;
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <div className="break-words text-sm font-bold text-[#344054]">
        {value || "—"}
      </div>
    </div>
  );
}

export default function ViewHiringNeedsModal({ open, item, onClose }) {
  if (!open || !item) return null;

  const status = normalizeStatus(item.approvalStatus);

  const checklist = [
    {
      label: "Personnel requisition submitted",
      done: true,
      date: item.createdAt || item.dateNeeded,
    },
    {
      label: item.jobDescriptionId
        ? "Job Description selected"
        : "Job Description not selected",
      done: !!item.jobDescriptionId,
      date: item.createdAt || item.dateNeeded,
    },
    {
      label: "Subject for approval",
      done: true,
      date: item.createdAt || item.dateNeeded,
    },
    {
      label:
        status === "Approved"
          ? "Approved"
          : status === "Not Approved"
            ? "Not Approved"
            : "Waiting for approval decision",
      done: status === "Approved" || status === "Not Approved",
      date: item.approvalDate,
      status,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-sibs-primary-1 sm:text-xl">
              PERSONNEL REQUISITION
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              {item.id || "—"} / {item.positionTitle || "—"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Position Title
                    </p>

                    <h3 className="mt-1 text-xl font-extrabold text-[#101828]">
                      {item.positionTitle || "—"}
                    </h3>

                    <p className="mt-2 text-sm font-semibold text-sibs-tertiary-5">
                      {item.departmentAccount || "—"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                          status,
                        )}`}
                      >
                        {getApprovalIcon(status)}
                        {status}
                      </span>

                      <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1">
                        {item.locationSite || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1/70">
                      Headcount
                    </p>

                    <p className="mt-1 text-3xl font-extrabold text-sibs-primary-1">
                      {item.headcount || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <InfoBox label="Position Title" value={item.positionTitle} />

                <InfoBox
                  label="Department / Account"
                  value={item.departmentAccount}
                />

                <InfoBox
                  label="Job Description"
                  value={
                    item.jobDescriptionText ||
                    item.jobDescriptionTitle ||
                    item.jobDescriptionId ||
                    "Not selected"
                  }
                />

                <InfoBox label="Headcount" value={item.headcount} />

                <InfoBox
                  label="Reason for Hiring"
                  value={item.reasonForHiring}
                />

                <InfoBox
                  label="Assignment"
                  value={
                    item.assignment === "Other"
                      ? item.assignmentOther || "Other"
                      : item.assignment
                  }
                />

                <InfoBox label="Location / Site" value={item.locationSite} />

                <InfoBox
                  label="Date Needed"
                  value={formatDate(item.dateNeeded)}
                />

                <InfoBox label="Prepared By" value={item.preparedBy} />

                <InfoBox label="Approval Status" value={status} />

                <InfoBox
                  label="Approval Date"
                  value={formatDate(item.approvalDate)}
                />
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-[#101828]">
                  Approval Checklist
                </h3>

                <div className="mt-4 space-y-3">
                  {checklist.map((step) => (
                    <div
                      key={step.label}
                      className="flex gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3"
                    >
                      <div className="mt-0.5">
                        {step.done ? (
                          step.status === "Not Approved" ? (
                            <XCircle size={18} className="text-red-600" />
                          ) : (
                            <CheckCircle2
                              size={18}
                              className="text-emerald-600"
                            />
                          )
                        ) : (
                          <Clock size={18} className="text-amber-500" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#101828]">
                          {step.label}
                        </p>

                        <p className="mt-0.5 text-xs font-semibold text-sibs-tertiary-5">
                          Date: {formatDate(step.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Approval Rule
                </h3>

                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  This personnel requisition is subject to approval before it can
                  be used for hiring execution and weekly hiring planning.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-sibs-primary-1 px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}