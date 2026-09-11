import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { usePagination } from "../../../services/context/PaginationContext";
import PaginationTable from "../../../services/pagination/PaginationTable";
import { DataCard, ResponsiveTableShell, StatusFilterTabs } from "@/components/ui";

const JOB_DESCRIPTION_ENTITY = "job-descriptions";
const PAGE_LIMIT = 15;

const STATUS_TABS = [
  { key: "all", label: "All JDs" },
  { key: "approval", label: "For Approval" },
  { key: "existing", label: "Existing / Ready" },
  { key: "revision", label: "For Revision" },
  { key: "new", label: "New Job Description" },
  { key: "archived", label: "Archived" },
  { key: "rejected", label: "Rejected" },
];

/* =====================================================
GENERIC HELPERS
===================================================== */

function getFirstValue(...values) {
  return values.find((value) => String(value ?? "").trim()) ?? "";
}

function safeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

/* =====================================================
STATUS HELPERS
===================================================== */

function normalizeJdStatus(status) {
  const value = String(status || "").trim();

  if (value === "New JD") {
    return "New Job Description";
  }

  if (value === "Archived JD") {
    return "Archived";
  }

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

function isExistingStatus(status) {
  const normalizedStatus = normalizeJdStatus(status);

  return ["Existing", "Active", "Approved"].includes(normalizedStatus);
}

function isRevisionStatus(status) {
  const normalizedStatus = normalizeJdStatus(status);

  return ["For Revision", "Returned for Revision"].includes(normalizedStatus);
}

function isNewStatus(status) {
  const normalizedStatus = normalizeJdStatus(status);

  return ["New Job Description", "Draft"].includes(normalizedStatus);
}

function isArchivedStatus(status) {
  return normalizeJdStatus(status) === "Archived";
}

function isRejectedStatus(status) {
  const normalizedStatus = normalizeJdStatus(status);

  return ["Rejected", "Declined"].includes(normalizedStatus);
}

function matchesStatusTab(status, tabKey) {
  const normalizedStatus = normalizeJdStatus(status);

  switch (tabKey) {
    case "all":
      return true;

    case "approval":
      return normalizedStatus === "For Approval";

    case "existing":
      return isExistingStatus(normalizedStatus);

    case "revision":
      return isRevisionStatus(normalizedStatus);

    case "new":
      return isNewStatus(normalizedStatus);

    case "archived":
      return isArchivedStatus(normalizedStatus);

    case "rejected":
      return isRejectedStatus(normalizedStatus);

    default:
      return true;
  }
}

/* =====================================================
RECORD VALUE HELPERS
===================================================== */

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

  if (explicitLevel) {
    return String(explicitLevel).trim();
  }

  const supervisory = getFirstValue(item.supervisory, item.raw?.supervisory);

  const normalized = safeText(supervisory);

  if (["yes", "true", "1"].includes(normalized)) {
    return "Supervisory";
  }

  if (["no", "false", "0"].includes(normalized)) {
    return "Individual Contributor";
  }

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
  if (!value) {
    return "--";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* =====================================================
STATUS BADGE
===================================================== */

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
  if (isExistingStatus(status)) {
    return <CheckCircle2 size={13} />;
  }

  if (isRevisionStatus(status)) {
    return <AlertTriangle size={13} />;
  }

  if (isRejectedStatus(status)) {
    return <AlertCircle size={13} />;
  }

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

/* =====================================================
DROPDOWN HELPERS
===================================================== */

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

/* =====================================================
MOBILE CARD
===================================================== */

function JobDescriptionMobileCard({ item, onView }) {
  const status = getRealJdStatus(item);
  const roleTitle = getRoleTitle(item) || "Untitled Job Description";
  const documentTitle = getDocumentTitle(item) || getJdCode(item) || "--";
  const department = getDepartment(item) || "--";
  const account = getAccount(item) || "--";
  const linkedHiringNeed = getLinkedHiringNeed(item) || "--";
  const supervisoryLevel = getSupervisoryLevel(item) || "--";
  const version = getVersion(item) || "--";

  return (
    <DataCard interactive onClick={() => onView(item)}>
      <DataCard.Header
        title={roleTitle}
        subtitle={
          <span className="truncate font-semibold text-[#98A2B3]">
            {documentTitle}
          </span>
        }
        badge={<JdStatusBadge status={status} />}
      />

      <DataCard.ContextRow>
        <span className="text-[11px] font-extrabold text-[#042C51]">{department}</span>
        <span className="text-[11px] font-semibold text-[#667085]">{account}</span>
      </DataCard.ContextRow>

      <DataCard.Metrics cols={3}>
        <DataCard.MetricItem
          label="Supervisory"
          value={supervisoryLevel}
        />
        <DataCard.MetricItem
          label="Version"
          value={version}
        />
        <DataCard.MetricItem
          label="Date"
          value={formatDate(getDateValue(item))}
        />
      </DataCard.Metrics>

      <DataCard.Footer>
        <div className="truncate text-[10.5px] font-semibold text-[#667085]">
          <span className="font-extrabold text-[#042C51]">Linked PRF:</span>{" "}
          <span>{linkedHiringNeed}</span>
        </div>
        <span className="shrink-0 text-[10px] font-extrabold uppercase text-sibs-orange">
          View Details →
        </span>
      </DataCard.Footer>
    </DataCard>
  );
}

/* =====================================================
JOB DESCRIPTION TABLE
===================================================== */

export default function JobDescriptionTable({
  jobDescriptionList = [],
  canApproveJobDescriptions = false,
}) {
  const navigate = useNavigate();

  const { setPagination } = usePagination(JOB_DESCRIPTION_ENTITY);

  /* =====================================================
  LOCAL STATE
  ===================================================== */

  const [selectedStatusTab, setSelectedStatusTab] = useState("all");

  const [searchTerm, setSearchTerm] = useState("");

  const [departmentFilter, setDepartmentFilter] = useState("All Departments");

  const [accountFilter, setAccountFilter] = useState("All Accounts");

  const [supervisoryFilter, setSupervisoryFilter] = useState("All Levels");

  const [currentPage, setCurrentPage] = useState(1);

  /*
   * Prevent identical pagination values from being written
   * repeatedly into PaginationContext.
   *
   * This protects against context-driven render loops when
   * setPagination has an unstable reference.
   */
  const lastPaginationSignatureRef = useRef("");

  /* =====================================================
  VISIBLE STATUS TABS
  ===================================================== */

  const visibleStatusTabs = useMemo(
    () =>
      STATUS_TABS.filter(
        (tab) => tab.key !== "approval" || canApproveJobDescriptions,
      ),
    [canApproveJobDescriptions],
  );

  /* =====================================================
  DROPDOWN OPTIONS
  ===================================================== */

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

  /* =====================================================
  STATUS COUNTS
  ===================================================== */

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(STATUS_TABS.map((tab) => [tab.key, 0]));

    for (const item of jobDescriptionList) {
      const status = getRealJdStatus(item);

      counts.all += 1;

      if (status === "For Approval") {
        counts.approval += 1;
      }

      if (isExistingStatus(status)) {
        counts.existing += 1;
      }

      if (isRevisionStatus(status)) {
        counts.revision += 1;
      }

      if (isNewStatus(status)) {
        counts.new += 1;
      }

      if (isArchivedStatus(status)) {
        counts.archived += 1;
      }

      if (isRejectedStatus(status)) {
        counts.rejected += 1;
      }
    }

    return counts;
  }, [jobDescriptionList]);

  /* =====================================================
  APPROVAL TAB ACCESS
  ===================================================== */

  useEffect(() => {
    if (!canApproveJobDescriptions && selectedStatusTab === "approval") {
      setSelectedStatusTab("all");
      setCurrentPage(1);
    }
  }, [canApproveJobDescriptions, selectedStatusTab]);

  /* =====================================================
  FILTERED LIST
  ===================================================== */

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

  /* =====================================================
  PAGINATION
  ===================================================== */

  const totalPages = Math.max(Math.ceil(filteredList.length / PAGE_LIMIT), 1);

  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const paginatedList = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_LIMIT;

    return filteredList.slice(start, start + PAGE_LIMIT);
  }, [filteredList, safeCurrentPage]);

  /*
   * Synchronize local pagination with PaginationContext.
   *
   * Important:
   * Do not repeatedly call setPagination with identical values.
   * This prevents unnecessary context updates and protects
   * against Maximum update depth loops.
   */
  useEffect(() => {
    const paginationSignature = [
      totalPages,
      safeCurrentPage,
      filteredList.length,
      PAGE_LIMIT,
    ].join("|");

    if (lastPaginationSignatureRef.current === paginationSignature) {
      return;
    }

    lastPaginationSignatureRef.current = paginationSignature;

    setPagination({
      totalPages,
      currentPage: safeCurrentPage,
      total: filteredList.length,
      limit: PAGE_LIMIT,
    });
  }, [filteredList.length, safeCurrentPage, setPagination, totalPages]);

  /* =====================================================
  ACTIVE FILTER CHECK
  ===================================================== */

  const hasActiveFilters =
    searchTerm.trim() ||
    departmentFilter !== "All Departments" ||
    accountFilter !== "All Accounts" ||
    supervisoryFilter !== "All Levels" ||
    selectedStatusTab !== "all";

  /* =====================================================
  HANDLERS
  ===================================================== */

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

    if (!jdId) {
      return;
    }

    navigate(`/recruitment/job-description/view/${encodeURIComponent(jdId)}`, {
      state: {
        jobDescription: item,
      },
    });
  }

  /* =====================================================
  RENDER
  ===================================================== */

  return (
    <section className="sibs-profile-tab-panel sibs-page-card-in overflow-visible rounded-2xl border border-sibs-border bg-white font-jakarta shadow-sm">
      <div className="border-b border-sibs-border p-4 sm:p-5 2xl:p-6 font-jakarta">
        <h2 className="sibs-card-title">Job Description Records</h2>

        <p className="sibs-card-subtitle">
          Search and filter JD records by role, department, account, and
          supervisory level.
        </p>

        <div className="relative z-[90] mt-3.5 2xl:mt-4 overflow-visible">
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
                className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-muted transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-sibs-border disabled:hover:bg-white disabled:hover:text-sibs-muted xl:w-auto"
              >
                <RotateCcw size={14} />
                Clear
              </button>
            }
            className="border-0 bg-transparent p-0 shadow-none"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 p-4 sm:p-5 2xl:p-6">
        <div className="overflow-hidden rounded-xl border border-sibs-border bg-white">
          {/* =================================================
              STATUS TABS
          ================================================= */}
          <StatusFilterTabs
            tabs={visibleStatusTabs}
            activeValue={selectedStatusTab}
            counts={statusCounts}
            onChange={(tabKey) => updateFilter(setSelectedStatusTab, tabKey)}
            layoutId="jdActiveTabIndicator"
          />

          {/* =================================================
              MOBILE
          ================================================= */}

          <ResponsiveTableShell
            mobileContent={
              paginatedList.length > 0 ? (
                <div className="space-y-3 p-3.5 sm:p-4">
                  {paginatedList.map((item) => (
                    <JobDescriptionMobileCard
                      key={getRecordId(item) || getRoleTitle(item)}
                      item={item}
                      onView={handleOpenFullPageView}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-3.5 sm:p-4">
                  <DataCard.Empty
                    title="No Job Descriptions Found"
                    description="No records matched the active search, filters, and status tab."
                    action={
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="rounded-lg bg-[#042C51] px-4 py-2 text-xs font-extrabold text-white"
                      >
                        Reset Search & Filters
                      </button>
                    }
                  />
                </div>
              )
            }
            desktopContent={
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px] table-fixed border-collapse text-left text-xs">
                  <thead className="sibs-data-table-head sticky top-0 z-10 bg-[#F8FAFC]">
                    <tr className="sibs-data-table-head-row">
                      <th className="sibs-data-table-th w-[32%] text-left">
                        Role & Document Title
                      </th>

                      <th className="sibs-data-table-th w-[26%] text-left">
                        Department / Account
                      </th>

                      <th className="sibs-data-table-th w-[18%] text-left">
                        Supervisory Level
                      </th>

                      <th className="sibs-data-table-th w-[12%] text-left">
                        Status
                      </th>

                      <th className="sibs-data-table-th w-[12%] text-left">
                        Date & Version
                      </th>
                    </tr>
                  </thead>

                  <tbody
                    key={selectedStatusTab}
                    className="divide-y divide-[#E6ECF2]"
                  >
                    {paginatedList.length > 0 ? (
                      paginatedList.map((item, index) => {
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
                            className="sibs-data-table-row sibs-page-card-in cursor-pointer hover:bg-[#FFFDFC]"
                            style={{
                              animationDelay: `${index * 30}ms`,
                              animationFillMode: "both",
                            }}
                          >
                            {/* ROLE / DOCUMENT */}

                            <td className="px-2.5 py-2 2xl:px-4 2xl:py-2.5 align-middle">
                              <div className="flex items-start gap-2">
                                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5C28]" />

                                <div className="min-w-0">
                                  <p
                                    title={documentTitle}
                                    className="max-w-[340px] truncate sibs-text-xs font-extrabold leading-5 text-[#042C51]"
                                  >
                                    {documentTitle}
                                  </p>

                                  <p
                                    title={roleTitle}
                                    className="mt-0.5 max-w-[340px] truncate sibs-text-micro font-semibold text-[#98A2B3]"
                                  >
                                    {roleTitle}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* DEPARTMENT / ACCOUNT */}

                            <td className="px-2.5 py-2 2xl:px-4 2xl:py-2.5 align-middle">
                              <p
                                title={getDepartment(item) || ""}
                                className="truncate sibs-text-xs font-extrabold text-[#042C51]"
                              >
                                {getDepartment(item) || "--"}
                              </p>

                              <p
                                title={getAccount(item) || ""}
                                className="mt-0.5 truncate sibs-text-micro font-semibold text-[#667085]"
                              >
                                {getAccount(item) || "--"}
                              </p>
                            </td>

                            {/* SUPERVISORY */}

                            <td className="px-2.5 py-2 2xl:px-4 2xl:py-2.5 sibs-text-xs font-semibold text-[#475467] align-middle">
                              {getSupervisoryLevel(item) || "--"}
                            </td>

                            {/* STATUS */}

                            <td className="px-2.5 py-2 2xl:px-4 2xl:py-2.5 align-middle">
                              <JdStatusBadge status={status} />
                            </td>

                            {/* DATE / VERSION */}

                            <td className="px-2.5 py-2 2xl:px-4 2xl:py-2.5 align-middle">
                              <p className="sibs-text-xs font-extrabold tabular-nums text-[#042C51]">
                                {getVersion(item) || "--"}
                              </p>

                              <p className="mt-0.5 text-[10px] 2xl:text-[10.5px] font-semibold tabular-nums text-[#98A2B3]">
                                {formatDate(getDateValue(item))}
                              </p>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-5 py-14 text-center">
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
                            className="mt-4 rounded-lg bg-[#042C51] px-4 py-2 text-xs font-extrabold text-white"
                          >
                            Reset Search & Filters
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            }
          />
        </div>

        {/* =================================================
            PAGINATION
        ================================================= */}

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
