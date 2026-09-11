import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Loader2,
  Mail,
  Minus,
  Plus,
  RefreshCcw,
  RefreshCw,
  Send,
  TrendingDown,
  TrendingUp,
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
import { DataCard, PageHeaderHero, ResponsiveTableShell } from "@/components/ui";
import { useUser } from "../../services/context/UserContext";
import {
  ResignationManagementModal,
  ViewResignationModal,
} from "../../components/modals/resignation-management/ResignationManagementModal";
import {
  getManagedEmployees,
  getSupervisorResignations,
  saveSupervisorResignation,
} from "../../lib/axios/getResignationManagement";

import {
  formatDate,
  getTodayDate,
} from "../../components/layout/FormatDateTime";
import { findResignationNotificationTarget } from "../../lib/utils/notifications/auditNotificationHelpers";

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

const APPROVAL_PROCESS_ROUTES = [
  {
    key: "corporate",
    title: "Corporate Process",
    routeLabel: "OM / SOM",
    description: "Corporate accounts",
    stages: [
      { stage: "1", approver: "Operations Manager", role: "Department Head" },
      {
        stage: "2",
        approver: "Senior Operations Manager",
        role: "Final Operations Approval",
      },
    ],
  },
  {
    key: "non-corporate",
    title: "Non-Corporate Process",
    routeLabel: "TL / OM / SOM",
    description: "Operational and non-corporate accounts",
    stages: [
      { stage: "1", approver: "Team Leader", role: "Direct Supervisor" },
      { stage: "2", approver: "Operations Manager", role: "Department Head" },
      {
        stage: "3",
        approver: "Senior Operations Manager",
        role: "Final Operations Approval",
      },
    ],
  },
];


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

function getProfileAvatarPreviewPosition(element) {
  if (!element || typeof window === "undefined") return null;

  const rect = element.getBoundingClientRect();
  const previewHeight = 176;
  const gap = 12;
  const placeBelow = rect.top < previewHeight + gap;

  return {
    left: rect.left + rect.width / 2,
    top: placeBelow ? rect.bottom + gap : rect.top - gap,
    placeBelow,
  };
}

