import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Header from "../../components/layout/Header";
import { useUser } from "../../services/context/UserContext";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Pencil,
  X,
  Save,
  RotateCcw,
  BriefcaseBusiness,
  CheckCircle2,
  XCircle,
  Archive,
  Clock3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

export const AVAILABLE_POSITIONS_STORAGE_KEY = "ta_available_positions";
const POSITIONS_PER_PAGE = 8;

const statusOptions = ["All", "Active", "Inactive", "Draft", "Archived"];

const departmentOptions = [
  "Operations",
  "Talent Acquisition",
  "Quality Assurance",
  "Learning and Development",
  "Human Resources",
  "Information Technology",
  "Finance",
  "Accounting",
  "Administration",
];

const locationOptions = ["Davao Site", "Tagum Site", "Mabini Site", "Any Site"];

const defaultPositions = [
  {
    id: 1,
    positionId: "POS-001",
    positionTitle: "Customer Service Representative",
    department: "Operations",
    description:
      "Handles customer inquiries, provides support, and ensures a quality customer experience.",
    preferredSkills: "English, Customer Service, Chat Support, Voice Support",
    locationSite: "Davao Site",
    status: "Active",
    createdBy: "Alena Batacan",
    createdAt: "2026-05-01",
    updatedBy: "Alena Batacan",
    updatedAt: "2026-05-01",
    remarks: "Shown in Public Form and Talent Pool form.",
  },
  {
    id: 2,
    positionId: "POS-002",
    positionTitle: "QA Specialist",
    department: "Quality Assurance",
    description:
      "Monitors quality, audits work output, provides feedback, and supports calibration.",
    preferredSkills: "QA, Documentation, Coaching, English",
    locationSite: "Davao Site",
    status: "Active",
    createdBy: "Alena Batacan",
    createdAt: "2026-05-01",
    updatedBy: "Alena Batacan",
    updatedAt: "2026-05-01",
    remarks: "Active position.",
  },
  {
    id: 3,
    positionId: "POS-003",
    positionTitle: "RCM Analyst",
    department: "Operations",
    description:
      "Supports revenue cycle management, claims review, billing documentation, and healthcare process tasks.",
    preferredSkills: "RCM, Healthcare, Documentation, Excel",
    locationSite: "Tagum Site",
    status: "Active",
    createdBy: "Alena Batacan",
    createdAt: "2026-05-01",
    updatedBy: "Alena Batacan",
    updatedAt: "2026-05-01",
    remarks: "Active for recruitment.",
  },
  {
    id: 4,
    positionId: "POS-004",
    positionTitle: "IT Support",
    department: "Information Technology",
    description:
      "Provides technical support, troubleshooting, hardware/software assistance, and user support.",
    preferredSkills: "Technical Support, Troubleshooting, Hardware, Networking",
    locationSite: "Any Site",
    status: "Inactive",
    createdBy: "Alena Batacan",
    createdAt: "2026-05-01",
    updatedBy: "Alena Batacan",
    updatedAt: "2026-05-01",
    remarks: "Not currently shown in Public Form.",
  },
  {
    id: 5,
    positionId: "POS-005",
    positionTitle: "Accounting Staff",
    department: "Accounting",
    description:
      "Supports accounting documentation, bookkeeping tasks, reconciliation, and reporting.",
    preferredSkills: "Accounting, Excel, Documentation, Reconciliation",
    locationSite: "Davao Site",
    status: "Draft",
    createdBy: "Alena Batacan",
    createdAt: "2026-05-01",
    updatedBy: "Alena Batacan",
    updatedAt: "2026-05-01",
    remarks: "Draft position. Not visible to applicants yet.",
  },
];

const emptyForm = {
  positionTitle: "",
  department: "",
  description: "",
  preferredSkills: "",
  locationSite: "Davao Site",
  status: "Active",
  remarks: "",
};

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
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
      "Alena Batacan",
  );
}

function readPositions() {
  if (typeof window === "undefined") return defaultPositions;

  try {
    const raw = window.localStorage.getItem(AVAILABLE_POSITIONS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : defaultPositions;
  } catch {
    return defaultPositions;
  }
}

function writePositions(value) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      AVAILABLE_POSITIONS_STORAGE_KEY,
      JSON.stringify(value),
    );
  } catch {
    // localStorage only
  }
}

