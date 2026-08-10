import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  ListChecks,
  Loader2,
  Mail,
  Plus,
  Paperclip,
  RefreshCcw,
  Send,
  TrendingDown,
  UserCheck,
  UserRound,
  UsersRound,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import Header from "../../components/layout/Header";
import StatusModal from "../../components/modals/StatusModal";
import PaginationTable from "../../services/pagination/PaginationTable";
import { useUser } from "../../services/context/UserContext";
import {
  ResignationManagementModal,
  ViewResignationModal,
} from "../../components/modals/resignation-management/ResignationManagementModal";
import AttachmentsModal from "../../components/modals/resignation/attachmentsModal";
import {
  getAttachmentCount,
  getAttachmentCountLabel,
} from "../../lib/utils/resignation/attachmentUtils.js";

import {
  getManagedEmployees,
  getSupervisorResignations,
  saveSupervisorResignation,
} from "../../lib/axios/getResignationManagement";

import {
  formatDate,
  getTodayDate,
} from "../../components/layout/FormatDateTime";

const EDGE = "rounded-[10px]";
const PANEL_BORDER = "border border-[#E1E7EF]";
const SOFT_PANEL_BORDER = "border border-[#E8EEF5]";
const FLAT_BG = "bg-[#F6F8FB]";
const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5001";

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

const TYPE_OPTIONS = ["All", "Formal", "Immediate"];
const PAGE_LIMIT = 15;


function normalizeRoleKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
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

function getProfileImageUrl(item) {
  const directUrl =
    item?.profilePictureUrl ||
    item?.profile_picture_url ||
    item?.profileUrl ||
    item?.profile_url ||
    item?.employeeProfileUrl ||
    item?.employee_profile_url ||
    "";

  if (directUrl) return directUrl;

  const filename =
    item?.profile_filename ||
    item?.profileFilename ||
    item?.profilePicture ||
    item?.profile_picture ||
    item?.employeeProfilePicture ||
    item?.employee_profile_picture ||
    item?.profileImage ||
    item?.profile_image ||
    "";

  if (!filename) return "";

  if (String(filename).startsWith("http")) return filename;

  return `${String(API_URL).replace(
    /\/$/,
    "",
  )}/api/employee-profile/file/${encodeURIComponent(filename)}`;
}

function ProfileAvatar({ item, size = "md" }) {
  const sibsId = getEmployeeSibsId(item);
  const [fetchedEmployee, setFetchedEmployee] = useState(null);
  const [failedImageKey, setFailedImageKey] = useState("");

  const mergedItem = {
    ...(item || {}),
    ...(fetchedEmployee || {}),
  };

  const imageUrl = getProfileImageUrl(mergedItem);
  const imageKey = `${sibsId || "employee"}::${imageUrl || "no-image"}`;
  const imageFailed = failedImageKey === imageKey;

  const shouldFetchProfile =
    sibsId &&
    sibsId !== "--" &&
    !getProfileImageUrl(item || {}) &&
    !fetchedEmployee;

  useEffect(() => {
    if (!shouldFetchProfile) return undefined;

    const controller = new AbortController();

    async function fetchEmployeeProfile() {
      try {
        const response = await fetch(
          `${String(API_URL).replace(
            /\/$/,
            "",
          )}/api/employees/${encodeURIComponent(sibsId)}`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
          },
        );

        if (!response.ok) return;

        const result = await response.json();

        if (result?.success && result?.data) {
          setFetchedEmployee(result.data);
        }
      } catch (error) {
        if (error?.name !== "AbortError") {
          console.error("PROFILE AVATAR FETCH ERROR:", error);
        }
      }
    }

    fetchEmployeeProfile();

    return () => {
      controller.abort();
    };
  }, [shouldFetchProfile, sibsId]);

  function handleOpenProfile(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!imageUrl || imageFailed) return;

    window.open(imageUrl, "_blank", "noopener,noreferrer");
  }

  const sizeClass =
    size === "lg"
      ? "h-12 w-12"
      : size === "sm"
        ? "h-9 w-9"
        : "h-10 w-10";

  const avatarContent =
    imageUrl && !imageFailed ? (
      <img
        src={imageUrl}
        alt="Profile"
        className="h-full w-full object-cover"
        onError={() => setFailedImageKey(imageKey)}
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center text-sibs-primary-1">
        <UserRound size={size === "lg" ? 24 : 20} />
      </div>
    );

  if (imageUrl && !imageFailed) {
    return (
      <button
        type="button"
        onClick={handleOpenProfile}
        title="Open profile picture"
        className={`group flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#D9E2EC] bg-[#F2F6FA] shadow-sm outline-none transition hover:scale-[1.03] hover:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10`}
      >
        {avatarContent}
      </button>
    );
  }

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#D9E2EC] bg-[#F2F6FA] shadow-sm`}
    >
      {avatarContent}
    </div>
  );
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

