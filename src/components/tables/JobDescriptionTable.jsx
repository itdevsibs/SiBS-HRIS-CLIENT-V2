import React, { useEffect, useMemo } from "react";
import { Eye, UserRound } from "lucide-react";
import TableHeader from "./tableHeader/TableHeader";
import { usePagination } from "@/services/context/PaginationContext";
import TableFooter from "./footer/TableFooter";

const JOB_DESCRIPTION_ENTITY = "job-descriptions";

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeJdStatus(status) {
  if (status === "New JD") return "New Job Description";
  return status || "New Job Description";
}

function getJdStatusClass(status) {
  switch (normalizeJdStatus(status)) {
    case "Existing":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "For Revision":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "New Job Description":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function JobDescriptionMobileCard({ item, onView }) {
  const revisionHistory = Array.isArray(item.revisionHistory)
    ? item.revisionHistory
    : [];

  const latestRevision = revisionHistory[0];

  return (
    <button
      type="button"
      onClick={onView}
      className="w-full rounded-xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-[var(--sibs-primary-1)]/40 hover:bg-[#F8FAFC]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-sibs-primary-1">{item.jdCode}</p>

          <h3 className="mt-1 text-sm font-bold text-[#101828]">
            {item.roleTitle}
          </h3>

          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
            {item.account} / {item.department}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getJdStatusClass(
            item.jdStatus,
          )}`}
        >
          {normalizeJdStatus(item.jdStatus)}
        </span>
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
                latestRevision.revisedBy
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
    const keyword = search.trim().toLowerCase();
    const jdStatusFilter = filterValues?.status || "All Status";

    return jobDescriptionList.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.jdCode.toLowerCase().includes(keyword) ||
        item.roleTitle.toLowerCase().includes(keyword) ||
        item.account.toLowerCase().includes(keyword) ||
        item.department.toLowerCase().includes(keyword) ||
        item.owner.toLowerCase().includes(keyword) ||
        String(item.linkedHiringRequirement || "")
          .toLowerCase()
          .includes(keyword);

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
      <div className="shrink-0">
        <TableHeader tableEntity={JOB_DESCRIPTION_ENTITY} />
      </div>

      <div className="min-h-0 flex-1 p-4">
        <div className="h-full lg:hidden">
          <div className="h-full overflow-y-auto">
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
              <div className="flex h-full min-h-[280px] items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                No job description records found.
              </div>
            )}
          </div>
        </div>

        <div className="hidden h-full overflow-hidden rounded-xl border border-[#E6ECF2] lg:block bg-white">
          <div className="h-full overflow-x-auto overflow-y-auto">
            <table className="w-full min-w-[1080px] border-separate border-spacing-0 text-left">
              <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
                <tr className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  <th className="border-b border-[#E6ECF2] px-5 py-4">
                    JD Code
                  </th>
                  <th className="border-b border-[#E6ECF2] px-5 py-4">
                    Role / Account
                  </th>
                  <th className="border-b border-[#E6ECF2] px-5 py-4">
                    Department
                  </th>
                  <th className="border-b border-[#E6ECF2] px-5 py-4">
                    JD Status
                  </th>
                  <th className="border-b border-[#E6ECF2] px-5 py-4">Owner</th>
                  <th className="border-b border-[#E6ECF2] px-5 py-4">
                    Linked Requirement
                  </th>
                  <th className="border-b border-[#E6ECF2] px-5 py-4">
                    Latest Revision
                  </th>
                  <th className="border-b border-[#E6ECF2] px-5 py-4 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {filteredList.length > 0 ? (
                  filteredList.map((item) => {
                    const revisionHistory = Array.isArray(item.revisionHistory)
                      ? item.revisionHistory
                      : [];

                    const latestRevision = revisionHistory[0];

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-[#E6ECF2] transition hover:bg-[#F8FAFC]"
                      >
                        <td className="border-b border-[#E6ECF2] px-5 py-4 text-sm font-bold text-sibs-primary-1">
                          {item.jdCode}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-4">
                          <p className="text-sm font-bold text-[#101828]">
                            {item.roleTitle}
                          </p>
                          <p className="text-xs font-semibold text-sibs-tertiary-5">
                            {item.account}
                          </p>
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-4 text-sm font-semibold text-[#344054]">
                          {item.department}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getJdStatusClass(
                              item.jdStatus,
                            )}`}
                          >
                            {normalizeJdStatus(item.jdStatus)}
                          </span>
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-4 text-sm font-semibold text-[#344054]">
                          <div className="flex items-center gap-2">
                            <UserRound size={15} className="text-gray-400" />
                            {item.owner}
                          </div>
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-4 text-sm font-bold text-[#344054]">
                          {item.linkedHiringRequirement || "—"}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-4 text-sm font-semibold text-[#344054]">
                          {latestRevision ? (
                            <div>
                              <p className="font-bold text-purple-700">
                                {formatDate(latestRevision.revisedDate)}
                              </p>
                              <p className="text-xs text-sibs-tertiary-5">
                                by {latestRevision.revisedBy}
                              </p>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => onView?.(item)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 py-2 text-xs font-bold text-sibs-primary-1 transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5"
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
                    <td colSpan={8} className="px-5 py-12">
                      <div className="flex min-h-[280px] items-center justify-center text-center text-sm font-bold text-gray-500">
                        No job description records found.
                      </div>
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
