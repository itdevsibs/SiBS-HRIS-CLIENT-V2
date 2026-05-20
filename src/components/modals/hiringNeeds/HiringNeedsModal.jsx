import React from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  FileText,
  Info,
  Plus,
  RotateCcw,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

const NEW_JOB_DESCRIPTION_VALUE = "__NEW_JOB_DESCRIPTION__";

function getJdStatusClass(status) {
  switch (status) {
    case "Existing":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "For Revision":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "New JD":
    case "New Job Description":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function formatDateValue(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value.split("T")[0];
  }

  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  return "";
}

function getJdCode(item) {
  return item?.jdCode || item?.jd_code || `JD-${item?.id || ""}`;
}

function getRoleTitle(item) {
  return item?.roleTitle || item?.role_title || "";
}

function getAccount(item) {
  return item?.account || item?.accountName || item?.gy_acc_name || "";
}

function getDepartment(item) {
  return item?.department || item?.departmentName || item?.name_department || "";
}

function getJdStatus(item) {
  return item?.jdStatus || item?.jd_status || "";
}

function getHiringManager(item) {
  return (
    item?.hiringManager ||
    item?.owner ||
    item?.ownerName ||
    item?.ownerSibsId ||
    ""
  );
}

function getRequestedDate(item) {
  return item?.requestedDate || item?.dateRequested || item?.date_requested || "";
}

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-[#174A7C]">
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

function InfoBox({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F2F6FA] text-sibs-primary-1">
            <Icon size={17} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
            {label}
          </p>

          <div className="break-words text-sm font-bold text-[#344054]">
            {value || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HiringNeedsModal({
  open,
  form,
  setForm,
  onClose,
  onSubmit,
  onReset,
  onCreateNewJobDescription,
  jobDescriptionOptions = [],
}) {
  if (!open) return null;

  function updateField(field, value) {
    setForm({
      ...form,
      [field]: value,
    });
  }

  function handleJobDescriptionChange(jobDescriptionId) {
    if (jobDescriptionId === NEW_JOB_DESCRIPTION_VALUE) {
      onCreateNewJobDescription?.();
      return;
    }

    const selectedJobDescription = jobDescriptionOptions.find(
      (item) => String(item.id) === String(jobDescriptionId),
    );

    if (!selectedJobDescription) {
      setForm({
        ...form,
        jobDescriptionId: "",
        jobDescription: "",
        jdStatus: "",
        account: "",
        department: "",
        roleTitle: "",
        hiringManager: "",
        requestedStartDate: "",
      });
      return;
    }

    const jdCode = getJdCode(selectedJobDescription);
    const roleTitle = getRoleTitle(selectedJobDescription);
    const account = getAccount(selectedJobDescription);
    const department = getDepartment(selectedJobDescription);
    const jdStatus = getJdStatus(selectedJobDescription);
    const hiringManager = getHiringManager(selectedJobDescription);
    const requestedDate = getRequestedDate(selectedJobDescription);

    setForm({
      ...form,
      jobDescriptionId: selectedJobDescription.id,
      jobDescription: `${jdCode || "—"} — ${roleTitle || "—"}`,
      jdStatus,
      roleTitle,
      account,
      department,
      hiringManager,
      requestedStartDate: formatDateValue(requestedDate),
    });
  }

  const selectedJobDescription = jobDescriptionOptions.find(
    (item) => String(item.id) === String(form.jobDescriptionId),
  );

  const selectedJdStatus = selectedJobDescription
    ? getJdStatus(selectedJobDescription)
    : form.jdStatus || "";

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/45 px-4 py-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-[#E6ECF2] bg-gradient-to-r from-[#F8FAFC] via-white to-white px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <BriefcaseBusiness size={14} />
                Hiring Requirement
              </div>

              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-sibs-primary-1">
                New Hiring Requirement
              </h2>

              <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-sibs-tertiary-5">
                Select a job description, confirm the required headcount, and
                submit the hiring requirement for planning and approval.
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

        <form onSubmit={onSubmit} className="min-h-0 flex-1 overflow-y-auto">
          <div className="bg-[#F8FAFC] p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
              <div className="space-y-5">
                <section className="rounded-3xl border border-[#E6ECF2] bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-5 flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sibs-primary-1">
                      <FileText size={21} />
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-[#101828]">
                        Hiring Requirement Details
                      </h3>

                      <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                        Job Description selection will auto-fill account,
                        department, role title, hiring manager, and requested
                        date.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="lg:col-span-2">
                      <FieldLabel required>Job Description</FieldLabel>

                      <SelectInput
                        required
                        value={form.jobDescriptionId || ""}
                        onChange={(e) =>
                          handleJobDescriptionChange(e.target.value)
                        }
                      >
                        <option value="">Select Job Description</option>
                        <option value={NEW_JOB_DESCRIPTION_VALUE}>
                          + New Job Description
                        </option>

                        {jobDescriptionOptions.map((item) => {
                          const jdCode = getJdCode(item);
                          const roleTitle = getRoleTitle(item);
                          const account = getAccount(item);
                          const department = getDepartment(item);
                          const jdStatus = getJdStatus(item);

                          return (
                            <option key={item.id} value={item.id}>
                              {jdCode} — {roleTitle || "—"} / {account || "—"} /{" "}
                              {department || "—"} ({jdStatus || "—"})
                            </option>
                          );
                        })}
                      </SelectInput>
                    </div>

                    <div>
                      <FieldLabel required>Position / Role Title</FieldLabel>
                      <TextInput
                        required
                        readOnly
                        disabled
                        placeholder="Auto-filled from selected JD"
                        value={form.roleTitle || ""}
                      />
                    </div>

                    <div>
                      <FieldLabel required>Hiring Manager / Requestor</FieldLabel>
                      <TextInput
                        required
                        readOnly
                        disabled
                        placeholder="Auto-filled from selected JD"
                        value={form.hiringManager || ""}
                      />
                    </div>

                    <div>
                      <FieldLabel required>Account</FieldLabel>
                      <TextInput
                        required
                        readOnly
                        disabled
                        placeholder="Auto-filled from selected JD"
                        value={form.account || ""}
                      />
                    </div>

                    <div>
                      <FieldLabel required>Department</FieldLabel>
                      <TextInput
                        required
                        readOnly
                        disabled
                        placeholder="Auto-filled from selected JD"
                        value={form.department || ""}
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-[#E6ECF2] bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-5 flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <Sparkles size={21} />
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-[#101828]">
                        Requirement Information
                      </h3>

                      <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                        Complete the planning fields below before submitting.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div>
                      <FieldLabel required>Approved Hiring Requirement</FieldLabel>
                      <TextInput
                        required
                        type="number"
                        min="1"
                        placeholder="Enter required headcount"
                        value={form.approvedRequirement || ""}
                        onChange={(e) =>
                          updateField("approvedRequirement", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <FieldLabel required>Reason for Hiring</FieldLabel>
                      <SelectInput
                        required
                        value={form.reason || ""}
                        onChange={(e) => updateField("reason", e.target.value)}
                      >
                        <option value="">Select reason</option>
                        <option value="Replacement">Replacement</option>
                        <option value="Expansion">Expansion</option>
                        <option value="New Role">New Role</option>
                        <option value="Client Request">Client Request</option>
                      </SelectInput>
                    </div>

                    <div>
                      <FieldLabel>Requested Date</FieldLabel>
                      <TextInput
                        type="date"
                        readOnly
                        disabled
                        value={form.requestedStartDate || ""}
                      />
                    </div>

                    <div>
                      <FieldLabel required>Due Date</FieldLabel>
                      <TextInput
                        required
                        type="date"
                        value={form.dueDate || ""}
                        onChange={(e) => updateField("dueDate", e.target.value)}
                      />
                    </div>

                    <div>
                      <FieldLabel>Priority Level</FieldLabel>
                      <SelectInput
                        value={form.priority || "Medium"}
                        onChange={(e) => updateField("priority", e.target.value)}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </SelectInput>
                    </div>
                  </div>
                </section>
              </div>

              <aside className="space-y-5">
                <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-sibs-primary-1">
                      <Info size={20} />
                    </div>

                    <div>
                      <h3 className="text-sm font-extrabold text-sibs-primary-1">
                        Job Description Link
                      </h3>

                      <p className="mt-2 text-sm font-semibold leading-6 text-sibs-primary-1/80">
                        This request is linked to a Job Description record.
                        Selecting a JD keeps the role, account, and department
                        aligned with your approved JD library.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-extrabold text-[#101828]">
                    Selected Job Description
                  </h3>

                  <div className="mt-4 space-y-3">
                    <InfoBox
                      icon={FileText}
                      label="Job Description"
                      value={form.jobDescription || "No Job Description selected"}
                    />

                    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                        JD Status
                      </p>

                      {selectedJobDescription || selectedJdStatus ? (
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getJdStatusClass(
                            selectedJdStatus,
                          )}`}
                        >
                          {selectedJdStatus || "—"}
                        </span>
                      ) : (
                        <p className="text-sm font-bold text-gray-400">—</p>
                      )}
                    </div>

                    <InfoBox
                      icon={UserRound}
                      label="Hiring Manager"
                      value={form.hiringManager || "—"}
                    />

                    <InfoBox
                      icon={CalendarDays}
                      label="Requested Date"
                      value={form.requestedStartDate || "—"}
                    />
                  </div>
                </section>

                <section className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
                  <h3 className="text-sm font-extrabold text-amber-700">
                    Submission Reminder
                  </h3>

                  <p className="mt-2 text-sm font-semibold leading-6 text-amber-700/80">
                    Review the required headcount, due date, and priority before
                    creating the requirement.
                  </p>
                </section>
              </aside>
            </div>
          </div>
        </form>

        <div className="shrink-0 border-t border-[#E6ECF2] bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
            >
              <RotateCcw size={17} />
              Reset
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-[#F8FAFC] hover:text-sibs-primary-1 hover:shadow-sm active:scale-[0.98]"
            >
              Cancel
            </button>

            <button
              type="submit"
              onClick={onSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
            >
              <Plus size={17} />
              Create Requirement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}