import React, { useMemo, useState } from "react";
import Header from "../../components/layout/Header";
import {
  ListChecks,
  Search,
  Eye,
  Plus,
  X,
  CalendarDays,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  CircleAlert,
  UserRound,
  ChevronLeft,
  ChevronRight,
  Target,
  Activity,
  FileText,
} from "lucide-react";
import { AddActionItemModal } from "../../components/modals/actionItems/ActionItemsModal.jsx";

const initialActionItems = [
  {
    id: 1,
    actionId: "ACT-001",
    actionItem: "Add 50 sourced candidates for CSR role before Friday.",
    roleAccount: "CSR - SIBS Operations",
    roleTitle: "Customer Service Representative",
    account: "SIBS Operations",
    owner: "Maria Reyes",
    deadline: "2026-05-10",
    status: "Ongoing",
    riskLevel: "High",
    linkedGap: "Pipeline",
    remarks:
      "Current sourced candidates are not enough to support approved hiring requirement.",
    requirement: 20,
    filled: 12,
    createdDate: "2026-05-03",
    completedDate: null,
  },
  {
    id: 2,
    actionId: "ACT-002",
    actionItem: "Schedule pending QA interviews within 48 hours.",
    roleAccount: "QA - SIBS Operations",
    roleTitle: "QA Specialist",
    account: "SIBS Operations",
    owner: "John Dela Cruz",
    deadline: "2026-05-08",
    status: "Planned",
    riskLevel: "High",
    linkedGap: "Interview",
    remarks:
      "Interview delay is causing QA role to fall behind the weekly hiring plan.",
    requirement: 5,
    filled: 2,
    createdDate: "2026-05-04",
    completedDate: null,
  },
  {
    id: 3,
    actionId: "ACT-003",
    actionItem: "Review compensation range for System Developer applicants.",
    roleAccount: "System Developer - SIBS IT",
    roleTitle: "System Developer",
    account: "SIBS IT",
    owner: "Kim Domingo",
    deadline: "2026-05-09",
    status: "Ongoing",
    riskLevel: "Medium",
    linkedGap: "Offer",
    remarks:
      "Offer declines are connected to compensation mismatch and competing offers.",
    requirement: 3,
    filled: 1,
    createdDate: "2026-05-02",
    completedDate: null,
  },
  {
    id: 4,
    actionId: "ACT-004",
    actionItem: "Finalize revised JD for RCM Analyst role.",
    roleAccount: "RCM Analyst - SIBS RCM",
    roleTitle: "RCM Analyst",
    account: "SIBS RCM",
    owner: "Paul Garcia",
    deadline: "2026-05-12",
    status: "Completed",
    riskLevel: "Low",
    linkedGap: "JD",
    remarks:
      "JD update completed and role is now aligned with sourcing requirements.",
    requirement: 5,
    filled: 3,
    createdDate: "2026-05-01",
    completedDate: "2026-05-06",
  },
  {
    id: 5,
    actionId: "ACT-005",
    actionItem: "Request approval confirmation for new HR Assistant headcount.",
    roleAccount: "HR Assistant - SIBS HR",
    roleTitle: "HR Assistant",
    account: "SIBS HR",
    owner: "Maria Reyes",
    deadline: "2026-05-11",
    status: "Planned",
    riskLevel: "Medium",
    linkedGap: "Approval",
    remarks:
      "Hiring movement cannot proceed until approval status is finalized in the system.",
    requirement: 2,
    filled: 0,
    createdDate: "2026-05-05",
    completedDate: null,
  },
];

const statusOptions = ["All Status", "Planned", "Ongoing", "Completed"];

const riskOptions = ["All Risk", "High", "Medium", "Low"];

const gapOptions = [
  "All Gaps",
  "Pipeline",
  "Screening",
  "Interview",
  "Offer",
  "JD",
  "Approval",
  "Capacity / Manpower",
];

const ownerOptions = [
  "All Owners",
  "Maria Reyes",
  "John Dela Cruz",
  "Kim Domingo",
  "Paul Garcia",
];

const emptyActionForm = {
  weeklyPlanItemId: "",
  hiringNeedId: "",
  roleAccount: "",
  roleTitle: "",
  account: "",
  requirement: 0,
  filled: 0,
  actionItem: "",
  owner: "",
  deadline: "",
  status: "Planned",
  riskLevel: "Medium",
  linkedGap: "Pipeline",
  remarks: "",
};

