import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronDown,
  Loader2,
  Search,
  RefreshCw,
  X,
} from "lucide-react";

import { getApprovedHiringNeeds } from "../../../lib/axios/getCandidatePipeline";
import { buildApprovedReprofileOptions } from "../../../lib/utils/candidatePipeline/offerReprofile";
import StatusModal from "../StatusModal";

const BRAND_BLUE = "#0D4676";

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ");
}

function formatMoneyInput(value) {
  if (value === null || value === undefined || value === "") return "";

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) return cleanText(value);

  return numberValue.toFixed(2);
}

function getCandidateName(candidate = {}) {
  return (
    candidate.name ||
    candidate.candidateName ||
    candidate.fullName ||
    "Unnamed Candidate"
  );
}

function getCandidateRoleAccount(candidate = {}) {
  return (
    candidate.roleAccount ||
    [candidate.roleTitle || candidate.openPosition, candidate.account]
      .filter(Boolean)
      .join(" / ") ||
    "Not assigned yet"
  );
}

function getHiringNeedId(item = {}) {
  return (
    item.id ??
    item.hiringNeedId ??
    item.hiring_need_id ??
    item.prfId ??
    item.prf_id ??
    ""
  );
}

function getHiringNeedRole(item = {}) {
  return (
    item.roleTitle ||
    item.role_title ||
    item.position ||
    item.positionTitle ||
    item.jobTitle ||
    item.job_title ||
    ""
  );
}

function getHiringNeedAccount(item = {}) {
  return item.account || item.accountName || item.account_name || "";
}

function getHiringNeedDepartment(item = {}) {
  return item.department || item.departmentName || item.department_name || "";
}

function getHiringNeedApprovedRequirement(item = {}) {
  return (
    item.approvedRequirement ??
    item.approved_requirement ??
    item.requiredHeadcount ??
    item.required_headcount ??
    item.requiredHC ??
    item.required_hc ??
    ""
  );
}

function getHiringNeedLabel(item = {}) {
  const id = getHiringNeedId(item);
  const roleTitle = getHiringNeedRole(item);
  const account = getHiringNeedAccount(item);
  const department = getHiringNeedDepartment(item);
  const approvedRequirement = getHiringNeedApprovedRequirement(item);

  const prfLabel = id ? `PRF-${String(id).padStart(4, "0")}` : "PRF";
  const roleAccount = [roleTitle, account].filter(Boolean).join(" / ");
  const departmentPart = department ? ` • ${department}` : "";
  const hcPart =
    approvedRequirement !== "" && approvedRequirement !== null
      ? ` • Approved HC: ${approvedRequirement}`
      : "";

  return `${prfLabel}${roleAccount ? ` — ${roleAccount}` : ""}${departmentPart}${hcPart}`;
}

function normalizeHiringNeed(item = {}) {
  const id = getHiringNeedId(item);
  const roleTitle = getHiringNeedRole(item);
  const account = getHiringNeedAccount(item);
  const department = getHiringNeedDepartment(item);
  const approvedRequirement = getHiringNeedApprovedRequirement(item);

  const label =
    item.label ||
    item.displayLabel ||
    item.display_label ||
    getHiringNeedLabel(item);

  return {
    ...item,
    id: cleanText(id),
    value: cleanText(id),
    label: cleanText(label),
    roleTitle: cleanText(roleTitle),
    account: cleanText(account),
    department: cleanText(department),
    approvedRequirement,
    priority: item.priority || "",
    locationSite: item.locationSite || item.location_site || "",
    requestedStartDate:
      item.requestedStartDate || item.requested_start_date || "",
    dueDate: item.dueDate || item.due_date || "",
    basicPay:
      item.basicPay ??
      item.basic_pay ??
      item.salary ??
      item.compensation ??
      item.offer_basic_pay ??
      "",
    deminimisDailyRate:
      item.deminimisDailyRate ??
      item.deminimis_daily_rate ??
      item.deminimis ??
      item.dailyRate ??
      item.daily_rate ??
      "",
  };
}

function uniqueOptions(options = []) {
  const map = new Map();

  options.forEach((option) => {
    const key = normalizeKey(option.value || option.label);
    if (!key) return;

    if (!map.has(key)) {
      map.set(key, option);
    }
  });

  return Array.from(map.values());
}

