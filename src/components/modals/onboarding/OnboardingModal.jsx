import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  MapPin,
  Plus,
  RotateCcw,
  UserCheck,
  X,
} from "lucide-react";

const locationOptions = ["Davao", "Tagum", "Hybrid", "Remote"];

const emptyOnboardingForm = {
  offerId: "",
  candidateApplicationId: "",
  candidateId: "",
  candidateName: "",
  candidateEmail: "",
  roleTitle: "",
  account: "",
  roleAccount: "",
  acceptedOfferDate: "",
  expectedStartDate: "",
  owner: "",
  location: "Davao",
  remarks: "",
};

function inputClass(extra = "") {
  return `h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function readonlyInputClass(extra = "") {
  return `h-12 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none ${extra}`;
}

function textareaClass(extra = "") {
  return `w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function AnimatedDropdown({ open, children, className = "" }) {
  return (
    <div
      className={`absolute left-0 right-0 top-full mt-2 grid transition-all duration-300 ease-out ${
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

function formatDateDisplay(value) {
  if (!value) return "";

  const [year, month, day] = String(value).split("-").map(Number);

  if (!year || !month || !day) return value;

  const parsed = new Date(year, month - 1, day);

  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCalendarDays(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const calendarStart = new Date(year, month, 1 - startDay);

  return Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
}

// Determines if two distinct JavaScript date instances align calendar days
function isSameDate(firstDate, secondDate) {
  if (!firstDate || !secondDate) return false;

  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function DateDropdown({
  label,
  value,
  onChange,
  required = false,
  placeholder = "Select date",
  zIndex = "z-30",
}) {
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
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [selectedDate]);

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

  function goToPreviousMonth() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function handleSelectDate(date) {
    onChange(toDateInputValue(date));
    setOpen(false);
  }

  function handleTodayClick() {
    const currentDate = new Date();
    onChange(toDateInputValue(currentDate));
    setViewDate(currentDate);
    setOpen(false);
  }

  const monthTitle = viewDate.toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });

  const displayValue = value ? formatDateDisplay(value) : placeholder;

  return (
    <div ref={dropdownRef} className={`relative ${zIndex}`}>
      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-12 w-full items-center justify-between rounded-xl border border-[#E6ECF2] bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition-all duration-200 hover:border-sibs-primary-1/30 hover:bg-slate-50 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays size={17} className="shrink-0 text-sibs-tertiary-5" />

          <span
            className={`truncate ${
              value ? "text-[#344054]" : "text-sibs-tertiary-5"
            }`}
          >
            {displayValue}
          </span>
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatedDropdown open={open}>
        <div className="bg-white p-3">
          <div className="mb-3 flex items-center justify-between rounded-xl border border-[#E6ECF2] bg-slate-50 px-3 py-2">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm active:scale-[0.98]"
            >
              <ChevronLeft size={16} />
            </button>

            <p className="text-sm font-extrabold text-sibs-primary-1">
              {monthTitle}
            </p>

            <button
              type="button"
              onClick={goToNextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm active:scale-[0.98]"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="py-1 text-center text-[10px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5"
              >
                {day}
              </div>
            ))}

            {calendarDays.map((date) => {
              const currentMonth = date.getMonth() === viewDate.getMonth();
              const active = selectedDate && isSameDate(date, selectedDate);
              const isToday = isSameDate(date, today);

              return (
                <button
                  key={toDateInputValue(date)}
                  type="button"
                  onClick={() => handleSelectDate(date)}
                  className={`flex h-9 items-center justify-center rounded-lg text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
                    active
                      ? "bg-sibs-primary-1 text-white shadow-sm"
                      : "border border-blue-200 bg-blue-50 text-sibs-primary-1"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#E6ECF2] pt-3">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white px-3 text-xs font-bold text-sibs-tertiary-5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-sibs-primary-1 hover:shadow-sm active:scale-[0.98]"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={handleTodayClick}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-sibs-primary-1 px-3 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
            >
              Today
            </button>
          </div>
        </div>
      </AnimatedDropdown>
    </div>
  );
}

function CustomSelect({
  label,
  value,
  options = [],
  onChange,
  placeholder = "Select",
  required = false,
  zIndex = "z-30",
  optionValue = (option) => option,
  optionLabel = (option) => option,
  optionDescription = null,
  icon: Icon,
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(
    (option) => String(optionValue(option)) === String(value),
  );

  const displayValue = selectedOption ? optionLabel(selectedOption) : placeholder;

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
    <div ref={dropdownRef} className={`relative ${zIndex}`}>
      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-12 w-full items-center justify-between rounded-xl border border-[#D0D5DD] bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition-all duration-200 hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
      >
        <span className="flex min-w-0 items-center gap-2">
          {Icon && (
            <Icon size={17} className="shrink-0 text-sibs-tertiary-5" />
          )}

          <span
            className={`truncate ${
              selectedOption ? "text-[#344054]" : "text-sibs-tertiary-5"
            }`}
          >
            {displayValue}
          </span>
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
          {options.length > 0 ? (
            options.map((option) => {
              const currentValue = optionValue(option);
              const currentLabel = optionLabel(option);
              const currentDescription = optionDescription
                ? optionDescription(option)
                : "";
              const selected = String(value) === String(currentValue);

              return (
                <button
                  key={currentValue}
                  type="button"
                  onClick={() => {
                    onChange(currentValue, option);
                    setOpen(false);
                  }}
                  className={`block w-full px-4 py-3 text-left text-sm transition ${
                    selected
                      ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                      : "text-[#344054] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span className="block truncate">{currentLabel}</span>

                  {currentDescription && (
                    <span className="mt-1 block truncate text-xs font-semibold text-sibs-tertiary-5">
                      {currentDescription}
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
        </div>
      </AnimatedDropdown>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <div className="max-w-[60%] break-words text-right text-sm font-bold text-[#344054]">
        {value || "—"}
      </div>
    </div>
  );
}

export function CreateOnboardingModal({
  open,
  form,
  setForm,
  onClose,
  onSubmit,
  onReset,
  onboardingList = [],
  acceptedOfferList = [],
}) {
  if (!open) return null;

  const usedOfferIds = onboardingList.map((record) => record.offerId);
  const usedCandidateEmails = onboardingList.map(
    (record) => record.candidateEmail,
  );

  const availableAcceptedOffers = acceptedOfferList.filter(
    (offer) =>
      !usedOfferIds.includes(offer.offerId) &&
      !usedCandidateEmails.includes(offer.candidateEmail),
  );

  function handleOfferChange(offerId) {
    const selectedOffer = acceptedOfferList.find(
      (offer) => String(offer.offerId) === String(offerId),
    );

    if (!selectedOffer) {
      setForm(emptyOnboardingForm);
      return;
    }

    setForm({
      ...form,
      offerId: selectedOffer.offerId,
      candidateApplicationId: selectedOffer.candidateApplicationId || "",
      candidateId: selectedOffer.candidateId || "",
      candidateName: selectedOffer.candidateName || "",
      candidateEmail: selectedOffer.candidateEmail || "",
      roleTitle: selectedOffer.roleTitle || "",
      account: selectedOffer.account || "",
      roleAccount: selectedOffer.roleAccount || "",
      acceptedOfferDate: selectedOffer.acceptedOfferDate || "",
      owner: selectedOffer.owner || "",
    });
  }

  function handleResetClick() {
    if (onReset) {
      onReset();
      return;
    }

    setForm(emptyOnboardingForm);
  }

  return (
    <div
      className="sibs-modal-blur fixed inset-0 z-[10000] flex h-dvh items-center justify-center px-4 py-4 font-jakarta"
      onClick={onClose}
    >
      <div
        className="sibs-profile-tab-panel flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <UserCheck size={14} />
              Onboarding Setup
            </div>

            <h2 className="mt-3 text-lg font-extrabold text-sibs-primary-1 sm:text-xl">
              Add Onboarding Record
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Create onboarding from an accepted offer.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-100 hover:text-gray-700 active:scale-[0.98]"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Updated explicit form identification to capture submit events safely */}
        <form id="create-onboarding-form" onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#101828]">
                      Accepted Offer
                    </h3>

                    <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                      Select the accepted offer to create the onboarding record.
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2F6FA] text-sibs-primary-1">
                    <BriefcaseBusiness size={19} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <CustomSelect
                      label="Select Accepted Offer"
                      required
                      value={form.offerId}
                      options={availableAcceptedOffers}
                      onChange={handleOfferChange}
                      placeholder="Select accepted offer"
                      zIndex="z-50"
                      icon={UserCheck}
                      optionValue={(offer) => offer.offerId}
                      optionLabel={(offer) =>
                        `${offer.candidateName} — ${offer.roleTitle}`
                      }
                      optionDescription={(offer) =>
                        `${offer.account || "No account"}${
                          offer.acceptedOfferDate
                            ? ` • Accepted: ${formatDateDisplay(
                                offer.acceptedOfferDate,
                              )}`
                            : ""
                        }`
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Candidate Name
                    </label>

                    <input
                      readOnly
                      value={form.candidateName}
                      className={readonlyInputClass()}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Candidate Email
                    </label>

                    <input
                      readOnly
                      value={form.candidateEmail}
                      className={readonlyInputClass()}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Role
                    </label>

                    <input
                      readOnly
                      value={form.roleTitle}
                      className={readonlyInputClass()}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Account
                    </label>

                    <input
                      readOnly
                      value={form.account}
                      className={readonlyInputClass()}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Accepted Offer Date
                    </label>

                    <div className="flex h-12 w-full items-center gap-2 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600">
                      <CalendarDays
                        size={17}
                        className="shrink-0 text-sibs-tertiary-5"
                      />
                      <span className="truncate">
                        {form.acceptedOfferDate
                          ? formatDateDisplay(form.acceptedOfferDate)
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      TA Owner
                    </label>

                    <input
                      readOnly
                      value={form.owner}
                      className={readonlyInputClass()}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#101828]">
                      Start Details
                    </h3>

                    <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                      Set the expected start date, location, and onboarding notes.
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2F6FA] text-sibs-primary-1">
                    <ClipboardList size={19} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <DateDropdown
                    label="Expected Start Date"
                    required
                    value={form.expectedStartDate}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        expectedStartDate: value,
                      })
                    }
                    placeholder="Select expected start date"
                    zIndex="z-40"
                  />

                  <CustomSelect
                    label="Location"
                    required
                    value={form.location}
                    options={locationOptions}
                    onChange={(value) => setForm({ ...form, location: value })}
                    placeholder="Select location"
                    zIndex="z-30"
                    icon={MapPin}
                  />

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Remarks
                    </label>

                    <textarea
                      value={form.remarks}
                      onChange={(e) =>
                        setForm({ ...form, remarks: e.target.value })
                      }
                      rows={4}
                      placeholder="Example: Candidate is waiting for start date confirmation."
                      className={textareaClass()}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sibs-primary-1">
                    <UserCheck size={20} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-sibs-primary-1">
                      System Relationship
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                      Onboarding should normally be created when an offer is
                      accepted. This page reads accepted offers from the Offers module.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Default Onboarding Status
                </h3>

                <div className="mt-4">
                  <DetailRow label="Show Status" value="Pending" />
                  <DetailRow label="Final Outcome" value="Pending Start" />
                  <DetailRow label="Pre-start Withdrawal" value="No" />
                  <DetailRow label="Actual Start Date" value="Not yet started" />
                </div>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                <h3 className="text-sm font-bold text-amber-700">
                  Backend Later
                </h3>

                <p className="mt-2 text-sm leading-6 text-amber-700/90">
                  Later, the accepted offer endpoint should automatically insert a Pending Start onboarding record.
                </p>
              </div>
            </div>
          </div>
        </form>

        <div className="border-t border-[#E6ECF2] px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleResetClick}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
            >
              <RotateCcw size={17} />
              Reset
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-gray-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
            >
              Cancel
            </button>

            {/* Implemented type change, form connector, and field dependencies */}
            <button
              type="submit"
              form="create-onboarding-form"
              disabled={!form.offerId || !form.expectedStartDate}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              <Plus size={17} />
              Save Onboarding
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
