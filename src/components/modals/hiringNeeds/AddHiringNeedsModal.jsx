import React from "react";
import { ChevronDown, Clock, FileText, Plus, X } from "lucide-react";

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

function TextInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:border-[#D0D5DD] disabled:bg-[#F2F4F7] disabled:text-[#667085] ${className}`}
    />
  );
}

function SelectInput({ children, className = "", ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`h-12 w-full appearance-none rounded-xl border border-[#D0D5DD] bg-white px-4 pr-11 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:border-[#D0D5DD] disabled:bg-[#F2F4F7] disabled:text-[#667085] ${className}`}
      >
        {children}
      </select>

      <ChevronDown
        size={18}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
      />
    </div>
  );
}

export default function AddHiringNeedsModal({
  open,
  form,
  setForm,
  jobDescriptions = [],
  jobDescriptionLoading = false,
  reasonForHiringOptions = [],
  onClose,
  onSubmit,
  onReset,
}) {
  if (!open) return null;

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleJobDescriptionChange(jobDescriptionDbId) {
    const selectedJd = jobDescriptions.find((item) => {
      return String(item.id) === String(jobDescriptionDbId);
    });

    if (!selectedJd) {
      setForm((prev) => ({
        ...prev,
        jobDescriptionDbId: "",
        positionTitle: "",
        departmentAccount: "",
        accountId: "",
        departmentId: "",
        jobDescriptionId: "",
        jobDescriptionCode: "",
        jobDescriptionTitle: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      jobDescriptionDbId: selectedJd.id || "",
      positionTitle: selectedJd.roleTitle || "",
      departmentAccount:
        selectedJd.departmentAccount ||
        (selectedJd.department && selectedJd.account
          ? `${selectedJd.department} / ${selectedJd.account}`
          : selectedJd.department || selectedJd.account || ""),
      accountId: selectedJd.accountId || "",
      departmentId: selectedJd.departmentId || "",
      jobDescriptionId: selectedJd.id || "",
      jobDescriptionCode: selectedJd.jdCode || "",
      jobDescriptionTitle: selectedJd.roleTitle || "",
    }));
  }

  function handleAssignmentChange(value) {
    setForm((prev) => ({
      ...prev,
      assignment: value,
      assignmentOther: value === "Other" ? prev.assignmentOther : "",
    }));
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/45 px-4 py-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="border-b border-[#E6ECF2] bg-gradient-to-r from-[#F8FAFC] via-white to-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <FileText size={14} />
                New Personnel Request
              </div>

              <h2 className="mt-3 text-2xl font-extrabold text-sibs-primary-1">
                PERSONNEL REQUISITION
              </h2>

              <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-sibs-tertiary-5">
                Select a position title from Job Description. Department /
                Account and Job Description will auto-populate from your backend.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-5 sm:p-6">
          <div className="rounded-3xl border border-[#E6ECF2] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex flex-col gap-1">
              <h3 className="text-base font-extrabold text-[#101828]">
                Request Details
              </h3>

              <p className="text-sm font-medium text-sibs-tertiary-5">
                Fields marked with an asterisk are required.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <FieldLabel required>Position Title</FieldLabel>
                <SelectInput
                  value={form.jobDescriptionDbId || ""}
                  onChange={(e) => handleJobDescriptionChange(e.target.value)}
                  disabled={jobDescriptionLoading}
                >
                  <option value="">
                    {jobDescriptionLoading
                      ? "Loading job descriptions..."
                      : "Select Position Title"}
                  </option>

                  {jobDescriptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.roleTitle || "Untitled Job Description"}
                      {item.jdCode ? ` (${item.jdCode})` : ""}
                    </option>
                  ))}
                </SelectInput>
              </div>

              <div>
                <FieldLabel required>Department / Account</FieldLabel>
                <TextInput
                  value={form.departmentAccount || ""}
                  readOnly
                  disabled
                  placeholder="Auto-populated after selecting position"
                />
              </div>

              <div>
                <FieldLabel>Job Description</FieldLabel>
                <TextInput
                  value={
                    form.jobDescriptionCode
                      ? `${form.jobDescriptionCode} — ${form.jobDescriptionTitle}`
                      : form.jobDescriptionTitle || ""
                  }
                  readOnly
                  disabled
                  placeholder="Auto-populated after selecting position"
                />
              </div>

              <div>
                <FieldLabel required>Headcount</FieldLabel>
                <TextInput
                  type="number"
                  min="1"
                  value={form.headcount || ""}
                  onChange={(e) => updateField("headcount", e.target.value)}
                  placeholder="Enter requested headcount"
                />
              </div>

              <div>
                <FieldLabel required>Reason for Hiring</FieldLabel>
                <SelectInput
                  value={form.reasonForHiring || ""}
                  onChange={(e) =>
                    updateField("reasonForHiring", e.target.value)
                  }
                >
                  <option value="">Select Reason</option>

                  {reasonForHiringOptions.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </SelectInput>
              </div>

              <div>
                <FieldLabel required>Assignment</FieldLabel>
                <SelectInput
                  value={form.assignment || "Probationary"}
                  onChange={(e) => handleAssignmentChange(e.target.value)}
                >
                  <option value="Probationary">Probationary</option>
                  <option value="Permanent/Regular">Permanent / Regular</option>
                  <option value="Other">Other</option>
                </SelectInput>
              </div>

              <div>
                <FieldLabel required>Location / Site</FieldLabel>
                <SelectInput
                  value={form.locationSite || "Davao Site"}
                  onChange={(e) => updateField("locationSite", e.target.value)}
                >
                  <option value="Davao Site">Davao Site</option>
                  <option value="Tagum Site">Tagum Site</option>
                  <option value="Mabini Site">Mabini Site</option>
                </SelectInput>
              </div>

              {form.assignment === "Other" && (
                <div className="lg:col-span-2">
                  <FieldLabel required>Other Assignment Information</FieldLabel>
                  <TextInput
                    value={form.assignmentOther || ""}
                    onChange={(e) =>
                      updateField("assignmentOther", e.target.value)
                    }
                    placeholder="Enter other assignment information"
                  />
                </div>
              )}

              <div>
                <FieldLabel required>Date Needed</FieldLabel>
                <TextInput
                  type="date"
                  value={form.dateNeeded || ""}
                  onChange={(e) => updateField("dateNeeded", e.target.value)}
                />
              </div>

              <div>
                <FieldLabel required>Prepared By</FieldLabel>
                <TextInput
                  value={form.preparedBy || ""}
                  readOnly
                  disabled
                  placeholder="Logged-in user"
                />
              </div>

              <div className="lg:col-span-2">
                <FieldLabel>Approval Status</FieldLabel>
                <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-extrabold text-amber-700">
                      {form.approvalStatus || "For Approval"}
                    </p>

                    <p className="mt-0.5 text-xs font-semibold text-amber-600">
                      This request will be routed for approval after submission.
                    </p>
                  </div>

                  <Clock size={20} className="shrink-0 text-amber-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-bold text-sibs-primary-1">
              Approval Notice
            </p>

            <p className="mt-1 text-sm font-semibold leading-6 text-sibs-primary-1/80">
              After submission, this personnel requisition will be marked as
              <span className="font-extrabold"> For Approval</span>. The request
              list will show whether it is Approved or Not Approved with the
              approval date.
            </p>
          </div>
        </div>

        <div className="border-t border-[#E6ECF2] bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            >
              <Plus size={17} />
              Submit for Approval
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}