import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  formatDate,
  formatDateTime,
} from "@/components/layout/FormatDateTime";
import { useUser } from "../../../services/context/UserContext";
import StatusModal from "../../modals/StatusModal";

function mapAssignedLocation(value) {
  if (value === null || value === undefined || value === "") return "N/A";

  const raw = String(value).trim();

  if (raw === "0") return "Tagum";
  if (raw === "1") return "Davao";
  if (raw === "2") return "Both Tagum and Davao";
  if (raw === "3") return "Hybrid";

  if (raw.toLowerCase() === "tagum") return "Tagum";
  if (raw.toLowerCase() === "davao") return "Davao";
  if (raw.toLowerCase() === "both tagum and davao") {
    return "Both Tagum and Davao";
  }
  if (raw.toLowerCase() === "hybrid") return "Hybrid";

  return raw;
}

function getUploadedFileUrl(item) {
  if (!item?.uploadedFile || !item?.sibsId) return "#";

  return `${process.env.NEXT_PUBLIC_API_URL}/api/resignation/file/${encodeURIComponent(
    item.sibsId,
  )}/${encodeURIComponent(item.uploadedFile)}`;
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
      <div className="absolute right-0 top-0 h-3 w-3 border-l-2 border-b-2 border-gray-300 bg-gray-100" />
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

function UploadedFileCell({ item, className = "" }) {
  if (!item?.uploadedFile) {
    return <span className="text-sm text-gray-400">N/A</span>;
  }

  return (
    <a
      href={getUploadedFileUrl(item)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`flex w-full min-w-0 items-center gap-3 rounded-lg p-1 text-left transition hover:bg-gray-50 ${className}`}
      title={`Open ${item.uploadedFile}`}
    >
      <FileTypeIcon filename={item.uploadedFile} />

      <span className="min-w-0 truncate text-sm text-gray-700 hover:text-[var(--sibs-primary-1)]">
        {item.uploadedFile}
      </span>
    </a>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-sibs-primary-1">
        {label}
      </label>
      {children}
    </div>
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

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
      setCommentSpokenOpen(false);
      setEmployeeRetainedOpen(false);
    };
  }, [open, onClose]);

  if (!open || !selectedItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="shrink-0 border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-sibs-primary-1">
            {readOnly
              ? "View Resignation Request"
              : "Update Resignation Request"}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {readOnly
              ? "Review all resignation request details."
              : "Review all request details before saving"}
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Request ID">
                <input
                  type="text"
                  value={selectedItem.id || ""}
                  readOnly
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
                />
              </Field>

              <Field label="SiBS ID">
                <input
                  type="text"
                  value={selectedItem.sibsId || ""}
                  readOnly
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
                />
              </Field>

              <Field label="Resignation Type">
                <input
                  type="text"
                  value={selectedItem.resignationType || "N/A"}
                  readOnly
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
                />
              </Field>

              <Field label="Employee Name">
                <input
                  type="text"
                  value={selectedItem.fullName || "N/A"}
                  readOnly
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm uppercase outline-none"
                />
              </Field>

              <Field label="Assigned Location">
                <input
                  type="text"
                  value={mapAssignedLocation(selectedItem.location)}
                  readOnly
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
                />
              </Field>

              <Field label="Resignation Date">
                <input
                  type="text"
                  value={formatDate(selectedItem.resignationDate)}
                  readOnly
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
                />
              </Field>

              <Field label="Last Working Date">
                <input
                  type="text"
                  value={formatDate(selectedItem.lastWorkingDate)}
                  readOnly
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
                />
              </Field>

              <Field label="Submitted At">
                <input
                  type="text"
                  value={formatDateTime(selectedItem.createdAt)}
                  readOnly
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
                />
              </Field>

              <Field label="Supervisor SiBS ID">
                <input
                  type="text"
                  value={selectedItem.supervisorSibsId || "N/A"}
                  readOnly
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
                />
              </Field>

              <Field label="Supervisor Name">
                <input
                  type="text"
                  value={selectedItem.supervisorName || "N/A"}
                  readOnly
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm uppercase outline-none"
                />
              </Field>

              <Field label="Reason">
                <input
                  type="text"
                  value={selectedItem.reason || "N/A"}
                  readOnly
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
                />
              </Field>

              <Field label="Specify Others">
                <input
                  type="text"
                  value={selectedItem.specifyOthers || "N/A"}
                  readOnly
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
                />
              </Field>

              <Field label="Have you personally spoken to the resigning employee?">
                {readOnly ? (
                  <input
                    type="text"
                    value={form.commentSpoken || "N/A"}
                    readOnly
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
                  />
                ) : (
                  <div
                    id="comment-spoken-dropdown-wrapper"
                    className="relative"
                  >
                    <button
                      type="button"
                      onClick={() => setCommentSpokenOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-xl border border-[#D7DEE8] bg-white px-4 py-3 text-left text-sm outline-none transition focus:border-[var(--sibs-primary-1)]"
                    >
                      <span
                        className={
                          form.commentSpoken
                            ? "text-sibs-primary-1"
                            : "text-gray-400"
                        }
                      >
                        {form.commentSpoken || "Select answer"}
                      </span>

                      <ChevronDown
                        size={18}
                        className={`text-sibs-tertiary-5 transition-transform ${
                          commentSpokenOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {commentSpokenOpen && (
                      <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-lg">
                        <div className="py-2">
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
                              className={`block w-full px-4 py-3 text-left text-sm transition ${
                                form.commentSpoken === item
                                  ? "bg-[#EAF2FB] font-medium text-sibs-primary-1"
                                  : "text-sibs-primary-1 hover:bg-[#F8FAFC]"
                              }`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Field>

              <Field label="Was the employee retained (Y/N)?">
                {readOnly ? (
                  <input
                    type="text"
                    value={
                      form.employeeRetained === "1"
                        ? "Yes"
                        : form.employeeRetained === "0"
                          ? "No"
                          : "N/A"
                    }
                    readOnly
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
                  />
                ) : (
                  <div
                    id="employee-retained-dropdown-wrapper"
                    className="relative"
                  >
                    <button
                      type="button"
                      onClick={() => setEmployeeRetainedOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-xl border border-[#D7DEE8] bg-white px-4 py-3 text-left text-sm outline-none transition focus:border-[var(--sibs-primary-1)]"
                    >
                      <span
                        className={
                          form.employeeRetained !== ""
                            ? "text-sibs-primary-1"
                            : "text-gray-400"
                        }
                      >
                        {form.employeeRetained === "1"
                          ? "Yes"
                          : form.employeeRetained === "0"
                            ? "No"
                            : "Select answer"}
                      </span>

                      <ChevronDown
                        size={18}
                        className={`text-sibs-tertiary-5 transition-transform ${
                          employeeRetainedOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {employeeRetainedOpen && (
                      <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-lg">
                        <div className="py-2">
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
                              className={`block w-full px-4 py-3 text-left text-sm transition ${
                                form.employeeRetained === item.value
                                  ? "bg-[#EAF2FB] font-medium text-sibs-primary-1"
                                  : "text-sibs-primary-1 hover:bg-[#F8FAFC]"
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Field>

              {form.commentSpoken === "Yes" ? (
                <Field
                  label="What have you done/offered to retain the employee (retention efforts)?"
                  className="md:col-span-2"
                >
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
                    className={`w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition ${
                      readOnly
                        ? "border-gray-200 bg-gray-50"
                        : "border-[#D7DEE8] bg-white focus:border-[var(--sibs-primary-1)]"
                    }`}
                  />
                </Field>
              ) : null}

              <Field label="Uploaded File" className="md:col-span-2">
                {selectedItem.uploadedFile ? (
                  <UploadedFileCell
                    item={selectedItem}
                    className="w-full rounded-xl border border-[#D7DEE8] bg-white px-4 py-3 hover:bg-[#F8FAFC]"
                  />
                ) : (
                  <input
                    type="text"
                    value="N/A"
                    readOnly
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
                  />
                )}
              </Field>
            </div>
          </div>

          <div className="shrink-0 border-t px-6 py-4">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                {readOnly ? "Close" : "Cancel"}
              </button>

              {!readOnly && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[var(--sibs-primary-1)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Submit"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
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
      className={`w-full rounded-xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition ${
        canOpen ? "cursor-pointer hover:bg-gray-50" : "cursor-default"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-sibs-tertiary-5">
            {item.sibsId || "N/A"}
          </p>

          <h3 className="mt-1 text-sm font-semibold text-sibs-primary-1">
            {(item.fullName || "N/A").toUpperCase()}
          </h3>

          <p className="mt-1 text-xs text-sibs-tertiary-5">
            {item.resignationType || "N/A"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-[var(--sibs-tertiary-10)] p-3">
          <p className="text-xs text-sibs-tertiary-5">Location</p>
          <p className="mt-1 text-sm font-medium text-sibs-primary-1">
            {mapAssignedLocation(item.location)}
          </p>
        </div>

        <div className="rounded-lg bg-[var(--sibs-tertiary-10)] p-3">
          <p className="text-xs text-sibs-tertiary-5">Uploaded File</p>
          <div className="mt-2">
            <UploadedFileCell item={item} className="w-full" />
          </div>
        </div>

        <div className="rounded-lg bg-[var(--sibs-tertiary-10)] p-3">
          <p className="text-xs text-sibs-tertiary-5">Resignation Date</p>
          <p className="mt-1 text-sm font-medium text-sibs-primary-1">
            {formatDate(item.resignationDate)}
          </p>
        </div>

        <div className="rounded-lg bg-[var(--sibs-tertiary-10)] p-3">
          <p className="text-xs text-sibs-tertiary-5">Last Working Date</p>
          <p className="mt-1 text-sm font-medium text-sibs-primary-1">
            {formatDate(item.lastWorkingDate)}
          </p>
        </div>

        <div className="col-span-2 rounded-lg bg-[var(--sibs-tertiary-10)] p-3">
          <p className="text-xs text-sibs-tertiary-5">Submitted At</p>
          <p className="mt-1 text-sm font-medium text-sibs-primary-1">
            {formatDateTime(item.createdAt)}
          </p>
        </div>
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

  const loggedInSibsId = String(
    user?.username || user?.sibs_id || user?.sibsId || "",
  ).trim();

  const handleOpenEdit = (item) => {
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
      <div className="hidden min-w-0 max-w-full lg:block">
        <div
          ref={tableScrollRef}
          className="max-h-[620px] max-w-full overflow-auto"
        >
          <table className="w-full table-fixed text-sm">
            <thead className="sticky top-0 z-10 bg-gray-100">
              <tr>
                <th className="w-[7%] whitespace-nowrap p-4 text-left">
                  SiBS ID
                </th>

                <th className="w-[10%] whitespace-nowrap p-4 text-left">
                  Resignation Type
                </th>

                <th className="w-[18%] whitespace-nowrap p-4 text-left">
                  Employee Name
                </th>

                <th className="w-[11%] whitespace-nowrap p-4 text-left">
                  Assigned Location
                </th>

                <th className="w-[24%] whitespace-nowrap p-4 text-left">
                  Uploaded File
                </th>

                <th className="w-[10%] whitespace-nowrap p-4 text-left">
                  Resignation Date
                </th>

                <th className="w-[10%] whitespace-nowrap p-4 text-left">
                  Last Working Date
                </th>

                <th className="w-[10%] whitespace-nowrap p-4 text-left">
                  Submitted At
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-6 text-center">
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-6 text-center">
                    No resignation records found
                  </td>
                </tr>
              ) : (
                data.map((item) => {
                  const isAssignedSupervisor =
                    String(item.supervisorSibsId || "").trim() ===
                    loggedInSibsId;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleOpenEdit(item)}
                      className={`border-t transition hover:bg-gray-50 ${
                        isAssignedSupervisor
                          ? "cursor-pointer"
                          : "cursor-not-allowed"
                      }`}
                    >
                      <td className="w-[7%] whitespace-nowrap p-4">
                        {item.sibsId || "N/A"}
                      </td>

                      <td className="w-[10%] whitespace-nowrap p-4">
                        {item.resignationType || "N/A"}
                      </td>

                      <td className="w-[18%] p-4 font-medium">
                        <p className="truncate uppercase">
                          {item.fullName || "N/A"}
                        </p>
                      </td>

                      <td className="w-[11%] whitespace-nowrap p-4">
                        {mapAssignedLocation(item.location)}
                      </td>

                      <td className="w-[24%] min-w-0 px-4 py-3">
                        <UploadedFileCell item={item} />
                      </td>

                      <td className="w-[10%] whitespace-nowrap p-4">
                        {formatDate(item.resignationDate)}
                      </td>

                      <td className="w-[10%] whitespace-nowrap p-4">
                        {formatDate(item.lastWorkingDate)}
                      </td>

                      <td className="w-[10%] whitespace-nowrap p-4">
                        {formatDateTime(item.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="min-w-0 max-w-full lg:hidden">
        <div className="max-h-[620px] overflow-y-auto p-3">
          {loading ? (
            <div className="rounded-xl bg-white p-6 text-center text-sm">
              Loading...
            </div>
          ) : data.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center text-sm">
              No resignation records found
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((item) => {
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