export function getActiveAvailablePositions() {
  return readPositions().filter((item) => item.status === "Active");
}

export function getActivePositionTitles() {
  return getActiveAvailablePositions()
    .map((item) => item.positionTitle)
    .filter(Boolean);
}

function generatePositionId(nextNumber) {
  return `POS-${String(nextNumber).padStart(3, "0")}`;
}

function inputClass(extra = "") {
  return `h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function textareaClass(extra = "") {
  return `w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function AnimatedDropdown({ open, children, className = "" }) {
  return (
    <div
      className={`absolute left-0 right-0 top-full z-[9999] mt-2 grid transition-all duration-300 ease-out ${
        open
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0"
      } ${className}`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl transition-all duration-300 ease-out ${
            open ? "translate-y-0 scale-100" : "-translate-y-2 scale-[0.98]"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
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

function StatusBadge({ status }) {
  const className =
    status === "Active"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "Inactive"
        ? "border-red-200 bg-red-50 text-red-700"
        : status === "Draft"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : status === "Archived"
            ? "border-gray-200 bg-gray-50 text-gray-600"
            : "border-gray-200 bg-gray-50 text-gray-600";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${className}`}
    >
      {status || "—"}
    </span>
  );
}

function CustomSelect({
  label,
  value,
  options = [],
  onChange,
  placeholder = "Select",
  allLabel,
  required = false,
  zIndex = "z-30",
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const displayValue =
    value === "All" && allLabel ? allLabel : value || placeholder;

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className={`relative isolate ${zIndex}`}>
      <label className="mb-1 block text-sm font-bold text-[#101828]">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-12 w-full items-center justify-between rounded-xl border border-[#D0D5DD] bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
      >
        <span className="truncate">{displayValue}</span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatedDropdown open={open}>
        <div className="max-h-64 overflow-y-auto py-2 sibs-scrollbar">
          {options.map((option) => {
            const optionLabel =
              option === "All" && allLabel ? allLabel : option || placeholder;
            const selected = value === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-3 text-left text-sm transition ${
                  selected
                    ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                    : "text-[#344054] hover:bg-[#F8FAFC]"
                }`}
              >
                <span className="block truncate">{optionLabel}</span>
              </button>
            );
          })}
        </div>
      </AnimatedDropdown>
    </div>
  );
}

