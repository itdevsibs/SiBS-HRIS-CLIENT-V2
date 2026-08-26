import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, ChevronDown, UserRound, X } from "lucide-react";
import api from "../../../lib/axios/api-template";
import { useUser } from "../../../services/context/UserContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const REASONS = [
  "Personal Reasons",
  "Career Growth",
  "Health Reasons",
  "Relocation",
  "Family Reasons",
  "Work Environment",
  "Compensation and Benefits",
  "Other",
];

function normalizeSibsId(value) {
  const cleanValue = String(value || "").trim();

  if (!cleanValue) return "";

  const numericValue = Number(cleanValue);

  if (Number.isFinite(numericValue)) {
    return String(numericValue);
  }

  return cleanValue;
}

function isSameSibsId(a, b) {
  const cleanA = String(a || "").trim();
  const cleanB = String(b || "").trim();

  if (!cleanA || !cleanB) return false;

  return cleanA === cleanB || normalizeSibsId(cleanA) === normalizeSibsId(cleanB);
}

function formatPerson(sibsId, fullName) {
  if (!sibsId && !fullName) return "N/A";
  return `${sibsId || "N/A"} - ${fullName || "N/A"}`;
}

function formatEmployeeDisplay(employee) {
  if (!employee) return "";

  const sibsId = employee.sibsId || "";
  const fullName = employee.fullName || "";

  if (sibsId && fullName) return `${sibsId} - ${fullName}`;
  if (sibsId) return sibsId;
  if (fullName) return fullName;

  return "";
}

function FileTypeIcon({ filename }) {
  const ext = String(filename || "").split(".").pop()?.toLowerCase() || "";

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

function ApproverSection({
  title,
  person,
  approvedName,
  declinedName,
  remarksName,
  approvedValue,
  declinedValue,
  remarksValue,
  editable,
  readOnly = false,
  onChange = () => {},
}) {
  const handleToggleApproved = () => {
    if (!editable || readOnly) return;

    onChange({
      target: {
        name: approvedName,
        type: "checkbox",
        checked: true,
      },
    });

    onChange({
      target: {
        name: declinedName,
        type: "checkbox",
        checked: false,
      },
    });
  };

  const handleToggleDeclined = () => {
    if (!editable || readOnly) return;

    onChange({
      target: {
        name: declinedName,
        type: "checkbox",
        checked: true,
      },
    });

    onChange({
      target: {
        name: approvedName,
        type: "checkbox",
        checked: false,
      },
    });
  };

  const isApproved = Number(approvedValue) === 1 || approvedValue === true;
  const isDeclined = Number(declinedValue) === 1 || declinedValue === true;

  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-sibs-tertiary-10 p-4">
      <div className="mb-2 flex items-center gap-2">
        <UserRound size={16} className="text-sibs-primary-1" />
        <p className="text-sm font-semibold text-sibs-primary-1">{title}</p>
      </div>

      <p className="text-sm text-sibs-tertiary-5">
        {formatPerson(person?.sibsId, person?.fullName)}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleToggleApproved}
          disabled={readOnly || !editable}
          className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 ${
            isApproved
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-[#D7DEE8] bg-white text-sibs-primary-1 hover:bg-[#F8FAFC]"
          }`}
        >
          Approve
        </button>

        <button
          type="button"
          onClick={handleToggleDeclined}
          disabled={readOnly || !editable}
          className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 ${
            isDeclined
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-[#D7DEE8] bg-white text-sibs-primary-1 hover:bg-[#F8FAFC]"
          }`}
        >
          Decline
        </button>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-sibs-primary-1">
          Remarks
        </label>

        <textarea
          name={remarksName}
          value={remarksValue || ""}
          onChange={onChange}
          rows={4}
          readOnly={readOnly || !editable}
          placeholder="Enter remarks"
          className={`w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition ${
            !readOnly && editable
              ? "border-[#D7DEE8] bg-white focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
              : "border-gray-200 bg-gray-50 text-sibs-primary-1"
          }`}
        />
      </div>
    </div>
  );
}

