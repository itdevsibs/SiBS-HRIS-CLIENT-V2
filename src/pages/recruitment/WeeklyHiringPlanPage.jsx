import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "../../components/layout/Header";
import {
  CalendarDays,
  Eye,
  Flag,
  Search,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Archive,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  CircleAlert,
  Plus,
  X,
  Lock,
  Unlock,
  ClipboardList,
  RotateCcw,
  Target,
} from "lucide-react";

const approvedHiringRequirements = [
  {
    id: "HIR-001",
    roleAccount: "CSR - SIBS",
    jobDescription: "JD-001 — Customer Service Representative",
    approvedRequirement: 20,
    currentFilled: 12,
    dueDate: "2026-05-15",
    taOwner: "Maria Reyes",
    priority: "High",
  },
  {
    id: "HIR-002",
    roleAccount: "QA - SIBS",
    jobDescription: "JD-002 — QA Specialist",
    approvedRequirement: 5,
    currentFilled: 2,
    dueDate: "2026-05-10",
    taOwner: "John Dela Cruz",
    priority: "High",
  },
  {
    id: "HIR-003",
    roleAccount: "RCM Analyst - SIBS",
    jobDescription: "JD-003 — RCM Analyst",
    approvedRequirement: 5,
    currentFilled: 3,
    dueDate: "2026-05-20",
    taOwner: "Kim Domingo",
    priority: "Medium",
  },
  {
    id: "HIR-004",
    roleAccount: "Accountant - SIBS",
    jobDescription: "JD-004 — Accountant",
    approvedRequirement: 2,
    currentFilled: 1,
    dueDate: "2026-05-18",
    taOwner: "Paul Garcia",
    priority: "Medium",
  },
  {
    id: "HIR-005",
    roleAccount: "System Developer - SIBS",
    jobDescription: "JD-005 — System Developer",
    approvedRequirement: 3,
    currentFilled: 1,
    dueDate: "2026-04-30",
    taOwner: "Maria Reyes",
    priority: "High",
  },
];

const initialWeeklyVersions = [
  {
    id: "WEEK-2026-05-06",
    label: "Current Week",
    weekRange: "May 6 - May 12, 2026",
    createdAt: "2026-05-06",
    locked: false,
    type: "current",
    records: [
      {
        id: 1,
        hiringRequirementId: "HIR-001",
        roleAccount: "CSR - SIBS",
        jobDescription: "JD-001 — Customer Service Representative",
        approvedRequirement: 20,
        currentFilled: 12,
        dueDate: "2026-05-15",
        status: "At Risk",
        taOwner: "Maria Reyes",
        riskFlag: "High",
        priority: "High",
        missingDataExplanation:
          "Interview pass rate and final offer decision count need validation.",
        actionItems: [
          {
            id: 1,
            actionItem: "Increase sourcing volume for CSR role.",
            owner: "Maria Reyes",
            deadline: "2026-05-09",
            status: "Ongoing",
            riskLevel: "High",
            linkedGap: "Pipeline",
            remarks: "Need additional qualified screened candidates.",
          },
        ],
      },
      {
        id: 2,
        hiringRequirementId: "HIR-002",
        roleAccount: "QA - SIBS",
        jobDescription: "JD-002 — QA Specialist",
        approvedRequirement: 5,
        currentFilled: 2,
        dueDate: "2026-05-10",
        status: "Delayed",
        taOwner: "John Dela Cruz",
        riskFlag: "High",
        priority: "High",
        missingDataExplanation:
          "Hiring manager interview availability was not updated.",
        actionItems: [
          {
            id: 1,
            actionItem: "Confirm QA interview schedule with hiring manager.",
            owner: "John Dela Cruz",
            deadline: "2026-05-08",
            status: "Planned",
            riskLevel: "High",
            linkedGap: "Interview",
            remarks: "Role is delayed and needs immediate interview alignment.",
          },
        ],
      },
      {
        id: 3,
        hiringRequirementId: "HIR-003",
        roleAccount: "RCM Analyst - SIBS",
        jobDescription: "JD-003 — RCM Analyst",
        approvedRequirement: 5,
        currentFilled: 3,
        dueDate: "2026-05-20",
        status: "On Track",
        taOwner: "Kim Domingo",
        riskFlag: "None",
        priority: "Medium",
        missingDataExplanation: "",
        actionItems: [
          {
            id: 1,
            actionItem: "Continue screening RCM applicants from Jobstreet.",
            owner: "Kim Domingo",
            deadline: "2026-05-10",
            status: "Ongoing",
            riskLevel: "Low",
            linkedGap: "Screening",
            remarks: "Pipeline is still active.",
          },
        ],
      },
    ],
  },
  {
    id: "WEEK-2026-04-29",
    label: "Previous Week",
    weekRange: "Apr 29 - May 5, 2026",
    createdAt: "2026-04-29",
    locked: true,
    type: "previous",
    records: [
      {
        id: 6,
        hiringRequirementId: "HIR-001",
        roleAccount: "CSR - SIBS",
        jobDescription: "JD-001 — Customer Service Representative",
        approvedRequirement: 20,
        currentFilled: 10,
        dueDate: "2026-05-08",
        status: "At Risk",
        taOwner: "Maria Reyes",
        riskFlag: "High",
        priority: "High",
        missingDataExplanation:
          "Final candidate movement was incomplete during reporting cutoff.",
        actionItems: [
          {
            id: 1,
            actionItem: "Validate pending final interview results.",
            owner: "Maria Reyes",
            deadline: "2026-05-02",
            status: "Completed",
            riskLevel: "High",
            linkedGap: "Interview",
            remarks: "Pending results validated after hiring call.",
          },
        ],
      },
      {
        id: 7,
        hiringRequirementId: "HIR-002",
        roleAccount: "QA - SIBS",
        jobDescription: "JD-002 — QA Specialist",
        approvedRequirement: 5,
        currentFilled: 1,
        dueDate: "2026-05-03",
        status: "Delayed",
        taOwner: "John Dela Cruz",
        riskFlag: "High",
        priority: "High",
        missingDataExplanation:
          "Only one candidate completed assessment before cutoff.",
        actionItems: [
          {
            id: 1,
            actionItem: "Reopen sourcing for QA candidates.",
            owner: "John Dela Cruz",
            deadline: "2026-05-03",
            status: "Completed",
            riskLevel: "High",
            linkedGap: "Pipeline",
            remarks: "Additional sourcing channels activated.",
          },
        ],
      },
    ],
  },
  {
    id: "WEEK-2026-04-22",
    label: "Archive",
    weekRange: "Apr 22 - Apr 28, 2026",
    createdAt: "2026-04-22",
    locked: true,
    type: "archive",
    records: [
      {
        id: 9,
        hiringRequirementId: "HIR-006",
        roleAccount: "CSR - SIBS",
        jobDescription: "JD-001 — Customer Service Representative",
        approvedRequirement: 15,
        currentFilled: 15,
        dueDate: "2026-04-25",
        status: "Completed",
        taOwner: "Maria Reyes",
        riskFlag: "None",
        priority: "Medium",
        missingDataExplanation: "",
        actionItems: [],
      },
      {
        id: 10,
        hiringRequirementId: "HIR-007",
        roleAccount: "QA - SIBS",
        jobDescription: "JD-002 — QA Specialist",
        approvedRequirement: 3,
        currentFilled: 3,
        dueDate: "2026-04-25",
        status: "Completed",
        taOwner: "John Dela Cruz",
        riskFlag: "None",
        priority: "Medium",
        missingDataExplanation: "",
        actionItems: [],
      },
    ],
  },
];

