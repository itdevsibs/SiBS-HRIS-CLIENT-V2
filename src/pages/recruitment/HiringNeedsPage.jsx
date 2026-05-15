import React, { useEffect, useMemo, useState } from "react";

import Header from "../../components/layout/Header";

import { getHiringNeeds, createHiringNeed } from "@/lib/axios/hiringNeeds";
import { useUser } from "@/services/context/UserContext";

import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Plus,
  Search,
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

const positionOptions = [
  {
    id: "CSR",
    positionTitle: "Customer Service Representative",
    departmentAccount: "Operations / Customer Support",
    jobDescriptionId: "CSR",
    jobDescriptionTitle: "Customer Service Representative",
  },
  {
    id: "TSR",
    positionTitle: "Technical Support Representative",
    departmentAccount: "Operations / Technical Support",
    jobDescriptionId: "TSR",
    jobDescriptionTitle: "Technical Support Representative",
  },
  {
    id: "SALES_ASSOCIATE",
    positionTitle: "Sales Associate",
    departmentAccount: "Sales / Business Development",
    jobDescriptionId: "SALES_ASSOCIATE",
    jobDescriptionTitle: "Sales Associate",
  },
  {
    id: "TEAM_LEADER",
    positionTitle: "Team Leader",
    departmentAccount: "Operations / Leadership",
    jobDescriptionId: "TEAM_LEADER",
    jobDescriptionTitle: "Team Leader",
  },
  {
    id: "QA_SPECIALIST",
    positionTitle: "Quality Assurance Specialist",
    departmentAccount: "Quality Assurance",
    jobDescriptionId: "QA_SPECIALIST",
    jobDescriptionTitle: "Quality Assurance Specialist",
  },
  {
    id: "TRAINER",
    positionTitle: "Trainer",
    departmentAccount: "Learning and Development",
    jobDescriptionId: "TRAINER",
    jobDescriptionTitle: "Trainer",
  },
  {
    id: "RECRUITMENT_SPECIALIST",
    positionTitle: "Recruitment Specialist",
    departmentAccount: "Talent Acquisition",
    jobDescriptionId: "RECRUITMENT_SPECIALIST",
    jobDescriptionTitle: "Recruitment Specialist",
  },
  {
    id: "HR_GENERALIST",
    positionTitle: "HR Generalist",
    departmentAccount: "Human Resources",
    jobDescriptionId: "HR_GENERALIST",
    jobDescriptionTitle: "HR Generalist",
  },
];

const jobDescriptionOptions = positionOptions.map((item) => ({
  id: item.jobDescriptionId,
  title: item.jobDescriptionTitle,
}));

const reasonForHiringOptions = [
  "New Position",
  "Ramp-up",
  "Forecasted Growth",
];

const initialForm = {
  positionOptionId: "",
  positionTitle: "",
  departmentAccount: "",
  jobDescriptionId: "",
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
    jobDescriptionId: "CSR",
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
    item.jdTitle ||
    item.jd_title ||
    item.jobDescriptionName ||
    item.job_description_name ||
    (jd && typeof jd === "object"
      ? jd.role_title || jd.roleTitle || jd.title || jd.jd_title
      : "") ||
    "";

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
      item.account ||
      item.department ||
      "",

    jobDescriptionId:
      item.jobDescriptionId ||
      item.job_description_id ||
      item.jdId ||
      item.jd_id ||
      "",

    jobDescriptionTitle,

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
      className={`h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${className}`}
    />
  );
}

function SelectInput({ children, className = "", ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`h-12 w-full appearance-none rounded-xl border border-[#D0D5DD] bg-white px-4 pr-11 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${className}`}
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

function SummaryCard({
  title,
  value,
  icon,
  valueClassName = "text-sibs-primary-1",
}) {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
            {title}
          </p>

          <p className={`mt-3 text-3xl font-extrabold ${valueClassName}`}>
            {value}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
          {icon}
        </div>
      </div>
    </div>
  );
}

