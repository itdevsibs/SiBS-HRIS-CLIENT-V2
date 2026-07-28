import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Loader2,
  Paperclip,
  Search,
  UserRound,
  UserX,
  X,
  XCircle,
} from "lucide-react";

import { formatDate } from "../../layout/FormatDateTime";

const RESIGNATION_TYPES = ["Formal", "Immediate"];

const EDGE = "rounded-[10px]";
const PANEL_EDGE = "rounded-[10px]";
const FIELD_HEIGHT = "h-11";
const FIELD_BORDER = "border border-[#D0D5DD]";
const FIELD_BASE =
  "w-full rounded-[10px] border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-sibs-primary-1 outline-none transition placeholder:text-gray-400 hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10";

const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5001";

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

function safeText(value, fallback = "--") {
  const text = String(value || "").trim();
  return text || fallback;
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(dateString, days) {
  const base = parseLocalDate(dateString) || parseLocalDate(getTodayDate());
  const date = new Date(base);

  date.setDate(date.getDate() + days);

  return toDateValue(date);
}

function getImmediateMinDate(resignationDate) {
  return addDays(resignationDate || getTodayDate(), 1);
}

function getImmediateMaxDate(resignationDate) {
  return addDays(resignationDate || getTodayDate(), 29);
}

function parseLocalDate(value) {
  if (!value) return null;

  const [year, month, day] = String(value).split("-").map(Number);

  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function toDateValue(date) {
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isSameDate(a, b) {
  if (!a || !b) return false;

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isDateBefore(date, minDate) {
  if (!date || !minDate) return false;

  const cleanDate = new Date(date);
  const cleanMin = parseLocalDate(minDate);

  cleanDate.setHours(0, 0, 0, 0);
  cleanMin?.setHours(0, 0, 0, 0);

  return cleanMin ? cleanDate < cleanMin : false;
}

function isDateAfter(date, maxDate) {
  if (!date || !maxDate) return false;

  const cleanDate = new Date(date);
  const cleanMax = parseLocalDate(maxDate);

  cleanDate.setHours(0, 0, 0, 0);
  cleanMax?.setHours(0, 0, 0, 0);

  return cleanMax ? cleanDate > cleanMax : false;
}

function formatModalDateLabel(value) {
  const parsed = parseLocalDate(value);

  if (!parsed) return "Select date";

  return parsed.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatMonthYear(date) {
  return date.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "long",
    year: "numeric",
  });
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

  return `${API_URL}/api/employee-profile/file/${encodeURIComponent(filename)}`;
}

function ProfileAvatar({ item, size = "md" }) {
  const sibsId = getEmployeeSibsId(item);
  const [fetchedEmployee, setFetchedEmployee] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);

  const mergedItem = {
    ...(item || {}),
    ...(fetchedEmployee || {}),
  };

  const imageUrl = getProfileImageUrl(mergedItem);

  const shouldFetchProfile =
    sibsId &&
    sibsId !== "--" &&
    !getProfileImageUrl(item || {}) &&
    !fetchedEmployee;

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl, sibsId]);

  useEffect(() => {
    if (!shouldFetchProfile) return undefined;

    const controller = new AbortController();

    async function fetchEmployeeProfile() {
      try {
        const response = await fetch(
          `${API_URL}/api/employees/${encodeURIComponent(sibsId)}`,
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
    e.stopPropagation();

    if (!imageUrl || imageFailed) return;

    window.open(imageUrl, "_blank", "noopener,noreferrer");
  }

  function handleProfileKeyDown(e) {
    if (e.key !== "Enter" && e.key !== " ") return;

    e.preventDefault();
    e.stopPropagation();
    handleOpenProfile(e);
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
        onError={() => setImageFailed(true)}
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center text-sibs-primary-1">
        <UserRound size={size === "lg" ? 24 : 20} />
      </div>
    );

  if (imageUrl && !imageFailed) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpenProfile}
        onKeyDown={handleProfileKeyDown}
        title="Open profile picture"
        className={`group flex ${sizeClass} shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-[#D9E2EC] bg-[#F2F6FA] shadow-sm outline-none transition hover:scale-[1.03] hover:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10`}
      >
        {avatarContent}
      </div>
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

function getUploadedFileDisplayName(item) {
  return (
    item?.uploadedFile ||
    item?.uploaded_file ||
    item?.uploadedFileName ||
    item?.fileName ||
    ""
  );
}

function normalizeUploadedFileUrl(url) {
  const cleanUrl = String(url || "").trim();

  if (!cleanUrl || cleanUrl === "#") return "";

  if (/^https?:\/\//i.test(cleanUrl)) return cleanUrl;

  const apiBase = String(API_URL || "").replace(/\/$/, "");

  if (cleanUrl.startsWith("/") && apiBase) {
    return `${apiBase}${cleanUrl}`;
  }

  if (apiBase) {
    return `${apiBase}/${cleanUrl.replace(/^\/+/, "")}`;
  }

  return cleanUrl;
}

function getUploadedFileUrl(item) {
  const directUrl =
    item?.uploadedFileUrl ||
    item?.uploaded_file_url ||
    item?.fileUrl ||
    item?.file_url ||
    "";

  if (directUrl) {
    return normalizeUploadedFileUrl(directUrl);
  }

  const fileName = getUploadedFileDisplayName(item);
  const sibsId = getEmployeeSibsId(item);

  if (fileName && sibsId && sibsId !== "--") {
    return `${String(API_URL || "").replace(
      /\/$/,
      "",
    )}/api/resignation/file/${encodeURIComponent(
      sibsId,
    )}/${encodeURIComponent(fileName)}`;
  }

  return "";
}

function FileTypeIcon({ filename }) {
  const ext = String(filename || "").split(".").pop()?.toLowerCase() || "";

  const isImage = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "svg",
    "heic",
    "heif",
  ].includes(ext);

  const isPdf = ext === "pdf";
  const isExcel = ["xls", "xlsx", "csv"].includes(ext);
  const isWord = ["doc", "docx"].includes(ext);

  const label = isImage
    ? "IMG"
    : isPdf
      ? "PDF"
      : isExcel
        ? "XLS"
        : isWord
          ? "DOC"
          : "FILE";

  const badgeClass = isImage
    ? "bg-purple-600"
    : isPdf
      ? "bg-red-600"
      : isExcel
        ? "bg-green-600"
        : isWord
          ? "bg-blue-600"
          : "bg-gray-600";

  return (
    <div className="relative h-12 w-10 shrink-0">
      <div className="absolute inset-0 rounded-[6px] border-2 border-gray-300 bg-white" />
      <div className="absolute right-0 top-0 h-3 w-3 border-b-2 border-l-2 border-gray-300 bg-gray-100" />
      <div className="absolute left-1 top-1/2 h-0.5 w-6 -translate-y-1/2 bg-gray-300" />
      <div className="absolute left-1 top-[60%] h-0.5 w-5 bg-gray-300" />

      <div
        className={`absolute bottom-1 left-[-8px] rounded-[6px] px-2 py-1 text-[10px] font-bold leading-none text-white shadow-sm ${badgeClass}`}
      >
        {label}
      </div>
    </div>
  );
}

function DropdownPortal({
  open,
  anchorRef,
  children,
  onClose,
  maxHeight = 256,
  minWidth = 260,
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
      const viewportWidth = window.innerWidth;

      const dropdownWidth = Math.min(
        Math.max(rect.width, minWidth),
        viewportWidth - 32,
      );

      const safeLeft = Math.min(
        Math.max(16, rect.left),
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
  }, [open, anchorRef, minWidth]);

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
      className={`fixed z-[999999] overflow-hidden ${EDGE} border border-[#D7DEE8] bg-white shadow-lg`}
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
      className={`fixed z-[999999] overflow-hidden ${EDGE} border border-[#D7DEE8] bg-white shadow-lg`}
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

function DatePickerPortal({ open, anchorRef, children, onClose }) {
  const pickerRef = useRef(null);
  const [style, setStyle] = useState({
    top: 0,
    left: 0,
    width: 310,
  });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return undefined;

    function updatePosition() {
      const rect = anchorRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const pickerWidth = Math.min(320, viewportWidth - 32);

      const safeLeft = Math.min(
        Math.max(16, rect.left),
        viewportWidth - pickerWidth - 16,
      );

      setStyle({
        top: rect.bottom + 8,
        left: safeLeft,
        width: pickerWidth,
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
      const clickedPicker = pickerRef.current?.contains(e.target);

      if (!clickedAnchor && !clickedPicker) {
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
      ref={pickerRef}
      className={`fixed z-[999999] overflow-hidden ${EDGE} border border-[#D7DEE8] bg-white shadow-lg`}
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

function CalendarPopover({
  value,
  onSelect,
  onClear,
  onToday,
  minDate = "",
  maxDate = "",
}) {
  const selectedDate = parseLocalDate(value);
  const today = new Date();

  const [viewDate, setViewDate] = useState(
    selectedDate || new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const calendarStart = new Date(monthStart);

  calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay());

  const days = Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });

  function goPreviousMonth() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goNextMonth() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function isDateDisabled(date) {
    return isDateBefore(date, minDate) || isDateAfter(date, maxDate);
  }

  return (
    <div className="bg-white">
      <div className="flex items-center justify-between border-b border-[#E6ECF2] px-5 py-4">
        <button
          type="button"
          onClick={goPreviousMonth}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sibs-primary-1 transition hover:bg-[#F2F6FA]"
        >
          <ChevronLeft size={18} />
        </button>

        <p className="text-sm font-extrabold text-sibs-primary-1">
          {formatMonthYear(viewDate)}
        </p>

        <button
          type="button"
          onClick={goNextMonth}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sibs-primary-1 transition hover:bg-[#F2F6FA]"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="px-5 py-4">
        <div className="grid grid-cols-7 gap-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div
              key={day}
              className="flex h-8 items-center justify-center text-xs font-extrabold text-[#2F6CA5]"
            >
              {day}
            </div>
          ))}

          {days.map((date) => {
            const isCurrentMonth = date.getMonth() === viewDate.getMonth();
            const selected = selectedDate && isSameDate(date, selectedDate);
            const current = isSameDate(date, today);
            const disabled = isDateDisabled(date);

            return (
              <button
                key={date.toISOString()}
                type="button"
                disabled={disabled}
                onClick={() => onSelect?.(toDateValue(date))}
                className={`flex h-9 w-9 items-center justify-center rounded-full border-0 text-sm font-extrabold shadow-none transition ${
                  disabled
                    ? "cursor-not-allowed bg-transparent text-slate-300"
                    : selected
                      ? "bg-[#E7F0FA] text-sibs-primary-1"
                      : current
                        ? "bg-[#EAF2FB] text-sibs-primary-1"
                        : isCurrentMonth
                          ? "bg-transparent text-sibs-primary-1 hover:bg-[#F2F6FA]"
                          : "bg-transparent text-slate-400 hover:bg-[#F8FAFC]"
                }`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#E6ECF2] px-5 py-4">
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-extrabold text-[#2F6CA5] transition hover:text-sibs-primary-1"
        >
          Clear
        </button>

        <button
          type="button"
          onClick={() => onToday?.(toDateValue(today))}
          className="text-sm font-extrabold text-sibs-primary-1 transition hover:text-[#2F6CA5]"
        >
          Today
        </button>
      </div>
    </div>
  );
}

function EmployeePickerField({
  label,
  selectedSibsId,
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
    <div className="relative min-w-0">
      <label className="mb-2 block text-sm font-bold text-sibs-primary-1">
        {label}
      </label>

      <button
        ref={anchorRef}
        type="button"
        onClick={() => onOpenChange?.(!open)}
        className={`flex ${FIELD_HEIGHT} w-full min-w-0 items-center justify-between gap-3 ${EDGE} ${FIELD_BORDER} bg-white px-4 text-left text-sm font-bold outline-none transition ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : "hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC]"
        }`}
      >
        <span
          className={`block min-w-0 flex-1 truncate whitespace-nowrap ${
            selectedSibsId ? "text-sibs-primary-1" : "text-gray-400"
          }`}
          title={selectedSibsId || "Select employee under your management"}
        >
          {selectedSibsId || "Select employee under your management"}
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-primary-1 transition-transform ${
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
              className={`h-10 ${FIELD_BASE} pl-9`}
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
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                  selectedSibsId === employee.sibsId
                    ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                    : "text-sibs-primary-1 hover:bg-[#F8FAFC]"
                }`}
              >
                <ProfileAvatar item={employee} size="sm" />

                <div className="min-w-0 flex-1">
                  <span className="block truncate font-bold">
                    {employee.sibsId || "N/A"} -{" "}
                    {employee.fullName || "Unnamed Employee"}
                  </span>

                  <span className="mt-1 block truncate text-xs font-semibold text-sibs-tertiary-5">
                    {employee.department || "No department"}
                    {employee.account ? ` · ${employee.account}` : ""}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </EmployeeDropdownPortal>
    </div>
  );
}

function ModalSelectField({
  label,
  value,
  options = [],
  placeholder = "Select",
  onSelect,
  disabled = false,
  completed = false,
  showCompletion = true,
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  function handleSelect(option) {
    onSelect?.(option);
    setOpen(false);
  }

  return (
    <div className="min-w-0">
      <FormFieldLabel
        label={label}
        completed={completed}
        showCompletion={showCompletion}
      />

      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        className={`flex ${FIELD_HEIGHT} w-full items-center justify-between ${EDGE} ${FIELD_BORDER} px-4 text-left text-sm font-bold outline-none transition ${
          disabled
            ? "cursor-not-allowed bg-[#F8FAFC] text-sibs-tertiary-5 opacity-70"
            : "bg-white text-sibs-primary-1 hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC]"
        } ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : ""
        }`}
      >
        <span className={value ? "text-sibs-primary-1" : "text-gray-400"}>
          {value || placeholder}
        </span>

        <ChevronDown
          size={18}
          className={`text-sibs-primary-1 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <DropdownPortal
        open={open && !disabled}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
        maxHeight={280}
        minWidth={280}
      >
        {options.map((option) => {
          const selected = value === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              className={`block w-full px-4 py-3 text-left text-sm transition ${
                selected
                  ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                  : "font-semibold text-sibs-primary-1 hover:bg-[#F8FAFC]"
              }`}
            >
              {option}
            </button>
          );
        })}
      </DropdownPortal>
    </div>
  );
}

function FormDateField({
  label,
  name,
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  readOnly = false,
  minDate = "",
  maxDate = "",
  completed = false,
  showCompletion = true,
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  function emitChange(nextValue) {
    if (readOnly || disabled) return;

    onChange?.({
      target: {
        name,
        value: nextValue,
        type: "date",
      },
    });
  }

  function handleSelectDate(nextValue) {
    emitChange(nextValue);
    setOpen(false);
  }

  function handleClearDate() {
    emitChange("");
    setOpen(false);
  }

  function handleTodayDate(nextValue) {
    const todayIsInvalid =
      isDateBefore(parseLocalDate(nextValue), minDate) ||
      isDateAfter(parseLocalDate(nextValue), maxDate);

    if (todayIsInvalid) return;

    emitChange(nextValue);
    setOpen(false);
  }

  const isLocked = disabled || readOnly;

  return (
    <div className="min-w-0">
      <FormFieldLabel
        label={label}
        completed={completed}
        showCompletion={showCompletion}
      />

      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!isLocked) setOpen((prev) => !prev);
        }}
        className={`flex ${FIELD_HEIGHT} w-full items-center justify-between ${EDGE} ${FIELD_BORDER} px-4 text-left text-sm font-bold outline-none transition ${
          isLocked
            ? "pointer-events-none bg-[#F8FAFC] text-sibs-tertiary-5"
            : "bg-white text-sibs-primary-1 hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC]"
        } ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : ""
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays size={16} className="shrink-0 text-sibs-primary-1" />

          <span
            className={`truncate ${
              value ? "text-sibs-primary-1" : "text-gray-400"
            }`}
          >
            {value ? formatModalDateLabel(value) : placeholder}
          </span>
        </span>

        {!isLocked && (
          <ChevronDown
            size={17}
            className={`shrink-0 text-sibs-primary-1 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      <DatePickerPortal
        open={open && !isLocked}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
      >
        <CalendarPopover
          value={value}
          onSelect={handleSelectDate}
          onClear={handleClearDate}
          onToday={handleTodayDate}
          minDate={minDate}
          maxDate={maxDate}
        />
      </DatePickerPortal>
    </div>
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
  disabled = false,
  completed = false,
  showCompletion = true,
}) {
  const isDisabled = disabled || readOnly;

  return (
    <div className="min-w-0">
      <FormFieldLabel
        label={label}
        completed={completed}
        showCompletion={showCompletion}
      />

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        disabled={disabled}
        placeholder={placeholder}
        className={`${FIELD_HEIGHT} ${FIELD_BASE} ${
          isDisabled
            ? "cursor-not-allowed bg-[#F8FAFC] text-sibs-tertiary-5"
            : ""
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
  disabled = false,
  completed = false,
  showCompletion = true,
}) {
  return (
    <div className="min-w-0">
      <FormFieldLabel
        label={label}
        completed={completed}
        showCompletion={showCompletion}
      />

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full resize-none ${FIELD_BASE} py-3 leading-6 ${
          disabled
            ? "cursor-not-allowed bg-[#F8FAFC] text-sibs-tertiary-5"
            : ""
        }`}
      />
    </div>
  );
}

function ChecklistItem({ done = false, title, subtitle }) {
  return (
    <div className={`${EDGE} border border-[#E6ECF2] bg-[#F8FAFC] p-4`}>
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

function FieldCompleteBadge({ completed = false }) {
  return completed ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase text-emerald-700">
      <CheckCircle2 size={12} />
      Complete
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold uppercase text-amber-700">
      <Clock3 size={12} />
      Missing
    </span>
  );
}

function CompletionStatusBadge({ completed = 0, total = 6 }) {
  const safeCompleted = Number(completed || 0);
  const safeTotal = Number(total || 6);

  const isComplete = safeTotal > 0 && safeCompleted === safeTotal;
  const Icon = isComplete ? CheckCircle2 : Clock3;

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold uppercase whitespace-nowrap ${
        isComplete
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      <Icon size={14} />
      {safeCompleted}/{safeTotal} Complete
    </span>
  );
}

function FormFieldLabel({ label }) {
  return (
    <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
      <label className="truncate text-sm font-bold text-sibs-primary-1">
        {label}
      </label>
    </div>
  );
}




function ViewFieldLabel({ label }) {
  return (
    <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
      <label className="truncate text-sm font-bold text-sibs-primary-1">
        {label}
      </label>
    </div>
  );
}

function FilingInfoInput({ label, value, displayValue }) {
  const finalDisplayValue = displayValue || value || "—";

  return (
    <div className="min-w-0 rounded-lg bg-[#F8FAFC] px-4 py-3 selection:bg-[#FFF3B8] selection:text-[#101828]">
      <p className="truncate text-[10px] font-extrabold uppercase text-sibs-primary-1/70">
        {label}
      </p>

      <p
        title={finalDisplayValue}
        className="mt-1 max-w-full overflow-x-auto whitespace-nowrap text-sm font-bold leading-5 text-[#344054] selection:bg-[#FFF3B8] selection:text-[#101828] hover:cursor-pointer [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#CBD5E1] [&::-webkit-scrollbar-track]:bg-transparent"
      >
        {finalDisplayValue}
      </p>
    </div>
  );
}

function ViewDetailField({ label, value, completed = false }) {
  return (
    <div className="min-w-0">
      <ViewFieldLabel label={label} completed={completed} />

      <div
        className={`flex min-h-[48px] w-full items-center ${EDGE} ${FIELD_BORDER} bg-white px-4 py-3 text-sm font-semibold text-sibs-primary-1`}
      >
        <span className="min-w-0 break-words">{safeText(value)}</span>
      </div>
    </div>
  );
}

function ViewDetailTextarea({
  label,
  value,
  rows = "min-h-[104px]",
  completed = false,
}) {
  return (
    <div className="min-w-0">
      <ViewFieldLabel label={label} completed={completed} />

      <div
        className={`${rows} w-full ${EDGE} ${FIELD_BORDER} bg-white px-4 py-3 text-sm font-semibold leading-6 text-sibs-primary-1`}
      >
        <p className="whitespace-pre-wrap break-words">{safeText(value)}</p>
      </div>
    </div>
  );
}

function ViewUploadedFileField({ item }) {
  const fileName = getUploadedFileDisplayName(item);
  const fileUrl = getUploadedFileUrl(item);
  const hasFile = Boolean(fileName);

  if (!fileName) {
    return (
      <div>
        <ViewFieldLabel label="Uploaded File" completed={false} />

        <div
          className={`flex min-h-[78px] items-center gap-3 ${EDGE} border border-[#D6DEE8] bg-white px-4 py-3 text-sm font-semibold text-sibs-tertiary-5`}
        >
          <Paperclip size={18} />
          No uploaded file
        </div>
      </div>
    );
  }

  if (fileUrl) {
    return (
      <div>
        <ViewFieldLabel label="Uploaded File" completed={hasFile} />

        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className={`flex min-h-[78px] items-center gap-3 ${EDGE} border border-[#D6DEE8] bg-white px-4 py-3 text-sm font-semibold text-[#2F6CA5] transition hover:bg-[#F8FAFC]`}
          title={fileName}
        >
          <FileTypeIcon filename={fileName} />
          <span className="min-w-0 truncate">{fileName}</span>
        </a>
      </div>
    );
  }

  return (
    <div>
      <ViewFieldLabel label="Uploaded File" completed={hasFile} />

      <div
        className={`flex min-h-[78px] items-center gap-3 ${EDGE} border border-[#D6DEE8] bg-white px-4 py-3 text-sm font-semibold text-[#2F6CA5]`}
        title={fileName}
      >
        <FileTypeIcon filename={fileName} />
        <span className="min-w-0 truncate">{fileName}</span>
      </div>

      <p className="mt-2 text-xs font-medium text-amber-700">
        File URL is not available from the API response.
      </p>
    </div>
  );
}


function ViewChecklistItem({ done = false, title, subtitle }) {
  return (
    <div className={`${EDGE} border border-[#E6ECF2] bg-[#F8FAFC] p-4`}>
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



export function ResignationManagementModal({
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

  const hasSelectedEmployee = !!form?.employeeSibsId && !!form?.employeeName;
  const detailsDisabled = !hasSelectedEmployee || submitting;
  const isFormal = form?.resignationType === "Formal";
  const isImmediate = form?.resignationType === "Immediate";

  const hasEmployeeSibsId = Boolean(form?.employeeSibsId);
const hasEmployeeName = Boolean(form?.employeeName);
const hasResignationType = Boolean(form?.resignationType);

const hasResignationDate =
  hasSelectedEmployee && Boolean(form?.resignationDate);

const hasLastWorkingDate =
  hasSelectedEmployee && Boolean(form?.lastWorkingDate);

const completedDateFields = [
  hasResignationDate,
  hasLastWorkingDate,
].filter(Boolean).length;

const hasDatesCompleted = completedDateFields === 2;

const hasUploadedFile = Boolean(form?.uploadedFile?.name || form?.uploadedFile);
const hasReason = Boolean(String(form?.reason || "").trim());
const hasRemarks = Boolean(String(form?.remarks || "").trim());

const requiredFieldChecks = [
  {
    label: "Employee SIBS ID",
    complete: hasEmployeeSibsId,
    statusText: hasEmployeeSibsId ? "Complete" : "Missing",
  },
  {
    label: "Employee Name",
    complete: hasEmployeeName,
    statusText: hasEmployeeName ? "Complete" : "Missing",
  },
  {
    label: "Type of Resignation",
    complete: hasResignationType,
    statusText: hasResignationType ? "Complete" : "Missing",
  },
  {
    label: "Dates Completed",
    complete: hasDatesCompleted,
    statusText: hasDatesCompleted
      ? "2/2 Complete"
      : `${completedDateFields}/2 Missing`,
  },
  {
    label: "Email Attachment",
    complete: hasUploadedFile,
    statusText: hasUploadedFile ? "Complete" : "Missing",
  },
  {
    label: "Reason / Summary",
    complete: hasReason,
    statusText: hasReason ? "Complete" : "Missing",
  },
  {
    label: "TL / OM Remarks",
    complete: hasRemarks,
    statusText: hasRemarks ? "Complete" : "Missing",
  },
];

  const completedRequiredFields = requiredFieldChecks.filter(
    (field) => field.complete,
  ).length;

  const totalRequiredFields = requiredFieldChecks.length;

  const selectedEmployee =
    managedEmployees.find(
      (employee) => String(employee?.sibsId) === String(form?.employeeSibsId),
    ) || {
      sibsId: form?.employeeSibsId,
      employeeSibsId: form?.employeeSibsId,
      fullName: form?.employeeName,
      employeeName: form?.employeeName,
      department: form?.department,
      account: form?.account,
      profilePictureUrl: form?.profilePictureUrl,
      profile_picture_url: form?.profile_picture_url,
      profileFilename: form?.profileFilename,
      profile_filename: form?.profile_filename,
      profilePicture: form?.profilePicture,
      profile_picture: form?.profile_picture,
      profileImage: form?.profileImage,
      profile_image: form?.profile_image,
    };

  function emitChange(name, value, type = "text") {
    onChange?.({
      target: {
        name,
        value,
        type,
      },
    });
  }

  function handleTypeSelect(type) {
    if (detailsDisabled) return;

    const resignationDate = form?.resignationDate || getTodayDate();

    emitChange("resignationType", type, "select-one");

    if (type === "Formal") {
      emitChange("lastWorkingDate", addDays(resignationDate, 30), "date");
      return;
    }

    emitChange("lastWorkingDate", "", "date");
  }

  function handleResignationDateChange(e) {
    const nextDate = e?.target?.value || "";

    emitChange("resignationDate", nextDate, "date");

    if (form?.resignationType === "Formal") {
      emitChange("lastWorkingDate", addDays(nextDate, 30), "date");
    }

    if (form?.resignationType === "Immediate") {
      emitChange("lastWorkingDate", "", "date");
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[1100] flex items-center justify-center p-2 font-jakarta sm:p-4"
    >
      <form
        onSubmit={onSubmit}
        className={`flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden ${PANEL_EDGE} border border-[#D9E2EC] bg-white shadow-2xl sm:max-h-[94vh]`}
      >
        <div className="shrink-0 border-b border-[#E6ECF2] bg-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center ${EDGE} bg-[#DDE5EF] text-sibs-primary-1`}
              >
                <FileText size={22} />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-xl font-extrabold text-sibs-primary-1">
                  New Resignation
                </h2>

                <p className="mt-1 text-sm font-medium text-[#2F6CA5]">
                  Select an employee first to enable the resignation filing
                  details.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center ${EDGE} text-sibs-primary-1 transition hover:bg-[#F2F6FA] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60`}
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 sibs-scrollbar sm:px-6 sm:py-6">
          <div className="space-y-5">
            <div
              className={`${PANEL_EDGE} border border-[#D9E2EC] bg-white p-4 shadow-sm sm:p-5`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-sibs-primary-1">
                    Employee Information
                  </h3>

                  <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                    Choose an employee before completing the rest of the form.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  {hasSelectedEmployee ? (
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
                      <CheckCircle2 size={14} />
                      Employee selected
                    </span>
                  ) : (
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700">
                      <Clock3 size={14} />
                      Select employee first
                    </span>
                  )}
                </div>
              </div>

              {hasSelectedEmployee && (
                <div
                  className={`mt-5 ${EDGE} border border-[#E6ECF2] bg-[#F8FAFC] p-4`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <ProfileAvatar item={selectedEmployee} size="lg" />

                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase text-sibs-tertiary-5">
                        Selected Employee
                      </p>

                      <h4 className="mt-1 truncate text-base font-extrabold text-[#101828]">
                        {form.employeeName}
                      </h4>

                      <p className="mt-1 truncate text-sm font-bold text-[#2F6CA5]">
                        {form.employeeSibsId}
                        {form.department ? ` · ${form.department}` : ""}
                        {form.account ? ` · ${form.account}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="min-w-0">
                  <FormFieldLabel
                    label="Employee SIBS ID"
                    completed={hasEmployeeSibsId}
                  />

                  <EmployeePickerField
                    label=""
                    selectedSibsId={form.employeeSibsId}
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
                </div>

                <FormInput
                  label="Employee Name"
                  name="employeeName"
                  value={form.employeeName}
                  onChange={onChange}
                  placeholder="Employee name will auto-fill"
                  readOnly
                  completed={hasEmployeeName}
                />

                {!hasSelectedEmployee && (
                  <div
                    className={`md:col-span-2 ${EDGE} border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700`}
                  >
                    Please select an employee first. The resignation date, last
                    working date, resignation type, email attachment, reason,
                    and remarks are disabled until an employee is selected.
                  </div>
                )}

                <div className="md:col-span-2">
                  <ModalSelectField
                    label="Type of Resignation *"
                    value={form.resignationType}
                    options={RESIGNATION_TYPES}
                    placeholder="Select type"
                    onSelect={handleTypeSelect}
                    disabled={detailsDisabled}
                    completed={hasResignationType}
                  />
                </div>

                <FormDateField
                  label="Resignation Date *"
                  name="resignationDate"
                  value={form.resignationDate}
                  onChange={handleResignationDateChange}
                  disabled={detailsDisabled}
                  readOnly
                  placeholder="Select resignation date"
                  completed={hasResignationDate}
                />

                <FormDateField
                  label="Last Working Date *"
                  name="lastWorkingDate"
                  value={form.lastWorkingDate}
                  onChange={onChange}
                  disabled={detailsDisabled}
                  readOnly={isFormal}
                  minDate={
                    isImmediate ? getImmediateMinDate(form.resignationDate) : ""
                  }
                  maxDate={
                    isImmediate ? getImmediateMaxDate(form.resignationDate) : ""
                  }
                  placeholder="Select last working date"
                  completed={hasLastWorkingDate}
                />

                {isFormal && (
                  <p className="md:col-span-2 text-xs text-sibs-tertiary-5">
                    For formal resignation, the last working date is
                    automatically set to 30 days from the resignation date.
                  </p>
                )}

                {isImmediate && (
                  <p className="md:col-span-2 text-xs text-sibs-tertiary-5">
                    For immediate resignation, only dates within 1 to 29 days
                    from the resignation date can be selected.
                  </p>
                )}

                <div className="md:col-span-2">
                  <FormFieldLabel
                    label="Email Attachment"
                    completed={hasUploadedFile}
                  />

                  <div className="space-y-2">
                    <label
                      className={`flex min-h-[74px] items-center justify-between gap-3 ${EDGE} ${FIELD_BORDER} px-4 py-3 text-sm transition ${
                        detailsDisabled
                          ? "cursor-not-allowed bg-[#F8FAFC] opacity-70"
                          : "cursor-pointer bg-white hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {form.uploadedFile?.name ? (
                          <FileTypeIcon filename={form.uploadedFile.name} />
                        ) : (
                          <Paperclip
                            size={18}
                            className="shrink-0 text-sibs-tertiary-5"
                          />
                        )}

                        <span
                          className={`min-w-0 truncate text-sm font-semibold ${
                            form.uploadedFile?.name
                              ? "text-gray-700"
                              : "text-sibs-tertiary-5"
                          }`}
                        >
                          {form.uploadedFile?.name ||
                            (detailsDisabled
                              ? "Select employee before uploading file"
                              : "Choose resignation file")}
                        </span>
                      </div>

                      <span
                        className={`ml-4 shrink-0 ${EDGE} bg-[var(--sibs-tertiary-9)] px-3 py-1.5 text-xs font-bold text-sibs-primary-1`}
                      >
                        Browse
                      </span>

                      <input
                        type="file"
                        name="uploadedFile"
                        onChange={onChange}
                        disabled={detailsDisabled}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.heic,image/heic,image/heif"
                      />
                    </label>

                    <p className="text-xs text-sibs-tertiary-5">
                      Accepted file types: .pdf, .doc, .docx, .jpg, .jpeg,
                      .png, .heic
                    </p>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <FormTextarea
                    label="Reason / Summary"
                    name="reason"
                    value={form.reason}
                    onChange={onChange}
                    rows={4}
                    placeholder="Summarize the employee’s resignation reason based on the submitted email."
                    disabled={detailsDisabled}
                    completed={hasReason}
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
                    disabled={detailsDisabled}
                    completed={hasRemarks}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div
                className={`${PANEL_EDGE} border border-blue-100 bg-blue-50 p-4 sm:p-5`}
              >
                <h3 className="text-base font-extrabold text-sibs-primary-1">
                  Process Rule
                </h3>

                <p className="mt-3 text-sm font-medium leading-6 text-[#344054]">
                  Formal resignation automatically computes the last working
                  date as 30 days from the resignation date. Immediate
                  resignation requires selecting a last working date within 1 to
                  29 days.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#E6ECF2] bg-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={`${EDGE} ${FIELD_BORDER} px-4 py-2.5 text-sm font-bold text-sibs-tertiary-5 transition hover:bg-[var(--sibs-tertiary-9)] disabled:cursor-not-allowed disabled:opacity-60`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || !hasSelectedEmployee}
              className={`${EDGE} bg-[var(--sibs-primary-1)] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {submitting ? "Submitting..." : "Submit Resignation"}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  );
}
function getFirstValue(source, keys, fallback = "") {
  for (const key of keys) {
    const value = source?.[key];

    if (
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return fallback;
}

function getEmployeeAccount(item) {
  return getFirstValue(
    item,
    [
      "accountName",
      "account_name",
      "account",
      "clientAccount",
      "client_account",
      "campaign",
      "program",
    ],
    "--",
  );
}

function getCaseId(item) {
  return getFirstValue(
    item,
    [
      "id",
      "resignationId",
      "resignation_id",
      "requestId",
      "request_id",
    ],
    "--",
  );
}

function getCaseStatusLabel(status) {
  if (status === "In Notice Period") return "Notice Period";
  return status || "For Approval";
}

function getCaseStatusClass(status) {
  switch (status) {
    case "Completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Declined":
    case "Rejected":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "In Notice Period":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "For Approval":
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getNoticeCycleLabel(resignationType) {
  const normalizedType = String(resignationType || "")
    .trim()
    .toLowerCase();

  if (normalizedType === "immediate") return "Immediate Waiver";
  if (normalizedType === "formal") return "30-Day SLA Period";

  return "Standard Notice Cycle";
}

function normalizeApprovalStageStatus(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (
    ["approved", "approve", "completed", "complete", "cleared"].includes(
      normalized,
    )
  ) {
    return "Approved";
  }

  if (
    ["declined", "decline", "rejected", "reject"].includes(normalized)
  ) {
    return "Declined";
  }

  if (
    ["cancelled", "canceled", "void", "skipped"].includes(normalized)
  ) {
    return "Cancelled";
  }

  return "Pending";
}

function getApprovalStatusClass(status) {
  switch (status) {
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Declined":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "Cancelled":
      return "border-slate-200 bg-slate-100 text-slate-500";
    case "Pending":
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function formatProcessedTime(value, status) {
  if (!value) {
    return status === "Pending" ? "Pending decision" : "--";
  }

  const formatted = formatDate(value);

  if (formatted && formatted !== "Invalid Date") {
    return formatted;
  }

  return String(value);
}

function getStageDecision(item, stageKey, finalStatus) {
  const statusAliases = {
    tl: [
      "tlStatus",
      "tl_status",
      "teamLeaderStatus",
      "team_leader_status",
    ],
    om: [
      "omStatus",
      "om_status",
      "operationsManagerStatus",
      "operations_manager_status",
    ],
    som: [
      "somStatus",
      "som_status",
      "seniorOperationsManagerStatus",
      "senior_operations_manager_status",
    ],
    hr: [
      "hrStatus",
      "hr_status",
      "hrPartnerStatus",
      "hr_partner_status",
    ],
  };

  const approvedAliases = {
    tl: ["tlIsApproved", "tl_is_approved", "teamLeaderIsApproved"],
    om: ["omIsApproved", "om_is_approved", "operationsManagerIsApproved"],
    som: [
      "somIsApproved",
      "som_is_approved",
      "seniorOperationsManagerIsApproved",
    ],
    hr: ["hrIsApproved", "hr_is_approved", "hrPartnerIsApproved"],
  };

  const declinedAliases = {
    tl: ["tlIsDeclined", "tl_is_declined", "teamLeaderIsDeclined"],
    om: ["omIsDeclined", "om_is_declined", "operationsManagerIsDeclined"],
    som: [
      "somIsDeclined",
      "som_is_declined",
      "seniorOperationsManagerIsDeclined",
    ],
    hr: ["hrIsDeclined", "hr_is_declined", "hrPartnerIsDeclined"],
  };

  const explicitStatus = getFirstValue(
    item,
    statusAliases[stageKey] || [],
  );

  if (explicitStatus) {
    return normalizeApprovalStageStatus(explicitStatus);
  }

  const isDeclined = (declinedAliases[stageKey] || []).some(
    (key) => Number(item?.[key] || 0) === 1,
  );

  if (isDeclined) return "Declined";

  const isApproved = (approvedAliases[stageKey] || []).some(
    (key) => Number(item?.[key] || 0) === 1,
  );

  if (isApproved) return "Approved";

  if (
    stageKey === "hr" &&
    (finalStatus === "Completed" || Number(item?.isCompleted || 0) === 1)
  ) {
    return "Approved";
  }

  return "Pending";
}

function buildApprovalStageRows(item) {
  const suppliedStages = Array.isArray(item?.approvalStages)
    ? item.approvalStages
    : Array.isArray(item?.approval_stages)
      ? item.approval_stages
      : [];

  if (suppliedStages.length > 0) {
    return suppliedStages.map((stage, index) => {
      const status = normalizeApprovalStageStatus(
        stage?.status ||
          stage?.approvalStatus ||
          stage?.approval_status,
      );

      return {
        id: String(
          stage?.id ||
            stage?.stageName ||
            stage?.stage ||
            `stage-${index}`,
        ),
        stage:
          stage?.stageName ||
          stage?.stage ||
          stage?.role ||
          `Approval Stage ${index + 1}`,
        approver:
          stage?.approver ||
          stage?.approverName ||
          stage?.approver_name ||
          stage?.fullName ||
          stage?.name ||
          "Pending assignment",
        status,
        processedTime: formatProcessedTime(
          stage?.updatedAt ||
            stage?.updated_at ||
            stage?.processedAt ||
            stage?.processed_at ||
            stage?.approvedAt ||
            stage?.approved_at,
          status,
        ),
      };
    });
  }

  const finalStatus = getResignationStatus(item);

  const stageDefinitions = [
    {
      key: "tl",
      stage: "Team Leader",
      approverKeys: [
        "tlFullName",
        "tl_full_name",
        "tlName",
        "tl_name",
        "tlApproverName",
        "tl_approver_name",
        "teamLeaderName",
        "team_leader_name",
        "supervisorName",
        "supervisor_name",
        "filedByName",
      ],
      dateKeys: [
        "tlProcessedAt",
        "tl_processed_at",
        "tlApprovedAt",
        "tl_approved_at",
        "tlUpdatedAt",
        "tl_updated_at",
        "tlApprovalDate",
        "tl_approval_date",
      ],
    },
    {
      key: "om",
      stage: "Operations Manager",
      approverKeys: [
        "omFullName",
        "om_full_name",
        "omName",
        "om_name",
        "omApproverName",
        "om_approver_name",
        "operationsManagerName",
        "operations_manager_name",
        "managerName",
        "manager_name",
      ],
      dateKeys: [
        "omProcessedAt",
        "om_processed_at",
        "omApprovedAt",
        "om_approved_at",
        "omUpdatedAt",
        "om_updated_at",
        "omApprovalDate",
        "om_approval_date",
      ],
    },
    {
      key: "som",
      stage: "Senior Ops Manager",
      approverKeys: [
        "somFullName",
        "som_full_name",
        "somName",
        "som_name",
        "somApproverName",
        "som_approver_name",
        "seniorOperationsManagerName",
        "senior_operations_manager_name",
      ],
      dateKeys: [
        "somProcessedAt",
        "som_processed_at",
        "somApprovedAt",
        "som_approved_at",
        "somUpdatedAt",
        "som_updated_at",
        "somApprovalDate",
        "som_approval_date",
      ],
    },
    {
      key: "hr",
      stage: "HR Partner",
      approverKeys: [
        "hrFullName",
        "hr_full_name",
        "hrName",
        "hr_name",
        "hrApproverName",
        "hr_approver_name",
        "hrPartnerName",
        "hr_partner_name",
        "completedByName",
        "completed_by_name",
      ],
      dateKeys: [
        "hrProcessedAt",
        "hr_processed_at",
        "hrApprovedAt",
        "hr_approved_at",
        "hrUpdatedAt",
        "hr_updated_at",
        "completedAt",
        "completed_at",
      ],
    },
  ];

  let priorStageDeclined = false;

  return stageDefinitions.map((definition) => {
    let status = getStageDecision(item, definition.key, finalStatus);

    if (priorStageDeclined && status === "Pending") {
      status = "Cancelled";
    }

    if (status === "Declined") {
      priorStageDeclined = true;
    }

    const fallbackApprover =
      definition.key === "tl"
        ? getFirstValue(
            item,
            [
              "supervisorName",
              "supervisor_name",
              "filedByName",
              "filed_by_name",
            ],
            "Pending assignment",
          )
        : "Pending assignment";

    return {
      id: definition.key,
      stage: definition.stage,
      approver: getFirstValue(
        item,
        definition.approverKeys,
        fallbackApprover,
      ),
      status,
      processedTime: formatProcessedTime(
        getFirstValue(item, definition.dateKeys),
        status,
      ),
    };
  });
}

function getAttachmentEntries(item) {
  const sibsId = getEmployeeSibsId(item);

  const source = Array.isArray(item?.attachments)
    ? item.attachments
    : Array.isArray(item?.attachmentFiles)
      ? item.attachmentFiles
      : Array.isArray(item?.attachment_files)
        ? item.attachment_files
        : getUploadedFileDisplayName(item)
          ? [
              {
                name: getUploadedFileDisplayName(item),
                url: getUploadedFileUrl(item),
              },
            ]
          : [];

  const entries = source
    .map((attachment, index) => {
      const normalized =
        typeof attachment === "string"
          ? { name: attachment }
          : attachment && typeof attachment === "object"
            ? attachment
            : null;

      if (!normalized) return null;

      const name = String(
        normalized.name ||
          normalized.filename ||
          normalized.fileName ||
          normalized.file_name ||
          normalized.uploadedFile ||
          "",
      ).trim();

      if (!name) return null;

      const directUrl =
        normalized.url ||
        normalized.fileUrl ||
        normalized.file_url ||
        normalized.uploadedFileUrl ||
        normalized.uploaded_file_url ||
        "";

      let url = directUrl
        ? normalizeUploadedFileUrl(directUrl)
        : "";

      if (!url && sibsId && sibsId !== "--") {
        url = `${String(API_URL || "").replace(
          /\/$/,
          "",
        )}/api/resignation/file/${encodeURIComponent(
          sibsId,
        )}/${encodeURIComponent(name)}`;
      }

      return {
        id: String(
          normalized.id ||
            normalized.attachmentId ||
            `${index}-${name}-${url}`,
        ),
        name,
        url,
      };
    })
    .filter(Boolean);

  const seen = new Set();

  return entries.filter((attachment) => {
    const key = `${attachment.name.toLowerCase()}::${attachment.url}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

export function ViewResignationModal({ open, item, onClose }) {
  useEffect(() => {
    if (!open) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    function handleEscape(event) {
      if (event.key === "Escape") onClose?.();
    }

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open, onClose]);

  if (!open || !item) return null;

  const status = getResignationStatus(item);
  const statusLabel = getCaseStatusLabel(status);

  const employeeName = getFullName(item);
  const employeeSibsId = getEmployeeSibsId(item);
  const employeeDepartment = getEmployeeDepartment(item);
  const employeeAccount = getEmployeeAccount(item);

  const resignationType = item?.resignationType || item?.type || "";
  const rawResignationDate = item?.resignationDate || getItemDate(item);
  const rawLastWorkingDate =
    item?.lastWorkingDate || item?.last_working_date;

  const resignationDate = formatDate(rawResignationDate);
  const lastWorkingDate = formatDate(rawLastWorkingDate);

  const reason = safeText(item?.reason, "No reason provided");
  const narrative =
    item?.details ||
    item?.specifyOthers ||
    item?.specify_others ||
    item?.remarks ||
    item?.comment_retain ||
    item?.commentRetain ||
    "No narrative details were added with the submission.";

  const filedByObject =
    item?.filedBy && typeof item.filedBy === "object"
      ? item.filedBy
      : null;

  const filedByName =
    filedByObject?.name ||
    item?.filedByName ||
    item?.filed_by_name ||
    item?.encodedByName ||
    item?.createdByName ||
    item?.supervisorName ||
    "TL / OM";

  const filedByRole =
    filedByObject?.role ||
    item?.filedByRole ||
    item?.filed_by_role ||
    item?.encodedByRole ||
    item?.supervisorRole ||
    "";

  const approvalStages = buildApprovalStageRows(item);
  const attachments = getAttachmentEntries(item);

  const employeeMeta = [
    employeeSibsId !== "--" ? employeeSibsId : "",
    employeeDepartment !== "--" ? employeeDepartment : "",
    employeeAccount !== "--" ? employeeAccount : "",
  ].filter(Boolean);

  const employeeInitial =
    String(employeeName || "E").trim().charAt(0).toUpperCase() || "E";

  return createPortal(
    <div
      className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[1100] flex h-dvh items-center justify-center p-2 font-jakarta sm:p-4"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-resignation-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[18px] border border-white/70 bg-white font-jakarta shadow-[0_24px_70px_rgba(4,44,81,0.32)] sm:max-h-[92vh]"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 bg-[#042C51] px-4 py-4 text-white sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
              <UserX size={18} strokeWidth={2.25} />
            </span>

            <div className="min-w-0">
              <h2
                id="view-resignation-title"
                className="truncate text-sm font-extrabold leading-tight text-white sm:text-base"
              >
                Resignation Case Details
              </h2>

              <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-300 sm:text-xs">
                Offboarding workflow profile
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white active:scale-[0.97]"
            aria-label="Close resignation case details"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-5 sibs-scrollbar sm:px-6 sm:py-6">
          <div className="space-y-5">
            <section className="flex flex-col gap-4 rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#042C51] text-sm font-extrabold text-white">
                  {employeeInitial}
                </span>

                <div className="min-w-0">
                  <h3 className="truncate text-base font-extrabold text-[#042C51] sm:text-lg">
                    {employeeName}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-xs font-semibold text-[#667085]">
                    {employeeMeta.length > 0
                      ? employeeMeta.join("  •  ")
                      : "Employee information unavailable"}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-start sm:items-end">
                <span className="text-[9px] font-extrabold uppercase text-[#98A2B3]">
                  Current Status
                </span>

                <span
                  className={`mt-1 inline-flex rounded border px-2 py-1 text-[9px] font-extrabold uppercase leading-none ${getCaseStatusClass(
                    status,
                  )}`}
                >
                  {statusLabel}
                </span>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-x-5 gap-y-4 rounded-xl border border-[#E7ECF2] bg-[#FBFCFE] p-4 md:grid-cols-4">
              <div className="min-w-0">
                <p className="text-[9px] font-extrabold uppercase text-[#98A2B3]">
                  Case ID
                </p>
                <p className="mt-1 truncate text-xs font-extrabold text-[#042C51]">
                  {safeText(getCaseId(item))}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-extrabold uppercase text-[#98A2B3]">
                  Filed Date
                </p>
                <p className="mt-1 truncate text-xs font-bold text-[#344054]">
                  {safeText(resignationDate)}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-extrabold uppercase text-[#98A2B3]">
                  Last Working Day
                </p>
                <p className="mt-1 truncate text-xs font-extrabold text-rose-600">
                  {safeText(lastWorkingDate)}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-extrabold uppercase text-[#98A2B3]">
                  Notice Cycle
                </p>
                <p className="mt-1 truncate text-xs font-extrabold text-indigo-600">
                  {getNoticeCycleLabel(resignationType)}
                </p>
              </div>
            </section>

            <section>
              <h4 className="text-[11px] font-extrabold uppercase text-[#042C51] sm:text-xs">
                Statement / Reason Details
              </h4>

              <div className="mt-2 rounded-xl border border-[#CFE0F4] bg-[#F7FAFE] p-4">
                <span className="inline-flex max-w-full rounded border border-[#FFD7C8] bg-[#FFF0EB] px-2 py-1 text-[10px] font-extrabold text-[#FF5C28]">
                  <span className="truncate">Reason: {reason}</span>
                </span>

                <p className="mt-2 whitespace-pre-wrap break-words text-xs font-medium italic leading-5 text-[#344054]">
                  “{safeText(narrative)}”
                </p>
              </div>
            </section>

            <section>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="text-[11px] font-extrabold uppercase text-[#042C51] sm:text-xs">
                  Clearance & Approval Routing Stages
                </h4>

                <span className="text-[9px] font-extrabold uppercase text-[#7E8DA8]">
                  SOP Alignment Routing: TL → OM → SOM → HR
                </span>
              </div>

              <div className="mt-2 overflow-hidden rounded-xl border border-[#D9E2EC]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#D9E2EC] bg-[#F8FAFC]">
                        <th className="px-3 py-3 text-[10px] font-extrabold text-[#8A98B8]">
                          Approval Stage
                        </th>
                        <th className="px-3 py-3 text-[10px] font-extrabold text-[#8A98B8]">
                          Designated Approver
                        </th>
                        <th className="px-3 py-3 text-center text-[10px] font-extrabold text-[#8A98B8]">
                          Status
                        </th>
                        <th className="px-3 py-3 text-[10px] font-extrabold text-[#8A98B8]">
                          Processed Time
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {approvalStages.map((stage) => (
                        <tr
                          key={stage.id}
                          className="border-b border-[#EEF2F6] last:border-b-0 hover:bg-[#FFF8F5]"
                        >
                          <td className="px-3 py-3 text-xs font-extrabold text-[#042C51]">
                            {stage.stage}
                          </td>

                          <td className="px-3 py-3 text-xs font-semibold text-[#475467]">
                            {safeText(
                              stage.approver,
                              "Pending assignment",
                            )}
                          </td>

                          <td className="px-3 py-3 text-center">
                            <span
                              className={`inline-flex rounded border px-2 py-1 text-[8px] font-extrabold uppercase leading-none ${getApprovalStatusClass(
                                stage.status,
                              )}`}
                            >
                              {stage.status}
                            </span>
                          </td>

                          <td className="px-3 py-3 text-[10px] font-semibold tabular-nums text-[#8A98B8]">
                            {stage.processedTime}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section>
              <p className="text-[10px] font-extrabold uppercase text-[#98A2B3]">
                Attached Files ({attachments.length})
              </p>

              {attachments.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {attachments.map((attachment) =>
                    attachment.url ? (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Open ${attachment.name}`}
                        className="inline-flex max-w-full items-center gap-2 rounded-lg border border-[#D9E2EC] bg-[#F2F6FA] px-3 py-2 text-left text-xs font-extrabold text-[#042C51] no-underline transition hover:border-[#FF5C28]/40 hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
                      >
                        <FileText
                          size={14}
                          className="shrink-0 text-[#7E8DA8]"
                        />
                        <span className="max-w-[240px] truncate">
                          {attachment.name}
                        </span>
                      </a>
                    ) : (
                      <span
                        key={attachment.id}
                        title={attachment.name}
                        className="inline-flex max-w-full items-center gap-2 rounded-lg border border-[#D9E2EC] bg-[#F2F6FA] px-3 py-2 text-left text-xs font-extrabold text-[#042C51]"
                      >
                        <FileText
                          size={14}
                          className="shrink-0 text-[#7E8DA8]"
                        />
                        <span className="max-w-[240px] truncate">
                          {attachment.name}
                        </span>
                      </span>
                    ),
                  )}
                </div>
              ) : (
                <p className="mt-2 text-xs font-semibold text-[#98A2B3]">
                  No files were attached to this resignation.
                </p>
              )}
            </section>
          </div>
        </div>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-[#EEF2F6] bg-[#F8FAFC] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="min-w-0 truncate text-[10px] font-semibold text-[#7E8DA8]">
            <span className="font-extrabold text-[#667085]">
              Filed By:
            </span>{" "}
            {filedByName}
            {filedByRole ? ` (${filedByRole})` : ""}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-[#E4EAF1] px-4 text-xs font-extrabold text-[#23364D] transition hover:bg-[#D7E0EA] active:scale-[0.98]"
          >
            Close profile
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
