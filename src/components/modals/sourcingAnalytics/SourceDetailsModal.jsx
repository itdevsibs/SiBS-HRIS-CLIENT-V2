import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Loader2,
  PencilLine,
  ReceiptText,
  Target,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useSourcingAnalytics } from "../../../services/context/SourcingContext";

const EMPTY_EDIT_FORM = {
  source: "",
  description: "",
  amount: "",
  dateFrom: "",
  dateTo: "",
};

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeDate(value) {
  const text = cleanText(value);

  if (!text) return "";

  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);

  return match?.[1] || text;
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  return amount.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCostPerHire(value, hired) {
  const cleanHired = Number(hired || 0);
  const cleanValue = Number(value);

  if (
    cleanHired <= 0 ||
    value === null ||
    value === undefined ||
    !Number.isFinite(cleanValue)
  ) {
    return "—";
  }

  return formatCurrency(cleanValue);
}

function formatDate(value) {
  const normalized = normalizeDate(value);

  if (!normalized) return "—";

  const parsed = new Date(`${normalized}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateRange(entry = {}) {
  const dateFrom =
    entry.dateFrom ||
    entry.date_from ||
    entry.dateSpent ||
    entry.date_spent;

  const dateTo =
    entry.dateTo ||
    entry.date_to ||
    entry.dateSpent ||
    entry.date_spent;

  const formattedFrom = formatDate(dateFrom);
  const formattedTo = formatDate(dateTo);

  if (
    formattedFrom === "—" &&
    formattedTo === "—"
  ) {
    return "—";
  }

  if (formattedFrom === formattedTo) {
    return formattedFrom;
  }

  return `${formattedFrom} – ${formattedTo}`;
}

function getStatusClasses(status) {
  switch (cleanText(status).toLowerCase()) {
    case "upcoming":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "ongoing":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function CompactMetric({
  label,
  value,
  icon,
  valueClassName = "text-sibs-primary-1",
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#E1E8F0] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-sibs-tertiary-5">
            {label}
          </p>

          <p
            className={`mt-2 break-words text-lg font-extrabold leading-tight sm:text-xl ${valueClassName}`}
            title={
              typeof value === "string"
                ? value
                : undefined
            }
          >
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2F6FA] text-sibs-primary-1">
          {icon}
        </div>
      </div>
    </div>
  );
}

function FunnelRow({
  label,
  value,
  max,
  helper,
}) {
  const safeValue = Number(value || 0);
  const safeMax = Number(max || 0);

  const percentage =
    safeMax > 0
      ? Math.round((safeValue / safeMax) * 100)
      : 0;

  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3.5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-[#344054]">
            {label}
          </p>

          {helper ? (
            <p className="mt-0.5 text-[11px] font-semibold text-sibs-tertiary-5">
              {helper}
            </p>
          ) : null}
        </div>

        <p className="shrink-0 text-sm font-extrabold text-sibs-primary-1">
          {safeValue}
        </p>
      </div>

      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-sibs-primary-1 transition-all duration-700 ease-out"
          style={{
            width: `${Math.min(
              Math.max(percentage, 0),
              100,
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

function InfoTile({
  label,
  value,
  icon,
}) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F2F6FA] text-sibs-primary-1">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-sibs-tertiary-5">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-extrabold text-[#344054]">
            {value || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

function FormLabel({
  children,
  required = false,
}) {
  return (
    <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
      {children}

      {required ? (
        <span className="ml-1 text-red-500">
          *
        </span>
      ) : null}
    </label>
  );
}

function ModalMessage({
  type = "error",
  children,
}) {
  if (!children) return null;

  const isSuccess = type === "success";

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {children}
    </div>
  );
}

function ExpenseCard({
  entry,
  mutating,
  onEdit,
  onRemove,
}) {
  return (
    <article className="rounded-xl border border-[#E1E8F0] bg-[#F8FAFC] p-4 transition hover:border-[#CCD8E5] hover:bg-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-extrabold leading-6 text-[#101828]">
            {entry.description || "—"}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sibs-tertiary-5">
              <CalendarRange size={14} />
              {formatDateRange(entry)}
            </span>

            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${getStatusClasses(
                entry.status,
              )}`}
            >
              {entry.status || "Unknown"}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
          <p className="text-base font-extrabold text-sibs-primary-1">
            {formatCurrency(entry.amount)}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(entry)}
              disabled={mutating || !entry?.id}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#D7DEE8] bg-white px-3 text-xs font-extrabold text-sibs-primary-1 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PencilLine size={14} />
              Edit
            </button>

            <button
              type="button"
              onClick={() => onRemove(entry)}
              disabled={mutating || !entry?.id}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={14} />
              Remove
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function SourceDetailsModal({
  open,
  source,
  onClose,
}) {
  const {
    sourceRows = [],
    updateSourceCostEntry,
    deleteSourceCostEntry,
    mutating,
  } = useSourcingAnalytics();

  const [editingEntry, setEditingEntry] =
    useState(null);

  const [removingEntry, setRemovingEntry] =
    useState(null);

  const [editForm, setEditForm] =
    useState(EMPTY_EDIT_FORM);

  const [actionError, setActionError] =
    useState("");

  const [actionMessage, setActionMessage] =
    useState("");

  const [isSaving, setIsSaving] =
    useState(false);

  const [isRemoving, setIsRemoving] =
    useState(false);

  const sourceName = cleanText(source?.source);

  const liveSource = useMemo(() => {
    if (!sourceName) return source;

    return (
      sourceRows.find(
        (row) =>
          cleanText(row?.source).toLowerCase() ===
          sourceName.toLowerCase(),
      ) || source
    );
  }, [
    sourceRows,
    source,
    sourceName,
  ]);

  const costEntries = useMemo(() => {
    return Array.isArray(liveSource?.costEntries)
      ? liveSource.costEntries
      : [];
  }, [liveSource]);

  useEffect(() => {
    if (!open) {
      setEditingEntry(null);
      setRemovingEntry(null);
      setEditForm(EMPTY_EDIT_FORM);
      setActionError("");
      setActionMessage("");
    }
  }, [open]);

  useEffect(() => {
    if (
      !open ||
      typeof document === "undefined"
    ) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  if (!open || !liveSource) {
    return null;
  }

  function clearMessages() {
    setActionError("");
    setActionMessage("");
  }

  function openEditModal(entry) {
    clearMessages();

    setEditingEntry(entry);

    setEditForm({
      source:
        cleanText(entry?.source) ||
        sourceName,

      description:
        cleanText(entry?.description),

      amount:
        entry?.amount === null ||
        entry?.amount === undefined
          ? ""
          : String(entry.amount),

      dateFrom: normalizeDate(
        entry?.dateFrom ||
          entry?.date_from ||
          entry?.dateSpent ||
          entry?.date_spent,
      ),

      dateTo: normalizeDate(
        entry?.dateTo ||
          entry?.date_to ||
          entry?.dateSpent ||
          entry?.date_spent,
      ),
    });
  }

  function closeEditModal() {
    if (isSaving || mutating) return;

    setEditingEntry(null);
    setEditForm(EMPTY_EDIT_FORM);
    setActionError("");
  }

  function updateEditField(key, value) {
    setEditForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function validateEditForm() {
    if (!cleanText(editForm.source)) {
      return "Sourcing option is required.";
    }

    if (!cleanText(editForm.description)) {
      return "Description is required.";
    }

    const amount = Number(
      String(editForm.amount || "")
        .replace(/,/g, "")
        .replace(/[₱\s]/g, ""),
    );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return "Amount must be greater than zero.";
    }

    if (!editForm.dateFrom) {
      return "Date From is required.";
    }

    if (!editForm.dateTo) {
      return "Date To is required.";
    }

    if (
      editForm.dateTo <
      editForm.dateFrom
    ) {
      return "Date To cannot be earlier than Date From.";
    }

    return "";
  }

  async function handleSaveEdit(event) {
    event.preventDefault();

    const validationError =
      validateEditForm();

    if (validationError) {
      setActionError(validationError);
      return;
    }

    if (!editingEntry?.id) {
      setActionError(
        "This cost entry has no database ID and cannot be edited.",
      );
      return;
    }

    setIsSaving(true);
    setActionError("");
    setActionMessage("");

    try {
      await updateSourceCostEntry(
        editingEntry.id,
        {
          source: sourceName,

          description: cleanText(
            editForm.description,
          ),

          amount: Number(
            String(editForm.amount)
              .replace(/,/g, "")
              .replace(/[₱\s]/g, ""),
          ),

          dateFrom: editForm.dateFrom,
          dateTo: editForm.dateTo,
        },
      );

      setEditingEntry(null);
      setEditForm(EMPTY_EDIT_FORM);

      setActionMessage(
        "Source cost entry updated successfully.",
      );
    } catch (error) {
      setActionError(
        error?.message ||
          "Failed to update the source cost entry.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function openRemoveModal(entry) {
    clearMessages();
    setRemovingEntry(entry);
  }

  function closeRemoveModal() {
    if (isRemoving || mutating) return;

    setRemovingEntry(null);
    setActionError("");
  }

  async function handleRemoveEntry() {
    if (!removingEntry?.id) {
      setActionError(
        "This cost entry has no database ID and cannot be removed.",
      );
      return;
    }

    setIsRemoving(true);
    setActionError("");
    setActionMessage("");

    try {
      await deleteSourceCostEntry(
        removingEntry.id,
      );

      setRemovingEntry(null);

      setActionMessage(
        "Source cost entry removed successfully.",
      );
    } catch (error) {
      setActionError(
        error?.message ||
          "Failed to remove the source cost entry.",
      );
    } finally {
      setIsRemoving(false);
    }
  }

  const displayCostPerHire =
    formatCostPerHire(
      liveSource.costPerHire,
      liveSource.hired,
    );

  const conversionDisplay =
    `${Number(
      liveSource.conversionRate || 0,
    ).toFixed(1)}%`;

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/45 px-3 py-3 backdrop-blur-[1px] sm:px-5 sm:py-5"
        onClick={onClose}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="source-performance-title"
          onClick={(event) =>
            event.stopPropagation()
          }
          className="flex max-h-[94dvh] w-full max-w-[1280px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E6ECF2] bg-white px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <h2
                id="source-performance-title"
                className="text-lg font-extrabold text-sibs-primary-1 sm:text-xl"
              >
                Source Performance Details
              </h2>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-sibs-tertiary-5">
                  {liveSource.source || "—"}
                </p>

                <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">
                  {costEntries.length}{" "}
                  {costEntries.length === 1
                    ? "Cost Entry"
                    : "Cost Entries"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close source performance modal"
            >
              <X size={20} />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto bg-[#F6F8FB] p-4 sm:p-5">
            <div className="mx-auto max-w-[1220px]">
              <div className="mb-4 space-y-3">
                <ModalMessage type="success">
                  {actionMessage}
                </ModalMessage>

                {!editingEntry &&
                !removingEntry ? (
                  <ModalMessage>
                    {actionError}
                  </ModalMessage>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                <CompactMetric
                  label="Applicants"
                  value={Number(
                    liveSource.volume || 0,
                  )}
                  icon={<UsersRound size={19} />}
                />

                <CompactMetric
                  label="Hired"
                  value={Number(
                    liveSource.hired || 0,
                  )}
                  valueClassName="text-emerald-600"
                  icon={
                    <CheckCircle2 size={19} />
                  }
                />

                <CompactMetric
                  label="Conversion"
                  value={conversionDisplay}
                  icon={<Activity size={19} />}
                />

                <CompactMetric
                  label="Total Source Cost"
                  value={formatCurrency(
                    liveSource.sourceCost,
                  )}
                  icon={<ReceiptText size={19} />}
                />

                <div className="col-span-2 md:col-span-1">
                  <CompactMetric
                    label="Cost per Hire"
                    value={displayCostPerHire}
                    valueClassName="text-sibs-primary-1"
                    icon={<Target size={19} />}
                  />
                </div>
              </div>

              <div className="mt-4 grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
                <section className="rounded-2xl border border-[#E1E8F0] bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-[#101828]">
                        Source Funnel
                      </h3>

                      <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                        Candidate progress for this
                        sourcing option.
                      </p>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2F6FA] text-sibs-primary-1">
                      <Activity size={19} />
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <FunnelRow
                      label="Candidate Volume"
                      value={liveSource.volume}
                      max={liveSource.volume}
                      helper="All public applicants"
                    />

                    <FunnelRow
                      label="Screened"
                      value={liveSource.screened}
                      max={liveSource.volume}
                    />

                    <FunnelRow
                      label="Interviewed"
                      value={
                        liveSource.interviewed
                      }
                      max={liveSource.volume}
                    />

                    <FunnelRow
                      label="Offered"
                      value={liveSource.offered}
                      max={liveSource.volume}
                    />

                    <FunnelRow
                      label="Hired"
                      value={liveSource.hired}
                      max={liveSource.volume}
                      helper="Currently Hired / Active"
                    />
                  </div>
                </section>

                <div className="min-w-0 space-y-4">
                  <section className="flex min-h-[300px] flex-col rounded-2xl border border-[#E1E8F0] bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-[#101828]">
                          Source Cost Entries
                        </h3>

                        <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                          Edit or remove recorded
                          expenses.
                        </p>
                      </div>

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2F6FA] text-sibs-primary-1">
                        <CalendarRange size={19} />
                      </div>
                    </div>

                    <div className="mt-4 max-h-[340px] min-h-0 space-y-3 overflow-y-auto pr-1 sibs-scrollbar xl:flex-1">
                      {costEntries.length > 0 ? (
                        costEntries.map((entry) => (
                          <ExpenseCard
                            key={
                              entry.id ||
                              `${entry.description}-${entry.dateFrom}-${entry.amount}`
                            }
                            entry={entry}
                            mutating={mutating}
                            onEdit={openEditModal}
                            onRemove={
                              openRemoveModal
                            }
                          />
                        ))
                      ) : (
                        <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-[#D7DEE8] bg-[#F8FAFC] px-5 text-center">
                          <div>
                            <ReceiptText
                              size={24}
                              className="mx-auto text-sibs-tertiary-5"
                            />

                            <p className="mt-3 text-sm font-extrabold text-[#344054]">
                              No cost entries yet
                            </p>

                            <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                              Add a source cost from
                              the Sourcing Analytics
                              page.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InfoTile
                      label="Latest Applicant"
                      value={
                        liveSource.latestCandidate ||
                        "—"
                      }
                      icon={<UserRound size={18} />}
                    />

                    <InfoTile
                      label="Last Activity"
                      value={formatDate(
                        liveSource.lastActivity,
                      )}
                      icon={<Clock3 size={18} />}
                    />
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sibs-primary-1">
                        <Target size={18} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-extrabold text-sibs-primary-1">
                          Cost per Hire Rule
                        </h3>

                        <p className="mt-1.5 text-xs font-semibold leading-5 text-sibs-primary-1/80">
                          Total source cost divided by
                          candidates currently tagged
                          as Hired / Active for the same
                          source.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer className="flex shrink-0 items-center justify-end border-t border-[#E6ECF2] bg-white px-5 py-3.5 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white transition hover:opacity-90"
            >
              Close
            </button>
          </footer>
        </section>
      </div>

      {editingEntry ? (
        <div
          className="fixed inset-0 z-[10000] flex h-dvh items-end justify-center bg-black/55 px-3 pb-3 pt-8 backdrop-blur-[1px] sm:items-center sm:px-4 sm:py-6"
          onClick={closeEditModal}
        >
          <form
            onSubmit={handleSaveEdit}
            onClick={(event) =>
              event.stopPropagation()
            }
            className="flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] px-5 py-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-sibs-tertiary-5">
                  Source Cost Entry
                </p>

                <h3 className="mt-1 text-lg font-extrabold text-[#101828]">
                  Edit Expense
                </h3>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={isSaving || mutating}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                aria-label="Close edit expense modal"
              >
                <X size={19} />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto bg-[#F8FAFC] px-5 py-5">
              <ModalMessage>
                {actionError}
              </ModalMessage>

              <div>
                <FormLabel>
                  Sourcing Option
                </FormLabel>

                <div className="flex min-h-11 w-full items-center rounded-xl border border-[#D7DEE8] bg-[#F3F6F9] px-3 text-sm font-semibold text-[#344054]">
                  {editForm.source ||
                    sourceName ||
                    "—"}
                </div>

                <p className="mt-1.5 text-xs font-medium text-sibs-tertiary-5">
                  The sourcing option is fixed for
                  this expense and cannot be changed.
                </p>
              </div>

              <div>
                <FormLabel required>
                  Description
                </FormLabel>

                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(event) =>
                    updateEditField(
                      "description",
                      event.target.value,
                    )
                  }
                  disabled={isSaving || mutating}
                  className="w-full resize-none rounded-xl border border-[#D7DEE8] bg-white px-3 py-3 text-sm font-semibold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-gray-100"
                  placeholder="Enter expense description"
                />
              </div>

              <div>
                <FormLabel required>
                  Amount
                </FormLabel>

                <div className="flex h-11 overflow-hidden rounded-xl border border-[#D7DEE8] bg-white focus-within:border-sibs-primary-1 focus-within:ring-4 focus-within:ring-sibs-primary-1/10">
                  <span className="flex items-center border-r border-[#E6ECF2] bg-[#F8FAFC] px-3 text-sm font-extrabold text-sibs-primary-1">
                    ₱
                  </span>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={editForm.amount}
                    onChange={(event) =>
                      updateEditField(
                        "amount",
                        event.target.value,
                      )
                    }
                    disabled={isSaving || mutating}
                    className="min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold text-[#344054] outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FormLabel required>
                    Date From
                  </FormLabel>

                  <input
                    type="date"
                    value={editForm.dateFrom}
                    onChange={(event) => {
                      const nextDateFrom =
                        event.target.value;

                      setEditForm((current) => ({
                        ...current,

                        dateFrom:
                          nextDateFrom,

                        dateTo:
                          current.dateTo &&
                          current.dateTo <
                            nextDateFrom
                            ? nextDateFrom
                            : current.dateTo,
                      }));
                    }}
                    disabled={isSaving || mutating}
                    className="h-11 w-full rounded-xl border border-[#D7DEE8] bg-white px-3 text-sm font-semibold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <FormLabel required>
                    Date To
                  </FormLabel>

                  <input
                    type="date"
                    value={editForm.dateTo}
                    min={
                      editForm.dateFrom ||
                      undefined
                    }
                    onChange={(event) =>
                      updateEditField(
                        "dateTo",
                        event.target.value,
                      )
                    }
                    disabled={isSaving || mutating}
                    className="h-11 w-full rounded-xl border border-[#D7DEE8] bg-white px-3 text-sm font-semibold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-[#E6ECF2] bg-white px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={isSaving || mutating}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#D7DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving || mutating}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving || mutating ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <PencilLine size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {removingEntry ? (
        <div
          className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-[1px]"
          onClick={closeRemoveModal}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remove-cost-entry-title"
            onClick={(event) =>
              event.stopPropagation()
            }
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="px-5 pb-4 pt-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <AlertTriangle size={22} />
                </div>

                <div className="min-w-0">
                  <h3
                    id="remove-cost-entry-title"
                    className="text-lg font-extrabold text-[#101828]"
                  >
                    Remove Source Cost?
                  </h3>

                  <p className="mt-2 text-sm font-medium leading-6 text-sibs-tertiary-5">
                    This expense will be removed
                    from the analytics totals. The
                    database record remains for
                    audit history.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                <p className="break-words text-sm font-extrabold text-[#101828]">
                  {removingEntry.description ||
                    "—"}
                </p>

                <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                  {formatDateRange(
                    removingEntry,
                  )}
                </p>

                <p className="mt-2 text-base font-extrabold text-sibs-primary-1">
                  {formatCurrency(
                    removingEntry.amount,
                  )}
                </p>
              </div>

              <div className="mt-4">
                <ModalMessage>
                  {actionError}
                </ModalMessage>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-[#E6ECF2] bg-[#F8FAFC] px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeRemoveModal}
                disabled={
                  isRemoving || mutating
                }
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#D7DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRemoveEntry}
                disabled={
                  isRemoving || mutating
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-extrabold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRemoving || mutating ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Remove Expense
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
