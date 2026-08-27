import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import {
  FileCheck2,
  MapPin,
  RefreshCcw,
  UserRoundCheck,
} from "lucide-react";

import PaginationTable from "@/services/pagination/PaginationTable";
import ChwcpRequestDetailsModal from "../../modals/employees/ChwcpRequestDetailsModal";
import { getChwcpRequests } from "../../../lib/axios/getChwcp";

const DEFAULT_LIMIT = 25;
const STAGE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "human_resource", label: "Human Resource" },
  { value: "finance", label: "Finance" },
  { value: "board_of_directors", label: "Board of Directors" },
];

function safeText(value, fallback = "N/A") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function getEmployeeAccounts(employee = {}) {
  const accounts = [];
  const seen = new Set();

  function addAccount(value) {
    const accountName =
      typeof value === "string" || typeof value === "number"
        ? String(value ?? "").trim()
        : String(
            value?.account ??
              value?.accountName ??
              value?.account_name ??
              value?.gy_acc_name ??
              "",
          ).trim();

    if (!accountName || /^n\/?a$/i.test(accountName)) return;

    const key = accountName.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    accounts.push(accountName);
  }

  addAccount(employee.account);

  const assignedAccounts =
    employee.assignedAccounts || employee.assigned_accounts || [];

  if (Array.isArray(assignedAccounts)) {
    assignedAccounts.forEach(addAccount);
  }

  return accounts.length ? accounts : ["N/A"];
}

function getEmployeeDepartments(employee = {}) {
  const departments = [];
  const seen = new Set();

  function addDepartment(value) {
    const departmentName =
      typeof value === "string" || typeof value === "number"
        ? String(value ?? "").trim()
        : String(
            value?.department ??
              value?.departmentName ??
              value?.department_name ??
              "",
          ).trim();

    if (!departmentName || /^n\/?a$/i.test(departmentName)) return;

    const key = departmentName.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    departments.push(departmentName);
  }

  const returnedDepartments =
    employee.departments ||
    employee.departmentNames ||
    employee.department_names ||
    [];

  if (Array.isArray(returnedDepartments)) {
    returnedDepartments.forEach(addDepartment);
  }

  addDepartment(employee.department);

  const assignedAccounts =
    employee.assignedAccounts || employee.assigned_accounts || [];

  if (Array.isArray(assignedAccounts)) {
    assignedAccounts.forEach(addDepartment);
  }

  return departments.length ? departments : ["N/A"];
}


const AVATAR_TONES = [
  "border-orange-100 bg-orange-50 text-[#FF5C28]",
  "border-emerald-100 bg-emerald-50 text-emerald-700",
  "border-blue-100 bg-blue-50 text-[#042C51]",
  "border-pink-100 bg-pink-50 text-pink-700",
  "border-violet-100 bg-violet-50 text-violet-700",
];

function getEmployeeDisplayName(employee = {}) {
  return safeText(
    employee.employeeName ||
      employee.fullName ||
      employee.full_name,
    "Employee",
  );
}

