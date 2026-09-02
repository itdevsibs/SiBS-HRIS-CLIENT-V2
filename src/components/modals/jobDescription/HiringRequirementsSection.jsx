import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useJobDescription } from "../../../services/context/JobDescriptionContext";
import ThemedDropdown from "../../layout/dropdown/ThemedDropdown";
import {
  getThemedDropdownOptionLabel,
  getThemedDropdownOptionValue,
} from "../../layout/dropdown/themedDropdownUtils";

const fieldLabelClass =
  "mb-1.5 flex items-center justify-between gap-3 text-xs font-extrabold text-sibs-primary-1";

const inputClass =
  "h-10 w-full rounded-[10px] border border-sibs-tertiary-8 bg-[#F8FAFC] px-3 text-xs font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-[#EEF2F6] disabled:text-sibs-primary-1";

const locationWorkSetupOptions = [
  { value: "Davao Site (On-Site)", label: "Davao Site (On-Site)" },
  { value: "Tagum Site (On-Site)", label: "Tagum Site (On-Site)" },
  { value: "Mabini Site (On-Site)", label: "Mabini Site (On-Site)" },
];

function getCalendarDays(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    return date;
  });
}

function toDateKey(date) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDate(left, right) {
  if (!left || !right) return false;
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function DateDropdown({ label, required = false, value, onChange }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedDate = useMemo(() => {
    if (!value) return null;
    const [year, month, day] = String(value).split("-").map(Number);
    if (!year || !month || !day) return null;
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [value]);

  const [viewDate, setViewDate] = useState(() => selectedDate || new Date());
  const calendarDays = useMemo(() => getCalendarDays(viewDate), [viewDate]);
  const today = new Date();

  useEffect(() => {
    if (selectedDate) setViewDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const monthTitle = viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const displayValue = value ? value : "Select date";

  return (
    <div ref={dropdownRef} className="relative block min-w-0 z-[70]">
      <span className={fieldLabelClass}>
        <span>
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      </span>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-10 w-full items-center justify-between rounded-[10px] border px-3 text-left text-xs font-semibold outline-none transition-all duration-200 ${
          open
            ? "border-[#FF5C28] bg-white text-[#042C51] ring-4 ring-[#FF5C28]/10"
            : "border-sibs-tertiary-8 bg-[#F8FAFC] text-[#042C51] hover:border-[#FF5C28]/40 hover:bg-white"
        }`}
      >
        <span className="truncate">{displayValue}</span>
        <CalendarDays size={16} className="shrink-0 text-[#667085]" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[9999] mt-2 w-[280px] rounded-2xl border border-[#E6ECF2] bg-white p-3.5 shadow-[0_18px_40px_rgba(15,23,42,0.16)] transition-all duration-200">
          <div className="mb-3 flex items-center justify-between rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2">
            <button
              type="button"
              onClick={() =>
                setViewDate((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))
              }
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white text-[#042C51] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
            >
              <ChevronLeft size={15} />
            </button>
            <p className="text-xs font-extrabold text-[#042C51]">{monthTitle}</p>
            <button
              type="button"
              onClick={() =>
                setViewDate((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))
              }
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white text-[#042C51] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div
                key={day}
                className="py-1 text-center text-[10px] font-extrabold uppercase text-[#98A2B3]"
              >
                {day}
              </div>
            ))}

            {calendarDays.map((date) => {
              const isCurrentMonth = date.getMonth() === viewDate.getMonth();
              const isSelected = selectedDate && isSameDate(date, selectedDate);
              const isTodayDate = isSameDate(date, today);

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => {
                    onChange(toDateKey(date));
                    setOpen(false);
                  }}
                  className={`flex h-8 w-full items-center justify-center rounded-lg text-xs font-bold transition ${
                    isSelected
                      ? "bg-[#FF5C28] text-white shadow-sm"
                      : isTodayDate
                        ? "bg-[#FFF0EB] text-[#FF5C28] font-extrabold"
                        : isCurrentMonth
                          ? "text-[#042C51] hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
                          : "text-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[#E6ECF2] pt-2.5">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="rounded-full px-2.5 py-1 text-[11px] font-extrabold text-[#667085] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(toDateKey(today));
                setViewDate(today);
                setOpen(false);
              }}
              className="rounded-full px-2.5 py-1 text-[11px] font-extrabold text-[#042C51] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CompactInput({
  label,
  required = false,
  value,
  placeholder,
  type = "text",
  disabled = false,
  onChange,
}) {
  return (
    <label className="block min-w-0">
      <span className={fieldLabelClass}>
        <span>
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      </span>

      <input
        type={type}
        value={value || ""}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </label>
  );
}

export default function HiringRequirementSection({
  approvedJdOptions = [],
  approvedJdLoading = false,
  handleLinkedRequirementChange,
}) {
  const {
    form,
    setForm,
    accounts = [],
    departments = [],
  } = useJobDescription();

  const selectedExistingJd =
    form.existingJdId || form.existing_jd_id || form.linkedHiringRequirement || "";

  const selectedAccount =
    form.accountId || form.account_id || form.preparedForId || "";

  const selectedDepartment =
    form.departmentId || form.department_id || "";

  function updateField(field, value, aliases = []) {
    setForm((previous) => {
      const nextForm = {
        ...previous,
        [field]: value,
      };

      aliases.forEach((alias) => {
        nextForm[alias] = value;
      });

      return nextForm;
    });
  }

  function handleAccountChange(value) {
    const selectedOption = accounts.find(
      (option) => String(getThemedDropdownOptionValue(option)) === String(value),
    );
    const label = getThemedDropdownOptionLabel(selectedOption);

    setForm((previous) => ({
      ...previous,
      accountId: value,
      account_id: value,
      preparedForId: value,
      prepared_for_id: value,
      account: label,
      preparedFor: label,
      prepared_for: label,
    }));
  }

  function handleDepartmentChange(value) {
    const selectedOption = departments.find(
      (option) => String(getThemedDropdownOptionValue(option)) === String(value),
    );
    const label = getThemedDropdownOptionLabel(selectedOption);

    setForm((previous) => ({
      ...previous,
      departmentId: value,
      department_id: value,
      department: label,
      departmentName: label,
      department_name: label,
    }));
  }

  return (
    <div className="space-y-3.5">
      <ThemedDropdown
        label="Existing Job Description Template"
        helper="Select template or create new"
        value={selectedExistingJd}
        options={approvedJdOptions}
        disabled={approvedJdLoading}
        showPlaceholderOption
        placeholder={
          approvedJdLoading
            ? "Loading approved templates..."
            : "No Existing Job Description - New Job Description"
        }
        searchable
        zIndex="z-[300]"
        onChange={(value) => {
          handleLinkedRequirementChange?.(value);
        }}
      />

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        <CompactInput
          label="Document Title"
          required
          value={form.documentTitle || form.document_title || ""}
          placeholder="e.g. JD_Senior_Support_v1.0.pdf"
          onChange={(value) =>
            updateField("documentTitle", value, ["document_title"])
          }
        />

        <CompactInput
          label="Role Title"
          required
          value={form.roleTitle || form.role_title || ""}
          placeholder="e.g. Senior Customer Support Representative"
          onChange={(value) => updateField("roleTitle", value, ["role_title"])}
        />

        <ThemedDropdown
          label="Account / Client"
          required
          value={selectedAccount}
          options={accounts}
          placeholder="Search account"
          searchable
          zIndex="z-[200]"
          onChange={handleAccountChange}
        />

        <ThemedDropdown
          label="Department"
          required
          value={selectedDepartment}
          options={departments}
          placeholder="Search department"
          searchable
          onChange={handleDepartmentChange}
        />

        <ThemedDropdown
          label="Location / Work Setup"
          required
          value={form.locationWorkSetup || form.location_work_setup || ""}
          options={locationWorkSetupOptions}
          placeholder="Select location / work setup"
          onChange={(value) =>
            updateField("locationWorkSetup", value, ["location_work_setup"])
          }
        />

        <DateDropdown
          label="Date Requested"
          required
          value={form.dateRequested || form.date_requested || ""}
          onChange={(value) =>
            updateField("dateRequested", value, ["date_requested"])
          }
        />

        <CompactInput
          label="Prepared By / Requested By"
          required
          value={
            form.requestedBy ||
            form.requested_by ||
            form.owner ||
            form.preparedBy ||
            ""
          }
          disabled
          onChange={() => {}}
        />
      </div>
    </div>
  );
}
