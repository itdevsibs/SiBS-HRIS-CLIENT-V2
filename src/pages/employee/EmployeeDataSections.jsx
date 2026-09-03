import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Award,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Filter,
  FolderLock,
  GraduationCap,
  Grid,
  Heart,
  List,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserRoundPen,
  Users,
  X,
} from "lucide-react";

import {
  buildEmployeeDropdownOptions,
  filterEmployeeDropdownOptions,
} from "../../lib/utils/employees/employeeDataDropdownOptions.js";
import {
  createEmptyEducationRecord,
  getEducationRecordFields,
  normalizeEducationRecordForLevel,
} from "../../lib/utils/employees/educationRecordFields.js";
import {
  deleteEmployeePreEmploymentRequirement,
  deleteEmployeeProfileDocument,
  deleteEmployeeRecruitmentDocument,
  fetchEmployeeDocumentFile,
  getEmployeeProfileDocuments,
  uploadEmployeePreEmploymentRequirement,
  uploadEmployeeProfileDocument,
} from "../../lib/axios/getEmployee.js";
import {
  PROFILE_DOCUMENT_ACCEPT,
  PROFILE_DOCUMENT_TYPES,
  formatProfileDocumentSize,
  isInlinePreviewSupported,
  validateProfileDocumentFile,
} from "../../lib/utils/employees/profileDocumentValidation.js";

const PIPELINE_STAGES = [
  "Sourcing",
  "Initial Screening",
  "Evaluation",
  "Final Interview",
  "Onboarding",
  "Completed",
];

function text(value) {
  return String(value ?? "").trim();
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return !["", "—", "-", "n/a", "null", "undefined"].includes(
    text(value).toLowerCase(),
  );
}

function toInputDate(value) {
  if (!value) return "";

  const rawValue = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return rawValue;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return rawValue.slice(0, 10);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}


function SectionHeader({ title, subtitle, icon: Icon, isEditing, onEdit }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E9F0FC] text-[#042C51]">
              <Icon size={16} />
            </span>
          )}
          <h2 className="break-words text-sm font-black text-[#042C51]">
            {title}
          </h2>
        </div>
        <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-400">
          {subtitle ||
            "Official record values are shown from the existing employee data source."}
        </p>
      </div>

      {!isEditing && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#E6ECF2] bg-white px-3 text-[11px] font-black text-[#042C51] transition hover:bg-slate-50"
        >
          <Edit3 size={13} className="text-[#FF5C28]" />
          Edit Section
        </button>
      )}
    </div>
  );
}

