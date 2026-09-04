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
import {
  convertHeicBlobToJpeg,
  isHeicFileName,
} from "../../../lib/utils/heicBrowserPreview";

const RESIGNATION_TYPES = ["Formal", "Immediate"];

const EDGE = "rounded-xl";
const PANEL_EDGE = "rounded-xl";
const FIELD_HEIGHT = "h-8.5 2xl:h-10";
const FIELD_BORDER = "border border-[#D7DEE8]";
const FIELD_BASE =
  "w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 2xl:px-3.5 font-jakarta sibs-text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10";

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
  const anchorRef = useRef(null);
  const [fetchedEmployee, setFetchedEmployee] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [preview, setPreview] = useState({
    open: false,
    top: 0,
    left: 0,
  });

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
    setPreview((current) => ({
      ...current,
      open: false,
    }));
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

  function showProfilePreview() {
    const anchor = anchorRef.current;

    if (
      !anchor ||
      !imageUrl ||
      imageFailed ||
      typeof window === "undefined"
    ) {
      return;
    }

    const rect = anchor.getBoundingClientRect();
    const previewSize = 176;
    const gap = 10;
    const viewportPadding = 8;

    let left = rect.right + gap;

    if (
      left + previewSize >
      window.innerWidth - viewportPadding
    ) {
      left = rect.left - previewSize - gap;
    }

    left = Math.max(
      viewportPadding,
      Math.min(
        left,
        window.innerWidth -
          previewSize -
          viewportPadding,
      ),
    );

    const top = Math.max(
      viewportPadding,
      Math.min(
        rect.top +
          rect.height / 2 -
          previewSize / 2,
        window.innerHeight -
          previewSize -
          viewportPadding,
      ),
    );

    setPreview({
      open: true,
      top,
      left,
    });
  }

  function hideProfilePreview() {
    setPreview((current) => ({
      ...current,
      open: false,
    }));
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
        onError={() => {
          setImageFailed(true);
          hideProfilePreview();
        }}
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center text-sibs-primary-1">
        <UserRound size={size === "lg" ? 24 : 20} />
      </div>
    );

  return (
    <>
      <div
        ref={anchorRef}
        onMouseEnter={showProfilePreview}
        onMouseLeave={hideProfilePreview}
        className={`flex ${sizeClass} shrink-0 cursor-default items-center justify-center overflow-hidden rounded-full border border-[#D9E2EC] bg-[#F2F6FA] shadow-sm`}
      >
        {avatarContent}
      </div>

      {preview.open &&
      imageUrl &&
      !imageFailed &&
      typeof document !== "undefined"
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[100000] overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white p-1.5 shadow-2xl"
              style={{
                top: preview.top,
                left: preview.left,
                width: 176,
                height: 176,
              }}
              aria-hidden="true"
            >
              <img
                src={imageUrl}
                alt=""
                className="h-full w-full rounded-xl object-cover"
              />
            </div>,
            document.body,
          )
        : null}
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

function isPreviewableImageFileName(filename = "") {
  const ext =
    String(filename || "")
      .trim()
      .split(".")
      .pop()
      ?.toLowerCase() || "";

  return [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "svg",
    "heic",
    "heif",
  ].includes(ext);
}