function isEmptyMoney(value) {
  return value === null || value === undefined || cleanText(value) === "";
}

function isInvalidMoney(value) {
  if (isEmptyMoney(value)) return true;

  const numericValue = Number(value);

  return !Number.isFinite(numericValue) || numericValue <= 0;
}

function HrisDropdown({
  label,
  required = false,
  placeholder = "Select option",
  value = "",
  options = [],
  onChange,
  disabled = false,
  loading = false,
  searchable = true,
  emptyText = "No options found.",
}) {
  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");

  const selectedOption = useMemo(() => {
    return options.find((option) => String(option.value) === String(value));
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    const searchText = normalizeKey(keyword);

    if (!searchText) return options;

    return options.filter((option) => {
      const haystack = normalizeKey(
        [
          option.label,
          option.subLabel,
          option.roleTitle,
          option.account,
          option.department,
          option.searchText,
        ]
          .filter(Boolean)
          .join(" "),
      );

      return haystack.includes(searchText);
    });
  }, [options, keyword]);

  const controlText = selectedOption?.label || cleanText(value) || "";
  const inputValue = open ? keyword : controlText;
  const inputPlaceholder = loading
    ? "Loading options..."
    : controlText || placeholder;

  useEffect(() => {
    function handleClickOutside(event) {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(event.target)) {
        setOpen(false);
        setKeyword("");
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
        setKeyword("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (open && searchable) {
      window.setTimeout(() => searchInputRef.current?.focus?.(), 50);
    }
  }, [open, searchable]);

  function openDropdown() {
    if (disabled) return;
    setOpen(true);
  }

  function toggleDropdown(event) {
    event.preventDefault();
    event.stopPropagation();

    if (disabled) return;

    setOpen((previous) => {
      const nextOpen = !previous;

      if (nextOpen) {
        setKeyword("");
        window.setTimeout(() => searchInputRef.current?.focus?.(), 50);
      }

      return nextOpen;
    });
  }

  function handleSearchFocus() {
    if (disabled) return;

    setKeyword("");
    setOpen(true);
  }

  function handleSearchChange(event) {
    setKeyword(event.target.value);
    setOpen(true);
  }

  function handleSearchKeyDown(event) {
    if (event.key === "Escape") {
      setOpen(false);
      setKeyword("");
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
      }
    }
  }

  function handleSelect(option) {
    onChange?.(option);
    setOpen(false);
    setKeyword("");
  }

  return (
    <div ref={wrapperRef} className="relative min-w-0">
      {label && (
        <label className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {searchable ? (
        <div
          onClick={openDropdown}
          className={`flex h-12 w-full min-w-0 items-center gap-3 rounded-xl border px-4 text-left text-sm font-extrabold shadow-sm outline-none transition ${
            open
              ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
              : "border-[#D0D5DD] hover:border-sibs-primary-1/50 hover:bg-[#F8FAFC]"
          } ${
            disabled
              ? "cursor-not-allowed bg-[#F8FAFC] text-sibs-tertiary-5"
              : "cursor-text bg-white text-sibs-primary-1"
          }`}
        >
          <Search
            size={17}
            className={`shrink-0 ${
              disabled ? "text-sibs-tertiary-5" : "text-sibs-primary-1"
            }`}
          />

          <input
            ref={searchInputRef}
            value={inputValue}
            disabled={disabled || loading}
            onFocus={handleSearchFocus}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder={inputPlaceholder}
            className="h-full min-w-0 flex-1 bg-transparent text-sm font-extrabold text-sibs-primary-1 outline-none placeholder:text-sibs-tertiary-5 disabled:cursor-not-allowed disabled:text-sibs-tertiary-5"
          />

          {loading ? (
            <Loader2
              size={18}
              className="shrink-0 animate-spin text-sibs-primary-1"
            />
          ) : (
            <button
              type="button"
              tabIndex={-1}
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={toggleDropdown}
              className="shrink-0 rounded-lg p-1 text-sibs-primary-1 transition hover:bg-[#EAF4FF] disabled:cursor-not-allowed disabled:text-sibs-tertiary-5 disabled:hover:bg-transparent"
            >
              <ChevronDown
                size={18}
                className={`transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={toggleDropdown}
          className={`flex h-12 w-full min-w-0 items-center justify-between gap-3 rounded-xl border px-4 text-left text-sm font-extrabold shadow-sm outline-none transition ${
            open
              ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
              : "border-[#D0D5DD] hover:border-sibs-primary-1/50 hover:bg-[#F8FAFC]"
          } ${
            disabled
              ? "cursor-not-allowed bg-[#F8FAFC] text-sibs-tertiary-5"
              : "bg-white text-sibs-primary-1"
          }`}
        >
          <span
            className={`min-w-0 flex-1 truncate ${
              selectedOption ? "text-sibs-primary-1" : "text-sibs-tertiary-5"
            }`}
          >
            {loading
              ? "Loading options..."
              : selectedOption?.label || cleanText(value) || placeholder}
          </span>

          {loading ? (
            <Loader2
              size={18}
              className="shrink-0 animate-spin text-sibs-primary-1"
            />
          ) : (
            <ChevronDown
              size={18}
              className={`shrink-0 transition-transform ${
                disabled ? "text-sibs-tertiary-5" : "text-sibs-primary-1"
              } ${open ? "rotate-180" : ""}`}
            />
          )}
        </button>
      )}

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[10080] overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="max-h-72 overflow-y-auto py-2">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const active = String(option.value) === String(value);

                return (
                  <button
                    key={`${option.value}-${option.label}`}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition ${
                      active
                        ? "bg-[#EAF4FF] text-sibs-primary-1"
                        : "bg-white text-[#344054] hover:bg-[#F5F9FF] hover:text-sibs-primary-1"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold">
                        {option.label}
                      </span>

                      {option.subLabel && (
                        <span className="mt-0.5 block truncate text-xs font-semibold text-sibs-tertiary-5">
                          {option.subLabel}
                        </span>
                      )}
                    </span>

                    {active && (
                      <Check
                        size={17}
                        className="mt-0.5 shrink-0 text-sibs-primary-1"
                      />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-5 text-center text-sm font-bold text-sibs-tertiary-5">
                {emptyText}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function inputClass() {
  return "h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-extrabold text-sibs-primary-1 shadow-sm outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-sibs-tertiary-5 disabled:opacity-80";
}

function handleNumberInputWheel(event) {
  event.currentTarget.blur();
}

function textareaClass() {
  return "min-h-[92px] w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-bold leading-6 text-sibs-primary-1 shadow-sm outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10";
}

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function toDateValue(date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function parseDateValue(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(cleanText(value));
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function isWeekendDateValue(value) {
  const date = parseDateValue(value);
  return !!date && (date.getDay() === 0 || date.getDay() === 6);
}

function StartDatePicker({ value, onChange }) {
  const wrapperRef = useRef(null);
  const selectedDate = parseDateValue(value);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => selectedDate || new Date());

  useEffect(() => {
    if (selectedDate) setViewDate(selectedDate);
  }, [value]);

  useEffect(() => {
    function close(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, index) =>
    index < firstDay ? null : new Date(year, month, index - firstDay + 1),
  );

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className={`${inputClass()} flex items-center justify-between text-left`}
      >
        <span className={value ? "text-sibs-primary-1" : "text-sibs-tertiary-5"}>
          {selectedDate
            ? selectedDate.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "2-digit" })
            : "Select start date"}
        </span>
        <CalendarDays size={18} className="shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[10150] w-full min-w-[310px] rounded-2xl border border-[#D9E2EC] bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="rounded-lg p-2 hover:bg-gray-100"><ChevronLeft size={18} /></button>
            <span className="text-sm font-extrabold text-sibs-primary-1">{viewDate.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}</span>
            <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="rounded-lg p-2 hover:bg-gray-100"><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-extrabold text-sibs-tertiary-5">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day) => <span key={day} className="py-1">{day}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((date, index) => {
              if (!date) return <span key={`blank-${index}`} />;
              const dateValue = toDateValue(date);
              const disabled = date < today || date.getDay() === 0 || date.getDay() === 6;
              const active = dateValue === value;
              return (
                <button
                  key={dateValue}
                  type="button"
                  disabled={disabled}
                  onClick={() => { onChange(dateValue); setOpen(false); }}
                  className={`h-9 rounded-lg text-sm font-bold transition ${active ? "bg-sibs-primary-1 text-white" : disabled ? "cursor-not-allowed bg-gray-50 text-gray-300" : "text-sibs-primary-1 hover:bg-[#EAF4FF]"}`}
                  title={date.getDay() === 0 || date.getDay() === 6 ? "Saturday and Sunday are unavailable" : undefined}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs font-semibold text-sibs-tertiary-5">Saturdays and Sundays are unavailable.</p>
        </div>
      )}
    </div>
  );
}

export default function CandidateOfferDetailsModal({
  open,
  candidate,
  form,
  setForm,
  onClose,
  onReprofile,
  onSubmit,
  submitting = false,
}) {
  const [approvedHiringNeeds, setApprovedHiringNeeds] = useState([]);
  const [isLoadingHiringNeeds, setIsLoadingHiringNeeds] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reprofileOpen, setReprofileOpen] = useState(false);
  const [selectedReprofileId, setSelectedReprofileId] = useState("");
  const [isSavingReprofile, setIsSavingReprofile] = useState(false);
  const [startDateInitiated, setStartDateInitiated] = useState(false);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "error",
    title: "",
    message: "",
  });

  function showStatusModal({
    type = "error",
    title = "Something went wrong",
    message = "Please try again.",
  }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });
  }

  function closeStatusModal() {
    setStatusModal({
      open: false,
      type: "error",
      title: "",
      message: "",
    });
  }

  useEffect(() => {
    if (!open) {
      setStartDateInitiated(false);
      return;
    }

    /*
     * Every new Offer Details for Approval session must require fresh
     * compensation and start-date input. Do not reuse values from a previous
     * offer, negotiation, candidate record, or previous modal session.
     *
     * Keep role/account/remarks and the rest of the parent form unchanged.
     */
    setForm((previous) => ({
      ...previous,
      basicPay: "",
      deminimisDailyRate: "",
      startDate: "",
    }));

    setStartDateInitiated(false);
  }, [open, setForm]);

  useEffect(() => {
    let active = true;

    async function loadApprovedHiringNeeds() {
      if (!open) return;

      setIsLoadingHiringNeeds(true);
      setLoadError("");

      try {
        const response = await getApprovedHiringNeeds();

        if (!active) return;

        const rows = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.hiringNeeds)
            ? response.hiringNeeds
            : Array.isArray(response)
              ? response
              : [];

        const normalizedRows = rows
          .map(normalizeHiringNeed)
          .filter((item) => item.id && item.label);

        setApprovedHiringNeeds(normalizedRows);
      } catch (error) {
        if (!active) return;

        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load approved hiring needs.";

        console.error(
          "Load approved hiring needs error:",
          error?.response?.data || error?.message,
        );

        setApprovedHiringNeeds([]);
        setLoadError(message);

        showStatusModal({
          type: "error",
          title: "Hiring Needs Not Loaded",
          message,
        });
      } finally {
        if (active) setIsLoadingHiringNeeds(false);
      }
    }

    loadApprovedHiringNeeds();

    return () => {
      active = false;
    };
  }, [open]);

  const candidateRoleTitle = cleanText(
    form?.roleTitle || candidate?.roleTitle || candidate?.openPosition,
  );

  const reprofileOptions = useMemo(() => {
    return buildApprovedReprofileOptions({
      hiringNeeds: approvedHiringNeeds,
    });
  }, [approvedHiringNeeds]);

  if (!open || !candidate) return null;

  function updateForm(patch) {
    setForm((previous) => ({
      ...previous,
      ...patch,
    }));
  }

  async function handleSaveReprofile() {
    const selected = reprofileOptions.find(
      (option) => String(option.value) === String(selectedReprofileId),
    );

    if (!selected) {
      showStatusModal({
        type: "error",
        title: "Select an Account",
        message: "Select an approved account for the same Role Title.",
      });
      return;
    }

    setIsSavingReprofile(true);
    try {
      const response = await onReprofile?.({
        hiringRequirementId: selected.value,
        account: selected.account,
      });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to reprofile account.");
      }

      updateForm({
        hiringRequirementId: selected.value,
        hiringRequirementLabel: selected.raw?.label || "",
        roleTitle: candidateRoleTitle,
        finalRole: candidateRoleTitle,
        account: selected.account,
        finalAccount: selected.account,
        hiringNeed: selected.raw || null,
      });
      setSelectedReprofileId("");
      setReprofileOpen(false);
    } catch (error) {
      showStatusModal({
        type: "error",
        title: "Reprofile Failed",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to reprofile candidate account.",
      });
    } finally {
      setIsSavingReprofile(false);
    }
  }

  async function handleProceedClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const missingFields = [];

    if (!cleanText(form?.roleTitle)) {
      missingFields.push("Final Role Title");
    }

    if (!cleanText(form?.account)) {
      missingFields.push("Final Account");
    }

    if (isInvalidMoney(form?.basicPay)) {
      missingFields.push("Valid Basic Daily Rate");
    }

    if (isInvalidMoney(form?.deminimisDailyRate)) {
      missingFields.push("Valid Daily De Minimis");
    }

    if (cleanText(form?.startDate) && isWeekendDateValue(form.startDate)) {
      missingFields.push("Weekday Start Date");
    }

    if (missingFields.length > 0) {
      showStatusModal({
        type: "error",
        title: "Complete Required Fields",
        message: `Please complete the following before proceeding: ${missingFields.join(
          ", ",
        )}.`,
      });

      return;
    }

    try {
      const result = onSubmit?.(event);

      if (result && typeof result.then === "function") {
        await result;
      }
    } catch (error) {
      showStatusModal({
        type: "error",
        title: "Proceed Failed",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to proceed for approval.",
      });
    }
  }

  return (
    <>
      <div
        className="sibs-modal-blur fixed inset-0 z-[10020] flex h-dvh items-center justify-center px-4 py-4"
      >
      {submitting || isSavingReprofile && (
        <div
          className="fixed inset-0 z-[24000] cursor-wait bg-transparent"
          aria-hidden="true"
        />
      )}
<div
          className="relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          {submitting && (
            <div className="absolute inset-0 z-50 flex flex-col rounded-2xl bg-white p-6">
              <div className="animate-pulse space-y-5">
                <div className="h-7 w-64 rounded bg-slate-200" />
                <div className="h-4 w-96 max-w-full rounded bg-slate-200" />
                <div className="h-20 rounded-xl bg-slate-100" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="h-16 rounded-xl bg-slate-100" />
                  <div className="h-16 rounded-xl bg-slate-100" />
                  <div className="h-16 rounded-xl bg-slate-100" />
                  <div className="h-16 rounded-xl bg-slate-100" />
                </div>
                <div className="h-24 rounded-xl bg-slate-100" />
                <div className="h-20 rounded-xl bg-amber-50" />
              </div>
              <div className="mt-auto flex items-center justify-center gap-3 pt-6 text-sm font-extrabold text-sibs-primary-1">
                <Loader2 size={20} className="animate-spin" />
                Generating PDF and sending offer for approval...
              </div>
            </div>
          )}
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
            <div>
              <h2 className="text-lg font-extrabold text-sibs-primary-1 sm:text-xl">
                Offer Details for Approval
              </h2>

              <p className="mt-1 text-sm font-semibold text-sibs-primary-1/80">
                Add the final assignment and pay details. Approval will be
                managed in the Offers page.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting || isSavingReprofile}
              className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={handleProceedClick}
            className="flex-1 overflow-y-auto p-4 sm:p-6"
          >
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: BRAND_BLUE }}
                  >
                    <BriefcaseBusiness size={20} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-extrabold text-sibs-primary-1">
                      {getCandidateName(candidate)}
                    </h3>

                    <p className="mt-1 break-words text-sm font-bold text-sibs-primary-1/80">
                      {getCandidateRoleAccount(candidate)}
                    </p>
                  </div>
                </div>
              </div>



              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                    Final Role Title <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.roleTitle || ""}
                      disabled
                      readOnly
                      placeholder="Final role title"
                      className={`${inputClass()} pr-32`}
                      title="Role Title remains the same during account reprofile."
                    />
                    <button
                      type="button"
                      onClick={() => setReprofileOpen(true)}
                      className="absolute right-1.5 top-1/2 inline-flex h-9 -translate-y-1/2 items-center justify-center gap-2 rounded-lg border border-sibs-primary-1 bg-white px-3 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#EAF4FF]"
                    >
                      <RefreshCw size={15} />
                      Reprofile
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                    Final Account <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.account || ""}
                    disabled
                    readOnly
                    placeholder="Final account"
                    className={inputClass()}
                  />
                </div>
              </div>


              <p className="-mt-2 text-xs font-bold text-sibs-primary-1/80">
                Final Role Title remains unchanged. Use Reprofile to select
                another approved account for the same Role Title.
              </p>

              {!cleanText(form?.hiringRequirementId) && (
                <p className="-mt-2 text-xs font-bold text-amber-700">
                  No approved Hiring Requirement matches this Role Title and Account. Use
                  Reprofile to select an approved account before proceeding.
                </p>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                    Basic Daily Rate <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.basicPay || ""}
                    onChange={(event) =>
                      updateForm({
                        basicPay: event.target.value,
                      })
                    }
                    onWheel={handleNumberInputWheel}
                    placeholder="0.00"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                    Daily De Minimis{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.deminimisDailyRate || ""}
                    onChange={(event) =>
                      updateForm({
                        deminimisDailyRate: event.target.value,
                      })
                    }
                    onWheel={handleNumberInputWheel}
                    placeholder="0.00"
                    className={inputClass()}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    if (startDateInitiated) {
                      updateForm({ startDate: "" });
                      setStartDateInitiated(false);
                      return;
                    }

                    setStartDateInitiated(true);
                  }}
                  className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl border border-sibs-primary-1 bg-white px-4 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#EAF4FF]"
                >
                  <CalendarDays size={16} />
                  {startDateInitiated ? "Hide Start Date" : "Add Start Date"}
                </button>

                {startDateInitiated && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                        Start Date
                      </label>
                      <StartDatePicker
                        value={form.startDate || ""}
                        onChange={(startDate) => updateForm({ startDate })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  Remarks
                </label>

                <textarea
                  value={form.remarks || ""}
                  onChange={(event) =>
                    updateForm({
                      remarks: event.target.value,
                    })
                  }
                  placeholder="Example: Offer prepared after passed interview."
                  className={textareaClass()}
                />
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-sm font-extrabold leading-6 text-sibs-primary-1">
                  After proceeding, the candidate will move to Offered and will
                  be available in the Offers page for approval and contract
                  sending.
                </p>
              </div>
            </div>
          </form>

          <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
            <div className="flex flex-col justify-end gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting || isSavingReprofile}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-extrabold text-gray-600 transition hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleProceedClick}
                disabled={submitting || isSavingReprofile}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white transition hover:opacity-90"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ArrowRight size={16} />
                )}
                {submitting ? "Sending..." : "Proceed for Approval"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {reprofileOpen && (
        <div
          className="sibs-modal-blur fixed inset-0 z-[10100] flex h-dvh items-center justify-center px-4 py-4"
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-sibs-primary-1">Reprofile Candidate</h3>
                <p className="mt-1 text-sm font-bold text-sibs-tertiary-5">Keep the same Role Title and select an approved Hiring Need account.</p>
              </div>
              <button type="button" onClick={() => setReprofileOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">Role Title</label>
                <input value={candidateRoleTitle} disabled readOnly className={inputClass()} />
              </div>
              <HrisDropdown
                label="Hiring Requirement / PRF"
                required
                placeholder="Search approved hiring requirement / PRF"
                value={selectedReprofileId}
                options={reprofileOptions}
                onChange={(option) => setSelectedReprofileId(option?.value || "")}
                loading={isLoadingHiringNeeds}
                emptyText={loadError || "No approved Hiring Needs are available."}
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" disabled={isSavingReprofile} onClick={() => setReprofileOpen(false)} className="h-11 rounded-xl border border-[#E6ECF2] px-5 text-sm font-extrabold text-gray-600">Cancel</button>
              <button type="button" disabled={isSavingReprofile} onClick={handleSaveReprofile} className="inline-flex h-11 items-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white disabled:opacity-60">
                {isSavingReprofile && <Loader2 size={16} className="animate-spin" />}
                Save Reprofile
              </button>
            </div>
          </div>
        </div>
      )}

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={closeStatusModal}
        variant="center"
        lockScroll
      />
    </>
  );
}
