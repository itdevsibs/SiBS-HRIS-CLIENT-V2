import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
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
  createAccountSettingsUser,
  deleteAccountSettingsUser,
  getAccountSettingsAccounts,
  getAccountSettingsDepartments,
  getAccountSettingsSummary,
  getAccountSettingsUsers,
  searchAccountSettingsEmployees,
  updateAccountSettingsUser,
} from "../../lib/axios/accountSettings";

const PAGE_LIMIT = 15;
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5001"
).replace(/\/+$/, "");

const ROLE_OPTIONS = [
  { value: "All", label: "All Access Levels" },
  { value: "employee", label: "Employee", access: 0 },
  { value: "ta", label: "Talent Acquisition", access: 1 },
  { value: "hr", label: "HR", access: 2 },
  { value: "hr_admin", label: "HR Admin", access: 3 },
  { value: "finance", label: "Finance", access: 4 },
  { value: "manager", label: "Manager", access: 5 },
  { value: "executive", label: "Executive", access: 6 },
  { value: "super_admin", label: "Super Admin", access: 7 },
  { value: "team_leaders", label: "Team Leaders", access: 8 },
  { value: "wfm", label: "WFM", access: 9 },
  { value: "som", label: "SOM", access: 10 },
];

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

function normalizeRole(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getAdminAccess(user) {
  const value =
    user?.adminAccess ??
    user?.admin_access ??
    user?.gy_user_access ??
    user?.access ??
    user?.adminLevel ??
    user?.admin_level ??
    0;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isSuperAdmin(user) {
  const role = normalizeRole(
    user?.role ||
      user?.userRole ||
      user?.user_role ||
      user?.adminRole ||
      user?.admin_role,
  );

  return (
    getAdminAccess(user) === 7 ||
    role === "super_admin" ||
    role === "superadmin"
  );
}

function safeText(value) {
  return String(value ?? "").trim();
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatEmployeeName(employee = {}) {
  const fullName = safeText(employee.fullName || employee.full_name);
  if (fullName) return fullName;

  const name = [employee.firstName, employee.middleName, employee.lastName]
    .map(safeText)
    .filter(Boolean)
    .join(" ");

  return name || "Unknown Employee";
}

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
      className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#D9E2EC] bg-[#F2F6FA] shadow-sm`}
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
              className="pointer-events-none fixed z-[999999] overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white p-2 shadow-2xl"
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

function getRoleOptionByAccess(adminAccess) {
  return (
    ROLE_OPTIONS.find(
      (option) => option.access === Number(adminAccess),
    ) || ROLE_OPTIONS[1]
  );
}

function getRoleLabel(role, adminAccess) {
  const byAccess = getRoleOptionByAccess(adminAccess);
  if (byAccess) return byAccess.label;

  return (
    ROLE_OPTIONS.find((option) => option.value === normalizeRole(role))
      ?.label || "Employee"
  );
}

function getRolePillClass(adminAccess) {
  const access = Number(adminAccess || 0);

  if (access === 7) {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  if (access >= 4) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (access >= 1) {
    return "border-cyan-200 bg-cyan-50 text-cyan-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function isActiveAssignedUser(user = {}) {
  return safeText(user.status).toLowerCase() === "active";
}

function getStatusPillClass(status) {
  const normalized = safeText(status).toLowerCase();

  if (normalized === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getAccountName(account = {}) {
  return safeText(
    account.accountName ||
      account.account_name ||
      account.gy_acc_name ||
      account.account,
  );
}

function getAccountId(account = {}) {
  return safeText(
    account.accountId ||
      account.account_id ||
      account.gy_acc_id ||
      account.id,
  );
}

function getDepartmentName(account = {}) {
  return safeText(
    account.departmentName ||
      account.department ||
      account.name_department,
  );
}

function getAuditDisplayValue(user = {}, type = "creator") {
  const directDisplay =
    type === "creator"
      ? safeText(
          user.creatorDisplay ||
            user.creator_display ||
            user.sibsIdCreatorDisplay ||
            user.sibs_id_creator_display,
        )
      : safeText(
          user.updaterDisplay ||
            user.updater_display ||
            user.sibsIdUpdaterDisplay ||
            user.sibs_id_updater_display,
        );

  const assignedDisplayValues = [
    ...new Set(
      (user.assignedAccounts || [])
        .map((account) =>
          type === "creator"
            ? safeText(
                account.creatorDisplay ||
                  account.creator_display ||
                  account.sibsIdCreatorDisplay ||
                  account.sibs_id_creator_display,
              )
            : safeText(
                account.updaterDisplay ||
                  account.updater_display ||
                  account.sibsIdUpdaterDisplay ||
                  account.sibs_id_updater_display,
              ),
        )
        .filter(Boolean),
    ),
  ];

  if (directDisplay) return directDisplay;

  if (assignedDisplayValues.length) {
    return assignedDisplayValues.join(", ");
  }

  const directSibsId =
    type === "creator"
      ? safeText(user.sibsIdCreator || user.sibs_id_creator)
      : safeText(user.sibsIdUpdater || user.sibs_id_updater);

  const assignedSibsIds = [
    ...new Set(
      (user.assignedAccounts || [])
        .map((account) =>
          type === "creator"
            ? safeText(
                account.sibsIdCreator ||
                  account.sibs_id_creator,
              )
            : safeText(
                account.sibsIdUpdater ||
                  account.sibs_id_updater,
              ),
        )
        .filter(Boolean),
    ),
  ];

  if (directSibsId) return directSibsId;
  if (assignedSibsIds.length) return assignedSibsIds.join(", ");

  return "—";
}

function getAuditDateValue(user = {}, type = "created") {
  const directValue =
    type === "created"
      ? user.createdAt || user.created_at
      : user.updatedAt || user.updated_at;

  if (directValue) return directValue;

  const values = (user.assignedAccounts || [])
    .map((account) =>
      type === "created"
        ? account.createdAt || account.created_at
        : account.updatedAt || account.updated_at,
    )
    .filter(Boolean);

  if (!values.length) return null;

  return values.reduce((selected, current) => {
    if (!selected) return current;

    const selectedTime = new Date(selected).getTime();
    const currentTime = new Date(current).getTime();

    if (!Number.isFinite(selectedTime)) return current;
    if (!Number.isFinite(currentTime)) return selected;

    if (type === "created") {
      return currentTime < selectedTime ? current : selected;
    }

    return currentTime > selectedTime ? current : selected;
  }, null);
}

function SummaryCard({ icon: Icon, label, value, description, tone = "blue" }) {
  const tones = {
    blue: {
      label: "text-[#042C51]",
      value: "text-[#042C51]",
      icon: "bg-[#EAF2FB] text-[#042C51]",
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
    <article className="sibs-metric-card sibs-card p-4">
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

          <p className="mt-1 line-clamp-2 sibs-text-micro font-semibold leading-tight text-[#667085]">
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
      className="fixed z-[999999] overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl"
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

function CustomSelect({
  value,
  options = [],
  onChange,
  placeholder = "Select",
  disabled = false,
  searchable = false,
  searchPlaceholder = "Search...",
  noResultsMessage = "No matching option found.",
  compact = false,
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const anchorRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = useMemo(
    () =>
      options.find(
        (option) => String(option.value) === String(value),
      ) || null,
    [options, value],
  );

  const selectedLabel = selectedOption?.label || "";

  const filteredOptions = useMemo(() => {
    const keyword = safeText(searchQuery).toLowerCase();

    if (!searchable || !keyword) {
      return options;
    }

    return options.filter((option) =>
      [
        option.label,
        option.value,
        option.description,
        option.searchText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [options, searchQuery, searchable]);

  function openDropdown() {
    if (disabled) return;

    if (!open) {
      setSearchQuery("");
    }

    setOpen(true);

    if (searchable) {
      window.requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }

  function closeDropdown() {
    setOpen(false);
    setSearchQuery("");
  }

  function selectOption(option) {
    if (option.disabled) return;

    onChange(option.value, option);
    closeDropdown();
  }

  if (searchable) {
    return (
      <div ref={anchorRef} className="relative">
        <div
          onClick={openDropdown}
          className={`flex ${compact ? "h-10 rounded-lg px-3" : "h-12 rounded-xl px-4"} w-full items-center gap-2 border transition-all duration-200 ${
            disabled
              ? "cursor-not-allowed border-[#D0D5DD] bg-[#F2F4F7] text-[#667085]"
              : open
                ? "border-sibs-primary-1 bg-white text-[#344054] ring-4 ring-sibs-primary-1/10"
                : "border-[#D0D5DD] bg-white text-[#344054] hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC]"
          }`}
        >
          <Search
            size={17}
            className="shrink-0 text-sibs-tertiary-5"
          />

          <input
            ref={inputRef}
            type="text"
            disabled={disabled}
            value={open ? searchQuery : selectedLabel}
            onFocus={openDropdown}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                closeDropdown();
              }

              if (event.key === "Enter") {
                event.preventDefault();

                const firstOption = filteredOptions.find(
                  (option) => !option.disabled,
                );

                if (firstOption) {
                  selectOption(firstOption);
                }
              }
            }}
            placeholder={searchPlaceholder || placeholder}
            className={`min-w-0 flex-1 bg-transparent font-bold text-[#344054] outline-none placeholder:text-sibs-tertiary-5 ${compact ? "text-xs" : "text-sm"}`}
          />

          <ChevronDown
            size={18}
            className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>

        <DropdownPortal
          open={open && !disabled}
          anchorRef={anchorRef}
          onClose={closeDropdown}
          maxHeight={280}
        >
          {filteredOptions.length ? (
            filteredOptions.map((option) => {
              const selected =
                String(option.value) === String(value);

              return (
                <button
                  key={`${option.value}-${option.label}`}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => selectOption(option)}
                  className={`block w-full px-4 py-3 text-left text-sm transition ${
                    option.disabled
                      ? "cursor-not-allowed text-sibs-tertiary-5"
                      : selected
                        ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                        : "text-[#344054] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span className="block truncate">
                    {option.label}
                  </span>

                  {option.description && (
                    <span className="mt-1 block truncate text-xs font-semibold text-sibs-tertiary-5">
                      {option.description}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="px-4 py-4 text-sm font-semibold text-sibs-tertiary-5">
              {noResultsMessage}
            </div>
          )}
        </DropdownPortal>
      </div>
    );
  }

  return (
    <div ref={anchorRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (open) {
            closeDropdown();
          } else {
            openDropdown();
          }
        }}
        className={`flex ${compact ? "h-10 rounded-lg px-3 text-xs" : "h-12 rounded-xl px-4 text-sm"} w-full items-center justify-between border text-left font-bold outline-none transition-all duration-200 ${
          disabled
            ? "cursor-not-allowed border-[#D0D5DD] bg-[#F2F4F7] text-[#667085]"
            : open
              ? "border-sibs-primary-1 bg-white text-[#344054] ring-4 ring-sibs-primary-1/10"
              : "border-[#D0D5DD] bg-white text-[#344054] hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
        }`}
      >
        <span
          className={`truncate ${
            selectedOption
              ? "text-[#344054]"
              : "text-sibs-tertiary-5"
          }`}
        >
          {selectedLabel || placeholder}
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <DropdownPortal
        open={open && !disabled}
        anchorRef={anchorRef}
        onClose={closeDropdown}
        maxHeight={280}
      >
        {options.length ? (
          options.map((option) => {
            const selected =
              String(option.value) === String(value);

            return (
              <button
                key={`${option.value}-${option.label}`}
                type="button"
                disabled={option.disabled}
                onClick={() => selectOption(option)}
                className={`block w-full px-4 py-3 text-left text-sm transition ${
                  option.disabled
                    ? "cursor-not-allowed text-sibs-tertiary-5"
                    : selected
                      ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                      : "text-[#344054] hover:bg-[#F8FAFC]"
                }`}
              >
                <span className="block truncate">
                  {option.label}
                </span>

                {option.description && (
                  <span className="mt-1 block truncate text-xs font-semibold text-sibs-tertiary-5">
                    {option.description}
                  </span>
                )}
              </button>
            );
          })
        ) : (
          <div className="px-4 py-4 text-sm font-semibold text-sibs-tertiary-5">
            No options available.
          </div>
        )}
      </DropdownPortal>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled = false,
  searchable = false,
  searchPlaceholder = "Search...",
  placeholder = "Select",
  compact = false,
}) {
  return (
    <div>
      {label && (
        <label className={`${compact ? "text-[10px]" : "text-sm"} mb-1 block font-bold text-[#101828]`}>
          {label}
        </label>
      )}

      <CustomSelect
        value={value}
        options={options}
        onChange={onChange}
        disabled={disabled}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        placeholder={placeholder}
        compact={compact}
      />
    </div>
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

function AccountChips({ accounts = [] }) {
  if (!accounts.length) {
    return (
      <span className="text-xs font-semibold text-sibs-tertiary-5">
        —
      </span>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-wrap gap-1 overflow-hidden">
      {accounts.map((account, index) => {
        const accountId = getAccountId(account);
        const accountName =
          getAccountName(account) || `Account ${accountId}`;

        return (
          <span
            key={`${account.id || accountId}-${accountName}-${index}`}
            title={`${accountName}${accountId ? ` (${accountId})` : ""}`}
            className="inline-flex min-w-0 max-w-full items-center rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-sibs-primary-1"
          >
            <span className="truncate">{accountName}</span>
          </span>
        );
      })}
    </div>
  );
}

function DepartmentChips({ accounts = [], limit = 2 }) {
  const departments = [
    ...new Set(accounts.map(getDepartmentName).filter(Boolean)),
  ];
  const visible = departments.slice(0, limit);
  const hiddenCount = Math.max(departments.length - visible.length, 0);

  if (!departments.length) {
    return <span className="text-xs font-semibold text-sibs-tertiary-5">—</span>;
  }

  return (
    <div className="flex w-full min-w-0 flex-wrap gap-1 overflow-hidden">
      {visible.map((department) => (
        <span
          key={department}
          className="inline-flex min-w-0 max-w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700"
        >
          <span className="truncate">{department}</span>
        </span>
      ))}

      {hiddenCount > 0 && (
        <span className="inline-flex rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600">
          +{hiddenCount}
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
    return Boolean(
      target?.closest?.(
        "button, a, input, select, textarea, [role='button'], [data-no-table-drag='true']",
      ),
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

  return (
    <div className="mt-5 sibs-data-table-shell">
      <div
        ref={scrollRef}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
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

function LoadingRows() {
  return Array.from({ length: PAGE_LIMIT }).map((_, index) => (
    <tr key={index}>
      <td colSpan={11} className="border-b border-[#E6ECF2] px-3 py-3">
        <div className="h-5 w-full animate-sibs-pulse rounded bg-gray-200" />
      </td>
    </tr>
  ));
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
        <UsersRound size={26} />
      </div>

      <h3 className="mt-4 text-base font-extrabold text-sibs-primary-1">
        No assigned users found
      </h3>

      <p className="mt-1 max-w-md text-sm font-medium leading-6 text-sibs-tertiary-5">
        Add an employee or adjust the search and filters to display account-access records.
      </p>
    </div>
  );
}

function ModalShell({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  variant = "default",
}) {
  useEffect(() => {
    if (!open) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  if (variant === "talentPool") {
    return createPortal(
      <div
        className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[99999] flex h-dvh items-center justify-center p-2 font-jakarta sm:p-4"
        role="presentation"
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-settings-modal-title"
          className="sibs-modal-pop-in flex max-h-[90dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#F8FAFC] shadow-2xl font-jakarta"
        >
          <header className="flex shrink-0 items-center justify-between gap-4 bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5 font-jakarta">
            <div className="flex min-w-0 items-center gap-2.5 2xl:gap-3">
              <span className="flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
                <UserCog size={16} />
              </span>

              <div className="min-w-0">
                <h2
                  id="account-settings-modal-title"
                  className="truncate text-base sm:text-lg 2xl:text-xl font-extrabold text-white"
                >
                  {title}
                </h2>
                {description ? (
                  <p className="mt-0.5 truncate sibs-text-xs font-semibold text-white/75">
                    {description}
                  </p>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close account access modal"
              className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-5 2xl:p-6 sibs-scrollbar">
            {children}
          </div>

          {footer ? (
            <footer className="shrink-0 border-t border-[#DDE5EE] bg-[#F1F5F9] px-5 py-3 2xl:py-3.5 sm:px-6 font-jakarta">
              {footer}
            </footer>
          ) : null}
        </section>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div
      className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[99999] flex items-center justify-center p-2 font-jakarta sm:p-4"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-settings-modal-title"
        className="sibs-modal-pop-in flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-[#F8FAFC] shadow-2xl font-jakarta"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5 font-jakarta">
          <div className="min-w-0">
            <h2
              id="account-settings-modal-title"
              className="truncate text-base sm:text-lg 2xl:text-xl font-extrabold text-white"
            >
              {title}
            </h2>

            {description && (
              <p className="mt-0.5 truncate sibs-text-xs font-semibold text-white/75">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-5 2xl:p-6 sibs-scrollbar">
          {children}
        </div>

        {footer && (
          <footer className="shrink-0 border-t border-[#DDE5EE] bg-[#F1F5F9] px-5 py-3 2xl:py-3.5 sm:px-6 font-jakarta">
            {footer}
          </footer>
        )}
      </section>
    </div>,
    document.body,
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
      <label className="mb-1 block text-sm font-bold text-[#101828]">
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
              className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white pl-11 pr-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 hover:border-sibs-primary-1/30 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />

            {loading && (
              <Loader2
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-sibs-primary-1"
              />
            )}
          </div>

          {search.trim().length >= 2 && (
            <div className="mt-2 overflow-hidden rounded-xl border border-[#E6ECF2] bg-white">
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
                      className="flex w-full items-start gap-3 border-b border-[#EEF2F6] px-4 py-3 text-left transition last:border-b-0 hover:bg-[#F8FAFC]"
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
          <label className="block text-sm font-bold text-[#101828]">
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
              ? "cursor-not-allowed border-[#D0D5DD] bg-[#F2F4F7] text-[#667085]"
              : open
                ? "border-sibs-primary-1 bg-white ring-4 ring-sibs-primary-1/10"
                : "cursor-text border-[#D0D5DD] bg-white hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC]"
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
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sibs-tertiary-5 transition hover:bg-[#EEF3F8] hover:text-sibs-primary-1 disabled:cursor-not-allowed"
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
          <div className="border-b border-[#E6ECF2] px-4 py-2.5">
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
                  className={`flex w-full items-start gap-3 border-b border-[#EEF2F6] px-4 py-3 text-left transition last:border-b-0 ${
                    selected
                      ? "bg-[#EAF2FB]"
                      : "bg-white hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      selected
                        ? "border-sibs-primary-1 bg-sibs-primary-1 text-white"
                        : "border-[#CBD5E1] bg-white text-transparent"
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

function AccessModal({
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
  const [adminAccess, setAdminAccess] = useState("0");
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
      setAdminAccess(String(user.adminAccess ?? 0));
      setSelectedAccountIds(
        (user.assignedAccounts || []).map(getAccountId).filter(Boolean),
      );
    } else {
      setSelectedEmployee(null);
      setAdminAccess("0");
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
        const results = await searchAccountSettingsEmployees(keyword);
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
      setAdminAccess("0");
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

  async function handleSave() {
    if (!selectedEmployee?.gyEmpId || !selectedEmployee?.sibsId) {
      openStatus("error", "Employee Required", "Select an employee.");
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

      const payload = {
        gyEmpId: selectedEmployee.gyEmpId,
        sibsId: selectedEmployee.sibsId,
        adminAccess: Number(adminAccess),
        accountIds: selectedAccountIds,
      };

      const result = isEdit
        ? await updateAccountSettingsUser(user.id, payload)
        : await createAccountSettingsUser(payload);

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
      variant="talentPool"
      title={isEdit ? "Edit User Account Access" : "Add User Access"}
      description={
        isEdit
          ? "Update the employee's admin access and assigned accounts."
          : "Employee information is read-only. Only the selected access settings are saved."
      }
      onClose={() => {
        if (!saving) onClose();
      }}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF9F6] hover:text-[#FF5C28] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#042C51] px-5 text-sm font-extrabold text-white shadow-sm shadow-[#042C51]/15 transition hover:bg-[#063D6F] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#042C51]/20 disabled:cursor-not-allowed disabled:opacity-60"
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
        </div>
      }
    >
      <div className="space-y-4">
        <section className="relative overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#E6ECF2] pb-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-normal text-[#174A7C]">
                Employee Record
              </p>
              <p className="mt-1 text-xs font-semibold text-[#667085]">
                Employee information is read-only on this form.
              </p>
            </div>

            <span className="inline-flex shrink-0 items-center rounded-full border border-blue-100 bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold uppercase text-[#042C51]">
              Read Only
            </span>
          </div>

          {isEdit ? (
            <div className="flex items-start gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
              <ProfileAvatar
                employee={selectedEmployee || {}}
                size="lg"
              />

              <div className="min-w-0">
                <p className="truncate text-base font-extrabold text-[#042C51]">
                  {formatEmployeeName(selectedEmployee || {})}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#667085]">
                  SIBS ID: {selectedEmployee?.sibsId || "—"}
                </p>
                <p className="mt-1 truncate text-xs font-semibold text-[#667085]">
                  {selectedEmployee?.email || "No email available"}
                </p>
                <p className="mt-1 text-xs font-semibold text-[#8A98B8]">
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

        <section className="relative overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 border-b border-[#E6ECF2] pb-3">
            <p className="text-[10px] font-extrabold uppercase tracking-normal text-[#174A7C]">
              Access Configuration
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-[#667085]">
              Set the employee's access level and choose the accounts available to this user.
            </p>
          </div>

          <div className="space-y-5">
            <SelectField
              label="Access"
              value={adminAccess}
              onChange={setAdminAccess}
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
      const result = await deleteAccountSettingsUser(target.id);

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
      title="Remove User Account Access"
      description="This removes all account access assigned to the selected employee. Employee information will not be changed."
      onClose={() => {
        if (!deleting) onClose();
      }}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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

function MobileUserCard({ user, onEdit, onDelete }) {
  return (
    <article className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <ProfileAvatar employee={user} size="lg" />

          <div className="min-w-0">
            <h3 className="truncate text-sm font-extrabold text-sibs-primary-1">
              {formatEmployeeName(user)}
            </h3>
            <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
              {user.email || "No email"}
            </p>
          </div>
        </div>

        <StatusPill status={user.status} />
      </div>

      <div className="mt-4 rounded-xl bg-[#F8FAFC] p-3">
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
          SIBS ID
        </p>
        <p className="mt-1 text-sm font-extrabold text-sibs-primary-1">
          {user.sibsId || "—"}
        </p>
      </div>

      <div className="mt-3">
        <RolePill role={user.role} adminAccess={user.adminAccess} />
      </div>

      <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3">
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
          Assigned Accounts
        </p>
        <div className="mt-2">
          <AccountChips accounts={user.assignedAccounts} />
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-[#E6ECF2] bg-white p-3">
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
          Audit
        </p>
        <p className="mt-2 text-xs font-semibold leading-5 text-[#344054]">
          Creator: {getAuditDisplayValue(user, "creator")}
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-[#344054]">
          Updater: {getAuditDisplayValue(user, "updater")}
        </p>
        <p className="mt-1 text-xs font-medium text-sibs-tertiary-5">
          {formatDateTime(getAuditDateValue(user, "updated"))}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onEdit(user)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-sibs-primary-1 transition hover:bg-blue-100"
        >
          <Edit3 size={15} />
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete(user)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 text-sm font-bold text-red-700 transition hover:bg-red-100"
        >
          <Trash2 size={15} />
          Delete
        </button>
      </div>
    </article>
  );
}

function AccountSettingsLoading() {
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

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const searchInputRef = useRef(null);
  const skipInitialUsersReloadRef = useRef(true);

  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [accountOptions, setAccountOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const showingFrom = pagination.total
    ? (currentPage - 1) * PAGE_LIMIT + 1
    : 0;
  const showingTo = Math.min(currentPage * PAGE_LIMIT, pagination.total);
  const isDataLoading = pageLoading || tableLoading;

  const openStatus = useCallback((type, title, message) => {
    setStatusModal({ open: true, type, title, message });
  }, []);

  const closeStatus = useCallback(() => {
    setStatusModal((previous) => ({ ...previous, open: false }));
  }, []);

  const loadReferenceData = useCallback(async () => {
    const [summaryData, accounts, departments] = await Promise.all([
      getAccountSettingsSummary(),
      getAccountSettingsAccounts(),
      getAccountSettingsDepartments(),
    ]);

    setSummary({ ...EMPTY_SUMMARY, ...summaryData });
    setAccountOptions(accounts);
    setDepartmentOptions(departments);
  }, []);

  const loadUsers = useCallback(
    async ({ quiet = false } = {}) => {
      try {
        if (!quiet) setTableLoading(true);

        const result = await getAccountSettingsUsers({
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
            getAccountSettingsSummary(),
            getAccountSettingsAccounts(),
            getAccountSettingsDepartments(),
            getAccountSettingsUsers({ page: 1, limit: PAGE_LIMIT }),
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

  function openEditModal(selectedUser) {
    setAccessModal({ open: true, mode: "edit", user: selectedUser });
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
    return <AccountSettingsLoading />;
  }

  return (
    <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <style>{`
        @keyframes sibsAccountSettingsRowReveal {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .sibs-account-settings-row-reveal {
          animation: sibsAccountSettingsRowReveal 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
          will-change: opacity, transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .sibs-account-settings-row-reveal {
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
          <section className="sibs-page-header-in sibs-card relative overflow-hidden p-5 sm:p-6">
            <span className="sibs-top-accent" aria-hidden="true" />

            <div className="mt-1 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-normal text-[#042C51]">
                    <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-[#FF5C28]" />
                    Account Settings View
                  </span>

                  <span className="inline-flex max-w-full rounded border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-normal text-[#FF5C28]">
                    Module: Settings
                  </span>
                </div>

                <h1 className="font-heading break-words text-xl 2xl:text-3xl font-bold tracking-tight text-sibs-navy">
                  Account Settings
                </h1>

                <p className="text-xs font-semibold leading-relaxed text-[#667085] sm:text-sm">
                  Manage employee access levels, assigned accounts, and department access.
                </p>
              </div>

              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] sm:w-auto sm:text-sm"
              >
                <Plus size={17} />
                Add User Access
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {pageLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={`summary-loading-${index}`}
                  className="sibs-card h-28 animate-sibs-pulse rounded-2xl bg-gray-100"
                />
              ))
            ) : (
              <>
                <SummaryCard
                  icon={UsersRound}
                  label="Assigned Users"
                  value={summary.totalUsers}
                  description="Distinct HRIS users"
                />
                <SummaryCard
                  icon={KeyRound}
                  label="Assignments"
                  value={summary.totalAssignments}
                  description="Total access records"
                  tone="violet"
                />
                <SummaryCard
                  icon={Building2}
                  label="Assigned Accounts"
                  value={summary.assignedAccounts}
                  description={`${summary.activeKronosAccounts} available accounts`}
                  tone="cyan"
                />
                <SummaryCard
                  icon={UserCog}
                  label="Departments"
                  value={summary.assignedDepartments}
                  description={`${summary.kronosDepartments} available departments`}
                  tone="amber"
                />
                <SummaryCard
                  icon={ShieldCheck}
                  label="Super Admins"
                  value={summary.superAdmins}
                  description="Access level 7"
                  tone="emerald"
                />
              </>
            )}
          </section>

          <section className="sibs-card overflow-hidden rounded-2xl">
            <div className="border-b border-[#E6ECF2] bg-white px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <h2 className="sibs-section-title">Assigned Users</h2>
                  <p className="sibs-section-subtitle">
                    Employee information is read-only. Access settings are managed on this page.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex w-max items-center rounded-full border border-orange-100 bg-[#FFF3ED] px-2.5 py-1 text-[10px] font-extrabold uppercase text-[#FF5C28]">
                    {pageLoading ? "Loading..." : `${pagination.total} Users`}
                  </span>

                  <button
                    type="button"
                    onClick={() => reloadAll({ showRefresh: true })}
                    disabled={refreshing}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white text-[#042C51] transition hover:bg-[#F8FAFC] disabled:opacity-50"
                    aria-label="Refresh account settings"
                  >
                    <RefreshCw
                      size={15}
                      className={refreshing ? "animate-spin" : ""}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative overflow-visible p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_210px_260px_auto] xl:items-end">
                <div>
                  <label className="mb-1 block text-[10px] font-bold text-[#101828]">
                    Search
                  </label>

                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                    />

                    <input
                      ref={searchInputRef}
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search employee, SIBS ID, account, department..."
                      className="h-10 w-full rounded-lg border border-[#D9E2EC] bg-[#F8FAFC] pl-10 pr-4 text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#8A98B8] hover:border-[#042C51]/30 focus:border-[#042C51] focus:bg-white focus:ring-4 focus:ring-[#042C51]/10"
                    />
                  </div>
                </div>

                <SelectField
                  label="Access"
                  compact
                  value={roleFilter}
                  onChange={(value) => {
                    setRoleFilter(value);
                    setCurrentPage(1);
                  }}
                  options={roleFilterOptions}
                  placeholder="All Access Levels"
                />

                <SelectField
                  label="Assigned Account"
                  compact
                  value={accountFilter}
                  onChange={(value) => {
                    setAccountFilter(value);
                    setCurrentPage(1);
                  }}
                  options={accountFilterOptions}
                  searchable
                  searchPlaceholder="Search account..."
                  placeholder="All Accounts"
                />

                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-[#042C51] transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
                >
                  <Filter size={16} />
                  Clear
                </button>
              </div>

              <div className="mt-5 space-y-3 lg:hidden">
                {isDataLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-72 animate-sibs-pulse rounded-2xl border border-[#E6ECF2] bg-white"
                    />
                  ))
                ) : users.length ? (
                  users.map((assignedUser) => (
                    <MobileUserCard
                      key={assignedUser.id}
                      user={assignedUser}
                      onEdit={openEditModal}
                      onDelete={setDeleteTarget}
                    />
                  ))
                ) : (
                  <div className="rounded-2xl border border-[#E6ECF2] bg-white">
                    <EmptyState />
                  </div>
                )}
              </div>

              <DraggableTableScroll>
                <table className="w-full table-fixed border-collapse bg-white text-left">
                  <colgroup>
                    <col className="w-[5%]" />
                    <col className="w-[4%]" />
                    <col className="w-[15%]" />
                    <col className="w-[6%]" />
                    <col className="w-[7%]" />
                    <col className="w-[13%]" />
                    <col className="w-[13%]" />
                    <col className="w-[9%]" />
                    <col className="w-[8%]" />
                    <col className="w-[9%]" />
                    <col className="w-[11%]" />
                  </colgroup>
                  <thead className="sibs-data-table-head">
                    <tr className="sibs-data-table-head-row">
                      <th className="sibs-data-table-th">SIBS ID</th>
                      <th className="sibs-data-table-th text-center">Profile</th>
                      <th className="sibs-data-table-th">Employee</th>
                      <th className="sibs-data-table-th">Status</th>
                      <th className="sibs-data-table-th">Access</th>
                      <th className="sibs-data-table-th">Assigned Accounts</th>
                      <th className="sibs-data-table-th">Departments</th>
                      <th className="sibs-data-table-th">Creator</th>
                      <th className="sibs-data-table-th">Updater</th>
                      <th className="sibs-data-table-th">Created / Updated</th>
                      <th className="sibs-data-table-th text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {isDataLoading ? (
                      <LoadingRows />
                    ) : users.length ? (
                      users.map((assignedUser, index) => (
                        <tr
                          key={assignedUser.id}
                          className="sibs-data-table-row sibs-account-settings-row-reveal border-b border-[#E6ECF2]"
                          style={{
                            animationDelay: `${Math.min(index, 10) * 36}ms`,
                          }}
                        >
                          <td className="sibs-data-table-td whitespace-nowrap">
                            <p className="text-xs font-extrabold text-[#FF5C28]">
                              {assignedUser.sibsId || "—"}
                            </p>
                          </td>

                          <td className="sibs-data-table-td">
                            <div className="flex justify-center">
                              <HoverProfileAvatar employee={assignedUser} size="sm" />
                            </div>
                          </td>

                          <td className="sibs-data-table-td">
                            <div className="min-w-0">
                              <p className="max-w-[220px] truncate text-xs font-extrabold text-[#101828]">
                                {formatEmployeeName(assignedUser)}
                              </p>
                              <p className="mt-0.5 max-w-[220px] truncate text-[10px] font-semibold text-sibs-tertiary-5">
                                {assignedUser.email || "No email available"}
                              </p>
                            </div>
                          </td>

                          <td className="sibs-data-table-td">
                            <StatusPill status={assignedUser.status} />
                          </td>

                          <td className="sibs-data-table-td">
                            <RolePill
                              role={assignedUser.role}
                              adminAccess={assignedUser.adminAccess}
                            />
                          </td>

                          <td className="sibs-data-table-td min-w-0 overflow-hidden align-top">
                            <AccountChips
                              accounts={assignedUser.assignedAccounts}
                            />
                          </td>

                          <td className="sibs-data-table-td min-w-0 overflow-hidden align-top">
                            <DepartmentChips
                              accounts={assignedUser.assignedAccounts}
                            />
                          </td>

                          <td className="sibs-data-table-td min-w-0 overflow-hidden align-top">
                            <p className="block w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-bold leading-4 text-[#344054]">
                              {getAuditDisplayValue(
                                assignedUser,
                                "creator",
                              )}
                            </p>
                          </td>

                          <td className="sibs-data-table-td min-w-0 overflow-hidden align-top">
                            <p className="block w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-bold leading-4 text-[#344054]">
                              {getAuditDisplayValue(
                                assignedUser,
                                "updater",
                              )}
                            </p>
                          </td>

                          <td className="sibs-data-table-td">
                            <p className="text-[10px] font-semibold leading-4 text-[#344054]">
                              {formatDateTime(
                                getAuditDateValue(
                                  assignedUser,
                                  "created",
                                ),
                              )}
                            </p>
                            <p className="mt-0.5 text-[10px] font-semibold leading-4 text-sibs-tertiary-5">
                              {formatDateTime(
                                getAuditDateValue(
                                  assignedUser,
                                  "updated",
                                ),
                              )}
                            </p>
                          </td>

                          <td className="sibs-data-table-td text-right">
                            <div className="inline-flex flex-nowrap items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(assignedUser)}
                                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-2 text-[10px] font-bold text-sibs-primary-1 transition hover:bg-blue-100"
                              >
                                <Edit3 size={13} />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteTarget(assignedUser)}
                                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-2 text-[10px] font-bold text-red-700 transition hover:bg-red-100"
                              >
                                <Trash2 size={13} />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={11}>
                          <EmptyState />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </DraggableTableScroll>

              <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <p className="text-sm font-semibold text-sibs-tertiary-5">
                  Showing {showingFrom} to {showingTo} of {pagination.total} assigned users
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || isDataLoading}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#E6ECF2] bg-white px-3 text-xs font-bold text-[#667085] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft size={15} />
                    Previous
                  </button>

                  <span
                    aria-current="page"
                    className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-[#FF5C28] px-3 text-sm font-bold text-white shadow-sm"
                  >
                    {currentPage}
                  </span>

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={
                      currentPage >= pagination.totalPages || isDataLoading
                    }
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#E6ECF2] bg-white px-3 text-xs font-bold text-[#667085] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

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