export default function AttritionModal({
  mode = "add",
  open,
  onClose,
  onSubmit,
  form,
  onChange,
  submitting = false,
  data = null,
  formatDate,
  formatDateTime,
}) {
  const { user } = useUser();

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isAdd = mode === "add";

  const safeForm = form || {};
  const safeOnChange = typeof onChange === "function" ? onChange : () => {};
  const safeOnSubmit =
    typeof onSubmit === "function"
      ? onSubmit
      : (e) => {
          e?.preventDefault?.();
        };

  const activeData = isView ? data : safeForm;

  const [mounted, setMounted] = useState(false);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const [hierarchy, setHierarchy] = useState({
    hideTl: false,
    tl: null,
    om: null,
    som: null,
  });

  const [loadingHierarchy, setLoadingHierarchy] = useState(false);

  const dropdownRef = useRef(null);
  const reasonDropdownRef = useRef(null);
  const lastWorkingDateRef = useRef(null);

  const loggedInSibsId = String(
    user?.username || user?.sibs_id || user?.sibsId || "",
  ).trim();

  const canEditTl =
    isEdit && isSameSibsId(safeForm?.tlSibsId, loggedInSibsId);

  const canEditOm =
    isEdit && isSameSibsId(safeForm?.omSibsId, loggedInSibsId);

  const canEditSom =
    isEdit && isSameSibsId(safeForm?.somSibsId, loggedInSibsId);

  const isApproverEditMode = isEdit && (canEditTl || canEditOm || canEditSom);

  const mergedEmployeeOptions = useMemo(() => {
    if (!safeForm?.employeeSibsId) return employeeOptions;

    const exists = employeeOptions.some(
      (item) => isSameSibsId(item.sibsId, safeForm.employeeSibsId),
    );

    if (exists) return employeeOptions;

    return [
      {
        sibsId: safeForm.employeeSibsId,
        fullName:
          safeForm.employeeName || safeForm.fullName || "Selected Employee",
      },
      ...employeeOptions,
    ];
  }, [
    employeeOptions,
    safeForm?.employeeSibsId,
    safeForm?.employeeName,
    safeForm?.fullName,
  ]);

  const selectedEmployee = useMemo(() => {
    if (isView) {
      const employeeName =
        data?.employeeName ||
        data?.fullName ||
        [data?.firstName, data?.middleName, data?.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();

      return {
        sibsId: data?.sibsId || data?.employeeSibsId || "",
        fullName: employeeName || "",
      };
    }

    return (
      mergedEmployeeOptions.find((item) =>
        isSameSibsId(item.sibsId, safeForm?.employeeSibsId),
      ) || null
    );
  }, [isView, data, mergedEmployeeOptions, safeForm?.employeeSibsId]);

  const filteredEmployeeOptions = useMemo(() => {
    const keyword = employeeSearch.trim().toLowerCase();

    if (!keyword) return mergedEmployeeOptions;

    return mergedEmployeeOptions.filter((employee) => {
      const sibsId = String(employee.sibsId || "").toLowerCase();
      const fullName = String(employee.fullName || "").toLowerCase();
      const combined = `${sibsId} - ${fullName}`.toLowerCase();

      return (
        sibsId.includes(keyword) ||
        fullName.includes(keyword) ||
        combined.includes(keyword)
      );
    });
  }, [employeeSearch, mergedEmployeeOptions]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e) => {
      if (e.key === "Escape" && !submitting) {
        onClose?.();
      }
    };

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);

        if (selectedEmployee) {
          setEmployeeSearch(formatEmployeeDisplay(selectedEmployee));
        } else {
          setEmployeeSearch("");
        }
      }

      if (
        reasonDropdownRef.current &&
        !reasonDropdownRef.current.contains(e.target)
      ) {
        setReasonOpen(false);
      }
    };

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);

      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open, onClose, selectedEmployee, submitting]);

  useEffect(() => {
    if (!open || !isAdd) return;

    let isMounted = true;

    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);

        const res = await api.get("/api/attrition/manager-employees", {
          withCredentials: true,
        });

        if (!isMounted) return;

        if (res.data?.success) {
          setEmployeeOptions(res.data.data || []);
        } else {
          setEmployeeOptions([]);
        }
      } catch (error) {
        console.error("Failed to fetch manager employees:", error);

        if (isMounted) {
          setEmployeeOptions([]);
        }
      } finally {
        if (isMounted) {
          setLoadingEmployees(false);
        }
      }
    };

    fetchEmployees();

    return () => {
      isMounted = false;
    };
  }, [open, isAdd]);

  useEffect(() => {
    if (!open) return;

    if (isView) {
      if (!data) return;

      const tlName =
        data.tlName ||
        data.tlFullName ||
        (data.tl && typeof data.tl === "object" ? data.tl.fullName : "");

      const omName =
        data.omName ||
        data.omFullName ||
        (data.om && typeof data.om === "object" ? data.om.fullName : "");

      const somName =
        data.somName ||
        data.somFullName ||
        (data.som && typeof data.som === "object" ? data.som.fullName : "");

      setHierarchy({
        hideTl: !!data.hideTl,
        tl:
          data.tlSibsId || tlName
            ? {
                sibsId: data.tlSibsId || "",
                fullName: tlName || "",
              }
            : null,
        om:
          data.omSibsId || omName
            ? {
                sibsId: data.omSibsId || "",
                fullName: omName || "",
              }
            : null,
        som:
          data.somSibsId || somName
            ? {
                sibsId: data.somSibsId || "",
                fullName: somName || "",
              }
            : null,
      });

      setLoadingHierarchy(false);
      return;
    }

    if (!safeForm?.employeeSibsId) {
      setHierarchy({
        hideTl: false,
        tl: null,
        om: null,
        som: null,
      });
      return;
    }

    if (isEdit) {
      setHierarchy({
        hideTl: !!safeForm.hideTl,
        tl:
          safeForm.tlSibsId || safeForm.tlFullName
            ? {
                sibsId: safeForm.tlSibsId || "",
                fullName: safeForm.tlFullName || "",
              }
            : null,
        om:
          safeForm.omSibsId || safeForm.omFullName
            ? {
                sibsId: safeForm.omSibsId || "",
                fullName: safeForm.omFullName || "",
              }
            : null,
        som:
          safeForm.somSibsId || safeForm.somFullName
            ? {
                sibsId: safeForm.somSibsId || "",
                fullName: safeForm.somFullName || "",
              }
            : null,
      });

      setLoadingHierarchy(false);
      return;
    }

    let isMounted = true;

    const fetchHierarchy = async () => {
      try {
        setLoadingHierarchy(true);

        const res = await api.get(
          `/api/attrition/employee-hierarchy/${safeForm.employeeSibsId}`,
          {
            withCredentials: true,
          },
        );

        if (!isMounted) return;

        if (res.data?.success) {
          setHierarchy(
            res.data.data || {
              hideTl: false,
              tl: null,
              om: null,
              som: null,
            },
          );
        } else {
          setHierarchy({
            hideTl: false,
            tl: null,
            om: null,
            som: null,
          });
        }
      } catch (error) {
        console.error("Failed to fetch hierarchy:", error);

        if (isMounted) {
          setHierarchy({
            hideTl: false,
            tl: null,
            om: null,
            som: null,
          });
        }
      } finally {
        if (isMounted) {
          setLoadingHierarchy(false);
        }
      }
    };

    fetchHierarchy();

    return () => {
      isMounted = false;
    };
  }, [
    open,
    isView,
    isEdit,
    data,
    safeForm?.employeeSibsId,
    safeForm?.hideTl,
    safeForm?.tlSibsId,
    safeForm?.tlFullName,
    safeForm?.omSibsId,
    safeForm?.omFullName,
    safeForm?.somSibsId,
    safeForm?.somFullName,
  ]);

  useEffect(() => {
    if (!open) return;

    if (selectedEmployee && !dropdownOpen) {
      setEmployeeSearch(formatEmployeeDisplay(selectedEmployee));
    }

    if (!selectedEmployee && !dropdownOpen) {
      setEmployeeSearch("");
    }
  }, [open, selectedEmployee, dropdownOpen]);

  const displayedFileName =
    activeData?.uploadedFile?.name ||
    activeData?.uploadedFileName ||
    activeData?.existingUploadedFile ||
    activeData?.uploadedFile ||
    "";

  const fileOwnerSibsId =
    activeData?.employeeSibsId || activeData?.sibsId || selectedEmployee?.sibsId;

  const existingFileUrl =
    displayedFileName && fileOwnerSibsId
      ? `${API_URL}/api/resignation/file/${encodeURIComponent(
          fileOwnerSibsId,
        )}/${encodeURIComponent(displayedFileName)}`
      : "";

  const handleEmployeeSelect = (employee) => {
    safeOnChange({
      target: {
        name: "employeeSibsId",
        value: employee.sibsId,
        type: "text",
      },
    });

    if (employee.fullName) {
      safeOnChange({
        target: {
          name: "employeeName",
          value: employee.fullName,
          type: "text",
        },
      });
    }

    setEmployeeSearch(formatEmployeeDisplay(employee));
    setDropdownOpen(false);
  };

  const openDatePicker = (inputRef) => {
    if (isEdit || isView) return;

    const input = inputRef?.current;
    if (!input) return;

    input.focus();

    if (typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.click();
    }
  };

  const showTl = !hierarchy.hideTl && !!hierarchy.tl;
  const showOm = !!hierarchy.om;
  const showSom = !!hierarchy.som;

  const hierarchyGridClass = (() => {
    const count = [showTl, showOm, showSom].filter(Boolean).length;

    if (count <= 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    return "grid-cols-1 md:grid-cols-3";
  })();

  const title = isView
    ? "View Attrition"
    : isEdit
      ? "Review Attrition"
      : "Submit Attrition";

  const subtitle = isView
    ? "Attrition request details"
    : isEdit
      ? "Review and update the attrition request approval"
      : "Fill out the attrition request form";

  if (!mounted || !open || (isView && !data)) return null;

  const content = (
    <div
      className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[99999] flex h-dvh w-screen items-center justify-center p-2 font-jakarta sm:p-4"
      onClick={() => {
        if (!submitting) onClose?.();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`sibs-modal-pop-in flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl font-jakarta ${
          isView ? "max-w-2xl" : "max-w-3xl 2xl:max-w-4xl"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5">
          <div className="flex items-center gap-2.5 2xl:gap-3 min-w-0">
            <span className="flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
              <FileText size={16} />
            </span>

            <div className="min-w-0">
              <h2 className="truncate text-base sm:text-lg 2xl:text-xl font-extrabold text-white">
                {title}
              </h2>

              <p className="mt-0.5 truncate sibs-text-xs font-semibold text-white/75">{subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close attrition modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 2xl:p-6 sibs-scrollbar">
          <form onSubmit={safeOnSubmit} className="space-y-4">
            <div ref={dropdownRef} className="relative z-30">
              <label className="mb-2 block text-sm font-medium text-sibs-primary-1">
                Employee
              </label>

              {isEdit || isView ? (
                <input
                  type="text"
                  value={formatEmployeeDisplay(selectedEmployee) || "N/A"}
                  readOnly
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-sibs-primary-1 outline-none"
                />
              ) : (
                <>
                  <div className="relative">
                    <input
                      type="text"
                      value={employeeSearch}
                      onChange={(e) => {
                        setEmployeeSearch(e.target.value);
                        setDropdownOpen(true);
                        setReasonOpen(false);
                      }}
                      onFocus={(e) => {
                        setDropdownOpen(true);
                        setReasonOpen(false);
                        e.target.select();
                      }}
                      placeholder="Search SiBS ID or employee name"
                      autoComplete="off"
                      className="w-full rounded-xl border border-[#D7DEE8] bg-white px-4 py-3 pr-10 text-sm text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                    />

                    <ChevronDown
                      size={18}
                      className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sibs-tertiary-5 transition-transform ${
                        dropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {dropdownOpen && isAdd && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-xl border border-sibs-tertiary-9 bg-white shadow-2xl">
                      {loadingEmployees ? (
                        <div className="px-4 py-3 text-sm text-sibs-tertiary-5">
                          Searching...
                        </div>
                      ) : filteredEmployeeOptions.length > 0 ? (
                        filteredEmployeeOptions.map((employee) => {
                          const isSelected = isSameSibsId(
                            safeForm?.employeeSibsId,
                            employee.sibsId,
                          );

                          return (
                            <button
                              key={employee.sibsId}
                              type="button"
                              onClick={() => handleEmployeeSelect(employee)}
                              className={`block w-full border-b border-sibs-tertiary-9 px-4 py-3 text-left transition last:border-b-0 ${
                                isSelected
                                  ? "bg-[#EAF2FB] font-medium text-sibs-primary-1"
                                  : "text-sibs-primary-1 hover:bg-sibs-tertiary-10"
                              }`}
                            >
                              <div className="text-sm font-semibold text-sibs-primary-1">
                                {employee.sibsId}
                              </div>

                              <div className="text-xs text-sibs-tertiary-5">
                                {employee.fullName}
                              </div>
                            </button>
                          );
                        })
                      ) : employeeSearch.trim() ? (
                        <div className="px-4 py-3 text-sm text-sibs-tertiary-5">
                          No employees found
                        </div>
                      ) : (
                        <div className="px-4 py-3 text-sm text-sibs-tertiary-5">
                          Type to search
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-sibs-primary-1">
                  Notice Date
                </label>

                {isView ? (
                  <div className="w-full rounded-xl border border-[#D7DEE8] px-4 py-2.5 text-sm text-sibs-primary-1">
                    {formatDate
                      ? formatDate(data?.attritionDate)
                      : data?.attritionDate || "N/A"}
                  </div>
                ) : (
                  <input
                    type="date"
                    name="attritionDate"
                    value={safeForm.attritionDate || ""}
                    onChange={safeOnChange}
                    readOnly={isEdit}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${
                      isEdit
                        ? "border-gray-200 bg-gray-50"
                        : "border-[#D7DEE8] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                    }`}
                    required
                  />
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-sibs-primary-1">
                  Last Working Date
                </label>

                {isView ? (
                  <div className="w-full rounded-xl border border-[#D7DEE8] px-4 py-2.5 text-sm text-sibs-primary-1">
                    {formatDate
                      ? formatDate(data?.lastWorkingDate)
                      : data?.lastWorkingDate || "N/A"}
                  </div>
                ) : (
                  <div
                    onClick={() => openDatePicker(lastWorkingDateRef)}
                    className={`w-full rounded-xl border px-4 py-2.5 transition ${
                      isEdit
                        ? "cursor-not-allowed border-gray-200 bg-gray-50"
                        : "cursor-pointer border-[#D7DEE8] bg-white focus-within:border-sibs-primary-1 hover:border-sibs-primary-1"
                    }`}
                  >
                    <input
                      ref={lastWorkingDateRef}
                      type="date"
                      name="lastWorkingDate"
                      value={safeForm.lastWorkingDate || ""}
                      onChange={safeOnChange}
                      readOnly={isEdit}
                      className={`w-full bg-transparent text-sm outline-none ${
                        isEdit ? "cursor-not-allowed" : "cursor-pointer"
                      }`}
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            {loadingHierarchy && isAdd && (
              <div className="rounded-xl border border-[#E6ECF2] bg-sibs-tertiary-10 px-4 py-3 text-sm text-sibs-tertiary-5">
                Loading approval hierarchy...
              </div>
            )}

            <div className={`grid gap-4 ${hierarchyGridClass}`}>
              {showTl && (
                <ApproverSection
                  title="TL / Manager"
                  person={hierarchy.tl}
                  approvedName="tlIsApproved"
                  declinedName="tlIsDeclined"
                  remarksName="tlRemarks"
                  approvedValue={activeData?.tlIsApproved}
                  declinedValue={activeData?.tlIsDeclined}
                  remarksValue={activeData?.tlRemarks}
                  editable={canEditTl}
                  readOnly={isView}
                  onChange={safeOnChange}
                />
              )}

              {showOm && (
                <ApproverSection
                  title="OM"
                  person={hierarchy.om}
                  approvedName="omIsApproved"
                  declinedName="omIsDeclined"
                  remarksName="omRemarks"
                  approvedValue={activeData?.omIsApproved}
                  declinedValue={activeData?.omIsDeclined}
                  remarksValue={activeData?.omRemarks}
                  editable={canEditOm}
                  readOnly={isView}
                  onChange={safeOnChange}
                />
              )}

              {showSom && (
                <ApproverSection
                  title="SOM"
                  person={hierarchy.som}
                  approvedName="somIsApproved"
                  declinedName="somIsDeclined"
                  remarksName="somRemarks"
                  approvedValue={activeData?.somIsApproved}
                  declinedValue={activeData?.somIsDeclined}
                  remarksValue={activeData?.somRemarks}
                  editable={canEditSom}
                  readOnly={isView}
                  onChange={safeOnChange}
                />
              )}
            </div>

            <div ref={reasonDropdownRef} className="relative z-20">
              <label className="mb-2 block text-sm font-medium text-sibs-primary-1">
                Reason
              </label>

              {isEdit || isView ? (
                <input
                  type="text"
                  value={activeData?.reason || "N/A"}
                  readOnly
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
                />
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setReasonOpen((prev) => !prev);
                      setDropdownOpen(false);

                      if (selectedEmployee) {
                        setEmployeeSearch(formatEmployeeDisplay(selectedEmployee));
                      }
                    }}
                    className={`relative flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left text-sm transition ${
                      reasonOpen
                        ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
                        : "border-[#D7DEE8]"
                    }`}
                  >
                    <span
                      className={
                        safeForm?.reason
                          ? "text-sibs-primary-1"
                          : "text-sibs-tertiary-5"
                      }
                    >
                      {safeForm?.reason || "Select reason"}
                    </span>

                    <ChevronDown
                      size={18}
                      className={`ml-3 shrink-0 text-sibs-tertiary-5 transition ${
                        reasonOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {reasonOpen && (
                    <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-[#D7DEE8] bg-white shadow-2xl">
                      <div className="max-h-64 overflow-y-auto">
                        {REASONS.map((reason) => {
                          const isSelected = safeForm?.reason === reason;

                          return (
                            <button
                              key={reason}
                              type="button"
                              onClick={() => {
                                safeOnChange({
                                  target: {
                                    name: "reason",
                                    value: reason,
                                    type: "text",
                                  },
                                });

                                if (reason !== "Other") {
                                  safeOnChange({
                                    target: {
                                      name: "otherReason",
                                      value: "",
                                      type: "text",
                                    },
                                  });
                                }

                                setReasonOpen(false);
                              }}
                              className={`block w-full border-b border-[#E6ECF2] px-4 py-3 text-left transition last:border-b-0 ${
                                isSelected
                                  ? "bg-sibs-tertiary-10 font-medium text-sibs-primary-1"
                                  : "text-sibs-primary-1 hover:bg-sibs-tertiary-10"
                              }`}
                            >
                              {reason}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {(activeData?.reason === "Other" || activeData?.specifyOthers) && (
              <div>
                <label className="mb-2 block text-sm font-medium text-sibs-primary-1">
                  Specify Others
                </label>

                <textarea
                  name="otherReason"
                  value={
                    isView
                      ? activeData?.specifyOthers || "N/A"
                      : activeData?.otherReason || ""
                  }
                  onChange={safeOnChange}
                  readOnly={isEdit || isView}
                  rows={4}
                  placeholder="Please specify"
                  className={`w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition ${
                    isEdit || isView
                      ? "border-gray-200 bg-gray-50"
                      : "border-[#D7DEE8] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                  }`}
                  required={!isView}
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-sibs-primary-1">
                Uploaded File
              </label>

              <div className="space-y-2">
                <div className="rounded-xl border border-[#D7DEE8] bg-white px-4 py-3">
                  {displayedFileName ? (
                    <a
                      href={existingFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <FileTypeIcon filename={displayedFileName} />

                        <span className="truncate text-sm text-sibs-tertiary-5">
                          {displayedFileName}
                        </span>
                      </div>
                    </a>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <FileTypeIcon filename="" />

                        <span className="truncate text-sm text-sibs-tertiary-5">
                          No file uploaded
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-sibs-tertiary-5">
                  {isView
                    ? `Submitted At: ${
                        formatDateTime
                          ? formatDateTime(data?.createdAt)
                          : data?.createdAt || "N/A"
                      }`
                    : "Employee uploaded file only. Uploading a new file is disabled."}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-[#DDE5EE] bg-[#F1F5F9] px-5 py-3 2xl:py-3.5 -mx-4 sm:-mx-5 2xl:-mx-6 -mb-4 sm:-mb-5 2xl:-mb-6 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#667085] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28]"
                disabled={submitting}
              >
                {isView ? "Close" : "Cancel"}
              </button>

              {!isView && (
                <button
                  type="submit"
                  disabled={submitting || (isEdit && !isApproverEditMode)}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1F] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? isEdit
                      ? "Updating..."
                      : "Submitting..."
                    : isEdit
                      ? "Update Attrition"
                      : "Submit Attrition"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(content, document.body);
}
