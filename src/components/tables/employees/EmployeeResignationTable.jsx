import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  formatDate,
  formatDateTime,
} from "@/components/layout/FormatDateTime";
import { useUser } from "../../../services/context/UserContext";
import StatusModal from "../../modals/StatusModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

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

  return `${API_URL}/api/resignation/file/${encodeURIComponent(
    item.sibsId
  )}/${encodeURIComponent(item.uploadedFile)}`;
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
    <div className="relative h-12 w-10 shrink-0">
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
    return <span className="text-sm text-gray-400">N/A</span>;
  }

  return (
    <a
      href={getUploadedFileUrl(item)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`flex min-w-0 items-center gap-3 rounded-lg p-1 text-left text-sm text-gray-700 no-underline transition hover:bg-slate-50 hover:text-sibs-primary-1 ${className}`}
      title={`Open ${item.uploadedFile}`}
    >
      <FileTypeIcon filename={item.uploadedFile} />

      <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
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

function ReadOnlyInput({ value, className = "" }) {
  return (
    <input
      type="text"
      value={value}
      readOnly
      className={`w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-sibs-primary-1 outline-none ${className}`}
    />
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
        "comment-spoken-dropdown-wrapper"
      );
      const retainedDropdown = document.getElementById(
        "employee-retained-dropdown-wrapper"
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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="shrink-0 border-b border-[#e6ecf2] px-6 py-4">
          <h2 className="m-0 text-xl font-semibold text-sibs-primary-1">
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Request ID">
                <ReadOnlyInput value={selectedItem.id || ""} />
              </Field>

              <Field label="SiBS ID">
                <ReadOnlyInput value={selectedItem.sibsId || ""} />
              </Field>

              <Field label="Resignation Type">
                <ReadOnlyInput value={selectedItem.resignationType || "N/A"} />
              </Field>

              <Field label="Employee Name">
                <ReadOnlyInput
                  value={selectedItem.fullName || "N/A"}
                  className="uppercase"
                />
              </Field>

              <Field label="Assigned Location">
                <ReadOnlyInput value={mapAssignedLocation(selectedItem.location)} />
              </Field>

              <Field label="Resignation Date">
                <ReadOnlyInput value={formatDate(selectedItem.resignationDate)} />
              </Field>

              <Field label="Last Working Date">
                <ReadOnlyInput value={formatDate(selectedItem.lastWorkingDate)} />
              </Field>

              <Field label="Submitted At">
                <ReadOnlyInput value={formatDateTime(selectedItem.createdAt)} />
              </Field>

              <Field label="Supervisor SiBS ID">
                <ReadOnlyInput value={selectedItem.supervisorSibsId || "N/A"} />
              </Field>

              <Field label="Supervisor Name">
                <ReadOnlyInput
                  value={selectedItem.supervisorName || "N/A"}
                  className="uppercase"
                />
              </Field>

              <Field label="Reason">
                <ReadOnlyInput value={selectedItem.reason || "N/A"} />
              </Field>

              <Field label="Specify Others">
                <ReadOnlyInput value={selectedItem.specifyOthers || "N/A"} />
              </Field>

              <Field label="Have you personally spoken to the resigning employee?">
                {readOnly ? (
                  <ReadOnlyInput value={form.commentSpoken || "N/A"} />
                ) : (
                  <div
                    id="comment-spoken-dropdown-wrapper"
                    className="relative"
                  >
                    <button
                      type="button"
                      onClick={() => setCommentSpokenOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-xl border border-[#d7dee8] bg-white px-4 py-3 text-left text-sm text-sibs-primary-1"
                    >
                      <span
                        className={form.commentSpoken ? "" : "text-gray-400"}
                      >
                        {form.commentSpoken || "Select answer"}
                      </span>

                      <ChevronDown
                        size={18}
                        className={`text-sibs-tertiary-5 transition ${
                          commentSpokenOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {commentSpokenOpen && (
                      <div className="absolute top-[calc(100%+8px)] z-20 w-full overflow-hidden rounded-xl border border-[#d7dee8] bg-white shadow-xl">
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
                            className={`block w-full bg-white px-4 py-3 text-left text-sm text-sibs-primary-1 hover:bg-slate-50 ${
                              form.commentSpoken === item
                                ? "bg-[#eaf2fb] font-medium"
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
              </Field>

              <Field label="Was the employee retained (Y/N)?">
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
                    <button
                      type="button"
                      onClick={() => setEmployeeRetainedOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-xl border border-[#d7dee8] bg-white px-4 py-3 text-left text-sm text-sibs-primary-1"
                    >
                      <span
                        className={
                          form.employeeRetained !== "" ? "" : "text-gray-400"
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
                        className={`text-sibs-tertiary-5 transition ${
                          employeeRetainedOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {employeeRetainedOpen && (
                      <div className="absolute top-[calc(100%+8px)] z-20 w-full overflow-hidden rounded-xl border border-[#d7dee8] bg-white shadow-xl">
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
                            className={`block w-full bg-white px-4 py-3 text-left text-sm text-sibs-primary-1 hover:bg-slate-50 ${
                              form.employeeRetained === item.value
                                ? "bg-[#eaf2fb] font-medium"
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
              </Field>

              {form.commentSpoken === "Yes" && (
                <Field
                  label="What have you done/offered to retain the employee (retention efforts)?"
                  className="sm:col-span-2"
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
                    className="w-full resize-none rounded-xl border border-[#d7dee8] bg-white px-4 py-3 text-sm text-sibs-primary-1 outline-none focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                  />
                </Field>
              )}

              <Field label="Uploaded File" className="sm:col-span-2">
                {selectedItem.uploadedFile ? (
                  <UploadedFileCell
                    item={selectedItem}
                    className="rounded-xl border border-[#d7dee8] bg-white px-4 py-3"
                  />
                ) : (
                  <ReadOnlyInput value="N/A" />
                )}
              </Field>
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-3 border-t border-[#e6ecf2] px-6 py-4 max-sm:flex-col-reverse">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 max-sm:w-full"
            >
              {readOnly ? "Close" : "Cancel"}
            </button>

            {!readOnly && (
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl border border-sibs-primary-1 bg-sibs-primary-1 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 max-sm:w-full"
              >
                {submitting ? "Saving..." : "Submit"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function MobileField({ label, value, full = false }) {
  return (
    <div
      className={`rounded-[10px] bg-sibs-tertiary-10 p-3 ${
        full ? "sm:col-span-2" : ""
      }`}
    >
      <p className="m-0 text-xs font-normal text-sibs-tertiary-5">{label}</p>

      <strong className="mt-1 block text-sm font-medium text-sibs-primary-1">
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
      className={`rounded-xl border border-[#e6ecf2] bg-white p-4 text-left shadow-sm transition ${
        canOpen
          ? "cursor-pointer hover:bg-slate-50 hover:shadow-md"
          : "cursor-not-allowed opacity-80"
      }`}
    >
      <div className="min-w-0">
        <p className="m-0 text-xs font-medium text-sibs-tertiary-5">
          {item.sibsId || "N/A"}
        </p>

        <h3 className="mt-1 text-sm font-semibold leading-tight text-sibs-primary-1">
          {(item.fullName || "N/A").toUpperCase()}
        </h3>

        <span className="mt-1 block text-xs text-sibs-tertiary-5">
          {item.resignationType || "N/A"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MobileField label="Location" value={mapAssignedLocation(item.location)} />

        <div className="rounded-[10px] bg-sibs-tertiary-10 p-3">
          <p className="m-0 text-xs font-normal text-sibs-tertiary-5">
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
    user?.username || user?.sibs_id || user?.sibsId || ""
  ).trim();

  const handleOpenEdit = (item) => {
    const isAssignedSupervisor =
      String(item.supervisorSibsId || "").trim() === loggedInSibsId;

    if (!isAssignedSupervisor) return;

    const normalizedCommentSpoken = String(
      item.comment_spoken ?? item.commentSpoken ?? ""
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
        error?.response?.data || error
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
      <div className="hidden min-w-0 lg:block">
        <div ref={tableScrollRef} className="max-h-[620px] overflow-auto">
          <table className="w-full table-fixed border-collapse bg-white text-sm text-sibs-primary-1">
            <thead className="sticky top-0 z-10 bg-[#f3f4f6]">
              <tr>
                <th className="w-[7%] h-12 whitespace-nowrap px-4 text-left text-sm font-semibold text-sibs-primary-1">
                  SiBS ID
                </th>
                <th className="w-[10%] h-12 whitespace-nowrap px-4 text-left text-sm font-semibold text-sibs-primary-1">
                  Resignation Type
                </th>
                <th className="w-[18%] h-12 whitespace-nowrap px-4 text-left text-sm font-semibold text-sibs-primary-1">
                  Employee Name
                </th>
                <th className="w-[11%] h-12 whitespace-nowrap px-4 text-left text-sm font-semibold text-sibs-primary-1">
                  Assigned Location
                </th>
                <th className="w-[24%] h-12 whitespace-nowrap px-4 text-left text-sm font-semibold text-sibs-primary-1">
                  Uploaded File
                </th>
                <th className="w-[10%] h-12 whitespace-nowrap px-4 text-left text-sm font-semibold text-sibs-primary-1">
                  Resignation Date
                </th>
                <th className="w-[10%] h-12 whitespace-nowrap px-4 text-left text-sm font-semibold text-sibs-primary-1">
                  Last Working Date
                </th>
                <th className="w-[10%] h-12 whitespace-nowrap px-4 text-left text-sm font-semibold text-sibs-primary-1">
                  Submitted At
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="h-24 text-center text-sibs-tertiary-5"
                  >
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="h-24 text-center text-sibs-tertiary-5"
                  >
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
                      className={`transition hover:bg-slate-50 ${
                        isAssignedSupervisor
                          ? "cursor-pointer"
                          : "cursor-not-allowed"
                      }`}
                    >
                      <td className="h-[58px] whitespace-nowrap border-t border-[#e6ecf2] px-4 text-sm text-sibs-primary-1">
                        {item.sibsId || "N/A"}
                      </td>

                      <td className="h-[58px] whitespace-nowrap border-t border-[#e6ecf2] px-4 text-sm text-sibs-primary-1">
                        {item.resignationType || "N/A"}
                      </td>

                      <td className="h-[58px] whitespace-nowrap border-t border-[#e6ecf2] px-4 text-sm text-sibs-primary-1">
                        <p className="m-0 overflow-hidden text-ellipsis whitespace-nowrap font-medium uppercase">
                          {item.fullName || "N/A"}
                        </p>
                      </td>

                      <td className="h-[58px] whitespace-nowrap border-t border-[#e6ecf2] px-4 text-sm text-sibs-primary-1">
                        {mapAssignedLocation(item.location)}
                      </td>

                      <td className="h-[58px] whitespace-nowrap border-t border-[#e6ecf2] px-4 text-sm text-sibs-primary-1">
                        <UploadedFileCell item={item} />
                      </td>

                      <td className="h-[58px] whitespace-nowrap border-t border-[#e6ecf2] px-4 text-sm text-sibs-primary-1">
                        {formatDate(item.resignationDate)}
                      </td>

                      <td className="h-[58px] whitespace-nowrap border-t border-[#e6ecf2] px-4 text-sm text-sibs-primary-1">
                        {formatDate(item.lastWorkingDate)}
                      </td>

                      <td className="h-[58px] whitespace-nowrap border-t border-[#e6ecf2] px-4 text-sm text-sibs-primary-1">
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

      <div className="block min-w-0 lg:hidden">
        <div className="max-h-[620px] overflow-y-auto p-3">
          {loading ? (
            <div className="rounded-xl bg-white p-6 text-center text-sm text-sibs-tertiary-5">
              Loading...
            </div>
          ) : data.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center text-sm text-sibs-tertiary-5">
              No resignation records found
            </div>
          ) : (
            <div className="flex flex-col gap-3">
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