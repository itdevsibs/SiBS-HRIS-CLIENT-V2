import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
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

function cleanText(value) {
  return String(value ?? "").trim();
}

function getAcceptedOfferOption(offer) {
  const offerId = offer.offerId || offer.offer_id;
  const candidateName = offer.candidateName || offer.candidate_name || "Candidate";
  const roleTitle = offer.roleTitle || offer.role_title || "Role";
  const account = offer.account || "No account";
  const acceptedDate = offer.acceptedOfferDate || offer.accepted_offer_date || "";
  return {
    value: offerId,
    label: `${candidateName} — ${roleTitle} (${account}${acceptedDate ? ` • ${formatDateDisplay(acceptedDate)}` : ""})`,
  };
}

function formatDateDisplay(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return cleanText(value) || "—";

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <label className="sibs-modal-field-label">{label}</label>
      <div className="flex min-h-10 w-full items-center rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3 sibs-text-xs font-bold text-[#475467]">
        <span className="truncate">{value || "—"}</span>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, tone = "text-[#344054]" }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] py-2.5 last:border-b-0">
      <span className="text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
        {label}
      </span>
      <span className={`max-w-[62%] break-words text-right text-[10px] font-extrabold ${tone}`}>
        {value || "—"}
      </span>
    </div>
  );
}

