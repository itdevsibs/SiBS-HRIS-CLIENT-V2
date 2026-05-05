import { useEffect, useState } from "react";
import {
  ChevronDown,
  Paperclip,
  X,
  ArrowRight,
  UserRound,
  StepBack,
  Undo2,
} from "lucide-react";
import {
  getEditResignationData,
  saveResignation,
  updateResignation,
} from "../../../lib/axios/getResignation";
import { useResignationList } from "@/services/context/ResignationListContext";
import StatusModal from "../attrition/StatusModal";

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
    heic: { label: "IMG", color: "bg-purple-600" },
    heif: { label: "IMG", color: "bg-purple-600" },
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

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(dateString, days) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
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

export default function AddResignationModal({
  open,
  onClose,
  onSuccess,
  setStatusModal,
}) {
  const [reasonOpen, setReasonOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(getInitialForm());

  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [originalLastWorkingDate, setOriginalLastWorkingDate] = useState(null);
  const [newLastWorkingDate, setNewLastWorkingDate] = useState(null);
  const [reasonForExtending, setReasonForExtending] = useState("");
  const [openRetractStatusModal, setRetractOpenStatusModal] = useState(false);

  const showStatus = (payload) => {
    if (typeof setStatusModal === "function") {
      setStatusModal(payload);
    } else {
      console.warn("setStatusModal is not passed to AddResignationModal");
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
    setTypeOpen(false);
    setPolicyModalOpen(false);
    setPolicyAccepted(false);
  };

  const handleClose = () => {
    resetForm();
    setOpenEditResignationModal(false);
    onClose?.();
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
  }, [open, policyModalOpen]);

  useEffect(() => {
    if (open) {
      setForm(getInitialForm());
      setReasonOpen(false);
      setTypeOpen(false);
      setPolicyModalOpen(false);
      setPolicyAccepted(false);
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
    setTypeOpen(false);
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

    setSubmitting(true);

    try {
      const result = await updateResignation(resignationId, {
        resignationType: form.resignationType,
        reason: form.reason,
        otherReason: form.reason === "Other" ? form.otherReason : "",
        lastWorkingDate: form.lastWorkingDate,
        newLastWorkingDate:
          extendOpen && newLastWorkingDate !== originalLastWorkingDate
            ? newLastWorkingDate
            : "",
        reasonForExtending: extendOpen ? reasonForExtending : "",
      });

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

      showStatus({
        open: true,
        type: "success",
        title: "Resignation Updated",
        message:
          result?.message || "Your resignation request has been updated.",
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

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8">
        <div className="my-auto flex max-h-[calc(100dvh-4rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#E6ECF2] px-6 py-5">
            <div>
              <h2 className="text-2xl font-bold text-sibs-primary-1">
                {isEdit ? "Edit Resignation" : "Submit Resignation"}
              </h2>

              <p className="mt-1 text-sm text-sibs-tertiary-5">
                {isEdit ? "Edit" : "Submit"} your resignation request details
              </p>
            </div>

            <button
              type="button"
              // onClick={handleRetract}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-all duration-200 hover:border-green-300 hover:bg-green-100 hover:text-green-800 active:scale-[0.98]"
            >
              <Undo2 size={16} strokeWidth={2.2} />
              Retract
            </button>
          </div>

          <form
            onSubmit={isEdit ? handleSubmitUpdate : handleSubmit}
            className="flex-1 overflow-y-auto px-6 py-6"
          >
            {!isEdit && (
              <div className="mb-5">
                <Field label="Type of Resignation *">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setTypeOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-xl border border-[#D7DEE8] bg-white px-4 py-3 text-left text-sm outline-none transition focus:border-[var(--sibs-primary-1)]"
                    >
                      <span
                        className={
                          form.resignationType
                            ? "text-sibs-primary-1"
                            : "text-gray-400"
                        }
                      >
                        {form.resignationType || "Select type"}
                      </span>

                      <ChevronDown
                        size={18}
                        className={`text-sibs-tertiary-5 transition-transform ${
                          typeOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {typeOpen && (
                      <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-lg">
                        <div className="py-2">
                          {resignationTypes.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => handleTypeSelect(item)}
                              className={`block w-full px-4 py-3 text-left text-sm transition ${
                                form.resignationType === item
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
                </Field>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="Resignation Date *">
                <input
                  type="date"
                  name="resignationDate"
                  value={form.resignationDate}
                  readOnly
                  required
                  className="pointer-events-none w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-4 py-3 text-sm text-sibs-tertiary-5 outline-none"
                />
              </Field>

              <Field label="Last Working Date *">
                <input
                  type="date"
                  name="lastWorkingDate"
                  value={form.lastWorkingDate}
                  onChange={handleChange}
                  onClick={(e) => {
                    if (!isFormal && e.target.showPicker) e.target.showPicker();
                  }}
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
                  required
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                    isFormal
                      ? "pointer-events-none border-[#D7DEE8] bg-[#F8FAFC] text-sibs-tertiary-5"
                      : "border-[#D7DEE8] bg-white focus:border-[var(--sibs-primary-1)]"
                  }`}
                />
              </Field>
            </div>

            {isFormal && !isEdit && (
              <p className="mt-3 text-xs text-sibs-tertiary-5">
                For formal resignation, the last working date is automatically
                set to 30 days from today.
              </p>
            )}

            {isFormal && isEdit && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExtendOpen((prev) => !prev)}
                className="mt-5 rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-4 py-3 transition hover:border-sibs-tertiary-4 hover:bg-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-sibs-primary-1">
                      Extend Working Date
                    </p>

                    <p className="mt-0.5 text-xs text-sibs-tertiary-5">
                      Request to extend your current last working date
                    </p>
                  </div>

                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-sibs-primary-1 transition-transform duration-300 ${
                      extendOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    extendOpen
                      ? "grid-rows-[1fr] opacity-100 mt-3"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      extendOpen
                        ? "opacity-100 translate-y-0 mt-2"
                        : "opacity-0 -translate-y-2"
                    }`}
                  >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <Field label="Resignation Date *">
                        <input
                          type="date"
                          name="resignationDate"
                          value={form.resignationDate}
                          readOnly
                          required
                          className="pointer-events-none w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-4 py-3 text-sm text-sibs-tertiary-5 outline-none"
                        />
                      </Field>

                      <Field label="New Last Working Date *">
                        <input
                          type="date"
                          name="newLastWorkingDate"
                          value={newLastWorkingDate}
                          onChange={handleChange}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.target.showPicker?.();
                          }}
                          min={
                            originalLastWorkingDate
                              ? addDays(originalLastWorkingDate, 1)
                              : undefined
                          }
                          required
                          className="w-full rounded-xl border border-[#D7DEE8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--sibs-primary-1)]"
                        />
                      </Field>
                    </div>

                    <div className="mt-5" onClick={(e) => e.stopPropagation()}>
                      <Field label="Reason for Extending *">
                        <textarea
                          name="reasonForExtending"
                          value={reasonForExtending}
                          onChange={(e) =>
                            setReasonForExtending(e.target.value)
                          }
                          rows={3}
                          placeholder="Enter the reason for extending your last working date"
                          required
                          className="w-full resize-none rounded-xl border border-[#D7DEE8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--sibs-primary-1)]"
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isImmediate && (
              <p className="mt-3 text-xs text-sibs-tertiary-5">
                For immediate resignation, only dates within 1 to 29 days from
                today can be selected.
              </p>
            )}

            {!isEdit && (
              <div className="mt-5">
                <Field label="Reason *">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setReasonOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-xl border border-[#D7DEE8] bg-white px-4 py-3 text-left text-sm outline-none transition focus:border-[var(--sibs-primary-1)]"
                    >
                      <span
                        className={
                          form.reason ? "text-sibs-primary-1" : "text-gray-400"
                        }
                      >
                        {form.reason || "Select reason"}
                      </span>

                      <ChevronDown
                        size={18}
                        className={`text-sibs-tertiary-5 transition-transform ${
                          reasonOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {reasonOpen && (
                      <div className="absolute z-20 mt-2 max-h-60 w-full overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-lg">
                        <div className="max-h-60 overflow-y-auto py-2">
                          {resignationReasons.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => handleReasonSelect(item)}
                              className={`block w-full px-4 py-3 text-left text-sm transition ${
                                form.reason === item
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
                </Field>
              </div>
            )}

            {form.reason === "Other" && (
              <div className="mt-5">
                <Field label="Please specify *">
                  <textarea
                    name="otherReason"
                    value={form.otherReason}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Enter specific reason"
                    required
                    className="w-full resize-none rounded-xl border border-[#D7DEE8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--sibs-primary-1)]"
                  />
                </Field>
              </div>
            )}

            {isEdit && (
              <div className={`grid gap-4 mt-4 ${hierarchyGridClass}`}>
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
            )}

            {!isEdit && (
              <div className="mt-5">
                <Field label="Upload File *">
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#D7DEE8] bg-white px-4 py-3 text-sm transition hover:border-[var(--sibs-primary-1)] hover:bg-[#F8FAFC]">
                      <div className="flex min-w-0 items-center gap-3">
                        {selectedFileName ? (
                          <FileTypeIcon filename={selectedFileName} />
                        ) : (
                          <Paperclip
                            size={18}
                            className="shrink-0 text-sibs-tertiary-5"
                          />
                        )}

                        <span
                          className={`truncate text-sm ${
                            selectedFileName
                              ? "text-gray-700"
                              : "text-sibs-tertiary-5"
                          }`}
                        >
                          {selectedFileName || "Choose resignation file"}
                        </span>
                      </div>

                      <span className="ml-4 shrink-0 rounded-lg bg-[var(--sibs-tertiary-9)] px-3 py-1.5 text-xs font-medium text-sibs-primary-1">
                        Browse
                      </span>

                      <input
                        type="file"
                        name="uploadedFile"
                        onChange={handleChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.heic,image/heic,image/heif"
                        required
                      />
                    </label>

                    <p className="text-xs text-sibs-tertiary-5">
                      Accepted file types: .pdf, .doc, .docx, .jpg, .jpeg, .png,
                      .heic
                    </p>
                  </div>
                </Field>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#E6ECF2] pt-5">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-[#D7DEE8] px-4 py-2.5 text-sm font-medium text-sibs-tertiary-5 transition hover:bg-[var(--sibs-tertiary-9)]"
              >
                Cancel
              </button>

              {!isEdit ? (
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[var(--sibs-primary-1)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Resignation"}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[var(--sibs-primary-1)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Updating..." : "Update Resignation"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {policyModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-end px-5 pt-4">
              <button
                type="button"
                onClick={() => setPolicyModalOpen(false)}
                className="rounded-xl p-2 text-sibs-tertiary-5 transition hover:bg-[var(--sibs-tertiary-9)] hover:text-sibs-primary-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 pb-6 pt-1 text-center">
              <h2 className="mx-auto max-w-[320px] text-xl font-bold leading-tight text-sibs-primary-1">
                Important Notice Regarding Company Policy:
              </h2>

              <div className="mx-auto mt-4 max-w-[360px] space-y-3 text-sm leading-6 text-sibs-tertiary-5">
                <p>
                  As per company guidelines, all employees who intend to resign
                  are required to submit a written notice at least 30 calendar
                  days prior to their intended departure date. This allows us to
                  effectively transition your responsibilities and ensure a
                  smooth handover.
                </p>

                <p>
                  Are you sure you would like to proceed without providing the
                  full 30-day notice? Please consider whether adjusting your
                  resignation date to meet this requirement would be beneficial
                  for both you and the company.
                </p>
              </div>

              <label className="mt-6 flex items-center justify-center gap-2 text-sm text-sibs-tertiary-5">
                <input
                  type="checkbox"
                  checked={policyAccepted}
                  onChange={(e) => setPolicyAccepted(e.target.checked)}
                  className="h-4 w-4 rounded border-[#D0D5DD]"
                />
                <span>I understand and agree with the policy</span>
              </label>

              <button
                type="button"
                onClick={() => setPolicyModalOpen(false)}
                disabled={!policyAccepted}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* <StatusModal
        open={openRetractStatusModal}
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
      /> */}
    </>
  );
}

function Field({ label, children }) {
  return (
    <div>
      {label ? (
        <label className="mb-2 block text-sm font-medium text-sibs-primary-1">
          {label}
        </label>
      ) : null}

      {children}
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
    <div className="rounded-xl border border-[#E6ECF2] bg-[var(--sibs-tertiary-10)] p-4">
      <div className="mb-2 flex items-center gap-2">
        <UserRound size={16} className="text-sibs-primary-1" />
        <p className="text-sm font-semibold text-sibs-primary-1">{title}</p>
      </div>

      <p className="text-sm text-sibs-tertiary-5">
        {formatPerson(sibsId, fullName)}
      </p>

      <div className="mt-4 flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-sibs-primary-1">
          <input
            type="checkbox"
            checked={Number(isApproved) === 1}
            readOnly
            disabled
            className="h-4 w-4"
          />
          <span>Approved</span>
        </label>

        <label className="flex items-center gap-2 text-sm text-sibs-primary-1">
          <input
            type="checkbox"
            checked={Number(isDeclined) === 1}
            readOnly
            disabled
            className="h-4 w-4"
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
