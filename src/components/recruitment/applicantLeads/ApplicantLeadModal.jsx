import React, { useState } from "react";
import {
  Building2,
  Check,
  CircleCheckBig,
  Copy,
  FileText,
  KeyRound,
  Loader2,
  UserCheck,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";

import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";
import { getApplicantLeadEditedFields } from "../../../lib/utils/applicantLeads/applicantLeadFormDirty";
import DropdownField from "../availablePositions/DropdownField";

const INPUT_CLASS =
  "h-10 w-full rounded-[10px] border border-[#D7DEE8] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-[#667085]";

const TEXTAREA_CLASS =
  "min-h-24 w-full resize-none rounded-[10px] border border-[#D7DEE8] bg-[#F8FAFC] px-3 py-2.5 text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-[#667085]";

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
    <section className="rounded-2xl border border-[#DCE6F1] bg-white p-4 shadow-[0_8px_24px_rgba(4,44,81,0.04)] sm:p-5">
      <div className="mb-4 flex items-start gap-2.5 border-b border-[#EEF2F6] pb-3">
        <Icon size={17} className="mt-0.5 shrink-0 text-[#FF5C28]" />
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
  const isSubmitDisabled = isSaving || (editingLead && !isEditFormEdited);

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
    <div className="sibs-modal-backdrop-in fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs">
      <div className="sibs-modal-pop-in relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#D6DEE8] bg-white shadow-2xl">
        {/* Modal Header */}
        <header className="shrink-0 bg-[#07365F] px-5 py-4 text-white sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <UserPlus size={20} className="mt-0.5 shrink-0 text-[#FF5C28]" />

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="applicant-lead-modal-title"
                    className="text-sm font-extrabold leading-5 text-white sm:text-base"
                  >
                    {isEditMode
                      ? "Edit Applicant Lead"
                      : "Log New Applicant Lead"}
                  </h2>

                  <span className="inline-flex rounded-full bg-[#FF5C28] px-2 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wide text-white">
                    Lead Intake
                  </span>
                </div>

                <p className="mt-0.5 text-xs font-semibold text-blue-100">
                  Capture preliminary inquiries before moving to Talent Pool.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeLeadModal}
              disabled={isSaving}
              aria-label="Close applicant lead modal"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/10 text-blue-100 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={17} />
            </button>
          </div>
        </header>

        {/* Modal Body */}
        <form
          onSubmit={handleSaveLead}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div
            data-dropdown-boundary="true"
            className="thin-scroll min-h-0 flex-1 space-y-4 overflow-y-auto bg-[#F7F9FC] p-3 sm:p-5"
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
                    onChange={(event) =>
                      updateFormField(
                        setFormData,
                        "firstName",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Maria"
                    className={INPUT_CLASS}
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
                    onChange={(event) =>
                      updateFormField(
                        setFormData,
                        "lastName",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Santos"
                    className={INPUT_CLASS}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-extrabold text-[#042C51]">
                    Middle Name
                    <EditedIndicator show={editedFields.middleName} />
                  </span>
                  <input
                    value={formData.middleName}
                    onChange={(event) =>
                      updateFormField(
                        setFormData,
                        "middleName",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Clara"
                    className={INPUT_CLASS}
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
                      updateFormField(
                        setFormData,
                        "suffix",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Jr., Sr., III"
                    className={INPUT_CLASS}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-extrabold text-[#042C51]">
                    Cellphone / CP Number <span className="text-red-500">*</span>
                    <EditedIndicator show={editedFields.cpNum} />
                  </span>
                  <input
                    required
                    value={formData.cpNum}
                    onChange={(event) =>
                      updateFormField(setFormData, "cpNum", event.target.value)
                    }
                    placeholder="e.g. 0917-889-1234"
                    className={INPUT_CLASS}
                  />
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
                    placeholder="e.g. candidate@gmail.com"
                    className={INPUT_CLASS}
                  />
                </label>
              </div>
            </FormSection>

            {/* Section 2: Organizational Placement */}
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
                  className={TEXTAREA_CLASS}
                />
              </label>
            </FormSection>
          </div>

          {/* Footer Actions */}
          <footer className="shrink-0 border-t border-[#E6ECF2] bg-white px-4 py-3.5 sm:px-6">
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={closeLeadModal}
                disabled={isSaving}
                className="inline-flex h-9.5 items-center justify-center rounded-[10px] border border-[#D7DEE8] bg-[#F8FAFC] px-4 text-xs font-extrabold text-[#344054] transition hover:bg-white hover:text-[#042C51]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="inline-flex h-9.5 items-center justify-center gap-2 rounded-[10px] bg-[#FF5C28] px-5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E95324] disabled:cursor-not-allowed disabled:border disabled:border-[#D6E0EA] disabled:bg-[#EEF3F8] disabled:text-[#6F8196] disabled:shadow-none"
              >
                {isSaving ? (
                  <Loader2 size={15} className="animate-spin text-white" />
                ) : (
                  <Check size={15} className="text-white" />
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
      </div>
    </div>
  );
}
