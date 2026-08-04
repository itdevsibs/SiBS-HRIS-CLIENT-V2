import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  FileText,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { usePagination } from "../../../services/context/PaginationContext";
import PaginationTable from "../../../services/pagination/PaginationTable";

const JOB_DESCRIPTION_ENTITY = "job-descriptions";
const PAGE_LIMIT = 15;

const STATUS_TABS = [
  { key: "all", label: "All JDs" },
  { key: "existing", label: "Existing / Ready" },
  { key: "revision", label: "For Revision" },
  { key: "new", label: "New Job Description" },
  { key: "approval", label: "For Approval" },
  { key: "rejected", label: "Rejected" },
];

function getFirstValue(...values) {
  return values.find((value) => String(value ?? "").trim()) ?? "";
}

function safeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeJdStatus(status) {
  const value = String(status || "").trim();

  if (value === "New JD") return "New Job Description";
  if (value === "Archived JD") return "Archived";

  return value || "New Job Description";
}

function getRealJdStatus(item = {}) {
  return normalizeJdStatus(
    getFirstValue(
      item.jdStatus,
      item.jd_status,
      item.raw?.jdStatus,
      item.raw?.jd_status,
      item.status,
      item.raw?.status,
    ),
  );
}

function getRecordId(item = {}) {
  return getFirstValue(item.rawId, item.raw_id, item.raw?.id, item.id);
}

function getRoleTitle(item = {}) {
  return getFirstValue(
    item.roleTitle,
    item.role_title,
    item.title,
    item.raw?.roleTitle,
    item.raw?.role_title,
    item.raw?.title,
  );
}

function getDocumentTitle(item = {}) {
  return getFirstValue(
    item.documentTitle,
    item.document_title,
    item.fileName,
    item.file_name,
    item.raw?.documentTitle,
    item.raw?.document_title,
    item.raw?.fileName,
    item.raw?.file_name,
  );
}

function getJdCode(item = {}) {
  return getFirstValue(
    item.jdCode,
    item.jd_code,
    item.raw?.jdCode,
    item.raw?.jd_code,
  );
}

function getDepartment(item = {}) {
  return getFirstValue(
    item.department,
    item.departmentName,
    item.department_name,
    item.raw?.department,
    item.raw?.departmentName,
    item.raw?.department_name,
  );
}

function getAccount(item = {}) {
  return getFirstValue(
    item.account,
    item.accountName,
    item.account_name,
    item.preparedFor,
    item.prepared_for,
    item.raw?.account,
    item.raw?.accountName,
    item.raw?.account_name,
    item.raw?.preparedFor,
    item.raw?.prepared_for,
  );
}

function getLinkedHiringNeed(item = {}) {
  return getFirstValue(
    item.linkedHiringRequirement,
    item.linked_hiring_requirement,
    item.linkedHiringNeed,
    item.linked_hiring_need,
    item.existingJdId,
    item.existing_jd_id,
    item.raw?.linkedHiringRequirement,
    item.raw?.linked_hiring_requirement,
    item.raw?.linkedHiringNeed,
    item.raw?.linked_hiring_need,
    item.raw?.existingJdId,
    item.raw?.existing_jd_id,
  );
}

function getSupervisoryLevel(item = {}) {
  const explicitLevel = getFirstValue(
    item.supervisoryLevel,
    item.supervisory_level,
    item.level,
    item.raw?.supervisoryLevel,
    item.raw?.supervisory_level,
    item.raw?.level,
  );

  if (explicitLevel) return String(explicitLevel).trim();

  const supervisory = getFirstValue(item.supervisory, item.raw?.supervisory);
  const normalized = safeText(supervisory);

  if (["yes", "true", "1"].includes(normalized)) return "Supervisory";
  if (["no", "false", "0"].includes(normalized))
    return "Individual Contributor";

  return String(supervisory || "").trim();
}

function getVersion(item = {}) {
  return getFirstValue(
    item.version,
    item.jdVersion,
    item.jd_version,
    item.currentVersion,
    item.current_version,
    item.revisionNo,
    item.revision_no,
    item.raw?.version,
    item.raw?.jdVersion,
    item.raw?.jd_version,
    item.raw?.currentVersion,
    item.raw?.current_version,
    item.raw?.revisionNo,
    item.raw?.revision_no,
  );
}