function OnboardingSelect({ value, options = [], onChange, placeholder = "Select", disabled = false, icon: Icon = null }) {
  const anchorRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const selected = options.find((option) => String(option.value) === String(value));

  useEffect(() => {
    if (!open || !anchorRef.current) return undefined;
    const updatePosition = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const menuHeight = Math.min(options.length * 42 + 8, 280);
      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const openUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;
      setMenuStyle({ left: rect.left, top: openUp ? Math.max(12, rect.top - menuHeight - 6) : rect.bottom + 6, width: rect.width, maxHeight: Math.min(280, openUp ? spaceAbove : spaceBelow) });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return undefined;
    const handleOutside = (event) => {
      if (!anchorRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={anchorRef} className="relative min-w-0 font-jakarta">
      <button type="button" disabled={disabled} onClick={() => setOpen((current) => !current)} className={`flex h-8.5 2xl:h-10 w-full items-center justify-between gap-2 rounded-xl border px-3 2xl:px-3.5 text-left font-jakarta sibs-text-xs font-semibold outline-none transition ${disabled ? "cursor-not-allowed border-[#D7DEE8] bg-[#EEF2F6] text-[#98A2B3]" : open ? "border-[#FF5C28] bg-white text-[#042C51] ring-2 ring-[#FF5C28]/10" : "border-[#D7DEE8] bg-[#F8FAFC] text-[#042C51] hover:border-[#FF5C28]/45"}`}>
        <span className="flex min-w-0 items-center gap-2 truncate">
          {Icon ? <Icon size={14} className="shrink-0 text-[#98A2B3]" /> : null}
          <span className={`truncate ${selected ? "text-[#042C51]" : "text-[#98A2B3]"}`}>{selected?.label || placeholder}</span>
        </span>
        <ChevronDown size={15} className={`shrink-0 transition-transform ${open ? "rotate-180 text-[#FF5C28]" : "text-[#215789]"}`} />
      </button>
      {open && menuStyle ? createPortal(
        <div ref={menuRef} style={{ left: menuStyle.left, top: menuStyle.top, width: menuStyle.width }} className="sibs-dropdown-pop-in fixed z-[11000] overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl">
          <div className="sibs-scrollbar overflow-y-auto py-1" style={{ maxHeight: menuStyle.maxHeight }}>
            {options.length === 0 ? (
              <div className="px-3.5 py-3 text-center font-jakarta text-xs font-semibold text-[#98A2B3]">
                No accepted offers available.
              </div>
            ) : options.map((option) => {
              const active = String(option.value) === String(value);
              return <button key={option.value} type="button" onClick={() => { onChange(option.value, option); setOpen(false); }} className={`flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left font-jakarta text-xs font-bold transition ${active ? "bg-[#FFF0EB] text-[#FF5C28]" : "bg-white text-[#042C51] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"}`}><span className="truncate">{option.label}</span>{active ? <CheckCircle2 size={14} className="shrink-0 text-[#FF5C28]" /> : null}</button>;
            })}
          </div>
        </div>, document.body,
      ) : null}
    </div>
  );
}

function toDateInputValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function OnboardingDateDropdown({ value, onChange, disabled = false }) {
  const anchorRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => value ? new Date(`${value}T00:00:00`) : new Date());
  const [menuStyle, setMenuStyle] = useState(null);
  const selectedDate = value ? new Date(`${value}T00:00:00`) : null;
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: firstDay + daysInMonth }, (_, index) => index < firstDay ? null : new Date(viewDate.getFullYear(), viewDate.getMonth(), index - firstDay + 1));

  useEffect(() => {
    if (value) setViewDate(new Date(`${value}T00:00:00`));
  }, [value]);

  useEffect(() => {
    if (!open || !anchorRef.current) return undefined;

    const updatePosition = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const renderedHeight = menuRef.current?.getBoundingClientRect().height || 0;
      const menuHeight = renderedHeight || 290;
      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const openUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;

      setMenuStyle({
        left: rect.left,
        top: openUp ? Math.max(12, rect.top - menuHeight - 6) : rect.bottom + 6,
        width: rect.width,
      });

      if (!renderedHeight) {
        window.requestAnimationFrame(updatePosition);
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <div ref={anchorRef} className="relative min-w-0 font-jakarta">
      <button type="button" disabled={disabled} onClick={() => setOpen((current) => !current)} className={`flex h-8.5 2xl:h-10 w-full items-center justify-between gap-2 rounded-xl border px-3 2xl:px-3.5 text-left font-jakarta sibs-text-xs font-semibold outline-none transition ${open ? "border-[#FF5C28] bg-white ring-2 ring-[#FF5C28]/10" : "border-[#D7DEE8] bg-[#F8FAFC] hover:border-[#FF5C28]/45"}`}>
        <span className={`flex items-center gap-2 truncate ${value ? "text-[#042C51]" : "text-[#98A2B3]"}`}><CalendarDays size={14} className="text-[#FF5C28]" />{value || "Select date"}</span>
        <ChevronDown size={14} className={`text-[#FF5C28] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && menuStyle && createPortal(
        <div ref={menuRef} className="sibs-dropdown-pop-in fixed z-[11000] overflow-visible rounded-xl border border-[#D7DEE8] bg-white p-3 shadow-2xl" style={{ left: menuStyle.left, top: menuStyle.top, width: menuStyle.width }}>
          <div className="mb-3 flex items-center gap-1.5 rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] p-1.5">
            <button type="button" onClick={() => setViewDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#D7DEE8] bg-white text-[#042C51]"><ChevronLeft size={15} /></button>
            <div className="flex-1 text-center text-xs font-extrabold text-[#042C51]">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</div>
            <button type="button" onClick={() => setViewDate((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#D7DEE8] bg-white text-[#042C51]"><ChevronRight size={15} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((day) => <div key={day} className="py-1 text-center text-[10px] font-extrabold text-[#98A2B3]">{day}</div>)}
            {days.map((date, index) => date ? <button key={toDateInputValue(date)} type="button" onClick={() => { onChange(toDateInputValue(date)); setOpen(false); }} className={`flex h-8 items-center justify-center rounded-lg text-xs font-bold ${value === toDateInputValue(date) ? "bg-[#FF5C28] text-white" : "text-[#042C51] hover:bg-[#FFF0EB]"}`}>{date.getDate()}</button> : <span key={`blank-${index}`} />)}
          </div>
          <div className="mt-3 flex justify-between border-t border-[#E6ECF2] pt-2.5"><button type="button" onClick={() => { onChange(""); setOpen(false); }} className="h-8 rounded-lg border border-[#D7DEE8] px-3 text-xs font-extrabold text-[#042C51]">Clear</button><button type="button" onClick={() => { const today = new Date(); onChange(toDateInputValue(today)); setViewDate(today); setOpen(false); }} className="h-8 rounded-lg bg-[#FF5C28] px-3 text-xs font-extrabold text-white">Today</button></div>
        </div>, document.body,
      )}
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
  isSubmitting = false,
}) {
  const availableAcceptedOffers = useMemo(() => {
    const usedOfferIds = new Set(
      (Array.isArray(onboardingList) ? onboardingList : [])
        .map((record) => cleanText(record?.offerId || record?.offer_id))
        .filter(Boolean),
    );
    const usedCandidateEmails = new Set(
      (Array.isArray(onboardingList) ? onboardingList : [])
        .map((record) => cleanText(record?.candidateEmail || record?.candidate_email).toLowerCase())
        .filter(Boolean),
    );

    return (Array.isArray(acceptedOfferList) ? acceptedOfferList : []).filter(
      (offer) => {
        const offerId = cleanText(offer?.offerId || offer?.offer_id);
        const email = cleanText(offer?.candidateEmail || offer?.candidate_email).toLowerCase();

        return !usedOfferIds.has(offerId) && (!email || !usedCandidateEmails.has(email));
      },
    );
  }, [acceptedOfferList, onboardingList]);

  useEffect(() => {
    if (!open) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape" && !isSubmitting) onClose?.();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, isSubmitting, onClose]);

  if (!open) return null;

  function handleOfferChange(offerId) {
    const selectedOffer = (Array.isArray(acceptedOfferList) ? acceptedOfferList : []).find(
      (offer) => String(offer?.offerId || offer?.offer_id) === String(offerId),
    );

    if (!selectedOffer) {
      setForm(emptyOnboardingForm);
      return;
    }

    setForm({
      ...form,
      offerId: selectedOffer.offerId || selectedOffer.offer_id || "",
      candidateApplicationId:
        selectedOffer.candidateApplicationId || selectedOffer.candidate_application_id || "",
      candidateId: selectedOffer.candidateId || selectedOffer.candidate_id || "",
      candidateName: selectedOffer.candidateName || selectedOffer.candidate_name || "",
      candidateEmail: selectedOffer.candidateEmail || selectedOffer.candidate_email || "",
      roleTitle: selectedOffer.roleTitle || selectedOffer.role_title || "",
      account: selectedOffer.account || "",
      roleAccount: selectedOffer.roleAccount || selectedOffer.role_account || "",
      acceptedOfferDate:
        selectedOffer.acceptedOfferDate || selectedOffer.accepted_offer_date || "",
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

  const saveDisabled = isSubmitting || !form.offerId || !form.expectedStartDate;

  return (
    <div
      className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[10000] flex h-dvh items-center justify-center px-2 py-2 font-jakarta sm:px-4 sm:py-4"
      onMouseDown={() => {
        if (!isSubmitting) onClose?.();
      }}
    >
      <div
        className="sibs-modal-pop-in flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#D7DEE8] bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 bg-[#042C51] px-5 py-4 text-white sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF5C28] text-white shadow-sm">
              <UserCheck size={17} />
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate sibs-text-base font-extrabold text-white">
                  Add Onboarding Record
                </h2>
                <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-wide text-amber-200 sm:text-[9px]">
                  Pending Start
                </span>
              </div>
              <p className="mt-0.5 truncate sibs-text-xs font-semibold text-white/65">
                Convert an accepted offer into an active onboarding tracking record.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="sibs-modal-close-btn"
            aria-label="Close Add Onboarding Record"
          >
            <X size={17} />
          </button>
        </header>

        <form
          id="create-onboarding-form"
          onSubmit={onSubmit}
          className="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-[#F7F9FC] p-4 sm:p-5"
        >
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
            <div className="min-w-0 space-y-4">
              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-start justify-between gap-3 border-b border-[#EEF2F6] pb-3">
                  <div className="min-w-0">
                    <p className="sibs-kicker">Step 1</p>
                    <h3 className="mt-0.5 sibs-text-sm font-extrabold text-[#042C51]">
                      Select Accepted Offer
                    </h3>
                    <p className="mt-1 sibs-text-xs font-semibold text-[#667085]">
                      Only accepted offers that are not yet assigned to onboarding are listed.
                    </p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#042C51]">
                    <BriefcaseBusiness size={16} />
                  </span>
                </div>

                <div>
                  <label className="sibs-modal-field-label">
                    Accepted Offer <span className="text-red-500">*</span>
                  </label>
                  <OnboardingSelect
                    value={form.offerId}
                    onChange={(offerId) => handleOfferChange(offerId)}
                    placeholder="Select accepted offer candidate"
                    options={availableAcceptedOffers.map(getAcceptedOfferOption)}
                    disabled={isSubmitting}
                    icon={BriefcaseBusiness}
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ReadOnlyField label="Candidate Name" value={form.candidateName} />
                  <ReadOnlyField label="Email Address" value={form.candidateEmail} />
                  <ReadOnlyField label="Role" value={form.roleTitle} />
                  <ReadOnlyField label="Account" value={form.account} />
                  <ReadOnlyField
                    label="Accepted Offer Date"
                    value={formatDateDisplay(form.acceptedOfferDate)}
                  />
                  <ReadOnlyField label="TA Owner" value={form.owner} />
                </div>
              </section>

              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-start justify-between gap-3 border-b border-[#EEF2F6] pb-3">
                  <div>
                    <p className="sibs-kicker">Step 2</p>
                    <h3 className="mt-0.5 sibs-text-sm font-extrabold text-[#042C51]">
                      Start Details
                    </h3>
                    <p className="mt-1 sibs-text-xs font-semibold text-[#667085]">
                      Set the expected start date and site before activating the record.
                    </p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-[#FF5C28]">
                    <CalendarDays size={16} />
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="sibs-modal-field-label">
                      Expected Start Date <span className="text-red-500">*</span>
                    </label>
                    <OnboardingDateDropdown
                      value={form.expectedStartDate}
                      onChange={(date) =>
                        setForm({ ...form, expectedStartDate: date })
                      }
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="sibs-modal-field-label">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <OnboardingSelect
                      value={form.location}
                      onChange={(location) => setForm({ ...form, location })}
                      options={locationOptions.map((location) => ({ value: location, label: location }))}
                      disabled={isSubmitting}
                      icon={MapPin}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="sibs-modal-field-label">Remarks</label>
                    <textarea
                      rows={3}
                      value={form.remarks}
                      onChange={(event) => setForm({ ...form, remarks: event.target.value })}
                      placeholder="Optional pre-start notes or coordination details..."
                      className="sibs-modal-textarea"
                    />
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-4 xl:sticky xl:top-0 xl:self-start">
              <section className="rounded-2xl border border-[#083A69] bg-[#042C51] p-4 text-white shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#FF5C28]/30 bg-[#FF5C28]/15 text-[#FF5C28]">
                    <Info size={16} />
                  </span>
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-wide text-[#FFB9A2]">
                      System Relationship
                    </p>
                    <h3 className="mt-1 sibs-text-xs font-extrabold text-white">
                      Accepted Offer → Onboarding
                    </h3>
                    <p className="mt-2 text-[10px] font-semibold leading-5 text-slate-200">
                      Accepted offers are synchronized from the Offers module. Creating this record initializes pre-start tracking.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <h3 className="sibs-text-xs font-extrabold text-[#042C51]">
                    Default Initial Status
                  </h3>
                </div>
                <div className="mt-3">
                  <SummaryRow label="Show Status" value="Pending" tone="text-amber-700" />
                  <SummaryRow label="Final Outcome" value="Pending Start" tone="text-amber-700" />
                  <SummaryRow label="Actual Start" value="Not yet started" />
                  <SummaryRow label="Placement Count" value="Not counted yet" />
                </div>
              </section>

              <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-[9px] font-extrabold uppercase tracking-wide text-amber-700">
                  Automation Note
                </p>
                <p className="mt-1 text-[10px] font-semibold leading-5 text-amber-800">
                  Candidate Pipeline synchronization may create or refresh Pending Start records automatically. Duplicate accepted offers are excluded from this form.
                </p>
              </section>
            </aside>
          </div>
        </form>

        <footer className="shrink-0 border-t border-[#E6ECF2] bg-white px-5 py-3.5 sm:px-6">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleResetClick}
              disabled={isSubmitting}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg border border-[#D6E0EA] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#667085] transition hover:border-[#FF5C28]/35 hover:bg-[#FFF8F5] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={14} />
              Reset
            </button>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D6E0EA] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#667085] transition hover:border-[#FF5C28]/35 hover:bg-[#FFF8F5] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-onboarding-form"
                disabled={saveDisabled}
                className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg bg-[#FF5C28] px-3.5 2xl:px-5 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1F] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={14} />
                {isSubmitting ? "Saving..." : "Save Onboarding Record"}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
