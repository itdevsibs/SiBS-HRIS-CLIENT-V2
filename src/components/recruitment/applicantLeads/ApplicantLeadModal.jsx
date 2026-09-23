import React, { useMemo, useRef, useState } from "react";
import {
  Check,
  CircleCheckBig,
  Clock3,
  Copy,
  FileText,
  History,
  KeyRound,
  Loader2,
  MessageSquareText,
  UserCheck,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";

import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";
import { getApplicantLeadEditedFields } from "../../../lib/utils/applicantLeads/applicantLeadFormDirty";
import DropdownField from "../availablePositions/DropdownField";
import ApplicantLeadMovementHistoryDrawer from "./ApplicantLeadMovementHistoryDrawer";
import { hearAboutUsOptions } from "../../../lib/utils/talentPool/talentPoolConstants";

const INPUT_CLASS =
  "h-8.5 2xl:h-10 w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 sibs-text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-[#667085]";

const TEXTAREA_CLASS =
  "min-h-20 2xl:min-h-24 w-full resize-none rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-[#667085]";

const AUTO_GROW_TEXTAREA_CLASS =
  "min-h-10 w-full resize-none overflow-hidden rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold leading-5 text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-[#667085]";

const UPPERCASE_INPUT_CLASS = `${INPUT_CLASS} uppercase placeholder:normal-case`;
const UPPERCASE_TEXTAREA_CLASS = `${TEXTAREA_CLASS} uppercase placeholder:normal-case`;
const AUTO_GROW_UPPERCASE_TEXTAREA_CLASS = `${AUTO_GROW_TEXTAREA_CLASS} uppercase placeholder:normal-case`;

function cleanText(value) {
  return String(value ?? "").trim();
}

function getOptionLabel(option) {
  return String(option?.label || option?.name || option?.value || option || "");
}

function formatLeadCommentActor(item = {}) {
  const sibsId = cleanText(item.actorSibsId || item.actor_sibs_id);
  const name = cleanText(item.actorName || item.actor_name);

  if (sibsId && name) return `SiBS ID ${sibsId} - ${name}`;
  if (sibsId) return `SiBS ID ${sibsId}`;
  return name || "System";
}

function formatLeadCommentDateTime(value) {
  if (!value) return "";

  const text = cleanText(value);
  const normalizedValue = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)
    ? `${text.replace(" ", "T")}+08:00`
    : text;
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) return text;

  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AutoResizeTextarea({ value, onChange, ...props }) {
  const textareaRef = useRef(null);

  React.useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  function handleChange(event) {
    const textarea = event.currentTarget;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
    onChange?.(event);
  }

  return (
    <textarea
      {...props}
      ref={textareaRef}
      rows={1}
      value={value}
      onChange={handleChange}
    />
  );
}

function updateFormField(setFormData, field, value) {
  setFormData((current) => ({
    ...current,
    [field]: value,
  }));
}

async function copyTextToClipboard(text) {
  if (!text) return false;

  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
}

function EditedIndicator({ show }) {
  if (!show) return null;

  return (
    <span className="ml-1 inline-flex items-center rounded-full bg-[#FFF3EE] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-normal text-[#E6531B] ring-1 ring-[#FFD7C8]">
      Edited
    </span>
  );
}

