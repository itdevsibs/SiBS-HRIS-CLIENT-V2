import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Header from "../../components/layout/Header";
import { useUser } from "../../services/context/UserContext";
import StatusModal from "../../components/modals/StatusModal";
import {
  Plus,
  Search,
  Filter,
  Pencil,
  X,
  Save,
  RotateCcw,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
} from "lucide-react";
import {
  createAvailablePosition,
  getAvailablePositionMeta,
  getAvailablePositions,
  updateAvailablePosition,
  updateAvailablePositionStatus,
} from "../../lib/axios/getAvailablePosition";

const POSITIONS_PER_PAGE = 8;

const LOCATION_SITE_OPTIONS = ["Davao", "Tagum", "Both Davao and Tagum"];

const STATUS_FILTER_OPTIONS = ["All", "Active", "Inactive"];

const emptyForm = {
  positionTitle: "",
  departmentId: "",
  department: "",
  accountId: "",
  accountName: "",
  accountGhlName: "",
  description: "",
  preferredSkills: "",
  locationSite: "",
  status: "",
  remarks: "",
};

function cleanText(value) {
  return String(value ?? "").trim();
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatPersonName(value) {
  const raw = String(value || "").trim();

  if (!raw) return "—";

  if (raw.includes("@")) {
    return raw
      .split("@")[0]
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }

  return raw;
}

function getUserDisplayName(user) {
  return formatPersonName(
    user?.fullName ||
      user?.fullname ||
      user?.name ||
      user?.employeeName ||
      user?.gy_emp_fullname ||
      user?.displayName ||
      user?.username ||
      user?.email ||
      "Current User",
  );
}

function getStatusOption(meta, keyword) {
  const options = Array.isArray(meta?.statusOptions) ? meta.statusOptions : [];
  const lowerKeyword = String(keyword || "").toLowerCase();

  return (
    options.find(
      (item) => String(item || "").trim().toLowerCase() === lowerKeyword,
    ) ||
    options.find((item) =>
      String(item || "").trim().toLowerCase().includes(lowerKeyword),
    ) ||
    ""
  );
}

function getInitialStatus(meta) {
  return getStatusOption(meta, "active") || meta?.statusOptions?.[0] || "";
}

function inputClass(extra = "") {
  return `h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function textareaClass(extra = "") {
  return `w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function getStatusTone(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus.includes("active") && !normalizedStatus.includes("in")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalizedStatus.includes("inactive")) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (normalizedStatus.includes("draft")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalizedStatus.includes("archive")) {
    return "border-gray-200 bg-gray-50 text-gray-600";
  }

  return "border-blue-200 bg-blue-50 text-sibs-primary-1";
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusTone(
        status,
      )}`}
    >
      {status || "—"}
    </span>
  );
}

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

function normalizeDropdownOptions(options = []) {
  return options
    .map((option) => {
      if (typeof option === "string" || typeof option === "number") {
        return {
          id: option,
          value: option,
          label: String(option),
        };
      }

      const value = option?.value ?? option?.id ?? "";
      const label = option?.label ?? option?.name ?? option?.value ?? "";

      if (!cleanText(value) && !cleanText(label)) return null;

      return {
        id: option?.id ?? value ?? label,
        value: value || label,
        label: label || String(value),
      };
    })
    .filter(Boolean);
}

function DropdownField({
  label,
  value,
  options = [],
  onChange,
  placeholder = "Select",
  disabled = false,
  required = false,
  zIndex = "z-[100]",
  menuClassName = "",
}) {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);

  const normalizedOptions = normalizeDropdownOptions(options);

  const selectedOption = normalizedOptions.find(
    (option) => String(option.value) === String(value ?? ""),
  );

  const displayLabel = selectedOption?.label || placeholder;

  useEffect(() => {
    function handleClickOutside(event) {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSelect(nextValue) {
    onChange?.(nextValue);
    setOpen(false);
  }

  return (
    <div
      ref={dropdownRef}
      className={`relative min-w-0 ${open ? zIndex : "z-[1]"}`}
    >
      {label && <FieldLabel required={required}>{label}</FieldLabel>}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-bold shadow-sm outline-none transition ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : "border-[#D0D5DD] hover:border-sibs-primary-1"
        } ${
          disabled
            ? "cursor-not-allowed bg-gray-50 text-gray-400 opacity-70"
            : "text-[#344054]"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selectedOption ? "text-[#344054]" : "text-sibs-tertiary-5"
          }`}
        >
          {displayLabel}
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-primary-1 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div
          className={`absolute left-0 right-0 top-[calc(100%+8px)] z-[99999] overflow-hidden rounded-xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)] ${menuClassName}`}
        >
          <div className="max-h-72 overflow-y-auto">
            {normalizedOptions.length > 0 ? (
              normalizedOptions.map((option) => {
                const active = String(option.value) === String(value ?? "");

                return (
                  <button
                    key={option.id || option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`block w-full px-4 py-3.5 text-left text-sm font-semibold transition ${
                      active
                        ? "bg-[#EAF4FF] text-sibs-primary-1"
                        : "bg-white text-[#344054] hover:bg-[#F5F9FF] hover:text-sibs-primary-1"
                    }`}
                  >
                    <span className="block min-w-0 truncate">
                      {option.label}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3.5 text-sm font-semibold text-sibs-tertiary-5">
                No options found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ConfirmationModal({
  open,
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
  isSaving = false,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[12000] flex h-dvh items-center justify-center bg-slate-950/40 px-4 py-4 backdrop-blur-[1px]"
      onClick={isSaving ? undefined : onCancel}
    >
      <div
        className="sibs-profile-tab-panel w-full max-w-md overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#EEF2F6] px-5 py-4">
          <h3 className="text-base font-extrabold text-sibs-primary-1">
            {title}
          </h3>

          <p className="mt-1 text-sm font-semibold leading-6 text-[#667085]">
            {message}
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D9E2EC] bg-white px-5 text-sm font-bold text-[#344054] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B8C4D2] hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? "Saving..." : confirmLabel || "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PositionFormModal({
  open,
  mode,
  form,
  setForm,
  onClose,
  onSubmit,
  onReset,
  meta,
  isSaving,
}) {
  if (!open) return null;

  const title =
    mode === "edit" ? "Edit Available Position" : "Add Available Position";

  const departments = Array.isArray(meta.departments) ? meta.departments : [];
  const accounts = Array.isArray(meta.accounts) ? meta.accounts : [];
  const statusOptions = Array.isArray(meta.statusOptions)
    ? meta.statusOptions
    : [];

  const filteredAccounts = accounts.filter(
    (account) => String(account.departmentId) === String(form.departmentId || ""),
  );

  const departmentDropdownOptions = departments.map((department) => ({
    id: department.departmentId,
    value: department.departmentId,
    label: department.departmentName,
  }));

  const accountDropdownOptions = filteredAccounts.map((account) => ({
    id: account.accountId,
    value: account.accountId,
    label: account.accountName,
  }));

  const statusDropdownOptions = statusOptions.map((status) => ({
    id: status,
    value: status,
    label: status,
  }));

  const locationDropdownOptions = LOCATION_SITE_OPTIONS.map((location) => ({
    id: location,
    value: location,
    label: location,
  }));

  function handleDepartmentChange(departmentId) {
    const selectedDepartment = departments.find(
      (department) => String(department.departmentId) === String(departmentId),
    );

    setForm({
      ...form,
      departmentId,
      department: selectedDepartment?.departmentName || "",
      accountId: "",
      accountName: "",
      accountGhlName: "",
    });
  }

  function handleAccountChange(accountId) {
    const selectedAccount = accounts.find(
      (account) => String(account.accountId) === String(accountId),
    );

    setForm({
      ...form,
      accountId,
      accountName: selectedAccount?.accountName || "",
      accountGhlName: selectedAccount?.accountGhlName || "",
    });
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={isSaving ? undefined : onClose}
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="sibs-profile-tab-panel flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-extrabold text-sibs-primary-1">
              {title}
            </h2>

            <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
              Select a department first, then choose the matching account under
              that department.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <FieldLabel required>Position Title</FieldLabel>

                <input
                  required
                  value={form.positionTitle}
                  onChange={(e) =>
                    setForm({ ...form, positionTitle: e.target.value })
                  }
                  placeholder="Enter position title"
                  className={inputClass()}
                />
              </div>

              <DropdownField
                label="Department"
                required
                value={form.departmentId}
                onChange={handleDepartmentChange}
                options={departmentDropdownOptions}
                placeholder="Select department"
                disabled={isSaving}
                zIndex="z-[180]"
              />

              <div>
                <DropdownField
                  label="Account"
                  required
                  value={form.accountId}
                  onChange={handleAccountChange}
                  options={accountDropdownOptions}
                  placeholder={
                    form.departmentId
                      ? "Select account"
                      : "Select department first"
                  }
                  disabled={isSaving || !form.departmentId}
                  zIndex="z-[170]"
                />

                {form.departmentId && filteredAccounts.length === 0 && (
                  <p className="mt-1 text-xs font-bold text-red-600">
                    No available accounts found under this department.
                  </p>
                )}
              </div>

              <DropdownField
                label="Status"
                required
                value={form.status}
                onChange={(value) => setForm({ ...form, status: value })}
                options={statusDropdownOptions}
                placeholder="Select status"
                disabled={isSaving}
                zIndex="z-[160]"
              />

              <DropdownField
                label="Location / Site"
                required
                value={form.locationSite}
                onChange={(value) => setForm({ ...form, locationSite: value })}
                options={locationDropdownOptions}
                placeholder="Select location / site"
                disabled={isSaving}
                zIndex="z-[150]"
              />

              <div className="md:col-span-2">
                <FieldLabel>Preferred Skills</FieldLabel>

                <input
                  value={form.preferredSkills}
                  onChange={(e) =>
                    setForm({ ...form, preferredSkills: e.target.value })
                  }
                  placeholder="Enter preferred skills"
                  className={inputClass()}
                />
              </div>

              <div className="md:col-span-2">
                <FieldLabel>Description</FieldLabel>

                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Describe the position purpose or role overview."
                  className={textareaClass()}
                />
              </div>

              <div className="md:col-span-2">
                <FieldLabel>Remarks</FieldLabel>

                <textarea
                  rows={3}
                  value={form.remarks}
                  onChange={(e) =>
                    setForm({ ...form, remarks: e.target.value })
                  }
                  placeholder="Internal notes only."
                  className={textareaClass()}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="border-t border-[#E6ECF2] px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onReset}
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw size={16} />
              Reset
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {isSaving
                ? "Saving..."
                : mode === "edit"
                  ? "Update Position"
                  : "Save Position"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function PositionMobileCard({
  position,
  onEdit,
  onSetStatus,
  isSaving,
  activeStatus,
  inactiveStatus,
}) {
  return (
    <div className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-sibs-primary-1">
            {position.positionId}
          </p>

          <h3 className="mt-1 text-sm font-bold text-[#101828]">
            {position.positionTitle}
          </h3>

          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
            {position.department}
          </p>
        </div>

        <StatusBadge status={position.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Account
          </p>

          <p className="mt-1 text-xs font-bold text-[#344054]">
            {position.accountName || "—"}
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Location
          </p>

          <p className="mt-1 text-xs font-bold text-[#344054]">
            {position.locationSite || "—"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onEdit(position)}
          disabled={isSaving}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Pencil size={14} />
          Edit
        </button>

        {activeStatus && (
          <button
            type="button"
            onClick={() => onSetStatus(position, activeStatus)}
            disabled={isSaving || position.status === activeStatus}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Set {activeStatus}
          </button>
        )}

        {inactiveStatus && (
          <button
            type="button"
            onClick={() => onSetStatus(position, inactiveStatus)}
            disabled={isSaving || position.status === inactiveStatus}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Set {inactiveStatus}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AvailablePositionsPage() {
  const mainRef = useRef(null);
  const { user } = useUser();
  const currentUserName = getUserDisplayName(user);

  const [positionList, setPositionList] = useState([]);
  const [meta, setMeta] = useState({
    statusOptions: [],
    departments: [],
    accounts: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [accountFilter, setAccountFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");

  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [positionForm, setPositionForm] = useState(emptyForm);
  const [editTarget, setEditTarget] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  function openStatusModal(type, title, message) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });
  }

  function closeStatusModal() {
    setStatusModal((prev) => ({
      ...prev,
      open: false,
    }));
  }

  const databaseStatusOptions = useMemo(() => {
    return Array.isArray(meta.statusOptions)
      ? meta.statusOptions.filter(Boolean)
      : [];
  }, [meta.statusOptions]);

  const activeStatus = useMemo(() => {
    return getStatusOption(meta, "active") || "Active";
  }, [meta]);

  const inactiveStatus = useMemo(() => {
    return getStatusOption(meta, "inactive") || "Inactive";
  }, [meta]);

  const statusFilterOptions = useMemo(() => {
    return STATUS_FILTER_OPTIONS.map((status) => ({
      id: status,
      value: status,
      label: status === "All" ? "All Statuses" : status,
    }));
  }, []);

  const departmentOptions = useMemo(() => {
    return Array.isArray(meta.departments) ? meta.departments : [];
  }, [meta.departments]);

  const accountOptions = useMemo(() => {
    return Array.isArray(meta.accounts) ? meta.accounts : [];
  }, [meta.accounts]);

  const filteredAccountOptions = useMemo(() => {
    if (departmentFilter === "All") return accountOptions;

    return accountOptions.filter(
      (account) => String(account.departmentId) === String(departmentFilter),
    );
  }, [accountOptions, departmentFilter]);

  const departmentFilterOptions = useMemo(() => {
    return [
      {
        id: "All",
        value: "All",
        label: "All Departments",
      },
      ...departmentOptions.map((department) => ({
        id: department.departmentId,
        value: department.departmentId,
        label: department.departmentName,
      })),
    ];
  }, [departmentOptions]);

  const accountFilterOptions = useMemo(() => {
    return [
      {
        id: "All",
        value: "All",
        label: "All Accounts",
      },
      ...filteredAccountOptions.map((account) => ({
        id: account.accountId,
        value: account.accountId,
        label: account.accountName,
      })),
    ];
  }, [filteredAccountOptions]);

  const locationFilterOptions = useMemo(() => {
    return [
      {
        id: "All",
        value: "All",
        label: "All Locations",
      },
      ...LOCATION_SITE_OPTIONS.map((location) => ({
        id: location,
        value: location,
        label: location,
      })),
    ];
  }, []);

  function scrollToTop(behavior = "auto") {
    requestAnimationFrame(() => {
      if (mainRef.current) {
        mainRef.current.scrollTo({
          top: 0,
          left: 0,
          behavior,
        });
      }

      if (typeof window !== "undefined") {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior,
        });
      }

      if (typeof document !== "undefined") {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
    });
  }

  const refreshPositions = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const [metaResponse, positionsResponse] = await Promise.all([
        getAvailablePositionMeta(),
        getAvailablePositions({
          page: 1,
          limit: 500,
          search: "",
          status: "All",
          departmentId: "All",
          accountId: "All",
        }),
      ]);

      if (!metaResponse?.success) {
        throw new Error(
          metaResponse?.message || "Failed to load position metadata.",
        );
      }

      if (!positionsResponse?.success) {
        throw new Error(
          positionsResponse?.message || "Failed to load available positions.",
        );
      }

      setMeta({
        statusOptions: Array.isArray(metaResponse.data?.statusOptions)
          ? metaResponse.data.statusOptions.filter(Boolean)
          : [],
        departments: Array.isArray(metaResponse.data?.departments)
          ? metaResponse.data.departments.filter(Boolean)
          : [],
        accounts: Array.isArray(metaResponse.data?.accounts)
          ? metaResponse.data.accounts.filter(Boolean)
          : [],
      });

      setPositionList(
        Array.isArray(positionsResponse.data) ? positionsResponse.data : [],
      );
    } catch (error) {
      console.error("Load available positions error:", error);
      setLoadError(error?.message || "Failed to load available positions.");
      setPositionList([]);
      setMeta({
        statusOptions: [],
        departments: [],
        accounts: [],
      });

      openStatusModal(
        "error",
        "Unable to load positions",
        error?.message || "Failed to load available positions.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useLayoutEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    scrollToTop("auto");

    const timer = window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    refreshPositions();
  }, [refreshPositions]);

  function requestConfirm({ title, message, confirmLabel, onConfirm }) {
    setConfirmState({ title, message, confirmLabel, onConfirm });
  }

  function closeConfirm() {
    if (isSaving) return;
    setConfirmState(null);
  }

  function buildAddForm() {
    return {
      ...emptyForm,
      status: getInitialStatus(meta),
    };
  }

  function resetForm() {
    if (formMode === "edit" && editTarget) {
      setPositionForm({
        positionTitle: editTarget.positionTitle || "",
        departmentId: editTarget.departmentId || "",
        department: editTarget.department || "",
        accountId: editTarget.accountId || "",
        accountName: editTarget.accountName || "",
        accountGhlName: editTarget.accountGhlName || "",
        description: editTarget.description || "",
        preferredSkills: editTarget.preferredSkills || "",
        locationSite: editTarget.locationSite || "",
        status: editTarget.status || "",
        remarks: editTarget.remarks || "",
      });
      return;
    }

    setPositionForm(buildAddForm());
  }

  function openAddModal() {
    setFormMode("add");
    setEditTarget(null);
    setPositionForm(buildAddForm());
    setShowFormModal(true);
  }

  function openEditModal(position) {
    setFormMode("edit");
    setEditTarget(position);
    setPositionForm({
      positionTitle: position.positionTitle || "",
      departmentId: position.departmentId || "",
      department: position.department || "",
      accountId: position.accountId || "",
      accountName: position.accountName || "",
      accountGhlName: position.accountGhlName || "",
      description: position.description || "",
      preferredSkills: position.preferredSkills || "",
      locationSite: position.locationSite || "",
      status: position.status || "",
      remarks: position.remarks || "",
    });
    setShowFormModal(true);
  }

  function closeFormModal() {
    if (isSaving) return;

    setShowFormModal(false);
    setFormMode("add");
    setEditTarget(null);
    setPositionForm(emptyForm);
  }

  function closeFormAfterSave() {
    setShowFormModal(false);
    setFormMode("add");
    setEditTarget(null);
    setPositionForm(emptyForm);
  }

  async function savePosition() {
    setIsSaving(true);

    try {
      const payload = {
        positionTitle: positionForm.positionTitle.trim(),
        departmentId: positionForm.departmentId,
        accountId: positionForm.accountId,
        description: positionForm.description.trim(),
        preferredSkills: positionForm.preferredSkills.trim(),
        locationSite: positionForm.locationSite,
        status: positionForm.status,
        remarks: positionForm.remarks.trim(),
        createdBy: currentUserName,
        updatedBy: currentUserName,
      };

      const response =
        formMode === "edit" && editTarget
          ? await updateAvailablePosition(editTarget.id, payload)
          : await createAvailablePosition(payload);

      if (!response?.success) {
        openStatusModal(
          "error",
          "Position not saved",
          response?.message || "Failed to save available position.",
        );
        return;
      }

      await refreshPositions();

      closeFormAfterSave();
      scrollToTop("auto");

      window.setTimeout(() => {
        scrollToTop("auto");
      }, 0);

      openStatusModal(
        "success",
        formMode === "edit" ? "Position updated" : "Position saved",
        formMode === "edit"
          ? "The available position was updated successfully."
          : "The available position was saved successfully.",
      );
    } catch (error) {
      console.error("Save available position error:", error);
      openStatusModal(
        "error",
        "Position not saved",
        error?.message || "Failed to save available position.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleSubmitPosition(e) {
    e.preventDefault();

    if (!positionForm.positionTitle.trim()) {
      openStatusModal(
        "error",
        "Required field missing",
        "Position Title is required.",
      );
      return;
    }

    if (!positionForm.departmentId) {
      openStatusModal(
        "error",
        "Required field missing",
        "Department is required.",
      );
      return;
    }

    if (!positionForm.accountId) {
      openStatusModal(
        "error",
        "Required field missing",
        "Account is required.",
      );
      return;
    }

    if (!positionForm.status) {
      openStatusModal(
        "error",
        "Required field missing",
        "Status is required.",
      );
      return;
    }

    if (!positionForm.locationSite) {
      openStatusModal(
        "error",
        "Required field missing",
        "Location / Site is required.",
      );
      return;
    }

    requestConfirm({
      title: formMode === "edit" ? "Update Position" : "Save Position",
      message:
        positionForm.status === activeStatus
          ? `${positionForm.positionTitle} will be visible in the Public Form and Talent Pool form.`
          : `${positionForm.positionTitle} will not be visible to applicants unless status is ${
              activeStatus || "configured as visible"
            }.`,
      confirmLabel: formMode === "edit" ? "Update" : "Save",
      onConfirm: savePosition,
    });
  }

  function handleSetStatus(position, nextStatus) {
    if (!nextStatus) {
      openStatusModal(
        "error",
        "Status option missing",
        "Status option is missing from the database.",
      );
      return;
    }

    requestConfirm({
      title: "Update Position Status",
      message:
        nextStatus === activeStatus
          ? `${position.positionTitle} will be shown in the Public Form and Talent Pool form.`
          : `${position.positionTitle} will be hidden from applicant-facing forms.`,
      confirmLabel: `Set ${nextStatus}`,
      onConfirm: async () => {
        setIsSaving(true);

        try {
          const response = await updateAvailablePositionStatus(position.id, {
            status: nextStatus,
            updatedBy: currentUserName,
          });

          if (!response?.success) {
            openStatusModal(
              "error",
              "Status not updated",
              response?.message || "Failed to update position status.",
            );
            return;
          }

          await refreshPositions();

          scrollToTop("auto");

          window.setTimeout(() => {
            scrollToTop("auto");
          }, 0);

          openStatusModal(
            "success",
            "Status updated",
            `The position status was updated to ${nextStatus}.`,
          );
        } catch (error) {
          console.error("Update position status error:", error);
          openStatusModal(
            "error",
            "Status not updated",
            error?.message || "Failed to update position status.",
          );
        } finally {
          setIsSaving(false);
        }
      },
    });
  }

  function handleDepartmentFilterChange(value) {
    setDepartmentFilter(value);
    setAccountFilter("All");
  }

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("All");
    setDepartmentFilter("All");
    setAccountFilter("All");
    setLocationFilter("All");
    setCurrentPage(1);
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);
  }

  const filteredPositions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const normalizedStatusFilter = String(statusFilter || "").toLowerCase();

    return positionList.filter((position) => {
      const text = [
        position.positionId,
        position.positionTitle,
        position.department,
        position.accountName,
        position.accountGhlName,
        position.description,
        position.preferredSkills,
        position.locationSite,
        position.status,
        position.createdBy,
        position.remarks,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const normalizedPositionStatus = String(position.status || "").toLowerCase();

      const matchesSearch = !keyword || text.includes(keyword);
      const matchesStatus =
        statusFilter === "All" || normalizedPositionStatus === normalizedStatusFilter;
      const matchesDepartment =
        departmentFilter === "All" ||
        String(position.departmentId) === String(departmentFilter);
      const matchesAccount =
        accountFilter === "All" ||
        String(position.accountId) === String(accountFilter);
      const matchesLocation =
        locationFilter === "All" || position.locationSite === locationFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDepartment &&
        matchesAccount &&
        matchesLocation
      );
    });
  }, [
    positionList,
    search,
    statusFilter,
    departmentFilter,
    accountFilter,
    locationFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPositions.length / POSITIONS_PER_PAGE),
  );

  const paginatedPositions = useMemo(() => {
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const start = (safePage - 1) * POSITIONS_PER_PAGE;
    const end = start + POSITIONS_PER_PAGE;

    return filteredPositions.slice(start, end);
  }, [filteredPositions, currentPage, totalPages]);

  const showingFrom =
    filteredPositions.length > 0
      ? (currentPage - 1) * POSITIONS_PER_PAGE + 1
      : 0;

  const showingTo = Math.min(
    currentPage * POSITIONS_PER_PAGE,
    filteredPositions.length,
  );

  useEffect(() => {
    setCurrentPage(1);
    scrollToTop("auto");

    const timer = window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search, statusFilter, departmentFilter, accountFilter, locationFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
      scrollToTop("auto");
    }
  }, [currentPage, totalPages]);

  function handlePageChange(nextPage) {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);

    if (safePage === currentPage) {
      scrollToTop("auto");

      window.setTimeout(() => {
        scrollToTop("auto");
      }, 0);

      return;
    }

    setCurrentPage(safePage);
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);
  }

  const hasActiveFilters =
    search.trim() ||
    statusFilter !== "All" ||
    departmentFilter !== "All" ||
    accountFilter !== "All" ||
    locationFilter !== "All";

  return (
    <div className="flex h-screen flex-1 flex-col bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main
        ref={mainRef}
        className="min-w-0 flex-1 overflow-y-scroll overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-[1600px] space-y-6">
          <div className="sibs-page-header-in min-w-0 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <BriefcaseBusiness size={14} />
                Recruitment Setup
              </div>

              <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
                Available Positions
              </h1>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Departments and accounts are loaded from the database. Accounts
                are filtered based on the selected department.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={openAddModal}
                disabled={
                  isSaving ||
                  !databaseStatusOptions.length ||
                  !departmentOptions.length ||
                  !accountOptions.length
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={18} />
                Add Position
              </button>
            </div>
          </div>

          {loadError && (
            <section className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
              {loadError}
            </section>
          )}

          {!isLoading && !loadError && !departmentOptions.length && (
            <section className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold text-amber-700">
              No departments found.
            </section>
          )}

          {!isLoading && !loadError && !accountOptions.length && (
            <section className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold text-amber-700">
              No available accounts found.
            </section>
          )}

          <section className="sibs-profile-tab-panel overflow-visible rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
            <div className="relative z-[90] border-b border-[#E6ECF2] p-4 sm:p-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                    <Filter size={14} />
                    Position Filters
                  </div>

                  <h2 className="mt-3 text-base font-extrabold text-[#101828]">
                    Available Position Filters
                  </h2>

                  <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                    Accounts are filtered based on the selected department.
                  </p>
                </div>

                <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1">
                  {filteredPositions.length} Records
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_170px_210px_210px_210px_auto] xl:items-end">
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
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search position, department, account, skills..."
                      className="h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 shadow-sm outline-none transition placeholder:text-sibs-tertiary-5 hover:border-sibs-primary-1 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                    />
                  </div>
                </div>

                <DropdownField
                  label="Status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={statusFilterOptions}
                  placeholder="All Statuses"
                  disabled={isLoading}
                  zIndex="z-[140]"
                />

                <DropdownField
                  label="Department"
                  value={departmentFilter}
                  onChange={handleDepartmentFilterChange}
                  options={departmentFilterOptions}
                  placeholder="All Departments"
                  disabled={isLoading}
                  zIndex="z-[130]"
                />

                <DropdownField
                  label="Account"
                  value={accountFilter}
                  onChange={setAccountFilter}
                  options={accountFilterOptions}
                  placeholder="All Accounts"
                  disabled={
                    isLoading ||
                    (departmentFilter !== "All" &&
                      !filteredAccountOptions.length)
                  }
                  zIndex="z-[120]"
                />

                <DropdownField
                  label="Location / Site"
                  value={locationFilter}
                  onChange={setLocationFilter}
                  options={locationFilterOptions}
                  placeholder="All Locations"
                  disabled={isLoading}
                  zIndex="z-[110]"
                />

                <button
                  type="button"
                  onClick={handleClearFilters}
                  disabled={!hasActiveFilters || isLoading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw size={17} />
                  Clear
                </button>
              </div>
            </div>

            <div className="relative z-[1] p-4 sm:p-6">
              {isLoading ? (
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-12 text-center text-sm font-bold text-sibs-primary-1">
                  Loading available positions from database...
                </div>
              ) : (
                <>
                  <div className="space-y-3 lg:hidden">
                    {paginatedPositions.length > 0 ? (
                      paginatedPositions.map((position) => (
                        <PositionMobileCard
                          key={position.id}
                          position={position}
                          onEdit={openEditModal}
                          onSetStatus={handleSetStatus}
                          isSaving={isSaving}
                          activeStatus={activeStatus}
                          inactiveStatus={inactiveStatus}
                        />
                      ))
                    ) : (
                      <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                        No positions found.
                      </div>
                    )}
                  </div>

                  <div className="hidden lg:block">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1500px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left">
                        <thead>
                          <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                            <th className="px-5 py-4 first:rounded-tl-2xl">
                              Position
                            </th>
                            <th className="px-5 py-4">Department</th>
                            <th className="px-5 py-4">Account</th>
                            <th className="px-5 py-4">GHL Name</th>
                            <th className="px-5 py-4">Location / Site</th>
                            <th className="px-5 py-4">Preferred Skills</th>
                            <th className="px-5 py-4">Status</th>
                            <th className="px-5 py-4">Last Updated</th>
                            <th className="px-5 py-4 text-right last:rounded-tr-2xl">
                              Actions
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {paginatedPositions.length > 0 ? (
                            paginatedPositions.map((position) => (
                              <tr
                                key={position.id}
                                className="transition hover:bg-[#FAFBFC]"
                              >
                                <td className="border-b border-[#E6ECF2] px-5 py-5">
                                  <p className="text-sm font-bold text-[#101828]">
                                    {position.positionTitle}
                                  </p>

                                  <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                                    {position.positionId}
                                  </p>
                                </td>

                                <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                                  {position.department || "—"}
                                </td>

                                <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                                  {position.accountName || "—"}
                                </td>

                                <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                                  {position.accountGhlName || "—"}
                                </td>

                                <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                                  {position.locationSite || "—"}
                                </td>

                                <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                                  <p className="max-w-[300px]">
                                    {position.preferredSkills || "—"}
                                  </p>
                                </td>

                                <td className="border-b border-[#E6ECF2] px-5 py-5">
                                  <StatusBadge status={position.status} />
                                </td>

                                <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                                  <p>{formatDate(position.updatedAt)}</p>

                                  <p className="mt-1 text-xs text-sibs-tertiary-5">
                                    By:{" "}
                                    {formatPersonName(
                                      position.updatedBy || position.createdBy,
                                    )}
                                  </p>
                                </td>

                                <td className="border-b border-[#E6ECF2] px-5 py-5 text-right">
                                  <div className="inline-flex items-center gap-2">
                                    {activeStatus && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleSetStatus(position, activeStatus)
                                        }
                                        disabled={
                                          isSaving ||
                                          position.status === activeStatus
                                        }
                                        className="inline-flex h-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        Set {activeStatus}
                                      </button>
                                    )}

                                    {inactiveStatus && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleSetStatus(
                                            position,
                                            inactiveStatus,
                                          )
                                        }
                                        disabled={
                                          isSaving ||
                                          position.status === inactiveStatus
                                        }
                                        className="inline-flex h-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        Set {inactiveStatus}
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => openEditModal(position)}
                                      disabled={isSaving}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
                                      title="Edit"
                                    >
                                      <Pencil size={15} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={9}
                                className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                              >
                                No positions found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <p className="text-sm font-semibold text-sibs-tertiary-5">
                      Showing {showingFrom} to {showingTo} of{" "}
                      {filteredPositions.length} positions
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      {Array.from({ length: totalPages }).map((_, index) => {
                        const pageNumber = index + 1;
                        const active = currentPage === pageNumber;

                        return (
                          <button
                            key={pageNumber}
                            type="button"
                            onClick={() => handlePageChange(pageNumber)}
                            className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-bold transition ${
                              active
                                ? "bg-sibs-primary-1 text-white shadow-sm"
                                : "border border-[#E6ECF2] bg-white text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="sibs-profile-tab-panel rounded-xl border border-blue-100 bg-blue-50 p-5">
            <h3 className="text-sm font-bold text-sibs-primary-1">
              Database Rule
            </h3>

            <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
              This page does not use localStorage. Departments and accounts are
              loaded from the database, and accounts are filtered based on the
              selected department. Location / Site is limited to Davao, Tagum,
              or Both Davao and Tagum.
            </p>
          </section>
        </div>
      </main>

      <PositionFormModal
        open={showFormModal}
        mode={formMode}
        form={positionForm}
        setForm={setPositionForm}
        onClose={closeFormModal}
        onSubmit={handleSubmitPosition}
        onReset={resetForm}
        meta={meta}
        isSaving={isSaving}
      />

      <ConfirmationModal
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        isSaving={isSaving}
        onCancel={closeConfirm}
        onConfirm={() => {
          const action = confirmState?.onConfirm;
          setConfirmState(null);
          if (typeof action === "function") action();
        }}
      />

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={closeStatusModal}
        variant="center"
        lockScroll
      />
    </div>
  );
}