function renderStatusIcon(status, size = 12) {
  const IconComponent = getStatusIcon(status);
  return <IconComponent size={size} />;
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

function ResignationSummaryCards({ stats, loading }) {
  const normalizedStats = {
    ...DEFAULT_COUNTS,
    ...(stats || {}),
  };

  const cards = [
    {
      title: "Total Resignations",
      description: "Records currently loaded",
      value: normalizedStats.total,
      icon: FileCheck2,
      tone: "navy",
    },
    {
      title: "For Approval",
      description: "Awaiting approval routing",
      value: normalizedStats.pending,
      icon: Clock3,
      tone: "amber",
    },
    {
      title: "Notice Period",
      description: "Employees currently rendering",
      value: normalizedStats.notice,
      icon: AlertCircle,
      tone: "orange",
    },
    {
      title: "Completed",
      description: "Clearance and offboarding done",
      value: normalizedStats.completed,
      icon: CheckCircle2,
      tone: "emerald",
    },
    {
      title: "Declined",
      description: "Declined or retained requests",
      value: normalizedStats.declined,
      icon: XCircle,
      tone: "red",
    },
  ];

  const tones = {
    navy: {
      label: "text-[#042C51]",
      value: "text-[#042C51]",
      iconWrap: "bg-[#EAF2FB]",
      icon: "text-[#042C51]",
    },
    amber: {
      label: "text-[#B45309]",
      value: "text-[#F59E0B]",
      iconWrap: "bg-[#FFFBEB]",
      icon: "text-[#F59E0B]",
    },
    orange: {
      label: "text-[#C2410C]",
      value: "text-[#FF5C28]",
      iconWrap: "bg-[#FFF0EB]",
      icon: "text-[#FF5C28]",
    },
    emerald: {
      label: "text-[#047857]",
      value: "text-[#047857]",
      iconWrap: "bg-[#ECFDF3]",
      icon: "text-[#059669]",
    },
    red: {
      label: "text-[#BE123C]",
      value: "text-[#E11D48]",
      iconWrap: "bg-[#FFF1F2]",
      icon: "text-[#E11D48]",
    },
  };

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        const tone = tones[card.tone] || tones.navy;

        return (
          <article
            key={card.title}
            className="sibs-metric-card flex min-h-[96px] 2xl:min-h-[112px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5"
            style={{
              animationDelay: `${index * 55}ms`,
              animationFillMode: "both",
            }}
          >
            <div className="flex h-full items-start justify-between gap-2.5 2xl:gap-3">
              <div className="min-w-0 flex-1 self-stretch">
                <p
                  className={`m-0 truncate sibs-text-micro font-extrabold uppercase ${tone.label}`}
                >
                  {card.title}
                </p>

                <p
                  className={`mt-1.5 2xl:mt-2 text-2xl 2xl:text-3xl font-extrabold leading-none tabular-nums ${tone.value}`}
                >
                  {loading ? "..." : card.value}
                </p>

                <p className="mt-1 line-clamp-2 sibs-text-micro font-bold leading-4 text-[#667085]">
                  {card.description}
                </p>
              </div>

              <span
                className={`flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full ${tone.iconWrap} ${tone.icon}`}
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 animate-spin" />
                ) : (
                  <IconComponent className="h-4 w-4 2xl:h-4.5 2xl:w-4.5" strokeWidth={2} />
                )}
              </span>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function ApprovalStageRow({ stage, approver, role, status }) {
  return (
    <tr className="border-b border-[#edf1f5] last:border-b-0">
      <td className="px-2.5 py-1.5 2xl:px-4 2xl:py-3 sibs-text-xs font-semibold text-[#042C51]">
        {stage}
      </td>

      <td className="px-2.5 py-1.5 2xl:px-4 2xl:py-3 sibs-text-xs font-medium text-[#344054]">
        {approver}
      </td>

      <td className="px-2.5 py-1.5 2xl:px-4 2xl:py-3 sibs-text-xs font-medium text-[#52637A]">
        {role}
      </td>

      <td className="px-2.5 py-1.5 2xl:px-4 2xl:py-3">
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold ${getStageClass(
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
  icon,
  title,
  description,
  active,
  done,
}) {
  const IconComponent = icon;

  return (
    <div className="relative min-w-0 flex-1">
      <div className="flex min-w-0 flex-col items-center text-center">
        <div
          className={`flex h-8 w-8 2xl:h-9.5 2xl:w-9.5 items-center justify-center rounded-full border-2 2xl:border-4 border-white text-xs font-extrabold shadow-sm transition-all duration-300 ${
            done
              ? "bg-[#042C51] text-white"
              : active
                ? "scale-105 bg-[#FF5C28] text-white shadow-[#FF5C28]/20"
                : "bg-[#EEF2F6] text-[#98A2B3]"
          }`}
        >
          {done ? (
            <CheckCircle2 className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
          ) : (
            <IconComponent className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
          )}
        </div>

        <div className="mt-1.5 2xl:mt-2 min-w-0">
          <p
            className={`sibs-text-micro font-extrabold ${
              done || active ? "text-[#042C51]" : "text-[#98A2B3]"
            }`}
          >
            {number}. {title}
          </p>

          <p className="mt-0.5 sibs-text-micro font-semibold leading-snug text-[#667085]">
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

      const label = date.toLocaleDateString("en-PH", {
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
      <div className={`min-w-0 ${EDGE} ${PANEL_BORDER} bg-white p-3.5 2xl:p-5`}>
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase text-[#042C51]">
              <ListChecks className="h-3.5 w-3.5" />
              Process Flow
            </div>

            <h2 className="text-sm 2xl:text-base font-extrabold text-[#042C51]">
              Resignation Process
            </h2>

            <p className="sibs-text-xs font-semibold text-[#667085]">
              From employee email submission to TL/OM filing, approval request,
              notice period, and HR/Admin completion.
            </p>
          </div>

          <span
            className={`mt-2 w-fit shrink-0 whitespace-nowrap ${EDGE} border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-1.5 2xl:px-4 2xl:py-2 sibs-text-xs font-bold text-[#344054] sm:mt-0`}
          >
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

        <div className={`mt-7 overflow-hidden ${EDGE} border border-[#E6ECF2]`}>
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
                <tr className="bg-white text-left text-xs font-bold uppercase text-sibs-tertiary-5">
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
        <div className={`min-w-0 ${EDGE} ${PANEL_BORDER} bg-white p-3.5 2xl:p-5`}>
          <div className="mb-3 2xl:mb-4 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase text-red-700">
                <TrendingDown className="h-3.5 w-3.5" />
                Trend
              </div>

              <h2 className="text-sm 2xl:text-base font-extrabold text-[#042C51]">
                Resignation Trend
              </h2>

              <p className="sibs-text-xs font-semibold text-[#667085]">
                Monthly filed resignations
              </p>
            </div>

            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center ${EDGE} bg-red-50 text-red-600`}
            >
              <TrendingDown size={19} />
            </div>
          </div>

          {loading ? (
            <div
              className={`flex h-40 items-center justify-center ${EDGE} border border-dashed border-[#D9E2EC] bg-[#F8FAFC]`}
            >
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
            <div
              className={`flex h-40 flex-col items-center justify-center ${EDGE} border border-dashed border-[#d9e2ec] bg-[#f8fafc] text-center`}
            >
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

        <div className={`${EDGE} border border-blue-100 bg-blue-50 p-3.5 2xl:p-5`}>
          <h3 className="text-sm 2xl:text-base font-extrabold text-[#042C51]">
            Approval Routing
          </h3>

          <p className="mt-2 2xl:mt-3 sibs-text-xs font-semibold leading-relaxed text-[#344054]">
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
    <section className="sibs-page-card-in sibs-card overflow-visible rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <PaginationTable
        filterLayout="ta-inline"
        showFilterPanel={false}
        showFilterHeader={false}
        showPagination={false}
        showSearch
        searchValue={search}
        searchPlaceholder="Search employee, SIBS ID, department, type, status, reason..."
        onSearchChange={(value) => setSearch(value)}
        filters={[
          {
            key: "status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: STATUS_OPTIONS.map((option) => ({
              label: option === "All" ? "All Statuses" : option,
              value: option,
            })),
            allLabel: "All Statuses",
            label: "Status",
            searchable: false,
            includeAll: false,
          },
          {
            key: "type",
            value: typeFilter,
            onChange: setTypeFilter,
            options: TYPE_OPTIONS.map((option) => ({
              label: option === "All" ? "All Types" : option,
              value: option,
            })),
            allLabel: "All Types",
            label: "Type",
            searchable: false,
            includeAll: false,
          },
        ]}
        rightContent={
          hasActiveFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-[#FFD9CC] bg-[#FFF8F5] px-4 text-xs font-extrabold text-[#FF5C28] transition hover:border-[#FF5C28] hover:bg-[#FFF0EB] xl:w-auto"
            >
              Clear
            </button>
          ) : null
        }
        className="border-0 bg-transparent p-0 shadow-none"
      />
    </section>
  );
}

function ResignationTableCard({
  data,
  loading,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  hasActiveFilters,
  onClearFilters,
  onView,
  onOpenAttachments,
}) {
  const [pageState, setPageState] = useState({ data, page: 1 });
  const totalPages = Math.max(Math.ceil(data.length / PAGE_LIMIT), 1);
  const currentPage = Math.min(
    Math.max(pageState.data === data ? pageState.page : 1, 1),
    totalPages,
  );

  const pageData = useMemo(() => {
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const start = (safePage - 1) * PAGE_LIMIT;
    return data.slice(start, start + PAGE_LIMIT);
  }, [data, currentPage, totalPages]);

  function handlePreviousPage() {
    setPageState((current) => ({
      data,
      page: Math.max(
        (current.data === data ? current.page : currentPage) - 1,
        1,
      ),
    }));
  }

  function handleNextPage() {
    setPageState((current) => ({
      data,
      page: Math.min(
        (current.data === data ? current.page : currentPage) + 1,
        totalPages,
      ),
    }));
  }

  return (
    <section className="sibs-profile-tab-panel sibs-page-card-in sibs-card min-w-0 overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm">
      <div className="border-b border-[#E6ECF2] bg-white px-3 py-2 2xl:px-5 2xl:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-0.5">
            <h2 className="text-sm 2xl:text-base font-extrabold text-[#042C51]">
              Employee Resignation Records
            </h2>

            <p className="sibs-text-xs font-semibold text-[#667085]">
              View filing details and submitted resignation attachments.
            </p>
          </div>
        </div>
      </div>

      <div className="relative overflow-visible p-3.5 sm:p-5">
        <PaginationTable
          filterLayout="ta-inline"
          showFilterPanel={false}
          showFilterHeader={false}
          showPagination={false}
          showSearch
          searchValue={search}
          searchPlaceholder="Search employee, SIBS ID, department, type, status, reason..."
          onSearchChange={(value) => setSearch(value)}
          filters={[
            {
              key: "status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: STATUS_OPTIONS.map((option) => ({
                label: option === "All" ? "All Statuses" : option,
                value: option,
              })),
              allLabel: "All Statuses",
              label: "Status",
              searchable: false,
              includeAll: false,
            },
            {
              key: "type",
              value: typeFilter,
              onChange: setTypeFilter,
              options: TYPE_OPTIONS.map((option) => ({
                label: option === "All" ? "All Types" : option,
                value: option,
              })),
              allLabel: "All Types",
              label: "Type",
              searchable: false,
              includeAll: false,
            },
          ]}
          rightContent={
            hasActiveFilters ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center rounded-lg border border-[#FFD9CC] bg-[#FFF8F5] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#FF5C28] transition hover:border-[#FF5C28] hover:bg-[#FFF0EB] xl:w-auto"
              >
                Clear
              </button>
            ) : null
          }
          className="border-0 bg-transparent p-0 shadow-none"
        />

        <div className="mt-5 hidden overflow-hidden rounded-xl border border-[#E6ECF2] lg:block">
          <div className="max-h-[620px] overflow-auto sibs-scrollbar">
            <table className="w-full min-w-[1380px] border-collapse bg-white text-left">
              <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
                <tr className="border-b border-[#E6ECF2]">
                  <th className="sibs-data-table-th px-2.5 py-2 2xl:px-4 2xl:py-3.5 w-[240px] whitespace-nowrap text-left">Employee</th>
                  <th className="sibs-data-table-th px-2.5 py-2 2xl:px-4 2xl:py-3.5 w-[190px] whitespace-nowrap text-left">Filed By</th>
                  <th className="sibs-data-table-th px-2.5 py-2 2xl:px-4 2xl:py-3.5 w-[110px] whitespace-nowrap text-center">Type</th>
                  <th className="sibs-data-table-th px-2.5 py-2 2xl:px-4 2xl:py-3.5 w-[140px] whitespace-nowrap text-center">Resignation Date</th>
                  <th className="sibs-data-table-th px-2.5 py-2 2xl:px-4 2xl:py-3.5 w-[150px] whitespace-nowrap text-center">Last Working Date</th>
                  <th className="sibs-data-table-th px-2.5 py-2 2xl:px-4 2xl:py-3.5 w-[150px] whitespace-nowrap text-center">Status</th>
                  <th className="sibs-data-table-th px-2.5 py-2 2xl:px-4 2xl:py-3.5 w-[220px] whitespace-nowrap text-left">Reason</th>
                  <th className="sibs-data-table-th px-2.5 py-2 2xl:px-4 2xl:py-3.5 w-[170px] whitespace-nowrap text-center">Attachments</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({ length: 7 }).map((_, index) => (
                    <tr key={index}>
                      <td colSpan={8} className="border-t border-[#EEF2F6] px-4 py-3.5">
                        <div className="h-5 w-full animate-sibs-pulse rounded bg-[#E9EEF5]" />
                      </td>
                    </tr>
                  ))
                ) : pageData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center text-sm font-bold text-[#667085]">
                      No resignation records found.
                    </td>
                  </tr>
                ) : (
                  pageData.map((item, index) => (
                    <ResignationRow
                      key={item?.id || item?.resignationId || index}
                      item={item}
                      onView={() => onView(item)}
                      onOpenAttachments={() => onOpenAttachments?.(item)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="block lg:hidden">
          {loading ? (
            <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-10 text-center text-sm font-bold text-[#667085]">
              <Loader2 size={28} className="mx-auto mb-3 animate-spin text-[#042C51]" />
              Loading resignations...
            </div>
          ) : pageData.length === 0 ? (
            <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-10 text-center text-sm font-bold text-[#667085]">
              No resignation records found.
            </div>
          ) : (
            <div className="space-y-3">
              {pageData.map((item, index) => (
                <ResignationMobileCard
                  key={item?.id || item?.resignationId || index}
                  item={item}
                  onView={() => onView(item)}
                  onOpenAttachments={() => onOpenAttachments?.(item)}
                />
              ))}
            </div>
          )}
        </div>

        <PaginationTable
          loading={loading}
          showSearch={false}
          showPagination
          showCount
          currentPage={currentPage}
          totalPages={totalPages}
          loadedCount={pageData.length}
          totalRecords={data.length}
          recordLabel="resignation records"
          onPrevious={handlePreviousPage}
          onNext={handleNextPage}
          className="border-0 bg-transparent p-0 shadow-none"
        />
      </div>
    </section>
  );
}

function ResignationRow({ item, onView, onOpenAttachments }) {
  const status = getResignationStatus(item);
  const employeeName = getFullName(item);
  const attachmentCount = getAttachmentCount(item);

  const filedBy =
    item?.filedByName ||
    item?.encodedByName ||
    item?.createdByName ||
    item?.supervisorName ||
    "TL / OM";

  const filedByRole =
    item?.filedByRole ||
    item?.encodedByRole ||
    item?.supervisorRole ||
    "Direct supervisor";

  const reason = item?.reason || item?.remarks || "—";
  const resignationDate =
    item?.resignationDate || item?.resignation_date || getItemDate(item);
  const lastWorkingDate = item?.lastWorkingDate || item?.last_working_date;
  const resignationType = item?.resignationType || item?.type || "—";

  function handleRowKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onView?.();
    }
  }

  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={handleRowKeyDown}
      title="Open resignation details"
      className="sibs-data-table-row"
    >
      <td className="border-t border-[#EEF2F6] px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 align-middle">
        <div className="flex min-w-0 items-center gap-3">
          <ProfileAvatar item={item} />
          <div className="min-w-0">
            <p title={employeeName} className="truncate sibs-text-xs font-extrabold text-[#101828]">{employeeName}</p>
            <p className="mt-0.5 truncate sibs-text-micro font-bold text-[#667085]">{getEmployeeSibsId(item)} · {getEmployeeDepartment(item)}</p>
          </div>
        </div>
      </td>
      <td className="border-t border-[#EEF2F6] px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 align-middle">
        <p className="truncate sibs-text-xs font-extrabold text-[#344054]">{filedBy}</p>
        <p className="mt-0.5 truncate sibs-text-micro font-bold text-[#667085]">{filedByRole}</p>
      </td>
      <td className="border-t border-[#EEF2F6] px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 text-center align-middle">
        <span className="inline-flex rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 py-1 sibs-text-micro font-extrabold text-[#344054]">{resignationType}</span>
      </td>
      <td className="border-t border-[#EEF2F6] px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 text-center sibs-text-xs font-bold text-[#344054]">{formatDate(resignationDate)}</td>
      <td className="border-t border-[#EEF2F6] px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 text-center sibs-text-xs font-bold text-[#344054]">{formatDate(lastWorkingDate)}</td>
      <td className="border-t border-[#EEF2F6] px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 text-center">
        <span className={`inline-flex min-w-[124px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 sibs-text-micro font-extrabold ${getStatusClass(status)}`}>
          {renderStatusIcon(status, 12)}
          {status}
        </span>
      </td>
      <td className="border-t border-[#EEF2F6] px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 sibs-text-xs font-semibold text-[#344054]">
        <p title={reason} className="truncate">{reason}</p>
      </td>
      <td className="border-t border-[#EEF2F6] px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 text-center">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenAttachments?.();
          }}
          disabled={attachmentCount === 0}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#FFD9CC] bg-[#FFF8F5] px-3 text-[11px] font-extrabold text-[#FF5C28] transition hover:border-[#FF5C28] hover:bg-[#FFF0EB] disabled:cursor-not-allowed disabled:border-[#E6ECF2] disabled:bg-[#F8FAFC] disabled:text-[#98A2B3]"
        >
          <Paperclip size={13} />
          {getAttachmentCountLabel(item)}
        </button>
      </td>
    </tr>
  );
}

function ResignationMobileCard({ item, onView, onOpenAttachments }) {
  const status = getResignationStatus(item);
  const attachmentCount = getAttachmentCount(item);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onView?.();
        }
      }}
      title="Open resignation details"
      className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm transition hover:border-[#FF5C28]/40 hover:bg-[#FFF9F6] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C28]/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <ProfileAvatar item={item} size="lg" />
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold leading-tight text-[#101828]">{getFullName(item)}</h3>
            <p className="mt-1 text-xs font-semibold text-[#667085]">{getEmployeeSibsId(item)} · {getEmployeeDepartment(item)}</p>
          </div>
        </div>
        <span className={`inline-flex min-w-[118px] shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${getStatusClass(status)}`}>
          {renderStatusIcon(status, 12)}
          {status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MobileMetric label="Type" value={item?.resignationType || item?.type} />
        <MobileMetric label="Date" value={formatDate(item?.resignationDate || getItemDate(item))} />
        <MobileMetric label="Last Working" value={formatDate(item?.lastWorkingDate || item?.last_working_date)} />
        <MobileMetric label="Filed By" value={item?.filedByName || item?.supervisorName || "TL / OM"} />
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenAttachments?.();
          }}
          disabled={attachmentCount === 0}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#042C51] px-4 text-xs font-extrabold text-white transition hover:bg-[#FF5C28] disabled:cursor-not-allowed disabled:bg-[#D0D5DD]"
        >
          <Paperclip size={15} />
          {getAttachmentCountLabel(item)}
        </button>
      </div>
    </article>
  );
}

