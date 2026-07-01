import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Eye, RotateCcw, Search } from "lucide-react";
import { usePagination } from "../../../services/context/PaginationContext";
import TableFooter from "../footer/TableFooter";
import { useNavigate } from "react-router-dom";


const JOB_DESCRIPTION_ENTITY = "job-descriptions";

const JD_VIEW_OPTIONS = [
  { label: "All JD", value: "All JD" },
  { label: "For Approval", value: "For Approval" },
  { label: "Active JD", value: "Active JD" },
  { label: "Archived JD", value: "Archived JD" },
];

const JD_STATUS_OPTIONS = [
  { label: "All Status", value: "All Status" },
  { label: "Existing", value: "Existing" },
  { label: "Approved", value: "Approved" },
  { label: "For Revision", value: "For Revision" },
  { label: "For Approval", value: "For Approval" },
  { label: "New Job Description", value: "New Job Description" },
  { label: "Archived", value: "Archived" },
];

function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function safeText(value) {
  return String(value || "").toLowerCase();
}

function normalizeJdStatus(status) {
  const value = String(status || "").trim();

  if (value === "New JD") return "New Job Description";

  return value || "New Job Description";
}

function getRealJdStatus(item = {}) {
  return normalizeJdStatus(
    item.jdStatus ||
      item.jd_status ||
      item.raw?.jdStatus ||
      item.raw?.jd_status ||
      item.status,
  );
}

