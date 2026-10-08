import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Filter,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import Header from "../../components/layout/Header";
import StatusModal from "../../components/modals/StatusModal";
import { useUser } from "../../services/context/UserContext";
import {
  DataCard,
  MetricGridSkeleton,
  ModalShell,
  PageHeaderHero,
  ResponsiveTableShell,
  SelectDropdown,
  TablePagination,
  TableSkeletonRows,
} from "@/components/ui";
import {
  formatCompactDate,
  formatCompactDateTime,
  formatEmployeeName,
  formatNumber,
  formatDateTime,
  getAccountId,
  getAccountName,
  getAdminAccess,
  getAuditDateValue,
  getAuditDisplayValue,
  getDepartmentName,
  getRoleLabel,
  getRoleOptionByAccess,
  getRolePillClass,
  getStatusPillClass,
  isActiveAssignedUser,
  isSuperAdmin,
  normalizeRole,
  safeText,
  ROLE_OPTIONS,
} from "../../lib/utils/settings/userSettingsHelpers.js";
import {
  createUserSettingsUser,
  deleteUserSettingsUser,
  getUserSettingsAccounts,
  getUserSettingsDepartments,
  getUserSettingsSummary,
  getUserSettingsUsers,
  searchUserSettingsEmployees,
  updateUserSettingsUser,
} from "../../lib/axios/userSettings";

const PAGE_LIMIT = 15;
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5001"
).replace(/\/+$/, "");

const EMPTY_SUMMARY = {
  totalAssignments: 0,
  totalUsers: 0,
  assignedAccounts: 0,
  assignedDepartments: 0,
  superAdmins: 0,
  administrators: 0,
  employees: 0,
  activeKronosAccounts: 0,
  kronosDepartments: 0,
};

function getProfileImageUrl(employee = {}) {
  const directUrl = safeText(
    employee.profilePictureUrl ||
      employee.profile_picture_url ||
      employee.profileUrl ||
      employee.profile_url,
  );

  if (directUrl) {
    if (
      directUrl.startsWith("http://") ||
      directUrl.startsWith("https://")
    ) {
      return directUrl;
    }

    return `${API_URL}${directUrl.startsWith("/") ? "" : "/"}${directUrl}`;
  }

  const filename = safeText(
    employee.profileFilename ||
      employee.profile_filename ||
      employee.profilePicture ||
      employee.profile_picture,
  );

  if (!filename) return "";

  if (
    filename.startsWith("http://") ||
    filename.startsWith("https://")
  ) {
    return filename;
  }

  return `${API_URL}/api/employee-profile/file/${encodeURIComponent(
    filename,
  )}`;
}

function ProfileAvatar({ employee, size = "md" }) {
  const imageUrl = getProfileImageUrl(employee);

  const sizeClass =
    size === "lg"
      ? "h-12 w-12"
      : size === "sm"
        ? "h-9 w-9"
        : "h-10 w-10";

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border border-sibs-border-subtle bg-sibs-surface shadow-sm`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${formatEmployeeName(employee)} profile`}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
            const fallback = event.currentTarget.nextElementSibling;

            if (fallback) {
              fallback.style.display = "flex";
            }
          }}
        />
      ) : null}

      <div
        className="flex h-full w-full items-center justify-center text-sibs-primary-1"
        style={{ display: imageUrl ? "none" : "flex" }}
      >
        <UserRound size={size === "lg" ? 24 : 20} />
      </div>
    </div>
  );
}

