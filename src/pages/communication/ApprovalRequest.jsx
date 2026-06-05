import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  FileCheck2,
  FileText,
  ListChecks,
  MessageSquareText,
  Search,
  XCircle,
} from "lucide-react";

import Header from "../../components/layout/Header";

const REQUESTS = [
  {
    id: "APR-2026-001",
    title: "Overtime Approval",
    requester: "Maria Santos",
    department: "Operations",
    type: "Overtime",
    dateRequested: "2026-06-05",
    priority: "High",
    status: "Pending",
    approver: "Operations Manager",
    remarks: "Requesting approval for extended shift coverage.",
  },
  {
    id: "APR-2026-002",
    title: "Leave Request",
    requester: "John Dela Cruz",
    department: "Human Resources",
    type: "Leave",
    dateRequested: "2026-06-04",
    priority: "Normal",
    status: "Approved",
    approver: "HR Admin",
    remarks: "Approved leave request for personal appointment.",
  },
  {
    id: "APR-2026-003",
    title: "Requisition Approval",
    requester: "Alyssa Reyes",
    department: "Recruitment",
    type: "Requisition",
    dateRequested: "2026-06-03",
    priority: "High",
    status: "For Review",
    approver: "Executive",
    remarks: "New manpower request for recruitment pipeline.",
  },
  {
    id: "APR-2026-004",
    title: "Schedule Adjustment",
    requester: "Kevin Lim",
    department: "Workforce",
    type: "Schedule",
    dateRequested: "2026-06-02",
    priority: "Normal",
    status: "Rejected",
    approver: "Workforce Lead",
    remarks: "Schedule conflict with existing team coverage.",
  },
  {
    id: "APR-2026-005",
    title: "Document Approval",
    requester: "Grace Mendoza",
    department: "Admin",
    type: "Document",
    dateRequested: "2026-06-01",
    priority: "Low",
    status: "Pending",
    approver: "Admin Manager",
    remarks: "Requesting approval for updated employee document.",
  },
];

const STATUS_OPTIONS = ["All", "Pending", "For Review", "Approved", "Rejected"];

const TYPE_OPTIONS = [
  "All",
  "Overtime",
  "Leave",
  "Requisition",
  "Schedule",
  "Document",
];

