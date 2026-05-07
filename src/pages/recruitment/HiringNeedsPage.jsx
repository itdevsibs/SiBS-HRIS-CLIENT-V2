import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../../components/layout/Header";
import HiringNeedsModal from "../../components/modals/hiringNeeds/HiringNeedsModal";

import { getHiringNeeds, createHiringNeed } from "@/lib/axios/hiringNeeds";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Search,
  X,
} from "lucide-react";

const initialForm = {
  account: "",
  department: "",
  roleTitle: "",
  approvedRequirement: "",
  reason: "",
  jobDescriptionId: "",
  jobDescription: "",
  jdStatus: "",
  requestedStartDate: "",
  dueDate: "",
  hiringManager: "",
  priority: "Medium",
};

const fallbackIntakeList = [
  {
    id: "HRI-2025-012",
    intakeType: "Ramp-up",
    roleTitle: "CSR",
    account: "Client A",
    department: "Operations",
    approvedRequirement: 10,
    requestedStartDate: "2025-04-25",
    dueDate: "2025-05-10",
    approvalStatus: "For Validation",
    priority: "High",
    hiringManager: "John D.",
    reason: "Ramp-up requirement",
    jdStatus: "Existing",
  },
  {
    id: "HRI-2025-011",
    intakeType: "Additional Request",
    roleTitle: "TSR",
    account: "Client B",
    department: "Operations",
    approvedRequirement: 5,
    requestedStartDate: "2025-04-24",
    dueDate: "2025-05-08",
    approvalStatus: "Approved",
    priority: "Medium",
    hiringManager: "Jane S.",
    reason: "Additional request",
    jdStatus: "Existing",
  },
  {
    id: "HRI-2025-010",
    intakeType: "Forecasted Growth",
    roleTitle: "Sales Assoc.",
    account: "Client C",
    department: "Sales",
    approvedRequirement: 3,
    requestedStartDate: "2025-04-23",
    dueDate: "2025-05-05",
    approvalStatus: "Approved",
    priority: "Medium",
    hiringManager: "Maria R.",
    reason: "Forecasted growth",
    jdStatus: "Existing",
  },
];

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeStatus(status) {
  if (!status) return "For Validation";
  if (status === "Pending") return "For Validation";
  if (status === "Under Review") return "For Validation";
  return status;
}

function normalizeType(item) {
  return (
    item.intakeType ||
    item.type ||
    item.hiringType ||
    item.requestType ||
    item.reason ||
    "Additional Request"
  );
}

