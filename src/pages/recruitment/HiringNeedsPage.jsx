import React, { useEffect, useMemo, useState } from "react";

import Header from "../../components/layout/Header";
import StatusModal from "@/components/modals/StatusModal";
import {
  createHiringNeed,
  getHiringNeedJobDescriptions,
  getHiringNeeds,
} from "@/lib/axios/getHiringNeeds";
import HiringSearchTable from "@/components/tables/HiringNeeds/HiringSearchTable";
import PRSummaryTable from "@/components/tables/HiringNeeds/PRSummaryTable";
import ReasonForHiringTable from "@/components/tables/HiringNeeds/ReasonForHiringTable";
import HiringNeedsDataTable from "@/components/tables/HiringNeeds/HiringNeedsDataTable";

import { useUser } from "@/services/context/UserContext";

import {
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Plus,
  X,
  XCircle,
} from "lucide-react";

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatPersonName(value) {
  const rawValue = String(value || "").trim();

  if (!rawValue) return "";

  if (rawValue.includes("@")) {
    const localPart = rawValue.split("@")[0] || "";

    return localPart
      .replace(/[._-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }

  return rawValue;
}

function getUserDisplayName(user) {
  const possibleName =
    user?.fullName ||
    user?.fullname ||
    user?.name ||
    user?.employeeName ||
    user?.gy_emp_fullname ||
    user?.displayName ||
    user?.username ||
    user?.email ||
    user?.userEmail ||
    user?.workEmail ||
    "Alena Batacan";

  return formatPersonName(possibleName) || "Alena Batacan";
}

const reasonForHiringOptions = [
  "New Position",
  "Ramp-up",
  "Forecasted Growth",
];

const initialForm = {
  jobDescriptionDbId: "",
  positionTitle: "",
  departmentAccount: "",
  accountId: "",
  departmentId: "",
  jobDescriptionId: "",
  jobDescriptionCode: "",
  jobDescriptionTitle: "",
  headcount: "",
  reasonForHiring: "",
  assignment: "Probationary",
  assignmentOther: "",
  locationSite: "Davao Site",
  dateNeeded: "",
  preparedBy: "",
  preparedById: "",
  approvalStatus: "For Approval",
};

const fallbackPersonnelRequisitions = [
  {
    id: "PRF-2026-001",
    positionTitle: "Customer Service Representative",
    departmentAccount: "Operations / Customer Support",
    jobDescriptionId: "",
    jobDescriptionTitle: "Customer Service Representative",
    headcount: 10,
    reasonForHiring: "Ramp-up",
    assignment: "Probationary",
    assignmentOther: "",
    locationSite: "Davao Site",
    dateNeeded: getTodayISO(),
    preparedBy: "System User",
    approvalStatus: "For Approval",
    approvalDate: "",
    createdAt: getTodayISO(),
  },
];

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeStatus(status) {
  if (!status) return "For Approval";

  if (status === "Pending") return "For Approval";
  if (status === "For Validation") return "For Approval";
  if (status === "Under Review") return "For Approval";
  if (status === "Approved") return "Approved";
  if (status === "Rejected") return "Not Approved";
  if (status === "Not Approved") return "Not Approved";

  return status;
}

function getStatusClass(status) {
  switch (normalizeStatus(status)) {
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Not Approved":
      return "border-red-200 bg-red-50 text-red-700";
    case "For Approval":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getApprovalIcon(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "Approved") {
    return <CheckCircle2 size={18} className="text-emerald-600" />;
  }

  if (normalized === "Not Approved") {
    return <XCircle size={18} className="text-red-600" />;
  }

  return <Clock size={18} className="text-amber-500" />;
}

function normalizeItem(item) {
  const jd = item.jobDescription;

  const jobDescriptionTitle =
    item.jobDescriptionTitle ||
    item.job_description_title ||
    item.jdRoleTitle ||
    item.jd_role_title ||
    item.jdTitle ||
    item.jd_title ||
    item.jobDescriptionName ||
    item.job_description_name ||
    (jd && typeof jd === "object"
      ? jd.roleTitle || jd.role_title || jd.title || jd.jd_title
      : "") ||
    "";

  const jobDescriptionText =
    typeof jd === "string"
      ? jd
      : item.jdCode && jobDescriptionTitle
      ? `${item.jdCode} — ${jobDescriptionTitle}`
      : jobDescriptionTitle;

  return {
    ...item,
    id: item.id || item.prfId || item.prf_id || item.requisitionId || "—",

    positionTitle:
      item.positionTitle ||
      item.position_title ||
      item.roleTitle ||
      item.role_title ||
      "",

    departmentAccount:
      item.departmentAccount ||
      item.department_account ||
      (item.department && item.account
        ? `${item.department} / ${item.account}`
        : item.department || item.account || "") ||
      "",

    accountId: item.accountId || item.account_id || "",
    departmentId: item.departmentId || item.department_id || "",

    jobDescriptionId:
      item.jobDescriptionId ||
      item.job_description_id ||
      item.jdId ||
      item.jd_id ||
      "",

    jobDescriptionTitle,
    jobDescriptionText,

    headcount:
      item.headcount ||
      item.approvedRequirement ||
      item.approved_requirement ||
      item.requiredHeadcount ||
      item.required_headcount ||
      "",

    reasonForHiring:
      item.reasonForHiring ||
      item.reason_for_hiring ||
      item.reason ||
      item.hiringReason ||
      item.hiring_reason ||
      "",

    assignment:
      item.assignment ||
      item.employmentType ||
      item.employment_type ||
      "Probationary",

    assignmentOther:
      item.assignmentOther ||
      item.assignment_other ||
      item.otherAssignment ||
      item.other_assignment ||
      "",

    locationSite:
      item.locationSite || item.location_site || item.site || item.location || "",

    dateNeeded:
      item.dateNeeded ||
      item.date_needed ||
      item.dueDate ||
      item.due_date ||
      item.requestedStartDate ||
      item.requested_start_date ||
      "",

    preparedBy: formatPersonName(
      item.preparedBy ||
        item.prepared_by ||
        item.hiringManager ||
        item.hiring_manager ||
        ""
    ),

    approvalStatus:
      item.approvalStatus ||
      item.approval_status ||
      item.status ||
      "For Approval",

    approvalDate:
      item.approvalDate ||
      item.approval_date ||
      item.approvedAt ||
      item.approved_at ||
      "",

    createdAt: item.createdAt || item.created_at || "",
  };
}

function isAdditionalRequest(item) {
  const text = [
    item?.intakeType,
    item?.type,
    item?.hiringType,
    item?.requestType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return text.includes("additional request");
}

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

function CreatePersonnelRequisitionModal({
  open,
  form,
  setForm,
  jobDescriptions,
  jobDescriptionLoading,
  reasonForHiringOptions,
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

function ViewHiringNeedModal({ open, item, onClose }) {
  if (!open || !item) return null;

  const status = normalizeStatus(item.approvalStatus);

  const checklist = [
    {
      label: "Personnel requisition submitted",
      done: true,
      date: item.createdAt || item.dateNeeded,
    },
    {
      label: item.jobDescriptionId
        ? "Job Description selected"
        : "Job Description not selected",
      done: !!item.jobDescriptionId,
      date: item.createdAt || item.dateNeeded,
    },
    {
      label: "Subject for approval",
      done: true,
      date: item.createdAt || item.dateNeeded,
    },
    {
      label:
        status === "Approved"
          ? "Approved"
          : status === "Not Approved"
          ? "Not Approved"
          : "Waiting for approval decision",
      done: status === "Approved" || status === "Not Approved",
      date: item.approvalDate,
      status,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-sibs-primary-1 sm:text-xl">
              PERSONNEL REQUISITION
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              {item.id || "—"} / {item.positionTitle || "—"}
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Position Title
                    </p>

                    <h3 className="mt-1 text-xl font-extrabold text-[#101828]">
                      {item.positionTitle || "—"}
                    </h3>

                    <p className="mt-2 text-sm font-semibold text-sibs-tertiary-5">
                      {item.departmentAccount || "—"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                          status
                        )}`}
                      >
                        {getApprovalIcon(status)}
                        {status}
                      </span>

                      <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1">
                        {item.locationSite || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1/70">
                      Headcount
                    </p>

                    <p className="mt-1 text-3xl font-extrabold text-sibs-primary-1">
                      {item.headcount || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <InfoBox label="Position Title" value={item.positionTitle} />
                <InfoBox
                  label="Department / Account"
                  value={item.departmentAccount}
                />
                <InfoBox
                  label="Job Description"
                  value={
                    item.jobDescriptionText ||
                    item.jobDescriptionTitle ||
                    item.jobDescriptionId ||
                    "Not selected"
                  }
                />
                <InfoBox label="Headcount" value={item.headcount} />
                <InfoBox label="Reason for Hiring" value={item.reasonForHiring} />
                <InfoBox
                  label="Assignment"
                  value={
                    item.assignment === "Other"
                      ? item.assignmentOther || "Other"
                      : item.assignment
                  }
                />
                <InfoBox label="Location / Site" value={item.locationSite} />
                <InfoBox
                  label="Date Needed"
                  value={formatDate(item.dateNeeded)}
                />
                <InfoBox label="Prepared By" value={item.preparedBy} />
                <InfoBox label="Approval Status" value={status} />
                <InfoBox
                  label="Approval Date"
                  value={formatDate(item.approvalDate)}
                />
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-[#101828]">
                  Approval Checklist
                </h3>

                <div className="mt-4 space-y-3">
                  {checklist.map((step) => (
                    <div
                      key={step.label}
                      className="flex gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3"
                    >
                      <div className="mt-0.5">
                        {step.done ? (
                          step.status === "Not Approved" ? (
                            <XCircle size={18} className="text-red-600" />
                          ) : (
                            <CheckCircle2
                              size={18}
                              className="text-emerald-600"
                            />
                          )
                        ) : (
                          <Clock size={18} className="text-amber-500" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#101828]">
                          {step.label}
                        </p>

                        <p className="mt-0.5 text-xs font-semibold text-sibs-tertiary-5">
                          Date: {formatDate(step.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Approval Rule
                </h3>

                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  This personnel requisition is subject to approval before it can
                  be used for hiring execution and weekly hiring planning.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-sibs-primary-1 px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HiringNeedsPage() {
  const { user } = useUser();
  const preparedByName = getUserDisplayName(user);

  const [list, setList] = useState([]);
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobDescriptionLoading, setJobDescriptionLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [siteFilter, setSiteFilter] = useState("All");
  const [reasonFilter, setReasonFilter] = useState("All");

  const [form, setForm] = useState({
    ...initialForm,
    preparedBy: preparedByName,
    preparedById: user?.id || user?.userId || user?.gy_user_id || "",
  });

  useEffect(() => {
    fetchList();
    fetchJobDescriptions();
  }, []);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      preparedBy: preparedByName,
      preparedById: user?.id || user?.userId || user?.gy_user_id || "",
    }));
  }, [preparedByName, user]);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  async function fetchList() {
    setLoading(true);

    try {
      const res = await getHiringNeeds();

      if (res?.success && Array.isArray(res.data)) {
        setList(res.data);
      } else if (Array.isArray(res)) {
        setList(res);
      } else {
        setList(fallbackPersonnelRequisitions);
      }
    } catch (err) {
      console.error("GET PERSONNEL REQUISITIONS ERROR:", err);
      setList(fallbackPersonnelRequisitions);
    } finally {
      setLoading(false);
    }
  }

  async function fetchJobDescriptions() {
    setJobDescriptionLoading(true);

    try {
      const res = await getHiringNeedJobDescriptions();

      if (res?.success && Array.isArray(res.data)) {
        setJobDescriptions(res.data);
      } else if (Array.isArray(res)) {
        setJobDescriptions(res);
      } else {
        setJobDescriptions([]);
      }
    } catch (err) {
      console.error("GET JOB DESCRIPTIONS ERROR:", err);
      setJobDescriptions([]);
    } finally {
      setJobDescriptionLoading(false);
    }
  }

  function resetForm() {
    setForm({
      ...initialForm,
      preparedBy: preparedByName,
      preparedById: user?.id || user?.userId || user?.gy_user_id || "",
    });
  }

  function handleOpenCreateModal() {
    setForm({
      ...initialForm,
      preparedBy: preparedByName,
      preparedById: user?.id || user?.userId || user?.gy_user_id || "",
    });
    setShowCreateModal(true);
  }

  function handleCloseCreateModal() {
    setShowCreateModal(false);
    resetForm();
  }

  function showStatusModal(type, title, message) {
  setStatusModal({
    open: true,
    type,
    title,
    message,
  });
}

function closeStatusModal() {
  setStatusModal((prev) => ({
    ...prev,
    open: false,
  }));
}

  async function handleCreate(e) {
    e.preventDefault();

    if (!form.jobDescriptionDbId) {
      showStatusModal(
        "error",
        "Position Title Required",
        "Please select a Position Title from Job Description."
      );
      return;
    }

    if (!form.positionTitle.trim()) {
      showStatusModal(
        "error",
        "Position Title Required",
        "Position Title is required."
      );
      return;
    }

    if (!form.departmentAccount.trim()) {
      showStatusModal(
        "error",
        "Department / Account Required",
        "Department / Account is required."
      );
      return;
    }

    if (!form.headcount || Number(form.headcount) <= 0) {
      showStatusModal(
        "error",
        "Invalid Headcount",
        "Headcount must be greater than 0."
      );
      return;
    }

    if (!form.reasonForHiring) {
      showStatusModal(
        "error",
        "Reason Required",
        "Reason for Hiring is required."
      );
      return;
    }

    if (!reasonForHiringOptions.includes(form.reasonForHiring)) {
      showStatusModal(
        "error",
        "Invalid Reason",
        "Invalid Reason for Hiring selected."
      );
      return;
    }

    if (!form.assignment) {
      showStatusModal(
        "error",
        "Assignment Required",
        "Assignment is required."
      );
      return;
    }

    if (form.assignment === "Other" && !form.assignmentOther.trim()) {
      showStatusModal(
        "error",
        "Other Assignment Required",
        "Please enter Other assignment information."
      );
      return;
    }

    if (!form.locationSite) {
      showStatusModal(
        "error",
        "Location Required",
        "Location / Site is required."
      );
      return;
    }

    if (!form.dateNeeded) {
      showStatusModal(
        "error",
        "Date Needed Required",
        "Date Needed is required."
      );
      return;
    }

    try {
      const selectedJd = jobDescriptions.find((jd) => {
        return String(jd.id) === String(form.jobDescriptionDbId);
      });

      const payload = {
        jobDescriptionDbId: form.jobDescriptionDbId || null,
        job_description_db_id: form.jobDescriptionDbId || null,

        jobDescriptionId: form.jobDescriptionDbId || null,
        job_description_id: form.jobDescriptionDbId || null,

        jdCode: form.jobDescriptionCode || selectedJd?.jdCode || "",
        jd_code: form.jobDescriptionCode || selectedJd?.jdCode || "",

        positionTitle: form.positionTitle,
        position_title: form.positionTitle,
        roleTitle: form.positionTitle,
        role_title: form.positionTitle,

        departmentAccount: form.departmentAccount,
        department_account: form.departmentAccount,

        accountId: form.accountId || selectedJd?.accountId || null,
        account_id: form.accountId || selectedJd?.accountId || null,
        account: form.accountId || selectedJd?.accountId || null,

        departmentId: form.departmentId || selectedJd?.departmentId || null,
        department_id: form.departmentId || selectedJd?.departmentId || null,
        department: form.departmentId || selectedJd?.departmentId || null,

        jobDescriptionTitle:
          form.jobDescriptionTitle || selectedJd?.roleTitle || "",
        job_description_title:
          form.jobDescriptionTitle || selectedJd?.roleTitle || "",

        headcount: Number(form.headcount),
        approvedRequirement: Number(form.headcount),
        approved_requirement: Number(form.headcount),

        reasonForHiring: form.reasonForHiring,
        reason_for_hiring: form.reasonForHiring,
        reason: form.reasonForHiring,

        assignment: form.assignment,
        assignmentOther: form.assignment === "Other" ? form.assignmentOther : "",
        assignment_other: form.assignment === "Other" ? form.assignmentOther : "",

        locationSite: form.locationSite,
        location_site: form.locationSite,

        dateNeeded: form.dateNeeded,
        date_needed: form.dateNeeded,
        requestedStartDate: form.dateNeeded,
        requested_start_date: form.dateNeeded,
        dueDate: form.dateNeeded,
        due_date: form.dateNeeded,

        preparedBy: form.preparedBy,
        prepared_by: form.preparedBy,
        preparedById: form.preparedById,
        prepared_by_id: form.preparedById,
        hiringManager: form.preparedBy,
        hiring_manager: form.preparedBy,

        priority: "Medium",

        approvalStatus: "Pending",
        approval_status: "Pending",
      };

      const res = await createHiringNeed(payload);

      if (res?.success || res?.data || res?.id) {
        resetForm();
        setShowCreateModal(false);
        fetchList();

        showStatusModal(
          "success",
          "Personnel Requisition Created",
          "The hiring need was submitted successfully and is now for approval."
        );
      } else {
        showStatusModal(
          "error",
          "Submission Failed",
          res?.message || "Failed to create personnel requisition."
        );
      }
    } catch (err) {
      console.error("CREATE PERSONNEL REQUISITION ERROR:", err);

      showStatusModal(
        "error",
        "Submission Failed",
        err?.response?.data?.message || "Failed to create personnel requisition."
      );
    }
  }

  const normalizedList = useMemo(() => {
    return list
      .filter((item) => !isAdditionalRequest(item))
      .map((item) => normalizeItem(item));
  }, [list]);

  const filteredList = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return normalizedList.filter((item) => {
      const status = normalizeStatus(item.approvalStatus);

      const matchesSearch =
        !keyword ||
        String(item.id || "").toLowerCase().includes(keyword) ||
        String(item.positionTitle || "").toLowerCase().includes(keyword) ||
        String(item.departmentAccount || "").toLowerCase().includes(keyword) ||
        String(item.jobDescriptionTitle || "").toLowerCase().includes(keyword) ||
        String(item.jobDescriptionText || "").toLowerCase().includes(keyword) ||
        String(item.reasonForHiring || "").toLowerCase().includes(keyword) ||
        String(item.locationSite || "").toLowerCase().includes(keyword) ||
        String(item.preparedBy || "").toLowerCase().includes(keyword);

      const matchesStatus = statusFilter === "All" || status === statusFilter;
      const matchesSite =
        siteFilter === "All" || item.locationSite === siteFilter;
      const matchesReason =
        reasonFilter === "All" || item.reasonForHiring === reasonFilter;

      return matchesSearch && matchesStatus && matchesSite && matchesReason;
    });
  }, [normalizedList, search, statusFilter, siteFilter, reasonFilter]);

  const stats = useMemo(() => {
    const total = normalizedList.length;

    const forApproval = normalizedList.filter(
      (item) => normalizeStatus(item.approvalStatus) === "For Approval"
    ).length;

    const approved = normalizedList.filter(
      (item) => normalizeStatus(item.approvalStatus) === "Approved"
    ).length;

    const notApproved = normalizedList.filter(
      (item) => normalizeStatus(item.approvalStatus) === "Not Approved"
    ).length;

    const totalHeadcount = normalizedList.reduce(
      (sum, item) => sum + Number(item.headcount || 0),
      0
    );

    return {
      total,
      forApproval,
      approved,
      notApproved,
      totalHeadcount,
    };
  }, [normalizedList]);

  const requisitionByReason = useMemo(() => {
    const reasonMap = new Map();

    normalizedList.forEach((item) => {
      const reason = item.reasonForHiring || "Unspecified";
      reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
    });

    const colors = ["#2563EB", "#06B6D4", "#22C55E", "#F97316", "#EF4444"];

    return Array.from(reasonMap.keys()).map((reason, index) => ({
      label: reason,
      value: reasonMap.get(reason),
      color: colors[index % colors.length],
    }));
  }, [normalizedList]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <div className="mx-auto max-w-[1600px] space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <FileText size={14} />
                Recruitment
              </div>

              <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
                Hiring Needs Intake
              </h1>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Create, review, and track personnel requisitions subject for
                approval.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            >
              <Plus size={18} />
              New Personnel Requisition
            </button>
          </div>

          <HiringSearchTable
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            siteFilter={siteFilter}
            setSiteFilter={setSiteFilter}
            reasonFilter={reasonFilter}
            setReasonFilter={setReasonFilter}
            reasonForHiringOptions={reasonForHiringOptions}
          />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1fr]">  
            <PRSummaryTable stats={stats} />

            <ReasonForHiringTable data={requisitionByReason} />
          </div>

          <HiringNeedsDataTable
            loading={loading}
            filteredList={filteredList}
            normalizedList={normalizedList}
            onView={setSelectedItem}
          />
        </div>
      </main>

      <CreatePersonnelRequisitionModal
        open={showCreateModal}
        form={form}
        setForm={setForm}
        jobDescriptions={jobDescriptions}
        jobDescriptionLoading={jobDescriptionLoading}
        reasonForHiringOptions={reasonForHiringOptions}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreate}
        onReset={resetForm}
      />

      <ViewHiringNeedModal
        open={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={closeStatusModal}
      />
    </div>
  );
}