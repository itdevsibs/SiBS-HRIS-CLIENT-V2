import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, CircleCheckBig, Clipboard, Copy, KeyRound, UserCheck, UserPlus, X } from "lucide-react";

import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";
import { getApplicantLeadEditedFields } from "../../../lib/utils/applicantLeads/applicantLeadFormDirty";

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

function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "Select option",
  emptyLabel = "No options available",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const selectedOption = options.find(
    (option) => getOptionValue(option) === String(value),
  );
  const selectedLabel = selectedOption
    ? getOptionLabel(selectedOption)
    : String(value || "");

  useEffect(() => {
    function handlePointerDown(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function handleSelect(option) {
    onChange(getOptionValue(option));
    setIsOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative mt-2">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-3 text-left text-xs font-extrabold text-[#042C51] outline-none transition hover:border-[#042C51]/30 hover:bg-white focus:border-[#042C51] focus:bg-white"
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <ChevronDown
          size={15}
          className={`shrink-0 transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[1100] max-h-56 overflow-y-auto rounded-xl border border-[#D6DEE8] bg-white py-1 shadow-xl">
          {options.length ? (
            options.map((option, index) => {
              const optionValue = getOptionValue(option);
              const optionLabel = getOptionLabel(option);
              const isSelected = optionValue === String(value);

              return (
                <button
                  key={`${optionValue}-${index}`}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`block w-full px-3 py-2 text-left text-xs font-bold transition ${
                    isSelected
                      ? "bg-[#EAF4FF] text-[#042C51]"
                      : "text-[#344054] hover:bg-[#F8FAFC] hover:text-[#042C51]"
                  }`}
                >
                  {optionLabel}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-xs font-bold text-[#98A2B3]">
              {emptyLabel}
            </div>
          )}
        </div>
      ) : null}
    </div>
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

  const loggingAccount = editingLead?.inputtedBy || currentAccountName;
  const referralCode = editingLead?.referralCode || editingLead?.referral_code || "";
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
      setCopySuccessMessage("Successfully copied");
      window.setTimeout(() => setCopySuccessMessage(""), 2200);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-[#042C51] px-6 py-5 text-white">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-extrabold">
              <UserPlus size={20} className="text-[#FF5C28]" />
              {editingLead ? "Edit Applicant Lead" : "Log New Applicant Lead"}
            </h3>
            <p className="mt-1 text-xs font-medium text-white/75">
              HR inputs basic lead info. Account logged as{" "}
              <span className="font-extrabold text-white underline">
                {loggingAccount}
              </span>
              .
            </p>
          </div>

          <button
            type="button"
            onClick={closeLeadModal}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white transition hover:bg-white/10"
            aria-label="Close applicant lead modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSaveLead} className="flex max-h-[78vh] flex-col">
          <div className="overflow-y-auto p-6">
          <div className="mb-4 flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 font-extrabold text-[#042C51]">
              <UserCheck size={16} className="text-[#FF5C28]" />
              <span>Logging Account:</span>
              <span className="rounded border border-blue-200 bg-white px-2 py-1 text-blue-900">
                {loggingAccount}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-[#667085]">
              Auto-captured from active login
            </span>
          </div>

          {editingLead ? (
            <div className="mb-4 flex flex-col gap-2 rounded-xl border border-[#DCE6F1] bg-[#F8FAFC] p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-1.5 font-extrabold text-[#042C51]">
                <KeyRound size={16} className="shrink-0 text-[#FF5C28]" />
                <span className="mr-0.5 shrink-0">Referral Code:</span>
                <span className="min-w-0 truncate rounded border border-[#DCE6F1] bg-white px-2 py-1 font-black tracking-[0.08em] text-[#042C51]">
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
                  <Copy size={16} strokeWidth={2.2} />
                </button>
                {copySuccessMessage ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-extrabold text-[#11A873]">
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

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-extrabold text-[#344054]">
                First Name <span className="text-red-500">*</span>
                <EditedIndicator show={editedFields.firstName} />
              </span>
              <input
                required
                value={formData.firstName}
                onChange={(event) =>
                  updateFormField(setFormData, "firstName", event.target.value)
                }
                placeholder="e.g. Maria"
                className="mt-2 h-10 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#042C51] outline-none focus:border-[#042C51] focus:bg-white focus:ring-4 focus:ring-sibs-primary-1/10"
              />
            </label>

            <label className="block">
              <span className="text-xs font-extrabold text-[#344054]">
                Last Name <span className="text-red-500">*</span>
                <EditedIndicator show={editedFields.lastName} />
              </span>
              <input
                required
                value={formData.lastName}
                onChange={(event) =>
                  updateFormField(setFormData, "lastName", event.target.value)
                }
                placeholder="e.g. Santos"
                className="mt-2 h-10 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#042C51] outline-none focus:border-[#042C51] focus:bg-white focus:ring-4 focus:ring-sibs-primary-1/10"
              />
            </label>

            <label className="block">
              <span className="text-xs font-extrabold text-[#344054]">
                Middle Name
                <EditedIndicator show={editedFields.middleName} />
              </span>
              <input
                value={formData.middleName}
                onChange={(event) =>
                  updateFormField(setFormData, "middleName", event.target.value)
                }
                placeholder="e.g. Clara"
                className="mt-2 h-10 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#042C51] outline-none focus:border-[#042C51] focus:bg-white focus:ring-4 focus:ring-sibs-primary-1/10"
              />
            </label>

            <label className="block">
              <span className="text-xs font-extrabold text-[#344054]">
                Suffix
                <EditedIndicator show={editedFields.suffix} />
              </span>
              <input
                value={formData.suffix}
                onChange={(event) =>
                  updateFormField(setFormData, "suffix", event.target.value)
                }
                placeholder="e.g. Jr., Sr., III"
                className="mt-2 h-10 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#042C51] outline-none focus:border-[#042C51] focus:bg-white focus:ring-4 focus:ring-sibs-primary-1/10"
              />
            </label>

            <label className="block">
              <span className="text-xs font-extrabold text-[#344054]">
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
                className="mt-2 h-10 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#042C51] outline-none focus:border-[#042C51] focus:bg-white focus:ring-4 focus:ring-sibs-primary-1/10"
              />
            </label>

            <label className="block">
              <span className="text-xs font-extrabold text-[#344054]">
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
                className="mt-2 h-10 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#042C51] outline-none focus:border-[#042C51] focus:bg-white focus:ring-4 focus:ring-sibs-primary-1/10"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-extrabold text-[#344054]">
                Department <span className="text-red-500">*</span>
                <EditedIndicator show={isAnyEdited("departmentId", "department")} />
              </span>
              <CustomSelect
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
                options={departmentOptions}
                placeholder="Loading Kronos departments..."
                emptyLabel="No Kronos departments found"
              />
            </label>

            <label className="block">
              <span className="text-xs font-extrabold text-[#344054]">
                Account / Client <span className="text-red-500">*</span>
                <EditedIndicator show={isAnyEdited("accountId", "specificAccount")} />
              </span>
              <CustomSelect
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
                options={accountOptions}
                placeholder="Loading Kronos accounts..."
                emptyLabel="No Kronos accounts found"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-extrabold text-[#344054]">
                Preferred Work Location
                <EditedIndicator show={editedFields.preferredSite} />
              </span>
              <CustomSelect
                value={formData.preferredSite}
                onChange={(value) =>
                  updateFormField(
                    setFormData,
                    "preferredSite",
                    value,
                  )
                }
                options={siteOptions.map((site) => ({
                  ...site,
                  id: getOptionLabel(site),
                  value: getOptionLabel(site),
                }))}
              />
            </label>
          </div>

          <div className="mt-4 block">
            <span className="text-xs font-extrabold text-[#344054]">
              Initial Lead Status
              <EditedIndicator show={editedFields.status} />
            </span>
            <CustomSelect
              value={formData.status}
              onChange={(value) =>
                updateFormField(setFormData, "status", value)
              }
              options={statusOptions.map((status) => {
                const statusLabel = getOptionLabel(status);

                return {
                  ...status,
                  id: statusLabel,
                  value: statusLabel,
                  label:
                    statusLabel === "New Lead"
                      ? "New Lead (Uncontacted)"
                      : statusLabel,
                };
              })}
            />
          </div>

          <label className="mt-4 block">
            <span className="text-xs font-extrabold text-[#344054]">
              HR Notes & Inquiry Remarks
              <EditedIndicator show={editedFields.notes} />
            </span>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(event) =>
                updateFormField(setFormData, "notes", event.target.value)
              }
              placeholder="Record walk-in remarks, call details, shift preference, or preliminary feedback..."
              className="mt-2 w-full resize-none rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-3 py-3 text-xs font-medium text-[#042C51] outline-none focus:border-[#042C51] focus:bg-white focus:ring-4 focus:ring-sibs-primary-1/10"
            />
          </label>

          </div>

          <div className="shrink-0 border-t border-[#E6ECF2] bg-white px-6 py-4">
            <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeLeadModal}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#F1F5F9] px-4 text-xs font-extrabold text-[#344054] transition hover:bg-[#E8EEF5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="group inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#042C51] px-6 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#073A6B] disabled:cursor-not-allowed disabled:border disabled:border-[#D6E0EA] disabled:bg-[#EEF3F8] disabled:text-[#6F8196] disabled:shadow-none"
            >
              <Check
                size={15}
                className="text-[#FF5C28] group-disabled:text-[#8FA0B3]"
              />
              {isSaving
                ? "Saving..."
                : editingLead
                  ? "Update Lead"
                  : "Save Applicant Lead"}
            </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