const initialAddRoleForm = {
  hiringRequirementId: "",
};

const initialUpdateProgressForm = {
  currentFilled: "",
  status: "",
  riskFlag: "",
  missingDataExplanation: "",
};

const initialActionItemForm = {
  actionItem: "",
  owner: "",
  deadline: "",
  status: "Planned",
  riskLevel: "Medium",
  linkedGap: "Pipeline",
  remarks: "",
};

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getNextWeekRange() {
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);

  end.setDate(start.getDate() + 6);

  const startText = start.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });

  const endText = end.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startText} - ${endText}`;
}

function calculateStatus(item) {
  const today = new Date(getTodayDate());
  const dueDate = new Date(item.dueDate);

  if (Number(item.currentFilled) >= Number(item.approvedRequirement)) {
    return "Completed";
  }

  if (dueDate < today) {
    return "Delayed";
  }

  const remaining = Number(item.approvedRequirement) - Number(item.currentFilled);

  const fillRate =
    Number(item.approvedRequirement) > 0
      ? Number(item.currentFilled) / Number(item.approvedRequirement)
      : 0;

  if (remaining > 0 && fillRate < 0.65) {
    return "At Risk";
  }

  return "On Track";
}

function calculateRiskFlag(item) {
  const status = calculateStatus(item);

  if (status === "Delayed") return "High";
  if (status === "At Risk") return item.priority === "High" ? "High" : "Medium";

  return "None";
}

function getStatusClass(status) {
  switch (status) {
    case "On Track":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "At Risk":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Delayed":
      return "border-red-200 bg-red-50 text-red-700";
    case "Completed":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getRiskClass(risk) {
  switch (risk) {
    case "High":
      return "text-red-600";
    case "Medium":
      return "text-amber-500";
    default:
      return "text-gray-300";
  }
}

function getRiskBadgeClass(risk) {
  switch (risk) {
    case "High":
      return "border-red-200 bg-red-50 text-red-700";
    case "Medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Low":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function StatCard({ title, value, icon: Icon, description }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
            {title}
          </p>

          <h3 className="mt-2 truncate text-2xl font-bold text-sibs-primary-1">
            {value}
          </h3>

          {description && (
            <p className="mt-1 text-xs font-medium leading-5 text-sibs-tertiary-5">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--sibs-primary-1)]/10 text-sibs-primary-1">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <div className="text-sm font-bold text-[#344054]">{value || "—"}</div>
    </div>
  );
}

function HiringPlanMobileCard({ item, onView }) {
  const remaining =
    Number(item.approvedRequirement || 0) - Number(item.currentFilled || 0);

  const actionMissing =
    remaining > 0 && (!item.actionItems || item.actionItems.length === 0);

  return (
    <button
      type="button"
      onClick={onView}
      className="w-full rounded-xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-[var(--sibs-primary-1)]/40 hover:bg-[#F8FAFC]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#101828]">
            {item.roleAccount}
          </h3>

          <p className="mt-1 line-clamp-2 text-xs font-semibold text-sibs-tertiary-5">
            {item.jobDescription}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
            item.status
          )}`}
        >
          {item.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Required
          </p>
          <p className="mt-1 text-sm font-bold text-sibs-primary-1">
            {item.approvedRequirement}
          </p>
        </div>

        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Filled
          </p>
          <p className="mt-1 text-sm font-bold text-emerald-600">
            {item.currentFilled}
          </p>
        </div>

        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Gap
          </p>
          <p className="mt-1 text-sm font-bold text-red-600">
            {Math.max(remaining, 0)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <p className="font-semibold text-sibs-tertiary-5">
          Owner:{" "}
          <span className="font-bold text-[#344054]">{item.taOwner}</span>
        </p>

        <p className="font-semibold text-sibs-tertiary-5">
          Due:{" "}
          <span className="font-bold text-[#344054]">
            {formatDate(item.dueDate)}
          </span>
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {item.riskFlag !== "None" && (
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getRiskBadgeClass(
              item.riskFlag
            )}`}
          >
            {item.riskFlag} Risk
          </span>
        )}

        {actionMissing ? (
          <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700">
            Action Required
          </span>
        ) : (
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
            {(item.actionItems || []).length} Action Item/s
          </span>
        )}
      </div>
    </button>
  );
}

function AddRoleModal({
  open,
  form,
  setForm,
  availableRequirements,
  onClose,
  onSubmit,
}) {
  if (!open) return null;

  const selectedRequirement = availableRequirements.find(
    (item) => item.id === form.hiringRequirementId
  );

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Add Approved Hiring Requirement
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Add an approved hiring requirement into the current weekly plan.
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

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
            Approved Hiring Requirement <span className="text-red-500">*</span>
          </label>

          <select
            required
            value={form.hiringRequirementId}
            onChange={(e) =>
              setForm({ ...form, hiringRequirementId: e.target.value })
            }
            className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
          >
            <option value="">Select approved hiring requirement</option>
            {availableRequirements.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} — {item.roleAccount} / Required:{" "}
                {item.approvedRequirement}
              </option>
            ))}
          </select>

          {selectedRequirement && (
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoBox
                label="Role / Account"
                value={selectedRequirement.roleAccount}
              />
              <InfoBox
                label="Job Description"
                value={selectedRequirement.jobDescription}
              />
              <InfoBox
                label="Approved Requirement"
                value={selectedRequirement.approvedRequirement}
              />
              <InfoBox
                label="Current Filled"
                value={selectedRequirement.currentFilled}
              />
              <InfoBox
                label="Due Date"
                value={formatDate(selectedRequirement.dueDate)}
              />
              <InfoBox label="TA Owner" value={selectedRequirement.taOwner} />
            </div>
          )}

          {availableRequirements.length === 0 && (
            <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-5">
              <p className="text-sm font-bold text-amber-700">
                No available approved hiring requirements to add.
              </p>
              <p className="mt-1 text-sm text-amber-700/80">
                All mock approved hiring requirements are already included in
                this weekly plan.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={availableRequirements.length === 0}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={17} />
              Add to Weekly Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UpdateProgressModal({
  open,
  item,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  if (!open || !item) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Update Weekly Progress
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Update filled count, risk, and missing data explanation.
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

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-bold text-sibs-primary-1">
              {item.roleAccount}
            </p>
            <p className="mt-1 text-xs font-semibold text-sibs-primary-1/70">
              Required: {item.approvedRequirement} / Current Filled:{" "}
              {item.currentFilled}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Current Filled <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="number"
                min="0"
                max={item.approvedRequirement}
                value={form.currentFilled}
                onChange={(e) =>
                  setForm({ ...form, currentFilled: e.target.value })
                }
                className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              >
                <option value="">Auto Calculate</option>
                <option value="On Track">On Track</option>
                <option value="At Risk">At Risk</option>
                <option value="Delayed">Delayed</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Risk Flag
              </label>
              <select
                value={form.riskFlag}
                onChange={(e) =>
                  setForm({ ...form, riskFlag: e.target.value })
                }
                className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              >
                <option value="">Auto Calculate</option>
                <option value="None">None</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
              Missing Data Explanation
            </label>
            <textarea
              rows={4}
              value={form.missingDataExplanation}
              onChange={(e) =>
                setForm({
                  ...form,
                  missingDataExplanation: e.target.value,
                })
              }
              placeholder="Explain missing data, hiring blocker, or reporting limitation."
              className="w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
            />
          </div>

          <div className="mt-6 flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <Target size={17} />
              Save Progress
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ActionItemModal({
  open,
  item,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  if (!open || !item) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Add Action Item
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Every role that is not fully hired should have at least one action
              item.
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

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-bold text-sibs-primary-1">
              {item.roleAccount}
            </p>
            <p className="mt-1 text-xs font-semibold text-sibs-primary-1/70">
              Status: {item.status} / Required: {item.approvedRequirement} /
              Filled: {item.currentFilled}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Action Item <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.actionItem}
                onChange={(e) =>
                  setForm({ ...form, actionItem: e.target.value })
                }
                placeholder="Example: Increase sourcing volume for CSR."
                className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Owner <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                placeholder="TA Owner"
                className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Deadline <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="date"
                value={form.deadline}
                onChange={(e) =>
                  setForm({ ...form, deadline: e.target.value })
                }
                className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              >
                <option value="Planned">Planned</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Risk Level
              </label>
              <select
                value={form.riskLevel}
                onChange={(e) =>
                  setForm({ ...form, riskLevel: e.target.value })
                }
                className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Linked Gap
              </label>
              <select
                value={form.linkedGap}
                onChange={(e) =>
                  setForm({ ...form, linkedGap: e.target.value })
                }
                className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              >
                <option value="Pipeline">Pipeline</option>
                <option value="Screening">Screening</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="JD">JD</option>
                <option value="Approval">Approval</option>
                <option value="Capacity/Manpower">Capacity/Manpower</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Remarks
              </label>
              <textarea
                rows={3}
                value={form.remarks}
                onChange={(e) =>
                  setForm({ ...form, remarks: e.target.value })
                }
                placeholder="Add notes or next steps."
                className="w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <Plus size={17} />
              Save Action Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ViewPlanModal({
  open,
  item,
  locked,
  onClose,
  onOpenProgress,
  onOpenActionItem,
}) {
  if (!open || !item) return null;

  const remaining =
    Number(item.approvedRequirement || 0) - Number(item.currentFilled || 0);

  const hasRequiredActionItem =
    remaining <= 0 || (item.actionItems && item.actionItems.length > 0);

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
              Weekly Hiring Plan Details
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Role movement, gap, risk, missing data, and action items.
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
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-[#101828] sm:text-xl">
                      {item.roleAccount}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
                      {item.jobDescription}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>

                      {item.riskFlag !== "None" && (
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getRiskBadgeClass(
                            item.riskFlag
                          )}`}
                        >
                          {item.riskFlag} Risk
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1/70">
                      Gap
                    </p>
                    <p className="mt-1 text-2xl font-bold text-sibs-primary-1">
                      {Math.max(remaining, 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <InfoBox
                  label="Approved Requirement"
                  value={item.approvedRequirement}
                />
                <InfoBox label="Current Filled" value={item.currentFilled} />
                <InfoBox label="Due Date" value={formatDate(item.dueDate)} />
                <InfoBox label="TA Owner" value={item.taOwner} />
                <InfoBox label="Priority" value={item.priority} />
                <InfoBox
                  label="Hiring Requirement"
                  value={item.hiringRequirementId}
                />
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#101828]">
                  Missing Data Explanation
                </h3>

                <p className="mt-3 whitespace-pre-line rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#344054]">
                  {item.missingDataExplanation ||
                    "No missing data explanation recorded."}
                </p>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#101828]">
                  Action Items
                </h3>

                {!hasRequiredActionItem && (
                  <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-4">
                    <p className="text-sm font-bold text-red-700">
                      Action item required
                    </p>
                    <p className="mt-1 text-sm text-red-700/80">
                      This role is not fully hired and must have at least one
                      action item.
                    </p>
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  {item.actionItems && item.actionItems.length > 0 ? (
                    item.actionItems.map((action) => (
                      <div
                        key={action.id}
                        className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                      >
                        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#101828]">
                              {action.actionItem}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                              Owner: {action.owner} / Deadline:{" "}
                              {formatDate(action.deadline)}
                            </p>
                          </div>

                          <span
                            className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${getRiskBadgeClass(
                              action.riskLevel
                            )}`}
                          >
                            {action.status}
                          </span>
                        </div>

                        <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
                          Linked Gap: {action.linkedGap}
                        </p>

                        {action.remarks && (
                          <p className="mt-2 text-sm leading-6 text-[#344054]">
                            {action.remarks}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm font-semibold text-sibs-tertiary-5">
                      No action items yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">Rule</h3>
                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  Every role that is not fully hired must have at least one
                  action item linked to a hiring gap.
                </p>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Record State
                </h3>

                <div className="mt-4 flex items-center gap-2">
                  {locked ? (
                    <>
                      <Lock size={17} className="text-gray-500" />
                      <p className="text-sm font-bold text-gray-600">
                        Locked historical version
                      </p>
                    </>
                  ) : (
                    <>
                      <Unlock size={17} className="text-emerald-600" />
                      <p className="text-sm font-bold text-emerald-700">
                        Editable current version
                      </p>
                    </>
                  )}
                </div>
              </div>

              {!locked && (
                <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-[#101828]">Actions</h3>

                  <div className="mt-4 space-y-2">
                    <button
                      type="button"
                      onClick={() => onOpenProgress(item)}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white transition hover:opacity-90"
                    >
                      <Target size={16} />
                      Update Progress
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenActionItem(item)}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5"
                    >
                      <ClipboardList size={16} />
                      Add Action Item
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[var(--sibs-primary-1)] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiSnapshotModal({ open, week, onClose }) {
  if (!open || !week) return null;

  const records = week.records || [];

  const totalRequired = records.reduce(
    (sum, item) => sum + Number(item.approvedRequirement || 0),
    0
  );

  const totalFilled = records.reduce(
    (sum, item) => sum + Number(item.currentFilled || 0),
    0
  );

  const previousWeekExecution = records.map((item) => ({
    roleAccount: item.roleAccount,
    progress:
      Number(item.approvedRequirement) > 0
        ? Math.round(
            (Number(item.currentFilled) / Number(item.approvedRequirement)) *
              100
          )
        : 0,
    gap: Math.max(
      Number(item.approvedRequirement || 0) - Number(item.currentFilled || 0),
      0
    ),
    status: item.status,
  }));

  const missingExplanations = records.filter((item) =>
    item.missingDataExplanation?.trim()
  );

  const actionItems = records.flatMap((item) =>
    (item.actionItems || []).map((action) => ({
      ...action,
      roleAccount: item.roleAccount,
    }))
  );

  const progress =
    totalRequired > 0 ? Math.round((totalFilled / totalRequired) * 100) : 0;

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
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Weekly KPI Snapshot
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Previous week execution first, current status second.
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <InfoBox label="Week" value={week.weekRange} />
            <InfoBox label="Required" value={totalRequired} />
            <InfoBox label="Filled" value={totalFilled} />
            <InfoBox label="Progress" value={`${progress}%`} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#101828]">
                Weekly Performance
              </h3>

              <div className="mt-4 space-y-3">
                {previousWeekExecution.map((item) => (
                  <div
                    key={item.roleAccount}
                    className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#101828]">
                          {item.roleAccount}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                          Gap: {item.gap}
                        </p>
                      </div>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-[var(--sibs-primary-1)]"
                        style={{ width: `${Math.min(item.progress, 100)}%` }}
                      />
                    </div>

                    <p className="mt-2 text-xs font-bold text-sibs-tertiary-5">
                      {item.progress}% filled
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#101828]">
                Current Status Reference
              </h3>

              <div className="mt-4 space-y-3">
                {records.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                  >
                    <p className="text-sm font-bold text-[#101828]">
                      {item.roleAccount}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                      Required {item.approvedRequirement} / Filled{" "}
                      {item.currentFilled} / Due {formatDate(item.dueDate)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#101828]">
                Missing Data Explanation
              </h3>

              <div className="mt-4 space-y-3">
                {missingExplanations.length > 0 ? (
                  missingExplanations.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-amber-100 bg-amber-50 p-4"
                    >
                      <p className="text-sm font-bold text-amber-700">
                        {item.roleAccount}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-amber-700/90">
                        {item.missingDataExplanation}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm font-semibold text-sibs-tertiary-5">
                    No missing data explanation recorded.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#101828]">Action Items</h3>

              <div className="mt-4 space-y-3">
                {actionItems.length > 0 ? (
                  actionItems.map((item) => (
                    <div
                      key={`${item.roleAccount}-${item.id}`}
                      className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                    >
                      <p className="text-sm font-bold text-[#101828]">
                        {item.actionItem}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                        {item.roleAccount} / Owner: {item.owner} / Deadline:{" "}
                        {formatDate(item.deadline)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm font-semibold text-sibs-tertiary-5">
                    No action items recorded.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[var(--sibs-primary-1)] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WeeklyHiringPlanPage() {
  const mainScrollRef = useRef(null);

  const [weeklyVersions, setWeeklyVersions] = useState(initialWeeklyVersions);
  const [activeWeekId, setActiveWeekId] = useState(initialWeeklyVersions[0].id);
  const [search, setSearch] = useState("");
  const [activeHiringTab, setActiveHiringTab] = useState("Weekly Plan");

  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [addRoleForm, setAddRoleForm] = useState(initialAddRoleForm);

  const [selectedPlan, setSelectedPlan] = useState(null);

  const [progressItem, setProgressItem] = useState(null);
  const [progressForm, setProgressForm] = useState(initialUpdateProgressForm);

  const [actionItemTarget, setActionItemTarget] = useState(null);
  const [actionItemForm, setActionItemForm] = useState(initialActionItemForm);

  const [showKpiSnapshot, setShowKpiSnapshot] = useState(false);

  const activeWeek =
    weeklyVersions.find((week) => week.id === activeWeekId) ||
    weeklyVersions[0];

  const activeData = activeWeek?.records || [];
  const isLocked = !!activeWeek?.locked;

  const filteredPlans = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return activeData;

    return activeData.filter((item) => {
      return (
        item.roleAccount.toLowerCase().includes(keyword) ||
        item.taOwner.toLowerCase().includes(keyword) ||
        item.status.toLowerCase().includes(keyword) ||
        item.riskFlag.toLowerCase().includes(keyword) ||
        item.jobDescription.toLowerCase().includes(keyword)
      );
    });
  }, [activeData, search]);

  const totals = useMemo(() => {
    const totalRequired = activeData.reduce(
      (sum, item) => sum + Number(item.approvedRequirement || 0),
      0
    );

    const totalFilled = activeData.reduce(
      (sum, item) => sum + Number(item.currentFilled || 0),
      0
    );

    const atRisk = activeData.filter(
      (item) => item.status === "At Risk"
    ).length;

    const delayed = activeData.filter(
      (item) => item.status === "Delayed"
    ).length;

    const actionMissing = activeData.filter((item) => {
      const remaining =
        Number(item.approvedRequirement || 0) - Number(item.currentFilled || 0);

      return (
        remaining > 0 && (!item.actionItems || item.actionItems.length === 0)
      );
    }).length;

    const progress =
      totalRequired > 0 ? Math.round((totalFilled / totalRequired) * 100) : 0;

    return {
      totalRequired,
      totalFilled,
      atRisk,
      delayed,
      actionMissing,
      progress,
    };
  }, [activeData]);

  const hiringTabs = [
    { label: "Weekly Plan", count: filteredPlans.length },
    { label: "KPI Snapshot", count: 0 },
    { label: "Status Guide", count: 0 },
  ];

  const availableRequirements = useMemo(() => {
    const includedIds = new Set(
      activeData.map((item) => item.hiringRequirementId)
    );

    return approvedHiringRequirements.filter(
      (item) => !includedIds.has(item.id)
    );
  }, [activeData]);

  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [activeHiringTab]);

  function updateActiveWeekRecords(nextRecords) {
    setWeeklyVersions((prev) =>
      prev.map((week) =>
        week.id === activeWeekId
          ? {
              ...week,
              records: nextRecords,
            }
          : week
      )
    );
  }

  function handleCreateNewWeeklyVersion() {
    const today = getTodayDate();
    const newWeekId = `WEEK-${today}-${Date.now()}`;

    const currentWeek = activeWeek;

    const clonedRecords = (currentWeek.records || [])
      .filter((item) => item.status !== "Completed")
      .map((item, index) => {
        return {
          ...item,
          id: Date.now() + index,
          status: calculateStatus(item),
          riskFlag: calculateRiskFlag(item),
        };
      });

    setWeeklyVersions((prev) => {
      const lockedPrevious = prev.map((week) =>
        week.id === currentWeek.id
          ? {
              ...week,
              locked: true,
              label: "Previous Week",
              type: "previous",
            }
          : {
              ...week,
              type: week.type === "previous" ? "archive" : week.type,
            }
      );

      const newWeek = {
        id: newWeekId,
        label: "Current Week",
        weekRange: getNextWeekRange(),
        createdAt: today,
        locked: false,
        type: "current",
        records: clonedRecords,
      };

      return [newWeek, ...lockedPrevious];
    });

    setActiveWeekId(newWeekId);
  }

  function handleOpenAddRoleModal() {
    setAddRoleForm(initialAddRoleForm);
    setShowAddRoleModal(true);
  }

  function handleCloseAddRoleModal() {
    setAddRoleForm(initialAddRoleForm);
    setShowAddRoleModal(false);
  }

  function handleAddRoleToWeeklyPlan(e) {
    e.preventDefault();

    const selectedRequirement = approvedHiringRequirements.find(
      (item) => item.id === addRoleForm.hiringRequirementId
    );

    if (!selectedRequirement) {
      alert("Please select an approved hiring requirement.");
      return;
    }

    const newRecordBase = {
      id: Date.now(),
      hiringRequirementId: selectedRequirement.id,
      roleAccount: selectedRequirement.roleAccount,
      jobDescription: selectedRequirement.jobDescription,
      approvedRequirement: selectedRequirement.approvedRequirement,
      currentFilled: selectedRequirement.currentFilled,
      dueDate: selectedRequirement.dueDate,
      taOwner: selectedRequirement.taOwner,
      priority: selectedRequirement.priority,
      missingDataExplanation: "",
      actionItems: [],
    };

    const newRecord = {
      ...newRecordBase,
      status: calculateStatus(newRecordBase),
      riskFlag: calculateRiskFlag(newRecordBase),
    };

    updateActiveWeekRecords([newRecord, ...activeData]);
    handleCloseAddRoleModal();
  }

  function handleOpenProgressModal(item) {
    setProgressItem(item);
    setProgressForm({
      currentFilled: item.currentFilled,
      status: "",
      riskFlag: "",
      missingDataExplanation: item.missingDataExplanation || "",
    });
  }

  function handleCloseProgressModal() {
    setProgressItem(null);
    setProgressForm(initialUpdateProgressForm);
  }

  function handleSubmitProgress(e) {
    e.preventDefault();

    if (!progressItem) return;

    const baseUpdated = {
      ...progressItem,
      currentFilled: Number(progressForm.currentFilled),
      missingDataExplanation: progressForm.missingDataExplanation,
    };

    const updatedItem = {
      ...baseUpdated,
      status: progressForm.status || calculateStatus(baseUpdated),
      riskFlag: progressForm.riskFlag || calculateRiskFlag(baseUpdated),
    };

    const nextRecords = activeData.map((item) =>
      item.id === progressItem.id ? updatedItem : item
    );

    updateActiveWeekRecords(nextRecords);
    setSelectedPlan(updatedItem);
    handleCloseProgressModal();
  }

  function handleOpenActionItemModal(item) {
    setActionItemTarget(item);
    setActionItemForm({
      ...initialActionItemForm,
      owner: item.taOwner || "",
      riskLevel: item.riskFlag === "None" ? "Medium" : item.riskFlag,
    });
  }

  function handleCloseActionItemModal() {
    setActionItemTarget(null);
    setActionItemForm(initialActionItemForm);
  }

  function handleSubmitActionItem(e) {
    e.preventDefault();

    if (!actionItemTarget) return;

    const newActionItem = {
      id: Date.now(),
      actionItem: actionItemForm.actionItem.trim(),
      owner: actionItemForm.owner.trim(),
      deadline: actionItemForm.deadline,
      status: actionItemForm.status,
      riskLevel: actionItemForm.riskLevel,
      linkedGap: actionItemForm.linkedGap,
      remarks: actionItemForm.remarks.trim(),
    };

    const updatedItem = {
      ...actionItemTarget,
      actionItems: [...(actionItemTarget.actionItems || []), newActionItem],
    };

    const nextRecords = activeData.map((item) =>
      item.id === actionItemTarget.id ? updatedItem : item
    );

    updateActiveWeekRecords(nextRecords);
    setSelectedPlan(updatedItem);
    handleCloseActionItemModal();
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main
        ref={mainScrollRef}
        className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6"
      >
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <CalendarDays
              size={28}
              className="shrink-0 text-sibs-primary-1"
            />

            <h1 className="min-w-0 break-words text-2xl font-bold text-sibs-primary-1 sm:text-4xl">
              Weekly Hiring Plan
            </h1>
          </div>

          <p className="mt-1 text-sm text-sibs-tertiary-5">
            Manage weekly hiring execution, risks, action items, and weekly plan
            versions
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard
            title="Total Required"
            value={totals.totalRequired}
            icon={Archive}
            description="Approved requirement"
          />
          <StatCard
            title="Total Filled"
            value={totals.totalFilled}
            icon={CheckCircle2}
            description="Current filled"
          />
          <StatCard
            title="Progress"
            value={`${totals.progress}%`}
            icon={BarChart3}
            description="Filled vs required"
          />
          <StatCard
            title="At Risk"
            value={totals.atRisk}
            icon={AlertTriangle}
            description="Needs attention"
          />
          <StatCard
            title="Delayed"
            value={totals.delayed}
            icon={CircleAlert}
            description="Past expected movement"
          />
          <StatCard
            title="Missing Actions"
            value={totals.actionMissing}
            icon={ClipboardList}
            description="Unfilled without action"
          />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-semibold text-sibs-primary-1">
              Hiring Plan Versions
            </h3>

            <p className="mb-4 text-sm text-sibs-tertiary-5">
              Current week, previous week, and archived weekly plans.
            </p>

            <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="inline-flex min-w-max gap-2 rounded-full bg-[#F2F4F7] p-1 shadow-sm">
                {weeklyVersions.map((week) => {
                  const isActive = activeWeekId === week.id;

                  return (
                    <button
                      key={week.id}
                      type="button"
                      onClick={() => setActiveWeekId(week.id)}
                      className={`relative inline-flex items-center justify-center whitespace-nowrap rounded-full px-5 py-3 text-sm font-medium transition-colors duration-300 ${
                        isActive
                          ? "bg-[var(--sibs-primary-1)] text-white shadow-sm"
                          : "text-[#344054]"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        {week.locked ? <Lock size={14} /> : <Unlock size={14} />}
                        <span>{week.label}</span>
                        <span
                          className={`hidden text-xs font-semibold sm:inline ${
                            isActive ? "text-white/80" : "text-gray-400"
                          }`}
                        >
                          {week.weekRange}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-semibold text-sibs-primary-1">
              Quick Actions
            </h3>

            <p className="mb-4 text-sm text-sibs-tertiary-5">
              Manage the active weekly hiring board.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setShowKpiSnapshot(true)}
                className="flex items-center gap-3 rounded-xl border border-[#E6ECF2] bg-white p-4 text-left transition hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--sibs-primary-1)] text-white">
                  <BarChart3 size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-sibs-primary-1">
                    KPI Snapshot
                  </p>
                  <p className="text-xs text-sibs-tertiary-5">View summary</p>
                </div>
              </button>

              {!isLocked && (
                <button
                  type="button"
                  onClick={handleOpenAddRoleModal}
                  className="flex items-center gap-3 rounded-xl border border-[#E6ECF2] bg-white p-4 text-left transition hover:shadow-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--sibs-primary-1)] text-white">
                    <Plus size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-sibs-primary-1">
                      Add Requirement
                    </p>
                    <p className="text-xs text-sibs-tertiary-5">Add to board</p>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={handleCreateNewWeeklyVersion}
                className="flex items-center gap-3 rounded-xl border border-[#E6ECF2] bg-white p-4 text-left transition hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--sibs-primary-1)] text-white">
                  <RotateCcw size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-sibs-primary-1">
                    Create New Week
                  </p>
                  <p className="text-xs text-sibs-tertiary-5">Lock old board</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-sibs-primary-1">
                  Weekly Hiring Board
                </h2>

                <p className="text-sm text-sibs-tertiary-5">
                  {activeWeek.weekRange} ·{" "}
                  {activeWeek.locked
                    ? "Locked historical version"
                    : "Active editable weekly plan"}
                </p>
              </div>

              <div className="relative w-full lg:max-w-[320px]">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search hiring plan..."
                  className="h-11 w-full rounded-full border border-sibs-tertiary-8 bg-white px-4 pl-11 text-sm font-normal text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                />
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-bold text-sibs-primary-1">
                    {activeWeek.weekRange}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-sibs-primary-1/70">
                    {activeWeek.locked
                      ? "This weekly version is locked for historical tracking."
                      : "This is the active editable weekly hiring plan."}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${
                    activeWeek.locked
                      ? "border-gray-200 bg-gray-50 text-gray-600"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {activeWeek.locked ? "Locked" : "Editable"}
                </span>
              </div>
            </div>

            <div className="space-y-3 lg:hidden">
              {filteredPlans.length > 0 ? (
                filteredPlans.map((item) => (
                  <HiringPlanMobileCard
                    key={item.id}
                    item={item}
                    onView={() => setSelectedPlan(item)}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                  No weekly hiring plan records found.
                </div>
              )}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-[#E6ECF2] lg:block">
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full min-w-[1180px] border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
                    <tr className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      <th className="px-5 py-4">Role / Account</th>
                      <th className="px-5 py-4">Job Description</th>
                      <th className="px-5 py-4 text-center">Approved Requirement</th>
                      <th className="px-5 py-4 text-center">Current Filled</th>
                      <th className="px-5 py-4">Due Date</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">TA Owner</th>
                      <th className="px-5 py-4 text-center">Risk Flag</th>
                      <th className="px-5 py-4 text-center">Action Items</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredPlans.length > 0 ? (
                      filteredPlans.map((item) => {
                        const remaining =
                          Number(item.approvedRequirement || 0) -
                          Number(item.currentFilled || 0);

                        const actionMissing =
                          remaining > 0 &&
                          (!item.actionItems || item.actionItems.length === 0);

                        return (
                          <tr key={item.id} className="transition hover:bg-[#F8FAFC]">
                            <td className="px-5 py-4">
                              <p className="text-sm font-bold text-sibs-primary-1">
                                {item.roleAccount}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                                {item.hiringRequirementId}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                              {item.jobDescription}
                            </td>

                            <td className="px-5 py-4 text-center">
                              <span className="text-sm font-bold text-[#344054]">
                                {item.approvedRequirement}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center">
                              <span className="text-sm font-bold text-[#344054]">
                                {item.currentFilled}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 text-sm font-semibold text-[#344054]">
                                <Clock3 size={15} className="text-gray-400" />
                                {formatDate(item.dueDate)}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                                  item.status
                                )}`}
                              >
                                {item.status}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <p className="text-sm font-bold text-[#344054]">
                                {item.taOwner}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-center">
                              {item.riskFlag === "None" ? (
                                <span className="text-sm font-bold text-gray-300">
                                  —
                                </span>
                              ) : (
                                <div className="inline-flex items-center justify-center gap-1">
                                  <Flag
                                    size={17}
                                    className={getRiskClass(item.riskFlag)}
                                    fill="currentColor"
                                  />
                                  <span
                                    className={`text-xs font-bold ${getRiskClass(
                                      item.riskFlag
                                    )}`}
                                  >
                                    {item.riskFlag}
                                  </span>
                                </div>
                              )}
                            </td>

                            <td className="px-5 py-4 text-center">
                              {actionMissing ? (
                                <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                                  Required
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                  {(item.actionItems || []).length}
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedPlan(item)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 py-2 text-xs font-bold text-sibs-primary-1 transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5"
                              >
                                <Eye size={15} />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                        >
                          No weekly hiring plan records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <p className="text-sm font-semibold text-sibs-tertiary-5">
                Showing 1 to {filteredPlans.length} of {activeData.length} hiring
                requirements
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--sibs-primary-1)] text-sm font-bold text-white"
                >
                  1
                </button>

                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <AddRoleModal
        open={showAddRoleModal}
        form={addRoleForm}
        setForm={setAddRoleForm}
        availableRequirements={availableRequirements}
        onClose={handleCloseAddRoleModal}
        onSubmit={handleAddRoleToWeeklyPlan}
      />

      <ViewPlanModal
        open={!!selectedPlan}
        item={selectedPlan}
        locked={isLocked}
        onClose={() => setSelectedPlan(null)}
        onOpenProgress={handleOpenProgressModal}
        onOpenActionItem={handleOpenActionItemModal}
      />

      <UpdateProgressModal
        open={!!progressItem}
        item={progressItem}
        form={progressForm}
        setForm={setProgressForm}
        onClose={handleCloseProgressModal}
        onSubmit={handleSubmitProgress}
      />

      <ActionItemModal
        open={!!actionItemTarget}
        item={actionItemTarget}
        form={actionItemForm}
        setForm={setActionItemForm}
        onClose={handleCloseActionItemModal}
        onSubmit={handleSubmitActionItem}
      />

      <KpiSnapshotModal
        open={showKpiSnapshot}
        week={activeWeek}
        onClose={() => setShowKpiSnapshot(false)}
      />
    </div>
  );
}