function HoverProfileAvatar({ employee, size = "sm" }) {
  const anchorRef = useRef(null);
  const imageUrl = getProfileImageUrl(employee);
  const [preview, setPreview] = useState({
    open: false,
    top: 0,
    left: 0,
  });

  function showPreview() {
    const anchor = anchorRef.current;

    if (!anchor || !imageUrl || typeof window === "undefined") return;

    const rect = anchor.getBoundingClientRect();
    const previewSize = 176;
    const gap = 10;
    const viewportPadding = 8;

    let left = rect.right + gap;

    if (left + previewSize > window.innerWidth - viewportPadding) {
      left = rect.left - previewSize - gap;
    }

    left = Math.max(
      viewportPadding,
      Math.min(left, window.innerWidth - previewSize - viewportPadding),
    );

    const top = Math.max(
      viewportPadding,
      Math.min(
        rect.top + rect.height / 2 - previewSize / 2,
        window.innerHeight - previewSize - viewportPadding,
      ),
    );

    setPreview({ open: true, top, left });
  }

  function hidePreview() {
    setPreview((current) => ({ ...current, open: false }));
  }

  return (
    <>
      <div
        ref={anchorRef}
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
      >
        <ProfileAvatar employee={employee} size={size} />
      </div>

      {preview.open && imageUrl && typeof document !== "undefined"
        ? createPortal(
            <div
              data-account-profile-hover-preview="true"
              className="pointer-events-none fixed z-[999999] overflow-hidden rounded-2xl border border-sibs-border-subtle bg-white p-2 shadow-2xl"
              style={{
                top: `${preview.top}px`,
                left: `${preview.left}px`,
                width: "176px",
                height: "176px",
              }}
              aria-hidden="true"
            >
              <img
                src={imageUrl}
                alt=""
                draggable={false}
                className="h-full w-full rounded-xl object-cover"
                onError={hidePreview}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function SummaryCard(props) {
  const { icon: Icon, label, value, description, tone = "blue", index = 0 } = props;
  const tones = {
    blue: {
      label: "text-sibs-navy",
      value: "text-sibs-navy",
      icon: "bg-blue-50/80 text-sibs-navy",
    },
    emerald: {
      label: "text-emerald-700",
      value: "text-emerald-700",
      icon: "bg-emerald-50 text-emerald-700",
    },
    amber: {
      label: "text-amber-700",
      value: "text-amber-700",
      icon: "bg-amber-50 text-amber-700",
    },
    violet: {
      label: "text-violet-700",
      value: "text-violet-700",
      icon: "bg-violet-50 text-violet-700",
    },
    cyan: {
      label: "text-cyan-700",
      value: "text-cyan-700",
      icon: "bg-cyan-50 text-cyan-700",
    },
  };
  const selectedTone = tones[tone] || tones.blue;

  return (
    <article
      className="sibs-metric-card sibs-card p-4 animate-fade-in-up"
      style={{
        animationDelay: `${index * 60}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex h-full items-start justify-between gap-4">
        <div className="min-w-0 flex-1 self-stretch">
          <p
            className={`m-0 truncate sibs-text-micro font-extrabold uppercase tracking-normal ${selectedTone.label}`}
          >
            {label}
          </p>

          <p
            className={`font-heading mt-1.5 2xl:mt-2 text-2xl 2xl:text-3xl font-bold leading-none tabular-nums tracking-tight ${selectedTone.value}`}
          >
            {formatNumber(value)}
          </p>

          <p className="mt-1 line-clamp-2 sibs-text-micro font-semibold leading-tight text-sibs-muted">
            {description}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${selectedTone.icon}`}
        >
          <Icon size={17} strokeWidth={2} />
        </div>
      </div>
    </article>
  );
}

function DropdownPortal({
  open,
  anchorRef,
  children,
  onClose,
  maxHeight = 280,
}) {
  const dropdownRef = useRef(null);
  const [position, setPosition] = useState({
    top: 0,
    bottom: null,
    left: 0,
    width: 0,
    openUpward: false,
  });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return undefined;

    function updatePosition() {
      const rect = anchorRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const estimatedDropdownHeight = maxHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUpward =
        spaceBelow < estimatedDropdownHeight + 16 &&
        spaceAbove > spaceBelow;

      setPosition({
        top: openUpward ? null : rect.bottom + 8,
        bottom: openUpward
          ? Math.max(viewportHeight - rect.top + 8, 8)
          : null,
        left: Math.max(rect.left, 8),
        width: rect.width,
        openUpward,
      });
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, maxHeight, open]);

  useEffect(() => {
    if (!open) return undefined;

    function handleOutsideClick(event) {
      const clickedAnchor = anchorRef.current?.contains(event.target);
      const clickedDropdown = dropdownRef.current?.contains(event.target);

      if (!clickedAnchor && !clickedDropdown) {
        onClose?.();
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [anchorRef, onClose, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[999999] overflow-hidden rounded-xl border border-sibs-border-subtle bg-white shadow-2xl"
      style={{
        top: position.top == null ? "auto" : `${position.top}px`,
        bottom: position.bottom == null ? "auto" : `${position.bottom}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
      }}
      data-open-upward={position.openUpward ? "true" : "false"}
    >
      <div
        className="box-border overflow-x-hidden overflow-y-auto py-2 sibs-scrollbar"
        style={{ maxHeight }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}


function RolePill({ role, adminAccess }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getRolePillClass(
        adminAccess,
      )}`}
    >
      {getRoleLabel(role, adminAccess)}
    </span>
  );
}

function StatusPill({ status }) {
  const displayStatus = safeText(status) || "Unknown";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold capitalize ${getStatusPillClass(
        displayStatus,
      )}`}
    >
      {displayStatus}
    </span>
  );
}

function AccountChips({ accounts = [], limit = Number.POSITIVE_INFINITY, compact = false }) {
  if (!accounts.length) {
    return (
      <span className="text-xs font-semibold text-sibs-tertiary-5">
        —
      </span>
    );
  }

  const safeLimit = Number.isFinite(limit)
    ? Math.max(Number(limit), 0)
    : accounts.length;
  const visible = accounts.slice(0, safeLimit);
  const hidden = accounts.slice(safeLimit);
  const hiddenTitle = hidden
    .map((account) => getAccountName(account) || `Account ${getAccountId(account)}`)
    .filter(Boolean)
    .join("\n");

  return (
    <div className="flex w-full min-w-0 flex-wrap items-center gap-1 overflow-hidden">
      {visible.map((account, index) => {
        const accountId = getAccountId(account);
        const accountName =
          getAccountName(account) || `Account ${accountId}`;

        return (
          <span
            key={`${account.id || accountId}-${accountName}-${index}`}
            title={`${accountName}${accountId ? ` (${accountId})` : ""}`}
            className={`inline-flex min-w-0 max-w-full items-center rounded-md border border-blue-100 bg-blue-50/70 font-bold text-sibs-primary-1 ${
              compact
                ? "px-2 py-0.5 text-[10px] leading-5"
                : "px-2 py-0.5 text-[10px]"
            }`}
          >
            <span className="truncate">{accountName}</span>
          </span>
        );
      })}

      {hidden.length > 0 && (
        <span
          title={hiddenTitle}
          className={`inline-flex shrink-0 items-center rounded-md border border-sibs-border bg-white font-extrabold text-sibs-primary-1 ${
            compact
              ? "px-2 py-0.5 text-[10px] leading-5"
              : "px-2 py-0.5 text-[10px]"
          }`}
        >
          +{hidden.length} more
        </span>
      )}
    </div>
  );
}

function DepartmentChips({ accounts = [], limit = 2, compact = false }) {
  const departments = [
    ...new Set(accounts.map(getDepartmentName).filter(Boolean)),
  ];
  const visible = departments.slice(0, limit);
  const hidden = departments.slice(limit);
  const hiddenCount = hidden.length;

  if (!departments.length) {
    return (
      <span className="text-xs font-semibold text-sibs-tertiary-5">
        —
      </span>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-wrap items-center gap-1 overflow-hidden">
      {visible.map((department) => (
        <span
          key={department}
          title={department}
          className={`inline-flex min-w-0 max-w-full rounded-md border border-slate-200 bg-slate-50/80 font-bold text-slate-700 ${
            compact
              ? "px-1.5 py-0 text-[9.5px] leading-5"
              : "px-2 py-0.5 text-[10px]"
          }`}
        >
          <span className="truncate">{department}</span>
        </span>
      ))}

      {hiddenCount > 0 && (
        <span
          title={hidden.join("\n")}
          className={`inline-flex shrink-0 rounded-md border border-slate-200 bg-white font-extrabold text-slate-600 ${
            compact
              ? "px-1.5 py-0 text-[9.5px] leading-5"
              : "px-2 py-0.5 text-[10px]"
          }`}
        >
          +{hiddenCount} more
        </span>
      )}
    </div>
  );
}

function DraggableTableScroll({ children }) {
  const scrollRef = useRef(null);
  const dragStateRef = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });
  const [isDragging, setIsDragging] = useState(false);

  function isInteractiveTarget(target) {
    const interactiveTarget = target?.closest?.(
      "button, a, input, select, textarea, [role='button'], [data-no-table-drag='true']",
    );

    return Boolean(
      interactiveTarget && interactiveTarget.tagName !== "TR",
    );
  }

  function handleDragStart(event) {
    if (event.button !== 0) return;
    if (isInteractiveTarget(event.target)) return;

    const container = scrollRef.current;

    if (!container) return;
    if (container.scrollWidth <= container.clientWidth) return;

    dragStateRef.current = {
      isDown: true,
      startX: event.pageX - container.offsetLeft,
      scrollLeft: container.scrollLeft,
      moved: false,
    };

    setIsDragging(true);
  }

  function handleDragMove(event) {
    const container = scrollRef.current;
    const dragState = dragStateRef.current;

    if (!dragState.isDown || !container) return;

    event.preventDefault();

    const x = event.pageX - container.offsetLeft;
    const walk = (x - dragState.startX) * 1.4;

    if (Math.abs(walk) > 4) {
      dragStateRef.current.moved = true;
    }

    container.scrollLeft = dragState.scrollLeft - walk;
  }

  function handleDragEnd() {
    dragStateRef.current.isDown = false;

    window.setTimeout(() => {
      setIsDragging(false);
      dragStateRef.current.moved = false;
    }, 0);
  }

  function handleClickCapture(event) {
    if (!dragStateRef.current.moved) return;

    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div className="sibs-data-table-shell">
      <div
        ref={scrollRef}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onClickCapture={handleClickCapture}
        className={`max-h-[650px] select-none overflow-auto sibs-scrollbar ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        aria-label="Assigned users table. Drag left or right to view more columns."
      >
        {children}
      </div>
    </div>
  );
}


function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sibs-surface text-sibs-primary-1">
        <UsersRound size={26} />
      </div>

      <h3 className="sibs-modal-section-title mt-4 text-sibs-primary-1">
        No assigned users found
      </h3>

      <p className="sibs-modal-section-subtitle mt-1 max-w-md text-sibs-tertiary-5">
        Add an employee or adjust the search and filters to display account-access records.
      </p>
    </div>
  );
}


function EmployeeSearchBox({
  search,
  setSearch,
  loading,
  results,
  selectedEmployee,
  onSelect,
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-bold text-sibs-navy">
        Employee <span className="text-red-500">*</span>
      </label>

      {selectedEmployee ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <ProfileAvatar employee={selectedEmployee} size="lg" />

              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-sibs-primary-1">
                  {formatEmployeeName(selectedEmployee)}
                </p>
                <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
                  SIBS ID: {selectedEmployee.sibsId || "—"}
                </p>
                <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
                  {selectedEmployee.email || "No email available"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelect(null)}
              className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-sibs-primary-1 transition hover:bg-blue-50"
            >
              Change
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search SIBS ID, name, or email..."
              autoComplete="off"
              className="h-12 w-full rounded-xl border border-sibs-border-subtle bg-white pl-11 pr-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 hover:border-sibs-primary-1/30 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />

            {loading && (
              <Loader2
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-sibs-primary-1"
              />
            )}
          </div>

          {search.trim().length >= 2 && (
            <div className="mt-2 overflow-hidden rounded-xl border border-sibs-border bg-white">
              {loading ? (
                <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm font-bold text-sibs-tertiary-5">
                  <Loader2 size={17} className="animate-spin" />
                  Searching employees...
                </div>
              ) : results.length ? (
                <div className="max-h-64 overflow-y-auto sibs-scrollbar">
                  {results.map((employee) => (
                    <button
                      key={`${employee.gyEmpId}-${employee.sibsId}`}
                      type="button"
                      onClick={() => onSelect(employee)}
                      className="flex w-full items-start gap-3 border-b border-sibs-border-subtle px-4 py-3 text-left transition last:border-b-0 hover:bg-sibs-surface"
                    >
                      <ProfileAvatar employee={employee} />

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-extrabold text-sibs-primary-1">
                          {formatEmployeeName(employee)}
                        </span>
                        <span className="mt-1 block truncate text-xs font-semibold text-sibs-tertiary-5">
                          SIBS ID: {employee.sibsId || "—"}
                        </span>
                        <span className="mt-1 block truncate text-xs font-medium text-sibs-tertiary-5">
                          {employee.account || "No account"} ·{" "}
                          {employee.department || "No department"}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-6 text-center text-sm font-bold text-sibs-tertiary-5">
                  No unassigned active employee found.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AccountMultiSelect({
  accounts,
  selectedIds,
  search,
  setSearch,
  onToggle,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const inputRef = useRef(null);

  const selectedSet = useMemo(
    () => new Set(selectedIds.map(String)),
    [selectedIds],
  );

  const filteredAccounts = useMemo(() => {
    const keyword = safeText(search).toLowerCase();

    return [...accounts]
      .filter((account) => {
        if (!keyword) return true;

        return [
          getAccountId(account),
          getAccountName(account),
          getDepartmentName(account),
          account.clusterName,
          account.gy_acc_ghl_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      })
      .sort((left, right) => {
        const leftSelected = selectedSet.has(getAccountId(left));
        const rightSelected = selectedSet.has(getAccountId(right));

        if (leftSelected !== rightSelected) {
          return leftSelected ? -1 : 1;
        }

        return getAccountName(left).localeCompare(getAccountName(right));
      });
  }, [accounts, search, selectedSet]);

  const selectedAccounts = useMemo(
    () =>
      accounts.filter((account) =>
        selectedSet.has(getAccountId(account)),
      ),
    [accounts, selectedSet],
  );

  function openDropdown() {
    if (disabled) return;

    setOpen(true);

    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  function closeDropdown() {
    setOpen(false);
    setSearch("");
  }

  function handleToggle(accountId) {
    if (disabled) return;

    onToggle(accountId);

    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  return (
    <div>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label className="block text-sm font-bold text-sibs-navy">
            Assigned Accounts <span className="text-red-500">*</span>
          </label>

          <p className="mt-1 text-xs font-medium text-sibs-tertiary-5">
            Select one or more accounts to assign to this employee.
          </p>
        </div>

        <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1">
          {selectedIds.length} Selected
        </span>
      </div>

      {selectedAccounts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
          {selectedAccounts.map((account) => (
            <button
              key={getAccountId(account)}
              type="button"
              disabled={disabled}
              onClick={() => handleToggle(getAccountId(account))}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-sibs-primary-1 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="truncate">
                {getAccountName(account) ||
                  `Account ${getAccountId(account)}`}
              </span>
              <X size={13} />
            </button>
          ))}
        </div>
      )}

      <div ref={anchorRef} className="relative mt-3">
        <div
          onClick={openDropdown}
          className={`flex h-12 w-full items-center gap-2 rounded-xl border px-4 transition-all duration-200 ${
            disabled
              ? "cursor-not-allowed border-sibs-border-subtle bg-sibs-surface text-sibs-muted"
              : open
                ? "border-sibs-primary-1 bg-white ring-4 ring-sibs-primary-1/10"
                : "cursor-text border-sibs-border-subtle bg-white hover:border-sibs-primary-1/40 hover:bg-sibs-surface"
          }`}
        >
          <Search
            size={17}
            className="shrink-0 text-sibs-tertiary-5"
          />

          <input
            ref={inputRef}
            value={search}
            disabled={disabled}
            onFocus={openDropdown}
            onChange={(event) => {
              setSearch(event.target.value);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                closeDropdown();
              }

              if (event.key === "ArrowDown") {
                setOpen(true);
              }
            }}
            placeholder={
              disabled
                ? "Select an employee first"
                : "Search and select accounts..."
            }
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-sibs-primary-1 outline-none placeholder:text-sibs-tertiary-5 disabled:cursor-not-allowed"
          />

          <button
            type="button"
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();

              if (open) {
                closeDropdown();
              } else {
                openDropdown();
              }
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sibs-tertiary-5 transition hover:bg-blue-50/80 hover:text-sibs-primary-1 disabled:cursor-not-allowed"
            aria-label={open ? "Close account dropdown" : "Open account dropdown"}
          >
            <ChevronDown
              size={18}
              className={`transition-transform duration-300 ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        <DropdownPortal
          open={open && !disabled}
          anchorRef={anchorRef}
          onClose={closeDropdown}
          maxHeight={320}
        >
          <div className="border-b border-sibs-border px-4 py-2.5">
            <p className="text-xs font-bold text-sibs-tertiary-5">
              {filteredAccounts.length} account
              {filteredAccounts.length === 1 ? "" : "s"} found
            </p>
          </div>

          {filteredAccounts.length ? (
            filteredAccounts.map((account) => {
              const accountId = getAccountId(account);
              const selected = selectedSet.has(accountId);

              return (
                <button
                  key={accountId}
                  type="button"
                  onClick={() => handleToggle(accountId)}
                  className={`flex w-full items-start gap-3 border-b border-sibs-border-subtle px-4 py-3 text-left transition last:border-b-0 ${
                    selected
                      ? "bg-blue-50"
                      : "bg-white hover:bg-sibs-surface"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      selected
                        ? "border-sibs-primary-1 bg-sibs-primary-1 text-white"
                        : "border-slate-300 bg-white text-transparent"
                    }`}
                  >
                    <Check size={13} strokeWidth={3} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-sibs-primary-1">
                      {getAccountName(account) ||
                        `Account ${accountId}`}
                    </span>

                    <span className="mt-1 block truncate text-xs font-semibold text-sibs-tertiary-5">
                      ID {accountId} ·{" "}
                      {getDepartmentName(account) || "No department"}
                    </span>

                    <span className="mt-1 block truncate text-[11px] font-medium text-sibs-tertiary-5">
                      {account.clusterName || "Corporate"}
                    </span>
                  </span>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-bold text-sibs-tertiary-5">
                No active accounts match your search.
              </p>
            </div>
          )}
        </DropdownPortal>
      </div>

      {!disabled && selectedIds.length === 0 && (
        <p className="mt-2 text-xs font-medium text-sibs-tertiary-5">
          Click the field above to open the account list.
        </p>
      )}
    </div>
  );
}

export function AccessModal({
  open,
  mode,
  user,
  accountOptions,
  onClose,
  onSaved,
  openStatus,
}) {
  const isEdit = mode === "edit";
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeResults, setEmployeeResults] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [adminAccess, setAdminAccess] = useState("");
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);
  const [accountSearch, setAccountSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (isEdit && user) {
      setSelectedEmployee({
        gyEmpId: user.gyEmpId,
        sibsId: user.sibsId,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        status: user.status,

        employeeProfileId:
          user.employeeProfileId || user.employee_profile_id,
        profileFilename:
          user.profileFilename || user.profile_filename,
        profile_filename:
          user.profileFilename || user.profile_filename,
        profilePicture:
          user.profilePicture || user.profile_picture,
        profile_picture:
          user.profilePicture || user.profile_picture,
        profilePictureUrl:
          user.profilePictureUrl || user.profile_picture_url,
        profile_picture_url:
          user.profilePictureUrl || user.profile_picture_url,
      });
      setAdminAccess(
        Number(user.adminAccess) > 0 ? String(user.adminAccess) : "",
      );
      setSelectedAccountIds(
        (user.assignedAccounts || []).map(getAccountId).filter(Boolean),
      );
    } else {
      setSelectedEmployee(null);
      setAdminAccess("");
      setSelectedAccountIds([]);
    }

    setEmployeeSearch("");
    setEmployeeResults([]);
    setAccountSearch("");
  }, [isEdit, open, user]);

  useEffect(() => {
    if (!open || isEdit || selectedEmployee) return undefined;

    const keyword = employeeSearch.trim();

    if (keyword.length < 2) {
      setEmployeeResults([]);
      setEmployeeLoading(false);
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        setEmployeeLoading(true);
        const results = await searchUserSettingsEmployees(keyword);
        if (!cancelled) setEmployeeResults(results);
      } catch (error) {
        if (!cancelled) {
          setEmployeeResults([]);
          openStatus("error", "Search Failed", error.message);
        }
      } finally {
        if (!cancelled) setEmployeeLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [employeeSearch, isEdit, open, openStatus, selectedEmployee]);

  function selectEmployee(employee) {
    setSelectedEmployee(employee);
    setEmployeeResults([]);
    setEmployeeSearch("");
    setAccountSearch("");

    if (!employee) {
      setAdminAccess("");
      setSelectedAccountIds([]);
      return;
    }

    if (employee.accountId) {
      const defaultAccountExists = accountOptions.some(
        (account) => getAccountId(account) === String(employee.accountId),
      );

      if (defaultAccountExists) {
        setSelectedAccountIds([String(employee.accountId)]);
      } else {
        setSelectedAccountIds([]);
      }
    } else {
      setSelectedAccountIds([]);
    }
  }

  function toggleAccount(accountId) {
    if (!selectedEmployee) return;

    setSelectedAccountIds((previous) =>
      previous.includes(accountId)
        ? previous.filter((id) => id !== accountId)
        : [...previous, accountId],
    );
  }

  const selectedAccessOption = getRoleOptionByAccess(Number(adminAccess));
  const hasSelectedAccess = Boolean(
    adminAccess &&
      adminAccess !== "0" &&
      selectedAccessOption &&
      selectedAccessOption.value !== "employee" &&
      selectedAccessOption.value !== "All",
  );

  async function handleSave() {
    if (!selectedEmployee?.gyEmpId || !selectedEmployee?.sibsId) {
      openStatus("error", "Employee Required", "Select an employee.");
      return;
    }

    if (!hasSelectedAccess) {
      openStatus("error", "Access Required", "Select an access level.");
      return;
    }

    if (!selectedAccountIds.length) {
      openStatus(
        "error",
        "Account Required",
        "Select at least one active account.",
      );
      return;
    }

    try {
      setSaving(true);

      const selectedRoleOption = selectedAccessOption;

      const payload = {
        gyEmpId: selectedEmployee.gyEmpId,
        sibsId: selectedEmployee.sibsId,
        role: selectedRoleOption?.value || "",
        adminAccess: Number(adminAccess),
        accountIds: selectedAccountIds,
      };

      const result = isEdit
        ? await updateUserSettingsUser(user.id, payload)
        : await createUserSettingsUser(payload);

      openStatus(
        "success",
        isEdit ? "Access Updated" : "Access Added",
        result?.message ||
          (isEdit
            ? "User account access was updated successfully."
            : "User account access was added successfully."),
      );

      onClose();
      await onSaved();

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new Event("sibs-audit-notifications-refresh"),
        );

        window.setTimeout(() => {
          window.dispatchEvent(
            new Event("sibs-audit-notifications-refresh"),
          );
        }, 500);
      }
    } catch (error) {
      openStatus(
        "error",
        isEdit ? "Update Failed" : "Add Failed",
        error.message,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      open={open}
      variant="navy"
      maxWidth="max-w-4xl"
      icon={UserCog}
      title={isEdit ? "Edit User Account Access" : "Add User Access"}
      subtitle={
        isEdit
          ? "Update the employee's admin access and assigned accounts."
          : "Employee information is read-only. Only the selected access settings are saved."
      }
      onClose={() => {
        if (!saving) onClose();
      }}
      closeOnBackdrop={false}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="sibs-btn-secondary h-10 px-5 text-sm"
          >
            Cancel
          </button>

          {hasSelectedAccess ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="sibs-btn-primary h-10 px-5 text-sm"
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : isEdit ? (
                <Edit3 size={17} />
              ) : (
                <Plus size={17} />
              )}
              {isEdit ? "Save Changes" : "Add User Access"}
            </button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4">
        <section className="relative overflow-hidden rounded-2xl border border-sibs-border bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-sibs-border pb-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-normal text-sibs-navy">
                Employee Record
              </p>
              <p className="mt-1 text-xs font-semibold text-sibs-muted">
                Employee information is read-only on this form.
              </p>
            </div>

            <span className="inline-flex shrink-0 items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold uppercase text-sibs-navy">
              Read Only
            </span>
          </div>

          {isEdit ? (
            <div className="flex items-start gap-3 rounded-xl border border-sibs-border bg-sibs-surface p-4">
              <ProfileAvatar
                employee={selectedEmployee || {}}
                size="lg"
              />

              <div className="min-w-0">
                <p className="truncate text-base font-extrabold text-sibs-navy">
                  {formatEmployeeName(selectedEmployee || {})}
                </p>
                <p className="mt-1 text-sm font-semibold text-sibs-muted">
                  SIBS ID: {selectedEmployee?.sibsId || "—"}
                </p>
                <p className="mt-1 truncate text-xs font-semibold text-sibs-muted">
                  {selectedEmployee?.email || "No email available"}
                </p>
                <p className="mt-1 text-xs font-semibold text-sibs-faint">
                  Access settings can be updated below without changing the employee record.
                </p>
              </div>
            </div>
          ) : (
            <EmployeeSearchBox
              search={employeeSearch}
              setSearch={setEmployeeSearch}
              loading={employeeLoading}
              results={employeeResults}
              selectedEmployee={selectedEmployee}
              onSelect={selectEmployee}
            />
          )}
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-sibs-border bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 border-b border-sibs-border pb-3">
            <p className="text-[10px] font-extrabold uppercase tracking-normal text-sibs-navy">
              Access Configuration
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-sibs-muted">
              Set the employee's access level and choose the accounts available to this user.
            </p>
          </div>

          <div className="space-y-5">
            <SelectDropdown
              label="Access"
              labelClassName="text-sm font-bold text-sibs-navy normal-case"
              value={adminAccess}
              onChange={(val) => setAdminAccess(val)}
              disabled={!selectedEmployee}
              options={ROLE_OPTIONS.filter(
                (option) =>
                  option.value !== "All" && option.value !== "employee",
              ).map(
                (option) => ({
                  value: String(option.access),
                  label: option.label,
                }),
              )}
              placeholder={
                selectedEmployee
                  ? "Select admin access"
                  : "Select an employee first"
              }
              clearable={false}
              className="h-12 text-sm bg-white rounded-xl border-sibs-border-subtle"
            />

            <AccountMultiSelect
              accounts={accountOptions}
              selectedIds={selectedAccountIds}
              search={accountSearch}
              setSearch={setAccountSearch}
              onToggle={toggleAccount}
              disabled={!selectedEmployee}
            />
          </div>
        </section>
      </div>
    </ModalShell>
  );
}

function DeleteAccessModal({ target, onClose, onDeleted, openStatus }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    try {
      setDeleting(true);
      const result = await deleteUserSettingsUser(target.id);

      openStatus(
        "success",
        "Access Removed",
        result?.message || "User account access was removed successfully.",
      );

      onClose();
      await onDeleted();
    } catch (error) {
      openStatus("error", "Delete Failed", error.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <ModalShell
      open={Boolean(target)}
      variant="navy"
      maxWidth="max-w-md"
      icon={Trash2}
      title="Remove User Account Access"
      subtitle="This removes all account access assigned to the selected employee. Employee information will not be changed."
      onClose={() => {
        if (!deleting) onClose();
      }}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="sibs-btn-secondary h-10 px-5 text-sm"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-red-600 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Trash2 size={17} />
            )}
            Remove Access
          </button>
        </div>
      }
    >
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
        <p className="text-sm font-extrabold text-red-800">
          {formatEmployeeName(target || {})}
        </p>
        <p className="mt-1 text-sm font-semibold text-red-700">
          {target?.sibsId} · {target?.assignedAccounts?.length || 0} assigned account(s)
        </p>
      </div>
    </ModalShell>
  );
}

function AccessDetailsModal({ target, onClose, onEdit, onDelete }) {
  const accounts = target?.assignedAccounts || [];

  return (
    <ModalShell
      open={Boolean(target)}
      variant="navy"
      maxWidth="max-w-4xl"
      icon={UserCog}
      title="Employee Access Details"
      subtitle="Review the employee's assigned access before making changes."
      onClose={onClose}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => onDelete(target)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-red-200 bg-white px-5 text-sm font-extrabold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
          >
            <Trash2 size={16} />
            Delete Access
          </button>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="sibs-btn-secondary h-10 px-5 text-sm"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => onEdit(target)}
              className="sibs-btn-primary h-10 px-5 text-sm"
            >
              <Edit3 size={16} />
              Edit Access
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <section className="overflow-hidden rounded-2xl border border-sibs-border bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <ProfileAvatar employee={target || {}} size="lg" />

              <div className="min-w-0">
                <p className="break-words text-base font-extrabold text-sibs-navy">
                  {formatEmployeeName(target || {})}
                </p>
                <p className="mt-1 break-all text-xs font-semibold text-sibs-muted">
                  {target?.email || "No email available"}
                </p>
                <p className="mt-1 text-xs font-semibold text-sibs-faint">
                  SIBS ID: {target?.sibsId || "—"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={target?.status} />
              <RolePill role={target?.role} adminAccess={target?.adminAccess} />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-sibs-border bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 border-b border-sibs-border pb-3">
            <p className="text-[10px] font-extrabold uppercase tracking-normal text-sibs-navy">
              Access Assignment
            </p>
            <p className="mt-1 text-xs font-semibold text-sibs-muted">
              Current access level, assigned accounts, and departments.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-sibs-border bg-sibs-surface p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-faint">
                Access Level
              </p>
              <div className="mt-2">
                <RolePill role={target?.role} adminAccess={target?.adminAccess} />
              </div>
            </div>

            <div className="rounded-xl border border-sibs-border bg-sibs-surface p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-faint">
                Status
              </p>
              <div className="mt-2">
                <StatusPill status={target?.status} />
              </div>
            </div>

            <div className="rounded-xl border border-sibs-border bg-sibs-surface p-4 lg:col-span-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-faint">
                Assigned Accounts
              </p>
              <div className="mt-2">
                <AccountChips accounts={accounts} />
              </div>
            </div>

            <div className="rounded-xl border border-sibs-border bg-sibs-surface p-4 lg:col-span-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-faint">
                Departments
              </p>
              <div className="mt-2">
                <DepartmentChips accounts={accounts} limit={999} />
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-sibs-border bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 border-b border-sibs-border pb-3">
            <p className="text-[10px] font-extrabold uppercase tracking-normal text-sibs-navy">
              Audit Information
            </p>
            <p className="mt-1 text-xs font-semibold text-sibs-muted">
              Creation and latest update details for this access record.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-sibs-border bg-sibs-surface p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-faint">
                Creator
              </p>
              <p className="mt-2 break-words text-xs font-extrabold text-sibs-text-secondary">
                {getAuditDisplayValue(target || {}, "creator")}
              </p>
              <p className="mt-1 text-xs font-semibold text-sibs-muted">
                {formatDateTime(getAuditDateValue(target || {}, "created"))}
              </p>
            </div>

            <div className="rounded-xl border border-sibs-border bg-sibs-surface p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-faint">
                Updater
              </p>
              <p className="mt-2 break-words text-xs font-extrabold text-sibs-text-secondary">
                {getAuditDisplayValue(target || {}, "updater")}
              </p>
              <p className="mt-1 text-xs font-semibold text-sibs-muted">
                {formatDateTime(getAuditDateValue(target || {}, "updated"))}
              </p>
            </div>
          </div>
        </section>
      </div>
    </ModalShell>
  );
}

function MobileUserCard({
  user,
  onEdit,
  onDelete,
  highlighted = false,
}) {
  return (
    <div
      data-user-settings-sibs-id={safeText(user?.sibsId)}
      className={`rounded-2xl transition-all duration-300 ${
        highlighted
          ? "ring-2 ring-sibs-orange/50 ring-offset-2 ring-offset-sibs-surface"
          : ""
      }`}
    >
      <DataCard
        className={
          highlighted
            ? "border-sibs-orange/50 bg-orange-50/40 shadow-md"
            : ""
        }
      >
      <DataCard.Header
        avatar={<ProfileAvatar employee={user} size="lg" />}
        title={formatEmployeeName(user)}
        subtitle={user.email || "No email"}
        badge={<StatusPill status={user.status} />}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sibs-border bg-sibs-surface p-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            SIBS ID
          </span>
          <p className="text-xs font-extrabold text-sibs-primary-1">
            {user.sibsId || "—"}
          </p>
        </div>
        <div>
          <RolePill role={user.role} adminAccess={user.adminAccess} />
        </div>
      </div>

      <DataCard.Section label="Assigned Accounts">
        <AccountChips accounts={user.assignedAccounts} />
      </DataCard.Section>

      <DataCard.Section label="Department">
        <DepartmentChips accounts={user.assignedAccounts} limit={5} />
      </DataCard.Section>

      <DataCard.Section label="Audit Trail">
        <div className="space-y-1 text-xs text-sibs-text-secondary">
          <p>
            <span className="font-semibold text-sibs-tertiary-5">Creator:</span>{" "}
            {getAuditDisplayValue(user, "creator")}{" "}
            <span className="text-[11px] text-sibs-tertiary-5">
              ({formatDateTime(getAuditDateValue(user, "created"))})
            </span>
          </p>
          <p>
            <span className="font-semibold text-sibs-tertiary-5">Updater:</span>{" "}
            {getAuditDisplayValue(user, "updater")}{" "}
            <span className="text-[11px] text-sibs-tertiary-5">
              ({formatDateTime(getAuditDateValue(user, "updated"))})
            </span>
          </p>
        </div>
      </DataCard.Section>

      <DataCard.Actions>
        <button
          type="button"
          onClick={() => onEdit(user)}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 text-xs font-bold text-sibs-primary-1 transition hover:bg-blue-100 active:scale-[0.98]"
        >
          <Edit3 size={15} />
          Edit Access
        </button>

        <button
          type="button"
          onClick={() => onDelete(user)}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-700 transition hover:bg-red-100 active:scale-[0.98]"
        >
          <Trash2 size={15} />
          Delete
        </button>
      </DataCard.Actions>
      </DataCard>
    </div>
  );
}

function UserSettingsLoading() {
  return (
    <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-5">
          <section className="sibs-card relative overflow-hidden p-5 sm:p-6">
            <span className="sibs-top-accent" aria-hidden="true" />
            <div className="mt-1">
              <div className="mb-3 h-6 w-56 animate-sibs-pulse rounded bg-gray-200" />
              <div className="mb-2 h-8 w-64 max-w-full animate-sibs-pulse rounded bg-gray-200" />
              <div className="h-4 w-96 max-w-full animate-sibs-pulse rounded bg-gray-200" />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="sibs-card h-28 animate-sibs-pulse rounded-2xl bg-gray-100"
              />
            ))}
          </section>

          <section className="sibs-card h-[460px] animate-sibs-pulse rounded-2xl bg-white" />
        </div>
      </main>
    </div>
  );
}

export default function UserSettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: userLoading } = useUser();
  const searchInputRef = useRef(null);
  const skipInitialUsersReloadRef = useRef(true);

  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [accountOptions, setAccountOptions] = useState([]);
  const [, setDepartmentOptions] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [highlightedSibsId, setHighlightedSibsId] = useState("");

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [accountFilter, setAccountFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 1,
  });

  const [accessModal, setAccessModal] = useState({
    open: false,
    mode: "add",
    user: null,
  });
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const authorized = useMemo(() => isSuperAdmin(user), [user]);

  /*
   * Use stable primitive values in effects instead of the complete user object.
   * UserContext may refresh the user object when the browser tab regains focus.
   * Depending on the object reference would rerun the full bootstrap loader.
   */
  const hasAuthenticatedUser = Boolean(user);
  const authenticatedUserKey = safeText(
    user?.id ||
      user?.gy_user_id ||
      user?.gyEmpId ||
      user?.gy_emp_id ||
      user?.sibsId ||
      user?.sibs_id ||
      user?.username ||
      user?.gy_user_code,
  );

  const accountFilterOptions = useMemo(
    () => [
      { value: "All", label: "All Accounts" },
      ...accountOptions.map((account) => ({
        value: getAccountId(account),
        label: getAccountName(account) || `Account ${getAccountId(account)}`,
      })),
    ],
    [accountOptions],
  );

  const roleFilterOptions = useMemo(
    () => ROLE_OPTIONS.map(({ value, label }) => ({ value, label })),
    [],
  );

  const isDataLoading = pageLoading || tableLoading;
  const hasActiveFilters =
    Boolean(search.trim() || appliedSearch) ||
    roleFilter !== "All" ||
    accountFilter !== "All";

  const openStatus = useCallback((type, title, message) => {
    setStatusModal({ open: true, type, title, message });
  }, []);

  const closeStatus = useCallback(() => {
    setStatusModal((previous) => ({ ...previous, open: false }));
  }, []);

  const loadReferenceData = useCallback(async () => {
    const [summaryData, accounts, departments] = await Promise.all([
      getUserSettingsSummary(),
      getUserSettingsAccounts(),
      getUserSettingsDepartments(),
    ]);

    setSummary({ ...EMPTY_SUMMARY, ...summaryData });
    setAccountOptions(accounts);
    setDepartmentOptions(departments);
  }, []);

  const loadUsers = useCallback(
    async ({ quiet = false } = {}) => {
      try {
        if (!quiet) setTableLoading(true);

        const result = await getUserSettingsUsers({
          page: currentPage,
          limit: PAGE_LIMIT,
          search: appliedSearch || undefined,
          role: roleFilter === "All" ? undefined : roleFilter,
          accountId: accountFilter === "All" ? undefined : accountFilter,
        });

        const activeUsers = result.data.filter(isActiveAssignedUser);

        setUsers(activeUsers);
        setPagination({
          ...result.pagination,
          page: Number(result.pagination?.page || currentPage),
          limit: Number(result.pagination?.limit || PAGE_LIMIT),
          total: Number(result.pagination?.total || 0),
          totalPages: Math.max(
            Number(result.pagination?.totalPages || 1),
            1,
          ),
        });

        if (result.accountOptions.length) {
          setAccountOptions((previous) =>
            previous.length ? previous : result.accountOptions,
          );
        }

        if (result.departmentOptions.length) {
          setDepartmentOptions((previous) =>
            previous.length ? previous : result.departmentOptions,
          );
        }
      } catch (error) {
        setUsers([]);
        openStatus("error", "Load Failed", error.message);
      } finally {
        if (!quiet) setTableLoading(false);
      }
    },
    [
      accountFilter,
      appliedSearch,
      currentPage,
      openStatus,
      roleFilter,
    ],
  );

  const reloadAll = useCallback(
    async ({ showRefresh = false } = {}) => {
      try {
        if (showRefresh) setRefreshing(true);
        await Promise.all([loadReferenceData(), loadUsers({ quiet: true })]);
      } catch (error) {
        openStatus("error", "Refresh Failed", error.message);
      } finally {
        if (showRefresh) setRefreshing(false);
      }
    },
    [loadReferenceData, loadUsers, openStatus],
  );

  useEffect(() => {
    if (userLoading) return;

    if (!hasAuthenticatedUser) {
      navigate("/login", { replace: true });
      return;
    }

    if (!authorized) {
      navigate("/dashboard/admin", { replace: true });
    }
  }, [
    authorized,
    authenticatedUserKey,
    hasAuthenticatedUser,
    navigate,
    userLoading,
  ]);

  useEffect(() => {
    const state = location.state;

    if (
      !["user-settings-notification", "account-settings-notification"].includes(
        state?.source,
      )
    ) {
      return;
    }

    const targetSibsId = safeText(
      state?.highlightSibsId || state?.targetSibsId,
    );

    if (targetSibsId) {
      /*
       * Search by the notification target so the selected employee can be
       * located even when their record was previously on another page.
       */
      skipInitialUsersReloadRef.current = false;
      setSearch(targetSibsId);
      setAppliedSearch(targetSibsId);
      setRoleFilter("All");
      setAccountFilter("All");
      setCurrentPage(1);
      setHighlightedSibsId(targetSibsId);
    }

    navigate(location.pathname, {
      replace: true,
      state: {},
    });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppliedSearch(search.trim());
      setCurrentPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (
      userLoading ||
      !hasAuthenticatedUser ||
      !authorized
    ) {
      return undefined;
    }

    let cancelled = false;

    async function bootstrap() {
      try {
        /*
         * This is the only effect allowed to show the full-page loader.
         * Its dependencies are stable primitives, so changing browser tabs
         * does not restart the page when UserContext refreshes its object.
         */
        setPageLoading(true);

        const [summaryData, accounts, departments, userResult] =
          await Promise.all([
            getUserSettingsSummary(),
            getUserSettingsAccounts(),
            getUserSettingsDepartments(),
            getUserSettingsUsers({ page: 1, limit: PAGE_LIMIT }),
          ]);

        if (cancelled) return;

        const activeUsers = userResult.data.filter(isActiveAssignedUser);

        setSummary({ ...EMPTY_SUMMARY, ...summaryData });
        setAccountOptions(accounts);
        setDepartmentOptions(departments);
        setUsers(activeUsers);
        setPagination({
          ...userResult.pagination,
          page: Number(userResult.pagination?.page || 1),
          limit: Number(userResult.pagination?.limit || PAGE_LIMIT),
          total: Number(userResult.pagination?.total || 0),
          totalPages: Math.max(
            Number(userResult.pagination?.totalPages || 1),
            1,
          ),
        });
      } catch (error) {
        if (!cancelled) {
          openStatus("error", "Load Failed", error.message);
        }
      } finally {
        if (!cancelled) {
          setPageLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [
    authenticatedUserKey,
    authorized,
    hasAuthenticatedUser,
    openStatus,
    userLoading,
  ]);

  useEffect(() => {
    if (
      pageLoading ||
      userLoading ||
      !hasAuthenticatedUser ||
      !authorized
    ) {
      return;
    }

    if (skipInitialUsersReloadRef.current) {
      skipInitialUsersReloadRef.current = false;
      return;
    }

    loadUsers();
  }, [
    accountFilter,
    appliedSearch,
    authenticatedUserKey,
    authorized,
    currentPage,
    hasAuthenticatedUser,
    loadUsers,
    pageLoading,
    roleFilter,
    userLoading,
  ]);

  useEffect(() => {
    if (currentPage > pagination.totalPages) {
      setCurrentPage(pagination.totalPages || 1);
    }
  }, [currentPage, pagination.totalPages]);

  useEffect(() => {
    if (!highlightedSibsId || isDataLoading) {
      return undefined;
    }

    const matchingUser = users.find(
      (assignedUser) =>
        safeText(assignedUser?.sibsId) === safeText(highlightedSibsId),
    );

    if (!matchingUser) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      const candidates = Array.from(
        document.querySelectorAll("[data-user-settings-sibs-id]"),
      );

      const targetElement =
        candidates.find(
          (element) =>
            element.dataset.userSettingsSibsId === highlightedSibsId &&
            element.offsetParent !== null,
        ) ||
        candidates.find(
          (element) =>
            element.dataset.userSettingsSibsId === highlightedSibsId,
        );

      targetElement?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    });

    const timer = window.setTimeout(() => {
      setHighlightedSibsId("");
    }, 6000);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [highlightedSibsId, isDataLoading, users]);


  function clearFilters() {
    setSearch("");
    setAppliedSearch("");
    setRoleFilter("All");
    setAccountFilter("All");
    setCurrentPage(1);
    searchInputRef.current?.focus();
  }

  function openAddModal() {
    setAccessModal({ open: true, mode: "add", user: null });
  }

  function openDetailsModal(selectedUser) {
    setDetailsTarget(selectedUser);
  }

  function closeDetailsModal() {
    setDetailsTarget(null);
  }

  function openEditModal(selectedUser) {
    setAccessModal({ open: true, mode: "edit", user: selectedUser });
  }

  function openEditFromDetails(selectedUser) {
    closeDetailsModal();
    openEditModal(selectedUser);
  }

  function openDeleteFromDetails(selectedUser) {
    closeDetailsModal();
    setDeleteTarget(selectedUser);
  }

  function closeAccessModal() {
    setAccessModal((previous) => ({ ...previous, open: false }));
  }

  async function handleMutationCompleted() {
    await reloadAll();
  }

  function handlePageChange(nextPage) {
    const safePage = Math.min(
      Math.max(nextPage, 1),
      Math.max(pagination.totalPages, 1),
    );
    setCurrentPage(safePage);
  }

  if (
    userLoading ||
    !hasAuthenticatedUser ||
    !authorized
  ) {
    return <UserSettingsLoading />;
  }

  return (
    <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <style>{`
        @keyframes sibsUserSettingsRowReveal {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .sibs-user-settings-row-reveal {
          animation: sibsUserSettingsRowReveal 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
          will-change: opacity, transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .sibs-user-settings-row-reveal {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-5">
          <PageHeaderHero
            kicker="User Settings View"
            title="User Settings"
            description="Manage employee access levels, assigned accounts, and department access."
            actions={
              <button
                type="button"
                onClick={openAddModal}
                className="sibs-btn-primary max-sm:w-full"
              >
                <Plus size={16} />
                Add User Access
              </button>
            }
          />

          {pageLoading ? (
            <MetricGridSkeleton
              count={5}
              labels={[
                "Assigned Users",
                "Assignments",
                "Assigned Accounts",
                "Departments",
                "Super Admins",
              ]}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5"
              ariaLabel="Loading user settings metrics"
            />
          ) : (
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryCard
                index={0}
                icon={UsersRound}
                label="Assigned Users"
                value={summary.totalUsers}
                description="Distinct HRIS users"
              />
              <SummaryCard
                index={1}
                icon={KeyRound}
                label="Assignments"
                value={summary.totalAssignments}
                description="Total access records"
                tone="violet"
              />
              <SummaryCard
                index={2}
                icon={Building2}
                label="Assigned Accounts"
                value={summary.assignedAccounts}
                description={`${summary.activeKronosAccounts} available accounts`}
                tone="cyan"
              />
              <SummaryCard
                index={3}
                icon={UserCog}
                label="Departments"
                value={summary.assignedDepartments}
                description={`${summary.kronosDepartments} available departments`}
                tone="amber"
              />
              <SummaryCard
                index={4}
                icon={ShieldCheck}
                label="Super Admins"
                value={summary.superAdmins}
                description="Access level 7"
                tone="emerald"
              />
            </section>
          )}

          <section className="sibs-card overflow-hidden rounded-2xl">
            <div className="border-b border-sibs-border bg-white p-4 sm:p-5 font-jakarta">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <h2 className="sibs-section-title">Assigned Users</h2>
                  <p className="sibs-section-subtitle">
                    Employee information is read-only. Access settings are managed on this page.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="sibs-badge-neutral w-max">
                    {pageLoading ? "Loading..." : `${pagination.total} Users`}
                  </span>

                  <button
                    type="button"
                    onClick={() => reloadAll({ showRefresh: true })}
                    disabled={refreshing}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-sibs-border-subtle bg-white text-sibs-navy transition hover:bg-sibs-surface disabled:opacity-50"
                    aria-label="Refresh user settings"
                  >
                    <RefreshCw
                      size={15}
                      className={refreshing ? "animate-spin" : ""}
                    />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_210px_260px_auto] xl:items-end">
                  <div>
                    <label className="mb-1 block font-jakarta text-xs font-bold text-sibs-navy">
                      Search
                    </label>

                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-muted"
                      />

                      <input
                        ref={searchInputRef}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search employee, SIBS ID, account..."
                        className="sibs-dashboard-input pl-9 pr-4"
                      />
                    </div>
                  </div>

                  <SelectDropdown
                    label="Access"
                    labelClassName="text-xs font-bold text-sibs-navy normal-case"
                    value={roleFilter}
                    onChange={(value) => {
                      setRoleFilter(value);
                      setCurrentPage(1);
                    }}
                    options={roleFilterOptions}
                    placeholder="All Access Levels"
                    clearable={false}
                    className="h-10 text-xs bg-white rounded-lg border-sibs-border-subtle"
                  />

                  <SelectDropdown
                    label="Assigned Account"
                    labelClassName="text-xs font-bold text-sibs-navy normal-case"
                    value={accountFilter}
                    onChange={(value) => {
                      setAccountFilter(value);
                      setCurrentPage(1);
                    }}
                    options={accountFilterOptions}
                    searchable
                    searchPlaceholder="Search account..."
                    placeholder="All Accounts"
                    clearable={false}
                    className="h-10 text-xs bg-white rounded-lg border-sibs-border-subtle"
                  />

                  <button
                    type="button"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className="sibs-btn-secondary h-10 gap-2 px-4 cursor-pointer"
                  >
                    <Filter size={15} />
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 font-jakarta">
              <ResponsiveTableShell
                breakpoint="lg"
                mobileView={
                  <div className="space-y-3">
                    {isDataLoading ? (
                      <DataCard.Skeleton count={4} />
                    ) : users.length ? (
                      users.map((assignedUser) => (
                        <MobileUserCard
                          key={assignedUser.id}
                          user={assignedUser}
                          onEdit={openEditModal}
                          onDelete={setDeleteTarget}
                          highlighted={
                            safeText(assignedUser.sibsId) ===
                            safeText(highlightedSibsId)
                          }
                        />
                      ))
                    ) : (
                      <DataCard.Empty
                        icon={UsersRound}
                        title="No assigned users found"
                        description="Add an employee or adjust the search and filters to display account-access records."
                      />
                    )}
                  </div>
                }
                desktopView={
                  <DraggableTableScroll>
                    <table className="w-full table-fixed border-collapse bg-white text-left">
                      <colgroup>
                        <col className="w-[28%]" />
                        <col className="w-[8%]" />
                        <col className="w-[9%]" />
                        <col className="w-[22%]" />
                        <col className="w-[14%]" />
                        <col className="w-[19%]" />
                      </colgroup>

                      <thead className="sibs-data-table-head">
                        <tr className="sibs-data-table-head-row">
                          <th className="sibs-data-table-th">Employee</th>
                          <th className="sibs-data-table-th">Status</th>
                          <th className="sibs-data-table-th">Access</th>
                          <th className="sibs-data-table-th">Assigned Accounts</th>
                          <th className="sibs-data-table-th">Departments</th>
                          <th className="sibs-data-table-th">Audit</th>
                        </tr>
                      </thead>

                      <tbody>
                        {isDataLoading ? (
                          <TableSkeletonRows count={PAGE_LIMIT} columns={6} />
                        ) : users.length ? (
                          users.map((assignedUser, index) => (
                            <tr
                              key={assignedUser.id}
                              data-user-settings-sibs-id={safeText(
                                assignedUser.sibsId,
                              )}
                              role="button"
                              tabIndex={0}
                              onClick={() => openDetailsModal(assignedUser)}
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                                  event.preventDefault();
                                  openDetailsModal(assignedUser);
                                }
                              }}
                              aria-label={`Open access details for ${formatEmployeeName(assignedUser)}`}
                              className={`sibs-data-table-row sibs-user-settings-row-reveal cursor-pointer border-b border-sibs-border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sibs-orange/30 ${
                                safeText(assignedUser.sibsId) ===
                                safeText(highlightedSibsId)
                                  ? "bg-orange-50/70 shadow-[inset_4px_0_0_theme(colors.sibs.orange)] ring-2 ring-inset ring-sibs-orange/40"
                                  : "hover:bg-orange-50/40 focus-visible:bg-orange-50/40"
                              }`}
                              style={{
                                animationDelay: `${Math.min(index, 10) * 36}ms`,
                              }}
                            >
                              <td className="sibs-data-table-td py-3.5 align-middle">
                                <div className="flex min-w-0 items-center gap-3">
                                  <HoverProfileAvatar
                                    employee={assignedUser}
                                    size="sm"
                                  />

                                  <div className="min-w-0 flex-1">
                                    <p
                                      className="truncate text-xs font-extrabold text-sibs-navy"
                                      title={formatEmployeeName(assignedUser)}
                                    >
                                      {formatEmployeeName(assignedUser)}
                                    </p>

                                    <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[10px] font-semibold text-sibs-tertiary-5">
                                      <span className="shrink-0">
                                        SIBS {assignedUser.sibsId || "—"}
                                      </span>
                                      <span className="shrink-0 text-sibs-border-subtle">
                                        ·
                                      </span>
                                      <span
                                        className="min-w-0 truncate"
                                        title={
                                          assignedUser.email ||
                                          "No email available"
                                        }
                                      >
                                        {assignedUser.email ||
                                          "No email available"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="sibs-data-table-td py-3.5 align-middle">
                                <StatusPill status={assignedUser.status} />
                              </td>

                              <td className="sibs-data-table-td py-3.5 align-middle">
                                <RolePill
                                  role={assignedUser.role}
                                  adminAccess={assignedUser.adminAccess}
                                />
                              </td>

                              <td className="sibs-data-table-td min-w-0 overflow-hidden py-3.5 align-middle">
                                <AccountChips
                                  accounts={assignedUser.assignedAccounts}
                                  limit={3}
                                  compact
                                />
                              </td>

                              <td className="sibs-data-table-td min-w-0 overflow-hidden py-3.5 align-middle">
                                <DepartmentChips
                                  accounts={assignedUser.assignedAccounts}
                                  limit={2}
                                  compact
                                />
                              </td>

                              <td className="sibs-data-table-td min-w-0 py-3 align-middle">
                                <div className="min-w-0 space-y-1.5">
                                  <p
                                    className="flex min-w-0 items-center gap-2 text-[10px] leading-4"
                                    title={`Created: ${getAuditDisplayValue(
                                      assignedUser,
                                      "creator",
                                    )} · ${formatDateTime(
                                      getAuditDateValue(
                                        assignedUser,
                                        "created",
                                      ),
                                    )}`}
                                  >
                                    <span className="w-[46px] shrink-0 font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                                      Created
                                    </span>
                                    <span className="shrink-0 font-semibold text-sibs-muted">
                                      {formatCompactDate(
                                        getAuditDateValue(
                                          assignedUser,
                                          "created",
                                        ),
                                      )}
                                    </span>
                                    <span className="shrink-0 text-sibs-border-subtle">
                                      ·
                                    </span>
                                    <span className="min-w-0 truncate font-bold text-sibs-text-secondary">
                                      {getAuditDisplayValue(
                                        assignedUser,
                                        "creator",
                                      )}
                                    </span>
                                  </p>

                                  <p
                                    className="flex min-w-0 items-center gap-2 text-[10px] leading-4"
                                    title={`Updated: ${getAuditDisplayValue(
                                      assignedUser,
                                      "updater",
                                    )} · ${formatDateTime(
                                      getAuditDateValue(
                                        assignedUser,
                                        "updated",
                                      ),
                                    )}`}
                                  >
                                    <span className="w-[46px] shrink-0 font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                                      Updated
                                    </span>
                                    <span className="shrink-0 font-semibold text-sibs-muted">
                                      {formatCompactDate(
                                        getAuditDateValue(
                                          assignedUser,
                                          "updated",
                                        ),
                                      )}
                                    </span>
                                    <span className="shrink-0 text-sibs-border-subtle">
                                      ·
                                    </span>
                                    <span className="min-w-0 truncate font-bold text-sibs-text-secondary">
                                      {getAuditDisplayValue(
                                        assignedUser,
                                        "updater",
                                      )}
                                    </span>
                                  </p>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6}>
                              <EmptyState />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
              </DraggableTableScroll>
            }
          />
            </div>

            <div className="border-t border-sibs-border bg-white px-4 py-3 sm:px-5 font-jakarta">
              <TablePagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                totalRecords={pagination.total}
                limit={PAGE_LIMIT}
                loadedCount={users.length}
                recordLabel="assigned users"
                onPageChange={(nextPage) => handlePageChange(nextPage)}
                loading={isDataLoading}
                className="!border-t-0 !pt-0"
              />
            </div>
          </section>
        </div>
      </main>

      <AccessDetailsModal
        target={detailsTarget}
        onClose={closeDetailsModal}
        onEdit={openEditFromDetails}
        onDelete={openDeleteFromDetails}
      />

      <AccessModal
        open={accessModal.open}
        mode={accessModal.mode}
        user={accessModal.user}
        accountOptions={accountOptions}
        onClose={closeAccessModal}
        onSaved={handleMutationCompleted}
        openStatus={openStatus}
      />

      <DeleteAccessModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={handleMutationCompleted}
        openStatus={openStatus}
      />

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        variant="center"
        onClose={closeStatus}
        lockScroll
      />
    </div>
  );
}
