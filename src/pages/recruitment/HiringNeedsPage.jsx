import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../../components/layout/Header";
import HiringNeedsModal from "../../components/modals/hiringNeeds/HiringNeedsModal";

import { getHiringNeeds, createHiringNeed } from "@/lib/axios/hiringNeeds";

import {
  FileText,
  Plus,
  Search,
  Eye,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  CircleX,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
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

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPriorityClass(priority) {
  switch (priority) {
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

function getStatusClass(status) {
  switch (status) {
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Under Review":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Rejected":
      return "border-red-200 bg-red-50 text-red-700";
    case "Pending":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

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

function getJobDescriptionDisplay(item) {
  if (!item) return "—";

  const jd = item.jobDescription;

  if (jd && typeof jd === "object") {
    return `${jd.jd_code || jd.jdCode || "—"} — ${
      jd.role_title || jd.roleTitle || "—"
    }`;
  }

  if (item.jobDescriptionId) {
    return item.jobDescriptionId;
  }

  if (item.job_description_id) {
    return item.job_description_id;
  }

  return "—";
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
          <p className="truncate text-xs text-sibs-tertiary-5">{description}</p>
        )}
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

      <div className="break-words text-sm font-bold text-[#344054]">
        {value || "—"}
      </div>
    </div>
  );
}

function HiringNeedMobileCard({ item, onView }) {
  const status = item.approvalStatus || "Pending";

  return (
    <button
      type="button"
      onClick={onView}
      className="w-full rounded-xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-sibs-primary-1">
            {item.id || "—"}
          </p>

          <h3 className="mt-1 text-sm font-bold text-[#101828]">
            {item.roleTitle || "—"}
          </h3>

          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
            {item.account || "—"} / {item.department || "—"}
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

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Requirement
          </p>

          <p className="mt-1 text-xs font-bold text-[#344054]">
            {item.approvedRequirement || "—"}
          </p>
        </div>

        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Due Date
          </p>

          <p className="mt-1 text-xs font-bold text-[#344054]">
            {formatDate(item.dueDate)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getPriorityClass(
            item.priority || "Medium"
          )}`}
        >
          {item.priority || "Medium"}
        </span>

        {item.jdStatus && (
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getJdStatusClass(
              item.jdStatus
            )}`}
          >
            {item.jdStatus}
          </span>
        )}
      </div>

      <div className="mt-3 text-xs font-semibold text-sibs-tertiary-5">
        JD:{" "}
        <span className="font-bold text-[#344054]">
          {getJobDescriptionDisplay(item)}
        </span>
      </div>
    </button>
  );
}

