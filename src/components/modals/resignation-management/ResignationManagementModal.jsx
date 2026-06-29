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

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatMonthYear(date) {
  return date.toLocaleDateString("en-US", {
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
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">
      <CheckCircle2 size={12} />
      Complete
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-700">
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
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-wide whitespace-nowrap ${
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
      <p className="truncate text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1/70">
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
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/45 p-2 sm:p-4"
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
                      <p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
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
export function ViewResignationModal({ open, item, onClose }) {
  if (!open || !item) return null;

  const status = getResignationStatus(item);
  const StatusIcon = getStatusIcon(status);

  const employeeName = getFullName(item);
  const employeeSibsId = getEmployeeSibsId(item);
  const employeeDepartment = getEmployeeDepartment(item);
  const employeePosition = getEmployeePosition(item);

  const resignationType = item?.resignationType || item?.type || "";

  const rawResignationDate = item?.resignationDate || getItemDate(item);
  const rawLastWorkingDate = item?.lastWorkingDate || item?.last_working_date;

  const resignationDate = formatDate(rawResignationDate);
  const lastWorkingDate = formatDate(rawLastWorkingDate);

  const reason = item?.reason || "";
  const remarks = item?.remarks || item?.comment_retain || item?.commentRetain;

  const filedBy =
    item?.filedByName ||
    item?.encodedByName ||
    item?.createdByName ||
    item?.supervisorName ||
    "TL / OM";

  const hasEmployeeSibsId = Boolean(employeeSibsId && employeeSibsId !== "--");
const hasEmployeeName = Boolean(employeeName && employeeName !== "Employee");
const hasResignationType = Boolean(resignationType);

const hasResignationDate = Boolean(rawResignationDate);
const hasLastWorkingDate = Boolean(rawLastWorkingDate);

const completedDateFields = [
  hasResignationDate,
  hasLastWorkingDate,
].filter(Boolean).length;

const hasDatesCompleted = completedDateFields === 2;

const hasUploadedFile = Boolean(getUploadedFileDisplayName(item));
const hasReason = Boolean(String(reason || "").trim());
const hasRemarks = Boolean(String(remarks || "").trim());

const requiredFieldChecks = [
  {
    label: "Employee SIBS ID",
    complete: hasEmployeeSibsId,
    
  },
  {
    label: "Employee Name",
    complete: hasEmployeeName,
    
  },
  {
    label: "Type of Resignation",
    complete: hasResignationType,
    
  },
  {
    label: "Dates Completed",
    complete: hasDatesCompleted,
    
  },
  {
    label: "Email Attachment",
    complete: hasUploadedFile,
  },
  {
    label: "Reason / Summary",
    complete: hasReason,
    
  },
  {
    label: "TL / OM Remarks",
    complete: hasRemarks,
  },
];

const completedRequiredFields = requiredFieldChecks.filter(
  (field) => field.complete,
).length;

const totalRequiredFields = requiredFieldChecks.length;



  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/45 p-2 sm:p-4">
      <div
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
                  View Resignation
                </h2>

                <p className="mt-1 text-sm font-medium text-[#2F6CA5]">
                  Review the filed resignation details and attachment.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center ${EDGE} text-sibs-primary-1 transition hover:bg-[#F2F6FA] active:scale-[0.98]`}
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
                <div className="flex min-w-0 items-center gap-3">
                  <ProfileAvatar item={item} size="lg" />

                  <div className="min-w-0">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                      Employee
                    </p>

                    <h3 className="mt-1 truncate text-lg font-extrabold text-[#101828]">
                      {employeeName}
                    </h3>

                    <p className="mt-1 truncate text-sm font-bold text-[#2F6CA5]">
                      {employeeSibsId} · {employeeDepartment}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  

                  <span
                    className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold ${getStatusClass(
                      status,
                    )}`}
                  >
                    <StatusIcon size={14} />
                    {status}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                <ViewDetailField
                  label="Employee SIBS ID"
                  value={employeeSibsId}
                  completed={hasEmployeeSibsId}
                />

                <ViewDetailField
                  label="Employee Name"
                  value={employeeName}
                  completed={hasEmployeeName}
                />

                <div className="md:col-span-2">
                  <ViewDetailField
                    label="Type of Resignation"
                    value={resignationType}
                    completed={hasResignationType}
                  />
                </div>

                <ViewDetailField
                  label="Resignation Date"
                  value={resignationDate}
                  completed={hasResignationDate}
                />

                <ViewDetailField
                  label="Last Working Date"
                  value={lastWorkingDate}
                  completed={hasLastWorkingDate}
                />

                <div className="md:col-span-2">
                  <ViewUploadedFileField item={item} />
                </div>

                <div className="md:col-span-2">
                  <ViewDetailTextarea
                    label="Reason / Summary"
                    value={reason}
                    rows="min-h-[126px]"
                    completed={hasReason}
                  />
                </div>

                <div className="md:col-span-2">
                  <ViewDetailTextarea
                    label="TL / OM Remarks"
                    value={remarks}
                    rows="min-h-[96px]"
                    completed={hasRemarks}
                    showCompletion={false}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <div
                className={`${PANEL_EDGE} border border-blue-100 bg-blue-50 p-4 sm:p-5`}
              >
                <h3 className="text-base font-extrabold text-sibs-primary-1">
                  Process Rule
                </h3>

                <p className="mt-3 text-sm font-medium leading-6 text-[#344054]">
                  Approval and decline actions for this resignation should be
                  handled in the Approval Request module. This modal is for
                  viewing the filed resignation details only.
                </p>
              </div>

              <div
                className={`${PANEL_EDGE} border border-[#D9E2EC] bg-white p-4 shadow-sm sm:p-5`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-sibs-primary-1">
                      Filing Details
                    </h3>

                    <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                      Filing ownership and department details.
                    </p>
                  </div>

                  
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3">
                  <FilingInfoInput label="Filed By" value={safeText(filedBy)} />

                  <FilingInfoInput
                    label="Department / Position"
                    value={safeText(employeePosition || employeeDepartment)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#E6ECF2] bg-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`${EDGE} ${FIELD_BORDER} px-5 py-2.5 text-sm font-bold text-sibs-tertiary-5 transition hover:bg-[var(--sibs-tertiary-9)] active:scale-[0.98]`}
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