function DropdownPortal({
  open,
  anchorRef,
  children,
  onClose,
  maxHeight = 256,
}) {
  const dropdownRef = useRef(null);
  const [style, setStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    function updatePosition() {
      const rect = anchorRef.current.getBoundingClientRect();

      setStyle({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      const clickedAnchor = anchorRef.current?.contains(e.target);
      const clickedDropdown = dropdownRef.current?.contains(e.target);

      if (!clickedAnchor && !clickedDropdown) {
        onClose?.();
      }
    }

    function handleEscape(e) {
      if (e.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, anchorRef, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[999999] overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl"
      style={{
        top: `${style.top}px`,
        left: `${style.left}px`,
        width: `${style.width}px`,
      }}
    >
      <div
        className="overflow-y-auto py-2 sibs-scrollbar"
        style={{ maxHeight }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

function CustomSelect({
  label,
  value,
  options = [],
  onChange,
  allLabel = "",
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const displayValue =
    value === "All" && allLabel ? allLabel : value || allLabel || "Select";

  return (
    <div className="relative">
      <label className="mb-1 block text-sm font-bold text-[#101828]">
        {label}
      </label>

      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-12 w-full items-center justify-between rounded-xl border bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition-all duration-200 hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10 ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : "border-[#D0D5DD]"
        }`}
      >
        <span className="truncate">{displayValue}</span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <DropdownPortal
        open={open}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
      >
        {options.map((option) => {
          const optionLabel = option === "All" && allLabel ? allLabel : option;
          const selected = value === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={`block w-full px-4 py-3 text-left text-sm transition ${
                selected
                  ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                  : "text-[#344054] hover:bg-[#F8FAFC]"
              }`}
            >
              <span className="block truncate">{optionLabel}</span>
            </button>
          );
        })}
      </DropdownPortal>
    </div>
  );
}

function getStatusClass(status) {
  switch (status) {
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Rejected":
      return "border-red-200 bg-red-50 text-red-700";
    case "For Review":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getPriorityClass(priority) {
  switch (priority) {
    case "High":
      return "border-red-200 bg-red-50 text-red-700";
    case "Low":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function getStatusIcon(status) {
  switch (status) {
    case "Approved":
      return CheckCircle2;
    case "Rejected":
      return XCircle;
    case "For Review":
      return AlertCircle;
    default:
      return Clock3;
  }
}

function formatDate(dateValue) {
  if (!dateValue) return "--";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function ApprovalRequest() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedRequest, setSelectedRequest] = useState(null);

  const hasActiveFilters =
    search || statusFilter !== "All" || typeFilter !== "All";

  const filteredRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return REQUESTS.filter((request) => {
      const searchableText = [
        request.id,
        request.title,
        request.requester,
        request.department,
        request.type,
        request.priority,
        request.status,
        request.approver,
        request.remarks,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);

      const matchesStatus =
        statusFilter === "All" || request.status === statusFilter;

      const matchesType = typeFilter === "All" || request.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [search, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    return {
      total: REQUESTS.length,
      pending: REQUESTS.filter((item) => item.status === "Pending").length,
      forReview: REQUESTS.filter((item) => item.status === "For Review").length,
      approved: REQUESTS.filter((item) => item.status === "Approved").length,
      rejected: REQUESTS.filter((item) => item.status === "Rejected").length,
    };
  }, []);

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("All");
    setTypeFilter("All");
  }

  return (
    <div className="flex h-screen flex-1 flex-col bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main className="min-w-0 flex-1 overflow-y-scroll overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="sibs-page-header-in mb-6 flex min-w-0 items-end justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <MessageSquareText size={14} />
              Communication
            </div>

            <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
              Approval Request
            </h1>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Review, monitor, and manage approval requests submitted across
              HRIS modules.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative z-[20] sibs-profile-tab-panel">
            <ApprovalSummaryCards stats={stats} />
          </div>

          <div className="relative z-[10] sibs-profile-tab-panel">
            <ApprovalSearchTable
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
            />
          </div>

          <div className="relative z-[0] sibs-profile-tab-panel">
            <ApprovalRequestTable
              requests={filteredRequests}
              totalRecords={REQUESTS.length}
              onView={setSelectedRequest}
            />
          </div>
        </div>
      </main>

      <ViewApprovalRequestModal
        open={!!selectedRequest}
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </div>
  );
}

function ApprovalSearchTable({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  hasActiveFilters,
  onClearFilters,
}) {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_240px_240px] xl:items-end">
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
              placeholder="Search request, requester, department, type, status, approver..."
              className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />
          </div>
        </div>

        <CustomSelect
          label="Approval Status"
          value={statusFilter}
          options={STATUS_OPTIONS}
          allLabel="All Status"
          onChange={setStatusFilter}
        />

        <CustomSelect
          label="Request Type"
          value={typeFilter}
          options={TYPE_OPTIONS}
          allLabel="All Types"
          onChange={setTypeFilter}
        />
      </div>

      {hasActiveFilters && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex rounded-full border border-[#E6ECF2] bg-white px-3 py-1 text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

function ApprovalSummaryCards({ stats }) {
  const cards = [
    {
      title: "Total Requests",
      value: stats.total,
      icon: FileCheck2,
      className: "bg-blue-50 text-sibs-primary-1",
    },
    {
      title: "Pending",
      value: stats.pending,
      icon: Clock3,
      className: "bg-amber-50 text-amber-700",
    },
    {
      title: "For Review",
      value: stats.forReview,
      icon: AlertCircle,
      className: "bg-cyan-50 text-cyan-700",
    },
    {
      title: "Approved",
      value: stats.approved,
      icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Rejected",
      value: stats.rejected,
      icon: XCircle,
      className: "bg-red-50 text-red-700",
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
      <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <FileCheck2 size={14} />
              Approval Overview
            </div>

            <h2 className="mt-3 text-lg font-extrabold text-sibs-primary-1">
              Request Summary
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Quick overview of pending, reviewed, approved, and rejected
              approval requests.
            </p>
          </div>

          <div className="inline-flex w-fit rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#344054]">
            Records: {stats.total}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm transition hover:bg-[#FAFBFC] hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                    {card.title}
                  </p>

                  <p className="mt-2 text-2xl font-extrabold text-sibs-primary-1">
                    {card.value}
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.className}`}
                >
                  <Icon size={21} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ApprovalRequestTable({ requests, totalRecords, onView }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
      <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <ListChecks size={14} />
              Request List
            </div>

            <h2 className="mt-3 text-lg font-extrabold text-sibs-primary-1">
              Approval Requests
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Review submitted approval requests and check their current
              approval status.
            </p>
          </div>

          <div className="inline-flex w-fit rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#344054]">
            Showing: {requests.length} / {totalRecords}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="hidden lg:block">
          <div className="max-h-[670px] overflow-auto">
            <table className="w-full min-w-[1300px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white text-left">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                  <th className="px-5 py-4 text-left align-top first:rounded-tl-2xl">
                    Request
                  </th>

                  <th className="px-5 py-4 text-left align-top">Requester</th>

                  <th className="px-5 py-4 text-center align-top">Type</th>

                  <th className="px-5 py-4 text-center align-top">
                    Date Requested
                  </th>

                  <th className="px-5 py-4 text-center align-top">Priority</th>

                  <th className="px-5 py-4 text-center align-top">Status</th>

                  <th className="px-5 py-4 text-left align-top">Approver</th>

                  <th className="px-5 py-4 text-right align-top last:rounded-tr-2xl">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td
                      className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                      colSpan={8}
                    >
                      No approval requests found.
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <ApprovalRequestRow
                      key={request.id}
                      request={request}
                      onView={() => onView(request)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="block lg:hidden">
          {requests.length === 0 ? (
            <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-10 text-center text-sm font-bold text-gray-500">
              No approval requests found.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <ApprovalRequestMobileCard
                  key={request.id}
                  request={request}
                  onView={() => onView(request)}
                />
              ))}
            </div>
          )}
        </div>

        <p className="mt-3 text-xs font-semibold text-sibs-tertiary-5">
          Approval records shown here are sample frontend data. You can connect
          this table to the backend approval API later.
        </p>
      </div>
    </section>
  );
}

function ApprovalRequestRow({ request, onView }) {
  const StatusIcon = getStatusIcon(request.status);

  return (
    <tr className="transition hover:bg-[#FAFBFC]">
      <td className="border-b border-[#E6ECF2] px-5 py-5">
        <p className="max-w-[260px] truncate text-sm font-extrabold text-[#101828]">
          {request.title || "--"}
        </p>

        <p className="mt-1 max-w-[260px] truncate text-xs font-semibold text-sibs-tertiary-5">
          {request.id || "--"}
        </p>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5">
        <p className="max-w-[220px] truncate text-sm font-bold text-[#344054]">
          {request.requester || "--"}
        </p>

        <p className="mt-1 max-w-[220px] truncate text-xs font-semibold text-sibs-tertiary-5">
          {request.department || "--"}
        </p>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
        <span className="inline-flex rounded-full border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-1 text-xs font-bold text-[#344054]">
          {request.type || "--"}
        </span>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
        {formatDate(request.dateRequested)}
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPriorityClass(
            request.priority,
          )}`}
        >
          {request.priority || "--"}
        </span>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
        <span
          className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
            request.status,
          )}`}
        >
          <StatusIcon size={14} />
          {request.status || "--"}
        </span>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5">
        <p className="max-w-[220px] truncate text-sm font-bold text-[#344054]">
          {request.approver || "--"}
        </p>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5 text-right">
        <button
          type="button"
          onClick={onView}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 py-2 text-sm font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
        >
          <Eye size={16} />
          View
        </button>
      </td>
    </tr>
  );
}

function ApprovalRequestMobileCard({ request, onView }) {
  const StatusIcon = getStatusIcon(request.status);

  return (
    <button
      type="button"
      onClick={onView}
      className="w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold leading-tight text-[#101828]">
            {request.title || "--"}
          </h3>

          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
            {request.id || "--"}
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
            request.status,
          )}`}
        >
          <StatusIcon size={12} />
          {request.status || "--"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MobileMetric label="Requester" value={request.requester} />
        <MobileMetric label="Department" value={request.department} />
        <MobileMetric label="Type" value={request.type} />
        <MobileMetric label="Priority" value={request.priority} />
        <MobileMetric
          label="Date Requested"
          value={formatDate(request.dateRequested)}
        />
        <MobileMetric label="Approver" value={request.approver} />
      </div>

      <div className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1">
        <Eye size={16} />
        View Details
      </div>
    </button>
  );
}

function MobileMetric({ label, value }) {
  return (
    <div className="rounded-xl bg-[#F8FAFC] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-extrabold text-sibs-primary-1">
        {value || "--"}
      </p>
    </div>
  );
}

function ViewApprovalRequestModal({ open, request, onClose }) {
  if (!open || !request) return null;

  const StatusIcon = getStatusIcon(request.status);

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] px-6 py-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <FileCheck2 size={14} />
              Selected Request
            </div>

            <h2 className="mt-3 text-xl font-extrabold text-sibs-primary-1">
              {request.title}
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              {request.id}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-extrabold text-sibs-primary-1 transition hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
          >
            Close
          </button>
        </div>

        <div className="space-y-5 p-6">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold ${getStatusClass(
              request.status,
            )}`}
          >
            <StatusIcon size={14} />
            {request.status}
          </span>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailBox label="Requester" value={request.requester} />
            <DetailBox label="Department" value={request.department} />
            <DetailBox label="Request Type" value={request.type} />
            <DetailBox label="Priority" value={request.priority} />
            <DetailBox
              label="Date Requested"
              value={formatDate(request.dateRequested)}
            />
            <DetailBox label="Approver" value={request.approver} />
          </div>

          <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-sibs-primary-1">
              <FileText size={17} />
              Request Remarks
            </div>

            <p className="text-sm font-medium leading-6 text-[#344054]">
              {request.remarks || "--"}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-extrabold text-white transition hover:bg-emerald-700 hover:shadow-md active:scale-[0.98]"
            >
              <CheckCircle2 size={17} />
              Approve
            </button>

            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-extrabold text-white transition hover:bg-red-700 hover:shadow-md active:scale-[0.98]"
            >
              <XCircle size={17} />
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-bold text-sibs-primary-1">
        {value || "--"}
      </p>
    </div>
  );
}