function ViewHiringNeedModal({ open, item, onClose }) {
  if (!open || !item) return null;

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
              Hiring Requirement Details
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Approved Hiring Requirement record.
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoBox label="ID" value={item.id} />
            <InfoBox label="Account" value={item.account} />
            <InfoBox label="Department" value={item.department} />
            <InfoBox label="Role Title" value={item.roleTitle} />

            <InfoBox
              label="Approved Hiring Requirement"
              value={item.approvedRequirement}
            />

            <InfoBox label="Reason for Hiring" value={item.reason} />

            <InfoBox
              label="Job Description"
              value={getJobDescriptionDisplay(item)}
            />

            <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                JD Status
              </p>

              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getJdStatusClass(
                  item.jdStatus
                )}`}
              >
                {item.jdStatus || "—"}
              </span>
            </div>

            <InfoBox
              label="Requested Start Date"
              value={formatDate(item.requestedStartDate)}
            />

            <InfoBox label="Due Date" value={formatDate(item.dueDate)} />

            <InfoBox label="Hiring Manager" value={item.hiringManager} />

            <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Priority
              </p>

              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPriorityClass(
                  item.priority
                )}`}
              >
                {item.priority || "Medium"}
              </span>
            </div>

            <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Approval Status
              </p>

              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                  item.approvalStatus || "Pending"
                )}`}
              >
                {item.approvalStatus || "Pending"}
              </span>
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

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetchList();
  }, []);

  async function fetchList() {
    setLoading(true);

    try {
      const res = await getHiringNeeds();

      if (res.success) {
        setList(res.data);
      } else {
        setList([]);
      }
    } catch (err) {
      console.error(err);
      setList([]);
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

  const filteredList = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return list.filter((item) => {
      const status = item.approvalStatus || "Pending";
      const jobDescription = getJobDescriptionDisplay(item);

      const matchesSearch =
        !keyword ||
        String(item.id || "").toLowerCase().includes(keyword) ||
        String(item.account || "").toLowerCase().includes(keyword) ||
        String(item.department || "").toLowerCase().includes(keyword) ||
        String(item.roleTitle || "").toLowerCase().includes(keyword) ||
        String(item.hiringManager || "").toLowerCase().includes(keyword) ||
        String(jobDescription || "").toLowerCase().includes(keyword);

      const matchesStatus = statusFilter === "All" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [list, search, statusFilter]);

  const stats = useMemo(() => {
    const total = list.length;

    const pending = list.filter(
      (item) => (item.approvalStatus || "Pending") === "Pending"
    ).length;

    const underReview = list.filter(
      (item) => item.approvalStatus === "Under Review"
    ).length;

    const approved = list.filter(
      (item) => item.approvalStatus === "Approved"
    ).length;

    const rejected = list.filter(
      (item) => item.approvalStatus === "Rejected"
    ).length;

    return {
      total,
      pending,
      underReview,
      approved,
      rejected,
    };
  }, [list]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <FileText size={28} className="shrink-0 text-sibs-primary-1" />

            <h1 className="min-w-0 break-words text-2xl font-bold text-sibs-primary-1 sm:text-4xl">
              Hiring Needs Intake
            </h1>
          </div>

          <p className="mt-1 text-sm text-sibs-tertiary-5">
            Capture and approve hiring requirements from departments
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="All"
            value={stats.total}
            icon={FileText}
            description="Total hiring requests"
          />

          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock3}
            description="Waiting for review"
          />

          <StatCard
            title="Under Review"
            value={stats.underReview}
            icon={AlertTriangle}
            description="Currently being checked"
          />

          <StatCard
            title="Approved"
            value={stats.approved}
            icon={CheckCircle2}
            description="Ready for weekly plan"
          />

          <StatCard
            title="Rejected"
            value={stats.rejected}
            icon={CircleX}
            description="Not approved"
          />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-semibold text-sibs-primary-1">
              Existing Hiring Needs
            </h3>

            <p className="text-sm text-sibs-tertiary-5">
              Current hiring requirements captured from weekly hiring call.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
          >
            <Plus size={18} />
            New Hiring Requirement
          </button>
        </div>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_340px_220px] xl:items-center">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-sibs-primary-1">
                  Hiring Needs List
                </h2>

                <p className="text-sm text-sibs-tertiary-5">
                  Search and filter hiring requirements.
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
                  placeholder="Search role, account, JD..."
                  className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-10 text-center text-sm font-bold text-gray-500">
                Loading hiring needs...
              </div>
            ) : filteredList.length === 0 ? (
              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-10 text-center text-sm font-bold text-gray-500">
                No hiring needs found.
              </div>
            ) : (
              <>
                <div className="space-y-3 lg:hidden">
                  {filteredList.map((item) => (
                    <HiringNeedMobileCard
                      key={item.id}
                      item={item}
                      onView={() => setSelectedItem(item)}
                    />
                  ))}
                </div>

                <div className="hidden overflow-hidden rounded-xl border border-[#E6ECF2] lg:block">
                  <div className="max-h-[520px] overflow-auto">
                    <table className="w-full min-w-[1280px] border-collapse text-left">
                      <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
                        <tr className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                          <th className="px-5 py-4">ID</th>
                          <th className="px-5 py-4">Account / Department</th>
                          <th className="px-5 py-4">Role Title</th>
                          <th className="px-5 py-4">Job Description</th>
                          <th className="px-5 py-4 text-center">
                            Approved Hiring Requirement
                          </th>
                          <th className="px-5 py-4">Due Date</th>
                          <th className="px-5 py-4">Priority</th>
                          <th className="px-5 py-4">Status</th>
                          <th className="px-5 py-4 text-right">Actions</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100 bg-white">
                        {filteredList.map((item) => (
                          <tr
                            key={item.id}
                            className="transition hover:bg-[#F8FAFC]"
                          >
                            <td className="px-5 py-4 text-sm font-bold text-sibs-primary-1">
                              {item.id}
                            </td>

                            <td className="px-5 py-4">
                              <p className="text-sm font-bold text-[#101828]">
                                {item.account || "—"}
                              </p>

                              <p className="text-xs font-semibold text-sibs-tertiary-5">
                                {item.department || "—"}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-sm font-bold text-[#344054]">
                              {item.roleTitle || "—"}
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <ClipboardList
                                  size={15}
                                  className="text-gray-400"
                                />

                                <div>
                                  <p className="text-sm font-bold text-[#344054]">
                                    {getJobDescriptionDisplay(item)}
                                  </p>

                                  {item.jdStatus && (
                                    <span
                                      className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${getJdStatusClass(
                                        item.jdStatus
                                      )}`}
                                    >
                                      {item.jdStatus}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-center text-sm font-bold text-[#344054]">
                              {item.approvedRequirement || "—"}
                            </td>

                            <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                              {formatDate(item.dueDate)}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPriorityClass(
                                  item.priority
                                )}`}
                              >
                                {item.priority || "Medium"}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                                  item.approvalStatus || "Pending"
                                )}`}
                              >
                                {item.approvalStatus || "Pending"}
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <p className="text-sm font-semibold text-sibs-tertiary-5">
                    Showing 1 to {filteredList.length} of {list.length} results
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
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h3 className="text-sm font-bold text-sibs-primary-1">
            Hiring Needs Intake Rule
          </h3>

          <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
            Do not depend on PRF for active hiring. This page now links each
            hiring requirement to a Job Description record before it moves to
            the Weekly Hiring Plan.
          </p>
        </section>
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