function getPriorityClass(priority) {
  switch (priority) {
    case "High":
      return "border-red-200 bg-red-50 text-red-700";
    case "Medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Low":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getStatusClass(status) {
  switch (normalizeStatus(status)) {
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "For Validation":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Rejected":
      return "border-red-200 bg-red-50 text-red-700";
    case "Blocked":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getJobDescriptionDisplay(item) {
  if (!item) return "—";

  const jd = item.jobDescription;

  if (jd && typeof jd === "object") {
    return `${jd.jd_code || jd.jdCode || "—"} — ${
      jd.role_title || jd.roleTitle || "—"
    }`;
  }

  if (item.jobDescriptionId) return item.jobDescriptionId;
  if (item.job_description_id) return item.job_description_id;

  return "—";
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

function IntakeSummaryBox({
  title,
  value,
  valueClassName = "text-sibs-primary-1",
}) {
  return (
    <div className="flex min-h-[115px] flex-col items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-4 py-5 text-center shadow-sm">
      <p className="text-xs font-bold text-[#475467]">{title}</p>

      <p className={`mt-3 text-3xl font-extrabold ${valueClassName}`}>
        {value}
      </p>
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
        {data.map((item) => {
          const percent =
            total > 0 ? Math.round((Number(item.value || 0) / total) * 100) : 0;

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
        })}
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
            {item.roleTitle || "—"}
          </h3>

          <p className="mt-1 text-xs font-medium text-sibs-tertiary-5">
            {item.account || "—"} / {normalizeType(item)}
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
            Requested
          </p>

          <p className="mt-1 text-sm font-bold text-sibs-primary-1">
            {item.approvedRequirement || "—"}
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Priority
          </p>

          <p className="mt-1 text-sm font-bold text-[#1E293B]">
            {item.priority || "Medium"}
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3 sm:col-span-2">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Date Requested
          </p>

          <p className="mt-1 text-sm font-bold text-[#1E293B]">
            {formatDate(item.requestedStartDate || item.createdAt)}
          </p>
        </div>
      </div>
    </button>
  );
}

function ViewHiringNeedModal({ open, item, onClose }) {
  if (!open || !item) return null;

  const status = normalizeStatus(item.approvalStatus);

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
              Hiring Need Intake Details
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              {item.id || "—"} / {item.roleTitle || "—"}
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
                      {item.roleTitle || "—"}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
                      {item.account || "—"} / {normalizeType(item)}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                          status
                        )}`}
                      >
                        {status}
                      </span>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPriorityClass(
                          item.priority
                        )}`}
                      >
                        {item.priority || "Medium"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1/70">
                      Requested No.
                    </p>

                    <p className="mt-1 text-2xl font-bold text-sibs-primary-1">
                      {item.approvedRequirement || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <InfoBox label="Intake ID" value={item.id} />
                <InfoBox label="Type" value={normalizeType(item)} />
                <InfoBox label="Role / Position" value={item.roleTitle} />
                <InfoBox label="Account / Client" value={item.account} />
                <InfoBox label="Department" value={item.department} />
                <InfoBox
                  label="Date Requested"
                  value={formatDate(item.requestedStartDate || item.createdAt)}
                />
                <InfoBox label="Hiring Manager" value={item.hiringManager} />
                <InfoBox label="Due Date" value={formatDate(item.dueDate)} />
                <InfoBox label="Reason" value={item.reason} />
                <InfoBox
                  label="Job Description"
                  value={getJobDescriptionDisplay(item)}
                />
                <InfoBox label="JD Status" value={item.jdStatus} />
                <InfoBox label="Priority" value={item.priority || "Medium"} />
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Intake Rule
                </h3>

                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  Hiring intake must be validated against workforce risk and
                  linked to an approved Job Description before moving to weekly
                  hiring planning.
                </p>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Validation State
                </h3>

                <div className="mt-4">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                      status
                    )}`}
                  >
                    {status}
                  </span>
                </div>
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
  const navigate = useNavigate();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetchList();
  }, []);

  async function fetchList() {
    setLoading(true);

    try {
      const res = await getHiringNeeds();

      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setList(res.data);
      } else {
        setList(fallbackIntakeList);
      }
    } catch (err) {
      console.error(err);
      setList(fallbackIntakeList);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();

    if (!form.jobDescriptionId) {
      alert("Job Description is required.");
      return;
    }

    try {
      const payload = {
        ...form,
        job_description_id: form.jobDescriptionId,
      };

      const res = await createHiringNeed(payload);

      if (res.success) {
        setForm(initialForm);
        setShowCreateModal(false);
        fetchList();
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create hiring need");
    }
  }

  function handleReset() {
    setForm(initialForm);
  }

  function handleOpenCreateModal() {
    setForm(initialForm);
    setShowCreateModal(true);
  }

  function handleCloseCreateModal() {
    setShowCreateModal(false);
    setForm(initialForm);
  }

  function handleCreateNewJobDescription() {
    setShowCreateModal(false);
    setForm(initialForm);
    navigate("/recruitment/job-description");
  }

  const visibleList = useMemo(() => {
    return list.filter((item) => normalizeType(item) !== "Replacement");
  }, [list]);

  const typeOptions = useMemo(() => {
    const types = visibleList.map((item) => normalizeType(item)).filter(Boolean);
    return ["All", ...Array.from(new Set(types))];
  }, [visibleList]);

  const filteredList = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return visibleList.filter((item) => {
      const status = normalizeStatus(item.approvalStatus);
      const type = normalizeType(item);
      const jobDescription = getJobDescriptionDisplay(item);

      const matchesSearch =
        !keyword ||
        String(item.id || "").toLowerCase().includes(keyword) ||
        String(type || "").toLowerCase().includes(keyword) ||
        String(item.account || "").toLowerCase().includes(keyword) ||
        String(item.department || "").toLowerCase().includes(keyword) ||
        String(item.roleTitle || "").toLowerCase().includes(keyword) ||
        String(item.hiringManager || "").toLowerCase().includes(keyword) ||
        String(jobDescription || "").toLowerCase().includes(keyword);

      const matchesStatus = statusFilter === "All" || status === statusFilter;
      const matchesType = typeFilter === "All" || type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [visibleList, search, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const total = visibleList.length;

    const forValidation = visibleList.filter(
      (item) => normalizeStatus(item.approvalStatus) === "For Validation"
    ).length;

    const approved = visibleList.filter(
      (item) => normalizeStatus(item.approvalStatus) === "Approved"
    ).length;

    return {
      total,
      forValidation,
      approved,
    };
  }, [visibleList]);

  const intakeByType = useMemo(() => {
    const typeMap = new Map();

    visibleList.forEach((item) => {
      const type = normalizeType(item);
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });

    const colors = ["#2563EB", "#06B6D4", "#22C55E", "#F97316", "#EF4444"];

    const preferredOrder = [
      "Ramp-up",
      "Additional Request",
      "Forecasted Growth",
    ];

    const orderedTypes = [
      ...preferredOrder.filter((type) => typeMap.has(type)),
      ...Array.from(typeMap.keys()).filter(
        (type) => !preferredOrder.includes(type)
      ),
    ];

    return orderedTypes.map((type, index) => ({
      label: type,
      value: typeMap.get(type),
      color: colors[index % colors.length],
    }));
  }, [visibleList]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <div className="mx-auto max-w-[1600px] space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-sibs-primary-1 sm:text-3xl">
                Hiring Need Intake
              </h1>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Validate hiring requests before approval and weekly hiring plan
                execution.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            >
              <Plus size={18} />
              New Intake
            </button>
          </div>

          <div className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_1fr_1fr] xl:items-end">
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
                    placeholder="Search intake, role, account, manager..."
                    className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-[#101828]">
                  Status
                </label>

                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-12 w-full appearance-none rounded-xl border border-[#D0D5DD] bg-white px-4 pr-11 text-sm font-bold text-[#344054] outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                  >
                    <option value="All">All Status</option>
                    <option value="For Validation">For Validation</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>

                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-[#101828]">
                  Intake Type
                </label>

                <div className="relative">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="h-12 w-full appearance-none rounded-xl border border-[#D0D5DD] bg-white px-4 pr-11 text-sm font-bold text-[#344054] outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
                  >
                    {typeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type === "All" ? "All Types" : type}
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

            {(search || statusFilter !== "All" || typeFilter !== "All") && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("All");
                    setTypeFilter("All");
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
                Intake Summary (This Month)
              </h2>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <IntakeSummaryBox title="Total Intake" value={stats.total} />

                <IntakeSummaryBox
                  title="For Validation"
                  value={stats.forValidation}
                  valueClassName="text-amber-500"
                />

                <IntakeSummaryBox
                  title="Approved"
                  value={stats.approved}
                  valueClassName="text-emerald-600"
                />
              </div>
            </section>

            <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-base font-bold text-[#101828]">
                Intake by Type
              </h2>

              <div className="mt-4 rounded-xl bg-white">
                <DonutChart data={intakeByType} />
              </div>
            </section>
          </div>

          <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
            <div className="hidden lg:block">
              <div className="overflow-x-auto p-6">
                <table className="w-full min-w-[1120px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left">
                  <thead>
                    <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                      <th className="px-5 py-4 first:rounded-tl-2xl">
                        Intake ID
                      </th>
                      <th className="px-5 py-4">Type</th>
                      <th className="px-5 py-4">Role / Position</th>
                      <th className="px-5 py-4">Account / Client</th>
                      <th className="px-5 py-4 text-center">
                        Requested No.
                      </th>
                      <th className="px-5 py-4">Date Requested</th>
                      <th className="px-5 py-4 text-center">Status</th>
                      <th className="px-5 py-4 text-center">Priority</th>
                      <th className="px-5 py-4 text-right last:rounded-tr-2xl">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                        >
                          Loading hiring intake...
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

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#1E293B]">
                              {normalizeType(item)}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-bold text-[#0F172A]">
                              {item.roleTitle || "—"}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#1E293B]">
                              {item.account || "—"}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#1E293B]">
                              {item.approvedRequirement || "—"}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#1E293B]">
                              {formatDate(
                                item.requestedStartDate || item.createdAt
                              )}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                                  status
                                )}`}
                              >
                                {status}
                              </span>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPriorityClass(
                                  item.priority
                                )}`}
                              >
                                {item.priority || "Medium"}
                              </span>
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
                          colSpan={9}
                          className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                        >
                          No hiring intake found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-[#E6ECF2] px-6 py-4">
                <p className="text-sm font-medium text-sibs-primary-1">
                  Showing 1 to {filteredList.length} of {visibleList.length}{" "}
                  intake records
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
                  Loading hiring intake...
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
                  No hiring intake found.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <HiringNeedsModal
        open={showCreateModal}
        form={form}
        setForm={setForm}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreate}
        onReset={handleReset}
        onCreateNewJobDescription={handleCreateNewJobDescription}
      />

      <ViewHiringNeedModal
        open={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}