function Panel({ title, accent = "orange", children, className = "" }) {
  const dotClass = accent === "navy" ? "bg-[#042C51]" : "bg-[#FF5C28]";

  return (
    <section
      className={`rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 transition hover:border-slate-300 ${className}`}
    >
      {title && (
        <h3 className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-2.5 text-[11px] font-black uppercase tracking-wider text-[#042C51]">
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}

function ReadField({ label, value, mono = false, className = "" }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 text-left ${className}`}>
      <span className="block text-[10px] font-bold uppercase tracking-wide text-[#8EA3BF]">
        {label}
      </span>

      <div className="flex min-h-[40px] items-center rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2.5 transition-colors duration-150">
        <span
          className={`block min-w-0 break-words text-xs font-semibold leading-normal ${
            hasValue(value) ? "text-[#101828]" : "text-[#98A2B3]"
          } ${mono ? "font-mono" : ""}`}
        >
          {hasValue(value) ? value : "—"}
        </span>
      </div>
    </div>
  );
}

function AnimatedEmployeeDropdown({ open, children }) {
  return (
    <div
      className={`absolute left-0 right-0 top-[calc(100%+8px)] z-[9999] grid origin-top transition-all duration-200 ease-out ${
        open
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`origin-top overflow-hidden rounded-[10px] border border-[#D7DEE8] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] transition-all duration-200 ease-out ${
            open
              ? "translate-y-0 scale-100 opacity-100"
              : "-translate-y-2 scale-[0.98] opacity-0"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function EmployeeDataDropdown({
  id,
  value,
  onChange,
  options = [],
  placeholder = "Search options...",
  emptyLabel = "Choose option",
  includeEmptyOption = true,
  required = false,
}) {
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const optionRefs = useRef([]);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const normalizedValue = text(value);

  const normalizedOptions = useMemo(
    () =>
      buildEmployeeDropdownOptions(
        options,
        normalizedValue,
        emptyLabel,
        includeEmptyOption,
      ),
    [options, normalizedValue, emptyLabel, includeEmptyOption],
  );

  const filteredOptions = useMemo(
    () => filterEmployeeDropdownOptions(normalizedOptions, search),
    [normalizedOptions, search],
  );

  const selectedOption = normalizedOptions.find(
    (option) => option.value === normalizedValue,
  );

  const selectedLabel =
    selectedOption?.label ||
    (includeEmptyOption ? emptyLabel : normalizedValue || placeholder);

  const listboxId = `${id}-listbox`;
  const activeOptionId = filteredOptions[activeIndex]
    ? `${id}-option-${activeIndex}`
    : undefined;

  function closeDropdown() {
    setOpen(false);
    setSearch("");
    setActiveIndex(0);
  }

  function openDropdown() {
    setOpen(true);
    setSearch("");
  }

  function selectOption(option) {
    onChange?.(option?.value ?? "");
    closeDropdown();
  }

  useEffect(() => {
    if (!open) return undefined;

    function handleOutsidePointer(event) {
      if (!rootRef.current?.contains(event.target)) {
        closeDropdown();
      }
    }

    document.addEventListener("mousedown", handleOutsidePointer);
    document.addEventListener("touchstart", handleOutsidePointer, {
      passive: true,
    });

    return () => {
      document.removeEventListener("mousedown", handleOutsidePointer);
      document.removeEventListener("touchstart", handleOutsidePointer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const selectedIndex = filteredOptions.findIndex(
      (option) => option.value === normalizedValue,
    );

    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, search, filteredOptions, normalizedValue]);

  useEffect(() => {
    if (!open) return;

    optionRefs.current[activeIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [activeIndex, open]);

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        closeDropdown();
      }
      return;
    }

    if (event.key === "Tab") {
      if (open) closeDropdown();
      return;
    }

    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
        event.preventDefault();
        openDropdown();
      }
      return;
    }

    if (filteredOptions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        current >= filteredOptions.length - 1 ? 0 : current + 1,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        current <= 0 ? filteredOptions.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(filteredOptions.length - 1);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      selectOption(filteredOptions[activeIndex]);
    }
  }

  const hasMatchingValueOptions = filteredOptions.some(
    (option) => !option.isEmpty,
  );

  return (
    <div
      ref={rootRef}
      className={`relative w-full overflow-visible ${open ? "z-[90]" : "z-0"}`}
    >
      <div className="relative overflow-visible">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-activedescendant={open ? activeOptionId : undefined}
          aria-autocomplete="list"
          aria-required={required || undefined}
          autoComplete="off"
          value={open ? search : selectedLabel}
          onChange={(event) => {
            setSearch(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (!open) openDropdown();
          }}
          onClick={() => {
            if (!open) openDropdown();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`h-11 w-full rounded-[10px] border bg-white px-4 pr-11 text-sm font-bold text-[#344054] outline-none transition placeholder:text-[#98A2B3] hover:bg-[#FFFDFC] ${
            open
              ? "border-[#FF5C28] ring-4 ring-[#FF5C28]/10"
              : "border-[#D0D5DD] hover:border-[#FF5C28]/40"
          }`}
        />

        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => (open ? closeDropdown() : openDropdown())}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#667085] transition hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
          aria-label={open ? "Close options" : "Open options"}
        >
          <ChevronDown
            size={18}
            className={`transition-transform duration-300 ease-out ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      <AnimatedEmployeeDropdown open={open}>
        <div
          id={listboxId}
          role="listbox"
          aria-label="Available options"
          className="max-h-64 overflow-y-auto py-1 sibs-scrollbar"
        >
          {filteredOptions.map((option, index) => {
            const selected = option.value === normalizedValue;
            const active = index === activeIndex;

            return (
              <button
                key={`${id}-${option.value || "empty"}-${index}`}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                id={`${id}-option-${index}`}
                type="button"
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectOption(option)}
                className={`flex min-h-[44px] w-full items-center px-4 text-left text-sm transition-colors duration-150 ${
                  selected
                    ? "bg-[#FFF0EB] font-extrabold text-[#FF5C28]"
                    : active
                      ? "bg-[#FFF7F3] font-bold text-[#FF5C28]"
                      : "bg-white font-semibold text-[#475467] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                }`}
              >
                <span className="block min-w-0 flex-1 truncate">
                  {option.label}
                </span>
              </button>
            );
          })}

          {!hasMatchingValueOptions && text(search) && (
            <div className="px-4 py-4 text-sm font-semibold text-[#98A2B3]">
              No options found.
            </div>
          )}
        </div>
      </AnimatedEmployeeDropdown>
    </div>
  );
}

function FieldControl({
  label,
  value,
  onChange,
  type = "text",
  options = [],
  required = false,
  rows = 3,
  placeholder = "",
  className = "",
}) {
  const generatedId = useId();
  const controlId = `employee-field-${generatedId.replace(/:/g, "")}`;

  const common =
    "w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#101828] outline-none transition-all duration-150 placeholder:text-[#98A2B3] hover:border-[#C9D6E4] focus:border-[#042C51] focus:bg-white focus:ring-2 focus:ring-[#042C51]/10";

  return (
    <div className={`block min-w-0 overflow-visible ${className}`}>
      <label
        htmlFor={controlId}
        className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#8EA3BF]"
      >
        {label} {required ? "*" : ""}
      </label>

      {type === "textarea" ? (
        <textarea
          id={controlId}
          rows={rows}
          value={value || ""}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          required={required}
          className={`${common} min-h-[80px] resize-y px-3 py-2.5`}
        />
      ) : type === "select" ? (
        <EmployeeDataDropdown
          id={controlId}
          value={value}
          onChange={onChange}
          options={options}
          placeholder={placeholder || "Search options..."}
          emptyLabel="Choose option"
          includeEmptyOption
          required={required}
        />
      ) : (
        <input
          id={controlId}
          type={type}
          value={value || ""}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          required={required}
          className={`${common} h-10`}
        />
      )}
    </div>
  );
}

function EmptyState({ message, actionLabel, onAction }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-[#F8FAFC] px-5 py-10 text-center">
      <p className="text-xs font-semibold text-slate-400">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 text-xs font-black text-[#042C51] hover:text-[#FF5C28]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function SaveBar({ label, onCancel, onSave, isSaving = false }) {
  return (
    <div className="sticky bottom-3 z-40 mt-6 flex flex-col gap-3 rounded-xl border border-[#E6ECF2] bg-white/95 px-4 py-3 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        <span className="text-[11px] font-black text-[#042C51]">
          {isSaving ? `Saving: ${label}` : `Modified draft: ${label}`}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="h-8 flex-1 rounded-lg bg-slate-100 px-3 text-[11px] font-black text-[#667085] transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#042C51] px-4 text-[11px] font-black text-white transition hover:bg-[#063560] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
        >
          <Save size={13} className="text-[#FF5C28]" />
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function CopyButton({ value, copyKey, copiedKey, onCopy }) {
  if (!value) return null;
  return (
    <button
      type="button"
      onClick={() => onCopy(value, copyKey)}
      className="rounded-lg p-1.5 text-[#667085] hover:bg-white hover:text-[#042C51]"
      title="Copy value"
    >
      {copiedKey === copyKey ? (
        <Check size={15} className="text-emerald-600" />
      ) : (
        <Copy size={15} />
      )}
    </button>
  );
}

export function PersonalSection({
  employee,
  selectedSubTab,
  isEditing,
  isSaving,
  onEdit,
  onChange,
  onSave,
  onCancel,
}) {
  const [copiedKey, setCopiedKey] = useState("");
  const [masked, setMasked] = useState({
    gsis: true,
    sss: true,
    phic: true,
    hdmf: true,
    tin: true,
  });

  function copyValue(value, key) {
    if (!value) return;
    navigator.clipboard?.writeText(String(value));
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(""), 1400);
  }

  function maskedValue(value, shouldMask) {
    const normalized = text(value);
    if (!normalized) return "—";
    if (!shouldMask) return normalized;
    const visible = normalized.slice(-4);
    return `${"•".repeat(Math.max(normalized.length - 4, 4))}${visible}`;
  }

  const titleBySubTab = {
    basic: "Basic Identity Information",
    contact: "Contact Information",
    address: "Registered Addresses & Work Environment",
    ids: "Government Registrations",
  };
  const title = titleBySubTab[selectedSubTab] || titleBySubTab.basic;

  return (
    <div>
      {selectedSubTab === "basic" && (
        isEditing ? (
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <ReadField
              label="First Name (Kronos - Read Only)"
              value={employee?.firstName}
            />
            <ReadField
              label="Middle Name (Kronos - Read Only)"
              value={employee?.middleName}
            />
            <ReadField
              label="Last Name (Kronos - Read Only)"
              value={employee?.lastName}
            />
            <ReadField
              label="Name Extension (Jr/III) (Kronos - Read Only)"
              value={employee?.nameExtension}
            />
            <FieldControl
              label="Preferred Name"
              value={employee?.preferredName}
              onChange={(value) => onChange("preferredName", value)}
            />
            <FieldControl
              label="Birth Date"
              type="date"
              value={toInputDate(employee?.birthdate)}
              onChange={(value) => onChange("birthdate", value)}
              required
            />
            <FieldControl
              label="Place of Birth"
              value={employee?.placeOfBirth}
              onChange={(value) => onChange("placeOfBirth", value)}
            />
            <FieldControl
              label="Gender"
              type="select"
              options={["Male", "Female", "Non-binary", "Prefer not to say"]}
              value={employee?.gender}
              onChange={(value) => onChange("gender", value)}
            />
            <FieldControl
              label="Civil Status"
              type="select"
              options={["Single", "Married", "Separated", "Widowed"]}
              value={employee?.civilStatus}
              onChange={(value) => onChange("civilStatus", value)}
            />
            <FieldControl
              label="Citizenship"
              value={employee?.citizenship}
              onChange={(value) => onChange("citizenship", value)}
            />
            <FieldControl
              label="Blood Type"
              type="select"
              options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
              value={employee?.bloodType}
              onChange={(value) => onChange("bloodType", value)}
            />
            <FieldControl
              label="Height"
              value={employee?.height}
              onChange={(value) => onChange("height", value)}
              placeholder="178 cm"
            />
            <FieldControl
              label="Weight"
              value={employee?.weight}
              onChange={(value) => onChange("weight", value)}
              placeholder="74 kg"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <ReadField label="First Name" value={employee?.firstName} />
            <ReadField label="Middle Name" value={employee?.middleName} />
            <ReadField label="Last Name" value={employee?.lastName} />
            <ReadField label="Name Extension (Jr/III)" value={employee?.nameExtension} />
            <ReadField label="Preferred Name" value={employee?.preferredName} />
            <ReadField label="Birth Date" value={toInputDate(employee?.birthdate)} />
            <ReadField label="Place of Birth" value={employee?.placeOfBirth} />
            <ReadField label="Gender" value={employee?.gender} />
            <ReadField label="Civil Status" value={employee?.civilStatus} />
            <ReadField label="Citizenship" value={employee?.citizenship} />
            <ReadField label="Blood Type" value={employee?.bloodType} />
            <ReadField label="Height" value={employee?.height} />
            <ReadField label="Weight" value={employee?.weight} />
          </div>
        )
      )}

      {selectedSubTab === "contact" && (
        isEditing ? (
          <Panel title="Modify Contact Details">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FieldControl label="Email" type="email" value={employee?.email} onChange={(v) => onChange("email", v)} required />
              <FieldControl label="Mobile Number" value={employee?.contact} onChange={(v) => onChange("contact", v)} required />
              <FieldControl label="Telephone" value={employee?.telephone} onChange={(v) => onChange("telephone", v)} />
            </div>
          </Panel>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { label: "Corporate Email", value: employee?.email, icon: Mail, key: "email", tone: "bg-blue-50 text-blue-600" },
              { label: "Mobile Number", value: employee?.contact, icon: Phone, key: "mobile", tone: "bg-emerald-50 text-emerald-600" },
              { label: "Telephone", value: employee?.telephone, icon: Building2, key: "telephone", tone: "bg-orange-50 text-[#FF5C28]" },
            ].map((item) => (
              <Panel key={item.key}>
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.tone}`}>
                    <item.icon size={19} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">{item.label}</p>
                    <p className="text-xs font-semibold text-[#52637A]">Primary contact channel</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-[#F3F6FA] px-3 py-3">
                  <span className={`min-w-0 break-all text-sm font-extrabold ${hasValue(item.value) ? "text-[#344054]" : "italic text-[#98A2B3]"}`}>
                    {hasValue(item.value) ? item.value : "—"}
                  </span>
                  <CopyButton value={item.value} copyKey={item.key} copiedKey={copiedKey} onCopy={copyValue} />
                </div>
              </Panel>
            ))}
          </div>
        )
      )}

      {selectedSubTab === "address" && (
        isEditing ? (
          <Panel title="Update Address Details">
            <div className="space-y-4">
              <FieldControl label="Residential Address" type="textarea" rows={3} value={employee?.residentialAddress} onChange={(v) => onChange("residentialAddress", v)} required />
              <FieldControl label="Permanent Address" type="textarea" rows={3} value={employee?.permanentAddress} onChange={(v) => onChange("permanentAddress", v)} required />
              <FieldControl label="Work Setup" type="select" options={["Hybrid", "WFH", "On-site", "Onsite"]} value={employee?.workSetup} onChange={(v) => onChange("workSetup", v)} className="max-w-sm" />
            </div>
          </Panel>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {[
                ["Residential Address", employee?.residentialAddress, "orange"],
                ["Permanent Address", employee?.permanentAddress, "navy"],
              ].map(([label, value, accent]) => (
                <Panel key={label} title={label} accent={accent}>
                  <p className={`min-h-24 rounded-xl bg-[#F8FAFC] p-4 text-sm font-bold leading-6 ${hasValue(value) ? "text-[#344054]" : "italic text-[#98A2B3]"}`}>
                    {hasValue(value) ? value : "—"}
                  </p>
                </Panel>
              ))}
            </div>
            <Panel>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Building2 size={23} />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#042C51]">Active Work Arrangement</h3>
                    <p className="mt-0.5 text-xs font-medium text-[#667085]">Current corporate work setup assignment.</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-[#E9F0FC] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
                  <span className="h-2 w-2 rounded-full bg-[#FF5C28]" />
                  {employee?.workSetup || "—"}
                </span>
              </div>
            </Panel>
          </div>
        )
      )}

      {selectedSubTab === "ids" && (
        isEditing ? (
          <Panel title="Modify Regulatory IDs">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FieldControl label="GSIS" value={employee?.gsis} onChange={(v) => onChange("gsis", v)} />
              <FieldControl label="SSS" value={employee?.sss} onChange={(v) => onChange("sss", v)} />
              <FieldControl label="PhilHealth" value={employee?.phic} onChange={(v) => onChange("phic", v)} />
              <FieldControl label="PAG-IBIG / HDMF" value={employee?.hdmf} onChange={(v) => onChange("hdmf", v)} />
              <FieldControl label="TIN" value={employee?.tin} onChange={(v) => onChange("tin", v)} className="md:col-span-2" />
            </div>
          </Panel>
        ) : (
          <Panel>
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-semibold leading-5 text-amber-800">
              <Lock size={16} className="mt-0.5 shrink-0 text-amber-600" />
              Regulatory data is masked by default. Reveal or copy only when authorized.
            </div>
            <div className="divide-y divide-[#E6ECF2]">
              {[
                ["gsis", "GSIS", employee?.gsis],
                ["sss", "Social Security System (SSS)", employee?.sss],
                ["phic", "PhilHealth", employee?.phic],
                ["hdmf", "PAG-IBIG / HDMF", employee?.hdmf],
                ["tin", "Tax Identification Number (TIN)", employee?.tin],
              ].map(([key, label, value]) => (
                <div key={key} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">{label}</p>
                    <p className="mt-1 font-mono text-sm font-extrabold text-[#344054]">{maskedValue(value, masked[key])}</p>
                  </div>
                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <button type="button" onClick={() => setMasked((current) => ({ ...current, [key]: !current[key] }))} className="rounded-xl p-2 text-[#667085] hover:bg-[#F3F6FA] hover:text-[#042C51]" title={masked[key] ? "Reveal ID" : "Hide ID"}>
                      {masked[key] ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <CopyButton value={value} copyKey={key} copiedKey={copiedKey} onCopy={copyValue} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )
      )}

      {isEditing && <SaveBar label={title} onCancel={onCancel} onSave={onSave} isSaving={isSaving} />}
    </div>
  );
}

function calculateAge(value) {
  if (!value) return "—";
  const dateKey = toInputDate(value);
  const [year, month, day] = dateKey.split("-").map(Number);
  const birth = new Date(year, month - 1, day);
  if (Number.isNaN(birth.getTime())) return "—";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDifference = today.getMonth() - birth.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) age -= 1;
  return `${Math.max(age, 0)} yrs old`;
}

export function FamilySection({
  employee,
  selectedSubTab,
  isEditing,
  isSaving,
  onEdit,
  onChange,
  onListChange,
  onSave,
  onCancel,
}) {
  const titleMap = {
    spouse: ["Spouse Information", "Official spouse and employment declarations.", Heart],
    parents: ["Parents Declaration", "Official father and mother details.", Users],
    children: ["Children Registered Records", "Dependent children records for benefits and tax allocations.", Sparkles],
    emergency: ["Emergency Contact Person", "Critical next-of-kin contact information.", ShieldAlert],
  };
  const [title, subtitle, Icon] = titleMap[selectedSubTab] || titleMap.spouse;
  const children = Array.isArray(employee?.children) ? employee.children : [];

  function updateChild(index, field, value) {
    onListChange(
      "children",
      children.map((child, childIndex) =>
        childIndex === index ? { ...child, [field]: value } : child,
      ),
    );
  }

  return (
    <div className="rounded-[20px] border border-[#D6E0EA] bg-white p-4 shadow-sm sm:p-6">
      <SectionHeader title={title} subtitle={subtitle} icon={Icon} isEditing={isEditing} onEdit={onEdit} />

      {selectedSubTab === "spouse" && (
        isEditing ? (
          <Panel title="Modify Spouse Details">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FieldControl label="Surname" value={employee?.spouseSurname} onChange={(v) => onChange("spouseSurname", v)} />
              <FieldControl label="First Name" value={employee?.spouseFirstName} onChange={(v) => onChange("spouseFirstName", v)} />
              <FieldControl label="Middle Name" value={employee?.spouseMiddleName} onChange={(v) => onChange("spouseMiddleName", v)} />
              <FieldControl label="Occupation" value={employee?.spouseOccupation} onChange={(v) => onChange("spouseOccupation", v)} />
              <FieldControl label="Employer / Business" value={employee?.spouseEmployer} onChange={(v) => onChange("spouseEmployer", v)} />
              <FieldControl label="Telephone" value={employee?.spouseTelephone} onChange={(v) => onChange("spouseTelephone", v)} />
              <FieldControl label="Business Address" type="textarea" value={employee?.spouseBusinessAddress} onChange={(v) => onChange("spouseBusinessAddress", v)} className="md:col-span-3" />
            </div>
          </Panel>
        ) : (
          <Panel>
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              <ReadField label="Surname" value={employee?.spouseSurname} />
              <ReadField label="First Name" value={employee?.spouseFirstName} />
              <ReadField label="Middle Name" value={employee?.spouseMiddleName} />
              <ReadField label="Occupation" value={employee?.spouseOccupation} />
              <ReadField label="Employer / Business" value={employee?.spouseEmployer} />
              <ReadField label="Telephone" value={employee?.spouseTelephone} />
              <ReadField label="Business Address" value={employee?.spouseBusinessAddress} className="sm:col-span-2 lg:col-span-3" />
            </div>
          </Panel>
        )
      )}

      {selectedSubTab === "parents" && (
        isEditing ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Panel title="Father's Name Information" accent="navy">
              <div className="space-y-4">
                <FieldControl label="Surname" value={employee?.fatherSurname} onChange={(v) => onChange("fatherSurname", v)} />
                <FieldControl label="First Name" value={employee?.fatherFirstName} onChange={(v) => onChange("fatherFirstName", v)} />
                <FieldControl label="Middle Name" value={employee?.fatherMiddleName} onChange={(v) => onChange("fatherMiddleName", v)} />
              </div>
            </Panel>
            <Panel title="Mother's Maiden Name Information">
              <div className="space-y-4">
                <FieldControl label="Maiden Surname" value={employee?.motherMaidenSurname} onChange={(v) => onChange("motherMaidenSurname", v)} />
                <FieldControl label="First Name" value={employee?.motherFirstName} onChange={(v) => onChange("motherFirstName", v)} />
                <FieldControl label="Middle Name" value={employee?.motherMiddleName} onChange={(v) => onChange("motherMiddleName", v)} />
              </div>
            </Panel>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Panel title="Father's Details" accent="navy">
              <div className="space-y-5">
                <ReadField label="Surname" value={employee?.fatherSurname} />
                <ReadField label="First Name" value={employee?.fatherFirstName} />
                <ReadField label="Middle Name" value={employee?.fatherMiddleName} />
              </div>
            </Panel>
            <Panel title="Mother's Details (Maiden Name)">
              <div className="space-y-5">
                <ReadField label="Maiden Surname" value={employee?.motherMaidenSurname} />
                <ReadField label="First Name" value={employee?.motherFirstName} />
                <ReadField label="Middle Name" value={employee?.motherMiddleName} />
              </div>
            </Panel>
          </div>
        )
      )}

      {selectedSubTab === "children" && (
        isEditing ? (
          <Panel title={`Children Dependents (${children.length})`}>
            <div className="mb-4 flex justify-end">
              <button type="button" onClick={() => onListChange("children", [...children, { id: `child_${Date.now()}`, name: "", birthDate: "" }])} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white">
                <Plus size={14} /> Add Dependent
              </button>
            </div>
            {children.length === 0 ? (
              <EmptyState message="No children records. Add a dependent to begin." />
            ) : (
              <div className="space-y-4">
                {children.map((child, index) => (
                  <div key={child?.id || index} className="grid grid-cols-1 gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
                    <FieldControl label="Child's Full Name" value={child?.name} onChange={(v) => updateChild(index, "name", v)} required />
                    <FieldControl label="Birth Date" type="date" value={toInputDate(child?.birthDate)} onChange={(v) => updateChild(index, "birthDate", v)} required />
                    <button type="button" onClick={() => onListChange("children", children.filter((_, childIndex) => childIndex !== index))} className="flex h-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 px-3 text-red-600 hover:bg-red-100" title="Remove child">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        ) : (
          <Panel>
            {children.length === 0 ? (
              <EmptyState message="No children registered." actionLabel="Register a dependent child" onAction={onEdit} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E6ECF2] bg-[#F8FAFC] text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
                      <th className="rounded-l-xl px-4 py-3">Child's Complete Name</th>
                      <th className="px-4 py-3">Birth Date</th>
                      <th className="rounded-r-xl px-4 py-3">Calculated Age</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6ECF2]">
                    {children.map((child, index) => (
                      <tr key={child?.id || index}>
                        <td className="px-4 py-4 font-extrabold text-[#344054]">{child?.name || "—"}</td>
                        <td className="px-4 py-4 font-semibold text-[#667085]">{formatDate(child?.birthDate)}</td>
                        <td className="px-4 py-4"><span className="rounded-full bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold text-[#042C51]">{calculateAge(child?.birthDate)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        )
      )}

      {selectedSubTab === "emergency" && (
        isEditing ? (
          <Panel title="Modify Emergency Contact">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldControl label="Name" value={employee?.emergencyName} onChange={(v) => onChange("emergencyName", v)} required />
              <FieldControl label="Relationship" value={employee?.emergencyRelationship} onChange={(v) => onChange("emergencyRelationship", v)} required />
              <FieldControl label="Phone Number" value={employee?.emergencyPhone} onChange={(v) => onChange("emergencyPhone", v)} required />
              <FieldControl label="Email" type="email" value={employee?.emergencyEmail} onChange={(v) => onChange("emergencyEmail", v)} />
            </div>
          </Panel>
        ) : (
          <Panel className="max-w-2xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-red-100 bg-red-50 text-lg font-extrabold text-red-600">
                {text(employee?.emergencyName).slice(0, 2).toUpperCase() || "EC"}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-extrabold text-[#042C51]">{employee?.emergencyName || "—"}</h3>
                <span className="mt-1 inline-flex rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-red-700">{employee?.emergencyRelationship || "Emergency Contact"}</span>
                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[#E6ECF2] pt-4 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#344054]"><Phone size={15} className="text-[#667085]" />{employee?.emergencyPhone || "—"}</div>
                  <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-[#52637A]"><Mail size={15} className="shrink-0 text-[#667085]" /><span className="truncate">{employee?.emergencyEmail || "—"}</span></div>
                </div>
              </div>
            </div>
          </Panel>
        )
      )}

      {isEditing && <SaveBar label={title} onCancel={onCancel} onSave={onSave} isSaving={isSaving} />}
    </div>
  );
}

const RECORD_SCHEMAS = {
  education: {
    title: "Education Chronological Records",
    subtitle: "Comprehensive academic qualifications and school history.",
    icon: GraduationCap,
    listKey: "education",
    addLabel: "Add Education Record",
    empty: "No education records found.",
    newRecord: createEmptyEducationRecord(),
    fields: getEducationRecordFields("Elementary"),
    getFields: getEducationRecordFields,
    normalizeRecord: normalizeEducationRecordForLevel,
  },
  eligibility: {
    title: "Eligibility Chronological Records",
    subtitle: "Professional licenses, examination ratings, and validity records.",
    icon: BadgeCheck,
    listKey: "eligibility",
    addLabel: "Add Eligibility Record",
    empty: "No eligibility or license records found.",
    newRecord: { title: "", rating: "", examDate: "", examPlace: "", licenseNumber: "", validityDate: "" },
    fields: [
      ["title", "Eligibility / License"],
      ["rating", "Rating"],
      ["examDate", "Date of Exam / Conferment", "date"],
      ["examPlace", "Place of Exam / Conferment"],
      ["licenseNumber", "License Number"],
      ["validityDate", "Validity Date", "date"],
    ],
  },
  experience: {
    title: "Experience Chronological Records",
    subtitle: "Previous corporate engagements, roles, compensation, and duties.",
    icon: Briefcase,
    listKey: "experience",
    addLabel: "Add Experience Record",
    empty: "No work experience records found.",
    newRecord: { from: "", to: "", position: "", company: "", salary: "", salaryGrade: "", appointmentStatus: "", governmentService: "No", duties: "" },
    fields: [
      ["from", "From", "month"],
      ["to", "To", "month"],
      ["position", "Position Title"],
      ["company", "Company / Office"],
      ["salary", "Monthly Salary"],
      ["salaryGrade", "Salary / Job Grade"],
      ["appointmentStatus", "Status of Appointment"],
      ["governmentService", "Government Service Y/N", "select", ["Yes", "No"]],
      ["duties", "Duties", "textarea"],
    ],
  },
  training: {
    title: "Training Chronological Records",
    subtitle: "Learning and development programs, hours, and sponsors.",
    icon: Award,
    listKey: "trainings",
    addLabel: "Add Training Record",
    empty: "No training records found.",
    newRecord: { title: "", from: "", to: "", hours: "", type: "", conductedBy: "" },
    fields: [
      ["title", "Training Title"],
      ["from", "From", "date"],
      ["to", "To", "date"],
      ["hours", "Number of Hours"],
      ["type", "Type of LD"],
      ["conductedBy", "Conducted / Sponsored By"],
    ],
  },
  references: {
    title: "References Chronological Records",
    subtitle: "Professional and character references for background verification.",
    icon: UserCheck,
    listKey: "references",
    addLabel: "Add Reference",
    empty: "No references found.",
    newRecord: { name: "", address: "", telephone: "" },
    fields: [
      ["name", "Name"],
      ["address", "Address"],
      ["telephone", "Telephone Number"],
    ],
  },
};

function normalizeRecordValue(record, keys) {
  for (const key of keys) {
    if (hasValue(record?.[key])) return record[key];
  }
  return "";
}

function licenseStatus(value) {
  if (!value) return ["No Expiry", "bg-slate-50 text-slate-600 border-slate-200"];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return ["Review", "bg-amber-50 text-amber-700 border-amber-200"];
  const now = new Date();
  const soon = new Date();
  soon.setMonth(soon.getMonth() + 6);
  if (date < now) return ["Expired", "bg-red-50 text-red-700 border-red-200"];
  if (date <= soon) return ["Expiring Soon", "bg-amber-50 text-amber-700 border-amber-200"];
  return ["Valid", "bg-emerald-50 text-emerald-700 border-emerald-200"];
}

function GenericRecordEditor({ schema, records, onChange }) {
  function addRecord() {
    onChange([...records, { ...schema.newRecord, id: `${schema.listKey}_${Date.now()}` }]);
  }

  function updateRecord(index, field, value) {
    onChange(
      records.map((record, recordIndex) => {
        if (recordIndex !== index) return record;

        const nextRecord = { ...record, [field]: value };
        return schema.normalizeRecord
          ? schema.normalizeRecord(nextRecord)
          : nextRecord;
      }),
    );
  }

  function removeRecord(index) {
    onChange(records.filter((_, recordIndex) => recordIndex !== index));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={addRecord} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white">
          <Plus size={14} /> {schema.addLabel}
        </button>
      </div>

      {records.length === 0 ? (
        <EmptyState message={schema.empty} actionLabel={schema.addLabel} onAction={addRecord} />
      ) : (
        records.map((record, index) => (
          <Panel key={record?.id || index} title={`${schema.title.replace(" Chronological Records", "")} #${index + 1}`} accent={index % 2 ? "navy" : "orange"}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(schema.getFields ? schema.getFields(record?.level) : schema.fields).map(([field, label, type = "text", options = []]) => (
                <FieldControl
                  key={field}
                  label={label}
                  type={type}
                  options={options}
                  value={type === "date" ? toInputDate(record?.[field]) : record?.[field]}
                  onChange={(value) => updateRecord(index, field, value)}
                  className={type === "textarea" ? "md:col-span-2 xl:col-span-3" : ""}
                />
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={() => removeRecord(index)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-extrabold text-red-600 hover:bg-red-100">
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </Panel>
        ))
      )}
    </div>
  );
}

export function TimelineSection({
  employee,
  activeSection,
  isEditing,
  isSaving,
  onEdit,
  onListChange,
  onSave,
  onCancel,
}) {
  const schema = RECORD_SCHEMAS[activeSection] || RECORD_SCHEMAS.education;
  const records = Array.isArray(employee?.[schema.listKey]) ? employee[schema.listKey] : [];
  const [expanded, setExpanded] = useState({});

  return (
    <div className="rounded-[20px] border border-[#D6E0EA] bg-white p-4 shadow-sm sm:p-6">
      <SectionHeader title={schema.title} subtitle={schema.subtitle} icon={schema.icon} isEditing={isEditing} onEdit={onEdit} />

      {isEditing ? (
        <GenericRecordEditor schema={schema} records={records} onChange={(next) => onListChange(schema.listKey, next)} />
      ) : activeSection === "education" ? (
        <div className="relative ml-3 space-y-5 border-l-2 border-slate-200 pl-6">
          {records.length === 0 ? <EmptyState message={schema.empty} actionLabel={schema.addLabel} onAction={onEdit} /> : records.map((record, index) => {
            const normalizedRecord = normalizeEducationRecordForLevel(record);
            const level = normalizedRecord.level;
            const displayFields = getEducationRecordFields(level).filter(
              ([field]) => field !== "level",
            );
            const heading =
              normalizedRecord.degree ||
              normalizedRecord.school ||
              "Education Record";

            return (
              <article key={record?.id || index} className="relative rounded-2xl border border-[#D6E0EA] bg-white p-5 shadow-sm">
                <span className="absolute -left-[33px] top-6 h-4 w-4 rounded-full border-4 border-white bg-[#042C51] shadow" />
                <div>
                  <span className="rounded-full border border-blue-100 bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#042C51]">
                    {level || "Education"}
                  </span>
                  <h3 className="mt-3 text-sm font-extrabold text-[#042C51]">
                    {heading}
                  </h3>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {displayFields.map(([field, label]) => (
                    <ReadField
                      key={field}
                      label={label}
                      value={normalizedRecord?.[field]}
                      className={field === "address" ? "sm:col-span-2" : ""}
                    />
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      ) : activeSection === "eligibility" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {records.length === 0 ? <div className="lg:col-span-2"><EmptyState message={schema.empty} actionLabel={schema.addLabel} onAction={onEdit} /></div> : records.map((record, index) => {
            const [status, statusClass] = licenseStatus(record?.validityDate);
            return (
              <Panel key={record?.id || index}>
                <div className="flex items-start justify-between gap-3 border-b border-[#E6ECF2] pb-3">
                  <div className="min-w-0">
                    <h3 className="break-words text-xs font-extrabold uppercase tracking-wide text-[#042C51]">{normalizeRecordValue(record, ["title", "eligibilityLicense"]) || "Eligibility / License"}</h3>
                    <p className="mt-1 font-mono text-[10px] text-[#667085]">License: {record?.licenseNumber || "—"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide ${statusClass}`}>{status}</span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ReadField label="Rating" value={record?.rating} />
                  <ReadField label="Validity Date" value={formatDate(record?.validityDate)} />
                  <ReadField label="Date of Exam / Conferment" value={formatDate(normalizeRecordValue(record, ["examDate", "dateOfExam"]))} />
                  <ReadField label="Place of Exam / Conferment" value={normalizeRecordValue(record, ["examPlace", "placeOfExam"])} />
                </div>
              </Panel>
            );
          })}
        </div>
      ) : activeSection === "experience" ? (
        <div className="relative ml-3 space-y-5 border-l-2 border-slate-200 pl-6">
          {records.length === 0 ? <EmptyState message={schema.empty} actionLabel={schema.addLabel} onAction={onEdit} /> : records.map((record, index) => {
            const position = normalizeRecordValue(record, ["position", "positionTitle"]);
            const company = normalizeRecordValue(record, ["company", "companyOffice"]);
            const isOpen = expanded[index];
            return (
              <article key={record?.id || index} className="relative rounded-2xl border border-[#D6E0EA] bg-white p-5 shadow-sm">
                <span className="absolute -left-[33px] top-6 h-4 w-4 rounded-full border-4 border-white bg-indigo-600 shadow" />
                <div className="flex flex-col gap-3 border-b border-[#E6ECF2] pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#042C51]">{position || "—"}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#52637A]"><Building2 size={14} />{company || "—"}</p>
                  </div>
                  <span className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-[10px] font-extrabold text-indigo-700">{record?.from || "—"} — {record?.to || "Present"}</span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <ReadField label="Monthly Salary" value={normalizeRecordValue(record, ["salary", "monthlySalary"])} />
                  <ReadField label="Salary / Job Grade" value={normalizeRecordValue(record, ["salaryGrade", "salaryJobGrade"])} />
                  <ReadField label="Government Service" value={record?.governmentService} />
                </div>
                {record?.duties && (
                  <div className="mt-4 border-t border-[#E6ECF2] pt-3">
                    <button type="button" onClick={() => setExpanded((current) => ({ ...current, [index]: !current[index] }))} className="inline-flex items-center gap-2 text-[11px] font-extrabold text-[#042C51] hover:text-[#FF5C28]">
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {isOpen ? "Collapse Duties" : "Expand Duties & Responsibilities"}
                    </button>
                    {isOpen && <p className="mt-3 rounded-xl bg-[#F8FAFC] p-4 text-xs font-medium leading-6 text-[#52637A]">{record.duties}</p>}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : activeSection === "training" ? (
        <div className="space-y-5">
          {records.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Panel><p className="text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">Total Programs</p><p className="mt-1 text-2xl font-extrabold text-[#042C51]">{records.length}</p></Panel>
              <Panel><p className="text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">Total LD Hours</p><p className="mt-1 text-2xl font-extrabold text-[#FF5C28]">{records.reduce((sum, item) => sum + (Number(item?.hours || item?.hoursNumber) || 0), 0)}</p></Panel>
              <Panel><p className="text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">Latest Training</p><p className="mt-1 truncate text-sm font-extrabold text-[#344054]">{normalizeRecordValue(records[0], ["title", "trainingTitle"]) || "—"}</p></Panel>
            </div>
          )}
          {records.length === 0 ? <EmptyState message={schema.empty} actionLabel={schema.addLabel} onAction={onEdit} /> : records.map((record, index) => (
            <Panel key={record?.id || index}>
              <div className="flex flex-col gap-3 border-b border-[#E6ECF2] pb-3 sm:flex-row sm:items-start sm:justify-between">
                <div><h3 className="text-sm font-extrabold text-[#042C51]">{normalizeRecordValue(record, ["title", "trainingTitle"]) || "—"}</h3><p className="mt-1 text-xs font-semibold text-[#667085]">Conducted by <strong className="text-[#344054]">{record?.conductedBy || "—"}</strong></p></div>
                <div className="text-right"><span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[10px] font-extrabold text-sky-700">{normalizeRecordValue(record, ["type", "typeOfLD"]) || "Learning & Development"}</span><p className="mt-2 font-mono text-[10px] font-bold text-[#667085]">{normalizeRecordValue(record, ["hours", "hoursNumber"]) || "0"} hours</p></div>
              </div>
              <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#F3F6FA] px-3 py-2 text-[11px] font-bold text-[#344054]"><CalendarDays size={14} className="text-[#FF5C28]" />{formatDate(record?.from)} to {formatDate(record?.to)}</p>
            </Panel>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {records.length === 0 ? <div className="lg:col-span-2"><EmptyState message={schema.empty} actionLabel={schema.addLabel} onAction={onEdit} /></div> : records.map((record, index) => (
            <Panel key={record?.id || index}>
              <h3 className="border-b border-[#E6ECF2] pb-3 text-sm font-extrabold text-[#042C51]">{record?.name || "—"}</h3>
              <div className="mt-4 space-y-3 text-xs text-[#52637A]"><p className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0" />{record?.address || "—"}</p><p className="flex items-center gap-2"><Phone size={14} />{normalizeRecordValue(record, ["telephone", "telephoneNumber"]) || "—"}</p></div>
            </Panel>
          ))}
        </div>
      )}

      {isEditing && <SaveBar label={schema.title} onCancel={onCancel} onSave={onSave} isSaving={isSaving} />}
    </div>
  );
}

function StringListEditor({ items, placeholder, addLabel, onChange }) {
  const [draft, setDraft] = useState("");

  function addItem(event) {
    event.preventDefault();
    const next = text(draft);
    if (!next || items.includes(next)) return;
    onChange([...items, next]);
    setDraft("");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addItem} className="flex flex-col gap-2 sm:flex-row">
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={placeholder} className="h-10 flex-1 rounded-xl border border-[#D0D5DD] bg-[#F8FAFC] px-3 text-xs font-semibold outline-none focus:border-[#042C51] focus:bg-white" />
        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white"><Plus size={14} />{addLabel}</button>
      </form>
      <div className="flex flex-wrap gap-2 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
        {items.length === 0 ? <p className="text-xs font-semibold text-[#98A2B3]">No entries added.</p> : items.map((item, index) => (
          <span key={`${item}-${index}`} className="inline-flex max-w-full items-center gap-2 rounded-xl border border-[#D6E0EA] bg-white px-3 py-2 text-xs font-extrabold text-[#042C51]">
            <span className="break-words">{typeof item === "string" ? item : item?.name || "—"}</span>
            <button type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="text-red-500"><X size={13} /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

export function SkillsSection({
  employee,
  selectedSubTab,
  isEditing,
  isSaving,
  onEdit,
  onListChange,
  onSave,
  onCancel,
}) {
  const config = {
    skills: ["Skills Inventory", "Documented technical, soft-skill, and operational proficiencies.", Sparkles, "skills"],
    recognitions: ["Honors & Recognition", "Awards, distinctions, and employee achievements.", Award, "recognitions"],
    organizations: ["Professional Affiliations", "Associations, organizations, and active memberships.", Users, "organizations"],
  }[selectedSubTab] || ["Skills Inventory", "Documented proficiencies.", Sparkles, "skills"];
  const [title, subtitle, Icon, listKey] = config;
  const items = Array.isArray(employee?.[listKey]) ? employee[listKey] : [];

  return (
    <div className="rounded-[20px] border border-[#D6E0EA] bg-white p-4 shadow-sm sm:p-6">
      <SectionHeader title={title} subtitle={subtitle} icon={Icon} isEditing={isEditing} onEdit={onEdit} />

      {isEditing ? (
        <Panel title={`Manage ${title}`}>
          <StringListEditor items={items} placeholder={`Enter ${selectedSubTab === "skills" ? "a skill" : "a record"}...`} addLabel="Add Entry" onChange={(next) => onListChange(listKey, next)} />
        </Panel>
      ) : selectedSubTab === "skills" ? (
        <Panel title="Recognized Competencies">
          {items.length === 0 ? <EmptyState message="No skills logged yet." actionLabel="Add skills" onAction={onEdit} /> : (
            <div className="flex flex-wrap gap-2">
              {items.map((item, index) => (
                <span key={index} className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-[#E9F0FC] px-3.5 py-2 text-xs font-extrabold text-[#042C51] transition hover:bg-[#042C51] hover:text-white"><Star size={14} className="fill-[#FF5C28] text-[#FF5C28]" />{typeof item === "string" ? item : item?.name || "—"}</span>
              ))}
            </div>
          )}
        </Panel>
      ) : selectedSubTab === "recognitions" ? (
        <Panel>
          {items.length === 0 ? <EmptyState message="No recognition records logged." actionLabel="Add recognition" onAction={onEdit} /> : <div className="space-y-3">{items.map((item, index) => <div key={index} className="flex items-start gap-3 rounded-xl bg-[#F8FAFC] p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#FF5C28]"><Award size={16} /></span><p className="text-xs font-bold leading-6 text-[#344054]">{typeof item === "string" ? item : item?.name || "—"}</p></div>)}</div>}
        </Panel>
      ) : (
        <Panel>
          {items.length === 0 ? <EmptyState message="No organization memberships logged." actionLabel="Add organization" onAction={onEdit} /> : <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{items.map((item, index) => <div key={index} className="flex items-center gap-3 rounded-xl bg-[#F8FAFC] p-4"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Users size={17} /></span><p className="text-xs font-extrabold text-[#344054]">{typeof item === "string" ? item : item?.name || "—"}</p></div>)}</div>}
        </Panel>
      )}

      {isEditing && <SaveBar label={title} onCancel={onCancel} onSave={onSave} isSaving={isSaving} />}
    </div>
  );
}

function ApplicationFieldGrid({ fields, employee, isEditing, onChange }) {
  if (isEditing) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {fields.map(([field, label, type = "text"]) => <FieldControl key={field} label={label} type={type} value={employee?.[field]} onChange={(value) => onChange(field, value)} className={type === "textarea" ? "md:col-span-2 xl:col-span-3" : ""} />)}
      </div>
    );
  }
  return <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">{fields.map(([field, label]) => <ReadField key={field} label={label} value={employee?.[field]} />)}</div>;
}

export function ApplicationSection({
  employee,
  selectedSubTab,
  isEditing,
  isSaving,
  onEdit,
  onChange,
  onListChange,
  onSave,
  onCancel,
}) {
  const config = {
    overview: ["Recruitment & Application Overview", "Candidate sourcing and hiring deployment details.", Briefcase],
    pipeline: ["Recruitment Pipeline", "Current stage and visual application movement.", UserCheck],
    assessment: ["Assessment Results", "Testing scores, evaluations, and outcome status.", BadgeCheck],
    history: ["Status History", "Chronological application status and stage audit trail.", FileText],
  }[selectedSubTab] || ["Application", "Recruitment details.", Briefcase];
  const [title, subtitle, Icon] = config;
  const statusHistory = Array.isArray(employee?.statusHistory) ? employee.statusHistory : [];
  const currentStage = employee?.pipelineStage || "Sourcing";
  const currentIndex = Math.max(PIPELINE_STAGES.findIndex((stage) => stage === currentStage), 0);

  return (
    <div className="rounded-[20px] border border-[#D6E0EA] bg-white p-4 shadow-sm sm:p-6">
      <SectionHeader title={title} subtitle={subtitle} icon={Icon} isEditing={isEditing} onEdit={selectedSubTab === "history" ? null : onEdit} />

      {selectedSubTab === "overview" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Panel title="Sourcing Details">
            <ApplicationFieldGrid employee={employee} isEditing={isEditing} onChange={onChange} fields={[["appliedPosition", "Applied Position"], ["preferredAccount", "Preferred Account"], ["source", "Source"]]} />
          </Panel>
          <Panel title="Deployment & Hiring Status" accent="navy">
            <ApplicationFieldGrid employee={employee} isEditing={isEditing} onChange={onChange} fields={[["expectedSalary", "Expected Salary"], ["availability", "Availability"], ["recruiter", "Recruiter"]]} />
          </Panel>
        </div>
      )}

      {selectedSubTab === "pipeline" && (
        isEditing ? (
          <div className="space-y-5">
            <Panel title="Modify Pipeline State"><ApplicationFieldGrid employee={employee} isEditing onChange={onChange} fields={[["status", "Candidate Status"], ["pipelineStage", "Pipeline Stage"], ["prfMatchStatus", "PRF Match Status"], ["remarks", "Recruitment Remarks", "textarea"]]} /></Panel>
          </div>
        ) : (
          <Panel title="Active Recruitment Funnel Tracker">
            <div className="relative py-6">
              <div className="absolute left-8 right-8 top-[42px] hidden h-1 bg-slate-100 md:block" />
              <div className="relative grid grid-cols-2 gap-6 md:grid-cols-6">
                {PIPELINE_STAGES.map((stage, index) => {
                  const state = index < currentIndex ? "completed" : index === currentIndex ? "active" : "pending";
                  return (
                    <div key={stage} className="flex flex-col items-center text-center">
                      <span className={`z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-extrabold ${state === "completed" ? "border-emerald-500 bg-emerald-500 text-white" : state === "active" ? "border-[#042C51] bg-[#042C51] text-white ring-4 ring-[#E9F0FC]" : "border-slate-200 bg-white text-slate-400"}`}>{state === "completed" ? <CheckCircle2 size={18} /> : index + 1}</span>
                      <span className={`mt-2 max-w-[110px] text-[10px] font-extrabold ${state === "active" ? "text-[#042C51]" : "text-[#667085]"}`}>{stage}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 rounded-xl bg-[#F8FAFC] p-4 sm:grid-cols-2">
              <ReadField label="PRF Match Status" value={employee?.prfMatchStatus} />
              <ReadField label="Recruitment Remarks" value={employee?.remarks} />
            </div>
          </Panel>
        )
      )}

      {selectedSubTab === "assessment" && (
        isEditing ? (
          <Panel title="Modify Assessment Results"><ApplicationFieldGrid employee={employee} isEditing onChange={onChange} fields={[["assessmentStatus", "Assessment Status"], ["assessmentScore", "Assessment Score"], ["assessmentRemarks", "Evaluation Remarks", "textarea"]]} /></Panel>
        ) : (
          <Panel>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
              <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-[#D6E0EA] bg-[#F8FAFC] text-center">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">Weighted Score</p>
                <p className="mt-2 text-4xl font-extrabold text-[#042C51]">{employee?.assessmentScore || "—"}</p>
                <span className="mt-2 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">{employee?.assessmentStatus || "Pending"}</span>
              </div>
              <div className="rounded-xl border border-blue-100 bg-[#E9F0FC]/60 p-5"><p className="text-[10px] font-extrabold uppercase tracking-wide text-[#042C51]">Evaluation Summary Remarks</p><p className="mt-3 text-sm font-semibold leading-7 text-[#344054]">{employee?.assessmentRemarks || employee?.remarks || "No assessment remarks recorded."}</p><div className="mt-5 flex items-center gap-2 border-t border-blue-100 pt-4 text-xs font-semibold text-[#667085]"><UserCheck size={16} className="text-[#042C51]" />Verified assessment information</div></div>
            </div>
          </Panel>
        )
      )}

      {selectedSubTab === "history" && (
        <div className="space-y-4">
          {isEditing && (
            <div className="flex justify-end"><button type="button" onClick={() => onListChange("statusHistory", [...statusHistory, { id: `history_${Date.now()}`, date: "", status: "", stage: "", remarks: "" }])} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white"><Plus size={14} />Add History Entry</button></div>
          )}
          {statusHistory.length === 0 ? <EmptyState message="No application status history recorded." actionLabel={isEditing ? "Add history entry" : undefined} onAction={isEditing ? () => onListChange("statusHistory", [{ id: `history_${Date.now()}`, date: "", status: "", stage: "", remarks: "" }]) : undefined} /> : isEditing ? statusHistory.map((entry, index) => (
            <Panel key={entry?.id || index} title={`Status Entry #${index + 1}`}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><FieldControl label="Date" type="date" value={toInputDate(entry?.date)} onChange={(value) => onListChange("statusHistory", statusHistory.map((item, itemIndex) => itemIndex === index ? { ...item, date: value } : item))} /><FieldControl label="Status" value={entry?.status} onChange={(value) => onListChange("statusHistory", statusHistory.map((item, itemIndex) => itemIndex === index ? { ...item, status: value } : item))} /><FieldControl label="Stage" value={entry?.stage} onChange={(value) => onListChange("statusHistory", statusHistory.map((item, itemIndex) => itemIndex === index ? { ...item, stage: value } : item))} /><FieldControl label="Remarks" type="textarea" value={entry?.remarks} onChange={(value) => onListChange("statusHistory", statusHistory.map((item, itemIndex) => itemIndex === index ? { ...item, remarks: value } : item))} /></div>
              <div className="mt-3 flex justify-end"><button type="button" onClick={() => onListChange("statusHistory", statusHistory.filter((_, itemIndex) => itemIndex !== index))} className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-extrabold text-red-600"><Trash2 size={14} />Remove</button></div>
            </Panel>
          )) : (
            <div className="relative ml-3 space-y-5 border-l-2 border-slate-200 pl-6">{statusHistory.map((entry, index) => <article key={entry?.id || index} className="relative rounded-2xl border border-[#D6E0EA] bg-[#F8FAFC] p-4"><span className="absolute -left-[31px] top-5 h-3.5 w-3.5 rounded-full border-4 border-white bg-slate-300" /><div className="flex flex-col gap-2 border-b border-[#E6ECF2] pb-2 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-extrabold text-[#042C51]">{entry?.status || "—"}</span><span className="rounded bg-[#E9F0FC] px-2 py-1 text-[9px] font-extrabold text-[#042C51]">Stage: {entry?.stage || "—"}</span></div><span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#667085]"><CalendarDays size={13} />{formatDate(entry?.date)}</span></div><p className="mt-3 text-xs font-medium italic leading-6 text-[#52637A]">{entry?.remarks || "—"}</p></article>)}</div>
          )}
        </div>
      )}

      {isEditing && <SaveBar label={title} onCancel={onCancel} onSave={onSave} isSaving={isSaving} />}
    </div>
  );
}

function getDocumentExtension(document = {}) {
  const filename = text(
    document?.name ||
      document?.fileName ||
      document?.filename ||
      document?.originalName,
  ).toLowerCase();

  const dotIndex = filename.lastIndexOf(".");
  return dotIndex >= 0 ? filename.slice(dotIndex) : "";
}

function getDocumentPreviewMimeType(document = {}, responseType = "") {
  const extension = getDocumentExtension(document);

  const mimeByExtension = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };

  const savedMimeType = text(
    document?.mimeType ||
      document?.mimetype ||
      document?.contentType ||
      document?.type,
  ).toLowerCase();

  const responseMimeType = text(responseType).toLowerCase();

  if (
    savedMimeType &&
    savedMimeType !== "application/octet-stream" &&
    savedMimeType !== "binary/octet-stream"
  ) {
    return savedMimeType;
  }

  if (
    responseMimeType &&
    responseMimeType !== "application/octet-stream" &&
    responseMimeType !== "binary/octet-stream"
  ) {
    return responseMimeType;
  }

  return mimeByExtension[extension] || "application/octet-stream";
}

function fileIcon(name) {
  const lower = text(name).toLowerCase();
  if (lower.endsWith(".pdf")) return "PDF";
  if (
    lower.endsWith(".xlsx") ||
    lower.endsWith(".xls") ||
    lower.endsWith(".csv")
  ) {
    return "XLS";
  }
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "DOC";
  if (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".webp")
  ) {
    return "IMG";
  }
  return "FILE";
}

function getEmployeeDocumentSibsId(employee) {
  return text(
    employee?.sibsId ||
      employee?.sibs_id ||
      employee?.employeeCode ||
      employee?.gy_emp_code ||
      employee?.username,
  );
}

function getEmployeeDocumentSource(document) {
  return text(document?.source) || "Employee Profile";
}

function getEmployeeDocumentKey(document) {
  return [
    document?.sourceKey || "employee-profile",
    document?.sourceRecordId || document?.id || "document",
    document?.externalKey || "profile",
  ]
    .map(text)
    .join(":");
}

function canDeleteEmployeeDocument(document) {
  const sourceKey = text(document?.sourceKey || "employee-profile");
  const sourceRecordId = text(
    document?.sourceRecordId || document?.source_record_id,
  );
  const isManagedTalentPoolUpload =
    sourceKey === "talent-pool" &&
    sourceRecordId === "employee-upload-folder";
  const isManagedRequirementUpload =
    sourceKey === "candidate-pipeline" &&
    sourceRecordId === "employee-requirement-folder";

  return (
    (sourceKey === "employee-profile" ||
      isManagedTalentPoolUpload ||
      isManagedRequirementUpload) &&
    document?.readOnly !== true &&
    document?.canDelete !== false
  );
}

function getEmployeeDocumentGroup(document) {
  const explicitGroup = text(document?.documentGroup || document?.document_group)
    .toLowerCase();
  if (explicitGroup === "pre-employment") return "pre-employment";
  if (explicitGroup === "uploaded") return "uploaded";

  const sourceKey = text(document?.sourceKey || document?.source_key).toLowerCase();
  return sourceKey === "candidate-pipeline" ? "pre-employment" : "uploaded";
}

function getEmployeeDocumentSourceClass(document) {
  const source = getEmployeeDocumentSource(document);

  if (source === "Talent Pool") {
    return "border-orange-100 bg-[#FFF3ED] text-[#C2410C]";
  }

  if (source === "Candidate Pipeline") {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  return "border-blue-100 bg-[#E9F0FC] text-[#042C51]";
}

function getEmployeeRequirementGroupTitle(group) {
  if (text(group?.title)) return text(group.title);
  if (group?.id === "major") return "Major Requirements";
  if (group?.id === "other") return "Other Requirements";
  if (group?.id === "previous-employment") return "Previous Employment";
  return "Requirements";
}

export function DocumentsSection({ employee, onDocumentsChange, onFeedback, canEditDetails = false }) {
  const fileInputRef = useRef(null);
  const requirementFileInputRef = useRef(null);
  const previewUrlRef = useRef("");

  const sibsId = getEmployeeDocumentSibsId(employee);
  const [documents, setDocuments] = useState(
    Array.isArray(employee?.documents) ? employee.documents : [],
  );
  const [requirementGroups, setRequirementGroups] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [layout, setLayout] = useState("table");
  const [activeDocumentGroup, setActiveDocumentGroup] = useState("uploaded");
  const [activeRequirementGroup, setActiveRequirementGroup] = useState("major");
  const [dragActive, setDragActive] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [newCategory, setNewCategory] = useState("Certificate");
  const [uploading, setUploading] = useState(false);

  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [uploadingRequirementId, setUploadingRequirementId] = useState("");
  const [requirementDeleteTarget, setRequirementDeleteTarget] = useState(null);
  const [deletingRequirementId, setDeletingRequirementId] = useState("");

  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function syncDocuments(nextDocuments) {
    const normalized = Array.isArray(nextDocuments) ? nextDocuments : [];
    setDocuments(normalized);
    onDocumentsChange?.(normalized);
  }

  async function loadDocumentsFromServer({ silent = false } = {}) {
    if (!sibsId) {
      syncDocuments([]);
      setRequirementGroups([]);
      return false;
    }

    if (!silent) setLoadingDocuments(true);

    try {
      const result = await getEmployeeProfileDocuments(sibsId);

      if (!result?.success) {
        onFeedback?.(
          result?.message || "Failed to load employee documents.",
          "error",
        );
        return false;
      }

      syncDocuments(result.data || []);
      setRequirementGroups(result.requirementGroups || []);

      if (result?.folderStatus?.warning) {
        onFeedback?.(result.folderStatus.warning, "warning");
      }

      return true;
    } catch (error) {
      console.error("Failed to load employee documents:", error);
      onFeedback?.("Failed to load employee documents.", "error");
      return false;
    } finally {
      if (!silent) setLoadingDocuments(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      if (!sibsId) {
        if (!cancelled) {
          syncDocuments([]);
          setRequirementGroups([]);
        }
        return;
      }

      setLoadingDocuments(true);

      try {
        const result = await getEmployeeProfileDocuments(sibsId);
        if (cancelled) return;

        if (!result?.success) {
          onFeedback?.(
            result?.message || "Failed to load employee documents.",
            "error",
          );
          return;
        }

        syncDocuments(result.data || []);
        setRequirementGroups(result.requirementGroups || []);

        if (result?.folderStatus?.warning) {
          onFeedback?.(result.folderStatus.warning, "warning");
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load employee documents:", error);
        onFeedback?.("Failed to load employee documents.", "error");
      } finally {
        if (!cancelled) setLoadingDocuments(false);
      }
    }

    loadDocuments();

    return () => {
      cancelled = true;
    };
  }, [sibsId]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = "";
      }
    };
  }, []);

  useEffect(() => {
    if (
      requirementGroups.length > 0 &&
      !requirementGroups.some((group) => group.id === activeRequirementGroup)
    ) {
      setActiveRequirementGroup(requirementGroups[0].id);
    }
  }, [requirementGroups, activeRequirementGroup]);

  const categoryOptions = useMemo(() => {
    const values = documents
      .filter((document) => getEmployeeDocumentGroup(document) === "uploaded")
      .map((document) => text(document?.category))
      .filter(Boolean);

    return ["All", ...new Set([...PROFILE_DOCUMENT_TYPES, ...values])];
  }, [documents]);

  const uploadedDocuments = useMemo(() => {
    const query = search.toLowerCase();

    return documents.filter((document) => {
      if (getEmployeeDocumentGroup(document) !== "uploaded") return false;

      const searchMatch =
        text(document?.name).toLowerCase().includes(query) ||
        text(document?.uploadedBy).toLowerCase().includes(query) ||
        text(document?.category).toLowerCase().includes(query) ||
        getEmployeeDocumentSource(document).toLowerCase().includes(query);
      const categoryMatch =
        category === "All" || document?.category === category;

      return searchMatch && categoryMatch;
    });
  }, [documents, search, category]);

  const employeeDocuments = useMemo(
    () =>
      uploadedDocuments.filter((document) =>
        ["employee profile", "hr upload", "employee upload"].includes(
          getEmployeeDocumentSource(document).toLowerCase(),
        ),
      ),
    [uploadedDocuments],
  );

  const recruitmentDocuments = useMemo(
    () =>
      uploadedDocuments.filter(
        (document) =>
          !["employee profile", "hr upload", "employee upload"].includes(
            getEmployeeDocumentSource(document).toLowerCase(),
          ),
      ),
    [uploadedDocuments],
  );

  const activeRequirementDefinition = useMemo(
    () =>
      requirementGroups.find((group) => group.id === activeRequirementGroup) ||
      requirementGroups[0] ||
      null,
    [requirementGroups, activeRequirementGroup],
  );

  const totalUploadedRequirements = useMemo(
    () =>
      requirementGroups.reduce(
        (total, group) =>
          total +
          (Array.isArray(group?.requirements)
            ? group.requirements.filter(
                (requirement) => requirement?.uploaded || requirement?.file,
              ).length
            : 0),
        0,
      ),
    [requirementGroups],
  );

  function openFilePicker() {
    if (!canEditDetails || uploading) return;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }

  function prepareSelectedFiles(fileList) {
    if (!canEditDetails) return;
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const invalid = files.find(
      (file) => !validateProfileDocumentFile(file).valid,
    );
    if (invalid) {
      onFeedback?.(validateProfileDocumentFile(invalid).message, "error");
      return;
    }

    setSelectedFiles(files);
    setNewCategory("Certificate");
    setUploadOpen(true);
  }

  function handleFileInputChange(event) {
    prepareSelectedFiles(event.target.files);
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    if (!canEditDetails) return;
    event.stopPropagation();
    setDragActive(false);

    prepareSelectedFiles(event.dataTransfer?.files);
  }

  function closeUploadModal() {
    if (uploading) return;
    setUploadOpen(false);
    setSelectedFiles([]);
  }

  async function uploadDocument(event) {
    event.preventDefault();
    if (!canEditDetails || !sibsId || !selectedFiles.length || uploading) return;

    setUploading(true);
    try {
      const results = [];
      for (const file of selectedFiles) {
        results.push(await uploadEmployeeProfileDocument(sibsId, file, newCategory));
      }
      const failed = results.find((result) => !result?.success);
      if (failed) {
        onFeedback?.(failed.message || "One or more files failed to upload.", "error");
        return;
      }
      const uploadedCount = selectedFiles.length;
      setUploadOpen(false);
      setSelectedFiles([]);
      await loadDocumentsFromServer({ silent: true });
      onFeedback?.(`${uploadedCount} document${uploadedCount === 1 ? "" : "s"} uploaded successfully.`, "success");
    } catch (error) {
      console.error("Failed to upload employee documents:", error);
      onFeedback?.("Failed to upload employee documents.", "error");
    } finally {
      setUploading(false);
    }
  }

  function openRequirementFilePicker(requirement) {
    if (!canEditDetails || !requirement?.id || uploadingRequirementId) return;
    setSelectedRequirement(requirement);

    window.setTimeout(() => {
      if (requirementFileInputRef.current) {
        requirementFileInputRef.current.value = "";
        requirementFileInputRef.current.click();
      }
    }, 0);
  }

  async function handleRequirementFileChange(event) {
    if (!canEditDetails) return;
    const files = Array.from(event.target.files || []);
    const requirement = selectedRequirement;
    if (!files.length || !requirement?.id || !sibsId) return;

    const invalid = files.find((file) => !validateProfileDocumentFile(file).valid);
    if (invalid) {
      onFeedback?.(validateProfileDocumentFile(invalid).message, "error");
      setSelectedRequirement(null);
      return;
    }

    setUploadingRequirementId(requirement.id);
    try {
      const results = [];
      for (const file of files) {
        results.push(await uploadEmployeePreEmploymentRequirement(sibsId, requirement.id, file));
      }
      const failed = results.find((result) => !result?.success);
      if (failed) {
        onFeedback?.(failed.message || `One or more files failed to upload for ${requirement.name}.`, "error");
        return;
      }
      await loadDocumentsFromServer({ silent: true });
      onFeedback?.(`${files.length} file${files.length === 1 ? "" : "s"} appended to ${requirement.name}.`, "success");
    } catch (error) {
      console.error("Failed to upload pre-employment files:", error);
      onFeedback?.(`Failed to upload files for ${requirement.name}.`, "error");
    } finally {
      setUploadingRequirementId("");
      setSelectedRequirement(null);
      if (requirementFileInputRef.current) requirementFileInputRef.current.value = "";
    }
  }

  async function permanentlyDeleteRequirement() {
    if (!canEditDetails) return;
    const requirement = requirementDeleteTarget;

    if (!sibsId || !requirement?.id || deletingRequirementId) return;

    setDeletingRequirementId(requirement.id);

    try {
      const result = await deleteEmployeePreEmploymentRequirement(
        sibsId,
        requirement.id,
      );

      if (!result?.success) {
        onFeedback?.(
          result?.message || `Failed to delete ${requirement.name}.`,
          "error",
        );
        return;
      }

      setRequirementDeleteTarget(null);
      await loadDocumentsFromServer({ silent: true });
      onFeedback?.(
        result.message || `${requirement.name} permanently deleted.`,
        "success",
      );
    } catch (error) {
      console.error("Failed to delete pre-employment requirement:", error);
      onFeedback?.(`Failed to delete ${requirement.name}.`, "error");
    } finally {
      setDeletingRequirementId("");
    }
  }

  function closePreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
    setPreview(null);
    setPreviewLoading(false);
  }

  async function openDocumentPreview(document) {
    if (!sibsId || !document?.id || previewLoading) return;

    closePreview();
    setPreview({ document, url: "" });
    setPreviewLoading(true);

    try {
      const result = await fetchEmployeeDocumentFile(sibsId, document);

      if (!result?.success || !result?.blob) {
        closePreview();
        onFeedback?.(
          result?.message || "Failed to open employee document.",
          "error",
        );
        return;
      }

      const previewMimeType = getDocumentPreviewMimeType(
        document,
        result.contentType,
      );

      const previewBlob =
        result.blob.type === previewMimeType
          ? result.blob
          : result.blob.slice(0, result.blob.size, previewMimeType);

      const objectUrl = URL.createObjectURL(previewBlob);
      previewUrlRef.current = objectUrl;
      setPreview({
        document: {
          ...document,
          mimeType: previewMimeType,
        },
        url: objectUrl,
      });
    } catch (error) {
      closePreview();
      console.error("Failed to preview employee document:", error);
      onFeedback?.("Failed to open employee document.", "error");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function downloadDocument(document) {
    if (!sibsId || !document?.id) return;

    try {
      const result = await fetchEmployeeDocumentFile(sibsId, document, {
        download: true,
      });

      if (!result?.success || !result?.blob) {
        onFeedback?.(
          result?.message || "Failed to download employee document.",
          "error",
        );
        return;
      }

      const objectUrl = URL.createObjectURL(result.blob);
      const anchor = window.document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = document?.name || "employee-document";
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    } catch (error) {
      console.error("Failed to download employee document:", error);
      onFeedback?.("Failed to download employee document.", "error");
    }
  }

  async function permanentlyDeleteDocument() {
    if (
      !canEditDetails ||
      !sibsId ||
      !deleteTarget?.id ||
      deleting ||
      !canDeleteEmployeeDocument(deleteTarget)
    ) {
      return;
    }

    setDeleting(true);

    try {
      const sourceKey = text(
        deleteTarget?.sourceKey || deleteTarget?.source_key || "employee-profile",
      );
      const result =
        sourceKey === "employee-profile"
          ? await deleteEmployeeProfileDocument(sibsId, deleteTarget.id)
          : await deleteEmployeeRecruitmentDocument(sibsId, deleteTarget);

      if (!result?.success) {
        onFeedback?.(
          result?.message || "Failed to permanently delete the document.",
          "error",
        );
        return;
      }

      setDeleteTarget(null);
      await loadDocumentsFromServer({ silent: true });
      onFeedback?.(
        result.message || "Employee document permanently deleted.",
        "success",
      );
    } catch (error) {
      console.error("Failed to delete employee document:", error);
      onFeedback?.("Failed to permanently delete the document.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const previewDocument = preview?.document;
  const previewIsImage = text(previewDocument?.mimeType).startsWith("image/");
  const previewSupported = isInlinePreviewSupported(previewDocument);
  const visibleRequirements = Array.isArray(
    activeRequirementDefinition?.requirements,
  )
    ? activeRequirementDefinition.requirements
    : [];
  const activeRequirementCompleted = visibleRequirements.filter(
    (requirement) => requirement?.uploaded || requirement?.file,
  ).length;

  return (
    <div className="rounded-[20px] border border-[#D6E0EA] bg-white p-4 shadow-sm sm:p-6">
      {canEditDetails ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept={PROFILE_DOCUMENT_ACCEPT}
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />
          <input
            ref={requirementFileInputRef}
            type="file"
            accept={PROFILE_DOCUMENT_ACCEPT}
            multiple
            onChange={handleRequirementFileChange}
            className="hidden"
          />
        </>
      ) : null}

      <div className="mb-6 border-b border-[#E6ECF2] pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E9F0FC] text-[#042C51]">
            <FolderLock size={19} />
          </span>
          <div>
            <h2 className="text-base font-extrabold text-[#042C51]">
              Document Vault Manager
            </h2>
            <p className="mt-1 text-xs font-medium text-[#667085]">
              Manage employee, recruitment, onboarding, and HR documents in one centralized repository.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          {
            id: "uploaded",
            title: "Other Files",
            description:
              "Employee, HR, Talent Pool, and recruitment attachments with document types.",
            count: uploadedDocuments.length,
            icon: <FileText size={18} />,
          },
          {
            id: "pre-employment",
            title: "Pre-Employment Files",
            description:
              "Major, other, and previous-employment requirement files.",
            count: totalUploadedRequirements,
            icon: <ShieldCheck size={18} />,
          },
        ].map((card) => {
          const active = activeDocumentGroup === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setActiveDocumentGroup(card.id)}
              className={`rounded-2xl border p-5 text-left transition ${
                active
                  ? "border-[#042C51] bg-[#042C51] text-white shadow-md"
                  : "border-[#D6E0EA] bg-white text-[#042C51] hover:border-[#8EA3BF] hover:shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    active ? "bg-white/10 text-[#FF9C73]" : "bg-[#E9F0FC] text-[#042C51]"
                  }`}
                >
                  {card.icon}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${
                    active ? "bg-white/10 text-white" : "bg-[#F2F4F7] text-[#52637A]"
                  }`}
                >
                  {card.count} uploaded
                </span>
              </div>
              <h3 className="mt-4 text-sm font-extrabold">{card.title}</h3>
              <p className={`mt-1 text-[10px] font-semibold leading-4 ${active ? "text-white/70" : "text-[#667085]"}`}>
                {card.description}
              </p>
            </button>
          );
        })}
      </div>

      {activeDocumentGroup === "pre-employment" ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {requirementGroups.map((group) => {
              const requirements = Array.isArray(group?.requirements) ? group.requirements : [];
              const completed = requirements.filter(
                (requirement) => requirement?.uploaded || requirement?.file,
              ).length;
              const percent = requirements.length
                ? Math.round((completed / requirements.length) * 100)
                : 0;
              const active = activeRequirementDefinition?.id === group.id;

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setActiveRequirementGroup(group.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-[#042C51] bg-[#E9F0FC] shadow-sm"
                      : "border-[#D6E0EA] bg-white hover:border-[#8EA3BF]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold text-[#042C51]">
                        {getEmployeeRequirementGroupTitle(group)}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold text-[#667085]">
                        {completed} / {requirements.length} Complete
                      </p>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#042C51] shadow-sm">
                      {group.id === "major" ? <ShieldCheck size={17} /> : group.id === "previous-employment" ? <Briefcase size={17} /> : <FileText size={17} />}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#DCE5EF]">
                    <div className="h-full rounded-full bg-[#FF5C28]" style={{ width: `${percent}%` }} />
                  </div>
                </button>
              );
            })}
          </div>

          {loadingDocuments ? (
            <div className="rounded-2xl border border-dashed border-[#D6E0EA] bg-[#F8FAFC] px-5 py-12 text-center text-xs font-bold text-[#667085]">
              Loading pre-employment requirements...
            </div>
          ) : !activeRequirementDefinition ? (
            <EmptyState message="No Candidate Pipeline requirement configuration is available." />
          ) : (
            <section className="rounded-2xl border border-[#D6E0EA] bg-[#F8FAFC] p-4 sm:p-5">
              <div className="mb-5 flex items-center justify-between gap-4 border-b border-[#D6E0EA] pb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-[#042C51]">
                    {getEmployeeRequirementGroupTitle(activeRequirementDefinition)}
                  </h3>
                  <p className="mt-1 text-[10px] font-semibold text-[#667085]">
                    Upload, preview, download, replace, or remove each requirement file.
                  </p>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold text-emerald-700">
                  {activeRequirementCompleted} / {visibleRequirements.length} Complete
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {visibleRequirements.map((requirement) => {
                  const files = Array.isArray(requirement?.files)
                    ? requirement.files
                    : requirement?.file
                      ? [requirement.file]
                      : [];
                  const isUploaded = files.length > 0;
                  const isUploading = uploadingRequirementId === requirement.id;
                  const isDeleting = deletingRequirementId === requirement.id;

                  return (
                    <article
                      key={requirement.id}
                      className={`rounded-2xl border bg-white p-4 transition ${
                        isUploaded ? "border-emerald-200 shadow-sm" : "border-[#D6E0EA]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isUploaded ? "bg-emerald-50 text-emerald-600" : "bg-[#E9F0FC] text-[#042C51]"}`}>
                          {isUploaded ? <CheckCircle2 size={19} /> : <FileText size={18} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-extrabold leading-5 text-[#042C51]">
                            {requirement.name}
                          </h4>
                          <p className="mt-1 font-mono text-[9px] font-bold text-[#8EA3BF]">
                            {requirement.id}
                          </p>
                          <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[8px] font-extrabold uppercase ${isUploaded ? "bg-emerald-50 text-emerald-700" : "bg-[#F2F4F7] text-[#667085]"}`}>
                            {isUploaded ? "Uploaded" : "Missing"}
                          </span>
                        </div>
                      </div>

                      {files.length ? (
                        <div className="mt-4 space-y-2">
                          {files.map((document) => (
                            <div
                              key={getEmployeeDocumentKey(document)}
                              className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3"
                            >
                              <p className="truncate text-[10px] font-extrabold text-[#344054]">
                                {document.name}
                              </p>
                              <p className="mt-1 text-[9px] font-semibold text-[#667085]">
                                {document.fileSize || "—"} · {formatDate(document.uploadedAt)}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <button type="button" onClick={() => openDocumentPreview(document)} className="inline-flex h-7 items-center gap-1 rounded-lg border border-[#D6E0EA] bg-white px-2.5 text-[9px] font-extrabold text-[#52637A]">
                                  <Eye size={12} /> Preview
                                </button>
                                <button type="button" onClick={() => downloadDocument(document)} className="inline-flex h-7 items-center gap-1 rounded-lg border border-[#D6E0EA] bg-white px-2.5 text-[9px] font-extrabold text-[#52637A]">
                                  <Download size={12} /> Download
                                </button>
                                {canEditDetails && canDeleteEmployeeDocument(document) ? (
                                  <button type="button" onClick={() => setDeleteTarget(document)} className="inline-flex h-7 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 text-[9px] font-extrabold text-red-600">
                                    <Trash2 size={12} /> Delete
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-4 rounded-xl border border-dashed border-[#C8D3DF] bg-[#F8FAFC] p-4 text-center">
                          <Upload size={18} className="mx-auto text-[#98A2B3]" />
                          <p className="mt-2 text-[10px] font-bold text-[#667085]">No uploaded files yet.</p>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#E6ECF2] pt-3">
                        {canEditDetails ? (
                          <button type="button" onClick={() => openRequirementFilePicker(requirement)} disabled={isUploading || isDeleting} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#042C51] px-3 text-[10px] font-extrabold text-white disabled:opacity-60">
                            <Upload size={13} className="text-[#FF5C28]" />
                            {isUploading ? "Uploading..." : "Upload Files"}
                          </button>
                        ) : null}
                        {files.length > 0 ? (
                          <span className="text-[9px] font-bold text-[#667085]">
                            {files.length} active file{files.length === 1 ? "" : "s"}
                          </span>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      ) : (
        <section className="space-y-5">
          <div className="flex flex-col gap-3 rounded-2xl border border-[#D6E0EA] bg-[#F8FAFC] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#042C51]">
                Other Files
              </h3>
              <p className="mt-1 text-[10px] font-semibold text-[#667085]">
                Upload employee and HR documents or review files synchronized from recruitment.
              </p>
            </div>
            {canEditDetails ? (
              <button type="button" onClick={openFilePicker} disabled={uploading} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white disabled:opacity-60">
                <Upload size={15} className="text-[#FF5C28]" /> Upload Files
              </button>
            ) : null}
          </div>

          {loadingDocuments ? (
            <div className="rounded-2xl border border-dashed border-[#D6E0EA] bg-[#F8FAFC] px-5 py-12 text-center text-xs font-bold text-[#667085]">Loading documents...</div>
          ) : uploadedDocuments.length === 0 ? (
            <EmptyState message="No other files uploaded or synchronized yet." />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {uploadedDocuments.map((document) => (
                <article key={getEmployeeDocumentKey(document)} className="rounded-2xl border border-[#D6E0EA] bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E9F0FC] text-[10px] font-extrabold text-[#042C51]">{fileIcon(document?.name)}</span>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-xs font-extrabold text-[#344054]">{document?.name}</h4>
                      <p className="mt-1 text-[9px] font-semibold text-[#667085]">{document?.category || "Other"}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[8px] font-extrabold uppercase text-emerald-700">Uploaded</span>
                        <span className={`rounded-full border px-2.5 py-1 text-[8px] font-extrabold ${getEmployeeDocumentSourceClass(document)}`}>{document?.source || "Employee Profile"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl bg-[#F8FAFC] p-3 text-[9px] font-semibold text-[#667085]">
                    Uploaded by {document?.uploadedBy || "—"}<br />
                    {formatDate(document?.uploadedAt)} · {document?.fileSize || "—"}
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-2 border-t border-[#E6ECF2] pt-3">
                    <button type="button" onClick={() => openDocumentPreview(document)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#D6E0EA] px-3 text-[10px] font-extrabold text-[#52637A]"><Eye size={13} /> Preview</button>
                    <button type="button" onClick={() => downloadDocument(document)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#D6E0EA] px-3 text-[10px] font-extrabold text-[#52637A]"><Download size={13} /> Download</button>
                    {canEditDetails && canDeleteEmployeeDocument(document) ? (
                      <button type="button" onClick={() => setDeleteTarget(document)} className="inline-flex h-8 items-center rounded-lg border border-red-200 bg-red-50 px-2.5 text-red-600"><Trash2 size={13} /></button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {canEditDetails && uploadOpen && selectedFiles.length > 0 && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 p-4"
          onClick={closeUploadModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E6ECF2] pb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
                Configure Talent Pool Upload
              </h3>
              <button
                type="button"
                onClick={closeUploadModal}
                disabled={uploading}
                className="rounded-lg p-1 text-[#98A2B3] hover:bg-[#F8FAFC] disabled:opacity-50"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={uploadDocument} className="mt-4 space-y-4">
              <div className="rounded-xl border border-[#D6E0EA] bg-[#F8FAFC] p-4">
                <p className="break-all text-xs font-extrabold text-[#042C51]">
                  {selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} files selected`}
                </p>
                <p className="mt-1 text-[10px] font-semibold text-[#667085]">
                  {selectedFiles.length === 1 ? formatProfileDocumentSize(selectedFiles[0].size) : `${selectedFiles.length} files`} · Saved in the
                  employee Talent Pool UPLOADED FILES folder.
                </p>
              </div>

              <FieldControl
                label="Document Type"
                type="select"
                options={PROFILE_DOCUMENT_TYPES}
                value={newCategory}
                onChange={setNewCategory}
                required
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeUploadModal}
                  disabled={uploading}
                  className="h-9 rounded-xl border border-[#D6E0EA] px-4 text-xs font-extrabold text-[#667085] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="h-9 rounded-xl bg-[#042C51] px-5 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {preview &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/70 p-4"
            onClick={closePreview}
          >
          <div
            className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between bg-[#042C51] px-5 py-4 text-white">
              <div className="flex min-w-0 items-center gap-2">
                <FolderLock size={17} className="shrink-0 text-[#FF5C28]" />
                <h3 className="truncate text-xs font-extrabold uppercase tracking-wide">
                  {previewDocument?.name || "Secure Document Preview"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="rounded-lg p-1 hover:bg-white/10"
              >
                <X size={17} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-5">
              {previewLoading ? (
                <div className="flex min-h-[420px] items-center justify-center text-xs font-bold text-[#667085]">
                  Loading secure preview...
                </div>
              ) : previewSupported && preview?.url ? (
                previewIsImage ? (
                  <div className="flex min-h-[420px] items-center justify-center rounded-xl bg-[#F8FAFC] p-4">
                    <img
                      src={preview.url}
                      alt={previewDocument?.name || "Employee document"}
                      className="max-h-[70vh] max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <iframe
                    src={preview.url}
                    title={previewDocument?.name || "Employee document"}
                    className="h-[68vh] w-full rounded-xl border border-[#D6E0EA]"
                  />
                )
              ) : (
                <div className="rounded-xl border border-[#D6E0EA] bg-[#F8FAFC] p-8 text-center">
                  <FileText size={34} className="mx-auto text-[#042C51]" />
                  <p className="mt-3 text-sm font-extrabold text-[#042C51]">
                    This document type cannot be previewed in the browser.
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#667085]">
                    Download the document to open it using the appropriate desktop
                    application.
                  </p>
                </div>
              )}

              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#E6ECF2] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold text-[#344054]">
                    {previewDocument?.name}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-[#667085]">
                    {previewDocument?.category} · {previewDocument?.source || "Employee Profile"} · {previewDocument?.fileSize}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadDocument(previewDocument)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white"
                >
                  <Download size={14} className="text-[#FF5C28]" />
                  Download
                </button>
              </div>
            </div>
          </div>
          </div>,
          document.body,
        )}

      {canEditDetails &&
        deleteTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-[100000] flex min-h-screen w-screen items-center justify-center bg-slate-900/60 p-4"
            onClick={() => !deleting && setDeleteTarget(null)}
          >
            <div
              className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-5 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Trash2 size={18} />
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-extrabold text-[#042C51]">
                    Permanently delete document?
                  </h3>

                  <p className="mt-2 text-xs font-semibold leading-5 text-[#667085]">
                    This permanently deletes the physical file and any linked HRIS
                    metadata for:
                  </p>

                  <div className="mt-2 max-w-full rounded-lg bg-[#F8FAFC] px-3 py-2">
                    <p className="break-all [overflow-wrap:anywhere] text-xs font-extrabold leading-5 text-[#344054]">
                      {deleteTarget.name}
                    </p>
                  </div>

                  <p className="mt-2 text-xs font-semibold leading-5 text-[#667085]">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="h-9 rounded-xl border border-[#D6E0EA] px-4 text-xs font-extrabold text-[#667085] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={permanentlyDeleteDocument}
                  disabled={deleting}
                  className="h-9 rounded-xl bg-red-600 px-4 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {canEditDetails &&
        requirementDeleteTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-[100000] flex min-h-screen w-screen items-center justify-center bg-slate-900/60 p-4"
            onClick={() =>
              !deletingRequirementId && setRequirementDeleteTarget(null)
            }
          >
            <div
              className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-5 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Trash2 size={18} />
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-extrabold text-[#042C51]">
                    Delete pre-employment file?
                  </h3>

                  <p className="mt-2 text-xs font-semibold leading-5 text-[#667085]">
                    This permanently deletes the Candidate Pipeline file for:
                  </p>

                  <div className="mt-2 max-w-full rounded-lg bg-[#F8FAFC] px-3 py-2">
                    <p className="break-all [overflow-wrap:anywhere] text-xs font-extrabold leading-5 text-[#344054]">
                      {requirementDeleteTarget.name}
                    </p>
                  </div>

                  <p className="mt-2 text-xs font-semibold leading-5 text-[#667085]">
                    The linked NHO file metadata will also be removed. This action
                    cannot be undone.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRequirementDeleteTarget(null)}
                  disabled={Boolean(deletingRequirementId)}
                  className="h-9 rounded-xl border border-[#D6E0EA] px-4 text-xs font-extrabold text-[#667085] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={permanentlyDeleteRequirement}
                  disabled={Boolean(deletingRequirementId)}
                  className="h-9 rounded-xl bg-red-600 px-4 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingRequirementId ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}


export function NotesSection({ employee, onCommitNote, onFeedback }) {
  const existingHistory = Array.isArray(employee?.notesHistory) ? employee.notesHistory : [];
  const seedHistory = existingHistory.length > 0 ? existingHistory : employee?.notes ? [{ id: "current_note", content: employee.notes, date: employee?.updatedAt || employee?.updated_at || "", author: employee?.updatedBy || "HR Administrator" }] : [];
  const [history, setHistory] = useState(seedHistory);
  const [draft, setDraft] = useState("");

  function saveNote(event) {
    event.preventDefault();
    if (!text(draft)) {
      onFeedback?.("Write a note before saving.", "error");
      return;
    }
    const note = { id: `note_${Date.now()}`, content: draft.trim(), date: new Date().toISOString(), author: "Current HR User" };
    const nextHistory = [note, ...history];
    setHistory(nextHistory);
    setDraft("");
    onCommitNote?.(note.content, nextHistory);
    onFeedback?.("Private note logged locally.", "success");
  }

  function removeNote(id) {
    if (!window.confirm("Remove this private note?")) return;
    const nextHistory = history.filter((item) => item.id !== id);
    setHistory(nextHistory);
    onCommitNote?.(nextHistory[0]?.content || "", nextHistory);
    onFeedback?.("Private note deleted locally.", "success");
  }

  return (
    <div className="rounded-[20px] border border-[#D6E0EA] bg-white p-4 shadow-sm sm:p-6">
      <SectionHeader title="Private Operational Notes" subtitle="Confidential administrative notes visible only to authorized HR users." icon={FileText} />
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs leading-5 text-red-800"><Lock size={18} className="mt-0.5 shrink-0 text-red-600" /><div><p className="font-extrabold uppercase tracking-wide">Restricted HR information</p><p className="mt-1 font-medium">Keep employee notes factual, work-related, and limited to authorized administrative use.</p></div></div>
      <Panel title="Compose New Administrative Note">
        <form onSubmit={saveNote} className="space-y-3"><textarea rows={5} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Document a private administrative note..." className="w-full resize-y rounded-xl border border-[#D0D5DD] bg-[#F8FAFC] p-3.5 text-xs font-semibold leading-6 outline-none focus:border-[#042C51] focus:bg-white" /><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><span className="text-[10px] font-medium text-[#667085]">The entry will be timestamped under the current HR user.</span><button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#042C51] px-5 text-xs font-extrabold text-white"><Save size={14} className="text-[#FF5C28]" />Log Internal Note</button></div></form>
      </Panel>
      <div className="mt-6 space-y-4"><h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">Confidential History ({history.length})</h3>{history.length === 0 ? <EmptyState message="No private notes logged." /> : history.map((note) => <article key={note.id} className="group relative rounded-2xl border border-[#D6E0EA] bg-white p-5"><div className="flex flex-col gap-1 border-b border-[#E6ECF2] pb-3 sm:flex-row sm:items-center sm:justify-between"><span className="flex items-center gap-2 text-xs font-extrabold text-[#042C51]"><User size={14} className="text-[#667085]" />{note.author || "HR User"}</span><span className="flex items-center gap-1.5 font-mono text-[10px] text-[#667085]"><CalendarDays size={13} />{formatDate(note.date)}</span></div><p className="mt-4 whitespace-pre-wrap text-xs font-semibold leading-6 text-[#52637A]">{note.content}</p><button type="button" onClick={() => removeNote(note.id)} className="absolute bottom-4 right-4 rounded-lg p-1.5 text-red-500 opacity-0 hover:bg-red-50 group-hover:opacity-100" title="Delete note"><Trash2 size={14} /></button></article>)}</div>
    </div>
  );
}
