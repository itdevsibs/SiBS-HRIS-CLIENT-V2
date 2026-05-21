import React from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  XCircle,
} from "lucide-react";

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

function HiringNeedMobileCard({ item, onView }) {
  const status = normalizeStatus(item.approvalStatus);

  return (
    <button
      type="button"
      onClick={onView}
      className="w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-[var(--sibs-primary-1)]/40 hover:bg-[#FAFBFC]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-sibs-primary-1">
            {item.id || "—"}
          </p>

          <h3 className="mt-1 text-sm font-bold text-[#0F172A]">
            {item.positionTitle || "—"}
          </h3>

          <p className="mt-1 text-xs font-medium text-sibs-tertiary-5">
            {item.departmentAccount || "—"}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
            status,
          )}`}
        >
          {status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Headcount
          </p>

          <p className="mt-1 text-sm font-bold text-sibs-primary-1">
            {item.headcount || "—"}
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Reason
          </p>

          <p className="mt-1 text-sm font-bold text-[#1E293B]">
            {item.reasonForHiring || "—"}
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3 sm:col-span-2">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Date Needed
          </p>

          <p className="mt-1 text-sm font-bold text-[#1E293B]">
            {formatDate(item.dateNeeded)}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function HiringNeedsDataTable({
  loading = false,
  filteredList = [],
  normalizedList = [],
  onView,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
      <div className="hidden lg:block">
        <div className="overflow-x-auto p-6">
          <table className="w-full min-w-[1450px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left">
            <thead>
              <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                <th className="px-5 py-4 first:rounded-tl-2xl">PRF ID</th>
                <th className="px-5 py-4">Position Title</th>
                <th className="px-5 py-4">Department / Account</th>
                <th className="px-5 py-4">Job Description</th>
                <th className="px-5 py-4 text-center">Headcount</th>
                <th className="px-5 py-4">Reason for Hiring</th>
                <th className="px-5 py-4">Assignment</th>
                <th className="px-5 py-4">Location / Site</th>
                <th className="px-5 py-4">Date Needed</th>
                <th className="px-5 py-4">Prepared By</th>
                <th className="px-5 py-4 text-center">Approval</th>
                <th className="px-5 py-4">Approval Date</th>
                <th className="px-5 py-4 text-right last:rounded-tr-2xl">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={13}
                    className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                  >
                    Loading personnel requisitions...
                  </td>
                </tr>
              ) : filteredList.length > 0 ? (
                filteredList.map((item) => {
                  const status = normalizeStatus(item.approvalStatus);

                  return (
                    <tr key={item.id} className="transition hover:bg-[#FAFBFC]">
                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-bold text-[#1473E6]">
                        {item.id || "—"}
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-bold text-[#0F172A]">
                        {item.positionTitle || "—"}
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#1E293B]">
                        {item.departmentAccount || "—"}
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#1E293B]">
                        {item.jobDescriptionText ||
                          item.jobDescriptionTitle ||
                          item.jobDescriptionId ||
                          "Not selected"}
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold text-sibs-primary-1">
                        {item.headcount || "—"}
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#1E293B]">
                        {item.reasonForHiring || "—"}
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#1E293B]">
                        {item.assignment === "Other"
                          ? item.assignmentOther || "Other"
                          : item.assignment || "—"}
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#1E293B]">
                        {item.locationSite || "—"}
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#1E293B]">
                        {formatDate(item.dateNeeded)}
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#1E293B]">
                        {item.preparedBy || "—"}
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                            status,
                          )}`}
                        >
                          {getApprovalIcon(status)}
                          {status}
                        </span>
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#1E293B]">
                        {formatDate(item.approvalDate)}
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-right">
                        <button
                          type="button"
                          onClick={() => onView?.(item)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 py-2 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] hover:shadow-sm"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={13}
                    className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                  >
                    No personnel requisition found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#E6ECF2] px-6 py-4">
          <p className="text-sm font-medium text-sibs-primary-1">
            Showing 1 to {filteredList.length} of {normalizedList.length}{" "}
            personnel requisitions
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-tertiary-5"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sibs-primary-1 text-sm font-bold text-white"
            >
              1
            </button>

            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-tertiary-5"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4 lg:hidden">
        {loading ? (
          <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
            Loading personnel requisitions...
          </div>
        ) : filteredList.length > 0 ? (
          filteredList.map((item) => (
            <HiringNeedMobileCard
              key={item.id}
              item={item}
              onView={() => onView?.(item)}
            />
          ))
        ) : (
          <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
            No personnel requisition found.
          </div>
        )}
      </div>
    </section>
  );
}