function getEmployeeInitials(employee = {}) {
  const firstName = String(
    employee.firstName || employee.first_name || "",
  ).trim();
  const lastName = String(
    employee.lastName || employee.last_name || "",
  ).trim();

  if (firstName || lastName) {
    return `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase();
  }

  const displayName = getEmployeeDisplayName(employee)
    .replace(",", " ")
    .split(/\s+/)
    .filter(Boolean);

  return `${displayName[0]?.[0] || "E"}${
    displayName[1]?.[0] || ""
  }`.toUpperCase();
}

function getAvatarTone(employee = {}) {
  const seed = getEmployeeDisplayName(employee)
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return AVATAR_TONES[seed % AVATAR_TONES.length];
}

function getEmployeeProfilePictureUrl(employee = {}) {
  return String(
    employee.profilePictureUrl ||
      employee.profile_picture_url ||
      "",
  ).trim();
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

function EmployeeAvatar({ employee, size = "md" }) {
  const sizeClass = size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const profilePictureUrl = getEmployeeProfilePictureUrl(employee);
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(null);
  const avatarRef = useRef(null);
  const canShowProfilePicture =
    Boolean(profilePictureUrl) && failedImageUrl !== profilePictureUrl;
  const employeeName = getEmployeeDisplayName(employee);
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
            className="employee-avatar-preview pointer-events-none fixed z-[9999] rounded-2xl border border-[#D9E6F2] bg-white p-2 shadow-[0_18px_45px_rgba(4,44,81,0.22)]"
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
        aria-label={`${employeeName || "Employee"} profile picture`}
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
        onFocus={showPreview}
        onBlur={hidePreview}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <span
          className={`relative inline-flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border text-xs font-extrabold shadow-inner ${getAvatarTone(
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

function parseManilaDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const text = String(value).trim();
  if (!text) return null;

  const mysqlMatch = text.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/,
  );

  if (mysqlMatch) {
    const [, year, month, day, hour, minute, second = "00"] = mysqlMatch;
    const parsed = new Date(
      `${year}-${month}-${day}T${hour}:${minute}:${second}+08:00`,
    );
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatRequestDate(value) {
  const date = parseManilaDate(value);
  if (!date) return "N/A";

  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  const todayParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const toKey = (parts) => {
    const get = (type) => parts.find((part) => part.type === type)?.value || "00";
    return `${get("year")}-${get("month")}-${get("day")}`;
  };

  const todayKey = toKey(todayParts);
  const requestKey = toKey(dateParts);
  const dayDifference = Math.max(
    0,
    Math.floor(
      (Date.parse(`${todayKey}T00:00:00Z`) -
        Date.parse(`${requestKey}T00:00:00Z`)) /
        86400000,
    ),
  );

  const ageLabel =
    dayDifference === 0
      ? "Today"
      : `${dayDifference} Day${dayDifference === 1 ? "" : "s"} Ago`;

  return `${formatted} (${ageLabel})`;
}

function getProgressState(stageKey) {
  if (stageKey === "approved") {
    return ["done", "done", "done"];
  }

  if (stageKey === "board_of_directors") {
    return ["done", "done", "current"];
  }

  if (stageKey === "finance") {
    return ["done", "current", "pending"];
  }

  if (stageKey === "human_resource") {
    return ["current", "pending", "pending"];
  }

  if (stageKey === "declined" || stageKey === "canceled") {
    return ["terminal", "terminal", "terminal"];
  }

  return ["pending", "pending", "pending"];
}

function progressClass(state) {
  if (state === "done") return "bg-emerald-500";
  if (state === "current") return "bg-[#D7E34F]";
  if (state === "terminal") return "bg-red-400";
  return "bg-[#C6D3E1]";
}

function statusBadgeClass(stageKey) {
  if (stageKey === "declined" || stageKey === "canceled") {
    return "border-red-100 bg-red-50 text-red-600";
  }

  if (stageKey === "approved") {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (stageKey === "finance" || stageKey === "board_of_directors") {
    return "border-amber-100 bg-amber-50 text-[#7A6400]";
  }

  return "border-blue-100 bg-[#F2F6FA] text-[#042C51]";
}

function StatusProgress({ row }) {
  const progress = getProgressState(row.stageKey);

  return (
    <div className="mx-auto flex w-full max-w-[132px] flex-col items-center px-1">
      <span
        className={`inline-flex max-w-full items-center justify-center rounded-full border px-2 py-0.5 text-center text-[9px] font-extrabold leading-tight ${statusBadgeClass(
          row.stageKey,
        )}`}
      >
        <span className="truncate">{safeText(row.status)}</span>
      </span>

      <div
        className="mt-1.5 grid w-full grid-cols-3 gap-1"
        aria-label={row.status}
      >
        {progress.map((state, index) => (
          <span
            key={`${row.requestId}-${index}`}
            className={`h-1.5 w-full rounded-full ${progressClass(state)}`}
          />
        ))}
      </div>
    </div>
  );
}

function LoadingRows() {
  return Array.from({ length: 6 }).map((_, index) => (
    <tr key={`chwcp-loading-${index}`}>
      <td colSpan={8} className="px-3 py-3 2xl:px-4">
        <div className="h-6 w-full animate-sibs-pulse rounded bg-slate-100" />
      </td>
    </tr>
  ));
}

function WorkflowFilter({
  stage,
  onStageChange,
  refreshing,
  onRefresh,
}) {
  return (
    <div className="flex w-full min-w-0 items-end gap-2 xl:w-auto">
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        title="Refresh CHWCP requests"
        aria-label="Refresh CHWCP requests"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[#E6ECF2] bg-[#F8FAFC] text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-white hover:text-[#FF5C28] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCcw size={15} className={refreshing ? "animate-spin" : ""} />
      </button>

      <div className="min-w-0 flex-1 overflow-x-auto sibs-scrollbar xl:flex-none">
        <div className="flex w-max items-center rounded-[10px] border border-[#FF5C28]/70 bg-white p-0.5">
          {STAGE_OPTIONS.map((option) => {
            const isActive = stage === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onStageChange(option.value)}
                className={`h-9 shrink-0 rounded-lg px-3 text-[10px] font-extrabold transition-all duration-200 active:scale-[0.98] sm:px-4 ${
                  isActive
                    ? "bg-[#042C51] text-white shadow-sm"
                    : "text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ChwcpTable({
  tabs = [],
  activeTab = "CHWCP",
  onTabChange,
  onTotalChange,
}) {
  const tableScrollRef = useRef(null);
  const requestSequenceRef = useRef(0);

  const [rows, setRows] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [selectedRequestRow, setSelectedRequestRow] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    currentPage: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadRows = useCallback(
    async ({ silent = false } = {}) => {
      const sequence = ++requestSequenceRef.current;

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const result = await getChwcpRequests({
          page,
          limit: DEFAULT_LIMIT,
          search,
          stage,
        });

        if (sequence !== requestSequenceRef.current) return;

        const records = Array.isArray(result.data) ? result.data : [];

        setRows(records);
        setPagination({
          ...(result.pagination || {}),
          page: Number(result.pagination?.page || page || 1),
          currentPage: Number(
            result.pagination?.currentPage ||
              result.pagination?.page ||
              page ||
              1,
          ),
          limit: Number(result.pagination?.limit || DEFAULT_LIMIT),
          total: Number(result.pagination?.total || 0),
          totalPages: Math.max(Number(result.pagination?.totalPages || 1), 1),
        });
        onTotalChange?.(Number(result.summary?.totalVisible || 0));
      } catch (loadError) {
        if (sequence !== requestSequenceRef.current) return;

        setRows([]);
        setError(loadError?.message || "Failed to load CHWCP requests.");
      } finally {
        if (sequence === requestSequenceRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [onTotalChange, page, search, stage],
  );

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const totalRecords = Number(pagination?.total || 0);
  const totalPages = Math.max(Number(pagination?.totalPages || 1), 1);
  const currentPage = Math.min(
    Math.max(
      Number(pagination?.currentPage || pagination?.page || page || 1),
      1,
    ),
    totalPages,
  );

  useEffect(() => {
    tableScrollRef.current?.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, [currentPage, search, stage]);

  function handleSearchKeyDown(event) {
    if (event.key !== "Enter") return;

    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  function selectStage(nextStage) {
    if (nextStage === stage) return;

    setStage(nextStage);
    setPage(1);
  }

  function openRequestDetails(row) {
    const requestId = String(row?.requestId || "").trim();
    if (!requestId) return;

    setSelectedRequestRow(row);
    setSelectedRequestId(requestId);
  }

  function handleRequestRowKeyDown(event, row) {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    openRequestDetails(row);
  }

  return (
    <div className="flex h-full min-h-[520px] min-w-0 flex-col bg-white font-jakarta">
      <style>{`
        @keyframes sibsEmployeeRowReveal {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .sibs-employee-row-reveal {
          animation: sibsEmployeeRowReveal 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
          will-change: opacity, transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .sibs-employee-row-reveal {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      <div className="relative overflow-visible p-4 sm:p-5">
        <PaginationTable
          filterLayout="ta-inline"
          showFilterPanel={false}
          showFilterHeader={false}
          showPagination={false}
          loading={loading}
          searchValue={searchInput}
          searchPlaceholder="Search SIBS ID, employee, account, site, department, form, service, or status..."
          onSearchChange={(value) => setSearchInput(value)}
          onSearchKeyDown={handleSearchKeyDown}
          dropdownFilters={[]}
          rightContent={
            <WorkflowFilter
              stage={stage}
              onStageChange={selectStage}
              refreshing={refreshing}
              onRefresh={() => loadRows({ silent: true })}
            />
          }
          rightContentClassName="flex w-full min-w-0 items-end xl:w-auto xl:flex-none"
          className="border-0 bg-transparent p-0 shadow-none"
        />
      </div>

      <div className="min-h-0 flex-1 px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
        {tabs.length > 1 ? (
          <div className="mb-0 overflow-hidden rounded-t-xl border border-b-0 border-[#E6ECF2] bg-white">
            <div className="flex overflow-x-auto border-b border-[#E6ECF2] bg-[#F8FAFC] px-3 pt-3 sibs-scrollbar sm:px-4">
              {tabs.map((tab) => {
                const TabIcon = tab.icon || UserRoundCheck;
                const isActive = activeTab === tab.label;

                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => onTabChange?.(tab.label)}
                    className={`relative inline-flex h-10 shrink-0 items-center gap-2 px-4 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${
                      isActive
                        ? "rounded-t-xl bg-white text-[#042C51]"
                        : "text-[#667085] hover:text-[#042C51]"
                    }`}
                  >
                    <TabIcon size={15} className="shrink-0" />
                    <span className="truncate">
                      {tab.label === "CHWCP" ? "CHWCP Requests" : tab.label}
                    </span>

                    {Number(tab.count || 0) > 0 ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold tabular-nums transition-colors ${
                          isActive
                            ? "bg-[#042C51] text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {Number(tab.count).toLocaleString("en-PH")}
                      </span>
                    ) : null}

                    {isActive ? (
                      <motion.div
                        layoutId="employeeDirectoryTabIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5C28]"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div
          className={`overflow-hidden border border-[#E6ECF2] bg-white ${
            tabs.length > 1 ? "rounded-b-xl border-t-0" : "rounded-xl"
          }`}
        >
          <div
            ref={tableScrollRef}
            className="max-h-[480px] 2xl:max-h-[640px] overflow-auto sibs-scrollbar"
          >
            <table className="w-full min-w-[1500px] table-fixed border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
                <tr className="border-b border-[#E6ECF2]">
                  <th className="w-[7%] px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[#7B8DB3] 2xl:px-4 2xl:py-3">
                    SIBS ID
                  </th>
                  <th className="w-[13%] px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[#7B8DB3] 2xl:px-4 2xl:py-3">
                    EMPLOYEE FULL NAME
                  </th>
                  <th className="w-[14%] px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[#7B8DB3] 2xl:px-4 2xl:py-3">
                    ACCOUNT / SITE
                  </th>
                  <th className="w-[13%] px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[#7B8DB3] 2xl:px-4 2xl:py-3">
                    DEPARTMENT
                  </th>
                  <th className="w-[8%] px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[#7B8DB3] 2xl:px-4 2xl:py-3">
                    FORM TYPE
                  </th>
                  <th className="w-[17%] px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[#7B8DB3] 2xl:px-4 2xl:py-3">
                    SERVICE
                  </th>
                  <th className="w-[16%] pl-3 pr-6 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[#7B8DB3] 2xl:pl-4 2xl:pr-8 2xl:py-3">
                    REQUEST DATE
                  </th>
                  <th className="w-[12%] pl-5 pr-3 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-wider text-[#7B8DB3] 2xl:pl-6 2xl:pr-4 2xl:py-3">
                    STATUS
                  </th>
                </tr>
              </thead>

              <tbody
                key={`${currentPage}-${search}-${stage}`}
                className="divide-y divide-[#EEF2F6]"
              >
                {loading ? (
                  <LoadingRows />
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-14 text-center">
                      <p className="text-sm font-extrabold text-red-600">
                        Unable to load CHWCP requests
                      </p>
                      <p className="mx-auto mt-1 max-w-xl text-xs font-semibold text-[#667085]">
                        {error}
                      </p>
                      <button
                        type="button"
                        onClick={() => loadRows()}
                        className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white transition hover:bg-[#0A3B68] active:scale-[0.98]"
                      >
                        <RefreshCcw size={14} />
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : rows.length ? (
                  rows.map((row, index) => (
                    <tr
                      key={row.requestId}
                      role="button"
                      tabIndex={0}
                      onClick={() => openRequestDetails(row)}
                      onKeyDown={(event) => handleRequestRowKeyDown(event, row)}
                      aria-label={`Open ${safeText(row.formType)} request for ${safeText(row.employeeName)}`}
                      className="group sibs-employee-row-reveal cursor-pointer bg-white transition-colors hover:bg-[#FFF9F6] focus-visible:bg-[#FFF9F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF5C28]/30"
                      style={{
                        animationDelay: `${Math.min(index, 10) * 36}ms`,
                      }}
                    >
                      <td className="whitespace-nowrap px-3 py-2 align-middle text-xs font-extrabold text-[#FF5C28] 2xl:px-4 2xl:py-2.5">
                        {safeText(row.sibsId)}
                      </td>

                      <td className="px-3 py-2 align-middle 2xl:px-4 2xl:py-2.5">
                        <div className="flex min-w-0 items-center gap-3">
                          <EmployeeAvatar employee={row} />

                          <p className="min-w-0 break-words text-xs font-extrabold leading-tight text-[#042C51] transition-colors group-hover:text-[#FF5C28]">
                            {safeText(row.employeeName)}
                          </p>
                        </div>
                      </td>

                      <td className="px-3 py-2 align-middle 2xl:px-4 2xl:py-2.5">
                        <div className="flex flex-wrap gap-1.5">
                          {getEmployeeAccounts(row).map((account) => (
                            <span
                              key={account}
                              title={account}
                              className="inline-flex max-w-full rounded border border-blue-100 bg-[#EFF6FF] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#042C51]"
                            >
                              <span className="whitespace-normal break-words">
                                {account}
                              </span>
                            </span>
                          ))}
                        </div>

                        <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#667085]">
                          <MapPin size={12} className="shrink-0 text-[#98A2B3]" />
                          <span className="break-words">{safeText(row.site)}</span>
                        </div>
                      </td>

                      <td className="px-3 py-2 align-middle 2xl:px-4 2xl:py-2.5">
                        <div className="flex flex-col gap-1">
                          {getEmployeeDepartments(row).map((department) => (
                            <div
                              key={department}
                              className="flex min-w-0 items-start gap-1.5"
                            >
                              <span
                                aria-hidden="true"
                                className="shrink-0 text-xs font-extrabold leading-tight text-[#667085]"
                              >
                                •
                              </span>
                              <span className="min-w-0 break-words text-xs font-extrabold leading-tight text-[#042C51]">
                                {department}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-3 py-2 align-middle text-xs font-semibold text-[#344054] 2xl:px-4 2xl:py-2.5">
                        {safeText(row.formType)}
                      </td>

                      <td className="px-3 py-2 align-middle text-xs font-semibold leading-snug text-[#344054] 2xl:px-4 2xl:py-2.5">
                        {safeText(row.service)}
                      </td>

                      <td className="whitespace-nowrap pl-3 pr-6 py-2 align-middle text-[11px] font-semibold text-[#536887] 2xl:pl-4 2xl:pr-8 2xl:py-2.5">
                        {formatRequestDate(row.requestDate)}
                      </td>

                      <td className="pl-5 pr-3 py-2 align-middle 2xl:pl-6 2xl:pr-4 2xl:py-2.5">
                        <StatusProgress row={row} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <FileCheck2 size={34} className="mx-auto text-[#C6D3E1]" />
                      <p className="mt-3 text-sm font-extrabold text-[#042C51]">
                        No CHWCP requests found
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#98A2B3]">
                        No request matches the current search and workflow filter.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="shrink-0 px-4 pb-4 sm:px-5 sm:pb-5">
        <PaginationTable
          loading={loading}
          showSearch={false}
          currentPage={currentPage}
          totalPages={totalPages}
          loadedCount={rows.length}
          totalRecords={totalRecords}
          recordLabel="CHWCP requests"
          onPrevious={() => setPage(Math.max(currentPage - 1, 1))}
          onNext={() => setPage(Math.min(currentPage + 1, totalPages))}
          showCount
          className="border-0 bg-transparent p-0 shadow-none"
        />
      </div>

      <ChwcpRequestDetailsModal
        requestId={selectedRequestId}
        employee={selectedRequestRow}
        onClose={() => {
          setSelectedRequestId("");
          setSelectedRequestRow(null);
        }}
      />
    </div>
  );
}