function getJdStatusClass(status) {
  switch (normalizeJdStatus(status)) {
    case "Existing":
    case "Active":
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "For Approval":
      return "border-[#FFBFA8] bg-[#FFF3ED] text-sibs-primary-2";

    case "New Job Description":
    case "New JD":
    case "Draft":
      return "border-[#B7D4FF] bg-[#EEF6FF] text-[#1454D9]";

    case "For Revision":
      return "border-[#F6C84C] bg-[#FFF8E6] text-[#9A6400]";

    case "Returned for Revision":
    case "Rejected":
    case "Declined":
      return "border-red-200 bg-red-50 text-red-700";

    case "Archived":
    case "Archived JD":
      return "border-[#D6DEE8] bg-[#F8FAFC] text-[#475467]";

    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getJdStatusLabel(status) {
  const normalizedStatus = normalizeJdStatus(status);

  switch (normalizedStatus) {
    case "Existing":
      return "Existing";

    case "Active":
      return "Active";

    case "Approved":
      return "Approved";

    case "For Revision":
      return "For Revision";

    case "For Approval":
      return "For Approval";

    case "New Job Description":
      return "New Job Description";

    case "Archived":
    case "Archived JD":
      return "Archived";

    default:
      return normalizedStatus || "—";
  }
}

function getJdViewStatus(item) {
  const status = getRealJdStatus(item);

  if (status === "Existing" || status === "Active" || status === "Approved") {
    return "Active JD";
  }

  if (status === "For Approval") {
    return "For Approval";
  }

  if (status === "Archived" || status === "Archived JD") {
    return "Archived JD";
  }

  return "All JD";
}

function JdStatusBadge({ status }) {
  const realStatus = normalizeJdStatus(status);

  return (
    <span
      className={`inline-flex w-fit min-w-[92px] items-center justify-center whitespace-nowrap rounded-full border px-3.5 py-1.5 text-center text-xs font-extrabold leading-none ${getJdStatusClass(
        realStatus,
      )}`}
    >
      {getJdStatusLabel(realStatus)}
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

function AnimatedDropdown({ open, children, className = "", maxHeight = "" }) {
  return (
    <div
      className={`sibs-animated-dropdown absolute left-0 right-0 top-full z-50 mt-2 ${
        open ? "open" : "closed"
      } ${className}`}
    >
      <div className="sibs-animated-dropdown-inner">
        <div className="sibs-animated-dropdown-box">
          <div className={`${maxHeight} overflow-y-auto py-2 sibs-scrollbar`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function JobDescriptionMobileCard({ item, onView }) {
  const latestRevision = getLatestRevision(item);
  const realStatus = getRealJdStatus(item);

  return (
    <button
      type="button"
      onClick={onView}
      className="w-full rounded-xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] hover:shadow-md active:scale-[0.99]"
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

        <JdStatusBadge status={realStatus} />
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

function FilterDropdown({
  label,
  value,
  search,
  setSearch,
  show,
  setShow,
  options = [],
  selectedValue,
  onSelect,
  placeholder = "Search...",
  dropdownRef,
  zIndex = "z-40",
}) {
  const filteredOptions = useMemo(() => {
    const keyword = String(search || "")
      .trim()
      .toLowerCase();

    if (!keyword) return options;

    return options.filter((option) =>
      String(option.label || option.value || "")
        .toLowerCase()
        .includes(keyword),
    );
  }, [options, search]);

  return (
    <div ref={dropdownRef} className={`relative ${zIndex}`}>
      <label className="mb-1 block text-sm font-bold text-[#101828]">
        {label}
      </label>

      <div className="relative">
        <input
          type="text"
          value={show ? search : value}
          onChange={(e) => {
            setSearch(e.target.value);
            setShow(true);
          }}
          onFocus={() => {
            setSearch("");
            setShow(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pr-11 text-sm font-bold text-[#344054] outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
        />

        <ChevronDown
          size={18}
          onClick={() => {
            setSearch("");
            setShow((prev) => !prev);
          }}
          className={`absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-sibs-tertiary-5 transition-transform duration-300 ${
            show ? "rotate-180" : ""
          }`}
        />

        <AnimatedDropdown open={show} maxHeight="max-h-64">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const selected = selectedValue === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onSelect(option.value);
                    setSearch("");
                    setShow(false);
                  }}
                  className={`block w-full px-4 py-3 text-left text-sm transition ${
                    selected
                      ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                      : "text-[#344054] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span className="block truncate">{option.label}</span>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-4 text-sm font-semibold text-sibs-tertiary-5">
              No option found.
            </div>
          )}
        </AnimatedDropdown>
      </div>
    </div>
  );
}

const JobDescriptionTable = ({ jobDescriptionList = [], onView }) => {
  const { setPagination } = usePagination(JOB_DESCRIPTION_ENTITY);

  const jdViewDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");

  const [jdViewFilter, setJdViewFilter] = useState("All JD");
  const [jdViewSearch, setJdViewSearch] = useState("");
  const [showJdViewDropdown, setShowJdViewDropdown] = useState(false);

  const [statusFilter, setStatusFilter] = useState("All Status");
  const [statusSearch, setStatusSearch] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        jdViewDropdownRef.current &&
        !jdViewDropdownRef.current.contains(e.target)
      ) {
        setShowJdViewDropdown(false);
      }

      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(e.target)
      ) {
        setShowStatusDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredList = useMemo(() => {
    const keyword = String(searchInput || "")
      .trim()
      .toLowerCase();

    return jobDescriptionList.filter((item) => {
      const realStatus = getRealJdStatus(item);
      const jdViewStatus = getJdViewStatus(item);

      const matchesSearch =
        !keyword ||
        safeText(item.jdCode).includes(keyword) ||
        safeText(item.roleTitle).includes(keyword) ||
        safeText(item.account).includes(keyword) ||
        safeText(item.department).includes(keyword) ||
        safeText(item.owner).includes(keyword) ||
        safeText(item.linkedHiringRequirement).includes(keyword) ||
        safeText(getVersion(item)).includes(keyword) ||
        safeText(getJdStatusLabel(realStatus)).includes(keyword);

      const matchesJdView =
        jdViewFilter === "All JD" || jdViewStatus === jdViewFilter;

      const matchesJdStatus =
        statusFilter === "All Status" || realStatus === statusFilter;

      return matchesSearch && matchesJdView && matchesJdStatus;
    });
  }, [jobDescriptionList, searchInput, jdViewFilter, statusFilter]);

  useEffect(() => {
    setPagination({
      totalPages: 1,
      currentPage: 1,
      total: filteredList.length,
      limit: filteredList.length || 15,
    });
  }, [filteredList.length, setPagination]);

  const hasActiveFilters =
    searchInput.trim() ||
    jdViewFilter !== "All JD" ||
    statusFilter !== "All Status";

  function handleClearFilters() {
    setSearchInput("");
    setJdViewFilter("All JD");
    setJdViewSearch("");
    setShowJdViewDropdown(false);
    setStatusFilter("All Status");
    setStatusSearch("");
    setShowStatusDropdown(false);
  }

  function handleOpenFullPageView(item) {
    const jdId = item?.rawId || item?.raw?.id || item?.id;

    if (!jdId) return;

    navigate(`/recruitment/job-description/view/${jdId}`, {
      state: {
        jobDescription: item,
      },
    });
  }

  return (
    <div className="flex h-[calc(100dvh-220px)] flex-col overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
      <div className="shrink-0 border-b border-[#E6ECF2]">
        <section className="overflow-visible rounded-t-2xl bg-white">
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.4fr_0.5fr_0.5fr_auto] xl:items-end">
              <div>
                <label className="mb-1 block text-sm font-bold text-[#101828]">
                  Search
                </label>

                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                  />

                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search JD, role, account, owner..."
                    className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                  />
                </div>
              </div>

              <FilterDropdown
                label="JD View"
                value={jdViewFilter}
                search={jdViewSearch}
                setSearch={setJdViewSearch}
                show={showJdViewDropdown}
                setShow={(value) => {
                  setShowJdViewDropdown(value);
                  if (value) setShowStatusDropdown(false);
                }}
                options={JD_VIEW_OPTIONS}
                selectedValue={jdViewFilter}
                onSelect={setJdViewFilter}
                placeholder="Search JD view..."
                dropdownRef={jdViewDropdownRef}
                zIndex="z-50"
              />

              <FilterDropdown
                label="Status"
                value={statusFilter}
                search={statusSearch}
                setSearch={setStatusSearch}
                show={showStatusDropdown}
                setShow={(value) => {
                  setShowStatusDropdown(value);
                  if (value) setShowJdViewDropdown(false);
                }}
                options={JD_STATUS_OPTIONS}
                selectedValue={statusFilter}
                onSelect={setStatusFilter}
                placeholder="Search status..."
                dropdownRef={statusDropdownRef}
                zIndex="z-40"
              />

              <button
                type="button"
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={17} />
                Clear
              </button>
            </div>
          </div>
        </section>
      </div>

      <div
        key={`${jdViewFilter}-${statusFilter}-${searchInput}`}
        className="min-h-0 flex-1 p-4 sibs-profile-tab-panel sm:p-6"
      >
        <div className="h-full lg:hidden">
          <div className="thin-scroll h-full overflow-y-auto">
            {filteredList.length > 0 ? (
              <div className="space-y-3">
                {filteredList.map((item) => (
                  <JobDescriptionMobileCard
                    key={item.id}
                    item={item}
                    onView={() => handleOpenFullPageView(item)}
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

        <div className="hidden h-full overflow-hidden rounded-2xl bg-white lg:block">
          <div className="thin-scroll h-full overflow-auto">
            <table className="w-full min-w-[980px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left text-sm">
              <thead>
                <tr className="bg-[#F5F7FA] text-[12px] font-extrabold uppercase tracking-wide text-[#174A7C]">
                  <th className="px-5 py-4 first:rounded-tl-2xl">
                    Job Title
                  </th>
                  <th className="px-5 py-4">JD Code</th>
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-center">Version</th>
                  <th className="px-5 py-4">Last Approved</th>
                  <th className="px-5 py-4 text-center last:rounded-tr-2xl">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {filteredList.length > 0 ? (
                  filteredList.map((item) => {
                    const realStatus = getRealJdStatus(item);

                    return (
                      <tr
                        key={item.id}
                        className="transition hover:bg-[#F8FAFC]"
                      >
                        <td className="border-b border-[#E6ECF2] px-5 py-4 text-[13px] font-semibold text-[#344054]">
                          {item.roleTitle || "—"}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-4 text-[13px] font-semibold text-[#344054]">
                          {item.jdCode || "—"}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-4 text-[13px] font-semibold text-[#344054]">
                          {item.department || "—"}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-4 text-center">
                          <JdStatusBadge status={realStatus} />
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-4 text-center text-[13px] font-semibold text-[#344054]">
                          {getVersion(item)}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-4 text-[13px] font-semibold text-[#344054]">
                          {formatDate(getLastApproved(item))}
                        </td>

                        <td className="border-b border-[#E6ECF2] px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenFullPageView(item)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 py-2 text-xs font-bold text-sibs-primary-1 transition hover:cursor-pointer hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5 hover:shadow-sm active:scale-[0.98]"
                          >
                            <Eye size={15} />
                            Preview
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="border-b border-[#E6ECF2] px-5 py-12 text-center text-sm font-bold text-gray-500"
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