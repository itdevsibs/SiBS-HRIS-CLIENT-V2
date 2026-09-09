import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  ShieldAlert,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import {
  getEditResignationData,
  retractResignation,
  saveResignation,
  updateResignation,
} from "../../../lib/axios/getResignation";
import { useResignationList } from "../../../services/context/ResignationListContext";

const resignationReasons = [
  "Career Change / Advancement",
  "Health",
  "Greener Pasture",
  "Relocation",
  "Studies / School",
  "Family",
  "Grievance against Co-Worker",
  "Grievance against Management",
  "Personal - Transportation",
  "Other",
];

const resignationTypes = ["Formal", "Immediate"];

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatPerson(sibsId, fullName) {
  if (!sibsId && !fullName) return "N/A";
  return `${sibsId || "N/A"} - ${fullName || "N/A"}`;
}

function toDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(value) {
  if (!value) return null;

  const [year, month, day] = String(value).split("-").map(Number);

  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function formatDisplayDate(value) {
  const date = parseDateKey(value);

  if (!date) return "Select date";

  return date.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getCalendarCells(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return date;
  });
}

function FileTypeIcon({ filename }) {
  const ext = filename?.split(".").pop()?.toLowerCase() || "";

  const config = {
    doc: { label: "W", color: "bg-blue-600" },
    docx: { label: "W", color: "bg-blue-600" },
    xls: { label: "X", color: "bg-green-600" },
    xlsx: { label: "X", color: "bg-green-600" },
    csv: { label: "X", color: "bg-green-600" },
    pdf: { label: "PDF", color: "bg-red-600" },
    jpg: { label: "IMG", color: "bg-purple-600" },
    jpeg: { label: "IMG", color: "bg-purple-600" },
    png: { label: "IMG", color: "bg-purple-600" },
    gif: { label: "IMG", color: "bg-purple-600" },
    webp: { label: "IMG", color: "bg-purple-600" },
    svg: { label: "IMG", color: "bg-purple-600" },
    heic: { label: "IMG", color: "bg-purple-600" },
    heif: { label: "IMG", color: "bg-purple-600" },
  };

  const file = config[ext] || { label: "FILE", color: "bg-gray-600" };

  return (
    <div className="relative h-12 w-10 shrink-0">
      <div className="absolute inset-0 rounded-md border-2 border-gray-300 bg-white" />
      <div className="absolute right-0 top-0 h-3 w-3 border-b-2 border-l-2 border-gray-300 bg-gray-100" />
      <div className="absolute left-1 top-1/2 h-[2px] w-6 -translate-y-1/2 bg-gray-300" />
      <div className="absolute left-1 top-[60%] h-[2px] w-5 bg-gray-300" />

      <div
        className={`absolute -left-2 bottom-1 rounded-md px-2 py-1 text-[10px] font-bold text-white shadow ${file.color}`}
      >
        {file.label}
      </div>
    </div>
  );
}

function getTodayDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(dateString, days) {
  const date = parseDateKey(dateString) || parseDateKey(getTodayDate());
  if (!date) return "";

  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function getImmediateMinDate(resignationDate) {
  return addDays(resignationDate || getTodayDate(), 1);
}

function getImmediateMaxDate(resignationDate) {
  return addDays(resignationDate || getTodayDate(), 29);
}

function getInitialForm() {
  return {
    resignationType: "",
    resignationDate: getTodayDate(),
    lastWorkingDate: "",
    reason: "",
    otherReason: "",
    remarks: "",
    uploadedFile: null,
  };
}

function refreshAuditNotificationsNow() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event("sibs-audit-notifications-refresh"));
}