function getDateValue(item = {}) {
  return getFirstValue(
    item.lastApproved,
    item.lastApprovedDate,
    item.last_approved_date,
    item.approvedDate,
    item.approved_date,
    item.effectiveDate,
    item.effective_date,
    item.dateRequested,
    item.date_requested,
    item.updatedAt,
    item.updated_at,
    item.raw?.lastApproved,
    item.raw?.approvedDate,
    item.raw?.effectiveDate,
    item.raw?.dateRequested,
    item.raw?.updatedAt,
  );
}

function formatDate(value) {
  if (!value) return "--";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isExistingStatus(status) {
  return ["Existing", "Active", "Approved"].includes(status);
}

function isRevisionStatus(status) {
  return ["For Revision", "Returned for Revision"].includes(status);
}

function isNewStatus(status) {
  return ["New Job Description", "Draft", "For Approval"].includes(status);
}

function isRejectedStatus(status) {
  return ["Rejected", "Declined"].includes(status);
}

function matchesStatusTab(status, tabKey) {
  switch (tabKey) {
    case "existing":
      return isExistingStatus(status);
    case "revision":
      return isRevisionStatus(status);
    case "new":
      return isNewStatus(status);
    case "approval":
      return status === "For Approval";
    case "rejected":
      return isRejectedStatus(status);
    default:
      return true;
  }
}

function getJdStatusClass(status) {
  switch (normalizeJdStatus(status)) {
    case "Existing":
    case "Active":
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "For Revision":
    case "Returned for Revision":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "For Approval":
      return "border-orange-200 bg-orange-50 text-[#D9480F]";
    case "New Job Description":
    case "Draft":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Rejected":
    case "Declined":
      return "border-red-200 bg-red-50 text-red-700";
    case "Archived":
      return "border-slate-200 bg-slate-50 text-slate-600";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function StatusIcon({ status }) {
  if (isExistingStatus(status)) return <CheckCircle2 size={13} />;
  if (isRevisionStatus(status)) return <AlertTriangle size={13} />;
  if (isRejectedStatus(status)) return <AlertCircle size={13} />;
  return <Clock3 size={13} />;
}

function JdStatusBadge({ status }) {
  const normalized = normalizeJdStatus(status);

  return (
    <span
      className={`inline-flex w-fit items-center justify-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${getJdStatusClass(
        normalized,
      )}`}
    >
      <StatusIcon status={normalized} />
      {normalized}
    </span>
  );
}

function uniqueOptions(items, getter, allLabel) {
  const values = [
    ...new Set(
      items.map((item) => String(getter(item) || "").trim()).filter(Boolean),
    ),
  ].sort((left, right) => left.localeCompare(right));

  return [allLabel, ...values];
}

function toDropdownOptions(options, allLabel) {
  return options
    .filter((option) => option !== allLabel)
    .map((option) => ({
      label: option,
      value: option,
    }));
}

function JobDescriptionMobileCard({ item, onView, onRevise }) {
  const status = getRealJdStatus(item);
  const roleTitle = getRoleTitle(item) || "Untitled Job Description";
  const documentTitle = getDocumentTitle(item) || getJdCode(item) || "--";
  const department = getDepartment(item) || "--";
  const account = getAccount(item) || "--";
  const linkedHiringNeed = getLinkedHiringNeed(item) || "--";
  const supervisoryLevel = getSupervisoryLevel(item) || "--";
  const version = getVersion(item) || "--";

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onView(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onView(item);
        }
      }}
      className="cursor-pointer rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm transition hover:border-[#FF5C28]/35 hover:bg-[#FFFDFC] hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-start gap-2">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5C28]" />
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold leading-5 text-[#042C51]">
                {roleTitle}
              </h3>
              <p className="mt-0.5 break-all text-[10px] font-semibold text-[#98A2B3]">
                {documentTitle}
              </p>
            </div>
          </div>
        </div>
        <JdStatusBadge status={status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[9px] font-extrabold uppercase tracking-normal text-[#98A2B3]">
            Department / Account
          </p>
          <p className="mt-1 text-xs font-extrabold text-[#042C51]">
            {department}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-[#667085]">
            {account}
          </p>
        </div>
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[9px] font-extrabold uppercase tracking-normal text-[#98A2B3]">
            Date / Version
          </p>
          <p className="mt-1 text-xs font-extrabold text-[#042C51]">
            {version}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-[#667085]">
            {formatDate(getDateValue(item))}
          </p>
        </div>
      </div>

      <dl className="mt-3 space-y-2 text-[10px] font-semibold text-[#667085]">
        <div>
          <dt className="inline font-extrabold text-[#042C51]">
            Linked Hiring Need:
          </dt>{" "}
          <dd className="inline">{linkedHiringNeed}</dd>
        </div>
        <div>
          <dt className="inline font-extrabold text-[#042C51]">
            Supervisory Level:
          </dt>{" "}
          <dd className="inline">{supervisoryLevel}</dd>
        </div>
      </dl>

      <div className="mt-4 flex justify-end gap-2 border-t border-[#EEF2F6] pt-3">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onView(item);
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#F2F6FA] px-3 text-xs font-extrabold text-[#042C51] transition hover:bg-[#042C51] hover:text-white"
        >
          <Eye size={14} />
          View
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRevise(item);
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-amber-50 px-3 text-xs font-extrabold text-amber-700 transition hover:bg-amber-600 hover:text-white"
        >
          <Edit3 size={14} />
          Revise
        </button>
      </div>
    </article>
  );
}

export default function JobDescriptionTable({
  jobDescriptionList = [],
  onRevise,
}) {
  const navigate = useNavigate();
  const { setPagination } = usePagination(JOB_DESCRIPTION_ENTITY);

  const [selectedStatusTab, setSelectedStatusTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [accountFilter, setAccountFilter] = useState("All Accounts");
  const [supervisoryFilter, setSupervisoryFilter] = useState("All Levels");
  const [currentPage, setCurrentPage] = useState(1);

  const departmentOptions = useMemo(
    () => uniqueOptions(jobDescriptionList, getDepartment, "All Departments"),
    [jobDescriptionList],
  );
  const accountOptions = useMemo(
    () => uniqueOptions(jobDescriptionList, getAccount, "All Accounts"),
    [jobDescriptionList],
  );
  const supervisoryOptions = useMemo(
    () => uniqueOptions(jobDescriptionList, getSupervisoryLevel, "All Levels"),
    [jobDescriptionList],
  );

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(STATUS_TABS.map((tab) => [tab.key, 0]));

    for (const item of jobDescriptionList) {
      const status = getRealJdStatus(item);
      counts.all += 1;
      if (isExistingStatus(status)) counts.existing += 1;
      if (isRevisionStatus(status)) counts.revision += 1;
      if (isNewStatus(status)) counts.new += 1;
      if (status === "For Approval") counts.approval += 1;
      if (isRejectedStatus(status)) counts.rejected += 1;
    }

    return counts;
  }, [jobDescriptionList]);

  const filteredList = useMemo(() => {
    const keyword = safeText(searchTerm);

    return jobDescriptionList.filter((item) => {
      const status = getRealJdStatus(item);
      const department = getDepartment(item);
      const account = getAccount(item);
      const supervisoryLevel = getSupervisoryLevel(item);

      const searchableValues = [
        getRoleTitle(item),
        getDocumentTitle(item),
        getJdCode(item),
        department,
        account,
        getLinkedHiringNeed(item),
        supervisoryLevel,
        status,
      ];

      const matchesSearch =
        !keyword ||
        searchableValues.some((value) => safeText(value).includes(keyword));
      const matchesDepartment =
        departmentFilter === "All Departments" ||
        department === departmentFilter;
      const matchesAccount =
        accountFilter === "All Accounts" || account === accountFilter;
      const matchesSupervisory =
        supervisoryFilter === "All Levels" ||
        supervisoryLevel === supervisoryFilter;
      const matchesTab = matchesStatusTab(status, selectedStatusTab);

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesAccount &&
        matchesSupervisory &&
        matchesTab
      );
    });
  }, [
    accountFilter,
    departmentFilter,
    jobDescriptionList,
    searchTerm,
    selectedStatusTab,
    supervisoryFilter,
  ]);

  const totalPages = Math.max(Math.ceil(filteredList.length / PAGE_LIMIT), 1);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const paginatedList = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_LIMIT;

    return filteredList.slice(start, start + PAGE_LIMIT);
  }, [filteredList, safeCurrentPage]);

  useEffect(() => {
    setPagination({
      totalPages,
      currentPage: safeCurrentPage,
      total: filteredList.length,
      limit: PAGE_LIMIT,
    });
  }, [filteredList.length, safeCurrentPage, setPagination, totalPages]);

  const hasActiveFilters =
    searchTerm.trim() ||
    departmentFilter !== "All Departments" ||
    accountFilter !== "All Accounts" ||
    supervisoryFilter !== "All Levels" ||
    selectedStatusTab !== "all";

  function handleResetFilters() {
    setSearchTerm("");
    setDepartmentFilter("All Departments");
    setAccountFilter("All Accounts");
    setSupervisoryFilter("All Levels");
    setSelectedStatusTab("all");
    setCurrentPage(1);
  }

  function updateFilter(setter, value) {
    setter(value);
    setCurrentPage(1);
  }

  function handleOpenFullPageView(item) {
    const jdId = getRecordId(item);

    if (!jdId) return;

    navigate(`/recruitment/job-description/view/${encodeURIComponent(jdId)}`, {
      state: {
        jobDescription: item,
      },
    });
  }

  function handleOpenRevision(item) {
    if (typeof onRevise === "function") {
      onRevise(item);
    }
  }

  return (
    <section className="sibs-profile-tab-panel sibs-page-card-in overflow-visible rounded-2xl border border-[#E6ECF2] bg-white font-jakarta shadow-sm">
      <div className="border-b border-[#E6ECF2] px-4 py-5 sm:px-5">
        <h2 className="sibs-section-title">Job Description Records</h2>
        <p className="sibs-section-subtitle">
          Search and filter JD records by role, department, account, and
          supervisory level.
        </p>
      </div>

      <div className="relative space-y-5 overflow-visible p-4 sm:p-5">
        <PaginationTable
          filterLayout="ta-inline"
          showFilterPanel={false}
          showFilterHeader={false}
          showPagination={false}
          searchValue={searchTerm}
          searchPlaceholder="Search role title, document, department, account, or hiring need..."
          onSearchChange={(value) => updateFilter(setSearchTerm, value)}
          dropdownFilters={[
            {
              key: "department",
              value: departmentFilter,
              options: toDropdownOptions(departmentOptions, "All Departments"),
              onChange: (value) => updateFilter(setDepartmentFilter, value),
              includeAll: true,
              allLabel: "All Departments",
              label: "Department",
              placeholder: "Search departments...",
              searchable: true,
            },
            {
              key: "account",
              value: accountFilter,
              options: toDropdownOptions(accountOptions, "All Accounts"),
              onChange: (value) => updateFilter(setAccountFilter, value),
              includeAll: true,
              allLabel: "All Accounts",
              label: "Account",
              placeholder: "Search accounts...",
              searchable: true,
            },
            {
              key: "supervisory",
              value: supervisoryFilter,
              options: toDropdownOptions(supervisoryOptions, "All Levels"),
              onChange: (value) => updateFilter(setSupervisoryFilter, value),
              includeAll: true,
              allLabel: "All Levels",
              label: "Supervisory Level",
              placeholder: "Search levels...",
              searchable: true,
            },
          ]}
          rightContent={
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#E6ECF2] bg-white px-3 text-xs font-extrabold text-[#98A2B3] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF7F3] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#E6ECF2] disabled:hover:bg-white disabled:hover:text-[#98A2B3] xl:w-auto"
            >
              <RotateCcw size={14} />
              Clear
            </button>
          }
          className="border-0 bg-transparent p-0 shadow-none"
        />

        <div className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-white">
          <div className="flex overflow-x-auto border-b border-[#E6ECF2] bg-[#F8FAFC] px-3 pt-3 no-scrollbar sm:px-4">
            {STATUS_TABS.map((tab) => {
              const active = selectedStatusTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => updateFilter(setSelectedStatusTab, tab.key)}
                  className={`inline-flex h-10 shrink-0 items-center gap-2 border-b-2 px-4 text-[10px] font-extrabold uppercase tracking-normal transition ${
                    active
                      ? "rounded-t-xl border-[#FF5C28] bg-white text-[#042C51]"
                      : "border-transparent text-[#667085] hover:text-[#042C51]"
                  }`}
                >
                  {tab.label}
                  {tab.key === "approval" ? (
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-[9px] font-extrabold tabular-nums",
                        active
                          ? "bg-red-600 text-white"
                          : "bg-red-100 text-red-700",
                      ].join(" ")}
                    >
                      {statusCounts.approval || 0}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="p-4 lg:hidden">
            {paginatedList.length > 0 ? (
              <div className="space-y-3">
                {paginatedList.map((item) => (
                  <JobDescriptionMobileCard
                    key={getRecordId(item) || getRoleTitle(item)}
                    item={item}
                    onView={handleOpenFullPageView}
                    onRevise={handleOpenRevision}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#D6DEE8] bg-[#F8FAFC] px-5 py-10 text-center">
                <FileText className="mx-auto h-9 w-9 text-[#CBD5E1]" />
                <p className="mt-3 text-sm font-extrabold text-[#042C51]">
                  No Job Descriptions Found
                </p>
                <p className="mt-1 text-xs font-semibold text-[#98A2B3]">
                  No records matched the active search, filters, and status tab.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-4 rounded-[10px] bg-[#042C51] px-4 py-2 text-xs font-extrabold text-white"
                >
                  Reset Search & Filters
                </button>
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1280px] border-collapse text-left text-xs">
              <thead className="sibs-data-table-head">
                <tr className="sibs-data-table-head-row">
                  <th className="sibs-data-table-th text-left">
                    Role & Document Title
                  </th>
                  <th className="sibs-data-table-th text-left">
                    Department / Account
                  </th>
                  <th className="sibs-data-table-th text-left">
                    Supervisory Level
                  </th>
                  <th className="sibs-data-table-th text-left">Status</th>
                  <th className="sibs-data-table-th text-left">
                    Date & Version
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E6ECF2]">
                {paginatedList.length > 0 ? (
                  paginatedList.map((item) => {
                    const status = getRealJdStatus(item);
                    const roleTitle =
                      getRoleTitle(item) || "Untitled Job Description";
                    const documentTitle =
                      getDocumentTitle(item) || getJdCode(item) || "--";

                    return (
                      <tr
                        key={
                          getRecordId(item) || `${roleTitle}-${documentTitle}`
                        }
                        onClick={() => handleOpenFullPageView(item)}
                        className="sibs-data-table-row cursor-pointer hover:bg-[#FFFDFC]"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-start gap-2">
                            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5C28]" />
                            <div className="min-w-0">
                              <p
                                title={documentTitle}
                                className="max-w-[340px] truncate text-xs font-extrabold leading-5 text-[#042C51]"
                              >
                                {documentTitle}
                              </p>
                              <p
                                title={roleTitle}
                                className="mt-0.5 max-w-[340px] truncate text-[10px] font-semibold text-[#98A2B3]"
                              >
                                {roleTitle}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p
                            title={getDepartment(item) || ""}
                            className="truncate text-xs font-extrabold text-[#042C51]"
                          >
                            {getDepartment(item) || "--"}
                          </p>
                          <p
                            title={getAccount(item) || ""}
                            className="mt-0.5 truncate text-[10px] font-semibold text-[#667085]"
                          >
                            {getAccount(item) || "--"}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            title={getLinkedHiringNeed(item) || ""}
                            className="inline-flex max-w-[280px] truncate rounded-lg bg-[#F2F6FA] px-2.5 py-1.5 text-[10px] font-bold leading-4 text-[#475467]"
                          >
                            {getLinkedHiringNeed(item) || "--"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-semibold text-[#475467]">
                          {getSupervisoryLevel(item) || "--"}
                        </td>
                        <td className="px-4 py-3.5">
                          <JdStatusBadge status={status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-xs font-extrabold text-[#042C51]">
                            {getVersion(item) || "--"}
                          </p>
                          <p className="mt-0.5 text-[10px] font-semibold text-[#98A2B3]">
                            {formatDate(getDateValue(item))}
                          </p>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center">
                      <FileText className="mx-auto h-9 w-9 text-[#CBD5E1]" />
                      <p className="mt-3 text-sm font-extrabold text-[#042C51]">
                        No Job Descriptions Found
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#98A2B3]">
                        No records matched the active search, filters, and
                        status tab.
                      </p>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-4 rounded-[10px] bg-[#042C51] px-4 py-2 text-xs font-extrabold text-white"
                      >
                        Reset Search & Filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <PaginationTable
          loading={false}
          showSearch={false}
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          loadedCount={paginatedList.length}
          totalRecords={filteredList.length}
          recordLabel="job descriptions"
          onPrevious={() => setCurrentPage(Math.max(safeCurrentPage - 1, 1))}
          onNext={() =>
            setCurrentPage(Math.min(safeCurrentPage + 1, totalPages))
          }
          showCount
          className="border-0 bg-transparent p-0 shadow-none"
        />
      </div>
    </section>
  );
}