function FormSection({ title, subtitle, icon: SectionIcon, children }) {
  return (
    <section className="rounded-2xl border border-[#DCE6F1] bg-white p-3.5 sm:p-4 2xl:p-5 shadow-[0_8px_24px_rgba(4,44,81,0.04)] font-jakarta">
      <div className="mb-3 2xl:mb-4 flex items-start gap-2.5 border-b border-[#EEF2F6] pb-2.5 2xl:pb-3">
        {React.createElement(SectionIcon, {
          size: 16,
          className: "mt-0.5 shrink-0 text-[#FF5C28]",
        })}
        <div className="min-w-0">
          <h3 className="sibs-modal-section-title text-[#042C51]">
            {title}
          </h3>
          <p className="sibs-modal-section-subtitle mt-0.5 text-[#667085]">
            {subtitle}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function ApplicantLeadModal() {
  const [copySuccessMessage, setCopySuccessMessage] = useState("");
  const [movementHistoryOpen, setMovementHistoryOpen] = useState(false);
  const [movementHistoryVisible, setMovementHistoryVisible] = useState(false);
  const [movementHistoryPosition, setMovementHistoryPosition] = useState(null);
  const [movementHistoryArrowTop, setMovementHistoryArrowTop] = useState(-14);
  const movementHistoryTriggerRef = useRef(null);
  const movementHistoryPanelRef = useRef(null);
  const {
    showLeadModal,
    editingLead,
    formData,
    setFormData,
    closeLeadModal,
    handleSaveLead,
    currentAccountName,
    isSaving,
    leadHistory,
    isLeadHistoryLoading,
    leadHistoryError,
    leadComment,
    setLeadComment,
    isAddingLeadComment,
    handleAddLeadComment,
  } = useApplicantLeadsPage();

  const leadComments = (Array.isArray(leadHistory) ? leadHistory : []).filter(
    (item) => cleanText(item?.comment || item?.comment_text),
  );

  const isEditMode = Boolean(editingLead);
  const showMovementHistoryPanel = movementHistoryOpen || movementHistoryVisible;
  const loggingAccount = editingLead?.inputtedBy || currentAccountName;
  const noteAuthor = loggingAccount || "HR User";
  const referralCode =
    editingLead?.referralCode || editingLead?.referral_code || "";
  const canCopyReferralCode = Boolean(referralCode);
  const editedFields = editingLead
    ? getApplicantLeadEditedFields(formData, editingLead)
    : {};
  const isEditFormEdited = Object.keys(editedFields).length > 0;
  const cpNumber = String(formData.cpNum ?? "");
  const isCpNumberValid = /^\d{11}$/.test(cpNumber);
  const cpNumberError =
    cpNumber.length > 0 && !isCpNumberValid
      ? "CP number must be exactly 11 digits."
      : "";
  const isSubmitDisabled =
    isSaving ||
    !isCpNumberValid ||
    (editingLead && !isEditFormEdited);

  const sourcingChannelOptions = useMemo(() => {
    const currentSource = getOptionLabel(formData.source);
    const sourceValues = [...hearAboutUsOptions, currentSource]
      .map((source) => String(source || "").trim())
      .filter(Boolean);

    return [...new Set(sourceValues)]
      .map((source) => ({
        id: source,
        value: source,
        label: source,
      }));
  }, [formData.source]);

  React.useEffect(() => {
    if (!movementHistoryOpen) {
      setMovementHistoryVisible(false);
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() =>
      setMovementHistoryVisible(true),
    );

    return () => window.cancelAnimationFrame(frameId);
  }, [movementHistoryOpen]);

  React.useLayoutEffect(() => {
    if (!showMovementHistoryPanel) return undefined;

    function updateMovementHistoryPosition() {
      const trigger = movementHistoryTriggerRef.current;
      if (!trigger) return;

      const triggerRect = trigger.getBoundingClientRect();
      const panel = movementHistoryPanelRef.current;
      const panelWidth = panel?.offsetWidth || Math.min(400, window.innerWidth * 0.36);
      const panelHeight = panel?.offsetHeight || Math.min(680, window.innerHeight * 0.82);
      const panelGap = 20;
      const boundedLeft = Math.max(16, Math.min(
        triggerRect.right + panelGap,
        window.innerWidth - panelWidth - 16,
      ));
      const boundedTop = Math.max(16, Math.min(
        triggerRect.top - 10,
        window.innerHeight - panelHeight - 16,
      ));
      const arrowTop = Math.max(
        8,
        Math.min(
          panelHeight - 20,
          triggerRect.top + triggerRect.height / 2 - boundedTop - 8,
        ),
      );

      setMovementHistoryPosition({
        left: boundedLeft,
        top: boundedTop,
      });
      setMovementHistoryArrowTop(arrowTop);
    }

    updateMovementHistoryPosition();
    window.addEventListener("resize", updateMovementHistoryPosition);
    window.addEventListener("scroll", updateMovementHistoryPosition, true);

    return () => {
      window.removeEventListener("resize", updateMovementHistoryPosition);
      window.removeEventListener("scroll", updateMovementHistoryPosition, true);
    };
  }, [showMovementHistoryPanel]);

  if (!showLeadModal) return null;

  async function handleCopyReferralCode() {
    if (!canCopyReferralCode) return;
    const copied = await copyTextToClipboard(referralCode);

    if (copied) {
      setCopySuccessMessage("Copied!");
      window.setTimeout(() => setCopySuccessMessage(""), 2200);
    }
  }



  return (
    <div className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 font-jakarta">
      <div
        className="flex h-[84vh] 2xl:h-[86vh] max-h-[84vh] 2xl:max-h-[86vh] w-full max-w-2xl 2xl:max-w-3xl"
      >
        <div
          className="sibs-modal-pop-in relative flex h-full min-w-0 max-h-[84vh] 2xl:max-h-[86vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
        {/* Modal Header */}
        <header className="shrink-0 bg-[#042C51] px-4 py-2.5 sm:px-5 2xl:py-3.5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
              <span className="flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-[#FF5C28]">
                <UserPlus className="h-4 w-4 2xl:h-4.5 2xl:w-4.5" />
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="applicant-lead-modal-title"
                    className="sibs-modal-title truncate text-white"
                  >
                    {isEditMode
                      ? "Edit Applicant Lead"
                      : "Log New Applicant Lead"}
                  </h2>

                  <span className="inline-flex rounded-full bg-[#FF5C28] px-2 py-0.5 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-white">
                    Lead Intake
                  </span>
                </div>

                <p className="sibs-modal-subtitle mt-0.5 text-white/75 truncate sm:text-clip">
                  Capture preliminary inquiries before moving to Talent Pool.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {isEditMode ? (
                <button
                  ref={movementHistoryTriggerRef}
                  type="button"
                  onClick={() => setMovementHistoryOpen((current) => !current)}
                  aria-expanded={movementHistoryOpen}
                  aria-label={
                    movementHistoryOpen
                      ? "Close Movement History"
                      : `Open Movement History, ${leadHistory.length} records`
                  }
                  className={`inline-flex h-7.5 2xl:h-8 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[9px] 2xl:text-[10px] font-extrabold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C28]/40 ${
                    movementHistoryOpen
                      ? "border-[#FF5C28] bg-[#0D4676] shadow-[0_0_12px_rgba(255,92,40,0.2)]"
                      : "border-white/15 bg-[#063560] hover:border-[#FF5C28]/60 hover:bg-[#0D4676]"
                  }`}
                >
                  <History size={12} className="text-[#FF5C28]" />
                  <span className="hidden sm:inline">Movement History</span>
                  <span>({leadHistory.length})</span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={closeLeadModal}
                disabled={isSaving}
                aria-label="Close applicant lead modal"
                className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Modal Body */}
        <form
          onSubmit={handleSaveLead}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div
            data-dropdown-boundary="true"
            className="sibs-scrollbar min-h-0 flex-1 space-y-3.5 2xl:space-y-4 overflow-y-auto overscroll-contain bg-[#F7F9FC] p-3 sm:p-4 2xl:p-5"
          >
            {/* Auto Logging Account Info Bar */}
            <div className="flex flex-col gap-2 rounded-xl border border-blue-200 bg-[#E9F0FC] p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 font-extrabold text-[#042C51]">
                <UserCheck size={16} className="text-[#FF5C28]" />
                <span>Logging Account:</span>
                <span className="rounded border border-blue-200 bg-white px-2 py-0.5 text-blue-900 font-bold">
                  {loggingAccount}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-[#667085]">
                Auto-captured from active login
              </span>
            </div>

            {/* Referral Code (Edit Mode) */}
            {isEditMode ? (
              <div className="flex flex-col gap-2 rounded-xl border border-[#DCE6F1] bg-white p-3 text-xs sm:flex-row sm:items-center sm:justify-between shadow-xs">
                <div className="flex min-w-0 items-center gap-1.5 font-extrabold text-[#042C51]">
                  <KeyRound size={16} className="shrink-0 text-[#FF5C28]" />
                  <span className="mr-0.5 shrink-0">Referral Code:</span>
                  <span className="min-w-0 truncate rounded border border-[#DCE6F1] bg-[#F8FAFC] px-2.5 py-0.5 font-black tracking-[0.08em] text-[#042C51]">
                    {referralCode || "Not generated"}
                  </span>
                  <button
                    type="button"
                    disabled={!canCopyReferralCode}
                    onClick={handleCopyReferralCode}
                    title="Copy referral code"
                    aria-label="Copy referral code"
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-[#6B7A90] transition hover:text-[#042C51] hover:cursor-pointer disabled:cursor-not-allowed disabled:text-[#98A2B3]"
                  >
                    <Copy size={13} strokeWidth={2.2} />
                  </button>
                  {copySuccessMessage ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-extrabold text-emerald-600">
                      <CircleCheckBig size={12} strokeWidth={2.4} />
                      {copySuccessMessage}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] font-semibold text-[#667085]">
                  Generated by HRIS
                </span>
              </div>
            ) : null}

            {/* Section 1: Candidate Information */}
            <FormSection
              title="Candidate Information"
              subtitle="Legal identification and direct contact channels."
              icon={UserRound}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                    First Name <span className="text-[#FF5C28]">*</span>
                    <EditedIndicator show={editedFields.firstName} />
                  </span>
                  <input
                    required
                    value={formData.firstName}
                    placeholder="Enter First Name"
                    onChange={(event) =>
                      updateFormField(setFormData, "firstName", event.target.value)
                    }
                    className={UPPERCASE_INPUT_CLASS}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                    Last Name <span className="text-[#FF5C28]">*</span>
                    <EditedIndicator show={editedFields.lastName} />
                  </span>
                  <input
                    required
                    value={formData.lastName}
                    placeholder="Enter Last Name"
                    onChange={(event) =>
                      updateFormField(setFormData, "lastName", event.target.value)
                    }
                    className={UPPERCASE_INPUT_CLASS}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                    Middle Name
                    <EditedIndicator show={editedFields.middleName} />
                  </span>
                  <input
                    value={formData.middleName}
                    placeholder="Enter Middle Name"
                    onChange={(event) =>
                      updateFormField(setFormData, "middleName", event.target.value)
                    }
                    className={UPPERCASE_INPUT_CLASS}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                    Suffix
                    <EditedIndicator show={editedFields.suffix} />
                  </span>
                  <input
                    value={formData.suffix}
                    onChange={(event) =>
                      updateFormField(setFormData, "suffix", event.target.value)
                    }
                    placeholder="e.g. Jr., Sr., III"
                    className={UPPERCASE_INPUT_CLASS}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                    Cellphone / CP Number <span className="text-[#FF5C28]">*</span>
                    <EditedIndicator show={editedFields.cpNum} />
                  </span>
                  <input
                    required
                    inputMode="numeric"
                    pattern="[0-9]{11}"
                    maxLength={11}
                    value={formData.cpNum}
                    onChange={(event) =>
                      updateFormField(
                        setFormData,
                        "cpNum",
                        event.target.value.replace(/\D/g, "").slice(0, 11),
                      )
                    }
                    placeholder="e.g. 09123456789"
                    aria-invalid={Boolean(cpNumberError)}
                    className={INPUT_CLASS}
                  />
                  {cpNumberError ? (
                    <span className="mt-1 block text-[10px] font-semibold text-red-500">
                      {cpNumberError}
                    </span>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                    Email Address <span className="text-[#FF5C28]">*</span>
                    <EditedIndicator show={editedFields.email} />
                  </span>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(event) =>
                      updateFormField(setFormData, "email", event.target.value)
                    }
                    placeholder="Enter Email Address"
                    className={INPUT_CLASS}
                  />
                </label>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-extrabold text-[#042C51]">
                    Applicant Source <span className="text-[#FF5C28]">*</span>
                    <EditedIndicator show={editedFields.source} />
                  </label>
                  <DropdownField
                    value={formData.source}
                    onChange={(value) =>
                      setFormData((current) => ({
                        ...current,
                        source: value,
                        sourcingId: "",
                      }))
                    }
                    options={sourcingChannelOptions}
                    placeholder="Select sourcing channel..."
                    searchable={true}
                    className="w-full"
                  />
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-extrabold text-[#042C51]">
                    Facebook Name <span className="text-[#FF5C28]">*</span>
                    <EditedIndicator show={editedFields.facebookName} />
                  </span>
                  <input
                    required
                    value={formData.facebookName}
                    onChange={(event) =>
                      updateFormField(setFormData, "facebookName", event.target.value)
                    }
                    placeholder="Enter Facebook Name"
                    className={INPUT_CLASS}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-extrabold text-[#042C51]">
                    Facebook Link <span className="text-[#FF5C28]">*</span>
                    <EditedIndicator show={editedFields.facebookLink} />
                  </span>
                  <input
                    required
                    value={formData.facebookLink}
                    onChange={(event) =>
                      updateFormField(setFormData, "facebookLink", event.target.value)
                    }
                    placeholder="Enter Facebook Profile Link"
                    className={INPUT_CLASS}
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-extrabold text-[#042C51]">
                    School
                    <EditedIndicator show={editedFields.school} />
                  </span>
                  <AutoResizeTextarea
                    value={formData.school}
                    onChange={(event) =>
                      updateFormField(setFormData, "school", event.target.value)
                    }
                    placeholder="Enter School"
                    className={AUTO_GROW_UPPERCASE_TEXTAREA_CLASS}
                  />
                </label>
              </div>
            </FormSection>

            {/* Organizational Placement is intentionally hidden in Edit Applicant Lead. */}

            {/* Section 3: Notes & Inquiry Remarks */}
            <FormSection
              title="Inquiry Notes & Remarks"
              subtitle="Record walk-in notes, caller background, shift preference, or recruiter notes."
              icon={FileText}
            >
              <label className="block">
                  <span className="mb-1.5 flex items-center justify-between gap-2 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                  <span>
                    HR Notes <span className="text-[#FF5C28]">*</span>
                    <EditedIndicator show={editedFields.notes} />
                  </span>
                  <span className="shrink-0 normal-case tracking-normal text-[#667085]">
                    By: {noteAuthor}
                  </span>
                </span>
                <textarea
                  rows={3}
                  required
                  value={formData.notes}
                  onChange={(event) =>
                    updateFormField(setFormData, "notes", event.target.value)
                  }
                  placeholder="Record preliminary background, shift availability, or interview notes..."
                  className={TEXTAREA_CLASS}
                />
              </label>
            </FormSection>

            {isEditMode && (
              <FormSection
                title="Lead Comments"
                subtitle="Add comments to this applicant lead without changing HR Notes."
                icon={MessageSquareText}
              >
                <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#042C51]">
                    <MessageSquareText size={14} className="text-[#FF5C28]" />
                    Add Comment
                  </div>
                  <textarea
                    rows={3}
                    maxLength={3000}
                    value={leadComment}
                    onChange={(event) => setLeadComment(event.target.value)}
                    placeholder="Add an activity comment for this applicant lead..."
                    className={`${TEXTAREA_CLASS} mt-2 bg-white`}
                  />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-semibold text-[#98A2B3]">
                      {String(leadComment || "").length} / 3000
                    </span>
                    <button
                      type="button"
                      onClick={handleAddLeadComment}
                      disabled={
                        isAddingLeadComment ||
                        !String(leadComment || "").trim()
                      }
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#042C51] px-3.5 text-[11px] font-extrabold text-white transition hover:bg-[#073A69] disabled:cursor-not-allowed disabled:bg-[#DDE5EE] disabled:text-[#7B8DB3]"
                    >
                      {isAddingLeadComment ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <MessageSquareText size={12} />
                      )}
                      {isAddingLeadComment ? "Adding..." : "Add Comment"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 border-t border-[#E6ECF2] pt-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-[#042C51]">
                      <MessageSquareText size={14} className="text-[#FF5C28]" />
                      Comments
                    </div>
                    <span className="rounded-full bg-[#EEF4FA] px-2 py-0.5 text-[9px] font-extrabold text-[#174A7C]">
                      {leadComments.length}
                    </span>
                  </div>

                  {isLeadHistoryLoading ? (
                    <div className="flex items-center gap-2 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-4 text-[11px] font-semibold text-[#667085]">
                      <Loader2 size={13} className="animate-spin text-[#FF5C28]" />
                      Loading comments...
                    </div>
                  ) : leadComments.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#D7DEE8] bg-[#F8FAFC] px-3 py-4 text-center text-[11px] font-semibold text-[#667085]">
                      No comments yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {leadComments.map((item, index) => (
                        <div
                          key={item.id || `lead-comment-${index}`}
                          className="rounded-xl border border-[#E6ECF2] bg-white p-3"
                        >
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-semibold text-[#667085]">
                            <span className="inline-flex items-center gap-1 font-extrabold text-[#042C51]">
                              <UserRound size={11} className="text-[#FF5C28]" />
                              {formatLeadCommentActor(item)}
                            </span>
                            {(item.createdAt || item.created_at) ? (
                              <span className="inline-flex items-center gap-1">
                                <Clock3 size={11} className="text-[#98A2B3]" />
                                {formatLeadCommentDateTime(item.createdAt || item.created_at)}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 whitespace-pre-wrap break-words text-[11px] font-semibold leading-5 text-[#344054]">
                            {item.comment || item.comment_text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FormSection>
            )}
          </div>

          {/* Footer Actions */}
          <footer className="shrink-0 border-t border-[#E6ECF2] bg-white px-4 py-3 sm:px-5">
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={closeLeadModal}
                disabled={isSaving}
                className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D7DEE8] bg-[#F8FAFC] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#344054] transition hover:bg-white hover:text-[#042C51]"
              >
                Cancel
              </button>

              {(!isEditMode || isEditFormEdited) && (
                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 2xl:gap-2 rounded-lg bg-[#FF5C28] px-4 2xl:px-5 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E95324] disabled:cursor-not-allowed disabled:border disabled:border-[#D6E0EA] disabled:bg-[#EEF3F8] disabled:text-[#6F8196] disabled:shadow-none"
                >
                  {isSaving ? (
                    <Loader2 size={13} className="animate-spin text-white" />
                  ) : (
                    <Check size={13} className="text-white" />
                  )}
                  {isSaving
                    ? "Saving..."
                    : isEditMode
                      ? "Update Lead"
                      : "Save Applicant Lead"}
                </button>
              )}
            </div>
          </footer>
        </form>

        </div>

      </div>

      {isEditMode && showMovementHistoryPanel && movementHistoryPosition ? (
        <div
          ref={movementHistoryPanelRef}
          className={`fixed z-[1100] flex origin-left transform-gpu h-[min(82vh,680px)] w-[min(400px,36vw)] drop-shadow-[0_24px_55px_rgba(4,24,45,0.32)] transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${movementHistoryVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-1.5 scale-90 opacity-0"}`}
          style={movementHistoryPosition}
        >
            <span
              aria-hidden="true"
              className="absolute -left-[10px] z-0 h-0 w-0 border-y-[8px] border-y-transparent border-r-[10px] border-r-white"
              style={{ top: movementHistoryArrowTop }}
            />
          <ApplicantLeadMovementHistoryDrawer
            open
            lead={editingLead || {}}
            history={leadHistory}
            isLoading={isLeadHistoryLoading}
            error={leadHistoryError}
            onClose={() => setMovementHistoryOpen(false)}
            triggerRef={movementHistoryTriggerRef}
          />
        </div>
      ) : null}
    </div>
  );
}
