import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, ChevronDown, UserRound, X } from "lucide-react";
import api from "../../../lib/axios/api-template";
import { useUser } from "../../../services/context/UserContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

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

function formatPerson(sibsId, fullName) {
  if (!sibsId && !fullName) return "N/A";
  return `${sibsId || "N/A"} - ${fullName || "N/A"}`;
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

  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-sibs-tertiary-10 p-4">
      <div className="mb-2 flex items-center gap-2">
        <UserRound size={16} className="text-sibs-primary-1" />
        <p className="text-sm font-semibold text-sibs-primary-1">{title}</p>
      </div>

      <p className="text-sm text-sibs-tertiary-5">
        {formatPerson(person?.sibsId, person?.fullName)}
      </p>

      <div className="mt-4 flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-sibs-primary-1">
          <input
            type="checkbox"
            checked={Number(approvedValue) === 1 || approvedValue === true}
            onChange={handleToggleApproved}
            readOnly={readOnly}
            disabled={readOnly || !editable}
            className="h-4 w-4"
          />
          <span>Approved</span>
        </label>

        <label className="flex items-center gap-2 text-sm text-sibs-primary-1">
          <input
            type="checkbox"
            checked={Number(declinedValue) === 1 || declinedValue === true}
            onChange={handleToggleDeclined}
            readOnly={readOnly}
            disabled={readOnly || !editable}
            className="h-4 w-4"
          />
          <span>Declined</span>
        </label>
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
              ? "border-[#D7DEE8] bg-white focus:border-sibs-primary-1"
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
    isEdit && String(safeForm?.tlSibsId || "").trim() === loggedInSibsId;

  const canEditOm =
    isEdit && String(safeForm?.omSibsId || "").trim() === loggedInSibsId;

  const canEditSom =
    isEdit && String(safeForm?.somSibsId || "").trim() === loggedInSibsId;

  const isApproverEditMode = isEdit && (canEditTl || canEditOm || canEditSom);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
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
  }, [open, onClose]);

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

  const mergedEmployeeOptions = useMemo(() => {
    if (!safeForm?.employeeSibsId) return employeeOptions;

    const exists = employeeOptions.some(
      (item) => String(item.sibsId) === String(safeForm.employeeSibsId),
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
      mergedEmployeeOptions.find(
        (item) => String(item.sibsId) === String(safeForm?.employeeSibsId),
      ) || null
    );
  }, [isView, data, mergedEmployeeOptions, safeForm?.employeeSibsId]);

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
      ? "Edit Attrition"
      : "Submit Attrition";

  const subtitle = isView
    ? "Attrition request details"
    : isEdit
      ? "Update the attrition request form"
      : "Fill out the attrition request form";

  if (!mounted || !open || (isView && !data)) return null;

  const content = (
    <div
      className="fixed inset-0 z-[99999] flex h-dvh w-screen items-center justify-center bg-black/40 px-4 py-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${
          isView ? "max-w-2xl" : "max-w-3xl"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#E6ECF2] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sibs-tertiary-9 p-2">
              <FileText size={20} className="text-sibs-primary-1" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-sibs-primary-1">
                {title}
              </h2>

              <p className="text-sm text-sibs-tertiary-5">{subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full p-2 text-sibs-tertiary-5 transition hover:bg-sibs-tertiary-10 hover:text-sibs-primary-1 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close attrition modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <form onSubmit={safeOnSubmit} className="space-y-5">
            <div ref={dropdownRef} className="relative z-30">
              <label className="mb-2 block text-sm font-medium text-sibs-primary-1">
                Employee
              </label>

              <button
                type="button"
                disabled={isEdit || isView}
                onClick={() => {
                  if (isEdit || isView) return;
                  setDropdownOpen((prev) => !prev);
                  setReasonOpen(false);
                }}
                className={`relative flex w-full items-center justify-between rounded-xl border border-[#D7DEE8] px-4 py-3 text-left text-sm ${
                  isEdit || isView
                    ? "cursor-not-allowed bg-gray-50"
                    : "bg-white"
                }`}
              >
                <div className="min-w-0">
                  {selectedEmployee ? (
                    <div className="min-w-0">
                      <p className="truncate font-medium text-sibs-primary-1">
                        {selectedEmployee.sibsId || "N/A"}
                      </p>

                      <p className="truncate text-sm text-sibs-tertiary-5">
                        {selectedEmployee.fullName || "N/A"}
                      </p>
                    </div>
                  ) : (
                    <span className="text-sibs-tertiary-5">
                      Select employee
                    </span>
                  )}
                </div>

                {!isEdit && !isView && (
                  <ChevronDown
                    size={18}
                    className={`ml-3 shrink-0 text-sibs-tertiary-5 transition ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>

              {dropdownOpen && isAdd && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[#D7DEE8] bg-white shadow-2xl">
                  <div className="max-h-64 overflow-y-auto">
                    {loadingEmployees ? (
                      <div className="px-4 py-3 text-sm text-sibs-tertiary-5">
                        Loading employees...
                      </div>
                    ) : mergedEmployeeOptions.length > 0 ? (
                      mergedEmployeeOptions.map((employee) => {
                        const isSelected =
                          String(safeForm?.employeeSibsId) ===
                          String(employee.sibsId);

                        return (
                          <button
                            key={employee.sibsId}
                            type="button"
                            onClick={() => handleEmployeeSelect(employee)}
                            className={`block w-full border-b border-[#E6ECF2] px-4 py-3 text-left transition last:border-b-0 ${
                              isSelected
                                ? "bg-sibs-tertiary-10 font-medium text-sibs-primary-1"
                                : "text-sibs-primary-1 hover:bg-sibs-tertiary-10"
                            }`}
                          >
                            <p className="font-medium">{employee.sibsId}</p>
                            <p className="text-sm text-sibs-tertiary-5">
                              {employee.fullName}
                            </p>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-3 text-sm text-sibs-tertiary-5">
                        No employees found.
                      </div>
                    )}
                  </div>
                </div>
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
                        : "border-[#D7DEE8] focus:border-sibs-primary-1"
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
                    }}
                    className={`relative flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left text-sm transition ${
                      reasonOpen
                        ? "border-sibs-primary-1"
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
                      : "border-[#D7DEE8] focus:border-sibs-primary-1"
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

            <div className="flex justify-end gap-3 border-t border-[#E6ECF2] pt-5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#D7DEE8] px-4 py-2.5 text-sm font-medium text-sibs-tertiary-5 transition hover:bg-sibs-tertiary-10"
                disabled={submitting}
              >
                {isView ? "Close" : "Cancel"}
              </button>

              {!isView && (
                <button
                  type="submit"
                  disabled={submitting || (isEdit && !isApproverEditMode)}
                  className="rounded-xl bg-sibs-primary-1 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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