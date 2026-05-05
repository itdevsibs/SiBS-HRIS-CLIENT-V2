import React from "react";
import { Plus, RotateCcw, X } from "lucide-react";

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
  return item?.hiringManager || item?.owner || item?.ownerName || item?.ownerSibsId || "";
}

function getRequestedDate(item) {
  return item?.requestedDate || item?.dateRequested || item?.date_requested || "";
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>
      <div className="break-words text-sm font-bold text-[#344054]">
        {value || "—"}
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

  function handleJobDescriptionChange(jobDescriptionId) {
    if (jobDescriptionId === NEW_JOB_DESCRIPTION_VALUE) {
      onCreateNewJobDescription?.();
      return;
    }

    const selectedJobDescription = jobDescriptionOptions.find(
      (item) => String(item.id) === String(jobDescriptionId)
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
    (item) => String(item.id) === String(form.jobDescriptionId)
  );

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              New Hiring Requirement
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              This replaces active PRF submission. Use Approved Hiring
              Requirement as the single source of truth.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Hiring Requirement Details
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Job Description <span className="text-red-500">*</span>
                    </label>

                    <select
                      required
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none"
                      value={form.jobDescriptionId}
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
                    </select>
                  </div>

                  {[
                    ["Account", "account", "Account"],
                    ["Department", "department", "Department"],
                    ["Role Title", "roleTitle", "Role Title"],
                    [
                      "Hiring Manager / Requestor",
                      "hiringManager",
                      "Hiring Manager",
                    ],
                  ].map(([label, key, placeholder]) => (
                    <div key={key}>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                        {label} <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        readOnly
                        className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-semibold text-[#344054] outline-none"
                        placeholder={placeholder}
                        value={form[key] || ""}
                        onChange={(e) =>
                          setForm({ ...form, [key]: e.target.value })
                        }
                      />
                    </div>
                  ))}

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Approved Hiring Requirement{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none"
                      value={form.approvedRequirement}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          approvedRequirement: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Reason for Hiring <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none"
                      value={form.reason}
                      onChange={(e) =>
                        setForm({ ...form, reason: e.target.value })
                      }
                    >
                      <option value="">Select reason</option>
                      <option value="Replacement">Replacement</option>
                      <option value="Expansion">Expansion</option>
                      <option value="New Role">New Role</option>
                      <option value="Client Request">Client Request</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Requested Date
                    </label>
                    <input
                      type="date"
                      readOnly
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-semibold text-[#344054] outline-none"
                      value={form.requestedStartDate || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          requestedStartDate: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="date"
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none"
                      value={form.dueDate}
                      onChange={(e) =>
                        setForm({ ...form, dueDate: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Priority Level
                    </label>
                    <select
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none"
                      value={form.priority}
                      onChange={(e) =>
                        setForm({ ...form, priority: e.target.value })
                      }
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Job Description Link
                </h3>
                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  This hiring request links directly to a Job Description
                  record. Selecting a JD will automatically fill the account,
                  department, role title, hiring manager, and requested date.
                </p>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Selected Job Description
                </h3>

                <div className="mt-4 space-y-3">
                  <InfoBox
                    label="Job Description"
                    value={form.jobDescription || "No Job Description selected"}
                  />

                  <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      JD Status
                    </p>

                    {selectedJobDescription ? (
                      <span
                        className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getJdStatusClass(
                          getJdStatus(selectedJobDescription)
                        )}`}
                      >
                        {getJdStatus(selectedJobDescription) || "—"}
                      </span>
                    ) : (
                      <p className="mt-1 text-sm font-bold text-gray-400">—</p>
                    )}
                  </div>

                  <InfoBox
                    label="Hiring Manager"
                    value={form.hiringManager || "—"}
                  />

                  <InfoBox
                    label="Requested Date"
                    value={form.requestedStartDate || "—"}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-sibs-primary-1"
            >
              <RotateCcw size={17} />
              Reset
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600"
            >
              Cancel
            </button>

            <button
              type="submit"
              onClick={onSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white"
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