function MobileMetric({ label, value }) {
  return (
    <div className={`${EDGE} bg-[#F8FAFC] p-3`}>
      <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-extrabold text-sibs-primary-1">
        {value || "--"}
      </p>
    </div>
  );
}

export default function ResignationManagementPage() {
  const { user } = useUser();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [openResignationForm, setOpenResignationForm] = useState(false);
  const [resignationSubmitting, setResignationSubmitting] = useState(false);

  const [resignations, setResignations] = useState([]);
  const [resignationLoading, setResignationLoading] = useState(false);
  const [selectedResignation, setSelectedResignation] = useState(null);
  const [attachmentResignation, setAttachmentResignation] = useState(null);

  const [managedEmployees, setManagedEmployees] = useState([]);
  const [employeePickerLoading, setEmployeePickerLoading] = useState(false);
  const [employeePickerSearch, setEmployeePickerSearch] = useState("");
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false);

  const [serverAccess, setServerAccess] = useState({
    viewOnly: false,
    canCreate: true,
    viewAll: false,
  });

  const mainScrollRef = useRef(null);

  const userRole = normalizeRoleKey(
    user?.role || user?.userRole || user?.adminRole || user?.position || "",
  );

  const userAdminAccess = Number(
    user?.adminAccess || user?.admin_access || user?.admin_level || 0,
  );

  const isHrViewOnlyByUser =
    userRole === "hr" || userRole === "hr_admin" || userAdminAccess === 4;

  const isExecutiveViewOnlyByUser =
    userRole === "executive" ||
    userRole === "exec" ||
    userRole === "executive_admin" ||
    userRole === "executive_viewer" ||
    userRole.includes("executive");

  const isViewOnly = Boolean(
    serverAccess.viewOnly || isHrViewOnlyByUser || isExecutiveViewOnlyByUser,
  );

  const canCreateResignation = Boolean(serverAccess.canCreate && !isViewOnly);

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
    profilePictureUrl: "",
    profile_picture_url: "",
    profileFilename: "",
    profile_filename: "",
    profilePicture: "",
    profile_picture: "",
    profileImage: "",
    profile_image: "",
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

  const fetchManagedEmployees = useCallback(
    async (searchValue = "") => {
      if (!canCreateResignation) {
        setManagedEmployees([]);
        return [];
      }

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
    },
    [canCreateResignation],
  );

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

      setServerAccess({
        viewOnly: Boolean(result?.viewOnly),
        canCreate: result?.canCreate !== false,
        viewAll: Boolean(result?.viewAll),
      });

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

  const handleOpenAttachments = useCallback((item) => {
    if (!item) return;
    setAttachmentResignation(item);
  }, []);

  const handleCloseAttachments = useCallback(() => {
    setAttachmentResignation(null);
  }, []);

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
    if (!canCreateResignation) {
      openStatus({
        type: "error",
        title: "View Only Access",
        message:
          "HR, HR Admin, and Executive can only view resignation requests.",
      });

      return;
    }

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
      profilePictureUrl: employee?.profilePictureUrl || "",
      profile_picture_url: employee?.profile_picture_url || "",
      profileFilename:
        employee?.profileFilename || employee?.profile_filename || "",
      profile_filename:
        employee?.profile_filename || employee?.profileFilename || "",
      profilePicture: employee?.profilePicture || employee?.profile_picture || "",
      profile_picture: employee?.profile_picture || employee?.profilePicture || "",
      profileImage: employee?.profileImage || employee?.profile_image || "",
      profile_image: employee?.profile_image || employee?.profileImage || "",
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

    if (!canCreateResignation) {
      openStatus({
        type: "error",
        title: "View Only Access",
        message:
          "HR, HR Admin, and Executive can only view resignation requests.",
      });

      return;
    }

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
    <div className="sibs-dashboard-shell flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main
        ref={mainScrollRef}
        className="sibs-dashboard-main-wide min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6 lg:p-7"
      >
        <div className="mx-auto w-full max-w-[1700px] space-y-4 sm:space-y-5">
          <section
            className="sibs-page-header-in sibs-page-card-in relative overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm 2xl:p-6"
            style={{ animationDelay: "0ms", animationFillMode: "both" }}
          >
            <span className="sibs-top-accent" aria-hidden="true" />

            <div className="mt-0.5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase text-[#042C51]">
                    <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-[#FF5C28]" />
                    Resignation Management View
                  </span>

                  <span className="inline-flex rounded border border-orange-200 bg-orange-50 px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase text-[#FF5C28]">
                    Module: Core HR
                  </span>

                  {isViewOnly && (
                    <span className="inline-flex rounded border border-slate-200 bg-slate-50 px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase text-[#667085]">
                      Read-Only Access
                    </span>
                  )}
                </div>

                <h1 className="break-words text-lg 2xl:text-2xl font-extrabold text-[#042C51]">
                  Resignation Management
                </h1>

                <p className="max-w-3xl sibs-text-sm font-semibold leading-relaxed text-[#667085]">
                  {isViewOnly
                    ? "View and monitor resignation requests. Approval decisions remain in Approval Request."
                    : "File, monitor, analyze, and track resignation records. Approval decisions remain in Approval Request."}
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={resignationLoading}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resignationLoading ? (
                    <Loader2 className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
                  )}
                  Refresh
                </button>

                {canCreateResignation && (
                  <button
                    type="button"
                    onClick={handleOpenAddResignation}
                    className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg bg-[#042C51] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white transition hover:bg-[#FF5C28]"
                  >
                    <Plus className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
                    New Resignation
                  </button>
                )}
              </div>
            </div>
          </section>

          <div className="relative z-[20] sibs-profile-tab-panel">
            <ResignationSummaryCards
              stats={stats}
              loading={resignationLoading}
            />
          </div>

          <div className="relative z-[0] sibs-profile-tab-panel">
            <ResignationAnalytics
              data={resignations}
              loading={resignationLoading}
            />
          </div>

          <div className="relative z-[10] sibs-profile-tab-panel">
            <ResignationTableCard
              data={filteredResignations}
              loading={resignationLoading}
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
              onView={setSelectedResignation}
              onOpenAttachments={handleOpenAttachments}
            />
          </div>
        </div>
      </main>

      <ResignationManagementModal
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
        onOpenAttachments={handleOpenAttachments}
        onClose={() => setSelectedResignation(null)}
      />

      <AttachmentsModal
        open={!!attachmentResignation}
        resignation={attachmentResignation}
        onClose={handleCloseAttachments}
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
