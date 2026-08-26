import React, { useRef, useState } from "react";
import {
  Building2,
  Check,
  CircleCheckBig,
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

const INPUT_CLASS =
  "h-8.5 2xl:h-10 w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 sibs-text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-[#667085]";

const TEXTAREA_CLASS =
  "min-h-20 2xl:min-h-24 w-full resize-none rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-[#667085]";

const AUTO_GROW_TEXTAREA_CLASS =
  "min-h-10 w-full resize-none overflow-hidden rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold leading-5 text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-[#667085]";

const UPPERCASE_INPUT_CLASS = `${INPUT_CLASS} uppercase placeholder:normal-case`;
const UPPERCASE_TEXTAREA_CLASS = `${TEXTAREA_CLASS} uppercase placeholder:normal-case`;
const AUTO_GROW_UPPERCASE_TEXTAREA_CLASS = `${AUTO_GROW_TEXTAREA_CLASS} uppercase placeholder:normal-case`;

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

function getOptionValue(option) {
  return String(option?.id || option?.value || option?.label || option || "");
}

function getOptionLabel(option) {
  return String(option?.label || option?.name || option?.value || option || "");
}

function updateLookupField(setFormData, options, idField, labelField, value) {
  const selectedOption = options.find(
    (option) => getOptionValue(option) === String(value),
  );

  setFormData((current) => ({
    ...current,
    [idField]: selectedOption?.id || "",
    [labelField]: selectedOption ? getOptionLabel(selectedOption) : value,
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

function getLookupSelectValue(id, label, options) {
  if (id) return String(id);

  const matchingOption = options.find(
    (option) => getOptionLabel(option) === String(label),
  );

  return matchingOption ? getOptionValue(matchingOption) : String(label || "");
}

function EditedIndicator({ show }) {
  if (!show) return null;

  return (
    <span className="ml-1 inline-flex items-center rounded-full bg-[#FFF3EE] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-normal text-[#E6531B] ring-1 ring-[#FFD7C8]">
      Edited
    </span>
  );
}

function FormSection({ title, subtitle, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-[#DCE6F1] bg-white p-3.5 sm:p-4 2xl:p-5 shadow-[0_8px_24px_rgba(4,44,81,0.04)] font-jakarta">
      <div className="mb-3 2xl:mb-4 flex items-start gap-2.5 border-b border-[#EEF2F6] pb-2.5 2xl:pb-3">
        <Icon size={16} className="mt-0.5 shrink-0 text-[#FF5C28]" />
        <div className="min-w-0">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
            {title}
          </h3>
          <p className="mt-0.5 text-xs font-semibold leading-5 text-[#667085]">
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
  const movementHistoryTriggerRef = useRef(null);
  const {
    showLeadModal,
    editingLead,
    formData,
    setFormData,
    closeLeadModal,
    handleSaveLead,
    currentAccountName,
    isSaving,
    departmentOptions,
    accountOptions,
    siteOptions,
    statusOptions,
    leadHistory,
    isLeadHistoryLoading,
    leadHistoryError,
    leadComment,
    setLeadComment,
    isAddingLeadComment,
    handleAddLeadComment,
  } = useApplicantLeadsPage();

  if (!showLeadModal) return null;

  const isEditMode = Boolean(editingLead);
  const loggingAccount = editingLead?.inputtedBy || currentAccountName;
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

  function isAnyEdited(...fields) {
    return fields.some((field) => editedFields[field]);
  }

  async function handleCopyReferralCode() {
    if (!canCopyReferralCode) return;
    const copied = await copyTextToClipboard(referralCode);

    if (copied) {
      setCopySuccessMessage("Copied!");
      window.setTimeout(() => setCopySuccessMessage(""), 2200);
    }
  }

  const formattedDepartmentOptions = departmentOptions.map((opt) => ({
    id: opt.id,
    value: getOptionValue(opt),
    label: getOptionLabel(opt),
  }));

  const formattedAccountOptions = accountOptions.map((opt) => ({
    id: opt.id,
    value: getOptionValue(opt),
    label: getOptionLabel(opt),
  }));

  const formattedSiteOptions = siteOptions.map((site) => ({
    id: getOptionLabel(site),
    value: getOptionLabel(site),
    label: getOptionLabel(site),
  }));

  const formattedStatusOptions = statusOptions.map((status) => {
    const statusLabel = getOptionLabel(status);
    return {
      id: statusLabel,
      value: statusLabel,
      label:
        statusLabel === "New Lead"
          ? "New Lead (Uncontacted)"
          : statusLabel,
    };
  });

  return (
    <div className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 font-jakarta">
      <div className="sibs-modal-pop-in relative flex max-h-[84vh] 2xl:max-h-[86vh] w-full max-w-2xl 2xl:max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#D6DEE8] bg-white shadow-2xl">
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
                    className="text-sm sm:text-base font-extrabold leading-5 text-white"
                  >
                    {isEditMode
                      ? "Edit Applicant Lead"
                      : "Log New Applicant Lead"}
                  </h2>

                  <span className="inline-flex rounded-full bg-[#FF5C28] px-2 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wide text-white">
                    Lead Intake
                  </span>
                </div>

                <p className="mt-0.5 sibs-text-xs font-medium text-blue-100">
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
                  <span className="mb-1.5 block text-xs font-extrabold text-[#042C51]">
                    First Name <span className="text-red-500">*</span>
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
                  <span className="mb-1.5 block text-xs font-extrabold text-[#042C51]">
                    Last Name <span className="text-red-500">*</span>
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
                  <span className="mb-1.5 block text-xs font-extrabold text-[#042C51]">
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
                  <span className="mb-1.5 block text-xs font-extrabold text-[#042C51]">
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
                  <span className="mb-1.5 block text-xs font-extrabold text-[#042C51]">
                    Cellphone / CP Number <span className="text-red-500">*</span>
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
                  <span className="mb-1.5 block text-xs font-extrabold text-[#042C51]">
                    Email Address
                    <EditedIndicator show={editedFields.email} />
                  </span>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) =>
                      updateFormField(setFormData, "email", event.target.value)
                    }
                    placeholder="Enter Email Address"
                    className={INPUT_CLASS}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-extrabold text-[#042C51]">
                    Facebook Name
                    <EditedIndicator show={editedFields.facebookName} />
                  </span>
                  <input
                    value={formData.facebookName}
                    onChange={(event) =>
                      updateFormField(setFormData, "facebookName", event.target.value)
                    }
                    placeholder="Enter Facebook Name"
                    className={UPPERCASE_INPUT_CLASS}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-extrabold text-[#042C51]">
                    Facebook Link
                    <EditedIndicator show={editedFields.facebookLink} />
                  </span>
                  <input
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

            {/* Section 2: Organizational Placement */}
            {isEditMode && (
              <FormSection
              title="Organizational Placement"
              subtitle="Assign department, target account, facility site, and initial status."
              icon={Building2}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-extrabold text-[#042C51]">
                    Department <span className="text-red-500">*</span>
                    <EditedIndicator
                      show={isAnyEdited("departmentId", "department")}
                    />
                  </label>
                  <DropdownField
                    value={getLookupSelectValue(
                      formData.departmentId,
                      formData.department,
                      departmentOptions,
                    )}
                    onChange={(value) =>
                      updateLookupField(
                        setFormData,
                        departmentOptions,
                        "departmentId",
                        "department",
                        value,
                      )
                    }
                    options={formattedDepartmentOptions}
                    placeholder="Select Department..."
                    searchable={true}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-extrabold text-[#042C51]">
                    Account / Client <span className="text-red-500">*</span>
                    <EditedIndicator
                      show={isAnyEdited("accountId", "specificAccount")}
                    />
                  </label>
                  <DropdownField
                    value={getLookupSelectValue(
                      formData.accountId,
                      formData.specificAccount,
                      accountOptions,
                    )}
                    onChange={(value) =>
                      updateLookupField(
                        setFormData,
                        accountOptions,
                        "accountId",
                        "specificAccount",
                        value,
                      )
                    }
                    options={formattedAccountOptions}
                    placeholder="Select Account..."
                    searchable={true}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-extrabold text-[#042C51]">
                    Preferred Work Location
                    <EditedIndicator show={editedFields.preferredSite} />
                  </label>
                  <DropdownField
                    value={formData.preferredSite}
                    onChange={(value) =>
                      updateFormField(setFormData, "preferredSite", value)
                    }
                    options={formattedSiteOptions}
                    placeholder="Select Site..."
                    searchable={false}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-extrabold text-[#042C51]">
                    Initial Lead Status
                    <EditedIndicator show={editedFields.status} />
                  </label>
                  <DropdownField
                    value={formData.status}
                    onChange={(value) =>
                      updateFormField(setFormData, "status", value)
                    }
                    options={formattedStatusOptions}
                    placeholder="Select Status..."
                    searchable={false}
                    className="w-full"
                  />
                </div>
              </div>
              </FormSection>
            )}

            {/* Section 3: Notes & Inquiry Remarks */}
            <FormSection
              title="Inquiry Notes & Remarks"
              subtitle="Record walk-in notes, caller background, shift preference, or recruiter notes."
              icon={FileText}
            >
              <label className="block">
                <span className="mb-1.5 block text-xs font-extrabold text-[#042C51]">
                  HR Notes
                  <EditedIndicator show={editedFields.notes} />
                </span>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(event) =>
                    updateFormField(setFormData, "notes", event.target.value)
                  }
                  placeholder="Record preliminary background, shift availability, or interview notes..."
                  className={UPPERCASE_TEXTAREA_CLASS}
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
                className="inline-flex h-8 2xl:h-8.5 items-center justify-center rounded-lg border border-[#D7DEE8] bg-[#F8FAFC] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#344054] transition hover:bg-white hover:text-[#042C51]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="inline-flex h-8 2xl:h-8.5 items-center justify-center gap-1.5 2xl:gap-2 rounded-lg bg-[#FF5C28] px-4 2xl:px-5 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E95324] disabled:cursor-not-allowed disabled:border disabled:border-[#D6E0EA] disabled:bg-[#EEF3F8] disabled:text-[#6F8196] disabled:shadow-none"
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
            </div>
          </footer>
        </form>

        <ApplicantLeadMovementHistoryDrawer
          open={isEditMode && movementHistoryOpen}
          lead={editingLead || {}}
          history={leadHistory}
          isLoading={isLeadHistoryLoading}
          error={leadHistoryError}
          onClose={() => setMovementHistoryOpen(false)}
          triggerRef={movementHistoryTriggerRef}
        />
      </div>
    </div>
  );
}