function ProfileAvatar({ item, size = "md" }) {
  const sibsId = getEmployeeSibsId(item);
  const avatarRef = useRef(null);
  const [fetchedEmployee, setFetchedEmployee] = useState(null);
  const [failedImageKey, setFailedImageKey] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(null);

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

  useEffect(() => {
    if (!previewVisible) return undefined;

    const updatePreviewPosition = () => {
      setPreviewPosition(
        getProfileAvatarPreviewPosition(
          avatarRef.current,
        ),
      );
    };

    window.addEventListener(
      "resize",
      updatePreviewPosition,
    );
    window.addEventListener(
      "scroll",
      updatePreviewPosition,
      true,
    );

    return () => {
      window.removeEventListener(
        "resize",
        updatePreviewPosition,
      );
      window.removeEventListener(
        "scroll",
        updatePreviewPosition,
        true,
      );
    };
  }, [previewVisible]);

  function showPreview() {
    if (!imageUrl || imageFailed) return;

    setPreviewPosition(
      getProfileAvatarPreviewPosition(
        avatarRef.current,
      ),
    );
    setPreviewVisible(true);
  }

  function hidePreview() {
    setPreviewVisible(false);
  }

  const sizeClass =
    size === "lg"
      ? "h-11 w-11"
      : size === "sm"
        ? "h-9 w-9"
        : "h-9 w-9";

  const avatarContent =
    imageUrl && !imageFailed ? (
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => {
          setFailedImageKey(imageKey);
          setPreviewVisible(false);
        }}
      />
    ) : (
      <UserRound
        size={size === "lg" ? 22 : 18}
        className="text-[#042C51]"
      />
    );

  const preview =
    previewVisible &&
    previewPosition &&
    imageUrl &&
    !imageFailed &&
    typeof document !== "undefined"
      ? createPortal(
          <span
            className="pointer-events-none fixed z-[9999] rounded-2xl border border-[#D9E6F2] bg-white p-2 shadow-[0_18px_45px_rgba(4,44,81,0.22)]"
            style={{
              left: previewPosition.left,
              top: previewPosition.top,
              transform: previewPosition.placeBelow
                ? "translate(-50%, 0)"
                : "translate(-50%, -100%)",
            }}
            aria-hidden="true"
          >
            <span className="relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-xl border border-[#D9E2EC] bg-[#F2F6FA]">
              <img
                src={imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                onError={() => {
                  setFailedImageKey(imageKey);
                  setPreviewVisible(false);
                }}
              />
            </span>
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={avatarRef}
        tabIndex={0}
        aria-label={`${getFullName(item) || "Employee"} profile picture`}
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
        onFocus={showPreview}
        onBlur={hidePreview}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        className={`relative inline-flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#D9E2EC] bg-[#F2F6FA] shadow-inner outline-none`}
      >
        {avatarContent}
      </span>

      {preview}
    </>
  );
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
            className="sibs-metric-card font-jakarta flex h-[104px] 2xl:h-[116px] min-h-[96px] 2xl:min-h-[112px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5"
            style={{
              animationDelay: `${index * 55}ms`,
              animationFillMode: "both",
            }}
          >
            <div className="flex h-full items-start justify-between gap-2.5 2xl:gap-3">
              <div className="min-w-0 flex-1 self-stretch flex flex-col justify-between h-full">
                <div>
                  <p
                    className={`m-0 truncate sibs-text-micro font-extrabold uppercase ${tone.label}`}
                  >
                    {card.title}
                  </p>

                  <p
                    className={`font-heading mt-1.5 2xl:mt-2 text-2xl 2xl:text-3xl font-bold leading-none tabular-nums tracking-tight ${tone.value}`}
                  >
                    {loading ? "..." : card.value}
                  </p>
                </div>

                <p className="mt-1 line-clamp-1 truncate sibs-text-micro font-semibold leading-tight text-[#667085]">
                  {card.description}
                </p>
              </div>

              <span
                className={`flex h-7.5 w-7.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full ${tone.iconWrap} ${tone.icon}`}
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

function ApprovalStageRow({ stage, approver, role }) {
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
  isLast = false,
}) {
  const IconComponent = icon;

  return (
    <div className="relative flex min-w-0 flex-1 lg:block">
      {/* Mobile Vertical Connecting Spine */}
      {!isLast && (
        <div
          className={`absolute left-4 top-8 -bottom-4 w-0.5 lg:hidden transition-colors ${
            done ? "bg-[#042C51]" : "bg-slate-200"
          }`}
          aria-hidden="true"
        />
      )}

      <div className="flex min-w-0 items-start gap-3.5 text-left lg:flex-col lg:items-center lg:text-center">
        <div
          className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white text-xs font-extrabold shadow-sm transition-all duration-300 2xl:h-9.5 2xl:w-9.5 2xl:border-4 ${
            done
              ? "bg-[#042C51] text-white"
              : active
                ? "scale-105 bg-[#FF5C28] text-white shadow-[#FF5C28]/20 ring-4 ring-[#FF5C28]/15"
                : "bg-[#EEF2F6] text-[#98A2B3]"
          }`}
        >
          {done ? (
            <CheckCircle2 className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
          ) : (
            <IconComponent className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
          )}
        </div>

        <div className="min-w-0 flex-1 pt-0.5 lg:mt-1.5 lg:pt-0 2xl:mt-2">
          <div className="flex flex-wrap items-center gap-1.5 lg:justify-center">
            <p
              className={`sibs-text-micro font-extrabold ${
                done || active ? "text-[#042C51]" : "text-[#98A2B3]"
              }`}
            >
              {number}. {title}
            </p>

            {active && (
              <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wide text-[#FF5C28] lg:hidden">
                Current
              </span>
            )}
          </div>

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

    const monthLabels = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-PH", {
        month: "short",
        timeZone: "Asia/Manila",
      });
      monthLabels.push(label);
    }

    const monthCounts = Object.fromEntries(monthLabels.map((m) => [m, 0]));

    data.forEach((item) => {
      const rawDate = getItemDate(item);
      if (!rawDate) return;

      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) return;

      const label = date.toLocaleDateString("en-PH", {
        month: "short",
        timeZone: "Asia/Manila",
      });

      if (monthCounts[label] !== undefined) {
        monthCounts[label] += 1;
      }
    });

    const trend = monthLabels.map((label) => [label, monthCounts[label] || 0]);
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

  return (
    <section className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[1.4fr_0.8fr]">
      <div className={`min-w-0 ${EDGE} ${PANEL_BORDER} bg-white p-3.5 2xl:p-5`}>
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
              Resignation Process
            </h2>

            <p className="sibs-text-xs font-semibold text-[#667085]">
              From employee email submission to TL/OM filing, approval request,
              notice period, and completion.
            </p>
          </div>

          <span
            className={`mt-2 w-fit shrink-0 whitespace-nowrap ${EDGE} border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-1.5 2xl:px-4 2xl:py-2 sibs-text-xs font-bold text-[#344054] sm:mt-0`}
          >
            Sequential Approval
          </span>
        </div>

        <div className="relative mt-5 sm:mt-6">
          <div className="absolute left-[8%] right-[8%] top-4 hidden h-0.5 bg-[#d9e2ec] lg:block 2xl:top-4.5" />

          <div className="relative flex flex-col gap-4 sm:gap-5 lg:grid lg:grid-cols-5 lg:gap-5">
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
              title="Resignation Filed"
              description="Authorized supervisor or manager files the resignation."
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
              isLast
            />
          </div>
        </div>

        <div className={`mt-7 overflow-hidden ${EDGE} border border-[#E6ECF2]`}>
          <div className="border-b border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3">
            <h3 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
              Approval Stages
            </h3>
            <p className="mt-0.5 sibs-text-xs font-semibold text-[#667085]">
              Reference approval flow for Corporate and Non-Corporate resignations.
            </p>
          </div>

          <div className="divide-y divide-[#E6ECF2]">
            {APPROVAL_PROCESS_ROUTES.map((route) => (
              <div key={route.key}>
                <div className="flex items-center justify-between gap-3 border-b border-[#E6ECF2] bg-white px-4 py-3">
                  <div className="min-w-0">
                    <p className="sibs-text-xs font-extrabold text-[#042C51]">
                      {route.title}
                    </p>
                    <p className="mt-0.5 sibs-text-micro font-semibold text-[#667085]">
                      {route.description}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md border border-[#E6ECF2] bg-[#F8FAFC] px-2 py-1 sibs-text-micro font-bold text-[#52637A]">
                    {route.routeLabel}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] border-collapse">
                    <thead>
                      <tr className="bg-white text-left text-xs font-bold uppercase text-sibs-tertiary-5">
                        <th className="px-4 py-3">Stage</th>
                        <th className="px-4 py-3">Approver</th>
                        <th className="px-4 py-3">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {route.stages.map((stage) => (
                        <ApprovalStageRow
                          key={`${route.key}-${stage.stage}`}
                          stage={stage.stage}
                          approver={stage.approver}
                          role={stage.role}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5">
        <div className={`min-w-0 ${EDGE} ${PANEL_BORDER} bg-white p-3.5 2xl:p-5`}>
          {(() => {
            const currentMonthValue =
              analytics.trend[analytics.trend.length - 1]?.[1] || 0;
            const prevMonthValue =
              analytics.trend[analytics.trend.length - 2]?.[1] || 0;
            const isTrendingUp = currentMonthValue > prevMonthValue;
            const isTrendingDown = currentMonthValue < prevMonthValue;

            return (
              <div className="mb-3 2xl:mb-4 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
                    Resignation Trend
                  </h2>

                  <p className="sibs-text-xs font-semibold text-[#667085]">
                    Monthly filed resignations
                  </p>
                </div>

                <div
                  className={`flex h-9 w-9 2xl:h-10 2xl:w-10 shrink-0 items-center justify-center rounded-xl ${
                    isTrendingUp
                      ? "bg-orange-50 text-[#FF5C28]"
                      : isTrendingDown
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-50 text-slate-500"
                  }`}
                  title={
                    isTrendingUp
                      ? "Trending upward compared to previous month"
                      : isTrendingDown
                        ? "Trending downward compared to previous month"
                        : "Steady compared to previous month"
                  }
                >
                  {isTrendingUp ? (
                    <TrendingUp size={18} />
                  ) : isTrendingDown ? (
                    <TrendingDown size={18} />
                  ) : (
                    <Minus size={18} />
                  )}
                </div>
              </div>
            );
          })()}

          {loading ? (
            <div
              className={`flex h-40 items-center justify-center ${EDGE} border border-dashed border-[#D9E2EC] bg-[#F8FAFC]`}
            >
              <Loader2 size={26} className="animate-spin text-sibs-primary-1" />
            </div>
          ) : analytics.trend.length > 0 ? (
            <div className="relative flex w-full aspect-[500/180] max-h-[190px] items-center justify-center overflow-hidden">
              {(() => {
                const width = 500;
                const height = 180;
                const padLeft = 40;
                const padRight = 28;
                const padTop = 26;
                const padBottom = 34;
                const plotWidth = width - padLeft - padRight;
                const plotHeight = height - padTop - padBottom;
                const baselineY = height - padBottom;

                // Scale domain with a minimum ceiling of 3 so a single resignation doesn't shoot to 100% height
                const yCeiling = Math.max(analytics.maxTrendValue || 0, 3);

                const points = analytics.trend.map(([label, value], idx) => {
                  const x =
                    padLeft +
                    (idx / Math.max(analytics.trend.length - 1, 1)) * plotWidth;
                  const ratio = Math.max(0, Math.min(1, value / yCeiling));
                  const y = padTop + (1 - ratio) * plotHeight;
                  return { x, y, label, value };
                });

                let curvePath = "";
                if (points.length > 0) {
                  curvePath = `M ${points[0].x} ${points[0].y}`;
                  for (let i = 0; i < points.length - 1; i++) {
                    const curr = points[i];
                    const next = points[i + 1];
                    const cpDist = (next.x - curr.x) * 0.45;
                    curvePath += ` C ${curr.x + cpDist} ${curr.y}, ${next.x - cpDist} ${next.y}, ${next.x} ${next.y}`;
                  }
                }

                const areaPath =
                  points.length > 0
                    ? `${curvePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
                    : "";

                return (
                  <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="h-full w-full overflow-visible"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <defs>
                      <linearGradient
                        id="resignationTrendGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#042C51" stopOpacity="0.22" />
                        <stop offset="85%" stopColor="#042C51" stopOpacity="0.02" />
                        <stop offset="100%" stopColor="#042C51" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    <line
                      x1={padLeft}
                      y1={padTop}
                      x2={width - padRight}
                      y2={padTop}
                      stroke="#F2F4F7"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <line
                      x1={padLeft}
                      y1={padTop + plotHeight / 2}
                      x2={width - padRight}
                      y2={padTop + plotHeight / 2}
                      stroke="#F2F4F7"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <line
                      x1={padLeft}
                      y1={baselineY}
                      x2={width - padRight}
                      y2={baselineY}
                      stroke="#E4E7EC"
                      strokeWidth="1.2"
                    />

                    {/* Y-axis Ticks */}
                    <text
                      x={padLeft - 10}
                      y={padTop + 3.5}
                      textAnchor="end"
                      className="text-[9px] font-bold fill-[#98A2B3]"
                    >
                      {yCeiling}
                    </text>
                    <text
                      x={padLeft - 10}
                      y={padTop + plotHeight / 2 + 3.5}
                      textAnchor="end"
                      className="text-[9px] font-bold fill-[#98A2B3]"
                    >
                      {Math.round(yCeiling / 2)}
                    </text>
                    <text
                      x={padLeft - 10}
                      y={baselineY + 3.5}
                      textAnchor="end"
                      className="text-[9px] font-bold fill-[#98A2B3]"
                    >
                      0
                    </text>

                    {/* Gradient Area */}
                    {areaPath ? (
                      <path
                        d={areaPath}
                        fill="url(#resignationTrendGradient)"
                        className="transition-all duration-300"
                      />
                    ) : null}

                    {/* Smooth Trend Line */}
                    {curvePath ? (
                      <path
                        d={curvePath}
                        fill="none"
                        stroke="#042C51"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-300"
                      />
                    ) : null}

                    {/* Data Points & Markers */}
                    {points.map((pt, idx) => {
                      const isZero = pt.value === 0;
                      return (
                        <g key={`${pt.label}-${idx}`} className="group cursor-pointer">
                          {/* Vertical hover guide */}
                          <line
                            x1={pt.x}
                            y1={padTop}
                            x2={pt.x}
                            y2={baselineY}
                            stroke="#042C51"
                            strokeOpacity="0.1"
                            strokeDasharray="2 2"
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                          />

                          {/* Outer halo for active points */}
                          {!isZero ? (
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="8.5"
                              fill="#FF5C28"
                              fillOpacity="0.16"
                              className="animate-pulse"
                            />
                          ) : null}

                          {/* Center Marker Dot */}
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isZero ? "3" : "4.5"}
                            fill={isZero ? "#CBD5E1" : "#FF5C28"}
                            stroke="#FFFFFF"
                            strokeWidth={isZero ? "1.5" : "2"}
                            className="transition-transform duration-200 group-hover:scale-125"
                          />

                          {/* Active Value Badge Pill above Point */}
                          {!isZero ? (
                            <g className="transition-transform duration-200">
                              <rect
                                x={pt.x - 9}
                                y={pt.y - 20}
                                width="18"
                                height="14"
                                rx="4"
                                fill="#042C51"
                              />
                              <text
                                x={pt.x}
                                y={pt.y - 10}
                                textAnchor="middle"
                                className="font-heading text-[9.5px] font-extrabold fill-white tabular-nums"
                              >
                                {pt.value}
                              </text>
                            </g>
                          ) : null}

                          {/* Month Label below baseline */}
                          <text
                            x={pt.x}
                            y={baselineY + 16}
                            textAnchor="middle"
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              !isZero ? "fill-sibs-navy font-extrabold" : "fill-[#94A3B8]"
                            }`}
                          >
                            {pt.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                );
              })()}
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
          <h3 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
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
              className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center rounded-lg border border-[#FFD9CC] bg-[#FFF8F5] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#FF5C28] transition hover:border-[#FF5C28] hover:bg-[#FFF0EB] xl:w-auto"
            >
              Clear Filters
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
    <section className="sibs-profile-tab-panel sibs-page-card-in sibs-card min-w-0 overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm font-jakarta">
      <div className="border-b border-[#E6ECF2] bg-white px-3 py-2 2xl:px-5 2xl:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-0.5">
            <h2 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
              Employee Resignation Records
            </h2>

            <p className="sibs-text-xs font-semibold text-[#667085]">
              View filing details, status, and resignation progress.
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

        <ResponsiveTableShell
          className="mt-5"
          desktopContent={
            <div className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-white">
              <div className="max-h-[620px] overflow-auto sibs-scrollbar">
                <table className="w-full min-w-[1380px] border-collapse bg-white text-left">
                  <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
                    <tr className="border-b border-[#E6ECF2]">
                      <th className="sibs-data-table-th px-2.5 py-2 2xl:px-4 2xl:py-3.5 w-[240px] whitespace-nowrap text-left">Employee Name</th>
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
                        <td colSpan={8} className="px-5 py-16 text-center sibs-text-sm font-bold text-[#667085]">
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
          }
          mobileContent={
            <div>
              {loading ? (
                <DataCard.Skeleton count={4} />
              ) : pageData.length === 0 ? (
                <DataCard.Empty
                  icon={<FileText size={22} />}
                  title="No resignation records found"
                  description="Adjust the search or filter criteria to see results."
                />
              ) : (
                <div className="space-y-3">
                  {pageData.map((item, index) => (
                    <ResignationMobileCard
                      key={item?.id || item?.resignationId || index}
                      item={item}
                      index={index}
                      onView={() => onView(item)}
                      onOpenAttachments={() => onOpenAttachments?.(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          }
        />

        <div className="mt-4">
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
      </div>
    </section>
  );
}

function ResignationRow({ item, index = 0, onView }) {
  const status = getResignationStatus(item);
  const employeeName = getFullName(item);

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
    item?.resignationDate ||
    item?.resignation_date ||
    getItemDate(item);
  const lastWorkingDate =
    item?.lastWorkingDate ||
    item?.last_working_date;
  const resignationType =
    item?.resignationType ||
    item?.type ||
    "—";

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
      className="sibs-data-table-row sibs-page-card-in"
      style={{
        animationDelay: `${index * 35}ms`,
        animationFillMode: "both",
      }}
    >
      <td className="whitespace-nowrap px-3 py-2 2xl:px-4 2xl:py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="shrink-0"
            onClick={(event) =>
              event.stopPropagation()
            }
            onKeyDown={(event) =>
              event.stopPropagation()
            }
          >
            <ProfileAvatar item={item} />
          </div>

          <div className="min-w-0">
            <p
              title={employeeName}
              className="m-0 max-w-[300px] truncate sibs-text-xs font-extrabold text-[#042C51]"
            >
              {employeeName}
            </p>

            <p className="mt-0.5 max-w-[300px] truncate sibs-text-micro font-bold text-[#667085]">
              <span className="font-extrabold text-[#FF5C28]">
                {getEmployeeSibsId(item)}
              </span>
              {" · "}
              {getEmployeeDepartment(item)}
            </p>
          </div>
        </div>
      </td>

      <td className="whitespace-nowrap px-3 py-2 2xl:px-4 2xl:py-2.5">
        <p
          title={filedBy}
          className="m-0 max-w-[250px] truncate sibs-text-xs font-extrabold text-[#344054]"
        >
          {filedBy}
        </p>
        <p className="mt-0.5 max-w-[250px] truncate sibs-text-micro font-bold text-[#667085]">
          {filedByRole}
        </p>
      </td>

      <td className="whitespace-nowrap px-3 py-2 text-center 2xl:px-4 2xl:py-2.5">
        <span className="inline-flex items-center justify-center rounded-md border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 py-1 sibs-text-micro font-extrabold text-[#344054]">
          {resignationType}
        </span>
      </td>

      <td className="whitespace-nowrap px-3 py-2 text-center sibs-text-xs font-semibold text-[#52637A] 2xl:px-4 2xl:py-2.5">
        {formatDate(resignationDate)}
      </td>

      <td className="whitespace-nowrap px-3 py-2 text-center sibs-text-xs font-semibold text-[#52637A] 2xl:px-4 2xl:py-2.5">
        {formatDate(lastWorkingDate)}
      </td>

      <td className="whitespace-nowrap px-3 py-2 text-center sibs-text-xs 2xl:px-4 2xl:py-2.5">
        <span
          className={`inline-flex min-w-[124px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${getStatusClass(
            status,
          )}`}
        >
          {renderStatusIcon(status, 12)}
          {status}
        </span>
      </td>

      <td className="px-3 py-2 sibs-text-xs font-semibold text-[#344054] 2xl:px-4 2xl:py-2.5">
        <p
          title={reason}
          className="m-0 max-w-[260px] truncate"
        >
          {reason}
        </p>
      </td>
    </tr>
  );
}

function ResignationMobileCard({ item, index = 0, onView, onOpenAttachments }) {
  const status = getResignationStatus(item);
  const attachmentCount = getAttachmentCount(item);
  const reason = item?.reason || item?.remarks || "";

  return (
    <DataCard
      onClick={onView}
      index={index}
      title="Open resignation details"
    >
      <DataCard.Header
        avatar={<ProfileAvatar item={item} size="md" />}
        title={getFullName(item)}
        subtitle={
          <span className="truncate">
            <span className="font-extrabold text-[#FF5C28]">{getEmployeeSibsId(item)}</span> · {getEmployeeDepartment(item)}
          </span>
        }
        badge={
          <span className={`inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${getStatusClass(status)}`}>
            {renderStatusIcon(status, 11)}
            {status}
          </span>
        }
      />

      <DataCard.Metrics cols={2} className="mt-3">
        <DataCard.MetricItem label="Type" value={item?.resignationType || item?.type || "—"} />
        <DataCard.MetricItem label="Date" value={formatDate(item?.resignationDate || getItemDate(item))} />
        <DataCard.MetricItem label="Last Working" value={formatDate(item?.lastWorkingDate || item?.last_working_date)} />
        <DataCard.MetricItem label="Filed By" value={item?.filedByName || item?.supervisorName || "TL / OM"} />
      </DataCard.Metrics>

      {reason ? (
        <div className="mt-2.5 rounded-lg border border-slate-100 bg-[#F8FAFC] px-2.5 py-1.5 text-left">
          <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">Reason</p>
          <p className="mt-0.5 line-clamp-2 text-xs font-semibold text-[#344054]">
            {reason}
          </p>
        </div>
      ) : null}

      <div className="mt-3">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenAttachments?.();
          }}
          disabled={attachmentCount === 0}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#042C51] px-4 text-xs font-extrabold text-white transition hover:bg-[#FF5C28] disabled:cursor-not-allowed disabled:bg-[#D0D5DD]"
        >
          <Paperclip size={14} />
          {getAttachmentCountLabel(item)}
        </button>
      </div>
    </DataCard>
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
  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [openResignationForm, setOpenResignationForm] = useState(false);
  const [resignationSubmitting, setResignationSubmitting] = useState(false);

  const [resignations, setResignations] = useState([]);
  const [resignationLoading, setResignationLoading] = useState(false);
  const [resignationsLoaded, setResignationsLoaded] = useState(false);
  const [selectedResignation, setSelectedResignation] = useState(null);

  const [managedEmployees, setManagedEmployees] = useState([]);
  const [employeePickerLoading, setEmployeePickerLoading] = useState(false);
  const [employeePickerError, setEmployeePickerError] = useState("");
  const [employeePickerSearch, setEmployeePickerSearch] = useState("");
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false);

  const [serverAccess, setServerAccess] = useState({
    viewOnly: false,
    canCreate: true,
    viewAll: false,
  });

  const mainScrollRef = useRef(null);
  const employeePickerRequestRef = useRef(0);

  const userRole = normalizeRoleKey(
    user?.role || user?.userRole || user?.adminRole || user?.position || "",
  );

  const userAdminAccess = Number(
    user?.adminAccess || user?.admin_access || user?.admin_level || 0,
  );

  const assignedAdminAccesses = Array.isArray(user?.assignedAccounts)
    ? user.assignedAccounts
        .map((account) =>
          Number(
            account?.adminAccess ??
              account?.admin_access ??
              account?.access ??
              0,
          ),
        )
        .filter((value) => Number.isFinite(value))
    : [];

  const operationsManagerRoleCandidates = [
    userRole,
    user?.position,
    user?.positionName,
    user?.position_name,
    user?.jobTitle,
    user?.job_title,
    user?.designation,
    user?.employeeRole,
    user?.employee_role,
  ]
    .map(normalizeRoleKey)
    .filter(Boolean);

  const isOperationsManagerFiler =
    userAdminAccess === 5 ||
    assignedAdminAccesses.includes(5) ||
    operationsManagerRoleCandidates.some((role) =>
      ["manager", "operations_manager", "operationsmanager", "om"].includes(
        role,
      ),
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
    omPersonallySpoken: "",
    omEmployeeRetained: "",
    omActionTaken: "",
    omRemarks: "",
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
        setEmployeePickerError("");
        return [];
      }

      const requestId = employeePickerRequestRef.current + 1;
      employeePickerRequestRef.current = requestId;

      try {
        setEmployeePickerLoading(true);
        setEmployeePickerError("");

        const result = await getManagedEmployees({
          page: 1,
          limit: 100,
          search: searchValue,
        });

        if (requestId !== employeePickerRequestRef.current) {
          return [];
        }

        if (!result?.success) {
          const message =
            result?.message || "Failed to load employees under management.";

          setManagedEmployees([]);
          setEmployeePickerError(message);
          return [];
        }

        const data = Array.isArray(result.data) ? result.data : [];
        setManagedEmployees(data);
        setEmployeePickerError("");

        return data;
      } catch (error) {
        console.error("FETCH MANAGED EMPLOYEES ERROR:", error);

        if (requestId === employeePickerRequestRef.current) {
          setManagedEmployees([]);
          setEmployeePickerError(
            error?.response?.data?.message ||
              error?.response?.data?.error ||
              error?.message ||
              "Failed to load employees under management.",
          );
        }

        return [];
      } finally {
        if (requestId === employeePickerRequestRef.current) {
          setEmployeePickerLoading(false);
        }
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
      setResignationsLoaded(true);
    }
  }, []);

  const handleResignationApprovalUpdated = useCallback(
    async ({ resignationId } = {}) => {
      const refreshed = await fetchResignations();

      const updatedItem = refreshed.find((item) =>
        String(
          item?.id || item?.resignationId || item?.resignation_id || "",
        ) === String(resignationId || ""),
      );

      if (updatedItem) {
        setSelectedResignation(updatedItem);
      }

      return updatedItem || null;
    },
    [fetchResignations],
  );

  useEffect(() => {
    fetchResignations();
  }, [fetchResignations]);

  useEffect(() => {
    const navigationState = location.state;

    if (
      !navigationState?.openResignationDetails ||
      navigationState?.source !== "resignation-review-notification" ||
      resignationLoading ||
      !resignationsLoaded
    ) {
      return;
    }

    const targetResignation = findResignationNotificationTarget(
      resignations,
      navigationState,
    );

    if (targetResignation) {
      setSelectedResignation(targetResignation);
    }

    const remainingState = { ...navigationState };
    delete remainingState.openResignationDetails;
    delete remainingState.resignationId;
    delete remainingState.employeeSibsId;
    delete remainingState.employeeName;
    delete remainingState.source;

    navigate(
      `${location.pathname}${location.search}${location.hash}`,
      {
        replace: true,
        state: Object.keys(remainingState).length ? remainingState : null,
      },
    );
  }, [
    location.hash,
    location.pathname,
    location.search,
    location.state,
    navigate,
    resignationLoading,
    resignations,
    resignationsLoaded,
  ]);

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
    setEmployeePickerError("");
    setEmployeePickerOpen(false);
    setOpenResignationForm(true);
    fetchManagedEmployees("");
  }

  function closeResignationFormModal() {
    if (resignationSubmitting) return;

    setOpenResignationForm(false);
    setEmployeePickerSearch("");
    setEmployeePickerError("");
    setEmployeePickerOpen(false);
    resetResignationForm();
    forceUnlockPageScroll();
  }

  function clearSelectedEmployee() {
    setResignationForm((prev) => ({
      ...prev,
      employeeSibsId: "",
      employeeName: "",
      department: "",
      account: "",
      uploadedFile: null,
      omPersonallySpoken: "",
      omEmployeeRetained: "",
      omActionTaken: "",
      omRemarks: "",
      profilePictureUrl: "",
      profile_picture_url: "",
      profileFilename: "",
      profile_filename: "",
      profilePicture: "",
      profile_picture: "",
      profileImage: "",
      profile_image: "",
    }));
  }

  function handleEmployeePickerSearchChange(value) {
    const nextValue = String(value || "");

    if (resignationForm.employeeSibsId) {
      clearSelectedEmployee();
    }

    setEmployeePickerSearch(nextValue);
    setEmployeePickerOpen(true);
    fetchManagedEmployees(nextValue);
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
    setEmployeePickerError("");
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

    if (!["Formal", "Immediate"].includes(resignationForm.resignationType)) {
      return "Please select a valid resignation type.";
    }

    if (!resignationForm.uploadedFile) {
      return "Please attach the resignation email before submitting.";
    }

    const file = resignationForm.uploadedFile;
    const allowedExtensions = new Set([
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "csv",
      "jpg",
      "jpeg",
      "png",
      "heic",
      "heif",
    ]);
    const extension = String(file?.name || "")
      .split(".")
      .pop()
      ?.toLowerCase();

    if (!extension || !allowedExtensions.has(extension)) {
      return "The email attachment must be PDF, DOC, DOCX, XLS, XLSX, CSV, JPG, JPEG, PNG, HEIC, or HEIF.";
    }

    if (Number(file?.size || 0) > 15 * 1024 * 1024) {
      return "The email attachment must not exceed 15 MB.";
    }

    if (!String(resignationForm.reason || "").trim()) {
      return "Please enter the resignation reason or email summary.";
    }

    if (isOperationsManagerFiler) {
      if (!["Yes", "No"].includes(resignationForm.omPersonallySpoken)) {
        return "Please select whether you personally spoke with the employee.";
      }

      if (!["Yes", "No"].includes(resignationForm.omEmployeeRetained)) {
        return "Please select whether the employee was retained.";
      }

      if (
        resignationForm.omPersonallySpoken === "Yes" &&
        !String(resignationForm.omActionTaken || "").trim()
      ) {
        return "Action Taken is required when Personally Spoken is Yes.";
      }
    }

    const resignationDate = new Date(`${resignationForm.resignationDate}T00:00:00`);
    const lastWorkingDate = new Date(`${resignationForm.lastWorkingDate}T00:00:00`);

    if (
      Number.isNaN(resignationDate.getTime()) ||
      Number.isNaN(lastWorkingDate.getTime())
    ) {
      return "Please provide valid resignation and last working dates.";
    }

    const dayDifference = Math.round(
      (lastWorkingDate.getTime() - resignationDate.getTime()) /
        (24 * 60 * 60 * 1000),
    );

    if (dayDifference < 0) {
      return "Last working date cannot be earlier than the resignation date.";
    }

    if (resignationForm.resignationType === "Formal" && dayDifference !== 30) {
      return "Formal resignation must have a last working date exactly 30 days after the resignation date.";
    }

    if (
      resignationForm.resignationType === "Immediate" &&
      (dayDifference < 1 || dayDifference > 29)
    ) {
      return "Immediate resignation must have a last working date from 1 to 29 days after the resignation date.";
    }

    return "";
  }

  async function handleSubmitResignation(e) {
    e.preventDefault();

    if (resignationSubmitting) return;

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
        omPersonallySpoken: resignationForm.omPersonallySpoken,
        omEmployeeRetained: resignationForm.omEmployeeRetained,
        omActionTaken: resignationForm.omActionTaken,
        omRemarks: resignationForm.omRemarks,
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
      setEmployeePickerError("");
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
        className="sibs-dashboard-main-wide"
      >
        <div className="mx-auto w-full max-w-[1700px] space-y-4 sm:space-y-5">
          <PageHeaderHero
            kicker={
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-navy">
                  <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-sibs-orange" />
                  Core HR View
                </span>

                {isViewOnly && (
                  <span className="inline-flex rounded border border-slate-200 bg-slate-50 px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase text-[#667085]">
                    Read-Only Access
                  </span>
                )}
              </div>
            }
            title="Resignation Management"
            description={
              isViewOnly
                ? "View and monitor resignation requests. Approval decisions remain in Approval Request."
                : "File, monitor, analyze, and track resignation records. Approval decisions remain in Approval Request."
            }
            actions={
              <>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={resignationLoading}
                  title="Refresh Resignation Data"
                  className="sibs-btn-icon"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                      resignationLoading ? "animate-spin text-sibs-orange" : ""
                    }`}
                  />
                </button>

                {canCreateResignation && (
                  <button
                    type="button"
                    onClick={handleOpenAddResignation}
                    className="sibs-btn-primary max-sm:flex-1"
                  >
                    <Plus className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-white" />
                    New Resignation
                  </button>
                )}
              </>
            }
          />

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
        employeePickerError={employeePickerError}
        employeePickerSearch={employeePickerSearch}
        employeePickerOpen={employeePickerOpen}
        onEmployeePickerOpenChange={setEmployeePickerOpen}
        onEmployeePickerSearchChange={handleEmployeePickerSearchChange}
        onSelectManagedEmployee={handleSelectManagedEmployee}
        onClose={closeResignationFormModal}
        onChange={handleResignationChange}
        onSubmit={handleSubmitResignation}
        showOperationsManagerApprovalFields={isOperationsManagerFiler}
      />

      <ViewResignationModal
        open={!!selectedResignation}
        item={selectedResignation}
        currentUser={user}
        onApprovalUpdated={handleResignationApprovalUpdated}
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
