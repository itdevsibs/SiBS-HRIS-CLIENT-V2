import React, {
  useCallback,
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
  Loader2,
  Mail,
  Plus,
  RefreshCcw,
  Search,
  Send,
  TrendingDown,
  UploadCloud,
  UserCheck,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";

import Header from "../../components/layout/Header";
import StatusModal from "../../components/modals/StatusModal";

import {
  getManagedEmployees,
  getSupervisorResignations,
  saveSupervisorResignation,
} from "../../lib/axios/getResignationManagement";

import {
  formatDate,
  getTodayDate,
} from "../../components/layout/FormatDateTime";

const DEFAULT_COUNTS = {
  total: 0,
  pending: 0,
  notice: 0,
  completed: 0,
  declined: 0,
};

const STATUS_OPTIONS = [
  "All",
  "For Approval",
  "In Notice Period",
  "Completed",
  "Declined",
];

const TYPE_OPTIONS = [
  "All",
  "Voluntary",
  "Immediate",
  "End of Contract",
  "Health Reason",
  "Personal Reason",
  "Career Opportunity",
  "Other",
];

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

function safeText(value, fallback = "--") {
  const text = String(value || "").trim();
  return text || fallback;
}

function getResignationStatus(item) {
  const status = normalizeStatus(item?.status);

  const isDeclined =
    Number(item?.tlIsDeclined || 0) === 1 ||
    Number(item?.omIsDeclined || 0) === 1 ||
    Number(item?.somIsDeclined || 0) === 1 ||
    status === "declined" ||
    status === "rejected";

  if (isDeclined) return "Declined";

  const isCompleted =
    status === "completed" ||
    status === "complete" ||
    status === "approved" ||
    status === "cleared" ||
    Number(item?.isCompleted || 0) === 1;

  if (isCompleted) return "Completed";

  const lastWorkingDate =
    item?.lastWorkingDate || item?.last_working_date || item?.effectivityDate;

  if (lastWorkingDate) {
    const today = new Date();
    const lastDay = new Date(lastWorkingDate);

    if (!Number.isNaN(lastDay.getTime())) {
      today.setHours(0, 0, 0, 0);
      lastDay.setHours(0, 0, 0, 0);

      if (lastDay >= today) return "In Notice Period";
    }
  }

  return "For Approval";
}

function getItemDate(item) {
  return (
    item?.resignationDate ||
    item?.resignation_date ||
    item?.attritionDate ||
    item?.createdAt ||
    item?.created_at ||
    item?.dateFiled ||
    item?.filedDate ||
    null
  );
}

function getFullName(item) {
  return (
    item?.employeeName ||
    item?.fullName ||
    item?.full_name ||
    item?.name ||
    "Employee"
  );
}

function getEmployeeSibsId(item) {
  return item?.employeeSibsId || item?.sibsId || item?.sibs_id || "--";
}

function getEmployeeDepartment(item) {
  return (
    item?.departmentName ||
    item?.department ||
    item?.deptName ||
    item?.dept_name ||
    "--"
  );
}

function getEmployeePosition(item) {
  return (
    item?.position ||
    item?.jobTitle ||
    item?.job_title ||
    item?.designation ||
    item?.departmentName ||
    item?.department ||
    "Employee"
  );
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "E";

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function isStageApproved(item, stage) {
  if (stage === "tl") return Number(item?.tlIsApproved || 0) === 1;
  if (stage === "om") return Number(item?.omIsApproved || 0) === 1;
  if (stage === "som") return Number(item?.somIsApproved || 0) === 1;
  return false;
}

function isStageDeclined(item, stage) {
  if (stage === "tl") return Number(item?.tlIsDeclined || 0) === 1;
  if (stage === "om") return Number(item?.omIsDeclined || 0) === 1;
  if (stage === "som") return Number(item?.somIsDeclined || 0) === 1;
  return false;
}

function getStageStatus(items, stage) {
  if (!items.length) return "No Requests";

  const approvedCount = items.filter((item) =>
    isStageApproved(item, stage),
  ).length;

  const declinedCount = items.filter((item) =>
    isStageDeclined(item, stage),
  ).length;

  if (declinedCount > 0) return "Has Declined";
  if (approvedCount === items.length) return "Approved";
  if (approvedCount > 0) return "In Progress";

  return "Pending";
}

function getStatusClass(status) {
  switch (status) {
    case "Completed":
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Declined":
    case "Rejected":
      return "border-red-200 bg-red-50 text-red-700";
    case "In Notice Period":
    case "For Review":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "For Approval":
    case "Pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getStatusIcon(status) {
  switch (status) {
    case "Completed":
    case "Approved":
      return CheckCircle2;
    case "Declined":
    case "Rejected":
      return XCircle;
    case "In Notice Period":
      return AlertCircle;
    default:
      return Clock3;
  }
}

function getStageClass(status) {
  switch (status) {
    case "Approved":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "In Progress":
      return "border-blue-100 bg-blue-50 text-blue-700";
    case "Has Declined":
      return "border-red-100 bg-red-50 text-red-700";
    case "No Requests":
      return "border-slate-100 bg-slate-50 text-slate-600";
    default:
      return "border-amber-100 bg-amber-50 text-amber-700";
  }
}

function getFileName(item) {
  return item?.uploadedFile || item?.uploadedFileName || item?.fileName || "";
}

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
    if (!open || !anchorRef.current) return undefined;

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
    if (!open) return undefined;

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

function EmployeeDropdownPortal({ open, anchorRef, children, onClose }) {
  const dropdownRef = useRef(null);
  const [style, setStyle] = useState({
    top: 0,
    left: 0,
    width: 420,
  });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return undefined;

    function updatePosition() {
      const rect = anchorRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      const dropdownWidth = Math.min(460, viewportWidth - 32);
      const preferredLeft = rect.left;
      const safeLeft = Math.min(
        Math.max(16, preferredLeft),
        viewportWidth - dropdownWidth - 16,
      );

      setStyle({
        top: rect.bottom + 8,
        left: safeLeft,
        width: dropdownWidth,
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
    if (!open) return undefined;

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
      className="fixed z-[999999] overflow-hidden rounded-2xl border border-[#D7DEE8] bg-white shadow-2xl"
      style={{
        top: `${style.top}px`,
        left: `${style.left}px`,
        width: `${style.width}px`,
      }}
    >
      {children}
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
        className={`flex h-12 w-full items-center justify-between rounded-xl border bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition-all duration-200 hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${
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

function ResignationSummaryCards({ stats, loading }) {
  const normalizedStats = {
    ...DEFAULT_COUNTS,
    ...(stats || {}),
  };

  const cards = [
    {
      title: "Total Resignations",
      value: normalizedStats.total,
      icon: FileCheck2,
      className: "bg-blue-50 text-sibs-primary-1",
    },
    {
      title: "For Approval",
      value: normalizedStats.pending,
      icon: Clock3,
      className: "bg-amber-50 text-amber-700",
    },
    {
      title: "Notice Period",
      value: normalizedStats.notice,
      icon: AlertCircle,
      className: "bg-cyan-50 text-cyan-700",
    },
    {
      title: "Completed",
      value: normalizedStats.completed,
      icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Declined",
      value: normalizedStats.declined,
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
              Resignation Overview
            </div>

            <h2 className="mt-3 text-lg font-extrabold text-sibs-primary-1">
              Resignation Summary
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Monitor filed resignation records, current progress, notice
              period, and completed clearance.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#344054]">
            {loading && <Loader2 size={15} className="animate-spin" />}
            Records: {normalizedStats.total}
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
                    {loading ? "..." : card.value}
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

function ApprovalStageRow({ stage, approver, role, status }) {
  return (
    <tr className="border-b border-[#edf1f5] last:border-b-0">
      <td className="px-4 py-3 text-sm font-semibold text-sibs-primary-1">
        {stage}
      </td>

      <td className="px-4 py-3 text-sm font-medium text-[#344054]">
        {approver}
      </td>

      <td className="px-4 py-3 text-sm font-medium text-sibs-tertiary-5">
        {role}
      </td>

      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStageClass(
            status,
          )}`}
        >
          {status}
        </span>
      </td>
    </tr>
  );
}

function ResignationProcessStep({
  number,
  icon: Icon,
  title,
  description,
  active,
  done,
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <div className="flex min-w-0 flex-col items-center text-center">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full border-4 border-white shadow-sm transition-all duration-300 ${
            done
              ? "bg-emerald-600 text-white"
              : active
                ? "bg-sibs-primary-1 text-white"
                : "bg-[#eef2f6] text-sibs-tertiary-5"
          }`}
        >
          <Icon size={20} />
        </div>

        <div className="mt-3 min-w-0">
          <p
            className={`text-xs font-bold ${
              done || active ? "text-sibs-primary-1" : "text-sibs-tertiary-5"
            }`}
          >
            {number}. {title}
          </p>

          <p className="mt-1 text-xs font-medium leading-5 text-sibs-tertiary-5">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function ResignationAnalytics({ data = [], loading = false }) {
  const analytics = useMemo(() => {
    const total = data.length;

    const pending = data.filter(
      (item) => getResignationStatus(item) === "For Approval",
    ).length;

    const notice = data.filter(
      (item) => getResignationStatus(item) === "In Notice Period",
    ).length;

    const completed = data.filter(
      (item) => getResignationStatus(item) === "Completed",
    ).length;

    const declined = data.filter(
      (item) => getResignationStatus(item) === "Declined",
    ).length;

    const monthMap = new Map();

    data.forEach((item) => {
      const rawDate = getItemDate(item);
      if (!rawDate) return;

      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) return;

      const label = date.toLocaleDateString("en-US", {
        month: "short",
        timeZone: "Asia/Manila",
      });

      monthMap.set(label, (monthMap.get(label) || 0) + 1);
    });

    const trend = Array.from(monthMap.entries()).slice(-6);
    const maxTrendValue = Math.max(...trend.map(([, value]) => value), 1);

    return {
      total,
      pending,
      notice,
      completed,
      declined,
      trend,
      maxTrendValue,
      completionRate: total ? Math.round((completed / total) * 100) : 0,
    };
  }, [data]);

  const approvalStages = useMemo(
    () => [
      {
        stage: "1",
        approver: "Team Leader",
        role: "Direct Supervisor",
        status: getStageStatus(data, "tl"),
      },
      {
        stage: "2",
        approver: "Operations Manager",
        role: "Department Head",
        status: getStageStatus(data, "om"),
      },
      {
        stage: "3",
        approver: "Senior Operations Manager",
        role: "Final Operations Approval",
        status: getStageStatus(data, "som"),
      },
      {
        stage: "4",
        approver: "HR / Admin",
        role: "Clearance & Completion",
        status: analytics.completed > 0 ? "In Progress" : "Pending",
      },
    ],
    [analytics.completed, data],
  );

  return (
    <section className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[1.4fr_0.8fr]">
      <div className="min-w-0 rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <ListChecks size={14} />
              Process Flow
            </div>

            <h2 className="mt-3 text-lg font-extrabold text-sibs-primary-1">
              Resignation Process
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              From employee email submission to TL/OM filing, approval request,
              notice period, and HR/Admin completion.
            </p>
          </div>

          <span className="mt-2 w-fit rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#344054] sm:mt-0">
            Sequential Approval
          </span>
        </div>

        <div className="relative mt-6">
          <div className="absolute left-[8%] right-[8%] top-6 hidden h-0.5 bg-[#d9e2ec] lg:block" />

          <div className="relative grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            <ResignationProcessStep
              number="1"
              icon={Mail}
              title="Email Received"
              description="Employee submits resignation letter via email."
              done={analytics.total > 0}
            />

            <ResignationProcessStep
              number="2"
              icon={UserCheck}
              title="Filed by TL / OM"
              description="Supervisor applies resignation in the system."
              done={analytics.total > 0}
            />

            <ResignationProcessStep
              number="3"
              icon={Send}
              title="For Approval"
              description="Request appears in Approval Request module."
              active={analytics.pending > 0}
              done={analytics.notice > 0 || analytics.completed > 0}
            />

            <ResignationProcessStep
              number="4"
              icon={Clock3}
              title="Notice Period"
              description="Employee renders remaining working days."
              active={analytics.notice > 0}
              done={analytics.completed > 0}
            />

            <ResignationProcessStep
              number="5"
              icon={CheckCircle2}
              title="Completed"
              description="Clearance and final resignation completed."
              done={analytics.completed > 0}
            />
          </div>
        </div>

        <div className="mt-7 overflow-hidden rounded-2xl border border-[#E6ECF2]">
          <div className="flex items-center justify-between border-b border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3">
            <h3 className="text-sm font-extrabold text-sibs-primary-1">
              Approval Stages
            </h3>

            <p className="text-xs font-semibold text-sibs-tertiary-5">
              TL / OM / SOM / HR
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr className="bg-white text-left text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Approver</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {approvalStages.map((stage) => (
                  <ApprovalStageRow
                    key={stage.stage}
                    stage={stage.stage}
                    approver={stage.approver}
                    role={stage.role}
                    status={stage.status}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5">
        <div className="min-w-0 rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-red-700">
                <TrendingDown size={14} />
                Trend
              </div>

              <h2 className="mt-3 text-lg font-extrabold text-sibs-primary-1">
                Resignation Trend
              </h2>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Monthly filed resignations
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <TrendingDown size={19} />
            </div>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-[#D9E2EC] bg-[#F8FAFC]">
              <Loader2 size={26} className="animate-spin text-sibs-primary-1" />
            </div>
          ) : analytics.trend.length > 0 ? (
            <div className="flex h-40 items-end gap-3">
              {analytics.trend.map(([label, value]) => (
                <div
                  key={label}
                  className="flex min-w-0 flex-1 flex-col items-center gap-2"
                >
                  <div className="flex h-28 w-full items-end rounded-full bg-[#f2f4f7]">
                    <div
                      className="w-full rounded-full bg-sibs-primary-1 transition-all duration-300"
                      style={{
                        height: `${Math.max(
                          12,
                          (value / analytics.maxTrendValue) * 100,
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="text-center">
                    <p className="text-xs font-bold text-sibs-primary-1">
                      {value}
                    </p>

                    <p className="text-[11px] font-semibold text-sibs-tertiary-5">
                      {label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-[#d9e2ec] bg-[#f8fafc] text-center">
              <UsersRound size={22} className="text-sibs-tertiary-5" />

              <p className="mt-2 text-sm font-semibold text-sibs-primary-1">
                No trend data yet
              </p>

              <p className="mt-1 text-xs font-medium text-sibs-tertiary-5">
                Filed resignations will appear here.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <h3 className="text-base font-extrabold text-sibs-primary-1">
            Approval Routing
          </h3>

          <p className="mt-3 text-sm font-medium leading-6 text-[#344054]">
            All resignation approval decisions are handled in the Approval
            Request module. This page is only for filing, monitoring, process
            tracking, analytics, and full resignation listing.
          </p>
        </div>
      </div>
    </section>
  );
}

function ResignationFilters({
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
              placeholder="Search employee, SIBS ID, department, type, status, reason..."
              className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />
          </div>
        </div>

        <CustomSelect
          label="Resignation Status"
          value={statusFilter}
          options={STATUS_OPTIONS}
          allLabel="All Status"
          onChange={setStatusFilter}
        />

        <CustomSelect
          label="Resignation Type"
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

function ResignationTableCard({ data, totalRecords, loading, onView }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
      <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <ListChecks size={14} />
              Resignation List
            </div>

            <h2 className="mt-3 text-lg font-extrabold text-sibs-primary-1">
              All Resignations
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              View all resignation records filed by TL/OM or direct supervisors.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#344054]">
            {loading && <Loader2 size={15} className="animate-spin" />}
            Showing: {data.length} / {totalRecords}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="hidden lg:block">
          <div className="max-h-[670px] overflow-auto sibs-scrollbar">
            <table className="w-full min-w-[1250px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white text-left">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                  <th className="px-5 py-4 text-left align-top first:rounded-tl-2xl">
                    Employee
                  </th>
                  <th className="px-5 py-4 text-left align-top">Filed By</th>
                  <th className="px-5 py-4 text-center align-top">Type</th>
                  <th className="px-5 py-4 text-center align-top">
                    Resignation Date
                  </th>
                  <th className="px-5 py-4 text-center align-top">
                    Last Working Date
                  </th>
                  <th className="px-5 py-4 text-center align-top">Status</th>
                  <th className="px-5 py-4 text-left align-top">Reason</th>
                  <th className="px-5 py-4 text-right align-top last:rounded-tr-2xl">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                      colSpan={8}
                    >
                      <Loader2
                        size={28}
                        className="mx-auto mb-3 animate-spin text-sibs-primary-1"
                      />
                      Loading resignations...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td
                      className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                      colSpan={8}
                    >
                      No resignation records found.
                    </td>
                  </tr>
                ) : (
                  data.map((item, index) => (
                    <ResignationRow
                      key={item?.id || item?.resignationId || index}
                      item={item}
                      onView={() => onView(item)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="block lg:hidden">
          {loading ? (
            <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-10 text-center text-sm font-bold text-gray-500">
              <Loader2
                size={28}
                className="mx-auto mb-3 animate-spin text-sibs-primary-1"
              />
              Loading resignations...
            </div>
          ) : data.length === 0 ? (
            <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-10 text-center text-sm font-bold text-gray-500">
              No resignation records found.
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((item, index) => (
                <ResignationMobileCard
                  key={item?.id || item?.resignationId || index}
                  item={item}
                  onView={() => onView(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ResignationRow({ item, onView }) {
  const status = getResignationStatus(item);
  const StatusIcon = getStatusIcon(status);
  const employeeName = getFullName(item);

  return (
    <tr className="transition hover:bg-[#FAFBFC]">
      <td className="border-b border-[#E6ECF2] px-5 py-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sibs-primary-1/10 text-xs font-extrabold text-sibs-primary-1">
            {getInitials(employeeName)}
          </div>

          <div className="min-w-0">
            <p className="max-w-[220px] truncate text-sm font-extrabold text-[#101828]">
              {employeeName}
            </p>

            <p className="mt-1 max-w-[220px] truncate text-xs font-semibold text-sibs-tertiary-5">
              {getEmployeeSibsId(item)} · {getEmployeeDepartment(item)}
            </p>
          </div>
        </div>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5">
        <p className="max-w-[220px] truncate text-sm font-bold text-[#344054]">
          {item?.filedByName ||
            item?.encodedByName ||
            item?.createdByName ||
            item?.supervisorName ||
            "TL / OM"}
        </p>

        <p className="mt-1 max-w-[220px] truncate text-xs font-semibold text-sibs-tertiary-5">
          Direct supervisor
        </p>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
        <span className="inline-flex rounded-full border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-1 text-xs font-bold text-[#344054]">
          {item?.resignationType || item?.type || "--"}
        </span>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
        {formatDate(
          item?.resignationDate || item?.resignation_date || getItemDate(item),
        )}
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
        {formatDate(item?.lastWorkingDate || item?.last_working_date)}
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
        <span
          className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
            status,
          )}`}
        >
          <StatusIcon size={14} />
          {status}
        </span>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5">
        <p className="max-w-[260px] truncate text-sm font-semibold text-[#344054]">
          {item?.reason || item?.remarks || "--"}
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

function ResignationMobileCard({ item, onView }) {
  const status = getResignationStatus(item);
  const StatusIcon = getStatusIcon(status);

  return (
    <button
      type="button"
      onClick={onView}
      className="w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold leading-tight text-[#101828]">
            {getFullName(item)}
          </h3>

          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
            {getEmployeeSibsId(item)} · {getEmployeeDepartment(item)}
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
            status,
          )}`}
        >
          <StatusIcon size={12} />
          {status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MobileMetric label="Type" value={item?.resignationType || item?.type} />
        <MobileMetric
          label="Date"
          value={formatDate(item?.resignationDate || getItemDate(item))}
        />
        <MobileMetric
          label="Last Working"
          value={formatDate(item?.lastWorkingDate || item?.last_working_date)}
        />
        <MobileMetric label="Filed By" value={item?.filedByName || "TL / OM"} />
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

function EmployeePickerField({
  label,
  selectedSibsId,
  selectedName,
  employees = [],
  loading = false,
  search = "",
  open = false,
  onOpenChange,
  onSearchChange,
  onSelect,
}) {
  const anchorRef = useRef(null);

  return (
    <div className="relative">
      <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
        {label}
      </label>

      <button
        ref={anchorRef}
        type="button"
        onClick={() => onOpenChange?.(!open)}
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-bold outline-none transition ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : "border-[#D0D5DD] hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC]"
        }`}
      >
        <span className="min-w-0 truncate text-sibs-primary-1">
          {selectedSibsId
            ? `${selectedSibsId} - ${selectedName || "Selected employee"}`
            : "Select employee under your management"}
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <EmployeeDropdownPortal
        open={open}
        anchorRef={anchorRef}
        onClose={() => onOpenChange?.(false)}
      >
        <div className="sticky top-0 z-10 border-b border-[#E6ECF2] bg-white p-3">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
            />

            <input
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search SIBS ID or employee name..."
              className="h-10 w-full rounded-xl border border-[#D0D5DD] bg-white px-3 pl-9 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />
          </div>
        </div>

        <div className="max-h-[320px] overflow-y-auto py-2 sibs-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm font-bold text-sibs-primary-1">
              <Loader2 size={17} className="animate-spin" />
              Loading employees...
            </div>
          ) : employees.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm font-bold text-sibs-tertiary-5">
              No employees found under your management.
            </div>
          ) : (
            employees.map((employee) => (
              <button
                key={employee.sibsId}
                type="button"
                onClick={() => onSelect?.(employee)}
                className={`block w-full px-4 py-3 text-left transition hover:bg-[#F8FAFC] ${
                  selectedSibsId === employee.sibsId
                    ? "bg-[#EAF2FB]"
                    : "bg-white"
                }`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sibs-primary-1/10 text-xs font-extrabold text-sibs-primary-1">
                    {getInitials(employee.fullName || employee.sibsId || "E")}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[#101828]">
                      {employee.fullName || "Unnamed Employee"}
                    </p>

                    <p className="mt-0.5 truncate text-xs font-bold text-[#2F6CA5]">
                      {employee.sibsId || "N/A"}
                      {employee.department ? ` · ${employee.department}` : ""}
                    </p>

                    {employee.account && (
                      <p className="mt-0.5 truncate text-xs font-semibold text-sibs-tertiary-5">
                        {employee.account}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </EmployeeDropdownPortal>
    </div>
  );
}

function ResignationApplyModal({
  open,
  form,
  submitting,
  managedEmployees = [],
  employeePickerLoading = false,
  employeePickerSearch = "",
  employeePickerOpen = false,
  onEmployeePickerOpenChange,
  onEmployeePickerSearchChange,
  onSearchManagedEmployees,
  onSelectManagedEmployee,
  onClose,
  onChange,
  onSubmit,
}) {
  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/45 p-4"
    >
      <form
        onSubmit={onSubmit}
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-2xl"
      >
        <div className="shrink-0 border-b border-[#E6ECF2] bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#DDE5EF] text-sibs-primary-1">
                <FileText size={22} />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-xl font-extrabold text-sibs-primary-1">
                  New Resignation
                </h2>

                <p className="mt-1 text-sm font-medium text-[#2F6CA5]">
                  File resignation after receiving the employee’s resignation
                  email.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sibs-primary-1 transition hover:bg-[#F2F6FA] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sibs-scrollbar">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
                <h3 className="text-base font-extrabold text-sibs-primary-1">
                  Employee Information
                </h3>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <EmployeePickerField
                    label="Employee SIBS ID"
                    selectedSibsId={form.employeeSibsId}
                    selectedName={form.employeeName}
                    employees={managedEmployees}
                    loading={employeePickerLoading}
                    search={employeePickerSearch}
                    open={employeePickerOpen}
                    onOpenChange={onEmployeePickerOpenChange}
                    onSearchChange={(value) => {
                      onEmployeePickerSearchChange?.(value);
                      onSearchManagedEmployees?.(value);
                    }}
                    onSelect={onSelectManagedEmployee}
                  />

                  <FormInput
                    label="Employee Name"
                    name="employeeName"
                    value={form.employeeName}
                    onChange={onChange}
                    placeholder="Employee name will auto-fill"
                    readOnly
                  />

                  <FormInput
                    label="Resignation Date"
                    name="resignationDate"
                    type="date"
                    value={form.resignationDate}
                    onChange={onChange}
                  />

                  <FormInput
                    label="Last Working Date"
                    name="lastWorkingDate"
                    type="date"
                    value={form.lastWorkingDate}
                    onChange={onChange}
                  />

                  <div>
                    <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                      Resignation Type
                    </label>

                    <select
                      name="resignationType"
                      value={form.resignationType}
                      onChange={onChange}
                      className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                    >
                      <option value="">Select type</option>
                      {TYPE_OPTIONS.filter((type) => type !== "All").map(
                        (type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                      Email Attachment
                    </label>

                    <label className="flex h-12 cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC]">
                      <span className="min-w-0 truncate">
                        {form.uploadedFile?.name ||
                          "Upload resignation email/file"}
                      </span>

                      <UploadCloud size={17} className="shrink-0" />

                      <input
                        type="file"
                        name="uploadedFile"
                        onChange={onChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <FormTextarea
                      label="Reason / Summary"
                      name="reason"
                      value={form.reason}
                      onChange={onChange}
                      rows={4}
                      placeholder="Summarize the employee’s resignation reason based on the submitted email."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FormTextarea
                      label="TL / OM Remarks"
                      name="remarks"
                      value={form.remarks}
                      onChange={onChange}
                      rows={3}
                      placeholder="Add remarks before sending the resignation request for approval."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
                <h3 className="text-base font-extrabold text-sibs-primary-1">
                  Filing Checklist
                </h3>

                <div className="mt-4 space-y-3">
                  <ChecklistItem
                    done={!!form.employeeSibsId}
                    title="Employee selected"
                    subtitle={form.employeeSibsId || "Waiting for SIBS ID"}
                  />

                  <ChecklistItem
                    done={!!form.employeeName}
                    title="Employee name"
                    subtitle={form.employeeName || "Waiting for name"}
                  />

                  <ChecklistItem
                    done={!!form.resignationDate && !!form.lastWorkingDate}
                    title="Dates completed"
                    subtitle={
                      form.resignationDate && form.lastWorkingDate
                        ? `${form.resignationDate} to ${form.lastWorkingDate}`
                        : "Waiting for resignation and last working date"
                    }
                  />

                  <ChecklistItem
                    done={!!form.resignationType}
                    title="Resignation type"
                    subtitle={form.resignationType || "Waiting for type"}
                  />

                  <ChecklistItem
                    done={!!String(form.reason || "").trim()}
                    title="Reason summary"
                    subtitle={
                      form.reason || "Waiting for reason / email summary"
                    }
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-base font-extrabold text-sibs-primary-1">
                  Process Rule
                </h3>

                <p className="mt-3 text-sm font-medium leading-6 text-[#344054]">
                  After submission, this resignation will appear in the
                  Approval Request module for the assigned approver. Approval
                  decisions should not be made on this page.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#E6ECF2] bg-white px-6 py-5">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-6 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-6 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-95 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Send size={17} />
              )}
              {submitting ? "Submitting..." : "Submit Resignation"}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  );
}

function FormInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  readOnly = false,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`h-12 w-full rounded-xl border border-[#D0D5DD] px-4 text-sm font-bold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${
          readOnly ? "cursor-not-allowed bg-[#F8FAFC]" : "bg-white"
        }`}
      />
    </div>
  );
}

function FormTextarea({
  label,
  name,
  value,
  onChange,
  rows = 4,
  placeholder = "",
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
        {label}
      </label>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
      />
    </div>
  );
}

function ChecklistItem({ done = false, title, subtitle }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            done
              ? "border-emerald-500 bg-emerald-50 text-emerald-600"
              : "border-amber-500 bg-amber-50 text-amber-600"
          }`}
        >
          {done ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-extrabold text-[#101828]">{title}</p>

          <p className="mt-1 line-clamp-2 text-xs font-bold text-[#2F6CA5]">
            {subtitle || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

function ViewResignationModal({ open, item, onClose }) {
  if (!open || !item) return null;

  const status = getResignationStatus(item);
  const StatusIcon = getStatusIcon(status);
  const fileName = getFileName(item);

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/45 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="shrink-0 border-b border-[#E6ECF2] bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#DDE5EF] text-sibs-primary-1">
                <FileText size={22} />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-xl font-extrabold text-sibs-primary-1">
                  View Resignation
                </h2>

                <p className="mt-1 text-sm font-medium text-[#2F6CA5]">
                  Resignation record details
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sibs-primary-1 transition hover:bg-[#F2F6FA] active:scale-[0.98]"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sibs-scrollbar">
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#174A7C]">
                    Employee
                  </p>

                  <h3 className="mt-2 text-xl font-extrabold text-[#101828]">
                    {getFullName(item)}
                  </h3>

                  <p className="mt-1 text-sm font-bold text-[#2F6CA5]">
                    {getEmployeeSibsId(item)} · {getEmployeeDepartment(item)}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold ${getStatusClass(
                    status,
                  )}`}
                >
                  <StatusIcon size={14} />
                  {status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <InfoBox
                label="Resignation Type"
                value={item?.resignationType || item?.type}
              />
              <InfoBox
                label="Resignation Date"
                value={formatDate(item?.resignationDate || getItemDate(item))}
              />
              <InfoBox
                label="Last Working Date"
                value={formatDate(
                  item?.lastWorkingDate || item?.last_working_date,
                )}
              />
              <InfoBox
                label="Filed By"
                value={
                  item?.filedByName ||
                  item?.encodedByName ||
                  item?.createdByName ||
                  item?.supervisorName ||
                  "TL / OM"
                }
              />
              <InfoBox label="Position" value={getEmployeePosition(item)} />
              <InfoBox label="Uploaded File" value={fileName || "--"} />
            </div>

            <InfoBox label="Reason / Summary" value={item?.reason} large />
            <InfoBox label="Remarks" value={item?.remarks} large />

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <h3 className="text-base font-extrabold text-sibs-primary-1">
                Approval Reminder
              </h3>

              <p className="mt-3 text-sm font-medium leading-6 text-[#344054]">
                Approval and decline actions for this resignation should be
                handled in the Approval Request module.
              </p>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#E6ECF2] bg-white px-6 py-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function InfoBox({ label, value, large = false }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-sibs-primary-1">{label}</p>

      <div
        className={`rounded-xl border border-[#D6DEE8] bg-white px-4 py-3 text-sm font-medium text-[#344054] ${
          large ? "min-h-[92px] whitespace-pre-line" : "min-h-[43px]"
        }`}
      >
        {safeText(value)}
      </div>
    </div>
  );
}

export default function ResignationManagementPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [openResignationForm, setOpenResignationForm] = useState(false);
  const [resignationSubmitting, setResignationSubmitting] = useState(false);

  const [resignations, setResignations] = useState([]);
  const [resignationLoading, setResignationLoading] = useState(false);
  const [selectedResignation, setSelectedResignation] = useState(null);

  const [managedEmployees, setManagedEmployees] = useState([]);
  const [employeePickerLoading, setEmployeePickerLoading] = useState(false);
  const [employeePickerSearch, setEmployeePickerSearch] = useState("");
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false);

  const mainScrollRef = useRef(null);

  const initialResignationForm = {
    employeeSibsId: "",
    employeeName: "",
    resignationDate: getTodayDate(),
    lastWorkingDate: "",
    resignationType: "",
    reason: "",
    remarks: "",
    department: "",
    account: "",
    uploadedFile: null,
  };

  const [resignationForm, setResignationForm] = useState(initialResignationForm);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const stats = useMemo(() => {
    const counts = {
      ...DEFAULT_COUNTS,
      total: resignations.length,
    };

    resignations.forEach((item) => {
      const status = getResignationStatus(item);

      if (status === "For Approval") counts.pending += 1;
      if (status === "In Notice Period") counts.notice += 1;
      if (status === "Completed") counts.completed += 1;
      if (status === "Declined") counts.declined += 1;
    });

    return counts;
  }, [resignations]);

  const filteredResignations = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return resignations.filter((item) => {
      const status = getResignationStatus(item);
      const type = item?.resignationType || item?.type || "";

      const searchableText = [
        item?.id,
        item?.resignationId,
        getFullName(item),
        getEmployeeSibsId(item),
        getEmployeeDepartment(item),
        getEmployeePosition(item),
        type,
        status,
        item?.reason,
        item?.remarks,
        item?.filedByName,
        item?.supervisorName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);
      const matchesStatus = statusFilter === "All" || status === statusFilter;
      const matchesType = typeFilter === "All" || type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [resignations, search, statusFilter, typeFilter]);

  const hasActiveFilters =
    search || statusFilter !== "All" || typeFilter !== "All";

  const fetchManagedEmployees = useCallback(async (searchValue = "") => {
    try {
      setEmployeePickerLoading(true);

      const result = await getManagedEmployees({
        page: 1,
        limit: 50,
        search: searchValue,
      });

      if (!result?.success) {
        setManagedEmployees([]);
        return [];
      }

      const data = Array.isArray(result.data) ? result.data : [];
      setManagedEmployees(data);

      return data;
    } catch (error) {
      console.error("FETCH MANAGED EMPLOYEES ERROR:", error);
      setManagedEmployees([]);
      return [];
    } finally {
      setEmployeePickerLoading(false);
    }
  }, []);

  const fetchResignations = useCallback(async ({ showError = false } = {}) => {
    try {
      setResignationLoading(true);

      const result = await getSupervisorResignations();

      if (!result?.success) {
        setResignations([]);

        if (showError) {
          setStatusModal({
            open: true,
            type: "error",
            title: "Load Failed",
            message: result?.message || "Failed to load resignation records.",
          });
        }

        return [];
      }

      const data = Array.isArray(result.data) ? result.data : [];
      setResignations(data);

      return data;
    } catch (error) {
      console.error("FETCH RESIGNATIONS ERROR:", error);
      setResignations([]);

      if (showError) {
        setStatusModal({
          open: true,
          type: "error",
          title: "Load Failed",
          message:
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Something went wrong while loading resignations.",
        });
      }

      return [];
    } finally {
      setResignationLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResignations();
  }, [fetchResignations]);

  function forceUnlockPageScroll() {
    window.setTimeout(() => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }, 0);
  }

  function closeStatusModal() {
    setStatusModal({
      open: false,
      type: "success",
      title: "",
      message: "",
    });
  }

  function openStatus({ type = "success", title = "", message = "" }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });
  }

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("All");
    setTypeFilter("All");
  }

  function handleRefresh() {
    fetchResignations({ showError: true });
  }

  function resetResignationForm() {
    setResignationForm({
      ...initialResignationForm,
      resignationDate: getTodayDate(),
    });
  }

  function handleOpenAddResignation() {
    resetResignationForm();
    setEmployeePickerSearch("");
    setEmployeePickerOpen(false);
    setOpenResignationForm(true);
    fetchManagedEmployees("");
  }

  function closeResignationFormModal() {
    if (resignationSubmitting) return;

    setOpenResignationForm(false);
    setEmployeePickerSearch("");
    setEmployeePickerOpen(false);
    resetResignationForm();
    forceUnlockPageScroll();
  }

  function handleSelectManagedEmployee(employee) {
    setResignationForm((prev) => ({
      ...prev,
      employeeSibsId: employee?.sibsId || "",
      employeeName: employee?.fullName || "",
      department: employee?.department || "",
      account: employee?.account || "",
    }));

    setEmployeePickerOpen(false);
    setEmployeePickerSearch("");
  }

  function handleResignationChange(e) {
    const { name, value, files, type } = e.target;

    setResignationForm((prev) => ({
      ...prev,
      [name]: type === "file" ? files?.[0] || null : value,
    }));
  }

  function getResignationValidationError() {
    if (!resignationForm.employeeSibsId) {
      return "Please select the employee SIBS ID.";
    }

    if (!resignationForm.employeeName) {
      return "Please select an employee.";
    }

    if (!resignationForm.resignationDate) {
      return "Please select the resignation date.";
    }

    if (!resignationForm.lastWorkingDate) {
      return "Please select the last working date.";
    }

    if (!resignationForm.resignationType) {
      return "Please select the resignation type.";
    }

    if (!String(resignationForm.reason || "").trim()) {
      return "Please enter the resignation reason or email summary.";
    }

    const resignationDate = new Date(resignationForm.resignationDate);
    const lastWorkingDate = new Date(resignationForm.lastWorkingDate);

    if (
      !Number.isNaN(resignationDate.getTime()) &&
      !Number.isNaN(lastWorkingDate.getTime()) &&
      lastWorkingDate < resignationDate
    ) {
      return "Last working date cannot be earlier than the resignation date.";
    }

    return "";
  }

  async function handleSubmitResignation(e) {
    e.preventDefault();

    const validationMessage = getResignationValidationError();

    if (validationMessage) {
      openStatus({
        type: "error",
        title: "Unable to Submit Resignation",
        message: validationMessage,
      });

      return;
    }

    setResignationSubmitting(true);

    try {
      const payload = {
        employeeSibsId: resignationForm.employeeSibsId,
        employeeName: resignationForm.employeeName,
        resignationDate: resignationForm.resignationDate,
        lastWorkingDate: resignationForm.lastWorkingDate,
        resignationType: resignationForm.resignationType,
        reason: resignationForm.reason,
        remarks: resignationForm.remarks,
        uploadedFile: resignationForm.uploadedFile || null,
      };

      const result = await saveSupervisorResignation(payload);

      if (!result?.success) {
        openStatus({
          type: "error",
          title: "Submission Failed",
          message:
            result?.message ||
            result?.error ||
            "Failed to submit resignation. Please check the required fields and try again.",
        });

        return;
      }

      setOpenResignationForm(false);
      setEmployeePickerSearch("");
      setEmployeePickerOpen(false);
      resetResignationForm();

      await fetchResignations();

      openStatus({
        type: "success",
        title: "Resignation Submitted",
        message:
          result?.message ||
          "The resignation request has been submitted successfully and will now appear in Approval Request.",
      });

      forceUnlockPageScroll();
    } catch (error) {
      console.error("SUBMIT RESIGNATION ERROR:", error);

      openStatus({
        type: "error",
        title: "Submission Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong while submitting the resignation request.",
      });
    } finally {
      setResignationSubmitting(false);
    }
  }

  return (
    <div className="flex h-screen flex-1 flex-col bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main
        ref={mainScrollRef}
        className="min-w-0 flex-1 overflow-y-scroll overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8"
      >
        <div className="sibs-page-header-in mb-6 flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <FileText size={14} />
              Employee Movement
            </div>

            <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
              Resignation Management
            </h1>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              File, monitor, analyze, and track resignation records. Approval
              decisions are handled in Approval Request.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={resignationLoading}
              className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-sibs-primary-1 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resignationLoading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <RefreshCcw size={17} />
              )}
              Refresh
            </button>

            <button
              type="button"
              onClick={handleOpenAddResignation}
              className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95 active:scale-[0.98]"
            >
              <Plus size={17} />
              New Resignation
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative z-[20] sibs-profile-tab-panel">
            <ResignationSummaryCards
              stats={stats}
              loading={resignationLoading}
            />
          </div>

          <div className="relative z-[10] sibs-profile-tab-panel">
            <ResignationFilters
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
            <ResignationAnalytics
              data={resignations}
              loading={resignationLoading}
            />
          </div>

          <div className="relative z-[0] sibs-profile-tab-panel">
            <ResignationTableCard
              data={filteredResignations}
              totalRecords={resignations.length}
              loading={resignationLoading}
              onView={setSelectedResignation}
            />
          </div>
        </div>
      </main>

      <ResignationApplyModal
        open={openResignationForm}
        form={resignationForm}
        submitting={resignationSubmitting}
        managedEmployees={managedEmployees}
        employeePickerLoading={employeePickerLoading}
        employeePickerSearch={employeePickerSearch}
        employeePickerOpen={employeePickerOpen}
        onEmployeePickerOpenChange={setEmployeePickerOpen}
        onEmployeePickerSearchChange={setEmployeePickerSearch}
        onSearchManagedEmployees={fetchManagedEmployees}
        onSelectManagedEmployee={handleSelectManagedEmployee}
        onClose={closeResignationFormModal}
        onChange={handleResignationChange}
        onSubmit={handleSubmitResignation}
      />

      <ViewResignationModal
        open={!!selectedResignation}
        item={selectedResignation}
        onClose={() => setSelectedResignation(null)}
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