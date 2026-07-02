import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Loader2,
  Search,
  X,
} from "lucide-react";

import { getApprovedHiringNeeds } from "../../../lib/axios/getCandidatePipeline";
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

function textareaClass() {
  return "min-h-[92px] w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-bold leading-6 text-sibs-primary-1 shadow-sm outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10";
}

export default function OfferDetailsModal({
  open,
  candidate,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  const [approvedHiringNeeds, setApprovedHiringNeeds] = useState([]);
  const [isLoadingHiringNeeds, setIsLoadingHiringNeeds] = useState(false);
  const [loadError, setLoadError] = useState("");

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

  const hiringRequirementOptions = useMemo(() => {
    return approvedHiringNeeds.map((item) => ({
      value: item.id,
      label: item.label,
      subLabel: [
        item.roleTitle ? `Role: ${item.roleTitle}` : "",
        item.account ? `Account: ${item.account}` : "",
        item.department ? `Department: ${item.department}` : "",
      ]
        .filter(Boolean)
        .join(" • "),
      searchText: [
        item.id,
        item.label,
        item.roleTitle,
        item.account,
        item.department,
        item.locationSite,
      ]
        .filter(Boolean)
        .join(" "),
      raw: item,
    }));
  }, [approvedHiringNeeds]);

  const accountOptions = useMemo(() => {
    const approvedAccounts = approvedHiringNeeds
      .map((item) => cleanText(item.account))
      .filter(Boolean)
      .map((account) => ({
        value: account,
        label: account,
      }));

    const currentAccount = cleanText(form?.account);

    if (currentAccount) {
      approvedAccounts.unshift({
        value: currentAccount,
        label: currentAccount,
      });
    }

    return uniqueOptions(approvedAccounts);
  }, [approvedHiringNeeds, form?.account]);

  const selectedHiringNeed = useMemo(() => {
    return approvedHiringNeeds.find(
      (item) => String(item.id) === String(form?.hiringRequirementId),
    );
  }, [approvedHiringNeeds, form?.hiringRequirementId]);

  if (!open || !candidate) return null;

  function updateForm(patch) {
    setForm((previous) => ({
      ...previous,
      ...patch,
    }));
  }

  function handleHiringNeedSelect(option) {
    const selected = option?.raw;

    if (!selected) {
      updateForm({
        hiringRequirementId: "",
        hiringRequirementLabel: "",
        roleTitle: "",
        finalRole: "",
        account: "",
        finalAccount: "",
        hiringNeed: null,
      });
      return;
    }

    updateForm({
      hiringRequirementId: selected.id,
      hiringRequirementLabel: selected.label,
      roleTitle: selected.roleTitle || "",
      finalRole: selected.roleTitle || "",
      account: selected.account || "",
      finalAccount: selected.account || "",
      basicPay:
        selected.basicPay !== "" && selected.basicPay !== null
          ? formatMoneyInput(selected.basicPay)
          : form.basicPay || "",
      deminimisDailyRate:
        selected.deminimisDailyRate !== "" &&
        selected.deminimisDailyRate !== null
          ? formatMoneyInput(selected.deminimisDailyRate)
          : form.deminimisDailyRate || "",
      hiringNeed: selected,
    });
  }

  function handleAccountSelect() {
    return;
  }

  async function handleProceedClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const missingFields = [];

    if (!cleanText(form?.hiringRequirementId)) {
      missingFields.push("Hiring Requirement / PRF");
    }

    if (!cleanText(form?.roleTitle)) {
      missingFields.push("Final Role Title");
    }

    if (!cleanText(form?.account)) {
      missingFields.push("Final Account");
    }

    if (isInvalidMoney(form?.basicPay)) {
      missingFields.push("Valid Basic Pay");
    }

    if (isInvalidMoney(form?.deminimisDailyRate)) {
      missingFields.push("Valid Deminimis / Daily Rate");
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
        className="fixed inset-0 z-[10020] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
        onClick={onClose}
      >
        <div
          className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
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

              <div>
                <HrisDropdown
                  label="Hiring Requirement / PRF"
                  required
                  placeholder="Search approved hiring requirement / PRF"
                  value={form.hiringRequirementId || ""}
                  options={hiringRequirementOptions}
                  onChange={handleHiringNeedSelect}
                  loading={isLoadingHiringNeeds}
                  emptyText={
                    loadError ||
                    "No approved hiring requirements found. Approve a Hiring Need first."
                  }
                />

                <p className="mt-2 text-xs font-bold text-sibs-primary-1">
                  Only Hiring Needs with{" "}
                  <span className="font-extrabold">Approved</span> approval
                  status are displayed here.
                </p>
              </div>

              {selectedHiringNeed && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                    Selected Approved Hiring Need
                  </p>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase text-sibs-tertiary-5">
                        Role Title
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-sibs-primary-1">
                        {selectedHiringNeed.roleTitle || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-extrabold uppercase text-sibs-tertiary-5">
                        Account
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-sibs-primary-1">
                        {selectedHiringNeed.account || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-extrabold uppercase text-sibs-tertiary-5">
                        Department
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-sibs-primary-1">
                        {selectedHiringNeed.department || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-extrabold uppercase text-sibs-tertiary-5">
                        Approved Requirement
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-sibs-primary-1">
                        {selectedHiringNeed.approvedRequirement || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                    Final Role Title <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={form.roleTitle || ""}
                    disabled
                    readOnly
                    placeholder="Final role title"
                    className={inputClass()}
                    title="Final role title is automatically based on the selected Hiring Requirement / PRF."
                  />
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
                    title="Final account is automatically based on the selected Hiring Requirement / PRF."
                  />
                </div>
              </div>

              <p className="-mt-2 text-xs font-bold text-sibs-tertiary-5">
                Final Role Title and Final Account are locked because they are
                automatically based on the selected Hiring Requirement / PRF.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                    Basic Pay <span className="text-red-500">*</span>
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
                    placeholder="0.00"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                    Deminimis / Daily Rate{" "}
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
                    placeholder="0.00"
                    className={inputClass()}
                  />
                </div>
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
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-extrabold text-gray-600 transition hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleProceedClick}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white transition hover:opacity-90"
              >
                <ArrowRight size={16} />
                Proceed for Approval
              </button>
            </div>
          </div>
        </div>
      </div>

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