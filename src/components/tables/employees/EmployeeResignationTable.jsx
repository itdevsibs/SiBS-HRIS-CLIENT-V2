import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, FileText, X } from "lucide-react";

import {
  formatDate,
  formatDateTime,
} from "@/components/layout/FormatDateTime";
import { useUser } from "../../../services/context/UserContext";
import PaginationTable from "@/services/pagination/PaginationTable";
import StatusModal from "../../modals/StatusModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
const PAGE_LIMIT = 15;

function mapAssignedLocation(value) {
  if (value === null || value === undefined || value === "") return "N/A";

  const raw = String(value).trim();

  if (raw === "0") return "Tagum";
  if (raw === "1") return "Davao";
  if (raw === "2") return "Both Tagum and Davao";
  if (raw === "3") return "Hybrid";

  const lower = raw.toLowerCase();

  if (lower === "tagum") return "Tagum";
  if (lower === "davao") return "Davao";
  if (lower === "both tagum and davao") return "Both Tagum and Davao";
  if (lower === "hybrid") return "Hybrid";

  return raw;
}

function getUploadedFileUrl(item) {
  if (!item?.uploadedFile || !item?.sibsId) return "#";

  return `${API_URL}/api/resignation/file/${encodeURIComponent(
    item.sibsId,
  )}/${encodeURIComponent(item.uploadedFile)}`;
}

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

function ReadOnlyInput({ value, className = "" }) {
  return (
    <input
      type="text"
      value={value || ""}
      readOnly
      disabled
      className={`h-12 w-full rounded-xl border border-[#D0D5DD] bg-[#F2F4F7] px-4 text-sm font-semibold text-sibs-primary-1 outline-none disabled:cursor-not-allowed disabled:border-[#D0D5DD] disabled:bg-[#F2F4F7] disabled:text-[#667085] ${className}`}
    />
  );
}

