import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  RotateCw,
  Users,
} from "lucide-react";
import {
  DataCard,
  ResponsiveTableShell,
  SearchInput,
  SelectDropdown,
  StatusBadge,
  TableEmptyRow,
  TablePagination,
  TableSkeletonRows,
} from "@/components/ui";

function formatTableDate(val) {
  if (!val) return "—";
  const str = String(val).slice(0, 10);
  const d = new Date(`${str}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return str;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function getEmployeeProfilePictureUrl(employee = {}) {
  const values = [
    employee.profilePictureUrl,
    employee.profile_picture_url,
  ];
  const match = values.find((val) => val !== undefined && val !== null && String(val).trim() !== "");
  return match ? String(match).trim() : "";
}

function getEmployeeAvatarPreviewPosition(element) {
  if (!element || typeof window === "undefined") return null;

  const rect = element.getBoundingClientRect();
  const previewHeight = 176;
  const gap = 12;
  const placeBelow = rect.top < previewHeight + gap;

  return {
    left: rect.left + rect.width / 2,
    top: placeBelow ? rect.bottom + gap : rect.top - gap,
    placeBelow,
  };
}

const AVATAR_TONES = [
  "border-orange-100 bg-orange-50 text-sibs-orange",
  "border-emerald-100 bg-emerald-50 text-emerald-700",
  "border-blue-100 bg-blue-50 text-sibs-navy",
  "border-pink-100 bg-pink-50 text-pink-700",
  "border-violet-100 bg-violet-50 text-violet-700",
];

function getAvatarTone(employee = {}) {
  const name = employee.employeeName || employee.fullName || "Employee";
  const seed = name
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);
  return AVATAR_TONES[seed % AVATAR_TONES.length];
}

function getEmployeeInitials(employee = {}) {
  if (employee.firstName || employee.lastName) {
    const f = (employee.firstName || "").trim();
    const l = (employee.lastName || "").trim();
    if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
    if (f) return f.slice(0, 2).toUpperCase();
    if (l) return l.slice(0, 2).toUpperCase();
  }
  const cleanName = String(employee.employeeName || employee.fullName || "").replace(",", " ").trim();
  const tokens = cleanName.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
  }
  if (tokens.length === 1 && tokens[0].length >= 2) {
    return tokens[0].slice(0, 2).toUpperCase();
  }
  return "EM";
}

function EmployeeAvatar({ employee = {}, size = "sm" }) {
  const sizeClass =
    size === "sm"
      ? "h-7 w-7 text-[10px]"
      : size === "lg"
      ? "h-11 w-11 text-sm"
      : "h-8.5 w-8.5 text-xs";
  const profilePictureUrl = getEmployeeProfilePictureUrl(employee);
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(null);
  const avatarRef = useRef(null);
  const canShowProfilePicture =
    Boolean(profilePictureUrl) && failedImageUrl !== profilePictureUrl;
  const employeeName = employee.employeeName || "Employee";
  const initials = getEmployeeInitials(employee);

  const showPreview = () => {
    setPreviewPosition(getEmployeeAvatarPreviewPosition(avatarRef.current));
    setPreviewVisible(true);
  };

  const hidePreview = () => {
    setPreviewVisible(false);
  };

  useEffect(() => {
    if (!previewVisible) return undefined;

    const updatePreviewPosition = () => {
      setPreviewPosition(getEmployeeAvatarPreviewPosition(avatarRef.current));
    };

    window.addEventListener("resize", updatePreviewPosition);
    window.addEventListener("scroll", updatePreviewPosition, true);

    return () => {
      window.removeEventListener("resize", updatePreviewPosition);
      window.removeEventListener("scroll", updatePreviewPosition, true);
    };
  }, [previewVisible]);

  const preview =
    previewVisible && previewPosition && typeof document !== "undefined"
      ? createPortal(
          <span
            className="employee-avatar-preview pointer-events-none fixed z-[9999] rounded-2xl border border-sibs-border bg-white p-2 shadow-2xl"
            style={{
              left: previewPosition.left,
              top: previewPosition.top,
              transform: previewPosition.placeBelow
                ? "translate(-50%, 0)"
                : "translate(-50%, -100%)",
            }}
            aria-hidden="true"
          >
            <span
              className={`relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-xl border text-[24px] font-extrabold ${getAvatarTone(
                employee,
              )}`}
            >
              <span>{initials}</span>

              {canShowProfilePicture ? (
                <img
                  src={profilePictureUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={() => setFailedImageUrl(profilePictureUrl)}
                />
              ) : null}
            </span>
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={avatarRef}
        className="relative inline-flex shrink-0 outline-none"
        tabIndex={0}
        aria-label={`${employeeName} profile picture`}
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
        onFocus={showPreview}
        onBlur={hidePreview}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <span
          className={`relative inline-flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border font-extrabold shadow-inner ${getAvatarTone(
            employee,
          )}`}
        >
          <span aria-hidden="true">{initials}</span>

          {canShowProfilePicture ? (
            <img
              src={profilePictureUrl}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setFailedImageUrl(profilePictureUrl)}
            />
          ) : null}
        </span>
      </span>
      {preview}
    </>
  );
}

export default function AttritionReportsTable({
  records = [],
  pagination = {},
  loading = false,
  error = "",
  filters = {},
  onFilterChange,
  onPageChange,
  onViewRecord,
  onRetry,
}) {
  const [searchTerm, setSearchTerm] = useState(filters?.search || "");

  // Synchronize local search input if filters.search was modified externally
  const [prevFilterSearch, setPrevFilterSearch] = useState(filters?.search || "");
  if (prevFilterSearch !== (filters?.search || "")) {
    setPrevFilterSearch(filters?.search || "");
    setSearchTerm(filters?.search || "");
  }

  // Debounced search dispatch (350ms) to prevent server request flooding
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((filters?.search || "") !== searchTerm) {
        onFilterChange?.("search", searchTerm);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm, filters?.search, onFilterChange]);

  const statusOptions = useMemo(
    () => [
      { label: "All Status", value: "All" },
      { label: "Inactive (Kronos)", value: "Inactive (Kronos)" },
      { label: "Inactive", value: "Inactive" },
    ],
    [],
  );

  const classificationOptions = useMemo(
    () => [
      { label: "All Classifications", value: "All" },
      { label: "Voluntary", value: "Voluntary" },
      { label: "Involuntary", value: "Involuntary" },
    ],
    [],
  );

  const handleResetFilters = () => {
    setSearchTerm("");
    onFilterChange?.("search", "");
    onFilterChange?.("status", "All");
    onFilterChange?.("classification", "All");
    onFilterChange?.("cluster", "All");
    onFilterChange?.("account", "All");
    onFilterChange?.("department", "All");
  };

  const hasActiveTableFilters = Boolean(
    searchTerm ||
      (filters?.status && filters.status !== "All") ||
      (filters?.classification && filters.classification !== "All") ||
      (filters?.cluster && filters.cluster !== "All") ||
      (filters?.account && filters.account !== "All") ||
      (filters?.department && filters.department !== "All")
  );

  return (
    <section
      aria-label="Detailed Employee Attrition Records"
      className="flex shrink-0 grow flex-col sibs-page-card-in rounded-[14px] border border-sibs-border bg-white font-jakarta shadow-xs"
      style={{ animationDelay: "360ms", animationFillMode: "both" }}
    >
      {/* 1. Card Header with Active Global Scope and Integrated Search */}
      <div className="border-b border-sibs-border p-3.5 sm:p-4 2xl:p-5 font-jakarta">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <h2 className="sibs-card-title">
              Detailed Employee Attrition Records
            </h2>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-extrabold text-slate-700">
              {Number(pagination?.total ?? records.length).toLocaleString()}{" "}
              {(pagination?.total ?? records.length) === 1 ? "record" : "records"}
            </span>

            {/* Active global filter pills synced with page hero filters */}
            {filters?.dateFrom && filters?.dateTo ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-sibs-border bg-sibs-surface px-2 py-0.5 text-[10px] font-bold text-sibs-navy">
                <Calendar className="h-3 w-3 text-sibs-orange" />
                <span>
                  {filters.dateFrom} to {filters.dateTo}
                </span>
              </span>
            ) : null}

            {filters?.cluster && filters.cluster !== "All" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-sibs-navy">
                <span>Cluster: {filters.cluster}</span>
                <button
                  type="button"
                  onClick={() => onFilterChange?.("cluster", "All")}
                  className="hover:text-rose-600 transition ml-0.5 text-xs leading-none"
                  aria-label="Clear cluster filter"
                >
                  ✕
                </button>
              </span>
            ) : null}

            {filters?.account && filters.account !== "All" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-sibs-orange">
                <span>Account: {filters.account}</span>
                <button
                  type="button"
                  onClick={() => onFilterChange?.("account", "All")}
                  className="hover:text-rose-600 transition ml-0.5 text-xs leading-none"
                  aria-label="Clear account filter"
                >
                  ✕
                </button>
              </span>
            ) : null}

            {filters?.department && filters.department !== "All" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                <span>Dept: {filters.department}</span>
                <button
                  type="button"
                  onClick={() => onFilterChange?.("department", "All")}
                  className="hover:text-rose-600 transition ml-0.5 text-xs leading-none"
                  aria-label="Clear department filter"
                >
                  ✕
                </button>
              </span>
            ) : null}
          </div>
          <p className="sibs-card-subtitle mt-0.5">
            Individual employee separations matching current organizational scope and filters. Click any row to view full details.
          </p>
        </div>

        {/* Integrated Toolbar occupying the full card width */}
        <div className="relative z-30 mt-3 2xl:mt-3.5 w-full overflow-visible">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 2xl:gap-3 w-full">
            {/* SEARCH FIELD (Expands to occupy all remaining width across the card) */}
            <div className="flex-1 min-w-0">
              <SearchInput
                id="attrition-table-search"
                label="Search Employee"
                labelClassName="mb-1 block font-jakarta sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
                placeholder="Search by Employee Name or SiBS ID..."
                value={searchTerm}
                onChange={(val) =>
                  setSearchTerm(typeof val === "string" ? val : val?.target?.value || "")
                }
                onClear={() => {
                  setSearchTerm("");
                  onFilterChange?.("search", "");
                }}
                disabled={loading}
                inputClassName="h-8.5 2xl:h-10 text-xs font-bold"
              />
            </div>

            {/* TABLE FILTER: CLASSIFICATION */}
            <div className="w-full sm:w-64 2xl:w-72 shrink-0">
              <SelectDropdown
                label="Classification"
                labelClassName="mb-1 block font-jakarta sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
                value={filters?.classification || "All"}
                options={classificationOptions}
                onChange={(val) => onFilterChange?.("classification", val)}
                searchable={false}
                clearable={false}
                disabled={loading}
                buttonClassName="h-8.5 2xl:h-10 px-3"
              />
            </div>

            {/* TABLE FILTER: STATUS */}
            <div className="w-full sm:w-64 2xl:w-72 shrink-0">
              <SelectDropdown
                label="Status"
                labelClassName="mb-1 block font-jakarta sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
                value={filters?.status || "All"}
                options={statusOptions}
                onChange={(val) => onFilterChange?.("status", val)}
                searchable={false}
                clearable={false}
                disabled={loading}
                buttonClassName="h-8.5 2xl:h-10 px-3"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error state with retry */}
      {error ? (
        <div className="m-3.5 sm:m-4 2xl:m-5 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3.5">
          <div className="text-left">
            <p className="text-xs font-extrabold text-rose-900">{error}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-rose-700">
              Please check connection to Kronos API or try refreshing.
            </p>
          </div>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-extrabold text-rose-800 shadow-xs hover:bg-rose-50 transition active:scale-95"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Retry
            </button>
          ) : null}
        </div>
      ) : null}

      {/* 2. Compact Table Container (No inner scrollbars) */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4 2xl:p-5 font-jakarta">
        <ResponsiveTableShell
          desktopContent={
            <div className="overflow-x-auto rounded-[14px] border border-sibs-border bg-white shadow-2xs sibs-scrollbar">
              <table className="w-full border-collapse bg-white text-left text-xs">
                <thead className="sibs-data-table-head sticky top-0 z-10 bg-sibs-surface">
                  <tr className="sibs-data-table-head-row">
                    <th scope="col" className="sibs-data-table-th whitespace-nowrap px-2 2xl:px-2.5 py-2.5 2xl:py-3 text-left w-14">
                      SIBS ID
                    </th>
                    <th scope="col" className="sibs-data-table-th whitespace-nowrap px-2 2xl:px-2.5 py-2.5 2xl:py-3 text-left min-w-[180px] xl:min-w-[200px]">
                      Employee Name
                    </th>
                    <th scope="col" className="sibs-data-table-th whitespace-nowrap px-2 2xl:px-2.5 py-2.5 2xl:py-3 text-left">
                      Cluster
                    </th>
                    <th scope="col" className="sibs-data-table-th whitespace-nowrap px-2 2xl:px-2.5 py-2.5 2xl:py-3 text-left">
                      Account
                    </th>
                    <th scope="col" className="sibs-data-table-th whitespace-nowrap px-2 2xl:px-2.5 py-2.5 2xl:py-3 text-left">
                      Department
                    </th>
                    <th scope="col" className="sibs-data-table-th whitespace-nowrap px-2 2xl:px-2.5 py-2.5 2xl:py-3 text-left">
                      Position / Role
                    </th>
                    <th scope="col" className="sibs-data-table-th whitespace-nowrap px-2 2xl:px-2.5 py-2.5 2xl:py-3 text-left">
                      Hire Date
                    </th>
                    <th scope="col" className="sibs-data-table-th whitespace-nowrap px-2 2xl:px-2.5 py-2.5 2xl:py-3 text-left">
                      Last Working Day
                    </th>
                    <th scope="col" className="sibs-data-table-th whitespace-nowrap px-2 2xl:px-2.5 py-2.5 2xl:py-3 text-left">
                      Tenure
                    </th>
                    <th scope="col" className="sibs-data-table-th whitespace-nowrap px-2 2xl:px-2.5 py-2.5 2xl:py-3 text-left">
                      Classification
                    </th>
                    <th scope="col" className="sibs-data-table-th whitespace-nowrap px-2 2xl:px-2.5 py-2.5 2xl:py-3 text-left">
                      Separation Reason
                    </th>
                    <th scope="col" className="sibs-data-table-th whitespace-nowrap px-2 2xl:px-2.5 py-2.5 2xl:py-3 text-left">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-sibs-border/60 font-jakarta" aria-busy={loading}>
                  {loading ? (
                    <TableSkeletonRows
                      columns={12}
                      count={15}
                      cellClassName="px-2 2xl:px-2.5 py-2.5 2xl:py-3 align-middle"
                    />
                  ) : error ? null : records.length === 0 ? (
                    <TableEmptyRow
                      colSpan={12}
                      icon={Users}
                      title="No employee attrition records found"
                      description="Try adjusting your search query, date range, or organizational filters."
                      actionLabel={hasActiveTableFilters ? "Reset Search & Filters" : undefined}
                      onAction={hasActiveTableFilters ? handleResetFilters : undefined}
                    />
                  ) : (
                    records.map((row) => (
                      <tr
                        key={row.employeeId || row.sibsId}
                        role="button"
                        tabIndex={0}
                        onClick={() => onViewRecord?.(row)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onViewRecord?.(row);
                          }
                        }}
                        aria-label={`View separation details for ${row.employeeName}`}
                        className="group cursor-pointer transition-colors hover:bg-sibs-cream-light focus-visible:bg-sibs-cream-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sibs-orange/30"
                      >
                        <td className="px-2 2xl:px-2.5 py-2.5 2xl:py-3 font-mono text-[11px] font-bold text-sibs-orange whitespace-nowrap tabular-nums w-14">
                          {row.sibsId}
                        </td>

                        <td className="px-2 2xl:px-2.5 py-2.5 2xl:py-3 whitespace-nowrap min-w-[180px] xl:min-w-[200px]">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="shrink-0"
                              onClick={(event) => event.stopPropagation()}
                              onKeyDown={(event) => event.stopPropagation()}
                            >
                              <EmployeeAvatar employee={row} size="sm" />
                            </div>
                            <span className="font-extrabold text-sibs-navy group-hover:text-sibs-orange transition-colors whitespace-nowrap text-xs">
                              {row.employeeName}
                            </span>
                          </div>
                        </td>

                        <td className="px-2 2xl:px-2.5 py-2.5 2xl:py-3 text-slate-600 whitespace-nowrap font-medium text-[11px]">
                          {row.cluster && row.cluster !== "Unassigned" ? (
                            row.cluster
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>

                        <td
                          className="px-2 2xl:px-2.5 py-2.5 2xl:py-3 font-bold text-sibs-navy whitespace-nowrap text-[11px]"
                          title={row.account}
                        >
                          {row.account}
                        </td>

                        <td
                          className="px-2 2xl:px-2.5 py-2.5 2xl:py-3 text-slate-600 whitespace-nowrap font-medium text-[11px]"
                          title={row.department}
                        >
                          {row.department && row.department !== "Unassigned" ? (
                            row.department
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>

                        <td
                          className="px-2 2xl:px-2.5 py-2.5 2xl:py-3 text-slate-500 whitespace-nowrap text-[11px]"
                          title={row.position}
                        >
                          {row.position && row.position !== "—" ? (
                            row.position
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>

                        <td className="px-2 2xl:px-2.5 py-2.5 2xl:py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap tabular-nums">
                          {formatTableDate(row.hireDate)}
                        </td>

                        <td className="px-2 2xl:px-2.5 py-2.5 2xl:py-3 font-mono text-[11px] font-semibold text-slate-700 whitespace-nowrap tabular-nums">
                          {formatTableDate(row.lastWorkingDate)}
                        </td>

                        <td className="px-2 2xl:px-2.5 py-2.5 2xl:py-3 font-semibold text-slate-700 whitespace-nowrap text-[11px]">
                          {row.tenure || "—"}
                        </td>

                        <td className="px-2 2xl:px-2.5 py-2.5 2xl:py-3 whitespace-nowrap">
                          {row.separationClassification === "Voluntary" ? (
                            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Voluntary
                            </span>
                          ) : row.separationClassification === "Involuntary" ? (
                            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Involuntary
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal text-[11px]">—</span>
                          )}
                        </td>

                        <td
                          className="px-2 2xl:px-2.5 py-2.5 2xl:py-3 text-slate-600 text-[11px] max-w-[140px] truncate"
                          title={
                            row.separationReason && row.separationReason !== "Not available"
                              ? row.separationReason
                              : undefined
                          }
                        >
                          {row.separationReason && row.separationReason !== "Not available" ? (
                            row.separationReason
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>

                        <td className="px-2 2xl:px-2.5 py-2.5 2xl:py-3 whitespace-nowrap">
                          <StatusBadge status={row.status || "Inactive"} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          }
          mobileContent={
            <div className="space-y-3 font-jakarta">
              {loading ? (
                <DataCard.Skeleton count={4} lines={3} />
              ) : error ? null : records.length === 0 ? (
                <DataCard.Empty
                  icon={Users}
                  title="No employee attrition records found"
                  description="Try adjusting your search query, date range, or organizational filters."
                  action={
                    hasActiveTableFilters ? (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex items-center rounded-lg border border-sibs-border bg-white px-3.5 py-1.5 text-xs font-extrabold text-sibs-navy hover:bg-sibs-surface transition active:scale-95 shadow-2xs"
                      >
                        Reset Search &amp; Filters
                      </button>
                    ) : null
                  }
                />
              ) : (
                records.map((row, index) => (
                  <DataCard
                    key={row.employeeId || row.sibsId}
                    index={index}
                    onClick={() => onViewRecord?.(row)}
                    aria-label={`View separation details for ${row.employeeName}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <EmployeeAvatar employee={row} size="sm" />
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sibs-navy text-xs truncate group-hover:text-sibs-orange transition-colors">
                            {row.employeeName}
                          </h4>
                          <p className="font-mono text-[10.5px] font-bold text-sibs-orange">
                            {row.sibsId} · <span className="font-normal text-sibs-muted">{row.account}</span>
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <StatusBadge status={row.status || "Inactive"} />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
                      <div>
                        <span className="block text-[9.5px] text-sibs-muted font-bold uppercase tracking-wide">
                          Last Working Day
                        </span>
                        <span className="font-semibold text-slate-700 font-mono">
                          {formatTableDate(row.lastWorkingDate)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9.5px] text-sibs-muted font-bold uppercase tracking-wide">
                          Tenure
                        </span>
                        <span className="font-semibold text-slate-700">
                          {row.tenure || "—"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100/80">
                      <span className="text-[10px] text-slate-500 font-medium truncate max-w-[200px]">
                        {row.department && row.department !== "Unassigned" ? row.department : "—"} ·{" "}
                        {row.separationClassification && row.separationClassification !== "Not available"
                          ? row.separationClassification
                          : "—"}
                      </span>
                      <span className="text-[10.5px] font-extrabold text-sibs-orange group-hover:underline">
                        View details →
                      </span>
                    </div>
                  </DataCard>
                ))
              )}
            </div>
          }
        />

        {/* 3. Pagination Footer */}
        <div className="mt-auto pt-2.5 sm:pt-3">
          <TablePagination
            currentPage={pagination.currentPage || 1}
            totalPages={pagination.totalPages || 1}
            totalRecords={pagination.total ?? records.length}
            pageSize={pagination.limit || 15}
            onPageChange={onPageChange}
            recordLabel="employees"
            className="border-t-0 pt-0"
          />
        </div>
      </div>
    </section>
  );
}
