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
} from "lucide-react";

import { getApprovedHiringNeeds } from "../../../lib/axios/getCandidatePipeline";
import { buildApprovedReprofileOptions } from "../../../lib/utils/candidatePipeline/offerReprofile";
import StatusModal from "../StatusModal";

import CandidatePipelineModalShell, {
  CandidateModalPrimaryButton,
  CandidateModalSecondaryButton,
  CandidateModalSection,
} from "../../recruitment/candidatePipeline/CandidatePipelineModalShell";
import CandidateModalSummary from "../../recruitment/candidatePipeline/CandidateModalSummary";

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

function getSuggestedReprofileOption(
  options = [],
  {
    hiringRequirementId = "",
    roleTitle = "",
    account = "",
  } = {},
) {
  const requirementId = cleanText(hiringRequirementId);
  const roleKey = normalizeKey(roleTitle);
  const accountKey = normalizeKey(account);

  if (requirementId) {
    const exactRequirement = options.find(
      (option) => String(option.value) === String(requirementId),
    );

    if (exactRequirement) {
      return exactRequirement;
    }
  }

  if (!accountKey) return null;

  return (
    options.find((option) => {
      const optionAccountKey = normalizeKey(option.account);
      const optionRoleKey = normalizeKey(option.roleTitle);

      return (
        optionAccountKey === accountKey &&
        (!roleKey || !optionRoleKey || optionRoleKey === roleKey)
      );
    }) || null
  );
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
        <div className="sibs-dropdown-pop-in absolute left-0 right-0 top-[calc(100%+8px)] z-[10080] overflow-hidden rounded-xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
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

function inputClass(hasError = false) {
  return `h-8.5 2xl:h-10 w-full rounded-xl border bg-[#F8FAFC] px-3 2xl:px-3.5 sibs-text-xs font-semibold text-[#042C51] shadow-sm outline-none transition placeholder:text-[#6B88A8] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-[#98A2B3] disabled:opacity-80 ${
    hasError
      ? "border-red-400 ring-4 ring-red-100 focus:border-red-500 focus:ring-red-100"
      : "border-[#D7DEE8]"
  }`;
}

function handleNumberInputWheel(event) {
  event.currentTarget.blur();
}

function textareaClass() {
  return "min-h-18 2xl:min-h-24 w-full resize-none rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 py-2 sibs-text-xs font-semibold leading-5 text-[#042C51] shadow-sm outline-none transition placeholder:text-[#6B88A8] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10";
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

function StartDatePicker({ value, onChange, hasError = false, inputRef = null }) {
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
        ref={inputRef}
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className={`${inputClass(hasError)} flex items-center justify-between text-left`}
      >
        <span className={value ? "text-sibs-primary-1" : "text-sibs-tertiary-5"}>
          {selectedDate
            ? selectedDate.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "2-digit" })
            : "Select start date"}
        </span>
        <CalendarDays size={18} className="shrink-0" />
      </button>

      {open && (
        <div className="sibs-dropdown-pop-in absolute left-0 top-[calc(100%+8px)] z-[10150] w-full min-w-[310px] rounded-xl border border-[#D9E2EC] bg-white p-3.5 shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
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
  const [validationErrors, setValidationErrors] = useState({});

  const finalAssignmentRef = useRef(null);
  const reprofileButtonRef = useRef(null);
  const basicPayRef = useRef(null);
  const deminimisRef = useRef(null);
  const startDateRef = useRef(null);

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

  function clearValidationError(field) {
    setValidationErrors((previous) => {
      if (!previous[field]) return previous;

      const next = { ...previous };
      delete next[field];
      return next;
    });
  }

  function focusFirstInvalidField(errors = {}) {
    const firstInvalidField = [
      "roleTitle",
      "account",
      "basicPay",
      "deminimisDailyRate",
      "startDate",
    ].find((field) => errors[field]);

    if (!firstInvalidField) return;

    if (firstInvalidField === "roleTitle" || firstInvalidField === "account") {
      finalAssignmentRef.current?.scrollIntoView?.({
        behavior: "smooth",
        block: "center",
      });

      window.setTimeout(() => {
        reprofileButtonRef.current?.focus?.({ preventScroll: true });
      }, 350);
      return;
    }

    if (firstInvalidField === "startDate") {
      setStartDateInitiated(true);
    }

    const targetRef =
      firstInvalidField === "basicPay"
        ? basicPayRef
        : firstInvalidField === "deminimisDailyRate"
          ? deminimisRef
          : startDateRef;

    window.setTimeout(() => {
      targetRef.current?.scrollIntoView?.({
        behavior: "smooth",
        block: "center",
      });
      targetRef.current?.focus?.({ preventScroll: true });
    }, firstInvalidField === "startDate" ? 50 : 0);
  }

  useEffect(() => {
    if (!open) {
      setStartDateInitiated(false);
      setValidationErrors({});
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
    setValidationErrors({});
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

  const suggestedReprofileOption = useMemo(
    () =>
      getSuggestedReprofileOption(reprofileOptions, {
        hiringRequirementId: form?.hiringRequirementId,
        roleTitle: candidateRoleTitle,
        account: form?.account,
      }),
    [
      reprofileOptions,
      form?.hiringRequirementId,
      form?.account,
      candidateRoleTitle,
    ],
  );

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
      clearValidationError("roleTitle");
      clearValidationError("account");
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

    const nextValidationErrors = {
      roleTitle: !cleanText(form?.roleTitle),
      account: !cleanText(form?.account),
      basicPay: isInvalidMoney(form?.basicPay),
      deminimisDailyRate: isInvalidMoney(form?.deminimisDailyRate),
      startDate:
        cleanText(form?.startDate) && isWeekendDateValue(form.startDate),
    };

    const hasValidationError = Object.values(nextValidationErrors).some(Boolean);

    if (hasValidationError) {
      setValidationErrors(nextValidationErrors);
      focusFirstInvalidField(nextValidationErrors);
      return;
    }

    setValidationErrors({});

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

  const busy = submitting || isSavingReprofile;

  const footer = (
    <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
      <CandidateModalSecondaryButton type="button" onClick={onClose} disabled={busy}>
        Cancel
      </CandidateModalSecondaryButton>
      <CandidateModalPrimaryButton
        type="submit"
        form="candidate-offer-details-form"
        disabled={busy}
        className="min-w-[168px]"
      >
        {submitting ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
        {submitting ? "Sending..." : "Proceed for Approval"}
      </CandidateModalPrimaryButton>
    </div>
  );

  return (
    <>
      <CandidatePipelineModalShell
        icon={BriefcaseBusiness}
        title="Candidate Offer Details"
        subtitle="Set the final assignment, compensation, and start date before submitting the offer for approval."
        badge="Offer Preparation"
        onClose={onClose}
        closeDisabled={busy}
        maxWidth="max-w-3xl 2xl:max-w-4xl"
        zIndex="z-[10020]"
        footer={footer}
      >
        {busy && (
          <div className="fixed inset-0 z-[24000] cursor-wait bg-transparent" aria-hidden="true" />
        )}

        <form id="candidate-offer-details-form" onSubmit={handleProceedClick} className="space-y-4 pb-8 sm:pb-10">
          <CandidateModalSummary candidate={candidate} stage={candidate?.currentStage || "Offered"} />

          <div ref={finalAssignmentRef}>
            <CandidateModalSection
              title="Final Assignment"
              subtitle="Role title remains fixed. Reprofile only when another approved Hiring Need account is required for the same role."
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                    Final Role Title <span className="text-[#FF5C28]"> *</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.roleTitle || ""}
                      disabled
                      readOnly
                      placeholder="Final role title"
                      className={`${inputClass(validationErrors.roleTitle)} pr-28`}
                      title="Role Title remains the same during account reprofile."
                    />
                    <button
                      ref={reprofileButtonRef}
                      type="button"
                      onClick={() => {
                        setSelectedReprofileId(
                          suggestedReprofileOption?.value || "",
                        );
                        setReprofileOpen(true);
                      }}
                      className="absolute right-1.5 top-1/2 inline-flex h-7.5 2xl:h-8 -translate-y-1/2 items-center justify-center gap-1.5 rounded-lg border border-[#D6E0EA] bg-white px-2.5 2xl:px-3 text-[10px] font-extrabold text-sibs-primary-1 transition hover:border-[#FF5C28]/35 hover:bg-[#FFF8F5] hover:text-[#FF5C28] focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-100"
                    >
                      <RefreshCw size={13} /> Reprofile
                    </button>
                  </div>
                  {validationErrors.roleTitle && (
                    <p className="mt-1.5 text-[10px] font-bold text-red-600">
                      Final Role Title is required.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                    Final Account <span className="text-[#FF5C28]"> *</span>
                  </label>
                  <input
                    type="text"
                    value={form.account || ""}
                    disabled
                    readOnly
                    placeholder="Final account"
                    className={inputClass(validationErrors.account)}
                  />
                  {validationErrors.account && (
                    <p className="mt-1.5 text-[10px] font-bold text-red-600">
                      Select an approved account using Reprofile.
                    </p>
                  )}
                </div>
              </div>

              {!cleanText(form?.hiringRequirementId) && (
                <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-[10px] font-bold leading-5 text-amber-800">
                  No approved Hiring Requirement matches this Role Title and Account. Use Reprofile to select an approved account before proceeding.
                </div>
              )}
            </CandidateModalSection>
          </div>

          <CandidateModalSection title="Compensation">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                  Basic Daily Rate <span className="text-[#FF5C28]"> *</span>
                </label>
                <input
                  ref={basicPayRef}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.basicPay || ""}
                  onChange={(event) => {
                    updateForm({ basicPay: event.target.value });
                    if (!isInvalidMoney(event.target.value)) {
                      clearValidationError("basicPay");
                    }
                  }}
                  onWheel={handleNumberInputWheel}
                  placeholder="0.00"
                  aria-invalid={Boolean(validationErrors.basicPay)}
                  className={`${inputClass(validationErrors.basicPay)} tabular-nums`}
                />
                {validationErrors.basicPay && (
                  <p className="mt-1.5 text-[10px] font-bold text-red-600">
                    Enter a valid Basic Daily Rate greater than 0.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                  Daily De Minimis <span className="text-[#FF5C28]"> *</span>
                </label>
                <input
                  ref={deminimisRef}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.deminimisDailyRate || ""}
                  onChange={(event) => {
                    updateForm({ deminimisDailyRate: event.target.value });
                    if (!isInvalidMoney(event.target.value)) {
                      clearValidationError("deminimisDailyRate");
                    }
                  }}
                  onWheel={handleNumberInputWheel}
                  placeholder="0.00"
                  aria-invalid={Boolean(validationErrors.deminimisDailyRate)}
                  className={`${inputClass(validationErrors.deminimisDailyRate)} tabular-nums`}
                />
                {validationErrors.deminimisDailyRate && (
                  <p className="mt-1.5 text-[10px] font-bold text-red-600">
                    Enter a valid Daily De Minimis greater than 0.
                  </p>
                )}
              </div>
            </div>
          </CandidateModalSection>

          <CandidateModalSection title="Start Date & Remarks">
            <div className="space-y-4 pb-2">
              <button
                type="button"
                onClick={() => {
                  if (startDateInitiated) {
                    updateForm({ startDate: "" });
                    clearValidationError("startDate");
                    setStartDateInitiated(false);
                    return;
                  }
                  setStartDateInitiated(true);
                }}
                className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg border border-[#D6E0EA] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-primary-1 transition hover:border-[#FF5C28]/35 hover:bg-[#FFF8F5] hover:text-[#FF5C28]"
              >
                <CalendarDays size={14} />
                {startDateInitiated ? "Hide Start Date" : "Add Start Date"}
              </button>

              {startDateInitiated && (
                <div className="max-w-md">
                  <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">Start Date</label>
                  <StartDatePicker
                    inputRef={startDateRef}
                    value={form.startDate || ""}
                    hasError={validationErrors.startDate}
                    onChange={(startDate) => {
                      updateForm({ startDate });
                      if (!isWeekendDateValue(startDate)) {
                        clearValidationError("startDate");
                      }
                    }}
                  />
                  {validationErrors.startDate && (
                    <p className="mt-1.5 text-[10px] font-bold text-red-600">
                      Select a weekday start date.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">Remarks</label>
                <textarea
                  value={form.remarks || ""}
                  onChange={(event) => updateForm({ remarks: event.target.value })}
                  placeholder="Example: Offer prepared after passed interview."
                  className={textareaClass()}
                />
              </div>
            </div>
          </CandidateModalSection>

          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 sibs-text-xs font-semibold leading-5 text-amber-800">
            After proceeding, the candidate will move to Offered and will be available in the Offers page for approval and contract sending.
          </div>
        </form>
      </CandidatePipelineModalShell>

      {reprofileOpen && (
        <CandidatePipelineModalShell
          icon={RefreshCw}
          title="Reprofile Candidate"
          subtitle="Keep the same Role Title and select another approved Hiring Need account."
          badge="Approved PRF"
          onClose={() => setReprofileOpen(false)}
          closeDisabled={isSavingReprofile}
          maxWidth="max-w-lg"
          zIndex="z-[10100]"
          footer={
            <div className="flex justify-end gap-2">
              <CandidateModalSecondaryButton type="button" disabled={isSavingReprofile} onClick={() => setReprofileOpen(false)}>
                Cancel
              </CandidateModalSecondaryButton>
              <CandidateModalPrimaryButton type="button" disabled={isSavingReprofile} onClick={handleSaveReprofile}>
                {isSavingReprofile && <Loader2 size={15} className="animate-spin" />}
                Save Reprofile
              </CandidateModalPrimaryButton>
            </div>
          }
        >
          <div className="space-y-4">
            <CandidateModalSection title="Current Role">
              <input value={candidateRoleTitle} disabled readOnly className={inputClass()} />
            </CandidateModalSection>
            <CandidateModalSection title="Approved Hiring Requirement">
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
            </CandidateModalSection>
          </div>
        </CandidatePipelineModalShell>
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