function FormSelect({
  label,
  value,
  options = [],
  onChange,
  placeholder = "Select",
  required = false,
  zIndex = "z-30",
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const displayValue = value || placeholder;

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className={`relative isolate ${zIndex}`}>
      <FieldLabel required={required}>{label}</FieldLabel>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-[#D0D5DD] bg-white px-4 text-left text-sm font-semibold text-sibs-primary-1 outline-none transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
      >
        <span
          className={`truncate ${
            value ? "text-sibs-primary-1" : "text-sibs-tertiary-5"
          }`}
        >
          {displayValue}
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatedDropdown open={open}>
        <div className="max-h-64 overflow-y-auto py-2 sibs-scrollbar">
          {placeholder && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className={`block w-full px-4 py-3 text-left text-sm transition ${
                !value
                  ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                  : "text-[#344054] hover:bg-[#F8FAFC]"
              }`}
            >
              <span className="block truncate">{placeholder}</span>
            </button>
          )}

          {options.map((option) => {
            const selected = value === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-3 text-left text-sm transition ${
                  selected
                    ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                    : "text-[#344054] hover:bg-[#F8FAFC]"
                }`}
              >
                <span className="block truncate">{option}</span>
              </button>
            );
          })}
        </div>
      </AnimatedDropdown>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  description,
  valueClassName,
  iconClassName,
  delay = 0,
}) {
  return (
    <div
      className="sibs-page-card-in group rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
            {title}
          </p>

          <p
            className={`mt-3 truncate text-3xl font-extrabold ${
              valueClassName || "text-sibs-primary-1"
            }`}
          >
            {value}
          </p>

          {description && (
            <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
              {description}
            </p>
          )}
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 ${
            iconClassName || "bg-[#F2F6FA] text-sibs-primary-1"
          }`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-[#EEF2F6] py-3 last:border-b-0 sm:grid-cols-[220px_1fr]">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#174A7C]">
        {label}
      </p>

      <p className="whitespace-pre-line break-words text-sm font-bold text-[#344054]">
        {value || "—"}
      </p>
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
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[12000] flex h-dvh items-center justify-center bg-slate-950/40 px-4 py-4 backdrop-blur-[1px]"
      onClick={onCancel}
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
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D9E2EC] bg-white px-5 text-sm font-bold text-[#344054] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B8C4D2] hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:opacity-95 active:scale-[0.98]"
          >
            {confirmLabel || "Continue"}
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
}) {
  if (!open) return null;

  const title =
    mode === "edit" ? "Edit Available Position" : "Add Available Position";

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="sibs-profile-tab-panel flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-visible rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-extrabold text-sibs-primary-1">
              {title}
            </h2>

            <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
              Active positions will be shown in the Public Form and Talent Pool
              form.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-100 hover:text-gray-700 active:scale-[0.98]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-visible p-5 sm:p-6">
          <section className="relative z-[40] overflow-visible rounded-2xl border border-[#E6ECF2] bg-white p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <FieldLabel required>Position Title</FieldLabel>

                <input
                  required
                  value={form.positionTitle}
                  onChange={(e) =>
                    setForm({ ...form, positionTitle: e.target.value })
                  }
                  placeholder="Example: Customer Service Representative"
                  className={inputClass()}
                />
              </div>

              <div>
                <FormSelect
                  label="Department"
                  required
                  value={form.department}
                  options={departmentOptions}
                  placeholder="Select department"
                  zIndex="z-50"
                  onChange={(value) => setForm({ ...form, department: value })}
                />
              </div>

              <div>
                <FormSelect
                  label="Location / Site"
                  required
                  value={form.locationSite}
                  options={locationOptions}
                  placeholder="Select location"
                  zIndex="z-40"
                  onChange={(value) =>
                    setForm({ ...form, locationSite: value })
                  }
                />
              </div>

              <div>
                <FormSelect
                  label="Status"
                  required
                  value={form.status}
                  options={statusOptions.filter((item) => item !== "All")}
                  placeholder="Select status"
                  zIndex="z-30"
                  onChange={(value) => setForm({ ...form, status: value })}
                />

                <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                  Only Active positions are visible to applicants.
                </p>
              </div>

              <div>
                <FieldLabel>Preferred Skills</FieldLabel>

                <input
                  value={form.preferredSkills}
                  onChange={(e) =>
                    setForm({ ...form, preferredSkills: e.target.value })
                  }
                  placeholder="English, Chat, RCM, QA"
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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
            >
              <RotateCcw size={16} />
              Reset
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
            >
              <Save size={16} />
              {mode === "edit" ? "Update Position" : "Save Position"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ViewPositionModal({ open, position, onClose, onEdit }) {
  if (!open || !position) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="sibs-profile-tab-panel flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-extrabold text-sibs-primary-1">
              Position Details
            </h2>

            <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
              {position.positionId} / {position.positionTitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-100 hover:text-gray-700 active:scale-[0.98]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold text-sibs-primary-1">
                  {position.positionId}
                </p>

                <h3 className="mt-1 text-2xl font-extrabold text-[#101828]">
                  {position.positionTitle}
                </h3>

                <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
                  {position.department}
                </p>
              </div>

              <StatusBadge status={position.status} />
            </div>

            <DetailRow label="Department" value={position.department} />
            <DetailRow label="Location / Site" value={position.locationSite} />
            <DetailRow
              label="Preferred Skills"
              value={position.preferredSkills}
            />
            <DetailRow label="Description" value={position.description} />
            <DetailRow label="Status" value={position.status} />
            <DetailRow
              label="Visibility"
              value={
                position.status === "Active"
                  ? "Shown in Public Form and Talent Pool"
                  : "Hidden from applicant forms"
              }
            />
            <DetailRow
              label="Created By"
              value={formatPersonName(position.createdBy)}
            />
            <DetailRow
              label="Created Date"
              value={formatDate(position.createdAt)}
            />
            <DetailRow
              label="Last Updated"
              value={formatDate(position.updatedAt)}
            />
            <DetailRow
              label="Updated By"
              value={formatPersonName(position.updatedBy || position.createdBy)}
            />
            <DetailRow label="Remarks" value={position.remarks} />
          </section>
        </div>

        <div className="border-t border-[#E6ECF2] px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => onEdit(position)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
            >
              <Pencil size={16} />
              Edit
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PositionMobileCard({ position, onView, onSetStatus }) {
  return (
    <div className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-md">
      <button type="button" onClick={onView} className="w-full text-left">
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
              Location
            </p>

            <p className="mt-1 text-xs font-bold text-[#344054]">
              {position.locationSite}
            </p>
          </div>

          <div className="rounded-xl bg-[#F8FAFC] p-3">
            <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
              Visibility
            </p>

            <p className="mt-1 text-xs font-bold text-[#344054]">
              {position.status === "Active" ? "Shown in forms" : "Hidden"}
            </p>
          </div>
        </div>
      </button>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onSetStatus(position, "Active")}
          disabled={position.status === "Active"}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          Activate
        </button>

        <button
          type="button"
          onClick={() => onSetStatus(position, "Inactive")}
          disabled={position.status === "Inactive"}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          Deactivate
        </button>
      </div>
    </div>
  );
}

export default function AvailablePositionsPage() {
  const mainRef = useRef(null);
  const { user } = useUser();
  const currentUserName = getUserDisplayName(user);

  const [positionList, setPositionList] = useState(defaultPositions);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [positionForm, setPositionForm] = useState(emptyForm);
  const [editTarget, setEditTarget] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

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
    const saved = readPositions();
    setPositionList(saved);
    writePositions(saved);
    setHasLoaded(true);
    setCurrentPage(1);
    scrollToTop("auto");

    const timer = window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    writePositions(positionList);
  }, [positionList, hasLoaded]);

  function requestConfirm({ title, message, confirmLabel, onConfirm }) {
    setConfirmState({ title, message, confirmLabel, onConfirm });
  }

  function closeConfirm() {
    setConfirmState(null);
  }

  function resetForm() {
    if (formMode === "edit" && editTarget) {
      setPositionForm({
        positionTitle: editTarget.positionTitle || "",
        department: editTarget.department || "",
        description: editTarget.description || "",
        preferredSkills: editTarget.preferredSkills || "",
        locationSite: editTarget.locationSite || "Davao Site",
        status: editTarget.status || "Active",
        remarks: editTarget.remarks || "",
      });
      return;
    }

    setPositionForm(emptyForm);
  }

  function openAddModal() {
    setFormMode("add");
    setEditTarget(null);
    setPositionForm(emptyForm);
    setShowFormModal(true);
  }

  function openEditModal(position) {
    setFormMode("edit");
    setEditTarget(position);
    setPositionForm({
      positionTitle: position.positionTitle || "",
      department: position.department || "",
      description: position.description || "",
      preferredSkills: position.preferredSkills || "",
      locationSite: position.locationSite || "Davao Site",
      status: position.status || "Active",
      remarks: position.remarks || "",
    });
    setSelectedPosition(null);
    setShowFormModal(true);
  }

  function closeFormModal() {
    setShowFormModal(false);
    setFormMode("add");
    setEditTarget(null);
    setPositionForm(emptyForm);
  }

  function savePosition() {
    const today = getTodayDate();

    if (formMode === "edit" && editTarget) {
      const updated = {
        ...editTarget,
        positionTitle: positionForm.positionTitle.trim(),
        department: positionForm.department,
        description: positionForm.description.trim(),
        preferredSkills: positionForm.preferredSkills.trim(),
        locationSite: positionForm.locationSite,
        status: positionForm.status,
        remarks: positionForm.remarks.trim(),
        updatedAt: today,
        updatedBy: currentUserName,
      };

      setPositionList((prev) =>
        prev.map((item) => (item.id === editTarget.id ? updated : item)),
      );
      setSelectedPosition(updated);
      closeFormModal();
      scrollToTop("auto");

      window.setTimeout(() => {
        scrollToTop("auto");
      }, 0);

      return;
    }

    const nextId =
      positionList.length > 0
        ? Math.max(...positionList.map((item) => Number(item.id) || 0)) + 1
        : 1;

    const newPosition = {
      id: nextId,
      positionId: generatePositionId(nextId),
      positionTitle: positionForm.positionTitle.trim(),
      department: positionForm.department,
      description: positionForm.description.trim(),
      preferredSkills: positionForm.preferredSkills.trim(),
      locationSite: positionForm.locationSite,
      status: positionForm.status,
      createdBy: currentUserName,
      createdAt: today,
      updatedAt: today,
      updatedBy: currentUserName,
      remarks: positionForm.remarks.trim(),
    };

    setPositionList((prev) => [newPosition, ...prev]);
    setSelectedPosition(newPosition);
    setCurrentPage(1);
    closeFormModal();
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);
  }

  function handleSubmitPosition(e) {
    e.preventDefault();

    if (!positionForm.positionTitle.trim()) {
      alert("Position Title is required.");
      return;
    }

    if (!positionForm.department) {
      alert("Department is required.");
      return;
    }

    requestConfirm({
      title: formMode === "edit" ? "Update Position" : "Save Position",
      message:
        positionForm.status === "Active"
          ? `${positionForm.positionTitle} will be visible in the Public Form and Talent Pool form.`
          : `${positionForm.positionTitle} will not be visible to applicants unless status is Active.`,
      confirmLabel: formMode === "edit" ? "Update" : "Save",
      onConfirm: savePosition,
    });
  }

  function handleSetStatus(position, nextStatus) {
    requestConfirm({
      title: "Update Position Status",
      message:
        nextStatus === "Active"
          ? `${position.positionTitle} will be shown in the Public Form and Talent Pool form.`
          : `${position.positionTitle} will be hidden from applicant-facing forms.`,
      confirmLabel: nextStatus === "Active" ? "Activate" : "Deactivate",
      onConfirm: () => {
        const today = getTodayDate();

        const updated = {
          ...position,
          status: nextStatus,
          updatedAt: today,
          updatedBy: currentUserName,
        };

        setPositionList((prev) =>
          prev.map((item) => (item.id === position.id ? updated : item)),
        );

        if (selectedPosition?.id === position.id) {
          setSelectedPosition(updated);
        }

        scrollToTop("auto");

        window.setTimeout(() => {
          scrollToTop("auto");
        }, 0);
      },
    });
  }

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("All");
    setDepartmentFilter("All");
    setCurrentPage(1);
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);
  }

  const filteredPositions = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return positionList.filter((position) => {
      const text = [
        position.positionId,
        position.positionTitle,
        position.department,
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

      const matchesSearch = !keyword || text.includes(keyword);
      const matchesStatus =
        statusFilter === "All" || position.status === statusFilter;
      const matchesDepartment =
        departmentFilter === "All" || position.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [positionList, search, statusFilter, departmentFilter]);

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
  }, [search, statusFilter, departmentFilter]);

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

  const stats = useMemo(() => {
    return {
      total: positionList.length,
      active: positionList.filter((item) => item.status === "Active").length,
      inactive: positionList.filter((item) => item.status === "Inactive").length,
      draft: positionList.filter((item) => item.status === "Draft").length,
      archived: positionList.filter((item) => item.status === "Archived")
        .length,
    };
  }, [positionList]);

  const hasActiveFilters =
    search.trim() || statusFilter !== "All" || departmentFilter !== "All";

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
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                <BriefcaseBusiness size={14} />
                Recruitment Setup
              </div>

              <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
                Available Positions
              </h1>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Manage positions shown in the Public Form and Talent Pool form.
                Only Active positions are visible to candidates.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
            >
              <Plus size={18} />
              Add Position
            </button>
          </div>

          <section className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-bold text-[#101828]">
              Position Summary
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryCard
                title="Total Positions"
                value={stats.total}
                icon={BriefcaseBusiness}
                description="All listed positions"
                delay={0}
              />

              <SummaryCard
                title="Active"
                value={stats.active}
                icon={CheckCircle2}
                description="Visible in forms"
                valueClassName="text-emerald-600"
                iconClassName="bg-emerald-50 text-emerald-600"
                delay={60}
              />

              <SummaryCard
                title="Inactive"
                value={stats.inactive}
                icon={XCircle}
                description="Hidden from forms"
                valueClassName="text-red-600"
                iconClassName="bg-red-50 text-red-600"
                delay={120}
              />

              <SummaryCard
                title="Draft"
                value={stats.draft}
                icon={Clock3}
                description="Not yet published"
                valueClassName="text-amber-500"
                iconClassName="bg-amber-50 text-amber-600"
                delay={180}
              />

              <SummaryCard
                title="Archived"
                value={stats.archived}
                icon={Archive}
                description="Historical positions"
                valueClassName="text-gray-600"
                iconClassName="bg-gray-50 text-gray-600"
                delay={240}
              />
            </div>
          </section>

          <section
            className="relative z-[80] sibs-profile-tab-panel overflow-visible rounded-2xl border border-[#D9E2EC] bg-white shadow-sm"
            style={{ animationDelay: "120ms" }}
          >
            <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
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
                    Search position, status, department, skills, and site.
                  </p>
                </div>

                <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1">
                  {filteredPositions.length} Records
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_220px_260px_auto] xl:items-end">
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
                      placeholder="Search position, department, skills, site..."
                      className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                    />
                  </div>
                </div>

                <CustomSelect
                  label="Status"
                  value={statusFilter}
                  options={statusOptions}
                  allLabel="All Statuses"
                  onChange={setStatusFilter}
                  zIndex="z-50"
                />

                <CustomSelect
                  label="Department"
                  value={departmentFilter}
                  options={["All", ...departmentOptions]}
                  allLabel="All Departments"
                  onChange={setDepartmentFilter}
                  zIndex="z-40"
                />

                <button
                  type="button"
                  onClick={handleClearFilters}
                  disabled={!hasActiveFilters}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  <RotateCcw size={17} />
                  Clear
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="space-y-3 lg:hidden">
                {paginatedPositions.length > 0 ? (
                  paginatedPositions.map((position) => (
                    <PositionMobileCard
                      key={position.id}
                      position={position}
                      onView={() => setSelectedPosition(position)}
                      onSetStatus={handleSetStatus}
                    />
                  ))
                ) : (
                  <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                    No positions found.
                  </div>
                )}
              </div>

              <div className="hidden lg:block">
                <div className="overflow-x-auto p-0">
                  <table className="w-full min-w-[1350px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left">
                    <thead>
                      <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                        <th className="px-5 py-4 first:rounded-tl-2xl">
                          Position
                        </th>
                        <th className="px-5 py-4">Department</th>
                        <th className="px-5 py-4">Location / Site</th>
                        <th className="px-5 py-4">Preferred Skills</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Visibility</th>
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
                            className="transition-all duration-200 hover:bg-[#FAFBFC]"
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
                              {position.status === "Active"
                                ? "Shown in Public Form / Talent Pool"
                                : "Hidden from applicant forms"}
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
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSetStatus(position, "Active")
                                  }
                                  disabled={position.status === "Active"}
                                  className="inline-flex h-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                                >
                                  Activate
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSetStatus(position, "Inactive")
                                  }
                                  disabled={position.status === "Inactive"}
                                  className="inline-flex h-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                                >
                                  Deactivate
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openEditModal(position)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
                                  title="Edit"
                                >
                                  <Pencil size={15} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedPosition(position)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
                                  title="View"
                                >
                                  <Eye size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={8}
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
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
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section
            className="sibs-profile-tab-panel rounded-xl border border-blue-100 bg-blue-50 p-5"
            style={{ animationDelay: "180ms" }}
          >
            <h3 className="text-sm font-bold text-sibs-primary-1">
              Visibility Rule
            </h3>

            <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
              Only positions with Active status will be shown in the Public Form
              and Talent Pool Add/Edit Candidate form. Inactive, Draft, and
              Archived positions remain available for internal tracking but are
              hidden from applicant-facing selection lists.
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
      />

      <ViewPositionModal
        open={!!selectedPosition}
        position={selectedPosition}
        onClose={() => setSelectedPosition(null)}
        onEdit={openEditModal}
      />

      <ConfirmationModal
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        onCancel={closeConfirm}
        onConfirm={() => {
          const action = confirmState?.onConfirm;
          closeConfirm();
          if (typeof action === "function") action();
        }}
      />
    </div>
  );
}