function SelectButton({ value, placeholder, open, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center justify-between rounded-xl border border-[#D0D5DD] bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
    >
      <span className={value ? "" : "text-sibs-tertiary-5"}>
        {value || placeholder}
      </span>

      <ChevronDown
        size={18}
        className={`text-sibs-tertiary-5 transition ${
          open ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}

function FileTypeIcon({ filename }) {
  const ext = filename?.split(".").pop()?.toLowerCase() || "";

  const typeMap = {
    doc: "word",
    docx: "word",
    xls: "excel",
    xlsx: "excel",
    csv: "excel",
    pdf: "pdf",
    jpg: "image",
    jpeg: "image",
    png: "image",
    gif: "image",
    webp: "image",
    svg: "image",
  };

  const type = typeMap[ext] || "file";

  const labelMap = {
    word: "W",
    excel: "X",
    pdf: "PDF",
    image: "IMG",
    file: "FILE",
  };

  const badgeClassMap = {
    word: "bg-blue-600",
    excel: "bg-green-600",
    pdf: "bg-red-600",
    image: "bg-purple-600",
    file: "bg-gray-600",
  };

  return (
    <div className="relative h-12 w-10 shrink-0" draggable={false}>
      <div className="absolute inset-0 rounded-md border-2 border-gray-300 bg-white" />
      <div className="absolute right-0 top-0 h-3 w-3 border-b-2 border-l-2 border-gray-300 bg-gray-100" />
      <div className="absolute left-1 top-1/2 h-0.5 w-6 -translate-y-1/2 bg-gray-300" />
      <div className="absolute left-1 top-[60%] h-0.5 w-5 bg-gray-300" />

      <div
        className={`absolute bottom-1 left-[-8px] rounded-md px-2 py-1 text-[10px] font-bold leading-none text-white shadow-sm ${
          badgeClassMap[type] || badgeClassMap.file
        }`}
      >
        {labelMap[type]}
      </div>
    </div>
  );
}

function UploadedFileCell({ item, className = "" }) {
  if (!item?.uploadedFile) {
    return <span className="text-sm font-semibold text-gray-400">N/A</span>;
  }

  return (
    <a
      href={getUploadedFileUrl(item)}
      target="_blank"
      rel="noopener noreferrer"
      draggable={false}
      data-no-table-drag="true"
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => e.stopPropagation()}
      className={`flex min-w-0 items-center gap-3 rounded-lg p-1 text-left text-sm font-semibold text-[#344054] no-underline transition hover:bg-slate-50 hover:text-sibs-primary-1 ${className}`}
      title={`Open ${item.uploadedFile}`}
    >
      <FileTypeIcon filename={item.uploadedFile} />

      <span
        draggable={false}
        data-no-table-drag="true"
        className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
      >
        {item.uploadedFile}
      </span>
    </a>
  );
}

function EditResignationModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
  selectedItem = null,
  form,
  setForm,
  readOnly = false,
}) {
  const [commentSpokenOpen, setCommentSpokenOpen] = useState(false);
  const [employeeRetainedOpen, setEmployeeRetainedOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    const handleClickOutside = (e) => {
      const commentSpokenDropdown = document.getElementById(
        "comment-spoken-dropdown-wrapper",
      );
      const retainedDropdown = document.getElementById(
        "employee-retained-dropdown-wrapper",
      );

      if (commentSpokenDropdown && !commentSpokenDropdown.contains(e.target)) {
        setCommentSpokenOpen(false);
      }

      if (retainedDropdown && !retainedDropdown.contains(e.target)) {
        setEmployeeRetainedOpen(false);
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

      setCommentSpokenOpen(false);
      setEmployeeRetainedOpen(false);
    };
  }, [open, onClose]);

  if (!open || !selectedItem) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex h-dvh items-center justify-center bg-black/45 px-4 py-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="border-b border-[#E6ECF2] bg-gradient-to-r from-[#F8FAFC] via-white to-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <FileText size={14} />
                {readOnly ? "Resignation Request" : "Supervisor Review"}
              </div>

              <h2 className="mt-3 text-2xl font-extrabold text-sibs-primary-1">
                {readOnly
                  ? "RESIGNATION REQUEST"
                  : "UPDATE RESIGNATION REQUEST"}
              </h2>

              <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-sibs-tertiary-5">
                {readOnly
                  ? "Review the resignation request details and uploaded file."
                  : "Review the resignation request, confirm retention discussion, and submit supervisor update."}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-5 sm:p-6">
          <div className="rounded-3xl border border-[#E6ECF2] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex flex-col gap-1">
              <h3 className="text-base font-extrabold text-[#101828]">
                Request Details
              </h3>

              <p className="text-sm font-medium text-sibs-tertiary-5">
                Review the employee resignation information below.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div>
                <FieldLabel>Request ID</FieldLabel>
                <ReadOnlyInput value={selectedItem.id || ""} />
              </div>

              <div>
                <FieldLabel>SiBS ID</FieldLabel>
                <ReadOnlyInput value={selectedItem.sibsId || ""} />
              </div>

              <div>
                <FieldLabel>Resignation Type</FieldLabel>
                <ReadOnlyInput value={selectedItem.resignationType || "N/A"} />
              </div>

              <div>
                <FieldLabel>Employee Name</FieldLabel>
                <ReadOnlyInput
                  value={selectedItem.fullName || "N/A"}
                  className="uppercase"
                />
              </div>

              <div>
                <FieldLabel>Assigned Location</FieldLabel>
                <ReadOnlyInput
                  value={mapAssignedLocation(selectedItem.location)}
                />
              </div>

              <div>
                <FieldLabel>Resignation Date</FieldLabel>
                <ReadOnlyInput
                  value={formatDate(selectedItem.resignationDate)}
                />
              </div>

              <div>
                <FieldLabel>Last Working Date</FieldLabel>
                <ReadOnlyInput
                  value={formatDate(selectedItem.lastWorkingDate)}
                />
              </div>

              <div>
                <FieldLabel>Submitted At</FieldLabel>
                <ReadOnlyInput value={formatDateTime(selectedItem.createdAt)} />
              </div>

              <div>
                <FieldLabel>Supervisor SiBS ID</FieldLabel>
                <ReadOnlyInput value={selectedItem.supervisorSibsId || "N/A"} />
              </div>

              <div>
                <FieldLabel>Supervisor Name</FieldLabel>
                <ReadOnlyInput
                  value={selectedItem.supervisorName || "N/A"}
                  className="uppercase"
                />
              </div>

              <div>
                <FieldLabel>Reason</FieldLabel>
                <ReadOnlyInput value={selectedItem.reason || "N/A"} />
              </div>

              <div>
                <FieldLabel>Specify Others</FieldLabel>
                <ReadOnlyInput value={selectedItem.specifyOthers || "N/A"} />
              </div>

              <div>
                <FieldLabel required={!readOnly}>
                  Have you personally spoken to the resigning employee?
                </FieldLabel>

                {readOnly ? (
                  <ReadOnlyInput value={form.commentSpoken || "N/A"} />
                ) : (
                  <div id="comment-spoken-dropdown-wrapper" className="relative">
                    <SelectButton
                      value={form.commentSpoken}
                      placeholder="Select answer"
                      open={commentSpokenOpen}
                      onClick={() => setCommentSpokenOpen((prev) => !prev)}
                    />

                    {commentSpokenOpen && (
                      <div className="absolute top-[calc(100%+8px)] z-30 w-full overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-xl">
                        {["Yes", "No"].map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({
                                ...prev,
                                commentSpoken: item,
                                commentRetain:
                                  item === "No" ? "" : prev.commentRetain,
                              }));
                              setCommentSpokenOpen(false);
                            }}
                            className={`block w-full bg-white px-4 py-3 text-left text-sm font-semibold text-sibs-primary-1 transition hover:bg-[#F8FAFC] ${
                              form.commentSpoken === item
                                ? "bg-[#EAF2FB] font-extrabold"
                                : ""
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <FieldLabel required={!readOnly}>
                  Was the employee retained (Y/N)?
                </FieldLabel>

                {readOnly ? (
                  <ReadOnlyInput
                    value={
                      form.employeeRetained === "1"
                        ? "Yes"
                        : form.employeeRetained === "0"
                          ? "No"
                          : "N/A"
                    }
                  />
                ) : (
                  <div
                    id="employee-retained-dropdown-wrapper"
                    className="relative"
                  >
                    <SelectButton
                      value={
                        form.employeeRetained === "1"
                          ? "Yes"
                          : form.employeeRetained === "0"
                            ? "No"
                            : ""
                      }
                      placeholder="Select answer"
                      open={employeeRetainedOpen}
                      onClick={() => setEmployeeRetainedOpen((prev) => !prev)}
                    />

                    {employeeRetainedOpen && (
                      <div className="absolute top-[calc(100%+8px)] z-30 w-full overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-xl">
                        {[
                          { label: "Yes", value: "1" },
                          { label: "No", value: "0" },
                        ].map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({
                                ...prev,
                                employeeRetained: item.value,
                              }));
                              setEmployeeRetainedOpen(false);
                            }}
                            className={`block w-full bg-white px-4 py-3 text-left text-sm font-semibold text-sibs-primary-1 transition hover:bg-[#F8FAFC] ${
                              form.employeeRetained === item.value
                                ? "bg-[#EAF2FB] font-extrabold"
                                : ""
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {form.commentSpoken === "Yes" && (
                <div className="lg:col-span-2">
                  <FieldLabel required={!readOnly}>
                    What have you done/offered to retain the employee
                    (retention efforts)?
                  </FieldLabel>

                  <textarea
                    value={form.commentRetain}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        commentRetain: e.target.value,
                      }))
                    }
                    rows={5}
                    readOnly={readOnly}
                    placeholder="Enter your comments here"
                    className="w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7]"
                  />
                </div>
              )}

              <div className="lg:col-span-2">
                <FieldLabel>Uploaded File</FieldLabel>

                {selectedItem.uploadedFile ? (
                  <UploadedFileCell
                    item={selectedItem}
                    className="min-h-14 rounded-xl border border-[#D0D5DD] bg-white px-4 py-2"
                  />
                ) : (
                  <ReadOnlyInput value="N/A" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#E6ECF2] bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
            >
              {readOnly ? "Close" : "Cancel"}
            </button>

            {!readOnly && (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Submit"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>,
    document.body,
  );
}

function MobileField({ label, value, full = false }) {
  return (
    <div
      className={`rounded-xl border border-[#E6ECF2] bg-slate-50 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm ${
        full ? "sm:col-span-2" : ""
      }`}
    >
      <p className="m-0 text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <strong className="mt-1 block text-sm font-bold text-sibs-primary-1">
        {value || "N/A"}
      </strong>
    </div>
  );
}

function MobileResignationCard({ item, onOpen, canOpen }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => canOpen && onOpen(item)}
      onKeyDown={(e) => {
        if (!canOpen) return;

        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(item);
        }
      }}
      className={`sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition-all duration-200 ${
        canOpen
          ? "cursor-pointer hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md active:scale-[0.99]"
          : "cursor-not-allowed opacity-80"
      }`}
    >
      <div className="min-w-0">
        <p className="m-0 text-xs font-semibold text-sibs-tertiary-5">
          {item.sibsId || "N/A"}
        </p>

        <h3 className="mt-1 text-sm font-bold leading-tight text-sibs-primary-1">
          {(item.fullName || "N/A").toUpperCase()}
        </h3>

        <span className="mt-1 block text-xs font-semibold text-sibs-tertiary-5">
          {item.resignationType || "N/A"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MobileField
          label="Location"
          value={mapAssignedLocation(item.location)}
        />

        <div className="rounded-xl border border-[#E6ECF2] bg-slate-50 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">
          <p className="m-0 text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
            Uploaded File
          </p>

          <div className="mt-2">
            <UploadedFileCell item={item} />
          </div>
        </div>

        <MobileField
          label="Resignation Date"
          value={formatDate(item.resignationDate)}
        />

        <MobileField
          label="Last Working Date"
          value={formatDate(item.lastWorkingDate)}
        />

        <MobileField
          label="Submitted At"
          value={formatDateTime(item.createdAt)}
          full
        />
      </div>
    </div>
  );
}

export default function ResignationTable({
  data = [],
  loading = false,
  onUpdateSupervisor,
}) {
  const { user } = useUser();

  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDraggingTable, setIsDraggingTable] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");

  const [form, setForm] = useState({
    commentSpoken: "",
    commentRetain: "",
    employeeRetained: "",
  });

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const tableScrollRef = useRef(null);
  const mobileScrollRef = useRef(null);

  const dragStateRef = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  const loggedInSibsId = String(
    user?.username || user?.sibs_id || user?.sibsId || "",
  ).trim();

  const safeData = Array.isArray(data) ? data : [];

  const filteredData = useMemo(() => {
    const keyword = String(search || "").trim().toLowerCase();

    return safeData.filter((item) => {
      const typeValue = String(item.resignationType || "").trim();
      const locationValue = mapAssignedLocation(item.location);

      const matchesType =
        typeFilter === "All" ||
        typeValue.toLowerCase() === typeFilter.toLowerCase();

      const matchesLocation =
        locationFilter === "All" ||
        locationValue.toLowerCase() === locationFilter.toLowerCase();

      const searchableText = [
        item.id,
        item.sibsId,
        item.fullName,
        item.resignationType,
        locationValue,
        item.reason,
        item.specifyOthers,
        item.supervisorSibsId,
        item.supervisorName,
        item.uploadedFile,
        formatDate(item.resignationDate),
        formatDate(item.lastWorkingDate),
        formatDateTime(item.createdAt),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);

      return matchesType && matchesLocation && matchesSearch;
    });
  }, [safeData, search, typeFilter, locationFilter]);

  const resignationTypeOptions = useMemo(() => {
    const types = new Set();

    safeData.forEach((item) => {
      const value = String(item.resignationType || "").trim();
      if (value) types.add(value);
    });

    return [
      { label: "All Types", value: "All" },
      ...Array.from(types)
        .sort()
        .map((value) => ({
          label: value,
          value,
        })),
    ];
  }, [safeData]);

  const locationOptions = useMemo(() => {
    const locations = new Set();

    safeData.forEach((item) => {
      const value = mapAssignedLocation(item.location);
      if (value && value !== "N/A") locations.add(value);
    });

    return [
      { label: "All Locations", value: "All" },
      ...Array.from(locations)
        .sort()
        .map((value) => ({
          label: value,
          value,
        })),
    ];
  }, [safeData]);

  const totalRecords = filteredData.length;
  const totalPages = Math.max(Math.ceil(totalRecords / PAGE_LIMIT), 1);
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const paginatedData = useMemo(() => {
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const startIndex = (safePage - 1) * PAGE_LIMIT;

    return filteredData.slice(startIndex, startIndex + PAGE_LIMIT);
  }, [filteredData, currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [data, search, typeFilter, locationFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }

    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }
  }, [currentPage, search, typeFilter, locationFilter]);

  function handlePreviousPage() {
    if (loading || !hasPreviousPage) return;
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }

  function handleNextPage() {
    if (loading || !hasNextPage) return;
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }

  function handleSearchKeyDown(e) {
    if (e.key !== "Enter") return;

    setSearch(searchInput);
    setCurrentPage(1);
  }

  function handleTypeFilter(nextValue) {
    setTypeFilter(nextValue);
    setCurrentPage(1);
  }

  function handleLocationFilter(nextValue) {
    setLocationFilter(nextValue);
    setCurrentPage(1);
  }

  function handleDragStart(e) {
    if (e.button !== 0) return;

    const target = e.target;
    const isInteractiveElement = target.closest(
      "button, a, input, select, textarea, [data-no-table-drag='true']",
    );

    if (isInteractiveElement) return;

    const container = tableScrollRef.current;
    if (!container) return;

    dragStateRef.current = {
      isDown: true,
      startX: e.pageX - container.offsetLeft,
      scrollLeft: container.scrollLeft,
      moved: false,
    };

    setIsDraggingTable(true);
  }

  function handleDragMove(e) {
    const container = tableScrollRef.current;
    const dragState = dragStateRef.current;

    if (!dragState.isDown || !container) return;

    e.preventDefault();

    const x = e.pageX - container.offsetLeft;
    const walk = (x - dragState.startX) * 1.4;

    if (Math.abs(walk) > 4) {
      dragStateRef.current.moved = true;
    }

    container.scrollLeft = dragState.scrollLeft - walk;
  }

  function handleDragEnd() {
    dragStateRef.current.isDown = false;

    window.setTimeout(() => {
      setIsDraggingTable(false);
      dragStateRef.current.moved = false;
    }, 0);
  }

  const handleOpenEdit = (item) => {
    if (dragStateRef.current.moved) return;

    const isAssignedSupervisor =
      String(item.supervisorSibsId || "").trim() === loggedInSibsId;

    if (!isAssignedSupervisor) return;

    const normalizedCommentSpoken = String(
      item.comment_spoken ?? item.commentSpoken ?? "",
    )
      .trim()
      .toLowerCase();

    setSelectedItem(item);
    setForm({
      commentSpoken:
        normalizedCommentSpoken === "yes"
          ? "Yes"
          : normalizedCommentSpoken === "no"
            ? "No"
            : "",
      commentRetain: item.comment_retain ?? item.commentRetain ?? "",
      employeeRetained:
        item.employee_retained !== null && item.employee_retained !== undefined
          ? String(item.employee_retained)
          : item.employeeRetained !== null && item.employeeRetained !== undefined
            ? String(item.employeeRetained)
            : "",
    });

    setOpenEditModal(true);
  };

  const handleCloseEdit = () => {
    setOpenEditModal(false);
    setSelectedItem(null);
    setForm({
      commentSpoken: "",
      commentRetain: "",
      employeeRetained: "",
    });
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();

    if (!selectedItem) return;

    if (!form.commentSpoken) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Validation Error",
        message:
          "Please select if you have personally spoken to the resigning employee.",
      });
      return;
    }

    if (!form.employeeRetained) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Validation Error",
        message: "Please select if the employee was retained.",
      });
      return;
    }

    if (
      form.commentSpoken === "Yes" &&
      !String(form.commentRetain || "").trim()
    ) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Validation Error",
        message: "Please enter your retention efforts.",
      });
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        id: selectedItem.id,
        commentSpoken: form.commentSpoken,
        commentRetain:
          form.commentSpoken === "Yes"
            ? String(form.commentRetain || "").trim()
            : "",
        employeeRetained: String(form.employeeRetained),
      };

      if (onUpdateSupervisor) {
        const result = await onUpdateSupervisor(payload);

        setStatusModal({
          open: true,
          type: "success",
          title: "Resignation Updated",
          message:
            result?.message || "The resignation request was saved successfully.",
        });
      }

      handleCloseEdit();
    } catch (error) {
      console.error(
        "Failed to update resignation:",
        error?.response?.data || error,
      );

      setStatusModal({
        open: true,
        type: "error",
        title: "Update Failed",
        message:
          error?.response?.data?.message || "Failed to update resignation.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-w-0 overflow-hidden rounded-xl bg-white">
        <div className="p-4 sm:p-5">
          <PaginationTable
            title="Resignation Records"
            subtitle="Search and filter resignation requests loaded in this table."
            loading={loading}
            searchValue={searchInput}
            searchPlaceholder="Search resignation then press Enter"
            onSearchChange={(value) => setSearchInput(value)}
            onSearchKeyDown={handleSearchKeyDown}
            filters={[
              {
                key: "type",
                value: typeFilter,
                onChange: handleTypeFilter,
                options: resignationTypeOptions,
              },
              {
                key: "location",
                value: locationFilter,
                onChange: handleLocationFilter,
                options: locationOptions,
              },
            ]}
            showPagination={false}
            className="mb-5"
          />

          <div className="hidden overflow-hidden rounded-xl border border-[#E6ECF2] lg:block">
            <div
              ref={tableScrollRef}
              onMouseDown={handleDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              className={`max-h-[620px] overflow-auto select-none ${
                isDraggingTable ? "cursor-grabbing" : "cursor-grab"
              }`}
            >
              <table className="w-full min-w-[1280px] table-fixed border-collapse bg-white">
                <colgroup>
                  <col className="w-[110px]" />
                  <col className="w-[180px]" />
                  <col className="w-[240px]" />
                  <col className="w-[190px]" />
                  <col className="w-[280px]" />
                  <col className="w-[180px]" />
                  <col className="w-[190px]" />
                  <col className="w-[180px]" />
                </colgroup>

                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr>
                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      SiBS ID
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Resignation Type
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Employee Name
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Assigned Location
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Uploaded File
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Resignation Date
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Last Working Date
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Submitted At
                    </th>
                  </tr>
                </thead>

                <tbody key={`${currentPage}-${loading}-${totalRecords}`}>
                  {loading ? (
                    Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                      <tr key={index}>
                        <td
                          colSpan={8}
                          className="border-t border-[#f3f4f6] px-5 py-4"
                        >
                          <div className="h-5 w-full animate-sibs-pulse rounded bg-gray-200" />
                        </td>
                      </tr>
                    ))
                  ) : paginatedData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="border-t border-[#f3f4f6] p-10 text-center text-sm font-bold text-gray-500"
                      >
                        No resignation records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((item) => {
                      const isAssignedSupervisor =
                        String(item.supervisorSibsId || "").trim() ===
                        loggedInSibsId;

                      return (
                        <tr
                          key={item.id}
                          onClick={() => handleOpenEdit(item)}
                          className={`transition-all duration-200 hover:bg-slate-50 ${
                            isAssignedSupervisor
                              ? "cursor-pointer"
                              : "cursor-not-allowed opacity-80"
                          }`}
                        >
                          <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-sibs-primary-1">
                            {item.sibsId || "N/A"}
                          </td>

                          <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                            {item.resignationType || "N/A"}
                          </td>

                          <td className="border-t border-[#f3f4f6] px-5 py-4 text-sm font-bold text-[#101828]">
                            <p className="m-0 overflow-hidden text-ellipsis whitespace-nowrap uppercase">
                              {item.fullName || "N/A"}
                            </p>
                          </td>

                          <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                            {mapAssignedLocation(item.location)}
                          </td>

                          <td className="border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                            <UploadedFileCell item={item} />
                          </td>

                          <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                            {formatDate(item.resignationDate)}
                          </td>

                          <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                            {formatDate(item.lastWorkingDate)}
                          </td>

                          <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                            {formatDateTime(item.createdAt)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
              Hold left click and drag left or right to scroll the table.
            </p>
          </div>

          <div className="block lg:hidden">
            <div ref={mobileScrollRef} className="max-h-[620px] overflow-y-auto">
              {loading ? (
                <div className="rounded-xl border border-[#E6ECF2] bg-white p-6 text-center text-sm font-bold text-gray-500">
                  Loading...
                </div>
              ) : paginatedData.length === 0 ? (
                <div className="rounded-xl border border-[#E6ECF2] bg-white p-6 text-center text-sm font-bold text-gray-500">
                  No resignation records found.
                </div>
              ) : (
                <div
                  key={`${currentPage}-${totalRecords}-${search}-${typeFilter}-${locationFilter}`}
                  className="flex flex-col gap-3"
                >
                  {paginatedData.map((item) => {
                    const canOpen =
                      String(item.supervisorSibsId || "").trim() ===
                      loggedInSibsId;

                    return (
                      <MobileResignationCard
                        key={item.id}
                        item={item}
                        onOpen={handleOpenEdit}
                        canOpen={canOpen}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <PaginationTable
            loading={loading}
            showSearch={false}
            showPagination
            currentPage={currentPage}
            totalPages={totalPages}
            loadedCount={paginatedData.length}
            totalRecords={totalRecords}
            recordLabel="resignation records"
            onPrevious={handlePreviousPage}
            onNext={handleNextPage}
          />
        </div>
      </div>

      <EditResignationModal
        open={openEditModal}
        onClose={handleCloseEdit}
        onSubmit={handleSubmitEdit}
        submitting={submitting}
        selectedItem={selectedItem}
        form={form}
        setForm={setForm}
        readOnly={!!selectedItem?.hasAttritionRecord}
      />

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() =>
          setStatusModal({
            open: false,
            type: "success",
            title: "",
            message: "",
          })
        }
      />
    </>
  );
}