function DonutChart({ data }) {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);
  let current = 0;

  const gradient =
    total > 0
      ? data
          .map((item) => {
            const start = current;
            const size = (Number(item.value || 0) / total) * 100;
            current += size;
            return `${item.color} ${start}% ${current}%`;
          })
          .join(", ")
      : "#E6ECF2 0% 100%";

  return (
    <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-center">
      <div
        className="relative h-32 w-32 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
      >
        <div className="absolute inset-7 rounded-full bg-white" />
      </div>

      <div className="w-full max-w-md space-y-3">
        {data.length > 0 ? (
          data.map((item) => {
            const percent =
              total > 0
                ? Math.round((Number(item.value || 0) / total) * 100)
                : 0;

            return (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />

                  <span className="truncate font-semibold text-[#344054]">
                    {item.label}
                  </span>
                </div>

                <span className="shrink-0 font-bold text-[#101828]">
                  {item.value} ({percent}%)
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-center text-sm font-bold text-gray-500">
            No reason data available.
          </p>
        )}
      </div>
    </div>
  );
}

function HiringNeedMobileCard({ item, onView }) {
  const status = normalizeStatus(item.approvalStatus);

  return (
    <button
      type="button"
      onClick={onView}
      className="w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-[var(--sibs-primary-1)]/40 hover:bg-[#FAFBFC]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-sibs-primary-1">
            {item.id || "—"}
          </p>

          <h3 className="mt-1 text-sm font-bold text-[#0F172A]">
            {item.positionTitle || "—"}
          </h3>

          <p className="mt-1 text-xs font-medium text-sibs-tertiary-5">
            {item.departmentAccount || "—"}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
            status
          )}`}
        >
          {status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Headcount
          </p>

          <p className="mt-1 text-sm font-bold text-sibs-primary-1">
            {item.headcount || "—"}
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Reason
          </p>

          <p className="mt-1 text-sm font-bold text-[#1E293B]">
            {item.reasonForHiring || "—"}
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3 sm:col-span-2">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Date Needed
          </p>

          <p className="mt-1 text-sm font-bold text-[#1E293B]">
            {formatDate(item.dateNeeded)}
          </p>
        </div>
      </div>
    </button>
  );
}

function CreatePersonnelRequisitionModal({
  open,
  form,
  setForm,
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

  function handlePositionChange(positionId) {
    const selectedPosition = positionOptions.find((item) => {
      return String(item.id) === String(positionId);
    });

    if (!selectedPosition) {
      setForm((prev) => ({
        ...prev,
        positionOptionId: "",
        positionTitle: "",
        departmentAccount: "",
        jobDescriptionId: "",
        jobDescriptionTitle: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      positionOptionId: selectedPosition.id,
      positionTitle: selectedPosition.positionTitle,
      departmentAccount: selectedPosition.departmentAccount,
      jobDescriptionId: selectedPosition.jobDescriptionId,
      jobDescriptionTitle: selectedPosition.jobDescriptionTitle,
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
                Select a position title to automatically fill the Department /
                Account and Job Description. Review the remaining details before
                submitting for approval.
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
                  value={form.positionOptionId || ""}
                  onChange={(e) => handlePositionChange(e.target.value)}
                >
                  <option value="">Select Position Title</option>
                  {positionOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.positionTitle}
                    </option>
                  ))}
                </SelectInput>
              </div>

              <div>
                <FieldLabel required>Department / Account</FieldLabel>
                <TextInput
                  value={form.departmentAccount || ""}
                  readOnly
                  className="cursor-not-allowed bg-[#F8FAFC]"
                  placeholder="Auto-populated after selecting position"
                />
              </div>

              <div>
                <FieldLabel>Job Description</FieldLabel>
                <TextInput
                  value={form.jobDescriptionTitle || ""}
                  readOnly
                  className="cursor-not-allowed bg-[#F8FAFC]"
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
                  className="cursor-not-allowed bg-[#F8FAFC]"
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
  const [jobDescriptions] = useState(jobDescriptionOptions);
  const [loading, setLoading] = useState(true);

  const jobDescriptionLoading = false;

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
  }, []);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      preparedBy: preparedByName,
      preparedById: user?.id || user?.userId || user?.gy_user_id || "",
    }));
  }, [preparedByName, user]);

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

  async function handleCreate(e) {
    e.preventDefault();

    if (!form.positionTitle.trim()) {
      alert("Position Title is required.");
      return;
    }

    if (!form.departmentAccount.trim()) {
      alert("Department / Account is required.");
      return;
    }

    if (!form.headcount || Number(form.headcount) <= 0) {
      alert("Headcount must be greater than 0.");
      return;
    }

    if (!form.reasonForHiring) {
      alert("Reason for Hiring is required.");
      return;
    }

    if (!reasonForHiringOptions.includes(form.reasonForHiring)) {
      alert("Invalid Reason for Hiring selected.");
      return;
    }

    if (!form.assignment) {
      alert("Assignment is required.");
      return;
    }

    if (form.assignment === "Other" && !form.assignmentOther.trim()) {
      alert("Please enter Other assignment information.");
      return;
    }

    if (!form.locationSite) {
      alert("Location / Site is required.");
      return;
    }

    if (!form.dateNeeded) {
      alert("Date Needed is required.");
      return;
    }

    try {
      const selectedJd = jobDescriptions.find((jd) => {
        return String(jd.id) === String(form.jobDescriptionId);
      });

      const payload = {
        positionOptionId: form.positionOptionId || null,
        position_option_id: form.positionOptionId || null,

        positionTitle: form.positionTitle,
        position_title: form.positionTitle,
        roleTitle: form.positionTitle,

        departmentAccount: form.departmentAccount,
        department_account: form.departmentAccount,

        jobDescriptionId: form.jobDescriptionId || null,
        job_description_id: form.jobDescriptionId || null,
        jobDescriptionTitle: form.jobDescriptionTitle || selectedJd?.title || "",
        job_description_title:
          form.jobDescriptionTitle || selectedJd?.title || "",

        headcount: Number(form.headcount),
        approvedRequirement: Number(form.headcount),
        approved_requirement: Number(form.headcount),

        reasonForHiring: form.reasonForHiring,
        reason_for_hiring: form.reasonForHiring,
        reason: form.reasonForHiring,

        assignment: form.assignment,
        assignmentOther: form.assignment === "Other" ? form.assignmentOther : "",
        assignment_other:
          form.assignment === "Other" ? form.assignmentOther : "",

        locationSite: form.locationSite,
        location_site: form.locationSite,

        dateNeeded: form.dateNeeded,
        date_needed: form.dateNeeded,
        dueDate: form.dateNeeded,
        due_date: form.dateNeeded,

        preparedBy: form.preparedBy,
        prepared_by: form.preparedBy,
        preparedById: form.preparedById,
        prepared_by_id: form.preparedById,

        approvalStatus: "For Approval",
        approval_status: "For Approval",
      };

      const res = await createHiringNeed(payload);

      if (res?.success || res?.data || res?.id) {
        resetForm();
        setShowCreateModal(false);
        fetchList();
      } else {
        alert(res?.message || "Failed to create personnel requisition.");
      }
    } catch (err) {
      console.error("CREATE PERSONNEL REQUISITION ERROR:", err);
      alert("Failed to create personnel requisition.");
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

          <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_240px_240px_260px] xl:items-end">
              <div>
                <label className="mb-1 block text-sm font-bold text-[#101828]">
                  Search
                </label>

                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                  />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search PRF, position, department/account, JD, reason, site, prepared by..."
                    className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-[#101828]">
                  Approval Status
                </label>

                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-12 w-full appearance-none rounded-xl border border-[#D0D5DD] bg-white px-4 pr-11 text-sm font-bold text-[#344054] outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                  >
                    <option value="All">All Status</option>
                    <option value="For Approval">For Approval</option>
                    <option value="Approved">Approved</option>
                    <option value="Not Approved">Not Approved</option>
                  </select>

                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-[#101828]">
                  Location / Site
                </label>

                <div className="relative">
                  <select
                    value={siteFilter}
                    onChange={(e) => setSiteFilter(e.target.value)}
                    className="h-12 w-full appearance-none rounded-xl border border-[#D0D5DD] bg-white px-4 pr-11 text-sm font-bold text-[#344054] outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                  >
                    <option value="All">All Sites</option>
                    <option value="Davao Site">Davao Site</option>
                    <option value="Tagum Site">Tagum Site</option>
                    <option value="Mabini Site">Mabini Site</option>
                  </select>

                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-[#101828]">
                  Reason for Hiring
                </label>

                <div className="relative">
                  <select
                    value={reasonFilter}
                    onChange={(e) => setReasonFilter(e.target.value)}
                    className="h-12 w-full appearance-none rounded-xl border border-[#D0D5DD] bg-white px-4 pr-11 text-sm font-bold text-[#344054] outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                  >
                    <option value="All">All Reasons</option>
                    {reasonForHiringOptions.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                  />
                </div>
              </div>
            </div>

            {(search ||
              statusFilter !== "All" ||
              siteFilter !== "All" ||
              reasonFilter !== "All") && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("All");
                    setSiteFilter("All");
                    setReasonFilter("All");
                  }}
                  className="inline-flex rounded-full border border-[#E6ECF2] bg-white px-3 py-1 text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1fr]">
            <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-base font-bold text-[#101828]">
                Personnel Requisition Summary
              </h2>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <SummaryCard
                  title="Total PRF"
                  value={stats.total}
                  icon={<FileText size={22} />}
                />

                <SummaryCard
                  title="Total Headcount"
                  value={stats.totalHeadcount}
                  icon={<CalendarDays size={22} />}
                />

                <SummaryCard
                  title="For Approval"
                  value={stats.forApproval}
                  valueClassName="text-amber-500"
                  icon={<Clock size={22} />}
                />

                <SummaryCard
                  title="Approved"
                  value={stats.approved}
                  valueClassName="text-emerald-600"
                  icon={<CheckCircle2 size={22} />}
                />

                <SummaryCard
                  title="Not Approved"
                  value={stats.notApproved}
                  valueClassName="text-red-600"
                  icon={<XCircle size={22} />}
                />
              </div>
            </section>

            <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-base font-bold text-[#101828]">
                Requisition by Reason for Hiring
              </h2>

              <div className="mt-4 rounded-xl bg-white">
                <DonutChart data={requisitionByReason} />
              </div>
            </section>
          </div>

          <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
            <div className="hidden lg:block">
              <div className="overflow-x-auto p-6">
                <table className="w-full min-w-[1450px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left">
                  <thead>
                    <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                      <th className="px-5 py-4 first:rounded-tl-2xl">
                        PRF ID
                      </th>
                      <th className="px-5 py-4">Position Title</th>
                      <th className="px-5 py-4">Department / Account</th>
                      <th className="px-5 py-4">Job Description</th>
                      <th className="px-5 py-4 text-center">Headcount</th>
                      <th className="px-5 py-4">Reason for Hiring</th>
                      <th className="px-5 py-4">Assignment</th>
                      <th className="px-5 py-4">Location / Site</th>
                      <th className="px-5 py-4">Date Needed</th>
                      <th className="px-5 py-4">Prepared By</th>
                      <th className="px-5 py-4 text-center">Approval</th>
                      <th className="px-5 py-4">Approval Date</th>
                      <th className="px-5 py-4 text-right last:rounded-tr-2xl">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={13}
                          className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                        >
                          Loading personnel requisitions...
                        </td>
                      </tr>
                    ) : filteredList.length > 0 ? (
                      filteredList.map((item) => {
                        const status = normalizeStatus(item.approvalStatus);

                        return (
                          <tr
                            key={item.id}
                            className="transition hover:bg-[#FAFBFC]"
                          >
                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-bold text-[#1473E6]">
                              {item.id || "—"}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-bold text-[#0F172A]">
                              {item.positionTitle || "—"}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#1E293B]">
                              {item.departmentAccount || "—"}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#1E293B]">
                              {item.jobDescriptionTitle ||
                                item.jobDescriptionId ||
                                "Not selected"}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold text-sibs-primary-1">
                              {item.headcount || "—"}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#1E293B]">
                              {item.reasonForHiring || "—"}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#1E293B]">
                              {item.assignment === "Other"
                                ? item.assignmentOther || "Other"
                                : item.assignment || "—"}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#1E293B]">
                              {item.locationSite || "—"}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#1E293B]">
                              {formatDate(item.dateNeeded)}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#1E293B]">
                              {item.preparedBy || "—"}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
                              <span
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                                  status
                                )}`}
                              >
                                {getApprovalIcon(status)}
                                {status}
                              </span>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#1E293B]">
                              {formatDate(item.approvalDate)}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedItem(item)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 py-2 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] hover:shadow-sm"
                              >
                                <Eye size={16} />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={13}
                          className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                        >
                          No personnel requisition found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-[#E6ECF2] px-6 py-4">
                <p className="text-sm font-medium text-sibs-primary-1">
                  Showing 1 to {filteredList.length} of {normalizedList.length}{" "}
                  personnel requisitions
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-tertiary-5"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sibs-primary-1 text-sm font-bold text-white"
                  >
                    1
                  </button>

                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-tertiary-5"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 lg:hidden">
              {loading ? (
                <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                  Loading personnel requisitions...
                </div>
              ) : filteredList.length > 0 ? (
                filteredList.map((item) => (
                  <HiringNeedMobileCard
                    key={item.id}
                    item={item}
                    onView={() => setSelectedItem(item)}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                  No personnel requisition found.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <CreatePersonnelRequisitionModal
        open={showCreateModal}
        form={form}
        setForm={setForm}
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
    </div>
  );
}