function FileTypeIcon({ filename }) {
  const ext = String(filename || "").split(".").pop()?.toLowerCase() || "";

  const isImage = isPreviewableImageFileName(filename);

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

      const dropdownWidth = Math.min(
        Math.max(rect.width, 360),
        viewportWidth - 32,
      );
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
  error = "",
  search = "",
  open = false,
  onOpenChange,
  onSearchChange,
  onSelect,
}) {
  const anchorRef = useRef(null);

  return (
    <div className="relative min-w-0">
      <label className="mb-1.5 block font-jakarta text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
        {label}
      </label>

      <button
        ref={anchorRef}
        type="button"
        onClick={() => onOpenChange?.(!open)}
        className={`flex ${FIELD_HEIGHT} w-full min-w-0 items-center justify-between gap-3 ${EDGE} ${FIELD_BORDER} px-3 2xl:px-3.5 text-left font-jakarta sibs-text-xs font-semibold outline-none transition ${
          open
            ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10"
            : "bg-[#F8FAFC] text-[#042C51] hover:border-[#FF5C28]/40 hover:bg-white"
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span
          className={`block min-w-0 flex-1 truncate whitespace-nowrap ${
            selectedSibsId
              ? "font-bold text-[#042C51]"
              : "font-medium text-[#98A2B3]"
          }`}
          title={selectedSibsId || "Select employee under your management"}
        >
          {selectedSibsId || "Select employee under your management"}
        </span>

        <ChevronDown
          size={16}
          className={`shrink-0 text-[#042C51] transition-transform ${
            open ? "rotate-180 text-[#FF5C28]" : ""
          }`}
        />
      </button>

      <EmployeeDropdownPortal
        open={open}
        anchorRef={anchorRef}
        onClose={() => onOpenChange?.(false)}
      >
        <div className="sticky top-0 z-10 border-b border-[#E6ECF2] bg-white p-2.5 2xl:p-3">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Search SIBS ID or employee name..."
              autoComplete="off"
              className="h-8.5 2xl:h-9 w-full rounded-lg border border-[#D7DEE8] bg-[#F8FAFC] pl-9 pr-3 font-jakarta sibs-text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-2 focus:ring-[#FF5C28]/10"
            />
          </div>
        </div>

        <div
          className="max-h-[320px] overflow-y-auto py-1.5 sibs-scrollbar font-jakarta"
          role="listbox"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-6 text-xs font-bold text-[#042C51]">
              <Loader2 size={15} className="animate-spin text-[#FF5C28]" />
              Loading employees...
            </div>
          ) : error ? (
            <div className="mx-3 my-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={17} className="mt-0.5 shrink-0 text-red-600" />
                <div>
                  <p className="text-xs font-extrabold text-red-700">
                    Unable to load employees
                  </p>
                  <p className="mt-1 text-[11px] font-semibold leading-5 text-red-600">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          ) : employees.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs font-bold text-[#98A2B3]">
              No employees found under your management.
            </div>
          ) : (
            employees.map((employee) => (
              <button
                key={employee.sibsId}
                type="button"
                role="option"
                aria-selected={selectedSibsId === employee.sibsId}
                onClick={() => onSelect?.(employee)}
                className={`flex w-full items-center gap-3 px-3.5 py-2.5 2xl:py-3 text-left sibs-text-xs font-jakarta transition ${
                  selectedSibsId === employee.sibsId
                    ? "bg-[#FFF0EB] font-bold text-[#FF5C28]"
                    : "text-[#042C51] hover:bg-[#F8FAFC]"
                }`}
              >
                <ProfileAvatar item={employee} size="sm" />

                <div className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-[#042C51]">
                    {employee.sibsId || "N/A"} -{" "}
                    {employee.fullName || "Unnamed Employee"}
                  </span>

                  <span className="mt-0.5 block truncate text-[11px] font-semibold text-[#667085]">
                    {employee.department || "No department"}
                    {employee.account ? ` · ${employee.account}` : ""}
                  </span>
                </div>

                {selectedSibsId === employee.sibsId ? (
                  <CheckCircle2 size={17} className="shrink-0 text-emerald-600" />
                ) : null}
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
        className={`flex ${FIELD_HEIGHT} w-full items-center justify-between ${EDGE} ${FIELD_BORDER} px-3 2xl:px-3.5 text-left font-jakarta sibs-text-xs font-semibold outline-none transition ${
          disabled
            ? "cursor-not-allowed bg-[#F8FAFC] text-[#98A2B3] opacity-70"
            : open
              ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10"
              : "bg-[#F8FAFC] text-[#042C51] hover:border-[#FF5C28]/40 hover:bg-white"
        }`}
      >
        <span className={value ? "font-bold text-[#042C51]" : "font-medium text-[#98A2B3]"}>
          {value || placeholder}
        </span>

        <ChevronDown
          size={16}
          className={`shrink-0 text-[#042C51] transition-transform ${
            open ? "rotate-180 text-[#FF5C28]" : ""
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
              className={`block w-full px-3.5 py-2.5 2xl:py-3 text-left font-jakarta sibs-text-xs transition ${
                selected
                  ? "bg-[#FFF0EB] font-bold text-[#FF5C28]"
                  : "font-semibold text-[#042C51] hover:bg-[#F8FAFC]"
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
        className={`flex ${FIELD_HEIGHT} w-full items-center justify-between ${EDGE} ${FIELD_BORDER} px-3 2xl:px-3.5 text-left font-jakarta sibs-text-xs font-semibold outline-none transition ${
          isLocked
            ? "pointer-events-none bg-[#F8FAFC] text-[#667085]"
            : open
              ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10"
              : "bg-[#F8FAFC] text-[#042C51] hover:border-[#FF5C28]/40 hover:bg-white"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays size={15} className="shrink-0 text-[#042C51]" />

          <span
            className={`truncate ${
              value ? "font-bold text-[#042C51]" : "font-medium text-[#98A2B3]"
            }`}
          >
            {value ? formatModalDateLabel(value) : placeholder}
          </span>
        </span>

        {!isLocked && (
          <ChevronDown
            size={16}
            className={`shrink-0 text-[#042C51] transition-transform ${
              open ? "rotate-180 text-[#FF5C28]" : ""
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
            ? "cursor-not-allowed bg-[#F8FAFC] text-[#98A2B3] opacity-70"
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
  rows = 3,
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
        className={`w-full resize-none rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3.5 py-2.5 font-jakarta sibs-text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 leading-5 ${
          disabled
            ? "cursor-not-allowed bg-[#F8FAFC] text-[#98A2B3] opacity-70"
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
    <div className="mb-1.5 flex min-w-0 items-center justify-between gap-2">
      <label className="truncate font-jakarta text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
        {label}
      </label>
    </div>
  );
}




function ViewFieldLabel({ label }) {
  return (
    <div className="mb-1.5 flex min-w-0 items-center justify-between gap-2">
      <label className="truncate font-jakarta text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
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
  employeePickerError = "",
  employeePickerSearch = "",
  employeePickerOpen = false,
  onEmployeePickerOpenChange,
  onEmployeePickerSearchChange,
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
      aria-labelledby="resignation-management-title"
      data-layout="resignation-management-v3"
      className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[1100] flex items-center justify-center p-3 font-jakarta sm:p-4"
    >
      <form
        onSubmit={onSubmit}
        className="sibs-modal-pop-in flex max-h-[calc(100dvh-2rem)] w-full max-w-[680px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl font-jakarta sm:max-h-[92vh]"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5">
          <div className="flex min-w-0 items-center gap-2.5 2xl:gap-3">
            <span className="flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
              <UserX size={16} />
            </span>
            <div className="min-w-0">
              <h2
                id="resignation-management-title"
                className="sibs-modal-title truncate"
              >
                Submit Resignation
              </h2>

              <p className="sibs-modal-subtitle text-white/75 truncate">
                Select an employee and enter the resignation request details.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close resignation modal"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 2xl:py-5 sibs-scrollbar sm:px-6">
          <div className="space-y-3.5 2xl:space-y-4">
            <EmployeePickerField
              label="Employee SIBS ID *"
              selectedSibsId={form?.employeeSibsId}
              employees={managedEmployees}
              loading={employeePickerLoading}
              error={employeePickerError}
              search={employeePickerSearch}
              open={employeePickerOpen}
              onOpenChange={onEmployeePickerOpenChange}
              onSearchChange={onEmployeePickerSearchChange}
              onSelect={onSelectManagedEmployee}
            />

            {hasSelectedEmployee ? (
              <section className="flex min-w-0 items-center gap-3 rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3.5 py-2.5 2xl:px-4 2xl:py-3">
                <ProfileAvatar item={selectedEmployee} size="md" />

                <div className="min-w-0 flex-1">
                  <p className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                    Selected Employee
                  </p>

                  <p className="mt-0.5 truncate font-jakarta sibs-text-xs font-extrabold text-[#042C51]">
                    {form?.employeeName}
                  </p>

                  <p className="mt-0.5 truncate text-[11px] font-semibold text-[#667085]">
                    {form?.employeeSibsId}
                    {form?.department ? ` · ${form.department}` : ""}
                    {form?.account ? ` · ${form.account}` : ""}
                  </p>
                </div>

                <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 sm:inline-flex">
                  <CheckCircle2 size={12} />
                  Selected
                </span>
              </section>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-semibold leading-5 text-amber-800">
                Select an employee first. The remaining resignation fields will
                become available after selection.
              </div>
            )}

            <ModalSelectField
              label="Type of Resignation *"
              value={form?.resignationType}
              options={RESIGNATION_TYPES}
              placeholder="Select type"
              onSelect={handleTypeSelect}
              disabled={detailsDisabled}
            />

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <FormDateField
                label="Resignation Date *"
                name="resignationDate"
                value={form?.resignationDate}
                onChange={handleResignationDateChange}
                disabled={detailsDisabled}
                readOnly
                placeholder="Select resignation date"
              />

                  <FormDateField
                    label="Last Working Date *"
                    name="lastWorkingDate"
                    value={form?.lastWorkingDate}
                    onChange={onChange}
                    disabled={detailsDisabled}
                    readOnly={isFormal}
                    minDate={isImmediate ? getImmediateMinDate(form?.resignationDate) : ""}
                    maxDate={isImmediate ? getImmediateMaxDate(form?.resignationDate) : ""}
                    placeholder="Select last working date"
                  />
                </div>

            {isFormal ? (
              <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
                Formal resignation automatically sets the last working date to
                30 days after the resignation date.
              </p>
            ) : null}

            {isImmediate ? (
              <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-700">
                Immediate resignation allows a last working date from 1 to 29
                days after the resignation date.
              </p>
            ) : null}

                <div>
                  <FormFieldLabel label="Email Attachment *" />

              <label
                className={`flex min-h-[46px] 2xl:min-h-[50px] items-center justify-between gap-3 rounded-xl border border-[#D7DEE8] px-3.5 py-2 text-sm transition ${
                  detailsDisabled
                    ? "cursor-not-allowed bg-[#F8FAFC] opacity-70"
                    : "cursor-pointer bg-[#F8FAFC] hover:border-[#FF5C28]/40 hover:bg-white"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Paperclip
                    size={16}
                    className="shrink-0 text-[#042C51]"
                  />

                  <span
                    className={`truncate font-jakarta sibs-text-xs font-semibold ${
                      form?.uploadedFile?.name
                        ? "text-[#042C51] font-bold"
                        : "text-[#98A2B3]"
                    }`}
                  >
                    {form?.uploadedFile?.name ||
                      (detailsDisabled
                        ? "Select employee before uploading file"
                        : "Choose resignation file")}
                  </span>
                </span>

                <span className="shrink-0 rounded-lg border border-[#D7DEE8] bg-white px-3 py-1 font-jakarta sibs-text-xs font-extrabold text-[#042C51] shadow-xs transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28]">
                  Browse
                </span>

                    <input
                      type="file"
                      name="uploadedFile"
                      onChange={onChange}
                      disabled={detailsDisabled}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.heic,.heif,image/heic,image/heif"
                    />
                  </label>

              <p className="mt-1 font-jakarta text-[9.5px] 2xl:text-[10px] font-semibold text-[#98A2B3]">
                Accepted file types: .pdf, .doc, .docx, .jpg, .jpeg, .png, .heic
              </p>
            </div>

                <FormTextarea
                  label="Reason / Summary *"
                  name="reason"
                  value={form?.reason}
                  onChange={onChange}
                  rows={3}
                  placeholder="Summarize the employee’s resignation reason based on the submitted email."
                  disabled={detailsDisabled}
                />

                <FormTextarea
                  label="TL / OM Remarks *"
                  name="remarks"
                  value={form?.remarks}
                  onChange={onChange}
                  rows={2}
                  placeholder="Add remarks before sending the resignation request for approval."
                  disabled={detailsDisabled}
                />
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2.5 border-t border-[#DDE5EE] bg-[#F1F5F9] px-5 py-3 2xl:py-3.5 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 font-jakarta sibs-text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting || !hasSelectedEmployee}
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg bg-[#FF5C28] px-4 2xl:px-5 font-jakarta sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1F] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Resignation"
            )}
          </button>
        </footer>
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

function ImageAttachmentPreviewModal({
  open,
  fileName,
  fileUrl,
  onClose,
}) {
  const objectUrlRef = useRef("");
  const [state, setState] = useState({
    loading: false,
    imageUrl: "",
    error: "",
  });

  useEffect(() => {
    if (!open || !fileUrl) return undefined;

    const controller = new AbortController();
    let cancelled = false;

    function revokeCurrentObjectUrl() {
      if (!objectUrlRef.current) return;

      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }

    async function loadPreview() {
      revokeCurrentObjectUrl();
      setState({
        loading: true,
        imageUrl: "",
        error: "",
      });

      try {
        const response = await fetch(fileUrl, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          let message = "Unable to load this image.";

          try {
            const payload = await response.json();
            message = payload?.message || message;
          } catch {
            // Keep the formal fallback for non-JSON responses.
          }

          throw new Error(message);
        }

        const sourceBlob = await response.blob();
        const previewBlob =
          isHeicFileName(fileName)
            ? await convertHeicBlobToJpeg(sourceBlob)
            : sourceBlob;

        if (cancelled) return;

        const objectUrl = URL.createObjectURL(previewBlob);
        objectUrlRef.current = objectUrl;

        setState({
          loading: false,
          imageUrl: objectUrl,
          error: "",
        });
      } catch (error) {
        if (
          cancelled ||
          error?.name === "AbortError"
        ) {
          return;
        }

        setState({
          loading: false,
          imageUrl: "",
          error:
            error?.message ||
            "Unable to preview this image.",
        });
      }
    }

    loadPreview();

    return () => {
      cancelled = true;
      controller.abort();
      revokeCurrentObjectUrl();
    };
  }, [open, fileName, fileUrl]);

  useEffect(() => {
    if (!open) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100020] flex items-center justify-center bg-black/75 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${fileName || "image"}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E7ECF2] bg-[#042C51] px-4 py-3 2xl:px-5 2xl:py-4">
          <div className="min-w-0">
            <p className="sibs-text-xs font-extrabold uppercase tracking-wide text-white/70">
              Image Preview
            </p>
            <h3 className="mt-0.5 truncate sibs-text-sm 2xl:text-base font-extrabold text-white">
              {fileName || "Image"}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close image preview"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex min-h-[320px] flex-1 items-center justify-center overflow-auto bg-[#111827] p-4 2xl:p-6">
          {state.loading ? (
            <div className="flex flex-col items-center gap-3 text-white">
              <Loader2 size={32} className="animate-spin" />
              <p className="sibs-text-xs font-bold">
                {isHeicFileName(fileName)
                  ? "Preparing HEIC image preview..."
                  : "Preparing image preview..."}
              </p>
            </div>
          ) : state.error ? (
            <div className="max-w-lg rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-center">
              <AlertCircle
                size={28}
                className="mx-auto text-red-500"
              />
              <p className="mt-2 sibs-text-xs font-extrabold text-red-700">
                Preview unavailable
              </p>
              <p className="mt-1 sibs-text-micro font-semibold leading-relaxed text-red-600">
                {state.error}
              </p>
            </div>
          ) : state.imageUrl ? (
            <img
              src={state.imageUrl}
              alt={fileName || "Resignation image preview"}
              className="max-h-[76vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function ViewResignationModal({ open, item, onClose }) {
  const [imagePreview, setImagePreview] = useState({
    open: false,
    fileName: "",
    fileUrl: "",
  });

  function closeImagePreview() {
    setImagePreview({
      open: false,
      fileName: "",
      fileUrl: "",
    });
  }

  useEffect(() => {
    if (!open) {
      setImagePreview({
        open: false,
        fileName: "",
        fileUrl: "",
      });
      return undefined;
    }

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

  const filedByAccess =
    filedByObject?.access ||
    filedByObject?.accessLabel ||
    item?.filedByAccess ||
    item?.filed_by_access ||
    item?.filedByRole ||
    item?.filed_by_role ||
    item?.encodedByRole ||
    item?.supervisorRole ||
    "";

  const filedBySibsId =
    filedByObject?.sibsId ||
    filedByObject?.sibs_id ||
    item?.filedBySibsId ||
    item?.filed_by_sibs_id ||
    item?.supervisorSibsId ||
    item?.supervisor_sibs_id ||
    "";

  const filedByDisplay =
    filedByAccess && filedBySibsId
      ? `${filedByAccess} (${filedBySibsId}) - ${filedByName}`
      : filedBySibsId
        ? `${filedBySibsId} - ${filedByName}`
        : filedByAccess
          ? `${filedByAccess} - ${filedByName}`
          : filedByName;

  const approvalStages = buildApprovalStageRows(item);
  const attachments = getAttachmentEntries(item);

  const employeeMeta = [
    employeeSibsId !== "--" ? employeeSibsId : "",
    employeeDepartment !== "--" ? employeeDepartment : "",
    employeeAccount !== "--" ? employeeAccount : "",
  ].filter(Boolean);

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
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[720px] 2xl:max-w-[760px] flex-col overflow-hidden rounded-[18px] border border-white/70 bg-white font-jakarta shadow-[0_24px_70px_rgba(4,44,81,0.32)] sm:max-h-[85dvh] 2xl:sm:max-h-[92dvh]"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5">
          <div className="flex min-w-0 items-center gap-2.5 2xl:gap-3">
            <span className="flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
              <UserX size={16} />
            </span>

            <div className="min-w-0">
              <h2
                id="view-resignation-title"
                className="sibs-modal-title truncate"
              >
                Resignation Case Details
              </h2>

              <p className="sibs-modal-subtitle text-white/75 truncate">
                Offboarding workflow profile
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white active:scale-[0.97]"
            aria-label="Close resignation case details"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white px-3.5 py-4 sibs-scrollbar sm:px-5 2xl:sm:px-6 sm:py-5 2xl:sm:py-6">
          <div className="space-y-4 2xl:space-y-5">
            <section className="flex flex-col gap-3 2xl:gap-4 rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] p-3 2xl:p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <ProfileAvatar item={item} size="lg" />

                <div className="min-w-0">
                  <h3 className="truncate sibs-text-sm 2xl:text-base font-extrabold text-[#042C51]">
                    {employeeName}
                  </h3>

                  <p className="mt-0.5 2xl:mt-1 line-clamp-2 sibs-text-micro font-semibold text-[#667085]">
                    {employeeMeta.length > 0
                      ? employeeMeta.join("  •  ")
                      : "Employee information unavailable"}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-start sm:items-end">
                <span className="sibs-text-micro font-extrabold uppercase text-[#98A2B3]">
                  Current Status
                </span>

                <span
                  className={`mt-1 inline-flex rounded border px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase leading-none ${getCaseStatusClass(
                    status,
                  )}`}
                >
                  {statusLabel}
                </span>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-x-4 gap-y-3 2xl:gap-x-5 2xl:gap-y-4 rounded-xl border border-[#E7ECF2] bg-[#FBFCFE] p-3 2xl:p-4 md:grid-cols-4">
              <div className="min-w-0">
                <p className="sibs-text-micro font-extrabold uppercase text-[#98A2B3]">
                  Case ID
                </p>
                <p className="mt-0.5 truncate sibs-text-xs 2xl:sibs-text-sm font-extrabold text-[#042C51]">
                  {safeText(getCaseId(item))}
                </p>
              </div>

              <div className="min-w-0">
                <p className="sibs-text-micro font-extrabold uppercase text-[#98A2B3]">
                  Filed Date
                </p>
                <p className="mt-0.5 truncate sibs-text-xs 2xl:sibs-text-sm font-bold text-[#344054]">
                  {safeText(resignationDate)}
                </p>
              </div>

              <div className="min-w-0">
                <p className="sibs-text-micro font-extrabold uppercase text-[#98A2B3]">
                  Last Working Day
                </p>
                <p className="mt-0.5 truncate sibs-text-xs 2xl:sibs-text-sm font-extrabold text-rose-600">
                  {safeText(lastWorkingDate)}
                </p>
              </div>

              <div className="min-w-0">
                <p className="sibs-text-micro font-extrabold uppercase text-[#98A2B3]">
                  Notice Cycle
                </p>
                <p className="mt-0.5 truncate sibs-text-xs 2xl:sibs-text-sm font-extrabold text-indigo-600">
                  {getNoticeCycleLabel(resignationType)}
                </p>
              </div>
            </section>

            <section>
              <h4 className="sibs-text-micro font-extrabold uppercase text-[#042C51]">
                Statement / Reason Details
              </h4>

              <div className="mt-1.5 2xl:mt-2 rounded-xl border border-[#CFE0F4] bg-[#F7FAFE] p-3 2xl:p-4">
                <span className="inline-flex max-w-full rounded border border-[#FFD7C8] bg-[#FFF0EB] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold text-[#FF5C28]">
                  <span className="truncate">Reason: {reason}</span>
                </span>

                <p className="mt-2 whitespace-pre-wrap break-words sibs-text-xs font-medium italic leading-relaxed text-[#344054]">
                  “{safeText(narrative)}”
                </p>
              </div>
            </section>

            <section>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="sibs-text-micro font-extrabold uppercase text-[#042C51]">
                  Clearance &amp; Approval Routing Stages
                </h4>

                <span className="sibs-text-micro font-extrabold uppercase text-[#7E8DA8]">
                  SOP Alignment Routing: TL → OM → SOM → HR
                </span>
              </div>

              <div className="mt-1.5 2xl:mt-2 overflow-hidden rounded-xl border border-[#D9E2EC]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#D9E2EC] bg-[#F8FAFC]">
                        <th className="px-2.5 py-2 2xl:px-3 2xl:py-3 sibs-text-micro font-extrabold text-[#8A98B8]">
                          Approval Stage
                        </th>
                        <th className="px-2.5 py-2 2xl:px-3 2xl:py-3 sibs-text-micro font-extrabold text-[#8A98B8]">
                          Designated Approver
                        </th>
                        <th className="px-2.5 py-2 2xl:px-3 2xl:py-3 text-center sibs-text-micro font-extrabold text-[#8A98B8]">
                          Status
                        </th>
                        <th className="px-2.5 py-2 2xl:px-3 2xl:py-3 sibs-text-micro font-extrabold text-[#8A98B8]">
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
                          <td className="px-2.5 py-1.5 2xl:px-3 2xl:py-3 sibs-text-xs font-extrabold text-[#042C51]">
                            {stage.stage}
                          </td>

                          <td className="px-2.5 py-1.5 2xl:px-3 2xl:py-3 sibs-text-xs font-semibold text-[#475467]">
                            {safeText(
                              stage.approver,
                              "Pending assignment",
                            )}
                          </td>

                          <td className="px-2.5 py-1.5 2xl:px-3 2xl:py-3 text-center">
                            <span
                              className={`inline-flex rounded border px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase leading-none ${getApprovalStatusClass(
                                stage.status,
                              )}`}
                            >
                              {stage.status}
                            </span>
                          </td>

                          <td className="px-2.5 py-1.5 2xl:px-3 2xl:py-3 sibs-text-micro font-semibold tabular-nums text-[#8A98B8]">
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
              <p className="sibs-text-micro font-extrabold uppercase text-[#98A2B3]">
                Attached Files ({attachments.length})
              </p>

              {attachments.length > 0 ? (
                <div className="mt-1.5 2xl:mt-2 flex flex-wrap gap-2">
                  {attachments.map((attachment) => {
                    if (!attachment.url) {
                      return (
                        <span
                          key={attachment.id}
                          title={attachment.name}
                          className="inline-flex max-w-full items-center gap-2 rounded-lg border border-[#D9E2EC] bg-[#F2F6FA] px-2.5 py-1.5 2xl:px-3 2xl:py-2 text-left sibs-text-xs font-extrabold text-[#042C51]"
                        >
                          <FileText
                            size={14}
                            className="shrink-0 text-[#7E8DA8]"
                          />
                          <span className="max-w-[240px] truncate">
                            {attachment.name}
                          </span>
                        </span>
                      );
                    }

                    if (
                      isPreviewableImageFileName(
                        attachment.name,
                      )
                    ) {
                      return (
                        <button
                          key={attachment.id}
                          type="button"
                          onClick={() =>
                            setImagePreview({
                              open: true,
                              fileName: attachment.name,
                              fileUrl: attachment.url,
                            })
                          }
                          title={`Preview ${attachment.name}`}
                          className="inline-flex max-w-full items-center gap-2 rounded-lg border border-[#D9E2EC] bg-[#F2F6FA] px-2.5 py-1.5 2xl:px-3 2xl:py-2 text-left sibs-text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
                        >
                          <FileText
                            size={14}
                            className="shrink-0 text-[#7E8DA8]"
                          />
                          <span className="max-w-[240px] truncate">
                            {attachment.name}
                          </span>
                        </button>
                      );
                    }

                    return (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Open ${attachment.name}`}
                        className="inline-flex max-w-full items-center gap-2 rounded-lg border border-[#D9E2EC] bg-[#F2F6FA] px-2.5 py-1.5 2xl:px-3 2xl:py-2 text-left sibs-text-xs font-extrabold text-[#042C51] no-underline transition hover:border-[#FF5C28]/40 hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
                      >
                        <FileText
                          size={14}
                          className="shrink-0 text-[#7E8DA8]"
                        />
                        <span className="max-w-[240px] truncate">
                          {attachment.name}
                        </span>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-1.5 sibs-text-xs font-semibold text-[#98A2B3]">
                  No files were attached to this resignation.
                </p>
              )}
            </section>
          </div>
        </div>

        <footer className="flex shrink-0 flex-col gap-2.5 2xl:gap-3 border-t border-[#EEF2F6] bg-[#F8FAFC] px-4 py-2.5 2xl:px-5 2xl:py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 truncate sibs-text-micro font-semibold text-[#7E8DA8]">
            <span className="font-extrabold text-[#667085]">
              Filed By:
            </span>{" "}
            {filedByDisplay}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8.5 2xl:h-9 shrink-0 items-center justify-center rounded-lg bg-[#E4EAF1] px-3.5 2xl:px-4 sibs-text-micro 2xl:sibs-text-xs font-extrabold text-[#23364D] transition hover:bg-[#D7E0EA] active:scale-[0.98]"
          >
            Close profile
          </button>
        </footer>

        <ImageAttachmentPreviewModal
          open={imagePreview.open}
          fileName={imagePreview.fileName}
          fileUrl={imagePreview.fileUrl}
          onClose={closeImagePreview}
        />
      </section>
    </div>,
    document.body,
  );
}