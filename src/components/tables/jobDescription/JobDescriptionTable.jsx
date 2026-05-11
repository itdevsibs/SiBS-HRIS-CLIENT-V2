import React, { useEffect, useMemo } from "react";
import { Eye, UserRound } from "lucide-react";
import TableHeader from "../tableHeader/TableHeader";
import { usePagination } from "../../../services/context/PaginationContext";
import TableFooter from "../footer/TableFooter";

const JOB_DESCRIPTION_ENTITY = "job-descriptions";

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function safeText(value) {
  return String(value || "").toLowerCase();
}

function normalizeJdStatus(status) {
  if (status === "New JD") return "New Job Description";
  return status || "New Job Description";
}

function getJdStatusClass(status) {
  switch (normalizeJdStatus(status)) {
    case "Existing":
    case "Active":
      return "bg-emerald-50 text-emerald-700";

    case "For Revision":
    case "For Approval":
      return "bg-amber-50 text-amber-700";

    case "New Job Description":
    case "Draft":
      return "bg-blue-50 text-blue-700";

    case "Returned for Revision":
      return "bg-red-50 text-red-700";

    default:
      return "bg-gray-50 text-gray-600";
  }
}

function getJdStatusLabel(status) {
  switch (normalizeJdStatus(status)) {
    case "Existing":
      return "Active";
    case "For Revision":
      return "For Approval";
    case "New Job Description":
      return "New Job Description";
    default:
      return normalizeJdStatus(status);
  }
}

function JdStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex w-fit items-center justify-center whitespace-nowrap
        rounded-md px-3 py-2 text-[11px] font-bold leading-none ${getJdStatusClass(
          status,
        )}`}
    >
      {getJdStatusLabel(status)}
    </span>
  );
}

function getLatestRevision(item) {
  const revisionHistory = Array.isArray(item.revisionHistory)
    ? item.revisionHistory
    : [];

  return revisionHistory[0];
}

function getVersion(item) {
  return item.version || item.jdVersion || item.currentVersion || "—";
}

function getLastApproved(item) {
  return (
    item.lastApproved ||
    item.lastApprovedDate ||
    item.approvedDate ||
    getLatestRevision(item)?.revisedDate ||
    ""
  );
}

function JobDescriptionMobileCard({ item, onView }) {
  const latestRevision = getLatestRevision(item);

  return (
    <button
      type="button"
      onClick={onView}
      className="w-full rounded-xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-sibs-primary-1">
            {item.jdCode || "—"}
          </p>

          <h3 className="mt-1 text-sm font-bold text-[#101828]">
            {item.roleTitle || "—"}
          </h3>

          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
            {item.account || "—"} / {item.department || "—"}
          </p>
        </div>

        <JdStatusBadge status={item.jdStatus} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Owner
          </p>

          <p className="mt-1 text-xs font-bold text-[#344054]">
            {item.owner || "—"}
          </p>
        </div>

        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Linked Req.
          </p>

          <p className="mt-1 text-xs font-bold text-[#344054]">
            {item.linkedHiringRequirement || "—"}
          </p>
        </div>
      </div>

      <div className="mt-3 text-xs font-semibold text-sibs-tertiary-5">
        Latest Revision:{" "}
        <span className="font-bold text-[#344054]">
          {latestRevision
            ? `${formatDate(latestRevision.revisedDate)} by ${
                latestRevision.revisedBy || "—"
              }`
            : "—"}
        </span>
      </div>
    </button>
  );
}

const JobDescriptionTable = ({ jobDescriptionList = [], onView }) => {
  const { search, filterValues, setTableHeader, setPagination } = usePagination(
    JOB_DESCRIPTION_ENTITY,
  );

  const tableHeader = useMemo(
    () => ({
      title: "Job Description List",
      description: "Search and filter JD records.",
      searchPlaceholder: "Search JD, role, account, owner...",
      filters: [
        {
          key: "status",
          defaultValue: "All Status",
          options: [
            { label: "All Status", value: "All Status" },
            { label: "Existing", value: "Existing" },
            { label: "For Revision", value: "For Revision" },
            { label: "New Job Description", value: "New Job Description" },
          ],
        },
      ],
    }),
    [],
  );

  useEffect(() => {
    setTableHeader(tableHeader);
  }, [setTableHeader, tableHeader]);

  const filteredList = useMemo(() => {
    const keyword = String(search || "")
      .trim()
      .toLowerCase();
    const jdStatusFilter = filterValues?.status || "All Status";

    return jobDescriptionList.filter((item) => {
      const matchesSearch =
        !keyword ||
        safeText(item.jdCode).includes(keyword) ||
        safeText(item.roleTitle).includes(keyword) ||
        safeText(item.account).includes(keyword) ||
        safeText(item.department).includes(keyword) ||
        safeText(item.owner).includes(keyword) ||
        safeText(item.linkedHiringRequirement).includes(keyword);

      const matchesJdStatus =
        jdStatusFilter === "All Status" ||
        normalizeJdStatus(item.jdStatus) === jdStatusFilter;

      return matchesSearch && matchesJdStatus;
    });
  }, [jobDescriptionList, search, filterValues]);

  useEffect(() => {
    setPagination({
      totalPages: 1,
      currentPage: 1,
      total: filteredList.length,
      limit: filteredList.length || 15,
    });
  }, [filteredList.length, setPagination]);

  return (
    <div className="flex h-[calc(100dvh-220px)] flex-col overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="shrink-0 border-b border-gray-100">
        <TableHeader tableEntity={JOB_DESCRIPTION_ENTITY} />
      </div>

      <div className="min-h-0 flex-1 p-4 sm:p-6">
        <div className="h-full lg:hidden">
          <div className="thin-scroll h-full overflow-y-auto">
            {filteredList.length > 0 ? (
              <div className="space-y-3">
                {filteredList.map((item) => (
                  <JobDescriptionMobileCard
                    key={item.id}
                    item={item}
                    onView={() => onView?.(item)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                No job description records found.
              </div>
            )}
          </div>
        </div>

        <div className="hidden h-full overflow-hidden rounded-lg border border-[#E5E7EB] bg-white lg:block">
          <div className="thin-scroll h-full overflow-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-100">
                <tr className="border-b border-[#E5E7EB] text-[12px] font- text-[#344054]">
                  <th className="px-5 py-4">Job Title</th>
                  <th className="px-5 py-4">JD Code</th>
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Version</th>
                  <th className="px-5 py-4">Last Approved</th>
                  <th className="px-5 py-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {filteredList.length > 0 ? (
                  filteredList.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#EEF2F6] transition hover:bg-[#F8FAFC]"
                    >
                      <td className="px-5 py-4 text-[13px] font-semibold text-[#344054]">
                        {item.roleTitle || "—"}
                      </td>

                      <td className="px-5 py-4 text-[13px] font-semibold text-[#344054]">
                        {item.jdCode || "—"}
                      </td>

                      <td className="px-5 py-4 text-[13px] font-semibold text-[#344054]">
                        {item.department || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <JdStatusBadge status={item.jdStatus} />
                      </td>

                      <td className="px-5 py-4 text-[13px] font-semibold text-[#344054]">
                        {getVersion(item)}
                      </td>

                      <td className="px-5 py-4 text-[13px] font-semibold text-[#344054]">
                        {formatDate(getLastApproved(item))}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => onView?.(item)}
                          className="inline-flex items-center justify-center gap-2 
                            rounded-xl border border-[#E6ECF2] bg-white px-4 py-2
                            text-xs font-bold text-sibs-primary-1 transition
                            hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5
                            hover:cursor-pointer"
                        >
                          <Eye size={15} />
                          Preview
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                    >
                      No job description records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="shrink-0">
        <TableFooter
          tableEntity={JOB_DESCRIPTION_ENTITY}
          totalLabel="Total Job Descriptions"
        />
      </div>
    </div>
  );
};

export default JobDescriptionTable;