function inputClass(extra = "") {
  return `h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function generateActionId(nextNumber) {
  return `ACT-${String(nextNumber).padStart(3, "0")}`;
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusClass(status) {
  switch (status) {
    case "Completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Ongoing":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Planned":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getRiskClass(risk) {
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

function getGapClass(gap) {
  switch (gap) {
    case "Pipeline":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Screening":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "Interview":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "Offer":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "JD":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    case "Approval":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "Capacity / Manpower":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getDaysLeft(deadline) {
  if (!deadline) return "—";

  const today = new Date();
  const due = new Date(deadline);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diff = due.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return `${Math.abs(days)} day/s overdue`;
  if (days === 0) return "Due today";
  return `${days} day/s left`;
}

function StatCard({ title, value, icon: Icon, description }) {
  return (
    <div className="flex min-w-0 items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sibs-primary-1 text-white">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs text-sibs-tertiary-5">{title}</p>
        <h2 className="text-lg font-bold text-sibs-primary-1">{value}</h2>

        {description && (
          <p className="truncate text-xs text-sibs-tertiary-5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ label, value, total }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="min-w-0 truncate text-sm font-bold text-[#344054]">
          {label}
        </p>

        <p className="shrink-0 text-sm font-bold text-sibs-primary-1">
          {percentage}%
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]">
        <div
          className="h-full rounded-full bg-sibs-primary-1"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <div className="max-w-[60%] break-words text-right text-sm font-bold text-[#344054]">
        {value || "—"}
      </div>
    </div>
  );
}

function ActionItemMobileCard({ item, onView }) {
  return (
    <button
      type="button"
      onClick={onView}
      className="w-full rounded-xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-sibs-primary-1">
            {item.actionId}
          </p>

          <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-6 text-[#101828]">
            {item.actionItem}
          </h3>

          <p className="mt-1 break-words text-xs font-semibold text-sibs-tertiary-5">
            {item.roleTitle} / {item.account}
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

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Owner
          </p>

          <p className="mt-1 text-xs font-bold text-[#344054]">{item.owner}</p>
        </div>

        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Deadline
          </p>

          <p className="mt-1 text-xs font-bold text-[#344054]">
            {formatDate(item.deadline)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getRiskClass(
            item.riskLevel
          )}`}
        >
          {item.riskLevel} Risk
        </span>

        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getGapClass(
            item.linkedGap
          )}`}
        >
          {item.linkedGap}
        </span>

        <span className="inline-flex rounded-full border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-bold text-[#344054]">
          {getDaysLeft(item.deadline)}
        </span>
      </div>

      <div className="mt-4">
        <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-3 py-2 text-xs font-bold text-sibs-primary-1">
          <Eye size={15} />
          View Details
        </span>
      </div>
    </button>
  );
}

function ActionItemDetailsModal({ open, item, onClose, onComplete }) {
  if (!open || !item) return null;

  const progress =
    item.requirement > 0
      ? Math.round((item.filled / item.requirement) * 100)
      : 0;

  const isCompleted = item.status === "Completed";

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
              Action Item Details
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Linked hiring gap, owner, deadline, status, and risk level.
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
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold leading-7 text-[#101828] sm:text-xl">
                      {item.actionItem}
                    </h3>

                    <p className="mt-2 text-sm font-semibold text-sibs-tertiary-5">
                      {item.roleAccount}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getRiskClass(
                          item.riskLevel
                        )}`}
                      >
                        {item.riskLevel} Risk
                      </span>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getGapClass(
                          item.linkedGap
                        )}`}
                      >
                        {item.linkedGap}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1/70">
                      Deadline
                    </p>

                    <p className="mt-1 text-2xl font-bold text-sibs-primary-1">
                      {formatDate(item.deadline)}
                    </p>

                    <p className="mt-1 text-xs font-bold text-sibs-primary-1/70">
                      {getDaysLeft(item.deadline)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#101828]">Remarks</h3>

                <p className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#344054]">
                  {item.remarks || "No remarks provided."}
                </p>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-5 text-sm font-bold text-[#101828]">
                  Role Hiring Progress
                </h3>

                <ProgressBar
                  label="Filled vs Approved Requirement"
                  value={item.filled}
                  total={item.requirement}
                />

                <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-[#344054]">
                      Current Filled
                    </p>

                    <p className="text-sm font-bold text-sibs-primary-1">
                      {item.filled} / {item.requirement}
                    </p>
                  </div>

                  <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
                    {progress}% of approved hiring requirement has been filled.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Linked Gap Interpretation
                </h3>

                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  This action item is tied to the{" "}
                  <span className="font-bold">{item.linkedGap}</span> gap. It
                  should be reviewed in the next weekly hiring call if the role
                  is still not fully hired.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Action Summary
                </h3>

                <div className="mt-4">
                  <DetailRow label="Action ID" value={item.actionId} />
                  <DetailRow label="Role" value={item.roleTitle} />
                  <DetailRow label="Account" value={item.account} />
                  <DetailRow label="Owner" value={item.owner} />
                  <DetailRow
                    label="Created Date"
                    value={formatDate(item.createdDate)}
                  />
                  <DetailRow
                    label="Deadline"
                    value={formatDate(item.deadline)}
                  />
                  <DetailRow
                    label="Days Left"
                    value={getDaysLeft(item.deadline)}
                  />
                  <DetailRow label="Status" value={item.status} />
                  <DetailRow label="Risk Level" value={item.riskLevel} />
                  <DetailRow label="Linked Gap" value={item.linkedGap} />
                  <DetailRow
                    label="Completed Date"
                    value={formatDate(item.completedDate)}
                  />
                </div>
              </div>

              {!isCompleted && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                  <h3 className="text-sm font-bold text-emerald-700">
                    Complete Action
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-emerald-700/90">
                    Mark this item as completed when the action has already been
                    executed or reported in the weekly hiring call.
                  </p>

                  <button
                    type="button"
                    onClick={() => onComplete(item)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                  >
                    <CheckCircle2 size={16} />
                    Mark as Completed
                  </button>
                </div>
              )}

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                <h3 className="text-sm font-bold text-amber-700">
                  Required Rule
                </h3>

                <p className="mt-2 text-sm leading-6 text-amber-700/90">
                  Every role that is not fully hired must have at least one
                  active action item.
                </p>
              </div>

              <div className="rounded-xl border border-red-100 bg-red-50 p-5">
                <h3 className="text-sm font-bold text-red-700">
                  Risk Reminder
                </h3>

                <p className="mt-2 text-sm leading-6 text-red-700/90">
                  High-risk action items should be prioritized before the next
                  weekly hiring report is generated.
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

export default function ActionItemsPage() {
  const [actionItemList, setActionItemList] = useState(initialActionItems);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [riskFilter, setRiskFilter] = useState("All Risk");
  const [gapFilter, setGapFilter] = useState("All Gaps");
  const [ownerFilter, setOwnerFilter] = useState("All Owners");
  const [selectedItem, setSelectedItem] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [actionForm, setActionForm] = useState(emptyActionForm);

  function handleOpenAddModal() {
    setShowAddModal(true);
    setActionForm(emptyActionForm);
  }

  function handleCloseAddModal() {
    setShowAddModal(false);
    setActionForm(emptyActionForm);
  }

  function handleResetActionForm() {
    setActionForm(emptyActionForm);
  }

  function handleAddActionItem(e) {
    e.preventDefault();

    if (!actionForm.weeklyPlanItemId) {
      alert("Role / Account with hiring gap is required.");
      return;
    }

    if (!actionForm.actionItem.trim()) {
      alert("Action item is required.");
      return;
    }

    if (!actionForm.owner) {
      alert("Owner is required.");
      return;
    }

    if (!actionForm.deadline) {
      alert("Deadline is required.");
      return;
    }

    if (!actionForm.linkedGap) {
      alert("Linked gap is required.");
      return;
    }

    const nextId =
      actionItemList.length > 0
        ? Math.max(...actionItemList.map((item) => item.id)) + 1
        : 1;

    const newActionItem = {
      id: nextId,
      actionId: generateActionId(nextId),
      actionItem: actionForm.actionItem.trim(),
      roleAccount: actionForm.roleAccount,
      roleTitle: actionForm.roleTitle,
      account: actionForm.account,
      owner: actionForm.owner,
      deadline: actionForm.deadline,
      status: actionForm.status,
      riskLevel: actionForm.riskLevel,
      linkedGap: actionForm.linkedGap,
      remarks: actionForm.remarks.trim(),
      requirement: Number(actionForm.requirement || 0),
      filled: Number(actionForm.filled || 0),
      createdDate: getTodayDate(),
      completedDate: actionForm.status === "Completed" ? getTodayDate() : null,
      weeklyPlanItemId: actionForm.weeklyPlanItemId,
      hiringNeedId: actionForm.hiringNeedId,
    };

    setActionItemList((prev) => [newActionItem, ...prev]);
    setSelectedItem(newActionItem);
    handleCloseAddModal();
  }

  function handleCompleteActionItem(item) {
    const updatedItem = {
      ...item,
      status: "Completed",
      completedDate: getTodayDate(),
      remarks:
        item.remarks ||
        "Action item completed and ready for weekly report update.",
    };

    setActionItemList((prev) =>
      prev.map((record) => (record.id === item.id ? updatedItem : record))
    );

    setSelectedItem(updatedItem);
  }

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return actionItemList.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.actionId.toLowerCase().includes(keyword) ||
        item.actionItem.toLowerCase().includes(keyword) ||
        item.roleAccount.toLowerCase().includes(keyword) ||
        item.owner.toLowerCase().includes(keyword) ||
        item.linkedGap.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "All Status" || item.status === statusFilter;

      const matchesRisk =
        riskFilter === "All Risk" || item.riskLevel === riskFilter;

      const matchesGap =
        gapFilter === "All Gaps" || item.linkedGap === gapFilter;

      const matchesOwner =
        ownerFilter === "All Owners" || item.owner === ownerFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesRisk &&
        matchesGap &&
        matchesOwner
      );
    });
  }, [
    actionItemList,
    search,
    statusFilter,
    riskFilter,
    gapFilter,
    ownerFilter,
  ]);

  const stats = useMemo(() => {
    const total = actionItemList.length;

    const planned = actionItemList.filter(
      (item) => item.status === "Planned"
    ).length;

    const ongoing = actionItemList.filter(
      (item) => item.status === "Ongoing"
    ).length;

    const completed = actionItemList.filter(
      (item) => item.status === "Completed"
    ).length;

    const highRisk = actionItemList.filter(
      (item) => item.riskLevel === "High"
    ).length;

    const overdue = actionItemList.filter((item) => {
      if (item.status === "Completed") return false;
      if (!item.deadline) return false;

      const today = new Date();
      const deadline = new Date(item.deadline);

      today.setHours(0, 0, 0, 0);
      deadline.setHours(0, 0, 0, 0);

      return deadline < today;
    }).length;

    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      planned,
      ongoing,
      completed,
      highRisk,
      overdue,
      completionRate,
    };
  }, [actionItemList]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Activity size={28} className="shrink-0 text-sibs-primary-1" />

            <h1 className="min-w-0 break-words text-2xl font-bold text-sibs-primary-1 sm:text-4xl">
              Action Items
            </h1>
          </div>

          <p className="mt-1 text-sm text-sibs-tertiary-5">
            Track actions linked to hiring gaps, at-risk roles, and weekly
            hiring delivery.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-7">
          <StatCard
            title="Total Actions"
            value={stats.total}
            icon={FileText}
            description="All tracked action items"
          />

          <StatCard
            title="Planned"
            value={stats.planned}
            icon={Clock3}
            description="Needs follow-up"
          />

          <StatCard
            title="Ongoing"
            value={stats.ongoing}
            icon={Activity}
            description="In progress"
          />

          <StatCard
            title="Completed"
            value={stats.completed}
            icon={CheckCircle2}
            description={`${stats.completionRate}% complete`}
          />

          <StatCard
            title="High Risk"
            value={stats.highRisk}
            icon={AlertTriangle}
            description="Priority"
          />

          <StatCard
            title="Overdue"
            value={stats.overdue}
            icon={CircleAlert}
            description="Needs review"
          />

          <StatCard
            title="Completion Rate"
            value={`${stats.completionRate}%`}
            icon={Target}
            description="Action KPI"
          />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_420px]">
          <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-sibs-primary-1">
                  Action Status Summary
                </h2>

                <p className="text-sm text-sibs-tertiary-5">
                  Planned, ongoing, completed, high-risk, and overdue weekly
                  actions.
                </p>
              </div>

              <ListChecks size={20} className="shrink-0 text-gray-400" />
            </div>

            <div className="space-y-5">
              <ProgressBar
                label="Planned"
                value={stats.planned}
                total={stats.total}
              />

              <ProgressBar
                label="Ongoing"
                value={stats.ongoing}
                total={stats.total}
              />

              <ProgressBar
                label="Completed"
                value={stats.completed}
                total={stats.total}
              />

              <ProgressBar
                label="High Risk"
                value={stats.highRisk}
                total={stats.total}
              />

              <ProgressBar
                label="Overdue"
                value={stats.overdue}
                total={stats.total}
              />
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white p-3 text-sibs-primary-1">
                <CircleAlert size={22} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-sibs-primary-1">
                  Action Item Requirement
                </h3>

                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  Every role that is not fully hired must have at least one
                  active action item. Each item must be linked to a specific gap
                  such as Pipeline, Screening, Interview, Offer, JD, Approval,
                  or Capacity / Manpower.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h3 className="mb-2 font-semibold text-sibs-primary-1">
                Action Item Records
              </h3>

              <p className="text-sm text-sibs-tertiary-5">
                Role-level actions, linked gaps, owners, deadlines, and risk
                levels.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            >
              <Plus size={18} />
              Add Action Item
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_280px_150px_140px_190px_170px] xl:items-center">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-sibs-primary-1">
                  Action Item List
                </h2>

                <p className="text-sm text-sibs-tertiary-5">
                  Search and filter action item records.
                </p>
              </div>

              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search action, role, owner..."
                  className={inputClass("pl-11 pr-4")}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={inputClass()}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className={inputClass()}
              >
                {riskOptions.map((risk) => (
                  <option key={risk} value={risk}>
                    {risk}
                  </option>
                ))}
              </select>

              <select
                value={gapFilter}
                onChange={(e) => setGapFilter(e.target.value)}
                className={inputClass()}
              >
                {gapOptions.map((gap) => (
                  <option key={gap} value={gap}>
                    {gap}
                  </option>
                ))}
              </select>

              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className={inputClass()}
              >
                {ownerOptions.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="space-y-3 lg:hidden">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <ActionItemMobileCard
                    key={item.id}
                    item={item}
                    onView={() => setSelectedItem(item)}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                  No action item records found.
                </div>
              )}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-[#E6ECF2] lg:block">
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full min-w-[1250px] border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
                    <tr className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      <th className="px-5 py-4">Action ID</th>
                      <th className="px-5 py-4">Action Item</th>
                      <th className="px-5 py-4">Role / Account</th>
                      <th className="px-5 py-4">Owner</th>
                      <th className="px-5 py-4">Deadline</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Risk</th>
                      <th className="px-5 py-4">Linked Gap</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item) => (
                        <tr
                          key={item.id}
                          className="transition hover:bg-[#F8FAFC]"
                        >
                          <td className="px-5 py-4 text-sm font-bold text-sibs-primary-1">
                            {item.actionId}
                          </td>

                          <td className="max-w-[320px] px-5 py-4">
                            <p className="line-clamp-2 text-sm font-bold leading-6 text-[#101828]">
                              {item.actionItem}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-[#101828]">
                              {item.roleTitle}
                            </p>

                            <p className="text-xs font-semibold text-sibs-tertiary-5">
                              {item.account}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-[#344054]">
                              <UserRound size={15} className="text-gray-400" />
                              {item.owner}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm font-semibold text-[#344054]">
                                <CalendarDays
                                  size={15}
                                  className="text-gray-400"
                                />
                                {formatDate(item.deadline)}
                              </div>

                              <p className="text-xs font-bold text-sibs-tertiary-5">
                                {getDaysLeft(item.deadline)}
                              </p>
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
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getRiskClass(
                                item.riskLevel
                              )}`}
                            >
                              {item.riskLevel}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getGapClass(
                                item.linkedGap
                              )}`}
                            >
                              {item.linkedGap}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedItem(item)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 py-2 text-xs font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5"
                            >
                              <Eye size={15} />
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                        >
                          No action item records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <p className="text-sm font-semibold text-sibs-tertiary-5">
                Showing 1 to {filteredItems.length} of {actionItemList.length}{" "}
                action item records
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
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-sibs-primary-1 text-sm font-bold text-white"
                >
                  1
                </button>

                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-sm font-bold text-gray-600 transition hover:bg-gray-50"
                >
                  2
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

        <section className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h3 className="text-sm font-bold text-sibs-primary-1">
            Action Items Rule
          </h3>

          <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
            Every role that is not fully hired must have at least one action
            item. Action items must be linked to a specific hiring gap:
            Pipeline, Screening, Interview, Offer, JD, Approval, or Capacity /
            Manpower.
          </p>
        </section>
      </main>

      <AddActionItemModal
        open={showAddModal}
        form={actionForm}
        setForm={setActionForm}
        onClose={handleCloseAddModal}
        onSubmit={handleAddActionItem}
        onReset={handleResetActionForm}
      />

      <ActionItemDetailsModal
        open={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onComplete={handleCompleteActionItem}
      />
    </div>
  );
}