function AnimatedDropdown({ open, children, className = "", maxHeight = "" }) {
  return (
    <div
      className={`sibs-animated-dropdown absolute z-20 mt-2 w-full ${
        open ? "open" : "closed"
      } ${className}`}
    >
      <div className="sibs-animated-dropdown-inner">
        <div className="sibs-animated-dropdown-box">
          <div className={`${maxHeight} overflow-y-auto py-2 sibs-scrollbar`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnimatedCalendarDropdown({ open, children }) {
  return (
    <div
      className={`sibs-animated-dropdown absolute right-0 z-[10050] mt-2 w-[310px] max-[380px]:right-auto max-[380px]:left-0 max-[380px]:w-[calc(100vw-48px)] ${
        open ? "open" : "closed"
      }`}
    >
      <div className="sibs-animated-dropdown-inner">
        <div className="overflow-hidden rounded-2xl border border-[#D7E3F0] bg-white shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}

function MiniCalendar({ value, min, max, onSelect, onClose }) {
  const selectedDate = parseDateKey(value);
  const minDate = parseDateKey(min);
  const maxDate = parseDateKey(max);
  const today = new Date();

  const [viewDate, setViewDate] = useState(selectedDate || minDate || today);

  const cells = useMemo(() => getCalendarCells(viewDate), [viewDate]);

  function goPreviousMonth() {
    setViewDate((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() - 1);
      return next;
    });
  }

  function goNextMonth() {
    setViewDate((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + 1);
      return next;
    });
  }

  function isDisabled(dateKey) {
    if (min && dateKey < min) return true;
    if (max && dateKey > max) return true;
    return false;
  }

  function handleSelect(date) {
    const dateKey = toDateKey(date);

    if (isDisabled(dateKey)) return;

    onSelect(dateKey);
    onClose?.();
  }

  function handleToday() {
    const todayKey = toDateKey(today);

    if (isDisabled(todayKey)) return;

    onSelect(todayKey);
    onClose?.();
  }

  function handleClear() {
    onSelect("");
    onClose?.();
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-[#E6ECF2] px-4 py-3">
        <button
          type="button"
          onClick={goPreviousMonth}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sibs-primary-1 transition hover:bg-[#EAF2FB] active:scale-[0.96]"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="text-sm font-extrabold text-sibs-primary-1">
          {MONTH_LABELS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </div>

        <button
          type="button"
          onClick={goNextMonth}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sibs-primary-1 transition hover:bg-[#EAF2FB] active:scale-[0.96]"
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="px-4 py-3">
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((day) => (
            <div
              key={day}
              className="flex h-8 items-center justify-center text-xs font-extrabold text-sibs-tertiary-5"
            >
              {day}
            </div>
          ))}

          {cells.map((date) => {
            const dateKey = toDateKey(date);
            const isCurrentMonth = date.getMonth() === viewDate.getMonth();
            const isSelected = value && dateKey === value;
            const isToday = dateKey === toDateKey(today);
            const disabled = isDisabled(dateKey);

            return (
              <button
                key={dateKey}
                type="button"
                disabled={disabled}
                onClick={() => handleSelect(date)}
                className={`flex h-9 items-center justify-center rounded-xl text-sm font-bold transition active:scale-[0.96] ${
                  isSelected
                    ? "bg-[#FF5C28] text-white shadow-sm hover:bg-[#E94F1F]"
                    : isToday
                      ? "bg-[#FFF0EB] text-[#FF5C28] font-extrabold"
                      : isCurrentMonth
                        ? "text-[#042C51] hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
                        : "text-slate-400 hover:bg-slate-50"
                } ${
                  disabled
                    ? "cursor-not-allowed bg-slate-50 text-slate-300 hover:bg-slate-50"
                    : ""
                }`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[#E6ECF2] pt-3">
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full px-3 py-2 text-xs font-extrabold text-[#667085] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={handleToday}
            disabled={isDisabled(toDateKey(today))}
            className="rounded-full px-3 py-2 text-xs font-extrabold text-[#042C51] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
          >
            Today
          </button>
        </div>
      </div>
    </div>
  );
}

function DatePickerInput({
  value,
  min,
  max,
  onChange,
  disabled = false,
  readOnly = false,
  placeholder = "Select date",
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const isDisabled = disabled || readOnly;

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    function handleEscape(e) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative h-11 w-full min-w-0">
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => {
          if (isDisabled) return;
          setOpen((prev) => !prev);
        }}
        className={`flex h-10 w-full items-center justify-between gap-3 rounded-[10px] border px-3 text-left text-xs font-semibold outline-none transition-all duration-200 ${
          isDisabled
            ? "cursor-not-allowed border-[#D7DEE8] bg-[#F2F4F7] text-[#667085]"
            : open
              ? "border-[#FF5C28] bg-white text-[#042C51] ring-4 ring-[#FF5C28]/10"
              : "border-[#D7DEE8] bg-[#F8FAFC] text-[#042C51] hover:border-[#FF5C28]/40 hover:bg-white"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays
            size={17}
            className={`shrink-0 ${
              isDisabled ? "text-sibs-tertiary-5" : "text-sibs-primary-1"
            }`}
          />

          <span
            className={`truncate ${
              value ? "text-sibs-primary-1" : "text-sibs-tertiary-5"
            }`}
          >
            {value ? formatDisplayDate(value) : placeholder}
          </span>
        </span>

        {!isDisabled && (
          <ChevronDown
            size={16}
            className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      <AnimatedCalendarDropdown open={open}>
        <MiniCalendar
          value={value}
          min={min}
          max={max}
          onSelect={onChange}
          onClose={() => setOpen(false)}
        />
      </AnimatedCalendarDropdown>
    </div>
  );
}

function WorkflowLabel({ children }) {
  return (
    <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[#334155]">
      {children}
    </p>
  );
}


export default function ResignationModal({
  open,
  onClose,
  onSuccess,
  setStatusModal,
}) {
  const [reasonOpen, setReasonOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [form, setForm] = useState(getInitialForm());

  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [extendOpenWorkingDate, setExtendOpenWorkingDate] = useState(false);
  const [extendOpenRetract, setExtendOpenRetract] = useState(false);
  const [reasonForRetracting, setReasonForRetracting] = useState("");
  const [originalLastWorkingDate, setOriginalLastWorkingDate] = useState(null);
  const [newLastWorkingDate, setNewLastWorkingDate] = useState(null);
  const [reasonForExtending, setReasonForExtending] = useState("");

  const showStatus = (payload) => {
    if (typeof setStatusModal === "function") {
      setStatusModal(payload);
    } else {
      console.warn("setStatusModal is not passed to ResignationModal");
    }
  };

  const {
    refreshResignationList,
    openEditResignationModal,
    setOpenEditResignationModal,
    resignationId,
  } = useResignationList();

  const resetForm = () => {
    setForm(getInitialForm());
    setReasonOpen(false);
    setPolicyModalOpen(false);
    setPolicyAccepted(false);
    setExtendOpenWorkingDate(false);
    setExtendOpenRetract(false);
    setReasonForRetracting("");
    setReasonForExtending("");
    setOriginalLastWorkingDate(null);
    setNewLastWorkingDate(null);
  };

  const handleClose = () => {
    if (isClosing || submitting) return;

    setReasonOpen(false);
    setPolicyModalOpen(false);
    setIsClosing(true);

    window.setTimeout(() => {
      resetForm();
      setOpenEditResignationModal(false);
      setIsClosing(false);
      onClose?.();
    }, 220);
  };

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (policyModalOpen) {
          setPolicyModalOpen(false);
          return;
        }

        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, policyModalOpen, isClosing, submitting]);

  useEffect(() => {
    if (open) {
      setIsClosing(false);
      setForm(getInitialForm());
      setReasonOpen(false);
        setPolicyModalOpen(false);
      setPolicyAccepted(false);
      setExtendOpenWorkingDate(false);
      setExtendOpenRetract(false);
    }
  }, [open]);

  useEffect(() => {
    setIsEdit(!!openEditResignationModal);
  }, [openEditResignationModal]);

  useEffect(() => {
    if (!isEdit || !resignationId) return;

    const fetchUserData = async () => {
      const res = await getEditResignationData({ id: resignationId });

      if (!res?.success) {
        console.error(res?.message || "Failed to fetch resignation data");
        return;
      }

      setOriginalLastWorkingDate(res.data.lastWorkingDate);
      setNewLastWorkingDate(res.data.lastWorkingDate);
      setForm(res.data);
    };

    fetchUserData();
  }, [isEdit, resignationId]);

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;

    if (isEdit && name === "newLastWorkingDate") {
      setNewLastWorkingDate(value);
      return;
    }

    if (type === "file") {
      setForm((prev) => ({
        ...prev,
        [name]: files?.[0] || null,
      }));
      return;
    }

    if (name === "lastWorkingDate") {
      setForm((prev) => ({
        ...prev,
        lastWorkingDate: value,
      }));

      if (form.resignationType === "Immediate" && value) {
        setPolicyAccepted(false);
        setPolicyModalOpen(true);
      }

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResignationDateSelect = (value) => {
    setForm((prev) => {
      const resignationDate = value || getTodayDate();

      const nextForm = {
        ...prev,
        resignationDate,
      };

      if (prev.resignationType === "Formal") {
        nextForm.lastWorkingDate = addDays(resignationDate, 30);
      }

      return nextForm;
    });
  };

  const handleLastWorkingDateSelect = (value) => {
    setForm((prev) => ({
      ...prev,
      lastWorkingDate: value,
    }));

    if (form.resignationType === "Immediate" && value) {
      setPolicyAccepted(false);
      setPolicyModalOpen(true);
    }
  };

  const handleNewLastWorkingDateSelect = (value) => {
    setNewLastWorkingDate(value);
  };

  const handleTypeSelect = (item) => {
    setForm((prev) => {
      if (item === "Formal") {
        return {
          ...prev,
          resignationType: item,
          lastWorkingDate: addDays(prev.resignationDate, 30),
        };
      }

      return {
        ...prev,
        resignationType: item,
        lastWorkingDate: "",
      };
    });

    setPolicyAccepted(false);
    setPolicyModalOpen(false);
  };

  const handleReasonSelect = (item) => {
    setForm((prev) => ({
      ...prev,
      reason: item,
      otherReason: item === "Other" ? prev.otherReason : "",
    }));
    setReasonOpen(false);
  };

  const validateForm = () => {
    if (!form.resignationType) {
      showStatus({
        open: true,
        type: "error",
        title: "Submission Failed",
        message: "Please select the type of resignation.",
      });
      return false;
    }

    if (!form.lastWorkingDate) {
      showStatus({
        open: true,
        type: "error",
        title: "Submission Failed",
        message: "Please select the last working date.",
      });
      return false;
    }

    if (!form.reason) {
      showStatus({
        open: true,
        type: "error",
        title: "Submission Failed",
        message: "Please select the reason for resignation.",
      });
      return false;
    }

    if (form.reason === "Other" && !String(form.otherReason || "").trim()) {
      showStatus({
        open: true,
        type: "error",
        title: "Submission Failed",
        message: "Please specify the reason.",
      });
      return false;
    }

    if (!form.uploadedFile) {
      showStatus({
        open: true,
        type: "error",
        title: "Submission Failed",
        message: "Please upload your resignation file.",
      });
      return false;
    }

    if (form.resignationType === "Immediate" && !policyAccepted) {
      setPolicyModalOpen(true);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const result = await saveResignation({
        resignationType: form.resignationType,
        reason: form.reason,
        specifyOthers: form.reason === "Other" ? form.otherReason : null,
        uploadedFile: form.uploadedFile || null,
        resignationDate: form.resignationDate,
        lastWorkingDate: form.lastWorkingDate,
        remarks: form.remarks,
      });

      if (!result?.success) {
        showStatus({
          open: true,
          type: "error",
          title: "Submission Failed",
          message: result?.message || "Failed to submit resignation.",
        });
        return;
      }

      handleClose();
      refreshResignationList();
      await onSuccess?.();
      refreshAuditNotificationsNow();

      showStatus({
        open: true,
        type: "success",
        title: "Resignation Submitted",
        message:
          result?.message ||
          "Your resignation request has been submitted successfully.",
      });
    } catch (error) {
      console.error("Failed to submit resignation:", error);

      showStatus({
        open: true,
        type: "error",
        title: "Submission Failed",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Something went wrong while submitting your resignation.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();

    if (!resignationId) {
      showStatus({
        open: true,
        type: "error",
        title: "Update Failed",
        message: "Missing resignation ID.",
      });
      return;
    }

    if (!extendOpenWorkingDate && !extendOpenRetract) {
      showStatus({
        open: true,
        type: "error",
        title: "Update Failed",
        message: "Please select an action.",
      });
      return;
    }

    if (extendOpenWorkingDate && !reasonForExtending.trim()) {
      showStatus({
        open: true,
        type: "error",
        title: "Update Failed",
        message: "Please enter the reason for extending.",
      });
      return;
    }

    if (extendOpenRetract && !reasonForRetracting.trim()) {
      showStatus({
        open: true,
        type: "error",
        title: "Update Failed",
        message: "Please enter the reason for retracting.",
      });
      return;
    }

    setSubmitting(true);

    try {
      let result;

      if (extendOpenRetract) {
        result = await retractResignation(resignationId, {
          retractReason: reasonForRetracting,
        });
      } else {
        result = await updateResignation(resignationId, {
          newLastWorkingDate,
          reasonForExtending,
        });
      }

      if (!result?.success) {
        showStatus({
          open: true,
          type: "error",
          title: "Update Failed",
          message: result?.message || "Failed to update resignation.",
        });
        return;
      }

      handleClose();
      refreshResignationList();
      await onSuccess?.();
      refreshAuditNotificationsNow();

      showStatus({
        open: true,
        type: "success",
        title: extendOpenRetract
          ? "Retraction Submitted"
          : "Extension Submitted",
        message: result?.message || "Request submitted successfully.",
      });
    } catch (error) {
      console.error("Update resignation error:", error);

      showStatus({
        open: true,
        type: "error",
        title: "Update Failed",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Something went wrong while updating resignation.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const selectedFileName = form?.uploadedFile?.name || "";
  const isFormal = form.resignationType === "Formal";
  const isImmediate = form.resignationType === "Immediate";

  const hierarchyGridClass = (() => {
    const count = [form.tlSibsId, form.omSibsId, form.somSibsId].filter(
      Boolean,
    ).length;

    if (count <= 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    return "grid-cols-1 md:grid-cols-3";
  })();

  const employeeSibsId =
    form?.employeeSibsId || form?.sibsId || form?.sibs_id || "Employee";
  const employeeName =
    form?.employeeName || form?.fullName || form?.full_name || "Current Employee";
  const employeePosition =
    form?.position || form?.jobTitle || form?.job_title || "Employee Self-Service";
  const employeeDepartment =
    form?.department || form?.departmentName || form?.department_name || "";
  const employeeAccount =
    form?.account || form?.accountName || form?.account_name || "";

  const removeSelectedFile = () => {
    setForm((prev) => ({
      ...prev,
      uploadedFile: null,
    }));
  };

  return (
    <>
      <div
        data-layout="employee-resignation-workflow-v5"
        className={`fixed inset-0 z-[10000] flex h-dvh items-center justify-center overflow-hidden bg-[#06294A]/75 p-2 font-jakarta backdrop-blur-sm sm:p-4 ${
          isClosing ? "sibs-modal-backdrop-out" : "sibs-modal-backdrop-in"
        }`}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="employee-resignation-title"
          className={`flex max-h-[calc(100dvh-1rem)] w-full max-w-[672px] flex-col overflow-hidden rounded-[18px] border border-white/70 bg-white shadow-[0_30px_90px_rgba(2,18,34,0.42)] sm:max-h-[calc(100dvh-2rem)] ${
            isClosing ? "sibs-modal-pop-out" : "sibs-modal-pop-in"
          }`}
        >
          <header className="shrink-0 bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-2.5 2xl:gap-3">
                <span className="flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
                  <FileText size={16} strokeWidth={2.2} />
                </span>

                <div className="min-w-0">
                  <h2
                    id="employee-resignation-title"
                    className="sibs-modal-title truncate text-white"
                  >
                    {isEdit
                      ? "Manage Resignation Application"
                      : "Employee Resignation Application"}
                  </h2>

                  <p className="sibs-modal-subtitle mt-0.5 truncate text-white/75">
                    Asia/Manila Timezone Aligned • SiBS Official HR Workflow
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={submitting || isClosing}
                className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close resignation modal"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="shrink-0 border-b border-[#DCE4ED] bg-[#F5F8FC] px-5 py-3 sm:px-6">
            <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <span className="rounded bg-[#E2E8F0] px-2 py-1 font-mono text-[10px] font-extrabold text-[#334155]">
                  {employeeSibsId}
                </span>

                <strong className="truncate text-sm font-extrabold text-[#07355F]">
                  {employeeName}
                </strong>

                <span className="hidden text-[#94A3B8] sm:inline">|</span>

                <span className="truncate font-semibold text-[#475569]">
                  {employeePosition}
                </span>
              </div>

              {(employeeDepartment || employeeAccount) && (
                <p className="truncate font-mono text-[10px] font-bold text-[#64748B]">
                  {[employeeDepartment, employeeAccount].filter(Boolean).join(" • ")}
                </p>
              )}
            </div>
          </div>

          <form
            onSubmit={isEdit ? handleSubmitUpdate : handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-5 sibs-scrollbar sm:px-6 sm:py-6">
              {!isEdit ? (
                <div className="space-y-5">
                  <div>
                    <WorkflowLabel>Resignation Type *</WorkflowLabel>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => handleTypeSelect("Formal")}
                        className={`flex min-h-[78px] items-start gap-3 rounded-xl border p-3 text-left transition ${
                          isFormal
                            ? "border-teal-600 bg-teal-50/80 text-teal-900 ring-2 ring-teal-600/15"
                            : "border-[#D8E0EA] bg-white text-[#334155] hover:border-teal-500/50 hover:bg-teal-50/30"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            isFormal
                              ? "bg-teal-600 text-white"
                              : "bg-[#F1F5F9] text-[#64748B]"
                          }`}
                        >
                          <CalendarDays size={17} />
                        </span>

                        <span className="min-w-0">
                          <span className="block text-xs font-extrabold">
                            Formal Notice
                          </span>
                          <span className="mt-1 block text-[11px] font-medium leading-4 text-[#64748B]">
                            Standard 30-Day Notice Period (Auto-computed)
                          </span>
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTypeSelect("Immediate")}
                        className={`flex min-h-[78px] items-start gap-3 rounded-xl border p-3 text-left transition ${
                          isImmediate
                            ? "border-amber-500 bg-amber-50/80 text-amber-900 ring-2 ring-amber-500/15"
                            : "border-[#D8E0EA] bg-white text-[#334155] hover:border-amber-500/50 hover:bg-amber-50/30"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            isImmediate
                              ? "bg-amber-500 text-white"
                              : "bg-[#F1F5F9] text-[#64748B]"
                          }`}
                        >
                          <AlertTriangle size={17} />
                        </span>

                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold">
                            Immediate Notice
                            <span className="rounded bg-amber-200 px-1.5 py-0.5 font-mono text-[9px] font-extrabold text-amber-800">
                              &lt; 30 Days
                            </span>
                          </span>
                          <span className="mt-1 block text-[11px] font-medium leading-4 text-[#64748B]">
                            Requires Policy Acknowledgment & HR Approval
                          </span>
                        </span>
                      </button>
                    </div>
                  </div>

                  {isImmediate && (
                    <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-900 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-2">
                        <ShieldAlert
                          size={17}
                          className="mt-0.5 shrink-0 text-amber-600"
                        />
                        <span className="font-semibold">
                          Immediate Resignation Policy:{" "}
                          <strong>
                            {policyAccepted
                              ? "Accepted & Verified"
                              : "Pending Acknowledgment"}
                          </strong>
                        </span>
                      </div>

                      {!policyAccepted && (
                        <button
                          type="button"
                          onClick={() => setPolicyModalOpen(true)}
                          className="shrink-0 rounded-lg bg-amber-600 px-3 py-2 text-[11px] font-extrabold text-white hover:bg-amber-700"
                        >
                          Review & Accept
                        </button>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Resignation Date *">
                      <DatePickerInput
                        value={form.resignationDate}
                        onChange={handleResignationDateSelect}
                        readOnly
                      />
                    </Field>

                    <Field label="Requested Last Working Date *">
                      <DatePickerInput
                        value={form.lastWorkingDate}
                        onChange={handleLastWorkingDateSelect}
                        readOnly={isFormal}
                        min={
                          isImmediate
                            ? getImmediateMinDate(form.resignationDate)
                            : undefined
                        }
                        max={
                          isImmediate
                            ? getImmediateMaxDate(form.resignationDate)
                            : undefined
                        }
                      />

                      {isFormal && (
                        <p className="mt-1.5 text-[10px] font-semibold leading-4 text-teal-700">
                          ✓ Automatically computed exactly +30 days from the
                          resignation date.
                        </p>
                      )}

                      {isImmediate && (
                        <p className="mt-1.5 text-[10px] font-semibold leading-4 text-amber-700">
                          Select a date from 1 to 29 days after the resignation
                          date.
                        </p>
                      )}
                    </Field>
                  </div>

                  <Field label="Reason for Resignation *">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setReasonOpen((prev) => !prev)}
                        className="flex h-10 w-full items-center justify-between rounded-[10px] border border-[#D7DEE8] bg-[#F8FAFC] px-3 text-left text-xs font-semibold text-[#042C51] outline-none transition hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10"
                      >
                        <span
                          className={
                            form.reason ? "text-[#042C51]" : "text-[#98A2B3]"
                          }
                        >
                          {form.reason || "Select reason"}
                        </span>

                        <ChevronDown
                          size={16}
                          className={`text-[#667085] transition-transform duration-200 ${
                            reasonOpen ? "rotate-180 text-[#FF5C28]" : ""
                          }`}
                        />
                      </button>

                      <AnimatedDropdown open={reasonOpen} maxHeight="max-h-60">
                        {resignationReasons.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handleReasonSelect(item)}
                            className={`block w-full px-3 py-2 text-left text-xs font-semibold transition ${
                              form.reason === item
                                ? "bg-sibs-primary-3 font-extrabold text-[#FF5C28]"
                                : "text-[#042C51] hover:bg-sibs-primary-3/50 hover:text-[#FF5C28]"
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </AnimatedDropdown>
                    </div>
                  </Field>

                  {form.reason === "Other" && (
                    <Field label="Specify Other Reason *">
                      <input
                        type="text"
                        name="otherReason"
                        value={form.otherReason}
                        onChange={handleChange}
                        placeholder="Provide specific details regarding your reason..."
                        required
                        className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-white px-4 text-xs font-semibold text-[#334155] outline-none transition placeholder:text-[#94A3B8] focus:border-[#07355F] focus:ring-4 focus:ring-[#07355F]/10"
                      />
                    </Field>
                  )}

                  <Field label="Remarks / Additional Notes (Optional)">
                    <textarea
                      name="remarks"
                      value={form.remarks}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Provide additional context, handover notes, or personal comments for HR..."
                      className="w-full resize-none rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-xs font-medium leading-5 text-[#334155] outline-none transition placeholder:text-[#94A3B8] focus:border-[#07355F] focus:ring-4 focus:ring-[#07355F]/10"
                    />
                  </Field>

                  <Field label="Upload Resignation Letter / Supporting Files *">
                    <label className="group relative flex min-h-[126px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#C8D5E5] bg-[#FAFCFF] px-4 py-5 text-center transition hover:border-[#07355F]/60 hover:bg-[#F4F8FC]">
                      <input
                        type="file"
                        name="uploadedFile"
                        onChange={handleChange}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.heic,image/heic,image/heif"
                        required={!selectedFileName}
                      />

                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF3F8] text-[#64748B] transition group-hover:bg-[#E2ECF7] group-hover:text-[#07355F]">
                        <Upload size={19} />
                      </span>

                      <p className="mt-2 text-xs font-extrabold text-[#334155]">
                        {selectedFileName
                          ? "Replace selected resignation file"
                          : "Drag & drop formal resignation letter or "}
                        {!selectedFileName && (
                          <span className="text-blue-600 underline">
                            browse computer
                          </span>
                        )}
                      </p>

                      <p className="mt-1 font-mono text-[9px] font-semibold text-[#94A3B8]">
                        Accepted formats: .pdf, .docx, .doc, .jpg, .png, .heic
                        (Max 10MB)
                      </p>
                    </label>

                    {selectedFileName && (
                      <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl border border-[#DCE4ED] bg-[#F8FAFC] px-3 py-2.5">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <FileText
                            size={16}
                            className="shrink-0 text-blue-600"
                          />
                          <span className="truncate text-xs font-bold text-[#334155]">
                            {selectedFileName}
                          </span>
                          {form?.uploadedFile?.size ? (
                            <span className="shrink-0 rounded border bg-white px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#64748B]">
                              {Math.max(
                                1,
                                Math.round(form.uploadedFile.size / 1024),
                              )}{" "}
                              KB
                            </span>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={removeSelectedFile}
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#94A3B8] transition hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Remove selected resignation file"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </Field>
                </div>
              ) : (
                <div className="space-y-4">
                  <ActionPanel
                    title="Extend Working Date"
                    description="Request to extend your current last working date."
                    checked={extendOpenWorkingDate}
                    onToggle={() => {
                      setExtendOpenWorkingDate((prev) => {
                        const next = !prev;
                        if (next) setExtendOpenRetract(false);
                        return next;
                      });
                    }}
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Resignation Date *">
                        <DatePickerInput value={form.resignationDate} readOnly />
                      </Field>

                      <Field label="New Last Working Date *">
                        <DatePickerInput
                          value={newLastWorkingDate || ""}
                          onChange={handleNewLastWorkingDateSelect}
                          min={
                            extendOpenWorkingDate && originalLastWorkingDate
                              ? addDays(originalLastWorkingDate, 1)
                              : undefined
                          }
                        />
                      </Field>
                    </div>

                    <div className="mt-4" onClick={(event) => event.stopPropagation()}>
                      <Field label="Reason for Extending *">
                        <textarea
                          name="reasonForExtending"
                          value={reasonForExtending}
                          onChange={(event) =>
                            setReasonForExtending(event.target.value)
                          }
                          rows={3}
                          placeholder="Enter the reason for extending your last working date"
                          required={extendOpenWorkingDate}
                          className="w-full resize-none rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-xs font-medium outline-none focus:border-[#07355F] focus:ring-4 focus:ring-[#07355F]/10"
                        />
                      </Field>
                    </div>
                  </ActionPanel>

                  <ActionPanel
                    title="Retract Resignation"
                    description="Request to cancel the active resignation process."
                    checked={extendOpenRetract}
                    onToggle={() => {
                      setExtendOpenRetract((prev) => {
                        const next = !prev;
                        if (next) setExtendOpenWorkingDate(false);
                        return next;
                      });
                    }}
                  >
                    <div onClick={(event) => event.stopPropagation()}>
                      <Field label="Reason for Retracting *">
                        <textarea
                          name="reasonForRetracting"
                          value={reasonForRetracting}
                          onChange={(event) =>
                            setReasonForRetracting(event.target.value)
                          }
                          rows={3}
                          placeholder="Enter the reason for retracting your resignation"
                          required={extendOpenRetract}
                          className="w-full resize-none rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-xs font-medium outline-none focus:border-[#07355F] focus:ring-4 focus:ring-[#07355F]/10"
                        />
                      </Field>
                    </div>
                  </ActionPanel>

                  <div className={`grid gap-4 ${hierarchyGridClass}`}>
                    {form.tlRemarks && (
                      <ApproverCard
                        title="TL / Manager"
                        sibsId={form.tlSibsId}
                        fullName={form.tlFullName || ""}
                        isApproved={form.tlIsApproved}
                        isDeclined={form.tlIsDeclined}
                        remarks={form.tlRemarks}
                      />
                    )}

                    {form.omRemarks && (
                      <ApproverCard
                        title="OM"
                        sibsId={form.omSibsId}
                        fullName={form.omFullName || ""}
                        isApproved={form.omIsApproved}
                        isDeclined={form.omIsDeclined}
                        remarks={form.omRemarks}
                      />
                    )}

                    {form.somRemarks && (
                      <ApproverCard
                        title="SOM"
                        sibsId={form.somSibsId}
                        fullName={form.somFullName || ""}
                        isApproved={form.somIsApproved}
                        isDeclined={form.somIsDeclined}
                        remarks={form.somRemarks}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            <footer className="shrink-0 border-t border-[#DDE5EE] bg-[#F1F5F9] px-5 py-3 2xl:py-3.5 sm:px-6">
              <div className="flex flex-col-reverse items-stretch justify-between gap-2.5 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting || isClosing}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#667085] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || isClosing}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1F] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>
                    {submitting
                      ? isEdit
                        ? "Updating..."
                        : "Submitting..."
                      : isEdit
                        ? "Submit Update Request"
                        : "Submit Resignation Application"}
                  </span>
                  {!submitting && <ArrowRight size={14} />}
                </button>
              </div>
            </footer>
          </form>
        </section>
      </div>

      {policyModalOpen && (
        <div className="sibs-modal-backdrop-in fixed inset-0 z-[10001] flex items-center justify-center bg-slate-950/80 p-4 font-jakarta backdrop-blur-md">
          <section className="w-full max-w-md overflow-hidden rounded-[18px] border border-amber-200 bg-white shadow-2xl sibs-inner-modal-pop-in">
            <header className="flex items-start justify-between gap-3 border-b border-[#E6ECF2] px-5 py-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <ShieldAlert size={21} />
                </span>

                <div>
                  <h3 className="sibs-modal-title text-[#0F172A]">
                    Immediate Resignation Policy
                  </h3>
                  <p className="sibs-modal-subtitle mt-0.5 text-amber-700">
                    Notice Period is Less than 30 Days
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPolicyModalOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                aria-label="Close immediate resignation policy"
              >
                <X size={17} />
              </button>
            </header>

            <div className="px-5 py-5">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-medium leading-5 text-amber-900">
                <p>
                  A standard notice of <strong>30 calendar days</strong> is
                  required for an orderly transition.
                </p>

                <ul className="mt-3 list-disc space-y-1.5 pl-4 text-[11px]">
                  <li>
                    Operations Manager and HR Admin approval are required.
                  </li>
                  <li>
                    Unserved notice days may affect clearance or final-pay
                    processing.
                  </li>
                  <li>
                    Supporting documents may be requested by HR.
                  </li>
                </ul>
              </div>

              <label className="mt-4 flex items-start gap-2.5 text-xs font-semibold text-[#475569]">
                <input
                  type="checkbox"
                  checked={policyAccepted}
                  onChange={(event) =>
                    setPolicyAccepted(event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 rounded border-[#CBD5E1] text-amber-600 focus:ring-amber-500"
                />
                <span>
                  I understand the consequences and agree to proceed with an
                  immediate resignation request.
                </span>
              </label>
            </div>

            <footer className="flex flex-col-reverse gap-2.5 border-t border-[#E6ECF2] px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setPolicyModalOpen(false);
                  handleTypeSelect("Formal");
                }}
                className="h-10 rounded-xl border border-[#CBD5E1] bg-white px-4 text-xs font-extrabold text-[#475569] hover:bg-[#F8FAFC]"
              >
                Use Formal Notice
              </button>

              <button
                type="button"
                onClick={() => setPolicyModalOpen(false)}
                disabled={!policyAccepted}
                className="h-10 rounded-xl bg-amber-600 px-4 text-xs font-extrabold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                I Understand & Accept
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}

function Field({ label, children }) {
  return (
    <div>
      {label ? (
        <label className="mb-1.5 block text-xs font-extrabold text-[#042C51]">
          {label}
        </label>
      ) : null}

      {children}
    </div>
  );
}

function ActionPanel({ title, description, checked, onToggle, children }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className="rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-4 py-3 transition hover:border-sibs-tertiary-4 hover:bg-white"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-sibs-primary-1">{title}</p>

          <p className="mt-0.5 text-xs text-sibs-tertiary-5">{description}</p>
        </div>

        <input
          type="checkbox"
          checked={checked}
          readOnly
          className="h-4 w-4 shrink-0 rounded border-[#D0D5DD] text-sibs-primary-1 focus:ring-sibs-primary-1"
        />
      </div>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          checked
            ? "mt-3 grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            checked
              ? "mt-2 translate-y-0 opacity-100"
              : "-translate-y-2 opacity-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function ApproverCard({
  title,
  sibsId,
  fullName,
  isApproved,
  isDeclined,
  remarks,
}) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-sibs-tertiary-10 p-4">
      <div className="mb-2 flex items-center gap-2">
        <UserRound size={16} className="text-sibs-primary-1" />
        <p className="text-sm font-semibold text-sibs-primary-1">{title}</p>
      </div>

      <p className="text-sm text-sibs-tertiary-5">
        {formatPerson(sibsId, fullName)}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-sibs-primary-1">
          <input
            type="checkbox"
            checked={Number(isApproved) === 1}
            readOnly
            disabled
            className="h-4 w-4 rounded border-[#D0D5DD] text-sibs-primary-1"
          />
          <span>Approved</span>
        </label>

        <label className="flex items-center gap-2 text-sm text-sibs-primary-1">
          <input
            type="checkbox"
            checked={Number(isDeclined) === 1}
            readOnly
            disabled
            className="h-4 w-4 rounded border-[#D0D5DD] text-sibs-primary-1"
          />
          <span>Declined</span>
        </label>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-sibs-tertiary-5">
          Remarks
        </p>

        <textarea
          value={remarks || "N/A"}
          readOnly
          rows={4}
          className="w-full resize-none rounded-xl border border-[#D7DEE8] bg-white px-3 py-2 text-sm text-sibs-primary-1 outline-none"
        />
      </div>
    </div>
  );
}